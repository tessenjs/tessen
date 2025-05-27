import { Tessen, TessenClient } from "$lib/Tessen";
import { TessenClientEventMap } from "$types/ClientEvents";
import { ContentValue } from "$lib/Locale";
import { Guild, User } from "discord.js";

// Helper to extract guild, user, and interaction from event context
function extractContextInfo(eventName: string, args: any[]): { guild: Guild | null, user: User | null, interaction: any | null } {
  const eventParams = TessenClientEventMap[eventName as keyof typeof TessenClientEventMap];
  if (!eventParams) return { guild: null, user: null, interaction: null };

  let guild: Guild | null = null;
  let user: User | null = null;
  let interaction: any | null = null;

  // Map the args to their parameter names and extract guild/user/interaction
  const context = Object.fromEntries(
    eventParams.map((param, index) => [param, args[index]])
  );

  // Extract interaction first
  if (context.interaction) {
    interaction = context.interaction;
  }

  // Try to extract guild from common patterns
  if (context.guild) {
    guild = context.guild;
  } else if (context.member?.guild) {
    guild = context.member.guild;
  } else if (context.message?.guild) {
    guild = context.message.guild;
  } else if (interaction?.guild) {
    guild = interaction.guild;
  }

  // Try to extract user from common patterns
  if (context.user) {
    user = context.user;
  } else if (context.member?.user) {
    user = context.member.user;
  } else if (context.message?.author) {
    user = context.message.author;
  } else if (interaction?.user) {
    user = interaction.user;
  }

  return { guild, user, interaction };
}

// Helper function to create localization objects for events
function createEventLocalizationObjects<TessenId extends string>(
  tessenId: TessenId,
  tessen: Tessen,
  guild: Guild | null,
  interaction: any | null
) {
  const defaultLocalization = tessen.locales.content.get('en') || {} as ContentValue;
  const guildLocale = guild?.preferredLocale?.split('-')[0] || 'en';
  const userLocale = interaction?.locale?.split('-')[0] || guildLocale;
  
  const guildLocalization = tessen.locales.content.get(guildLocale) || defaultLocalization;
  const userLocalization = tessen.locales.content.get(userLocale) || defaultLocalization;

  return {
    locale: {
      guild: guildLocalization,
      user: userLocalization
    }
  };
}

export async function handleEvent(
  tessen: Tessen,
  client: TessenClient,
  eventName: keyof typeof TessenClientEventMap,
  args: any[]
) {
  try {
    const eventParams = TessenClientEventMap[eventName];
    if (!eventParams) return;

    // Create event context object
    const context = Object.fromEntries(
      eventParams.map((param, index) => [param, args[index]])
    );

    // Extract guild, user, and interaction for localization
    const { guild, user, interaction } = extractContextInfo(eventName, args);

    // Add localization objects to context
    const localizationObjects = createEventLocalizationObjects(
      tessen.id,
      tessen,
      guild,
      interaction
    );

    const enhancedContext = {
      ...context,
      ...localizationObjects
    };

    // Handle registered events
    for (const [key, cachedEvent] of tessen.cache.events) {
      const eventData = cachedEvent.data;
      
      if (eventData.event === eventName) {
        await eventData.handle(enhancedContext);
      }
    }

    // Emit to pack event emitters
    tessen.events.emit(eventName, enhancedContext);
    
  } catch (error) {
    tessen.events.emit('tessen:eventHandlerError', {
      error,
      eventName,
      args,
      client
    });
  }
}
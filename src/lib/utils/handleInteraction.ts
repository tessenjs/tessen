import { Tessen, TessenClient } from "$lib/Tessen";
import { Interaction as DiscordInteraction, Guild, User } from "discord.js";
import { ContentValue } from "$lib/Locale";
import { ChatInputInteractionWrapper, ButtonInteractionWrapper, SelectMenuInteractionWrapper, ModalInteractionWrapper, UserContextMenuInteractionWrapper, MessageContextMenuInteractionWrapper } from "$types/Interactions";

// Helper function to create localization methods
function createLocalizationMethods<TessenId extends string>(
  tessenId: TessenId,
  tessen: Tessen,
  guild: Guild | null,
  interaction: DiscordInteraction
) {
  const getLocalization = () => {
    // Check if tessenId exists in generated localization
    const generated = tessen.locales.content.get('en') as any; // Default to 'en'
    if (generated && generated[tessenId]) {
      return generated[tessenId];
    }
    // Fallback to ContentValue interface
    return tessen.locales.content.get('en') || {} as ContentValue;
  };

  const getGuildLocalization = (targetGuild: Guild | null) => {
    const guildLocale = targetGuild?.preferredLocale?.split('-')[0] || 'en';
    const localeData = tessen.locales.content.get(guildLocale) || tessen.locales.content.get('en');
    
    if (localeData && (localeData as any)[tessenId]) {
      return (localeData as any)[tessenId];
    }
    return localeData || {} as ContentValue;
  };

  const getUserLocalization = (targetUser: User) => {
    const userLocale = interaction.locale?.split('-')[0] || 'en';
    const localeData = tessen.locales.content.get(userLocale) || tessen.locales.content.get('en');
    
    if (localeData && (localeData as any)[tessenId]) {
      return (localeData as any)[tessenId];
    }
    return localeData || {} as ContentValue;
  };

  return {
    getLocalization,
    getGuildLocalization,
    getUserLocalization
  };
}

// Helper function to create localization objects for interactions
function createInteractionLocalizationObjects<TessenId extends string>(
  tessenId: TessenId,
  tessen: Tessen,
  guild: Guild | null,
  interaction: any
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

export async function handleInteraction(
  tessen: Tessen,
  client: TessenClient,
  interaction: DiscordInteraction
) {
  try {
    if (interaction.isChatInputCommand()) {
      await handleChatInputCommand(tessen, client, interaction);
    } else if (interaction.isUserContextMenuCommand()) {
      await handleUserContextMenuCommand(tessen, client, interaction);
    } else if (interaction.isMessageContextMenuCommand()) {
      await handleMessageContextMenuCommand(tessen, client, interaction);
    } else if (interaction.isButton()) {
      await handleButtonInteraction(tessen, client, interaction);
    } else if (interaction.isAnySelectMenu()) {
      await handleSelectMenuInteraction(tessen, client, interaction);
    } else if (interaction.isModalSubmit()) {
      await handleModalSubmitInteraction(tessen, client, interaction);
    }
  } catch (error) {
    tessen.events.emit('tessen:interactionHandlerError', {
      error,
      interaction,
      client
    });
  }
}

async function handleChatInputCommand(
  tessen: Tessen,
  client: TessenClient,
  interaction: ChatInputInteractionWrapper['interaction']
) {
  const commandName = interaction.commandName;
  const subcommand = interaction.options.getSubcommand(false);
  const subcommandGroup = interaction.options.getSubcommandGroup(false);
  
  // Build full command name
  let fullCommandName = commandName;
  if (subcommandGroup) fullCommandName += ` ${subcommandGroup}`;
  if (subcommand) fullCommandName += ` ${subcommand}`;

  const localizationMethods = createLocalizationMethods(
    tessen.id,
    tessen,
    interaction.guild,
    interaction
  );

  const localizationObjects = createInteractionLocalizationObjects(
    tessen.id,
    tessen,
    interaction.guild,
    interaction
  );

  const wrapper: ChatInputInteractionWrapper = {
    type: 'chatInput',
    interaction,
    commandName: fullCommandName,
    ...localizationMethods,
    ...localizationObjects
  };

  // Check cached interactions for slash commands
  for (const [key, cachedInteraction] of tessen.cache.interactions) {
    const interactionData = cachedInteraction.data;
    
    // Check if it's a slash command with matching name combinations
    if (interactionData.nameCombinations?.includes(fullCommandName) && 
        (!interactionData.type || interactionData.type === 'CHAT_INPUT')) {
      await interactionData.handle(wrapper);
      return;
    }
  }

  // Check inspectors for chat input patterns
  for (const [key, cachedInspector] of tessen.cache.inspectors) {
    const inspector = cachedInspector.data;
    const result = await inspector.emit({
      type: 'chatInput',
      id: fullCommandName,
      ctx: wrapper
    });
    if (result !== undefined) return;
  }
}

async function handleUserContextMenuCommand(
  tessen: Tessen,
  client: TessenClient,
  interaction: UserContextMenuInteractionWrapper['interaction']
) {
  const commandName = interaction.commandName;

  const localizationMethods = createLocalizationMethods(
    tessen.id,
    tessen,
    interaction.guild,
    interaction
  );

  const localizationObjects = createInteractionLocalizationObjects(
    tessen.id,
    tessen,
    interaction.guild,
    interaction
  );

  const wrapper: UserContextMenuInteractionWrapper = {
    type: 'userContextMenu',
    interaction,
    commandName,
    ...localizationMethods,
    ...localizationObjects
  };

  // Check cached interactions for user context menu commands
  for (const [key, cachedInteraction] of tessen.cache.interactions) {
    const interactionData = cachedInteraction.data;
    
    if (interactionData.type === 'USER' && interactionData.name === commandName) {
      await interactionData.handle(wrapper);
      return;
    }
  }

  // Check inspectors for user context menu handlers
  for (const [key, cachedInspector] of tessen.cache.inspectors) {
    const inspector = cachedInspector.data;
    const result = await inspector.emit({
      type: 'userContextMenu',
      id: commandName,
      ctx: wrapper
    });
    if (result !== undefined) return;
  }
}

async function handleMessageContextMenuCommand(
  tessen: Tessen,
  client: TessenClient,
  interaction: MessageContextMenuInteractionWrapper['interaction']
) {
  const commandName = interaction.commandName;

  const localizationMethods = createLocalizationMethods(
    tessen.id,
    tessen,
    interaction.guild,
    interaction
  );

  const localizationObjects = createInteractionLocalizationObjects(
    tessen.id,
    tessen,
    interaction.guild,
    interaction
  );

  const wrapper: MessageContextMenuInteractionWrapper = {
    type: 'messageContextMenu',
    interaction,
    commandName,
    ...localizationMethods,
    ...localizationObjects
  };

  // Check cached interactions for message context menu commands
  for (const [key, cachedInteraction] of tessen.cache.interactions) {
    const interactionData = cachedInteraction.data;
    
    if (interactionData.type === 'MESSAGE' && interactionData.name === commandName) {
      await interactionData.handle(wrapper);
      return;
    }
  }

  // Check inspectors for message context menu handlers
  for (const [key, cachedInspector] of tessen.cache.inspectors) {
    const inspector = cachedInspector.data;
    const result = await inspector.emit({
      type: 'messageContextMenu',
      id: commandName,
      ctx: wrapper
    });
    if (result !== undefined) return;
  }
}

async function handleButtonInteraction(
  tessen: Tessen,
  client: TessenClient,
  interaction: ButtonInteractionWrapper['interaction']
) {
  const localizationMethods = createLocalizationMethods(
    tessen.id,
    tessen,
    interaction.guild,
    interaction
  );

  const localizationObjects = createInteractionLocalizationObjects(
    tessen.id,
    tessen,
    interaction.guild,
    interaction
  );

  const wrapper: ButtonInteractionWrapper = {
    type: 'button',
    interaction,
    customId: interaction.customId,
    ...localizationMethods,
    ...localizationObjects
  };

  // Check cached interactions for button handlers registered via Pack
  for (const [key, cachedInteraction] of tessen.cache.interactions) {
    const interactionData = cachedInteraction.data;
    
    if (interactionData.type === 'BUTTON' && interactionData.id === interaction.customId) {
      await interactionData.handle(wrapper);
      return;
    }
  }

  // Check inspectors for button handlers
  for (const [key, cachedInspector] of tessen.cache.inspectors) {
    const inspector = cachedInspector.data;
    const result = await inspector.emit({
      type: 'button',
      id: interaction.customId,
      ctx: wrapper
    });
    if (result !== undefined) return;
  }
}

async function handleSelectMenuInteraction(
  tessen: Tessen,
  client: TessenClient,
  interaction: SelectMenuInteractionWrapper['interaction']
) {
  const localizationMethods = createLocalizationMethods(
    tessen.id,
    tessen,
    interaction.guild,
    interaction
  );

  const localizationObjects = createInteractionLocalizationObjects(
    tessen.id,
    tessen,
    interaction.guild,
    interaction
  );

  const wrapper: SelectMenuInteractionWrapper = {
    type: 'selectMenu',
    interaction,
    customId: interaction.customId,
    ...localizationMethods,
    ...localizationObjects
  };

  // Check cached interactions for select menu handlers registered via Pack
  for (const [key, cachedInteraction] of tessen.cache.interactions) {
    const interactionData = cachedInteraction.data;
    
    if (interactionData.type === 'SELECT_MENU' && interactionData.id === interaction.customId) {
      await interactionData.handle(wrapper);
      return;
    }
  }

  // Check inspectors for select menu handlers
  for (const [key, cachedInspector] of tessen.cache.inspectors) {
    const inspector = cachedInspector.data;
    const result = await inspector.emit({
      type: 'selectMenu',
      id: interaction.customId,
      ctx: wrapper
    });
    if (result !== undefined) return;
  }
}

async function handleModalSubmitInteraction(
  tessen: Tessen,
  client: TessenClient,
  interaction: ModalInteractionWrapper['interaction']
) {
  const localizationMethods = createLocalizationMethods(
    tessen.id,
    tessen,
    interaction.guild,
    interaction
  );

  const localizationObjects = createInteractionLocalizationObjects(
    tessen.id,
    tessen,
    interaction.guild,
    interaction
  );

  const wrapper: ModalInteractionWrapper = {
    type: 'modal',
    interaction,
    customId: interaction.customId,
    ...localizationMethods,
    ...localizationObjects
  };

  // Check cached interactions for modal handlers registered via Pack
  for (const [key, cachedInteraction] of tessen.cache.interactions) {
    const interactionData = cachedInteraction.data;
    
    if (interactionData.type === 'MODAL' && interactionData.id === interaction.customId) {
      await interactionData.handle(wrapper);
      return;
    }
  }

  // Check inspectors for modal handlers
  for (const [key, cachedInspector] of tessen.cache.inspectors) {
    const inspector = cachedInspector.data;
    const result = await inspector.emit({
      type: 'modal',
      id: interaction.customId,
      ctx: wrapper
    });
    if (result !== undefined) return;
  }
}
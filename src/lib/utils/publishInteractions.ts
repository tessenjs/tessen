import { Tessen, TessenClient } from "$lib/Tessen";
import { 
  ApplicationCommandType, 
  ApplicationCommandOptionType, 
  ChannelType, 
  InteractionContextType, 
  PermissionFlags,
  ApplicationCommandDataResolvable,
  ApplicationCommandOptionData,
  PermissionResolvable
} from "discord.js";
import { SlashCommand, SlashCommandOption } from "$types/SlashCommand";
import { UserContextMenuCommand, MessageContextMenuCommand } from "$types/Interactions";
import { InteractionLocaleData, CommandInteractionLocale } from "$lib/Locale";

export const DISCORD_LOCALES = ["id", "da", "de", "en-GB", "en-US", "es-ES", "es-419", "fr", "hr", "it", "lt", "hu", "nl", "no", "pl", "pt-BR", "ro", "fi", "sv-SE", "vi", "tr", "cs", "el", "bg", "ru", "uk", "hi", "th", "zh-CN", "ja", "zh-TW", "ko"] as const;

// Valid channel types for application commands
const VALID_COMMAND_CHANNEL_TYPES = [
  ChannelType.GuildText,
  ChannelType.GuildVoice,
  ChannelType.GuildCategory,
  ChannelType.GuildAnnouncement,
  ChannelType.AnnouncementThread,
  ChannelType.PublicThread,
  ChannelType.PrivateThread,
  ChannelType.GuildStageVoice,
  ChannelType.GuildForum,
  ChannelType.GuildMedia
] as const;

type ValidCommandChannelType = typeof VALID_COMMAND_CHANNEL_TYPES[number];

// Convert channel type strings to Discord.js enum values
function convertChannelTypes(channelTypes?: (keyof typeof ChannelType)[]): readonly ValidCommandChannelType[] | undefined {
  if (!channelTypes) return undefined;
  
  const validTypes = channelTypes
    .map(type => ChannelType[type])
    .filter((type): type is ValidCommandChannelType => 
      VALID_COMMAND_CHANNEL_TYPES.includes(type as ValidCommandChannelType)
    );
  
  return validTypes.length > 0 ? validTypes as readonly ValidCommandChannelType[] : undefined;
}

// Convert context types to Discord.js enum values
function convertContextTypes(contexts?: (keyof typeof InteractionContextType)[]): InteractionContextType[] | undefined {
  if (!contexts) return undefined;
  return contexts.map(context => InteractionContextType[context]).filter(Boolean);
}

// Convert permission flags to Discord.js format
function convertPermissions(permissions?: (keyof PermissionFlags)[]): PermissionResolvable | null | undefined {
  if (!permissions || permissions.length === 0) return null;
  return permissions;
}

// Type for our command structure that matches Discord API expectations
interface TessenApplicationCommand {
  name: string;
  type: ApplicationCommandType.ChatInput;
  description: string;
  options?: ApplicationCommandOptionData[];
  defaultMemberPermissions?: PermissionResolvable | null;
  contexts?: InteractionContextType[];
  nsfw?: boolean;
}

// Helper function to create properly typed command option
function createCommandOption(optionName: string, option: SlashCommandOption): ApplicationCommandOptionData {
  const baseOption = {
    name: optionName,
    description: option.description,
    required: option.required || false
  };

  switch (option.type) {
    case 'String':
      return {
        ...baseOption,
        type: ApplicationCommandOptionType.String,
        ...(option.minLength !== undefined && { minLength: option.minLength }),
        ...(option.maxLength !== undefined && { maxLength: option.maxLength }),
        ...(option.choices && { 
          choices: Object.entries(option.choices).map(([key, name]) => ({
            name: String(name),
            value: String(key) // Key is the value in Tessen
          }))
        }),
        ...(option.autoComplete && { autocomplete: true })
      };
    
    case 'Integer':
      return {
        ...baseOption,
        type: ApplicationCommandOptionType.Integer,
        ...(option.minValue !== undefined && { minValue: option.minValue }),
        ...(option.maxValue !== undefined && { maxValue: option.maxValue }),
        ...(option.choices && { 
          choices: Object.entries(option.choices).map(([key, name]) => ({
            name: String(name),
            value: Number(key) // Key is the value in Tessen
          }))
        }),
        ...(option.autoComplete && { autocomplete: true })
      };
    
    case 'Number':
      return {
        ...baseOption,
        type: ApplicationCommandOptionType.Number,
        ...(option.minValue !== undefined && { minValue: option.minValue }),
        ...(option.maxValue !== undefined && { maxValue: option.maxValue }),
        ...(option.choices && { 
          choices: Object.entries(option.choices).map(([key, name]) => ({
            name: String(name),
            value: Number(key) // Key is the value in Tessen
          }))
        }),
        ...(option.autoComplete && { autocomplete: true })
      };
    
    case 'Boolean':
      return {
        ...baseOption,
        type: ApplicationCommandOptionType.Boolean
      };
    
    case 'User':
      return {
        ...baseOption,
        type: ApplicationCommandOptionType.User
      };
    
    case 'Channel':
      return {
        ...baseOption,
        type: ApplicationCommandOptionType.Channel,
        ...(option.channelTypes && { channelTypes: convertChannelTypes(option.channelTypes) })
      };
    
    case 'Role':
      return {
        ...baseOption,
        type: ApplicationCommandOptionType.Role
      };
    
    case 'Mentionable':
      return {
        ...baseOption,
        type: ApplicationCommandOptionType.Mentionable
      };
    
    case 'Attachment':
      return {
        ...baseOption,
        type: ApplicationCommandOptionType.Attachment
      };
    
    default:
      // Exhaustive check to ensure we handle all cases
      const _exhaustiveCheck: never = option;
      return {
        ...baseOption,
        type: ApplicationCommandOptionType.String
      };
  }
}

// Helper function to get Discord locales from our internal format
function getDiscordLocales(internalLocale: string): string[] {
  // Find all Discord locales that start with our internal locale
  return DISCORD_LOCALES.filter(discordLocale => 
    discordLocale.startsWith(internalLocale + '-') || discordLocale === internalLocale
  );
}

// Helper function to get localized data for interactions
function getLocalizedInteractionData(
  tessen: Tessen,
  interactionId: string,
  locale: string
): CommandInteractionLocale | undefined {
  const interactionLocales = tessen.locales.interaction.get(locale);
  if (!interactionLocales) return undefined;
  
  // Look for the interaction by ID and ensure proper typing
  const data = interactionLocales[interactionId];
  if (!data || typeof data !== 'object') return undefined;
  
  // Type guard to ensure it's a CommandInteractionLocale
  if ('name' in data || 'names' in data || 'description' in data || 'options' in data) {
    return data as CommandInteractionLocale;
  }
  
  return undefined;
}

// Helper function to get localized name for a specific command combination
function getLocalizedCommandName(
  tessen: Tessen,
  interactionId: string,
  commandName: string,
  locale: string
): string | undefined {
  const localizedData = getLocalizedInteractionData(tessen, interactionId, locale);
  if (!localizedData) return undefined;
  
  // Check if there are multiple name patterns (names property)
  if (localizedData.names && typeof localizedData.names === 'object') {
    return localizedData.names[commandName];
  }
  
  // Fallback to single name property
  return localizedData.name;
}

// Helper function to localize command names and descriptions
function localizeCommand(
  tessen: Tessen,
  command: TessenApplicationCommand,
  interactionId: string,
  commandName: string
): Record<string, { name?: string; description?: string }> {
  const localizations: Record<string, { name?: string; description?: string }> = {};
  
  // Process each available locale
  for (const [locale, _] of tessen.locales.interaction) {
    
    const localizedData = getLocalizedInteractionData(tessen, interactionId, locale);
    if (localizedData) {
      const discordLocales = getDiscordLocales(locale);
      
      // Apply the same localization to all Discord locales for this language
      for (const discordLocale of discordLocales) {
        if (!localizations[discordLocale]) {
          localizations[discordLocale] = {};
        }
        
        // For slash commands, try to get the localized name for this specific command combination
        const localizedName = getLocalizedCommandName(tessen, interactionId, commandName, locale);
        if (localizedName) {
          localizations[discordLocale].name = localizedName;
        }
        
        if (localizedData.description) {
          localizations[discordLocale].description = localizedData.description;
        }
      }
    }
  }
  
  return localizations;
}

// Helper function to build localization maps for subcommand options (non-nested)
function buildSubcommandOptionLocalizations(
  tessen: Tessen,
  options: readonly ApplicationCommandOptionData[],
  interactionId: string
): ApplicationCommandOptionData[] {
  return options.map(option => {
    const nameLocalizations: Record<string, string> = {};
    const descriptionLocalizations: Record<string, string> = {};
    const choiceLocalizations: Record<string | number, Record<string, string>> = {};
    
    // Collect localizations for each available locale
    for (const [locale, _] of tessen.locales.interaction) {
      
      const localizedData = getLocalizedInteractionData(tessen, interactionId, locale);
      if (localizedData?.options?.[option.name]) {
        const optionData = localizedData.options[option.name];
        const discordLocales = getDiscordLocales(locale);
        
        // Apply the same localization to all Discord locales for this language
        for (const discordLocale of discordLocales) {
          // Option name localization: the option.name IS the key from Tessen's options object
          if (optionData.name) {
            nameLocalizations[discordLocale] = optionData.name;
          }
          
          if (optionData.description) {
            descriptionLocalizations[discordLocale] = optionData.description;
          }
          
          // Handle choice localizations: choice.value is the key from Tessen's choices object
          if (optionData.choices && 'choices' in option && option.choices) {
            for (const choice of option.choices) {
              // choice.value is the key from our original choices object in Tessen
              const choiceKey = String(choice.value);
              const localizedChoiceName = optionData.choices[choiceKey];
              if (localizedChoiceName) {
                if (!choiceLocalizations[choice.value]) {
                  choiceLocalizations[choice.value] = {};
                }
                choiceLocalizations[choice.value][discordLocale] = localizedChoiceName;
              }
            }
          }
        }
      }
    }
    
    // Apply localizations to option
    const localizedOption = { ...option };
    
    // Apply name localizations (option name localization)
    if (Object.keys(nameLocalizations).length > 0) {
      (localizedOption as any).nameLocalizations = nameLocalizations;
    }
    
    if (Object.keys(descriptionLocalizations).length > 0) {
      (localizedOption as any).descriptionLocalizations = descriptionLocalizations;
    }
    
    // Apply choice localizations
    if ('choices' in localizedOption && localizedOption.choices && Object.keys(choiceLocalizations).length > 0) {
      if (localizedOption.type === ApplicationCommandOptionType.String) {
        (localizedOption as any).choices = localizedOption.choices.map(choice => {
          const choiceLocalization = choiceLocalizations[choice.value];
          if (choiceLocalization && Object.keys(choiceLocalization).length > 0) {
            return {
              name: choice.name,
              value: choice.value as string,
              nameLocalizations: choiceLocalization
            };
          }
          return choice;
        });
      } else if (localizedOption.type === ApplicationCommandOptionType.Integer || 
                localizedOption.type === ApplicationCommandOptionType.Number) {
        (localizedOption as any).choices = localizedOption.choices.map(choice => {
          const choiceLocalization = choiceLocalizations[choice.value];
          if (choiceLocalization && Object.keys(choiceLocalization).length > 0) {
            return {
              name: choice.name,
              value: choice.value as number,
              nameLocalizations: choiceLocalization
            };
          }
          return choice;
        });
      }
    }
    
    return localizedOption;
  });
}

// Helper function to build localization maps for options
function buildOptionLocalizations(
  tessen: Tessen,
  options: readonly ApplicationCommandOptionData[],
  interactionId: string
): ApplicationCommandOptionData[] {
  return options.map(option => {
    // Handle subcommand groups separately
    if (option.type === ApplicationCommandOptionType.SubcommandGroup && 'options' in option && option.options) {
      const subcommandGroupOption = { ...option };
      
      // Apply name and description localizations to the subcommand group itself
      const nameLocalizations: Record<string, string> = {};
      const descriptionLocalizations: Record<string, string> = {};
      
      for (const [locale, _] of tessen.locales.interaction) {
        
        const localizedData = getLocalizedInteractionData(tessen, interactionId, locale);
        if (localizedData?.options?.[option.name]) {
          const optionData = localizedData.options[option.name];
          const discordLocales = getDiscordLocales(locale);
          
          // Apply the same localization to all Discord locales for this language
          for (const discordLocale of discordLocales) {
            if (optionData.name) {
              nameLocalizations[discordLocale] = optionData.name;
            }
            
            if (optionData.description) {
              descriptionLocalizations[discordLocale] = optionData.description;
            }
          }
        }
      }
      
      if (Object.keys(nameLocalizations).length > 0) {
        (subcommandGroupOption as any).nameLocalizations = nameLocalizations;
      }
      
      if (Object.keys(descriptionLocalizations).length > 0) {
        (subcommandGroupOption as any).descriptionLocalizations = descriptionLocalizations;
      }
      
      // Recursively handle subcommands within the group - convert readonly to mutable
      const processedSubcommands = buildOptionLocalizations(
        tessen,
        option.options as readonly ApplicationCommandOptionData[],
        interactionId
      );
      
      (subcommandGroupOption as any).options = processedSubcommands;
      
      return subcommandGroupOption;
    }
    
    // Handle subcommands
    if (option.type === ApplicationCommandOptionType.Subcommand && 'options' in option && option.options) {
      const subcommandOption = { ...option };
      
      // Apply name and description localizations to the subcommand itself
      const nameLocalizations: Record<string, string> = {};
      const descriptionLocalizations: Record<string, string> = {};
      
      for (const [locale, _] of tessen.locales.interaction) {
        
        const localizedData = getLocalizedInteractionData(tessen, interactionId, locale);
        if (localizedData?.options?.[option.name]) {
          const optionData = localizedData.options[option.name];
          const discordLocales = getDiscordLocales(locale);
          
          // Apply the same localization to all Discord locales for this language
          for (const discordLocale of discordLocales) {
            if (optionData.name) {
              nameLocalizations[discordLocale] = optionData.name;
            }
            
            if (optionData.description) {
              descriptionLocalizations[discordLocale] = optionData.description;
            }
          }
        }
      }
      
      if (Object.keys(nameLocalizations).length > 0) {
        (subcommandOption as any).nameLocalizations = nameLocalizations;
      }
      
      if (Object.keys(descriptionLocalizations).length > 0) {
        (subcommandOption as any).descriptionLocalizations = descriptionLocalizations;
      }
      
      // Handle the subcommand's options (these are regular options, not subcommands)
      const processedOptions = buildSubcommandOptionLocalizations(
        tessen,
        option.options as readonly ApplicationCommandOptionData[],
        interactionId
      );
      
      (subcommandOption as any).options = processedOptions;
      
      return subcommandOption;
    }
    
    // Handle regular options (non-subcommand, non-subcommand-group)
    return buildSubcommandOptionLocalizations(tessen, [option], interactionId)[0];
  });
}

export async function publishInteractions(tessen: Tessen) {
  // Group interactions by target client
  const clientInteractions = new Map<string, ApplicationCommandDataResolvable[]>();
  
  // Initialize all clients with empty arrays
  for (const tessenClient of tessen.clients.values()) {
    clientInteractions.set(tessenClient.id, []);
  }
  
  // Get first client as default
  const firstClient = tessen.clients.first();
  const defaultClientId = firstClient?.id;
  
  if (!defaultClientId) {
    tessen.events.emit('tessen:publishError', {
      client: null,
      error: new Error('No clients available for publishing interactions')
    });
    return;
  }

  // Process slash commands
  for (const [key, cachedInteraction] of tessen.cache.interactions) {
    const interaction = cachedInteraction.data;

    if ('nameCombinations' in interaction && interaction.type === 'ChatInput') {
      const slashCommand = interaction as SlashCommand;
      
      // Determine target client
      const targetClientId = slashCommand.clientId || defaultClientId;
      if (!clientInteractions.has(targetClientId)) {
        tessen.events.emit('tessen:publishWarning', {
          message: `Client '${targetClientId}' not found for interaction '${slashCommand.id}', using default client '${defaultClientId}'`,
          interactionId: slashCommand.id,
          requestedClientId: targetClientId,
          fallbackClientId: defaultClientId
        });
        clientInteractions.set(defaultClientId, clientInteractions.get(defaultClientId) || []);
      }
      
      const targetCommands = clientInteractions.get(targetClientId) || clientInteractions.get(defaultClientId)!;
      
      // Get the primary command name (first combination)
      const primaryName = slashCommand.nameCombinations[0];
      if (!primaryName) continue;

      const nameParts = primaryName.split(' ');
      const commandName = nameParts[0];
      
      // Check if this command already exists in target client's list
      let existingCommand: TessenApplicationCommand | undefined;
      
      for (const cmd of targetCommands) {
        if ('name' in cmd && 
            cmd.name === commandName && 
            'type' in cmd && 
            cmd.type === ApplicationCommandType.ChatInput) {
          existingCommand = cmd as TessenApplicationCommand;
          break;
        }
      }

      if (!existingCommand) {
        existingCommand = {
          name: commandName,
          description: slashCommand.description,
          type: ApplicationCommandType.ChatInput,
          options: [],
          defaultMemberPermissions: convertPermissions(slashCommand.defaultMemberPermissions),
          contexts: convertContextTypes(slashCommand.contexts),
          nsfw: slashCommand.nsfw || false
        };
        targetCommands.push(existingCommand);
      }

      // Handle subcommands and subcommand groups
      if (nameParts.length === 2) {
        // Subcommand
        const subcommandOption: ApplicationCommandOptionData & { 
          type: ApplicationCommandOptionType.Subcommand;
          options: ApplicationCommandOptionData[] 
        } = {
          name: nameParts[1],
          description: slashCommand.description,
          type: ApplicationCommandOptionType.Subcommand,
          options: []
        };

        // Add command options if they exist
        if (slashCommand.options) {
          for (const [optionName, option] of Object.entries(slashCommand.options)) {
            const commandOption = createCommandOption(optionName, option);
            subcommandOption.options.push(commandOption);
          }
        }

        if (!existingCommand.options) existingCommand.options = [];
        existingCommand.options.push(subcommandOption);
      } else if (nameParts.length === 3) {
        // Subcommand group
        const groupName = nameParts[1];
        const subcommandName = nameParts[2];

        if (!existingCommand.options) existingCommand.options = [];

        let subcommandGroup = existingCommand.options.find((opt): opt is ApplicationCommandOptionData & { 
          type: ApplicationCommandOptionType.SubcommandGroup;
          options: ApplicationCommandOptionData[] 
        } => 
          opt.name === groupName && opt.type === ApplicationCommandOptionType.SubcommandGroup
        );

        if (!subcommandGroup) {
          subcommandGroup = {
            name: groupName,
            description: `${groupName} commands`,
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: []
          };
          existingCommand.options.push(subcommandGroup);
        }

        const subcommandOption: ApplicationCommandOptionData & { 
          type: ApplicationCommandOptionType.Subcommand;
          options: ApplicationCommandOptionData[] 
        } = {
          name: subcommandName,
          description: slashCommand.description,
          type: ApplicationCommandOptionType.Subcommand,
          options: []
        };

        // Add command options similar to above
        if (slashCommand.options) {
          for (const [optionName, option] of Object.entries(slashCommand.options)) {
            const commandOption = createCommandOption(optionName, option);
            subcommandOption.options.push(commandOption);
          }
        }

        subcommandGroup.options.push(subcommandOption);
      } else if (nameParts.length === 1) {
        // Top-level command
        if (slashCommand.options) {
          if (!existingCommand.options) existingCommand.options = [];
          for (const [optionName, option] of Object.entries(slashCommand.options)) {
            const commandOption = createCommandOption(optionName, option);
            existingCommand.options.push(commandOption);
          }
        }
      }

      // After all command structure is built, apply localizations using interaction ID
      const commandLocalizations = localizeCommand(tessen, existingCommand, slashCommand.id, primaryName);
      
      // Apply name and description localizations
      const nameLocalizations: Record<string, string> = {};
      const descriptionLocalizations: Record<string, string> = {};
      
      for (const [discordLocale, localizationData] of Object.entries(commandLocalizations)) {
        if (localizationData.name) {
          nameLocalizations[discordLocale] = localizationData.name;
        }
        if (localizationData.description) {
          descriptionLocalizations[discordLocale] = localizationData.description;
        }
      }
      
      // Add localizations to command if any exist
      if (Object.keys(nameLocalizations).length > 0) {
        (existingCommand as any).nameLocalizations = nameLocalizations;
      }
      if (Object.keys(descriptionLocalizations).length > 0) {
        (existingCommand as any).descriptionLocalizations = descriptionLocalizations;
      }
      
      // Apply option localizations using interaction ID
      if (existingCommand.options) {
        existingCommand.options = buildOptionLocalizations(
          tessen,
          existingCommand.options as readonly ApplicationCommandOptionData[],
          slashCommand.id
        );
      }
    }

    // Process user context menu commands with localization
    if (interaction.type === 'User') {
      const userContextMenu = interaction as UserContextMenuCommand;
      
      // Determine target client
      const targetClientId = userContextMenu.clientId || defaultClientId;
      const targetCommands = clientInteractions.get(targetClientId) || clientInteractions.get(defaultClientId)!;
      
      const command: ApplicationCommandDataResolvable & {
        nameLocalizations?: Record<string, string>;
      } = {
        name: userContextMenu.name,
        type: ApplicationCommandType.User
      };
      
      // Add localizations for context menu using interaction ID
      const nameLocalizations: Record<string, string> = {};
      for (const [locale, _] of tessen.locales.interaction) {
        
        const localizedData = getLocalizedInteractionData(tessen, userContextMenu.id, locale);
        if (localizedData?.name) {
          const discordLocales = getDiscordLocales(locale);
          
          // Apply the same localization to all Discord locales for this language
          for (const discordLocale of discordLocales) {
            nameLocalizations[discordLocale] = localizedData.name;
          }
        }
      }
      
      if (Object.keys(nameLocalizations).length > 0) {
        command.nameLocalizations = nameLocalizations;
      }
      
      targetCommands.push(command);
    }

    // Process message context menu commands with localization
    if (interaction.type === 'Message') {
      const messageContextMenu = interaction as MessageContextMenuCommand;
      
      // Determine target client
      const targetClientId = messageContextMenu.clientId || defaultClientId;
      const targetCommands = clientInteractions.get(targetClientId) || clientInteractions.get(defaultClientId)!;
      
      const command: ApplicationCommandDataResolvable & {
        nameLocalizations?: Record<string, string>;
      } = {
        name: messageContextMenu.name,
        type: ApplicationCommandType.Message
      };
      
      // Add localizations for context menu using interaction ID
      const nameLocalizations: Record<string, string> = {};
      for (const [locale, _] of tessen.locales.interaction) {
        
        const localizedData = getLocalizedInteractionData(tessen, messageContextMenu.id, locale);
        if (localizedData?.name) {
          const discordLocales = getDiscordLocales(locale);
          
          // Apply the same localization to all Discord locales for this language
          for (const discordLocale of discordLocales) {
            nameLocalizations[discordLocale] = localizedData.name;
          }
        }
      }
      
      if (Object.keys(nameLocalizations).length > 0) {
        command.nameLocalizations = nameLocalizations;
      }
      
      targetCommands.push(command);
    }
  }

  // Register commands with Discord API for each client with their specific commands
  for (const tessenClient of tessen.clients.values()) {
    try {
      if (!tessenClient.client.user) {
        tessen.events.emit('tessen:publishError', {
          client: tessenClient,
          error: new Error('Client not ready - user is null')
        });
        continue;
      }

      const applicationCommands = clientInteractions.get(tessenClient.id) || [];
      const commands = await tessenClient.client.application?.commands.set(applicationCommands);
      
      tessen.events.emit('tessen:interactionsPublished', {
        client: tessenClient,
        commands: commands?.size || 0,
        applicationCommands,
        localizedCommands: applicationCommands.filter(cmd => 
          'nameLocalizations' in cmd || 'descriptionLocalizations' in cmd
        ).length
      });

    } catch (error) {
      tessen.events.emit('tessen:publishError', {
        client: tessenClient,
        error,
        applicationCommands: clientInteractions.get(tessenClient.id) || []
      });
    }
  }
}
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
import { InteractionLocaleData, CommandInteractionLocale, ContextMenuLocale } from "$lib/Locale";
import { writeFileSync } from "fs";

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
function getLocalizedInteractionData<ID extends string>(
  tessen: Tessen<ID>,
  interactionId: string,
  locale: string
): CommandInteractionLocale | undefined {
  const interactionLocales = tessen.locales.interaction.get(locale);
  if (!interactionLocales) return undefined;
  
  // Look for the interaction by ID and ensure proper typing
  const data = interactionLocales[interactionId];
  if (!data || typeof data !== 'object') return undefined;
  
  // Type guard to ensure it's a CommandInteractionLocale
  if ('names' in data || 'description' in data || 'options' in data) {
    return data as CommandInteractionLocale;
  }
  
  return undefined;
}

// Helper function to get localized name for a specific command combination
function getLocalizedCommandName<ID extends string>(
  tessen: Tessen<ID>,
  interactionId: string,
  commandName: string,
  locale: string
): string | undefined {
  const localizedData = getLocalizedInteractionData(tessen, interactionId, locale);
  if (!localizedData) return undefined;
  
  // Check names property for word-by-word translations
  if (localizedData.names && typeof localizedData.names === 'object') {
    // Split the command into words and translate each word
    const words = commandName.split(' ');
    const translatedWords: string[] = [];
    
    for (const word of words) {
      // Look for translation of this word in the names mapping
      const translatedWord = localizedData.names[word];
      if (translatedWord) {
        translatedWords.push(translatedWord);
      } else {
        // If no translation found, use original word
        translatedWords.push(word);
      }
    }
    
    // Join translated words back into a phrase
    return translatedWords.join(' ');
  }
  
  return undefined;
}

// Helper function to get localized name parts for subcommands/groups
function getLocalizedNameParts<ID extends string>(
  tessen: Tessen<ID>,
  interactionId: string,
  originalCombination: string,
  locale: string
): { base?: string; group?: string; subcommand?: string } | undefined {
  const localizedData = getLocalizedInteractionData(tessen, interactionId, locale);
  if (!localizedData || !localizedData.names || typeof localizedData.names !== 'object') {
    return undefined;
  }
  
  const originalParts = originalCombination.split(' ');
  const result: { base?: string; group?: string; subcommand?: string } = {};
  
  // Translate each part individually
  if (originalParts[0]) {
    result.base = localizedData.names[originalParts[0]] || originalParts[0];
  }
  
  if (originalParts.length >= 2 && originalParts[1]) {
    result.group = localizedData.names[originalParts[1]] || originalParts[1];
  }
  
  if (originalParts.length >= 3 && originalParts[2]) {
    result.subcommand = localizedData.names[originalParts[2]] || originalParts[2];
  }
  
  return result;
}

// Helper function to localize command names and descriptions
function localizeCommand<ID extends string>(
  tessen: Tessen<ID>,
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
function buildSubcommandOptionLocalizations<ID extends string>(
  tessen: Tessen<ID>,
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
function buildOptionLocalizations<ID extends string>(
  tessen: Tessen<ID>,
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

export async function publishInteractions<ID extends string>(tessen: Tessen<ID>) {
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
    tessen.events.emit('tessen:interactionsPublishError', {
      clientId: 'unknown',
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
        // Note: This event type doesn't exist in PackEventMap, so we'll emit a generic event
        // tessen.events.emit('tessen:publishWarning', { ... });
        console.warn(`Client '${targetClientId}' not found for interaction '${slashCommand.id}', using default client '${defaultClientId}'`);
        clientInteractions.set(defaultClientId, clientInteractions.get(defaultClientId) || []);
      }
      
      const targetCommands = clientInteractions.get(targetClientId) || clientInteractions.get(defaultClientId)!;
      
      // Group combinations by base command name
      const commandGroups = new Map<string, string[]>();
      
      for (const combination of slashCommand.nameCombinations) {
        const nameParts = combination.split(' ');
        const baseCommand = nameParts[0];
        
        if (!commandGroups.has(baseCommand)) {
          commandGroups.set(baseCommand, []);
        }
        commandGroups.get(baseCommand)!.push(combination);
      }
      
      // Process each base command
      for (const [baseCommandName, combinations] of commandGroups) {
        const command: TessenApplicationCommand = {
          name: baseCommandName,
          description: slashCommand.description,
          type: ApplicationCommandType.ChatInput,
          options: [],
          defaultMemberPermissions: convertPermissions(slashCommand.defaultMemberPermissions),
          contexts: convertContextTypes(slashCommand.contexts),
          nsfw: slashCommand.nsfw || false
        };

        // Group combinations by structure
        const subcommandGroups = new Map<string, string[]>();
        const subcommands: string[] = [];
        let hasTopLevelCommand = false;

        for (const combination of combinations) {
          const nameParts = combination.split(' ');
          
          if (nameParts.length === 1) {
            // Top-level command
            hasTopLevelCommand = true;
          } else if (nameParts.length === 2) {
            // Subcommand
            subcommands.push(combination);
          } else if (nameParts.length >= 3) {
            // Subcommand group
            const groupName = nameParts[1];
            if (!subcommandGroups.has(groupName)) {
              subcommandGroups.set(groupName, []);
            }
            subcommandGroups.get(groupName)!.push(combination);
          }
        }

        // Add top-level options if this is a simple command
        if (hasTopLevelCommand && subcommands.length === 0 && subcommandGroups.size === 0) {
          if (slashCommand.options) {
            for (const [optionName, option] of Object.entries(slashCommand.options)) {
              const commandOption = createCommandOption(optionName, option);
              command.options!.push(commandOption);
            }
          }
        }

        // Add subcommands
        for (const subcommandCombination of subcommands) {
          const nameParts = subcommandCombination.split(' ');
          const subcommandName = nameParts[1];
          
          const subcommandOption: ApplicationCommandOptionData = {
            name: subcommandName,
            description: slashCommand.description,
            type: ApplicationCommandOptionType.Subcommand,
            options: []
          };

          // Add localization for subcommand name
          const subcommandNameLocalizations: Record<string, string> = {};
          for (const [locale, _] of tessen.locales.interaction) {
            const localizedParts = getLocalizedNameParts(tessen, slashCommand.id, subcommandCombination, locale);
            if (localizedParts?.group) { // For 2-part commands, the second part (group) is the subcommand name
              const discordLocales = getDiscordLocales(locale);
              for (const discordLocale of discordLocales) {
                subcommandNameLocalizations[discordLocale] = localizedParts.group;
              }
            }
          }
          
          if (Object.keys(subcommandNameLocalizations).length > 0) {
            (subcommandOption as any).nameLocalizations = subcommandNameLocalizations;
          }

          // Add options to subcommand
          if (slashCommand.options) {
            for (const [optionName, option] of Object.entries(slashCommand.options)) {
              const commandOption = createCommandOption(optionName, option);
              (subcommandOption.options as ApplicationCommandOptionData[]).push(commandOption);
            }
          }

          command.options!.push(subcommandOption);
        }

        // Add subcommand groups
        for (const [groupName, groupCombinations] of subcommandGroups) {
          const subcommandGroupOption: ApplicationCommandOptionData = {
            name: groupName,
            description: slashCommand.description,
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: []
          };

          // Add localization for subcommand group name
          const groupNameLocalizations: Record<string, string> = {};
          // Use the first combination in the group to get the group name localization
          const firstCombination = groupCombinations[0];
          for (const [locale, _] of tessen.locales.interaction) {
            const localizedParts = getLocalizedNameParts(tessen, slashCommand.id, firstCombination, locale);
            if (localizedParts?.group) { // For 3+ part commands, the second part is the group name
              const discordLocales = getDiscordLocales(locale);
              for (const discordLocale of discordLocales) {
                groupNameLocalizations[discordLocale] = localizedParts.group;
              }
            }
          }
          
          if (Object.keys(groupNameLocalizations).length > 0) {
            (subcommandGroupOption as any).nameLocalizations = groupNameLocalizations;
          }

          for (const groupCombination of groupCombinations) {
            const nameParts = groupCombination.split(' ');
            const subcommandName = nameParts[2];
            
            const subcommandOption: ApplicationCommandOptionData = {
              name: subcommandName,
              description: slashCommand.description,
              type: ApplicationCommandOptionType.Subcommand,
              options: []
            };

            // Add localization for subcommand name within group
            const subcommandNameLocalizations: Record<string, string> = {};
            for (const [locale, _] of tessen.locales.interaction) {
              const localizedParts = getLocalizedNameParts(tessen, slashCommand.id, groupCombination, locale);
              if (localizedParts?.subcommand) { // For 3+ part commands, the third part is the subcommand name
                const discordLocales = getDiscordLocales(locale);
                for (const discordLocale of discordLocales) {
                  subcommandNameLocalizations[discordLocale] = localizedParts.subcommand;
                }
              }
            }
            
            if (Object.keys(subcommandNameLocalizations).length > 0) {
              (subcommandOption as any).nameLocalizations = subcommandNameLocalizations;
            }

            // Add options to subcommand
            if (slashCommand.options) {
              for (const [optionName, option] of Object.entries(slashCommand.options)) {
                const commandOption = createCommandOption(optionName, option);
                (subcommandOption.options as ApplicationCommandOptionData[]).push(commandOption);
              }
            }

            (subcommandGroupOption.options as ApplicationCommandOptionData[]).push(subcommandOption);
          }

          command.options!.push(subcommandGroupOption);
        }

        // Apply localizations for the base command
        const commandLocalizations = localizeCommand(tessen, command, slashCommand.id, baseCommandName);
        
        // Apply name and description localizations
        const nameLocalizations: Record<string, string> = {};
        const descriptionLocalizations: Record<string, string> = {};
        
        // Add base command name localizations
        for (const [locale, _] of tessen.locales.interaction) {
          // Try to get localization from any combination that starts with this base command
          let baseLocalization: string | undefined;
          for (const combination of combinations) {
            const localizedParts = getLocalizedNameParts(tessen, slashCommand.id, combination, locale);
            if (localizedParts?.base) {
              baseLocalization = localizedParts.base;
              break; // Use the first one found
            }
          }
          
          if (baseLocalization) {
            const discordLocales = getDiscordLocales(locale);
            for (const discordLocale of discordLocales) {
              nameLocalizations[discordLocale] = baseLocalization;
            }
          }
        }
        
        for (const [discordLocale, localizationData] of Object.entries(commandLocalizations)) {
          if (localizationData.description) {
            descriptionLocalizations[discordLocale] = localizationData.description;
          }
        }
        
        // Add localizations to command if any exist
        if (Object.keys(nameLocalizations).length > 0) {
          (command as any).nameLocalizations = nameLocalizations;
        }
        if (Object.keys(descriptionLocalizations).length > 0) {
          (command as any).descriptionLocalizations = descriptionLocalizations;
        }
        
        // Apply option localizations using interaction ID
        if (command.options && command.options.length > 0) {
          command.options = buildOptionLocalizations(
            tessen,
            command.options as readonly ApplicationCommandOptionData[],
            slashCommand.id
          );
        }

        targetCommands.push(command);
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
        if (localizedData && 'name' in localizedData) {
          // For context menus, still use name field since they don't have combinations
          const contextData = localizedData as ContextMenuLocale;
          if (contextData.name) {
            const discordLocales = getDiscordLocales(locale);
            
            // Apply the same localization to all Discord locales for this language
            for (const discordLocale of discordLocales) {
              nameLocalizations[discordLocale] = contextData.name;
            }
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
        if (localizedData && 'name' in localizedData) {
          // For context menus, still use name field since they don't have combinations
          const contextData = localizedData as ContextMenuLocale;
          if (contextData.name) {
            const discordLocales = getDiscordLocales(locale);
            
            // Apply the same localization to all Discord locales for this language
            for (const discordLocale of discordLocales) {
              nameLocalizations[discordLocale] = contextData.name;
            }
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
        tessen.events.emit('tessen:interactionsPublishError', {
          clientId: tessenClient.id,
          error: new Error('Client not ready - user is null')
        });
        continue;
      }

      const applicationCommands = clientInteractions.get(tessenClient.id) || [];
      writeFileSync("./commands.json", JSON.stringify(applicationCommands, null, 2), "utf-8");
      const commands = await tessenClient.client.application?.commands.set(applicationCommands);
      
      tessen.events.emit('tessen:interactionsPublished', {
        clientId: tessenClient.id,
        count: commands?.size || 0
      });
    } catch (error) {
      tessen.events.emit('tessen:interactionsPublishError', {
        clientId: tessenClient.id,
        error: error as Error
      });
    }
  }
}
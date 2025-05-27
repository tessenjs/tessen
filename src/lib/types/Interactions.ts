import { SlashCommand } from "./SlashCommand";
import { GetLocalization } from "$lib/Locale";
import { 
  ChatInputCommandInteraction, 
  ButtonInteraction, 
  StringSelectMenuInteraction,
  UserSelectMenuInteraction,
  RoleSelectMenuInteraction,
  ChannelSelectMenuInteraction,
  MentionableSelectMenuInteraction,
  ModalSubmitInteraction,
  UserContextMenuCommandInteraction,
  MessageContextMenuCommandInteraction,
  Message,
  Guild,
  User,
  AutocompleteInteraction,
  ApplicationCommandOptionType
} from "discord.js";

// Localization helper type with direct locale access
type LocalizationGetter<TessenId extends string = string> = {
  locale: {
    guild: GetLocalization<TessenId>;
    user: GetLocalization<TessenId>;
  };
};

export interface ChatInputInteractionWrapper<TessenId extends string = string> extends LocalizationGetter<TessenId> {
  type: 'chatInput';
  interaction: ChatInputCommandInteraction;
  commandName: string;
  message?: Message;
}

export interface ButtonInteractionWrapper<TessenId extends string = string> extends LocalizationGetter<TessenId> {
  type: 'button';
  interaction: ButtonInteraction;
  customId: string;
}

export interface SelectMenuInteractionWrapper<TessenId extends string = string> extends LocalizationGetter<TessenId> {
  type: 'selectMenu';
  interaction: StringSelectMenuInteraction | UserSelectMenuInteraction | RoleSelectMenuInteraction | ChannelSelectMenuInteraction | MentionableSelectMenuInteraction;
  customId: string;
}

export interface ModalInteractionWrapper<TessenId extends string = string> extends LocalizationGetter<TessenId> {
  type: 'modal';
  interaction: ModalSubmitInteraction;
  customId: string;
}

export interface UserContextMenuInteractionWrapper<TessenId extends string = string> extends LocalizationGetter<TessenId> {
  type: 'userContextMenu';
  interaction: UserContextMenuCommandInteraction;
  commandName: string;
}

export interface MessageContextMenuInteractionWrapper<TessenId extends string = string> extends LocalizationGetter<TessenId> {
  type: 'messageContextMenu';
  interaction: MessageContextMenuCommandInteraction;
  commandName: string;
}

export interface AutocompleteInteractionWrapper<TessenId extends string = string> extends LocalizationGetter<TessenId> {
  type: 'autocomplete';
  interaction: AutocompleteInteraction;
  commandName: string;
  focusedOption: {
    name: string;
    value: string;
    type: "String" | "Integer" | "Number";
  };
}

// Registration configs
export interface UserContextMenuRegistrationConfig<T extends string, TessenId extends string = string> {
  id: string;
  name: T;
  handle: (ctx: UserContextMenuInteractionWrapper<TessenId>) => void | Promise<void>;
}

export interface MessageContextMenuRegistrationConfig<T extends string, TessenId extends string = string> {
  id: string;
  name: T;
  handle: (ctx: MessageContextMenuInteractionWrapper<TessenId>) => void | Promise<void>;
}

export interface ButtonRegistrationConfig<TessenId extends string = string> {
  id: string;
  handle: (ctx: ButtonInteractionWrapper<TessenId>) => void | Promise<void>;
}

export interface SelectMenuRegistrationConfig<TessenId extends string = string> {
  id: string;
  handle: (ctx: SelectMenuInteractionWrapper<TessenId>) => void | Promise<void>;
}

export interface ModalRegistrationConfig<TessenId extends string = string> {
  id: string;
  handle: (ctx: ModalInteractionWrapper<TessenId>) => void | Promise<void>;
}

// Existing interaction data interfaces
export interface ButtonInteractionData<TessenId extends string = string> {
  id: string;
  type: 'Button';
  handle: (ctx: ButtonInteractionWrapper<TessenId>) => void | Promise<void>;
}

export interface SelectMenuInteractionData<TessenId extends string = string> {
  id: string;
  type: 'SelectMenu';
  handle: (ctx: SelectMenuInteractionWrapper<TessenId>) => void | Promise<void>;
}

export interface ModalInteractionData<TessenId extends string = string> {
  id: string;
  type: 'Modal';
  handle: (ctx: ModalInteractionWrapper<TessenId>) => void | Promise<void>;
}

// Context menu command interfaces
export interface UserContextMenuCommand<TessenId extends string = string> {
  id: string;
  name: string;
  type: 'User';
  handle: (ctx: UserContextMenuInteractionWrapper<TessenId>) => void | Promise<void>;
}

export interface MessageContextMenuCommand<TessenId extends string = string> {
  id: string;
  name: string;
  type: 'Message';
  handle: (ctx: MessageContextMenuInteractionWrapper<TessenId>) => void | Promise<void>;
}

export type MessageInteraction = ChatInputInteractionWrapper;
export type ActionInteraction = ButtonInteractionWrapper | SelectMenuInteractionWrapper | ModalInteractionWrapper | UserContextMenuInteractionWrapper | MessageContextMenuInteractionWrapper | AutocompleteInteractionWrapper;
export type Interaction = MessageInteraction | ActionInteraction | SlashCommand | UserContextMenuCommand | MessageContextMenuCommand | ButtonInteractionData | SelectMenuInteractionData | ModalInteractionData;
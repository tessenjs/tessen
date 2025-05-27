import { SlashCommand } from "./SlashCommand";
import { ContentValue } from "$lib/Locale";
import { GetLocalization } from "../../../generated/localization";
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
  User
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

// Registration configs
export interface UserContextMenuRegistrationConfig<T extends string> {
  id: string;
  name: T;
  handle: (ctx: UserContextMenuInteractionWrapper) => void | Promise<void>;
}

export interface MessageContextMenuRegistrationConfig<T extends string> {
  id: string;
  name: T;
  handle: (ctx: MessageContextMenuInteractionWrapper) => void | Promise<void>;
}

export interface ButtonRegistrationConfig {
  id: string;
  handle: (ctx: ButtonInteractionWrapper) => void | Promise<void>;
}

export interface SelectMenuRegistrationConfig {
  id: string;
  handle: (ctx: SelectMenuInteractionWrapper) => void | Promise<void>;
}

export interface ModalRegistrationConfig {
  id: string;
  handle: (ctx: ModalInteractionWrapper) => void | Promise<void>;
}

// Existing interaction data interfaces
export interface ButtonInteractionData {
  id: string;
  type: 'BUTTON';
  handle: (ctx: ButtonInteractionWrapper) => void | Promise<void>;
}

export interface SelectMenuInteractionData {
  id: string;
  type: 'SELECT_MENU';
  handle: (ctx: SelectMenuInteractionWrapper) => void | Promise<void>;
}

export interface ModalInteractionData {
  id: string;
  type: 'MODAL';
  handle: (ctx: ModalInteractionWrapper) => void | Promise<void>;
}

// Context menu command interfaces
export interface UserContextMenuCommand {
  id: string;
  name: string;
  type: 'USER';
  handle: (ctx: UserContextMenuInteractionWrapper) => void | Promise<void>;
}

export interface MessageContextMenuCommand {
  id: string;
  name: string;
  type: 'MESSAGE';
  handle: (ctx: MessageContextMenuInteractionWrapper) => void | Promise<void>;
}

export type MessageInteraction = ChatInputInteractionWrapper;
export type ActionInteraction = ButtonInteractionWrapper | SelectMenuInteractionWrapper | ModalInteractionWrapper | UserContextMenuInteractionWrapper | MessageContextMenuInteractionWrapper;
export type Interaction = MessageInteraction | ActionInteraction | SlashCommand | UserContextMenuCommand | MessageContextMenuCommand | ButtonInteractionData | SelectMenuInteractionData | ModalInteractionData;
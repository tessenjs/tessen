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
  AutocompleteInteraction,
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
  data: (string | number)[];
}

export interface StringSelectMenuInteractionWrapper<TessenId extends string = string> extends LocalizationGetter<TessenId> {
  type: 'stringSelectMenu';
  interaction: StringSelectMenuInteraction;
  customId: string;
  data: (string | number)[];
}

export interface UserSelectMenuInteractionWrapper<TessenId extends string = string> extends LocalizationGetter<TessenId> {
  type: 'userSelectMenu';
  interaction: UserSelectMenuInteraction;
  customId: string;
  data: (string | number)[];
}

export interface RoleSelectMenuInteractionWrapper<TessenId extends string = string> extends LocalizationGetter<TessenId> {
  type: 'roleSelectMenu';
  interaction: RoleSelectMenuInteraction;
  customId: string;
  data: (string | number)[];
}

export interface ChannelSelectMenuInteractionWrapper<TessenId extends string = string> extends LocalizationGetter<TessenId> {
  type: 'channelSelectMenu';
  interaction: ChannelSelectMenuInteraction;
  customId: string;
  data: (string | number)[];
}

export interface MentionableSelectMenuInteractionWrapper<TessenId extends string = string> extends LocalizationGetter<TessenId> {
  type: 'mentionableSelectMenu';
  interaction: MentionableSelectMenuInteraction;
  customId: string;
  data: (string | number)[];
}

export interface ModalInteractionWrapper<TessenId extends string = string> extends LocalizationGetter<TessenId> {
  type: 'modal';
  interaction: ModalSubmitInteraction;
  customId: string;
  data: (string | number)[];
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

// Handle types
export type UserContextMenuHandle<TessenId extends string = string> = (ctx: UserContextMenuInteractionWrapper<TessenId>) => void | Promise<void>;
export type MessageContextMenuHandle<TessenId extends string = string> = (ctx: MessageContextMenuInteractionWrapper<TessenId>) => void | Promise<void>;
export type ButtonHandle<TessenId extends string = string> = (ctx: ButtonInteractionWrapper<TessenId>) => void | Promise<void>;
export type StringSelectMenuHandle<TessenId extends string = string> = (ctx: StringSelectMenuInteractionWrapper<TessenId>) => void | Promise<void>;
export type UserSelectMenuHandle<TessenId extends string = string> = (ctx: UserSelectMenuInteractionWrapper<TessenId>) => void | Promise<void>;
export type RoleSelectMenuHandle<TessenId extends string = string> = (ctx: RoleSelectMenuInteractionWrapper<TessenId>) => void | Promise<void>;
export type ChannelSelectMenuHandle<TessenId extends string = string> = (ctx: ChannelSelectMenuInteractionWrapper<TessenId>) => void | Promise<void>;
export type MentionableSelectMenuHandle<TessenId extends string = string> = (ctx: MentionableSelectMenuInteractionWrapper<TessenId>) => void | Promise<void>;
export type ModalHandle<TessenId extends string = string> = (ctx: ModalInteractionWrapper<TessenId>) => void | Promise<void>;

// Registration configs
export interface UserContextMenuRegistrationConfig<T extends string, TessenId extends string = string> {
  id: string;
  name: T;
  handle: UserContextMenuHandle<TessenId>;
  clientId?: string; // Target specific client, defaults to first client if not specified
}

export interface MessageContextMenuRegistrationConfig<T extends string, TessenId extends string = string> {
  id: string;
  name: T;
  handle: MessageContextMenuHandle<TessenId>;
  clientId?: string; // Target specific client, defaults to first client if not specified
}

export interface ButtonRegistrationConfig<TessenId extends string = string> {
  id: string;
  handle: ButtonHandle<TessenId>;
}

export interface StringSelectMenuRegistrationConfig<TessenId extends string = string> {
  id: string;
  handle: StringSelectMenuHandle<TessenId>;
}

export interface UserSelectMenuRegistrationConfig<TessenId extends string = string> {
  id: string;
  handle: UserSelectMenuHandle<TessenId>;
}

export interface RoleSelectMenuRegistrationConfig<TessenId extends string = string> {
  id: string;
  handle: RoleSelectMenuHandle<TessenId>;
}

export interface ChannelSelectMenuRegistrationConfig<TessenId extends string = string> {
  id: string;
  handle: ChannelSelectMenuHandle<TessenId>;
}

export interface MentionableSelectMenuRegistrationConfig<TessenId extends string = string> {
  id: string;
  handle: MentionableSelectMenuHandle<TessenId>;
}

export interface ModalRegistrationConfig<TessenId extends string = string> {
  id: string;
  handle: ModalHandle<TessenId>;
}

// Existing interaction data interfaces
export interface ButtonInteractionData<TessenId extends string = string> {
  id: string;
  type: 'Button';
  handle: ButtonHandle<TessenId>;
}

export interface StringSelectMenuInteractionData<TessenId extends string = string> {
  id: string;
  type: 'StringSelectMenu';
  handle: StringSelectMenuHandle<TessenId>;
}

export interface UserSelectMenuInteractionData<TessenId extends string = string> {
  id: string;
  type: 'UserSelectMenu';
  handle: UserSelectMenuHandle<TessenId>;
}

export interface RoleSelectMenuInteractionData<TessenId extends string = string> {
  id: string;
  type: 'RoleSelectMenu';
  handle: RoleSelectMenuHandle<TessenId>;
}

export interface ChannelSelectMenuInteractionData<TessenId extends string = string> {
  id: string;
  type: 'ChannelSelectMenu';
  handle: ChannelSelectMenuHandle<TessenId>;
}

export interface MentionableSelectMenuInteractionData<TessenId extends string = string> {
  id: string;
  type: 'MentionableSelectMenu';
  handle: MentionableSelectMenuHandle<TessenId>;
}

export interface ModalInteractionData<TessenId extends string = string> {
  id: string;
  type: 'Modal';
  handle: ModalHandle<TessenId>;
}

// Context menu command interfaces
export interface UserContextMenuCommand<TessenId extends string = string> {
  id: string;
  name: string;
  type: 'User';
  handle: UserContextMenuHandle<TessenId>;
  clientId?: string;
}

export interface MessageContextMenuCommand<TessenId extends string = string> {
  id: string;
  name: string;
  type: 'Message';
  handle: MessageContextMenuHandle<TessenId>;
  clientId?: string;
}

export type MessageInteraction = ChatInputInteractionWrapper;
export type ActionInteraction = ButtonInteractionWrapper | StringSelectMenuInteractionWrapper | UserSelectMenuInteractionWrapper | RoleSelectMenuInteractionWrapper | ChannelSelectMenuInteractionWrapper | MentionableSelectMenuInteractionWrapper | ModalInteractionWrapper | UserContextMenuInteractionWrapper | MessageContextMenuInteractionWrapper | AutocompleteInteractionWrapper;
export type Interaction = MessageInteraction | ActionInteraction | SlashCommand | UserContextMenuCommand | MessageContextMenuCommand | ButtonInteractionData | StringSelectMenuInteractionData | UserSelectMenuInteractionData | RoleSelectMenuInteractionData | ChannelSelectMenuInteractionData | MentionableSelectMenuInteractionData | ModalInteractionData;
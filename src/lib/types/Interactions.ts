import { SlashCommand } from "./SlashCommand";
import { GetLocalization } from "$lib/Locale";
import { CustomDataValue } from "./ComponentBuilder";
import {
  ButtonComponentOptions,
  SelectMenuComponentOptions,
  ModalComponentOptions,
} from "./ComponentOptions";
import { TessenClient } from "$lib/Tessen";
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

// Base context interface that includes common properties for all interactions
interface BaseInteractionContext<TessenId extends string = string>
  extends LocalizationGetter<TessenId> {
  client: TessenClient;
  tessenId: TessenId;
}

export interface ChatInputInteractionWrapper<TessenId extends string = string>
  extends BaseInteractionContext<TessenId> {
  type: "chatInput";
  interaction: ChatInputCommandInteraction;
  commandName: string;
  message?: Message;
}

export interface ButtonInteractionWrapper<TessenId extends string = string>
  extends BaseInteractionContext<TessenId> {
  type: "button";
  interaction: ButtonInteraction;
  customId: string;
  data: CustomDataValue[];
}

export interface StringSelectMenuInteractionWrapper<
  TessenId extends string = string,
> extends BaseInteractionContext<TessenId> {
  type: "stringSelectMenu";
  interaction: StringSelectMenuInteraction;
  customId: string;
  data: CustomDataValue[];
}

export interface UserSelectMenuInteractionWrapper<
  TessenId extends string = string,
> extends BaseInteractionContext<TessenId> {
  type: "userSelectMenu";
  interaction: UserSelectMenuInteraction;
  customId: string;
  data: CustomDataValue[];
}

export interface RoleSelectMenuInteractionWrapper<
  TessenId extends string = string,
> extends BaseInteractionContext<TessenId> {
  type: "roleSelectMenu";
  interaction: RoleSelectMenuInteraction;
  customId: string;
  data: CustomDataValue[];
}

export interface ChannelSelectMenuInteractionWrapper<
  TessenId extends string = string,
> extends BaseInteractionContext<TessenId> {
  type: "channelSelectMenu";
  interaction: ChannelSelectMenuInteraction;
  customId: string;
  data: CustomDataValue[];
}

export interface MentionableSelectMenuInteractionWrapper<
  TessenId extends string = string,
> extends BaseInteractionContext<TessenId> {
  type: "mentionableSelectMenu";
  interaction: MentionableSelectMenuInteraction;
  customId: string;
  data: CustomDataValue[];
}

export interface ModalInteractionWrapper<TessenId extends string = string>
  extends BaseInteractionContext<TessenId> {
  type: "modal";
  interaction: ModalSubmitInteraction;
  customId: string;
  data: CustomDataValue[];
}

export interface UserContextMenuInteractionWrapper<
  TessenId extends string = string,
> extends BaseInteractionContext<TessenId> {
  type: "userContextMenu";
  interaction: UserContextMenuCommandInteraction;
  commandName: string;
}

export interface MessageContextMenuInteractionWrapper<
  TessenId extends string = string,
> extends BaseInteractionContext<TessenId> {
  type: "messageContextMenu";
  interaction: MessageContextMenuCommandInteraction;
  commandName: string;
}

export interface AutocompleteInteractionWrapper<
  TessenId extends string = string,
> extends BaseInteractionContext<TessenId> {
  type: "autocomplete";
  interaction: AutocompleteInteraction;
  commandName: string;
  focusedOption: {
    name: string;
    value: string;
    type: "String" | "Integer" | "Number";
  };
}

// Handle types
export type UserContextMenuHandle<TessenId extends string = string> = (
  ctx: UserContextMenuInteractionWrapper<TessenId>,
) => void | Promise<void>;
export type MessageContextMenuHandle<TessenId extends string = string> = (
  ctx: MessageContextMenuInteractionWrapper<TessenId>,
) => void | Promise<void>;
export type ButtonHandle<TessenId extends string = string> = (
  ctx: ButtonInteractionWrapper<TessenId>,
) => void | Promise<void>;
export type StringSelectMenuHandle<TessenId extends string = string> = (
  ctx: StringSelectMenuInteractionWrapper<TessenId>,
) => void | Promise<void>;
export type UserSelectMenuHandle<TessenId extends string = string> = (
  ctx: UserSelectMenuInteractionWrapper<TessenId>,
) => void | Promise<void>;
export type RoleSelectMenuHandle<TessenId extends string = string> = (
  ctx: RoleSelectMenuInteractionWrapper<TessenId>,
) => void | Promise<void>;
export type ChannelSelectMenuHandle<TessenId extends string = string> = (
  ctx: ChannelSelectMenuInteractionWrapper<TessenId>,
) => void | Promise<void>;
export type MentionableSelectMenuHandle<TessenId extends string = string> = (
  ctx: MentionableSelectMenuInteractionWrapper<TessenId>,
) => void | Promise<void>;
export type ModalHandle<TessenId extends string = string> = (
  ctx: ModalInteractionWrapper<TessenId>,
) => void | Promise<void>;

// Registration configs
export interface UserContextMenuRegistrationConfig<
  T extends string,
  TessenId extends string = string,
> {
  id: string;
  name: T;
  handle: UserContextMenuHandle<TessenId>;
  clientId?: string; // Target specific client, defaults to first client if not specified
}

export interface MessageContextMenuRegistrationConfig<
  T extends string,
  TessenId extends string = string,
> {
  id: string;
  name: T;
  handle: MessageContextMenuHandle<TessenId>;
  clientId?: string; // Target specific client, defaults to first client if not specified
}

export interface ButtonRegistrationConfig<TessenId extends string = string> {
  id: string;
  handle: ButtonHandle<TessenId>;
  options?: ButtonComponentOptions;
}

export interface StringSelectMenuRegistrationConfig<
  TessenId extends string = string,
> {
  id: string;
  handle: StringSelectMenuHandle<TessenId>;
  options?: SelectMenuComponentOptions;
}

export interface UserSelectMenuRegistrationConfig<
  TessenId extends string = string,
> {
  id: string;
  handle: UserSelectMenuHandle<TessenId>;
  options?: SelectMenuComponentOptions;
}

export interface RoleSelectMenuRegistrationConfig<
  TessenId extends string = string,
> {
  id: string;
  handle: RoleSelectMenuHandle<TessenId>;
  options?: SelectMenuComponentOptions;
}

export interface ChannelSelectMenuRegistrationConfig<
  TessenId extends string = string,
> {
  id: string;
  handle: ChannelSelectMenuHandle<TessenId>;
  options?: SelectMenuComponentOptions;
}

export interface MentionableSelectMenuRegistrationConfig<
  TessenId extends string = string,
> {
  id: string;
  handle: MentionableSelectMenuHandle<TessenId>;
  options?: SelectMenuComponentOptions;
}

export interface ModalRegistrationConfig<TessenId extends string = string> {
  id: string;
  handle: ModalHandle<TessenId>;
  options?: ModalComponentOptions;
}

// Existing interaction data interfaces
export interface ButtonInteractionData<TessenId extends string = string> {
  id: string;
  type: "Button";
  handle: ButtonHandle<TessenId>;
  options?: ButtonComponentOptions;
}

export interface StringSelectMenuInteractionData<
  TessenId extends string = string,
> {
  id: string;
  type: "StringSelectMenu";
  handle: StringSelectMenuHandle<TessenId>;
  options?: SelectMenuComponentOptions;
}

export interface UserSelectMenuInteractionData<
  TessenId extends string = string,
> {
  id: string;
  type: "UserSelectMenu";
  handle: UserSelectMenuHandle<TessenId>;
  options?: SelectMenuComponentOptions;
}

export interface RoleSelectMenuInteractionData<
  TessenId extends string = string,
> {
  id: string;
  type: "RoleSelectMenu";
  handle: RoleSelectMenuHandle<TessenId>;
  options?: SelectMenuComponentOptions;
}

export interface ChannelSelectMenuInteractionData<
  TessenId extends string = string,
> {
  id: string;
  type: "ChannelSelectMenu";
  handle: ChannelSelectMenuHandle<TessenId>;
  options?: SelectMenuComponentOptions;
}

export interface MentionableSelectMenuInteractionData<
  TessenId extends string = string,
> {
  id: string;
  type: "MentionableSelectMenu";
  handle: MentionableSelectMenuHandle<TessenId>;
  options?: SelectMenuComponentOptions;
}

export interface ModalInteractionData<TessenId extends string = string> {
  id: string;
  type: "Modal";
  handle: ModalHandle<TessenId>;
  options?: ModalComponentOptions;
}

// Context menu command interfaces
export interface UserContextMenuCommand<TessenId extends string = string> {
  id: string;
  name: string;
  type: "User";
  handle: UserContextMenuHandle<TessenId>;
  clientId?: string;
}

export interface MessageContextMenuCommand<TessenId extends string = string> {
  id: string;
  name: string;
  type: "Message";
  handle: MessageContextMenuHandle<TessenId>;
  clientId?: string;
}

export type MessageInteraction<TessenId extends string = string> =
  ChatInputInteractionWrapper<TessenId>;
export type ActionInteraction<TessenId extends string = string> =
  | ButtonInteractionWrapper<TessenId>
  | StringSelectMenuInteractionWrapper<TessenId>
  | UserSelectMenuInteractionWrapper<TessenId>
  | RoleSelectMenuInteractionWrapper<TessenId>
  | ChannelSelectMenuInteractionWrapper<TessenId>
  | MentionableSelectMenuInteractionWrapper<TessenId>
  | ModalInteractionWrapper<TessenId>
  | UserContextMenuInteractionWrapper<TessenId>
  | MessageContextMenuInteractionWrapper<TessenId>
  | AutocompleteInteractionWrapper<TessenId>;
export type Interaction<TessenId extends string = string> =
  | MessageInteraction<TessenId>
  | ActionInteraction<TessenId>
  | SlashCommand<string, TessenId>
  | UserContextMenuCommand<TessenId>
  | MessageContextMenuCommand<TessenId>
  | ButtonInteractionData<TessenId>
  | StringSelectMenuInteractionData<TessenId>
  | UserSelectMenuInteractionData<TessenId>
  | RoleSelectMenuInteractionData<TessenId>
  | ChannelSelectMenuInteractionData<TessenId>
  | MentionableSelectMenuInteractionData<TessenId>
  | ModalInteractionData<TessenId>;

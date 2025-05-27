import { AutocompleteInteraction, ChannelType, InteractionContextType, PermissionFlags } from "discord.js";
import { ChatInputInteractionWrapper } from "./Interactions";

type StringToTuple<
  S extends string,
  R extends any[] = []
> = S extends `${infer _}${infer Rest}`
  ? StringToTuple<Rest, [unknown, ...R]>
  : R;

type StringLength<S extends string> = StringToTuple<S>["length"];

type ValidCombination<S extends string> = StringLength<S> extends infer L
  ? L extends number
    ? L extends 0
      ? never
      : S
    : never
  : never;

export type SlashCommandName<S extends string> =
  S extends `${infer _} ${infer _} ${infer _} ${infer _}`
    ? never
  : S extends `${infer W1} ${infer W2} ${infer W3}`
    ? W1 extends string
      ? W2 extends string
        ? W3 extends string
          ? ValidCombination<W1> extends never
            ? never
            : ValidCombination<W2> extends never
              ? never
              : ValidCombination<W3> extends never
                ? never
                : S
          : never
        : never
      : never
    : S extends `${infer W1} ${infer W2}`
      ? W1 extends string
        ? W2 extends string
          ? ValidCombination<W1> extends never
            ? never
            : ValidCombination<W2> extends never
              ? never
              : S
          : never
        : never
      : ValidCombination<S> extends never
        ? never
        : S

export type SlashCommandType = 'CHAT_INPUT' | 'USER' | 'MESSAGE';

// Discord.js Application Command Option Types (excluding Subcommand and SubcommandGroup)
export type SlashCommandOptionType = 
  | 'String'
  | 'Integer' 
  | 'Number'
  | 'Boolean'
  | 'User'
  | 'Channel'
  | 'Role'
  | 'Mentionable'
  | 'Attachment';

// Base option interface
export interface BaseSlashCommandOption {
  name: string;
  description: string;
  required?: boolean;
}

// Option choice interface
export interface SlashCommandOptionChoice<T = string | number> {
  name: string;
  value: T;
}

// Autocomplete context for dynamic options
export interface AutocompleteContext {
  value: string;
  focused: boolean;
  interaction: AutocompleteInteraction; // The autocomplete interaction
}

// String option - strict union for choices vs autocomplete
export type StringSlashCommandOption = BaseSlashCommandOption & {
  type: 'String';
  minLength?: number;
  maxLength?: number;
} & (
  | { choices: SlashCommandOptionChoice<string>[]; autoComplete?: never; }
  | { autoComplete: (ctx: AutocompleteContext) => Promise<SlashCommandOptionChoice<string>[]> | SlashCommandOptionChoice<string>[]; choices?: never; }
  | { choices?: never; autoComplete?: never; }
);

// Integer option - strict union for choices vs autocomplete
export type IntegerSlashCommandOption = BaseSlashCommandOption & {
  type: 'Integer';
  minValue?: number;
  maxValue?: number;
} & (
  | { choices: SlashCommandOptionChoice<number>[]; autoComplete?: never; }
  | { autoComplete: (ctx: AutocompleteContext) => Promise<SlashCommandOptionChoice<number>[]> | SlashCommandOptionChoice<number>[]; choices?: never; }
  | { choices?: never; autoComplete?: never; }
);

// Number option - strict union for choices vs autocomplete
export type NumberSlashCommandOption = BaseSlashCommandOption & {
  type: 'Number';
  minValue?: number;
  maxValue?: number;
} & (
  | { choices: SlashCommandOptionChoice<number>[]; autoComplete?: never; }
  | { autoComplete: (ctx: AutocompleteContext) => Promise<SlashCommandOptionChoice<number>[]> | SlashCommandOptionChoice<number>[]; choices?: never; }
  | { choices?: never; autoComplete?: never; }
);

// Boolean option
export interface BooleanSlashCommandOption extends BaseSlashCommandOption {
  type: 'Boolean';
}

// User option
export interface UserSlashCommandOption extends BaseSlashCommandOption {
  type: 'User';
}

// Channel option
export interface ChannelSlashCommandOption extends BaseSlashCommandOption {
  type: 'Channel';
  channelTypes?: (keyof typeof ChannelType)[];
}

// Role option
export interface RoleSlashCommandOption extends BaseSlashCommandOption {
  type: 'Role';
}

// Mentionable option
export interface MentionableSlashCommandOption extends BaseSlashCommandOption {
  type: 'Mentionable';
}

// Attachment option
export interface AttachmentSlashCommandOption extends BaseSlashCommandOption {
  type: 'Attachment';
}

// Union type for all option types (without Subcommand and SubcommandGroup)
export type SlashCommandOption = 
  | StringSlashCommandOption
  | IntegerSlashCommandOption
  | NumberSlashCommandOption
  | BooleanSlashCommandOption
  | UserSlashCommandOption
  | ChannelSlashCommandOption
  | RoleSlashCommandOption
  | MentionableSlashCommandOption
  | AttachmentSlashCommandOption;

// Registration config type that includes all properties
export interface SlashCommandRegistrationConfig<T extends string> {
  id: string;
  name: T;
  description: string;
  handle: (ctx: ChatInputInteractionWrapper) => void | Promise<void>;
  options?: SlashCommandOption[];
  defaultMemberPermissions?: (keyof PermissionFlags)[];
  contexts?: InteractionContextType[];
  nsfw?: boolean;
}

export interface SlashCommand<N extends string = string> extends SlashCommandRegistrationConfig<N> {
  nameCombinations: string[];
}
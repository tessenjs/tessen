import { Collection } from "discord.js";
import { TessenLocalizationMap } from "../../generated/localization";

export type Language = "tr" | "en" | "...";

export interface ContentValue {
    [property: string]: ContentValue & ((...args: any[]) => string);
}

export class Locale {
    content = new Collection<Language, ContentValue>();
    interaction = new Collection<Language, { [k: string]: CommandInteractionLocale | ContextMenuLocale }>();
}

type CommandInteractionLocale = {
    names: { [k: string]: string }; // There are multiple patterns for single command. Each of thems translation.
    description: string; // Description of the command.
    options: { [k: string]: string | { name: string, choices: { [k: string]: string } } }; // Options of the command.
}

type ContextMenuLocale = {
    name: string; // Name of the user context menu command.
    description: string; // Description of the user context menu command.
}

export type GetLocalization<TessenId extends string> = TessenId extends keyof TessenLocalizationMap 
  ? TessenLocalizationMap[TessenId] 
  : ContentValue;
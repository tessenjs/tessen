import { Collection } from "discord.js";

export type Language = "tr" | "en" | "...";

export interface ContentValue {
    [property: string]: ContentValue & ((...args: any[]) => string);
}

export class Locale {
    content = new Collection<Language, ContentValue>();
    interaction = new Collection<Language, any>();
}
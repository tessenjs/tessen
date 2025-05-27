import { Collection } from "discord.js";
import { TessenLocalizationMap } from "../../generated/localization";
import { Identifiable } from "$types/Identifiable";
import { DisposeCallback } from "$types/DisposeCallback";

export type Language = "tr" | "en" | "...";

// Internal storage format with function capabilities
export interface ContentValue {
    [property: string]: ContentValue & ((...args: any[]) => string);
}

// Plain object format for input - no function endpoints
export interface PlainLocaleData {
    [property: string]: PlainLocaleData | string;
}

// Generic type to transform any object with strings into ContentValue structure
export type TransformToContentValue<T> = T extends string 
  ? ContentValue & ((...args: any[]) => string)
  : T extends Record<string, any>
    ? {
        [K in keyof T]: TransformToContentValue<T[K]> & ContentValue & ((...args: any[]) => string)
      }
    : never;

// Fixed non-circular type for plain locale input data
export interface PlainLocaleInputData {
    [key: string]: string | PlainLocaleInputData;
}

export interface LocaleConfig {
  id: string;
}

// Function to convert plain objects to ContentValue with function endpoints
function convertToContentValue<T extends PlainLocaleData>(data: T): TransformToContentValue<T> {
    const result: any = {};
    
    for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string') {
            // Create a function that returns the string and can accept arguments for interpolation
            const func = (...args: any[]) => {
                let text = value;
                // Simple placeholder replacement: "Hello {0}, welcome to {1}" with args
                args.forEach((arg, index) => {
                    text = text.replace(`{${index}}`, String(arg));
                });
                return text;
            };
            
            // Assign the function and make it behave like ContentValue
            result[key] = Object.assign(func, {}) as ContentValue & ((...args: any[]) => string);
        } else {
            // Recursively convert nested objects
            result[key] = convertToContentValue(value) as ContentValue & ((...args: any[]) => string);
        }
    }
    
    return result as TransformToContentValue<T>;
}

export class Locale implements Identifiable {
    content = new Collection<Language, ContentValue>();
    interaction = new Collection<Language, { [k: string]: CommandInteractionLocale | ContextMenuLocale }>();
    private unloaders: DisposeCallback[] = [];
    
    constructor(public config: LocaleConfig) {}
    
    get id() {
        return this.config.id;
    }

    loadFile(cfg: {
        id: string;
        filePath: string;
        path: string;
        type: "Content" | "Interaction";
    }): DisposeCallback {
        // Implementation for loading locale files
        // This would typically read from the file system, parse JSON, and convert to ContentValue
        return () => {
            // Cleanup logic for removing loaded locale data
        };
    }

    addLocale(cfg: {
        id: string;
        locale: Language;
        data: PlainLocaleInputData;
    }): DisposeCallback {
        // Convert plain object to ContentValue with function endpoints
        const contentValue = convertToContentValue(cfg.data as PlainLocaleData);
        this.content.set(cfg.locale, contentValue as ContentValue);
        
        return () => {
            this.content.delete(cfg.locale);
        };
    }

    addInteractionLocale(cfg: {
        id: string;
        locale: Language;
        name: string;
        data: CommandInteractionLocale | ContextMenuLocale;
    }): DisposeCallback {
        const currentData = this.interaction.get(cfg.locale) || {};
        currentData[cfg.name] = cfg.data;
        this.interaction.set(cfg.locale, currentData);
        
        return () => {
            const data = this.interaction.get(cfg.locale);
            if (data) {
                delete data[cfg.name];
                if (Object.keys(data).length === 0) {
                    this.interaction.delete(cfg.locale);
                } else {
                    this.interaction.set(cfg.locale, data);
                }
            }
        };
    }

    onUnload(...callbacks: DisposeCallback[]): void {
        this.unloaders.push(...callbacks);
    }

    destroy(): void {
        this.unloaders.forEach((dispose) => dispose());
        this.unloaders.length = 0;
        this.content.clear();
        this.interaction.clear();
    }
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
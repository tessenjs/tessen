import { GetLocalization } from "$lib/Locale";
import { TessenClientEvents } from "./ClientEvents";
import { Guild, User } from "discord.js";

// Localization helper type for events
type EventLocalizationGetter<TessenId extends string = string> = {
  locale: {
    guild: GetLocalization<TessenId>;
    user: GetLocalization<TessenId>;
  };
};

// Enhanced event context with localization
export type EnhancedEventContext<T, TessenId extends string = string> = T & EventLocalizationGetter<TessenId>;

// Extract event context types from the generated ClientEvents with localization
export type EventContextMap<TessenId extends string = string> = {
  [K in keyof TessenClientEvents]: EnhancedEventContext<TessenClientEvents[K], TessenId>;
};

// Generic event registration config with automatic context type inference and localization
export interface EventRegistrationConfig<T extends keyof TessenClientEvents, TessenId extends string = string> {
  event: T;
  handle: (ctx: EventContextMap<TessenId>[T]) => void | Promise<void>;
}

// Custom event registration for non-Discord.js events
export interface CustomEventRegistrationConfig<T = any, TessenId extends string = string> {
  event: string;
  handle: (ctx: EnhancedEventContext<T, TessenId>) => void | Promise<void>;
}

// Union type for all event registration configs
export type AnyEventRegistrationConfig<TessenId extends string = string> = 
  | { [K in keyof TessenClientEvents]: EventRegistrationConfig<K, TessenId> }[keyof TessenClientEvents];

// Event data interface for storage
export interface EventData {
  event: string;
  handle: (ctx: any) => void | Promise<void>;
}

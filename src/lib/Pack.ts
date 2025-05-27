import { Collection } from "discord.js";

import { Identifiable } from "$types/Identifiable";
import { DisposeCallback } from "$types/DisposeCallback";
import { Usable } from "$types/Usable";
import { SlashCommandName, SlashCommand, SlashCommandRegistrationConfig } from "$types/SlashCommand";
import { 
  Interaction, 
  UserContextMenuRegistrationConfig,
  MessageContextMenuRegistrationConfig,
  ButtonRegistrationConfig,
  SelectMenuRegistrationConfig,
  ModalRegistrationConfig,
  UserContextMenuCommand,
  MessageContextMenuCommand
} from "$types/Interactions";
import { generateCombinations } from "$utils/pattern";
import { CommandNameNoCombinationsError } from "./errors/CommandNameNoCombinationsError";
import { CommandNameExceededMaxLengthError } from "./errors/CommandNameExceededMaxLengthError";
import { Inspector } from "$lib/Inspector";
import EventEmitter from "events";
import { AnyEventRegistrationConfig, EventData } from "$types/Events";
import { Locale } from "$lib/Locale";

export interface PackConfig {
  id: string;
}

export class Pack<Config extends PackConfig = PackConfig> implements Identifiable {

  private unloaders: DisposeCallback[] = [];

  data = {
    locales: new Collection<string, Locale>(),
    subPacks: new Collection<string, Pack>(),
    interactions: new Collection<string, Interaction>(),
    events: new Collection<string, EventData>(),
    inspectors: new Collection<string, Inspector>(),
  }

  events = new EventEmitter();

  get id() {
    return this.config.id;
  }

  constructor(public config: Config) {
    if (config.id === "tessen")
      throw new Error("Pack id cannot be 'tessen'.");
  }

  use(...args: Usable[]): DisposeCallback {
    const disposeCallbacks: DisposeCallback[] = [];

    for (const arg of args) {
      switch (true) {
        case arg instanceof Pack: {
          this.data.subPacks.set(arg.id, arg);
          disposeCallbacks.push(() => this.data.subPacks.delete(arg.id));
          break;
        }
        case arg instanceof Inspector: {
          this.data.inspectors.set(arg.id, arg);
          disposeCallbacks.push(() => this.data.inspectors.delete(arg.id));
          break;
        }
      }
    }

    return () => {
      disposeCallbacks.forEach((dispose) => dispose());
      disposeCallbacks.length = 0;
    }
  }

  slashCommand<T extends string>(cfg: SlashCommandRegistrationConfig<T extends SlashCommandName<T> ? T : never>): DisposeCallback {
    if (this.data.interactions.has(cfg.id))
      throw new Error(`Interaction with name ${cfg.id} already exists.`);

    const nameCombinations = generateCombinations(cfg.name);
    
    this.isSlashCommandValid(cfg, nameCombinations);

    const slashCommand: SlashCommand = {
      ...cfg,
      type: 'ChatInput',
      nameCombinations
    };

    this.data.interactions.set(cfg.id, slashCommand);

    return () => this.data.interactions.delete(cfg.id);
  }

  event(cfg: AnyEventRegistrationConfig): DisposeCallback {
    const eventId = `${this.id}:${cfg.event}:${Date.now()}`;
    
    const eventData: EventData = {
      event: cfg.event,
      handle: cfg.handle
    };
    
    this.data.events.set(eventId, eventData);

    return () => this.data.events.delete(eventId);
  }

  userContextMenuCommand<T extends string>(cfg: UserContextMenuRegistrationConfig<T>): DisposeCallback {
    if (this.data.interactions.has(cfg.id))
      throw new Error(`Interaction with name ${cfg.id} already exists.`);

    const contextMenuCommand: UserContextMenuCommand = {
      ...cfg,
      type: 'User'
    };

    this.data.interactions.set(cfg.id, contextMenuCommand);

    return () => this.data.interactions.delete(cfg.id);
  }

  messageContextMenuCommand<T extends string>(cfg: MessageContextMenuRegistrationConfig<T>): DisposeCallback {
    if (this.data.interactions.has(cfg.id))
      throw new Error(`Interaction with name ${cfg.id} already exists.`);

    const contextMenuCommand: MessageContextMenuCommand = {
      ...cfg,
      type: 'Message'
    };

    this.data.interactions.set(cfg.id, contextMenuCommand);

    return () => this.data.interactions.delete(cfg.id);
  }

  button(cfg: ButtonRegistrationConfig): DisposeCallback {
    if (this.data.interactions.has(cfg.id))
      throw new Error(`Interaction with id ${cfg.id} already exists.`);

    const buttonInteraction = {
      ...cfg,
      type: 'Button' as const
    };

    this.data.interactions.set(cfg.id, buttonInteraction);

    return () => this.data.interactions.delete(cfg.id);
  }

  selectMenu(cfg: SelectMenuRegistrationConfig): DisposeCallback {
    if (this.data.interactions.has(cfg.id))
      throw new Error(`Interaction with id ${cfg.id} already exists.`);

    const selectMenuInteraction = {
      ...cfg,
      type: 'SelectMenu' as const
    };

    this.data.interactions.set(cfg.id, selectMenuInteraction);

    return () => this.data.interactions.delete(cfg.id);
  }

  modal(cfg: ModalRegistrationConfig): DisposeCallback {
    if (this.data.interactions.has(cfg.id))
      throw new Error(`Interaction with id ${cfg.id} already exists.`);

    const modalInteraction = {
      ...cfg,
      type: 'Modal' as const
    };

    this.data.interactions.set(cfg.id, modalInteraction);

    return () => this.data.interactions.delete(cfg.id);
  }

  /**
   * @throws {CommandNameNoCombinationsError} if the command has no name combinations.
   * @throws {CommandNameExceededMaxLengthError} if the command has a name combination with more than 3 words or a word with more than 32 characters.
   */
  private isSlashCommandValid<T extends string>(cfg: SlashCommandRegistrationConfig<T extends SlashCommandName<T> ? T : never>, nameCombinations: string[]) {
    if (nameCombinations.length === 0)
      throw new CommandNameNoCombinationsError({ message: `Interaction with id "${cfg.id}" has no name combinations.` });
  
    const nameCombinationsSplited = nameCombinations.map((name) => name.split(" "));

    if (nameCombinationsSplited.some((name) => name.length > 3 || name.some((word) => word.length > 32))) 
      throw new CommandNameExceededMaxLengthError({ 
        message: `Interaction with id "${cfg.id}" has a name combination with more than 3 words. Or a word with more than 32 characters.`,
        nameCombinationsSplited,
      });
    
  }
  
  unload(...callbacks: DisposeCallback[]): void {
    this.unloaders.push(...callbacks);
  }

  destroy(): void {
    this.unloaders.forEach((dispose) => dispose());
    this.unloaders.length = 0;

    this.data.interactions.clear();
    this.data.events.clear();
    this.data.inspectors.clear();
    this.data.locales.clear();
    this.data.subPacks.clear();

    this.events.removeAllListeners();
  }

}
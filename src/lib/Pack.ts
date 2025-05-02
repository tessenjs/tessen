import { Collection } from "discord.js";

import { Identifiable } from "$types/Identifiable";
import { DisposeCallback } from "$types/DisposeCallback";
import { Usable } from "$types/Usable";
import { SlashCommandName, SlashCommandConfig } from "$types/SlashCommand";
import { Interaction } from "$types/Interactions";
import { generateCombinations } from "$utils/pattern";
import { CommandNameNoCombinationsError } from "./errors/CommandNameNoCombinationsError";
import { CommandNameExceededMaxLengthError } from "./errors/CommandNameExceededMaxLengthError";
import EventEmitter from "events";

export interface PackConfig {
  id: string;
}

export class Pack<Config extends PackConfig = PackConfig> implements Identifiable {

  private unloaders: DisposeCallback[] = [];

  data = {
    locales: new Collection<string, any>(),
    subPacks: new Collection<string, Pack>(),
    interactions: new Collection<string, Interaction>(),
    events: new Collection<string, any>(),
    inspectors: new Collection<string, any>(),
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
      }
    }

    return () => {
      disposeCallbacks.forEach((dispose) => dispose());
      disposeCallbacks.length = 0;
    }
  }

  slashCommand<T extends string>(cfg: SlashCommandConfig<T extends SlashCommandName<T> ? T : never>): DisposeCallback {
    if (this.data.interactions.has(cfg.id))
      throw new Error(`Interaction with name ${cfg.id} already exists.`);

    const nameCombinations = generateCombinations(cfg.name);
    
    this.isSlashCommandValid(cfg, nameCombinations);

    this.data.interactions.set(cfg.name, { ...cfg, nameCombinations });

    return () => this.data.interactions.delete(cfg.id);
  }

  /**
   * @throws {CommandNameNoCombinationsError} if the command has no name combinations.
   * @throws {CommandNameExceededMaxLengthError} if the command has a name combination with more than 3 words or a word with more than 32 characters.
   */
  private isSlashCommandValid<T extends string>(cfg: SlashCommandConfig<T extends SlashCommandName<T> ? T : never>, nameCombinations: string[]) {
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
import { Collection } from "discord.js";

import { Identifiable } from "$types/Identifiable";
import { DisposeCallback } from "$types/DisposeCallback";
import { Usable } from "$types/Usable";
import { SlashCommandName, SlashCommandConfig } from "$types/SlashCommand";
import { Interaction } from "$types/Interactions";
import EventEmitter from "events";
import { generateCombinations } from "@/utils/pattern";

export interface PackConfig {
  id: string;
}

export class Pack<Config extends PackConfig = PackConfig> implements Identifiable {

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
    this.data.interactions.set(cfg.name, { ...cfg, nameCombinations });

    return () => this.data.interactions.delete(cfg.id);
  }

}
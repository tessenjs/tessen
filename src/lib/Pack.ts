import { Collection } from "discord.js";

import { Identifiable } from "$types/Identifiable";
import { DisposeCallback } from "$types/DisposeCallback";
import { Usable } from "$types/Usable";
import { SlashCommandName } from "$types/SlashCommandName";
import EventEmitter from "events";

export interface PackConfig {
  id: string;
}

export interface PackData {
  locales: Collection<string, any>;
  subPacks: Collection<string, Pack>;
  interactions: Collection<string, any>;
  events: Collection<string, any>;
  inspectors: Collection<string, any>;
}

export class Pack<Config extends PackConfig = PackConfig> implements Identifiable {

  data: PackData = {
    locales: new Collection<string, any>(),
    subPacks: new Collection<string, Pack>(),
    interactions: new Collection<string, any>(),
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

  slashCommand<T extends string>(slashCommandConfig: {
    id: string;
    name: SlashCommandName<T> extends never ? never : T;
  }) {}
}
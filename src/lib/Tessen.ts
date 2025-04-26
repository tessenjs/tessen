import { Pack, PackData } from "$lib/Pack";
import { Collection } from "discord.js";

export interface TessenConfig {
  id: string;
}

export type CacheData<T> = {
  path: string[];
  data: T;
}

export class Tessen extends Pack<TessenConfig> {

  cache = {
    locales: new Collection<string, CacheData<any>>(),
    subPacks: new Collection<string, CacheData<Pack>>(),
    interactions: new Collection<string, CacheData<any>>(),
    events: new Collection<string, CacheData<any>>(),
    inspectors: new Collection<string, CacheData<any>>(),
  }

  constructor(config: TessenConfig) {
    super(config);
  }

  refresh() {
    this.cache.locales.clear();
    this.cache.subPacks.clear();
    this.cache.interactions.clear();
    this.cache.events.clear();
    this.cache.inspectors.clear();

    this.pushCache(this);
  }

  private pushCache(pack: Pack, path: string[] = []) {
    pack.data.locales.forEach((locale, key) => this.cache.locales.set(key, { path, data: locale }));
    pack.data.interactions.forEach((interaction, key) => this.cache.interactions.set(key, { path, data: interaction }));
    pack.data.events.forEach((event, key) => this.cache.events.set(key, { path, data: event }));
    pack.data.inspectors.forEach((inspector, key) => this.cache.inspectors.set(key, { path, data: inspector }));

    pack.data.subPacks.forEach((subPack, key) => {
      this.cache.subPacks.set(key, { path, data: subPack });
      this.pushCache(subPack, [...path, pack.id]);
    });
  }
}
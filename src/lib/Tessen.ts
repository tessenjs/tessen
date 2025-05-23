import { Pack } from "$lib/Pack";
import { Client, ClientOptions, Collection } from "discord.js";
import { defaultify } from "stuffs"

export type TessenConfigClient = { id: string, options: ClientOptions, token: string };
export type TessenClient = { id: string, client: Client, token: string };

export interface TessenConfig {
  id: string;
  clients: TessenConfigClient[]
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

  locales = {
    content: new Collection<string, any>(),
    interaction: new Collection<string, any>(),
  }

  clients = new Collection<string, TessenClient>();

  constructor(config: TessenConfig) {
    super(config);
  }

  refreshClients() {
    this.clients.clear();
    this.config.clients.forEach(({ id, options, token }) => {
      this.clients.set(id, { id, client: new Client(options), token });
    });
  }

  refresh() {
    this.cache.locales.clear();
    this.cache.subPacks.clear();
    this.cache.interactions.clear();
    this.cache.events.clear();
    this.cache.inspectors.clear();

    this.locales.content.clear();
    this.locales.interaction.clear();

    this.pushCache(this);

    for (const [key, value] of this.cache.locales) {
      let currentContentLocale = (this.locales.content.get(value.data.language) ?? {});
      currentContentLocale = defaultify(value.data.contentLocale, currentContentLocale, true);
      this.locales.content.set(value.data.language, currentContentLocale);

      let currentInteractionLocale = (this.locales.interaction.get(value.data.language) ?? {});
      currentInteractionLocale = defaultify(value.data.interactionLocale, currentInteractionLocale, true);
      this.locales.interaction.set(value.data.language, currentInteractionLocale);
    }
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

  async start() {
    this.refresh();
    for (const tessenClient of this.clients.values()) {
      const originalEmit = tessenClient.client.emit.bind(tessenClient.client);

      tessenClient.client.emit = (event: string, ...args: any[]) => {
        this.events.emit("tessen:clientEvent", { client: tessenClient, event, args });
        this.events.emit(`${tessenClient.id}:${event}`, { client: tessenClient, event, args });
        return originalEmit(event, ...args);
      };

      // @ts-ignore
      tessenClient.client._emit = originalEmit.bind(client);

      await tessenClient.client.login(tessenClient.token);

      this.events.emit("tessen:clientReady", { client: tessenClient });
    }

    this.events.emit("tessen:clientsReady", { clients: this.clients });
  }

  override destroy(): void {
    super.destroy();

    this.clients.forEach((client) => {
      client.client.destroy();
      this.events.emit("tessen:clientDestroy", { client });
    });
  }
}
import { Pack } from "$lib/Pack";
import { Client, ClientOptions, Collection } from "discord.js";
import { defaultify } from "stuffs"
import { handleEvent } from "$utils/handleEvent";
import { TessenClientEventMap } from "$types/ClientEvents";
import { Interaction } from "$types/Interactions";
import { EventData } from "$types/Events";
import { Inspector } from "$lib/Inspector";
import { ContentValue, Locale, InteractionLocaleData } from "$lib/Locale";
import { publishInteractions } from "$utils/publishInteractions";
import { ComponentBuildConfig, ValidComponentId, encodeCustomDataSync, BuiltComponent, encodeCustomData } from "$types/ComponentBuilder";
import { ButtonStyleNames } from "$types/ComponentOptions";
import { TessenComponentMap } from "../../generated/components";
import { ComponentType, ButtonStyle, ModalComponentData } from "discord.js";
import { PackEventMap } from "$types/PackEvents";
import { ResultEventEmitter } from "$types/ResultEventEmitter";

export type TessenConfigClient = { id: string, options: ClientOptions, token: string };
export type TessenClient = { id: string, client: Client, token: string };

export interface TessenConfig<ID extends string = string> {
  id: ID;
  clients: TessenConfigClient[]
}

export type SelectComponent = ComponentType.StringSelect | ComponentType.UserSelect | ComponentType.RoleSelect | ComponentType.ChannelSelect | ComponentType.MentionableSelect;

export type CacheData<T> = {
  path: string[];
  data: T;
}

export class Tessen<ID extends string = string> extends Pack<TessenConfig, ID> {

  // Use the same unified event system as Pack
  events = new ResultEventEmitter<PackEventMap>();

  cache = {
    locales: new Collection<string, CacheData<Locale>>(),
    subPacks: new Collection<string, CacheData<Pack>>(),
    interactions: new Collection<string, CacheData<Interaction>>(),
    events: new Collection<string, CacheData<EventData>>(),
    inspectors: new Collection<string, CacheData<Inspector>>(),
  }

  locales = {
    content: new Collection<string, ContentValue>(),
    interaction: new Collection<string, Record<string, InteractionLocaleData>>(),
  }

  clients = new Collection<string, TessenClient>();

  constructor(config: TessenConfig<ID>) {
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

    const contentLocales: string[] = [];
    const interactionLocales: string[] = [];

    for (const [key, value] of this.cache.locales) {
      const locale = value.data;
      
      for (const [language, contentValue] of locale.content) {
        let currentContentLocale = (this.locales.content.get(language) ?? {});
        currentContentLocale = defaultify(contentValue, currentContentLocale, true);
        this.locales.content.set(language, currentContentLocale);
        if (!contentLocales.includes(language)) contentLocales.push(language);
      }

      for (const [language, interactionValue] of locale.interaction) {
        let currentInteractionLocale = (this.locales.interaction.get(language) ?? {});
        // Properly merge interaction locales by interaction ID
        for (const [interactionId, localeData] of Object.entries(interactionValue)) {
          currentInteractionLocale[interactionId] = localeData;
        }
        this.locales.interaction.set(language, currentInteractionLocale);
        if (!interactionLocales.includes(language)) interactionLocales.push(language);
      }
    }

    this.emitEvent('tessen:cacheRefreshed', { timestamp: Date.now() });
    this.emitEvent('tessen:localesRefreshed', { contentLocales, interactionLocales });
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

      tessenClient.client.emit = (event: string, ...args: unknown[]) => {
        // Handle known Discord.js events through our system
        if (event in TessenClientEventMap) {
          handleEvent(this, tessenClient, event as keyof typeof TessenClientEventMap, args);
        }
        
        // Emit generic Tessen events with proper typing - propagates to all subpacks
        this.emitEvent("tessen:clientEvent", { client: tessenClient, event, args });
        this.emitEvent(`${tessenClient.id}:${event}` as const, { client: tessenClient, event, args });
        
        return originalEmit(event, ...args);
      };

      // @ts-ignore
      tessenClient.client._emit = originalEmit;

      await tessenClient.client.login(tessenClient.token);

      this.emitEvent("tessen:clientReady", { client: tessenClient });
    }

    this.emitEvent("tessen:clientsReady", { clients: this.clients });
  }

  async publish() {
    this.refresh();
    try {
      await publishInteractions(this);
      
      // Emit success events for each client - propagates to all subpacks
      for (const client of this.clients.values()) {
        this.emitEvent('tessen:interactionsPublished', { 
          clientId: client.id, 
          count: this.cache.interactions.size 
        });
      }
    } catch (error) {
      // Emit error events for each client - propagates to all subpacks
      for (const client of this.clients.values()) {
        this.emitEvent('tessen:interactionsPublishError', { 
          clientId: client.id, 
          error: error as Error 
        });
      }
      throw error;
    }
  }

  buildComponent<T extends ValidComponentId>(config: ComponentBuildConfig<T>): BuiltComponent {
    // Find the component registration in cache
    const cachedComponent = this.cache.interactions.get(config.id as string);
    
    if (!cachedComponent) {
      throw new Error(`Component with id "${String(config.id)}" not found. Make sure it's registered in a pack.`);
    }

    const componentData = cachedComponent.data;
    
    // Generate custom ID with encoded data, using synchronous version for sync context
    const customId = encodeCustomDataSync(config.id as string, config.data, this.events);

    // Build button component
    if (componentData.type === 'Button') {
      const buttonOptions = (componentData as any).options || {};
      const overrides = (config.overrides as any) || {};

      // Convert style names to Discord.js ButtonStyle enum values
      const getButtonStyle = (styleName: ButtonStyleNames = 'Primary'): ButtonStyle => {
        const styleMap: Record<ButtonStyleNames, ButtonStyle> = {
          'Primary': ButtonStyle.Primary,
          'Secondary': ButtonStyle.Secondary,
          'Success': ButtonStyle.Success,
          'Danger': ButtonStyle.Danger,
          'Link': ButtonStyle.Link
        };
        return styleMap[styleName];
      };

      const builtButton: BuiltComponent = {
        type: ComponentType.Button,
        style: getButtonStyle(overrides.style || buttonOptions.style),
        label: overrides.label || buttonOptions.label,
        disabled: overrides.disabled ?? buttonOptions.disabled ?? false,
        ...(overrides.url || buttonOptions.url ? { url: overrides.url || buttonOptions.url } : { customId }),
        ...(overrides.emoji || buttonOptions.emoji ? { 
          emoji: typeof (overrides.emoji || buttonOptions.emoji) === 'string' 
            ? { name: overrides.emoji || buttonOptions.emoji }
            : overrides.emoji || buttonOptions.emoji
        } : {})
      };

      return builtButton;
    }

    // Build select menu components
    if (componentData.type === 'StringSelectMenu' || 
        componentData.type === 'UserSelectMenu' || 
        componentData.type === 'RoleSelectMenu' || 
        componentData.type === 'ChannelSelectMenu' || 
        componentData.type === 'MentionableSelectMenu') {
      
      const selectOptions = (componentData as any).options || {};
      const overrides = (config.overrides as any) || {};

      // Map component types to Discord.js ComponentType enum values
      const getSelectMenuType = (type: string): SelectComponent => {
        const typeMap: Record<string, SelectComponent> = {
          'StringSelectMenu': ComponentType.StringSelect,
          'UserSelectMenu': ComponentType.UserSelect,
          'RoleSelectMenu': ComponentType.RoleSelect,
          'ChannelSelectMenu': ComponentType.ChannelSelect,
          'MentionableSelectMenu': ComponentType.MentionableSelect
        };

        return typeMap[type] as any;
      };

      const builtSelectMenu: BuiltComponent = {
        type: getSelectMenuType(componentData.type),
        customId,
        placeholder: overrides.placeholder || selectOptions.placeholder,
        minValues: overrides.minValues ?? selectOptions.minValues ?? 1,
        maxValues: overrides.maxValues ?? selectOptions.maxValues ?? 1,
        disabled: overrides.disabled ?? selectOptions.disabled ?? false,
        ...(componentData.type === 'StringSelectMenu' && selectOptions.options ? { options: selectOptions.options } : {})
      };

      return builtSelectMenu;
    }

    // Build modal component
    if (componentData.type === 'Modal') {
      const modalOptions = (componentData as any).options || {};
      const overrides = (config.overrides as any) || {};

      const builtModal: ModalComponentData = {
        customId,
        title: overrides.title || modalOptions.title || 'Modal',
        components: overrides.components || modalOptions.components || []
      };

      return builtModal;
    }

    throw new Error(`Unsupported component type for id "${String(config.id)}"`);
  }

  // Async version of buildComponent for when sequential processing is needed
  async buildComponentAsync<T extends ValidComponentId>(config: ComponentBuildConfig<T>): Promise<BuiltComponent> {
    // Find the component registration in cache
    const cachedComponent = this.cache.interactions.get(config.id as string);
    
    if (!cachedComponent) {
      throw new Error(`Component with id "${String(config.id)}" not found. Make sure it's registered in a pack.`);
    }

    const componentData = cachedComponent.data;
    
    // Generate custom ID with encoded data, using async version for sequential processing
    const customId = await encodeCustomData(config.id as string, config.data, this.events);

    // Build button component
    if (componentData.type === 'Button') {
      const buttonOptions = (componentData as any).options || {};
      const overrides = (config.overrides as any) || {};

      // Convert style names to Discord.js ButtonStyle enum values
      const getButtonStyle = (styleName: ButtonStyleNames = 'Primary'): ButtonStyle => {
        const styleMap: Record<ButtonStyleNames, ButtonStyle> = {
          'Primary': ButtonStyle.Primary,
          'Secondary': ButtonStyle.Secondary,
          'Success': ButtonStyle.Success,
          'Danger': ButtonStyle.Danger,
          'Link': ButtonStyle.Link
        };
        return styleMap[styleName];
      };

      const builtButton: BuiltComponent = {
        type: ComponentType.Button,
        style: getButtonStyle(overrides.style || buttonOptions.style),
        label: overrides.label || buttonOptions.label,
        disabled: overrides.disabled ?? buttonOptions.disabled ?? false,
        ...(overrides.url || buttonOptions.url ? { url: overrides.url || buttonOptions.url } : { customId }),
        ...(overrides.emoji || buttonOptions.emoji ? { 
          emoji: typeof (overrides.emoji || buttonOptions.emoji) === 'string' 
            ? { name: overrides.emoji || buttonOptions.emoji }
            : overrides.emoji || buttonOptions.emoji
        } : {})
      };

      return builtButton;
    }

    // Build select menu components
    if (componentData.type === 'StringSelectMenu' || 
        componentData.type === 'UserSelectMenu' || 
        componentData.type === 'RoleSelectMenu' || 
        componentData.type === 'ChannelSelectMenu' || 
        componentData.type === 'MentionableSelectMenu') {
      
      const selectOptions = (componentData as any).options || {};
      const overrides = (config.overrides as any) || {};

      // Map component types to Discord.js ComponentType enum values
      const getSelectMenuType = (type: string): SelectComponent => {
        const typeMap: Record<string, SelectComponent> = {
          'StringSelectMenu': ComponentType.StringSelect,
          'UserSelectMenu': ComponentType.UserSelect,
          'RoleSelectMenu': ComponentType.RoleSelect,
          'ChannelSelectMenu': ComponentType.ChannelSelect,
          'MentionableSelectMenu': ComponentType.MentionableSelect
        };

        return typeMap[type] as any;
      };

      const builtSelectMenu: BuiltComponent = {
        type: getSelectMenuType(componentData.type),
        customId,
        placeholder: overrides.placeholder || selectOptions.placeholder,
        minValues: overrides.minValues ?? selectOptions.minValues ?? 1,
        maxValues: overrides.maxValues ?? selectOptions.maxValues ?? 1,
        disabled: overrides.disabled ?? selectOptions.disabled ?? false,
        ...(componentData.type === 'StringSelectMenu' && selectOptions.options ? { options: selectOptions.options } : {})
      };

      return builtSelectMenu;
    }

    // Build modal component
    if (componentData.type === 'Modal') {
      const modalOptions = (componentData as any).options || {};
      const overrides = (config.overrides as any) || {};

      const builtModal: ModalComponentData = {
        customId,
        title: overrides.title || modalOptions.title || 'Modal',
        components: overrides.components || modalOptions.components || []
      };

      return builtModal;
    }

    throw new Error(`Unsupported component type for id "${String(config.id)}"`);
  }

  override destroy(): void {
    super.destroy();

    this.clients.forEach((client) => {
      client.client.destroy();
      this.emitEvent("tessen:clientDestroy", { client });
    });
  }
}
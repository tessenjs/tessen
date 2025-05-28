import { TessenComponentMap } from "../../../generated/components";
import { ButtonComponentOptions, SelectMenuComponentOptions } from "./ComponentOptions";
import { ComponentType, ButtonStyle, ModalComponentData } from "discord.js";

export const CUSTOM_DATA_SPLITTER = "䲜";
export const CUSTOM_DATA_NUMBER_INDICATOR = "㥻";

// Built component types
export interface BuiltButtonComponent {
  type: ComponentType.Button;
  customId?: string;
  style: ButtonStyle;
  label?: string;
  emoji?: { name: string } | { id: string };
  url?: string;
  disabled?: boolean;
}

export interface BuiltSelectMenuComponent {
  type: ComponentType.StringSelect | ComponentType.UserSelect | ComponentType.RoleSelect | ComponentType.ChannelSelect | ComponentType.MentionableSelect;
  customId: string;
  placeholder?: string;
  minValues?: number;
  maxValues?: number;
  disabled?: boolean;
  options?: any[]; // For StringSelect
}

export type BuiltComponent = BuiltButtonComponent | BuiltSelectMenuComponent | ModalComponentData;

// Component build configuration
export interface ComponentBuildConfig<T extends keyof TessenComponentMap = keyof TessenComponentMap> {
  id: T;
  data?: (string | number)[];
  overrides?: TessenComponentMap[T]['type'] extends 'Button' 
    ? ButtonComponentOptions 
    : TessenComponentMap[T]['type'] extends 'StringSelectMenu' | 'UserSelectMenu' | 'RoleSelectMenu' | 'ChannelSelectMenu' | 'MentionableSelectMenu'
    ? SelectMenuComponentOptions
    : never;
}

// Helper type to ensure component ID exists in the map
export type ValidComponentId = keyof TessenComponentMap;

// Utility functions for custom data handling
export function encodeCustomData(baseId: string, data?: (string | number)[]): string {
  if (!data || data.length === 0) {
    return baseId;
  }

  const encodedData = data.map(item => {
    if (typeof item === 'number') {
      return CUSTOM_DATA_NUMBER_INDICATOR + item.toString();
    }
    return item.toString();
  }).join(CUSTOM_DATA_SPLITTER);

  return `${baseId}${CUSTOM_DATA_SPLITTER}${encodedData}`;
}

export function parseCustomData(customId: string): { id: string; data: (string | number)[] } {
  const parts = customId.split(CUSTOM_DATA_SPLITTER);
  const id = parts[0];
  
  if (parts.length === 1) {
    return { id, data: [] };
  }

  const data: (string | number)[] = [];
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    if (part.startsWith(CUSTOM_DATA_NUMBER_INDICATOR)) {
      const numberValue = part.substring(CUSTOM_DATA_NUMBER_INDICATOR.length);
      data.push(Number(numberValue));
    } else {
      data.push(part);
    }
  }

  return { id, data };
}

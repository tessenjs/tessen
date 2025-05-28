import { ButtonStyle, ComponentType, ModalComponentData } from "discord.js";

// Base interface for component registration data
export interface ComponentRegistrationData {
  [componentId: string]: {
    type: 'Button' | 'StringSelectMenu' | 'UserSelectMenu' | 'RoleSelectMenu' | 'ChannelSelectMenu' | 'MentionableSelectMenu' | 'Modal';
    options?: any;
  };
}

// This will be overridden by actual generated files with specific component registrations
export interface TessenComponentMap extends ComponentRegistrationData {}

// Button style mapping
export type ButtonStyleNames = 'Primary' | 'Secondary' | 'Success' | 'Danger' | 'Link';

// Button component options
export interface ButtonComponentOptions {
  label?: string;
  style?: ButtonStyleNames;
  disabled?: boolean;
  emoji?: string;
  url?: string; // Only for Link style buttons
}

// Select menu component options
export interface SelectMenuComponentOptions {
  placeholder?: string;
  disabled?: boolean;
  minValues?: number;
  maxValues?: number;
  options?: Array<{ label: string; value: string; description?: string; emoji?: string }>; // For StringSelect only
}

// Modal component options
export interface ModalComponentOptions {
  title?: string;
  customId?: string;
  components?: any[]; // Modal text input components
}

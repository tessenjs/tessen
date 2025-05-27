import { ContentValue } from "$lib/Locale";

// Base interface that can be extended by specific Tessen instances
export interface GeneratedLocalization {
  [tessenId: string]: ContentValue;
}

// This will be overridden by actual generated files with specific Tessen instance localizations
export interface TessenLocalizationMap extends GeneratedLocalization {}

// Helper type for getting localization by Tessen ID


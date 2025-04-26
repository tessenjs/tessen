import { SlashCommand } from "./SlashCommand";

export type MessageInteraction = never;
export type ActionInteraction = never;
export type Interaction = MessageInteraction | ActionInteraction | SlashCommand;
import { SlashCommand, SlashCommandOption } from "./SlashCommand";
import { TessenDefaultTypes } from "./TessenDefaultTypes";

export type MessageInteraction = never;
export type ActionInteraction = never;
export type Interaction<TTessenTypes extends TessenDefaultTypes> = MessageInteraction | ActionInteraction | SlashCommand<TTessenTypes, string>;
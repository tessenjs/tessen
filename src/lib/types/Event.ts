import { TessenClientEvents } from "./ClientEvents";



export interface EventConfig<T extends keyof TessenClientEvents> {
  id: string,
  name: T,
  handle: (ctx: TessenClientEvents[T]) => void;
}
import { TessenDefaultTypes } from "../types/TessenDefaultTypes";

export class TessenChatInputInteraction<TTT extends TessenDefaultTypes, TID extends string | number | symbol = string | number | symbol> {

  constructor(public id: TID) {
  }

  options(): TID extends keyof TTT["chatInputs"] ? (TTT["chatInputs"][TID] extends { options: any } ? TTT["chatInputs"][TID]["options"] : never) : any {
    return {} as any;
  }
}

let a = new TessenChatInputInteraction("test");
a.id === "test1"
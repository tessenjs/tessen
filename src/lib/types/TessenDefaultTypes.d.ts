// export interface TessenDefaultTypes {
//   chatInputs: Record<string, {
//     options: Record<string, any | any[]>;
//   }>;
//   events: Record<string, any>;
// }

export type TessenDefaultTypes = {
  chatInputs: {
    "tessen:testCommand": {
      options: {
        test: string;
        test2: string[];
        numberValue: number;
      };
    }
  };
  events: Record<string, any>;
};

"@tessen/client"
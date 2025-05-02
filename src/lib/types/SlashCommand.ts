type StringToTuple<
  S extends string,
  R extends any[] = []
> = S extends `${infer _}${infer Rest}`
  ? StringToTuple<Rest, [unknown, ...R]>
  : R;

type StringLength<S extends string> = StringToTuple<S>["length"];

type ValidCombination<S extends string> = StringLength<S> extends infer L
  ? L extends number
    ? L extends 0
      ? never
      : S
    : never
  : never;

export type SlashCommandName<S extends string> =
  S extends `${infer _} ${infer _} ${infer _} ${infer _}`
    ? never
  : S extends `${infer W1} ${infer W2} ${infer W3}`
    ? W1 extends string
      ? W2 extends string
        ? W3 extends string
          ? ValidCombination<W1> extends never
            ? never
            : ValidCombination<W2> extends never
              ? never
              : ValidCombination<W3> extends never
                ? never
                : S
          : never
        : never
      : never
    : S extends `${infer W1} ${infer W2}`
      ? W1 extends string
        ? W2 extends string
          ? ValidCombination<W1> extends never
            ? never
            : ValidCombination<W2> extends never
              ? never
              : S
          : never
        : never
      : ValidCombination<S> extends never
        ? never
        : S

export interface SlashCommand<N extends string = string> {
  id: string;
  name: N;
  nameCombinations: string[];
  description: string;
  handle: (ctx: any) => Promise<void>;
  options?: SlashCommandOption[];
}

export type SlashCommandConfig<N extends string = string> = Omit<
  SlashCommand<N>,
  "nameCombinations"
>;

export type SlashCommandOption = {};
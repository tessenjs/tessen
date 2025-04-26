type StringToTuple<
  S extends string,
  R extends any[] = []
> = S extends `${infer _}${infer Rest}`
  ? StringToTuple<Rest, [unknown, ...R]>
  : R;

type StringLength<S extends string> = StringToTuple<S>["length"];

type Max16<S extends string> = StringLength<S> extends infer L
  ? L extends number
    ? L extends 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16
      ? S
      : never
    : never
  : never;

export type SlashCommandName<S extends string> =
  S extends `${infer W1} ${infer W2} ${infer W3} ${infer W4}`
   ? never // Max 3 words allowed
  : S extends `${infer W1} ${infer W2} ${infer W3}`
   ? W1 extends string
     ? W2 extends string
       ? W3 extends string
         ? Max16<W1> extends never // Check if W1 is too long
           ? never
           : Max16<W2> extends never // Check if W2 is too long
             ? never
             : Max16<W3> extends never // Check if W3 is too long
               ? never
               : `${W1} ${W2} ${W3}` // All words are valid length
          : never
        : never
      : never
    : S extends `${infer W1} ${infer W2}`
      ? W1 extends string
        ? W2 extends string
          ? Max16<W1> extends never // Check if W1 is too long
            ? never
            : Max16<W2> extends never // Check if W2 is too long
              ? never
              : `${W1} ${W2}` // Both words are valid length
          : never
        : never
      : S extends `${infer W1}`
        ? W1 extends string
          ? Max16<W1> extends never // Check if W1 is too long
            ? never
            : `${W1}` // Word is valid length
          : never
        : never
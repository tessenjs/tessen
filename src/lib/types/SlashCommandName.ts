type SplitWords<
  S extends string,
  Acc extends string[] = []
> = Acc["length"] extends 4
  ? Acc
  : S extends `${infer Head} ${infer Tail}`
  ? SplitWords<Tail, [...Acc, Head]>
  : [...Acc, S];

type StringToTuple<
  S extends string,
  R extends any[] = []
> = S extends `${infer _}${infer Rest}`
  ? StringToTuple<Rest, [unknown, ...R]>
  : R;

type StringLength<S extends string> = StringToTuple<S>["length"];

type Max8<S extends string> = StringLength<S> extends infer L
  ? L extends number
  ? L extends 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
  ? S
  : never
  : never
  : never;

type LimitedString<S extends string> = SplitWords<S> extends [
  infer W1,
  infer W2,
  infer W3,
  infer W4
]
  ? W4 extends string
  ? never
  : // 3) 3. kelime 8’i geçmesin
  W3 extends string
  ? Max8<W3> extends never
  ? never
  : // 4) 2. kelime 8’i geçmesin
  W2 extends string
  ? Max8<W2> extends never
  ? never
  : // 5) 1. kelime 8’i geçmesin
  W1 extends string
  ? Max8<W1> extends never
  ? never
  : S
  : never
  : never
  : never
  : never;

// Kullanım:
type Good1 = LimitedString<"hello a a">; // "hello"
type Good2 = LimitedString<"hi there">; // "hi there"
type Good3 = LimitedString<"a a a">; // "short one two"
type Bad1 = LimitedString<"toolongwordhere">; // never (kelime >8 char)
type Bad2 = LimitedString<"a b c d">; // never (3 boşluk >2)

type test = SplitWords<"hello world">; // ['hello', 'world']
type test2 = StringToTuple<"asdz">["length"]; // ['hello', 'world', 'this']

type test3 = Max8<"asdfffffffffffffffff">; // 'hello'

import type { id } from "./id";

type StringLeaves<T> = {
  [K in keyof T]: T[K] extends string ? string : { [P in keyof T[K]]: string };
};

export type Dictionary = StringLeaves<typeof id>;

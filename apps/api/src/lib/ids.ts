import { createId } from "@paralleldrive/cuid2";

/** 24-character lowercase cuid2. Every primary key is generated here. */
export const newId = (): string => createId();

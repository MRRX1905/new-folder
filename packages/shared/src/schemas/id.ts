import { z } from "zod";

/** Public cuid2 identifier: 24 chars, starts with a lowercase letter (TD-07). */
export const cuidSchema = z.string().regex(/^[a-z][a-z0-9]{23}$/, "ID tidak valid.");

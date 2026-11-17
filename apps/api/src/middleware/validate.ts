import type { RequestHandler } from "express";
import type { ZodTypeAny } from "zod";

interface ValidationSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

/**
 * Validates request parts with Zod. Unknown keys are rejected by the schemas
 * themselves (`.strict()`); parsed values replace the raw ones so downstream
 * handlers only see validated data.
 * Express 5 exposes `req.query` as a read-only getter, so the parsed query is
 * exposed as `req.validatedQuery`.
 */
export const validate =
  (schemas: ValidationSchemas): RequestHandler =>
  (req, _res, next) => {
    if (schemas.params) req.params = schemas.params.parse(req.params);
    if (schemas.query) req.validatedQuery = schemas.query.parse(req.query);
    if (schemas.body) req.body = schemas.body.parse(req.body);
    next();
  };

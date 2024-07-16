import { z, ZodError, ZodSchema } from "zod";

export const orError = <TSchema extends ZodSchema>(schema: TSchema) => {
  return schema.and(z.object({ error: z.literal(false) })).or(
    z.object({
      error: z.literal(true),
      type: z.string(),
    }),
  );
};

const PER_PAGE = 25;
export const loadMore = (amount: number) => {
  const page = Math.floor(amount / PER_PAGE) + 1;
  const remove = amount % PER_PAGE;
  return { page, remove };
};

export type RequestReturn<TSchema extends ZodSchema> =
  | { error: true; message: string }
  | { error: false; response: z.infer<TSchema> };
export const request = async <TSchema extends ZodSchema>(
  fetchCall: Promise<Response>,
  schema: TSchema,
): Promise<RequestReturn<TSchema>> => {
  let response;
  try {
    response = orError(schema).parse(await (await fetchCall).json());
  } catch (e) {
    console.warn(
      "API returned invalid JSON or schema didn't match",
      e instanceof ZodError ? e.message : e,
    );
    return { error: true, message: (e as Error)?.message };
  }
  if ("error" in response && response.error) {
    return { error: true, message: response.type };
  }
  return { error: false, response };
};

export type Errorable<T> =
  | (T & { error: false })
  | { error: true; message: string };

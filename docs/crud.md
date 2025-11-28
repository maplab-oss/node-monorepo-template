# CRUD

The goal is to define our model's fields once and derive every CRUD shape from that single source of truth. This avoids duplication, keeps read/write/update logic perfectly in sync, and ensures both TypeScript and Zod validate data consistently at every layer. Defaults, required fields, and read-only metadata all fall out naturally without needing separate hand-written schemas.

One thing to note is that it's important to add default values for most things unless they're absolutely required for record creation.

For example, strings should be never null or undefined, and an empty string is what we want most of the time. Same with arrays, we'd much rather have an empty array than null or undefined, unless null or undefined either encodes some special meaning, or in the case where we have no default value and it becomes a required field for record creation.

```ts
// basicFields.ts

export const basicFields = z.object({
  _id: z.string().default(() => crypto.randomUUID()),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  deletedAt: z.date().nullable().default(null),
});

export const createBasicFields = () => ({
  _id: crypto.randomUUID(),
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
});
```

```ts
// book.ts

export const bookCoreSchema = basicFields.extend({
  title: z.string(),
  author: z.string(),
  price: z.number(),
  category: z.string(),
  tags: z.string().array(),
});

export const bookCoreWithDefaultsSchema = bookCoreSchema.extend({
  category: bookCoreSchema.shape.category.default(""),
  price: bookCoreSchema.shape.price.default(0),
  tags: bookCoreSchema.shape.tags.default([]),
});

export const bookSchema = bookCoreWithDefaultsSchema.extend(basicFields.shape);
export const bookCreateSchema = bookCoreWithDefaultsSchema;

export const bookUpdateSchema = bookCoreSchema
  .partial()
  .extend({ _id: z.string() });

export type BookCreate = z.input<typeof bookCreateSchema>;
export type BookUpdate = z.input<typeof bookUpdateSchema>;
export type Book = z.infer<typeof bookSchema>;

export const createBook = (data: BookCreate, userId: string): BookBase => {
  return bookBaseSchema.parse({
    userId,
    ...bookCreateSchema.parse(data),
    ...createBasicFields(),
  });
};
```

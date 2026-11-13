import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const norm = (v: unknown) => (typeof v === 'string' ? v.trim().toLowerCase() : v);

const posts = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/posts' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(1),
      subtitle: z.string().min(1),
      author: z.string().min(1),
      date: z.coerce.date(),
      updated: z.coerce.date().optional(),
      category: z.preprocess(norm, z.enum(['government', 'participation'])),
      type: z.preprocess(norm, z.enum(['reporting', 'opinion', 'explainer'])),
      image: z.object({ src: image(), alt: z.string().min(1), caption: z.string().optional(), credit: z.string().optional() }).optional(),
      featured: z.boolean().default(false),
      sample: z.boolean().default(false),
      draft: z.boolean().default(false),
    }),
});

const b = { number: z.number().int().positive(), title: z.string(), date: z.coerce.date() };
const puzzles = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/puzzles' }),
  schema: z.discriminatedUnion('game', [
    z.object({
      game: z.literal('crossfloor'), ...b,
      grid: z.array(z.string().regex(/^[A-Z#]{5}$/, 'Rows must be 5 characters: A-Z or #')).length(5),
      clues: z.object({ across: z.record(z.string(), z.string()), down: z.record(z.string(), z.string()) }),
    }),
    z.object({
      game: z.literal('caucus'), ...b,
      groups: z.array(z.object({ name: z.string(), words: z.array(z.string()).length(4) })).length(4),
    }),
    z.object({
      game: z.literal('roll-call'), ...b,
      questions: z.array(z.object({ q: z.string(), choices: z.array(z.string()).min(3).max(4), answer: z.number().int().min(0), why: z.string() })).min(5),
    }),
  ]),
});

export const collections = { posts, puzzles };

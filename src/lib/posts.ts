import { getCollection, type CollectionEntry } from 'astro:content';
export type Post = CollectionEntry<'posts'>;
export const SECTIONS = {
  government: { name: 'Government', blurb: 'How the governor, lawmakers, courts and budgets work for you.' },
  participation: { name: 'Participation', blurb: 'Voting, hearings, petitions and other ways to take part.' },
  opinion: { name: 'Opinion', blurb: 'Arguments and views from writers, labeled and kept apart from reporting.' },
};
export const posts = async () =>
  (await getCollection('posts', (p) => !p.data.draft)).sort((a, b) => +b.data.date - +a.data.date || a.data.title.localeCompare(b.data.title));
export const group = (p: Post) => (p.data.type === 'opinion' ? 'opinion' : p.data.category);
export const kicker = (p: Post) => {
  const c = SECTIONS[p.data.category].name;
  return p.data.type === 'opinion' ? 'Opinion' : p.data.type === 'explainer' ? `Explainer · ${c}` : c;
};
export const fmt = (d: Date) => d.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' });

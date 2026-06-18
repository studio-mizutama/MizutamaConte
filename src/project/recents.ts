import type { RecentProject } from './types';
export type { RecentProject } from './types';

export const RECENTS_CAP = 10;

/** 同 id を除去して先頭に追加し、cap で切り詰める（新しい順）。 */
export const upsertRecent = (
  list: RecentProject[],
  entry: RecentProject,
  cap: number = RECENTS_CAP,
): RecentProject[] => {
  const without = list.filter((r) => r.id !== entry.id);
  return [entry, ...without].slice(0, cap);
};

/** 指定 id を除去する。 */
export const removeRecent = (list: RecentProject[], id: string): RecentProject[] =>
  list.filter((r) => r.id !== id);

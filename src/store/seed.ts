import type { Category } from '../types';

/** Categories available on first launch. Tasks start empty. */
export function defaultCategories(): Category[] {
  return [
    { id: 'cat-work', name: 'Work', color: 'violet' },
    { id: 'cat-personal', name: 'Personal', color: 'emerald' },
    { id: 'cat-learning', name: 'Learning', color: 'sky' },
    { id: 'cat-health', name: 'Health', color: 'rose' },
  ];
}

/** Titles of the sample tasks older versions seeded; removed on upgrade from v1. */
export const LEGACY_SAMPLE_TITLES = new Set([
  'Finalize Q4 roadmap deck',
  'Review pull requests',
  'Book dentist appointment',
  'Read “Designing Data-Intensive Applications” ch. 5',
  'Plan weekend hike',
  'Prototype onboarding flow',
  'Morning run — 5k',
  'Ship design tokens v2',
  'Renew passport',
]);

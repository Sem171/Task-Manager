import type { Priority } from '../types';
import { addDays, atTime, startOfDay } from './date';

export interface ParsedQuickAdd {
  title: string;
  priority?: Priority;
  categoryTag?: string;
  due?: Date;
}

const PRIORITY_TOKENS: Record<string, Priority> = {
  urgent: 'urgent', u: 'urgent', '1': 'urgent',
  high: 'high', h: 'high', '2': 'high',
  medium: 'medium', med: 'medium', m: 'medium', '3': 'medium',
  low: 'low', l: 'low', '4': 'low',
};

const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const WEEKDAY_RE =
  /\b(?:on\s+)?(next\s+)?(sun(?:day)?|mon(?:day)?|tue(?:s|sday)?|wed(?:nesday)?|thu(?:r|rs|rsday)?|fri(?:day)?|sat(?:urday)?)\b/i;

/**
 * Parses natural-language shortcuts out of a quick-add string.
 *   "Ship release notes tomorrow 4pm !high #work"
 *   → { title: "Ship release notes", due: <tomorrow 16:00>, priority: "high", categoryTag: "work" }
 */
export function parseQuickAdd(input: string, now = new Date()): ParsedQuickAdd {
  const result: ParsedQuickAdd = { title: '' };
  const when: { day?: Date; hours?: number; minutes?: number } = {};
  const today = startOfDay(now);
  let text = input;

  text = text.replace(/(^|\s)!(\w+)\b/g, (match, lead: string, token: string) => {
    const p = PRIORITY_TOKENS[token.toLowerCase()];
    if (!p) return match;
    result.priority = p;
    return lead;
  });

  text = text.replace(/(^|\s)#([\w-]+)/g, (_m, lead: string, tag: string) => {
    result.categoryTag = tag;
    return lead;
  });

  text = text.replace(/\b(today|tonight)\b/i, (_m, word: string) => {
    when.day = today;
    if (word.toLowerCase() === 'tonight') when.hours ??= 20;
    return '';
  });

  text = text.replace(/\b(tomorrow|tmrw?)\b/i, () => {
    when.day = addDays(today, 1);
    return '';
  });

  text = text.replace(/\bnext week\b/i, () => {
    when.day = addDays(today, 7);
    return '';
  });

  text = text.replace(/\bin (\d{1,3}) (day|days|week|weeks)\b/i, (_m, n: string, unit: string) => {
    when.day = addDays(today, Number(n) * (unit.toLowerCase().startsWith('week') ? 7 : 1));
    return '';
  });

  text = text.replace(WEEKDAY_RE, (_m, _next: string | undefined, name: string) => {
    const target = WEEKDAYS.indexOf(name.slice(0, 3).toLowerCase());
    let delta = (target - today.getDay() + 7) % 7;
    if (delta === 0) delta += 7;
    when.day = addDays(today, delta);
    return '';
  });

  text = text.replace(
    /\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s?(am|pm)\b|\b(?:at\s+)?([01]?\d|2[0-3]):([0-5]\d)\b/i,
    (_m, h12?: string, m12?: string, ampm?: string, h24?: string, m24?: string) => {
      if (h12) {
        let h = Number(h12) % 12;
        if (ampm?.toLowerCase() === 'pm') h += 12;
        when.hours = h;
        when.minutes = Number(m12 ?? 0);
      } else {
        when.hours = Number(h24);
        when.minutes = Number(m24);
      }
      return '';
    },
  );

  if (when.day || when.hours !== undefined) {
    let due = atTime(when.day ?? today, when.hours ?? 9, when.minutes ?? 0);
    // A bare time that already passed today means tomorrow.
    if (!when.day && due <= now) due = addDays(due, 1);
    result.due = due;
  }

  result.title = text.replace(/\s+/g, ' ').replace(/\s+(on|at|by|due)$/i, '').trim();
  return result;
}

import { create } from 'zustand';
import type { RingtoneId } from '../types';
import { playRingtone } from '../lib/alarmSound';

/** Alarms stop making sound after this long, though the alarm card stays until dismissed. */
const AUTO_SILENCE_MS = 5 * 60_000;

export interface RingingAlarm {
  taskId: string;
  tone: RingtoneId;
}

interface AlarmState {
  /** Alarms waiting to be dismissed; the first one is shown and audible. */
  queue: RingingAlarm[];
  ring: (alarm: RingingAlarm) => void;
  dismiss: (taskId: string) => void;
}

let playing: { alarm: RingingAlarm; stop: () => void; silenceTimer: number } | null = null;

/** Keeps the sound (and the desktop window state) in step with the head of the queue. */
function syncSound(queue: RingingAlarm[]) {
  const head = queue[0] ?? null;
  if (playing?.alarm === head) return;

  if (playing) {
    playing.stop();
    window.clearTimeout(playing.silenceTimer);
    playing = null;
  }
  window.novaDesktop?.setAlarm(!!head);
  if (!head) return;

  const stop = playRingtone(head.tone, { loop: true });
  playing = { alarm: head, stop, silenceTimer: window.setTimeout(stop, AUTO_SILENCE_MS) };
}

export const useAlarmStore = create<AlarmState>()((set, get) => ({
  queue: [],
  ring: (alarm) => {
    if (get().queue.some((a) => a.taskId === alarm.taskId)) return;
    set((s) => ({ queue: [...s.queue, alarm] }));
    syncSound(get().queue);
  },
  dismiss: (taskId) => {
    set((s) => ({ queue: s.queue.filter((a) => a.taskId !== taskId) }));
    syncSound(get().queue);
  },
}));

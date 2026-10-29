import { useEffect } from 'react';
import { unlockAudio } from '../lib/alarmSound';
import { formatDue } from '../lib/date';
import { reminderTime } from '../lib/selectors';
import { useAlarmStore } from '../store/alarmStore';
import { useTaskStore } from '../store/taskStore';
import { toast } from '../store/toastStore';
import { useUIStore } from '../store/uiStore';

const CHECK_INTERVAL_MS = 15_000;

/**
 * Watches tasks for due reminders. Tasks with an alarm ring until dismissed; the rest
 * get an in-app toast (with snooze). Both also raise a system notification when
 * permitted. Each reminder fires once until the due date, reminder offset, or snooze changes;
 * repeating tasks re-arm themselves for the next occurrence as they fire.
 */
export function useReminders() {
  useEffect(() => {
    const check = () => {
      const { tasks, markReminderFired, snoozeReminder } = useTaskStore.getState();
      const now = Date.now();

      for (const task of tasks) {
        if (task.status === 'done' || task.reminderFiredAt) continue;
        const at = reminderTime(task);
        if (!at || at.getTime() > now) continue;

        markReminderFired(task.id);
        const description = task.due ? `Due ${formatDue(task.due)}` : undefined;

        if (task.alarm) {
          useAlarmStore.getState().ring({ taskId: task.id, tone: task.alarm });
        } else {
          toast({
            title: task.title,
            description,
            tone: 'reminder',
            duration: 12_000,
            actions: [
              { label: 'Open', onClick: () => useUIStore.getState().openEditor(task.id) },
              { label: 'Snooze 10m', onClick: () => snoozeReminder(task.id, 10) },
            ],
          });
        }

        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(task.title, { body: description, tag: task.id, requireInteraction: !!task.alarm });
          } catch {
            // Some browsers only allow notifications from a service worker.
          }
        }
      }
    };

    check();
    const id = window.setInterval(check, CHECK_INTERVAL_MS);
    const onVisible = () => document.visibilityState === 'visible' && check();
    document.addEventListener('visibilitychange', onVisible);
    // Browsers block sound until the user interacts with the page once.
    window.addEventListener('pointerdown', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);
}

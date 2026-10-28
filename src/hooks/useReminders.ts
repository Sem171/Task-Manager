import { useEffect } from 'react';
import { formatDue } from '../lib/date';
import { reminderTime } from '../lib/selectors';
import { useTaskStore } from '../store/taskStore';
import { toast } from '../store/toastStore';
import { useUIStore } from '../store/uiStore';

const CHECK_INTERVAL_MS = 15_000;

/**
 * Watches tasks for due reminders. Fires an in-app toast (with snooze) and,
 * when permitted, a system notification. Each reminder fires once until the
 * due date, reminder offset, or snooze changes.
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

        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(task.title, { body: description, tag: task.id });
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
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
}

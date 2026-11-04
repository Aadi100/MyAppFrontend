import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL_ID = 'default';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

let channelReady = false;
const ensureChannel = async () => {
  if (Platform.OS !== 'android' || channelReady) return;
  try {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Reminders & tasks',
      // eslint-disable-next-line import/namespace -- exported via `export *`, which the plugin can't follow
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#22D3EE',
    });
    channelReady = true;
  } catch (e) {
    // Expo Go's Android notification module can reject channel creation (native NPE);
    // scheduling still works there via the fallback channel, so don't fail the sync.
    console.warn('Could not create notification channel:', e?.message || e);
  }
};

export const requestNotificationPermissions = async () => {
  await ensureChannel();
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
};

// Every notification is handed to the OS alarm scheduler with a future DATE trigger, so it is
// delivered even when the app is closed. Never use `trigger: null` here: that fires immediately,
// i.e. only while the app is open running this sync.
const scheduleAt = (date, content) =>
  Notifications.scheduleNotificationAsync({
    content: { ...content, sound: true },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: CHANNEL_ID },
  });

const at = (base, hour, addDays = 0) => {
  const d = new Date(base);
  d.setDate(d.getDate() + addDays);
  d.setHours(hour, 0, 0, 0);
  return d;
};

export const syncAllNotifications = async (reminders = [], todos = []) => {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  // Clear all previously scheduled notifications, then rebuild the full schedule.
  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = new Date();

  for (const reminder of reminders) {
    if (reminder.status !== 'upcoming') continue;
    const due = new Date(reminder.due_date);
    const amountText = `Amount: $${reminder.amount ? reminder.amount : 'N/A'}${reminder.notes ? `
${reminder.notes}` : ''}`;
    const data = { reminderId: reminder.id };

    // Heads-up the day before, 9 AM.
    const dayBefore = at(due, 9, -1);
    if (dayBefore > now) {
      await scheduleAt(dayBefore, { title: `Tomorrow: ${reminder.title}`, body: amountText, data });
    }
    // Due day, 9 AM — or 6 PM if the due day is today and 9 AM already passed.
    let dueAt = at(due, 9);
    if (dueAt <= now && due.toDateString() === now.toDateString()) dueAt = at(due, 18);
    if (dueAt > now) {
      await scheduleAt(dueAt, { title: `Reminder: ${reminder.title}`, body: amountText, data });
    }
  }

  for (const todo of todos) {
    if (!todo.is_done && todo.remind && todo.due_at) {
      const dueAt = new Date(todo.due_at);
      if (dueAt > now) {
        await scheduleAt(dueAt, { title: `To-Do: ${todo.title}`, body: `Priority: ${todo.priority}`, data: { todoId: todo.id } });
      }
    }
  }
};

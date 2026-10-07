import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const requestNotificationPermissions = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
};

export const syncAllNotifications = async (reminders = [], todos = []) => {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  // Clear all previously scheduled notifications
  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = new Date();
  
  // Sync Reminders
  for (const reminder of reminders) {
    if (reminder.status === 'upcoming') {
      const dueDate = new Date(reminder.due_date);
      dueDate.setHours(9, 0, 0, 0);

      if (dueDate > now) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `Reminder: ${reminder.title}`,
            body: `Amount: $${reminder.amount ? reminder.amount : 'N/A'}${reminder.notes ? `\n${reminder.notes}` : ''}`,
            data: { reminderId: reminder.id },
            sound: true,
          },
          trigger: dueDate,
        });
      } else if (dueDate.toDateString() === now.toDateString()) {
         await Notifications.scheduleNotificationAsync({
           content: {
             title: `Reminder: ${reminder.title} is due today!`,
             body: `Amount: $${reminder.amount ? reminder.amount : 'N/A'}${reminder.notes ? `\n${reminder.notes}` : ''}`,
             data: { reminderId: reminder.id },
             sound: true,
           },
           trigger: null,
         });
      }
    }
  }

  // Sync Todos
  for (const todo of todos) {
    if (!todo.is_done && todo.remind && todo.due_at) {
      const dueAt = new Date(todo.due_at);
      if (dueAt > now) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `To-Do: ${todo.title}`,
            body: `Priority: ${todo.priority}`,
            data: { todoId: todo.id },
            sound: true,
          },
          trigger: dueAt,
        });
      }
    }
  }
};

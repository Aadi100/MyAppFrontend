import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';

import * as Updates from 'expo-updates';
import { useStore } from '../store/useStore';

export default function TabLayout() {
  const accessToken = useStore((state) => state.accessToken);

  useEffect(() => {
    async function checkForUpdates() {
      if (__DEV__) return;
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (error) {
        console.log('Error checking for updates:', error);
      }
    }
    checkForUpdates();
  }, []);


  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: '#09090E',
        },
        headerTintColor: '#F8FAFC',
        tabBarStyle: {
          backgroundColor: '#09090E',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.05)',
        },
        tabBarActiveTintColor: '#4ADE80',
        tabBarInactiveTintColor: '#64748B',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color }) => <Ionicons name="list" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="manage"
        options={{
          title: 'Menu',
          tabBarIcon: ({ color }) => <Ionicons name="grid" size={24} color={color} />,
        }}
      />
      <Tabs.Screen name="savings" options={{ href: null }} />
      <Tabs.Screen name="udhar" options={{ href: null }} />
      <Tabs.Screen name="vault" options={{ href: null }} />
      <Tabs.Screen name="payday" options={{ href: null }} />
      <Tabs.Screen name="bank-summary" options={{ href: null }} />
      <Tabs.Screen
        name="bank-comparison"
        options={{
          title: 'Bank Cmp',
          tabBarIcon: ({ color }) => <Ionicons name="business" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: 'Notes',
          tabBarIcon: ({ color }) => <Ionicons name="document-text" size={24} color={color} />,
        }}
      />
      <Tabs.Screen name="login" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="signup" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="recover" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="reset-password" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="profile" options={{ href: null, tabBarStyle: { display: 'none' } }} />
    </Tabs>
  );
}

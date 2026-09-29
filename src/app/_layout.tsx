import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1E1E2D',
        },
        headerTintColor: '#fff',
        tabBarStyle: {
          backgroundColor: '#1E1E2D',
          borderTopWidth: 0,
        },
        tabBarActiveTintColor: '#4ADE80',
        tabBarInactiveTintColor: '#8A8A9E',
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
          title: 'Transactions',
          tabBarIcon: ({ color }) => <Ionicons name="list" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="savings"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="udhar"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="manage"
        options={{
          title: 'Menu',
          tabBarIcon: ({ color }) => <Ionicons name="grid" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="payday"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

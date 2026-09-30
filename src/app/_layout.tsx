import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import * as Location from 'expo-location';
import * as Updates from 'expo-updates';
import { useStore } from '../store/useStore';

export default function TabLayout() {
  const pingLocation = useStore((state) => state.pingLocation);
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

  useEffect(() => {
    let intervalId: any;
    
    const startPinging = async () => {
      if (!accessToken) return;
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      // Ping immediately
      try {
        const loc = await Location.getCurrentPositionAsync({});
        pingLocation(loc.coords.latitude, loc.coords.longitude);
      } catch (e) {
        console.error('Initial location ping failed', e);
      }

      // Ping every 5 minutes
      intervalId = setInterval(async () => {
        try {
          const loc = await Location.getCurrentPositionAsync({});
          pingLocation(loc.coords.latitude, loc.coords.longitude);
        } catch (e) {
          console.error('Location ping failed', e);
        }
      }, 5 * 60 * 1000);
    };

    startPinging();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [accessToken]);

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
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => <Ionicons name="map" size={24} color={color} />,
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
      <Tabs.Screen name="bank-comparison" options={{ href: null }} />
      <Tabs.Screen name="login" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="signup" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="recover" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="reset-password" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="profile" options={{ href: null, tabBarStyle: { display: 'none' } }} />
    </Tabs>
  );
}

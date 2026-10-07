import { Tabs } from 'expo-router';
import { useEffect } from 'react';

import * as Updates from 'expo-updates';
import TabBar from '../ui/TabBar';

export default function TabLayout() {
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
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: '#070A11' } }}>
      <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="transactions" options={{ title: 'Activity' }} />
      <Tabs.Screen name="manage" options={{ title: 'Menu' }} />
      <Tabs.Screen name="bank-comparison" options={{ title: 'Banks' }} />
      <Tabs.Screen name="savings" options={{ href: null }} />
      <Tabs.Screen name="payables" options={{ href: null }} />
      <Tabs.Screen name="vault" options={{ href: null }} />
      <Tabs.Screen name="payday" options={{ href: null }} />
      <Tabs.Screen name="bank-summary" options={{ href: null }} />
      <Tabs.Screen name="notes" options={{ href: null }} />
      <Tabs.Screen name="login" options={{ href: null }} />
      <Tabs.Screen name="signup" options={{ href: null }} />
      <Tabs.Screen name="recover" options={{ href: null }} />
      <Tabs.Screen name="reset-password" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}

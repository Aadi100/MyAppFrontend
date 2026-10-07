import { Tabs, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AppState, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Updates from 'expo-updates';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { Camera as FaceDetectorCamera, type Face } from 'react-native-vision-camera-face-detector';
import TabBar from '../ui/TabBar';
import { useStore } from '../store/useStore';
import { C } from '../ui/theme';

export default function TabLayout() {
  const router = useRouter();
  const accessToken = useStore(state => state.accessToken);
  
  const [isLocked, setIsLocked] = useState(false);
  const appState = useRef(AppState.currentState);
  const backgroundTime = useRef<number | null>(null);

  // Vision Camera Liveness
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const lastFaceTimeRef = useRef<number>(0);
  const livenessEnabled = useRef(false);
  const missingFaceCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleUnlock = async () => {
    const authResult = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Expense Manager',
      fallbackLabel: 'Use Password',
    });
    if (authResult.success) {
      setIsLocked(false);
    }
  };

  useEffect(() => {
    lastFaceTimeRef.current = Date.now();
    (async () => {
      if (!hasPermission) await requestPermission();
      const enabled = await SecureStore.getItemAsync('biometric_enabled');
      livenessEnabled.current = enabled === 'true';
    })();
  }, []);

  const handleFacesDetected = (faces: Face[]) => {
    if (faces.length > 0) {
      lastFaceTimeRef.current = Date.now();
    }
  };

  // Poll on JS thread instead of a native frame processor (no worklets runtime
  // is installed), checking roughly every few seconds whether a face has been
  // seen recently.
  useEffect(() => {
    missingFaceCheckRef.current = setInterval(() => {
      if (!isLocked && livenessEnabled.current && accessToken) {
        if (Date.now() - lastFaceTimeRef.current > 30000) { // 30 seconds
          setIsLocked(true);
          handleUnlock();
        }
      }
    }, 5000);
    return () => {
      if (missingFaceCheckRef.current) clearInterval(missingFaceCheckRef.current);
    };
  }, [isLocked, accessToken]);

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
    const subscription = AppState.addEventListener('change', async nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (backgroundTime.current && accessToken) {
          const diff = Date.now() - backgroundTime.current;
          if (diff > 120000) { // 2 minutes (120,000 ms)
            const isEnabled = await SecureStore.getItemAsync('biometric_enabled');
            if (isEnabled === 'true') {
              setIsLocked(true);
              handleUnlock();
            }
          }
        }
      } else if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        backgroundTime.current = Date.now();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [accessToken]);

  const forceLogout = () => {
    useStore.setState({ accessToken: null, profile: null });
    setIsLocked(false);
    router.replace('/login');
  };

  return (
    <>
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
        <Tabs.Screen name="reminders" options={{ href: null }} />
        <Tabs.Screen name="todos" options={{ href: null }} />
        <Tabs.Screen name="insights" options={{ href: null }} />
        <Tabs.Screen name="login" options={{ href: null }} />
        <Tabs.Screen name="signup" options={{ href: null }} />
        <Tabs.Screen name="recover" options={{ href: null }} />
        <Tabs.Screen name="reset-password" options={{ href: null }} />
        <Tabs.Screen name="profile" options={{ href: null }} />
      </Tabs>

      {hasPermission && device && accessToken && !isLocked && (
        <View style={{ position: 'absolute', top: -2000, width: 10, height: 10, opacity: 0 }} pointerEvents="none">
          <FaceDetectorCamera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={true}
            performanceMode="fast"
            onFacesDetected={handleFacesDetected}
            onError={(e) => console.log('Face detector camera error:', e)}
          />
        </View>
      )}

      {isLocked && (
        <View style={styles.lockOverlay}>
          <Ionicons name="lock-closed" size={64} color={C.acc} />
          <Text style={styles.lockTitle}>App Locked</Text>
          <Text style={styles.lockSub}>For your security, Expense Manager has been locked due to inactivity.</Text>
          
          <TouchableOpacity style={styles.unlockBtn} onPress={handleUnlock}>
            <Ionicons name="finger-print-outline" size={24} color="#0D1321" />
            <Text style={styles.unlockBtnText}>Unlock Now</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={{ marginTop: 24 }} onPress={forceLogout}>
            <Text style={{ color: C.rose, fontSize: 15, fontWeight: '600' }}>Log out instead</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  lockOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#070A11',
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30
  },
  lockTitle: { color: C.text, fontSize: 24, fontWeight: '800', marginTop: 24 },
  lockSub: { color: C.mute, fontSize: 15, textAlign: 'center', marginTop: 12, lineHeight: 22 },
  unlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.acc,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 40,
    gap: 10
  },
  unlockBtnText: { color: '#0D1321', fontSize: 16, fontWeight: '700' }
});

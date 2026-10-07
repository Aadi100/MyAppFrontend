import { Tabs, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AppState, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Updates from 'expo-updates';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { Camera, useCameraDevice, useFrameProcessor } from 'react-native-vision-camera';
import { useFaceDetector } from 'react-native-vision-camera-face-detector';
import { runOnJS } from 'react-native-worklets-core';
import TabBar from '../ui/TabBar';
import { useStore } from '../store/useStore';
import { C } from '../ui/theme';

export default function TabLayout() {
  const router = useRouter();
  const accessToken = useStore(state => state.accessToken);
  
  const [isLocked, setIsLocked] = useState(false);
  const appState = useRef(AppState.currentState);
  const backgroundTime = useRef(null);

  // Vision Camera Liveness
  const [hasPermission, setHasPermission] = useState(false);
  const device = useCameraDevice('front');
  const { detectFaces } = useFaceDetector({ performanceMode: 'fast', contourMode: 'none', landmarkMode: 'none', classificationMode: 'none' });
  const lastFaceTime = useRef(Date.now());
  const livenessEnabled = useRef(false);

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
      const enabled = await SecureStore.getItemAsync('biometric_enabled');
      livenessEnabled.current = enabled === 'true';
    })();
  }, []);

  const updateFaceTime = () => { lastFaceTime.current = Date.now(); };
  
  const handleMissingFace = () => {
    if (!isLocked && livenessEnabled.current && accessToken) {
      if (Date.now() - lastFaceTime.current > 30000) { // 30 seconds
        setIsLocked(true);
        handleUnlock();
      }
    }
  };

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    const faces = detectFaces(frame);
    if (faces.length > 0) {
      runOnJS(updateFaceTime)();
    } else {
      runOnJS(handleMissingFace)();
    }
  }, [detectFaces]);

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

  const handleUnlock = async () => {
    const authResult = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Expense Manager',
      fallbackLabel: 'Use Password',
    });
    if (authResult.success) {
      setIsLocked(false);
    }
  };

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
        <Tabs.Screen name="login" options={{ href: null }} />
        <Tabs.Screen name="signup" options={{ href: null }} />
        <Tabs.Screen name="recover" options={{ href: null }} />
        <Tabs.Screen name="reset-password" options={{ href: null }} />
        <Tabs.Screen name="profile" options={{ href: null }} />
      </Tabs>

      {hasPermission && device && accessToken && !isLocked && (
        <View style={{ position: 'absolute', top: -2000, width: 10, height: 10, opacity: 0 }} pointerEvents="none">
          <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={true}
            frameProcessor={frameProcessor}
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
    ...StyleSheet.absoluteFillObject,
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

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useStore } from '../store/useStore';
import { Screen, Input, PrimaryButton } from '../ui/kit';
import Logo from '../ui/Logo';
import { C } from '../ui/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasBiometric, setHasBiometric] = useState(false);
  const router = useRouter();
  const login = useStore(state => state.login);
  const accessToken = useStore(state => state.accessToken);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (accessToken) {
      router.replace('/');
    }
  }, [accessToken]);

  useEffect(() => {
    const checkBiometric = async () => {
      const isEnabled = await SecureStore.getItemAsync('biometric_enabled');
      const savedEmail = await SecureStore.getItemAsync('saved_email');
      const savedPassword = await SecureStore.getItemAsync('saved_password');
      if (savedEmail && savedPassword) {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (hasHardware && isEnrolled) {
          setHasBiometric(true);
          if (isEnabled === 'true') {
            handleBiometricAuth(savedEmail, savedPassword);
          }
        }
      }
    };
    if (!accessToken) {
      checkBiometric();
    }
  }, [accessToken]);

  const handleBiometricAuth = async (savedEmail?: string, savedPassword?: string) => {
    const e = savedEmail || await SecureStore.getItemAsync('saved_email');
    const p = savedPassword || await SecureStore.getItemAsync('saved_password');
    if (!e || !p) return;

    const authResult = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Login to Expense Manager',
      fallbackLabel: 'Use Password',
    });
    
    if (authResult.success) {
      setLoading(true);
      const success = await login(e, p);
      setLoading(false);
      if (success) {
        router.replace('/');
      }
    }
  };

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    if (success) {
      await SecureStore.setItemAsync('saved_email', email);
      await SecureStore.setItemAsync('saved_password', password);
      
      const isEnabled = await SecureStore.getItemAsync('biometric_enabled');
      if (isEnabled === null) {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (hasHardware && isEnrolled) {
          Alert.alert(
            'Enable Biometrics?',
            'Do you want to use Face ID / Fingerprint to log in next time?',
            [
              { text: 'Not now', onPress: () => { SecureStore.setItemAsync('biometric_enabled', 'false'); router.replace('/'); } },
              { text: 'Yes', onPress: () => { SecureStore.setItemAsync('biometric_enabled', 'true'); router.replace('/'); } }
            ]
          );
          return;
        }
      }
      
      router.replace('/');
    }
  };

  return (
    <Screen tabPad={false} style={{ paddingTop: 36 }}>
      <View style={{ alignItems: 'center', marginTop: 20 }}>
        <Logo />
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.sub}>Sign in to continue to Expense Manager</Text>
      </View>

      <View style={{ gap: 12, marginTop: 36 }}>
        <Input icon="mail-outline" placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
        <Input icon="lock-closed-outline" placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry={!show}
          right={show ? 'eye-off-outline' : 'eye-outline'} onRightPress={() => setShow(!show)} />
        <TouchableOpacity style={{ alignSelf: 'flex-end' }} onPress={() => router.push('/recover')}>
          <Text style={styles.link}>Forgot password?</Text>
        </TouchableOpacity>
        <PrimaryButton title="Sign in" onPress={handleLogin} loading={loading} />
        {hasBiometric && (
          <TouchableOpacity 
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, gap: 8 }}
            onPress={() => handleBiometricAuth()}
          >
            <Ionicons name="finger-print-outline" size={24} color={C.text} />
            <Text style={{ color: C.text, fontSize: 16, fontWeight: '600' }}>Log in with Biometrics</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.divider}>
        <View style={styles.line} /><Text style={styles.dividerText}>NEW HERE?</Text><View style={styles.line} />
      </View>
      <PrimaryButton title="Create an account" variant="ghost" onPress={() => router.push('/signup')} />

      <View style={styles.secure}>
        <Ionicons name="shield-checkmark-outline" size={15} color={C.dim} />
        <Text style={{ color: C.dim, fontSize: 12 }}>Your data is encrypted and private</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: C.text, fontSize: 32, fontWeight: '800', letterSpacing: -0.8, marginTop: 20 },
  sub: { color: C.mute, fontSize: 14, marginTop: 8 },
  link: { color: C.acc, fontSize: 13, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 28 },
  line: { flex: 1, height: 1, backgroundColor: C.line },
  dividerText: { color: C.dim, fontSize: 12, letterSpacing: 1 },
  secure: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 32 },
});

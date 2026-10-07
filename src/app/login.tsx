import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { Screen, Input, PrimaryButton } from '../ui/kit';
import Logo from '../ui/Logo';
import { C } from '../ui/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const login = useStore(state => state.login);
  const accessToken = useStore(state => state.accessToken);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (accessToken) {
      router.replace('/');
    }
  }, [accessToken]);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    if (success) {
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

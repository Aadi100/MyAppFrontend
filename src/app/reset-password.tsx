import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useStore } from '../store/useStore';
import { Screen, Input, PrimaryButton, IconBox } from '../ui/kit';
import { C } from '../ui/theme';

const score = (p: string) => {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
};

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams();
  const token = params.access_token || params.token || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const resetPassword = useStore(state => state.resetPassword);

  const handleReset = async () => {
    if (!password) {
      Alert.alert('Error', 'Please enter a new password.');
      return;
    }
    if (confirm && confirm !== password) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    if (!token) {
      Alert.alert('Error', 'Missing recovery token. Please try clicking the link in your email again.');
      return;
    }
    setLoading(true);
    const success = await resetPassword(token, password);
    setLoading(false);
    if (success) {
      Alert.alert('Success!', 'Your password has been reset. You can now login with your new password.', [
        { text: 'Login', onPress: () => router.replace('/login') }
      ]);
    }
  };

  const s = score(password);
  const col = s <= 1 ? C.rose : s === 2 ? C.amber : C.acc;

  return (
    <Screen tabPad={false} style={{ paddingTop: 36 }}>
      <View style={{ alignItems: 'center', marginTop: 40 }}>
        <IconBox name="key-outline" color={C.violet} size={86} />
        <Text style={styles.title}>Set a new password</Text>
        <Text style={styles.sub}>Choose something strong you haven&apos;t used before.</Text>
      </View>

      <View style={{ gap: 12, marginTop: 34 }}>
        <Input icon="lock-closed-outline" placeholder="New password" value={password} onChangeText={setPassword} secureTextEntry={!show}
          right={show ? 'eye-off-outline' : 'eye-outline'} onRightPress={() => setShow(!show)} />
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {[0, 1, 2, 3].map(i => <View key={i} style={{ flex: 1, height: 6, borderRadius: 9, backgroundColor: i < s ? col : 'rgba(255,255,255,0.07)' }} />)}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: s >= 3 ? C.acc : C.mute, fontSize: 12, fontWeight: '700' }}>{password ? (s <= 1 ? 'Weak password' : s === 2 ? 'Okay password' : 'Strong password') : ' '}</Text>
          <Text style={{ color: C.dim, fontSize: 12 }}>8+ chars, mixed case, number</Text>
        </View>
        <Input icon="lock-closed-outline" placeholder="Confirm password" value={confirm} onChangeText={setConfirm} secureTextEntry={!show}
          right={confirm && confirm === password ? 'checkmark' : undefined} />
        <PrimaryButton title="Reset password" onPress={handleReset} loading={loading} style={{ marginTop: 8 }} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: C.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.6, marginTop: 24, textAlign: 'center' },
  sub: { color: C.mute, fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 22, maxWidth: 300 },
});

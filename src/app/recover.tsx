import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { Screen, Header, Input, PrimaryButton, IconBox } from '../ui/kit';
import { C } from '../ui/theme';

export default function RecoverScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();
  const recoverPassword = useStore(state => state.recoverPassword);

  const handleRecover = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }
    setLoading(true);
    const success = await recoverPassword(email);
    setLoading(false);
    if (success) setSent(true);
  };

  return (
    <Screen tabPad={false}>
      <View style={{ alignItems: 'flex-start' }}><Header onBack={() => router.back()} title="" /></View>

      {!sent ? (
        <>
          <View style={styles.hero}>
            <IconBox name="lock-open-outline" color={C.acc} size={86} />
            <Text style={styles.title}>Forgot password?</Text>
            <Text style={styles.sub}>No worries. Enter your email and we&apos;ll send you a link to reset it.</Text>
          </View>
          <View style={{ gap: 16, marginTop: 34 }}>
            <Input icon="mail-outline" placeholder="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
            <PrimaryButton title="Send reset link" onPress={handleRecover} loading={loading} />
            <TouchableOpacity style={styles.back} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={16} color={C.acc} />
              <Text style={{ color: C.acc, fontWeight: '700' }}>Back to sign in</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <View style={styles.hero}>
            <IconBox name="mail-outline" color={C.acc} size={92} />
            <Text style={styles.title}>Check your inbox</Text>
            <Text style={styles.sub}>If an account exists, a recovery link has been sent to <Text style={{ color: C.text, fontWeight: '700' }}>{email}</Text>.</Text>
          </View>
          <View style={{ gap: 12, marginTop: 34 }}>
            <PrimaryButton title="Back to sign in" onPress={() => router.back()} />
            <TouchableOpacity style={{ alignSelf: 'center', marginTop: 6 }} onPress={handleRecover}>
              <Text style={{ color: C.dim, fontSize: 12.5 }}>Didn&apos;t get it? <Text style={{ color: C.acc, fontWeight: '700' }}>Resend link</Text></Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginTop: 40, paddingHorizontal: 10 },
  title: { color: C.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.6, marginTop: 24, textAlign: 'center' },
  sub: { color: C.mute, fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 22, maxWidth: 300 },
  back: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 6 },
});

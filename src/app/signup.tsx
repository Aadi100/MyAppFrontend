import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '../store/useStore';
import { Screen, Header, Input, PrimaryButton } from '../ui/kit';
import { C } from '../ui/theme';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const signup = useStore(state => state.signup);

  const handleSignup = async () => {
    if (!email || !password || !name) {
      Alert.alert('Error', 'Name, Email, and Password are required.');
      return;
    }
    setLoading(true);
    const success = await signup(email, password, name, phone);
    setLoading(false);
    if (success) {
      Alert.alert('Success', 'Account created! Please check your email to confirm.', [
        { text: 'OK', onPress: () => router.replace('/login') }
      ]);
    }
  };

  return (
    <Screen tabPad={false}>
      <View style={{ alignItems: 'flex-start' }}><Header onBack={() => router.back()} title="" /></View>
      <Text style={styles.title}>Create your{'\n'}account</Text>
      <Text style={styles.sub}>Start tracking every rupee in minutes.</Text>

      <View style={{ gap: 12, marginTop: 26 }}>
        <Input icon="person-outline" placeholder="Full name" value={name} onChangeText={setName} />
        <Input icon="call-outline" placeholder="Phone number (optional)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Input icon="mail-outline" placeholder="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
        <Input icon="lock-closed-outline" placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry={!show}
          right={show ? 'eye-off-outline' : 'eye-outline'} onRightPress={() => setShow(!show)} />
        <PrimaryButton title="Create account" onPress={handleSignup} loading={loading} style={{ marginTop: 8 }} />
      </View>

      <View style={styles.foot}>
        <Text style={{ color: C.mute, fontSize: 14 }}>Already have an account? </Text>
        <TouchableOpacity onPress={() => router.replace('/login')}><Text style={{ color: C.acc, fontWeight: '700', fontSize: 14 }}>Sign in</Text></TouchableOpacity>
      </View>
      <Text style={styles.terms}>By continuing you agree to the Terms of Service{'\n'}and Privacy Policy.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: C.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.8, lineHeight: 36, marginTop: 8 },
  sub: { color: C.mute, fontSize: 14, marginTop: 8 },
  foot: { flexDirection: 'row', justifyContent: 'center', marginTop: 22 },
  terms: { color: C.dim, fontSize: 12, textAlign: 'center', marginTop: 26, lineHeight: 19 },
});

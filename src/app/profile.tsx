import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { useStore } from '../store/useStore';
import { Screen, Header, Field, Input, PrimaryButton, ConfirmDialog } from '../ui/kit';
import { C } from '../ui/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const profile = useStore(state => state.profile);
  const updateProfile = useStore(state => state.updateProfile);

  const [name, setName] = useState(profile?.name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [loading, setLoading] = useState(false);
  const [logoutAsk, setLogoutAsk] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    if (profile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(profile.name || '');
      setEmail(profile.email || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  useEffect(() => {
    SecureStore.getItemAsync('biometric_enabled').then(val => {
      setBiometricEnabled(val === 'true');
    });
  }, []);

  const handleToggleBiometric = async (val: boolean) => {
    if (val) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !isEnrolled) {
        alert('Biometrics not available or not enrolled on this device.');
        return;
      }
      await SecureStore.setItemAsync('biometric_enabled', 'true');
      setBiometricEnabled(true);
    } else {
      await SecureStore.setItemAsync('biometric_enabled', 'false');
      setBiometricEnabled(false);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    await updateProfile({ name, email, phone });
    setLoading(false);
  };

  const handleLogout = () => {
    useStore.setState({ accessToken: null, profile: null });
    router.replace('/login');
  };

  return (
    <>
      <Screen tabPad={false}>
        <Header title="My profile" onBack={() => router.back()} right={
          <TouchableOpacity onPress={() => setLogoutAsk(true)} style={styles.logout}>
            <Ionicons name="log-out-outline" size={20} color={C.rose} />
          </TouchableOpacity>
        } />

        <View style={{ alignItems: 'center', marginTop: 6 }}>
          <LinearGradient colors={['#67E8F9', '#60A5FA']} style={styles.ring}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{name ? name.charAt(0).toUpperCase() : 'U'}</Text>
            </View>
          </LinearGradient>
          <Text style={styles.name}>{name || 'Your name'}</Text>
          <Text style={styles.email}>{profile?.email}</Text>
        </View>

        <View style={{ marginTop: 14 }}>
          <Field label="Full name"><Input icon="person-outline" placeholder="Name" value={name} onChangeText={setName} /></Field>
          <Field label="Email address"><Input icon="mail-outline" placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" /></Field>
          <Field label="Phone number"><Input icon="call-outline" placeholder="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" /></Field>
          
          <View style={styles.settingRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="finger-print-outline" size={24} color={C.text} />
              <Text style={styles.settingLabel}>Enable Biometric Login</Text>
            </View>
            <Switch value={biometricEnabled} onValueChange={handleToggleBiometric} trackColor={{ true: C.acc }} />
          </View>

          <PrimaryButton title="Save changes" onPress={handleUpdate} loading={loading} style={{ marginTop: 24 }} />
        </View>

        <Text style={styles.version}>Expense Manager · v1.0.0</Text>
      </Screen>

      <ConfirmDialog visible={logoutAsk} title="Log out?" message="You'll need to sign in again to see your data." confirmLabel="Log out"
        onCancel={() => setLogoutAsk(false)} onConfirm={() => { setLogoutAsk(false); handleLogout(); }} />
    </>
  );
}

const styles = StyleSheet.create({
  logout: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(251,113,133,0.1)', borderWidth: 1, borderColor: 'rgba(251,113,133,0.25)', alignItems: 'center', justifyContent: 'center' },
  ring: { width: 106, height: 106, borderRadius: 53, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#0D1321', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: C.acc, fontSize: 38, fontWeight: '800' },
  name: { color: C.text, fontSize: 22, fontWeight: '800', marginTop: 14 },
  email: { color: C.mute, fontSize: 14, marginTop: 4 },
  version: { color: C.dim, fontSize: 12, textAlign: 'center', marginTop: 26 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.card, padding: 16, borderRadius: 16, marginTop: 12 },
  settingLabel: { color: C.text, fontSize: 16, fontWeight: '600' },
});

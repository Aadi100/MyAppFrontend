import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../store/useStore';

export default function ProfileScreen() {
  const router = useRouter();
  const profile = useStore(state => state.profile);
  const updateProfile = useStore(state => state.updateProfile);
  
  const [name, setName] = useState(profile?.name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setEmail(profile.email || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>My Profile</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={24} color="#F87171" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarContainer}>
          <LinearGradient colors={['#4ADE80', '#10B981']} style={styles.avatar}>
            <Text style={styles.avatarText}>{name ? name.charAt(0).toUpperCase() : 'U'}</Text>
          </LinearGradient>
          <Text style={styles.profileEmail}>{profile?.email}</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Full Name</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#8A8A9E" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Name" placeholderTextColor="#8A8A9E" value={name} onChangeText={setName} />
          </View>

          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#8A8A9E" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#8A8A9E" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
          </View>

          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color="#8A8A9E" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Phone" placeholderTextColor="#8A8A9E" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate} disabled={loading}>
            <LinearGradient colors={['#4ADE80', '#10B981']} style={styles.gradient} start={{x: 0, y: 0}} end={{x: 1, y: 1}}>
              {loading ? <ActivityIndicator color="#12121D" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090E' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 24, backgroundColor: '#09090E' },
  title: { fontSize: 24, fontWeight: '800', color: '#F8FAFC', letterSpacing: -0.5 },
  backBtn: { padding: 4, width: 44, height: 44, borderRadius: 22, backgroundColor: '#13131A', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  logoutBtn: { padding: 4, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(248, 113, 113, 0.1)', justifyContent: 'center', alignItems: 'center' },
  content: { padding: 24 },
  avatarContainer: { alignItems: 'center', marginBottom: 40 },
  avatar: { width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center', marginBottom: 16, shadowColor: '#10B981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  avatarText: { fontSize: 40, fontWeight: '900', color: '#0F1015' },
  profileEmail: { fontSize: 16, color: '#94A3B8', fontWeight: '500' },
  form: { gap: 20 },
  label: { color: '#94A3B8', fontSize: 13, marginBottom: -10, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', borderRadius: 16, paddingHorizontal: 16, height: 60, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#F8FAFC', fontSize: 16, fontWeight: '500' },
  saveBtn: { height: 60, borderRadius: 16, overflow: 'hidden', marginTop: 24, shadowColor: '#10B981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  gradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { color: '#0F1015', fontSize: 16, fontWeight: '800' },
});

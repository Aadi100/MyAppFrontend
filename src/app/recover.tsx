import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../store/useStore';

export default function RecoverScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
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
    if (success) {
      Alert.alert('Sent!', 'If an account exists, a recovery link has been sent to your email.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#8A8A9E" />
        </TouchableOpacity>
        
        <View style={styles.header}>
          <Ionicons name="lock-open" size={60} color="#4ADE80" />
          <Text style={styles.title}>Recover Password</Text>
          <Text style={styles.subtitle}>Enter your email to receive a reset link.</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#8A8A9E" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#8A8A9E" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
          </View>

          <TouchableOpacity style={styles.loginBtn} onPress={handleRecover} disabled={loading}>
            <LinearGradient colors={['#4ADE80', '#10B981']} style={styles.gradient} start={{x: 0, y: 0}} end={{x: 1, y: 1}}>
              {loading ? <ActivityIndicator color="#12121D" /> : <Text style={styles.loginBtnText}>Send Reset Link</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#12121D' },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  backBtn: { position: 'absolute', top: 50, left: 24, padding: 8, zIndex: 10 },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginTop: 16 },
  subtitle: { fontSize: 16, color: '#8A8A9E', marginTop: 8, textAlign: 'center' },
  form: { gap: 16 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1E2D', borderRadius: 12, paddingHorizontal: 16, height: 56 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#fff', fontSize: 16 },
  loginBtn: { height: 56, borderRadius: 12, overflow: 'hidden', marginTop: 8 },
  gradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loginBtnText: { color: '#12121D', fontSize: 16, fontWeight: 'bold' },
});

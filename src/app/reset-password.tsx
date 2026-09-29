import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../store/useStore';

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams();
  const token = params.access_token || params.token || '';
  
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const resetPassword = useStore(state => state.resetPassword);

  const handleReset = async () => {
    if (!password) {
      Alert.alert('Error', 'Please enter a new password.');
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

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="key" size={60} color="#4ADE80" />
          <Text style={styles.title}>Set New Password</Text>
          <Text style={styles.subtitle}>Enter your new password below.</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#8A8A9E" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="New Password" placeholderTextColor="#8A8A9E" value={password} onChangeText={setPassword} secureTextEntry />
          </View>

          <TouchableOpacity style={styles.loginBtn} onPress={handleReset} disabled={loading}>
            <LinearGradient colors={['#4ADE80', '#10B981']} style={styles.gradient} start={{x: 0, y: 0}} end={{x: 1, y: 1}}>
              {loading ? <ActivityIndicator color="#12121D" /> : <Text style={styles.loginBtnText}>Reset Password</Text>}
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

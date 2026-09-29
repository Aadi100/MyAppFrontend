import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../store/useStore';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#8A8A9E" />
        </TouchableOpacity>
        
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#8A8A9E" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#8A8A9E" value={name} onChangeText={setName} />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color="#8A8A9E" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Phone Number (Optional)" placeholderTextColor="#8A8A9E" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#8A8A9E" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#8A8A9E" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#8A8A9E" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#8A8A9E" value={password} onChangeText={setPassword} secureTextEntry />
          </View>

          <TouchableOpacity style={styles.loginBtn} onPress={handleSignup} disabled={loading}>
            <LinearGradient colors={['#4ADE80', '#10B981']} style={styles.gradient} start={{x: 0, y: 0}} end={{x: 1, y: 1}}>
              {loading ? <ActivityIndicator color="#12121D" /> : <Text style={styles.loginBtnText}>Sign Up</Text>}
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
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 16, color: '#8A8A9E', marginTop: 8 },
  form: { gap: 16 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1E2D', borderRadius: 12, paddingHorizontal: 16, height: 56 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#fff', fontSize: 16 },
  loginBtn: { height: 56, borderRadius: 12, overflow: 'hidden', marginTop: 8 },
  gradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loginBtnText: { color: '#12121D', fontSize: 16, fontWeight: 'bold' },
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';

export default function VaultScreen() {
  const passwordEntries = useStore((state) => state.passwordEntries);
  const fetchPasswordEntries = useStore((state) => state.fetchPasswordEntries);
  const addPasswordEntry = useStore((state) => state.addPasswordEntry);
  const revealPasswordEntry = useStore((state) => state.revealPasswordEntry);
  const deletePasswordEntry = useStore((state) => state.deletePasswordEntry);

  const [modalVisible, setModalVisible] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [form, setForm] = useState({ service_name: '', username: '', password: '', website_url: '', category: '', notes: '' });

  useEffect(() => {
    fetchPasswordEntries();
  }, []);

  const handleReveal = async (id) => {
    if (revealedPasswords[id]) {
      // Toggle off
      setRevealedPasswords({ ...revealedPasswords, [id]: null });
    } else {
      // Fetch and reveal
      const password = await revealPasswordEntry(id);
      if (password) {
        setRevealedPasswords({ ...revealedPasswords, [id]: password });
      } else {
        alert("Failed to decrypt password.");
      }
    }
  };

  const handleSave = async () => {
    if (!form.service_name || !form.password) {
      alert("Service Name and Password are required!");
      return;
    }
    await addPasswordEntry(form);
    setModalVisible(false);
    setForm({ service_name: '', username: '', password: '', website_url: '', category: '', notes: '' });
  };

  const handleDelete = (id) => {
    deletePasswordEntry(id);
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.headerRow}>
          <Text style={styles.header}>Password Vault</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
            <Ionicons name="add" size={24} color="#12121D" />
          </TouchableOpacity>
        </View>

        {passwordEntries.length === 0 && (
          <Text style={styles.emptyText}>Your vault is empty. Tap + to add a password.</Text>
        )}

        {passwordEntries.map((entry) => (
          <View key={entry.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.serviceName}>{entry.service_name}</Text>
                {entry.username ? <Text style={styles.subtext}>{entry.username}</Text> : null}
              </View>
              <TouchableOpacity onPress={() => handleDelete(entry.id)}>
                <Ionicons name="trash-outline" size={20} color="#F87171" />
              </TouchableOpacity>
            </View>

            <View style={styles.passwordRow}>
              <Text style={styles.passwordText}>
                {revealedPasswords[entry.id] ? revealedPasswords[entry.id] : '••••••••••••'}
              </Text>
              <TouchableOpacity onPress={() => handleReveal(entry.id)} style={styles.revealBtn}>
                <Ionicons name={revealedPasswords[entry.id] ? "eye-off" : "eye"} size={20} color="#4ADE80" />
              </TouchableOpacity>
            </View>

            {entry.notes ? <Text style={styles.notesText}>Notes: {entry.notes}</Text> : null}
          </View>
        ))}
      </ScrollView>

      {/* Add Password Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Password</Text>
            
            <ScrollView style={{maxHeight: 400}}>
              <TextInput style={styles.input} placeholder="Service Name (e.g. Netflix)" placeholderTextColor="#8A8A9E"
                value={form.service_name} onChangeText={(val) => setForm({...form, service_name: val})} />
              <TextInput style={styles.input} placeholder="Username / Email" placeholderTextColor="#8A8A9E"
                value={form.username} onChangeText={(val) => setForm({...form, username: val})} autoCapitalize="none" />
              <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#8A8A9E" secureTextEntry
                value={form.password} onChangeText={(val) => setForm({...form, password: val})} />
              <TextInput style={styles.input} placeholder="Website URL" placeholderTextColor="#8A8A9E"
                value={form.website_url} onChangeText={(val) => setForm({...form, website_url: val})} autoCapitalize="none" />
              <TextInput style={styles.input} placeholder="Category" placeholderTextColor="#8A8A9E"
                value={form.category} onChangeText={(val) => setForm({...form, category: val})} />
              <TextInput style={styles.input} placeholder="Notes" placeholderTextColor="#8A8A9E"
                value={form.notes} onChangeText={(val) => setForm({...form, notes: val})} />
            </ScrollView>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090E', paddingHorizontal: 24, paddingTop: 60 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  header: { color: '#F8FAFC', fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  addButton: { backgroundColor: '#4ADE80', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  emptyText: { color: '#64748B', textAlign: 'center', marginTop: 80, fontSize: 15, fontStyle: 'italic' },
  card: { backgroundColor: '#13131A', borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, alignItems: 'flex-start' },
  serviceName: { color: '#E2E8F0', fontSize: 18, fontWeight: '800' },
  subtext: { color: '#94A3B8', fontSize: 14, marginTop: 4, fontWeight: '500' },
  passwordRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0F1015', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  passwordText: { color: '#F8FAFC', fontSize: 16, letterSpacing: 3, flex: 1, fontWeight: '600' },
  revealBtn: { padding: 8, backgroundColor: 'rgba(74, 222, 128, 0.1)', borderRadius: 8 },
  notesText: { color: '#64748B', fontSize: 13, marginTop: 16, fontStyle: 'italic' },
  
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContent: { backgroundColor: '#13131A', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  modalTitle: { color: '#F8FAFC', fontSize: 22, fontWeight: '800', marginBottom: 24 },
  input: { backgroundColor: '#1E293B', color: '#F8FAFC', borderRadius: 16, padding: 18, marginBottom: 16, fontSize: 16, fontWeight: '500' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  cancelButton: { flex: 1, backgroundColor: '#1E293B', padding: 18, borderRadius: 16, alignItems: 'center', marginRight: 8 },
  saveButton: { flex: 1, backgroundColor: '#4ADE80', padding: 18, borderRadius: 16, alignItems: 'center', marginLeft: 8 },
  buttonText: { color: '#0F1015', fontWeight: '800', fontSize: 16 }
});

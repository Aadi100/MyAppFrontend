import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useStore } from '../store/useStore';
import { Screen, Card, Tag, Input, Sheet, SheetButtons, Field, GhostBtn, EmptyState, Label, ConfirmDialog } from '../ui/kit';
import { C, alpha } from '../ui/theme';

type Form = { id: string | null; service_name: string; username: string; password: string; notes: string; backup_codes: string[] };
const EMPTY: Form = { id: null, service_name: '', username: '', password: '', notes: '', backup_codes: [] };
const COLORS = [C.violet, C.blue, C.rose, C.amber, C.acc];

const strength = (p: string) => {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
};
const generate = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
  let out = '';
  for (let i = 0; i < 16; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
};
const cleanCodes = (codes: string[]) => Array.from(new Set(codes.map((c) => c.trim()).filter(Boolean)));

export default function VaultScreen() {
  const passwordEntries = useStore((state) => state.passwordEntries);
  const fetchPasswordEntries = useStore((state) => state.fetchPasswordEntries);
  const addPasswordEntry = useStore((state) => state.addPasswordEntry);
  const revealPasswordEntry = useStore((state) => state.revealPasswordEntry);
  const deletePasswordEntry = useStore((state) => state.deletePasswordEntry);
  const updatePasswordEntry = useStore((state) => state.updatePasswordEntry);

  const [modalVisible, setModalVisible] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, { password: string; backup_codes: string[] } | null>>({});
  const [form, setForm] = useState<Form>(EMPTY);
  const [original, setOriginal] = useState<Form | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [query, setQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchPasswordEntries();
  }, []);

  const getSecrets = async (id: string) => {
    if (revealed[id]) return revealed[id];
    const data = await revealPasswordEntry(id);
    if (!data || !data.password) {
      Alert.alert('Error', 'Failed to decrypt password.');
      return null;
    }
    setRevealed((r) => ({ ...r, [id]: data }));
    return data;
  };

  const handleReveal = async (id: string) => {
    if (revealed[id]) {
      setRevealed({ ...revealed, [id]: null });
    } else {
      await getSecrets(id);
    }
  };

  const copy = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', `${label} copied. It will auto-clear in 30 seconds for security.`);
    
    setTimeout(async () => {
      const currentClipboard = await Clipboard.getStringAsync();
      if (currentClipboard === text) {
        await Clipboard.setStringAsync('');
      }
    }, 30000);
  };

  const handleCopyPassword = async (id: string) => {
    const s = await getSecrets(id);
    if (s) await copy(s.password, 'Password');
  };

  const openAdd = () => {
    setForm(EMPTY);
    setOriginal(null);
    setShowPw(false);
    setModalVisible(true);
  };

  const handleEdit = async (entry) => {
    const s = await getSecrets(entry.id);
    if (!s) return;
    const f: Form = {
      id: entry.id,
      service_name: entry.service_name,
      username: entry.username || '',
      password: s.password,
      notes: entry.notes || '',
      backup_codes: s.backup_codes || [],
    };
    setForm(f);
    setOriginal(f);
    setShowPw(false);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.service_name.trim() || !form.password) {
      Alert.alert('Missing details', 'Service name and password are required.');
      return;
    }
    const codes = cleanCodes(form.backup_codes);
    let ok = false;
    if (form.id && original) {
      const payload: any = { id: form.id, service_name: form.service_name.trim(), username: form.username, notes: form.notes };
      if (form.password !== original.password) payload.password = form.password;
      if (codes.join('\n') !== cleanCodes(original.backup_codes).join('\n')) payload.backup_codes = codes;
      ok = await updatePasswordEntry(payload);
    } else {
      ok = await addPasswordEntry({
        service_name: form.service_name.trim(),
        username: form.username || undefined,
        password: form.password,
        notes: form.notes || undefined,
        backup_codes: codes,
      });
    }
    if (ok) {
      if (form.id) setRevealed((r) => ({ ...r, [form.id as string]: null }));
      setModalVisible(false);
      setForm(EMPTY);
      setOriginal(null);
    }
  };

  const setCode = (i: number, v: string) => setForm({ ...form, backup_codes: form.backup_codes.map((c, idx) => (idx === i ? v : c)) });
  const removeCode = (i: number) => setForm({ ...form, backup_codes: form.backup_codes.filter((_, idx) => idx !== i) });
  const addCode = () => setForm({ ...form, backup_codes: [...form.backup_codes, ''] });

  const list = passwordEntries.filter((e) => {
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return `${e.service_name} ${e.username || ''}`.toLowerCase().includes(q);
  });
  const st = strength(form.password || '');

  return (
    <>
      <Screen>
        <View style={styles.rowSp}>
          <Text style={styles.h1}>Vault</Text>
          <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
            <Ionicons name="add" size={24} color={C.onAcc} />
          </TouchableOpacity>
        </View>

        {passwordEntries.length > 0 && (
          <View style={{ marginTop: 12 }}><Input icon="search" placeholder="Search logins" value={query} onChangeText={setQuery} style={{ height: 48 }} /></View>
        )}

        {passwordEntries.length === 0 && (
          <EmptyState icon="key-outline" color={C.rose} title="Your vault is empty" sub="Tap + to add your first password. Everything is stored encrypted." />
        )}

        <View style={{ gap: 12, marginTop: 14 }}>
          {list.map((entry, i) => {
            const col = COLORS[i % COLORS.length];
            const shown = revealed[entry.id];
            const codeCount = entry.backup_codes_count || 0;
            return (
              <Card key={entry.id} pad={14}>
                <View style={styles.rowSp}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                    <View style={[styles.logo, { backgroundColor: alpha(col, 0.15), borderColor: alpha(col, 0.25) }]}>
                      <Text style={{ color: col, fontWeight: '800', fontSize: 17 }}>{(entry.service_name || '?').charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.service} numberOfLines={1}>{entry.service_name}</Text>
                      {entry.username ? <Text style={styles.sub} numberOfLines={1}>{entry.username}</Text> : null}
                    </View>
                  </View>
                  {codeCount > 0 ? <Tag label={`${codeCount} code${codeCount === 1 ? '' : 's'}`} color={col} /> : null}
                </View>

                <View style={styles.pwRow}>
                  <Text style={[styles.pwText, shown ? { color: C.text, letterSpacing: 0.5, fontSize: 14 } : null]} numberOfLines={1}>
                    {shown ? shown.password : '••••••••••••'}
                  </Text>
                  <TouchableOpacity onPress={() => handleReveal(entry.id)} style={[styles.iconBtn, { backgroundColor: alpha(C.acc, 0.12) }]}>
                    <Ionicons name={shown ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.acc} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleCopyPassword(entry.id)} style={styles.iconBtn}>
                    <Ionicons name="copy-outline" size={17} color={C.mute} />
                  </TouchableOpacity>
                </View>

                {shown && shown.backup_codes.length > 0 && (
                  <View style={{ marginTop: 12 }}>
                    <Label style={{ marginBottom: 8 }}>Backup codes</Label>
                    <View style={styles.codes}>
                      {shown.backup_codes.map((code) => (
                        <TouchableOpacity key={code} style={styles.codeChip} onPress={() => copy(code, 'Code')} activeOpacity={0.8}>
                          <Text style={styles.codeText}>{code}</Text>
                          <Ionicons name="copy-outline" size={13} color={C.dim} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {entry.notes ? <Text style={styles.notes}>Notes: {entry.notes}</Text> : null}

                <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                  <GhostBtn icon="pencil-outline" onPress={() => handleEdit(entry)} />
                  <GhostBtn icon="trash-outline" danger onPress={() => setDeleteId(entry.id)} />
                </View>
              </Card>
            );
          })}
        </View>
      </Screen>

      <Sheet visible={modalVisible} onClose={() => setModalVisible(false)} title={form.id ? 'Edit password' : 'Add password'}
        footer={<SheetButtons onCancel={() => setModalVisible(false)} onSave={handleSave} saveLabel="Save password" />}>
        <View style={{ gap: 10, marginTop: 14 }}>
          <Input icon="globe-outline" placeholder="Service name (e.g. Steam)" value={form.service_name} onChangeText={(v) => setForm({ ...form, service_name: v })} style={{ height: 50 }} />
          <Input icon="person-outline" placeholder="Username or email" autoCapitalize="none" value={form.username} onChangeText={(v) => setForm({ ...form, username: v })} style={{ height: 50 }} />
          <Input icon="lock-closed-outline" placeholder="Password" secureTextEntry={!showPw} autoCapitalize="none" value={form.password}
            onChangeText={(v) => setForm({ ...form, password: v })} right={showPw ? 'eye-off-outline' : 'eye-outline'} onRightPress={() => setShowPw(!showPw)} style={{ height: 50 }} />
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {[0, 1, 2, 3].map((i) => <View key={i} style={{ flex: 1, height: 6, borderRadius: 9, backgroundColor: i < st ? (st <= 1 ? C.rose : st === 2 ? C.amber : C.acc) : 'rgba(255,255,255,0.07)' }} />)}
          </View>
          <View style={styles.rowSp}>
            <Text style={{ color: st >= 3 ? C.acc : C.mute, fontSize: 12, fontWeight: '700' }}>{form.password ? (st <= 1 ? 'Weak' : st === 2 ? 'Okay' : 'Strong') : ' '}</Text>
            <TouchableOpacity onPress={() => { setForm({ ...form, password: generate() }); setShowPw(true); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="sparkles-outline" size={14} color={C.acc} />
              <Text style={{ color: C.acc, fontSize: 13, fontWeight: '700' }}>Generate password</Text>
            </TouchableOpacity>
          </View>
          <Input icon="document-text-outline" placeholder="Notes" value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} style={{ height: 50 }} />
        </View>

        <Field label="Backup codes">
          <View style={{ gap: 8 }}>
            {form.backup_codes.map((code, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Input icon="key-outline" placeholder={`Code ${i + 1}`} autoCapitalize="none" autoCorrect={false} value={code} onChangeText={(v) => setCode(i, v)} style={{ height: 46 }} />
                </View>
                <GhostBtn icon="trash-outline" danger size={40} onPress={() => removeCode(i)} />
              </View>
            ))}
            <TouchableOpacity onPress={addCode} style={styles.addCode} activeOpacity={0.85}>
              <Ionicons name="add" size={18} color={C.acc} />
              <Text style={{ color: C.acc, fontWeight: '700', fontSize: 14 }}>Add backup code</Text>
            </TouchableOpacity>
          </View>
        </Field>
      </Sheet>

      <ConfirmDialog visible={!!deleteId} title="Delete password?" message="This password and its backup codes will be removed. This cannot be undone."
        onCancel={() => setDeleteId(null)} onConfirm={() => { if (deleteId) deletePasswordEntry(deleteId); setDeleteId(null); }} />
    </>
  );
}

const styles = StyleSheet.create({
  rowSp: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  h1: { color: C.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.7 },
  addBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.acc, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  service: { color: C.text, fontSize: 16, fontWeight: '700' },
  sub: { color: C.dim, fontSize: 12.5, marginTop: 2 },
  pwRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.28)', borderWidth: 1, borderColor: C.line, borderRadius: 14, paddingVertical: 6, paddingLeft: 14, paddingRight: 6, marginTop: 12 },
  pwText: { flex: 1, color: C.mute, fontSize: 15, fontWeight: '600', letterSpacing: 3 },
  iconBtn: { width: 34, height: 34, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  codes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  codeChip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.28)', borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  codeText: { color: C.text, fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },
  notes: { color: C.mute, fontSize: 12.5, marginTop: 10 },
  addCode: { height: 46, borderRadius: 15, backgroundColor: alpha(C.acc, 0.1), borderWidth: 1, borderStyle: 'dashed', borderColor: alpha(C.acc, 0.4), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
});

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useStore } from '../store/useStore';
import { Screen, Header, Label, Input, EmptyState, ConfirmDialog, PrimaryButton } from '../ui/kit';
import { C, alpha, GRAD } from '../ui/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const NOTE_COLORS = [
  { id: 'default', code: '#131B2D' },
  { id: 'red', code: '#3A1A24' },
  { id: 'green', code: '#0C2E38' },
  { id: 'blue', code: '#15284A' },
  { id: 'yellow', code: '#3B3012' },
  { id: 'purple', code: '#2A1A45' },
];

export default function NotesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const notes = useStore(state => state.notes);
  const fetchNotes = useStore(state => state.fetchNotes);
  const createNote = useStore(state => state.createNote);
  const updateNote = useStore(state => state.updateNote);
  const deleteNote = useStore(state => state.deleteNote);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<any>({ id: null, title: '', content: '', color: null, is_pinned: false });
  const [deleteAsk, setDeleteAsk] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleOpenNote = (note = null) => {
    if (note) {
      setEditingNote(note);
    } else {
      setEditingNote({ id: null, title: '', content: '', color: null, is_pinned: false });
    }
    setModalVisible(true);
  };

  const handleSaveNote = async () => {
    if (!editingNote.content.trim()) {
      Alert.alert('Hold on', 'Note content cannot be empty.');
      return;
    }
    if (editingNote.id) {
      await updateNote(editingNote);
    } else {
      await createNote(editingNote);
    }
    setModalVisible(false);
  };

  const confirmDelete = async () => {
    setDeleteAsk(false);
    await deleteNote(editingNote.id);
    setModalVisible(false);
  };

  const renderNoteCard = (note) => (
    <TouchableOpacity
      key={note.id}
      activeOpacity={0.85}
      style={[styles.noteCard, { backgroundColor: note.color || '#131B2D' }]}
      onPress={() => handleOpenNote(note)}
    >
      {note.is_pinned && <View style={styles.pinIcon}><Ionicons name="pin" size={14} color={C.amber} /></View>}
      {!!note.title && <Text style={[styles.noteTitle, note.is_pinned && { paddingRight: 20 }]}>{note.title}</Text>}
      <Text style={styles.noteContent} numberOfLines={8}>{note.content}</Text>
    </TouchableOpacity>
  );

  const filtered = notes.filter(n => !query.trim() || `${n.title || ''} ${n.content || ''}`.toLowerCase().includes(query.trim().toLowerCase()));
  const pinnedNotes = filtered.filter(n => n.is_pinned);
  const unpinnedNotes = filtered.filter(n => !n.is_pinned);

  const renderMasonry = (items) => {
    const leftCol: any[] = [];
    const rightCol: any[] = [];
    items.forEach((item, idx) => {
      if (idx % 2 === 0) leftCol.push(renderNoteCard(item));
      else rightCol.push(renderNoteCard(item));
    });
    return (
      <View style={styles.masonryRow}>
        <View style={styles.masonryCol}>{leftCol}</View>
        <View style={styles.masonryCol}>{rightCol}</View>
      </View>
    );
  };

  const bg = editingNote.color || '#0B101C';

  return (
    <>
      <Screen>
        <Header title="Notes" onBack={() => router.back()} right={
          <TouchableOpacity style={styles.searchBtn} onPress={() => { setSearchOpen(!searchOpen); if (searchOpen) setQuery(''); }}>
            <Ionicons name={searchOpen ? 'close' : 'search'} size={19} color={C.text} />
          </TouchableOpacity>
        } />

        {searchOpen && <View style={{ marginBottom: 12 }}><Input icon="search" placeholder="Search notes" value={query} onChangeText={setQuery} autoFocus style={{ height: 48 }} /></View>}

        {pinnedNotes.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <Label style={{ marginBottom: 10 }}>Pinned</Label>
            {renderMasonry(pinnedNotes)}
          </View>
        )}

        {unpinnedNotes.length > 0 && (
          <View>
            {pinnedNotes.length > 0 && <Label style={{ marginBottom: 10 }}>Others</Label>}
            {renderMasonry(unpinnedNotes)}
          </View>
        )}

        {notes.length === 0 && (
          <EmptyState icon="document-text-outline" color={C.orange} title="No notes yet" sub="Tap the + button to create your first note." />
        )}
      </Screen>

      <TouchableOpacity style={styles.fab} onPress={() => handleOpenNote()} activeOpacity={0.9}>
        <LinearGradient colors={GRAD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fabIn}>
          <Ionicons name="add" size={30} color={C.onAcc} />
        </LinearGradient>
      </TouchableOpacity>

      {/* EDIT NOTE */}
      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)} statusBarTranslucent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.modalContainer, { backgroundColor: bg, paddingTop: insets.top + 8 }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.roundBtn}>
              <Ionicons name="chevron-down" size={24} color={C.text} />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TouchableOpacity onPress={() => setEditingNote({ ...editingNote, is_pinned: !editingNote.is_pinned })}
                style={[styles.roundBtn, editingNote.is_pinned && { backgroundColor: alpha(C.amber, 0.16), borderColor: alpha(C.amber, 0.4) }]}>
                <Ionicons name={editingNote.is_pinned ? 'pin' : 'pin-outline'} size={20} color={editingNote.is_pinned ? C.amber : C.text} />
              </TouchableOpacity>
              {editingNote.id && (
                <TouchableOpacity onPress={() => setDeleteAsk(true)} style={styles.roundBtn}>
                  <Ionicons name="trash-outline" size={20} color={C.rose} />
                </TouchableOpacity>
              )}
              <PrimaryButton title="Save" onPress={handleSaveNote} small style={{ minWidth: 76 }} />
            </View>
          </View>

          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <TextInput style={styles.inputTitle} placeholder="Title" placeholderTextColor={C.dim} value={editingNote.title}
              onChangeText={v => setEditingNote({ ...editingNote, title: v })} />
            <TextInput style={styles.inputContent} placeholder="Note" placeholderTextColor={C.dim} value={editingNote.content}
              onChangeText={v => setEditingNote({ ...editingNote, content: v })} multiline autoFocus={!editingNote.id} />
          </ScrollView>

          <View style={[styles.colorBar, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
            {NOTE_COLORS.map(c => {
              const on = (editingNote.color || null) === (c.id === 'default' ? null : c.code);
              return (
                <TouchableOpacity key={c.id} onPress={() => setEditingNote({ ...editingNote, color: c.id === 'default' ? null : c.code })}
                  style={[styles.colorBubble, { backgroundColor: c.code }, on && { borderColor: '#fff' }]}>
                  {on ? <Ionicons name="checkmark" size={18} color="#fff" /> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </KeyboardAvoidingView>

        <ConfirmDialog visible={deleteAsk} title="Delete note?" message="This cannot be undone." onCancel={() => setDeleteAsk(false)} onConfirm={confirmDelete} />
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  searchBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.s2, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  masonryRow: { flexDirection: 'row', gap: 10 },
  masonryCol: { flex: 1 },
  noteCard: { borderRadius: 20, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  pinIcon: { position: 'absolute', top: 13, right: 13, zIndex: 1 },
  noteTitle: { color: C.text, fontSize: 15, fontWeight: '700', marginBottom: 6 },
  noteContent: { color: '#cfd7e6', fontSize: 13, lineHeight: 20 },
  fab: { position: 'absolute', right: 20, bottom: 108, shadowColor: '#0891B2', shadowOpacity: 0.7, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
  fabIn: { width: 60, height: 60, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 8 },
  roundBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  modalBody: { flex: 1, paddingHorizontal: 24 },
  inputTitle: { color: C.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.6, marginTop: 12, marginBottom: 12, padding: 0 },
  inputContent: { color: '#e8edf7', fontSize: 18, lineHeight: 30, textAlignVertical: 'top', minHeight: 220, padding: 0 },
  colorBar: { flexDirection: 'row', gap: 12, paddingTop: 14, paddingHorizontal: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.25)' },
  colorBubble: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
});

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../store/useStore';

const NOTE_COLORS = [
  { id: 'default', code: '#1E1E2D' },
  { id: 'red', code: '#3F1D1D' },
  { id: 'green', code: '#143621' },
  { id: 'blue', code: '#162842' },
  { id: 'yellow', code: '#423414' },
  { id: 'purple', code: '#2A1642' },
];

export default function NotesScreen() {
  const router = useRouter();
  const notes = useStore(state => state.notes);
  const fetchNotes = useStore(state => state.fetchNotes);
  const createNote = useStore(state => state.createNote);
  const updateNote = useStore(state => state.updateNote);
  const deleteNote = useStore(state => state.deleteNote);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState({ id: null, title: '', content: '', color: null, is_pinned: false });

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

  const handleDelete = () => {
    Alert.alert('Delete Note?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteNote(editingNote.id);
        setModalVisible(false);
      }}
    ]);
  };

  const renderNoteCard = (note) => (
    <TouchableOpacity 
      key={note.id} 
      style={[styles.noteCard, { backgroundColor: note.color || '#1E1E2D' }]}
      onPress={() => handleOpenNote(note)}
    >
      {note.is_pinned && (
        <View style={styles.pinIcon}>
          <Ionicons name="pin" size={14} color="#FBBF24" />
        </View>
      )}
      {!!note.title && <Text style={styles.noteTitle}>{note.title}</Text>}
      <Text style={styles.noteContent} numberOfLines={8}>{note.content}</Text>
    </TouchableOpacity>
  );

  const pinnedNotes = notes.filter(n => n.is_pinned);
  const unpinnedNotes = notes.filter(n => !n.is_pinned);

  const renderMasonry = (items) => {
    const leftCol = [];
    const rightCol = [];
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

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Notepad</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {pinnedNotes.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.sectionTitle}>PINNED</Text>
            {renderMasonry(pinnedNotes)}
          </View>
        )}
        
        {unpinnedNotes.length > 0 && (
          <View>
            {pinnedNotes.length > 0 && <Text style={styles.sectionTitle}>OTHERS</Text>}
            {renderMasonry(unpinnedNotes)}
          </View>
        )}

        {notes.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#333" />
            <Text style={styles.emptyText}>No notes yet</Text>
            <Text style={styles.emptySubText}>Tap the + button to create your first note.</Text>
          </View>
        )}
      </ScrollView>

      {/* FLOATING ACTION BUTTON */}
      <TouchableOpacity style={styles.fab} onPress={() => handleOpenNote()}>
        <Ionicons name="add" size={32} color="#0F1015" />
      </TouchableOpacity>

      {/* EDIT NOTE MODAL */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={[styles.modalContainer, { backgroundColor: editingNote.color || '#0B0B14' }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.iconBtn}>
              <Ionicons name="chevron-down" size={28} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={() => setEditingNote({ ...editingNote, is_pinned: !editingNote.is_pinned })} style={styles.iconBtn}>
                <Ionicons name={editingNote.is_pinned ? "pin" : "pin-outline"} size={24} color={editingNote.is_pinned ? "#FBBF24" : "#fff"} />
              </TouchableOpacity>
              {editingNote.id && (
                <TouchableOpacity onPress={handleDelete} style={styles.iconBtn}>
                  <Ionicons name="trash-outline" size={24} color="#F87171" />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={handleSaveNote} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.modalBody}>
            <TextInput
              style={styles.inputTitle}
              placeholder="Title"
              placeholderTextColor="#8A8A9E"
              value={editingNote.title}
              onChangeText={v => setEditingNote({ ...editingNote, title: v })}
            />
            <TextInput
              style={styles.inputContent}
              placeholder="Note"
              placeholderTextColor="#8A8A9E"
              value={editingNote.content}
              onChangeText={v => setEditingNote({ ...editingNote, content: v })}
              multiline
              autoFocus={!editingNote.id}
            />
          </ScrollView>

          <View style={styles.colorPickerContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorPicker}>
              {NOTE_COLORS.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.colorBubble, { backgroundColor: c.code }, editingNote.color === c.code && styles.colorBubbleSelected]}
                  onPress={() => setEditingNote({ ...editingNote, color: c.id === 'default' ? null : c.code })}
                />
              ))}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B14', paddingHorizontal: 16, paddingTop: 60 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backBtn: { backgroundColor: '#1E1E2D', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  
  sectionTitle: { color: '#8A8A9E', fontSize: 12, fontWeight: 'bold', marginBottom: 12, marginLeft: 8 },
  masonryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  masonryCol: { flex: 1, paddingHorizontal: 4 },
  
  noteCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  pinIcon: { position: 'absolute', top: 12, right: 12, zIndex: 1 },
  noteTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  noteContent: { color: '#E2E8F0', fontSize: 14, lineHeight: 20 },

  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 16 },
  emptySubText: { color: '#8A8A9E', fontSize: 14, marginTop: 8 },

  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4ADE80',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4ADE80',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },

  modalContainer: { flex: 1, paddingTop: Platform.OS === 'android' ? 20 : 0 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { padding: 8, marginLeft: 8 },
  saveBtn: { backgroundColor: '#4ADE80', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginLeft: 16 },
  saveBtnText: { color: '#0F1015', fontWeight: 'bold', fontSize: 16 },
  
  modalBody: { flex: 1, paddingHorizontal: 24 },
  inputTitle: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 16, marginTop: 12 },
  inputContent: { color: '#fff', fontSize: 18, lineHeight: 28, textAlignVertical: 'top', minHeight: 200 },
  
  colorPickerContainer: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  colorPicker: { paddingHorizontal: 16, gap: 12 },
  colorBubble: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)' },
  colorBubbleSelected: { borderColor: '#fff' },
});

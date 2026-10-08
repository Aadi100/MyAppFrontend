import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Card, PrimaryButton, Input, Field } from '../ui/kit';
import { C } from '../ui/theme';
import { useStore } from '../store/useStore';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function RemindersScreen() {
  const { reminders, fetchReminders, createReminder, updateReminder, completeReminder, deleteReminder } = useStore();
  const [modalVisible, setModalVisible] = useState(false);
  
  const [editId, setEditId] = useState(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [recurrence, setRecurrence] = useState('none');
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    fetchReminders();
  }, []);

  const openModal = (reminder: any = null) => {
    if (reminder) {
      setEditId(reminder.id);
      setTitle(reminder.title || '');
      setAmount(reminder.amount ? String(reminder.amount) : '');
      setDate(new Date(reminder.due_date));
      setRecurrence(reminder.recurrence || 'none');
      setNotes(reminder.notes || '');
    } else {
      setEditId(null);
      setTitle('');
      setAmount('');
      setDate(new Date());
      setRecurrence('none');
      setNotes('');
    }
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!title) return Alert.alert('Error', 'Title is required');
    const payload = {
      title,
      due_date: date.toISOString().split('T')[0],
      amount: amount ? parseFloat(amount) : null,
      recurrence,
      notes: notes || null
    };

    if (editId) {
      updateReminder({ id: editId, ...payload });
    } else {
      createReminder(payload);
    }
    setModalVisible(false);
  };

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Are you sure you want to delete this reminder?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteReminder(id) }
    ]);
  };

  const renderItem = ({ item }) => {
    const isOverdue = item.status === 'overdue';
    const isDone = item.status === 'done';
    
    return (
      <Card style={[styles.card, isDone && { opacity: 0.6 }]}>
        <TouchableOpacity style={{ flex: 1 }} onPress={() => openModal(item)}>
          <Text style={[styles.title, isDone && { textDecorationLine: 'line-through' }]}>{item.title}</Text>
          <Text style={[styles.sub, isOverdue && !isDone && { color: C.red, fontWeight: 'bold' }]}>
            {item.due_date} {item.recurrence !== 'none' ? `(${item.recurrence})` : ''} - {item.status.toUpperCase()}
          </Text>
          {item.amount != null && <Text style={styles.amount}>${item.amount}</Text>}
          {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
        </TouchableOpacity>
        <View style={styles.actions}>
          {!isDone && (
            <TouchableOpacity style={styles.checkBtn} onPress={() => completeReminder(item.id)}>
              <Ionicons name="checkmark-circle-outline" size={32} color={C.green} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.delBtn} onPress={() => handleDelete(item.id)}>
            <Ionicons name="trash-outline" size={24} color={C.red} />
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <Screen>
      <Header title="Reminders" showBack />
      <FlatList
        data={reminders}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListEmptyComponent={<Text style={{ color: C.mute, textAlign: 'center', marginTop: 50 }}>No reminders found.</Text>}
      />
      <TouchableOpacity style={styles.fab} onPress={() => openModal()}>
        <Ionicons name="add" size={32} color="#000" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" presentationStyle="formSheet">
        <View style={styles.modal}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={[styles.modalTitle, { marginBottom: 0 }]}>{editId ? 'Edit Reminder' : 'New Reminder'}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={28} color={C.text} /></TouchableOpacity>
          </View>
          <Field label="Title">
            <Input value={title} onChangeText={setTitle} placeholder="Electricity Bill" />
          </Field>
          <Field label="Amount (Optional)">
            <Input value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="numeric" />
          </Field>
          <Field label="Due Date">
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateBtn}>
              <Text style={{ color: C.text }}>{date.toISOString().split('T')[0]}</Text>
            </TouchableOpacity>
          </Field>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={(e, d) => { setShowDatePicker(false); if (d) setDate(d); }}
            />
          )}
          
          <Field label="Recurrence">
            <View style={styles.row}>
              {['none', 'weekly', 'monthly', 'yearly'].map(r => (
                <TouchableOpacity key={r} onPress={() => setRecurrence(r)} style={[styles.recBtn, recurrence === r && styles.recActive]}>
                  <Text style={[styles.recText, recurrence === r && { color: '#000' }]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>
          <Field label="Notes (Optional)">
            <Input value={notes} onChangeText={setNotes} placeholder="Any notes..." />
          </Field>

          <View style={{ marginTop: 24, flexDirection: 'row', gap: 12 }}>
            <PrimaryButton title="Cancel" onPress={() => setModalVisible(false)} outline style={{ flex: 1 }} />
            <PrimaryButton title="Save" onPress={handleSave} style={{ flex: 1 }} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  title: { color: C.text, fontSize: 18, fontWeight: '600' },
  sub: { color: C.mute, fontSize: 14, marginTop: 4 },
  amount: { color: C.acc, fontSize: 16, fontWeight: '700', marginTop: 4 },
  notes: { color: C.mute, fontSize: 13, marginTop: 4, fontStyle: 'italic' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12, marginLeft: 10 },
  checkBtn: { padding: 4 },
  delBtn: { padding: 8 },
  fab: { position: 'absolute', bottom: 30, right: 20, backgroundColor: C.acc, width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  modal: { flex: 1, backgroundColor: '#070A11', padding: 20 },
  modalTitle: { color: C.text, fontSize: 24, fontWeight: '800', marginBottom: 20 },
  dateBtn: { backgroundColor: '#111827', padding: 16, borderRadius: 12 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  recBtn: { backgroundColor: '#111827', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  recActive: { backgroundColor: C.acc },
  recText: { color: C.mute, fontWeight: '600', textTransform: 'capitalize' }
});

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, Switch as NativeSwitch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Card, PrimaryButton, Input, Field } from '../ui/kit';
import { C } from '../ui/theme';
import { useStore } from '../store/useStore';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function TodosScreen() {
  const { todos, fetchTodos, createTodo, updateTodo, completeTodo, deleteTodo, addSubtask, updateSubtask, deleteSubtask } = useStore();
  const [modalVisible, setModalVisible] = useState(false);
  
  const [editId, setEditId] = useState(null);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [hasDue, setHasDue] = useState(false);
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [remind, setRemind] = useState(false);
  const [recurrence, setRecurrence] = useState('none');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  useEffect(() => {
    fetchTodos();
  }, []);

  const openModal = (todo = null) => {
    if (todo) {
      setEditId(todo.id);
      setTitle(todo.title || '');
      setPriority(todo.priority || 'medium');
      if (todo.due_at) {
        setHasDue(true);
        setDate(new Date(todo.due_at));
        setTime(new Date(todo.due_at));
      } else {
        setHasDue(false);
        setDate(new Date());
        setTime(new Date());
      }
      setRemind(todo.remind || false);
      setRecurrence(todo.recurrence || 'none');
    } else {
      setEditId(null);
      setTitle('');
      setPriority('medium');
      setHasDue(false);
      setDate(new Date());
      setTime(new Date());
      setRemind(false);
      setRecurrence('none');
    }
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!title) return Alert.alert('Error', 'Title is required');
    
    let dueAtIso = null;
    if (hasDue) {
      const combined = new Date(date);
      combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
      dueAtIso = combined.toISOString();
    }

    const payload = {
      title,
      priority,
      due_at: dueAtIso,
      remind: hasDue ? remind : false,
      recurrence,
    };

    if (editId) {
      updateTodo({ id: editId, ...payload });
    } else {
      createTodo(payload);
    }
    setModalVisible(false);
  };

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Are you sure you want to delete this To-Do?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTodo(id) }
    ]);
  };

  const getPriorityColor = (p) => {
    if (p === 'high') return C.red;
    if (p === 'medium') return C.amber;
    return C.blue;
  };

  const renderItem = ({ item }) => {
    const isDone = item.status === 'done';
    const isOverdue = item.status === 'overdue';

    return (
      <Card style={[styles.card, isDone && { opacity: 0.6 }]}>
        <View style={styles.priorityStrip} backgroundColor={getPriorityColor(item.priority)} />
        <TouchableOpacity style={{ flex: 1, paddingVertical: 12, paddingLeft: 12 }} onPress={() => openModal(item)}>
          <Text style={[styles.title, isDone && { textDecorationLine: 'line-through' }]}>{item.title}</Text>
          {item.due_at && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
              <Ionicons name="time-outline" size={14} color={isOverdue && !isDone ? C.red : C.mute} />
              <Text style={[styles.sub, isOverdue && !isDone && { color: C.red, fontWeight: 'bold' }]}>
                {new Date(item.due_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })} 
                {item.remind ? ' 🔔' : ''} {item.recurrence !== 'none' ? `(${item.recurrence})` : ''}
              </Text>
            </View>
          )}
          
          {/* Subtasks inline preview */}
          {item.subtasks && item.subtasks.length > 0 && (
             <Text style={styles.subtaskCount}>
               {item.subtasks.filter((s:any) => s.is_done).length} / {item.subtasks.length} subtasks completed
             </Text>
          )}
        </TouchableOpacity>
        
        <View style={styles.actions}>
          {!isDone && (
            <TouchableOpacity style={styles.checkBtn} onPress={() => completeTodo(item.id)}>
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

  const editTodo = todos.find(t => t.id === editId);

  return (
    <Screen>
      <Header title="To-Do List" showBack />
      <FlatList
        data={todos}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListEmptyComponent={<Text style={{ color: C.mute, textAlign: 'center', marginTop: 50 }}>No tasks found.</Text>}
      />
      <TouchableOpacity style={styles.fab} onPress={() => openModal()}>
        <Ionicons name="add" size={32} color="#000" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" presentationStyle="formSheet">
        <View style={styles.modal}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
             <Text style={styles.modalTitle}>{editId ? 'Edit Task' : 'New Task'}</Text>
             <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={28} color={C.text} /></TouchableOpacity>
          </View>
          
          <FlatList 
            data={[]} 
            renderItem={() => null}
            ListHeaderComponent={
              <>
                <Field label="Task Title">
                  <Input value={title} onChangeText={setTitle} placeholder="Call the bank..." />
                </Field>
                
                <Field label="Priority">
                  <View style={styles.row}>
                    {['low', 'medium', 'high'].map(p => (
                      <TouchableOpacity key={p} onPress={() => setPriority(p)} style={[styles.recBtn, priority === p && { backgroundColor: getPriorityColor(p) }]}>
                        <Text style={[styles.recText, priority === p && { color: '#000' }]}>{p}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </Field>

                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Has Due Date & Time</Text>
                  <NativeSwitch value={hasDue} onValueChange={setHasDue} trackColor={{ true: C.acc }} />
                </View>

                {hasDue && (
                  <>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <Field label="Date" style={{ flex: 1 }}>
                        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateBtn}>
                          <Text style={{ color: C.text }}>{date.toISOString().split('T')[0]}</Text>
                        </TouchableOpacity>
                      </Field>
                      <Field label="Time" style={{ flex: 1 }}>
                        <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.dateBtn}>
                          <Text style={{ color: C.text }}>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                        </TouchableOpacity>
                      </Field>
                    </View>
                    
                    <View style={styles.switchRow}>
                      <Text style={styles.switchLabel}>Push Notification Reminder</Text>
                      <NativeSwitch value={remind} onValueChange={setRemind} trackColor={{ true: C.acc }} />
                    </View>

                    <Field label="Recurrence">
                      <View style={styles.row}>
                        {['none', 'daily', 'weekly', 'monthly', 'yearly'].map(r => (
                          <TouchableOpacity key={r} onPress={() => setRecurrence(r)} style={[styles.recBtn, recurrence === r && styles.recActive]}>
                            <Text style={[styles.recText, recurrence === r && { color: '#000' }]}>{r}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </Field>
                  </>
                )}

                {showDatePicker && (
                  <DateTimePicker value={date} mode="date" display="default" onChange={(e, d) => { setShowDatePicker(false); if (d) setDate(d); }} />
                )}
                {showTimePicker && (
                  <DateTimePicker value={time} mode="time" display="default" onChange={(e, d) => { setShowTimePicker(false); if (d) setTime(d); }} />
                )}

                <PrimaryButton label="Save Task" onPress={handleSave} style={{ marginTop: 24 }} />

                {/* Subtasks Section */}
                {editId && editTodo && (
                  <View style={{ marginTop: 40, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 20 }}>
                    <Text style={{ color: C.text, fontSize: 18, fontWeight: '700', marginBottom: 12 }}>Subtasks</Text>
                    {editTodo.subtasks?.map((sub:any) => (
                      <View key={sub.id} style={styles.subtaskRow}>
                        <TouchableOpacity onPress={() => updateSubtask({ id: sub.id, is_done: !sub.is_done })}>
                          <Ionicons name={sub.is_done ? 'checkbox' : 'square-outline'} size={24} color={sub.is_done ? C.green : C.dim} />
                        </TouchableOpacity>
                        <Text style={[styles.subtaskTitle, sub.is_done && { textDecorationLine: 'line-through', color: C.dim }]}>{sub.title}</Text>
                        <TouchableOpacity onPress={() => deleteSubtask(sub.id)} style={{ padding: 4 }}>
                          <Ionicons name="close" size={20} color={C.red} />
                        </TouchableOpacity>
                      </View>
                    ))}
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 }}>
                      <View style={{ flex: 1 }}>
                        <Input value={newSubtaskTitle} onChangeText={setNewSubtaskTitle} placeholder="Add subtask..." />
                      </View>
                      <TouchableOpacity 
                        style={styles.addSubtaskBtn}
                        onPress={() => {
                          if (newSubtaskTitle) {
                            addSubtask({ todo_id: editId, title: newSubtaskTitle });
                            setNewSubtaskTitle('');
                          }
                        }}
                      >
                        <Ionicons name="add" size={24} color="#000" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </>
            }
          />
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, padding: 0, overflow: 'hidden' },
  priorityStrip: { width: 6, height: '100%' },
  title: { color: C.text, fontSize: 18, fontWeight: '600' },
  sub: { color: C.mute, fontSize: 13 },
  subtaskCount: { color: C.dim, fontSize: 12, marginTop: 6, fontWeight: '600' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 12 },
  checkBtn: { padding: 4 },
  delBtn: { padding: 8 },
  fab: { position: 'absolute', bottom: 30, right: 20, backgroundColor: C.acc, width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  modal: { flex: 1, backgroundColor: '#070A11', padding: 20 },
  modalTitle: { color: C.text, fontSize: 24, fontWeight: '800' },
  dateBtn: { backgroundColor: '#111827', padding: 16, borderRadius: 12 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  recBtn: { backgroundColor: '#111827', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  recActive: { backgroundColor: C.acc },
  recText: { color: C.mute, fontWeight: '600', textTransform: 'capitalize' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 12, backgroundColor: '#111827', padding: 16, borderRadius: 12 },
  switchLabel: { color: C.text, fontSize: 16, fontWeight: '600' },
  subtaskRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#111827', padding: 12, borderRadius: 8, marginBottom: 8 },
  subtaskTitle: { flex: 1, color: C.text, fontSize: 15 },
  addSubtaskBtn: { backgroundColor: C.acc, padding: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }
});

import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';

const Dropdown = ({ label, items, selectedId, onSelect, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedItem = items.find(i => i.id === selectedId);

  return (
    <View style={styles.dropdownContainer}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.dropdownHeader} onPress={() => setIsOpen(!isOpen)}>
        <Text style={[styles.dropdownHeaderText, !selectedItem && { color: '#8A8A9E' }]}>
          {selectedItem ? selectedItem.name : placeholder}
        </Text>
        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={20} color="#8A8A9E" />
      </TouchableOpacity>
      
      {isOpen && (
        <View style={styles.dropdownList}>
          {items.map(item => (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.dropdownItem, selectedId === item.id && styles.dropdownItemActive]}
              onPress={() => {
                onSelect(item.id);
                setIsOpen(false);
              }}
            >
              <Text style={[styles.dropdownItemText, selectedId === item.id && styles.dropdownItemTextActive]}>
                {item.name}
              </Text>
              {selectedId === item.id && <Ionicons name="checkmark" size={18} color="#4ADE80" />}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

export default function AddTransactionModal({ visible, onClose, editingTransaction }) {
  const router = useRouter();
  const [type, setType] = useState('debit');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [selectedBankId, setSelectedBankId] = useState('');
  const [selectedSubCatId, setSelectedSubCatId] = useState('');
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState('date');

  const banks = useStore((state) => state.banks);
  const subCategories = useStore((state) => state.subCategories);
  const masterCategories = useStore((state) => state.masterCategories);
  const expenses = useStore((state) => state.expenses);
  const addExpense = useStore((state) => state.addExpense);
  const updateExpense = useStore((state) => state.updateExpense);
  const receiveIncome = useStore((state) => state.receiveIncome);

  React.useEffect(() => {
    if (visible && editingTransaction) {
      setType(editingTransaction.type || 'debit');
      setAmount(editingTransaction.amount ? String(editingTransaction.amount) : '');
      setReason(editingTransaction.reason || '');
      setNote(editingTransaction.note || '');
      setSelectedBankId(editingTransaction.bank_account_id || '');
      setSelectedSubCatId(editingTransaction.sub_category_id || '');
      setDate(editingTransaction.date ? new Date(editingTransaction.date) : new Date());
    } else if (visible) {
      setAmount('');
      setReason('');
      setNote('');
      setSelectedSubCatId('');
      setType('debit');
      setDate(new Date());
      if (banks.length > 0) {
        setSelectedBankId(banks[0].id);
      }
    }
  }, [visible, editingTransaction, banks]);

  const handleTypeChange = (newType) => {
    setType(newType);
    setSelectedSubCatId('');
  };

  const handleSave = () => {
    if (!amount || !reason || !selectedBankId || !selectedSubCatId) {
      Alert.alert('Missing Details', 'Please fill amount, reason, select a bank, and a category.');
      return;
    }

    const selectedSub = subCategories.find(s => s.id === selectedSubCatId);
    const master = masterCategories.find(m => m.id === selectedSub?.master_category_id);
    const isSavings = master?.type === 'savings';

    if (isSavings && type === 'credit') {
      const currentSaved = selectedSub?.current_saved || 0;
      if (parseFloat(amount) > currentSaved) {
        Alert.alert('Error', `Amount exceeds current_saved (${currentSaved.toFixed(2)})`);
        return;
      }
    }
    
    if (editingTransaction) {
      updateExpense({
        id: editingTransaction.id,
        type: type,
        amount: parseFloat(amount),
        reason: reason,
        bank_account_id: selectedBankId,
        sub_category_id: selectedSubCatId,
        note: note || '',
        date: date.toISOString(),
      });
    } else if (master?.type === 'income') {
      receiveIncome({
        amount: parseFloat(amount),
        reason: reason,
        bank_account_id: selectedBankId,
        income_sub_category_id: selectedSubCatId,
        for_month: date.toISOString().slice(0, 7),
        note: note || '',
        date: date.toISOString(),
      });
    } else {
      // Either expense or savings
      addExpense({
        type: type,
        amount: parseFloat(amount),
        reason: reason,
        bank_account_id: selectedBankId,
        sub_category_id: selectedSubCatId,
        note: note || '',
        date: date.toISOString(),
      });
    }
    
    onClose();
  };

  const showMode = (currentMode) => {
    setShowPicker(true);
    setPickerMode(currentMode);
  };

  const availableSubCategories = subCategories.filter(sub => {
    const master = masterCategories.find(mc => mc.id === sub.master_category_id);
    if (!master) return false;
    return type === 'debit' 
      ? (master.type === 'expense' || master.type === 'savings') 
      : (master.type === 'income' || master.type === 'savings' || master.type === 'expense');
  });

  const selectedSub = subCategories.find(s => s.id === selectedSubCatId);
  const isSavingsCategory = masterCategories.find(m => m.id === selectedSub?.master_category_id)?.type === 'savings';
  
  const debitLabel = isSavingsCategory ? "Add to Goal" : "Money Out (Debit)";
  const creditLabel = isSavingsCategory ? "Use from Goal" : "Money In (Credit)";

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>{editingTransaction ? "Edit Transaction" : "Add Transaction"}</Text>
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: '80%' }}>
            
            <View style={styles.typeRow}>
                  <TouchableOpacity 
                    style={[styles.typeBtn, type === 'debit' && styles.activeDebit]} 
                    onPress={() => handleTypeChange('debit')}>
                    <Text style={[styles.typeText, type === 'debit' && styles.activeTypeText]}>{debitLabel}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.typeBtn, type === 'credit' && styles.activeCredit]} 
                    onPress={() => handleTypeChange('credit')}>
                    <Text style={[styles.typeText, type === 'credit' && styles.activeTypeText]}>{creditLabel}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.datePickerRow}>
                  <TouchableOpacity style={styles.datePickerBtn} onPress={() => showMode('date')}>
                    <Ionicons name="calendar-outline" size={20} color="#8A8A9E" style={{marginRight: 8}} />
                    <Text style={styles.datePickerText}>{date.toLocaleDateString()}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.datePickerBtn} onPress={() => showMode('time')}>
                    <Ionicons name="time-outline" size={20} color="#8A8A9E" style={{marginRight: 8}} />
                    <Text style={styles.datePickerText}>{date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                  </TouchableOpacity>
                </View>

                {showPicker && (
                  <DateTimePicker
                    value={date}
                    mode={pickerMode}
                    is24Hour={true}
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowPicker(Platform.OS === 'ios');
                      if (selectedDate) setDate(selectedDate);
                    }}
                  />
                )}

                <TextInput
                  style={styles.input}
                  placeholder="Amount (e.g. 50.00)"
                  placeholderTextColor="#8A8A9E"
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="Reason (e.g. Groceries, Salary)"
                  placeholderTextColor="#8A8A9E"
                  value={reason}
                  onChangeText={setReason}
                />

                <Dropdown 
                  label="Bank Account" 
                  items={banks} 
                  selectedId={selectedBankId} 
                  onSelect={setSelectedBankId} 
                  placeholder="Select a bank account" 
                />

                <Dropdown 
                  label="Category" 
                  items={availableSubCategories} 
                  selectedId={selectedSubCatId} 
                  onSelect={(id) => {
                    setSelectedSubCatId(id);
                    if (!editingTransaction && id) {
                      const lastTx = expenses.find(e => e.sub_category_id === id);
                      if (lastTx && lastTx.bank_account_id) {
                        setSelectedBankId(lastTx.bank_account_id);
                      }
                    }
                  }} 
                  placeholder={type === 'debit' ? "Select an expense category" : "Select an income category"} 
                />

                <TextInput
                  style={[styles.input, { marginTop: 8 }]}
                  placeholder="Note (Optional)"
                  placeholderTextColor="#8A8A9E"
                  value={note}
                  onChangeText={setNote}
                />

                {type === 'credit' && !editingTransaction && !isSavingsCategory && (
                   <TouchableOpacity 
                     style={{ backgroundColor: 'rgba(74, 222, 128, 0.1)', padding: 16, borderRadius: 12, marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                     onPress={() => {
                        onClose();
                        router.push('/payday');
                     }}
                   >
                     <Ionicons name="pie-chart" size={20} color="#4ADE80" style={{marginRight: 8}} />
                     <Text style={{ color: '#4ADE80', fontWeight: 'bold', fontSize: 16 }}>Advanced Budget Allocation</Text>
                   </TouchableOpacity>
                )}
          </ScrollView>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#1E1E2D', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  typeRow: { flexDirection: 'row', marginBottom: 16, backgroundColor: '#12121D', borderRadius: 12, padding: 4 },
  typeBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  activeDebit: { backgroundColor: '#F87171' },
  activeCredit: { backgroundColor: '#4ADE80' },
  typeText: { color: '#8A8A9E', fontWeight: 'bold' },
  activeTypeText: { color: '#12121D' },
  datePickerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  datePickerBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#12121D', padding: 16, borderRadius: 12, alignItems: 'center', marginHorizontal: 4 },
  datePickerText: { color: '#fff', fontSize: 16 },
  input: { backgroundColor: '#12121D', color: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 16 },
  label: { color: '#8A8A9E', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  
  dropdownContainer: { marginBottom: 16 },
  dropdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#12121D', borderRadius: 12, padding: 16 },
  dropdownHeaderText: { color: '#fff', fontSize: 16 },
  dropdownList: { backgroundColor: '#12121D', borderRadius: 12, marginTop: 4, overflow: 'hidden' },
  dropdownItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  dropdownItemActive: { backgroundColor: 'rgba(74, 222, 128, 0.1)' },
  dropdownItemText: { color: '#fff', fontSize: 16 },
  dropdownItemTextActive: { color: '#4ADE80', fontWeight: 'bold' },

  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  cancelButton: { flex: 1, backgroundColor: '#2A2A3D', padding: 16, borderRadius: 12, alignItems: 'center', marginRight: 8 },
  saveButton: { flex: 1, backgroundColor: '#4ADE80', padding: 16, borderRadius: 12, alignItems: 'center', marginLeft: 8 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});

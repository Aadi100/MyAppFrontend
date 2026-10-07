import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Sheet, SheetButtons, Seg, Chip, Chips, Field, Input } from '../ui/kit';
import { C, alpha } from '../ui/theme';
import LocalAI from '../services/LocalAI';

const Dropdown = ({ label, items, selectedId, onSelect, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedItem = items.find(i => i.id === selectedId);

  return (
    <Field label={label}>
      <TouchableOpacity style={[styles.dropdownHeader, isOpen && { borderColor: alpha(C.acc, 0.55) }]} onPress={() => setIsOpen(!isOpen)} activeOpacity={0.85}>
        <Text style={[styles.dropdownHeaderText, !selectedItem && { color: C.dim, fontWeight: '400' }]}>
          {selectedItem ? selectedItem.name : placeholder}
        </Text>
        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={C.mute} />
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
              {selectedId === item.id && <Ionicons name="checkmark" size={18} color={C.acc} />}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </Field>
  );
};

export default function AddTransactionModal({ visible, onClose, editingTransaction = null, isSavingsMode = false, initialType = 'debit' }) {
  const [type, setType] = useState('debit');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [selectedBankId, setSelectedBankId] = useState('');
  const [selectedSubCatId, setSelectedSubCatId] = useState('');
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState('date');
  const [allocations, setAllocations] = useState([]);

  const banks = useStore((state) => state.banks);
  const subCategories = useStore((state) => state.subCategories);
  const masterCategories = useStore((state) => state.masterCategories);
  const expenses = useStore((state) => state.expenses);
  const addExpense = useStore((state) => state.addExpense);
  const updateExpense = useStore((state) => state.updateExpense);
  const receiveIncome = useStore((state) => state.receiveIncome);
  const createSavingsTransaction = useStore((state) => state.createSavingsTransaction);

  React.useEffect(() => {
    if (visible) LocalAI.init();
    if (visible && editingTransaction) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
      setType(initialType);
      setDate(new Date());
      setAllocations([]);
      if (banks.length > 0) {
        setSelectedBankId(banks[0].id);
      }
    }
  }, [visible, editingTransaction, banks]);

  const handleTypeChange = (newType) => {
    setType(newType);
    setSelectedSubCatId('');
  };

  const handleReasonChange = async (text) => {
    setReason(text);
    if (!selectedSubCatId && !editingTransaction && text.length > 2) {
      const aiResult = await LocalAI.predict(text);
      if (aiResult.prediction && aiResult.confidence > 0.5) {
        const catName = String(aiResult.prediction);
        const matchedSub = subCategories.find(s => s.name.toLowerCase().includes(catName.toLowerCase()));
        if (matchedSub) {
          setSelectedSubCatId(matchedSub.id);
          if (matchedSub.default_bank_account_id) {
            setSelectedBankId(matchedSub.default_bank_account_id);
          } else {
            const lastTx = expenses.find(e => e.sub_category_id === matchedSub.id);
            if (lastTx && lastTx.bank_account_id) setSelectedBankId(lastTx.bank_account_id);
          }
        }
      }
    }
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

    const validAllocations = allocations.filter(a => a.sub_category_id && parseFloat(a.amount) > 0);
    const expense_allocations = [];
    const savings_allocations = [];

    validAllocations.forEach(alloc => {
      const amt = parseFloat(alloc.amount);
      const sub = subCategories.find(s => s.id === alloc.sub_category_id);
      const master = masterCategories.find(m => m.id === sub?.master_category_id);
      if (master?.type === 'savings') {
        savings_allocations.push({ sub_category_id: alloc.sub_category_id, amount: amt });
      } else {
        expense_allocations.push({ sub_category_id: alloc.sub_category_id, amount: amt });
      }
    });

    const validDate = date instanceof Date && !isNaN(date.getTime()) ? date : new Date();
    const for_month = validDate.toISOString().slice(0, 7);

    if (editingTransaction) {
      updateExpense({
        id: editingTransaction.id,
        type: type,
        amount: parseFloat(amount),
        reason: reason,
        bank_account_id: selectedBankId,
        sub_category_id: selectedSubCatId,
        note: note || '',
        date: validDate.toISOString(),
      });
    } else if (master?.type === 'income') {
      const payload = {
        amount: parseFloat(amount),
        reason: reason,
        bank_account_id: selectedBankId,
        income_sub_category_id: selectedSubCatId,
        for_month: for_month,
        note: note || '',
        date: validDate.toISOString(),
      };
      if (expense_allocations.length > 0) payload.expense_allocations = expense_allocations;
      if (savings_allocations.length > 0) payload.savings_allocations = savings_allocations;

      receiveIncome(payload);
    } else if (master?.type === 'savings') {
      const payload = {
        savings_category_id: selectedSubCatId,
        amount: parseFloat(amount),
        type: type === 'debit' ? 'invested' : 'liquid',
        direction: 'debit',
        reason: reason,
        bank_id: selectedBankId,
        date: validDate.toISOString().split('T')[0],
      };
      createSavingsTransaction(payload);
    } else {
      // Either expense
      const payload = {
        type: type,
        amount: parseFloat(amount),
        reason: reason,
        bank_account_id: selectedBankId,
        sub_category_id: selectedSubCatId,
        note: note || '',
        date: validDate.toISOString(),
        for_month: for_month,
      };
      if (expense_allocations.length > 0) payload.expense_allocations = expense_allocations;
      if (savings_allocations.length > 0) payload.savings_allocations = savings_allocations;

      addExpense(payload);
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

    if (isSavingsMode) {
      return master.type === 'savings';
    } else {
      return type === 'debit'
        ? master.type === 'expense'
        : (master.type === 'income' || master.type === 'expense'); // Not savings
    }
  });

  const expenseAndSavingsCategories = subCategories.filter(sub => {
    const master = masterCategories.find(mc => mc.id === sub.master_category_id);
    return master && (master.type === 'expense' || master.type === 'savings');
  });

  const selectedSub = subCategories.find(s => s.id === selectedSubCatId);
  const isSavingsCategory = masterCategories.find(m => m.id === selectedSub?.master_category_id)?.type === 'savings';

  const debitLabel = isSavingsMode ? "Invested" : "Money out";
  const creditLabel = isSavingsMode ? "Liquid" : "Money in";

  const safeDate = date instanceof Date && !isNaN(date.getTime()) ? date : new Date();
  const title = editingTransaction ? 'Edit transaction' : isSavingsMode ? 'Add to savings' : 'Add transaction';

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={title}
      footer={<SheetButtons onCancel={onClose} onSave={handleSave} saveLabel={editingTransaction ? 'Save changes' : isSavingsMode ? 'Save to savings' : 'Save transaction'} />}
    >
      <View style={{ marginTop: 10 }}>
        <Seg
          items={[{ key: 'debit', label: debitLabel }, { key: 'credit', label: creditLabel }]}
          value={type}
          onChange={handleTypeChange}
          colors={{ debit: C.rose, credit: C.acc }}
        />
      </View>

      <View style={{ alignItems: 'center', marginTop: 18, marginBottom: 6 }}>
        <Text style={styles.amountLabel}>AMOUNT</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4 }}>
          <Text style={styles.rs}>Rs </Text>
          <TextInput
            style={[styles.amountInput, { color: type === 'credit' && !isSavingsMode ? C.acc : C.text }]}
            placeholder="0"
            placeholderTextColor={C.dim}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity style={styles.datePickerBtn} onPress={() => showMode('date')}>
          <Ionicons name="calendar-outline" size={17} color={C.mute} style={{ marginRight: 8 }} />
          <Text style={styles.datePickerText}>{safeDate.toLocaleDateString()}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.datePickerBtn} onPress={() => showMode('time')}>
          <Ionicons name="time-outline" size={17} color={C.mute} style={{ marginRight: 8 }} />
          <Text style={styles.datePickerText}>{safeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </TouchableOpacity>
      </View>

      {showPicker && (
        <DateTimePicker
          value={safeDate}
          mode={pickerMode}
          is24Hour={true}
          display="default"
          onChange={(event, selectedDate) => {
            setShowPicker(Platform.OS === 'ios');
            if (event?.type !== 'dismissed' && selectedDate) {
              setDate(selectedDate);
            }
          }}
        />
      )}

      <View style={{ marginTop: 12 }}>
        <Input icon="pencil-outline" placeholder="Reason (e.g. Groceries, Salary)" value={reason} onChangeText={handleReasonChange} style={{ height: 50 }} />
      </View>

      <Dropdown
        label="Category"
        items={availableSubCategories}
        selectedId={selectedSubCatId}
        onSelect={(id) => {
          setSelectedSubCatId(id);
          if (!editingTransaction && id) {
            const selectedSub = subCategories.find(s => s.id === id);
            if (selectedSub?.default_bank_account_id) {
              setSelectedBankId(selectedSub.default_bank_account_id);
            } else {
              const lastTx = expenses.find(e => e.sub_category_id === id);
              if (lastTx && lastTx.bank_account_id) {
                setSelectedBankId(lastTx.bank_account_id);
              }
            }
          }
        }}
        placeholder={isSavingsMode ? 'Select a savings goal' : type === 'debit' ? 'Select an expense category' : 'Select an income category'}
      />

      <Field label="Bank account">
        <Chips>
          {banks.map(b => <Chip key={b.id} label={b.name} active={selectedBankId === b.id} onPress={() => setSelectedBankId(b.id)} />)}
        </Chips>
      </Field>

      <View style={{ marginTop: 14 }}>
        <Input icon="document-text-outline" placeholder="Add a note (optional)" value={note} onChangeText={setNote} style={{ height: 50 }} />
      </View>

      {type === 'credit' && !editingTransaction && !isSavingsCategory && !isSavingsMode && (
        <View style={{ marginTop: 20 }}>
          <Text style={styles.allocTitle}>Add to category budgets</Text>
          <Text style={styles.allocSub}>Allocations are added on top of existing budgets</Text>

          {allocations.map((alloc, index) => (
            <View key={alloc.id} style={styles.allocCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.amountLabel}>ALLOCATION #{index + 1}</Text>
                <TouchableOpacity onPress={() => setAllocations(allocations.filter(a => a.id !== alloc.id))}>
                  <Ionicons name="trash-outline" size={18} color={C.rose} />
                </TouchableOpacity>
              </View>
              <Dropdown
                label="Category to fund"
                items={expenseAndSavingsCategories}
                selectedId={alloc.sub_category_id}
                onSelect={(id) => {
                  const newAllocations = [...allocations];
                  newAllocations[index].sub_category_id = id;
                  setAllocations(newAllocations);
                }}
                placeholder="Select category"
              />
              <View style={{ marginTop: 10 }}>
                <Input
                  icon="cash-outline"
                  placeholder="Amount to add (e.g. 100)"
                  keyboardType="decimal-pad"
                  value={alloc.amount}
                  onChangeText={(val) => {
                    const newAllocations = [...allocations];
                    newAllocations[index].amount = val;
                    setAllocations(newAllocations);
                  }}
                  style={{ height: 46 }}
                />
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={styles.addAlloc}
            onPress={() => setAllocations([...allocations, { id: Date.now().toString() + Math.random(), sub_category_id: '', amount: '' }])}
          >
            <Ionicons name="add" size={18} color={C.acc} style={{ marginRight: 6 }} />
            <Text style={{ color: C.acc, fontWeight: '700', fontSize: 14 }}>Add allocation</Text>
          </TouchableOpacity>
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  amountLabel: { color: C.dim, fontSize: 11, letterSpacing: 1.3, fontWeight: '700' },
  rs: { color: C.dim, fontSize: 24, fontWeight: '700' },
  amountInput: { fontSize: 46, fontWeight: '800', letterSpacing: -1, minWidth: 80, padding: 0, textAlign: 'left' },
  datePickerBtn: { flex: 1, flexDirection: 'row', backgroundColor: C.s1, borderWidth: 1, borderColor: C.line, height: 48, paddingHorizontal: 14, borderRadius: 16, alignItems: 'center' },
  datePickerText: { color: C.text, fontSize: 14, fontWeight: '500' },
  dropdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.s1, borderWidth: 1, borderColor: C.line, borderRadius: 16, paddingHorizontal: 16, height: 50 },
  dropdownHeaderText: { color: C.text, fontSize: 15, fontWeight: '600' },
  dropdownList: { backgroundColor: '#0A0F1C', borderRadius: 18, marginTop: 6, overflow: 'hidden', borderWidth: 1, borderColor: C.line },
  dropdownItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.line },
  dropdownItemActive: { backgroundColor: alpha(C.acc, 0.1) },
  dropdownItemText: { color: C.text, fontSize: 15 },
  dropdownItemTextActive: { color: C.acc, fontWeight: '700' },
  allocTitle: { color: C.text, fontSize: 15, fontWeight: '700' },
  allocSub: { color: C.dim, fontSize: 11.5, marginTop: 2, marginBottom: 4 },
  allocCard: { backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: C.line, borderRadius: 18, padding: 12, marginTop: 10 },
  addAlloc: { marginTop: 12, height: 46, borderRadius: 15, backgroundColor: alpha(C.acc, 0.1), borderWidth: 1, borderStyle: 'dashed', borderColor: alpha(C.acc, 0.4), flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});

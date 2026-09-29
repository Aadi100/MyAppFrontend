import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../store/useStore';

export default function UdharScreen() {
  const [activeTab, setActiveTab] = useState('lent');
  const debts = useStore((state) => state.debts);
  const banks = useStore((state) => state.banks);
  const people = useStore((state) => state.people);
  const subCategories = useStore((state) => state.subCategories);
  
  const addDebt = useStore((state) => state.addDebt);
  const payDebt = useStore((state) => state.payDebt);
  const addPerson = useStore((state) => state.addPerson);
  
  const displayedDebts = debts.filter(d => d.type === activeTab);

  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ person_id: '', amount: '', source_type: 'bank', bank_account_id: '', sub_category_id: '', savings_sub_category_id: '' });
  
  const [personModalVisible, setPersonModalVisible] = useState(false);
  const [personForm, setPersonForm] = useState({ name: '', phone: '' });

  const [payModalVisible, setPayModalVisible] = useState(false);
  const [payForm, setPayForm] = useState({ debt_id: '', amount: '', bank_account_id: '' });
  const [selectedDebt, setSelectedDebt] = useState(null);

  const masterCategories = useStore((state) => state.masterCategories);
  const savingsGoals = subCategories.filter(sub => {
    const master = masterCategories.find(mc => mc.id === sub.master_category_id);
    return master && master.type === 'savings';
  });

  const handleSave = () => {
    if (!form.person_id || !form.amount) return;
    if (form.source_type === 'bank' && (!form.bank_account_id || !form.sub_category_id)) return;
    if (form.source_type === 'savings' && !form.savings_sub_category_id) return;

    if (form.source_type === 'savings') {
      addDebt({
        person_id: form.person_id,
        amount: parseFloat(form.amount),
        type: activeTab,
        source_type: 'savings',
        savings_sub_category_id: form.savings_sub_category_id
      });
    } else {
      addDebt({
        person_id: form.person_id,
        bank_account_id: form.bank_account_id,
        sub_category_id: form.sub_category_id,
        amount: parseFloat(form.amount),
        type: activeTab,
        source_type: 'bank'
      });
    }
    setForm({ person_id: '', amount: '', source_type: 'bank', bank_account_id: '', sub_category_id: '', savings_sub_category_id: '' });
    setModalVisible(false);
  };

  const handleAddPerson = () => {
    if (!personForm.name) return;
    addPerson(personForm);
    setPersonForm({ name: '', phone: '' });
    setPersonModalVisible(false);
  };

  const handlePay = () => {
    if (!payForm.amount) return;
    const isSavings = selectedDebt?.source_type === 'savings';
    if (!isSavings && !payForm.bank_account_id) return;

    payDebt({
      debt_id: payForm.debt_id,
      amount: parseFloat(payForm.amount),
      ...(isSavings ? {} : { bank_account_id: payForm.bank_account_id })
    });
    setPayForm({ debt_id: '', amount: '', bank_account_id: '' });
    setSelectedDebt(null);
    setPayModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Money Tracker</Text>

      <View style={styles.tabsContainer}>
        <View style={styles.tabs}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'lent' && styles.activeTab]}
            onPress={() => setActiveTab('lent')}
          >
            <Text style={activeTab === 'lent' ? styles.activeTabText : styles.inactiveTabText}>Money Lent</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'borrowed' && styles.activeTab]}
            onPress={() => setActiveTab('borrowed')}
          >
            <Text style={activeTab === 'borrowed' ? styles.activeTabText : styles.inactiveTabText}>Money Borrowed</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {displayedDebts.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color="#2A2A3D" />
            <Text style={styles.emptyStateText}>No records found.</Text>
          </View>
        )}
        
        {displayedDebts.map(debt => (
          <TouchableOpacity 
            key={debt.id} 
            style={styles.card}
            onPress={() => {
              if (debt.status !== 'paid') {
                setSelectedDebt(debt);
                setPayForm({ debt_id: debt.id, amount: '', bank_account_id: (debt.source_type !== 'savings' && banks.length > 0) ? banks[0].id : '' });
                setPayModalVisible(true);
              }
            }}
          >
            <View style={styles.cardLeft}>
              <View style={[styles.iconWrapper, { backgroundColor: activeTab === 'lent' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)' }]}>
                <Ionicons name={activeTab === 'lent' ? "arrow-up" : "arrow-down"} size={20} color={activeTab === 'lent' ? "#4ADE80" : "#F87171"} />
              </View>
              <View>
                <Text style={styles.name}>{people.find(p => p.id === debt.person_id)?.name || 'Unknown Person'}</Text>
                <Text style={styles.date}>{new Date(debt.date || debt.created_at || Date.now()).toLocaleDateString()}</Text>
                <Text style={{color: '#8A8A9E', fontSize: 12, marginTop: 2}}>
                  {debt.source_type === 'savings' 
                    ? `Savings: ${subCategories.find(s => s.id === debt.savings_sub_category_id)?.name || 'Unknown'}`
                    : `Bank: ${banks.find(b => b.id === debt.bank_account_id)?.name || 'Unknown'}`
                  }
                </Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.amount, { color: activeTab === 'lent' ? '#4ADE80' : '#F87171' }]}>
                Rs {debt.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: debt.status === 'paid' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(251, 191, 36, 0.2)' }]}>
                <Text style={[styles.statusText, { color: debt.status === 'paid' ? '#4ADE80' : '#FBBF24' }]}>{debt.status}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContainer}>
          <ScrollView contentContainerStyle={{flexGrow: 1, justifyContent: 'flex-end'}}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add {activeTab === 'lent' ? 'Lent' : 'Borrowed'} Record</Text>
              
              <Text style={styles.label}>Select Person:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 16}}>
                {people.map(p => (
                  <TouchableOpacity key={p.id} style={[styles.pill, form.person_id === p.id && styles.activePill]} onPress={() => setForm({...form, person_id: p.id})}>
                    <Text style={[styles.pillText, form.person_id === p.id && styles.activePillText]}>{p.name}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={[styles.pill, {backgroundColor: '#2A2A3D'}]} onPress={() => setPersonModalVisible(true)}>
                  <Text style={styles.pillText}>+ Add New</Text>
                </TouchableOpacity>
              </ScrollView>

              <Text style={styles.label}>Amount:</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor="#8A8A9E"
                keyboardType="decimal-pad"
                value={form.amount}
                onChangeText={(val) => setForm({ ...form, amount: val })}
              />

              <Text style={styles.label}>Source Type:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 16}}>
                <TouchableOpacity style={[styles.pill, form.source_type === 'bank' && styles.activePill]} onPress={() => setForm({...form, source_type: 'bank'})}>
                  <Text style={[styles.pillText, form.source_type === 'bank' && styles.activePillText]}>Bank Account</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.pill, form.source_type === 'savings' && styles.activePill]} onPress={() => setForm({...form, source_type: 'savings'})}>
                  <Text style={[styles.pillText, form.source_type === 'savings' && styles.activePillText]}>Savings Goal</Text>
                </TouchableOpacity>
              </ScrollView>

              {form.source_type === 'bank' ? (
                <>
                  <Text style={styles.label}>Bank Account:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 16}}>
                    {banks.map(b => (
                      <TouchableOpacity key={b.id} style={[styles.pill, form.bank_account_id === b.id && styles.activePill]} onPress={() => setForm({...form, bank_account_id: b.id})}>
                        <Text style={[styles.pillText, form.bank_account_id === b.id && styles.activePillText]}>{b.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <Text style={styles.label}>Category:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 16}}>
                    {subCategories.map(c => (
                      <TouchableOpacity key={c.id} style={[styles.pill, form.sub_category_id === c.id && styles.activePill]} onPress={() => setForm({...form, sub_category_id: c.id})}>
                        <Text style={[styles.pillText, form.sub_category_id === c.id && styles.activePillText]}>{c.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              ) : (
                <>
                  <Text style={styles.label}>Savings Goal:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 16}}>
                    {savingsGoals.map(c => (
                      <TouchableOpacity key={c.id} style={[styles.pill, form.savings_sub_category_id === c.id && styles.activePill]} onPress={() => setForm({...form, savings_sub_category_id: c.id})}>
                        <Text style={[styles.pillText, form.savings_sub_category_id === c.id && styles.activePillText]}>{c.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}
              
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.buttonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Person Modal */}
      <Modal visible={personModalVisible} animationType="fade" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Person</Text>
            <TextInput
              style={styles.input}
              placeholder="Name (e.g. Ali Khan)"
              placeholderTextColor="#8A8A9E"
              value={personForm.name}
              onChangeText={(val) => setPersonForm({ ...personForm, name: val })}
              autoFocus
            />
            <TextInput
              style={styles.input}
              placeholder="Phone (Optional)"
              placeholderTextColor="#8A8A9E"
              value={personForm.phone}
              onChangeText={(val) => setPersonForm({ ...personForm, phone: val })}
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setPersonModalVisible(false)}><Text style={styles.buttonText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleAddPerson}><Text style={styles.buttonText}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Pay Debt Modal */}
      <Modal visible={payModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Record Repayment</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Amount to record (e.g. 50)"
              placeholderTextColor="#8A8A9E"
              keyboardType="decimal-pad"
              value={payForm.amount}
              onChangeText={(val) => setPayForm({ ...payForm, amount: val })}
              autoFocus
            />
            
            {selectedDebt?.source_type !== 'savings' && (
              <>
                <Text style={{color: '#8A8A9E', marginBottom: 8, fontWeight: '600'}}>Bank Account for transaction:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 20}}>
                  {banks.map(bank => (
                    <TouchableOpacity 
                      key={bank.id} 
                      style={[{backgroundColor: '#2A2A3D', padding: 10, paddingHorizontal: 16, borderRadius: 20, marginRight: 8}, payForm.bank_account_id === bank.id && {backgroundColor: '#4ADE80'}]}
                      onPress={() => setPayForm({...payForm, bank_account_id: bank.id})}
                    >
                      <Text style={[{color: '#8A8A9E', fontWeight: 'bold'}, payForm.bank_account_id === bank.id && {color: '#12121D'}]}>{bank.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}
            
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setPayModalVisible(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handlePay}>
                <Text style={styles.buttonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B14', paddingHorizontal: 24, paddingTop: 24 },
  header: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  tabsContainer: { backgroundColor: '#1E1E2D', borderRadius: 16, padding: 4, marginBottom: 24 },
  tabs: { flexDirection: 'row' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  activeTab: { backgroundColor: '#2A2A3D', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  activeTabText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  inactiveTabText: { color: '#8A8A9E', fontWeight: '600', fontSize: 14 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyStateText: { color: '#8A8A9E', marginTop: 12, fontSize: 16 },
  card: { backgroundColor: '#1E1E2D', borderRadius: 20, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLeft: { flexDirection: 'row', alignItems: 'center' },
  iconWrapper: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  name: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  date: { color: '#8A8A9E', fontSize: 12, marginTop: 4 },
  amount: { fontSize: 18, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 6 },
  statusText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  fab: { position: 'absolute', bottom: 30, right: 24, backgroundColor: '#4ADE80', width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', shadowColor: '#4ADE80', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#1E1E2D', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: { backgroundColor: '#12121D', color: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 16 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  cancelButton: { flex: 1, backgroundColor: '#2A2A3D', padding: 16, borderRadius: 12, alignItems: 'center', marginRight: 8 },
  saveButton: { flex: 1, backgroundColor: '#4ADE80', padding: 16, borderRadius: 12, alignItems: 'center', marginLeft: 8 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  label: { color: '#8A8A9E', fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 4 },
  pill: { backgroundColor: '#2A2A3D', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 8 },
  activePill: { backgroundColor: '#4ADE80' },
  pillText: { color: '#8A8A9E', fontWeight: '600' },
  activePillText: { color: '#12121D' }
});

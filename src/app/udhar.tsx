import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform, LayoutAnimation } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../store/useStore';

export default function UdharScreen() {
  const peopleSummary = useStore((state) => state.peopleSummary) || [];
  const banks = useStore((state) => state.banks);
  const people = useStore((state) => state.people);
  const subCategories = useStore((state) => state.subCategories);
  const masterCategories = useStore((state) => state.masterCategories);
  
  const addDebt = useStore((state) => state.addDebt);
  const payDebt = useStore((state) => state.payDebt);
  const addPerson = useStore((state) => state.addPerson);

  const [expandedPersonId, setExpandedPersonId] = useState(null);
  
  // Create / Pay Modals
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('lent');
  const [form, setForm] = useState({ person_id: '', amount: '', source_type: 'bank', bank_account_id: '', sub_category_id: '', savings_sub_category_id: '' });
  
  const [personModalVisible, setPersonModalVisible] = useState(false);
  const [personForm, setPersonForm] = useState({ name: '', phone: '' });

  const [payModalVisible, setPayModalVisible] = useState(false);
  const [payForm, setPayForm] = useState({ debt_id: '', amount: '', bank_account_id: '' });
  const [selectedDebt, setSelectedDebt] = useState(null);

  const savingsGoals = subCategories.filter(sub => {
    const master = masterCategories.find(mc => mc.id === sub.master_category_id);
    return master && master.type === 'savings';
  });

  const togglePerson = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedPersonId(expandedPersonId === id ? null : id);
  };

  const handleSave = () => {
    if (!form.person_id || !form.amount) return;
    if (form.source_type === 'savings' && !form.savings_sub_category_id) return;

    const payload = {
      person_id: form.person_id,
      amount: parseFloat(form.amount),
      type: activeTab,
      source_type: form.source_type,
      date: new Date().toISOString()
    };

    if (form.source_type === 'savings') {
      payload.savings_sub_category_id = form.savings_sub_category_id;
    } else {
      payload.bank_account_id = form.bank_account_id || null;
      payload.sub_category_id = form.sub_category_id || null;
    }

    addDebt(payload);
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

    payDebt({
      debt_id: payForm.debt_id,
      amount: parseFloat(payForm.amount),
      date: new Date().toISOString(),
      ...(isSavings ? {} : (payForm.bank_account_id ? { bank_account_id: payForm.bank_account_id } : {}))
    });
    setPayForm({ debt_id: '', amount: '', bank_account_id: '' });
    setSelectedDebt(null);
    setPayModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Ledger</Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        {peopleSummary.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#2A2A3D" />
            <Text style={styles.emptyStateText}>No ledger records found.</Text>
          </View>
        )}
        
        {peopleSummary.map(person => {
          const isExpanded = expandedPersonId === person.person_id;
          const netColor = person.net > 0 ? '#4ADE80' : (person.net < 0 ? '#F87171' : '#8A8A9E');
          
          return (
            <View key={person.person_id} style={styles.personCard}>
              <TouchableOpacity style={styles.personHeader} onPress={() => togglePerson(person.person_id)}>
                <View style={styles.personInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{person.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={styles.name}>{person.name}</Text>
                    {person.net > 0 ? (
                      <Text style={[styles.netText, { color: netColor }]}>Owes you Rs {person.net.toLocaleString()}</Text>
                    ) : person.net < 0 ? (
                      <Text style={[styles.netText, { color: netColor }]}>You owe Rs {Math.abs(person.net).toLocaleString()}</Text>
                    ) : (
                      <Text style={[styles.netText, { color: netColor }]}>Settled up</Text>
                    )}
                  </View>
                </View>
                <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#8A8A9E" />
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.debtsContainer}>
                  {person.debts.length === 0 && (
                    <Text style={{color: '#8A8A9E', fontSize: 12, textAlign: 'center', marginVertical: 8}}>No active records.</Text>
                  )}
                  {person.debts.map(debt => (
                    <TouchableOpacity 
                      key={debt.id} 
                      style={styles.debtItem}
                      onPress={() => {
                        if (debt.status !== 'paid') {
                          setSelectedDebt(debt);
                          setPayForm({ debt_id: debt.id, amount: '', bank_account_id: (debt.source_type !== 'savings' && banks.length > 0) ? banks[0].id : '' });
                          setPayModalVisible(true);
                        }
                      }}
                    >
                      <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Ionicons 
                          name={debt.type === 'lent' ? "arrow-up" : "arrow-down"} 
                          size={16} 
                          color={debt.type === 'lent' ? "#4ADE80" : "#F87171"} 
                          style={{marginRight: 8}}
                        />
                        <View>
                          <Text style={{color: '#fff', fontSize: 14}}>{debt.type === 'lent' ? 'Lent' : 'Borrowed'}</Text>
                          <Text style={{color: '#8A8A9E', fontSize: 11}}>
                            {new Date(debt.date || Date.now()).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.amount, { color: debt.type === 'lent' ? '#4ADE80' : '#F87171' }]}>
                          Rs {debt.remaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                        <Text style={[styles.statusText, { color: debt.status === 'paid' ? '#4ADE80' : '#FBBF24', fontSize: 10, marginTop: 2 }]}>
                          {debt.status}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          );
        })}
        <View style={{height: 100}} />
      </ScrollView>

      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.fabLent} onPress={() => { setActiveTab('lent'); setModalVisible(true); }}>
          <LinearGradient colors={['#4ADE80', '#10B981']} style={styles.fabGradient}>
            <Ionicons name="arrow-up" size={24} color="#12121D" />
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.fabBorrowed} onPress={() => { setActiveTab('borrowed'); setModalVisible(true); }}>
          <LinearGradient colors={['#F87171', '#DC2626']} style={styles.fabGradient}>
            <Ionicons name="arrow-down" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* CREATE RECORD MODAL */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{activeTab === 'lent' ? 'Record Lent Money' : 'Record Borrowed Money'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Amount</Text>
              <TextInput style={styles.input} placeholder="0.00" placeholderTextColor="#8A8A9E" keyboardType="numeric" value={form.amount} onChangeText={(val) => setForm({...form, amount: val})} />

              <View style={styles.row}>
                <Text style={styles.label}>Select Person</Text>
                <TouchableOpacity onPress={() => setPersonModalVisible(true)}>
                  <Text style={{color: '#4ADE80', fontSize: 14, fontWeight: 'bold'}}>+ Add New</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.pillsContainer}>
                {people.map(p => (
                  <TouchableOpacity key={p.id} style={[styles.pill, form.person_id === p.id && styles.activePill]} onPress={() => setForm({...form, person_id: p.id})}>
                    <Text style={[styles.pillText, form.person_id === p.id && styles.activePillText]}>{p.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Source</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                <TouchableOpacity style={[styles.pill, form.source_type === 'bank' && styles.activePill, { flex: 1 }]} onPress={() => setForm({...form, source_type: 'bank'})}>
                  <Text style={[styles.pillText, form.source_type === 'bank' && styles.activePillText]}>Bank Account</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.pill, form.source_type === 'savings' && styles.activePill, { flex: 1 }]} onPress={() => setForm({...form, source_type: 'savings'})}>
                  <Text style={[styles.pillText, form.source_type === 'savings' && styles.activePillText]}>Savings Goal</Text>
                </TouchableOpacity>
              </View>

              {form.source_type === 'bank' && (
                <>
                  <Text style={styles.label}>Bank Account (Optional)</Text>
                  <View style={styles.pillsContainer}>
                    {banks.map(b => (
                      <TouchableOpacity key={b.id} style={[styles.pill, form.bank_account_id === b.id && styles.activePill]} onPress={() => setForm({...form, bank_account_id: form.bank_account_id === b.id ? '' : b.id})}>
                        <Text style={[styles.pillText, form.bank_account_id === b.id && styles.activePillText]}>{b.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>Sub Category (Optional)</Text>
                  <View style={styles.pillsContainer}>
                    {subCategories.filter(sc => !masterCategories.find(mc => mc.id === sc.master_category_id)?.type).map(sc => (
                      <TouchableOpacity key={sc.id} style={[styles.pill, form.sub_category_id === sc.id && styles.activePill]} onPress={() => setForm({...form, sub_category_id: form.sub_category_id === sc.id ? '' : sc.id})}>
                        <Text style={[styles.pillText, form.sub_category_id === sc.id && styles.activePillText]}>{sc.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {form.source_type === 'savings' && (
                <>
                  <Text style={styles.label}>Savings Goal</Text>
                  <View style={styles.pillsContainer}>
                    {savingsGoals.map(sg => (
                      <TouchableOpacity key={sg.id} style={[styles.pill, form.savings_sub_category_id === sg.id && styles.activePill]} onPress={() => setForm({...form, savings_sub_category_id: form.savings_sub_category_id === sg.id ? '' : sg.id})}>
                        <Text style={[styles.pillText, form.savings_sub_category_id === sg.id && styles.activePillText]}>{sg.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <LinearGradient colors={['#4ADE80', '#10B981']} style={styles.saveBtnGradient}>
                  <Text style={styles.saveBtnText}>Save Record</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ADD PERSON MODAL */}
      <Modal visible={personModalVisible} transparent={true} animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Person</Text>
              <TouchableOpacity onPress={() => setPersonModalVisible(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.label}>Name</Text>
            <TextInput style={styles.input} placeholder="John Doe" placeholderTextColor="#8A8A9E" value={personForm.name} onChangeText={(val) => setPersonForm({...personForm, name: val})} />
            
            <Text style={styles.label}>Phone (Optional)</Text>
            <TextInput style={styles.input} placeholder="+92..." placeholderTextColor="#8A8A9E" keyboardType="phone-pad" value={personForm.phone} onChangeText={(val) => setPersonForm({...personForm, phone: val})} />
            
            <TouchableOpacity style={styles.saveBtn} onPress={handleAddPerson}>
              <LinearGradient colors={['#4ADE80', '#10B981']} style={styles.saveBtnGradient}>
                <Text style={styles.saveBtnText}>Save Person</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* PAY MODAL */}
      <Modal visible={payModalVisible} transparent={true} animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedDebt?.type === 'lent' ? 'Receive Payment' : 'Make Payment'}</Text>
              <TouchableOpacity onPress={() => setPayModalVisible(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Amount</Text>
            <TextInput style={styles.input} placeholder={`Max: ${selectedDebt?.remaining}`} placeholderTextColor="#8A8A9E" keyboardType="numeric" value={payForm.amount} onChangeText={(val) => setPayForm({...payForm, amount: val})} />

            {selectedDebt?.source_type !== 'savings' && (
              <>
                <Text style={styles.label}>Bank Account (Optional)</Text>
                <View style={styles.pillsContainer}>
                  {banks.map(b => (
                    <TouchableOpacity key={b.id} style={[styles.pill, payForm.bank_account_id === b.id && styles.activePill]} onPress={() => setPayForm({...payForm, bank_account_id: payForm.bank_account_id === b.id ? '' : b.id})}>
                      <Text style={[styles.pillText, payForm.bank_account_id === b.id && styles.activePillText]}>{b.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <TouchableOpacity style={styles.saveBtn} onPress={handlePay}>
              <LinearGradient colors={['#4ADE80', '#10B981']} style={styles.saveBtnGradient}>
                <Text style={styles.saveBtnText}>Confirm Payment</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090E', paddingTop: 60, paddingHorizontal: 24 },
  header: { fontSize: 28, fontWeight: '800', color: '#F8FAFC', marginBottom: 24, letterSpacing: -0.5 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyStateText: { color: '#64748B', marginTop: 12, fontSize: 16, fontStyle: 'italic' },
  personCard: { backgroundColor: '#13131A', borderRadius: 24, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  personHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  personInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(74, 222, 128, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarText: { color: '#4ADE80', fontSize: 18, fontWeight: '800' },
  name: { color: '#E2E8F0', fontSize: 18, fontWeight: '800' },
  netText: { fontSize: 13, marginTop: 4, fontWeight: '600' },
  debtsContainer: { backgroundColor: '#0F1015', padding: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.03)' },
  debtItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  amount: { fontSize: 16, fontWeight: '800' },
  statusText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  fabContainer: { position: 'absolute', bottom: 24, right: 24, flexDirection: 'row', gap: 16 },
  fabLent: { width: 64, height: 64, borderRadius: 32, overflow: 'hidden', elevation: 8, shadowColor: '#10B981', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 8 } },
  fabBorrowed: { width: 64, height: 64, borderRadius: 32, overflow: 'hidden', elevation: 8, shadowColor: '#EF4444', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 8 } },
  fabGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#13131A', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '90%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#F8FAFC' },
  label: { color: '#94A3B8', fontSize: 13, fontWeight: '600', marginBottom: 12, marginTop: 20, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#1E293B', borderRadius: 16, padding: 18, color: '#F8FAFC', fontSize: 16, fontWeight: '500' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { backgroundColor: '#1E293B', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  activePill: { backgroundColor: 'rgba(74, 222, 128, 0.1)', borderColor: '#4ADE80' },
  pillText: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
  activePillText: { color: '#4ADE80', fontWeight: '800' },
  saveBtn: { height: 60, borderRadius: 16, overflow: 'hidden', marginTop: 32, shadowColor: '#10B981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  saveBtnGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { color: '#0F1015', fontSize: 16, fontWeight: '800' }
});

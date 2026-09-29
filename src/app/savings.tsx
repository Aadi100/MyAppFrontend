import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../store/useStore';

export default function SavingsScreen() {
  const subCategories = useStore((state) => state.subCategories);
  const masterCategories = useStore((state) => state.masterCategories);
  const banks = useStore((state) => state.banks);
  const addSubCategory = useStore((state) => state.addSubCategory);
  const addExpense = useStore((state) => state.addExpense);
  const dashboardSummary = useStore((state) => state.dashboardSummary);
  
  const savings = subCategories.filter(sub => {
    const master = masterCategories.find(mc => mc.id === sub.master_category_id);
    return master && master.type === 'savings';
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ title: '', target_amount: '' });

  const [contributeModalVisible, setContributeModalVisible] = useState(false);
  const [contributeForm, setContributeForm] = useState({ sub_category_id: '', amount: '', bank_account_id: '' });

  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({ sub_category_id: '', amount: '', reason: '', bank_account_id: '' });

  const handleSave = () => {
    if (!form.title || !form.target_amount) return;
    
    let savingsMaster = masterCategories.find(mc => mc.type === 'savings');
    if (!savingsMaster) {
      alert("Please create a Master Category with type 'Savings' in Settings first.");
      return;
    }

    addSubCategory({
      name: form.title,
      assigned_budget: parseFloat(form.target_amount),
      master_category_id: savingsMaster.id
    });
    setForm({ title: '', target_amount: '' });
    setModalVisible(false);
  };

  const handleContribute = () => {
    if (!contributeForm.amount || !contributeForm.bank_account_id) return;
    addExpense({
      type: 'debit',
      amount: parseFloat(contributeForm.amount),
      reason: 'Savings Contribution',
      sub_category_id: contributeForm.sub_category_id,
      bank_account_id: contributeForm.bank_account_id,
      date: new Date().toISOString()
    });
    setContributeForm({ sub_category_id: '', amount: '', bank_account_id: '' });
    setContributeModalVisible(false);
  };

  const handleWithdraw = () => {
    if (!withdrawForm.amount || !withdrawForm.bank_account_id) return;
    addExpense({
      type: 'credit',
      amount: parseFloat(withdrawForm.amount),
      reason: withdrawForm.reason || 'Savings Withdrawal',
      sub_category_id: withdrawForm.sub_category_id,
      bank_account_id: withdrawForm.bank_account_id,
      date: new Date().toISOString()
    });
    setWithdrawForm({ sub_category_id: '', amount: '', reason: '', bank_account_id: '' });
    setWithdrawModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Savings Goals</Text>
        <Ionicons name="trophy" size={28} color="#FBBF24" />
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {savings.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={48} color="#2A2A3D" />
            <Text style={styles.emptyStateText}>No savings goals yet. Start saving!</Text>
          </View>
        )}
        
        {(() => {
          const savingsProgressArray = dashboardSummary?.savings_progress || [];
          return savings.map((goal) => {
            const enrichedGoal = savingsProgressArray.find(s => s.sub_category_id === goal.id) || goal;
          
          const target = goal.assigned_budget || 0;
          const current = enrichedGoal.current_saved || goal.current_saved || 0;
          const lentOut = enrichedGoal.lent_out || goal.lent_out || 0;
          const totalVal = enrichedGoal.total_value !== undefined ? enrichedGoal.total_value : (current + lentOut);

          const progress = target > 0 ? Math.min((totalVal / target) * 100, 100) : 0;
          const isComplete = progress >= 100 && target > 0;
          return (
            <TouchableOpacity 
              key={goal.id} 
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => {
                if (!isComplete) {
                  setContributeForm({ sub_category_id: goal.id, amount: '', bank_account_id: banks.length > 0 ? banks[0].id : '' });
                  setContributeModalVisible(true);
                }
              }}
              onLongPress={() => {
                if (current > 0) {
                  setWithdrawForm({ sub_category_id: goal.id, amount: '', reason: '', bank_account_id: banks.length > 0 ? banks[0].id : '' });
                  setWithdrawModalVisible(true);
                }
              }}
            >
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardTitle}>{goal.name}</Text>
                  <Text style={styles.progressText}>{progress.toFixed(0)}% Complete</Text>
                </View>
                <View style={{alignItems: 'flex-end'}}>
                  <Text style={styles.amount}>
                    Rs {totalVal.toLocaleString()} <Text style={styles.targetAmount}>/ Rs {target.toLocaleString()}</Text>
                  </Text>
                  {lentOut > 0 && (
                    <Text style={styles.lentText}>
                      Rs {current.toLocaleString()} saved • Rs {lentOut.toLocaleString()} lent
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.progressBarBackground}>
                <LinearGradient 
                  colors={isComplete ? ['#FBBF24', '#F59E0B'] : ['#4ADE80', '#10B981']} 
                  style={[styles.progressBarFill, { width: `${progress}%` }]} 
                  start={{x: 0, y: 0}} end={{x: 1, y: 0}} 
                />
              </View>
            </TouchableOpacity>
          );
          });
        })()}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <LinearGradient colors={['#4ADE80', '#10B981']} style={styles.fabGradient} start={{x: 0, y: 0}} end={{x: 1, y: 1}}>
          <Ionicons name="add" size={32} color="#0F1015" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Modals remain structurally similar, just styling tweaks */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Savings Goal</Text>
            
            <TextInput style={styles.input} placeholder="Goal Title (e.g. Dream Car)" placeholderTextColor="#64748B" value={form.title} onChangeText={(val) => setForm({ ...form, title: val })} />
            <TextInput style={styles.input} placeholder="Target Amount (e.g. 50000)" placeholderTextColor="#64748B" keyboardType="decimal-pad" value={form.target_amount} onChangeText={(val) => setForm({ ...form, target_amount: val })} />
            
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={contributeModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Contribute to Goal</Text>
            
            <TextInput style={styles.input} placeholder="Amount (e.g. 500)" placeholderTextColor="#64748B" keyboardType="decimal-pad" value={contributeForm.amount} onChangeText={(val) => setContributeForm({ ...contributeForm, amount: val })} autoFocus />
            
            <Text style={styles.pickerLabel}>Fund from Bank Account:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 20}}>
              {banks.map(bank => (
                <TouchableOpacity key={bank.id} style={[styles.pill, contributeForm.bank_account_id === bank.id && styles.activePill]} onPress={() => setContributeForm({...contributeForm, bank_account_id: bank.id})}>
                  <Text style={[styles.pillText, contributeForm.bank_account_id === bank.id && styles.activePillText]}>{bank.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setContributeModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleContribute}>
                <Text style={styles.saveButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={withdrawModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Withdraw Saved Money</Text>
            
            <TextInput style={styles.input} placeholder="Amount to withdraw" placeholderTextColor="#64748B" keyboardType="decimal-pad" value={withdrawForm.amount} onChangeText={(val) => setWithdrawForm({ ...withdrawForm, amount: val })} autoFocus />
            <TextInput style={styles.input} placeholder="Reason (e.g. Bought mutual funds)" placeholderTextColor="#64748B" value={withdrawForm.reason} onChangeText={(val) => setWithdrawForm({ ...withdrawForm, reason: val })} />
            
            <Text style={styles.pickerLabel}>Withdraw to Bank Account:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 20}}>
              {banks.map(bank => (
                <TouchableOpacity key={bank.id} style={[styles.pill, withdrawForm.bank_account_id === bank.id && styles.activePill]} onPress={() => setWithdrawForm({...withdrawForm, bank_account_id: bank.id})}>
                  <Text style={[styles.pillText, withdrawForm.bank_account_id === bank.id && styles.activePillText]}>{bank.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setWithdrawModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveButton, {backgroundColor: '#F87171'}]} onPress={handleWithdraw}>
                <Text style={[styles.saveButtonText, {color: '#fff'}]}>Withdraw</Text>
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { color: '#F8FAFC', fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyStateText: { color: '#64748B', marginTop: 16, fontSize: 15 },
  
  card: { backgroundColor: '#13131A', borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  cardTitle: { color: '#E2E8F0', fontSize: 18, fontWeight: '800' },
  progressText: { color: '#64748B', fontSize: 13, marginTop: 4, fontWeight: '600' },
  amount: { color: '#4ADE80', fontSize: 16, fontWeight: '900' },
  targetAmount: { color: '#64748B', fontWeight: '500' },
  lentText: { color: '#60A5FA', fontSize: 11, marginTop: 4, fontWeight: '600' },
  
  progressBarBackground: { height: 10, backgroundColor: '#1E293B', borderRadius: 5, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 5 },
  
  fab: { position: 'absolute', bottom: 32, right: 24, width: 60, height: 60, borderRadius: 30, overflow: 'hidden', elevation: 12, shadowColor: '#10B981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16 },
  fabGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContent: { backgroundColor: '#13131A', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  modalTitle: { color: '#F8FAFC', fontSize: 22, fontWeight: '800', marginBottom: 24 },
  input: { backgroundColor: '#1E293B', color: '#F8FAFC', borderRadius: 16, padding: 18, marginBottom: 16, fontSize: 16, fontWeight: '500' },
  pickerLabel: { color: '#94A3B8', marginBottom: 12, fontWeight: '600', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 },
  pill: { backgroundColor: '#1E293B', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  activePill: { backgroundColor: 'rgba(74, 222, 128, 0.1)', borderColor: '#4ADE80' },
  pillText: { color: '#94A3B8', fontWeight: '600' },
  activePillText: { color: '#4ADE80', fontWeight: '800' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  cancelButton: { flex: 1, backgroundColor: '#1E293B', padding: 18, borderRadius: 16, alignItems: 'center', marginRight: 8 },
  saveButton: { flex: 1, backgroundColor: '#4ADE80', padding: 18, borderRadius: 16, alignItems: 'center', marginLeft: 8 },
  cancelButtonText: { color: '#E2E8F0', fontWeight: '700', fontSize: 16 },
  saveButtonText: { color: '#0F1015', fontWeight: '800', fontSize: 16 }
});

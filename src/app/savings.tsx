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
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {savings.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={48} color="#2A2A3D" />
            <Text style={styles.emptyStateText}>No savings goals yet. Start saving!</Text>
          </View>
        )}
        
        {(() => {
          const savingsProgressArray = dashboardSummary?.savings_progress || [];
          return savings.map((goal) => {
            // If dashboardSummary has enriched data, use it, otherwise fallback to goal properties
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
              <View style={styles.header}>
                <View>
                  <Text style={styles.cardTitle}>{goal.name}</Text>
                  <Text style={styles.progressText}>{progress.toFixed(0)}% Complete</Text>
                </View>
                <View style={{alignItems: 'flex-end'}}>
                  <Text style={styles.amount}>
                    Rs {totalVal.toLocaleString()} / <Text style={styles.targetAmount}>Rs {target.toLocaleString()}</Text>
                  </Text>
                  {lentOut > 0 && (
                    <Text style={{color: '#60A5FA', fontSize: 10, marginTop: 4}}>
                      Rs {current.toLocaleString()} available + Rs {lentOut.toLocaleString()} lent
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

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Savings Goal</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Goal Title (e.g. Dream Car)"
              placeholderTextColor="#8A8A9E"
              value={form.title}
              onChangeText={(val) => setForm({ ...form, title: val })}
            />
            <TextInput
              style={styles.input}
              placeholder="Target Amount (e.g. 50000)"
              placeholderTextColor="#8A8A9E"
              keyboardType="decimal-pad"
              value={form.target_amount}
              onChangeText={(val) => setForm({ ...form, target_amount: val })}
            />
            
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.buttonText}>Save Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Contribute Modal */}
      <Modal visible={contributeModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Contribute to Goal</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Amount (e.g. 500)"
              placeholderTextColor="#8A8A9E"
              keyboardType="decimal-pad"
              value={contributeForm.amount}
              onChangeText={(val) => setContributeForm({ ...contributeForm, amount: val })}
              autoFocus
            />
            
            <Text style={{color: '#8A8A9E', marginBottom: 8, fontWeight: '600'}}>Fund from Bank Account:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 20}}>
              {banks.map(bank => (
                <TouchableOpacity 
                  key={bank.id} 
                  style={[{backgroundColor: '#2A2A3D', padding: 10, paddingHorizontal: 16, borderRadius: 20, marginRight: 8}, contributeForm.bank_account_id === bank.id && {backgroundColor: '#4ADE80'}]}
                  onPress={() => setContributeForm({...contributeForm, bank_account_id: bank.id})}
                >
                  <Text style={[{color: '#8A8A9E', fontWeight: 'bold'}, contributeForm.bank_account_id === bank.id && {color: '#12121D'}]}>{bank.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setContributeModalVisible(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleContribute}>
                <Text style={styles.buttonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Withdraw Modal */}
      <Modal visible={withdrawModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Withdraw Saved Money</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Amount to withdraw"
              placeholderTextColor="#8A8A9E"
              keyboardType="decimal-pad"
              value={withdrawForm.amount}
              onChangeText={(val) => setWithdrawForm({ ...withdrawForm, amount: val })}
              autoFocus
            />

            <TextInput
              style={styles.input}
              placeholder="Reason (e.g. Bought mutual funds)"
              placeholderTextColor="#8A8A9E"
              value={withdrawForm.reason}
              onChangeText={(val) => setWithdrawForm({ ...withdrawForm, reason: val })}
            />
            
            <Text style={{color: '#8A8A9E', marginBottom: 8, fontWeight: '600'}}>Withdraw to Bank Account:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 20}}>
              {banks.map(bank => (
                <TouchableOpacity 
                  key={bank.id} 
                  style={[{backgroundColor: '#2A2A3D', padding: 10, paddingHorizontal: 16, borderRadius: 20, marginRight: 8}, withdrawForm.bank_account_id === bank.id && {backgroundColor: '#4ADE80'}]}
                  onPress={() => setWithdrawForm({...withdrawForm, bank_account_id: bank.id})}
                >
                  <Text style={[{color: '#8A8A9E', fontWeight: 'bold'}, withdrawForm.bank_account_id === bank.id && {color: '#12121D'}]}>{bank.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setWithdrawModalVisible(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveButton, {backgroundColor: '#F87171'}]} onPress={handleWithdraw}>
                <Text style={styles.buttonText}>Withdraw</Text>
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyStateText: { color: '#8A8A9E', marginTop: 12, fontSize: 16 },
  card: { backgroundColor: '#1E1E2D', borderRadius: 24, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  progressText: { color: '#8A8A9E', fontSize: 12, marginTop: 4, fontWeight: '600' },
  amount: { color: '#4ADE80', fontSize: 16, fontWeight: '900' },
  targetAmount: { color: '#8A8A9E', fontWeight: '500' },
  progressBarBackground: { height: 12, backgroundColor: '#2A2A3D', borderRadius: 6, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 6 },
  fab: { position: 'absolute', bottom: 30, right: 24, backgroundColor: '#4ADE80', width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', shadowColor: '#4ADE80', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#1E1E2D', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: { backgroundColor: '#12121D', color: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 16 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  cancelButton: { flex: 1, backgroundColor: '#2A2A3D', padding: 16, borderRadius: 12, alignItems: 'center', marginRight: 8 },
  saveButton: { flex: 1, backgroundColor: '#4ADE80', padding: 16, borderRadius: 12, alignItems: 'center', marginLeft: 8 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});

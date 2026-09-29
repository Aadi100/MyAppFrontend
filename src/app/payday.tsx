import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../store/useStore';
import { useRouter } from 'expo-router';

export default function PaydayScreen() {
  const router = useRouter();
  const [salary, setSalary] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const allSubCategories = useStore(state => state.subCategories);
  const masterCategories = useStore(state => state.masterCategories);
  const banks = useStore(state => state.banks);
  const [forMonth, setForMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedIncomeCat, setSelectedIncomeCat] = useState('');

  const incomeCategories = allSubCategories.filter(sub => {
    const master = masterCategories.find(mc => mc.id === sub.master_category_id);
    return master && master.type === 'income';
  });

  const subCategories = allSubCategories.filter(sub => {
    const master = masterCategories.find(mc => mc.id === sub.master_category_id);
    return master && master.type === 'expense';
  });

  const savingsGoals = allSubCategories.filter(sub => {
    const master = masterCategories.find(mc => mc.id === sub.master_category_id);
    return master && master.type === 'savings';
  });
  const [subAllocations, setSubAllocations] = useState({});
  const [savingsAllocations, setSavingsAllocations] = useState({});
  const allocatePayday = useStore(state => state.allocatePayday);
  const receiveIncome = useStore(state => state.receiveIncome);

  const totalSub = Object.values(subAllocations).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  const totalSav = Object.values(savingsAllocations).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  const totalAllocated = totalSub + totalSav;
  const totalSalary = parseFloat(salary) || 0;
  const remaining = totalSalary - totalAllocated;

  const handleUpdateSub = (id, val) => setSubAllocations({ ...subAllocations, [id]: val });
  const handleUpdateSav = (id, val) => setSavingsAllocations({ ...savingsAllocations, [id]: val });

  const handleSave = async () => {
    const sub_category_allocations = Object.keys(subAllocations)
      .map(key => ({ sub_category_id: key, amount: parseFloat(subAllocations[key]) || 0 }))
      .filter(a => a.amount > 0);

    const savings_allocations = Object.keys(savingsAllocations)
      .map(key => ({ sub_category_id: key, amount: parseFloat(savingsAllocations[key]) || 0 }))
      .filter(a => a.amount > 0);

    if ((sub_category_allocations.length > 0 || savings_allocations.length > 0 || totalSalary > 0) && !selectedBank) {
      return Alert.alert("Wait", "Please select a bank account to fund or receive.");
    }
    
    if (totalSalary > 0 && !selectedIncomeCat) {
      return Alert.alert("Wait", "Please select an income category for this salary.");
    }

    if (sub_category_allocations.length > 0 || savings_allocations.length > 0 || totalSalary > 0) {
      if (totalSalary > 0) {
        await receiveIncome({
          bank_account_id: selectedBank,
          income_sub_category_id: selectedIncomeCat,
          amount: totalSalary,
          reason: 'Payday',
          for_month: forMonth,
          expense_allocations: sub_category_allocations,
          savings_allocations: savings_allocations,
          date: new Date().toISOString()
        });
      } else {
        await allocatePayday({
          bank_account_id: selectedBank || undefined,
          for_month: forMonth,
          sub_category_allocations,
          savings_allocations
        });
      }
      
      Alert.alert("Success", "Salary Allocation Saved Successfully!", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } else {
      Alert.alert("Wait", "Please allocate some amounts first.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Salary Allocation</Text>
        <View style={{width: 40}} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#4ADE80', '#10B981']} style={styles.headerCard} start={{x: 0, y: 0}} end={{x: 1, y: 1}}>
          <Text style={styles.label}>Enter This Month's Salary</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.currencySymbol}>Rs</Text>
            <TextInput
              style={styles.salaryInput}
              placeholder="0.00"
              placeholderTextColor="rgba(0,0,0,0.3)"
              keyboardType="decimal-pad"
              value={salary}
              onChangeText={setSalary}
            />
          </View>
          <View style={styles.remainingBadge}>
            <Text style={[styles.remainingText, remaining < 0 && {color: '#F87171'}]}>
              Unassigned: Rs {remaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Budget Month (YYYY-MM)</Text>
        <View style={{ marginHorizontal: 24, marginBottom: 20 }}>
          <TextInput 
            style={{ backgroundColor: '#1E1E2D', color: '#fff', borderRadius: 16, padding: 16, fontSize: 16, fontWeight: 'bold' }}
            value={forMonth}
            onChangeText={setForMonth}
            placeholder="2026-05"
            placeholderTextColor="#8A8A9E"
          />
        </View>

        <Text style={styles.sectionTitle}>Select Income Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20, paddingHorizontal: 24 }}>
          {incomeCategories.map(cat => (
            <TouchableOpacity 
              key={cat.id} 
              style={[{backgroundColor: '#1E1E2D', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 8}, selectedIncomeCat === cat.id && {backgroundColor: '#4ADE80'}]}
              onPress={() => setSelectedIncomeCat(cat.id)}
            >
              <Text style={[{color: '#8A8A9E', fontWeight: '600'}, selectedIncomeCat === cat.id && {color: '#12121D'}]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Fund to/from Bank</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20, paddingHorizontal: 24 }}>
          {banks.map(b => (
            <TouchableOpacity 
              key={b.id} 
              style={[{backgroundColor: '#1E1E2D', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 8}, selectedBank === b.id && {backgroundColor: '#4ADE80'}]}
              onPress={() => setSelectedBank(b.id)}
            >
              <Text style={[{color: '#8A8A9E', fontWeight: '600'}, selectedBank === b.id && {color: '#12121D'}]}>{b.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Assign Budget (Sub-Categories)</Text>
        
        {subCategories.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={48} color="#2A2A3D" />
            <Text style={{color: '#8A8A9E', textAlign: 'center', marginTop: 12}}>No sub-categories created yet.</Text>
          </View>
        )}

        <View style={{ marginBottom: 20 }}>
          {subCategories.map(cat => (
            <View key={cat.id} style={styles.rowItem}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.iconCircle}>
                  <Ionicons name="pie-chart" size={16} color="#60A5FA" />
                </View>
                <Text style={styles.catName}>{cat.name}</Text>
              </View>
              <TextInput
                style={styles.amountInput}
                placeholder="Rs 0"
                placeholderTextColor="#8A8A9E"
                keyboardType="decimal-pad"
                value={subAllocations[cat.id] || ''}
                onChangeText={(val) => handleUpdateSub(cat.id, val)}
              />
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Fund Savings Goals</Text>
        <View style={{ marginBottom: 40 }}>
          {savingsGoals.map(goal => (
            <View key={goal.id} style={styles.rowItem}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.iconCircle, {backgroundColor: 'rgba(251, 191, 36, 0.1)'}]}>
                  <Ionicons name="trophy" size={16} color="#FBBF24" />
                </View>
                <Text style={styles.catName}>{goal.name}</Text>
              </View>
              <TextInput
                style={styles.amountInput}
                placeholder="Rs 0"
                placeholderTextColor="#8A8A9E"
                keyboardType="decimal-pad"
                value={savingsAllocations[goal.id] || ''}
                onChangeText={(val) => handleUpdateSav(goal.id, val)}
              />
            </View>
          ))}
        </View>
      </ScrollView>

      {(subCategories.length > 0 || savingsGoals.length > 0) && (
        <View style={styles.bottomBar}>
          <TouchableOpacity 
            style={[styles.saveBtn, remaining < 0 && {backgroundColor: '#F87171'}]} 
            onPress={handleSave}
          >
            <Text style={styles.saveBtnText}>
              {remaining < 0 ? "You are over budget!" : "Save Budget"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B14' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1E1E2D', justifyContent: 'center', alignItems: 'center' },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  headerCard: { marginHorizontal: 24, padding: 24, borderRadius: 24, marginBottom: 32, shadowColor: '#4ADE80', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  label: { color: 'rgba(0,0,0,0.6)', fontSize: 14, fontWeight: '700', textTransform: 'uppercase', marginBottom: 12 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'rgba(0,0,0,0.1)', paddingBottom: 8 },
  currencySymbol: { fontSize: 40, fontWeight: '900', color: '#000', marginRight: 4 },
  salaryInput: { color: '#000', fontSize: 40, fontWeight: '900', flex: 1 },
  remainingBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, alignSelf: 'flex-start', marginTop: 16 },
  remainingText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 16, paddingHorizontal: 24 },
  emptyState: { alignItems: 'center', marginTop: 40 },
  rowItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E1E2D', padding: 16, borderRadius: 16, marginBottom: 12, marginHorizontal: 24 },
  iconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(96, 165, 250, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  catName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  amountInput: { backgroundColor: '#12121D', color: '#fff', borderRadius: 12, padding: 12, width: 100, textAlign: 'right', fontSize: 16, fontWeight: 'bold' },
  bottomBar: { padding: 24, backgroundColor: '#0B0B14', borderTopWidth: 1, borderTopColor: '#1E1E2D' },
  saveBtn: { backgroundColor: '#4ADE80', padding: 20, borderRadius: 16, alignItems: 'center', shadowColor: '#4ADE80', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  saveBtnText: { color: '#000', fontSize: 18, fontWeight: 'bold' }
});

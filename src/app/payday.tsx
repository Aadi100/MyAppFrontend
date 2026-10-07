import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../store/useStore';
import { useRouter } from 'expo-router';
import { Screen, Header, Chip, Chips, Card, IconBox, Input, PrimaryButton, EmptyState, Label } from '../ui/kit';
import { C, num, categoryIcon } from '../ui/theme';

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

  const totalSub = Object.values(subAllocations).reduce((sum: number, val: any) => sum + (parseFloat(val) || 0), 0);
  const totalSav = Object.values(savingsAllocations).reduce((sum: number, val: any) => sum + (parseFloat(val) || 0), 0);
  const totalAllocated = totalSub + totalSav;
  const totalSalary = parseFloat(salary) || 0;
  const remaining = totalSalary - totalAllocated;
  const pct = totalSalary > 0 ? (totalAllocated / totalSalary) * 100 : 0;

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
      return Alert.alert('Wait', 'Please select a bank account to fund or receive.');
    }

    if (totalSalary > 0 && !selectedIncomeCat) {
      return Alert.alert('Wait', 'Please select an income category for this salary.');
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

      Alert.alert('Success', 'Salary Allocation Saved Successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } else {
      Alert.alert('Wait', 'Please allocate some amounts first.');
    }
  };

  const row = (icon, name, color, value, onChange) => (
    <View key={name} style={styles.row}>
      <IconBox name={icon} color={color} size={34} />
      <Text style={styles.catName}>{name}</Text>
      <TextInput style={styles.amountInput} placeholder="Rs 0" placeholderTextColor={C.dim} keyboardType="decimal-pad" value={value} onChangeText={onChange} />
    </View>
  );

  return (
    <>
      <Screen style={{ paddingBottom: 200 }}>
        <Header title="Salary allocation" onBack={() => router.back()} />

        <LinearGradient colors={['#67E8F9', '#0891B2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.salary}>
          <Text style={styles.salaryLabel}>THIS MONTH&apos;S SALARY</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={styles.rs}>Rs </Text>
            <TextInput style={styles.salaryInput} placeholder="0" placeholderTextColor="rgba(2,30,38,0.35)" keyboardType="decimal-pad" value={salary} onChangeText={setSalary} />
          </View>
          <View style={styles.track}><View style={{ width: `${Math.min(100, pct)}%`, height: '100%', borderRadius: 9, backgroundColor: remaining < 0 ? C.rose : C.onAcc }} /></View>
          <View style={styles.salaryFoot}>
            <Text style={styles.salaryFootText}>Allocated Rs {num(totalAllocated)}</Text>
            <View style={styles.badge}><Text style={[styles.salaryFootText, remaining < 0 && { color: '#9f1239' }]}>Unassigned Rs {num(remaining)}</Text></View>
          </View>
        </LinearGradient>

        <View style={{ marginTop: 16 }}>
          <Input icon="calendar-outline" placeholder="2026-05" value={forMonth} onChangeText={setForMonth} style={{ height: 48 }} />
        </View>

        <Label style={{ marginTop: 16, marginBottom: 8 }}>Income category</Label>
        <Chips>{incomeCategories.map(cat => <Chip key={cat.id} label={cat.name} active={selectedIncomeCat === cat.id} onPress={() => setSelectedIncomeCat(cat.id)} />)}</Chips>

        <Label style={{ marginTop: 16, marginBottom: 8 }}>Fund to / from bank</Label>
        <Chips>{banks.map(b => <Chip key={b.id} label={b.name} active={selectedBank === b.id} onPress={() => setSelectedBank(b.id)} />)}</Chips>

        <Label style={{ marginTop: 18, marginBottom: 8 }}>Assign budget (sub-categories)</Label>
        {subCategories.length === 0 ? (
          <Card><EmptyState icon="folder-open-outline" title="No sub-categories created yet" /></Card>
        ) : (
          <Card pad={2} style={{ paddingHorizontal: 14 }}>
            {subCategories.map((cat, i) => (
              <View key={cat.id} style={i > 0 ? styles.sep : null}>{row(categoryIcon(cat.name), cat.name, C.acc, subAllocations[cat.id] || '', (v) => handleUpdateSub(cat.id, v))}</View>
            ))}
          </Card>
        )}

        {savingsGoals.length > 0 && (
          <>
            <Label style={{ marginTop: 18, marginBottom: 8 }}>Fund savings goals</Label>
            <Card pad={2} style={{ paddingHorizontal: 14 }}>
              {savingsGoals.map((goal, i) => (
                <View key={goal.id} style={i > 0 ? styles.sep : null}>{row('trophy-outline', goal.name, C.amber, savingsAllocations[goal.id] || '', (v) => handleUpdateSav(goal.id, v))}</View>
              ))}
            </Card>
          </>
        )}
      </Screen>

      {(subCategories.length > 0 || savingsGoals.length > 0) && (
        <View style={styles.bottomBar} pointerEvents="box-none">
          <PrimaryButton title={remaining < 0 ? 'You are over budget!' : 'Save budget'} variant={remaining < 0 ? 'danger' : 'primary'} onPress={handleSave} />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  salary: { borderRadius: 28, padding: 20, marginTop: 4, shadowColor: '#0891B2', shadowOpacity: 0.5, shadowRadius: 22, shadowOffset: { width: 0, height: 14 }, elevation: 10 },
  salaryLabel: { color: 'rgba(2,30,38,0.65)', fontSize: 11, letterSpacing: 1.3, fontWeight: '800' },
  rs: { color: C.onAcc, fontSize: 26, fontWeight: '800' },
  salaryInput: { color: C.onAcc, fontSize: 40, fontWeight: '800', letterSpacing: -1, flex: 1, padding: 0 },
  track: { height: 7, borderRadius: 9, backgroundColor: 'rgba(2,30,38,0.18)', overflow: 'hidden', marginTop: 12 },
  salaryFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  salaryFootText: { color: C.onAcc, fontSize: 12.5, fontWeight: '700' },
  badge: { backgroundColor: 'rgba(2,30,38,0.15)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  sep: { borderTopWidth: 1, borderTopColor: C.line },
  catName: { color: C.text, fontSize: 14.5, fontWeight: '700', flex: 1 },
  amountInput: { width: 118, height: 40, borderRadius: 12, backgroundColor: C.s1, borderWidth: 1, borderColor: C.line, color: C.text, textAlign: 'right', paddingHorizontal: 12, fontSize: 14 },
  bottomBar: { position: 'absolute', left: 20, right: 20, bottom: 104 },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useStore } from '../store/useStore';
import { Screen, Card, Hero, IconBox, Tag, Ring, Chip, Chips, Field, Input, Sheet, SheetButtons, PrimaryButton, EmptyState, Label, AccentIconBtn } from '../ui/kit';
import { C, money, num, alpha } from '../ui/theme';

const GOAL_COLORS = [C.acc, C.blue, C.violet, C.amber, C.rose, C.orange];
const QUICK = [500, 1000, 5000, 10000];

export default function SavingsScreen() {
  const subCategories = useStore((state) => state.subCategories);
  const masterCategories = useStore((state) => state.masterCategories);
  const banks = useStore((state) => state.banks);
  const addSubCategory = useStore((state) => state.addSubCategory);
  const addExpense = useStore((state) => state.addExpense);
  const dashboardSummary = useStore((state) => state.dashboardSummary);
  const simulateSavingsGoal = useStore((state) => state.simulateSavingsGoal);

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

  const [simulateModalVisible, setSimulateModalVisible] = useState(false);
  const [simulateForm, setSimulateForm] = useState({ sub_category_id: '', extra_amount: '' });
  const [simulateResult, setSimulateResult] = useState<any>(null);

  const handleSave = () => {
    if (!form.title || !form.target_amount) return;

    let savingsMaster = masterCategories.find(mc => mc.type === 'savings');
    if (!savingsMaster) {
      Alert.alert('Savings category needed', "Please create a Master Category with type 'Savings' in Settings first.");
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

  const savingsProgressArray = dashboardSummary?.savings_progress || [];
  const rows = savings.map((goal, i) => {
    const enrichedGoal = savingsProgressArray.find(s => s.sub_category_id === goal.id) || goal;
    const target = goal.assigned_budget || 0;
    const current = enrichedGoal.current_saved || goal.current_saved || 0;
    const lentOut = enrichedGoal.lent_out || goal.lent_out || 0;
    const totalVal = enrichedGoal.total_value !== undefined ? enrichedGoal.total_value : (current + lentOut);
    const progress = target > 0 ? Math.min((totalVal / target) * 100, 100) : 0;
    return { goal, target, current, lentOut, totalVal, progress, isComplete: progress >= 100 && target > 0, color: GOAL_COLORS[i % GOAL_COLORS.length] };
  });
  const totalSaved = rows.reduce((a, r) => a + r.totalVal, 0);

  const openContribute = (goal) => {
    setContributeForm({ sub_category_id: goal.id, amount: '', bank_account_id: banks.length > 0 ? banks[0].id : '' });
    setContributeModalVisible(true);
  };
  const openWithdraw = (goal, current) => {
    if (current <= 0) { Alert.alert('Nothing to withdraw', 'This goal has no saved money yet.'); return; }
    setWithdrawForm({ sub_category_id: goal.id, amount: '', reason: '', bank_account_id: banks.length > 0 ? banks[0].id : '' });
    setWithdrawModalVisible(true);
  };
  const openSimulate = (goal) => {
    setSimulateForm({ sub_category_id: goal.id, extra_amount: '' });
    setSimulateResult(null);
    setSimulateModalVisible(true);
  };
  const handleSimulate = async () => {
    const res = await simulateSavingsGoal({
      sub_category_id: simulateForm.sub_category_id,
      extra_monthly_amount: parseFloat(simulateForm.extra_amount) || 0
    });
    if (res) setSimulateResult(res);
  };

  const contributeGoal = rows.find(r => r.goal.id === contributeForm.sub_category_id);
  const withdrawGoal = rows.find(r => r.goal.id === withdrawForm.sub_category_id);

  const bankChips = (value, onChange) => (
    <Chips>{banks.map(bank => <Chip key={bank.id} label={bank.name} active={value === bank.id} onPress={() => onChange(bank.id)} />)}</Chips>
  );

  const goalHeader = (r) => (
    <View style={styles.goalMini}>
      <Ring pct={r.progress} size={46} thick={5} color={r.color}><Text style={{ color: C.text, fontSize: 11, fontWeight: '800' }}>{r.progress.toFixed(0)}%</Text></Ring>
      <View>
        <Text style={styles.goalName}>{r.goal.name}</Text>
        <Text style={styles.goalSub}>Rs {num(r.totalVal)} of {num(r.target)}</Text>
      </View>
    </View>
  );

  return (
    <>
      <Screen>
        <View style={styles.rowSp}>
          <Text style={styles.h1}>Savings goals</Text>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <AccentIconBtn icon="add" onPress={() => setModalVisible(true)} />
            <IconBox name="trophy-outline" color={C.amber} size={42} />
          </View>
        </View>

        {savings.length > 0 && (
          <Hero style={{ marginTop: 14, paddingVertical: 16 }}>
            <View style={styles.rowSp}>
              <Label style={{ color: '#a5f3fc' }}>Total saved</Label>
              <Tag label={`${savings.length} goal${savings.length === 1 ? '' : 's'}`} />
            </View>
            <Text style={styles.total}>{money(totalSaved)}</Text>
          </Hero>
        )}

        {savings.length === 0 && (
          <EmptyState icon="trophy-outline" color={C.amber} title="No savings goals yet" sub="Start saving! Create your first goal and track it here." action="New goal" onAction={() => setModalVisible(true)} />
        )}

        <View style={{ gap: 10, marginTop: 12 }}>
          {rows.map((r) => (
            <Card key={r.goal.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <Ring pct={r.progress} size={72} thick={7} color={r.isComplete ? C.amber : r.color}>
                <Text style={styles.pct}>{r.progress.toFixed(0)}%</Text>
              </Ring>
              <View style={{ flex: 1, gap: 4 }}>
                <View style={styles.rowSp}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{r.goal.name}</Text>
                  {r.isComplete ? <Tag label="Complete" color={C.amber} /> : null}
                </View>
                <Text style={{ fontSize: 13 }}>
                  <Text style={{ color: r.color, fontWeight: '700' }}>Rs {num(r.totalVal)}</Text>
                  <Text style={{ color: C.dim }}> of {num(r.target)}</Text>
                </Text>
                <Text style={styles.goalSub}>
                  {r.lentOut > 0 ? `Rs ${num(r.current)} saved · Rs ${num(r.lentOut)} lent` : r.isComplete ? 'Goal reached' : `Rs ${num(Math.max(0, r.target - r.totalVal))} to go`}
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                  {!r.isComplete && <PrimaryButton title="Add" icon="add" small onPress={() => openContribute(r.goal)} style={{ height: 32, borderRadius: 10 }} />}
                  <PrimaryButton title="Withdraw" variant="ghost" small onPress={() => openWithdraw(r.goal, r.current)} style={{ height: 32, paddingHorizontal: 12, borderRadius: 10 }} />
                  {!r.isComplete && <PrimaryButton title="AI Forecast" icon="bulb-outline" variant="outline" small onPress={() => openSimulate(r.goal)} style={{ height: 32, paddingHorizontal: 12, borderRadius: 10 }} />}
                </View>
              </View>
            </Card>
          ))}
        </View>
      </Screen>

      {/* New goal */}
      <Sheet visible={modalVisible} onClose={() => setModalVisible(false)} title="New savings goal"
        footer={<SheetButtons onCancel={() => setModalVisible(false)} onSave={handleSave} saveLabel="Save goal" />}>
        <Field label="Goal title"><Input icon="trophy-outline" placeholder="e.g. Dream car" value={form.title} onChangeText={(val) => setForm({ ...form, title: val })} autoFocus /></Field>
        <Field label="Target amount"><Input icon="cash-outline" placeholder="e.g. 50000" keyboardType="decimal-pad" value={form.target_amount} onChangeText={(val) => setForm({ ...form, target_amount: val })} /></Field>
      </Sheet>

      {/* Contribute */}
      <Sheet visible={contributeModalVisible} onClose={() => setContributeModalVisible(false)} title="Contribute to goal"
        footer={<PrimaryButton title={contributeForm.amount ? `Add Rs ${num(contributeForm.amount)} to goal` : 'Confirm'} onPress={handleContribute} />}>
        {contributeGoal && <View style={{ marginTop: 14 }}>{goalHeader(contributeGoal)}</View>}
        <View style={{ alignItems: 'center', marginTop: 18 }}>
          <Label>Amount</Label>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4 }}>
            <Text style={styles.rs}>Rs </Text>
            <Input value={contributeForm.amount} onChangeText={(val) => setContributeForm({ ...contributeForm, amount: val })} keyboardType="decimal-pad" placeholder="0" autoFocus
              style={{ backgroundColor: 'transparent', borderWidth: 0, height: 56, paddingHorizontal: 0, minWidth: 90 }} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 4 }}>
          {QUICK.map(v => <Chip key={v} label={num(v)} active={Number(contributeForm.amount) === v} onPress={() => setContributeForm({ ...contributeForm, amount: String(v) })} />)}
        </View>
        <Field label="Fund from bank account">{bankChips(contributeForm.bank_account_id, (id) => setContributeForm({ ...contributeForm, bank_account_id: id }))}</Field>
      </Sheet>

      {/* Withdraw */}
      <Sheet visible={withdrawModalVisible} onClose={() => setWithdrawModalVisible(false)} title="Withdraw saved money"
        footer={<PrimaryButton title="Withdraw" onPress={handleWithdraw} />}>
        {withdrawGoal && <View style={{ marginTop: 14 }}>{goalHeader(withdrawGoal)}<Text style={[styles.goalSub, { marginTop: 8 }]}>Available Rs {num(withdrawGoal.current)}</Text></View>}
        <Field label="Amount to withdraw"><Input icon="cash-outline" placeholder="Amount to withdraw" keyboardType="decimal-pad" value={withdrawForm.amount} onChangeText={(val) => setWithdrawForm({ ...withdrawForm, amount: val })} autoFocus /></Field>
        <Field label="Reason"><Input icon="pencil-outline" placeholder="e.g. Bought mutual funds" value={withdrawForm.reason} onChangeText={(val) => setWithdrawForm({ ...withdrawForm, reason: val })} /></Field>
        <Field label="Withdraw to bank account">{bankChips(withdrawForm.bank_account_id, (id) => setWithdrawForm({ ...withdrawForm, bank_account_id: id }))}</Field>
      </Sheet>

      {/* Simulate */}
      <Sheet visible={simulateModalVisible} onClose={() => setSimulateModalVisible(false)} title="AI Savings Forecast">
        <Text style={[styles.goalSub, { marginBottom: 12 }]}>Simulate how much faster you'll reach your goal by adding extra money each month.</Text>
        <Field label="Extra Monthly Amount">
          <Input icon="cash-outline" placeholder="e.g. 5000" keyboardType="decimal-pad" value={simulateForm.extra_amount} onChangeText={(val) => setSimulateForm({ ...simulateForm, extra_amount: val })} />
        </Field>
        <PrimaryButton title="Run Simulation" onPress={handleSimulate} style={{ marginTop: 12 }} />
        
        {simulateResult && (
          <Card style={{ marginTop: 20, backgroundColor: alpha(C.violet, 0.1), borderColor: alpha(C.violet, 0.3) }}>
            <Text style={{ color: C.text, fontWeight: '700', fontSize: 16, marginBottom: 8 }}>Simulation Results</Text>
            <Text style={{ color: C.mute, fontSize: 13, marginBottom: 4 }}>At your current pace, it will take <Text style={{ color: C.acc, fontWeight: 'bold' }}>{simulateResult.months_at_current_rate} months</Text>.</Text>
            <Text style={{ color: C.mute, fontSize: 13, marginBottom: 4 }}>With an extra {money(simulateResult.extra_monthly_amount)}/mo, it will only take <Text style={{ color: C.green, fontWeight: 'bold' }}>{simulateResult.months_with_extra} months</Text>!</Text>
            <Text style={{ color: C.violet, fontWeight: '800', marginTop: 8 }}>You save {simulateResult.months_saved} months of waiting!</Text>
          </Card>
        )}
      </Sheet>

    </>
  );
}

const styles = StyleSheet.create({
  rowSp: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  h1: { color: C.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.7 },
  total: { color: C.text, fontSize: 30, fontWeight: '800', letterSpacing: -1, marginTop: 6 },
  pct: { color: C.text, fontSize: 15, fontWeight: '800' },
  cardTitle: { color: C.text, fontSize: 16, fontWeight: '700', flex: 1, textTransform: 'capitalize' },
  goalSub: { color: C.dim, fontSize: 12 },
  goalMini: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 18, padding: 12 },
  goalName: { color: C.text, fontSize: 14, fontWeight: '700', textTransform: 'capitalize' },
  rs: { color: C.dim, fontSize: 24, fontWeight: '700' },
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, BackHandler } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../store/useStore';
import {
  Screen, Header, Card, IconBox, Tag, Chip, Chips, Field, Input, Seg, GhostBtn, AccentIconBtn, MonthBar,
  Sheet, SheetButtons, PrimaryButton, ConfirmDialog, EmptyState, Label,
} from '../ui/kit';
import { C, alpha, money } from '../ui/theme';

type View_ = 'menu' | 'categories' | 'budgets';

const TILES = [
  { route: '/savings', icon: 'trophy-outline', title: 'Savings goals', color: C.amber },
  { route: '/payables', icon: 'people-outline', title: 'Ledger', sub: 'Payables & receivables', color: C.violet },
  { route: '/vault', icon: 'key-outline', title: 'Password vault', sub: 'Saved logins', color: C.rose },
  { route: '/payday', icon: 'cash-outline', title: 'Payday', sub: 'Allocate your salary', color: C.acc },
  { route: '/notes', icon: 'document-text-outline', title: 'Notes', sub: 'Quick notepad', color: C.orange },
  { route: '/todos', icon: 'checkbox-outline', title: 'To-Do List', sub: 'Tasks & Subtasks', color: C.red },
  { route: '/reminders', icon: 'notifications-outline', title: 'Reminders', sub: 'Manage alerts', color: C.green },
  { route: '/insights', icon: 'bulb-outline', title: 'Smart Insights', sub: 'Health & AI Forecasts', color: C.violet },
  { route: '/profile', icon: 'person-outline', title: 'Profile', sub: 'Account & security', color: C.blue },
] as const;

export default function ManageScreen() {
  const router = useRouter();
  const [view, setView] = useState<View_>('menu');

  const banks = useStore(state => state.banks);
  const masterCategories = useStore(state => state.masterCategories);
  const subCategories = useStore(state => state.subCategories);
  const addBank = useStore(state => state.addBank);
  const updateBankAccount = useStore(state => state.updateBankAccount);
  const deleteBankAccount = useStore(state => state.deleteBankAccount);

  const monthlyBudgets = useStore(state => state.monthlyBudgets);
  const fetchMonthlyBudgets = useStore(state => state.fetchMonthlyBudgets);
  const setMonthlyBudget = useStore(state => state.setMonthlyBudget);
  const deleteMonthlyBudget = useStore(state => state.deleteMonthlyBudget);

  const addMasterCategory = useStore(state => state.addMasterCategory);
  const updateMasterCategory = useStore(state => state.updateMasterCategory);
  const deleteMasterCategory = useStore(state => state.deleteMasterCategory);
  const updateSavingsCategory = useStore(state => state.updateSavingsCategory);

  const addSubCategory = useStore(state => state.addSubCategory);
  const updateSubCategory = useStore(state => state.updateSubCategory);
  const deleteSubCategory = useStore(state => state.deleteSubCategory);

  const [masterCatModalVisible, setMasterCatModalVisible] = useState(false);
  const [masterCatForm, setMasterCatForm] = useState<any>({ id: null, name: '', type: 'expense' });

  const [bankModalVisible, setBankModalVisible] = useState(false);
  const [bankForm, setBankForm] = useState<any>({ name: '', initial_balance: '', account_number: '' });

  const [subCatModalVisible, setSubCatModalVisible] = useState(false);
  const [subCatForm, setSubCatForm] = useState<any>({ master_category_id: '', name: '', assigned_budget: '', default_bank_account_id: '' });

  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [budgetForm, setBudgetForm] = useState<any>({ sub_category_id: '', amount: '', source_bank_account_id: '' });
  const [savedForm, setSavedForm] = useState<any>({ id: '', name: '', current_saved: '' });
  const [savedVisible, setSavedVisible] = useState(false);

  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [transferForm, setTransferForm] = useState({ from_sub_category_id: '', to_sub_category_id: '', amount: '' });
  const transferBudget = useStore(state => state.transferBudget);

  const [budgetMonth, setBudgetMonth] = useState(new Date().toISOString().slice(0, 7));
  const [confirm, setConfirm] = useState<{ title: string; onConfirm: () => void } | null>(null);

  useEffect(() => {
    fetchMonthlyBudgets(budgetMonth);
  }, [budgetMonth]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (view !== 'menu') { setView('menu'); return true; }
      return false;
    });
    return () => sub.remove();
  }, [view]);

  const handleAddCategory = () => {
    setMasterCatForm({ id: null, name: '', type: 'expense' });
    setMasterCatModalVisible(true);
  };

  const handleAddSubCategory = (masterId) => {
    setSubCatForm({ id: null, master_category_id: masterId, name: '', assigned_budget: '', default_bank_account_id: banks[0]?.id || '' });
    setSubCatModalVisible(true);
  };

  const handleEditSubCategory = (sub) => {
    setSubCatForm({ id: sub.id, master_category_id: sub.master_category_id, name: sub.name, assigned_budget: sub.assigned_budget?.toString() || '', default_bank_account_id: sub.default_bank_account_id || '' });
    setSubCatModalVisible(true);
  };

  const handleAddBudgetModal = () => {
    setBudgetForm({ sub_category_id: '', amount: '', source_bank_account_id: '' });
    setBudgetModalVisible(true);
  };

  const handleEditBudget = (b) => {
    setBudgetForm({ sub_category_id: b.sub_category_id, amount: b.amount.toString(), source_bank_account_id: '' });
    setBudgetModalVisible(true);
  };

  const handleTransferModal = () => {
    setTransferForm({ from_sub_category_id: '', to_sub_category_id: '', amount: '' });
    setTransferModalVisible(true);
  };

  const handleAddBank = () => {
    setBankForm({ id: null, name: '', initial_balance: '', account_number: '' });
    setBankModalVisible(true);
  };

  const handleEditBank = (bank) => {
    setBankForm({ id: bank.id, name: bank.name, initial_balance: '', account_number: bank.account_number || '', balance: bank.balance?.toString() ?? '', opening_balance: bank.opening_balance?.toString() ?? '', orig_balance: bank.balance?.toString() ?? '', orig_opening: bank.opening_balance?.toString() ?? '' });
    setBankModalVisible(true);
  };

  const handleEditCategory = (cat) => {
    setMasterCatForm({ id: cat.id, name: cat.name, type: cat.type || 'expense' });
    setMasterCatModalVisible(true);
  };

  const handleDelete = (title, onConfirm) => setConfirm({ title: `Delete ${title}?`, onConfirm });

  const monthLabel = (() => {
    const [y, m] = budgetMonth.split('-').map(Number);
    const d = new Date(y, (m || 1) - 1, 1);
    return isNaN(d.getTime()) ? budgetMonth : d.toLocaleString('default', { month: 'long', year: 'numeric' });
  })();
  const shiftMonth = (delta: number) => {
    const [y, m] = budgetMonth.split('-').map(Number);
    const d = new Date(y, (m || 1) - 1 + delta, 1);
    setBudgetMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const expenseSubs = subCategories.filter(s => masterCategories.find(m => m.id === s.master_category_id)?.type === 'expense');
  const savingsCount = subCategories.filter(s => masterCategories.find(m => m.id === s.master_category_id)?.type === 'savings').length;

  const navRow = (icon, title, sub, color, badge, onPress, first?: boolean) => (
    <TouchableOpacity key={title} style={[styles.navRow, first && { borderTopWidth: 0 }]} onPress={onPress} activeOpacity={0.8}>
      <IconBox name={icon} color={color} size={34} />
      <View style={{ flex: 1 }}>
        <Text style={styles.navTitle}>{title}</Text>
        <Text style={styles.navSub}>{sub}</Text>
      </View>
      {badge ? <Tag label={badge} color={C.mute} /> : null}
      <Ionicons name="chevron-forward" size={18} color={C.dim} />
    </TouchableOpacity>
  );

  const typeColor = (t) => (t === 'income' ? C.acc : t === 'savings' ? C.amber : C.rose);
  const typeIcon = (t) => (t === 'income' ? 'arrow-down-outline' : t === 'savings' ? 'trophy-outline' : 'arrow-up-outline');

  return (
    <>
      <Screen>
        {view === 'menu' && (
          <>
            <Text style={styles.h1}>Menu</Text>
            <Text style={styles.sub}>Everything else in your finances</Text>

            <View style={styles.tiles}>
              {TILES.map((t) => (
                <TouchableOpacity key={t.title} style={styles.tileWrap} activeOpacity={0.85} onPress={() => router.push(t.route as any)}>
                  <Card pad={16}>
                    <IconBox name={t.icon as any} color={t.color} size={46} />
                    <Text style={styles.tileTitle}>{t.title}</Text>
                    <Text style={styles.tileSub}>{t.title === 'Savings goals' ? `${savingsCount} active goal${savingsCount === 1 ? '' : 's'}` : t.sub}</Text>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>

            <Label style={{ marginTop: 24, marginBottom: 12 }}>Settings & configuration</Label>
            <Card pad={2} style={{ paddingHorizontal: 16 }}>
              {navRow('folder-outline', 'Categories', 'Expense, income and savings', C.blue, `${masterCategories.length} groups`, () => setView('categories'), true)}
              {navRow('pie-chart-outline', 'Monthly budgets', 'Set limits per category', C.acc, `${monthlyBudgets.length} set`, () => setView('budgets'))}
              {navRow('business-outline', 'Bank accounts', 'Balances and defaults', C.amber, `${banks.length}`, () => setView('budgets'))}
            </Card>
          </>
        )}

        {view === 'categories' && (
          <>
            <Header title="Categories" onBack={() => setView('menu')} right={<AccentIconBtn icon="add" onPress={handleAddCategory} />} />
            {masterCategories.length === 0 && <EmptyState icon="folder-outline" title="No categories yet" sub="Create your first category group." action="New category" onAction={handleAddCategory} />}
            <View style={{ gap: 12 }}>
              {masterCategories.map((cat) => {
                const subs = (subCategories || []).filter(s => s.master_category_id === cat.id);
                const col = typeColor(cat.type);
                return (
                  <Card key={cat.id} pad={14}>
                    <View style={styles.rowSp}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                        <IconBox name={typeIcon(cat.type) as any} color={col} size={34} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.catTitle}>{cat.name}</Text>
                          <Text style={styles.navSub}>{subs.length} sub-categor{subs.length === 1 ? 'y' : 'ies'} · {cat.type || 'expense'}</Text>
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <GhostBtn icon="pencil-outline" onPress={() => handleEditCategory(cat)} />
                        <GhostBtn icon="trash-outline" danger onPress={() => handleDelete(cat.name, () => deleteMasterCategory(cat.id))} />
                        <AccentIconBtn icon="add" onPress={() => handleAddSubCategory(cat.id)} />
                      </View>
                    </View>
                    {subs.length > 0 && (
                      <View style={{ marginTop: 10 }}>
                        {subs.map(sub => (
                          <View key={sub.id} style={styles.subRow}>
                            <View style={styles.treeLine} />
                            <Text style={styles.subText}>{sub.name}</Text>
                            {cat.type === 'savings' && (
                              <TouchableOpacity onPress={() => { setSavedForm({ id: sub.id, name: sub.name, current_saved: String(sub.current_saved ?? 0) }); setSavedVisible(true); }}>
                                <Tag label={`Saved ${money(sub.current_saved || 0)}`} color={C.amber} />
                              </TouchableOpacity>
                            )}
                            <GhostBtn icon="pencil-outline" onPress={() => handleEditSubCategory(sub)} />
                            <GhostBtn icon="trash-outline" danger onPress={() => handleDelete(sub.name, () => deleteSubCategory(sub.id))} />
                          </View>
                        ))}
                      </View>
                    )}
                  </Card>
                );
              })}
            </View>
          </>
        )}

        {view === 'budgets' && (
          <>
            <Header title="Budgets & banks" onBack={() => setView('menu')} />

            <View style={styles.rowSp}>
              <Text style={styles.h2}>Monthly budgets</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <AccentIconBtn icon="swap-horizontal" color={C.blue} onPress={handleTransferModal} />
                <AccentIconBtn icon="add" onPress={handleAddBudgetModal} />
              </View>
            </View>
            <View style={{ marginTop: 12 }}><MonthBar label={monthLabel} onPrev={() => shiftMonth(-1)} onNext={() => shiftMonth(1)} /></View>

            <Card pad={2} style={{ paddingHorizontal: 16, marginTop: 12 }}>
              {monthlyBudgets.length === 0 && <Text style={styles.emptyText}>No budget allocations for this month.</Text>}
              {monthlyBudgets.map((b, index) => {
                const catName = subCategories.find(s => s.id === b.sub_category_id)?.name || 'Unknown';
                return (
                  <View key={b.id} style={[styles.navRow, index === 0 && { borderTopWidth: 0 }]}>
                    <IconBox name="pie-chart-outline" color={C.acc} size={34} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.navTitle}>{catName}</Text>
                      <Text style={styles.navSub}>Monthly limit</Text>
                    </View>
                    <Text style={styles.amt}>{money(b.amount)}</Text>
                    <GhostBtn icon="pencil-outline" onPress={() => handleEditBudget(b)} />
                    <GhostBtn icon="trash-outline" danger onPress={() => handleDelete(`budget for ${catName}`, () => deleteMonthlyBudget(b.id, budgetMonth))} />
                  </View>
                );
              })}
            </Card>

            <View style={[styles.rowSp, { marginTop: 24 }]}>
              <Text style={styles.h2}>Bank accounts</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <AccentIconBtn icon="analytics-outline" color={C.violet} onPress={() => router.push('/bank-comparison')} />
                <AccentIconBtn icon="add" onPress={handleAddBank} />
              </View>
            </View>
            <Card pad={2} style={{ paddingHorizontal: 16, marginTop: 12 }}>
              {banks.length === 0 && <Text style={styles.emptyText}>No banks yet.</Text>}
              {banks.map((bank, index) => (
                <TouchableOpacity key={bank.id} activeOpacity={0.8} style={[styles.navRow, index === 0 && { borderTopWidth: 0 }]} onPress={() => router.push(`/bank-summary?id=${bank.id}`)}>
                  <IconBox name="business-outline" color={[C.blue, C.acc, C.amber][index % 3]} size={34} />
                  <Text style={[styles.navTitle, { flex: 1 }]}>{bank.name}</Text>
                  <GhostBtn icon="pencil-outline" onPress={() => handleEditBank(bank)} />
                  <GhostBtn icon="trash-outline" danger onPress={() => handleDelete(bank.name, () => deleteBankAccount(bank.id))} />
                </TouchableOpacity>
              ))}
            </Card>
          </>
        )}
      </Screen>

      {/* Master Category */}
      <Sheet visible={masterCatModalVisible} onClose={() => setMasterCatModalVisible(false)} title={masterCatForm.id ? 'Edit category' : 'New category'}
        footer={<SheetButtons onCancel={() => setMasterCatModalVisible(false)} onSave={() => {
          if (!masterCatForm.name.trim()) return Alert.alert('Wait', 'Name is required.');
          if (masterCatForm.id) updateMasterCategory({ id: masterCatForm.id, name: masterCatForm.name.trim(), type: masterCatForm.type });
          else addMasterCategory({ name: masterCatForm.name.trim(), type: masterCatForm.type });
          setMasterCatModalVisible(false);
        }} />}>
        <Field label="Name"><Input icon="folder-outline" placeholder="Category name" value={masterCatForm.name} onChangeText={(v) => setMasterCatForm({ ...masterCatForm, name: v })} autoFocus /></Field>
        <Field label="Type">
          <Seg items={[{ key: 'expense', label: 'Expense' }, { key: 'income', label: 'Income' }, { key: 'savings', label: 'Savings' }]} value={masterCatForm.type} onChange={(type) => setMasterCatForm({ ...masterCatForm, type })} colors={{ expense: C.acc, income: C.acc, savings: C.acc }} />
        </Field>
        <View style={styles.note}><Ionicons name="information-circle-outline" size={17} color={C.blue} /><Text style={styles.noteText}>Expense categories hold sub-categories with monthly budgets. Savings categories become goals.</Text></View>
      </Sheet>

      {/* Bank */}
      <Sheet visible={bankModalVisible} onClose={() => setBankModalVisible(false)} title={bankForm.id ? 'Edit bank account' : 'New bank account'}
        footer={<PrimaryButton title="Save bank" onPress={async () => {
          if (!bankForm.name) return Alert.alert('Wait', 'Bank Name is required.');
          if (bankForm.id) {
            const payload: any = { id: bankForm.id, name: bankForm.name, account_number: bankForm.account_number || undefined };
            if (bankForm.balance !== bankForm.orig_balance && bankForm.balance !== '') payload.balance = parseFloat(bankForm.balance) || 0;
            if (bankForm.opening_balance !== bankForm.orig_opening && bankForm.opening_balance !== '') payload.opening_balance = parseFloat(bankForm.opening_balance) || 0;
            const ok = await updateBankAccount(payload);
            if (ok) setBankModalVisible(false);
          } else {
            addBank({ name: bankForm.name, account_number: bankForm.account_number || undefined, initial_balance: parseFloat(bankForm.initial_balance) || 0 });
            setBankModalVisible(false);
          }
        }} />}>
        <Field label="Bank name"><Input icon="business-outline" placeholder="Bank name (e.g. Meezan)" value={bankForm.name} onChangeText={(v) => setBankForm({ ...bankForm, name: v })} autoFocus /></Field>
        <Field label="Account number (optional)"><Input icon="card-outline" placeholder="Account number" value={bankForm.account_number} onChangeText={(v) => setBankForm({ ...bankForm, account_number: v })} /></Field>
        {bankForm.id ? (
          <>
            <Field label="Balance (manual correction)"><Input icon="cash-outline" placeholder="Current balance" keyboardType="numbers-and-punctuation" value={bankForm.balance} onChangeText={(v) => setBankForm({ ...bankForm, balance: v })} /></Field>
            <Text style={styles.hint}>Correcting the balance moves the opening balance by the same amount, so it won&apos;t show up as drift.</Text>
            <Field label="Opening balance"><Input icon="flag-outline" placeholder="Opening balance" keyboardType="numbers-and-punctuation" value={bankForm.opening_balance} onChangeText={(v) => setBankForm({ ...bankForm, opening_balance: v })} /></Field>
            <Text style={styles.hint}>Saved exactly as entered. If it doesn&apos;t match your transactions, Bank overview shows the gap as drift.</Text>
          </>
        ) : (
          <Field label="Initial balance"><Input icon="cash-outline" placeholder="e.g. 5000" keyboardType="decimal-pad" value={bankForm.initial_balance} onChangeText={(v) => setBankForm({ ...bankForm, initial_balance: v })} /></Field>
        )}
      </Sheet>

      {/* Sub category */}
      <Sheet visible={subCatModalVisible} onClose={() => setSubCatModalVisible(false)} title={subCatForm.id ? 'Edit category' : 'New category'}
        footer={<PrimaryButton title="Save category" onPress={() => {
          if (!subCatForm.name) return Alert.alert('Wait', 'Name is required.');
          const payload = {
            master_category_id: subCatForm.master_category_id,
            name: subCatForm.name,
            assigned_budget: parseFloat(subCatForm.assigned_budget) || 0,
            default_bank_account_id: subCatForm.default_bank_account_id || undefined,
          };
          if (subCatForm.id) updateSubCategory({ id: subCatForm.id, ...payload }); else addSubCategory(payload);
          setSubCatModalVisible(false);
        }} />}>
        <Field label="Category name"><Input icon="pencil-outline" placeholder="e.g. Groceries" value={subCatForm.name} onChangeText={(v) => setSubCatForm({ ...subCatForm, name: v })} autoFocus /></Field>
        <Field label="Assigned budget"><Input icon="cash-outline" placeholder="e.g. 3000" keyboardType="decimal-pad" value={subCatForm.assigned_budget} onChangeText={(v) => setSubCatForm({ ...subCatForm, assigned_budget: v })} /></Field>
        <Field label="Default bank (for auto tracking)">
          <Chips>
            <Chip label="None" active={!subCatForm.default_bank_account_id} onPress={() => setSubCatForm({ ...subCatForm, default_bank_account_id: '' })} />
            {banks.map(b => <Chip key={b.id} label={b.name} active={subCatForm.default_bank_account_id === b.id} onPress={() => setSubCatForm({ ...subCatForm, default_bank_account_id: b.id })} />)}
          </Chips>
        </Field>
        <Text style={styles.hint}>New transactions in this category will pre-select the default bank.</Text>
      </Sheet>

      {/* Budget */}
      <Sheet visible={budgetModalVisible} onClose={() => setBudgetModalVisible(false)} title={budgetForm.sub_category_id ? 'Edit budget' : 'Allocate budget'}
        footer={<PrimaryButton title="Save budget" onPress={async () => {
          if (!budgetForm.sub_category_id || budgetForm.amount === '') return Alert.alert('Wait', 'Category and amount are required.');
          const amount = parseFloat(budgetForm.amount);
          if (isNaN(amount) || amount < 0) return Alert.alert('Wait', 'Amount must be zero or more.');
          const payload: any = { sub_category_id: budgetForm.sub_category_id, amount, for_month: budgetMonth };
          if (budgetForm.source_bank_account_id) {
            const cat: any = subCategories.find(s => s.id === budgetForm.sub_category_id);
            if (!cat?.default_bank_account_id) return Alert.alert('Default bank needed', 'To move money, this category needs a default bank. Set one in Categories first.');
            payload.source_bank_account_id = budgetForm.source_bank_account_id;
          }
          const ok = await setMonthlyBudget(payload);
          if (ok) setBudgetModalVisible(false);
        }} />}>
        <View style={{ marginTop: 10 }}><MonthBar label={monthLabel} onPrev={() => shiftMonth(-1)} onNext={() => shiftMonth(1)} /></View>
        <Text style={styles.hint}>Setting the same category and month again edits its amount. By default no money moves — a budget row only saves a net-zero record.</Text>
        <Field label="Category">
          <Chips>{expenseSubs.map(cat => <Chip key={cat.id} label={cat.name} active={budgetForm.sub_category_id === cat.id} onPress={() => setBudgetForm({ ...budgetForm, sub_category_id: cat.id })} />)}</Chips>
        </Field>
        <Field label="Amount"><Input icon="cash-outline" placeholder="e.g. 5000" keyboardType="decimal-pad" value={budgetForm.amount} onChangeText={(v) => setBudgetForm({ ...budgetForm, amount: v })} /></Field>
        <Field label="Move money from (optional)">
          <Chips>
            <Chip label="Don't move money" active={!budgetForm.source_bank_account_id} onPress={() => setBudgetForm({ ...budgetForm, source_bank_account_id: '' })} />
            {banks.map(b => <Chip key={b.id} label={b.name} active={budgetForm.source_bank_account_id === b.id} onPress={() => setBudgetForm({ ...budgetForm, source_bank_account_id: b.id })} />)}
          </Chips>
        </Field>
        <Text style={styles.hint}>Choosing a bank transfers the amount once from it to the category&apos;s default bank. If they are the same bank, nothing moves.</Text>
      </Sheet>

      {/* Transfer */}
      <Sheet visible={transferModalVisible} onClose={() => setTransferModalVisible(false)} title="Transfer budget"
        footer={<PrimaryButton title="Transfer" onPress={() => {
          if (!transferForm.from_sub_category_id || !transferForm.to_sub_category_id || !transferForm.amount) return Alert.alert('Wait', 'Please fill all fields.');
          transferBudget({
            from_sub_category_id: transferForm.from_sub_category_id,
            to_sub_category_id: transferForm.to_sub_category_id,
            amount: parseFloat(transferForm.amount) || 0,
            for_month: budgetMonth,
          }).then(() => setTransferModalVisible(false)).catch(() => {});
        }} />}>
        <Field label="From category">
          <Chips>{subCategories.map(cat => <Chip key={cat.id} label={cat.name} active={transferForm.from_sub_category_id === cat.id} onPress={() => setTransferForm({ ...transferForm, from_sub_category_id: cat.id })} />)}</Chips>
        </Field>
        <View style={{ alignItems: 'center', marginTop: 14 }}>
          <View style={styles.swapDot}><Ionicons name="arrow-down" size={19} color={C.acc} /></View>
        </View>
        <Field label="To category" style={{ marginTop: 6 }}>
          <Chips>{subCategories.filter(s => s.id !== transferForm.from_sub_category_id).map(cat => <Chip key={cat.id} label={cat.name} active={transferForm.to_sub_category_id === cat.id} onPress={() => setTransferForm({ ...transferForm, to_sub_category_id: cat.id })} />)}</Chips>
        </Field>
        <Field label="Amount to transfer"><Input icon="cash-outline" placeholder="e.g. 500" keyboardType="decimal-pad" value={transferForm.amount} onChangeText={(v) => setTransferForm({ ...transferForm, amount: v })} /></Field>
      </Sheet>

      {/* Saved amount */}
      <Sheet visible={savedVisible} onClose={() => setSavedVisible(false)} title="Set saved amount"
        footer={<PrimaryButton title="Save" onPress={async () => {
          const v = parseFloat(savedForm.current_saved);
          if (isNaN(v) || v < 0) return Alert.alert('Wait', 'Enter a valid amount.');
          const ok = await updateSavingsCategory({ id: savedForm.id, current_saved: v });
          if (ok) setSavedVisible(false);
        }} />}>
        <Text style={styles.hint}>Manually set how much is saved in &quot;{savedForm.name}&quot;. This only changes the goal&apos;s amount and creates no transaction.</Text>
        <Field label="Saved amount"><Input icon="trophy-outline" placeholder="e.g. 19260" keyboardType="decimal-pad" value={savedForm.current_saved} onChangeText={(v) => setSavedForm({ ...savedForm, current_saved: v })} autoFocus /></Field>
      </Sheet>

      <ConfirmDialog visible={!!confirm} title={confirm?.title || ''} message="Are you sure? This action cannot be undone."
        onCancel={() => setConfirm(null)} onConfirm={() => { confirm?.onConfirm(); setConfirm(null); }} />
    </>
  );
}

const styles = StyleSheet.create({
  h1: { color: C.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.8 },
  h2: { color: C.text, fontSize: 18, fontWeight: '700' },
  sub: { color: C.mute, fontSize: 14, marginTop: 4 },
  rowSp: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 20 },
  tileWrap: { width: '48%' },
  tileTitle: { color: C.text, fontSize: 15, fontWeight: '700', marginTop: 12 },
  tileSub: { color: C.dim, fontSize: 12, marginTop: 2 },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.line },
  navTitle: { color: C.text, fontSize: 15, fontWeight: '700' },
  navSub: { color: C.dim, fontSize: 12, marginTop: 2 },
  catTitle: { color: C.text, fontSize: 16, fontWeight: '700' },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingLeft: 6, borderTopWidth: 1, borderTopColor: C.line },
  treeLine: { width: 10, height: 2, backgroundColor: alpha(C.acc, 0.7), borderRadius: 2 },
  subText: { color: C.text, fontSize: 14.5, fontWeight: '500', flex: 1 },
  amt: { color: C.text, fontSize: 14, fontWeight: '700', marginRight: 4 },
  emptyText: { color: C.dim, textAlign: 'center', padding: 20, fontSize: 14 },
  note: { flexDirection: 'row', gap: 10, backgroundColor: alpha(C.blue, 0.08), borderWidth: 1, borderColor: alpha(C.blue, 0.2), borderRadius: 16, padding: 12, marginTop: 16, alignItems: 'flex-start' },
  noteText: { color: '#bfdbfe', fontSize: 12.5, lineHeight: 18, flex: 1 },
  hint: { color: C.dim, fontSize: 12, lineHeight: 18, marginTop: 12 },
  swapDot: { width: 42, height: 42, borderRadius: 21, backgroundColor: alpha(C.acc, 0.14), borderWidth: 1, borderColor: alpha(C.acc, 0.4), alignItems: 'center', justifyContent: 'center' },
});

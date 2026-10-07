import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../store/useStore';
import { Screen, Card, IconBox, Tag, Seg, Chip, Chips, Field, Input, Sheet, PrimaryButton, Dialog, ConfirmDialog, GhostBtn, EmptyState, Label } from '../ui/kit';
import { C, money, num } from '../ui/theme';

const AV = [C.violet, C.blue, C.rose, C.amber, C.acc];

export default function PayablesScreen() {
  const peopleSummary = useStore((state) => state.peopleSummary) || [];
  const banks = useStore((state) => state.banks);
  const people = useStore((state) => state.people);
  const subCategories = useStore((state) => state.subCategories);
  const masterCategories = useStore((state) => state.masterCategories);

  const addDebt = useStore((state) => state.addDebt);
  const payDebt = useStore((state) => state.payDebt);
  const addPerson = useStore((state) => state.addPerson);
  const deleteDebt = useStore((state) => state.deleteDebt);
  const updateDebt = useStore((state) => state.updateDebt);

  const [expandedPersonId, setExpandedPersonId] = useState<any>(null);
  const [tab, setTab] = useState('owed'); // owed | owe

  // Create / Pay Modals
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('lent');
  const [form, setForm] = useState({ person_id: '', amount: '', source_type: 'bank', bank_account_id: '', savings_sub_category_id: '' });

  const [personModalVisible, setPersonModalVisible] = useState(false);
  const [personForm, setPersonForm] = useState({ name: '', phone: '' });

  const [payModalVisible, setPayModalVisible] = useState(false);
  const [payForm, setPayForm] = useState({ debt_id: '', amount: '', bank_account_id: '' });
  const [selectedDebt, setSelectedDebt] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [editPerson, setEditPerson] = useState('');
  const [editDate, setEditDate] = useState(new Date());
  const [showEditPicker, setShowEditPicker] = useState(false);

  const savingsGoals = subCategories.filter(sub => {
    const master = masterCategories.find(mc => mc.id === sub.master_category_id);
    return master && master.type === 'savings';
  });

  const togglePerson = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedPersonId(expandedPersonId === id ? null : id);
  };

  const handleSave = async () => {
    const amt = parseFloat(form.amount);
    if (!form.person_id || !amt || amt <= 0) {
      Alert.alert('Missing details', 'Please enter an amount and select a person.');
      return;
    }
    if (form.source_type === 'bank' && !form.bank_account_id) {
      Alert.alert('Missing details', 'Please select the bank account.');
      return;
    }
    if (form.source_type === 'savings') {
      if (!form.savings_sub_category_id) {
        Alert.alert('Missing details', 'Please select a savings goal.');
        return;
      }
      const goal: any = savingsGoals.find(g => g.id === form.savings_sub_category_id);
      if (activeTab === 'lent' && goal && goal.current_saved !== undefined && amt > goal.current_saved) {
        Alert.alert('Not enough saved', `You can't lend more than the goal holds (Rs ${num(goal.current_saved)}).`);
        return;
      }
    }

    const payload: any = {
      person_id: form.person_id,
      amount: amt,
      type: activeTab,
      source_type: form.source_type,
      date: new Date().toISOString()
    };

    if (form.source_type === 'savings') {
      payload.savings_sub_category_id = form.savings_sub_category_id;
    } else {
      payload.bank_account_id = form.bank_account_id;
    }

    const ok = await addDebt(payload);
    if (ok) {
      setForm({ person_id: '', amount: '', source_type: 'bank', bank_account_id: banks[0]?.id || '', savings_sub_category_id: '' });
      setModalVisible(false);
    }
  };

  const handleAddPerson = async () => {
    if (!personForm.name.trim()) return;
    const ok = await addPerson({ name: personForm.name.trim(), phone: personForm.phone || undefined });
    if (ok) {
      setPersonForm({ name: '', phone: '' });
      setPersonModalVisible(false);
    }
  };

  const handlePay = async () => {
    const amt = parseFloat(payForm.amount);
    if (!amt || amt <= 0) {
      Alert.alert('Missing details', 'Please enter an amount.');
      return;
    }
    if (selectedDebt && amt > selectedDebt.remaining) {
      Alert.alert('Too much', `Payment exceeds the outstanding amount (Rs ${num(selectedDebt.remaining)}).`);
      return;
    }
    const isSavings = selectedDebt?.source_type === 'savings';

    const ok = await payDebt({
      debt_id: payForm.debt_id,
      amount: amt,
      date: new Date().toISOString(),
      ...(isSavings ? {} : (payForm.bank_account_id ? { bank_account_id: payForm.bank_account_id } : {}))
    });
    if (ok) {
      setPayForm({ debt_id: '', amount: '', bank_account_id: '' });
      setSelectedDebt(null);
      setPayModalVisible(false);
    }
  };

  const openEdit = (debt, personId) => {
    setEditTarget(debt);
    setEditPerson(personId);
    const d = debt.date ? new Date(debt.date) : new Date();
    setEditDate(isNaN(d.getTime()) ? new Date() : d);
    setShowEditPicker(false);
  };

  const handleEditSave = async () => {
    if (!editTarget || !editPerson) return;
    const ok = await updateDebt({ id: editTarget.id, person_id: editPerson, date: editDate.toISOString() });
    if (ok) setEditTarget(null);
  };

  const receivable = peopleSummary.reduce((a, p) => a + (p.net > 0 ? p.net : 0), 0);
  const payable = peopleSummary.reduce((a, p) => a + (p.net < 0 ? Math.abs(p.net) : 0), 0);
  const visible = peopleSummary.filter(p => (tab === 'owed' ? p.net > 0 : p.net <= 0));

  const openRecord = (type) => {
    setActiveTab(type);
    setForm((f) => ({ ...f, bank_account_id: f.bank_account_id || banks[0]?.id || '' }));
    setModalVisible(true);
  };

  return (
    <>
      <Screen>
        <Text style={styles.h1}>Ledger</Text>

        <View style={{ marginTop: 14 }}>
          <Seg items={[{ key: 'owed', label: 'Owed to me' }, { key: 'owe', label: 'I owe' }]} value={tab} onChange={setTab} />
        </View>

        <View style={styles.tiles}>
          <Card pad={12} style={{ flex: 1 }}><Text style={styles.tileLabel}>You&apos;ll receive</Text><Text style={[styles.tileValue, { color: C.acc }]}>{money(receivable)}</Text></Card>
          <Card pad={12} style={{ flex: 1 }}><Text style={styles.tileLabel}>You owe</Text><Text style={[styles.tileValue, payable > 0 && { color: C.rose }]}>{money(payable)}</Text></Card>
        </View>

        {peopleSummary.length === 0 && (
          <EmptyState icon="people-outline" color={C.violet} title="No ledger records found" sub="Record money you lent or borrowed to keep track." />
        )}

        <View style={{ gap: 10, marginTop: 12 }}>
          {visible.map((person, pi) => {
            const isExpanded = expandedPersonId === person.person_id;
            const netColor = person.net > 0 ? C.acc : (person.net < 0 ? C.rose : C.acc);
            const av = AV[pi % AV.length];
            return (
              <Card key={person.person_id} pad={0} style={{ overflow: 'hidden' }}>
                <TouchableOpacity style={styles.personHeader} onPress={() => togglePerson(person.person_id)} activeOpacity={0.85}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <LinearGradient colors={[av, '#1e3a5f']} style={styles.avatar}>
                      <Text style={styles.avatarText}>{person.name.charAt(0).toUpperCase()}</Text>
                    </LinearGradient>
                    <View>
                      <Text style={styles.name}>{person.name}</Text>
                      <Text style={[styles.netText, { color: netColor }]}>
                        {person.net > 0 ? `Owes you Rs ${num(person.net)}` : person.net < 0 ? `You owe Rs ${num(Math.abs(person.net))}` : 'Settled up'}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={C.mute} />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.debts}>
                    {person.debts.length === 0 && <Text style={styles.noRec}>No active records.</Text>}
                    {person.debts.map((debt, i) => {
                      const lent = debt.type === 'lent';
                      const col = lent ? C.acc : C.rose;
                      return (
                        <TouchableOpacity key={debt.id} style={[styles.debt, i === 0 && { borderTopWidth: 0 }]} activeOpacity={0.8}
                          onPress={() => {
                            if (debt.status !== 'paid') {
                              setSelectedDebt(debt);
                              setPayForm({ debt_id: debt.id, amount: '', bank_account_id: '' });
                              setPayModalVisible(true);
                            }
                          }}>
                          <IconBox name={lent ? 'arrow-up-outline' : 'arrow-down-outline'} color={col} size={34} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.debtTitle}>{lent ? 'Lent' : 'Borrowed'}</Text>
                            <Text style={styles.debtDate}>{(debt.date ? new Date(debt.date).toLocaleDateString() : '')}</Text>
                          </View>
                          <View style={{ alignItems: 'flex-end', gap: 5 }}>
                            <Text style={[styles.amount, { color: col }]}>Rs {num(debt.remaining)}</Text>
                            <View style={{ flexDirection: 'row', gap: 6 }}>
                              <Tag label={debt.status === 'paid' ? 'Paid' : debt.status === 'partial' ? 'Partial' : 'Pending'} color={debt.status === 'paid' ? C.acc : debt.status === 'partial' ? C.blue : C.amber} />
                              {debt.status !== 'paid' && <Tag label={lent ? 'Receive' : 'Pay'} color={col} />}
                            </View>
                            {debt.amount_settled > 0 && <Text style={styles.debtDate}>Rs {num(debt.amount_settled)} of {num(debt.amount)} settled</Text>}
                          </View>
                          <GhostBtn icon="pencil-outline" size={30} onPress={() => openEdit(debt, person.person_id)} />
                          <GhostBtn icon="trash-outline" danger size={30} onPress={() => setDeleteTarget(debt)} />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </Card>
            );
          })}
        </View>
      </Screen>

      <View style={styles.fabRow} pointerEvents="box-none">
        <PrimaryButton title="I lent" icon="arrow-up" onPress={() => openRecord('lent')} style={{ flex: 1 }} small />
        <PrimaryButton title="I borrowed" icon="arrow-down" variant="danger" onPress={() => openRecord('borrowed')} style={{ flex: 1 }} small />
      </View>

      {/* CREATE RECORD */}
      <Sheet visible={modalVisible} onClose={() => setModalVisible(false)} title={activeTab === 'lent' ? 'Record lent money' : 'Record borrowed money'}
        footer={<PrimaryButton title="Save record" onPress={handleSave} />}>
        <View style={{ marginTop: 12 }}>
          <Seg items={[{ key: 'lent', label: 'I lent' }, { key: 'borrowed', label: 'I borrowed' }]} value={activeTab} onChange={setActiveTab} colors={{ lent: C.acc, borrowed: C.rose }} />
        </View>
        <View style={{ alignItems: 'center', marginTop: 16 }}>
          <Label>Amount</Label>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 2 }}>
            <Text style={styles.rs}>Rs </Text>
            <Input value={form.amount} onChangeText={(val) => setForm({ ...form, amount: val })} keyboardType="numeric" placeholder="0"
              style={{ backgroundColor: 'transparent', borderWidth: 0, height: 56, paddingHorizontal: 0, minWidth: 90 }} />
          </View>
        </View>

        <View style={styles.rowSp}>
          <Label>Person</Label>
          <TouchableOpacity onPress={() => setPersonModalVisible(true)}><Text style={{ color: C.acc, fontSize: 13, fontWeight: '700' }}>+ Add new</Text></TouchableOpacity>
        </View>
        <View style={{ marginTop: 8 }}>
          <Chips>{people.map(p => <Chip key={p.id} label={p.name} active={form.person_id === p.id} onPress={() => setForm({ ...form, person_id: p.id })} />)}</Chips>
        </View>

        <Field label="Source">
          <Seg items={[{ key: 'bank', label: 'Bank account' }, { key: 'savings', label: 'Savings goal' }]} value={form.source_type} onChange={(k) => setForm({ ...form, source_type: k })} />
        </Field>

        {form.source_type === 'bank' && (
          <Field label={activeTab === 'lent' ? 'Lend from bank account' : 'Receive into bank account'}>
            <Chips>{banks.map(b => <Chip key={b.id} label={b.name} active={form.bank_account_id === b.id} onPress={() => setForm({ ...form, bank_account_id: b.id })} />)}</Chips>
          </Field>
        )}
        {form.source_type === 'savings' && (
          <Field label="Savings goal">
            <Chips>{savingsGoals.map(sg => <Chip key={sg.id} label={sg.name} active={form.savings_sub_category_id === sg.id} onPress={() => setForm({ ...form, savings_sub_category_id: form.savings_sub_category_id === sg.id ? '' : sg.id })} />)}</Chips>
          </Field>
        )}
      </Sheet>

      {/* ADD PERSON */}
      <Dialog visible={personModalVisible} onClose={() => setPersonModalVisible(false)}>
        <View style={styles.rowSp}>
          <Text style={styles.dTitle}>Add person</Text>
          <TouchableOpacity onPress={() => setPersonModalVisible(false)} style={styles.close}><Ionicons name="close" size={18} color={C.mute} /></TouchableOpacity>
        </View>
        <Field label="Name"><Input icon="person-outline" placeholder="John Doe" value={personForm.name} onChangeText={(val) => setPersonForm({ ...personForm, name: val })} autoFocus /></Field>
        <Field label="Phone (optional)"><Input icon="call-outline" placeholder="+92..." keyboardType="phone-pad" value={personForm.phone} onChangeText={(val) => setPersonForm({ ...personForm, phone: val })} /></Field>
        <PrimaryButton title="Save person" onPress={handleAddPerson} style={{ marginTop: 20 }} />
      </Dialog>

      {/* PAY / RECEIVE */}
      <Dialog visible={payModalVisible} onClose={() => setPayModalVisible(false)}>
        <View style={styles.rowSp}>
          <Text style={styles.dTitle}>{selectedDebt?.type === 'lent' ? 'Receive payment' : 'Make payment'}</Text>
          <TouchableOpacity onPress={() => setPayModalVisible(false)} style={styles.close}><Ionicons name="close" size={18} color={C.mute} /></TouchableOpacity>
        </View>
        {selectedDebt && (
          <View style={styles.remBox}>
            <IconBox name={selectedDebt.type === 'lent' ? 'arrow-up-outline' : 'arrow-down-outline'} color={selectedDebt.type === 'lent' ? C.acc : C.rose} size={36} />
            <View><Text style={styles.name}>{selectedDebt.type === 'lent' ? 'Lent' : 'Borrowed'}</Text><Text style={styles.debtDate}>Remaining Rs {num(selectedDebt.remaining)}</Text></View>
          </View>
        )}
        <Field label="Amount"><Input icon="cash-outline" placeholder={`Max: ${selectedDebt?.remaining ?? ''}`} keyboardType="numeric" value={payForm.amount} onChangeText={(val) => setPayForm({ ...payForm, amount: val })} autoFocus /></Field>
        {selectedDebt?.source_type !== 'savings' && (
          <Field label="Bank account (optional)">
            <Chips>{banks.map(b => <Chip key={b.id} label={b.name} active={payForm.bank_account_id === b.id} onPress={() => setPayForm({ ...payForm, bank_account_id: payForm.bank_account_id === b.id ? '' : b.id })} />)}</Chips>
            <Text style={styles.hint}>Leave empty to use the bank this record was created with.</Text>
          </Field>
        )}
        <PrimaryButton title="Confirm payment" onPress={handlePay} style={{ marginTop: 20 }} />
      </Dialog>
      {/* EDIT RECORD */}
      <Sheet visible={!!editTarget} onClose={() => setEditTarget(null)} title="Edit record"
        footer={<PrimaryButton title="Save changes" onPress={handleEditSave} />}>
        {editTarget && (
          <View style={styles.remBox}>
            <IconBox name={editTarget.type === 'lent' ? 'arrow-up-outline' : 'arrow-down-outline'} color={editTarget.type === 'lent' ? C.acc : C.rose} size={36} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{editTarget.type === 'lent' ? 'Lent' : 'Borrowed'} · Rs {num(editTarget.amount)}</Text>
              <Text style={styles.debtDate}>{editTarget.source_type === 'savings' ? 'From a savings goal' : 'From a bank account'}</Text>
            </View>
          </View>
        )}
        <Text style={styles.hint}>You can change the person and the date. To change the amount, type or bank, delete this record and create it again.</Text>
        <Field label="Person">
          <Chips>{people.map(p => <Chip key={p.id} label={p.name} active={editPerson === p.id} onPress={() => setEditPerson(p.id)} />)}</Chips>
        </Field>
        <Field label="Date">
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowEditPicker(true)} activeOpacity={0.85}>
            <Ionicons name="calendar-outline" size={18} color={C.mute} />
            <Text style={{ color: C.text, fontSize: 15, fontWeight: '500' }}>{editDate.toLocaleDateString()}</Text>
          </TouchableOpacity>
        </Field>
        {showEditPicker && (
          <DateTimePicker value={editDate} mode="date" display="default"
            onChange={(event, d) => {
              setShowEditPicker(Platform.OS === 'ios');
              if (event?.type !== 'dismissed' && d) setEditDate(d);
            }} />
        )}
      </Sheet>

      <ConfirmDialog
        visible={!!deleteTarget}
        title="Delete this record?"
        message={deleteTarget?.source_type === 'savings' ? 'The savings goal balance will be put back. This cannot be undone.' : 'Its transaction and every repayment will be removed and the bank balance restored. This cannot be undone.'}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => { const id = deleteTarget?.id; setDeleteTarget(null); if (id) await deleteDebt(id); }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  hint: { color: C.dim, fontSize: 12, marginTop: 8, lineHeight: 18 },
  dateBtn: { height: 50, borderRadius: 16, backgroundColor: C.s1, borderWidth: 1, borderColor: C.line, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16 },
  h1: { color: C.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.8 },
  rowSp: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  tiles: { flexDirection: 'row', gap: 12, marginTop: 12 },
  tileLabel: { color: C.mute, fontSize: 12 },
  tileValue: { color: C.text, fontSize: 18, fontWeight: '800', marginTop: 4 },
  personHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  avatar: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  name: { color: C.text, fontSize: 16, fontWeight: '700' },
  netText: { fontSize: 12.5, fontWeight: '700', marginTop: 2 },
  debts: { paddingHorizontal: 16, paddingBottom: 6, backgroundColor: 'rgba(0,0,0,0.18)' },
  noRec: { color: C.mute, fontSize: 12, textAlign: 'center', marginVertical: 14 },
  debt: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.line },
  debtTitle: { color: C.text, fontSize: 14.5, fontWeight: '700' },
  debtDate: { color: C.dim, fontSize: 12, marginTop: 2 },
  amount: { fontSize: 14.5, fontWeight: '800' },
  fabRow: { position: 'absolute', left: 20, right: 20, bottom: 108, flexDirection: 'row', gap: 12 },
  rs: { color: C.dim, fontSize: 24, fontWeight: '700' },
  dTitle: { color: C.text, fontSize: 20, fontWeight: '700' },
  close: { width: 34, height: 34, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  remBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 16, padding: 10, marginTop: 14 },
});

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { PieChart } from 'react-native-gifted-charts';
import { useStore } from '../store/useStore';
import AddTransactionModal from '../components/AddTransactionModal';
import { Screen, Header, Seg, Card, Hero, IconBox, Tag, Bar, GhostBtn, Chip, Input, EmptyState, ConfirmDialog, BarChart, Sparkline, Label } from '../ui/kit';
import { C, money, categoryIcon } from '../ui/theme';

const FILTERS = [
  { key: 'day', label: 'Daily' },
  { key: 'month', label: 'Monthly' },
  { key: 'year', label: 'Yearly' },
  { key: 'category', label: 'Category' },
];

export default function TransactionsScreen() {
  const { width } = useWindowDimensions();
  const [modalVisible, setModalVisible] = useState(false);
  const [filter, setFilter] = useState('month'); // 'day', 'month', 'year', 'category'
  const [expandedGroups, setExpandedGroups] = useState({});
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all'); // all | debit | credit
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  const allExpenses = useStore(state => state.expenses);
  const subCategories = useStore(state => state.subCategories);
  const masterCategories = useStore(state => state.masterCategories);
  const deleteExpense = useStore(state => state.deleteExpense);

  const getSubCategoryName = (id) => subCategories.find(s => s.id === id)?.name || 'Unknown';

  const handleExportCSV = async () => {
    try {
      const headerString = 'Date,Type,Category,Reason,Amount,Note\n';
      const rowString = expenses.map(e => {
        const cat = getSubCategoryName(e.sub_category_id);
        const date = new Date(e.date).toLocaleDateString();
        const reason = `"${(e.reason || '').replace(/"/g, '""')}"`;
        const note = `"${(e.note || '').replace(/"/g, '""')}"`;
        return `${date},${e.type},"${cat}",${reason},${e.amount},${note}`;
      }).join('\n');
      
      const csvString = `${headerString}${rowString}`;
      const fileUri = FileSystem.documentDirectory + 'transactions_report.csv';
      await FileSystem.writeAsStringAsync(fileUri, csvString, { encoding: FileSystem.EncodingType.UTF8 });
      
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to export CSV');
    }
  };

  const expenses = useMemo(() => allExpenses.filter(e => {
    if (typeFilter === 'debit' && e.type === 'credit') return false;
    if (typeFilter === 'credit' && e.type !== 'credit') return false;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      const hay = `${e.reason || ''} ${e.note || ''} ${getSubCategoryName(e.sub_category_id)}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }), [allExpenses, typeFilter, query, subCategories]);

  const handleEditTransaction = (expense) => {
    setEditingTransaction(expense);
    setModalVisible(true);
  };

  const toggleGroup = (key) => setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));

  const grouped = expenses.reduce((acc, expense) => {
    const d = new Date(expense.date);
    let key;
    if (filter === 'day') {
      key = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } else if (filter === 'month') {
      key = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    } else if (filter === 'year') {
      key = d.getFullYear().toString();
    } else if (filter === 'category') {
      const sub = subCategories.find(s => s.id === expense.sub_category_id);
      const master = sub ? masterCategories.find(m => m.id === sub.master_category_id) : null;
      key = master && sub ? `${master.name} / ${sub.name}` : (sub?.name || 'Unknown');
    }

    if (!acc[key]) acc[key] = { sortDate: d.getTime(), transactions: [], total: 0, inn: 0, out: 0 };
    acc[key].transactions.push(expense);
    acc[key].total += (expense.type === 'credit' ? expense.amount : -expense.amount);
    if (expense.type === 'credit') acc[key].inn += expense.amount; else acc[key].out += expense.amount;
    return acc;
  }, {});

  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    if (filter === 'category') return a.localeCompare(b);
    return grouped[b].sortDate - grouped[a].sortDate;
  });

  const totalIn = expenses.reduce((a, e) => a + (e.type === 'credit' ? Number(e.amount) : 0), 0);
  const totalOut = expenses.reduce((a, e) => a + (e.type !== 'credit' ? Number(e.amount) : 0), 0);
  const maxOut = Math.max(...sortedKeys.map(k => grouped[k].out), 1);

  // last 6 months net flow
  const monthly = useMemo(() => {
    const now = new Date();
    const vals = [], labels = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      let net = 0;
      for (const e of expenses) {
        const t = new Date(e.date);
        if (t.getFullYear() === d.getFullYear() && t.getMonth() === d.getMonth()) net += e.type === 'credit' ? Number(e.amount) : -Number(e.amount);
      }
      vals.push(Math.abs(net));
      labels.push(d.toLocaleString('en-US', { month: 'short' }));
    }
    return { vals, labels };
  }, [expenses]);

  const yearSeries = useMemo(() => {
    const keys = Object.keys(grouped);
    if (filter !== 'year' || keys.length === 0) return [];
    const now = new Date();
    const series = []; let cum = 0;
    for (let m = 0; m < 12; m++) {
      let net = 0;
      for (const e of expenses) {
        const t = new Date(e.date);
        if (t.getFullYear() === now.getFullYear() && t.getMonth() === m) net += e.type === 'credit' ? Number(e.amount) : -Number(e.amount);
      }
      cum += net; series.push(cum);
    }
    return series.slice(0, now.getMonth() + 1);
  }, [expenses, filter]);

  const isEmpty = sortedKeys.length === 0;

  return (
    <>
      <Screen>
        <Header big title="Activity" right={
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={styles.searchBtn} onPress={handleExportCSV}>
              <Ionicons name="download-outline" size={19} color={C.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.searchBtn} onPress={() => { setSearchOpen(!searchOpen); if (searchOpen) setQuery(''); }}>
              <Ionicons name={searchOpen ? 'close' : 'search'} size={19} color={C.text} />
            </TouchableOpacity>
          </View>
        } />

        {searchOpen && <View style={{ marginBottom: 12 }}><Input icon="search" placeholder="Search reason, note or category" value={query} onChangeText={setQuery} autoFocus style={{ height: 48 }} /></View>}

        <Seg items={FILTERS} value={filter} onChange={setFilter} />

        {!isEmpty && (
          <>
            <View style={styles.sumRow}>
              <Card pad={12} style={{ flex: 1 }}>
                <View style={styles.rowC}><Ionicons name="arrow-up" size={14} color={C.rose} /><Text style={styles.sumLabel}>Out</Text></View>
                <Text style={styles.sumValue}>{money(totalOut)}</Text>
              </Card>
              <Card pad={12} style={{ flex: 1 }}>
                <View style={styles.rowC}><Ionicons name="arrow-down" size={14} color={C.acc} /><Text style={styles.sumLabel}>In</Text></View>
                <Text style={[styles.sumValue, { color: C.acc }]}>{money(totalIn)}</Text>
              </Card>
            </View>

            <View style={styles.filters}>
              <Chip label="All" active={typeFilter === 'all'} onPress={() => setTypeFilter('all')} />
              <Chip label="Money out" active={typeFilter === 'debit'} onPress={() => setTypeFilter('debit')} />
              <Chip label="Money in" active={typeFilter === 'credit'} onPress={() => setTypeFilter('credit')} />
            </View>

            {filter === 'category' && totalOut > 0 && (
              <Card pad={14} style={{ marginTop: 12, alignItems: 'center' }}>
                <Label style={{ alignSelf: 'flex-start' }}>Category Breakdown (Out)</Label>
                <View style={{ marginTop: 20 }}>
                  <PieChart
                    data={Object.keys(grouped).filter(k => grouped[k].out > 0).map((key, i) => {
                      const colors = ['#38bdf8', '#818cf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#fb923c', '#2dd4bf'];
                      return { value: grouped[key].out, color: colors[i % colors.length] };
                    })}
                    donut
                    radius={80}
                    innerRadius={55}
                    innerCircleColor={C.s2}
                    centerLabelComponent={() => <Text style={{color: C.text, fontSize: 16, fontWeight: '800'}}>{money(totalOut)}</Text>}
                  />
                </View>
              </Card>
            )}
            {filter === 'month' && (
              <Card pad={14} style={{ marginTop: 12 }}>
                <Label>Net flow · 6 months</Label>
                <View style={{ marginTop: 8 }}><BarChart values={monthly.vals} labels={monthly.labels} highlight={5} height={62} /></View>
              </Card>
            )}
            {filter === 'year' && yearSeries.length > 1 && (
              <Hero style={{ marginTop: 12, paddingBottom: 12 }}>
                <Label style={{ color: '#a5f3fc' }}>{new Date().getFullYear()} · year to date</Label>
                <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
                  <View style={{ flex: 1 }}><Text style={styles.sumLabel}>Total in</Text><Text style={[styles.heroNum, { color: C.acc }]}>{money(totalIn)}</Text></View>
                  <View style={{ flex: 1 }}><Text style={styles.sumLabel}>Total out</Text><Text style={[styles.heroNum, { color: C.rose }]}>{money(totalOut)}</Text></View>
                </View>
                <View style={{ marginTop: 10, marginHorizontal: -2 }}><Sparkline data={yearSeries} width={width - 80} height={58} /></View>
              </Hero>
            )}
          </>
        )}

        {isEmpty && (
          <EmptyState icon="receipt-outline" title="No activity yet" sub="Your transactions will appear here once you add your first one."
            action="Add transaction" onAction={() => { setEditingTransaction(null); setModalVisible(true); }} />
        )}

        <View style={{ gap: 10, marginTop: 12 }}>
          {sortedKeys.map(key => {
            const g = grouped[key];
            const open = expandedGroups[key];
            const positive = g.total >= 0;
            return (
              <Card key={key} pad={0} style={{ overflow: 'hidden' }}>
                <TouchableOpacity style={styles.groupHeader} onPress={() => toggleGroup(key)} activeOpacity={0.8}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                    <IconBox name={filter === 'category' ? (categoryIcon(key.split('/').pop()?.trim()) as any) : 'calendar-outline'} color={filter === 'category' ? C.violet : C.mute} size={34} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.groupTitle} numberOfLines={1}>{key}</Text>
                      <Text style={styles.groupSummary}>{g.transactions.length} transaction{g.transactions.length === 1 ? '' : 's'}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text style={[styles.groupTotal, { color: positive ? C.acc : C.rose }]}>{positive ? '+ ' : '- '}{money(g.total, true)}</Text>
                    <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={C.mute} />
                  </View>
                </TouchableOpacity>

                {(filter === 'month' || filter === 'year') && (
                  <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
                    <View style={styles.stack}>
                      <View style={{ flex: g.inn || 0.0001, backgroundColor: C.acc }} />
                      <View style={{ flex: g.out || 0.0001, backgroundColor: C.rose }} />
                    </View>
                    <View style={styles.rowSp}>
                      <Text style={{ color: C.acc, fontSize: 12 }}>In {money(g.inn)}</Text>
                      <Text style={{ color: C.rose, fontSize: 12 }}>Out {money(g.out)}</Text>
                    </View>
                  </View>
                )}
                {filter === 'category' && (
                  <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}><Bar pct={(g.out / maxOut) * 100} color={C.violet} /></View>
                )}

                {open && (
                  <View style={styles.groupContent}>
                    {g.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((expense, idx) => {
                      const catName = getSubCategoryName(expense.sub_category_id);
                      const isCredit = expense.type === 'credit';
                      return (
                        <View key={expense.id} style={[styles.tx, idx === 0 && { borderTopWidth: 0 }]}>
                          <IconBox name={categoryIcon(catName) as any} color={isCredit ? C.acc : C.rose} size={42} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.tTitle}>{expense.reason || catName}</Text>
                            <Text style={styles.tDate}>{catName} · {new Date(expense.date).toLocaleDateString()}</Text>
                            {expense.note ? <Text style={styles.tNote}>{expense.note}</Text> : null}
                          </View>
                          <View style={{ alignItems: 'flex-end', gap: 8 }}>
                            <Text style={[styles.tAmount, { color: isCredit ? C.acc : C.rose }]}>{isCredit ? '+ ' : '- '}{money(expense.amount, true)}</Text>
                            <View style={{ flexDirection: 'row', gap: 6 }}>
                              <GhostBtn icon="pencil-outline" size={28} onPress={() => handleEditTransaction(expense)} />
                              <GhostBtn icon="trash-outline" size={28} danger onPress={() => setDeleteId(expense.id)} />
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </Card>
            );
          })}
        </View>
      </Screen>

      <AddTransactionModal visible={modalVisible} onClose={() => setModalVisible(false)} editingTransaction={editingTransaction} />
      <ConfirmDialog
        visible={!!deleteId}
        title="Delete transaction?"
        message="This transaction will be removed and your balances will update. This can't be undone."
        onCancel={() => setDeleteId(null)}
        onConfirm={() => { deleteExpense(deleteId); setDeleteId(null); }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  searchBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.s2, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  sumRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  rowC: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowSp: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  sumLabel: { color: C.mute, fontSize: 12 },
  sumValue: { color: C.text, fontSize: 17, fontWeight: '800', marginTop: 4 },
  heroNum: { fontSize: 19, fontWeight: '800', marginTop: 4 },
  filters: { flexDirection: 'row', gap: 8, marginTop: 12 },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  groupTitle: { color: C.text, fontSize: 15.5, fontWeight: '700' },
  groupSummary: { color: C.dim, fontSize: 12, marginTop: 2 },
  groupTotal: { fontSize: 15, fontWeight: '800' },
  stack: { flexDirection: 'row', height: 8, borderRadius: 9, overflow: 'hidden', gap: 3 },
  groupContent: { borderTopWidth: 1, borderTopColor: C.line, backgroundColor: 'rgba(0,0,0,0.18)', paddingHorizontal: 16 },
  tx: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.line },
  tTitle: { color: C.text, fontSize: 15, fontWeight: '700' },
  tDate: { color: C.dim, fontSize: 12, marginTop: 2 },
  tNote: { color: C.mute, fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  tAmount: { fontSize: 15, fontWeight: '800' },
});

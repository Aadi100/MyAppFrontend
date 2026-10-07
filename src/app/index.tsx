import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import AddTransactionModal from '../components/AddTransactionModal';
import { useRouter } from 'expo-router';
import { Screen, Card, Hero, IconBox, Tag, Bar, MonthBar, SectionRow, Label, Ring, Donut, Sparkline, BarChart, EmptyState } from '../ui/kit';
import { C, money, num, categoryIcon } from '../ui/theme';

const DAY = 24 * 60 * 60 * 1000;
const DONUT_COLORS = [C.acc, C.blue, C.violet, C.amber];

export default function Dashboard() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'debit' | 'credit'>('debit');
  const [savingsModalVisible, setSavingsModalVisible] = useState(false);
  const expenses = useStore((state) => state.expenses);
  const fetchData = useStore((state) => state.fetchData);
  const dashboardSummary = useStore((state) => state.dashboardSummary);
  const fetchDashboardSummary = useStore((state) => state.fetchDashboardSummary);
  const profileName = useStore((state) => state.profile?.name);

  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));

  const accessToken = useStore((state) => state.accessToken);

  useEffect(() => {
    if (!accessToken) {
      router.replace('/login');
    } else {
      fetchData();
      fetchDashboardSummary(currentMonth);
    }
  }, [accessToken]);

  useEffect(() => {
    if (accessToken) {
      fetchDashboardSummary(currentMonth);
    }
  }, [currentMonth, accessToken]);

  const totalBalance = dashboardSummary?.total_bank_balance || 0;
  const netWorth = dashboardSummary?.net_worth || 0;
  const totalOverspend = dashboardSummary?.total_overspend || 0;
  const income = dashboardSummary?.total_assigned_budget || 0;
  const spent = dashboardSummary?.total_spent_this_month || 0;
  const savings = dashboardSummary?.total_savings_saved || 0;
  const owedToMe = dashboardSummary?.total_owed_to_me || 0;
  const iOwe = dashboardSummary?.total_i_owe || 0;
  const incomeThisMonth = dashboardSummary?.total_income_this_month || 0;
  const savingsTarget = dashboardSummary?.total_savings_target || 0;
  const bankAccounts = dashboardSummary?.balance_per_bank_account || [];
  const peopleBalances = dashboardSummary?.balance_per_person || [];
  const owedPeople = peopleBalances.filter((p) => p.they_owe_me > 0).length;
  const owePeople = peopleBalances.filter((p) => p.i_owe_them > 0).length;
  const remaining = income - spent;
  const usedPct = income > 0 ? Math.round((spent / income) * 100) : 0;

  const handlePrevMonth = () => {
    const [y, m] = currentMonth.split('-').map(Number);
    const d = new Date(y, (m || 1) - 2, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [y, m] = currentMonth.split('-').map(Number);
    const d = new Date(y, m || 1, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const formatMonthDisplay = (monthStr) => {
    if (!monthStr) return '';
    const [y, m] = monthStr.split('-').map(Number);
    const d = new Date(y, (m || 1) - 1, 1);
    return isNaN(d.getTime()) ? monthStr : d.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  // Net worth trend: walk the current net worth backwards through real transactions (2-day steps)
  const trend = useMemo(() => {
    const pts = 12;
    const step = 2 * DAY;
    const now = new Date().getTime();
    const series = [netWorth];
    let cur = netWorth;
    for (let i = 0; i < pts - 1; i++) {
      const hi = now - i * step, lo = hi - step;
      let flow = 0;
      for (const e of expenses) {
        const t = new Date(e.date).getTime();
        if (t > lo && t <= hi) flow += e.type === 'credit' ? Number(e.amount) : -Number(e.amount);
      }
      cur -= flow;
      series.unshift(cur);
    }
    const first = series[0];
    const pct = first ? ((netWorth - first) / Math.abs(first)) * 100 : 0;
    return { series, pct };
  }, [expenses, netWorth]);

  // Spending for the last 7 days
  const week = useMemo(() => {
    const vals: number[] = [];
    const labels: string[] = [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (let i = 6; i >= 0; i--) {
      const d0 = today.getTime() - i * DAY;
      let sum = 0;
      for (const e of expenses) {
        const t = new Date(e.date).getTime();
        if (e.type !== 'credit' && t >= d0 && t < d0 + DAY) sum += Number(e.amount);
      }
      vals.push(sum);
      labels.push(new Date(d0).toLocaleDateString('en-US', { weekday: 'narrow' }));
    }
    return { vals, labels, total: vals.reduce((a, b) => a + b, 0) };
  }, [expenses]);

  const categories = dashboardSummary?.spent_per_expense_category || [];
  const donutSegs = useMemo(() => {
    const list = [...categories].filter((c) => c.spent > 0).sort((a, b) => b.spent - a.spent);
    const total = list.reduce((a, b) => a + b.spent, 0);
    if (!total) return [];
    const top = list.slice(0, 3).map((c, i) => ({ name: c.name, pct: (c.spent / total) * 100, color: DONUT_COLORS[i] }));
    const rest = list.slice(3).reduce((a, b) => a + b.spent, 0);
    if (rest > 0) top.push({ name: 'Others', pct: (rest / total) * 100, color: DONUT_COLORS[3] });
    return top;
  }, [categories]);

  const openAdd = (t: 'debit' | 'credit') => { setModalType(t); setModalVisible(true); };
  const heroW = width - 40 - 40;

  const stat = (icon, label, value, color, sub) => (
    <Card style={styles.tile} pad={14}>
      <IconBox name={icon} color={color} size={34} />
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={styles.tileValue}>{money(value)}</Text>
      {sub ? <Text style={styles.tileSub}>{sub}</Text> : null}
    </Card>
  );

  return (
    <>
      <Screen>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.name}>{profileName || 'Abdul Hadi'}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={styles.headBtn} onPress={() => setSavingsModalVisible(true)}>
              <Ionicons name="sparkles-outline" size={20} color={C.amber} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/profile')}>
              <LinearGradient colors={['#67E8F9', '#0E7490']} style={styles.avatar}>
                <Text style={{ color: C.onAcc, fontWeight: '800', fontSize: 16 }}>{(profileName || 'A').charAt(0).toUpperCase()}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <MonthBar label={formatMonthDisplay(currentMonth)} onPrev={handlePrevMonth} onNext={handleNextMonth} />

        {/* NET WORTH */}
        <Hero style={{ marginTop: 14, paddingBottom: 14 }}>
          <View style={styles.rowSp}>
            <Label style={{ color: '#a5f3fc' }}>Net worth</Label>
            <Tag color={trend.pct >= 0 ? C.acc : C.rose} label={`${trend.pct >= 0 ? '+' : ''}${trend.pct.toFixed(1)}% · 24d`} />
          </View>
          <Text style={styles.netWorth}>{money(netWorth)}</Text>
          <View style={{ marginTop: 6, marginHorizontal: -2 }}>
            <Sparkline data={trend.series} width={heroW} height={52} color={trend.pct >= 0 ? C.acc : C.rose} />
          </View>
          <View style={styles.heroStats}>
            <View><Label>Bank</Label><Text style={styles.heroStat}>{num(totalBalance)}</Text></View>
            <View><Label>Savings</Label><Text style={styles.heroStat}>{num(savings)}</Text></View>
            <View style={{ alignItems: 'flex-end' }}><Label>Overspend</Label><Text style={[styles.heroStat, { color: C.rose }]}>{num(totalOverspend)}</Text></View>
          </View>
        </Hero>

        {/* QUICK ACTIONS */}
        <View style={styles.quick}>
          {[
            { icon: 'arrow-up-outline', label: 'Expense', color: C.rose, onPress: () => openAdd('debit') },
            { icon: 'arrow-down-outline', label: 'Income', color: C.acc, onPress: () => openAdd('credit') },
            { icon: 'people-outline', label: 'Lend', color: C.blue, onPress: () => router.push('/payables' as any) },
            { icon: 'cash-outline', label: 'Payday', color: C.amber, onPress: () => router.push('/payday') },
          ].map((q) => (
            <TouchableOpacity key={q.label} style={{ alignItems: 'center', flex: 1 }} onPress={q.onPress} activeOpacity={0.8}>
              <IconBox name={q.icon as any} color={q.color} size={52} />
              <Text style={styles.quickLabel}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* LAST 7 DAYS */}
        <Card pad={14} style={{ marginTop: 12 }}>
          <View style={styles.rowSp}>
            <View>
              <Label>Spending · last 7 days</Label>
              <Text style={styles.cardValue}>{money(week.total)}</Text>
            </View>
          </View>
          <View style={{ marginTop: 8 }}>
            <BarChart values={week.vals} labels={week.labels} highlight={6} height={54} />
          </View>
        </Card>

        {/* BUDGET RING */}
        <Card style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Ring pct={usedPct} size={100} thick={9} color={usedPct > 100 ? C.rose : C.acc}>
            <Text style={styles.ringNum}>{usedPct}%</Text>
            <Text style={styles.ringSub}>USED</Text>
          </Ring>
          <View style={{ flex: 1, gap: 8 }}>
            <Label>Monthly budget</Label>
            <Text style={styles.cardValue}>{money(income)}</Text>
            <View style={styles.rowSp}>
              <Text style={styles.mute12}>Spent <Text style={{ color: C.rose, fontWeight: '700' }}>{num(spent)}</Text></Text>
              <Text style={styles.mute12}>Left <Text style={{ color: remaining < 0 ? C.rose : C.acc, fontWeight: '700' }}>{num(remaining)}</Text></Text>
            </View>
            <Bar pct={usedPct} color={usedPct > 100 ? C.rose : C.acc} />
          </View>
        </Card>

        {/* TILES */}
        <View style={styles.grid}>
          {stat('arrow-down-outline', 'Income this month', incomeThisMonth, C.acc, null)}
          {stat('cash-outline', 'Remaining', remaining, remaining < 0 ? C.rose : C.acc, income > 0 ? `${Math.max(0, 100 - usedPct)}% of budget` : null)}
          {stat('wallet-outline', 'Total savings', savings, C.amber, savingsTarget > 0 ? `of ${money(savingsTarget)} target` : null)}
          {stat('trending-up-outline', 'Owed to me', owedToMe, C.blue, owedPeople > 0 ? `${owedPeople} ${owedPeople === 1 ? 'person' : 'people'}` : null)}
          {stat('trending-down-outline', 'I owe', iOwe, C.rose, iOwe === 0 ? 'All settled' : `${owePeople} ${owePeople === 1 ? 'person' : 'people'}`)}
          {stat('flag-outline', 'Savings target', savingsTarget, C.violet, savingsTarget > 0 ? `${Math.round((savings / savingsTarget) * 100)}% reached` : null)}
        </View>

        {/* DONUT */}
        {donutSegs.length > 0 && (
          <Card style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <Donut segs={donutSegs} size={108} thick={15}>
              <Text style={styles.donutNum}>{num(Math.round(spent / 100) / 10)}k</Text>
              <Text style={styles.ringSub}>SPENT</Text>
            </Donut>
            <View style={{ flex: 1, gap: 8 }}>
              {donutSegs.map((s) => (
                <View key={s.name} style={styles.rowSp}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    <View style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: s.color }} />
                    <Text style={{ color: C.text, fontSize: 12.5 }} numberOfLines={1}>{s.name}</Text>
                  </View>
                  <Text style={{ color: C.text, fontWeight: '700', fontSize: 12.5 }}>{Math.round(s.pct)}%</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* BANK ACCOUNTS */}
        {bankAccounts.length > 0 && (
          <>
            <SectionRow title="Bank accounts" action="Overview" onAction={() => router.push('/bank-comparison')} />
            <Card pad={2} style={{ paddingHorizontal: 16 }}>
              {bankAccounts.map((b, idx) => (
                <TouchableOpacity key={b.id} activeOpacity={0.8} style={[styles.brow, idx === 0 && { borderTopWidth: 0 }, { flexDirection: 'row', alignItems: 'center', gap: 12 }]} onPress={() => router.push(`/bank-summary?id=${b.id}`)}>
                  <IconBox name="business-outline" color={[C.blue, C.acc, C.amber][idx % 3]} size={34} />
                  <Text style={[styles.progressName, { flex: 1 }]}>{b.name}</Text>
                  <Text style={[styles.progressName, { color: b.balance < 0 ? C.rose : C.text }]}>{money(b.balance)}</Text>
                </TouchableOpacity>
              ))}
            </Card>
          </>
        )}

        {/* BUDGET PROGRESS */}
        {categories.length > 0 && (
          <>
            <SectionRow title="Budget progress" action="Manage" onAction={() => router.push('/manage')} />
            <Card pad={4} style={{ paddingHorizontal: 16 }}>
              {categories.map((sub, idx) => {
                let perc = 0;
                if (sub.effective_budget > 0) perc = Math.min((sub.spent / sub.effective_budget) * 100, 100);
                else if (sub.effective_budget < 0 || sub.spent > 0) perc = 100;
                const isOver = sub.remaining < 0;
                const col = isOver ? C.rose : perc > 80 ? C.amber : C.acc;
                return (
                  <View key={idx} style={[styles.brow, idx === 0 && { borderTopWidth: 0 }]}>
                    <View style={styles.rowSp}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                        <IconBox name={categoryIcon(sub.name) as any} color={col} size={34} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.progressName}>{sub.name}</Text>
                          <Text style={styles.progressAmounts}>{money(sub.spent)} of {money(sub.assigned_budget)}{sub.effective_budget !== sub.assigned_budget ? ` · effective ${money(sub.effective_budget)}` : ''}</Text>
                        </View>
                      </View>
                      <Tag color={col} label={isOver ? `Over by ${num(Math.abs(sub.remaining))}` : `${num(sub.remaining)} left`} />
                    </View>
                    <View style={{ marginTop: 8 }}><Bar pct={perc} color={col} /></View>
                  </View>
                );
              })}
            </Card>
          </>
        )}

        {/* SAVINGS GOALS */}
        {dashboardSummary?.savings_progress && dashboardSummary.savings_progress.length > 0 && (
          <>
            <SectionRow title="Savings goals" action="See all" onAction={() => router.push('/savings')} />
            <Card pad={4} style={{ paddingHorizontal: 16 }}>
              {dashboardSummary.savings_progress.map((sub, idx) => {
                const val = sub.total_value !== undefined ? sub.total_value : sub.current_saved;
                const perc = Math.min((val / (sub.target_amount || 1)) * 100, 100);
                return (
                  <View key={idx} style={[styles.brow, idx === 0 && { borderTopWidth: 0 }]}>
                    <View style={styles.rowSp}>
                      <View>
                        <Text style={styles.progressName}>{sub.name}</Text>
                        <Text style={styles.progressAmounts}>{money(val)} / {money(sub.target_amount)}</Text>
                      </View>
                      {sub.lent_out > 0 && (
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ color: C.blue, fontSize: 10.5, fontWeight: '600' }}>Lent out</Text>
                          <Text style={{ color: C.blue, fontSize: 13, fontWeight: '700' }}>{money(sub.lent_out)}</Text>
                        </View>
                      )}
                    </View>
                    <View style={{ marginTop: 8 }}><Bar pct={perc} color={C.amber} /></View>
                  </View>
                );
              })}
            </Card>
          </>
        )}

        {/* RECENT */}
        <SectionRow title="Recent activity" action="See all" onAction={() => router.push('/transactions')} />
        {expenses.length === 0 ? (
          <Card>
            <EmptyState icon="list-outline" title="No recent transactions" sub="Your latest activity will show up here." />
          </Card>
        ) : (
          <Card pad={2} style={{ paddingHorizontal: 16 }}>
            {expenses.slice(0, 5).map((expense, idx) => (
              <View key={expense.id} style={[styles.tx, idx === 0 && { borderTopWidth: 0 }]}>
                <IconBox name={categoryIcon(expense.category) as any} color={expense.type === 'credit' ? C.acc : C.rose} size={42} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.tTitle}>{expense.reason || expense.category}</Text>
                  <Text style={styles.tDate}>{expense.category ? `${expense.category} · ` : ''}{new Date(expense.date).toLocaleDateString()}</Text>
                </View>
                <Text style={[styles.tAmount, { color: expense.type === 'credit' ? C.acc : C.rose }]}>
                  {expense.type === 'credit' ? '+ ' : '- '}{money(expense.amount, true)}
                </Text>
              </View>
            ))}
          </Card>
        )}
      </Screen>

      <AddTransactionModal visible={modalVisible} onClose={() => setModalVisible(false)} initialType={modalType} />
      <AddTransactionModal visible={savingsModalVisible} onClose={() => setSavingsModalVisible(false)} isSavingsMode={true} />
    </>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  greeting: { color: C.mute, fontSize: 13 },
  name: { color: C.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.5, marginTop: 2 },
  headBtn: { width: 42, height: 42, borderRadius: 15, backgroundColor: C.s2, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  rowSp: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  netWorth: { color: C.text, fontSize: 38, fontWeight: '800', letterSpacing: -1.2, marginTop: 6 },
  heroStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.09)' },
  heroStat: { color: C.text, fontSize: 14, fontWeight: '700', marginTop: 4 },
  quick: { flexDirection: 'row', marginTop: 14, gap: 10 },
  quickLabel: { color: C.mute, fontSize: 11.5, fontWeight: '700', marginTop: 7 },
  cardValue: { color: C.text, fontSize: 21, fontWeight: '800', letterSpacing: -0.4, marginTop: 3 },
  ringNum: { color: C.text, fontSize: 21, fontWeight: '800' },
  ringSub: { color: C.dim, fontSize: 10, fontWeight: '700' },
  donutNum: { color: C.text, fontSize: 16, fontWeight: '800' },
  mute12: { color: C.mute, fontSize: 12.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  tile: { width: '48.4%' },
  tileLabel: { color: C.mute, fontSize: 12, marginTop: 10 },
  tileValue: { color: C.text, fontSize: 18, fontWeight: '800', marginTop: 2, letterSpacing: -0.3 },
  tileSub: { color: C.dim, fontSize: 11, marginTop: 4 },
  brow: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.line },
  progressName: { color: C.text, fontSize: 14.5, fontWeight: '700' },
  progressAmounts: { color: C.dim, fontSize: 12, marginTop: 2 },
  tx: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.line },
  tTitle: { color: C.text, fontSize: 15, fontWeight: '700' },
  tDate: { color: C.dim, fontSize: 12, marginTop: 2 },
  tAmount: { fontSize: 15, fontWeight: '800' },
});

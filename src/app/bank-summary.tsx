import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStore } from '../store/useStore';
import { Screen, Header, Card, Hero, IconBox, MonthBar, Label, Bar, SectionRow } from '../ui/kit';
import { C, money, categoryIcon } from '../ui/theme';

export default function BankSummaryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const fetchBankSummary = useStore(state => state.fetchBankSummary);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const data = await fetchBankSummary(id, month);
      setSummary(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSummary();
  }, [id, month]);

  const shift = (delta: number) => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, (m || 1) - 1 + delta, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };
  const monthLabel = (() => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, (m || 1) - 1, 1);
    return isNaN(d.getTime()) ? month : d.toLocaleString('default', { month: 'long', year: 'numeric' });
  })();

  if (loading && !summary) {
    return (
      <Screen scroll={false}>
        <Header title="Bank summary" onBack={() => router.back()} />
        <View style={styles.center}><ActivityIndicator size="large" color={C.acc} /></View>
      </Screen>
    );
  }

  if (!summary) {
    return (
      <Screen scroll={false}>
        <Header title="Bank summary" onBack={() => router.back()} />
        <View style={styles.center}>
          <IconBox name="information-circle-outline" color={C.rose} size={84} />
          <Text style={styles.errTitle}>Failed to load summary</Text>
        </View>
      </Screen>
    );
  }

  const expense = summary.category_breakdown?.expense || [];
  const incomeCats = summary.category_breakdown?.income || [];
  const maxExp = Math.max(...expense.map(c => Number(c.spent_this_month) || 0), 1);
  const maxInc = Math.max(...incomeCats.map(c => Number(c.received_this_month) || 0), 1);
  const bal = summary.bank.available_balance !== undefined ? summary.bank.available_balance : summary.bank.balance || 0;

  const miniStat = (icon, label, value, color) => (
    <View style={styles.mini}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Ionicons name={icon} size={13} color={color} />
        <Text style={{ color: C.dim, fontSize: 11 }}>{label}</Text>
      </View>
      <Text style={{ color, fontWeight: '700', fontSize: 13.5, marginTop: 4 }}>{value}</Text>
    </View>
  );

  return (
    <Screen>
      <Header title={`${summary.bank.name} summary`} onBack={() => router.back()} />
      <MonthBar label={monthLabel} onPrev={() => shift(-1)} onNext={() => shift(1)} />

      <Hero style={{ marginTop: 12 }}>
        <Label style={{ color: '#a5f3fc' }}>Available balance</Label>
        <Text style={[styles.bal, { color: bal >= 0 ? C.text : C.rose }]}>{money(bal)}</Text>
        {summary.bank.balance !== undefined && summary.bank.available_balance !== undefined && summary.bank.balance !== summary.bank.available_balance && (
          <Text style={{ color: C.dim, fontSize: 12, marginTop: 4 }}>Current balance: {money(summary.bank.balance)}</Text>
        )}
        {summary.bank.overspend_this_month > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, backgroundColor: 'rgba(251,113,133,0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start' }}>
            <Ionicons name="warning-outline" size={14} color="#FCA5A5" />
            <Text style={{ color: '#FCA5A5', fontSize: 12, fontWeight: '600' }}>{money(summary.bank.overspend_this_month)} overspent</Text>
          </View>
        )}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          {miniStat('arrow-down', 'Credited', `+${money(summary.this_month.total_credited)}`, C.acc)}
          {miniStat('arrow-up', 'Debited', `-${money(summary.this_month.total_debited)}`, C.rose)}
          {miniStat('swap-vertical', 'Net change', `${summary.this_month.net > 0 ? '+' : ''}${money(summary.this_month.net)}`, summary.this_month.net >= 0 ? C.blue : C.rose)}
        </View>
      </Hero>

      {expense.length > 0 && (
        <>
          <SectionRow title="Expenses (this month)" />
          <View style={{ gap: 10 }}>
            {expense.map(cat => (
              <Card key={cat.sub_category_id} pad={14}>
                <View style={styles.rowSp}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <IconBox name={categoryIcon(cat.name) as any} color={C.acc} size={34} />
                    <Text style={styles.name}>{cat.name}</Text>
                  </View>
                  <Text style={styles.amt}>{money(cat.spent_this_month)}</Text>
                </View>
                <View style={{ marginTop: 10 }}><Bar pct={(Number(cat.spent_this_month) / maxExp) * 100} color={C.acc} /></View>
              </Card>
            ))}
          </View>
        </>
      )}

      {incomeCats.length > 0 && (
        <>
          <SectionRow title="Income (this month)" />
          <View style={{ gap: 10 }}>
            {incomeCats.map(cat => (
              <Card key={cat.sub_category_id} pad={14}>
                <View style={styles.rowSp}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <IconBox name="arrow-down-outline" color={C.acc} size={34} />
                    <Text style={styles.name}>{cat.name}</Text>
                  </View>
                  <Text style={[styles.amt, { color: C.acc }]}>{money(cat.received_this_month)}</Text>
                </View>
                <View style={{ marginTop: 10 }}><Bar pct={(Number(cat.received_this_month) / maxInc) * 100} color={C.acc} /></View>
              </Card>
            ))}
          </View>
        </>
      )}

      {summary.top_transactions?.largest_debits?.length > 0 && (
        <>
          <SectionRow title="Largest debits" />
          <Card pad={2} style={{ paddingHorizontal: 16 }}>
            {summary.top_transactions.largest_debits.map((tx, i) => (
              <View key={tx.id} style={[styles.tx, i === 0 && { borderTopWidth: 0 }]}>
                <IconBox name="arrow-up-outline" color={C.rose} size={34} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{tx.reason}</Text>
                  <Text style={styles.date}>{new Date(tx.date).toLocaleDateString()}</Text>
                </View>
                <Text style={[styles.amt, { color: C.rose }]}>-{money(tx.amount)}</Text>
              </View>
            ))}
          </Card>
        </>
      )}

      {summary.top_transactions?.largest_credits?.length > 0 && (
        <>
          <SectionRow title="Largest credits" />
          <Card pad={2} style={{ paddingHorizontal: 16 }}>
            {summary.top_transactions.largest_credits.map((tx, i) => (
              <View key={tx.id} style={[styles.tx, i === 0 && { borderTopWidth: 0 }]}>
                <IconBox name="arrow-down-outline" color={C.acc} size={34} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{tx.reason}</Text>
                  <Text style={styles.date}>{new Date(tx.date).toLocaleDateString()}</Text>
                </View>
                <Text style={[styles.amt, { color: C.acc }]}>+{money(tx.amount)}</Text>
              </View>
            ))}
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', paddingTop: 120 },
  errTitle: { color: C.text, fontSize: 20, fontWeight: '700', marginTop: 20 },
  bal: { fontSize: 36, fontWeight: '800', letterSpacing: -1, marginTop: 6 },
  mini: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 16, padding: 10 },
  rowSp: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { color: C.text, fontSize: 14.5, fontWeight: '700' },
  date: { color: C.dim, fontSize: 12, marginTop: 2 },
  amt: { color: C.text, fontSize: 14, fontWeight: '700' },
  tx: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.line },
});

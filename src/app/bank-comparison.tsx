import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../store/useStore';
import { Screen, Header, Card, IconBox, MonthBar, Label, PrimaryButton, Tag, Sparkline } from '../ui/kit';
import { C, alpha, money } from '../ui/theme';

const BANK_COLORS = [C.amber, C.acc, C.blue, C.violet];

export default function BankComparisonScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [comparison, setComparison] = useState<any>(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const fetchBankComparison = useStore(state => state.fetchBankComparison);

  const loadComparison = async () => {
    setLoading(true);
    try {
      const data = await fetchBankComparison(month);
      setComparison(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadComparison();
  }, [month]);

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

  return (
    <Screen>
      <Header title="Bank overview" />
      <MonthBar label={monthLabel} onPrev={() => shift(-1)} onNext={() => shift(1)} />

      {loading && !comparison ? (
        <View style={styles.center}><ActivityIndicator size="large" color={C.acc} /></View>
      ) : !comparison ? (
        <View style={styles.center}>
          <IconBox name="information-circle-outline" color={C.rose} size={84} />
          <Text style={styles.errTitle}>Failed to load bank data</Text>
          <Text style={styles.errSub}>Check your connection and try again.</Text>
          <PrimaryButton title="Retry" icon="refresh" onPress={loadComparison} small style={{ marginTop: 20, minWidth: 140 }} />
        </View>
      ) : (
        <>
          {comparison.verification_note ? (
            <View style={styles.note}>
              <Ionicons name="information-circle-outline" size={18} color={C.blue} />
              <Text style={styles.noteText}>{comparison.verification_note}</Text>
            </View>
          ) : null}

          {comparison.summary && (
            <Card pad={14} style={{ marginTop: 12 }}>
              <Label>All Banks Summary</Label>
              <View style={[styles.rowSp, { marginTop: 12 }]}>
                <View>
                  <Text style={styles.sub12}>Total Balance</Text>
                  <Text style={styles.statValue}>{money(comparison.summary.total_balance)}</Text>
                </View>
                <View>
                  <Text style={styles.sub12}>Available</Text>
                  <Text style={[styles.statValue, { color: C.acc }]}>{money(comparison.summary.total_available_balance)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.sub12}>Overspend</Text>
                  <Text style={[styles.statValue, { color: C.rose }]}>{money(comparison.summary.total_overspend)}</Text>
                </View>
              </View>
            </Card>
          )}

          <View style={{ gap: 12, marginTop: 12 }}>
            {comparison.banks.map((bank, index) => {
              const balance = bank.available_balance !== undefined ? bank.available_balance : (bank.balance !== undefined ? bank.balance : bank.current_balance);
              const inn = Number(bank.credited_this_month || 0);
              const out = Number(bank.debited_this_month || 0);
              const col = BANK_COLORS[index % BANK_COLORS.length];
              return (
                <TouchableOpacity key={bank.id} activeOpacity={0.9} onPress={() => router.push(`/bank-summary?id=${bank.id}`)}>
                  <Card>
                    <View style={styles.rowSp}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                        <IconBox name="business-outline" color={col} size={42} />
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.bankName}>{bank.name}</Text>
                            {bank.health === 'overspent' && <Tag label="Overspent" color={C.rose} />}
                            {bank.health === 'at risk' && <Tag label="At risk" color={C.amber} />}
                          </View>
                          <Text style={styles.sub12}>Opening {money(bank.calculated_opening_balance || 0)}</Text>
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.bal, { color: balance >= 0 ? C.text : C.rose }]}>{money(balance)}</Text>
                        <Label style={{ fontSize: 9.5 }}>Available balance</Label>
                        {bank.current_balance !== undefined && bank.current_balance !== balance && (
                          <Text style={{ color: C.dim, fontSize: 10, marginTop: 2 }}>Actual {money(bank.current_balance)}</Text>
                        )}
                      </View>
                    </View>

                    <View style={styles.balRow}>
                      {bank.is_balanced === false || (bank.drift !== undefined && Number(bank.drift) !== 0)
                        ? <Tag label={`Drift ${money(bank.drift)}`} color={C.rose} />
                        : <Tag label="Balanced" color={C.acc} />}
                      {bank.expected_balance !== undefined && Number(bank.drift) !== 0 ? <Text style={styles.sub12}>Expected {money(bank.expected_balance)}</Text> : null}
                    </View>

                    {bank.monthly_trend?.length > 1 && (
                      <View style={{ marginTop: 12 }}>
                        <Label>Net flow trend</Label>
                        <View style={{ marginTop: 4, marginLeft: -2 }}>
                          <Sparkline data={bank.monthly_trend.map((m) => Number(m.net) || 0)} width={width - 40 - 34} height={44} color={col} />
                        </View>
                        <View style={styles.rowSp}>
                          <Text style={styles.sub12}>{bank.monthly_trend[0].month}</Text>
                          <Text style={styles.sub12}>{bank.monthly_trend[bank.monthly_trend.length - 1].month}</Text>
                        </View>
                      </View>
                    )}

                    {bank.overspend_this_month > 0 && (
                      <View style={styles.over}>
                        <Ionicons name="warning-outline" size={14} color="#FCA5A5" />
                        <Text style={{ color: '#FCA5A5', fontSize: 12, fontWeight: '600' }}>
                          Overspent {money(bank.overspend_this_month)} {bank.overspend_percentage ? `(${bank.overspend_percentage}%)` : ''}
                        </Text>
                      </View>
                    )}

                    <View style={styles.stack}>
                      <View style={{ flex: inn || 0.0001, backgroundColor: C.acc }} />
                      <View style={{ flex: out || 0.0001, backgroundColor: C.rose }} />
                    </View>

                    <View style={styles.stats}>
                      <View><Text style={styles.statLabel}>Money in</Text><Text style={[styles.statValue, { color: C.acc }]}>+{money(inn)}</Text></View>
                      <View><Text style={styles.statLabel}>Money out</Text><Text style={[styles.statValue, { color: C.rose }]}>{money(out)}</Text></View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.statLabel}>Net flow</Text>
                        <Text style={[styles.statValue, { color: bank.net_this_month >= 0 ? C.blue : C.rose }]}>{bank.net_this_month >= 0 ? '+' : ''}{money(bank.net_this_month)}</Text>
                        {bank.net_change_vs_last_month !== undefined && (
                          <Text style={{ color: C.dim, fontSize: 10, marginTop: 2 }}>{bank.net_change_vs_last_month >= 0 ? '+' : ''}{money(bank.net_change_vs_last_month)} vs last</Text>
                        )}
                      </View>
                    </View>

                    {bank.category_spend?.length > 0 && (
                      <View style={{ marginTop: 12 }}>
                        <Label>Top spends</Label>
                        {bank.category_spend.slice(0, 3).map((spend, idx) => (
                          <View key={idx} style={styles.listRow}>
                            <View>
                              <Text style={styles.listName}>{spend.name}</Text>
                              {spend.pct_of_total !== undefined && <Text style={{ color: C.dim, fontSize: 10, marginTop: 2 }}>{spend.pct_of_total}% of total</Text>}
                            </View>
                            <Text style={[styles.listAmt, { color: C.rose }]}>{money(spend.spent)}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {bank.category_income?.length > 0 && (
                      <View style={{ marginTop: 12 }}>
                        <Label>Top incomes</Label>
                        {bank.category_income.slice(0, 2).map((income, idx) => (
                          <View key={idx} style={styles.listRow}>
                            <Text style={styles.listName}>{income.name}</Text>
                            <Text style={[styles.listAmt, { color: C.acc }]}>+{money(income.received)}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  errTitle: { color: C.text, fontSize: 21, fontWeight: '700', marginTop: 20 },
  errSub: { color: C.mute, fontSize: 14, marginTop: 8 },
  note: { flexDirection: 'row', gap: 10, backgroundColor: alpha(C.blue, 0.08), borderWidth: 1, borderColor: alpha(C.blue, 0.2), borderRadius: 16, padding: 12, marginTop: 12, alignItems: 'flex-start' },
  noteText: { color: '#bfdbfe', fontSize: 12.5, lineHeight: 18, flex: 1 },
  rowSp: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bankName: { color: C.text, fontSize: 16, fontWeight: '700' },
  sub12: { color: C.dim, fontSize: 12, marginTop: 2 },
  bal: { fontSize: 19, fontWeight: '800', letterSpacing: -0.4 },
  balRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  over: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: 'rgba(251,113,133,0.1)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  stack: { flexDirection: 'row', height: 7, borderRadius: 9, overflow: 'hidden', gap: 3, marginTop: 16 },
  stats: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.22)', borderRadius: 16, padding: 12, marginTop: 10 },
  statLabel: { color: C.dim, fontSize: 11 },
  statValue: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  listRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.line },
  listName: { color: C.mute, fontSize: 13 },
  listAmt: { fontSize: 13, fontWeight: '700' },
});

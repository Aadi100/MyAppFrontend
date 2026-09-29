import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStore } from '../store/useStore';

export default function BankSummaryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const fetchBankSummary = useStore(state => state.fetchBankSummary);

  useEffect(() => {
    if (!id) return;
    loadSummary();
  }, [id, month]);

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

  const fmt = (num) => `Rs ${(num || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (loading && !summary) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4ADE80" />
      </View>
    );
  }

  if (!summary) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#fff' }}>Failed to load summary</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>{summary.bank.name} Summary</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={() => {
            const d = new Date(`${month}-01`); d.setMonth(d.getMonth() - 1); setMonth(d.toISOString().slice(0, 7));
          }} style={styles.monthBtn}><Ionicons name="chevron-back" size={20} color="#8A8A9E" /></TouchableOpacity>
          <Text style={styles.monthText}>{new Date(`${month}-01`).toLocaleString('default', { month: 'long', year: 'numeric' })}</Text>
          <TouchableOpacity onPress={() => {
            const d = new Date(`${month}-01`); d.setMonth(d.getMonth() + 1); setMonth(d.toISOString().slice(0, 7));
          }} style={styles.monthBtn}><Ionicons name="chevron-forward" size={20} color="#8A8A9E" /></TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Current Balance</Text>
          <Text style={styles.balanceAmount}>{fmt(summary.bank.balance)}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>This Month</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Credited</Text>
            <Text style={[styles.statValue, { color: '#4ADE80' }]}>+{fmt(summary.this_month.total_credited)}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Debited</Text>
            <Text style={[styles.statValue, { color: '#F87171' }]}>-{fmt(summary.this_month.total_debited)}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Net Change</Text>
            <Text style={[styles.statValue, { color: summary.this_month.net >= 0 ? '#4ADE80' : '#F87171' }]}>
              {summary.this_month.net > 0 ? '+' : ''}{fmt(summary.this_month.net)}
            </Text>
          </View>
        </View>

        {summary.category_breakdown?.expense?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Expenses (This Month)</Text>
            {summary.category_breakdown.expense.map(cat => (
              <View key={cat.sub_category_id} style={styles.statRow}>
                <Text style={styles.statLabel}>{cat.name}</Text>
                <Text style={styles.statValue}>{fmt(cat.spent_this_month)}</Text>
              </View>
            ))}
          </View>
        )}

        {summary.category_breakdown?.income?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Income (This Month)</Text>
            {summary.category_breakdown.income.map(cat => (
              <View key={cat.sub_category_id} style={styles.statRow}>
                <Text style={styles.statLabel}>{cat.name}</Text>
                <Text style={styles.statValue}>{fmt(cat.received_this_month)}</Text>
              </View>
            ))}
          </View>
        )}

        {summary.top_transactions?.largest_debits?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Largest Debits</Text>
            {summary.top_transactions.largest_debits.map(tx => (
              <View key={tx.id} style={styles.statRow}>
                <View>
                  <Text style={styles.statLabel}>{tx.reason}</Text>
                  <Text style={{color: '#8A8A9E', fontSize: 12}}>{new Date(tx.date).toLocaleDateString()}</Text>
                </View>
                <Text style={[styles.statValue, { color: '#F87171' }]}>-{fmt(tx.amount)}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{height: 40}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B14', padding: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 20 },
  backBtn: { backgroundColor: '#1E1E2D', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  monthSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, backgroundColor: '#1E1E2D', padding: 12, borderRadius: 16 },
  monthBtn: { padding: 8 },
  monthText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  card: { backgroundColor: '#1E1E2D', borderRadius: 20, padding: 20, marginBottom: 16 },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  balanceAmount: { color: '#4ADE80', fontSize: 32, fontWeight: 'bold' },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  statLabel: { color: '#fff', fontSize: 16 },
  statValue: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

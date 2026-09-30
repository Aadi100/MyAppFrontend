import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../store/useStore';

export default function BankComparisonScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [comparison, setComparison] = useState(null);
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

  const fmt = (num) => `Rs ${(num || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Bank Comparison</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={() => {
          const [y, m] = month.split('-').map(Number);
          const d = new Date(y, (m || 1) - 2, 1);
          setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        }} style={styles.monthBtn}><Ionicons name="chevron-back" size={20} color="#8A8A9E" /></TouchableOpacity>
        <Text style={styles.monthText}>
          {(() => {
            const [y, m] = month.split('-').map(Number);
            const d = new Date(y, (m || 1) - 1, 1);
            return isNaN(d.getTime()) ? month : d.toLocaleString('default', { month: 'long', year: 'numeric' });
          })()}
        </Text>
        <TouchableOpacity onPress={() => {
          const [y, m] = month.split('-').map(Number);
          const d = new Date(y, m || 1, 1);
          setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        }} style={styles.monthBtn}><Ionicons name="chevron-forward" size={20} color="#8A8A9E" /></TouchableOpacity>
      </View>

      {loading && !comparison ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#4ADE80" />
        </View>
      ) : !comparison ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#fff' }}>Failed to load comparison</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {comparison.banks.map(bank => (
            <TouchableOpacity 
              key={bank.id} 
              style={styles.card}
              onPress={() => router.push(`/bank-summary?id=${bank.id}`)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.bankName}>{bank.name}</Text>
                <Text style={[styles.bankBalance, { color: bank.balance >= 0 ? '#4ADE80' : '#F87171' }]}>
                  {fmt(bank.balance)}
                </Text>
              </View>
              
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Credited ({month})</Text>
                  <Text style={[styles.statValue, { color: '#4ADE80' }]}>+{fmt(bank.credited_this_month)}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Debited ({month})</Text>
                  <Text style={[styles.statValue, { color: '#F87171' }]}>-{fmt(bank.debited_this_month)}</Text>
                </View>
              </View>

              {bank.category_spend?.length > 0 && (
                <View style={styles.spendSection}>
                  <Text style={styles.spendTitle}>Top Spend Categories</Text>
                  {bank.category_spend.slice(0, 3).map((spend, idx) => (
                    <View key={idx} style={styles.spendRow}>
                      <Text style={styles.spendName}>{spend.name}</Text>
                      <Text style={styles.spendAmount}>{fmt(spend.spent)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          ))}
          <View style={{height: 40}} />
        </ScrollView>
      )}
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  bankName: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  bankBalance: { fontSize: 20, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  statBox: { flex: 1, backgroundColor: '#12121D', padding: 12, borderRadius: 12, marginRight: 8 },
  statLabel: { color: '#8A8A9E', fontSize: 12, marginBottom: 4 },
  statValue: { fontSize: 14, fontWeight: 'bold' },
  spendSection: { marginTop: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  spendTitle: { color: '#8A8A9E', fontSize: 12, fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase' },
  spendRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  spendName: { color: '#fff', fontSize: 14 },
  spendAmount: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});

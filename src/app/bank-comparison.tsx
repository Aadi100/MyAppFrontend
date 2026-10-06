import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../store/useStore';
import { LinearGradient } from 'expo-linear-gradient';

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
    loadComparison();
  }, [month]);

  const fmt = (num) => `Rs ${(num || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.title}>Bank Overview</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={() => {
          const [y, m] = month.split('-').map(Number);
          const d = new Date(y, (m || 1) - 2, 1);
          setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        }} style={styles.monthBtn}>
          <Ionicons name="chevron-back" size={20} color="#8A8A9E" />
        </TouchableOpacity>
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
        }} style={styles.monthBtn}>
          <Ionicons name="chevron-forward" size={20} color="#8A8A9E" />
        </TouchableOpacity>
      </View>

      {loading && !comparison ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4ADE80" />
        </View>
      ) : !comparison ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Failed to load bank data</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {comparison.verification_note && (
            <View style={styles.verificationNoteContainer}>
              <Ionicons name="information-circle" size={20} color="#60A5FA" style={{ marginRight: 10 }} />
              <Text style={styles.verificationNoteText}>{comparison.verification_note}</Text>
            </View>
          )}

          {comparison.banks.map((bank, index) => (
            <TouchableOpacity 
              key={bank.id} 
              activeOpacity={0.9}
              onPress={() => router.push(`/bank-summary?id=${bank.id}`)}
            >
              <LinearGradient 
                colors={['#1E293B', '#0F172A']} 
                start={{x: 0, y: 0}} 
                end={{x: 1, y: 1}} 
                style={styles.card}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.bankNameWrapper}>
                    <View style={styles.iconBox}>
                      <Ionicons name="business" size={18} color="#94A3B8" />
                    </View>
                    <View>
                      <Text style={styles.bankName}>{bank.name}</Text>
                      <Text style={styles.openingBalance}>Opening: {fmt(bank.calculated_opening_balance || 0)}</Text>
                    </View>
                  </View>
                  <View style={styles.balanceContainer}>
                    <Text style={[styles.bankBalance, { color: (bank.balance !== undefined ? bank.balance : bank.current_balance) >= 0 ? '#F8FAFC' : '#F87171' }]}>
                      {fmt(bank.balance !== undefined ? bank.balance : bank.current_balance)}
                    </Text>
                    <Text style={styles.balanceLabel}>Current Balance</Text>
                  </View>
                </View>

                {bank.overspend_this_month > 0 && (
                  <View style={styles.overspendWarning}>
                    <Ionicons name="warning" size={14} color="#FCA5A5" style={{marginRight: 6}} />
                    <Text style={styles.overspendText}>Overspent this month: {fmt(bank.overspend_this_month)}</Text>
                  </View>
                )}
                
                <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                    <View style={styles.statIconWrapper}>
                      <Ionicons name="arrow-down-circle" size={16} color="#4ADE80" />
                      <Text style={styles.statLabel}>Money In</Text>
                    </View>
                    <Text style={[styles.statValue, { color: '#4ADE80' }]}>+{fmt(bank.credited_this_month)}</Text>
                  </View>
                  <View style={styles.statBox}>
                    <View style={styles.statIconWrapper}>
                      <Ionicons name="arrow-up-circle" size={16} color="#F87171" />
                      <Text style={styles.statLabel}>Money Out</Text>
                    </View>
                    <Text style={[styles.statValue, { color: '#F87171' }]}>{fmt(bank.debited_this_month)}</Text>
                  </View>
                  <View style={styles.statBox}>
                    <View style={styles.statIconWrapper}>
                      <Ionicons name="swap-vertical" size={16} color="#60A5FA" />
                      <Text style={styles.statLabel}>Net Flow</Text>
                    </View>
                    <Text style={[styles.statValue, { color: bank.net_this_month >= 0 ? '#4ADE80' : '#F87171' }]}>
                      {bank.net_this_month >= 0 ? '+' : ''}{fmt(bank.net_this_month)}
                    </Text>
                  </View>
                </View>

                {(bank.category_spend?.length > 0 || bank.category_income?.length > 0) && (
                  <View style={styles.divider} />
                )}

                {bank.category_spend?.length > 0 && (
                  <View style={styles.spendSection}>
                    <Text style={styles.spendTitle}>Top Spends</Text>
                    {bank.category_spend.slice(0, 3).map((spend, idx) => (
                      <View key={idx} style={styles.spendRow}>
                        <Text style={styles.spendName}>{spend.name}</Text>
                        <Text style={styles.spendAmountExpense}>{fmt(spend.spent)}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {bank.category_income?.length > 0 && (
                  <View style={[styles.spendSection, { marginTop: bank.category_spend?.length ? 16 : 0 }]}>
                    <Text style={styles.spendTitle}>Top Incomes</Text>
                    {bank.category_income.slice(0, 2).map((income, idx) => (
                      <View key={idx} style={styles.spendRow}>
                        <Text style={styles.spendName}>{income.name}</Text>
                        <Text style={styles.spendAmountIncome}>+{fmt(income.received)}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090E' },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 60 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16 },
  backBtn: { backgroundColor: '#13131A', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  title: { color: '#F8FAFC', fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  
  monthSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 24, marginBottom: 24, backgroundColor: '#13131A', borderRadius: 16, padding: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  monthBtn: { padding: 8, backgroundColor: '#1C1C26', borderRadius: 10 },
  monthText: { color: '#F8FAFC', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#94A3B8', fontSize: 16 },

  verificationNoteContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(96, 165, 250, 0.1)', padding: 16, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(96, 165, 250, 0.2)' },
  verificationNoteText: { color: '#93C5FD', fontSize: 13, flex: 1, lineHeight: 20 },
  
  card: { borderRadius: 24, padding: 24, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  bankNameWrapper: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  bankName: { color: '#F8FAFC', fontSize: 18, fontWeight: '700' },
  openingBalance: { color: '#94A3B8', fontSize: 12, marginTop: 4, fontWeight: '500' },
  
  balanceContainer: { alignItems: 'flex-end' },
  bankBalance: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  balanceLabel: { color: '#64748B', fontSize: 11, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' },
  
  overspendWarning: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(248, 113, 113, 0.1)', padding: 12, borderRadius: 12, marginBottom: 20 },
  overspendText: { color: '#FCA5A5', fontSize: 12, fontWeight: '600' },
  
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 16 },
  statBox: { flex: 1, alignItems: 'center' },
  statIconWrapper: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  statLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '600', marginLeft: 4 },
  statValue: { fontSize: 15, fontWeight: '800' },
  
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 20 },
  
  spendSection: {},
  spendTitle: { color: '#94A3B8', fontSize: 11, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  spendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  spendName: { color: '#E2E8F0', fontSize: 14, fontWeight: '500' },
  spendAmountExpense: { color: '#F8FAFC', fontSize: 14, fontWeight: '700' },
  spendAmountIncome: { color: '#4ADE80', fontSize: 14, fontWeight: '700' },
});

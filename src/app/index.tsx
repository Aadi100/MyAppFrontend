import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import AddTransactionModal from '../components/AddTransactionModal';
import { useRouter } from 'expo-router';

export default function Dashboard() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [savingsModalVisible, setSavingsModalVisible] = useState(false);
  const expenses = useStore((state) => state.expenses);
  const fetchData = useStore((state) => state.fetchData);
  const dashboardSummary = useStore((state) => state.dashboardSummary);
  const fetchDashboardSummary = useStore((state) => state.fetchDashboardSummary);

  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));

  const accessToken = useStore(state => state.accessToken);

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
  const totalPosition = dashboardSummary?.total || 0;
  const totalOverspend = dashboardSummary?.total_overspend || 0;
  const income = dashboardSummary?.total_assigned_budget || 0;
  const spent = dashboardSummary?.total_spent_this_month || 0;
  const savings = dashboardSummary?.total_savings_saved || 0;
  const owedToMe = dashboardSummary?.total_owed_to_me || 0;
  const iOwe = dashboardSummary?.total_i_owe || 0;

  // Format currency
  const fmt = (num) => `Rs ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const renderIcon = (categoryName) => {
    switch (categoryName?.toLowerCase()) {
      case 'food': return 'fast-food';
      case 'transport': return 'car';
      case 'utilities': return 'flash';
      case 'entertainment': return 'game-controller';
      default: return 'cash';
    }
  };

  const handlePrevMonth = () => {
    const [y, m] = currentMonth.split('-').map(Number);
    const d = new Date(y, (m || 1) - 2, 1);
    const newY = d.getFullYear();
    const newM = String(d.getMonth() + 1).padStart(2, '0');
    setCurrentMonth(`${newY}-${newM}`);
  };

  const handleNextMonth = () => {
    const [y, m] = currentMonth.split('-').map(Number);
    const d = new Date(y, m || 1, 1);
    const newY = d.getFullYear();
    const newM = String(d.getMonth() + 1).padStart(2, '0');
    setCurrentMonth(`${newY}-${newM}`);
  };

  const formatMonthDisplay = (monthStr) => {
    if (!monthStr) return '';
    const [y, m] = monthStr.split('-').map(Number);
    const d = new Date(y, (m || 1) - 1, 1);
    return isNaN(d.getTime()) ? monthStr : d.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Overview</Text>
            <Text style={styles.name}>{useStore(state => state.profile?.name) || 'Abdul Hadi'}</Text>
          </View>
          <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/profile')}>
            <LinearGradient colors={['rgba(74, 222, 128, 0.2)', 'rgba(16, 185, 129, 0.05)']} style={styles.profileAvatar}>
              <Ionicons name="person" size={20} color="#4ADE80" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* MONTH PICKER */}
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={handlePrevMonth} style={styles.monthBtn}>
            <Ionicons name="chevron-back" size={20} color="#8A8A9E" />
          </TouchableOpacity>
          <Text style={styles.monthText}>
            {formatMonthDisplay(currentMonth)}
          </Text>
          <TouchableOpacity onPress={handleNextMonth} style={styles.monthBtn}>
            <Ionicons name="chevron-forward" size={20} color="#8A8A9E" />
          </TouchableOpacity>
        </View>

        {/* MAIN ASSET CARD */}
        <View style={styles.mainCardWrapper}>
          <LinearGradient colors={['#0F172A', '#1E293B']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.mainCard}>
            <LinearGradient colors={['rgba(74,222,128,0.15)', 'transparent']} start={{x: 0.5, y: 0}} end={{x: 0.5, y: 1}} style={styles.cardGlow} />
            <Text style={styles.mainCardLabel}>Net Worth</Text>
            <Text style={styles.mainCardAmount}>{fmt(netWorth)}</Text>
            
            <View style={styles.mainCardDivider} />
            
            <View style={styles.mainCardStats}>
              <View style={styles.statCol}>
                <Text style={styles.mainCardSubLabel}>Bank Balances</Text>
                <Text style={styles.mainCardSubAmount}>{fmt(totalBalance)}</Text>
              </View>
              <View style={styles.statColCenter}>
                <Text style={styles.mainCardSubLabel}>Savings</Text>
                <Text style={styles.mainCardSubAmount}>{fmt(savings)}</Text>
              </View>
              <View style={styles.statColRight}>
                <Text style={styles.mainCardSubLabel}>Overspend</Text>
                <Text style={[styles.mainCardSubAmount, {color: '#F87171'}]}>{fmt(totalOverspend)}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* GRID DASHBOARD */}
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <View style={[styles.iconBox, {backgroundColor: 'rgba(167, 139, 250, 0.1)'}]}>
              <Ionicons name="pie-chart" size={20} color="#A78BFA" />
            </View>
            <Text style={styles.gridLabel}>Monthly Budget</Text>
            <Text style={styles.gridAmount}>{fmt(income)}</Text>
          </View>
          <View style={styles.gridItem}>
            <View style={[styles.iconBox, {backgroundColor: 'rgba(248, 113, 113, 0.1)'}]}>
              <Ionicons name="cart" size={20} color="#F87171" />
            </View>
            <Text style={styles.gridLabel}>Spent so far</Text>
            <Text style={styles.gridAmount}>{fmt(spent)}</Text>
          </View>
          <View style={styles.gridItem}>
            <View style={[styles.iconBox, {backgroundColor: 'rgba(251, 191, 36, 0.1)'}]}>
              <Ionicons name="wallet" size={20} color="#FBBF24" />
            </View>
            <Text style={styles.gridLabel}>Total Savings</Text>
            <Text style={styles.gridAmount}>{fmt(savings)}</Text>
          </View>
          <View style={styles.gridItem}>
            <View style={[styles.iconBox, {backgroundColor: 'rgba(96, 165, 250, 0.1)'}]}>
              <Ionicons name="trending-up" size={20} color="#60A5FA" />
            </View>
            <Text style={styles.gridLabel}>Owed to Me</Text>
            <Text style={styles.gridAmount}>{fmt(owedToMe)}</Text>
          </View>
          <View style={styles.gridItem}>
            <View style={[styles.iconBox, {backgroundColor: 'rgba(248, 113, 113, 0.1)'}]}>
              <Ionicons name="trending-down" size={20} color="#F87171" />
            </View>
            <Text style={styles.gridLabel}>I Owe</Text>
            <Text style={styles.gridAmount}>{fmt(iOwe)}</Text>
          </View>
          <View style={styles.gridItem}>
            <View style={[styles.iconBox, {backgroundColor: 'rgba(52, 211, 153, 0.1)'}]}>
              <Ionicons name="cash" size={20} color="#34D399" />
            </View>
            <Text style={styles.gridLabel}>Remaining</Text>
            <Text style={styles.gridAmount}>{fmt(income - spent)}</Text>
          </View>
        </View>

        {/* BUDGET PROGRESS */}
        {dashboardSummary?.spent_per_expense_category && dashboardSummary.spent_per_expense_category.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Budget Progress</Text>
            <View style={styles.listCard}>
              {dashboardSummary.spent_per_expense_category.map((sub, idx) => {
                let perc = 0;
                if (sub.effective_budget > 0) {
                  perc = Math.min((sub.spent / sub.effective_budget) * 100, 100);
                } else if (sub.effective_budget < 0 || sub.spent > 0) {
                  perc = 100; // Over budget or in deficit
                } else {
                  perc = 0; // 0 budget, 0 spent
                }
                const isOver = sub.remaining < 0;
                return (
                  <View key={idx} style={[styles.listRow, idx === dashboardSummary.spent_per_expense_category.length - 1 && {borderBottomWidth: 0}]}>
                    <View style={styles.progressHeader}>
                      <View>
                        <Text style={styles.progressName}>{sub.name}</Text>
                        <Text style={styles.progressAmounts}>
                          {fmt(sub.spent)} / {fmt(sub.effective_budget)} 
                          <Text style={{ fontSize: 10, color: '#94A3B8' }}> (Assigned: {fmt(sub.assigned_budget)})</Text>
                        </Text>
                      </View>
                      <View style={{alignItems: 'flex-end'}}>
                        <Text style={[styles.progressStatus, { color: isOver ? '#F87171' : '#4ADE80' }]}>
                          {isOver ? 'Overspent' : 'Remaining'}
                        </Text>
                        <Text style={[styles.progressValue, { color: isOver ? '#F87171' : '#4ADE80' }]}>
                          {fmt(sub.remaining)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${perc}%`, backgroundColor: isOver || perc > 90 ? '#F87171' : '#4ADE80' }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* SAVINGS PROGRESS */}
        {dashboardSummary?.savings_progress && dashboardSummary.savings_progress.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Savings Goals</Text>
            <View style={styles.listCard}>
              {dashboardSummary.savings_progress.map((sub, idx) => {
                const val = sub.total_value !== undefined ? sub.total_value : sub.current_saved;
                const perc = Math.min((val / (sub.target_amount || 1)) * 100, 100);
                return (
                  <View key={idx} style={[styles.listRow, idx === dashboardSummary.savings_progress.length - 1 && {borderBottomWidth: 0}]}>
                    <View style={styles.progressHeader}>
                      <View>
                        <Text style={styles.progressName}>{sub.name}</Text>
                        <Text style={styles.progressAmounts}>{fmt(val)} / {fmt(sub.target_amount)}</Text>
                      </View>
                      {sub.lent_out > 0 && (
                        <View style={{alignItems: 'flex-end'}}>
                          <Text style={{color: '#60A5FA', fontSize: 11, fontWeight: '500'}}>Lent Out</Text>
                          <Text style={{color: '#60A5FA', fontSize: 13, fontWeight: 'bold'}}>{fmt(sub.lent_out)}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${perc}%`, backgroundColor: '#FBBF24' }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* RECENT TRANSACTIONS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push('/transactions')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.listCard}>
            {expenses.length === 0 ? (
              <Text style={styles.emptyText}>No recent transactions.</Text>
            ) : (
              expenses.slice(0, 5).map((expense, idx) => (
                <View key={expense.id} style={[styles.transactionItem, idx === Math.min(expenses.length, 5) - 1 && {borderBottomWidth: 0}]}>
                  <View style={styles.tLeft}>
                    <View style={styles.iconCircle}>
                      <Ionicons name={renderIcon(expense.category)} size={18} color="#E2E8F0" />
                    </View>
                    <View>
                      <Text style={styles.tTitle}>{expense.category}</Text>
                      <Text style={styles.tDate}>{new Date(expense.date).toLocaleDateString()}</Text>
                    </View>
                  </View>
                  <Text style={[styles.tAmountExpense, expense.type === 'credit' && { color: '#4ADE80' }]}>
                    {expense.type === 'credit' ? '+' : ''}{fmt(expense.amount)}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* FLOATING ACTION BUTTONS */}
      <TouchableOpacity style={[styles.fab, { bottom: 104 }]} onPress={() => setSavingsModalVisible(true)}>
        <LinearGradient colors={['#FBBF24', '#D97706']} style={styles.fabGradient} start={{x: 0, y: 0}} end={{x: 1, y: 1}}>
          <Ionicons name="wallet" size={24} color="#0F1015" />
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <LinearGradient colors={['#4ADE80', '#10B981']} style={styles.fabGradient} start={{x: 0, y: 0}} end={{x: 1, y: 1}}>
          <Ionicons name="add" size={32} color="#0F1015" />
        </LinearGradient>
      </TouchableOpacity>

      <AddTransactionModal visible={modalVisible} onClose={() => setModalVisible(false)} />
      <AddTransactionModal visible={savingsModalVisible} onClose={() => setSavingsModalVisible(false)} isSavingsMode={true} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090E' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16 },
  greeting: { color: '#8A8A9E', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '600' },
  name: { color: '#F8FAFC', fontSize: 26, fontWeight: '800', marginTop: 4, letterSpacing: -0.5 },
  profileBtn: { borderRadius: 20, overflow: 'hidden' },
  profileAvatar: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  
  monthSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 24, marginBottom: 20, backgroundColor: '#13131A', borderRadius: 16, padding: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  monthBtn: { padding: 8, backgroundColor: '#1C1C26', borderRadius: 10 },
  monthText: { color: '#F8FAFC', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  
  mainCardWrapper: { marginHorizontal: 24, borderRadius: 28, elevation: 12, shadowColor: '#10B981', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 24, marginBottom: 24 },
  mainCard: { borderRadius: 28, padding: 28, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 100, opacity: 0.8 },
  mainCardLabel: { color: '#94A3B8', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  mainCardAmount: { color: '#F8FAFC', fontSize: 44, fontWeight: '900', marginTop: 4, letterSpacing: -1 },
  mainCardDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 20 },
  mainCardStats: { flexDirection: 'row', justifyContent: 'space-between' },
  statCol: { flex: 1, alignItems: 'flex-start' },
  statColCenter: { flex: 1, alignItems: 'center' },
  statColRight: { flex: 1, alignItems: 'flex-end' },
  mainCardSubLabel: { color: '#94A3B8', fontSize: 11, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  mainCardSubAmount: { color: '#F8FAFC', fontSize: 16, fontWeight: '700' },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, justifyContent: 'space-between' },
  gridItem: { backgroundColor: '#13131A', width: '48%', borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  iconBox: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  gridLabel: { color: '#8A8A9E', fontSize: 12, marginBottom: 4, fontWeight: '500' },
  gridAmount: { color: '#F8FAFC', fontSize: 18, fontWeight: '800' },
  
  section: { paddingHorizontal: 24, marginTop: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
  seeAll: { color: '#4ADE80', fontSize: 14, fontWeight: '700' },
  
  listCard: { backgroundColor: '#13131A', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  listRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' },
  progressName: { color: '#E2E8F0', fontSize: 15, fontWeight: '700' },
  progressAmounts: { color: '#64748B', fontSize: 12, marginTop: 2, fontWeight: '500' },
  progressStatus: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  progressValue: { fontSize: 14, fontWeight: '800', marginTop: 2 },
  progressBarBg: { backgroundColor: '#1E293B', height: 6, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  
  transactionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  tLeft: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  tTitle: { color: '#E2E8F0', fontSize: 15, fontWeight: '700' },
  tDate: { color: '#64748B', fontSize: 12, marginTop: 2, fontWeight: '500' },
  tAmountExpense: { color: '#F87171', fontSize: 15, fontWeight: '800' },
  
  emptyText: { color: '#64748B', textAlign: 'center', padding: 20, fontSize: 14 },
  
  fab: { position: 'absolute', bottom: 32, right: 24, width: 60, height: 60, borderRadius: 30, overflow: 'hidden', elevation: 12, shadowColor: '#10B981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16 },
  fabGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});

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
  const expenses = useStore((state) => state.expenses);
  const fetchData = useStore((state) => state.fetchData);
  const dashboardSummary = useStore((state) => state.dashboardSummary);
  const fetchDashboardSummary = useStore((state) => state.fetchDashboardSummary);

  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchDashboardSummary(currentMonth);
  }, [currentMonth]);

  const totalBalance = dashboardSummary?.total_bank_balance || 0;
  const netWorth = dashboardSummary?.net_worth || 0;
  const totalPosition = dashboardSummary?.total || 0;
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
    const d = new Date(`${currentMonth}-01`);
    d.setMonth(d.getMonth() - 1);
    setCurrentMonth(d.toISOString().slice(0, 7));
  };

  const handleNextMonth = () => {
    const d = new Date(`${currentMonth}-01`);
    d.setMonth(d.getMonth() + 1);
    setCurrentMonth(d.toISOString().slice(0, 7));
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good Morning,</Text>
            <Text style={styles.name}>Abdul Hadi</Text>
          </View>
          <TouchableOpacity style={styles.profileBtn}>
            <Ionicons name="person" size={24} color="#4ADE80" />
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 24, marginBottom: 16 }}>
          <TouchableOpacity onPress={handlePrevMonth} style={{ padding: 8 }}>
            <Ionicons name="chevron-back" size={24} color="#8A8A9E" />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
            {new Date(`${currentMonth}-01`).toLocaleString('default', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity onPress={handleNextMonth} style={{ padding: 8 }}>
            <Ionicons name="chevron-forward" size={24} color="#8A8A9E" />
          </TouchableOpacity>
        </View>

        <LinearGradient colors={['#4ADE80', '#10B981']} style={styles.mainCard} start={{x: 0, y: 0}} end={{x: 1, y: 1}}>
          <Text style={styles.mainCardLabel}>Total Assets</Text>
          <Text style={styles.mainCardAmount}>{fmt(totalPosition)}</Text>
          
          <View style={styles.mainCardStats}>
            <View>
              <Text style={styles.mainCardSubLabel}>Net Worth</Text>
              <Text style={styles.mainCardSubAmount}>{fmt(netWorth)}</Text>
            </View>
            <View>
              <Text style={styles.mainCardSubLabel}>Bank Balances</Text>
              <Text style={styles.mainCardSubAmount}>{fmt(totalBalance)}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Ionicons name="pie-chart-outline" size={24} color="#A78BFA" />
            <Text style={styles.gridLabel}>Monthly Budget</Text>
            <Text style={styles.gridAmount}>{fmt(income)}</Text>
          </View>
          <View style={styles.gridItem}>
            <Ionicons name="cart-outline" size={24} color="#F87171" />
            <Text style={styles.gridLabel}>Spent so far</Text>
            <Text style={styles.gridAmount}>{fmt(spent)}</Text>
          </View>
          <View style={styles.gridItem}>
            <Ionicons name="wallet-outline" size={24} color="#FBBF24" />
            <Text style={styles.gridLabel}>Total Savings</Text>
            <Text style={styles.gridAmount}>{fmt(savings)}</Text>
          </View>
          <View style={styles.gridItem}>
            <Ionicons name="trending-up" size={24} color="#60A5FA" />
            <Text style={styles.gridLabel}>Owed to Me</Text>
            <Text style={styles.gridAmount}>{fmt(owedToMe)}</Text>
          </View>
          <View style={styles.gridItem}>
            <Ionicons name="trending-down" size={24} color="#F87171" />
            <Text style={styles.gridLabel}>I Owe</Text>
            <Text style={styles.gridAmount}>{fmt(iOwe)}</Text>
          </View>
          <View style={styles.gridItem}>
            <Ionicons name="cash-outline" size={24} color="#34D399" />
            <Text style={styles.gridLabel}>Remaining</Text>
            <Text style={styles.gridAmount}>{fmt(income - spent)}</Text>
          </View>
        </View>

        {dashboardSummary?.spent_per_expense_category && dashboardSummary.spent_per_expense_category.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Budget Progress</Text>
            <View style={styles.progressCard}>
              {dashboardSummary.spent_per_expense_category.map((sub, idx) => {
                const perc = Math.min((sub.spent / (sub.assigned_budget || 1)) * 100, 100);
                return (
                  <View key={idx} style={styles.progressRow}>
                    <View style={styles.progressHeader}>
                      <View>
                        <Text style={styles.progressName}>{sub.name}</Text>
                        <Text style={styles.progressAmounts}>{fmt(sub.spent)} / {fmt(sub.assigned_budget)}</Text>
                      </View>
                      <View style={{alignItems: 'flex-end'}}>
                        <Text style={[styles.progressName, { fontSize: 12, color: sub.remaining < 0 ? '#F87171' : '#4ADE80' }]}>
                          {sub.remaining < 0 ? 'Overspent' : 'Remaining'}
                        </Text>
                        <Text style={[styles.progressAmounts, { color: sub.remaining < 0 ? '#F87171' : '#4ADE80', fontWeight: 'bold' }]}>
                          {fmt(sub.remaining)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${perc}%`, backgroundColor: perc > 90 ? '#F87171' : '#4ADE80' }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        {dashboardSummary?.savings_progress && dashboardSummary.savings_progress.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Savings Progress</Text>
            <View style={styles.progressCard}>
              {dashboardSummary.savings_progress.map((sub, idx) => {
                const val = sub.total_value !== undefined ? sub.total_value : sub.current_saved;
                const perc = Math.min((val / (sub.target_amount || 1)) * 100, 100);
                return (
                  <View key={idx} style={styles.progressRow}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressName}>{sub.name}</Text>
                      <View style={{alignItems: 'flex-end'}}>
                        <Text style={styles.progressAmounts}>{fmt(val)} / {fmt(sub.target_amount)}</Text>
                        {sub.lent_out > 0 && (
                          <Text style={{color: '#60A5FA', fontSize: 10, marginTop: 2}}>
                            {fmt(sub.current_saved)} available + {fmt(sub.lent_out)} lent
                          </Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${perc}%`, backgroundColor: '#FBBF24' }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        {dashboardSummary?.income_per_category && dashboardSummary.income_per_category.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Income Received</Text>
            <View style={styles.progressCard}>
              {dashboardSummary.income_per_category.map((sub, idx) => (
                <View key={idx} style={[styles.progressRow, {marginBottom: 8}]}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressName}>{sub.name}</Text>
                    <Text style={[styles.progressAmounts, {color: '#4ADE80', fontWeight: 'bold'}]}>+{fmt(sub.received)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => router.push('/transactions')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {expenses.length === 0 ? (
            <Text style={styles.emptyText}>No recent transactions.</Text>
          ) : (
            expenses.slice(0, 5).map((expense) => (
              <View key={expense.id} style={styles.transactionCard}>
                <View style={styles.tLeft}>
                  <View style={styles.iconCircle}>
                    <Ionicons name={renderIcon(expense.category)} size={20} color="#4ADE80" />
                  </View>
                  <View>
                    <Text style={styles.tTitle}>{expense.category}</Text>
                    <Text style={styles.tDate}>{new Date(expense.date).toLocaleDateString()}</Text>
                  </View>
                </View>
                <Text style={[styles.tAmountExpense, expense.type === 'credit' && { color: '#4ADE80' }]}>
                  {expense.type === 'credit' ? '+' : '-'}{fmt(expense.amount)}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      <AddTransactionModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B14' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 },
  greeting: { color: '#8A8A9E', fontSize: 14 },
  name: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 4 },
  profileBtn: { backgroundColor: '#1E1E2D', padding: 12, borderRadius: 16 },
  mainCard: { marginHorizontal: 24, borderRadius: 24, padding: 24, shadowColor: '#4ADE80', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  mainCardLabel: { color: 'rgba(0,0,0,0.6)', fontSize: 14, fontWeight: '600', textTransform: 'uppercase' },
  mainCardAmount: { color: '#000', fontSize: 40, fontWeight: '900', marginTop: 8, marginBottom: 24 },
  mainCardStats: { flexDirection: 'row', justifyContent: 'space-between' },
  mainCardSubLabel: { color: 'rgba(0,0,0,0.6)', fontSize: 12, marginBottom: 4 },
  mainCardSubAmount: { color: '#000', fontSize: 18, fontWeight: 'bold' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, marginTop: 24, justifyContent: 'space-between' },
  gridItem: { backgroundColor: '#1E1E2D', width: '48%', borderRadius: 20, padding: 20, marginBottom: 16 },
  gridLabel: { color: '#8A8A9E', fontSize: 12, marginTop: 12, marginBottom: 4 },
  gridAmount: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  section: { paddingHorizontal: 24, marginTop: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  seeAll: { color: '#4ADE80', fontSize: 14, fontWeight: '600' },
  emptyText: { color: '#8A8A9E', textAlign: 'center', padding: 20 },
  progressCard: { backgroundColor: '#1E1E2D', borderRadius: 20, padding: 20 },
  progressRow: { marginBottom: 16 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  progressAmounts: { color: '#8A8A9E', fontSize: 12 },
  progressBarBg: { backgroundColor: '#2A2A3D', height: 8, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  transactionCard: { backgroundColor: '#1E1E2D', borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tLeft: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(74, 222, 128, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  tTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  tDate: { color: '#8A8A9E', fontSize: 12, marginTop: 4 },
  tAmountExpense: { color: '#F87171', fontSize: 16, fontWeight: 'bold' },
  fab: { position: 'absolute', bottom: 30, right: 24, backgroundColor: '#4ADE80', width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', shadowColor: '#4ADE80', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 }
});

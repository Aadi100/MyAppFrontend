import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import AddTransactionModal from '../components/AddTransactionModal';
import { LinearGradient } from 'expo-linear-gradient';

export default function TransactionsScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [filter, setFilter] = useState('month'); // 'day', 'month', 'year', 'category'
  const [expandedGroups, setExpandedGroups] = useState({});
  const [editingTransaction, setEditingTransaction] = useState(null);
  
  const expenses = useStore(state => state.expenses);
  const subCategories = useStore(state => state.subCategories);
  const masterCategories = useStore(state => state.masterCategories);
  const deleteExpense = useStore(state => state.deleteExpense);

  const handleEditTransaction = (expense) => {
    setEditingTransaction(expense);
    setModalVisible(true);
  };

  const handleDeleteTransaction = (id) => {
    Alert.alert(
      "Delete Transaction",
      "Are you sure you want to delete this transaction?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteExpense(id) }
      ]
    );
  };

  const getSubCategoryName = (id) => subCategories.find(s => s.id === id)?.name || 'Unknown';

  const fmt = (num) => `Rs ${Math.abs(Number(num)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const renderIcon = (categoryName) => {
    switch (categoryName?.toLowerCase()) {
      case 'food': return 'fast-food';
      case 'transport': return 'car';
      case 'utilities': return 'flash';
      case 'entertainment': return 'game-controller';
      case 'salary': return 'cash';
      default: return 'card';
    }
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
    
    if (!acc[key]) acc[key] = { sortDate: d.getTime(), transactions: [], total: 0 };
    acc[key].transactions.push(expense);
    acc[key].total += (expense.type === 'credit' ? expense.amount : -expense.amount);
    return acc;
  }, {});

  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    if (filter === 'category') return a.localeCompare(b);
    return grouped[b].sortDate - grouped[a].sortDate;
  });

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Activity</Text>
      </View>

      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          <TouchableOpacity style={[styles.tab, filter === 'day' && styles.activeTab]} onPress={() => setFilter('day')}>
            <Text style={filter === 'day' ? styles.activeTabText : styles.inactiveTabText}>Daily</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, filter === 'month' && styles.activeTab]} onPress={() => setFilter('month')}>
            <Text style={filter === 'month' ? styles.activeTabText : styles.inactiveTabText}>Monthly</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, filter === 'year' && styles.activeTab]} onPress={() => setFilter('year')}>
            <Text style={filter === 'year' ? styles.activeTabText : styles.inactiveTabText}>Yearly</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, filter === 'category' && styles.activeTab]} onPress={() => setFilter('category')}>
            <Text style={filter === 'category' ? styles.activeTabText : styles.inactiveTabText}>Category</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {sortedKeys.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyStateIconContainer}>
              <Ionicons name="receipt-outline" size={48} color="#334155" />
            </View>
            <Text style={styles.emptyStateTitle}>No Activity Yet</Text>
            <Text style={styles.emptyStateText}>Your transactions will appear here.</Text>
          </View>
        )}
        
        {sortedKeys.map(key => (
          <View key={key} style={styles.groupContainer}>
            <TouchableOpacity style={styles.groupHeader} onPress={() => toggleGroup(key)} activeOpacity={0.8}>
              <View>
                <Text style={styles.groupTitle}>{key}</Text>
                <Text style={styles.groupSummary}>{grouped[key].transactions.length} Transactions</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.groupTotal, grouped[key].total < 0 ? { color: '#F87171' } : { color: '#4ADE80' }]}>
                  {grouped[key].total > 0 ? '+' : ''}{fmt(grouped[key].total)}
                </Text>
                <View style={styles.chevronBox}>
                  <Ionicons name={expandedGroups[key] ? 'chevron-up' : 'chevron-down'} size={18} color="#94A3B8" />
                </View>
              </View>
            </TouchableOpacity>

            {expandedGroups[key] && (
              <View style={styles.groupContent}>
                {grouped[key].transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((expense, idx) => {
                  const catName = getSubCategoryName(expense.sub_category_id);
                  const isCredit = expense.type === 'credit';
                  return (
                    <View key={expense.id} style={[styles.transactionCard, idx === grouped[key].transactions.length - 1 && {borderBottomWidth: 0}]}>
                      <View style={styles.tLeft}>
                        <View style={[styles.iconCircle, isCredit ? { backgroundColor: 'rgba(74, 222, 128, 0.1)' } : { backgroundColor: 'rgba(167, 139, 250, 0.1)' }]}>
                          <Ionicons name={renderIcon(catName)} size={20} color={isCredit ? '#4ADE80' : '#A78BFA'} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.tTitle}>{expense.reason || catName}</Text>
                          <Text style={styles.tDate}>{catName} • {new Date(expense.date).toLocaleDateString()}</Text>
                          {expense.note ? <Text style={styles.tNote}>{expense.note}</Text> : null}
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end', marginLeft: 10 }}>
                        <Text style={[styles.tAmountExpense, isCredit && { color: '#4ADE80' }]}>
                          {isCredit ? '+' : ''}{fmt(expense.amount)}
                        </Text>
                        <View style={{ flexDirection: 'row', marginTop: 10 }}>
                          <TouchableOpacity onPress={() => handleEditTransaction(expense)} style={styles.actionBtn}>
                            <Ionicons name="pencil" size={14} color="#94A3B8" />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDeleteTransaction(expense.id)} style={[styles.actionBtn, { marginLeft: 8, backgroundColor: 'rgba(248, 113, 113, 0.1)' }]}>
                            <Ionicons name="trash" size={14} color="#F87171" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => { setEditingTransaction(null); setModalVisible(true); }}>
        <LinearGradient colors={['#4ADE80', '#10B981']} style={styles.fabGradient}>
          <Ionicons name="add" size={32} color="#0F1015" />
        </LinearGradient>
      </TouchableOpacity>

      <AddTransactionModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        editingTransaction={editingTransaction}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090E' },
  headerRow: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16 },
  title: { color: '#F8FAFC', fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  
  tabsContainer: { paddingHorizontal: 24, marginBottom: 24 },
  tabsScroll: { backgroundColor: '#13131A', borderRadius: 16, padding: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  tab: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12 },
  activeTab: { backgroundColor: '#1E293B', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  activeTabText: { color: '#4ADE80', fontWeight: '700', letterSpacing: 0.5 },
  inactiveTabText: { color: '#64748B', fontWeight: '600', letterSpacing: 0.5 },
  
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 100, paddingHorizontal: 40 },
  emptyStateIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#13131A', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  emptyStateTitle: { color: '#F8FAFC', fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptyStateText: { color: '#64748B', fontSize: 15, textAlign: 'center', lineHeight: 22 },
  
  groupContainer: { marginHorizontal: 24, marginBottom: 16, backgroundColor: '#13131A', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  groupTitle: { color: '#F8FAFC', fontSize: 17, fontWeight: '700' },
  groupSummary: { color: '#64748B', fontSize: 13, marginTop: 4, fontWeight: '500' },
  groupTotal: { fontSize: 17, fontWeight: '800', letterSpacing: -0.5, marginRight: 12 },
  chevronBox: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  
  groupContent: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', backgroundColor: '#0B0B14' },
  
  transactionCard: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  tLeft: { flexDirection: 'row', flex: 1, alignItems: 'center' },
  iconCircle: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  tTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '600' },
  tDate: { color: '#64748B', fontSize: 13, marginTop: 4, fontWeight: '500' },
  tNote: { color: '#94A3B8', fontSize: 13, marginTop: 6, fontStyle: 'italic' },
  tAmountExpense: { color: '#F87171', fontSize: 16, fontWeight: '800', letterSpacing: -0.5 },
  
  actionBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  
  fab: { position: 'absolute', bottom: 32, right: 24, elevation: 12, shadowColor: '#10B981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16 },
  fabGradient: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' }
});

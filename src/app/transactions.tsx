import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import AddTransactionModal from '../components/AddTransactionModal';

export default function TransactionsScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [filter, setFilter] = useState('month'); // 'day', 'month', 'year'
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
    // If expense.type is credit, add. If expense.type is not credit, assume expense
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
        <Text style={styles.title}>Transactions</Text>
      </View>

      <View style={styles.tabsContainer}>
        <View style={styles.tabs}>
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
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {sortedKeys.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color="#2A2A3D" />
            <Text style={styles.emptyStateText}>No transactions found.</Text>
          </View>
        )}
        
        {sortedKeys.map(key => (
          <View key={key} style={styles.groupContainer}>
            <TouchableOpacity style={styles.groupHeader} onPress={() => toggleGroup(key)}>
              <View>
                <Text style={styles.groupTitle}>{key}</Text>
                <Text style={styles.groupSummary}>{grouped[key].transactions.length} Transactions</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.groupTotal, grouped[key].total < 0 ? { color: '#F87171' } : { color: '#4ADE80' }]}>
                  {grouped[key].total >= 0 ? '+' : '-'}{fmt(grouped[key].total)}
                </Text>
                <Ionicons name={expandedGroups[key] ? 'chevron-up' : 'chevron-down'} size={20} color="#8A8A9E" style={{ marginLeft: 8 }} />
              </View>
            </TouchableOpacity>

            {expandedGroups[key] && (
              <View style={styles.groupContent}>
                {grouped[key].transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(expense => {
                  const catName = getSubCategoryName(expense.sub_category_id);
                  const isCredit = expense.type === 'credit';
                  return (
                    <View key={expense.id} style={styles.transactionCard}>
                      <View style={styles.tLeft}>
                        <View style={[styles.iconCircle, isCredit && { backgroundColor: 'rgba(74, 222, 128, 0.1)' }]}>
                          <Ionicons name={renderIcon(catName)} size={20} color={isCredit ? '#4ADE80' : '#8B5CF6'} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.tTitle}>{expense.reason || catName}</Text>
                          <Text style={styles.tDate}>{catName} • {new Date(expense.date).toLocaleDateString()}</Text>
                          {expense.note ? <Text style={styles.tNote}>{expense.note}</Text> : null}
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end', marginLeft: 10 }}>
                        <Text style={[styles.tAmountExpense, isCredit && { color: '#4ADE80' }]}>
                          {isCredit ? '+' : '-'}{fmt(expense.amount)}
                        </Text>
                        <View style={{ flexDirection: 'row', marginTop: 8 }}>
                          <TouchableOpacity onPress={() => handleEditTransaction(expense)} style={{ marginRight: 12, padding: 4 }}>
                            <Ionicons name="pencil" size={16} color="#8A8A9E" />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDeleteTransaction(expense.id)} style={{ padding: 4 }}>
                            <Ionicons name="trash" size={16} color="#F87171" />
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
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      <AddTransactionModal 
        visible={modalVisible} 
        onClose={() => { setModalVisible(false); setEditingTransaction(null); }} 
        editingTransaction={editingTransaction} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B14', paddingHorizontal: 24, paddingTop: 24 },
  headerRow: { marginBottom: 20 },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  tabsContainer: { backgroundColor: '#1E1E2D', borderRadius: 16, padding: 4, marginBottom: 24 },
  tabs: { flexDirection: 'row' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  activeTab: { backgroundColor: '#2A2A3D', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  activeTabText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  inactiveTabText: { color: '#8A8A9E', fontWeight: '600', fontSize: 14 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyStateText: { color: '#8A8A9E', marginTop: 12, fontSize: 16 },
  
  groupContainer: { marginBottom: 16, backgroundColor: '#1E1E2D', borderRadius: 16, overflow: 'hidden' },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#1E1E2D' },
  groupTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  groupSummary: { color: '#8A8A9E', fontSize: 13, marginTop: 4 },
  groupTotal: { fontSize: 18, fontWeight: 'bold' },
  groupContent: { paddingHorizontal: 16, paddingBottom: 16, backgroundColor: '#1E1E2D' },

  transactionCard: { backgroundColor: '#12121D', borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  tLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(139, 92, 246, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  tTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  tDate: { color: '#8A8A9E', fontSize: 12, marginTop: 4 },
  tNote: { color: '#60A5FA', fontSize: 11, marginTop: 4, fontStyle: 'italic' },
  tAmountExpense: { color: '#F87171', fontSize: 16, fontWeight: 'bold' },
  fab: { position: 'absolute', bottom: 30, right: 24, backgroundColor: '#4ADE80', width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', shadowColor: '#4ADE80', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 }
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../store/useStore';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

export default function ManageScreen() {
  const router = useRouter();
  const banks = useStore(state => state.banks);
  const masterCategories = useStore(state => state.masterCategories);
  const subCategories = useStore(state => state.subCategories);
  const addBank = useStore(state => state.addBank);
  const updateBankAccount = useStore(state => state.updateBankAccount);
  const deleteBankAccount = useStore(state => state.deleteBankAccount);
  const importTransactions = useStore(state => state.importTransactions);
  
  const monthlyBudgets = useStore(state => state.monthlyBudgets);
  const fetchMonthlyBudgets = useStore(state => state.fetchMonthlyBudgets);
  const setMonthlyBudget = useStore(state => state.setMonthlyBudget);
  const deleteMonthlyBudget = useStore(state => state.deleteMonthlyBudget);

  const addMasterCategory = useStore(state => state.addMasterCategory);
  const updateMasterCategory = useStore(state => state.updateMasterCategory);
  const deleteMasterCategory = useStore(state => state.deleteMasterCategory);

  const addSubCategory = useStore(state => state.addSubCategory);
  const updateSubCategory = useStore(state => state.updateSubCategory);
  const deleteSubCategory = useStore(state => state.deleteSubCategory);

  const [masterCatModalVisible, setMasterCatModalVisible] = useState(false);
  const [masterCatForm, setMasterCatForm] = useState({ id: null, name: '', type: 'expense' });

  // Complex Modals
  const [bankModalVisible, setBankModalVisible] = useState(false);
  const [bankForm, setBankForm] = useState({ name: '', initial_balance: '', account_number: '' });

  const [subCatModalVisible, setSubCatModalVisible] = useState(false);
  const [subCatForm, setSubCatForm] = useState({ master_category_id: '', name: '', assigned_budget: '', default_bank_account_id: '' });

  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ sub_category_id: '', amount: '' });
  
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [transferForm, setTransferForm] = useState({ from_sub_category_id: '', to_sub_category_id: '', amount: '' });
  const transferBudget = useStore(state => state.transferBudget);

  const [budgetMonth, setBudgetMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    fetchMonthlyBudgets(budgetMonth);
  }, [budgetMonth]);

  const handleAddCategory = () => {
    setMasterCatForm({ id: null, name: '', type: 'expense' });
    setMasterCatModalVisible(true);
  };

  const handleAddSubCategory = (masterId) => {
    setSubCatForm({ id: null, master_category_id: masterId, name: '', assigned_budget: '', default_bank_account_id: banks[0]?.id || '' });
    setSubCatModalVisible(true);
  };

  const handleEditSubCategory = (sub) => {
    setSubCatForm({ id: sub.id, master_category_id: sub.master_category_id, name: sub.name, assigned_budget: sub.assigned_budget?.toString() || '', default_bank_account_id: sub.default_bank_account_id || '' });
    setSubCatModalVisible(true);
  };

  const handleAddBudgetModal = () => {
    setBudgetForm({ sub_category_id: '', amount: '' });
    setBudgetModalVisible(true);
  };

  const handleEditBudget = (b) => {
    setBudgetForm({ sub_category_id: b.sub_category_id, amount: b.amount.toString() });
    setBudgetModalVisible(true);
  };

  const handleTransferModal = () => {
    setTransferForm({ from_sub_category_id: '', to_sub_category_id: '', amount: '' });
    setTransferModalVisible(true);
  };

  const handleAddBank = () => {
    setBankForm({ id: null, name: '', initial_balance: '', account_number: '' });
    setBankModalVisible(true);
  };

  const handleEditBank = (bank) => {
    setBankForm({ id: bank.id, name: bank.name, initial_balance: bank.balance?.toString() || '', account_number: bank.account_number || '' });
    setBankModalVisible(true);
  };

  const handleEditCategory = (cat) => {
    setMasterCatForm({ id: cat.id, name: cat.name, type: cat.type || 'expense' });
    setMasterCatModalVisible(true);
  };

  const handleDelete = (title, onConfirm) => {
    Alert.alert(`Delete ${title}?`, "Are you sure? This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: onConfirm }
    ]);
  };

  const importTransactionsPDF = useStore(state => state.importTransactionsPDF);

  const handleImportData = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const pickedFile = result.assets[0];
        const isPdf = pickedFile.name.toLowerCase().endsWith('.pdf') || pickedFile.mimeType === 'application/pdf';

        if (isPdf) {
          const res = await importTransactionsPDF(pickedFile);
          Alert.alert('Import Success', `Imported: ${res.imported}\nFailed: ${res.failed_count}`);
        } else {
          const fileUri = pickedFile.uri;
          const response = await fetch(fileUri);
          const fileContent = await response.text();
          
          if (!fileContent.trim()) {
            Alert.alert('Empty File', 'The selected CSV file is empty.');
            return;
          }

          const res = await importTransactions(fileContent);
          Alert.alert('Import Success', `Imported: ${res.imported}\nFailed: ${res.failed_count}`);
        }
      }
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Import Failed', error instanceof Error ? error.message : 'Failed to import file. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>Menu</Text>

        {/* Apps Grid */}
        <View style={styles.menuGrid}>
          <TouchableOpacity style={styles.menuGridItem} onPress={() => router.push('/savings')}>
            <LinearGradient colors={['#FBBF24', '#F59E0B']} style={styles.menuIconBg} start={{x:0, y:0}} end={{x:1, y:1}}>
              <Ionicons name="wallet" size={28} color="#fff" />
            </LinearGradient>
            <Text style={styles.menuGridText}>Savings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuGridItem} onPress={() => router.push('/udhar')}>
            <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.menuIconBg} start={{x:0, y:0}} end={{x:1, y:1}}>
              <Ionicons name="people" size={28} color="#fff" />
            </LinearGradient>
            <Text style={styles.menuGridText}>Udhar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuGridItem} onPress={() => router.push('/vault')}>
            <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.menuIconBg} start={{x:0, y:0}} end={{x:1, y:1}}>
              <Ionicons name="key" size={28} color="#fff" />
            </LinearGradient>
            <Text style={styles.menuGridText}>Vault</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.header, { fontSize: 20, marginBottom: 20 }]}>Settings & Configuration</Text>

        {/* Categories Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Ionicons name="folder-open" size={20} color="#60A5FA" style={{marginRight: 8}} />
              <Text style={styles.sectionTitle}>Categories</Text>
            </View>
            <TouchableOpacity onPress={handleAddCategory} style={styles.addButtonIcon}>
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            {masterCategories.length === 0 && <Text style={styles.emptyText}>No categories yet.</Text>}
            {masterCategories.map((cat, index) => {
              const subs = (subCategories || []).filter(s => s.master_category_id === cat.id);
              return (
                <View key={cat.id} style={[styles.listItemContainer, index === masterCategories.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={styles.listItem}>
                    <View>
                      <Text style={styles.itemText}>{cat.name}</Text>
                      <Text style={{color: '#8A8A9E', fontSize: 12, marginTop: 2, textTransform: 'capitalize'}}>{cat.type || 'Expense'}</Text>
                    </View>
                    <View style={styles.actionRow}>
                      <TouchableOpacity onPress={() => handleEditCategory(cat)} style={styles.iconBtn}><Ionicons name="pencil" size={16} color="#8A8A9E" /></TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(cat.name, () => deleteMasterCategory(cat.id))} style={styles.iconBtn}><Ionicons name="trash" size={16} color="#F87171" /></TouchableOpacity>
                      <TouchableOpacity onPress={() => handleAddSubCategory(cat.id)} style={styles.iconBtn}><Ionicons name="add" size={20} color="#4ADE80" /></TouchableOpacity>
                    </View>
                  </View>
                  {/* Subcategories */}
                  {subs.length > 0 && (
                    <View style={styles.subCatContainer}>
                      {subs.map(sub => (
                        <View key={sub.id} style={styles.subCatRow}>
                          <View style={styles.treeLine} />
                          <Text style={styles.subCatText}>{sub.name}</Text>
                          <View style={styles.actionRow}>
                            <TouchableOpacity onPress={() => handleEditSubCategory(sub)} style={styles.iconBtn}><Ionicons name="pencil" size={14} color="#8A8A9E" /></TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDelete(sub.name, () => deleteSubCategory(sub.id))} style={styles.iconBtn}><Ionicons name="trash" size={14} color="#F87171" /></TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Monthly Budgets Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Ionicons name="pie-chart" size={20} color="#34D399" style={{marginRight: 8}} />
              <Text style={styles.sectionTitle}>Monthly Budgets</Text>
            </View>
            <View style={{flexDirection: 'row'}}>
              <TouchableOpacity onPress={handleTransferModal} style={[styles.addButtonIcon, { marginRight: 8, backgroundColor: '#3B82F6' }]}>
                <Ionicons name="swap-horizontal" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddBudgetModal} style={styles.addButtonIcon}>
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <TouchableOpacity onPress={() => {
              const d = new Date(`${budgetMonth}-01`); d.setMonth(d.getMonth() - 1); setBudgetMonth(d.toISOString().slice(0, 7));
            }} style={{ padding: 8 }}><Ionicons name="chevron-back" size={20} color="#8A8A9E" /></TouchableOpacity>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{new Date(`${budgetMonth}-01`).toLocaleString('default', { month: 'long', year: 'numeric' })}</Text>
            <TouchableOpacity onPress={() => {
              const d = new Date(`${budgetMonth}-01`); d.setMonth(d.getMonth() + 1); setBudgetMonth(d.toISOString().slice(0, 7));
            }} style={{ padding: 8 }}><Ionicons name="chevron-forward" size={20} color="#8A8A9E" /></TouchableOpacity>
          </View>

          <View style={styles.card}>
            {monthlyBudgets.length === 0 && <Text style={styles.emptyText}>No budget allocations for this month.</Text>}
            {monthlyBudgets.map((b, index) => {
               const catName = subCategories.find(s => s.id === b.sub_category_id)?.name || 'Unknown';
               return (
                  <View key={b.id} style={[styles.listItem, index === monthlyBudgets.length - 1 && { borderBottomWidth: 0 }]}>
                    <View>
                      <Text style={styles.itemText}>{catName}</Text>
                      <Text style={{color: '#8A8A9E', fontSize: 12, marginTop: 2}}>Rs {b.amount}</Text>
                    </View>
                    <View style={styles.actionRow}>
                      <TouchableOpacity onPress={() => handleEditBudget(b)} style={styles.iconBtn}><Ionicons name="pencil" size={16} color="#8A8A9E" /></TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(`Budget for ${catName}`, () => deleteMonthlyBudget(b.id, budgetMonth))} style={styles.iconBtn}><Ionicons name="trash" size={16} color="#F87171" /></TouchableOpacity>
                    </View>
                  </View>
               );
            })}
          </View>
        </View>

        {/* Banks Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Ionicons name="business" size={20} color="#FBBF24" style={{marginRight: 8}} />
              <Text style={styles.sectionTitle}>Bank Accounts</Text>
            </View>
            <View style={{flexDirection: 'row'}}>
              <TouchableOpacity onPress={() => router.push('/bank-comparison')} style={[styles.addButtonIcon, { marginRight: 8, backgroundColor: '#8B5CF6' }]}>
                <Ionicons name="analytics" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddBank} style={styles.addButtonIcon}>
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.card}>
            {banks.length === 0 && <Text style={styles.emptyText}>No banks yet.</Text>}
            {banks.map((bank, index) => (
              <TouchableOpacity 
                key={bank.id} 
                style={[styles.listItem, index === banks.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() => router.push(`/bank-summary?id=${bank.id}`)}
              >
                <Text style={styles.itemText}>{bank.name}</Text>
                <View style={styles.actionRow}>
                  <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleEditBank(bank); }} style={styles.iconBtn}><Ionicons name="pencil" size={16} color="#8A8A9E" /></TouchableOpacity>
                  <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleDelete(bank.name, () => deleteBankAccount(bank.id)); }} style={styles.iconBtn}><Ionicons name="trash" size={16} color="#F87171" /></TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Payday Feature Link */}
        <TouchableOpacity onPress={() => router.push('/payday')} style={{marginTop: 10, marginBottom: 20}}>
          <LinearGradient colors={['#4ADE80', '#10B981']} style={styles.paydayButton} start={{x:0,y:0}} end={{x:1,y:1}}>
            <Ionicons name="cash" size={28} color="#000" style={{marginRight: 12}} />
            <View>
              <Text style={styles.paydayText}>Salary Allocation</Text>
              <Text style={styles.paydaySubtext}>Budget your payday seamlessly</Text>
            </View>
            <Ionicons name="arrow-forward" size={24} color="#000" style={{marginLeft: 'auto'}} />
          </LinearGradient>
        </TouchableOpacity>

        {/* Import Data Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Ionicons name="document-text" size={20} color="#8B5CF6" style={{marginRight: 8}} />
              <Text style={styles.sectionTitle}>Import Data</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleImportData} style={[styles.card, { flexDirection: 'row', alignItems: 'center' }]}>
            <View style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)', padding: 12, borderRadius: 12, marginRight: 16 }}>
              <Ionicons name="cloud-upload" size={24} color="#8B5CF6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemText}>Import Transactions</Text>
              <Text style={{ color: '#8A8A9E', fontSize: 13, marginTop: 4 }}>Select a CSV or PDF file to import</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#8A8A9E" />
          </TouchableOpacity>
        </View>

        <View style={{height: 40}} />
      </ScrollView>

      {/* Master Category Form Modal */}
      <Modal visible={masterCatModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.sheetOverlay}>
          <View style={styles.sheetContent}>
            <Text style={styles.sheetTitle}>{masterCatForm.id ? "Edit Category" : "New Category"}</Text>
            <TextInput
              style={styles.sheetInput}
              placeholder="Category Name"
              placeholderTextColor="#8A8A9E"
              value={masterCatForm.name}
              onChangeText={(v) => setMasterCatForm({...masterCatForm, name: v})}
              autoFocus
            />
            
            <Text style={styles.sheetLabel}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {['expense', 'income', 'savings'].map(type => (
                <TouchableOpacity 
                  key={type} 
                  style={[styles.pill, masterCatForm.type === type && styles.activePill]} 
                  onPress={() => setMasterCatForm({...masterCatForm, type})}
                >
                  <Text style={[styles.pillText, masterCatForm.type === type && styles.activePillText]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setMasterCatModalVisible(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={() => {
                if (!masterCatForm.name.trim()) return Alert.alert("Wait", "Name is required.");
                if (masterCatForm.id) {
                  updateMasterCategory({ id: masterCatForm.id, name: masterCatForm.name.trim(), type: masterCatForm.type });
                } else {
                  addMasterCategory({ name: masterCatForm.name.trim(), type: masterCatForm.type });
                }
                setMasterCatModalVisible(false);
              }}>
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Bank Account Form Modal */}
      <Modal visible={bankModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.sheetOverlay}>
          <View style={styles.sheetContent}>
            <Text style={styles.sheetTitle}>{bankForm.id ? "Edit Bank Account" : "New Bank Account"}</Text>
            <TextInput style={styles.sheetInput} placeholder="Bank Name (e.g. Meezan)" placeholderTextColor="#8A8A9E" value={bankForm.name} onChangeText={(v) => setBankForm({...bankForm, name: v})} autoFocus />
            <TextInput style={styles.sheetInput} placeholder="Account Number (Optional)" placeholderTextColor="#8A8A9E" value={bankForm.account_number} onChangeText={(v) => setBankForm({...bankForm, account_number: v})} />
            <TextInput style={styles.sheetInput} placeholder="Initial Balance (e.g. 5000)" placeholderTextColor="#8A8A9E" keyboardType="decimal-pad" value={bankForm.initial_balance} onChangeText={(v) => setBankForm({...bankForm, initial_balance: v})} />
            
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setBankModalVisible(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={() => {
                if (!bankForm.name) return Alert.alert("Wait", "Bank Name is required.");
                
                const payload = { 
                  name: bankForm.name, 
                  account_number: bankForm.account_number || undefined, 
                  initial_balance: parseFloat(bankForm.initial_balance) || 0 
                };

                if (bankForm.id) {
                  updateBankAccount({ id: bankForm.id, ...payload });
                } else {
                  addBank(payload);
                }
                setBankModalVisible(false);
              }}>
                <Text style={styles.buttonText}>Save Bank</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* SubCategory Form Modal */}
      <Modal visible={subCatModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.sheetOverlay}>
          <View style={styles.sheetContent}>
            <Text style={styles.sheetTitle}>{subCatForm.id ? "Edit Budget Category" : "New Budget Category"}</Text>
            <TextInput style={styles.sheetInput} placeholder="Category Name (e.g. Groceries)" placeholderTextColor="#8A8A9E" value={subCatForm.name} onChangeText={(v) => setSubCatForm({...subCatForm, name: v})} autoFocus />
            <TextInput style={styles.sheetInput} placeholder="Assigned Budget (e.g. 3000)" placeholderTextColor="#8A8A9E" keyboardType="decimal-pad" value={subCatForm.assigned_budget} onChangeText={(v) => setSubCatForm({...subCatForm, assigned_budget: v})} />
            
            <Text style={styles.sheetLabel}>Default Bank (for auto tracking)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {banks.map(b => (
                <TouchableOpacity key={b.id} style={[styles.pill, subCatForm.default_bank_account_id === b.id && styles.activePill]} onPress={() => setSubCatForm({...subCatForm, default_bank_account_id: b.id})}>
                  <Text style={[styles.pillText, subCatForm.default_bank_account_id === b.id && styles.activePillText]}>{b.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setSubCatModalVisible(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={() => {
                if (!subCatForm.name) return Alert.alert("Wait", "Name is required.");
                
                const payload = {
                  master_category_id: subCatForm.master_category_id, 
                  name: subCatForm.name, 
                  assigned_budget: parseFloat(subCatForm.assigned_budget) || 0,
                  default_bank_account_id: subCatForm.default_bank_account_id || undefined
                };

                if (subCatForm.id) {
                  updateSubCategory({ id: subCatForm.id, ...payload });
                } else {
                  addSubCategory(payload);
                }
                setSubCatModalVisible(false);
              }}>
                <Text style={styles.buttonText}>Save Category</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Budget Modal */}
      <Modal visible={budgetModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.sheetOverlay}>
          <View style={styles.sheetContent}>
            <Text style={styles.sheetTitle}>{budgetForm.sub_category_id ? "Edit Budget" : "New Budget Allocation"}</Text>
            
            <Text style={styles.sheetLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {subCategories.filter(s => masterCategories.find(m => m.id === s.master_category_id)?.type === 'expense').map(cat => (
                <TouchableOpacity 
                  key={cat.id} 
                  style={[styles.pill, budgetForm.sub_category_id === cat.id && styles.activePill]} 
                  onPress={() => setBudgetForm({...budgetForm, sub_category_id: cat.id})}
                >
                  <Text style={[styles.pillText, budgetForm.sub_category_id === cat.id && styles.activePillText]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              style={styles.sheetInput}
              placeholder="Amount (e.g. 5000)"
              placeholderTextColor="#8A8A9E"
              keyboardType="decimal-pad"
              value={budgetForm.amount}
              onChangeText={(v) => setBudgetForm({...budgetForm, amount: v})}
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setBudgetModalVisible(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={() => {
                if (!budgetForm.sub_category_id || !budgetForm.amount) return Alert.alert("Wait", "Category and amount are required.");
                setMonthlyBudget({
                  sub_category_id: budgetForm.sub_category_id,
                  amount: parseFloat(budgetForm.amount) || 0,
                  for_month: budgetMonth
                });
                setBudgetModalVisible(false);
              }}>
                <Text style={styles.buttonText}>Save Budget</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Transfer Budget Modal */}
      <Modal visible={transferModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.sheetOverlay}>
          <View style={styles.sheetContent}>
            <Text style={styles.sheetTitle}>Transfer Budget</Text>
            
            <Text style={styles.sheetLabel}>From Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {subCategories.map(cat => (
                <TouchableOpacity 
                  key={cat.id} 
                  style={[styles.pill, transferForm.from_sub_category_id === cat.id && styles.activePill]} 
                  onPress={() => setTransferForm({...transferForm, from_sub_category_id: cat.id})}
                >
                  <Text style={[styles.pillText, transferForm.from_sub_category_id === cat.id && styles.activePillText]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.sheetLabel}>To Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {subCategories.filter(s => s.id !== transferForm.from_sub_category_id).map(cat => (
                <TouchableOpacity 
                  key={cat.id} 
                  style={[styles.pill, transferForm.to_sub_category_id === cat.id && styles.activePill]} 
                  onPress={() => setTransferForm({...transferForm, to_sub_category_id: cat.id})}
                >
                  <Text style={[styles.pillText, transferForm.to_sub_category_id === cat.id && styles.activePillText]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              style={styles.sheetInput}
              placeholder="Amount to Transfer (e.g. 500)"
              placeholderTextColor="#8A8A9E"
              keyboardType="decimal-pad"
              value={transferForm.amount}
              onChangeText={(v) => setTransferForm({...transferForm, amount: v})}
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setTransferModalVisible(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={() => {
                if (!transferForm.from_sub_category_id || !transferForm.to_sub_category_id || !transferForm.amount) {
                   return Alert.alert("Wait", "Please fill all fields.");
                }
                transferBudget({
                  from_sub_category_id: transferForm.from_sub_category_id,
                  to_sub_category_id: transferForm.to_sub_category_id,
                  amount: parseFloat(transferForm.amount) || 0,
                  for_month: budgetMonth
                }).then(() => {
                  setTransferModalVisible(false);
                }).catch(e => {
                  // already handled in useStore
                });
              }}>
                <Text style={styles.buttonText}>Transfer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B14', paddingHorizontal: 24, paddingTop: 24 },
  header: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 30 },
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  addButtonIcon: { backgroundColor: '#1E1E2D', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#1E1E2D', borderRadius: 24, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  emptyText: { color: '#8A8A9E', padding: 8 },
  listItemContainer: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', paddingVertical: 12 },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  actionRow: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { padding: 8, marginLeft: 4 },
  subCatContainer: { paddingLeft: 16, marginTop: 8 },
  subCatRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 4 },
  treeLine: { width: 12, height: 1, backgroundColor: '#8A8A9E', marginRight: 8 },
  subCatText: { color: '#8A8A9E', fontSize: 14, flex: 1 },
  paydayButton: { borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', shadowColor: '#4ADE80', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  paydayText: { color: '#000', fontSize: 18, fontWeight: '900' },
  paydaySubtext: { color: 'rgba(0,0,0,0.6)', fontSize: 13, fontWeight: '600' },
  menuGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  menuGridItem: { alignItems: 'center', width: '30%' },
  menuIconBg: { width: 64, height: 64, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  menuGridText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1E1E2D',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#12121D',
    color: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#2A2A3D',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4ADE80',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheetContent: {
    backgroundColor: '#1E1E2D',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  sheetTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  sheetInput: {
    backgroundColor: '#12121D',
    color: '#fff',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  sheetLabel: {
    color: '#8A8A9E',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 4,
  },
  pill: {
    backgroundColor: '#2A2A3D',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
  },
  activePill: {
    backgroundColor: '#4ADE80',
  },
  pillText: {
    color: '#8A8A9E',
    fontWeight: '600',
  },
  activePillText: {
    color: '#12121D',
  }
});

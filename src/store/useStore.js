import { create } from 'zustand';
import { Alert } from 'react-native';

const BASE_URL = 'https://bpdxcicflehdmrpnrnyl.supabase.co/functions/v1';
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const apiFetch = async (endpoint, options = {}) => {
  const state = useStore.getState();
  const token = state.accessToken || ANON_KEY;
  
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'apikey': ANON_KEY,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.error_description || `HTTP error ${response.status}`);
  }
  return response.json();
};

export const useStore = create((set, get) => ({
  accessToken: null,
  profile: null,
  expenses: [],
  savings: [],
  savingsWithdrawals: [],
  debts: [],
  people: [],
  banks: [],
  masterCategories: [],
  subCategories: [],
  appSettings: null,
  dashboardSummary: null,
  monthlyBudgets: [],
  peopleSummary: [],
  notes: [],
  
  fetchData: async () => {
    try {
      const data = await apiFetch('/get-init-data');
      const peopleSummaryData = await apiFetch('/get-people-summary').catch(() => []);
      
      set({ 
        expenses: data.transactions || [], 
        savingsWithdrawals: data.savings_withdrawals || [],
        debts: data.debts || [],
        people: data.people || [],
        banks: data.bank_accounts || [],
        masterCategories: data.master_categories || [],
        subCategories: data.sub_categories || [],
        appSettings: data.app_settings || null,
        peopleSummary: peopleSummaryData || []
      });
    } catch (e) {
      console.error('Failed to fetch initial data:', e);
    }
  },

  login: async (email, password) => {
    try {
      const response = await fetch('https://bpdxcicflehdmrpnrnyl.supabase.co/auth/v1/token?grant_type=password', {
        method: 'POST',
        headers: {
          'apikey': ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error_description || 'Login failed');
      }
      const data = await response.json();
      set({ accessToken: data.access_token });
      await get().fetchProfile();
      await get().fetchData();
      return true;
    } catch (e) {
      console.error('Login error:', e);
      Alert.alert('Login Failed', e.message);
      return false;
    }
  },

  signup: async (email, password, name, phone) => {
    try {
      const response = await fetch('https://bpdxcicflehdmrpnrnyl.supabase.co/auth/v1/signup', {
        method: 'POST',
        headers: {
          'apikey': ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password,
          data: { name },
          phone
        })
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.msg || 'Signup failed');
      }
      return true;
    } catch (e) {
      console.error('Signup error:', e);
      Alert.alert('Signup Failed', e.message);
      return false;
    }
  },

  recoverPassword: async (email) => {
    try {
      const response = await fetch('https://bpdxcicflehdmrpnrnyl.supabase.co/auth/v1/recover', {
        method: 'POST',
        headers: {
          'apikey': ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.msg || 'Recovery request failed');
      }
      return true;
    } catch (e) {
      console.error('Recover error:', e);
      Alert.alert('Error', e.message);
      return false;
    }
  },

  resetPassword: async (token, newPassword) => {
    try {
      const response = await fetch('https://bpdxcicflehdmrpnrnyl.supabase.co/auth/v1/user', {
        method: 'PUT',
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: newPassword })
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.msg || 'Password reset failed');
      }
      return true;
    } catch (e) {
      console.error('Reset error:', e);
      Alert.alert('Reset Failed', e.message);
      return false;
    }
  },

  fetchProfile: async () => {
    try {
      const profile = await apiFetch('/get-profile');
      set({ profile });
    } catch (e) {
      console.error('Failed to fetch profile:', e);
    }
  },

  updateProfile: async (data) => {
    try {
      const updated = await apiFetch('/update-profile', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      set({ profile: updated });
      Alert.alert('Success', 'Profile updated successfully');
    } catch (e) {
      console.error('Failed to update profile:', e);
      Alert.alert('Error', e.message);
    }
  },

  fetchDashboardSummary: async (month) => {
    try {
      const url = month ? `/get-dashboard-summary?month=${month}` : '/get-dashboard-summary';
      const data = await apiFetch(url);
      set({ dashboardSummary: data });
    } catch (e) {
      console.error('Failed to fetch dashboard summary:', e);
    }
  },

  fetchMonthlyBudgets: async (month) => {
    if (!month) return;
    try {
      const data = await apiFetch(`/get-monthly-budgets?month=${month}`);
      set({ monthlyBudgets: data || [] });
    } catch (e) {
      console.error('Failed to fetch monthly budgets:', e);
    }
  },

  fetchBankSummary: async (bankAccountId, month) => {
    try {
      let url = `/get-bank-summary?bank_account_id=${bankAccountId}`;
      if (month) url += `&month=${month}`;
      return await apiFetch(url);
    } catch (e) {
      console.error('Failed to fetch bank summary:', e);
      throw e;
    }
  },

  fetchBankComparison: async (month) => {
    try {
      let url = '/get-bank-comparison';
      if (month) url += `?month=${month}`;
      return await apiFetch(url);
    } catch (e) {
      console.error('Failed to fetch bank comparison:', e);
      throw e;
    }
  },

  setMonthlyBudget: async (payload) => {
    try {
      await apiFetch('/set-monthly-budget', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      get().fetchData();
      get().fetchDashboardSummary(payload.for_month);
      get().fetchMonthlyBudgets(payload.for_month);
    } catch (e) {
      console.error('Failed to set monthly budget:', e);
    }
  },

  deleteMonthlyBudget: async (id, forMonth) => {
    try {
      await apiFetch('/delete-monthly-budget', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      });
      get().fetchData();
      if (forMonth) {
        get().fetchDashboardSummary(forMonth);
        get().fetchMonthlyBudgets(forMonth);
      }
    } catch (e) {
      console.error('Failed to delete monthly budget:', e);
    }
  },

  updateSettings: async (settingsData) => {
    try {
      const data = await apiFetch('/update-settings', {
        method: 'PUT',
        body: JSON.stringify(settingsData)
      });
      set({ appSettings: data });
    } catch (e) {
      console.error('Failed to update settings:', e);
    }
  },

  fetchSettings: async () => {
    try {
      const data = await apiFetch('/get-settings');
      set({ appSettings: data });
    } catch (e) {
      console.error('Failed to fetch settings:', e);
    }
  },

  addExpense: async (expenseData) => {
    try {
      await apiFetch('/create-transaction', {
        method: 'POST',
        body: JSON.stringify(expenseData),
      });
      // Refresh data after adding
      get().fetchData();
      get().fetchDashboardSummary();
    } catch (e) {
      console.error('Failed to add expense:', e);
      Alert.alert("Error", e.message || "Failed to add expense.");
    }
  },

  importTransactions: async (csvString) => {
    try {
      const result = await apiFetch('/import-transactions', {
        method: 'POST',
        body: JSON.stringify({ csv: csvString })
      });
      get().fetchData();
      get().fetchDashboardSummary();
      return result;
    } catch (e) {
      console.error('Failed to import transactions:', e);
      throw e;
    }
  },

  importTransactionsPDF: async (pickedFile) => {
    try {
      const fileResponse = await fetch(pickedFile.uri);
      const blob = await fileResponse.blob();

      const formData = new FormData();
      formData.append("file", blob, pickedFile.name || 'statement.pdf');

      const response = await fetch(`${BASE_URL}/import-transactions-pdf`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${ANON_KEY}`,
          'apikey': ANON_KEY,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }
      
      const result = await response.json();
      get().fetchData();
      get().fetchDashboardSummary();
      return result;
    } catch (e) {
      console.error('Failed to import PDF transactions:', e);
      throw e;
    }
  },


  addBank: async (bankData) => {
    try {
      await apiFetch('/create-bank-account', {
        method: 'POST',
        body: JSON.stringify(bankData),
      });
      get().fetchData();
    } catch (e) {
      console.error('Failed to add bank account:', e);
    }
  },

  addMasterCategory: async (payload) => {
    try {
      await apiFetch('/create-master-category', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      get().fetchData();
    } catch (e) {
      console.error('Failed to add master category:', e);
    }
  },

  updateMasterCategory: async (data) => {
    try {
      await apiFetch('/update-master-category', { method: 'PUT', body: JSON.stringify(data) });
      get().fetchData();
    } catch (e) { console.error('Failed to update master category:', e); }
  },

  deleteMasterCategory: async (id) => {
    try {
      await apiFetch('/delete-master-category', { method: 'DELETE', body: JSON.stringify({ id }) });
      get().fetchData();
    } catch (e) { console.error('Failed to delete master category:', e); }
  },
  
  addSubCategory: async (categoryData) => {
    try {
      await apiFetch('/create-sub-category', {
        method: 'POST',
        body: JSON.stringify(categoryData),
      });
      get().fetchData();
    } catch (e) {
      console.error('Failed to add sub category:', e);
    }
  },

  updateSubCategory: async (data) => {
    try {
      await apiFetch('/update-sub-category', { method: 'PUT', body: JSON.stringify(data) });
      get().fetchData();
    } catch (e) { console.error('Failed to update sub category:', e); }
  },

  deleteSubCategory: async (id) => {
    try {
      await apiFetch('/delete-sub-category', { method: 'DELETE', body: JSON.stringify({ id }) });
      get().fetchData();
    } catch (e) { console.error('Failed to delete sub category:', e); }
  },

  allocatePayday: async (payload) => {
    try {
      await apiFetch('/allocate-payday', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      get().fetchData();
      get().fetchDashboardSummary();
    } catch (e) {
      console.error('Failed to allocate payday:', e);
      Alert.alert("Error", e.message || "Failed to allocate salary.");
      throw e;
    }
  },

  transferBudget: async (payload) => {
    try {
      await apiFetch('/transfer-budget', { method: 'POST', body: JSON.stringify(payload) });
      get().fetchData();
      get().fetchDashboardSummary(payload.for_month);
      get().fetchMonthlyBudgets(payload.for_month);
    } catch (e) { 
      console.error('Failed to transfer budget:', e); 
      Alert.alert('Error', e.message || 'Failed to transfer budget');
      throw e; 
    }
  },

  updateBankAccount: async (bankData) => {
    try {
      await apiFetch('/update-bank-account', {
        method: 'PUT',
        body: JSON.stringify(bankData),
      });
      get().fetchData();
      get().fetchDashboardSummary();
    } catch (e) {
      console.error('Failed to update bank account:', e);
    }
  },

  deleteBankAccount: async (id) => {
    try {
      await apiFetch('/delete-bank-account', { method: 'DELETE', body: JSON.stringify({ id }) });
      get().fetchData();
      get().fetchDashboardSummary();
    } catch (e) { console.error('Failed to delete bank account:', e); }
  },

  updateExpense: async (expenseData) => {
    try {
      await apiFetch('/update-transaction', {
        method: 'PUT',
        body: JSON.stringify(expenseData),
      });
      get().fetchData();
      get().fetchDashboardSummary();
    } catch (e) {
      console.error('Failed to update transaction:', e);
      Alert.alert("Error", e.message || "Failed to update transaction.");
    }
  },

  deleteExpense: async (id) => {
    try {
      await apiFetch('/delete-transaction', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      });
      get().fetchData();
      get().fetchDashboardSummary();
    } catch (e) {
      console.error('Failed to delete transaction:', e);
    }
  },

  receiveIncome: async (payload) => {
    try {
      await apiFetch('/receive-income', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      get().fetchData();
      get().fetchDashboardSummary(payload.for_month);
      if (payload.for_month) {
        get().fetchMonthlyBudgets(payload.for_month);
      }
    } catch (e) {
      console.error('Failed to log income:', e);
      Alert.alert("Error", e.message || "Failed to log income.");
    }
  },

  contributeSavings: async (contributionData) => {
    try {
      await apiFetch('/contribute-savings', {
        method: 'POST',
        body: JSON.stringify(contributionData),
      });
      get().fetchData();
      get().fetchDashboardSummary();
    } catch (e) {
      console.error('Failed to contribute to savings:', e);
    }
  },

  withdrawSavings: async (data) => {
    try {
      await apiFetch('/withdraw-from-savings', { method: 'POST', body: JSON.stringify(data) });
      get().fetchData();
      get().fetchDashboardSummary();
    } catch (e) { console.error('Failed to withdraw savings:', e); }
  },

  payDebt: async (paymentData) => {
    try {
      await apiFetch('/pay-debt', {
        method: 'PUT',
        body: JSON.stringify(paymentData),
      });
      get().fetchData();
      get().fetchDashboardSummary();
    } catch (e) {
      console.error('Failed to pay debt:', e);
    }
  },

  addDebt: async (debtData) => {
    try {
      await apiFetch('/create-debt', {
        method: 'POST',
        body: JSON.stringify(debtData),
      });
      get().fetchData();
      get().fetchDashboardSummary();
    } catch (e) {
      console.error('Failed to add debt:', e);
    }
  },

  updateDebt: async (debtData) => {
    try {
      await apiFetch('/update-debt', { method: 'PUT', body: JSON.stringify(debtData) });
      get().fetchData();
      get().fetchDashboardSummary();
    } catch (e) { console.error('Failed to update debt:', e); }
  },

  deleteDebt: async (id) => {
    try {
      await apiFetch('/delete-debt', { method: 'DELETE', body: JSON.stringify({ id }) });
      get().fetchData();
      get().fetchDashboardSummary();
    } catch (e) { console.error('Failed to delete debt:', e); }
  },

  // People CRUD
  addPerson: async (data) => {
    try {
      await apiFetch('/create-person', { method: 'POST', body: JSON.stringify(data) });
      get().fetchData();
    } catch (e) { console.error('Failed to add person:', e); }
  },

  updatePerson: async (data) => {
    try {
      await apiFetch('/update-person', { method: 'PUT', body: JSON.stringify(data) });
      get().fetchData();
    } catch (e) { console.error('Failed to update person:', e); }
  },

  deletePerson: async (id) => {
    try {
      await apiFetch('/delete-person', { method: 'DELETE', body: JSON.stringify({ id }) });
      get().fetchData();
    } catch (e) { console.error('Failed to delete person:', e); throw e; }
  },

  // Password Manager API
  passwordEntries: [],
  fetchPasswordEntries: async () => {
    try {
      const data = await apiFetch('/list-password-entries');
      set({ passwordEntries: data || [] });
    } catch (e) {
      console.error('Failed to fetch password entries:', e);
    }
  },

  addPasswordEntry: async (entryData) => {
    try {
      await apiFetch('/create-password-entry', {
        method: 'POST',
        body: JSON.stringify(entryData),
      });
      get().fetchPasswordEntries();
    } catch (e) {
      console.error('Failed to create password entry:', e);
    }
  },

  revealPasswordEntry: async (id) => {
    try {
      const data = await apiFetch('/reveal-password-entry', {
        method: 'POST',
        body: JSON.stringify({ id }),
      });
      return data.password;
    } catch (e) {
      console.error('Failed to reveal password:', e);
      return null;
    }
  },

  updatePasswordEntry: async (entryData) => {
    try {
      await apiFetch('/update-password-entry', {
        method: 'PUT',
        body: JSON.stringify(entryData),
      });
      get().fetchPasswordEntries();
    } catch (e) {
      console.error('Failed to update password entry:', e);
    }
  },

  deletePasswordEntry: async (id) => {
    try {
      await apiFetch('/delete-password-entry', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      });
      get().fetchPasswordEntries();
    } catch (e) {
      console.error('Failed to delete password entry:', e);
    }
  },

  fetchNotes: async () => {
    try {
      const data = await apiFetch('/get-notes');
      set({ notes: data || [] });
    } catch (e) {
      console.error('Failed to fetch notes:', e);
    }
  },
  
  createNote: async (note) => {
    try {
      await apiFetch('/create-note', {
        method: 'POST',
        body: JSON.stringify(note),
      });
      get().fetchNotes();
    } catch (e) {
      console.error('Failed to create note:', e);
    }
  },

  updateNote: async (note) => {
    try {
      await apiFetch('/update-note', {
        method: 'PUT',
        body: JSON.stringify(note),
      });
      get().fetchNotes();
    } catch (e) {
      console.error('Failed to update note:', e);
    }
  },

  deleteNote: async (id) => {
    try {
      await apiFetch('/delete-note', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      });
      get().fetchNotes();
    } catch (e) {
      console.error('Failed to delete note:', e);
    }
  },

}));

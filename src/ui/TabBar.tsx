import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AddTransactionModal from '../components/AddTransactionModal';
import { C, GRAD, alpha } from './theme';

const HIDDEN = ['login', 'signup', 'recover', 'reset-password', 'profile'];
const BANK_ROUTES = ['bank-comparison', 'bank-summary'];
const MAIN = ['index', 'transactions', 'bank-comparison', 'manage'];

const TABS = [
  { route: 'index', label: 'Home', icon: 'home-outline' },
  { route: 'transactions', label: 'Activity', icon: 'list-outline' },
  { route: 'add', label: '', icon: 'add' },
  { route: 'bank-comparison', label: 'Banks', icon: 'business-outline' },
  { route: 'manage', label: 'Menu', icon: 'grid-outline' },
] as const;

export default function TabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const [addVisible, setAddVisible] = useState(false);
  const current = state.routes[state.index]?.name;
  if (HIDDEN.includes(current)) return null;

  const activeKey = MAIN.includes(current) ? current : BANK_ROUTES.includes(current) ? 'bank-comparison' : 'manage';

  return (
    <>
      <View style={[styles.wrap, { bottom: Math.max(insets.bottom, 12) + 4 }]} pointerEvents="box-none">
        <View style={styles.bar}>
          {TABS.map((t) => {
            if (t.route === 'add') {
              return (
                <TouchableOpacity key="add" activeOpacity={0.9} onPress={() => setAddVisible(true)} style={styles.fabWrap}>
                  <LinearGradient colors={GRAD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fab}>
                    <Ionicons name="add" size={30} color={C.onAcc} />
                  </LinearGradient>
                </TouchableOpacity>
              );
            }
            const on = activeKey === t.route;
            return (
              <TouchableOpacity key={t.route} style={styles.tab} activeOpacity={0.8} onPress={() => navigation.navigate(t.route as never)}>
                <View style={[styles.pill, on && { backgroundColor: alpha(C.acc, 0.14) }]}>
                  <Ionicons name={t.icon as any} size={22} color={on ? C.acc : C.dim} />
                </View>
                <Text style={{ fontSize: 10.5, fontWeight: '600', color: on ? C.acc : C.dim }}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      <AddTransactionModal visible={addVisible} onClose={() => setAddVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 14, right: 14 },
  bar: {
    height: 72, borderRadius: 26, backgroundColor: 'rgba(15,21,36,0.96)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', elevation: 14,
    shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 20, shadowOffset: { width: 0, height: 12 },
  },
  tab: { width: 62, alignItems: 'center', gap: 3 },
  pill: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 99 },
  fabWrap: { marginTop: -22, shadowColor: '#0891B2', shadowOpacity: 0.7, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
  fab: { width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});

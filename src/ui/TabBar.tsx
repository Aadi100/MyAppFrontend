import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, FadeInDown } from 'react-native-reanimated';
import AddTransactionModal from '../components/AddTransactionModal';
import { C, F, GRAD } from './theme';

const HIDDEN = ['login', 'signup', 'recover', 'reset-password', 'profile'];
const BANK_ROUTES = ['bank-comparison', 'bank-summary'];
const MAIN = ['index', 'transactions', 'bank-comparison', 'manage'];

// Precomputed outside any worklet: useAnimatedStyle runs on the UI runtime,
// which can't synchronously call plain JS helpers like alpha() — only
// worklet-safe operations (arithmetic, template strings) are allowed there.
const ACC_R = parseInt(C.acc.slice(1, 3), 16);
const ACC_G = parseInt(C.acc.slice(3, 5), 16);
const ACC_B = parseInt(C.acc.slice(5, 7), 16);

const TABS = [
  { route: 'index', label: 'Home', icon: 'home-outline' },
  { route: 'transactions', label: 'Activity', icon: 'list-outline' },
  { route: 'add', label: '', icon: 'add' },
  { route: 'bank-comparison', label: 'Banks', icon: 'business-outline' },
  { route: 'manage', label: 'Menu', icon: 'grid-outline' },
] as const;

function TabItem({ icon, label, on, onPress }: { icon: string; label: string; on: boolean; onPress: () => void }) {
  const lift = useSharedValue(on ? 1 : 0);
  useEffect(() => { lift.set(withSpring(on ? 1 : 0, { damping: 14, stiffness: 180 })); }, [on]);
  const pillStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(${ACC_R},${ACC_G},${ACC_B},${lift.value * 0.14})`,
    transform: [{ scale: 1 + lift.value * 0.08 }],
  }));
  const pressScale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.value }] }));
  return (
    <Pressable
      style={styles.tab}
      onPress={onPress}
      onPressIn={() => { pressScale.set(withTiming(0.88, { duration: 80 })); }}
      onPressOut={() => { pressScale.set(withSpring(1, { damping: 14, stiffness: 220 })); }}>
      <Animated.View style={pressStyle}>
        <Animated.View style={[styles.pill, pillStyle]}>
          <Ionicons name={icon as any} size={22} color={on ? C.acc : C.dim} />
        </Animated.View>
      </Animated.View>
      <Text style={{ fontSize: 10.5, fontFamily: F.semibold, color: on ? C.acc : C.dim }}>{label}</Text>
    </Pressable>
  );
}

function FabButton({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { scale.set(withTiming(0.88, { duration: 80 })); }}
      onPressOut={() => { scale.set(withSpring(1, { damping: 12, stiffness: 240 })); }}
      style={styles.fabWrap}>
      <Animated.View entering={FadeInDown.duration(500).springify()} style={style}>
        <LinearGradient colors={GRAD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fab}>
          <Ionicons name="add" size={30} color={C.onAcc} />
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

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
            if (t.route === 'add') return <FabButton key="add" onPress={() => setAddVisible(true)} />;
            return (
              <TabItem key={t.route} icon={t.icon} label={t.label} on={activeKey === t.route} onPress={() => navigation.navigate(t.route as never)} />
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

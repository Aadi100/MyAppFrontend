import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, ScrollView, KeyboardAvoidingView,
  Platform, Pressable, ActivityIndicator, ViewStyle, TextInputProps, StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Path, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, GRAD, GRAD_DANGER, alpha } from './theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

// ---------- layout ----------
export function Screen({ children, scroll = true, tabPad = true, style, refreshControl }: { children: React.ReactNode; scroll?: boolean; tabPad?: boolean; style?: StyleProp<ViewStyle>; refreshControl?: any }) {
  const insets = useSafeAreaInsets();
  const body = React.useMemo(
    () => ({ paddingTop: insets.top + 10, paddingHorizontal: 20, paddingBottom: tabPad ? 130 : 40 }),
    [insets.top, tabPad],
  );
  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <LinearGradient colors={['rgba(34,211,238,0.14)', 'transparent']} style={styles.glow} pointerEvents="none" />
      {scroll ? (
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="none" contentContainerStyle={[body, style as any]} refreshControl={refreshControl}>
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, body, style]}>{children}</View>
      )}
    </KeyboardAvoidingView>
  );
}

export function Header({ title, onBack, right, big }: { title?: string; onBack?: () => void; right?: React.ReactNode; big?: boolean }) {
  if (big) {
    return (
      <View style={[styles.rowSp, { marginBottom: 14 }]}>
        <Text style={styles.h1}>{title}</Text>
        {right}
      </View>
    );
  }
  return (
    <View style={[styles.rowSp, { marginBottom: 16 }]}>
      {onBack ? (
        <TouchableOpacity style={styles.back} onPress={onBack}><Ionicons name="arrow-back" size={20} color={C.text} /></TouchableOpacity>
      ) : <View style={{ width: 42 }} />}
      <Text style={styles.h2}>{title}</Text>
      {right || <View style={{ width: 42 }} />}
    </View>
  );
}

export const H1 = ({ children, style }: any) => <Text style={[styles.h1, style]}>{children}</Text>;
export const H2 = ({ children, style }: any) => <Text style={[styles.h2, style]}>{children}</Text>;
export const Label = ({ children, style }: any) => <Text style={[styles.lbl, style]}>{children}</Text>;
export const Sub = ({ children, style }: any) => <Text style={[styles.sub, style]}>{children}</Text>;

export function SectionRow({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={[styles.rowSp, { marginTop: 20, marginBottom: 12 }]}>
      <Text style={styles.h2}>{title}</Text>
      {action ? <TouchableOpacity onPress={onAction}><Text style={styles.link}>{action}</Text></TouchableOpacity> : null}
    </View>
  );
}

export function Card({ children, style, pad = 16, onPress }: { children?: React.ReactNode; style?: StyleProp<ViewStyle>; pad?: number; onPress?: () => void }) {
  const inner = (
    <LinearGradient colors={[C.s2, C.s1]} style={[styles.card, { padding: pad }, style]}>
      {children}
    </LinearGradient>
  );
  return onPress ? <TouchableOpacity activeOpacity={0.85} onPress={onPress}>{inner}</TouchableOpacity> : inner;
}

export function Hero({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.hero, style]}>
      <LinearGradient colors={['rgba(34,211,238,0.28)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 0.7, y: 0.7 }} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['transparent', 'rgba(96,165,250,0.18)']} start={{ x: 0.3, y: 0.3 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      {children}
    </View>
  );
}

// ---------- atoms ----------
export function IconBox({ name, color = C.acc, size = 42 }: { name: IconName; color?: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.33, alignItems: 'center', justifyContent: 'center', backgroundColor: alpha(color, 0.15), borderWidth: 1, borderColor: alpha(color, 0.22) }}>
      <Ionicons name={name} size={size * 0.48} color={color} />
    </View>
  );
}

export function Tag({ label, color = C.acc, style }: { label: string; color?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, backgroundColor: alpha(color, 0.14) }, style]}>
      <Text style={{ color, fontSize: 11, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

export function Chip({ label, active, onPress, icon, color = C.acc }: { label: string; active?: boolean; onPress?: () => void; icon?: IconName; color?: string }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[styles.chip, active && { backgroundColor: alpha(color, 0.12), borderColor: alpha(color, 0.45) }]}>
      {icon ? <Ionicons name={icon} size={14} color={active ? color : C.mute} style={{ marginRight: 6 }} /> : null}
      <Text style={{ color: active ? color : C.mute, fontWeight: '600', fontSize: 13 }}>{label}</Text>
    </TouchableOpacity>
  );
}

export function Chips({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{children}</View>;
}

export function Seg({ items, value, onChange, colors }: { items: { key: string; label: string }[]; value: string; onChange: (k: string) => void; colors?: Record<string, string> }) {
  return (
    <View style={styles.seg}>
      {items.map((it) => {
        const on = it.key === value;
        const col = colors?.[it.key];
        return (
          <TouchableOpacity key={it.key} onPress={() => onChange(it.key)} activeOpacity={0.85}
            style={[styles.segItem, on && (col ? { backgroundColor: alpha(col, 0.16), borderColor: alpha(col, 0.4), borderWidth: 1 } : { backgroundColor: C.s3, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' })]}>
            <Text style={{ color: on ? (col || C.text) : C.mute, fontWeight: on ? '700' : '600', fontSize: 13 }}>{it.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function Bar({ pct, color = C.acc, height = 7 }: { pct: number; color?: string; height?: number }) {
  return (
    <View style={{ height, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: '100%', borderRadius: 99, backgroundColor: color }} />
    </View>
  );
}

export function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ marginTop: 14 }, style]}>
      <Text style={[styles.lbl, { marginBottom: 8 }]}>{label}</Text>
      {children}
    </View>
  );
}

export function Input({ icon, right, onRightPress, style, ...rest }: TextInputProps & { icon?: IconName; right?: IconName; onRightPress?: () => void; style?: StyleProp<ViewStyle> }) {
  const [focus, setFocus] = useState(false);
  return (
    <View style={[styles.inp, focus && styles.inpFocus, style]}>
      {icon ? <Ionicons name={icon} size={19} color={focus ? C.acc : C.dim} /> : null}
      <TextInput
        placeholderTextColor={C.dim}
        style={styles.inpText}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        {...rest}
      />
      {right ? <TouchableOpacity onPress={onRightPress} hitSlop={10}><Ionicons name={right} size={19} color={C.dim} /></TouchableOpacity> : null}
    </View>
  );
}

export function PrimaryButton({ title, onPress, icon, loading, disabled, variant = 'primary', style, small }: {
  title: string; onPress?: () => void; icon?: IconName; loading?: boolean; disabled?: boolean; variant?: 'primary' | 'ghost' | 'danger'; style?: StyleProp<ViewStyle>; small?: boolean;
}) {
  const h = small ? 42 : 56;
  const content = (
    <>
      {loading ? <ActivityIndicator color={variant === 'primary' ? C.onAcc : '#fff'} /> : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={variant === 'primary' ? C.onAcc : '#fff'} style={{ marginRight: 8 }} /> : null}
          <Text style={{ color: variant === 'primary' ? C.onAcc : '#fff', fontWeight: '800', fontSize: small ? 14 : 16 }}>{title}</Text>
        </>
      )}
    </>
  );
  if (variant === 'ghost') {
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled || loading} activeOpacity={0.85}
        style={[{ height: h, borderRadius: small ? 14 : 18, backgroundColor: C.s2, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }, style]}>
        {content}
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled || loading} activeOpacity={0.88} style={[{ opacity: disabled ? 0.5 : 1 }, styles.btnShadow, style]}>
      <LinearGradient colors={variant === 'danger' ? GRAD_DANGER : GRAD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ height: h, borderRadius: small ? 14 : 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
        {content}
      </LinearGradient>
    </TouchableOpacity>
  );
}

export function GhostBtn({ icon, danger, onPress, size = 34 }: { icon: IconName; danger?: boolean; onPress?: () => void; size?: number }) {
  return (
    <TouchableOpacity onPress={onPress} hitSlop={6} style={{ width: size, height: size, borderRadius: size * 0.33, backgroundColor: danger ? 'rgba(251,113,133,0.10)' : 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={icon} size={size * 0.46} color={danger ? C.rose : C.mute} />
    </TouchableOpacity>
  );
}

export function AccentIconBtn({ icon, onPress, color = C.acc }: { icon: IconName; onPress?: () => void; color?: string }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: alpha(color, 0.12), alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={icon} size={17} color={color} />
    </TouchableOpacity>
  );
}

export function MonthBar({ label, onPrev, onNext }: { label: string; onPrev: () => void; onNext: () => void }) {
  return (
    <View style={styles.month}>
      <TouchableOpacity onPress={onPrev} style={styles.monthA}><Ionicons name="chevron-back" size={18} color={C.mute} /></TouchableOpacity>
      <Text style={{ color: C.text, fontSize: 15, fontWeight: '700' }}>{label}</Text>
      <TouchableOpacity onPress={onNext} style={styles.monthA}><Ionicons name="chevron-forward" size={18} color={C.mute} /></TouchableOpacity>
    </View>
  );
}

export function EmptyState({ icon, color = C.acc, title, sub, action, onAction }: { icon: IconName; color?: string; title: string; sub?: string; action?: string; onAction?: () => void }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 70, paddingHorizontal: 24 }}>
      <View style={{ width: 112, height: 112, borderRadius: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: alpha(color, 0.1), borderWidth: 1, borderColor: alpha(color, 0.25) }}>
        <Ionicons name={icon} size={48} color={color} />
      </View>
      <Text style={[styles.h2, { fontSize: 22, marginTop: 24, textAlign: 'center' }]}>{title}</Text>
      {sub ? <Text style={[styles.sub, { marginTop: 8, textAlign: 'center', lineHeight: 21 }]}>{sub}</Text> : null}
      {action ? <PrimaryButton title={action} icon="add" onPress={onAction} small style={{ marginTop: 22, paddingHorizontal: 0, minWidth: 170 }} /> : null}
    </View>
  );
}

// ---------- sheets & dialogs ----------
export function Sheet({ visible, onClose, title, children, footer }: { visible: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(2,4,9,0.7)' }]} onPress={onClose} />
        <LinearGradient colors={['#121A2C', '#0B101C']} style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <View style={styles.handle} />
          <View style={[styles.rowSp, { marginBottom: 4 }]}>
            <Text style={[styles.h2, { fontSize: 20 }]}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.close}><Ionicons name="close" size={18} color={C.mute} /></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ maxHeight: 560 }} contentContainerStyle={{ paddingBottom: 6 }}>
            {children}
          </ScrollView>
          {footer ? <View style={{ marginTop: 16 }}>{footer}</View> : null}
        </LinearGradient>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function SheetButtons({ onCancel, onSave, saveLabel = 'Save', cancelLabel = 'Cancel', disabled }: { onCancel: () => void; onSave: () => void; saveLabel?: string; cancelLabel?: string; disabled?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <PrimaryButton title={cancelLabel} variant="ghost" onPress={onCancel} style={{ flex: 1 }} />
      <PrimaryButton title={saveLabel} onPress={onSave} disabled={disabled} style={{ flex: 1.6 }} />
    </View>
  );
}

export function Dialog({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: React.ReactNode }) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(2,4,9,0.74)' }]} onPress={onClose} />
        <LinearGradient colors={['#141D31', '#0C111E']} style={styles.dialog}>{children}</LinearGradient>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function ConfirmDialog({ visible, title, message, confirmLabel = 'Delete', onCancel, onConfirm }: { visible: boolean; title: string; message?: string; confirmLabel?: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <Dialog visible={visible} onClose={onCancel}>
      <View style={{ alignItems: 'center' }}>
        <IconBox name="trash-outline" color={C.rose} size={64} />
        <Text style={[styles.h2, { fontSize: 20, marginTop: 16 }]}>{title}</Text>
        {message ? <Text style={[styles.sub, { marginTop: 8, textAlign: 'center', lineHeight: 21 }]}>{message}</Text> : null}
      </View>
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
        <PrimaryButton title="Cancel" variant="ghost" onPress={onCancel} small style={{ flex: 1, height: 50 }} />
        <PrimaryButton title={confirmLabel} variant="danger" onPress={onConfirm} small style={{ flex: 1 }} />
      </View>
    </Dialog>
  );
}

// ---------- charts ----------
export function Ring({ pct, size = 96, thick = 9, color = C.acc, children }: { pct: number; size?: number; thick?: number; color?: string; children?: React.ReactNode }) {
  const r = (size - thick) / 2;
  const circ = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, pct));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={thick} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={thick} fill="none" strokeLinecap="round"
          strokeDasharray={`${(circ * p) / 100} ${circ}`} rotation={-90} originX={size / 2} originY={size / 2} />
      </Svg>
      {children}
    </View>
  );
}

export function Donut({ segs, size = 108, thick = 15, children }: { segs: { pct: number; color: string }[]; size?: number; thick?: number; children?: React.ReactNode }) {
  const r = (size - thick) / 2;
  const circ = 2 * Math.PI * r;
  const offsets = segs.map((_, i) => segs.slice(0, i).reduce((a, s) => a + s.pct, 0));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.06)" strokeWidth={thick} fill="none" />
        {segs.map((s, i) => {
          const len = (circ * s.pct) / 100;
          return (
            <Circle key={i} cx={size / 2} cy={size / 2} r={r} stroke={s.color} strokeWidth={thick} fill="none"
              strokeDasharray={`${Math.max(0, len - 2)} ${circ}`} strokeDashoffset={-(circ * offsets[i]) / 100} rotation={-90} originX={size / 2} originY={size / 2} />
          );
        })}
      </Svg>
      {children}
    </View>
  );
}

export function Sparkline({ data, width, height = 52, color = C.acc }: { data: number[]; width: number; height?: number; color?: string }) {
  if (!data || data.length < 2) return <View style={{ height }} />;
  const mx = Math.max(...data), mn = Math.min(...data), dx = width / (data.length - 1);
  const pts = data.map((v, i) => [i * dx, height - 6 - ((v - mn) / (mx - mn || 1)) * (height - 14)]);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1];
  return (
    <Svg width={width} height={height}>
      <Defs>
        <SvgGrad id="sg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.35" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </SvgGrad>
      </Defs>
      <Path d={`${d} L${width} ${height} L0 ${height} Z`} fill="url(#sg)" />
      <Path d={d} fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={last[0]} cy={last[1]} r={4.5} fill={color} stroke="#0A101D" strokeWidth={2} />
    </Svg>
  );
}

export function BarChart({ values, labels, highlight, height = 96, color = C.acc }: { values: number[]; labels: string[]; highlight?: number; height?: number; color?: string }) {
  const mx = Math.max(...values, 1);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: height + 22 }}>
      {values.map((v, i) => (
        <View key={i} style={{ flex: 1, alignItems: 'center' }}>
          <View style={{ width: 22, height: Math.max(5, (v / mx) * height), borderRadius: 8, backgroundColor: i === highlight ? color : 'rgba(255,255,255,0.09)' }} />
          <Text style={{ marginTop: 6, fontSize: 10.5, fontWeight: '600', color: i === highlight ? color : C.dim }}>{labels[i]}</Text>
        </View>
      ))}
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  glow: { position: 'absolute', top: 0, left: 0, right: 0, height: 260 },
  rowSp: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row: { flexDirection: 'row', alignItems: 'center' },
  h1: { color: C.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.8 },
  h2: { color: C.text, fontSize: 18, fontWeight: '700', letterSpacing: -0.2 },
  sub: { color: C.mute, fontSize: 14 },
  lbl: { color: C.dim, fontSize: 11, letterSpacing: 1.3, textTransform: 'uppercase', fontWeight: '700' },
  link: { color: C.acc, fontSize: 13, fontWeight: '700' },
  card: { borderRadius: 22, borderWidth: 1, borderColor: C.line },
  hero: { borderRadius: 28, padding: 20, borderWidth: 1, borderColor: 'rgba(34,211,238,0.22)', backgroundColor: '#0C1424', overflow: 'hidden' },
  back: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.s2, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 99, backgroundColor: C.s2, borderWidth: 1, borderColor: C.line },
  seg: { flexDirection: 'row', backgroundColor: C.s1, borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 4 },
  segItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: 'transparent' },
  inp: { height: 54, borderRadius: 16, backgroundColor: C.s1, borderWidth: 1, borderColor: C.line, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16 },
  inpFocus: { borderColor: 'rgba(34,211,238,0.6)', backgroundColor: '#0F1A2B' },
  inpText: { flex: 1, color: C.text, fontSize: 15, fontWeight: '500', padding: 0 },
  btnShadow: { shadowColor: '#0891B2', shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  month: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.s1, borderWidth: 1, borderColor: C.line, borderRadius: 18, padding: 6 },
  monthA: { width: 36, height: 36, borderRadius: 12, backgroundColor: C.s2, alignItems: 'center', justifyContent: 'center' },
  sheet: { borderTopLeftRadius: 30, borderTopRightRadius: 30, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 20, paddingTop: 10 },
  handle: { width: 42, height: 5, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.18)', alignSelf: 'center', marginBottom: 16 },
  close: { width: 34, height: 34, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  dialog: { borderRadius: 30, padding: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
});

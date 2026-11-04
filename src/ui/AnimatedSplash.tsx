import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import Svg, { Circle, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSpring, withTiming } from 'react-native-reanimated';
import { C, F } from './theme';

// Keep the native splash up until this screen has laid out, so the hand-off from the native
// splash (same background, same centred logo) to this animated one is seamless.
SplashScreen.preventAutoHideAsync().catch(() => {});

const MIN_MS = 1800;
const RING = 230;
const R = 108;
const CIRC = 2 * Math.PI * R;

export default function AnimatedSplash({ ready = true, onDone }: { ready?: boolean; onDone: () => void }) {
  const [minElapsed, setMinElapsed] = useState(false);
  const [dots, setDots] = useState('');
  const leaving = useRef(false);

  const intro = useSharedValue(0);
  const spin = useSharedValue(0);
  const breathe = useSharedValue(0);
  const slide = useSharedValue(0);
  const fade = useSharedValue(1);

  useEffect(() => {
    intro.set(withSpring(1, { damping: 13, stiffness: 120 }));
    spin.set(withRepeat(withTiming(1, { duration: 1300, easing: Easing.linear }), -1));
    breathe.set(withRepeat(withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }), -1, true));
    slide.set(withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.cubic) }), -1));
    const t = setTimeout(() => setMinElapsed(true), MIN_MS);
    const d = setInterval(() => setDots((s) => (s.length >= 3 ? '' : s + '.')), 380);
    return () => { clearTimeout(t); clearInterval(d); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready || !minElapsed || leaving.current) return;
    leaving.current = true;
    fade.set(withTiming(0, { duration: 380, easing: Easing.out(Easing.cubic) }));
    const t = setTimeout(onDone, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, minElapsed]);

  const rootStyle = useAnimatedStyle(() => ({ opacity: fade.value }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, intro.value * 1.4),
    transform: [{ scale: (0.82 + 0.18 * intro.value) * (1 + breathe.value * 0.035) }],
  }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: 0.14 + breathe.value * 0.22 }));
  const ringStyle = useAnimatedStyle(() => ({ opacity: intro.value, transform: [{ rotate: `${spin.value * 360}deg` }] }));
  const barStyle = useAnimatedStyle(() => ({ transform: [{ translateX: slide.value * 230 - 80 }] }));
  const textStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, intro.value) }));

  return (
    <Animated.View style={[styles.root, rootStyle]} pointerEvents="auto"
      onLayout={() => { SplashScreen.hideAsync().catch(() => {}); }}>
      <View style={styles.stage}>
        <Animated.View style={[styles.glow, glowStyle]} />
        <Animated.View style={[StyleSheet.absoluteFill, styles.center, ringStyle]}>
          <Svg width={RING} height={RING}>
            <Defs>
              <SvgGrad id="arc" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#67E8F9" stopOpacity="1" />
                <Stop offset="1" stopColor="#0891B2" stopOpacity="0.15" />
              </SvgGrad>
            </Defs>
            <Circle cx={RING / 2} cy={RING / 2} r={R} stroke="rgba(255,255,255,0.06)" strokeWidth={3} fill="none" />
            <Circle cx={RING / 2} cy={RING / 2} r={R} stroke="url(#arc)" strokeWidth={4} fill="none" strokeLinecap="round"
              strokeDasharray={`${CIRC * 0.3} ${CIRC}`} />
          </Svg>
        </Animated.View>
        <Animated.View style={logoStyle}>
          <Image source={require('../../assets/images/adion-mark.png')} style={styles.logo} contentFit="contain" />
        </Animated.View>
      </View>

      <Animated.View style={[styles.bottom, textStyle]}>
        <Text style={styles.brand}>ADION</Text>
        <View style={styles.track}>
          <Animated.View style={[styles.bar, barStyle]} />
        </View>
        <Text style={styles.loading}>Loading{dots}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, backgroundColor: '#070A11', zIndex: 10000, alignItems: 'center', justifyContent: 'center' },
  stage: { width: RING, height: RING, alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: 190, height: 190, borderRadius: 95, backgroundColor: C.acc },
  logo: { width: 160, height: 160 },
  bottom: { position: 'absolute', bottom: 110, alignItems: 'center', gap: 16 },
  brand: { color: C.text, fontSize: 22, letterSpacing: 9, fontFamily: F.bold },
  track: { width: 150, height: 4, borderRadius: 4, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.08)' },
  bar: { width: 80, height: 4, borderRadius: 4, backgroundColor: C.acc },
  loading: { color: C.mute, fontSize: 13, fontFamily: F.medium, width: 80, textAlign: 'center' },
});

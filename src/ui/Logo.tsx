import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { C } from './theme';

export default function Logo({ size = 76 }: { size?: number }) {
  return (
    <View style={{ shadowColor: '#22D3EE', shadowOpacity: 0.6, shadowRadius: 20, shadowOffset: { width: 0, height: 14 }, elevation: 12 }}>
      <LinearGradient colors={['#67E8F9', '#0E7490']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ width: size, height: size, borderRadius: size * 0.34, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="wallet-outline" size={size * 0.5} color={C.onAcc} />
      </LinearGradient>
    </View>
  );
}

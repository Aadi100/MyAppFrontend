import React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';

export default function Logo({ size = 96 }: { size?: number }) {
  return (
    <View style={{ shadowColor: '#22D3EE', shadowOpacity: 0.55, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 12 }}>
      <Image source={require('../../assets/images/adion-mark.png')} style={{ width: size, height: size }} contentFit="contain" />
    </View>
  );
}

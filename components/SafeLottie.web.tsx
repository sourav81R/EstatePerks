import React from 'react';
import { View, Text } from 'react-native';

/** 
 * Web version of SafeLottie.
 * Bypasses lottie-react-native to avoid bundling errors on web.
 */
export default function SafeLottie(props: any) {
  return (
    <View style={[{ justifyContent: 'center', alignItems: 'center' }, props.style]}>
      <Text style={{ color: '#94a3b8', fontSize: 14, fontWeight: '600' }}>
        3D Preview (Mobile Only)
      </Text>
    </View>
  );
}
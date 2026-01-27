import React from 'react';
import { View, StyleSheet } from 'react-native';
import PropertyMap from '../components/PropertyMap';

export default function ExploreScreen() {
  return (
    <View style={styles.container}>
      <PropertyMap />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropertyMap from '../components/PropertyMap';

export default function ExploreScreen() {
  const [isHeatmapVisible, setIsHeatmapVisible] = useState(false);

  return (
    <View style={styles.container}>
      <PropertyMap showHeatmap={isHeatmapVisible} />

      {/* Heatmap Controls */}
      <View style={styles.overlayContainer}>
        <TouchableOpacity 
          style={[styles.heatmapToggle, isHeatmapVisible && styles.heatmapToggleActive]}
          onPress={() => setIsHeatmapVisible(!isHeatmapVisible)}
        >
          <Ionicons name="flame" size={20} color={isHeatmapVisible ? "#fff" : "#ef4444"} />
          <Text style={[styles.heatmapToggleText, isHeatmapVisible && { color: '#fff' }]}>
            {isHeatmapVisible ? "Hide Heatmap" : "Price Heatmap"}
          </Text>
        </TouchableOpacity>

        {isHeatmapVisible && (
          <View style={styles.legendCard}>
            <Text style={styles.legendTitle}>Avg. Price / sqft</Text>
            <View style={styles.legendGradient} />
            <View style={styles.legendLabels}>
              <Text style={styles.legendText}>₹15k (Low)</Text>
              <Text style={styles.legendText}>₹80k+ (High)</Text>
            </View>
            <Text style={styles.zoomHint}>Zoom in for micro-market data</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlayContainer: { position: 'absolute', top: 60, right: 20, alignItems: 'flex-end', gap: 12 },
  heatmapToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  heatmapToggleActive: { backgroundColor: '#ef4444' },
  heatmapToggleText: { color: '#0f172a', fontWeight: '700', fontSize: 14 },
  legendCard: { backgroundColor: 'rgba(15, 23, 42, 0.9)', padding: 12, borderRadius: 16, width: 180, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  legendTitle: { color: '#fff', fontSize: 11, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase' },
  legendGradient: { height: 8, borderRadius: 4, backgroundColor: 'red', marginBottom: 6, backgroundImage: 'linear-gradient(to right, #22c55e, #fbbf24, #ef4444)' } as any,
  legendLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  legendText: { color: '#94a3b8', fontSize: 10, fontWeight: '600' },
  zoomHint: { color: '#22d3ee', fontSize: 9, fontWeight: '700', marginTop: 8, textAlign: 'center' },
});
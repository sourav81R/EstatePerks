import React from 'react';
import { View, Text, Alert, Platform, StyleSheet, TouchableOpacity } from 'react-native';
import PrimaryButton from '../../components/PrimaryButton';
import { useVisit } from '../../context/VisitContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useRootNavigationState } from 'expo-router';

export default function ScheduleScreen() {
  const visitContext = useVisit();
  const addVisit = visitContext && 'addVisit' in visitContext ? (visitContext as any).addVisit : undefined;
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const params = useLocalSearchParams<{ propertyName: string }>();
  const propertyName = (Array.isArray(params.propertyName) ? params.propertyName[0] : params.propertyName ?? '').trim();
  const displayTitle = propertyName ? `Tour ${propertyName}` : 'Schedule Your Visit';

  const handleConfirm = () => {
    // Generate a more robust unique ID
    const visitId = `vst_${Math.random().toString(36).slice(2, 11)}_${Date.now().toString(36)}`;
    
    if (addVisit) {
      addVisit({
        id: visitId,
        name: propertyName || 'Property Tour',
        date: new Date().toISOString(),
      });
    }

    // Ensure navigation is ready before replacing the route
    if (!navigationState?.key) return;

    if (Platform.OS === 'web') {
      window.alert('Success: Visit scheduled! +500 points 🎉');
      router.replace('/rewards');
    } else {
      Alert.alert('Visit Confirmed', 'You earned +500 points! 🎉', [
        { 
          text: 'View Rewards', 
          onPress: () => router.replace('/rewards'),
          style: 'default' 
        },
        { text: 'Done', onPress: () => router.back() }
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.closeButton} 
        onPress={() => router.back()}
      >
        <Ionicons name="close" size={28} color="#94a3b8" />
      </TouchableOpacity>

      <View style={styles.iconContainer}>
        <Ionicons name="calendar" size={64} color="#22d3ee" />
      </View>

      <Text style={styles.title}>{displayTitle}</Text>
      <Text style={styles.subtitle}>
        Confirm your appointment to tour the property and earn loyalty points.
      </Text>

      <PrimaryButton
        title="Confirm Appointment"
        onPress={handleConfirm}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    padding: 8,
  },
  iconContainer: {
    marginBottom: 32,
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    padding: 30,
    borderRadius: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
});

import React from 'react';
import { View, Text, Alert, Platform } from 'react-native';
import PrimaryButton from '../../components/PrimaryButton';
import { useVisit } from '../../context/VisitContext';

export default function ScheduleScreen() {
  const { addVisit } = useVisit();

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 12 }}>
        Schedule Visit
      </Text>

      <PrimaryButton
        title="Confirm Visit"
        onPress={() => {
          addVisit({
            id: Date.now().toString(36) + Math.random().toString(36).substring(2),
            name: 'Scheduled Visit',
            date: new Date().toISOString()
          });
          if (Platform.OS === 'web') {
            alert('Success: Visit scheduled! +10 points 🎉');
          } else {
            Alert.alert('Success', 'Visit scheduled! +10 points 🎉');
          }
        }}
      />
    </View>
  );
}

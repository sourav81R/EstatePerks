import { View, Text } from 'react-native';
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
          addVisit({ date: new Date().toISOString() });
          alert('Visit scheduled! +10 points 🎉');
        }}
      />
    </View>
  );
}

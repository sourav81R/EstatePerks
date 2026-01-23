import { View, Text, StyleSheet } from 'react-native';
import { useVisit } from '../context/VisitContext';

export default function RewardsScreen() {
  const { points, visits } = useVisit();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Rewards</Text>

      <View style={styles.card}>
        <Text style={styles.points}>{points}</Text>
        <Text style={styles.label}>Reward Points</Text>
      </View>

      <Text>Visits Scheduled: {visits.length}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#16a34a',
    padding: 30,
    borderRadius: 12,
    marginVertical: 20,
    alignItems: 'center',
  },
  points: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  label: {
    color: '#e5e7eb',
  },
});

import { View, Text, StyleSheet } from 'react-native';

export default function RewardsBadge({ points }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{points} Points</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#16a34a',
    padding: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  text: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

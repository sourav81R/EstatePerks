import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { useRef } from 'react';

export default function PropertyCard({ item, onPress }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        activeOpacity={0.9}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <Image
          source={{ uri: item.image }}
          style={styles.image}
        />

        <View style={styles.content}>
          <View style={styles.row}>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.price}>₹ {item.price}</Text>
          </View>

          <Text style={styles.location}>{item.location}</Text>

          <Text style={styles.cta}>View Details →</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',

    // Shadow (web + mobile)
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  image: {
    height: 180,
    width: '100%',
  },
  content: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16a34a',
  },
  location: {
    marginTop: 6,
    color: '#6b7280',
  },
  cta: {
    marginTop: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
});

import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import PrimaryButton from '../../components/PrimaryButton';
import { fetchProperties } from '../../services/api';

export default function PropertyDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProperty = async () => {
      try {
        const data = await fetchProperties();
        const found = data.find((p) => p.id === id);
        setProperty(found || null);
      } catch (e) {
        setProperty(null);
      } finally {
        setLoading(false);
      }
    };

    loadProperty();

    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      useNativeDriver: true,
    }).start();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <Text>Loading property...</Text>
      </View>
    );
  }

  if (!property) {
    return (
      <View style={styles.loading}>
        <Text>Property not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 3D Animated Image (Web + Mobile Safe) */}
      <Animated.View
        style={[
          styles.imageWrapper,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Image
          source={{ uri: property.image }}
          style={styles.image}
          resizeMode="cover"
        />
      </Animated.View>

      {/* Property Content */}
      <View style={styles.content}>
        <Text style={styles.title}>{property.name}</Text>
        <Text style={styles.type}>{property.type}</Text>

        <Text style={styles.price}>₹ {property.price}</Text>
        <Text style={styles.location}>{property.location}</Text>

        <Text style={styles.description}>
          {property.description}
        </Text>

        <PrimaryButton
          title="Schedule Visit"
          onPress={() => router.push('/schedule')}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },

  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 🔑 Web + Mobile Image Wrapper
  imageWrapper: {
    width: '100%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },

  image: {
    width: '100%',
    height: 320,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },

  content: {
    padding: 20,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },

  type: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
    marginBottom: 10,
  },

  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#16a34a',
    marginBottom: 6,
  },

  location: {
    color: '#6b7280',
    marginBottom: 14,
  },

  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
    marginBottom: 20,
  },
});

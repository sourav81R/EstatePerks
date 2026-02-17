import React from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { PROPERTIES_DATA } from '../constants/propertiesData';

const INDIA_FALLBACK_REGION = {
  latitude: 20.5937,
  longitude: 78.9629,
  latitudeDelta: 10.5,
  longitudeDelta: 10.5,
};

interface PropertyMapProps {
  latitude?: number;
  longitude?: number;
  showHeatmap?: boolean;
}

function parsePriceValue(price: string): number {
  const normalized = price.replace(/,/g, '').toLowerCase();
  const amountMatch = normalized.match(/([\d.]+)/);
  if (!amountMatch) return 0;

  const amount = Number(amountMatch[1]);
  if (!Number.isFinite(amount)) return 0;

  if (normalized.includes('cr')) return amount * 10_000_000;
  if (normalized.includes('lac') || normalized.includes('lakh')) return amount * 100_000;
  if (normalized.includes('k')) return amount * 1_000;
  return amount;
}

function getHeatmapColor(value: number, min: number, max: number): string {
  if (!Number.isFinite(value)) return '#22d3ee';
  if (max <= min) return '#f59e0b';

  const ratio = (value - min) / (max - min);
  if (ratio < 0.33) return '#22c55e';
  if (ratio < 0.66) return '#f59e0b';
  return '#ef4444';
}

export default function PropertyMap({ latitude, longitude, showHeatmap = false }: PropertyMapProps) {
  const router = useRouter();

  const properties = React.useMemo(
    () =>
      Object.entries(PROPERTIES_DATA)
        .map(([id, data]) => ({
          id,
          ...data,
          priceValue: parsePriceValue(String(data?.price || '')),
        }))
        .filter(
          (property) =>
            Number.isFinite(property?.coordinates?.latitude) &&
            Number.isFinite(property?.coordinates?.longitude)
        ),
    []
  );

  const region = React.useMemo(() => {
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      return {
        latitude: Number(latitude),
        longitude: Number(longitude),
        latitudeDelta: 0.25,
        longitudeDelta: 0.25,
      };
    }

    if (!properties.length) {
      return INDIA_FALLBACK_REGION;
    }

    const lats = properties.map((property) => property.coordinates.latitude);
    const lngs = properties.map((property) => property.coordinates.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max((maxLat - minLat) * 1.6, 0.4),
      longitudeDelta: Math.max((maxLng - minLng) * 1.6, 0.4),
    };
  }, [latitude, longitude, properties]);

  const priceRange = React.useMemo(() => {
    if (!properties.length) return { min: 0, max: 0 };
    const values = properties
      .map((property) => Number(property.priceValue))
      .filter((value) => Number.isFinite(value) && value > 0);
    if (!values.length) return { min: 0, max: 0 };
    return {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }, [properties]);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={region}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        showsUserLocation
      >
        {properties.map((property) => (
          <Marker
            key={property.id}
            coordinate={property.coordinates}
            onCalloutPress={() => router.push(`/property/${property.id}`)}
            tracksViewChanges={false}
          >
            <View
              style={[
                styles.priceTag,
                showHeatmap
                  ? { backgroundColor: getHeatmapColor(property.priceValue, priceRange.min, priceRange.max) }
                  : null,
              ]}
            >
              <Text style={styles.priceText}>{property.price}</Text>
            </View>
            <Callout tooltip>
              <View style={styles.calloutWrapper}>
                <Image source={{ uri: property.image }} style={styles.calloutImage} contentFit="cover" />
                <Text style={styles.calloutTitle}>{property.name}</Text>
                <Text style={styles.calloutPrice}>{property.price}</Text>
                <Text style={styles.calloutSubtitle}>{'View Details ->'}</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  priceTag: {
    backgroundColor: '#22d3ee',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
      },
    }),
  },
  priceText: {
    color: '#020617',
    fontWeight: 'bold',
    fontSize: 12,
  },
  calloutWrapper: {
    backgroundColor: '#0f172a',
    padding: 10,
    borderRadius: 16,
    width: 200,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  calloutImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#e5e7eb',
  },
  calloutPrice: {
    color: '#22d3ee',
    fontWeight: '600',
    fontSize: 13,
    marginTop: 2,
  },
  calloutSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
});

import React from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { PROPERTIES_DATA } from '../constants/propertiesData';

const INITIAL_REGION = {
  latitude: 34.0522,
  longitude: -118.2437,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

interface PropertyMapProps {
  latitude?: number;
  longitude?: number;
}

export default function PropertyMap({ latitude, longitude }: PropertyMapProps) {
  const router = useRouter();

  const properties = React.useMemo(() => 
    Object.entries(PROPERTIES_DATA).map(([id, data]) => ({
      id,
      ...data,
    })).filter(p => p.coordinates),
  []);

  const region = React.useMemo(() => (
    latitude && longitude 
      ? { ...INITIAL_REGION, latitude, longitude }
      : INITIAL_REGION
  ), [latitude, longitude]);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={region}
        region={region}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        showsUserLocation
      >
        {properties.map((property) => (
          <Marker 
            key={property.id} 
            coordinate={property.coordinates!}
            onCalloutPress={() => 
              router.push(`/property/${property.id}`)
            }
            tracksViewChanges={false}
          >
            <View style={styles.priceTag}>
              <Text style={styles.priceText}>{property.price}</Text>
            </View>
            <Callout tooltip>
              <View style={styles.calloutWrapper}>
                <Image 
                  source={{ uri: property.image }} 
                  style={styles.calloutImage} 
                  contentFit="cover"
                />
                <Text style={styles.calloutTitle}>{property.name}</Text>
                <Text style={styles.calloutPrice}>{property.price}</Text>
                <Text style={styles.calloutSubtitle}>View Details →</Text>
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
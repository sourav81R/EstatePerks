import React from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';

const INITIAL_REGION = {
  latitude: 34.0522,
  longitude: -118.2437,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const MOCK_PROPERTIES = [
  { 
    id: '1', 
    name: 'Modern Loft', 
    price: '₹ 1.25 Cr', 
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
    coordinate: { latitude: 34.0522, longitude: -118.2437 } 
  },
  { 
    id: '2', 
    name: 'Sunset Villa', 
    price: '₹ 2.10 Cr', 
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750',
    coordinate: { latitude: 34.0622, longitude: -118.2537 } 
  },
  { 
    id: '3', 
    name: 'Green Residency',
    price: '₹ 45 Lakhs', 
    image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb',
    coordinate: { latitude: 22.5726, longitude: 88.3639 } 
  },
  { 
    id: '4', 
    name: 'Goa Palms Villa', 
    price: '₹ 45 Lakhs', 
    image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb',
    coordinate: { latitude: 15.2993, longitude: 73.9815 } 
  },
];

interface PropertyMapProps {
  latitude?: number;
  longitude?: number;
}

export default function PropertyMap({ latitude, longitude }: PropertyMapProps) {
  const router = useRouter();

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
        {MOCK_PROPERTIES.map((property) => (
          <Marker 
            key={property.id} 
            coordinate={property.coordinate}
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
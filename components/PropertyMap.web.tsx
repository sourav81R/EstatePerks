import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { PROPERTIES_DATA } from '../constants/propertiesData';

const INDIA_FALLBACK = {
  latitude: 20.5937,
  longitude: 78.9629,
};

interface PropertyMapProps {
  latitude?: number;
  longitude?: number;
  showHeatmap?: boolean;
}

export default function PropertyMap({ latitude, longitude }: PropertyMapProps) {
  const properties = React.useMemo(
    () =>
      Object.entries(PROPERTIES_DATA)
        .map(([id, data]) => ({ id, ...data }))
        .filter(
          (property) =>
            Number.isFinite(property?.coordinates?.latitude) &&
            Number.isFinite(property?.coordinates?.longitude)
        ),
    []
  );

  const center = React.useMemo(() => {
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      return {
        latitude: Number(latitude),
        longitude: Number(longitude),
        zoom: 14,
      };
    }

    if (!properties.length) {
      return {
        ...INDIA_FALLBACK,
        zoom: 5,
      };
    }

    const lats = properties.map((property) => property.coordinates.latitude);
    const lngs = properties.map((property) => property.coordinates.longitude);
    return {
      latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
      longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
      zoom: 5,
    };
  }, [latitude, longitude, properties]);

  const mapUrl = `https://maps.google.com/maps?q=${center.latitude},${center.longitude}&z=${center.zoom}&output=embed`;

  const handleOpenPropertyMap = React.useCallback((property: any) => {
    const query = encodeURIComponent(`${property.name}, ${property.location}`);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    Linking.openURL(url).catch(() => undefined);
  }, []);

  return (
    <View style={styles.container}>
      <iframe
        src={mapUrl}
        width="100%"
        height="100%"
        style={styles.frame as any}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Property Explorer Map"
      />
      <View style={styles.listCard}>
        <Text style={styles.listTitle}>Property Locations</Text>
        {properties.slice(0, 6).map((property) => (
          <Pressable key={property.id} onPress={() => handleOpenPropertyMap(property)} style={styles.locationRow}>
            <Text numberOfLines={1} style={styles.locationName}>{property.name}</Text>
            <Text style={styles.openMapText}>Open Map</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    padding: 8,
  },
  frame: {
    border: 0,
    borderRadius: 12,
  },
  listCard: {
    position: 'absolute',
    left: 16,
    bottom: 16,
    width: 280,
    maxWidth: '90%',
    borderRadius: 12,
    backgroundColor: 'rgba(2, 6, 23, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
    padding: 10,
    gap: 8,
  },
  listTitle: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  locationName: {
    flex: 1,
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600',
  },
  openMapText: {
    color: '#22d3ee',
    fontSize: 11,
    fontWeight: '700',
  },
});

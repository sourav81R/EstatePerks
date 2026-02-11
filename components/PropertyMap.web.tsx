import React from 'react';
import { StyleSheet, View } from 'react-native';

/**
 * Web implementation for PropertyMap.
 * Uses an iframe to provide a functional map view on the web platform.
 */
interface PropertyMapProps {
  latitude?: number;
  longitude?: number;
  name?: string;
  showHeatmap?: boolean;
}

export default function PropertyMap({ latitude, longitude, name }: PropertyMapProps) {
  // Default to LA if no coordinates provided, otherwise use dynamic location
  const lat = latitude ?? 34.0522;
  const lng = longitude ?? -118.2437;
  
  const mapUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=14&output=embed`;

  return (
    <View style={styles.container}>
      <iframe
        src={mapUrl}
        width="100%"
        height="100%"
        style={{ border: 0, borderRadius: 12 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Property Explorer Map"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    padding: 8,
  },
});

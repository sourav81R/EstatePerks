import { View, FlatList, StyleSheet, Text, TextInput, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter, useRootNavigationState } from 'expo-router';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import PropertyCard from '../components/PropertyCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchProperties } from '../services/api';
import { useAuth } from '../context/AuthContext';

type Property = {
  id: string | number;
  name: string;
  location: string;
  price: string;
  image: string;
  type: string;
  description: string;
};

const CATEGORIES = ['All', 'Apartment', 'Villa', 'Studio', 'Penthouse'];

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const loadProperties = async () => {
      try {
        const data = await fetchProperties();
        setProperties(Array.isArray(data) ? data : []);
        setFilteredProperties(Array.isArray(data) ? data : []);
      } catch {
        setProperties([]);
        setFilteredProperties([]);
      } finally {
        setLoading(false);
      }
    };
    loadProperties();
  }, []);

  useEffect(() => {
    const filtered = properties.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        activeCategory === 'All' ||
        p.type.toLowerCase() === activeCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });

    setFilteredProperties(filtered);
  }, [searchQuery, activeCategory, properties]);

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredProperties}
        keyExtractor={(item, index) => item.id?.toString() ?? index.toString()}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <Animated.View entering={FadeInDown.duration(600)}>
              <Text style={styles.title}>Featured Properties</Text>
            </Animated.View>

            {/* Search */}
            <View style={styles.searchSection}>
              <Ionicons name="search" size={20} color="#94a3b8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by location or name..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Categories */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {CATEGORIES.map((cat, index) => (
                <Animated.View key={cat} entering={FadeInRight.delay(index * 100)}>
                  <TouchableOpacity
                    onPress={() => setActiveCategory(cat)}
                    style={[
                      styles.categoryChip,
                      activeCategory === cat && styles.activeCategoryChip,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        activeCategory === cat && styles.activeCategoryText,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </ScrollView>
          </View>
        }
        renderItem={({ item }) => (
          <PropertyCard
            item={item}
            onPress={() => {
              if (navigationState?.key) {
                router.push({
                  pathname: '/property/[id]',
                  params: { id: item.id },
                } as any);
              }
            }}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    paddingHorizontal: 20,
  },
  headerContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e5e7eb',
    marginBottom: 20,
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#e5e7eb',
    fontSize: 15,
  },
  categoriesScroll: {
    marginBottom: 10,
    marginHorizontal: -20,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  activeCategoryChip: {
    backgroundColor: '#22d3ee',
    borderColor: '#22d3ee',
  },
  categoryText: {
    color: '#94a3b8',
    fontWeight: '600',
  },
  activeCategoryText: {
    color: '#020617',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#22d3ee',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: {
    color: '#020617',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

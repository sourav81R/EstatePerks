import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Platform, ScrollView, useWindowDimensions, KeyboardAvoidingView, Pressable, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, interpolateColor } from 'react-native-reanimated';
import { PROPERTIES_DATA } from '../constants/propertiesData';

const TESTIMONIALS = [
  {
    id: '1',
    name: 'Vikram Malhotra',
    location: 'Bangalore',
    comment: 'Found my dream villa in Indiranagar through EstatePerks. The virtual tour was a game changer!',
    rating: 5,
  },
  {
    id: '2',
    name: 'Sneha Kapoor',
    location: 'Mumbai',
    comment: 'The AI investment score helped me make a confident decision. Highly recommend for serious buyers.',
    rating: 5,
  },
  {
    id: '3',
    name: 'Arjun Reddy',
    location: 'Hyderabad',
    comment: 'Seamless experience from search to site visit. The rewards program is a nice touch!',
    rating: 4,
  },
];

const QUICK_REPLIES = [
  "How to book a visit?",
  "Check loan eligibility",
  "Price trends",
  "Contact agent"
];

const TRENDING_LOCALITIES = [
  { id: '1', name: 'Indiranagar', icon: 'business' },
  { id: '2', name: 'Bandra', icon: 'boat' },
  { id: '3', name: 'Hitech City', icon: 'code-working' },
  { id: '4', name: 'Koregaon', icon: 'leaf' },
  { id: '5', name: 'Whitefield', icon: 'construct' },
  { id: '6', name: 'Powai', icon: 'water' },
];

const ShimmerChar = ({ char, index, total, isAccent, baseStyle }: { char: string, index: number, total: number, isAccent: boolean, baseStyle: any }) => {
  const shimmerValue = useSharedValue(0);

  useEffect(() => {
    shimmerValue.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const baseColor = isAccent ? '#fbbf24' : '#ffffff';
    const offset = index / total;
    const color = interpolateColor(
      (shimmerValue.value + offset) % 1,
      [0, 0.1, 0.2, 1],
      [baseColor, '#fff', baseColor, baseColor]
    );
    return { color };
  });

  return (
    <Animated.Text style={[baseStyle, isAccent && styles.highlight, { letterSpacing: 0, marginLeft: index === 0 ? 0 : -1 }, animatedStyle]}>
      {char}
    </Animated.Text>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  
  const isLargeScreen = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isMobile = width < 768;
  const isSmallMobile = width < 380;
  const numColumns = isLargeScreen ? 3 : isTablet ? 2 : 1;

  const flatListRef = useRef<FlatList>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  const { view } = useLocalSearchParams<{ view?: string }>();
  const isPropertiesView = view === 'properties';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All');
  const [sortBy, setSortBy] = useState('default');
  const [selectedBHK, setSelectedBHK] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedIntent, setSelectedIntent] = useState('Buy');
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [isAboutModalVisible, setIsAboutModalVisible] = useState(false);
  const [isCareersModalVisible, setIsCareersModalVisible] = useState(false);
  const [isPrivacyModalVisible, setIsPrivacyModalVisible] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = () => {
    if (!newsletterEmail.trim() || !newsletterEmail.includes('@')) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }
    setIsSubscribed(true);
    setNewsletterEmail('');
    setTimeout(() => setIsSubscribed(false), 5000);
  };

  const [isTermsModalVisible, setIsTermsModalVisible] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { id: '1', text: "Hi there! 👋 Welcome to EstatePerks support. How can we assist you with your property search today?", sender: 'ai' }
  ]);
  const [chatInput, setChatInput] = useState('');

  const handleSendMessage = (text?: string) => {
    const messageText = typeof text === 'string' ? text : chatInput;
    if (!messageText.trim()) return;

    const userMsg = { id: Date.now().toString(), text: messageText, sender: 'user' };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');

    setTimeout(() => {
      const aiMsg = { 
        id: (Date.now() + 1).toString(), 
        text: "Thanks for reaching out! An agent will be with you shortly to help with your request.", 
        sender: 'ai' 
      };
      setChatMessages(prev => [...prev, aiMsg]);
    }, 1000);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCity('All');
    setSortBy('default');
    setSelectedBHK('All');
    setSelectedType('All');
    setSelectedIntent('Buy');
  };

  const scrollToProperties = useCallback(() => {
    if (flatListRef.current && headerHeight > 0) {
      flatListRef.current.scrollToOffset({
        offset: headerHeight,
        animated: true,
      });
    }
  }, [headerHeight]);

  const hasActiveFilters = useMemo(() => {
    return searchQuery !== '' || 
           selectedCity !== 'All' || 
           selectedBHK !== 'All' || 
           selectedType !== 'All' || 
           sortBy !== 'default' ||
           selectedIntent !== 'Buy';
  }, [searchQuery, selectedCity, selectedBHK, selectedType, sortBy, selectedIntent]);

  const parsePrice = useCallback((priceStr: string) => {
    const cleanStr = priceStr.replace(/,/g, '').toLowerCase();
    const num = parseFloat(cleanStr.replace(/[^\d.]/g, '')) || 0;
    if (priceStr.toLowerCase().includes('cr')) return num * 10_000_000;
    if (priceStr.toLowerCase().includes('lakh')) return num * 100_000;
    return isNaN(num) ? 0 : num;
  }, []);

  const allProperties = useMemo(() => 
    Object.keys(PROPERTIES_DATA).map(id => ({ id, ...PROPERTIES_DATA[id] })), 
  []);

  const featuredProperties = useMemo(() => 
    allProperties.filter(p => p.isFeatured),
  [allProperties]);

  const cities = useMemo(() => {
    const uniqueCities = new Set(allProperties.map(p => p.location.split(',').pop()?.trim()));
    return ['All', ...Array.from(uniqueCities).sort()];
  }, [allProperties]);

  const filteredProperties = useMemo(() => {
    let result = allProperties.filter(p => {
      const matchesSearch = p.location.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCity = selectedCity === 'All' || p.location.toLowerCase().includes(selectedCity.toLowerCase());

      let matchesBHK = true;
      if (selectedBHK !== 'All') {
        const bhkValue = parseInt(selectedBHK);
        if (selectedBHK.includes('+')) {
          matchesBHK = p.beds >= bhkValue;
        } else {
          matchesBHK = p.beds === bhkValue;
        }
      }

      const matchesType = selectedType === 'All' || p.type === selectedType;

      let matchesIntent = true;
      if (selectedIntent === 'Rent') {
        matchesIntent = p.price.toLowerCase().includes('rent') || p.price.toLowerCase().includes('/mo');
      } else if (selectedIntent === 'New Projects') {
        matchesIntent = p.status === 'Under Construction';
      } else {
        // 'Buy'
        matchesIntent = !p.price.toLowerCase().includes('rent') && !p.price.toLowerCase().includes('/mo');
      }

      return matchesSearch && matchesCity && matchesBHK && matchesType && matchesIntent;
    }).map(p => ({
      ...p,
      // Generate a unique "Match Score" based on search/filters (simulated AI)
      matchScore: Math.floor(Math.random() * (99 - 85 + 1) + 85)
    }));

    if (sortBy === 'low-to-high') {
      result.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    } else if (sortBy === 'high-to-low') {
      result.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
    }

    return result;
  }, [searchQuery, selectedCity, sortBy, selectedBHK, selectedType, selectedIntent, allProperties, parsePrice]);

  const renderProperty = ({ item }: { item: any }) => {
    return (
    <Pressable 
      style={({ hovered }) => [
        styles.card, 
        { width: numColumns === 3 ? '31.5%' : numColumns === 2 ? '48.5%' : '100%' },
        hovered && Platform.OS === 'web' && styles.cardHover
      ]}
      onPress={() => router.push(`/property/${item.id}`)}
    >
      <Image source={{ uri: item.image }} style={styles.image} contentFit="cover" />
      <View style={styles.matchBadge}>
        <Ionicons name="flash" size={10} color="#020617" />
        <Text style={styles.matchBadgeText}>{item.matchScore}% Match</Text>
      </View>
      <View style={styles.info}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color="#fbbf24" />
            <Text style={styles.ratingText}>4.8</Text>
          </View>
        </View>
        <View style={styles.locationRow}>
          <Ionicons name="location-sharp" size={12} color="#64748b" />
          <Text style={styles.location} numberOfLines={1}>{item.location}</Text>
        </View>
        <View style={styles.footerRow}>
          <Text style={styles.price}>{item.price}</Text>
          <Text style={styles.sqft}>{item.sqft} sqft</Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={styles.viewDetailsBtn}
            onPress={() => router.push({ pathname: '/property/[id]', params: { id: item.id } } as any)}
          >
            <Text style={styles.viewDetailsText}>View Details</Text>
          </TouchableOpacity>
          {item.rooms && item.rooms.length > 0 && (
            <TouchableOpacity 
              style={styles.virtualTourBtn}
              onPress={() => router.push({ pathname: '/property/[id]', params: { id: item.id, virtualTour: 'true' } } as any)}
            >
              <Ionicons name="scan-outline" size={16} color="#22d3ee" />
              <Text style={styles.virtualTourBtnText}>360° Tour</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'EstatePerks', headerShown: true }} />
      <FlatList
        ref={flatListRef}
        key={numColumns} // Force re-render when columns change
        data={filteredProperties}
        renderItem={renderProperty}
        keyExtractor={item => item.id}
        numColumns={numColumns}
        contentContainerStyle={[styles.list, isLargeScreen && styles.listLarge]}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : null}
        ListHeaderComponent={
          <View style={styles.header} onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}>
            <View style={[styles.headerTop, !isLargeScreen && { flexWrap: 'wrap' }]}>
              {!isPropertiesView ? (
                <View style={{ flex: isLargeScreen ? 1 : undefined, width: isLargeScreen ? 'auto' : '100%' }}>
                  <Animated.Text 
                    entering={FadeInDown.duration(1000).springify()}
                    style={[styles.welcome, isSmallMobile && { fontSize: 24 }]}
                  >
                  {"Find your dream home".split('').map((char, index) => (
                    <ShimmerChar 
                      key={index} 
                      char={char} 
                      index={index} 
                      total={20} 
                      isAccent={index >= 10}
                      baseStyle={[styles.welcome, isSmallMobile && { fontSize: 24 }]}
                    />
                  ))}
                  </Animated.Text>
                  <Animated.Text 
                    entering={FadeInDown.delay(200).duration(1000).springify()}
                    style={[styles.subtitle, isSmallMobile && { fontSize: 14 }]}
                  >
                    Handpicked premium properties for you
                  </Animated.Text>

                  <Animated.View 
                    entering={FadeInDown.delay(300).duration(800)}
                    style={styles.marketPulse}
                  >
                    <View style={styles.pulseDot} />
                    <Text style={styles.pulseText}>Market Pulse: Prices in {selectedCity === 'All' ? 'India' : selectedCity} up 4.2% this month</Text>
                  </Animated.View>

                  <Animated.View 
                    entering={FadeInDown.delay(400).duration(1000).springify()}
                    style={styles.heroCTAContainer}
                  >
                    <Text style={styles.heroCTAText}>Buy • Rent • Invest in top cities</Text>
                    <View style={styles.heroCTAButtons}>
                      <TouchableOpacity 
                        style={[styles.heroCTAButton, selectedIntent === 'Buy' && styles.heroCTAButtonActive]}
                        onPress={() => {
                          setSelectedIntent('Buy');
                          scrollToProperties();
                        }}
                      >
                        <Text style={[styles.heroCTAButtonText, selectedIntent === 'Buy' && styles.heroCTAButtonTextActive]}>Buy</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.heroCTAButton, selectedIntent === 'Rent' && styles.heroCTAButtonActive]}
                        onPress={() => {
                          setSelectedIntent('Rent');
                          scrollToProperties();
                        }}
                      >
                        <Text style={[styles.heroCTAButtonText, selectedIntent === 'Rent' && styles.heroCTAButtonTextActive]}>Rent</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.heroCTAButton, selectedIntent === 'New Projects' && styles.heroCTAButtonActive]}
                        onPress={() => {
                          setSelectedIntent('New Projects');
                          scrollToProperties();
                        }}
                      >
                        <Text style={[styles.heroCTAButtonText, selectedIntent === 'New Projects' && styles.heroCTAButtonTextActive]}>New Projects</Text>
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                </View>
              ) : (
                <View style={{ flex: 1 }}>
                  <Text style={styles.welcome}>All Properties</Text>
                  <Text style={styles.subtitle}>Browse our extensive collection of premium homes</Text>
                </View>
              )}
              {hasActiveFilters && (
                <TouchableOpacity onPress={clearAllFilters} style={[styles.clearButton, isMobile && { marginTop: 12 }]}>
                  <Text style={styles.clearButtonText}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by location or property name..."
                placeholderTextColor="#64748b"
                value={searchQuery}
                onChangeText={setSearchQuery}
                // @ts-ignore - web only
                style={[styles.searchInput, Platform.OS === 'web' && { outline: 'none' }]}
                underlineColorAndroid="transparent"
                clearButtonMode="while-editing"
              />
              <TouchableOpacity style={styles.aiSearchBtn}>
                <Ionicons name="sparkles" size={18} color="#020617" />
              </TouchableOpacity>
            </View>

            <View style={styles.trendingSection}>
              <Text style={styles.featuredTitle}>Trending Localities</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.trendingScroll}
              >
                {TRENDING_LOCALITIES.map((item) => (
                  <TouchableOpacity 
                    key={item.id} 
                    style={styles.localityItem}
                    onPress={() => setSearchQuery(item.name)}
                  >
                    <View style={styles.localityIcon}>
                      <Ionicons name={item.icon as any} size={24} color="#22d3ee" />
                    </View>
                    <Text style={styles.localityName}>{item.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {!isPropertiesView && featuredProperties.length > 0 && !hasActiveFilters && (
              <View style={styles.featuredSection}>
                <Text style={styles.featuredTitle}>Featured Properties</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  contentContainerStyle={styles.featuredContent}
                >
                  {featuredProperties.map(item => (
                    <Pressable 
                      key={item.id} 
                      style={({ hovered }) => [
                        styles.featuredCard, 
                        { width: isLargeScreen ? 350 : isTablet ? 300 : width * 0.75 },
                        hovered && Platform.OS === 'web' && styles.featuredCardHover
                      ]}
                      onPress={() => router.push(`/property/${item.id}`)}
                    >
                      <Image source={{ uri: item.image }} style={styles.featuredImage} contentFit="cover" />
                      <LinearGradient
                        colors={['transparent', 'rgba(2, 6, 23, 0.9)']}
                        style={styles.featuredOverlay}
                      >
                        <View style={styles.featuredBadge}>
                          <Ionicons name="star" size={10} color="#020617" />
                          <Text style={styles.featuredBadgeText}>FEATURED</Text>
                        </View>
                        <Text style={styles.featuredName}>{item.name}</Text>
                        <Text style={styles.featuredPrice}>{item.price}</Text>
                      </LinearGradient>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.cityFilterContainer}
              contentContainerStyle={styles.cityFilterContent}
            >
              {cities.map(city => (
                <Pressable 
                  key={city} 
                  style={({ hovered }) => [
                    styles.cityChip, 
                    selectedCity === city && styles.cityChipActive,
                    hovered && Platform.OS === 'web' && selectedCity !== city && styles.chipHover
                  ]}
                  onPress={() => setSelectedCity(city)}
                >
                  <Text style={[styles.cityChipText, selectedCity === city && styles.cityChipTextActive]}>{city}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Filter by BHK:</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.filterContent}
              >
                {['All', '1 BHK', '2 BHK', '3 BHK', '4+ BHK'].map(bhk => (
                  <Pressable 
                    key={bhk} 
                    style={({ hovered }) => [
                      styles.filterChip, 
                      selectedBHK === bhk && styles.filterChipActive,
                      hovered && Platform.OS === 'web' && selectedBHK !== bhk && styles.chipHover
                    ]}
                    onPress={() => setSelectedBHK(bhk)}
                  >
                    <Text style={[styles.filterChipText, selectedBHK === bhk && styles.filterChipTextActive]}>{bhk}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Property Type:</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.filterContent}
              >
                {['All', 'Apartment', 'Villa'].map(type => (
                  <Pressable 
                    key={type} 
                    style={({ hovered }) => [
                      styles.filterChip, 
                      selectedType === type && styles.filterChipActive,
                      hovered && Platform.OS === 'web' && selectedType !== type && styles.chipHover
                    ]}
                    onPress={() => setSelectedType(type)}
                  >
                    <Text style={[styles.filterChipText, selectedType === type && styles.filterChipTextActive]}>{type}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={styles.sortSection}>
              <Text style={styles.sortLabel}>Sort by Price:</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.sortContent}
              >
                {[
                  { label: 'Default', value: 'default' },
                  { label: 'Low to High', value: 'low-to-high' },
                  { label: 'High to Low', value: 'high-to-low' },
                ].map(option => (
                  <Pressable 
                    key={option.value} 
                    style={({ hovered }) => [
                      styles.sortChip, 
                      sortBy === option.value && styles.sortChipActive,
                      hovered && Platform.OS === 'web' && sortBy !== option.value && styles.chipHover
                    ]}
                    onPress={() => setSortBy(option.value)}
                  >
                    <Text style={[styles.sortChipText, sortBy === option.value && styles.sortChipTextActive]}>{option.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={styles.testimonialsSection}>
              <Text style={styles.featuredTitle}>What Our Clients Say</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.testimonialsContent}
              >
                {TESTIMONIALS.map(item => (
                  <Pressable 
                    key={item.id} 
                    style={({ hovered }) => [
                      styles.testimonialCard,
                      { width: isLargeScreen ? 350 : isTablet ? 300 : width * 0.75 },
                      hovered && Platform.OS === 'web' && styles.testimonialCardHover
                    ]}
                  >
                    <View style={styles.testimonialHeader}>
                      <View style={styles.testimonialAvatar}>
                        <Text style={styles.testimonialAvatarText}>{item.name.charAt(0)}</Text>
                      </View>
                      <View>
                        <Text style={styles.testimonialName}>{item.name}</Text>
                        <Text style={styles.testimonialLocation}>{item.location}</Text>
                      </View>
                    </View>
                    <View style={styles.ratingRow}>
                      {[...Array(5)].map((_, i) => (
                        <Ionicons 
                          key={i} 
                          name={i < item.rating ? "star" : "star-outline"} 
                          size={14} 
                          color="#fbbf24" 
                        />
                      ))}
                    </View>
                    <Text style={styles.testimonialComment}>"{item.comment}"</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>)}
          </View>
        }
        ListFooterComponent={
          <LinearGradient
            colors={['#020617', '#0f172a', '#020617']}
            style={styles.footerContainer}
          >
            <View style={[styles.footerTopSection, !isMobile && { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }]}>
              <View style={[styles.footerBrandSection, !isMobile && { maxWidth: '50%' }]}>
                <Text style={styles.footerBrandName}>EstatePerks</Text>
                <Text style={styles.footerTagline}>
                  Discover premium residential properties across India's top cities. Your journey to a dream home starts here.
                </Text>
                <View style={styles.trustRow}>
                  <View style={styles.trustItem}><Text style={styles.trustValue}>20k+</Text><Text style={styles.trustLabel}>Families</Text></View>
                  <View style={styles.trustDivider} />
                  <View style={styles.trustItem}><Text style={styles.trustValue}>500+</Text><Text style={styles.trustLabel}>Builders</Text></View>
                  <View style={styles.trustDivider} />
                  <View style={styles.trustItem}><Text style={styles.trustValue}>15+</Text><Text style={styles.trustLabel}>Cities</Text></View>
                </View>
              </View>
              
              <View style={[styles.newsletterCard, isMobile && { marginTop: 40 }]}>
                <Text style={styles.newsletterTitle}>Stay Updated</Text>
                <Text style={styles.newsletterSubtext}>Subscribe to get the latest property alerts.</Text>
                {isSubscribed ? (
                  <Animated.View entering={FadeInDown} style={styles.subscribeSuccess}>
                    <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                    <Text style={styles.subscribeSuccessText}>Subscribed successfully!</Text>
                  </Animated.View>
                ) : (
                  <View style={styles.newsletterInputRow}>
                    <TextInput 
                      style={styles.newsletterInput} 
                      placeholder="Email Address" 
                      placeholderTextColor="#64748b"
                      value={newsletterEmail}
                      onChangeText={setNewsletterEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                    <TouchableOpacity style={styles.newsletterBtn} onPress={handleSubscribe}>
                      <Text style={styles.newsletterBtnText}>Subscribe</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.topCitiesSection}>
              <Text style={styles.footerSectionTitle}>Top Localities</Text>
              <View style={styles.cityChipsRow}>
                {['Mumbai', 'Bangalore', 'Pune', 'Hyderabad', 'Delhi', 'Kolkata', 'Goa', 'Chennai'].map((city) => (
                  <Pressable key={city}>
                    {({ hovered }) => (
                      <Text style={[styles.cityLinkChip, hovered && Platform.OS === 'web' && { color: '#fbbf24', borderColor: '#fbbf24' }]}>
                        Properties in {city}
                      </Text>
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.footerDivider} />

            <View style={styles.footerGrid}>
              <View style={[styles.footerColumn, { width: isLargeScreen ? '23%' : isTablet ? '48%' : '100%', marginBottom: isMobile ? 32 : 0 }]}>
                <Text style={styles.footerSectionTitle}>Quick Links</Text>
                <Pressable onPress={() => router.push('/')}>
                  {({ hovered }) => (
                    <Text style={[styles.footerLink, hovered && Platform.OS === 'web' && styles.footerLinkHover]}>Home</Text>
                  )}
                </Pressable>
                <Pressable onPress={() => router.push('/explore')}>
                  {({ hovered }) => (
                    <Text style={[styles.footerLink, hovered && Platform.OS === 'web' && styles.footerLinkHover]}>Explore Map</Text>
                  )}
                </Pressable>
                <Pressable onPress={() => router.push('/rewards')}>
                  {({ hovered }) => (
                    <Text style={[styles.footerLink, hovered && Platform.OS === 'web' && styles.footerLinkHover]}>Rewards</Text>
                  )}
                </Pressable>
                <Pressable onPress={() => router.push('/profile')}>
                  {({ hovered }) => (
                    <Text style={[styles.footerLink, hovered && Platform.OS === 'web' && styles.footerLinkHover]}>My Profile</Text>
                  )}
                </Pressable>
              </View>

              <View style={[styles.footerColumn, { width: isLargeScreen ? '23%' : isTablet ? '48%' : '100%', marginBottom: isMobile ? 32 : 0 }]}>
                <Text style={styles.footerSectionTitle}>Company</Text>
                <Pressable onPress={() => setIsAboutModalVisible(true)}>
                  {({ hovered }) => (
                    <Text style={[styles.footerLink, hovered && Platform.OS === 'web' && styles.footerLinkHover]}>About Us</Text>
                  )}
                </Pressable>
                <Pressable onPress={() => setIsCareersModalVisible(true)}>
                  {({ hovered }) => (
                    <Text style={[styles.footerLink, hovered && Platform.OS === 'web' && styles.footerLinkHover]}>Careers</Text>
                  )}
                </Pressable>
                <Pressable onPress={() => setIsPrivacyModalVisible(true)}>
                  {({ hovered }) => (
                    <Text style={[styles.footerLink, hovered && Platform.OS === 'web' && styles.footerLinkHover]}>Privacy Policy</Text>
                  )}
                </Pressable>
                <Pressable onPress={() => setIsTermsModalVisible(true)}>
                  {({ hovered }) => (
                    <Text style={[styles.footerLink, hovered && Platform.OS === 'web' && styles.footerLinkHover]}>Terms of Service</Text>
                  )}
                </Pressable>
              </View>

              <View style={[styles.footerColumn, { width: isLargeScreen ? '23%' : isTablet ? '48%' : '100%', marginBottom: isMobile ? 32 : 0 }]}>
                <Text style={styles.footerSectionTitle}>Contact Us</Text>
                <View style={styles.contactItem}>
                  <Ionicons name="location-outline" size={14} color="#94a3b8" />
                  <Text style={styles.contactText}>BKC, Mumbai, MH 400051</Text>
                </View>
                <View style={styles.contactItem}>
                  <Ionicons name="call-outline" size={14} color="#94a3b8" />
                  <Text style={styles.contactText}>+91 1800-123-456</Text>
                </View>
                <View style={styles.contactItem}>
                  <Ionicons name="mail-outline" size={14} color="#94a3b8" />
                  <Text style={styles.contactText}>support@estateperks.com</Text>
                </View>
              </View>

              <View style={[styles.footerColumn, { width: isLargeScreen ? '23%' : isTablet ? '48%' : '100%' }]}>
                <Text style={styles.footerSectionTitle}>Download App</Text>
                <Pressable 
                  style={({ hovered }) => [styles.downloadBadge, hovered && Platform.OS === 'web' && styles.downloadBadgeHover]}
                >
                  {({ hovered }) => (
                    <>
                      <Ionicons name="logo-apple" size={20} color={hovered && Platform.OS === 'web' ? "#fbbf24" : "#fff"} />
                      <View style={styles.badgeTextContainer}>
                        <Text style={styles.badgeSubtext}>Download on the</Text>
                        <Text style={[styles.badgeMainText, hovered && Platform.OS === 'web' && { color: '#fbbf24' }]}>App Store</Text>
                      </View>
                    </>
                  )}
                </Pressable>
                <Pressable 
                  style={({ hovered }) => [styles.downloadBadge, { marginTop: 10 }, hovered && Platform.OS === 'web' && styles.downloadBadgeHover]}
                >
                  {({ hovered }) => (
                    <>
                      <Ionicons name="logo-google-playstore" size={20} color={hovered && Platform.OS === 'web' ? "#fbbf24" : "#fff"} />
                      <View style={styles.badgeTextContainer}>
                        <Text style={styles.badgeSubtext}>GET IT ON</Text>
                        <Text style={[styles.badgeMainText, hovered && Platform.OS === 'web' && { color: '#fbbf24' }]}>Google Play</Text>
                      </View>
                    </>
                  )}
                </Pressable>
              </View>
            </View>

            <View style={styles.socialRow}>
              {['logo-facebook', 'logo-twitter', 'logo-instagram', 'logo-linkedin'].map((icon) => (
                <Pressable 
                  key={icon}
                  style={({ hovered }) => [
                    styles.socialIcon,
                    hovered && Platform.OS === 'web' && styles.socialIconHover
                  ]}
                >
                  {({ hovered }) => (
                    <Ionicons 
                      name={icon as any} 
                      size={20} 
                      color={hovered && Platform.OS === 'web' ? "#fbbf24" : "#fff"} 
                    />
                  )}
                </Pressable>
              ))}
            </View>

            <View style={styles.footerBottom}>
              <Text style={styles.copyrightText}>
                © 2024 EstatePerks Realty Solutions Pvt Ltd.
              </Text>
              <Text style={styles.reraDisclaimer}>
                All properties are RERA registered where applicable.
              </Text>
            </View>
          </LinearGradient>
        }
      />

      {/* Floating Live Chat Button */}
      <Pressable 
        style={({ hovered }) => [
          styles.floatingChatBtn,
          hovered && Platform.OS === 'web' && styles.floatingChatBtnHover
        ]}
        onPress={() => setIsChatVisible(true)}
      >
        <Ionicons name="chatbubbles" size={28} color="#020617" />
      </Pressable>

      {/* Support Chat Modal */}
      <Modal visible={isChatVisible} animationType="slide" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { height: '70%', maxWidth: 500 }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="headset" size={24} color="#22d3ee" />
                <Text style={styles.modalTitle}>Support Chat</Text>
                <View style={styles.onlineIndicator} />
              </View>
              <TouchableOpacity onPress={() => setIsChatVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 12, paddingBottom: 20 }}>
              {chatMessages.map(msg => (
                <View key={msg.id} style={[styles.chatBubble, msg.sender === 'user' ? styles.userBubble : styles.aiBubble]}>
                  <Text style={[styles.chatText, msg.sender === 'user' ? styles.userChatText : styles.aiChatText]}>{msg.text}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.quickReplyContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {QUICK_REPLIES.map((reply, index) => (
                  <Pressable 
                    key={index} 
                    style={({ hovered }) => [
                      styles.quickReplyChip,
                      hovered && Platform.OS === 'web' && styles.chipHover
                    ]}
                    onPress={() => handleSendMessage(reply)}
                  >
                    <Text style={styles.quickReplyText}>{reply}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={styles.chatInputContainer}>
              <TextInput
                style={styles.chatInput}
                placeholder="Type your message..."
                placeholderTextColor="#475569"
                value={chatInput}
                onChangeText={setChatInput}
                onSubmitEditing={() => handleSendMessage()}
              />
              <TouchableOpacity style={styles.chatSendBtn} onPress={() => handleSendMessage()}>
                <Ionicons name="send" size={20} color="#020617" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* About Us Modal */}
      <Modal visible={isAboutModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 500 }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="information-circle" size={24} color="#22d3ee" />
                <Text style={styles.modalTitle}>About EstatePerks</Text>
              </View>
              <TouchableOpacity onPress={() => setIsAboutModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={styles.aboutText}>
                EstatePerks is a premium real estate platform dedicated to helping you find your dream home across India's top cities.
              </Text>
              <Text style={[styles.aboutText, { marginTop: 12 }]}>
                We combine cutting-edge technology like 360° virtual tours and AI-powered investment scores with a human-centric approach to provide a seamless property search experience.
              </Text>
              <Text style={[styles.aboutText, { marginTop: 12 }]}>
                Our mission is to make real estate transparent, accessible, and rewarding for everyone.
              </Text>
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setIsAboutModalVisible(false)}>
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Careers Modal */}
      <Modal visible={isCareersModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 500 }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="briefcase" size={24} color="#22d3ee" />
                <Text style={styles.modalTitle}>Careers at EstatePerks</Text>
              </View>
              <TouchableOpacity onPress={() => setIsCareersModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.aboutText}>
                Join our mission to revolutionize the real estate industry. We're looking for passionate individuals to join our growing team.
              </Text>
              
              <Text style={[styles.inputLabel, { marginTop: 20, color: '#22d3ee' }]}>Current Openings</Text>
              
              {[
                { title: 'Senior Real Estate Consultant', location: 'Mumbai / Remote', type: 'Full-time' },
                { title: 'Full Stack Developer (React Native)', location: 'Bangalore / Remote', type: 'Full-time' },
                { title: 'Marketing Manager', location: 'Mumbai', type: 'Full-time' },
                { title: 'Customer Support Specialist', location: 'Remote', type: 'Contract' },
              ].map((job, i) => (
                <View key={i} style={styles.jobItem}>
                  <Text style={styles.jobTitle}>{job.title}</Text>
                  <View style={styles.jobMeta}>
                    <Text style={styles.jobDetail}>{job.location}</Text>
                    <View style={styles.jobDot} />
                    <Text style={styles.jobDetail}>{job.type}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setIsCareersModalVisible(false)}>
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal visible={isPrivacyModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 500 }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="shield-checkmark" size={24} color="#22d3ee" />
                <Text style={styles.modalTitle}>Privacy Policy</Text>
              </View>
              <TouchableOpacity onPress={() => setIsPrivacyModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.aboutText}>
                At EstatePerks, we take your privacy seriously. This policy outlines how we handle your data.
              </Text>
              
              <Text style={[styles.inputLabel, { marginTop: 20, color: '#22d3ee' }]}>1. Data Collection</Text>
              <Text style={styles.aboutText}>
                We collect information you provide directly to us, such as when you create an account, search for properties, or contact support.
              </Text>

              <Text style={[styles.inputLabel, { marginTop: 16, color: '#22d3ee' }]}>2. Use of Information</Text>
              <Text style={styles.aboutText}>
                We use your information to provide, maintain, and improve our services, including personalized property recommendations.
              </Text>

              <Text style={[styles.inputLabel, { marginTop: 16, color: '#22d3ee' }]}>3. Data Sharing</Text>
              <Text style={styles.aboutText}>
                We do not share your personal information with third parties except as described in this policy (e.g., with builders when you request a callback).
              </Text>
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setIsPrivacyModalVisible(false)}>
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Terms of Service Modal */}
      <Modal visible={isTermsModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 500 }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="document-text" size={24} color="#22d3ee" />
                <Text style={styles.modalTitle}>Terms of Service</Text>
              </View>
              <TouchableOpacity onPress={() => setIsTermsModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.aboutText}>
                Welcome to EstatePerks. By using our services, you agree to the following terms.
              </Text>
              
              <Text style={[styles.inputLabel, { marginTop: 20, color: '#22d3ee' }]}>1. Acceptance of Terms</Text>
              <Text style={styles.aboutText}>
                By accessing or using EstatePerks, you agree to be bound by these Terms of Service and all applicable laws and regulations.
              </Text>

              <Text style={[styles.inputLabel, { marginTop: 16, color: '#22d3ee' }]}>2. Use of Service</Text>
              <Text style={styles.aboutText}>
                You agree to use our services only for lawful purposes and in a way that does not infringe the rights of others or restrict their use of the service.
              </Text>

              <Text style={[styles.inputLabel, { marginTop: 16, color: '#22d3ee' }]}>3. Intellectual Property</Text>
              <Text style={styles.aboutText}>
                All content on this platform, including text, graphics, logos, and software, is the property of EstatePerks and is protected by intellectual property laws.
              </Text>

              <Text style={[styles.inputLabel, { marginTop: 16, color: '#22d3ee' }]}>4. Limitation of Liability</Text>
              <Text style={styles.aboutText}>
                EstatePerks shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use our services.
              </Text>
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setIsTermsModalVisible(false)}>
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#020617',
    alignItems: 'center',
  },
  list: { 
    padding: Platform.OS === 'web' ? 20 : 16,
    width: '100%',
  },
  listLarge: {
    maxWidth: 1280,
    alignSelf: 'center',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: 24,
  },
  header: { marginBottom: 24 },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  clearButtonText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
  },
  welcome: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  highlight: { 
    color: '#fbbf24',
    textShadowColor: 'rgba(251, 191, 36, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  subtitle: { color: '#94a3b8', fontSize: 16, marginTop: 4 },
  marketPulse: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 211, 238, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 16,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.1)',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22d3ee',
    marginRight: 8,
  },
  pulseText: {
    color: '#22d3ee',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroCTAContainer: {
    marginTop: 24,
    gap: 16,
  },
  heroCTAText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroCTAButtons: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  heroCTAButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  heroCTAButtonActive: {
    backgroundColor: '#22d3ee',
    borderColor: '#22d3ee',
  },
  heroCTAButtonText: {
    color: '#94a3b8',
    fontWeight: '700',
    fontSize: 14,
  },
  heroCTAButtonTextActive: {
    color: '#020617',
  },
  card: { 
    backgroundColor: '#0f172a', 
    borderRadius: 20, 
    marginBottom: 24, 
    borderWidth: 1,
    borderColor: '#1e293b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  cardHover: {
    transform: [{ translateY: -8 }],
    borderColor: '#22d3ee',
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  image: { width: '100%', height: 200 },
  info: { padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 18, fontWeight: '800', color: '#fff', flex: 1, marginRight: 8 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(251, 191, 36, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ratingText: { color: '#fbbf24', fontWeight: 'bold', fontSize: 12 },
  location: { color: '#94a3b8', fontSize: 13, flex: 1 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  price: { fontSize: 18, fontWeight: 'bold', color: '#22d3ee' },
  sqft: { color: '#64748b', fontSize: 14 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 16,
    paddingHorizontal: 12,
    marginTop: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)', // Web only
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    height: 48,
    color: '#fff',
    fontSize: 15,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  aiSearchBtn: {
    backgroundColor: '#22d3ee',
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  trendingSection: {
    marginTop: 32,
  },
  trendingScroll: {
    paddingRight: 20,
    paddingBottom: 8,
  },
  localityItem: {
    alignItems: 'center',
    marginRight: 24,
    width: 80,
  },
  localityIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 8,
  },
  localityName: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  viewDetailsBtn: {
    flex: 1,
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.3)',
  },
  viewDetailsText: {
    color: '#22d3ee',
    fontWeight: '700',
    fontSize: 14,
  },
  virtualTourBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.3)',
  },
  virtualTourBtnText: {
    color: '#22d3ee',
    fontWeight: '700',
    fontSize: 14,
  },
  matchBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#22d3ee',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 1,
  },
  matchBadgeText: {
    color: '#020617',
    fontSize: 10,
    fontWeight: '900',
  },
  cityFilterContainer: {
    marginTop: 20,
  },
  cityFilterContent: {
    paddingRight: 20,
  },
  cityChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#0f172a',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
    ...(Platform.OS === 'web' ? { transitionProperty: 'all', transitionDuration: '0.2s' } : {}),
  },
  chipHover: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  cityChipActive: {
    backgroundColor: '#22d3ee',
    borderColor: '#22d3ee',
  },
  cityChipText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  cityChipTextActive: {
    color: '#020617',
  },
  filterSection: {
    marginTop: 20,
  },
  filterLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  filterContent: {
    paddingRight: 20,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  filterChipActive: {
    borderColor: '#22d3ee',
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
  },
  filterChipText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#22d3ee',
  },
  sortSection: {
    marginTop: 20,
  },
  sortLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  sortContent: {
    paddingRight: 20,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  sortChipActive: {
    borderColor: '#22d3ee',
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
  },
  sortChipText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  sortChipTextActive: {
    color: '#22d3ee',
  },
  featuredSection: {
    marginTop: 24,
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    marginLeft: 4,
  },
  featuredContent: {
    paddingRight: 20,
  },
  featuredCard: {
    height: 180,
    borderRadius: 20,
    marginRight: 16,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    ...(Platform.OS === 'web' ? { transitionProperty: 'all', transitionDuration: '0.3s' } : {}),
  },
  featuredCardHover: {
    transform: [{ scale: 1.03 }],
    shadowColor: '#22d3ee',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    padding: 16,
    justifyContent: 'flex-end',
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#22d3ee',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  featuredBadgeText: {
    color: '#020617',
    fontSize: 10,
    fontWeight: '900',
  },
  featuredName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  featuredPrice: {
    color: '#22d3ee',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  footerContainer: {
    marginTop: 80,
    paddingTop: 80,
    paddingBottom: 60,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#22d3ee',
  },
  footerTopSection: {
    marginBottom: 60,
  },
  footerBrandSection: {
    marginBottom: 24,
  },
  footerBrandName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fbbf24',
    marginBottom: 8,
  },
  footerTagline: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 20,
  },
  footerDivider: {
    height: 1,
    backgroundColor: '#1e293b',
    marginVertical: 40,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    gap: 16,
  },
  trustItem: {
    alignItems: 'flex-start',
  },
  trustValue: {
    color: '#22d3ee',
    fontSize: 18,
    fontWeight: '900',
  },
  trustLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  trustDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#1e293b',
  },
  newsletterCard: {
    width: '100%',
    maxWidth: 450,
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.2)',
    shadowColor: '#22d3ee',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  newsletterTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  newsletterSubtext: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 16,
  },
  newsletterInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  newsletterInput: {
    flex: 1,
    backgroundColor: '#020617',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  newsletterBtn: {
    paddingHorizontal: 20,
    height: 48,
    backgroundColor: '#22d3ee',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newsletterBtnText: {
    color: '#020617',
    fontWeight: '800',
    fontSize: 14,
  },
  subscribeSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 48,
  },
  subscribeSuccessText: {
    color: '#22c55e',
    fontWeight: '700',
    fontSize: 14,
  },
  topCitiesSection: {
    marginBottom: 20,
  },
  cityChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  cityLinkChip: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
    ...(Platform.OS === 'web' ? { transitionProperty: 'all', transitionDuration: '0.2s' } : {}),
  },
  footerGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 24,
  },
  footerColumn: {
  },
  footerSectionTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 16,
  },
  footerLink: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 12,
  },
  footerLinkHover: {
    color: '#fbbf24',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  contactText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 30,
  },
  socialIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
    ...(Platform.OS === 'web' ? { transitionProperty: 'all', transitionDuration: '0.2s' } : {}),
  },
  socialIconHover: {
    borderColor: '#fbbf24',
    transform: [{ scale: 1.1 }],
  },
  footerBottom: {
    alignItems: 'center',
  },
  copyrightText: {
    color: '#64748b',
    fontSize: 12,
    marginBottom: 4,
  },
  reraDisclaimer: {
    color: '#475569',
    fontSize: 10,
    textAlign: 'center',
  },
  downloadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 8,
    alignSelf: 'flex-start',
    ...(Platform.OS === 'web' ? { transitionProperty: 'all', transitionDuration: '0.2s' } : {}),
  },
  downloadBadgeHover: {
    borderColor: '#fbbf24',
  },
  badgeTextContainer: {
    flexDirection: 'column',
  },
  badgeSubtext: {
    color: '#94a3b8',
    fontSize: 8,
    fontWeight: '600',
  },
  badgeMainText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  testimonialsSection: {
    marginTop: 32,
    marginBottom: 8,
  },
  testimonialsContent: {
    paddingRight: 20,
    paddingBottom: 10,
  },
  testimonialCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 20,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    ...(Platform.OS === 'web' ? { transitionProperty: 'all', transitionDuration: '0.3s' } : {}),
  },
  testimonialCardHover: {
    borderColor: '#22d3ee',
    transform: [{ scale: 1.02 }],
  },
  testimonialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  testimonialAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.3)',
  },
  testimonialAvatarText: {
    color: '#22d3ee',
    fontSize: 16,
    fontWeight: '800',
  },
  testimonialName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  testimonialLocation: {
    color: '#64748b',
    fontSize: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 10,
  },
  testimonialComment: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  floatingChatBtn: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#22d3ee',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22d3ee',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 100,
    ...(Platform.OS === 'web' ? { transitionProperty: 'all', transitionDuration: '0.2s' } : {}),
  },
  floatingChatBtnHover: {
    transform: [{ scale: 1.1 }],
    backgroundColor: '#67e8f9',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
    marginLeft: 4,
  },
  chatBubble: { padding: 12, borderRadius: 16, maxWidth: '85%' },
  aiBubble: { backgroundColor: '#1e293b', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  userBubble: { backgroundColor: '#22d3ee', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  chatText: { fontSize: 14, lineHeight: 20 },
  aiChatText: { color: '#e2e8f0' },
  userChatText: { color: '#020617', fontWeight: '500' },
  inputLabel: {
    color: '#cbd5e1',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
  },
  quickReplyContainer: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  quickReplyChip: {
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.3)',
    ...(Platform.OS === 'web' ? { transitionProperty: 'all', transitionDuration: '0.2s' } : {}),
  },
  quickReplyText: {
    color: '#22d3ee',
    fontSize: 12,
    fontWeight: '600',
  },
  chatInputContainer: { flexDirection: 'row', gap: 10, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#1e293b' },
  chatInput: { 
    flex: 1, 
    backgroundColor: '#020617', 
    borderRadius: 12, 
    paddingHorizontal: 15, 
    paddingVertical: 10, 
    color: '#fff', 
    fontSize: 14, 
    borderWidth: 1, 
    borderColor: '#334155' 
  },
  chatSendBtn: { 
    backgroundColor: '#22d3ee', 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  aboutText: {
    color: '#cbd5e1',
    fontSize: 15,
    lineHeight: 24,
  },
  modalCloseBtn: {
    backgroundColor: '#22d3ee',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  modalCloseBtnText: {
    color: '#020617',
    fontWeight: '800',
    fontSize: 16,
  },
  jobItem: {
    backgroundColor: '#020617',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  jobTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  jobMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  jobDetail: {
    color: '#94a3b8',
    fontSize: 12,
  },
  jobDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#475569',
  },
});
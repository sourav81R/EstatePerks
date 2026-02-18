import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { LineChart } from 'react-native-gifted-charts';
import { LinearGradient } from 'expo-linear-gradient';
import { Gyroscope } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  ScrollView,
  Alert,
  Platform,
  Modal,
  TextInput,
  ActivityIndicator,
  PanResponder,
  Pressable,
  Linking,
  useWindowDimensions,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useLocalSearchParams, useRouter, useRootNavigationState } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  FadeInUp, 
  FadeInDown, 
  FadeOut,
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';
import ParallaxScrollView from '../../components/parallax-scroll-view';
import { useVisit } from '../../context/VisitContext';

/* ---------------- TYPES ---------------- */

interface PropertyFeature {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}

interface FloorPlan {
  type: string;
  size: string;
  price: string;
}

interface ConnectivityItem {
  name: string;
  distance: string;
  type: 'school' | 'hospital' | 'metro' | 'mall';
  rating?: number;
  reviewCount?: number;
  isTopRanked?: boolean;
  hasEmergency?: boolean;
}

interface TimelineItem {
  date: string;
  label: string;
  status: 'completed' | 'upcoming';
}

interface Hotspot {
  x: number; // 0 to 1 relative to image width
  targetRoomId: string;
  label: string;
}

interface Room {
  id: string;
  name: string;
  image: string;
  hotspots?: Hotspot[];
}

interface LocalityScore {
  label: string;
  score: number; // out of 10
  icon: keyof typeof Ionicons.glyphMap;
}

interface LocalityInsight {
  label: string;
  value: string;
  trend: 'up' | 'down';
}

interface Review {
  user: string;
  rating: number;
  comment: string;
  date: string;
  tags: string[];
}

interface Lead {
  id: string;
  name: string;
  status: 'New' | 'Contacted' | 'Site Visit' | 'Closed';
  source: 'WhatsApp' | 'Web' | 'Call';
  date: string;
  notes: string;
}

interface Property {
  name: string;
  location: string;
  price: string;
  description: string;
  type: string;
  beds: number;
  baths: number;
  sqft: string;
  status: string;
  builder: string;
  builderExperience?: string;
  totalProjects?: string;
  builderDescription?: string;
  reraId: string;
  possession: string;
  image: string;
  features: PropertyFeature[];
  videoUrl: string;
  priceHistory: { month: string; value: number }[];
  coordinates?: { latitude: number; longitude: number };
  highlights?: string[];
  floorPlans?: FloorPlan[];
  connectivity?: ConnectivityItem[];
  localityScores?: LocalityScore[];
  reviews?: Review[];
  localityInsights?: LocalityInsight[];
  localityDescription?: string;
  avgPrice?: string;
  priceRange?: string;
  localityAdvantages?: string[];
  timeline?: TimelineItem[];
  amenities?: Record<string, string[]>;
  rooms?: Room[];
  faqs?: { q: string; a: string }[];
  [key: string]: any;
}

type PropertyListItem = Property & { id: string };
type ChatSender = 'ai' | 'user';

interface ChatMessage {
  id: string;
  text: string;
  sender: ChatSender;
}

const AnimatedImage = Animated.createAnimatedComponent(Image);

import { 
  styles, 
  CITY_AVERAGE_DATA, 
  REVIEW_TAGS, 
  MOCK_LEADS,
  BANK_RATES, 
  BANK_OFFERS, 
  parsePrice 
} from './property-details.styles';

import { PROPERTIES_DATA } from '../../constants/propertiesData';

const FAVORITES_STORAGE_KEY = 'estateperks:favorites:v1';
const RECENT_VIEWS_STORAGE_KEY = 'estateperks:recentViews:v1';
const CALLBACK_LEADS_STORAGE_KEY = 'estateperks:callbackLeads:v1';
const RECENT_VIEW_LIMIT = 8;
const AI_ASSISTANT_ENDPOINT = process.env.EXPO_PUBLIC_AI_ASSISTANT_ENDPOINT;
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_MODEL = process.env.EXPO_PUBLIC_GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_API_BASE = (process.env.EXPO_PUBLIC_GEMINI_API_BASE || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/$/, '');
const DEFAULT_VIDEO_PLACEHOLDER =
  'https://shotstack-assets.s3.ap-southeast-2.amazonaws.com/footage/property-tour-living-room.mp4';
const RELIABLE_VIDEO_FALLBACKS = [
  'https://shotstack-assets.s3.ap-southeast-2.amazonaws.com/footage/property-tour-entrance.mp4',
  'https://shotstack-assets.s3.ap-southeast-2.amazonaws.com/footage/property-tour-living-room-b-roll.mp4',
  'https://shotstack-assets.s3.ap-southeast-2.amazonaws.com/footage/property-tour-main-bedroom.mp4',
  'https://shotstack-assets.s3.ap-southeast-2.amazonaws.com/footage/property-tour-second-bedroom.mp4',
  'https://shotstack-assets.s3.ap-southeast-2.amazonaws.com/footage/property-tour-home-office.mp4',
];

const isLegacySampleVideo = (url?: string) =>
  !!url && /(big[_\s-]?buck[_\s-]?bunny|test-videos\.co\.uk\/vids\/bigbuckbunny)/i.test(url);

// Property-tour clips (works on mobile + desktop/laptop).
const PROPERTY_VIDEO_URLS: Record<string, string> = {
  '1': 'https://shotstack-assets.s3.ap-southeast-2.amazonaws.com/footage/property-tour-entrance.mp4',
  '2': 'https://shotstack-assets.s3.ap-southeast-2.amazonaws.com/footage/property-tour-living-room.mp4',
  '3': 'https://shotstack-assets.s3.ap-southeast-2.amazonaws.com/footage/property-tour-living-room-b-roll.mp4',
  '4': 'https://shotstack-assets.s3.ap-southeast-2.amazonaws.com/footage/property-tour-main-bedroom.mp4',
  '5': 'https://shotstack-assets.s3.ap-southeast-2.amazonaws.com/footage/property-tour-main-bedroom-b-roll.mp4',
  '6': 'https://shotstack-assets.s3.ap-southeast-2.amazonaws.com/footage/property-tour-second-bedroom.mp4',
  '7': 'https://shotstack-assets.s3.ap-southeast-2.amazonaws.com/footage/property-tour-second-bedroom-b-roll.mp4',
  '8': 'https://shotstack-assets.s3.ap-southeast-2.amazonaws.com/footage/property-tour-home-office.mp4',
  '9': 'https://shotstack-assets.s3.ap-southeast-2.amazonaws.com/footage/property-tour-home-office-b-roll.mp4',
  '10': 'https://shotstack-assets.s3.ap-southeast-2.amazonaws.com/footage/property-tour-entrance.mp4',
  '11': 'https://shotstack-assets.s3.ap-southeast-2.amazonaws.com/footage/property-tour-living-room.mp4',
  '12': 'https://shotstack-assets.s3.ap-southeast-2.amazonaws.com/footage/property-tour-living-room-b-roll.mp4',
  '13': 'https://shotstack-assets.s3.ap-southeast-2.amazonaws.com/footage/property-tour-main-bedroom.mp4',
  '14': 'https://shotstack-assets.s3.ap-southeast-2.amazonaws.com/footage/property-tour-main-bedroom-b-roll.mp4',
  '15': 'https://shotstack-assets.s3.ap-southeast-2.amazonaws.com/footage/property-tour-second-bedroom.mp4',
  '16': 'https://shotstack-assets.s3.ap-southeast-2.amazonaws.com/footage/property-tour-second-bedroom-b-roll.mp4',
  '17': 'https://shotstack-assets.s3.ap-southeast-2.amazonaws.com/footage/property-tour-home-office.mp4',
  '18': 'https://shotstack-assets.s3.ap-southeast-2.amazonaws.com/footage/property-tour-home-office-b-roll.mp4',
  '19': 'https://shotstack-assets.s3.ap-southeast-2.amazonaws.com/footage/property-tour-living-room.mp4',
  '20': 'https://shotstack-assets.s3.ap-southeast-2.amazonaws.com/footage/property-tour-main-bedroom.mp4',
};

/* ---------------- SCREEN ---------------- */

export default function PropertyDetails() {
  const params = useLocalSearchParams();
  const propertyId = Array.isArray(params.id) ? params.id[0] : params.id;
  const resolvedPropertyId =
    propertyId && PROPERTIES_DATA[propertyId] ? propertyId : '1';
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const { addVisit } = useVisit() as { addVisit?: (visit: any) => void };
  const { width: windowWidth } = useWindowDimensions();
  const isTablet = windowWidth >= 768;
  const isMobile = windowWidth < 768;
  const isSmallMobile = windowWidth < 420;
  const contentPadding = isSmallMobile ? 12 : isMobile ? 16 : 20;
  const chartWidth = Math.max(windowWidth - (isSmallMobile ? 56 : isMobile ? 72 : 80), 220);

  const toolButtonStyle: StyleProp<ViewStyle> = [
    styles.toolButton,
    { width: (isSmallMobile ? '100%' : Platform.OS === 'web' && windowWidth > 1024 ? '31%' : '48%') as DimensionValue }
  ];

  const overviewItemStyle: StyleProp<ViewStyle> = [
    styles.overviewItem,
    { width: (isSmallMobile ? '100%' : windowWidth > 600 ? '24%' : '48%') as DimensionValue }
  ];

  const sectionCardBaseStyle: StyleProp<ViewStyle> = [
    styles.sectionCard,
    isMobile && styles.sectionCardMobile,
    isSmallMobile && styles.sectionCardSmall,
  ];

  const property: Property = PROPERTIES_DATA[resolvedPropertyId];

  const [activeTab, setActiveTab] = useState('Overview');

  const [viewMode, setViewMode] = useState<'image' | '3d' | 'video'>('image');
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoritePropertyIds, setFavoritePropertyIds] = useState<string[]>([]);
  const [recentViewIds, setRecentViewIds] = useState<string[]>([]);
  const [isFeatured, setIsFeatured] = useState(!!property.isFeatured || resolvedPropertyId === '1');
  const [isPriceDropAlertActive, setIsPriceDropAlertActive] = useState(false);
  const [isMuted, setIsMuted] = useState(Platform.OS === 'web'); // keep muted by default on web autoplay
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [progressBarWidth, setProgressBarWidth] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [showControls, setShowControls] = useState(true);
  const [doubleTapSide, setDoubleTapSide] = useState<'left' | 'right' | null>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const webSpeechRecognitionRef = useRef<any>(null);

  // Pulse Animation for Virtual Tour Label
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    if (viewMode === 'video' || isRecording) {
      pulseOpacity.value = withRepeat(
        withTiming(0.4, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      pulseOpacity.value = 1;
    }
  }, [viewMode, isRecording]);

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  // Mortgage Calculator State
  const [isMortgageVisible, setIsMortgageVisible] = useState(false);
  const [downPayment, setDownPayment] = useState('20');
  const [interestRate, setInterestRate] = useState('8.5');
  const [loanTerm, setLoanTerm] = useState('20');

  // Eligibility State
  const [isEligibilityVisible, setIsEligibilityVisible] = useState(false);
  const [eligibilityName, setEligibilityName] = useState('');
  const [eligibilityPhone, setEligibilityPhone] = useState('');
  const [eligibilityIncome, setEligibilityIncome] = useState('');

  // Virtual Tour State
  const [isVirtualTourVisible, setIsVirtualTourVisible] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);

  useEffect(() => {
    if (params.virtualTour === 'true') {
      setIsVirtualTourVisible(true);
    }
  }, [params.virtualTour]);

  // Virtual Tour Panning Logic
  const tourX = useSharedValue(0);
  const tourStartX = useSharedValue(0);
  const tourOverlayOpacity = useSharedValue(1);

  const tourPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          tourStartX.value = tourX.value;
          tourOverlayOpacity.value = withTiming(0, { duration: 300 });
        },
        onPanResponderMove: (_, gestureState) => {
          const limit = windowWidth * 0.5;
          let nextX = tourStartX.value + gestureState.dx;
          if (nextX > limit) nextX = limit;
          if (nextX < -limit) nextX = -limit;
          tourX.value = nextX;
        },
      }),
    [windowWidth]
  );

  const currentRoom = useMemo(() => {
    if (!property.rooms) return null;
    return property.rooms.find(r => r.id === currentRoomId) || property.rooms[0];
  }, [currentRoomId, property.rooms]);

  useEffect(() => {
    if (!isVirtualTourVisible) {
      tourX.value = withTiming(0);
      tourOverlayOpacity.value = withTiming(1);
      setCurrentRoomId(null);
    } else if (property.rooms && !currentRoomId) {
      setCurrentRoomId(property.rooms[0].id);
    }
  }, [isVirtualTourVisible, property.rooms, currentRoomId, tourX, tourOverlayOpacity]);

  // Gyroscope Effect
  useEffect(() => {
    let isMounted = true;
    let subscription: { remove: () => void } | null = null;

    const startSubscription = async () => {
      // Gyroscope is often unsupported or requires secure context on Web
      if (Platform.OS === 'web') return;

      try {
        const isAvailable = await Gyroscope.isAvailableAsync();
        
        if (isMounted && isAvailable && isVirtualTourVisible) {
          Gyroscope.setUpdateInterval(16);
          subscription = Gyroscope.addListener(data => {
            // Sensitivity factor for panning
            const sensitivity = 12;
            const delta = data.y * sensitivity;
            
            const limit = windowWidth * 0.5;
            let nextX = tourX.value - delta;
            
            if (nextX > limit) nextX = limit;
            if (nextX < -limit) nextX = -limit;
            
            tourX.value = nextX;
          });
        }
      } catch (error) {
        console.warn("Gyroscope could not be initialized:", error);
      }
    };

    if (isVirtualTourVisible) {
      startSubscription();
    }

    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, [isVirtualTourVisible, windowWidth]);

  const tourAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tourX.value }],
  }));

  const tourOverlayStyle = useAnimatedStyle(() => ({
    opacity: tourOverlayOpacity.value,
  }));

  // Review State
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [newReviewRating, setNewReviewRating] = useState(0);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [localReviews, setLocalReviews] = useState<Review[]>([]);

  // Callback Modal State
  const [isCallbackVisible, setIsCallbackVisible] = useState(false);
  const [callbackName, setCallbackName] = useState('');
  const [callbackPhone, setCallbackPhone] = useState('');
  const [callbackEmail, setCallbackEmail] = useState('');
  const [callbackMessage, setCallbackMessage] = useState('');
  const [preferredContactSlot, setPreferredContactSlot] = useState('Evening');
  const [buyingTimeline, setBuyingTimeline] = useState('Within 3 months');

  // Locality Comparison State
  const [isLocalityCompareVisible, setIsLocalityCompareVisible] = useState(false);
  const [compareLocalityId, setCompareLocalityId] = useState<string | 'city_avg' | null>(null);

  // Business Features State
  const [isEMIComparisonVisible, setIsEMIComparisonVisible] = useState(false);
  const [isTrustModalVisible, setIsTrustModalVisible] = useState(false);
  const [isAIChatVisible, setIsAIChatVisible] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: `Hi! I'm your AI assistant for ${property.name}. Ask me anything. I can help with this property's pricing, EMI, locality, trust checks, and also general questions.`,
      sender: 'ai'
    }
  ]);
  const [isChatResponding, setIsChatResponding] = useState(false);
  const [chatStatusMessage, setChatStatusMessage] = useState<string | null>(null);
  const [lastAIIntent, setLastAIIntent] = useState<string | null>(null);
  const [visitStatus, setVisitStatus] = useState<'none' | 'scheduled' | 'completed'>('none');
  const [isFeedbackModalVisible, setIsFeedbackModalVisible] = useState(false);
  const [visitFeedback, setVisitFeedback] = useState('');
  const [isDocumentVaultVisible, setIsDocumentVaultVisible] = useState(false);

  // Price Breakup State
  const [isPriceBreakupVisible, setIsPriceBreakupVisible] = useState(false);

  // Comparison State
  const [isCompareVisible, setIsCompareVisible] = useState(false);
  const [compareWithId, setCompareWithId] = useState<string | null>(null);

  // Advanced Search & Filters State
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [filterBudget, setFilterBudget] = useState('1.5 Cr');
  const [filterPropertyType, setFilterPropertyType] = useState('Apartment');
  const [filterBHK, setFilterBHK] = useState('3 BHK');
  const [filterPossession, setFilterPossession] = useState('Ready');
  const [filterBuilder, setFilterBuilder] = useState('');
  const [filterAmenities, setFilterAmenities] = useState<string[]>([]);
  const [filterReraOnly, setFilterReraOnly] = useState(true);
  const [isSearchSaved, setIsSearchSaved] = useState(false);
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const [isFiltersApplied, setIsFiltersApplied] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadPersistedState = async () => {
      try {
        const [favoritesRaw, recentRaw] = await Promise.all([
          AsyncStorage.getItem(FAVORITES_STORAGE_KEY),
          AsyncStorage.getItem(RECENT_VIEWS_STORAGE_KEY),
        ]);

        if (!isMounted) return;

        if (favoritesRaw) {
          const parsed = JSON.parse(favoritesRaw);
          if (Array.isArray(parsed)) {
            setFavoritePropertyIds(parsed.filter((id): id is string => typeof id === 'string'));
          }
        }

        if (recentRaw) {
          const parsed = JSON.parse(recentRaw);
          if (Array.isArray(parsed)) {
            setRecentViewIds(parsed.filter((id): id is string => typeof id === 'string'));
          }
        }
      } catch {
        // Ignore transient persistence failures and continue.
      }
    };

    loadPersistedState();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoritePropertyIds)).catch(() => {
      // Ignore transient persistence failures and continue.
    });
  }, [favoritePropertyIds]);

  useEffect(() => {
    AsyncStorage.setItem(RECENT_VIEWS_STORAGE_KEY, JSON.stringify(recentViewIds)).catch(() => {
      // Ignore transient persistence failures and continue.
    });
  }, [recentViewIds]);

  useEffect(() => {
    setIsFeatured(!!property.isFeatured || resolvedPropertyId === '1');
    setIsPriceDropAlertActive(false);
    setIsFiltersApplied(false);
    setChatMessages([
      {
        id: '1',
        text: `Hi! I'm your AI assistant for ${property.name}. Ask me anything. I can help with this property's pricing, EMI, locality, trust checks, and also general questions.`,
        sender: 'ai'
      }
    ]);
    setChatStatusMessage(null);
    setLastAIIntent(null);
    setRecentViewIds((prev) => {
      const next = [resolvedPropertyId, ...prev.filter((id) => id !== resolvedPropertyId)];
      return next.slice(0, RECENT_VIEW_LIMIT);
    });
  }, [resolvedPropertyId, property.isFeatured, property.name]);

  useEffect(() => {
    setIsFavorited(favoritePropertyIds.includes(resolvedPropertyId));
  }, [favoritePropertyIds, resolvedPropertyId]);

  useEffect(() => {
    return () => {
      try {
        webSpeechRecognitionRef.current?.stop?.();
      } catch {
        // Ignore cleanup failures.
      }
    };
  }, []);

  const lastTapRef = useRef<{ time: number; side: 'left' | 'right' | null }>({ time: 0, side: null });
  const videoViewRef = useRef<VideoView | null>(null);

  const similarProperties = useMemo<PropertyListItem[]>(() =>
    Object.keys(PROPERTIES_DATA)
      .filter((key) => key !== resolvedPropertyId)
      .map((key) => ({ id: key, ...PROPERTIES_DATA[key] })),
    [resolvedPropertyId]
  );

  const recentlyViewedProperties = useMemo<PropertyListItem[]>(
    () =>
      recentViewIds
        .filter((id) => id !== resolvedPropertyId && Boolean(PROPERTIES_DATA[id]))
        .map((id) => ({ id, ...PROPERTIES_DATA[id] })),
    [recentViewIds, resolvedPropertyId]
  );

  const propertyPriceValue = useMemo(() => parsePrice(property.price || '0'), [property.price]);
  const propertySqftValue = useMemo(() => {
    return parseFloat(String(property.sqft || '0').replace(/,/g, '')) || 0;
  }, [property.sqft]);
  const propertyPricePerSqft = useMemo(() => {
    if (!propertyPriceValue || !propertySqftValue) return 0;
    return Math.round(propertyPriceValue / propertySqftValue);
  }, [propertyPriceValue, propertySqftValue]);
  const localityAvgPricePerSqft = useMemo(() => parsePrice(property.avgPrice || '0'), [property.avgPrice]);
  const localityPriceDelta = useMemo(() => {
    if (!propertyPricePerSqft || !localityAvgPricePerSqft) return null;
    const rawDiff = propertyPricePerSqft - localityAvgPricePerSqft;
    return {
      isAbove: rawDiff > 0,
      diff: Math.abs(rawDiff),
      percent: Math.abs((rawDiff / localityAvgPricePerSqft) * 100).toFixed(1),
    };
  }, [propertyPricePerSqft, localityAvgPricePerSqft]);

  const cityName = useMemo(() => {
    const parts = property.location.split(',').map(p => p.trim()).filter(Boolean);
    return parts[parts.length - 1] || property.location;
  }, [property.location]);

  const getFilteredProperties = (list: PropertyListItem[]) => {
    const budgetLimit = parsePrice(filterBudget || '0');
    const needs4Plus = filterBHK.includes('4+');
    const bhkCount = parseInt(filterBHK, 10);
    const normalizedBuilder = filterBuilder.trim().toLowerCase();

    return list.filter((candidate) => {
      const candidatePrice = parsePrice(candidate.price || '0');
      const candidateStatus = String(candidate.status || '').toLowerCase();
      const candidatePossession = String(candidate.possession || '').toLowerCase();
      const candidateAmenities = Object.values(candidate.amenities || {})
        .flat()
        .map((item) => String(item).toLowerCase());
      const isReadyProperty = candidateStatus.includes('ready') || candidatePossession.includes('immediate');
      const possessionMatch =
        filterPossession === 'Under Construction'
          ? candidateStatus.includes('under construction')
          : isReadyProperty;
      const bhkMatch = needs4Plus
        ? (candidate.beds || 0) >= 4
        : Number.isNaN(bhkCount)
          ? true
          : (candidate.beds || 0) === bhkCount;
      const amenitiesMatch = filterAmenities.every((amenity) =>
        candidateAmenities.some((item) => item.includes(amenity.toLowerCase()))
      );
      const builderMatch =
        !normalizedBuilder ||
        String(candidate.builder || '').toLowerCase().includes(normalizedBuilder);

      return (
        (!budgetLimit || candidatePrice <= budgetLimit) &&
        (!filterPropertyType || candidate.type === filterPropertyType) &&
        bhkMatch &&
        possessionMatch &&
        builderMatch &&
        amenitiesMatch &&
        (!filterReraOnly || Boolean(candidate.reraId))
      );
    });
  };

  const filteredSimilarProperties = useMemo(() => {
    if (!isFiltersApplied) return similarProperties;
    return getFilteredProperties(similarProperties);
  }, [
    isFiltersApplied,
    similarProperties,
    filterBudget,
    filterPropertyType,
    filterBHK,
    filterPossession,
    filterBuilder,
    filterAmenities,
    filterReraOnly,
  ]);

  const recommendedProperties = useMemo(() => {
    const cityToken = cityName.toLowerCase();

    return filteredSimilarProperties
      .map((candidate) => {
        let score = 45;
        if (candidate.type === property.type) score += 20;
        if (Math.abs((candidate.beds || 0) - (property.beds || 0)) <= 1) score += 12;
        if (String(candidate.location || '').toLowerCase().includes(cityToken)) score += 10;

        const candidatePrice = parsePrice(candidate.price || '0');
        if (propertyPriceValue > 0) {
          const diffRatio = Math.abs(candidatePrice - propertyPriceValue) / propertyPriceValue;
          if (diffRatio <= 0.15) score += 13;
          else if (diffRatio <= 0.30) score += 8;
        }

        if (candidate.isFeatured) score += 5;

        return { ...candidate, score: Math.min(score, 99) };
      })
      .sort((a, b) => b.score - a.score);
  }, [filteredSimilarProperties, property.type, property.beds, propertyPriceValue, cityName]);

  const chartData = useMemo(() => {
    return (property.priceHistory || []).map(item => ({
      value: item.value,
      label: item.month,
    }));
  }, [property.priceHistory]);

  const priceUnit = useMemo(() => {
    const p = property.price.toLowerCase();
    if (p.includes('cr')) return 'Cr';
    if (p.includes('lakh')) return 'L';
    return '';
  }, [property.price]);

  const maxValue = useMemo(() => {
    const values = chartData.map(d => d.value);
    if (values.length === 0) return 10;
    return Math.max(...values) * 1.2; // Add 20% headroom
  }, [chartData]);

  const priceTrend = useMemo(() => {
    const history = property.priceHistory || [];
    if (history.length < 2) return null;
    const first = history[0].value;
    if (first <= 0) return null;
    const last = history[history.length - 1].value;
    const diff = last - first;
    const percentage = ((diff / first) * 100).toFixed(1);
    const isUp = diff >= 0;
    return {
      percentage: Math.abs(parseFloat(percentage)),
      isUp,
      months: history.length
    };
  }, [property.priceHistory]);

  useEffect(() => {
    const initialReviews = property.reviews || [
      {
        user: 'Rahul Sharma',
        rating: 5,
        date: '2 months ago',
        comment: 'The locality is extremely safe and well-maintained. Perfect for families with children.',
        tags: ['Safe', 'Family Friendly', 'Clean'],
      },
      {
        user: 'Priya V.',
        rating: 4,
        date: '1 month ago',
        comment: 'Great connectivity to the metro station. The only downside is the traffic during peak hours.',
        tags: ['Well-connected', 'Great Amenities'],
      },
    ];
    setLocalReviews(initialReviews);
  }, [resolvedPropertyId, property.reviews]);

  const [activeVideoIndex, setActiveVideoIndex] = useState(0);

  const videoCandidates = useMemo(() => {
    const mappedVideo = PROPERTY_VIDEO_URLS[resolvedPropertyId];
    const propertyVideo =
      property.videoUrl &&
      property.videoUrl !== DEFAULT_VIDEO_PLACEHOLDER &&
      !isLegacySampleVideo(property.videoUrl)
        ? property.videoUrl
        : undefined;

    return Array.from(
      new Set(
        [mappedVideo, propertyVideo, ...RELIABLE_VIDEO_FALLBACKS, DEFAULT_VIDEO_PLACEHOLDER].filter(
          (url): url is string => typeof url === 'string' && url.length > 0
        )
      )
    );
  }, [resolvedPropertyId, property.videoUrl]);

  const resolvedVideoUrl = videoCandidates[activeVideoIndex] || DEFAULT_VIDEO_PLACEHOLDER;
  const canTryNextVideo = activeVideoIndex < videoCandidates.length - 1;

  const moveToNextVideoSource = () => {
    if (!canTryNextVideo) return false;
    setActiveVideoIndex((prev) => Math.min(prev + 1, videoCandidates.length - 1));
    setHasError(false);
    setIsBuffering(true);
    return true;
  };

  const videoSource = useMemo(() => ({ uri: resolvedVideoUrl }), [resolvedVideoUrl]);

  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = true;
    p.muted = Platform.OS === 'web';
    p.volume = 1.0;
    p.playbackRate = playbackSpeed;
  });

  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    setActiveVideoIndex(0);
    setHasError(false);
    setIsBuffering(false);
  }, [resolvedPropertyId, property.videoUrl]);

  const resetControlsTimer = () => {
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    setShowControls(true);
    if (isPlaying) {
      controlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  useEffect(() => {
    if (isPlaying) {
      resetControlsTimer();
    } else {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
      setShowControls(true);
    }
  }, [isPlaying]);

  useEffect(() => {
    // Sync initial state
    setIsBuffering(player.status === 'loading');
    if (player.status === 'error') {
      if (!moveToNextVideoSource()) {
        setHasError(true);
      }
    } else {
      setHasError(false);
    }
    setIsPlaying(player.playing);

    const interval = setInterval(() => {
      if (player.duration > 0) {
        setProgress(player.currentTime / player.duration);
      }
    }, 500);

    const statusSub = player.addListener('statusChange', (payload: any) => {
      setIsBuffering(payload.status === 'loading');
      if (payload.status === 'error') {
        if (!moveToNextVideoSource()) {
          setHasError(true);
        }
      } else {
        setHasError(false);
      }
    });
    const playingSub = player.addListener('playingChange', (payload: any) => {
      setIsPlaying(payload.isPlaying);
    });
    return () => {
      clearInterval(interval);
      statusSub.remove();
      playingSub.remove();
    };
  }, [player, activeVideoIndex, videoCandidates.length]);

  const togglePlay = () => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
    resetControlsTimer();
  };

  useEffect(() => {
    player.playbackRate = playbackSpeed;
  }, [playbackSpeed, player]);

  const skipForward = () => {
    player.currentTime = Math.min(player.duration, player.currentTime + 10);
    resetControlsTimer();
  };

  const skipBackward = () => {
    player.currentTime = Math.max(0, player.currentTime - 10);
    resetControlsTimer();
  };

  const handleVideoPress = (side: 'left' | 'right') => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (lastTapRef.current.side === side && (now - lastTapRef.current.time) < DOUBLE_TAP_DELAY) {
      if (side === 'left') skipBackward();
      else skipForward();
      
      setDoubleTapSide(side);
      setTimeout(() => setDoubleTapSide(null), 600);
      
      lastTapRef.current = { time: 0, side: null };
    } else {
      lastTapRef.current = { time: now, side };
      
      if (showControls) {
        setShowControls(false);
      } else {
        resetControlsTimer();
      }
    }
  };

  const toggleMute = () => {
    player.muted = !player.muted;
    setIsMuted(player.muted);
    resetControlsTimer();
  };

  const togglePlaybackSpeed = () => {
    const speeds = [1, 1.5, 2, 0.5];
    const nextIndex = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIndex];
    setPlaybackSpeed(nextSpeed);
    resetControlsTimer();
  };

  const toggleFullscreen = async () => {
    try {
      if (isFullscreen) {
        await videoViewRef.current?.exitFullscreen();
      } else {
        await videoViewRef.current?.enterFullscreen();
      }
    } catch (error) {
      console.warn('Fullscreen toggle failed', error);
    }
    resetControlsTimer();
  };

  // YouTube-style Swipe Gestures
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, { dx, dy }) => {
          // Capture if vertical swipe is dominant and significant
          return Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 20;
        },
        onPanResponderRelease: (_, { dy }) => {
          if (dy < -60) {
            resetControlsTimer(); // Swipe Up -> show controls
          } else if (dy > 60) {
            setViewMode('image'); // Swipe Down -> Exit Video Mode
          }
        },
      }),
    [player]
  );

  useEffect(() => {
    player.muted = isMuted;
  }, [isMuted, player]);

  useEffect(() => {
    if (viewMode !== 'video' && isFullscreen) {
      videoViewRef.current?.exitFullscreen().catch(() => {
        // Ignore exit failures when leaving video mode.
      });
    }
  }, [viewMode, isFullscreen]);

  useEffect(() => {
    setIsMuted(Platform.OS === 'web');
    setPlaybackSpeed(1);
    setProgress(0);
    setIsFullscreen(false);
  }, [resolvedPropertyId]);

  useEffect(() => {
    if (viewMode === 'video') {
      try {
        player.play();
      } catch (e) {
        console.log("Autoplay blocked or failed", e);
      }
    } else {
      player.pause();
    }
  }, [viewMode, player]);

  // 3D Animation Logic
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (viewMode === '3d') {
      rotation.value = withRepeat(
        withTiming(360, {
          duration: 10000,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    } else {
      rotation.value = 0;
    }
  }, [viewMode]);

  const estimatedMonthlyPayment = useMemo(() => {
    const dp = Math.max(0, Math.min(100, parseFloat(downPayment) || 0));
    const ir = Math.max(0, Math.min(20, parseFloat(interestRate) || 0));
    const years = Math.max(1, Math.min(50, parseFloat(loanTerm) || 1));

    const principal = parsePrice(property.price) * (1 - dp / 100);
    const monthlyRate = ir / 100 / 12;
    const numberOfPayments = years * 12;
    
    if (monthlyRate === 0) return (principal / numberOfPayments).toLocaleString(undefined, { maximumFractionDigits: 0 });
    
    const monthlyPayment = 
      (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

    return isNaN(monthlyPayment) ? '0' : monthlyPayment.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }, [downPayment, interestRate, loanTerm, property.price]);

  const estimatedMonthlyPaymentValue = useMemo(
    () => Number(String(estimatedMonthlyPayment || '0').replace(/,/g, '')) || 0,
    [estimatedMonthlyPayment]
  );

  // ROI Calculator State
  const [expectedMonthlyRent, setExpectedMonthlyRent] = useState('45000');
  const [monthlyHouseholdIncome, setMonthlyHouseholdIncome] = useState('250000');
  const [commuteMode, setCommuteMode] = useState<'Drive' | 'Metro' | 'Bike'>('Drive');

  const rentalYieldPercent = useMemo(() => {
    const annualRent = (parseFloat(expectedMonthlyRent) || 0) * 12;
    const price = parsePrice(property.price);
    if (price === 0) return '0.0';
    return ((annualRent / price) * 100).toFixed(1);
  }, [expectedMonthlyRent, property.price]);

  const fiveYearROI = useMemo(() => {
    const price = parsePrice(property.price);
    if (price === 0) return '0.0';
    const totalRent = (parseFloat(expectedMonthlyRent) || 0) * 12 * 5;
    // Assuming a conservative 25% appreciation over 5 years for ROI calculation
    const appreciation = price * 0.25; 
    const totalGain = totalRent + appreciation;
    return ((totalGain / price) * 100).toFixed(1);
  }, [expectedMonthlyRent, property.price]);

  const affordabilitySummary = useMemo(() => {
    const monthlyIncome = Math.max(0, parseFloat(monthlyHouseholdIncome) || 0);
    if (monthlyIncome === 0 || estimatedMonthlyPaymentValue === 0) {
      return {
        ratio: null as number | null,
        label: 'Unavailable',
        tone: '#94a3b8',
        recommendation: 'Enter household income to evaluate affordability.',
      };
    }

    const ratio = (estimatedMonthlyPaymentValue / monthlyIncome) * 100;
    if (ratio <= 30) {
      return {
        ratio,
        label: 'Comfortable',
        tone: '#22c55e',
        recommendation: 'This EMI is within a healthy range for long-term affordability.',
      };
    }
    if (ratio <= 45) {
      return {
        ratio,
        label: 'Stretch',
        tone: '#fbbf24',
        recommendation: 'Manageable, but keep at least 6 months of emergency reserves.',
      };
    }
    return {
      ratio,
      label: 'High Risk',
      tone: '#ef4444',
      recommendation: 'Consider a higher down payment, longer tenure, or a lower budget.',
    };
  }, [monthlyHouseholdIncome, estimatedMonthlyPaymentValue]);

  const bankEMIs = useMemo(() => {
    const dp = Math.max(0, Math.min(95, parseFloat(downPayment) || 20));
    const principal = parsePrice(property.price) * (1 - dp / 100);
    const years = Math.max(1, Math.min(40, parseFloat(loanTerm) || 20));
    
    return BANK_RATES.map(bank => {
      const monthlyRate = bank.rate / 100 / 12;
      const numberOfPayments = years * 12;
      const denominator = Math.pow(1 + monthlyRate, numberOfPayments) - 1;
      const emi =
        denominator === 0
          ? principal / numberOfPayments
          : (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / denominator;
      return {
        ...bank,
        emi: Number.isFinite(emi) ? Math.round(emi).toLocaleString('en-IN') : '0'
      };
    });
  }, [property.price, downPayment, loanTerm]);

  const trustScore = property.trustScore || 82;
  const trustLevel = useMemo(() => {
    if (trustScore >= 80) return { label: 'High', color: '#22c55e' };
    if (trustScore >= 60) return { label: 'Moderate', color: '#fbbf24' };
    return { label: 'Low', color: '#ef4444' };
  }, [trustScore]);

  const priceFairness = useMemo(() => {
    const sqft = parseFloat(property.sqft.replace(/,/g, '')) || 1;
    const currentPricePerSqft = parsePrice(property.price) / sqft;
    const avgPriceNum = parsePrice(property.avgPrice || '0');
    
    if (avgPriceNum === 0) return null;
    
    const diff = avgPriceNum - currentPricePerSqft;
    const isFair = diff >= 0;
    
    return {
      diff: Math.abs(Math.round(diff)).toLocaleString('en-IN'),
      isFair,
      percent: Math.abs((diff / avgPriceNum) * 100).toFixed(1)
    };
  }, [property.price, property.sqft, property.avgPrice]);

  const buyerSignals = useMemo(() => {
    const signals: string[] = [];
    const moveInReady =
      String(property.status || '').toLowerCase().includes('ready') ||
      String(property.possession || '').toLowerCase().includes('immediate');

    if (trustScore >= 80) {
      signals.push('High trust score with strong document verification.');
    }
    if (priceFairness?.isFair) {
      signals.push(`Priced ${priceFairness.percent}% below the locality average.`);
    }
    if (parseFloat(rentalYieldPercent) >= 3.5) {
      signals.push(`Estimated rental yield of ${rentalYieldPercent}% supports investor demand.`);
    }
    if (moveInReady) {
      signals.push('Ready possession profile for faster move-in.');
    }
    if (!signals.length) {
      signals.push('Balanced price-growth profile for long-term buyers.');
    }

    return signals.slice(0, 3);
  }, [trustScore, priceFairness, rentalYieldPercent, property.status, property.possession]);

  const commuteInsights = useMemo(() => {
    const speedByMode = {
      Drive: 24,
      Metro: 30,
      Bike: 15,
    } as const;

    const connectivitySeed =
      property.connectivity ||
      [
        { name: 'Global International School', distance: '0.5 km', type: 'school' },
        { name: 'City Hospital', distance: '1.2 km', type: 'hospital' },
        { name: 'Metro Station Blue Line', distance: '0.8 km', type: 'metro' },
      ];

    const pace = speedByMode[commuteMode] || 20;
    return connectivitySeed.slice(0, 4).map((item) => {
      const distanceKm = parseFloat(String(item.distance || '').replace(/[^\d.]/g, '')) || 0;
      const etaMinutes = Math.max(3, Math.round((distanceKm / pace) * 60));
      return {
        ...item,
        etaMinutes,
      };
    });
  }, [property.connectivity, commuteMode]);

  const resolveFeatureIcon = (icon: keyof typeof Ionicons.glyphMap | string) => {
    if (typeof icon === 'string' && icon in Ionicons.glyphMap) {
      return icon as keyof typeof Ionicons.glyphMap;
    }
    return 'checkmark-circle-outline';
  };

  const amenityHighlights = useMemo(() => {
    if (!property.amenities) return [];
    return Array.from(new Set(Object.values(property.amenities).flat())).slice(0, 8);
  }, [property.amenities]);

  const classifyChatIntent = (query: string) => {
    const text = query.toLowerCase().replace(/\s+/g, ' ').trim();
    const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const hasTerm = (term: string) => {
      const normalizedTerm = term.toLowerCase().trim();
      if (!normalizedTerm) return false;
      if (normalizedTerm.includes(' ')) {
        return text.includes(normalizedTerm);
      }
      return new RegExp(`\\b${escapeRegExp(normalizedTerm)}\\b`, 'i').test(text);
    };
    const includesAny = (terms: string[]) => terms.some((term) => hasTerm(term));

    if (includesAny(['hi', 'hello', 'hey', 'good morning', 'good evening'])) return 'greeting';
    if (includesAny(['family', 'kids', 'children', 'school', 'safe'])) return 'family';
    if (includesAny(['price', 'cost', 'expensive', 'fair', 'overpriced', 'cheap'])) return 'price';
    if (includesAny(['emi', 'mortgage', 'loan', 'afford', 'down payment', 'monthly'])) return 'emi';
    if (includesAny(['invest', 'investment', 'roi', 'yield', 'return', 'appreciation', 'worth'])) return 'investment';
    if (includesAny(['locality', 'neighborhood', 'location', 'connectivity', 'metro', 'hospital', 'school nearby', 'commute'])) return 'locality';
    if (includesAny(['amenities', 'facilities', 'clubhouse', 'gym', 'pool', 'parking'])) return 'amenities';
    if (includesAny(['builder', 'rera', 'legal', 'trust', 'verified', 'document'])) return 'trust';
    if (includesAny(['possession', 'handover', 'timeline', 'ready', 'when can i move'])) return 'possession';
    if (includesAny(['risk', 'cons', 'bad', 'drawback', 'problem', 'negative'])) return 'risks';
    if (includesAny(['visit', 'schedule', 'book', 'site visit', 'call me', 'agent'])) return 'next_step';
    return 'general';
  };

  const requestRemoteAIResponse = async (
    question: string,
    conversation: ChatMessage[]
  ): Promise<{ answer: string | null; endpointFailed: boolean }> => {
    const payload = {
      assistantMode: 'property',
      question,
      property: {
        id: resolvedPropertyId,
        name: property.name,
        location: property.location,
        price: property.price,
        type: property.type,
        beds: property.beds,
        baths: property.baths,
        sqft: property.sqft,
        status: property.status,
        possession: property.possession,
        builder: property.builder,
        reraId: property.reraId,
        localityScores: property.localityScores,
        amenities: property.amenities,
        connectivity: property.connectivity,
        localityInsights: property.localityInsights,
        localitySentiment: property.localitySentiment,
      },
      metrics: {
        trustScore,
        rentalYieldPercent,
        fiveYearROI,
        estimatedMonthlyPayment,
        priceFairness,
        affordabilitySummary,
      },
      recentConversation: conversation.slice(-8).map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text,
      })),
    };

    let endpointFailed = false;

    if (AI_ASSISTANT_ENDPOINT) {
      try {
        const res = await fetch(AI_ASSISTANT_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = await res.json();
          const answer =
            (typeof data?.answer === 'string' && data.answer) ||
            (typeof data?.response === 'string' && data.response) ||
            (typeof data?.message === 'string' && data.message) ||
            null;

          if (answer?.trim()) {
            return { answer: answer.trim(), endpointFailed: false };
          }
        } else {
          endpointFailed = true;
        }
      } catch {
        endpointFailed = true;
      }
    } else {
      endpointFailed = true;
    }

    if (GEMINI_API_KEY) {
      try {
        const geminiPrompt = [
          `Question: ${question}`,
          'Property data:',
          JSON.stringify(payload.property, null, 2),
          'Calculated metrics:',
          JSON.stringify(payload.metrics, null, 2),
          'Recent conversation:',
          JSON.stringify(payload.recentConversation, null, 2),
        ].join('\n\n');

        const geminiRes = await fetch(
          `${GEMINI_API_BASE}/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: {
                role: 'system',
                parts: [{
                  text: [
                    'You are EstatePerks AI Property Assistant.',
                    'If the user asks about this property, use provided property data and metrics.',
                    'If user asks general questions, answer clearly and concisely.',
                    'Do not invent property facts that are not provided.',
                    'When uncertain, state what details should be verified next.',
                  ].join('\n'),
                }],
              },
              contents: [{
                role: 'user',
                parts: [{ text: geminiPrompt }],
              }],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 520,
                topP: 0.9,
              },
            }),
          }
        );

        if (geminiRes.ok) {
          const data = await geminiRes.json() as {
            candidates?: { content?: { parts?: { text?: string }[] } }[];
          };
          const parts = (data?.candidates?.[0]?.content?.parts ?? []) as { text?: string }[];
          const answer = parts
            .map((part) => (typeof part?.text === 'string' ? part.text.trim() : ''))
            .filter(Boolean)
            .join('\n')
            .trim();

          if (answer) {
            return { answer, endpointFailed: false };
          }
        }
      } catch {
        // Ignore and use instant fallback below.
      }
    }

    return { answer: null, endpointFailed };
  };

  const handleAIChat = (input?: string) => {
    const message = typeof input === 'string' ? input : chatInput;
    if (!message.trim() || isChatResponding) return;

    const currentInput = message.trim();
    const userMsg: ChatMessage = { id: Date.now().toString(), text: currentInput, sender: 'user' };
    const conversation = [...chatMessages, userMsg];
    setChatMessages((prev) => [...prev, userMsg]);
    if (typeof input !== 'string') setChatInput('');
    setChatStatusMessage(null);
    setIsChatResponding(true);

    setTimeout(async () => {
      try {
        const { answer, endpointFailed } = await requestRemoteAIResponse(currentInput, conversation);
        if (answer) {
          const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), text: answer, sender: 'ai' };
          setLastAIIntent('remote_ai');
          setChatMessages((prev) => [...prev, aiMsg]);
          return;
        }

        if (endpointFailed) {
          setChatStatusMessage('Live AI endpoint is unavailable right now. Showing instant property guidance.');
        }

        const detectedIntent = classifyChatIntent(currentInput);
        const intent = detectedIntent === 'general' && /why|how|explain|more|detail/.test(currentInput.toLowerCase()) && lastAIIntent
          ? lastAIIntent
          : detectedIntent;
        setLastAIIntent(intent);

        const safetyScore = property.localityScores?.find((s) => s.label === 'Safety')?.score;
        const connectivityScore = property.localityScores?.find((s) => s.label === 'Connectivity')?.score;
        const lifestyleScore = property.localityScores?.find((s) => s.label === 'Lifestyle')?.score;
        const topSchools = (property.connectivity || []).filter((item) => item.type === 'school').slice(0, 2);
        const topHospitals = (property.connectivity || []).filter((item) => item.type === 'hospital').slice(0, 2);
        const moveInReady =
          String(property.status || '').toLowerCase().includes('ready') ||
          String(property.possession || '').toLowerCase().includes('immediate');
        const bestBank = bankEMIs
          .map((bank) => ({ ...bank, numericEmi: parseInt(String(bank.emi).replace(/[^\d]/g, ''), 10) || Number.MAX_SAFE_INTEGER }))
          .sort((a, b) => a.numericEmi - b.numericEmi)[0];

        let response = '';

        if (intent === 'greeting') {
          response = `Hi! I can help with ${property.name}'s price analysis, EMI, investment outlook, locality quality, amenities, and trust factors. What would you like to evaluate first?`;
        } else if (intent === 'family') {
          const familyAmenityHint = amenityHighlights.filter((item) =>
            /kids|play|park|security|school|garden/i.test(item)
          ).slice(0, 3);
          const familyVerdict =
            (safetyScore || 0) >= 8
              ? 'This looks like a strong family-friendly option.'
              : (safetyScore || 0) >= 6
              ? 'This can work for families, with a few trade-offs.'
              : 'I would evaluate this carefully for family usage.';

          response = `${familyVerdict} Safety score is ${safetyScore ?? 'N/A'}/10 and connectivity is ${connectivityScore ?? 'N/A'}/10.` +
            `${topSchools.length ? ` Nearby schools: ${topSchools.map((s) => `${s.name} (${s.distance})`).join(', ')}.` : ''}` +
            `${familyAmenityHint.length ? ` Family-relevant amenities include ${familyAmenityHint.join(', ')}.` : ''}`;
        } else if (intent === 'price') {
          if (!priceFairness) {
            response = `Listed price is ${property.price}. I don't have reliable locality benchmark data for exact fair-value scoring, but I can estimate EMI and investment return if you share your budget and down payment.`;
          } else if (priceFairness.isFair) {
            response = `Price looks attractive. ${property.name} is around INR ${priceFairness.diff}/sqft (${priceFairness.percent}%) below the locality benchmark, while offering ${property.type} specs (${property.beds} bed, ${property.baths} bath, ${property.sqft} sqft).`;
          } else {
            response = `Price is premium by about ${priceFairness.percent}% vs locality average. It may still be justified if builder trust, location access, and amenity depth are your top priorities.`;
          }
        } else if (intent === 'emi') {
          response = `Estimated EMI is INR ${estimatedMonthlyPayment}/month with current assumptions. Affordability status is ${affordabilitySummary.label}` +
            `${affordabilitySummary.ratio !== null ? ` (${affordabilitySummary.ratio.toFixed(1)}% of monthly income).` : '.'}` +
            `${bestBank ? ` Lowest EMI in our bank panel is ${bestBank.name}: INR ${bestBank.emi}.` : ''} ${affordabilitySummary.recommendation}`;
        } else if (intent === 'investment') {
          const insightText = property.aiInsights?.summary ? ` ${property.aiInsights.summary}` : '';
          response = `Investment snapshot: rental yield is ${rentalYieldPercent}% and estimated 5-year total ROI is ${fiveYearROI}%.` +
            `${property.localityInsights?.length ? ` Locality trend: ${property.localityInsights.map((i) => `${i.label} ${i.value}`).join(', ')}.` : ''}` +
            insightText;
        } else if (intent === 'locality') {
          const commuteLine = commuteInsights
            .slice(0, 3)
            .map((item) => `${item.name} (${item.distance}, ~${item.etaMinutes} min by ${commuteMode.toLowerCase()})`)
            .join('; ');

          response = `${property.location} has locality scores of Safety ${safetyScore ?? 'N/A'}/10, Connectivity ${connectivityScore ?? 'N/A'}/10, and Lifestyle ${lifestyleScore ?? 'N/A'}/10.` +
            `${commuteLine ? ` Quick access points: ${commuteLine}.` : ''}` +
            `${topHospitals.length ? ` Nearby hospitals: ${topHospitals.map((h) => `${h.name} (${h.distance})`).join(', ')}.` : ''}`;
        } else if (intent === 'amenities') {
          const categorySummary = property.amenities
            ? Object.keys(property.amenities)
                .slice(0, 3)
                .map((cat) => `${cat}: ${property.amenities?.[cat]?.slice(0, 3).join(', ')}`)
                .join(' | ')
            : '';
          response = categorySummary
            ? `Top amenities for ${property.name}: ${categorySummary}.`
            : `Core highlights include ${property.features?.map((f) => f.label).slice(0, 4).join(', ') || 'modern lifestyle amenities'}.`;
        } else if (intent === 'trust') {
          response = `Trust snapshot: Builder is ${property.builder}${property.builderExperience ? ` (${property.builderExperience})` : ''}.` +
            `${property.totalProjects ? ` Delivered projects: ${property.totalProjects}.` : ''}` +
            ` RERA ID: ${property.reraId}. Internal trust score is ${trustScore}/100 (${trustLevel.label}).`;
        } else if (intent === 'possession') {
          response = `${property.status} project with possession target: ${property.possession}.` +
            `${moveInReady ? ' This is suitable for near-immediate move-in.' : ' This is better for planned move-in and phased payment buyers.'}` +
            `${property.timeline?.length ? ` Timeline milestones: ${property.timeline.slice(0, 3).map((t) => `${t.date} - ${t.label}`).join('; ')}.` : ''}`;
        } else if (intent === 'risks') {
          const riskList = property.localitySentiment?.cons?.length
            ? property.localitySentiment.cons.slice(0, 3).join(', ')
            : 'premium maintenance outgo and possible peak-hour traffic';
          response = `Key risks to consider: ${riskList}.` +
            `${!priceFairness ? '' : priceFairness.isFair ? ' Pricing risk is relatively controlled versus locality averages.' : ' Pricing is on the premium side, so negotiation is important.'}` +
            ` I can help you with a negotiation-ready checklist if needed.`;
        } else if (intent === 'next_step') {
          response = 'Best next step is a site visit plus a document check. If you want, I can suggest a focused checklist for visit points, legal checks, and price negotiation before you talk to the agent.';
        } else {
          response = `Here's a quick summary for ${property.name}: ${property.type} in ${property.location}, priced at ${property.price}, trust ${trustScore}/100, rental yield ${rentalYieldPercent}%, and estimated EMI INR ${estimatedMonthlyPayment}/month.` +
            ' Ask me a focused question like "Is this good for families?", "Is price fair?", or "What\'s the investment potential?"';
        }

        const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), text: response, sender: 'ai' };
        setChatMessages((prev) => [...prev, aiMsg]);
      } finally {
        setIsChatResponding(false);
      }
    }, 350);
  };

  const handleScheduleVisit = () => {
    if (visitStatus === 'none') {
      setVisitStatus('scheduled');
      Alert.alert("Visit Scheduled", "Your site visit has been scheduled. An agent will contact you shortly.");
    }
  };

  const handleCompleteVisit = () => {
    setVisitStatus('completed');
    addVisit?.({
      id: `visit_${Date.now()}`, 
      name: property.name,
      date: new Date().toISOString(),
      rewardPoints: 500,
    });
    setIsFeedbackModalVisible(true);
  };

  const toggleVoiceSearch = () => {
    if (Platform.OS !== 'web') {
      Alert.alert('Voice Input Unavailable', 'Voice input is currently supported on web in this build.');
      return;
    }

    const SpeechRecognitionCtor =
      (globalThis as any).SpeechRecognition || (globalThis as any).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      Alert.alert('Voice Input Unsupported', 'Your browser does not support speech recognition.');
      return;
    }

    if (isRecording) {
      try {
        webSpeechRecognitionRef.current?.stop?.();
      } catch {
        // Ignore stop errors.
      } finally {
        setIsRecording(false);
      }
      return;
    }

    try {
      setChatStatusMessage(null);
      const recognition = new SpeechRecognitionCtor();
      recognition.lang = 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      recognition.onresult = (event: any) => {
        const transcript = String(event?.results?.[0]?.[0]?.transcript || '').trim();
        if (transcript) {
          handleAIChat(transcript);
        }
      };

      recognition.onerror = () => {
        setChatStatusMessage('Voice recognition failed. Please try again.');
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
        webSpeechRecognitionRef.current = null;
      };

      webSpeechRecognitionRef.current = recognition;
      setIsRecording(true);
      recognition.start();
    } catch {
      setIsRecording(false);
      Alert.alert('Voice Input Error', 'Unable to start voice recognition.');
    }
  };

  const handleSaveSearch = () => {
    setIsSearchSaved(true);
    Alert.alert(
      "Search Saved!",
      "You will receive notifications when new properties matching these filters are listed."
    );
  };

  const applyFilters = () => {
    const newSearch = {
      budget: filterBudget,
      propertyType: filterPropertyType,
      bhk: filterBHK,
      possession: filterPossession,
      builder: filterBuilder,
      amenities: [...filterAmenities],
      reraOnly: filterReraOnly,
      id: Date.now().toString(),
    };
    
    setRecentSearches(prev => [newSearch, ...prev].slice(0, 5));
    const matchingCount = getFilteredProperties(similarProperties).length;
    setIsFiltersApplied(true);
    setIsSearchModalVisible(false);
    Alert.alert("Filters Applied", `${matchingCount} matching properties found.`);
  };

  const loadRecentSearch = (search: any) => {
    setFilterBudget(search.budget);
    setFilterPropertyType(search.propertyType);
    setFilterBHK(search.bhk);
    setFilterPossession(search.possession);
    setFilterBuilder(search.builder);
    setFilterAmenities(search.amenities);
    setFilterReraOnly(search.reraOnly);
  };

  const clearFilters = () => {
    setFilterBudget('1.5 Cr');
    setFilterPropertyType('Apartment');
    setFilterBHK('3 BHK');
    setFilterPossession('Ready');
    setFilterBuilder('');
    setFilterAmenities([]);
    setFilterReraOnly(true);
    setIsSearchSaved(false);
    setIsFiltersApplied(false);
  };

  const handleToggleFavorite = () => {
    const nextState = !isFavorited;
    setIsFavorited(nextState);
    setFavoritePropertyIds((prev) =>
      nextState
        ? Array.from(new Set([...prev, resolvedPropertyId]))
        : prev.filter((id) => id !== resolvedPropertyId)
    );

    Alert.alert(
      nextState ? 'Added to Shortlist' : 'Removed from Shortlist',
      nextState
        ? `${property.name} was added to your shortlisted properties.`
        : `${property.name} was removed from your shortlisted properties.`
    );
  };

  const resetCallbackForm = () => {
    setCallbackName('');
    setCallbackPhone('');
    setCallbackEmail('');
    setCallbackMessage('');
    setPreferredContactSlot('Evening');
    setBuyingTimeline('Within 3 months');
  };

  const handleSubmitCallback = async () => {
    const cleanedPhone = callbackPhone.replace(/\D/g, '');
    const trimmedEmail = callbackEmail.trim().toLowerCase();
    const trimmedName = callbackName.trim();
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);

    if (trimmedName.length < 2) {
      Alert.alert('Validation Error', 'Please enter your full name.');
      return;
    }
    if (!emailValid) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return;
    }
    if (cleanedPhone.length < 10) {
      Alert.alert('Validation Error', 'Please enter a valid phone number.');
      return;
    }

    const leadPayload = {
      id: `lead_${Date.now()}`,
      propertyId: resolvedPropertyId,
      propertyName: property.name,
      name: trimmedName,
      email: trimmedEmail,
      phone: cleanedPhone,
      message: callbackMessage.trim(),
      preferredContactSlot,
      buyingTimeline,
      createdAt: new Date().toISOString(),
      status: 'New',
    };

    try {
      const existingRaw = await AsyncStorage.getItem(CALLBACK_LEADS_STORAGE_KEY);
      const existingLeads = existingRaw ? JSON.parse(existingRaw) : [];
      const nextLeads = [leadPayload, ...(Array.isArray(existingLeads) ? existingLeads : [])].slice(0, 120);
      await AsyncStorage.setItem(CALLBACK_LEADS_STORAGE_KEY, JSON.stringify(nextLeads));
    } catch {
      // Ignore persistence errors; the user intent is still completed.
    }

    Alert.alert(
      'Request Received',
      `An advisor will contact you in the ${preferredContactSlot.toLowerCase()} window.`
    );
    setIsCallbackVisible(false);
    resetCallbackForm();
  };

  const handleTogglePriceDropAlert = () => {
    const newState = !isPriceDropAlertActive;
    setIsPriceDropAlertActive(newState);
    if (newState) {
      Alert.alert("Price Drop Alert On", "We'll notify you if the price of this property drops.");
    }
  };

  const handleSubmitReview = () => {
    if (newReviewRating === 0) {
      Alert.alert("Rating Required", "Please select a star rating.");
      return;
    }
    if (!newReviewComment.trim()) {
      Alert.alert("Comment Required", "Please write a comment.");
      return;
    }

    const newReview: Review = {
      user: 'You',
      rating: newReviewRating,
      comment: newReviewComment,
      date: 'Just now',
      tags: selectedTags,
    };

    setLocalReviews(prev => [newReview, ...prev]);
    setIsReviewModalVisible(false);
    setNewReviewRating(0);
    setNewReviewComment('');
    setSelectedTags([]);
    Alert.alert("Success", "Thank you for your review!");
  };

  const handleWhatsAppShare = () => {
    const url = `https://estate-perks.vercel.app/property/${resolvedPropertyId}`;
    const message = `Check out this property on Estate Perks!\n\n*Name:* ${property.name}\n*Price:* ${property.price}\n*Location:* ${property.location}\n\nView more details: ${url}`;
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;

    Linking.canOpenURL(whatsappUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(whatsappUrl);
        } else {
          const webWhatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
          return Linking.openURL(webWhatsappUrl);
        }
      })
      .catch((err) => console.error('An error occurred', err));
  };

  const priceBreakup = useMemo(() => {
    const basePrice = parsePrice(property.price);
    const tax = Math.round(basePrice * 0.05); // Estimated 5% GST
    const registration = Math.round(basePrice * 0.06); // Estimated 6% Stamp Duty & Registration
    const sqftNum = parseFloat(property.sqft.replace(/,/g, '')) || 0;
    const maintenance = Math.round(sqftNum * 3 * 12); // Estimated ₹3/sqft for 12 months
    const total = basePrice + tax + registration + maintenance;

    return { basePrice, tax, registration, maintenance, total };
  }, [property.price, property.sqft]);

  const animated3DStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${rotation.value}deg` }],
  }));

  const handleShare = async () => {
    await Share.share({
      message: `Check out this property: ${property.name}`,
      url:
        Platform.OS === 'web'
          ? `https://estate-perks.vercel.app/property/${resolvedPropertyId}`
          : undefined,
    });
  };

  const handleDownloadBrochure = async () => {
    const html = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica'; padding: 40px; color: #0f172a; background-color: #f8fafc; }
            .header { border-bottom: 2px solid #22d3ee; padding-bottom: 20px; margin-bottom: 30px; }
            h1 { color: #0f172a; margin: 0; font-size: 32px; }
            .price { font-size: 28px; font-weight: bold; color: #22d3ee; margin-top: 10px; }
            .location { color: #64748b; font-size: 18px; }
            .main-img { width: 100%; height: 400px; object-fit: cover; border-radius: 20px; margin-bottom: 30px; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 20px; font-weight: bold; color: #1e293b; margin-bottom: 10px; border-left: 4px solid #22d3ee; padding-left: 10px; }
            .specs { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .spec-item { background: #fff; padding: 15px; border-radius: 12px; width: 30%; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
            .spec-label { color: #94a3b8; font-size: 12px; text-transform: uppercase; }
            .spec-val { font-size: 18px; font-weight: bold; color: #0f172a; }
            .amenity-item { margin-bottom: 5px; color: #475569; }
            .amenities-list { columns: 2; -webkit-columns: 2; -moz-columns: 2; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${property.name}</h1>
            <div class="location">${property.location}</div>
            <div class="price">${property.price}</div>
          </div>
          <img src="${property.image}" class="main-img" />
          <div class="specs">
            <div class="spec-item"><div class="spec-label">Beds</div><div class="spec-val">${property.beds}</div></div>
            <div class="spec-item"><div class="spec-label">Baths</div><div class="spec-val">${property.baths}</div></div>
            <div class="spec-item"><div class="spec-label">Area</div><div class="spec-val">${property.sqft} sqft</div></div>
          </div>
          <div class="section">
            <div class="section-title">About Property</div>
            <p>${property.description}</p>
          </div>
          ${property.amenities ? `
          <div class="section">
            <div class="section-title">Amenities</div>
            <ul class="amenities-list">
              ${Object.values(property.amenities).flat().map(a => `<li class="amenity-item">${a}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
          <div class="section">
            <div class="section-title">Project Details</div>
            <p><strong>Builder:</strong> ${property.builder}</p>
            <p><strong>RERA ID:</strong> ${property.reraId}</p>
            <p><strong>Possession:</strong> ${property.possession}</p>
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { 
        UTI: 'com.adobe.pdf', 
        mimeType: 'application/pdf',
        dialogTitle: `Share ${property.name} Brochure`
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to generate brochure');
    }
  };

  /* ---------------- HEADER ---------------- */

  const headerImage = (
    <View style={styles.mediaContainer}>
      {viewMode === 'image' ? (
        <View style={styles.mainImage}>
          <Image
            source={{ uri: property.image }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          {/* Featured Badge */}
          {isFeatured && (
            <View style={styles.featuredBadge}>
              <Ionicons name="ribbon" size={12} color="#020617" />
              <Text style={styles.featuredBadgeText}>FEATURED</Text>
            </View>
          )}
        </View>
      ) : viewMode === 'video' ? (
        <View 
          style={styles.mainImage}
          {...panResponder.panHandlers}
        >
          {/* Featured Badge */}
          {isFeatured && (
            <View style={styles.featuredBadge}>
              <Ionicons name="ribbon" size={12} color="#020617" />
              <Text style={styles.featuredBadgeText}>FEATURED</Text>
            </View>
          )}
          <VideoView
            key={resolvedVideoUrl}
            ref={videoViewRef}
            player={player}
            contentFit="cover"
            nativeControls={false}
            allowsFullscreen
            fullscreenOptions={{
              enable: true,
              orientation: isMobile ? 'landscape' : 'default',
              autoExitOnRotate: true,
            }}
            allowsPictureInPicture
            playsInline
            onFullscreenEnter={() => setIsFullscreen(true)}
            onFullscreenExit={() => setIsFullscreen(false)}
            style={StyleSheet.absoluteFill}
          />
          {/* Double Tap Zones */}
          <View style={[StyleSheet.absoluteFill, { flexDirection: 'row' }]} pointerEvents="box-none">
            <Pressable 
              style={{ flex: 1 }} 
              onPress={() => handleVideoPress('left')}
            />
            <Pressable 
              style={{ flex: 1 }} 
              onPress={() => handleVideoPress('right')}
            />
          </View>

          {/* Double Tap Feedback */}
          {doubleTapSide === 'left' && (
            <Animated.View entering={FadeInUp} exiting={FadeOut} style={[styles.doubleTapOverlay, { left: '15%' }]}>
              <View style={styles.doubleTapCircle}>
                <Ionicons name="play-back" size={30} color="#fff" />
                <Text style={styles.doubleTapText}>10s</Text>
              </View>
            </Animated.View>
          )}
          {doubleTapSide === 'right' && (
            <Animated.View entering={FadeInUp} exiting={FadeOut} style={[styles.doubleTapOverlay, { right: '15%' }]}>
              <View style={styles.doubleTapCircle}>
                <Ionicons name="play-forward" size={30} color="#fff" />
                <Text style={styles.doubleTapText}>10s</Text>
              </View>
            </Animated.View>
          )}

          {/* Virtual Tour Label */}
          <Animated.View style={[styles.virtualTourBadge, pulseAnimatedStyle]}>
            <Text style={styles.virtualTourText}>Virtual Tour</Text>
          </Animated.View>

          {/* Central Play/Pause Button */}
          {!isBuffering && !hasError && showControls && (
            <Animated.View entering={FadeInUp} exiting={FadeOut} style={styles.centralControlContainer} pointerEvents="box-none">
              <TouchableOpacity 
                style={[
                  styles.centralControlButton,
                  isSmallMobile && { width: 68, height: 68, borderRadius: 34 },
                ]} 
                onPress={togglePlay}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name={isPlaying ? "pause" : "play"} 
                  size={isSmallMobile ? 28 : 32} 
                  color="#fff" 
                />
              </TouchableOpacity>
            </Animated.View>
          )}

          {isBuffering && (
            <View style={styles.videoLoader}>
              <ActivityIndicator size="large" color="#22d3ee" />
            </View>
          )}
          {hasError && (
            <View style={styles.videoErrorOverlay}>
              <Ionicons name="warning" size={32} color="#ef4444" />
              <Text style={styles.videoErrorText}>Failed to load virtual tour</Text>
              <TouchableOpacity 
                style={styles.retryButton} 
                onPress={() => {
                  if (!moveToNextVideoSource()) {
                    player.play();
                  }
                }}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
          {showControls && (
            <Animated.View
              entering={FadeInDown}
              exiting={FadeOut}
              style={[
                styles.videoControlsOverlay,
                {
                  right: isSmallMobile ? 12 : isMobile ? 14 : 20,
                  bottom: isSmallMobile ? 112 : isMobile ? 108 : 110,
                },
              ]}
            >
            <TouchableOpacity 
              style={[
                styles.controlButton,
                {
                  padding: isSmallMobile ? 9 : isMobile ? 10 : 12,
                  borderRadius: isSmallMobile ? 16 : 20,
                },
              ]} 
              onPress={skipBackward}
            >
              <Ionicons
                name="refresh-outline"
                size={isSmallMobile ? 16 : 18}
                color="#fff"
                style={{ transform: [{ scaleX: -1 }] }}
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.controlButton,
                {
                  padding: isSmallMobile ? 9 : isMobile ? 10 : 12,
                  borderRadius: isSmallMobile ? 16 : 20,
                },
              ]} 
              onPress={togglePlay}
            >
              <Ionicons 
                name={isPlaying ? "pause" : "play"} 
                size={isSmallMobile ? 16 : 18} 
                color="#fff" 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.controlButton,
                {
                  padding: isSmallMobile ? 9 : isMobile ? 10 : 12,
                  borderRadius: isSmallMobile ? 16 : 20,
                },
              ]} 
              onPress={skipForward}
            >
              <Ionicons name="refresh-outline" size={isSmallMobile ? 16 : 18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.controlButton,
                {
                  padding: isSmallMobile ? 9 : isMobile ? 10 : 12,
                  borderRadius: isSmallMobile ? 16 : 20,
                },
              ]} 
              onPress={togglePlaybackSpeed}
            >
              <Text style={styles.speedText}>{playbackSpeed}x</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.controlButton,
                {
                  padding: isSmallMobile ? 9 : isMobile ? 10 : 12,
                  borderRadius: isSmallMobile ? 16 : 20,
                },
              ]} 
              onPress={toggleFullscreen}
            >
              <Ionicons name={isFullscreen ? 'contract' : 'expand'} size={isSmallMobile ? 16 : 18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.controlButton,
                {
                  padding: isSmallMobile ? 9 : isMobile ? 10 : 12,
                  borderRadius: isSmallMobile ? 16 : 20,
                },
              ]} 
              onPress={toggleMute}
            >
              <Ionicons 
                name={isMuted ? "volume-mute" : "volume-high"} 
                size={isSmallMobile ? 16 : 18} 
                color="#fff" 
              />
            </TouchableOpacity>
            </Animated.View>
          )}

          {showControls && (
            <Animated.View
              entering={FadeInDown}
              exiting={FadeOut}
              style={[
                styles.bottomControlsWrapper,
                {
                  left: isSmallMobile ? 12 : isMobile ? 14 : 20,
                  right: isSmallMobile ? 12 : isMobile ? 14 : 20,
                  bottom: isSmallMobile ? 84 : 85,
                },
              ]}
            >
              <Text style={[styles.timeText, { fontSize: isSmallMobile ? 11 : 12 }]}>
                {formatTime(player.currentTime)} / {formatTime(player.duration)}
              </Text>
              <TouchableOpacity 
            style={[
              styles.progressBarContainer,
              {
                position: 'relative',
                bottom: 0,
                left: 0,
                right: 0,
                flex: 1,
                marginLeft: isSmallMobile ? 8 : 10,
                height: isSmallMobile ? 5 : 4,
              },
            ]}
            activeOpacity={1}
            onLayout={(e) => setProgressBarWidth(e.nativeEvent.layout.width)}
            onPress={(e) => {
              if (progressBarWidth > 0 && player.duration > 0) {
                const { locationX } = e.nativeEvent;
                const seekTime = (locationX / progressBarWidth) * player.duration;
                player.currentTime = seekTime;
              }
            }}
          >
            <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
          </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      ) : (
        <Animated.View style={[styles.placeholder3D, animated3DStyle]}>
          <Image
            source={{ uri: property.image }}
            style={styles.threeDImage}
            contentFit="cover"
          />
          {/* Featured Badge */}
          {isFeatured && (
            <View style={styles.featuredBadge}>
              <Ionicons name="ribbon" size={12} color="#020617" />
              <Text style={styles.featuredBadgeText}>FEATURED</Text>
            </View>
          )}
          <View style={styles.overlay3D}>
            <Ionicons name="cube" size={28} color="#22d3ee" />
            <Text style={styles.placeholderText}>Rotating 3D Preview</Text>
          </View>
        </Animated.View>
      )}

      {/* Back */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          if (navigationState?.key) {
            router.back();
          } else {
            router.replace('/');
          }
        }}
      >
        <Ionicons name="chevron-back" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Actions */}
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setIsSearchModalVisible(true)}
        >
          <Ionicons
            name="search-outline"
            size={22}
            color="#fff"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleTogglePriceDropAlert}
        >
          <Ionicons
            name={isPriceDropAlertActive ? 'notifications' : 'notifications-outline'}
            size={22}
            color={isPriceDropAlertActive ? '#fbbf24' : '#fff'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleToggleFavorite}
        >
          <Ionicons
            name={isFavorited ? 'heart' : 'heart-outline'}
            size={22}
            color={isFavorited ? '#ef4444' : '#fff'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleShare}
        >
          <Ionicons
            name="share-outline"
            size={22}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      {/* Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleBtn,
            viewMode === 'image' && styles.activeToggle,
          ]}
          onPress={() => setViewMode('image')}
        >
          <Text
            style={[
              styles.toggleText,
              viewMode === 'image' && styles.activeToggleText,
            ]}
          >
            Photo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleBtn,
            viewMode === 'video' && styles.activeToggle,
          ]}
          onPress={() => {
            setViewMode('video');
            try {
              player.play();
            } catch (e) {
              console.error("Manual play failed:", e);
            }
          }}
        >
          <Text
            style={[
              styles.toggleText,
              viewMode === 'video' && styles.activeToggleText,
            ]}
          >
            Video
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleBtn,
            viewMode === '3d' && styles.activeToggle,
          ]}
          onPress={() => setViewMode('3d')}
        >
          <Text
            style={[
              styles.toggleText,
              viewMode === '3d' && styles.activeToggleText,
            ]}
          >
            3D View
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  /* ---------------- BODY ---------------- */

  return (
    <View style={{ flex: 1, backgroundColor: '#020617' }}>
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#020617', dark: '#020617' }}
      headerImage={headerImage}
    >
      <Animated.View entering={FadeInUp.delay(200)}>
        {/* Navigation Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.tabBar}
          contentContainerStyle={[styles.tabBarContent, { paddingHorizontal: contentPadding }]}
        >
          {['Overview', 'Config', 'Amenities', 'Locality', 'Builder', 'FAQ'].map((tab) => (
            <TouchableOpacity 
              key={tab} 
              onPress={() => setActiveTab(tab)}
              style={[styles.tabItem, activeTab === tab && styles.activeTabItem]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {activeTab === 'Overview' && (
          <>
        <Pressable style={({ hovered }: any) => [sectionCardBaseStyle, { borderLeftColor: '#22d3ee' }, hovered && styles.sectionCardHover]}>
          <View style={[styles.headerInfo, isMobile && styles.headerInfoMobile]}>
          <View style={{ flex: 1, gap: 4 }}>
            <View style={styles.statusBadge}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="checkmark-circle" size={12} color="#22d3ee" />
                <Text style={styles.statusText}>{property.status} • Verified</Text>
              </View>
            </View>
            <Text style={[styles.title, isMobile && styles.titleMobile, isSmallMobile && styles.titleSmall]}>{property.name}</Text>
            <Text style={styles.location}>{property.location}</Text>
          </View>
          <View style={[styles.priceColumn, isMobile && styles.priceColumnMobile]}>
            <Text style={[styles.price, isMobile && styles.priceMobile]}>{property.price}</Text>
            {priceFairness && (
              <View style={styles.fairnessBadge}>
                <Ionicons name={priceFairness.isFair ? "checkmark-circle" : "alert-circle"} size={12} color={priceFairness.isFair ? "#22c55e" : "#fbbf24"} />
                <Text style={[styles.fairnessText, { color: priceFairness.isFair ? "#22c55e" : "#fbbf24" }]}>
                  {priceFairness.isFair ? `₹${priceFairness.diff}/sqft lower than avg` : `₹${priceFairness.diff}/sqft above avg`}
                </Text>
              </View>
            )}
            <TouchableOpacity 
              style={styles.trustScoreContainer}
              onPress={() => setIsTrustModalVisible(true)}
            >
              <Text style={styles.trustScoreLabel}>Trust Score: </Text>
              <Text style={[styles.trustScoreValue, { color: trustLevel.color }]}>{trustScore}/100 ({trustLevel.label})</Text>
              <Ionicons name="information-circle-outline" size={14} color="#94a3b8" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.priceDropToggle, isPriceDropAlertActive && styles.priceDropToggleActive]} 
              onPress={handleTogglePriceDropAlert}
            >
              <Ionicons 
                name={isPriceDropAlertActive ? "notifications" : "notifications-outline"} 
                size={14} 
                color={isPriceDropAlertActive ? "#020617" : "#94a3b8"} 
              />
              <Text style={[styles.priceDropText, isPriceDropAlertActive && styles.priceDropTextActive]}>
                {isPriceDropAlertActive ? "Alert On" : "Price Drop Alert"}
              </Text>
            </TouchableOpacity>
            <Text style={styles.emiText}>Est. EMI ₹{estimatedMonthlyPayment}</Text>
            <TouchableOpacity onPress={() => setIsPriceBreakupVisible(true)}>
              <Text style={styles.priceBreakupLink}>Price Breakup</Text>
            </TouchableOpacity>
          </View>
          </View>
        </Pressable>

        <Pressable style={({ hovered }: any) => [sectionCardBaseStyle, { borderLeftColor: '#818cf8' }, hovered && styles.sectionCardHover]}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.overviewGrid}>
          <View style={overviewItemStyle}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#22d3ee" />
            <View>
              <Text style={styles.overviewLabel}>RERA ID</Text>
              <Text style={styles.overviewValue}>{property.reraId}</Text>
            </View>
          </View>
          <View style={overviewItemStyle}>
            <Ionicons name="calendar-outline" size={18} color="#22d3ee" />
            <View>
              <Text style={styles.overviewLabel}>Possession</Text>
              <Text style={styles.overviewValue}>{property.possession}</Text>
            </View>
          </View>
          <View style={overviewItemStyle}>
            <Ionicons name="business-outline" size={18} color="#22d3ee" />
            <View>
              <Text style={styles.overviewLabel}>Status</Text>
              <Text style={styles.overviewValue}>{property.status}</Text>
            </View>
          </View>
          <View style={overviewItemStyle}>
            <Ionicons name="home-outline" size={18} color="#22d3ee" />
            <View>
              <Text style={styles.overviewLabel}>Type</Text>
              <Text style={styles.overviewValue}>{property.type}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.specsRow, isSmallMobile && styles.specsRowMobile]}>
          <View style={[styles.specItem, isSmallMobile && styles.specItemMobile]}>
            <Ionicons name="bed" size={18} color="#94a3b8" />
            <Text style={styles.specText}>{property.beds} Beds</Text>
          </View>
          <View style={[styles.specItem, isSmallMobile && styles.specItemMobile]}>
            <Ionicons name="water" size={18} color="#94a3b8" />
            <Text style={styles.specText}>{property.baths} Baths</Text>
          </View>
          <View style={[styles.specItem, isSmallMobile && styles.specItemMobile]}>
            <Ionicons name="resize" size={18} color="#94a3b8" />
            <Text style={styles.specText}>{property.sqft} sqft</Text>
          </View>
          </View>
        </Pressable>

        <View style={styles.divider} />

        {property.highlights && (
          <Pressable style={({ hovered }: any) => [sectionCardBaseStyle, { borderLeftColor: '#10b981' }, hovered && styles.sectionCardHover]}>
            <Text style={styles.sectionTitle}>Project Highlights</Text>
            <View style={styles.highlightsContainer}>
              {property.highlights.map((h, i) => (
                <View key={i} style={styles.highlightItem}>
                  <Ionicons name="star" size={14} color="#22d3ee" />
                  <Text style={styles.highlightText}>{h}</Text>
                </View>
              ))}
            </View>
          </Pressable>
        )}
        </>
        )}

        {activeTab === 'Config' && (
          <Pressable style={({ hovered }: any) => [sectionCardBaseStyle, { borderLeftColor: '#f59e0b' }, hovered && styles.sectionCardHover]}>
            <Text style={styles.sectionTitle}>Unit Configurations</Text>
            <View style={styles.configTable}>
              <View style={styles.configHeader}>
              <Text style={styles.configHeaderCell}>Unit Type</Text>
              <Text style={styles.configHeaderCell}>Area</Text>
              <Text style={styles.configHeaderCell}>Price</Text>
            </View>
            {(property.floorPlans || [
              { type: '2 BHK', size: '1250 sqft', price: '₹ 1.2 Cr' },
              { type: '3 BHK', size: '1850 sqft', price: '₹ 1.8 Cr' },
              { type: '4 BHK', size: '2400 sqft', price: '₹ 2.5 Cr' },
            ]).map((plan, i) => (
              <View key={i} style={styles.configRow}>
                <Text style={styles.configCellType}>{plan.type}</Text>
                <Text style={styles.configCell}>{plan.size}</Text>
                <Text style={styles.configCellPrice}>{plan.price}</Text>
              </View>
            ))}
            </View>
          </Pressable>
        )}

        {activeTab === 'Overview' && (
          <Pressable style={({ hovered }: any) => [sectionCardBaseStyle, { borderLeftColor: '#f43f5e' }, hovered && styles.sectionCardHover]}>
            <Text style={styles.sectionTitle}>Key Features</Text>
            <View style={styles.featuresGrid}>
            {(property.features || []).map((f: PropertyFeature, i: number) => (
              <View key={i} style={styles.featureItem}>
                <Ionicons name={resolveFeatureIcon(f.icon)} size={16} color="#22d3ee" />
                <Text style={styles.featureLabel}>{f.label}</Text>
              </View>
            ))}
            </View>
          </Pressable>
        )}

        {activeTab === 'Amenities' && property.amenities && (
          <Pressable style={({ hovered }: any) => [sectionCardBaseStyle, { borderLeftColor: '#8b5cf6' }, hovered && styles.sectionCardHover]}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenitiesContainer}>
              {Object.entries(property.amenities).map(([category, items], idx) => (
                <View key={category} style={[styles.amenityCategory, idx === 0 && { marginTop: 0 }]}>
                  <Text style={styles.amenityCategoryTitle}>{category}</Text>
                  <View style={styles.amenityGrid}>
                    {items.map((item, i) => (
                      <View key={i} style={styles.amenityItem}>
                        <View style={styles.amenityDot} />
                        <Text style={styles.amenityText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </Pressable>
        )}

        {activeTab === 'Builder' && (
          <>
          <Pressable style={({ hovered }: any) => [sectionCardBaseStyle, { borderLeftColor: '#0ea5e9' }, hovered && styles.sectionCardHover]}>
            <Text style={styles.sectionTitle}>Builder Profile</Text>
            <View style={styles.builderProfileCard}>
            <View style={styles.builderHeader}>
              <View style={styles.builderLogoPlaceholder}>
                <Ionicons name="business" size={24} color="#22d3ee" />
              </View>
              <View style={styles.builderTitleInfo}>
                <Text style={styles.builderNameText}>{property.builder}</Text>
                <Text style={styles.builderExperienceText}>{property.builderExperience || '10+ Years'} Experience</Text>
              </View>
            </View>
            <View style={styles.builderStatsRow}>
              <View style={styles.builderStatItem}>
                <Text style={styles.builderStatValue}>{property.totalProjects || '15'}</Text>
                <Text style={styles.builderStatLabel}>Total Projects</Text>
              </View>
              <View style={styles.builderStatDivider} />
              <View style={styles.builderStatItem}>
                <Text style={styles.builderStatValue}>5</Text>
                <Text style={styles.builderStatLabel}>Ongoing</Text>
              </View>
            </View>
            <Text style={styles.builderDescriptionText}>{property.builderDescription || 'A leading developer committed to delivering high-quality residential spaces.'}</Text>
          </View>
        </Pressable>

        {property.status === 'Under Construction' && (
          <>
            <Text style={styles.sectionTitle}>Construction Progress</Text>
            <View style={styles.constructionContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {['May 2024', 'Apr 2024', 'Mar 2024'].map((month, i) => (
                  <View key={i} style={styles.constructionPhotoCard}>
                    <Image 
                      source={{ uri: `https://images.unsplash.com/photo-1503387762-592dee58c460?q=80&w=400&auto=format&fit=crop` }} 
                      style={styles.constructionPhoto} 
                    />
                    <Text style={styles.constructionMonth}>{month}</Text>
                  </View>
                ))}
              </ScrollView>
              <View style={styles.progressStatusCard}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressStatusTitle}>Current Status: Structure Work</Text>
                  <View style={styles.onTrackBadge}><Text style={styles.onTrackText}>ON TRACK</Text></View>
                </View>
                <Text style={styles.progressDetail}>85% of the RCC structure is completed. Internal brickwork started on lower floors.</Text>
              </View>
            </View>
          </>
          )}

          {property.timeline && (
          <>
            <Text style={styles.sectionTitle}>Project Timeline</Text>
            <View style={styles.timelineContainer}>
              {property.timeline.map((item, index) => (
                <View key={index} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View style={[styles.timelineDot, item.status === 'completed' && styles.timelineDotActive]} />
                    {index !== property.timeline!.length - 1 && <View style={styles.timelineLine} />}
                  </View>
                  <View style={styles.timelineRight}>
                    <Text style={styles.timelineDate}>{item.date}</Text>
                    <Text style={styles.timelineLabel}>{item.label}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
          )}

          <Text style={styles.sectionTitle}>Listed By</Text>
          <View style={styles.agentCard}>
            <View style={styles.agentImageContainer}>
              <Image source={{ uri: 'https://i.pravatar.cc/150?u=agent' }} style={styles.agentImage} />
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#22d3ee" />
              </View>
            </View>
            <View style={styles.agentInfo}>
              <View style={styles.agentNameRow}>
                <Text style={styles.agentName}>{property.builder}</Text>
                <View style={styles.verifiedTextBadge}>
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              </View>
              <Text style={styles.agentTitle}>Official Developer Partner</Text>
            </View>
            <TouchableOpacity style={styles.contactButton} onPress={() => setIsCallbackVisible(true)}>
              <Ionicons name="call" size={16} color="#22d3ee" />
            </TouchableOpacity>
          </View>
          </>
        )}

        {activeTab === 'Overview' && (
          <>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{property.description}</Text>
          </>
        )}

        {activeTab === 'Locality' && (
          <>
        <Text style={styles.sectionTitle}>Connectivity & Neighborhood</Text>
        <View style={styles.connectivityContainer}>
          {(property.connectivity || [
            { name: 'Global International School', distance: '0.5 km', type: 'school' },
            { name: 'City Hospital', distance: '1.2 km', type: 'hospital' },
            { name: 'Metro Station Blue Line', distance: '0.8 km', type: 'metro' },
            { name: 'Central Mall', distance: '2.0 km', type: 'mall' },
          ]).map((item, i) => (
            <View key={i} style={styles.connectivityItem}>
              <View style={styles.connectivityIcon}>
                <Ionicons name={item.type === 'school' ? 'book' : item.type === 'hospital' ? 'medical' : item.type === 'metro' ? 'train' : 'cart'} size={16} color="#22d3ee" />
              </View>
              <Text style={styles.connectivityName}>{item.name}</Text>
            <Text style={styles.connectivityDistance}>{item.distance}</Text>
          </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Commute Estimator</Text>
        <View style={styles.commuteContainer}>
          <View style={styles.commuteModeRow}>
            {(['Drive', 'Metro', 'Bike'] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[styles.commuteModeChip, commuteMode === mode && styles.commuteModeChipActive]}
                onPress={() => setCommuteMode(mode)}
              >
                <Text style={[styles.commuteModeChipText, commuteMode === mode && styles.commuteModeChipTextActive]}>
                  {mode}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {commuteInsights.map((item, index) => (
            <View key={`${item.name}-${index}`} style={styles.commuteItem}>
              <View style={styles.connectivityIcon}>
                <Ionicons
                  name={item.type === 'school' ? 'book' : item.type === 'hospital' ? 'medical' : item.type === 'metro' ? 'train' : 'cart'}
                  size={16}
                  color="#22d3ee"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.connectivityName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.commuteDistance}>{item.distance}</Text>
              </View>
              <Text style={styles.commuteEta}>{item.etaMinutes} min</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>School & Hospital Quality Ranking</Text>
        <View style={styles.trustBuilderContainer}>
          <View style={styles.trustSummaryCard}>
            <LinearGradient
              colors={['rgba(251, 191, 36, 0.15)', 'rgba(251, 191, 36, 0.05)']}
              style={styles.trustSummaryGradient}
            >
              <Ionicons name="ribbon" size={24} color="#fbbf24" />
              <Text style={styles.trustSummaryText}>
                This locality is ranked in the <Text style={{ color: '#fbbf24', fontWeight: '800' }}>Top 10%</Text> for Education & Healthcare infrastructure in Mumbai.
              </Text>
            </LinearGradient>
          </View>

          {(property.connectivity || [])
            .filter(item => item.type === 'school' || item.type === 'hospital')
            .map((item, i) => (
              <View key={i} style={styles.trustCard}>
                <View style={styles.connectivityIcon}>
                  <Ionicons 
                    name={item.type === 'school' ? 'book' : 'medical'} 
                    size={16} 
                    color="#22d3ee" 
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.connectivityName}>{item.name}</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                        {item.type === 'school' && (
                          <View style={styles.topSchoolBadge}>
                            <Text style={styles.topSchoolBadgeText}>🏆 Top Ranked</Text>
                          </View>
                        )}
                        {item.type === 'hospital' && (
                          <View style={styles.emergencyBadge}>
                            <Text style={styles.emergencyBadgeText}>🏥 24/7 Emergency</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={styles.trustBadge}>
                      <Text style={styles.trustBadgeText}>VERIFIED QUALITY</Text>
                    </View>
                  </View>
                  <View style={styles.trustRatingRow}>
                    <View style={{ flexDirection: 'row', gap: 2 }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons 
                          key={star} 
                          name="star" 
                          size={12} 
                          color={star <= (item.rating || 4) ? "#fbbf24" : "#334155"} 
                        />
                      ))}
                    </View>
                    <Text style={styles.trustScore}>Rating: {item.rating || '4.2'}/5</Text>
                    <Text style={styles.trustReviewCount}>({item.reviewCount || '120+'} reviews)</Text>
                  </View>
                </View>
              </View>
            ))}
        </View>
        </>
        )}

        {activeTab === 'Overview' && (
          <>
        <Text style={styles.sectionTitle}>Locality Score</Text>
        <View style={styles.localityScoreContainer}>
          {(property.localityScores || [
            { label: 'Safety', score: 8.5, icon: 'shield-checkmark' },
            { label: 'Connectivity', score: 9.2, icon: 'bus' },
            { label: 'Lifestyle', score: 7.8, icon: 'restaurant' },
          ]).map((item, i) => (
            <View key={i} style={styles.scoreRow}>
              <View style={styles.scoreHeader}>
                <View style={styles.scoreLabelContainer}>
                  <Ionicons name={item.icon} size={16} color="#22d3ee" />
                  <Text style={styles.scoreLabel}>{item.label}</Text>
                </View>
                <Text style={styles.scoreValue}>{item.score}/10</Text>
              </View>
              <View style={styles.scoreBarBg}>
                <View style={[styles.scoreBarFill, { width: `${item.score * 10}%` }]} />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>User Reviews</Text>
          <TouchableOpacity 
            style={styles.writeReviewBtn}
            onPress={() => setIsReviewModalVisible(true)}
          >
            <Ionicons name="create-outline" size={16} color="#22d3ee" />
            <Text style={styles.writeReviewBtnText}>Write a Review</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.reviewsContainer}>
          {localReviews.map((review, i) => (
            <View key={i} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.userInfo}>
                  <View style={styles.userAvatarPlaceholder}>
                    <Text style={styles.avatarText}>{review.user.charAt(0)}</Text>
                  </View>
                  <View>
                    <Text style={styles.userName}>{review.user}</Text>
                    <Text style={styles.reviewDate}>{review.date}</Text>
                  </View>
                </View>
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={12} color="#22d3ee" />
                  <Text style={styles.ratingText}>{review.rating}</Text>
                </View>
              </View>
              <Text style={styles.reviewComment}>{review.comment}</Text>
              <View style={styles.tagContainer}>
                {review.tags.map((tag, j) => (
                  <View key={j} style={styles.sentimentTag}>
                    <Text style={styles.sentimentTagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
        </>
        )}

        <View style={[styles.toolsRow, isSmallMobile && styles.toolsRowMobile]}>
          <TouchableOpacity 
            style={toolButtonStyle}
            onPress={() => setIsVirtualTourVisible(true)}
          >
            <Ionicons name="scan-outline" size={18} color="#22d3ee" />
            <Text style={styles.toolButtonText}>360° Tour</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={toolButtonStyle}
            onPress={() => setIsEligibilityVisible(true)}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#22d3ee" />
            <Text style={styles.toolButtonText}>Eligibility</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={toolButtonStyle}
            onPress={() => setIsMortgageVisible(true)}
          >
            <Ionicons name="calculator" size={18} color="#22d3ee" />
            <Text style={styles.toolButtonText}>Mortgage Calc</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={toolButtonStyle}
            onPress={() => setIsEMIComparisonVisible(true)}
          >
            <Ionicons name="business" size={18} color="#22d3ee" />
            <Text style={styles.toolButtonText}>Bank EMI</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={toolButtonStyle}
            onPress={() => setIsDocumentVaultVisible(true)}
          >
            <Ionicons name="folder-open" size={18} color="#22d3ee" />
            <Text style={styles.toolButtonText}>Doc Vault</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={toolButtonStyle}
            onPress={() => setIsAIChatVisible(true)}
          >
            <Ionicons name="chatbubble-ellipses" size={18} color="#22d3ee" />
            <Text style={styles.toolButtonText}>AI Assistant</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={toolButtonStyle}
            onPress={() => setIsCompareVisible(true)}
          >
            <Ionicons name="git-compare" size={18} color="#22d3ee" />
            <Text style={styles.toolButtonText}>Compare</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={toolButtonStyle}
            onPress={handleDownloadBrochure}
          >
            <Ionicons name="logo-whatsapp" size={18} color="#22c55e" />
            <Text style={styles.toolButtonText}>Share PDF</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'Locality' && (
          <>
        <Text style={styles.sectionTitle}>Price Trends</Text>
        <View style={styles.chartContainer}>
          {chartData.length > 0 ? (
            <LineChart
              data={chartData}
              height={160}
              width={chartWidth}
              initialSpacing={15}
              endSpacing={15}
              spacing={chartData.length > 1 ? Math.max((chartWidth - 40) / (chartData.length - 1), 20) : 0}
              color="#22d3ee"
              thickness={4}
              yAxisLabelWidth={60}
              maxValue={maxValue}
              noOfSections={3}
              dataPointsColor="#22d3ee"
              xAxisColor="transparent"
              yAxisColor="transparent"
              xAxisThickness={0}
              yAxisThickness={0}
              yAxisLabelPrefix="₹"
              yAxisLabelSuffix={priceUnit}
              xAxisLabelTextStyle={{ color: '#94a3b8', fontSize: 10 }}
              yAxisTextStyle={{ color: '#94a3b8', fontSize: 10 }}
              isAnimated
              animationDuration={1200}
              areaChart
              startFillColor="rgba(34, 211, 238, 0.3)"
              endFillColor="rgba(34, 211, 238, 0.01)"
              curved
              hideRules
              hideDataPoints={false}
              dataPointsRadius={5}
              pointerConfig={{
                pointerStripColor: 'rgba(34, 211, 238, 0.5)',
                pointerStripWidth: 2,
                pointerColor: '#22d3ee',
                radius: 6,
                pointerLabelComponent: (items: any) => (
                  <View style={styles.chartPointerLabel}>
                    <Text style={styles.chartPointerText}>₹{items[0].value} {priceUnit}</Text>
                  </View>
                ),
              }}
            />
          ) : (
            <View style={{ height: 160, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: '#475569' }}>No price history available</Text>
            </View>
          )}
          {priceTrend && (
            <View style={styles.chartInfo}>
              <Ionicons 
                name={priceTrend.isUp ? "trending-up" : "trending-down"} 
                size={14} 
                color={priceTrend.isUp ? "#22d3ee" : "#ef4444"} 
              />
              <Text style={[styles.chartTrendText, !priceTrend.isUp && { color: '#ef4444' }]}>
                Market value {priceTrend.isUp ? 'increased' : 'decreased'} by {priceTrend.percentage}% in the last {priceTrend.months} months
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Locality Insights</Text>
        <View style={styles.insightsContainer}>
          <View style={styles.insightHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <Ionicons name="analytics" size={20} color="#22d3ee" />
              <Text style={styles.insightTitle}>Investment Potential</Text>
              <View style={styles.potentialBadge}>
                <Text style={styles.potentialText}>High Growth</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.localityCompareBtn}
              onPress={() => setIsLocalityCompareVisible(true)}
            >
              <Text style={styles.localityCompareBtnText}>Compare</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.localityStatsRow}>
            <View style={styles.localityStatItem}>
              <Text style={styles.localityStatLabel}>Avg. Price</Text>
              <Text style={styles.localityStatValue}>{property.avgPrice || '₹ 42,500/sqft'}</Text>
            </View>
            <View style={styles.localityStatDivider} />
            <View style={styles.localityStatItem}>
              <Text style={styles.localityStatLabel}>Price Range</Text>
              <Text style={styles.localityStatValue}>{property.priceRange || '₹ 32k - 58k/sqft'}</Text>
            </View>
          </View>

          {property.localityAdvantages && (
            <View style={styles.advantagesContainer}>
              {property.localityAdvantages.map((adv, i) => (
                <View key={i} style={styles.advantageItem}>
                  <Ionicons name="checkmark-circle" size={14} color="#22c55e" />
                  <Text style={styles.advantageText}>{adv}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.appreciationGrid}>
            {(property.localityInsights || [
              { label: '1 Year', value: '+12.4%', trend: 'up' },
              { label: '3 Years', value: '+34.8%', trend: 'up' },
              { label: '5 Years', value: '+58.2%', trend: 'up' },
            ]).map((item, i) => (
              <View key={i} style={styles.appreciationItem}>
                <Text style={styles.appreciationLabel}>{item.label}</Text>
                <View style={styles.appreciationValueRow}>
                  <Ionicons 
                    name={item.trend === 'up' ? "trending-up" : "trending-down"} 
                    size={14} 
                    color={item.trend === 'up' ? "#22c55e" : "#ef4444"} 
                  />
                  <Text style={[styles.appreciationValue, { color: item.trend === 'up' ? "#22c55e" : "#ef4444" }]}>{item.value}</Text>
                </View>
              </View>
            ))}
          </View>
          <Text style={styles.insightDescription}>
            {property.localityDescription || "This area has seen consistent growth due to upcoming infrastructure projects and proximity to major business hubs."}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Locality Comparison</Text>
        <View style={styles.localityComparisonCard}>
          <View style={styles.comparisonHeader}>
            <Text style={styles.comparisonSubTitle}>How {property.location.split(',')[0]} stacks up</Text>
            <TouchableOpacity 
              style={styles.localityCompareBtn}
              onPress={() => setIsLocalityCompareVisible(true)}
            >
              <Text style={styles.localityCompareBtnText}>Compare More</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.quickComparisonRow}>
            <View style={styles.quickCompItem}>
              <Text style={styles.quickCompLabel}>Safety</Text>
              <View style={styles.quickCompValueRow}>
                <Text style={styles.quickCompValue}>{property.localityScores?.find(s => s.label === 'Safety')?.score || '8.5'}</Text>
                <Ionicons name="trending-up" size={12} color="#22c55e" />
              </View>
            </View>
            <View style={styles.quickCompDivider} />
            <View style={styles.quickCompItem}>
              <Text style={styles.quickCompLabel}>Connectivity</Text>
              <View style={styles.quickCompValueRow}>
                <Text style={styles.quickCompValue}>{property.localityScores?.find(s => s.label === 'Connectivity')?.score || '9.2'}</Text>
                <Ionicons name="trending-up" size={12} color="#22c55e" />
              </View>
            </View>
            <View style={styles.quickCompDivider} />
            <View style={styles.quickCompItem}>
              <Text style={styles.quickCompLabel}>Lifestyle</Text>
              <View style={styles.quickCompValueRow}>
                <Text style={styles.quickCompValue}>{property.localityScores?.find(s => s.label === 'Lifestyle')?.score || '7.8'}</Text>
                <Ionicons name="trending-up" size={12} color="#22c55e" />
              </View>
            </View>
          </View>
        </View>
        </>
        )}

        {activeTab === 'Locality' && (
          <>
        <Text style={styles.sectionTitle}>Location</Text>
        <TouchableOpacity 
          style={styles.locationPreview}
          onPress={() => {
            router.push('/explore');
          }}
        >
          <Ionicons name="map" size={20} color="#22d3ee" />
          <Text style={styles.locationPreviewText} numberOfLines={1}>{property.location}</Text>
          <Text style={styles.viewMapLink}>View Map</Text>
        </TouchableOpacity>
        </>
        )}

        {/* Site Visit Tracker */}
        {activeTab === 'Overview' && visitStatus !== 'none' && (
          <View style={styles.visitTrackerCard}>
            <View style={styles.visitTrackerHeader}>
              <Ionicons 
                name={visitStatus === 'scheduled' ? "calendar" : "checkmark-circle"} 
                size={24} 
                color="#22d3ee" 
              />
              <Text style={styles.visitTrackerTitle}>
                {visitStatus === 'scheduled' ? "Site Visit Scheduled" : "Site Visit Completed"}
              </Text>
            </View>
            {visitStatus === 'scheduled' ? (
              <TouchableOpacity style={styles.completeVisitBtn} onPress={handleCompleteVisit}>
                <Text style={styles.completeVisitBtnText}>Mark as Completed</Text>
              </TouchableOpacity>
            ) : (
              <View>
                <Text style={styles.visitPointsText}>🎉 You earned 500 points!</Text>
                <TouchableOpacity style={styles.feedbackBtn} onPress={() => setIsFeedbackModalVisible(true)}>
                  <Text style={styles.feedbackBtnText}>{visitFeedback ? "View Feedback" : "Give Feedback"}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Schedule Visit (NO ERROR) */}
        {activeTab === 'Overview' && visitStatus === 'none' && (
          <TouchableOpacity
            onPress={() => {
              router.push({
                pathname: '/schedule',
                params: { propertyName: property.name }
              });
              handleScheduleVisit();
            }}
          >
            <Animated.View
              entering={FadeInDown.delay(300)}
              style={styles.bookButton}
            >
              <Text style={styles.bookButtonText}>
                Schedule Visit
              </Text>
            </Animated.View>
          </TouchableOpacity>
        )}

        {activeTab === 'Overview' && (
          <Pressable style={({ hovered }: any) => [sectionCardBaseStyle, { borderLeftColor: '#14b8a6' }, hovered && styles.sectionCardHover]}>
            <Text style={styles.sectionTitle}>Buyer Snapshot</Text>
            <View style={styles.snapshotGrid}>
              <View style={styles.snapshotItem}>
                <Text style={styles.snapshotLabel}>Price / sqft</Text>
                <Text style={styles.snapshotValue}>
                  {propertyPricePerSqft ? `INR ${propertyPricePerSqft.toLocaleString('en-IN')}` : 'N/A'}
                </Text>
              </View>
              <View style={styles.snapshotItem}>
                <Text style={styles.snapshotLabel}>{cityName} Avg / sqft</Text>
                <Text style={styles.snapshotValue}>
                  {localityAvgPricePerSqft ? `INR ${localityAvgPricePerSqft.toLocaleString('en-IN')}` : 'N/A'}
                </Text>
              </View>
              <View style={styles.snapshotItem}>
                <Text style={styles.snapshotLabel}>Rental Yield</Text>
                <Text style={styles.snapshotValue}>{rentalYieldPercent}%</Text>
              </View>
              <View style={styles.snapshotItem}>
                <Text style={styles.snapshotLabel}>Trust Rating</Text>
                <Text style={styles.snapshotValue}>{trustScore}/100</Text>
              </View>
            </View>

            <Text
              style={[
                styles.snapshotDelta,
                localityPriceDelta?.isAbove ? styles.snapshotDeltaWarn : styles.snapshotDeltaGood
              ]}
            >
              {localityPriceDelta
                ? `${localityPriceDelta.isAbove ? 'Above' : 'Below'} locality average by ${localityPriceDelta.percent}%`
                : 'Locality average comparison unavailable for this listing'}
            </Text>

            <View style={styles.signalList}>
              {buyerSignals.map((signal, index) => (
                <View key={`${signal}-${index}`} style={styles.signalItem}>
                  <Ionicons name="checkmark-circle" size={14} color="#22c55e" />
                  <Text style={styles.signalText}>{signal}</Text>
                </View>
              ))}
            </View>
          </Pressable>
        )}

        {activeTab === 'Overview' && (
          <Pressable style={({ hovered }: any) => [sectionCardBaseStyle, { borderLeftColor: '#f59e0b' }, hovered && styles.sectionCardHover]}>
            <Text style={styles.sectionTitle}>Saved & Affordability</Text>

            <View style={styles.snapshotGrid}>
              <View style={styles.snapshotItem}>
                <Text style={styles.snapshotLabel}>Shortlisted</Text>
                <Text style={styles.snapshotValue}>{favoritePropertyIds.length}</Text>
              </View>
              <View style={styles.snapshotItem}>
                <Text style={styles.snapshotLabel}>Recent Views</Text>
                <Text style={styles.snapshotValue}>{Math.max(0, recentViewIds.length - 1)}</Text>
              </View>
            </View>

            <View style={styles.roiInputRow}>
              <Text style={styles.inputLabel}>Monthly Household Income (INR)</Text>
              <TextInput
                style={styles.roiInput}
                value={monthlyHouseholdIncome}
                onChangeText={setMonthlyHouseholdIncome}
                keyboardType="numeric"
                placeholder="e.g. 250000"
                placeholderTextColor="#475569"
              />
            </View>

            <View style={styles.affordabilityCard}>
              <View style={styles.affordabilityHeader}>
                <Text style={styles.affordabilityLabel}>EMI to Income</Text>
                <View style={[styles.affordabilityBadge, { borderColor: affordabilitySummary.tone }]}>
                  <Text style={[styles.affordabilityBadgeText, { color: affordabilitySummary.tone }]}>
                    {affordabilitySummary.label}
                  </Text>
                </View>
              </View>
              <Text style={styles.affordabilityRatio}>
                {affordabilitySummary.ratio === null ? '--' : `${affordabilitySummary.ratio.toFixed(1)}%`}
              </Text>
              <Text style={styles.affordabilityHint}>{affordabilitySummary.recommendation}</Text>
            </View>
          </Pressable>
        )}

        {activeTab === 'Overview' && recentlyViewedProperties.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recently Viewed</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.similarScroll}
            >
              {recentlyViewedProperties.slice(0, 10).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.similarCard}
                  onPress={() => {
                    router.push({ pathname: '/property/[id]', params: { id: item.id } } as any);
                  }}
                >
                  <Image source={{ uri: item.image }} style={styles.similarImage} />
                  <View style={styles.similarInfo}>
                    <Text style={styles.similarName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.similarMeta} numberOfLines={1}>
                      {item.location}
                    </Text>
                    <Text style={styles.similarPrice}>{item.price}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {activeTab === 'Overview' && (
          <>
            <Text style={styles.sectionTitle}>Recommended Properties</Text>
            <Text style={styles.recommendationHint}>
              {isFiltersApplied
                ? `${recommendedProperties.length} homes match your active filters.`
                : `Top matched homes similar to ${property.name}.`}
            </Text>
            {recommendedProperties.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.similarScroll}
              >
                {recommendedProperties.slice(0, 12).map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.similarCard}
                    onPress={() => {
                      router.push(
                        { pathname: '/property/[id]', params: { id: item.id } } as any
                      );
                    }}
                  >
                    <Image
                      source={{ uri: item.image }}
                      style={styles.similarImage}
                    />
                    <View style={styles.similarBadge}>
                      <Text style={styles.similarBadgeText}>{item.score}% Match</Text>
                    </View>
                    <View style={styles.similarInfo}>
                      <Text style={styles.similarName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.similarMeta} numberOfLines={1}>
                        {item.location}
                      </Text>
                      <Text style={styles.similarPrice}>
                        {item.price}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.noResultsCard}>
                <Ionicons name="search-outline" size={18} color="#94a3b8" />
                <Text style={styles.noResultsText}>No properties matched these filters. Try relaxing your search.</Text>
              </View>
            )}
          </>
        )}

        {activeTab === 'Overview' && (
          <>
        {/* AI-Powered Property Insight Panel */}
        <Text style={styles.sectionTitle}>AI-Powered Property Insight</Text>
        <View style={styles.aiInsightPanel}>
          <View style={styles.aiInsightHeader}>
            <View>
              <Text style={styles.aiInsightHeading}>AI Investment Score</Text>
              <View style={styles.aiScoreRow}>
                <Text style={styles.aiScoreValue}>{property.aiInsights?.score ? (property.aiInsights.score / 10).toFixed(1) : '8.7'}</Text>
                <Text style={styles.aiScoreMax}>/ 10</Text>
              </View>
            </View>
            <View style={styles.bestForBadge}>
              <Text style={styles.bestForLabel}>Best for:</Text>
              <Text style={styles.bestForValue}>Long-term investors</Text>
            </View>
          </View>
          <Text style={styles.aiInsightText}>
            🤖 {property.aiInsights?.summary || "This property shows steady 3-year appreciation, making it a good long-term investment."}
          </Text>

          {/* Demand & Urgency Signals (Psychology Booster) */}
          <View style={styles.demandContainer}>
            <View style={styles.demandRow}>
              <Text style={styles.demandEmoji}>👀</Text>
              <Text style={styles.demandText}>18 people viewed this today</Text>
            </View>
            <View style={styles.demandRow}>
              <Text style={styles.demandEmoji}>⏱</Text>
              <Text style={styles.demandText}>Last visit scheduled 1 hour ago</Text>
            </View>
            <View style={styles.demandRow}>
              <Text style={styles.demandEmoji}>📈</Text>
              <Text style={[styles.demandText, styles.demandHighlight]}>High demand in this locality</Text>
            </View>
          </View>
        </View>

        {/* ROI & Rental Yield Calculator */}
        <Text style={styles.sectionTitle}>ROI & Rental Yield Calculator</Text>
        <View style={styles.roiContainer}>
          <View style={styles.roiInputRow}>
            <Text style={styles.inputLabel}>Expected Monthly Rent (₹)</Text>
            <TextInput
              style={styles.roiInput}
              value={expectedMonthlyRent}
              onChangeText={setExpectedMonthlyRent}
              keyboardType="numeric"
              placeholder="e.g. 45,000"
              placeholderTextColor="#475569"
            />
          </View>

          <View style={styles.roiCard}>
            <View style={styles.roiMetricRow}>
              <Text style={styles.roiMetricIcon}>📊</Text>
              <View>
                <Text style={styles.roiLabel}>Yield %</Text>
                <Text style={styles.roiValue}>{rentalYieldPercent}%</Text>
              </View>
            </View>

            <View style={styles.roiMetricRow}>
              <Text style={styles.roiMetricIcon}>💰</Text>
              <View>
                <Text style={styles.roiLabel}>Monthly Rent</Text>
                <Text style={styles.roiValue}>₹ {Number(expectedMonthlyRent || 0).toLocaleString('en-IN')}</Text>
              </View>
            </View>

            <View style={styles.roiMetricRow}>
              <Text style={styles.roiMetricIcon}>📈</Text>
              <View>
                <Text style={styles.roiLabel}>5-year ROI</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.roiValue}>{fiveYearROI}%</Text>
                  <View style={styles.roiBadge}>
                    <Text style={styles.roiBadgeText}>Projected</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </>
    )}

      {/* Mortgage Calculator Modal */}
      <Modal visible={isMortgageVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Mortgage Estimator</Text>
              <TouchableOpacity onPress={() => setIsMortgageVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.calcResultLabel}>Estimated Monthly Payment</Text>
            <Text style={styles.calcResultValue}>₹ {estimatedMonthlyPayment}</Text>
            <View style={styles.affordabilityInline}>
              <Text style={styles.affordabilityInlineText}>
                Affordability: {affordabilitySummary.label}
                {affordabilitySummary.ratio !== null ? ` (${affordabilitySummary.ratio.toFixed(1)}% of income)` : ''}
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Down Payment (%)</Text>
              <TextInput 
                style={styles.modalInput} 
                value={downPayment} 
                onChangeText={setDownPayment} 
                keyboardType="numeric"
                placeholderTextColor="#475569"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Interest Rate (%)</Text>
              <TextInput 
                style={styles.modalInput} 
                value={interestRate} 
                onChangeText={setInterestRate} 
                keyboardType="numeric"
                placeholderTextColor="#475569"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Loan Term (Years)</Text>
              <TextInput 
                style={styles.modalInput} 
                value={loanTerm} 
                onChangeText={setLoanTerm} 
                keyboardType="numeric"
                placeholderTextColor="#475569"
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Virtual Tour Modal */}
      <Modal visible={isVirtualTourVisible} animationType="fade" transparent={false}>
        <View style={styles.fullScreenModal}>
          {currentRoom && (
            <View style={StyleSheet.absoluteFill} {...tourPanResponder.panHandlers}>
              <Animated.View 
                style={[
                  styles.tourContent, 
                  tourAnimatedStyle,
                  { width: windowWidth * 2, left: -windowWidth / 2 }
                ]}
              >
                <Image 
                  source={{ uri: currentRoom.image }} 
                  style={StyleSheet.absoluteFill} 
                  contentFit="cover"
                />
                {currentRoom.hotspots?.map((hs, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.hotspot, { left: (windowWidth * 2) * hs.x }]}
                    onPress={() => setCurrentRoomId(hs.targetRoomId)}
                  >
                    <View style={styles.hotspotInner}>
                      <Ionicons name="arrow-redo" size={20} color="#fff" />
                      <Text style={styles.hotspotText}>{hs.label}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </Animated.View>
            </View>
          )}
          <Animated.View style={[styles.tourOverlay, tourOverlayStyle]} pointerEvents="none">
            <Ionicons name="move-outline" size={48} color="#fff" />
            <Text style={styles.tourInstruction}>Drag to explore 360° view</Text>
          </Animated.View>
          
          <TouchableOpacity 
            style={styles.closeTourBtn} 
            onPress={() => setIsVirtualTourVisible(false)}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Eligibility Modal */}
      <Modal visible={isEligibilityVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Check Loan Eligibility</Text>
              <TouchableOpacity onPress={() => setIsEligibilityVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.callbackSubtitle}>Get a quick assessment of your home loan eligibility.</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput 
                style={styles.modalInput} 
                value={eligibilityName} 
                onChangeText={setEligibilityName} 
                placeholder="Enter your name"
                placeholderTextColor="#475569"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput 
                style={styles.modalInput} 
                value={eligibilityPhone} 
                onChangeText={setEligibilityPhone} 
                keyboardType="phone-pad"
                placeholder="Enter your phone number"
                placeholderTextColor="#475569"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Monthly Income (₹)</Text>
              <TextInput 
                style={styles.modalInput} 
                value={eligibilityIncome} 
                onChangeText={setEligibilityIncome} 
                keyboardType="numeric"
                placeholder="e.g. 100000"
                placeholderTextColor="#475569"
              />
            </View>

            <TouchableOpacity 
              style={styles.submitReviewBtn}
              onPress={() => {
                Alert.alert("Request Sent", "Our financial advisor will contact you shortly.");
                setIsEligibilityVisible(false);
              }}
            >
              <Text style={styles.submitReviewText}>Check Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Locality Comparison Modal */}
      <Modal visible={isLocalityCompareVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { width: '95%', maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Locality Comparison</Text>
              <TouchableOpacity onPress={() => {
                setIsLocalityCompareVisible(false);
                setCompareLocalityId(null);
              }}>
                <Ionicons name="close-circle" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {!compareLocalityId ? (
              <ScrollView>
                <Text style={styles.inputLabel}>Compare {property.location.split(',')[0]} with:</Text>
                <TouchableOpacity 
                  style={[styles.compareSelectItem, { borderColor: '#22d3ee', borderWidth: 1 }]}
                  onPress={() => setCompareLocalityId('city_avg')}
                >
                  <Ionicons name="stats-chart" size={20} color="#22d3ee" />
                  <View>
                    <Text style={styles.compareSelectName}>City Average (Mumbai)</Text>
                    <Text style={styles.compareSelectPrice}>Benchmark for the city</Text>
                  </View>
                </TouchableOpacity>
                {Object.keys(PROPERTIES_DATA)
                  .filter(id => id !== resolvedPropertyId)
                  .map(id => (
                    <TouchableOpacity 
                      key={id} 
                      style={styles.compareSelectItem}
                      onPress={() => setCompareLocalityId(id)}
                    >
                      <Ionicons name="location" size={20} color="#22d3ee" />
                      <View>
                        <Text style={styles.compareSelectName}>{PROPERTIES_DATA[id].location}</Text>
                        <Text style={styles.compareSelectPrice}>Avg: {PROPERTIES_DATA[id].avgPrice || 'N/A'}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {(() => {
                  const targetData = compareLocalityId === 'city_avg' ? CITY_AVERAGE_DATA : PROPERTIES_DATA[compareLocalityId];
                  return (
                    <>
                <View style={styles.comparisonLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: '#22d3ee' }]} />
                    <Text style={styles.legendText}>{property.location.split(',')[0]}</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: '#818cf8' }]} />
                    <Text style={styles.legendText}>{targetData.location.split(',')[0]}</Text>
                  </View>
                </View>

                <View style={styles.localityComparisonGrid}>
                  {[
                    { label: 'Safety', key: 'Safety' },
                    { label: 'Connectivity', key: 'Connectivity' },
                    { label: 'Lifestyle', key: 'Lifestyle' }
                  ].map((metric) => {
                    const currentScore = property.localityScores?.find(s => s.label === metric.label)?.score || 0;
                    const targetScore = targetData.localityScores?.find((s: any) => s.label === metric.label)?.score || 0;
                    
                    return (
                      <View key={metric.label} style={styles.comparisonMetricRow}>
                        <Text style={styles.comparisonMetricLabel}>{metric.label}</Text>
                        <View style={styles.dualBarContainer}>
                          <View style={styles.scoreBarBg}>
                            <View style={[styles.scoreBarFill, { width: `${currentScore * 10}%` }]} />
                          </View>
                          <View style={styles.scoreBarBg}>
                            <View style={[styles.scoreBarFill, { width: `${targetScore * 10}%`, backgroundColor: '#818cf8' }]} />
                          </View>
                        </View>
                        <View style={styles.comparisonValues}>
                          <Text style={styles.comparisonValueText}>{currentScore}/10</Text>
                          <Text style={[styles.comparisonValueText, { color: '#818cf8' }]}>{targetScore}/10</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>

                <View style={styles.priceComparisonBox}>
                  <Text style={styles.comparisonMetricLabel}>Price Appreciation</Text>
                  {['1 Year', '3 Years', '5 Years'].map((period) => {
                    const currentVal = property.localityInsights?.find(i => i.label === period)?.value || '0%';
                    const targetVal = targetData.localityInsights?.find((i: any) => i.label === period)?.value || '0%';
                    return (
                      <View key={period} style={styles.appreciationCompRow}>
                        <Text style={styles.appreciationCompLabel}>{period}</Text>
                        <View style={styles.appreciationCompValues}>
                          <Text style={styles.appreciationCompValueText}>{currentVal}</Text>
                          <Ionicons name="swap-horizontal" size={12} color="#475569" />
                          <Text style={[styles.appreciationCompValueText, { color: '#818cf8' }]}>{targetVal}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>

                <View style={styles.priceComparisonBox}>
                  <Text style={styles.comparisonMetricLabel}>Key Advantages</Text>
                  <View style={styles.advantagesComparisonRow}>
                    <View style={{ flex: 1, gap: 4 }}>
                      {property.localityAdvantages?.map((adv, i) => (
                        <Text key={i} style={styles.advantageTextSmall}>• {adv}</Text>
                      ))}
                    </View>
                    <View style={{ flex: 1, gap: 4 }}>
                      {targetData.localityAdvantages?.map((adv: string, i: number) => (
                        <Text key={i} style={[styles.advantageTextSmall, { color: '#818cf8' }]}>• {adv}</Text>
                      ))}
                    </View>
                  </View>
                </View>

                <View style={styles.priceComparisonBox}>
                  <Text style={styles.comparisonMetricLabel}>Avg. Price Comparison</Text>
                  <View style={styles.priceComparisonRow}>
                    <Text style={styles.priceCompValue}>{property.avgPrice}</Text>
                    <Ionicons name="swap-horizontal" size={16} color="#475569" />
                    <Text style={[styles.priceCompValue, { color: '#818cf8' }]}>{targetData.avgPrice}</Text>
                  </View>
                </View>
                    </>
                  );
                })()}

                <TouchableOpacity 
                  style={styles.resetCompareBtn}
                  onPress={() => setCompareLocalityId(null)}
                >
                  <Text style={styles.resetCompareText}>Compare with another area</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Request Callback Modal */}
      <Modal visible={isCallbackVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request a Callback</Text>
              <TouchableOpacity onPress={() => setIsCallbackVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.callbackSubtitle}>Leave your details and the agent will get back to you shortly.</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput 
                  style={styles.modalInput} 
                  value={callbackName} 
                  onChangeText={setCallbackName} 
                  placeholder="Enter your name"
                  placeholderTextColor="#475569"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput 
                  style={styles.modalInput} 
                  value={callbackEmail} 
                  onChangeText={setCallbackEmail} 
                  keyboardType="email-address"
                  placeholder="Enter your email"
                  placeholderTextColor="#475569"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput 
                  style={styles.modalInput} 
                  value={callbackPhone} 
                  onChangeText={setCallbackPhone} 
                  keyboardType="phone-pad"
                  placeholder="Enter your phone number"
                  placeholderTextColor="#475569"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Message (Optional)</Text>
                <TextInput 
                  style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]} 
                  value={callbackMessage} 
                  onChangeText={setCallbackMessage} 
                  multiline
                  placeholder={`I'm interested in ${property.name}...`}
                  placeholderTextColor="#475569"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Preferred Contact Slot</Text>
                <View style={styles.tagToggleContainer}>
                  {['Morning', 'Afternoon', 'Evening'].map((slot) => (
                    <TouchableOpacity
                      key={slot}
                      style={[styles.tagToggle, preferredContactSlot === slot && styles.tagToggleActive]}
                      onPress={() => setPreferredContactSlot(slot)}
                    >
                      <Text style={[styles.tagToggleText, preferredContactSlot === slot && styles.tagToggleTextActive]}>
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Buying Timeline</Text>
                <View style={styles.tagToggleContainer}>
                  {['Immediately', 'Within 3 months', '3-6 months', 'Just exploring'].map((timeline) => (
                    <TouchableOpacity
                      key={timeline}
                      style={[styles.tagToggle, buyingTimeline === timeline && styles.tagToggleActive]}
                      onPress={() => setBuyingTimeline(timeline)}
                    >
                      <Text style={[styles.tagToggleText, buyingTimeline === timeline && styles.tagToggleTextActive]}>
                        {timeline}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity 
                style={styles.submitReviewBtn}
                onPress={handleSubmitCallback}
              >
                <Text style={styles.submitReviewText}>Request Callback</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bank EMI Comparison Modal */}
      <Modal visible={isEMIComparisonVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bank EMI Comparison</Text>
              <TouchableOpacity onPress={() => setIsEMIComparisonVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>

            <View style={styles.bankTable}>
              <View style={styles.bankTableHeader}>
                <Text style={styles.bankHeaderCell}>Bank</Text>
                <Text style={styles.bankHeaderCell}>Rate</Text>
                <Text style={styles.bankHeaderCell}>Monthly EMI</Text>
              </View>
              {bankEMIs.map((bank, i) => (
                <View key={i} style={styles.bankRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bankName}>{bank.name}</Text>
                    {bank.name === 'SBI' && <View style={styles.bestDealBadge}><Text style={styles.bestDealText}>LOWEST RATE</Text></View>}
                  </View>
                  <Text style={styles.bankRate}>{bank.rate}%</Text>
                  <Text style={styles.bankEMI}>₹ {bank.emi}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.disclaimerText}>
              * EMI calculated for {loanTerm} years tenure with {downPayment}% down payment.
            </Text>

            <Text style={[styles.sectionTitle, { fontSize: 16, marginTop: 24, marginBottom: 12 }]}>Exclusive Bank Offers</Text>
            <View style={styles.bankOffersContainer}>
              {BANK_OFFERS.map((offer, i) => (
                <View key={i} style={styles.bankOfferItem}>
                  <Ionicons name="gift-outline" size={16} color="#fbbf24" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bankOfferTitle}>{offer.bank} Offer</Text>
                    <Text style={styles.bankOfferText}>{offer.offer}</Text>
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity 
              style={[styles.submitReviewBtn, { marginTop: 20 }]}
              onPress={() => {
                setIsEMIComparisonVisible(false);
                setIsEligibilityVisible(true);
              }}
            >
              <Text style={styles.submitReviewText}>Apply for Home Loan</Text>
            </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Trust Score Breakdown Modal */}
      <Modal visible={isTrustModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Fraud Detection Score</Text>
              <TouchableOpacity onPress={() => setIsTrustModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View style={styles.trustScoreHero}>
              <Text style={[styles.trustScoreHeroValue, { color: trustLevel.color }]}>{trustScore}</Text>
              <Text style={styles.trustScoreHeroLabel}>Overall Trust Rating</Text>
            </View>

            <View style={styles.trustBreakdownList}>
              {[
                { label: 'Verified Documents', score: '30/30', icon: 'document-text', color: '#22c55e' },
                { label: 'Price Consistency', score: '22/25', icon: 'trending-up', color: '#22c55e' },
                { label: 'Builder Reputation', score: '20/25', icon: 'business', color: '#fbbf24' },
                { label: 'User Reports', score: '10/20', icon: 'people', color: '#ef4444' },
              ].map((item, i) => (
                <View key={i} style={styles.trustBreakdownItem}>
                  <View style={styles.trustItemIcon}>
                    <Ionicons name={item.icon as any} size={18} color={item.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.trustItemLabel}>{item.label}</Text>
                    <View style={styles.trustItemBarBg}>
                      <View style={[styles.trustItemBarFill, { width: `${(parseInt(item.score) / parseInt(item.score.split('/')[1])) * 100}%`, backgroundColor: item.color }]} />
                    </View>
                  </View>
                  <Text style={styles.trustItemScore}>{item.score}</Text>
                </View>
              ))}
            </View>

            <View style={styles.aiInsightPanel}>
              <Text style={styles.aiInsightHeading}>🛡 Fraud Detection Logic</Text>
              <Text style={styles.aiInsightText}>
                Our AI cross-references RERA filings, historical price trends in {property.location.split(',')[0]}, and builder delivery history to ensure listing authenticity.
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.submitReviewBtn}
              onPress={() => setIsTrustModalVisible(false)}
            >
              <Text style={styles.submitReviewText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* AI Chat Assistant Modal */}
      <Modal visible={isAIChatVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: '70%', maxWidth: 500 }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="chatbubble-ellipses" size={24} color="#22d3ee" />
                <Text style={styles.modalTitle}>AI Property Assistant</Text>
              </View>
              <TouchableOpacity onPress={() => setIsAIChatVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 12, paddingBottom: 20 }}>
              {chatMessages.map(msg => (
                <View key={msg.id} style={[styles.chatBubble, msg.sender === 'user' ? styles.userBubble : styles.aiBubble]}>
                  <Text style={[styles.chatText, msg.sender === 'user' ? styles.userChatText : styles.aiChatText]}>{msg.text}</Text>
                </View>
              ))}
              {isChatResponding ? (
                <View style={[styles.chatBubble, styles.aiBubble, styles.typingBubble]}>
                  <Text style={[styles.chatText, styles.aiChatText, styles.typingText]}>Typing...</Text>
                </View>
              ) : null}
            </ScrollView>

            {chatStatusMessage ? <Text style={styles.chatStatusText}>{chatStatusMessage}</Text> : null}

            <View style={styles.chatInputContainer}>
              <TouchableOpacity 
                style={[styles.voiceSearchBtn, isRecording && styles.voiceSearchBtnActive]}
                onPress={toggleVoiceSearch}
                disabled={isChatResponding}
              >
                <Animated.View style={isRecording ? pulseAnimatedStyle : null}>
                  <Ionicons name={isRecording ? "mic" : "mic-outline"} size={20} color={isRecording ? "#fff" : "#22d3ee"} />
                </Animated.View>
              </TouchableOpacity>
              <TextInput
                style={styles.chatInput}
                value={chatInput}
                onChangeText={setChatInput}
                placeholder={isRecording ? "Listening..." : "Ask anything about this property or any general topic..."}
                placeholderTextColor="#475569"
                onSubmitEditing={handleAIChat}
                editable={!isChatResponding}
              />
              <TouchableOpacity 
                style={[styles.chatSendBtn, isChatResponding && styles.chatSendBtnDisabled]}
                onPress={handleAIChat}
                disabled={isChatResponding}
              >
                <Ionicons name="send" size={20} color="#020617" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Document Vault Modal */}
      <Modal visible={isDocumentVaultVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%', backgroundColor: '#020617' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="folder-open" size={24} color="#22d3ee" />
                <Text style={styles.modalTitle}>Document Vault</Text>
              </View>
              <TouchableOpacity onPress={() => setIsDocumentVaultVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Property Documents</Text>
              
              <TouchableOpacity style={styles.docItem} onPress={handleDownloadBrochure}>
                <Ionicons name="document-text" size={20} color="#22d3ee" />
                <Text style={styles.docName}>Property Brochure (PDF)</Text>
                <Ionicons name="download-outline" size={18} color="#94a3b8" />
              </TouchableOpacity>

              <View style={styles.docItem}>
                <Ionicons name="ribbon" size={20} color="#fbbf24" />
                <Text style={styles.docName}>RERA Certificate</Text>
                <Text style={styles.docStatus}>Verified</Text>
              </View>

              <View style={styles.docItem}>
                <Ionicons name="map" size={20} color="#22d3ee" />
                <Text style={styles.docName}>Approved Floor Plans</Text>
                <Ionicons name="eye-outline" size={18} color="#94a3b8" />
              </View>

              <Text style={[styles.inputLabel, { marginTop: 20 }]}>Legal Approvals</Text>
              {['Commencement Certificate', 'Occupancy Certificate', 'Fire Safety NOC', 'Environmental Clearance'].map((doc, i) => (
                <View key={i} style={styles.docItem}>
                  <Ionicons name="shield-checkmark" size={20} color="#22c55e" />
                  <Text style={styles.docName}>{doc}</Text>
                  <Ionicons name="checkmark" size={18} color="#22c55e" />
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Visit Feedback Modal */}
      <Modal visible={isFeedbackModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Visit Feedback</Text>
              <TouchableOpacity onPress={() => setIsFeedbackModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.callbackSubtitle}>How was your experience visiting {property.name}?</Text>

            <TextInput 
              style={[styles.modalInput, { height: 100, textAlignVertical: 'top' }]} 
              value={visitFeedback} 
              onChangeText={setVisitFeedback} 
              multiline
              placeholder="Share your thoughts about the property, location, or agent..."
              placeholderTextColor="#475569"
            />

            <TouchableOpacity 
              style={styles.submitReviewBtn}
              onPress={() => {
                Alert.alert("Thank You", "Your feedback helps us improve.");
                setIsFeedbackModalVisible(false);
              }}
            >
              <Text style={styles.submitReviewText}>Submit Feedback</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Price Breakup Modal */}
      <Modal visible={isPriceBreakupVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Price Breakup</Text>
              <TouchableOpacity onPress={() => setIsPriceBreakupVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View style={styles.breakupList}>
              <View style={styles.breakupRow}>
                <View style={styles.breakupLabelRow}>
                  <Ionicons name="business-outline" size={16} color="#94a3b8" />
                  <Text style={styles.breakupLabel}>Base Price</Text>
                </View>
                <Text style={styles.breakupValue}>₹ {priceBreakup.basePrice.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.breakupRow}>
                <View style={styles.breakupLabelRow}>
                  <Ionicons name="receipt-outline" size={16} color="#94a3b8" />
                  <Text style={styles.breakupLabel}>GST (5%)</Text>
                </View>
                <Text style={styles.breakupValue}>₹ {priceBreakup.tax.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.breakupRow}>
                <View style={styles.breakupLabelRow}>
                  <Ionicons name="document-text-outline" size={16} color="#94a3b8" />
                  <Text style={styles.breakupLabel}>Registration & Stamp Duty (6%)</Text>
                </View>
                <Text style={styles.breakupValue}>₹ {priceBreakup.registration.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.breakupRow}>
                <View style={styles.breakupLabelRow}>
                  <Ionicons name="construct-outline" size={16} color="#94a3b8" />
                  <Text style={styles.breakupLabel}>Maintenance (1 Year)</Text>
                </View>
                <Text style={styles.breakupValue}>₹ {priceBreakup.maintenance.toLocaleString('en-IN')}</Text>
              </View>
              <View style={[styles.breakupRow, styles.totalRow]}>
                <View style={styles.breakupLabelRow}>
                  <Ionicons name="wallet-outline" size={18} color="#22d3ee" />
                  <Text style={styles.totalLabel}>Total Estimated Cost</Text>
                </View>
                <Text style={styles.totalValue}>₹ {priceBreakup.total.toLocaleString('en-IN')}</Text>
              </View>
            </View>

            <Text style={styles.disclaimerText}>
              * Prices are indicative and subject to change based on government norms and builder policies.
            </Text>

            <TouchableOpacity 
              style={[styles.submitReviewBtn, { marginTop: 20 }]}
              onPress={() => {
                setIsPriceBreakupVisible(false);
                setIsCallbackVisible(true);
              }}
            >
              <Text style={styles.submitReviewText}>Request Detailed Quote</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Advanced Search & Filters Modal */}
      <Modal visible={isSearchModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Advanced Search</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                <TouchableOpacity onPress={clearFilters}>
                  <Text style={styles.clearAllText}>Clear All</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsSearchModalVisible(false)}>
                  <Ionicons name="close-circle" size={24} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <View style={styles.filterSection}>
                  <Text style={styles.inputLabel}>Recent Searches</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
                    {recentSearches.map((search) => (
                      <TouchableOpacity 
                        key={search.id} 
                        style={styles.recentSearchChip}
                        onPress={() => loadRecentSearch(search)}
                      >
                        <Text style={styles.recentSearchText}>
                          {search.bhk} • {search.budget}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Budget Range */}
              <View style={styles.filterSection}>
                <Text style={styles.inputLabel}>Budget Range (Up to)</Text>
                <TextInput 
                  style={styles.modalInput} 
                  value={filterBudget} 
                  onChangeText={setFilterBudget} 
                  placeholder="e.g. 2.5 Cr"
                  placeholderTextColor="#475569"
                />
              </View>

              {/* Property Type */}
              <View style={styles.filterSection}>
                <Text style={styles.inputLabel}>Property Type</Text>
                <View style={styles.tagToggleContainer}>
                  {['Apartment', 'Villa', 'Plot'].map(type => (
                    <TouchableOpacity 
                      key={type} 
                      style={[styles.tagToggle, filterPropertyType === type && styles.tagToggleActive]}
                      onPress={() => setFilterPropertyType(type)}
                    >
                      <Text style={[styles.tagToggleText, filterPropertyType === type && styles.tagToggleTextActive]}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* BHK Selector */}
              <View style={styles.filterSection}>
                <Text style={styles.inputLabel}>BHK</Text>
                <View style={styles.tagToggleContainer}>
                  {['1 BHK', '2 BHK', '3 BHK', '4+ BHK'].map(bhk => (
                    <TouchableOpacity 
                      key={bhk} 
                      style={[styles.tagToggle, filterBHK === bhk && styles.tagToggleActive]}
                      onPress={() => setFilterBHK(bhk)}
                    >
                      <Text style={[styles.tagToggleText, filterBHK === bhk && styles.tagToggleTextActive]}>{bhk}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Possession */}
              <View style={styles.filterSection}>
                <Text style={styles.inputLabel}>Possession Status</Text>
                <View style={styles.tagToggleContainer}>
                  {['Ready', 'Under Construction'].map(status => (
                    <TouchableOpacity 
                      key={status} 
                      style={[styles.tagToggle, filterPossession === status && styles.tagToggleActive]}
                      onPress={() => setFilterPossession(status)}
                    >
                      <Text style={[styles.tagToggleText, filterPossession === status && styles.tagToggleTextActive]}>{status}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Builder */}
              <View style={styles.filterSection}>
                <Text style={styles.inputLabel}>Preferred Builder</Text>
                <TextInput 
                  style={styles.modalInput} 
                  value={filterBuilder} 
                  onChangeText={setFilterBuilder} 
                  placeholder="Enter builder name"
                  placeholderTextColor="#475569"
                />
              </View>

              {/* Amenities */}
              <View style={styles.filterSection}>
                <Text style={styles.inputLabel}>Amenities</Text>
                <View style={styles.tagToggleContainer}>
                  {['Gym', 'Pool', 'Parking', 'Clubhouse', 'Security'].map(amenity => (
                    <TouchableOpacity 
                      key={amenity} 
                      style={[styles.tagToggle, filterAmenities.includes(amenity) && styles.tagToggleActive]}
                      onPress={() => {
                        setFilterAmenities(prev => 
                          prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
                        );
                      }}
                    >
                      <Text style={[styles.tagToggleText, filterAmenities.includes(amenity) && styles.tagToggleTextActive]}>{amenity}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* RERA Verified Toggle */}
              <View style={[styles.filterSection, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                <Text style={styles.inputLabel}>RERA Verified Only</Text>
                <TouchableOpacity 
                  onPress={() => setFilterReraOnly(!filterReraOnly)}
                >
                  <Ionicons 
                    name={filterReraOnly ? "checkbox" : "square-outline"} 
                    size={24} 
                    color={filterReraOnly ? "#22d3ee" : "#94a3b8"} 
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={[styles.saveSearchBtn, isSearchSaved && styles.saveSearchBtnActive]}
                onPress={handleSaveSearch}
              >
                <Ionicons 
                  name={isSearchSaved ? "notifications" : "notifications-outline"} 
                  size={20} 
                  color={isSearchSaved ? "#020617" : "#22d3ee"} 
                />
                <Text style={[styles.saveSearchText, isSearchSaved && styles.saveSearchTextActive]}>
                  {isSearchSaved ? "Search Saved" : "Save Search & Notify Me"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.submitReviewBtn}
                onPress={applyFilters}
              >
                <Text style={styles.submitReviewText}>Apply Filters</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Comparison Modal */}
      <Modal visible={isCompareVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { width: '95%', maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Compare Properties</Text>
              <TouchableOpacity onPress={() => {
                setIsCompareVisible(false);
                setCompareWithId(null);
              }}>
                <Ionicons name="close-circle" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {!compareWithId ? (
              <ScrollView>
                <Text style={styles.inputLabel}>Select a property to compare with:</Text>
                {similarProperties.map(p => (
                  <TouchableOpacity 
                    key={p.id} 
                    style={styles.compareSelectItem}
                    onPress={() => setCompareWithId(p.id)}
                  >
                    <Image source={{ uri: p.image }} style={styles.compareSelectImg} />
                    <View>
                      <Text style={styles.compareSelectName}>{p.name}</Text>
                      <Text style={styles.compareSelectPrice}>{p.price}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View>
                <View style={styles.compareTable}>
                  <View style={styles.compareRow}>
                    <Text style={styles.compareCellHeader}>Feature</Text>
                    <Text style={styles.compareCellHeader}>Current</Text>
                    <Text style={styles.compareCellHeader}>Selected</Text>
                  </View>
                  {[
                    { label: 'Price', key: 'price' },
                    { label: 'Beds', key: 'beds' },
                    { label: 'Baths', key: 'baths' },
                    { label: 'Area', key: 'sqft' },
                    { label: 'Status', key: 'status' },
                    { label: 'Possession', key: 'possession' },
                  ].map(row => (
                    <View key={row.key} style={styles.compareRow}>
                      <Text style={styles.compareLabelCell}>{row.label}</Text>
                      <Text style={styles.compareValueCell}>{property[row.key] ?? '-'}</Text>
                      <Text style={styles.compareValueCell}>{compareWithId ? (PROPERTIES_DATA[compareWithId][row.key] ?? '-') : '-'}</Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity 
                  style={styles.resetCompareBtn}
                  onPress={() => setCompareWithId(null)}
                >
                  <Text style={styles.resetCompareText}>Choose Different Property</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
      {/* Footer Actions (non-sticky) */}
      <View style={[styles.stickyFooter, isSmallMobile && styles.stickyFooterMobile]}>
        <TouchableOpacity style={[styles.footerSecondaryBtn, isSmallMobile && styles.stickyFooterBtnMobile]} onPress={handleWhatsAppShare}>
          <Ionicons name="logo-whatsapp" size={20} color="#22c55e" />
          <Text style={styles.footerSecondaryText}>WhatsApp</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.footerPrimaryBtn, isSmallMobile && styles.stickyFooterBtnMobile]} onPress={() => setIsCallbackVisible(true)}>
          <Ionicons name="call" size={20} color="#020617" />
          <Text style={styles.footerPrimaryText}>Contact Seller</Text>
        </TouchableOpacity>
      </View>
      </Animated.View>
    </ParallaxScrollView>
    </View>
  );
}







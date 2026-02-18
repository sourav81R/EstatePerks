import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Platform, ScrollView, useWindowDimensions, KeyboardAvoidingView, Pressable, Modal, Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  "Explain home loan pre-approval",
  "Summarize AI in simple words",
  "Give me a 7-day productivity plan"
];

const TRENDING_LOCALITIES = [
  { id: '1', name: 'Indiranagar', icon: 'business' },
  { id: '2', name: 'Bandra', icon: 'boat' },
  { id: '3', name: 'Hitech City', icon: 'code-working' },
  { id: '4', name: 'Koregaon', icon: 'leaf' },
  { id: '5', name: 'Whitefield', icon: 'construct' },
  { id: '6', name: 'Powai', icon: 'water' },
];

const PLATFORM_HIGHLIGHTS = [
  { id: 'verified', icon: 'shield-checkmark-outline', label: '100% verified property inventory' },
  { id: 'tours', icon: 'scan-outline', label: 'Immersive 360 virtual walkthroughs' },
  { id: 'advisory', icon: 'analytics-outline', label: 'AI-backed pricing and ROI insights' },
];

const SAVED_PROPERTIES_STORAGE_KEY = 'estateperks:savedProperties:v1';
const MAX_COMPARE_PROPERTIES = 3;
const AI_ASSISTANT_ENDPOINT = process.env.EXPO_PUBLIC_AI_ASSISTANT_ENDPOINT;
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_MODEL = process.env.EXPO_PUBLIC_GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_API_BASE = (process.env.EXPO_PUBLIC_GEMINI_API_BASE || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/$/, '');
const APP_STORE_URL = process.env.EXPO_PUBLIC_APPLE_APP_STORE_URL || 'https://apps.apple.com/';
const GOOGLE_PLAY_URL = process.env.EXPO_PUBLIC_GOOGLE_PLAY_STORE_URL || 'https://play.google.com/store/apps';
const NEWSLETTER_SUBSCRIBE_ENDPOINT = process.env.EXPO_PUBLIC_NEWSLETTER_SUBSCRIBE_ENDPOINT
  || (AI_ASSISTANT_ENDPOINT ? AI_ASSISTANT_ENDPOINT.replace('/api/ai-assistant', '/api/newsletter/subscribe') : '');

type ChatSender = 'ai' | 'user';

interface ChatMessage {
  id: string;
  text: string;
  sender: ChatSender;
}

const ShimmerChar = ({ char, index, total, isAccent, baseStyle }: { char: string, index: number, total: number, isAccent: boolean, baseStyle: any }) => {
  const shimmerValue = useSharedValue(0);

  useEffect(() => {
    shimmerValue.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );
  }, [shimmerValue]);

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

  const isLargeScreen = width >= 1200;
  const isTablet = width >= 768 && width < 1200;
  const isTabletWide = width >= 960 && width < 1200;
  const isMobile = width < 768;
  const isSmallMobile = width < 380;
  const isCompactMobile = width < 480;
  const isXsMobile = width < 360;
  const showHeroInsightsPanel = width >= 1080;
  const numColumns = isLargeScreen ? 3 : isTabletWide ? 2 : 1;
  const listPadding = Platform.OS === 'web' ? 20 : 16;
  const pageGutter = isXsMobile ? 10 : isSmallMobile ? 12 : isCompactMobile ? 14 : 16;
  const sectionInlinePadding = isMobile ? 0 : pageGutter;
  const sectionSpacing = isSmallMobile ? 16 : 20;
  const chipSpacing = isSmallMobile ? 6 : 8;
  const mobileCarouselCardWidth = Math.min(340, width - pageGutter * 2);
  const modalMaxWidth = Math.min(500, Math.max(280, width - pageGutter * 2));
  const modalMaxHeight = isXsMobile ? '94%' : isSmallMobile ? '92%' : '88%';
  const chatModalHeight = isXsMobile ? '92%' : isMobile ? '88%' : '70%';

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
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [savedPropertyIds, setSavedPropertyIds] = useState<string[]>([]);
  const [comparePropertyIds, setComparePropertyIds] = useState<string[]>([]);
  const [isCompareModalVisible, setIsCompareModalVisible] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [isAboutModalVisible, setIsAboutModalVisible] = useState(false);
  const [isCareersModalVisible, setIsCareersModalVisible] = useState(false);
  const [isPrivacyModalVisible, setIsPrivacyModalVisible] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');

  const handleOpenExternalLink = useCallback((url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Unable to open link', 'Please try again later.');
    });
  }, []);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleSubscribe = useCallback(async () => {
    const email = newsletterEmail.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    if (!NEWSLETTER_SUBSCRIBE_ENDPOINT) {
      Alert.alert('Configuration Missing', 'Newsletter endpoint is not configured.');
      return;
    }

    if (isSubscribing) return;

    setIsSubscribing(true);
    try {
      const res = await fetch(NEWSLETTER_SUBSCRIBE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Unable to subscribe right now. Please try again.');
      }

      setIsSubscribed(true);
      setNewsletterEmail('');
      Alert.alert('Subscription Successful', `A confirmation email has been sent to ${email}.`);
      setTimeout(() => setIsSubscribed(false), 5000);
    } catch (error) {
      Alert.alert(
        'Subscription Failed',
        error instanceof Error ? error.message : 'Unable to subscribe right now. Please try again.'
      );
    } finally {
      setIsSubscribing(false);
    }
  }, [newsletterEmail, isSubscribing]);

  const [isTermsModalVisible, setIsTermsModalVisible] = useState(false);
  const chatScrollRef = useRef<ScrollView>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: "Hi! I am your AI Chat Assist. Ask me anything, including real-estate, learning, planning, or general questions.",
      sender: 'ai',
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatResponding, setIsChatResponding] = useState(false);
  const [chatStatusMessage, setChatStatusMessage] = useState<string | null>(null);

  const requestSupportAIResponse = useCallback(async (
    question: string,
    conversation: ChatMessage[]
  ): Promise<{ answer: string | null; endpointFailed: boolean }> => {
    const payload = {
      assistantMode: 'support',
      question,
      property: {},
      metrics: {},
      appContext: {
        userFilters: {
          city: selectedCity,
          intent: selectedIntent,
          bhk: selectedBHK,
          propertyType: selectedType,
          searchQuery: searchQuery.trim(),
          onlySaved: showSavedOnly,
        },
        shortlistCount: savedPropertyIds.length,
        compareCount: comparePropertyIds.length,
        platform: Platform.OS,
      },
      recentConversation: conversation.slice(-10).map((msg) => ({
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
          'App context:',
          JSON.stringify(payload.appContext, null, 2),
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
                    'You are EstatePerks AI Chat Assist.',
                    'The user can ask any question.',
                    'Answer clearly and concisely.',
                    'For real-estate queries, give practical next steps for India.',
                    'If uncertain, say what details are needed next.',
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
          const data = await geminiRes.json() as any;
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
        // Ignore and use local instant fallback below.
      }
    }

    return { answer: null, endpointFailed };
  }, [
    comparePropertyIds.length,
    savedPropertyIds.length,
    searchQuery,
    selectedBHK,
    selectedCity,
    selectedIntent,
    selectedType,
    showSavedOnly,
  ]);

  const getFallbackSupportReply = useCallback((question: string) => {
    const q = question.toLowerCase();

    if (/(hello|hi|hey|namaste)/.test(q)) {
      return 'Hi! I can usually answer any topic. If you need property help, I can guide visits, loan prep, price checks, and shortlisting.';
    }

    if (/(book|schedule|visit|tour|site visit)/.test(q)) {
      return 'To book a visit: 1) open a property card, 2) tap "Schedule Visit", 3) pick your preferred slot. Keep an ID proof ready for gated communities.';
    }

    if (/(loan|emi|eligib|mortgage|finance)/.test(q)) {
      return 'For fast loan eligibility checks, keep your monthly income, current EMIs, and down payment amount ready. A safe thumb rule is total EMIs under about 40% of net monthly income.';
    }

    if (/(price|trend|market|appreciation|roi|investment)/.test(q)) {
      return `Current filters are set to ${selectedIntent} in ${selectedCity}. Compare at least 3 similar listings by price/sqft and possession stage before negotiating.`;
    }

    if (/(contact|agent|call|whatsapp|human|owner)/.test(q)) {
      return 'You can connect with an agent from any property details page. Share budget, preferred locality, and move-in timeline to get better recommendations quickly.';
    }

    return 'Live AI is temporarily unavailable, so instant mode is limited. Please retry in a moment for full answers on any topic.';
  }, [selectedCity, selectedIntent]);

  const handleSendMessage = useCallback(async (text?: string) => {
    const messageText = (typeof text === 'string' ? text : chatInput).trim();
    if (!messageText || isChatResponding) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
    };
    const conversation = [...chatMessages, userMsg];
    setChatMessages(conversation);
    if (typeof text !== 'string') setChatInput('');
    setChatStatusMessage(null);
    setIsChatResponding(true);

    try {
      const { answer, endpointFailed } = await requestSupportAIResponse(messageText, conversation);
      const aiMessage = answer || getFallbackSupportReply(messageText);

      if (endpointFailed) {
        setChatStatusMessage('Live AI endpoint is unavailable right now. Instant mode is limited until reconnection.');
      }

      const aiMsg: ChatMessage = {
        id: `${Date.now() + 1}`,
        text: aiMessage,
        sender: 'ai',
      };

      setChatMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsChatResponding(false);
    }
  }, [chatInput, chatMessages, getFallbackSupportReply, isChatResponding, requestSupportAIResponse]);

  useEffect(() => {
    if (!isChatVisible) return;
    const timer = setTimeout(() => {
      chatScrollRef.current?.scrollToEnd({ animated: true });
    }, 50);
    return () => clearTimeout(timer);
  }, [chatMessages, isChatResponding, isChatVisible]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCity('All');
    setSortBy('default');
    setSelectedBHK('All');
    setSelectedType('All');
    setSelectedIntent('Buy');
    setShowSavedOnly(false);
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
           selectedIntent !== 'Buy' ||
           showSavedOnly;
  }, [searchQuery, selectedCity, selectedBHK, selectedType, sortBy, selectedIntent, showSavedOnly]);

  const parsePrice = useCallback((priceStr: string) => {
    const cleanStr = priceStr.replace(/,/g, '').toLowerCase();
    const num = parseFloat(cleanStr.replace(/[^\d.]/g, '')) || 0;
    if (priceStr.toLowerCase().includes('cr')) return num * 10_000_000;
    if (priceStr.toLowerCase().includes('lakh')) return num * 100_000;
    return isNaN(num) ? 0 : num;
  }, []);

  const parseSqft = useCallback((sqftStr: string) => {
    const raw = parseFloat(String(sqftStr || '').replace(/[^\d.]/g, ''));
    return Number.isFinite(raw) ? raw : 0;
  }, []);

  const formatCurrencyShort = useCallback((value: number) => {
    if (!Number.isFinite(value) || value <= 0) return 'NA';
    if (value >= 10_000_000) return `Rs ${(value / 10_000_000).toFixed(2)} Cr`;
    if (value >= 100_000) return `Rs ${(value / 100_000).toFixed(1)} Lakh`;
    return `Rs ${Math.round(value).toLocaleString('en-IN')}`;
  }, []);

  const calculateMonthlyEmi = useCallback((propertyPrice: number) => {
    if (!Number.isFinite(propertyPrice) || propertyPrice <= 0) return 0;
    const loanAmount = propertyPrice * 0.8;
    const monthlyRate = 8.5 / 12 / 100;
    const months = 20 * 12;
    const factor = (1 + monthlyRate) ** months;
    return Math.round((loanAmount * monthlyRate * factor) / (factor - 1));
  }, []);

  const getDeterministicMatchScore = useCallback((propertyId: string) => {
    const contextSeed = `${propertyId}:${selectedCity}:${selectedBHK}:${selectedType}:${selectedIntent}:${searchQuery.trim().toLowerCase()}`;
    let hash = 0;
    for (let i = 0; i < contextSeed.length; i += 1) {
      hash = (hash << 5) - hash + contextSeed.charCodeAt(i);
      hash |= 0;
    }
    return 86 + (Math.abs(hash) % 14);
  }, [searchQuery, selectedCity, selectedBHK, selectedType, selectedIntent]);

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

  useEffect(() => {
    let isMounted = true;
    const loadSavedProperties = async () => {
      try {
        const raw = await AsyncStorage.getItem(SAVED_PROPERTIES_STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (isMounted && Array.isArray(parsed)) {
          setSavedPropertyIds(parsed.filter((id): id is string => typeof id === 'string'));
        }
      } catch {
        // Ignore storage errors and continue with empty saved list.
      }
    };
    loadSavedProperties();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(SAVED_PROPERTIES_STORAGE_KEY, JSON.stringify(savedPropertyIds)).catch(() => {
      // Ignore transient storage failures.
    });
  }, [savedPropertyIds]);

  const toggleSavedProperty = useCallback((propertyId: string) => {
    setSavedPropertyIds(prev => (
      prev.includes(propertyId) ? prev.filter(id => id !== propertyId) : [...prev, propertyId]
    ));
  }, []);

  const toggleCompareProperty = useCallback((propertyId: string) => {
    setComparePropertyIds(prev => {
      if (prev.includes(propertyId)) {
        return prev.filter(id => id !== propertyId);
      }
      if (prev.length >= MAX_COMPARE_PROPERTIES) {
        Alert.alert('Compare Limit Reached', `You can compare up to ${MAX_COMPARE_PROPERTIES} properties at once.`);
        return prev;
      }
      return [...prev, propertyId];
    });
  }, []);

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

      const matchesSaved = !showSavedOnly || savedPropertyIds.includes(p.id);
      return matchesSearch && matchesCity && matchesBHK && matchesType && matchesIntent && matchesSaved;
    }).map(p => ({
      ...p,
      matchScore: getDeterministicMatchScore(p.id),
      priceValue: parsePrice(p.price),
      sqftValue: parseSqft(p.sqft),
      estimatedEmi: calculateMonthlyEmi(parsePrice(p.price)),
      pricePerSqftValue: parseSqft(p.sqft) > 0 ? Math.round(parsePrice(p.price) / parseSqft(p.sqft)) : 0,
    }));

    if (sortBy === 'low-to-high') {
      result.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    } else if (sortBy === 'high-to-low') {
      result.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
    }

    return result;
  }, [
    searchQuery,
    selectedCity,
    sortBy,
    selectedBHK,
    selectedType,
    selectedIntent,
    showSavedOnly,
    savedPropertyIds,
    allProperties,
    parsePrice,
    parseSqft,
    calculateMonthlyEmi,
    getDeterministicMatchScore,
  ]);

  const compareProperties = useMemo(
    () => comparePropertyIds.map(id => allProperties.find(p => p.id === id)).filter(Boolean) as any[],
    [comparePropertyIds, allProperties]
  );

  const marketSnapshot = useMemo(() => {
    if (!filteredProperties.length) {
      return {
        listingCount: 0,
        avgPrice: 'NA',
        avgPricePerSqft: 'NA',
        readyToMoveCount: 0,
      };
    }

    const totalPrice = filteredProperties.reduce((sum, item) => sum + (item.priceValue || 0), 0);
    const validPsfValues = filteredProperties
      .map(item => item.pricePerSqftValue || 0)
      .filter(value => value > 0);
    const totalPsf = validPsfValues.reduce((sum, value) => sum + value, 0);
    const readyToMoveCount = filteredProperties.filter(item => item.status === 'Ready to Move').length;

    return {
      listingCount: filteredProperties.length,
      avgPrice: formatCurrencyShort(totalPrice / filteredProperties.length),
      avgPricePerSqft: validPsfValues.length ? `Rs ${Math.round(totalPsf / validPsfValues.length).toLocaleString('en-IN')}/sqft` : 'NA',
      readyToMoveCount,
    };
  }, [filteredProperties, formatCurrencyShort]);

  const heroStats = useMemo(() => ([
    { id: 'listings', label: 'Live Listings', value: marketSnapshot.listingCount.toString() },
    { id: 'ready', label: 'Ready to Move', value: marketSnapshot.readyToMoveCount.toString() },
    { id: 'saved', label: 'Saved', value: savedPropertyIds.length.toString() },
  ]), [marketSnapshot.listingCount, marketSnapshot.readyToMoveCount, savedPropertyIds.length]);

  const activeIntentCopy = selectedIntent === 'New Projects' ? 'new project opportunities' : `${selectedIntent.toLowerCase()} opportunities`;

  const renderProperty = ({ item }: { item: any }) => {
    return (
    <Pressable
      style={({ hovered }) => [
        styles.card,
        isMobile && styles.cardCompact,
        savedPropertyIds.includes(item.id) && styles.cardSaved,
        numColumns === 1 ? styles.cardSingleColumn : { width: numColumns === 2 ? '48.5%' : '31.5%' },
        hovered && Platform.OS === 'web' && styles.cardHover
      ]}
      onPress={() => router.push(`/property/${item.id}`)}
    >
      <Image source={{ uri: item.image }} style={[styles.image, isMobile && styles.imageCompact]} contentFit="cover" />
      <TouchableOpacity
        style={[styles.cardIconButton, styles.saveIconButton, savedPropertyIds.includes(item.id) && styles.saveIconButtonActive]}
        onPress={() => toggleSavedProperty(item.id)}
      >
        <Ionicons
          name={savedPropertyIds.includes(item.id) ? 'heart' : 'heart-outline'}
          size={16}
          color={savedPropertyIds.includes(item.id) ? '#ef4444' : '#cbd5e1'}
        />
      </TouchableOpacity>
      <View style={styles.matchBadge}>
        <Ionicons name="flash" size={10} color="#020617" />
        <Text style={styles.matchBadgeText}>{item.matchScore}% Match</Text>
      </View>
      <View style={[styles.info, isMobile && styles.infoMobile]}>
        <View style={styles.headerRow}>
          <Text style={[styles.name, isMobile && styles.nameMobile]} numberOfLines={1}>{item.name}</Text>
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
          <Text style={[styles.price, isMobile && styles.priceMobile]}>{item.price}</Text>
          <Text style={styles.sqft}>{item.sqft} sqft</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>EMI from {formatCurrencyShort(item.estimatedEmi)}/mo</Text>
          <Text style={styles.metaText}>{item.pricePerSqftValue ? `Rs ${item.pricePerSqftValue.toLocaleString('en-IN')}/sqft` : 'Price on request'}</Text>
        </View>
        <View style={[styles.cardActions, isCompactMobile && styles.cardActionsStack]}>
          <TouchableOpacity
            style={[styles.viewDetailsBtn, isMobile && styles.mobileActionButton, isCompactMobile && styles.actionBtnStack]}
            onPress={() => router.push({ pathname: '/property/[id]', params: { id: item.id } } as any)}
          >
            <Text style={styles.viewDetailsText}>View Details</Text>
          </TouchableOpacity>
          {item.rooms && item.rooms.length > 0 && (
            <TouchableOpacity
              style={[styles.virtualTourBtn, isMobile && styles.mobileActionButton, isCompactMobile && styles.actionBtnStack]}
              onPress={() => router.push({ pathname: '/property/[id]', params: { id: item.id, virtualTour: 'true' } } as any)}
            >
              <Ionicons name="scan-outline" size={16} color="#22d3ee" />
              <Text style={styles.virtualTourBtnText}>360 Tour</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.compareBtn, isMobile && styles.mobileActionButton, isCompactMobile && styles.actionBtnStack]}
            onPress={() => toggleCompareProperty(item.id)}
          >
            <Ionicons
              name={comparePropertyIds.includes(item.id) ? 'git-compare' : 'git-compare-outline'}
              size={16}
              color="#fbbf24"
            />
            <Text style={styles.compareBtnText}>{comparePropertyIds.includes(item.id) ? 'Added' : 'Compare'}</Text>
          </TouchableOpacity>
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
        style={styles.listViewport}
        key={numColumns} // Force re-render when columns change
        data={filteredProperties}
        renderItem={renderProperty}
        keyExtractor={item => item.id}
        numColumns={numColumns}
        contentContainerStyle={[
          styles.list,
          isLargeScreen && styles.listLarge,
          !isMobile && { padding: listPadding },
          isMobile && styles.listMobile,
          isMobile && { paddingHorizontal: pageGutter, paddingBottom: 48 }
        ]}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : null}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={[styles.header, isMobile && styles.headerMobile]} onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}>
            <View style={[styles.headerTop, isMobile && styles.headerStack, isMobile && styles.headerTopMobile, isMobile && { paddingHorizontal: sectionInlinePadding }]}>
              {!isPropertiesView ? (
                <>
                <View style={[styles.heroTextBlock, showHeroInsightsPanel && styles.heroTextBlockDesktop, isLargeScreen && styles.heroTextBlockLarge]}>
                  <Animated.Text
                    entering={FadeInDown.duration(1000).springify()}
                    style={[styles.welcome, isMobile && styles.welcomeMobile, isSmallMobile && styles.welcomeSmall, isXsMobile && styles.welcomeXs]}
                  >
                  {"Find your dream home".split('').map((char, index) => (
                    <ShimmerChar
                      key={index}
                      char={char}
                      index={index}
                      total={20}
                      isAccent={index >= 10}
                      baseStyle={[styles.welcome, isMobile && styles.welcomeMobile, isSmallMobile && styles.welcomeSmall, isXsMobile && styles.welcomeXs]}
                    />
                  ))}
                  </Animated.Text>
                  <Animated.Text
                    entering={FadeInDown.delay(200).duration(1000).springify()}
                    style={[styles.subtitle, isMobile && styles.subtitleMobile, isSmallMobile && styles.subtitleSmall, isXsMobile && styles.subtitleXs]}
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
                    <Text style={styles.heroCTAText}>Buy | Rent | Invest in top cities</Text>
                    <View style={[styles.heroCTAButtons, isMobile && styles.ctaWrap]}>
                      <TouchableOpacity
                        style={[
                          styles.heroCTAButton,
                          isMobile && styles.heroCTAButtonMobile,
                          isCompactMobile && styles.heroCTAButtonCompact,
                          isXsMobile && styles.heroCTAButtonXs,
                          selectedIntent === 'Buy' && styles.heroCTAButtonActive
                        ]}
                        onPress={() => {
                          setSelectedIntent('Buy');
                          scrollToProperties();
                        }}
                      >
                        <Text style={[styles.heroCTAButtonText, isMobile && styles.heroCTAButtonTextMobile, selectedIntent === 'Buy' && styles.heroCTAButtonTextActive]}>Buy</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.heroCTAButton,
                          isMobile && styles.heroCTAButtonMobile,
                          isCompactMobile && styles.heroCTAButtonCompact,
                          isXsMobile && styles.heroCTAButtonXs,
                          selectedIntent === 'Rent' && styles.heroCTAButtonActive
                        ]}
                        onPress={() => {
                          setSelectedIntent('Rent');
                          scrollToProperties();
                        }}
                      >
                        <Text style={[styles.heroCTAButtonText, isMobile && styles.heroCTAButtonTextMobile, selectedIntent === 'Rent' && styles.heroCTAButtonTextActive]}>Rent</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.heroCTAButton,
                          isMobile && styles.heroCTAButtonMobile,
                          isCompactMobile && styles.heroCTAButtonCompact,
                          isXsMobile && styles.heroCTAButtonXs,
                          selectedIntent === 'New Projects' && styles.heroCTAButtonActive
                        ]}
                        onPress={() => {
                          setSelectedIntent('New Projects');
                          scrollToProperties();
                        }}
                      >
                        <Text style={[styles.heroCTAButtonText, isMobile && styles.heroCTAButtonTextMobile, selectedIntent === 'New Projects' && styles.heroCTAButtonTextActive]}>New Projects</Text>
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                </View>
                {showHeroInsightsPanel && (
                  <View style={styles.heroInsightsPanel}>
                    <Text style={styles.heroInsightsTitle}>Why EstatePerks</Text>
                    {PLATFORM_HIGHLIGHTS.map((item) => (
                      <View key={item.id} style={styles.heroInsightsRow}>
                        <View style={styles.heroInsightsIconWrap}>
                          <Ionicons name={item.icon as any} size={16} color="#22d3ee" />
                        </View>
                        <Text style={styles.heroInsightsText}>{item.label}</Text>
                      </View>
                    ))}
                    <View style={styles.heroStatsGrid}>
                      {heroStats.map((stat) => (
                        <View key={stat.id} style={styles.heroStatCard}>
                          <Text style={styles.heroStatValue}>{stat.value}</Text>
                          <Text style={styles.heroStatLabel}>{stat.label}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                </>
              ) : (
                <View style={styles.heroTextBlock}>
                  <Text style={styles.welcome}>All Properties</Text>
                  <Text style={styles.subtitle}>Browse our extensive collection of premium homes</Text>
                </View>
              )}
              {hasActiveFilters && (
                <TouchableOpacity onPress={clearAllFilters} style={[styles.clearButton, isMobile && styles.clearButtonMobile]}>
                  <Text style={styles.clearButtonText}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={[styles.searchContainer, isMobile && styles.searchContainerMobile, isMobile && { marginTop: sectionSpacing, marginHorizontal: sectionInlinePadding }]}>
              <Ionicons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
              <TextInput
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

            <View style={[styles.trendingSection, isMobile && { marginTop: sectionSpacing + 8 }]}>
              <Text style={[styles.featuredTitle, isMobile && { paddingHorizontal: sectionInlinePadding }]}>Trending Localities</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.trendingScroll, isMobile && { paddingHorizontal: sectionInlinePadding }]}
              >
                {TRENDING_LOCALITIES.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.localityItem, isMobile && { marginRight: 14, width: 72 }]}
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
              <View style={[styles.featuredSection, isMobile && styles.featuredSectionMobile]}>
                <Text style={[styles.featuredTitle, isMobile && { paddingHorizontal: sectionInlinePadding }]}>Featured Properties</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[styles.featuredContent, isMobile && { paddingHorizontal: sectionInlinePadding }]}
                >
                  {featuredProperties.map(item => (
                    <Pressable
                      key={item.id}
                      style={({ hovered }) => [
                        styles.featuredCard,
                        { width: isLargeScreen ? 350 : isTablet ? 300 : mobileCarouselCardWidth },
                        hovered && Platform.OS === 'web' && styles.featuredCardHover
                      ]}
                      onPress={() => router.push(`/property/${item.id}`)}
                    >
                      <Image source={{ uri: item.image }} style={styles.featuredImage} contentFit="cover" />
                      <LinearGradient
                        colors={['transparent', 'rgba(5, 12, 24, 0.92)']}
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

            <View style={[styles.discoveryPanel, isMobile && { marginHorizontal: sectionInlinePadding }]}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.cityFilterContainer}
                contentContainerStyle={[styles.cityFilterContent, isMobile && { paddingHorizontal: sectionInlinePadding }]}
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
                <Text style={[styles.filterLabel, isMobile && { paddingHorizontal: sectionInlinePadding }]}>Filter by BHK:</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[styles.filterContent, isMobile && { paddingHorizontal: sectionInlinePadding }]}
                >
                  {['All', '1 BHK', '2 BHK', '3 BHK', '4+ BHK'].map(bhk => (
                    <Pressable
                      key={bhk}
                      style={({ hovered }) => [
                        styles.filterChip,
                        isMobile && { paddingVertical: 10, paddingHorizontal: 12 + chipSpacing },
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
                <Text style={[styles.filterLabel, isMobile && { paddingHorizontal: sectionInlinePadding }]}>Property Type:</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[styles.filterContent, isMobile && { paddingHorizontal: sectionInlinePadding }]}
                >
                  {['All', 'Apartment', 'Villa'].map(type => (
                    <Pressable
                      key={type}
                      style={({ hovered }) => [
                        styles.filterChip,
                        isMobile && { paddingVertical: 10, paddingHorizontal: 12 + chipSpacing },
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
                <Text style={[styles.sortLabel, isMobile && { paddingHorizontal: sectionInlinePadding }]}>Sort by Price:</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[styles.sortContent, isMobile && { paddingHorizontal: sectionInlinePadding }]}
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
                        isMobile && { paddingVertical: 10, paddingHorizontal: 12 + chipSpacing },
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

              <View style={styles.filterSection}>
                <Text style={[styles.filterLabel, isMobile && { paddingHorizontal: sectionInlinePadding }]}>Saved Properties:</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[styles.filterContent, isMobile && { paddingHorizontal: sectionInlinePadding }]}
                >
                  <Pressable
                    style={({ hovered }) => [
                      styles.filterChip,
                      isMobile && { paddingVertical: 10, paddingHorizontal: 12 + chipSpacing },
                      showSavedOnly && styles.filterChipActive,
                      hovered && Platform.OS === 'web' && !showSavedOnly && styles.chipHover
                    ]}
                    onPress={() => setShowSavedOnly(prev => !prev)}
                  >
                    <Text style={[styles.filterChipText, showSavedOnly && styles.filterChipTextActive]}>
                      Saved Only ({savedPropertyIds.length})
                    </Text>
                  </Pressable>
                </ScrollView>
              </View>

              <View style={[styles.resultsStrip, isCompactMobile && styles.resultsStripCompact]}>
                <View style={styles.resultsStripTextWrap}>
                  <Text style={styles.resultsStripTitle}>{filteredProperties.length} homes matched</Text>
                  <Text style={styles.resultsStripSubtitle}>
                    Curated {activeIntentCopy} in {selectedCity === 'All' ? 'top cities across India' : selectedCity}
                  </Text>
                </View>
                <TouchableOpacity style={[styles.resultsStripBtn, isCompactMobile && styles.resultsStripBtnCompact]} onPress={scrollToProperties}>
                  <Text style={styles.resultsStripBtnText}>View Listings</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.insightsSection, isMobile && { marginHorizontal: sectionInlinePadding }]}>
              <Text style={styles.insightsTitle}>Market Snapshot</Text>
              <View style={[styles.insightsGrid, isCompactMobile && styles.insightsGridCompact]}>
                <View style={styles.insightCard}>
                  <Text style={styles.insightLabel}>Listings</Text>
                  <Text style={styles.insightValue}>{marketSnapshot.listingCount}</Text>
                </View>
                <View style={styles.insightCard}>
                  <Text style={styles.insightLabel}>Avg. Price</Text>
                  <Text style={styles.insightValue}>{marketSnapshot.avgPrice}</Text>
                </View>
                <View style={styles.insightCard}>
                  <Text style={styles.insightLabel}>Avg. Price / sqft</Text>
                  <Text style={styles.insightValue}>{marketSnapshot.avgPricePerSqft}</Text>
                </View>
                <View style={styles.insightCard}>
                  <Text style={styles.insightLabel}>Ready to Move</Text>
                  <Text style={styles.insightValue}>{marketSnapshot.readyToMoveCount}</Text>
                </View>
              </View>
            </View>

            <View style={[styles.testimonialsSection, isMobile && styles.testimonialsSectionMobile]}>
              <Text style={[styles.featuredTitle, isMobile && { paddingHorizontal: sectionInlinePadding }]}>What Our Clients Say</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.testimonialsContent, isMobile && { paddingHorizontal: sectionInlinePadding }]}
              >
                {TESTIMONIALS.map(item => (
                  <Pressable
                    key={item.id}
                    style={({ hovered }) => [
                      styles.testimonialCard,
                      { width: isLargeScreen ? 350 : isTablet ? 300 : mobileCarouselCardWidth },
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
                    <Text style={styles.testimonialComment}>{`"${item.comment}"`}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        }
        ListFooterComponent={
          <LinearGradient
            colors={['#020617', '#0c172a', '#111c30']}
            style={[
              styles.footerContainer,
              isMobile && styles.footerContainerMobile,
              isMobile && { paddingHorizontal: sectionInlinePadding, paddingBottom: 48 }
            ]}
          >
            <View style={[styles.footerTopSection, !isMobile && { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }]}>
              <View style={[styles.footerBrandSection, !isMobile && { maxWidth: '50%' }]}>
                <Text style={styles.footerBrandName}>EstatePerks</Text>
                <Text style={styles.footerTagline}>
                  Discover premium residential properties across India&apos;s top cities. Your journey to a dream home starts here.
                </Text>
                <View style={[styles.trustRow, isCompactMobile && styles.trustRowCompact]}>
                  <View style={styles.trustItem}><Text style={styles.trustValue}>20k+</Text><Text style={styles.trustLabel}>Families</Text></View>
                  {!isCompactMobile && <View style={styles.trustDivider} />}
                  <View style={styles.trustItem}><Text style={styles.trustValue}>500+</Text><Text style={styles.trustLabel}>Builders</Text></View>
                  {!isCompactMobile && <View style={styles.trustDivider} />}
                  <View style={styles.trustItem}><Text style={styles.trustValue}>15+</Text><Text style={styles.trustLabel}>Cities</Text></View>
                </View>
              </View>

              <View style={[styles.newsletterCard, isMobile && styles.newsletterMobile]}>
                <Text style={styles.newsletterTitle}>Stay Updated</Text>
                <Text style={styles.newsletterSubtext}>Subscribe to get the latest property alerts.</Text>
                {isSubscribed ? (
                  <Animated.View entering={FadeInDown} style={styles.subscribeSuccess}>
                    <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                    <Text style={styles.subscribeSuccessText}>Subscribed successfully!</Text>
                  </Animated.View>
                ) : (
                  <View style={[styles.newsletterInputRow, isCompactMobile && styles.newsletterInputRowCompact]}>
                    <TextInput
                      style={styles.newsletterInput}
                      placeholder="Email Address"
                      placeholderTextColor="#64748b"
                      value={newsletterEmail}
                      onChangeText={setNewsletterEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                    <TouchableOpacity
                      style={[
                        styles.newsletterBtn,
                        isCompactMobile && styles.newsletterBtnCompact,
                        isSubscribing && styles.newsletterBtnDisabled
                      ]}
                      onPress={handleSubscribe}
                      disabled={isSubscribing}
                    >
                      <Text style={styles.newsletterBtnText}>{isSubscribing ? 'Subscribing...' : 'Subscribe'}</Text>
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

            <View style={[styles.footerGrid, isCompactMobile && styles.footerGridCompact]}>
              <View style={[styles.footerColumn, isMobile ? styles.footerColumnMobile : { width: isLargeScreen ? '23%' : '48%' }]}>
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

              <View style={[styles.footerColumn, isMobile ? styles.footerColumnMobile : { width: isLargeScreen ? '23%' : '48%' }]}>
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

              <View style={[styles.footerColumn, isMobile ? styles.footerColumnMobile : { width: isLargeScreen ? '23%' : '48%' }]}>
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

              <View style={[styles.footerColumn, isMobile ? styles.footerColumnMobile : { width: isLargeScreen ? '23%' : '48%' }]}>
                <Text style={styles.footerSectionTitle}>Download App</Text>
                <Pressable
                  onPress={() => handleOpenExternalLink(APP_STORE_URL)}
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
                  onPress={() => handleOpenExternalLink(GOOGLE_PLAY_URL)}
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

            <View style={[styles.socialRow, isCompactMobile && styles.socialRowCompact]}>
              {[
                { icon: 'logo-facebook', url: '' },
                { icon: 'logo-twitter', url: '' },
                { icon: 'logo-instagram', url: '' },
                { icon: 'logo-linkedin', url: 'https://linkedin.com/in/souravchowdhury-2003r' },
                { icon: 'logo-github', url: 'https://github.com/sourav81R' },
                { icon: 'globe-outline', url: 'https://portfolio-topaz-eight-91.vercel.app' },
              ].map(({ icon, url }) => (
                <Pressable
                  key={icon}
                  onPress={url ? () => handleOpenExternalLink(url) : undefined}
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
          isCompactMobile && styles.floatingChatBtnCompact,
          isMobile && { right: pageGutter, bottom: isCompactMobile ? 16 : 22 },
          hovered && Platform.OS === 'web' && styles.floatingChatBtnHover
        ]}
        onPress={() => setIsChatVisible(true)}
      >
        <Ionicons name="chatbubbles" size={isCompactMobile ? 24 : 28} color="#020617" />
      </Pressable>

      {comparePropertyIds.length > 0 && (
        <View style={[styles.compareTray, isMobile && styles.compareTrayMobile]}>
          <View>
            <Text style={styles.compareTrayTitle}>Compare Shortlist</Text>
            <Text style={styles.compareTraySubtitle}>{comparePropertyIds.length}/{MAX_COMPARE_PROPERTIES} selected</Text>
          </View>
          <TouchableOpacity
            style={[styles.compareTrayBtn, comparePropertyIds.length < 2 && styles.compareTrayBtnDisabled]}
            disabled={comparePropertyIds.length < 2}
            onPress={() => setIsCompareModalVisible(true)}
          >
            <Text style={styles.compareTrayBtnText}>Compare</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={isCompareModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isCompactMobile && styles.modalContentCompact, { maxWidth: modalMaxWidth, maxHeight: modalMaxHeight }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderInfo}>
                <Ionicons name="git-compare" size={24} color="#22d3ee" />
                <Text style={styles.modalTitle}>Compare Properties</Text>
              </View>
              <TouchableOpacity onPress={() => setIsCompareModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {compareProperties.length === 0 ? (
                <Text style={styles.aboutText}>No properties selected for comparison.</Text>
              ) : (
                compareProperties.map((property: any) => (
                  <View key={property.id} style={styles.compareCard}>
                    <View style={styles.compareCardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.compareName}>{property.name}</Text>
                        <Text style={styles.compareLocation}>{property.location}</Text>
                      </View>
                      <TouchableOpacity onPress={() => toggleCompareProperty(property.id)}>
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.compareMetrics}>
                      <Text style={styles.compareMetric}>Price: {property.price}</Text>
                      <Text style={styles.compareMetric}>Beds/Baths: {property.beds} / {property.baths}</Text>
                      <Text style={styles.compareMetric}>Area: {property.sqft} sqft</Text>
                      <Text style={styles.compareMetric}>Status: {property.status}</Text>
                      <Text style={styles.compareMetric}>Estimated EMI: {formatCurrencyShort(calculateMonthlyEmi(parsePrice(property.price)))}/mo</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setIsCompareModalVisible(false)}>
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Support Chat Modal */}
      <Modal visible={isChatVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, isCompactMobile && styles.modalContentCompact, { height: chatModalHeight, maxWidth: modalMaxWidth, maxHeight: modalMaxHeight }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderInfo}>
                <Ionicons name="headset" size={24} color="#22d3ee" />
                <Text style={styles.modalTitle}>Support Chat</Text>
                <View style={styles.onlineIndicator} />
              </View>
              <TouchableOpacity onPress={() => setIsChatVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView
              ref={chatScrollRef}
              style={{ flex: 1 }}
              contentContainerStyle={{ gap: 12, paddingBottom: 20 }}
              keyboardShouldPersistTaps="handled"
            >
              {chatMessages.map(msg => (
                <View key={msg.id} style={[styles.chatBubble, msg.sender === 'user' ? styles.userBubble : styles.aiBubble]}>
                  <Text style={[styles.chatText, msg.sender === 'user' ? styles.userChatText : styles.aiChatText]}>{msg.text}</Text>
                </View>
              ))}
              {isChatResponding ? (
                <View style={[styles.chatBubble, styles.aiBubble, styles.typingBubble]}>
                  <Text style={[styles.chatText, styles.aiChatText, styles.typingText]}>Thinking...</Text>
                </View>
              ) : null}
            </ScrollView>
            {chatStatusMessage ? (
              <Text style={styles.chatStatusText}>{chatStatusMessage}</Text>
            ) : null}

            <View style={styles.quickReplyContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {QUICK_REPLIES.map((reply, index) => (
                  <Pressable
                    key={index}
                    style={({ hovered }) => [
                      styles.quickReplyChip,
                      isChatResponding && styles.quickReplyChipDisabled,
                      hovered && Platform.OS === 'web' && !isChatResponding && styles.chipHover
                    ]}
                    disabled={isChatResponding}
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
                editable={!isChatResponding}
                onSubmitEditing={() => handleSendMessage()}
              />
              <TouchableOpacity
                style={[styles.chatSendBtn, (isChatResponding || !chatInput.trim()) && styles.chatSendBtnDisabled]}
                onPress={() => handleSendMessage()}
                disabled={isChatResponding || !chatInput.trim()}
              >
                <Ionicons name={isChatResponding ? "time-outline" : "send"} size={20} color="#020617" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* About Us Modal */}
      <Modal visible={isAboutModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isCompactMobile && styles.modalContentCompact, { maxWidth: modalMaxWidth, maxHeight: modalMaxHeight }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderInfo}>
                <Ionicons name="information-circle" size={24} color="#22d3ee" />
                <Text style={styles.modalTitle}>About EstatePerks</Text>
              </View>
              <TouchableOpacity onPress={() => setIsAboutModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={styles.aboutText}>
                EstatePerks is a premium real estate platform dedicated to helping you find your dream home across India&apos;s top cities.
              </Text>
              <Text style={[styles.aboutText, { marginTop: 12 }]}>
                We combine cutting-edge technology like 360 virtual tours and AI-powered investment scores with a human-centric approach to provide a seamless property search experience.
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
          <View style={[styles.modalContent, isCompactMobile && styles.modalContentCompact, { maxWidth: modalMaxWidth, maxHeight: modalMaxHeight }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderInfo}>
                <Ionicons name="briefcase" size={24} color="#22d3ee" />
                <Text style={styles.modalTitle}>Careers at EstatePerks</Text>
              </View>
              <TouchableOpacity onPress={() => setIsCareersModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.aboutText}>
                Join our mission to revolutionize the real estate industry. We&apos;re looking for passionate individuals to join our growing team.
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
          <View style={[styles.modalContent, isCompactMobile && styles.modalContentCompact, { maxWidth: modalMaxWidth, maxHeight: modalMaxHeight }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderInfo}>
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
          <View style={[styles.modalContent, isCompactMobile && styles.modalContentCompact, { maxWidth: modalMaxWidth, maxHeight: modalMaxHeight }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderInfo}>
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
    alignItems: 'stretch',
    width: '100%',
    minWidth: 0,
  },
  listViewport: {
    width: '100%',
  },
  list: {
    width: '100%',
    minWidth: 0,
  },
  listMobile: {
    width: '100%',
    minWidth: 0,
  },
  listLarge: {
    maxWidth: 1360,
    alignSelf: 'center',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: 24,
  },
  header: { marginBottom: 30, width: '100%', minWidth: 0 },
  headerMobile: { marginBottom: 18 },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    minWidth: 0,
    backgroundColor: '#0b1423',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1f2d45',
    padding: 22,
    gap: 18,
  },
  headerTopMobile: {
    gap: 14,
    borderRadius: 18,
    padding: 14,
  },
  heroTextBlock: {
    width: '100%',
    minWidth: 0,
  },
  heroTextBlockDesktop: {
    width: '66%',
  },
  heroTextBlockLarge: {
    flex: 1,
    width: 'auto',
  },
  heroInsightsPanel: {
    width: 320,
    backgroundColor: '#09101d',
    borderWidth: 1,
    borderColor: '#1f2d45',
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  heroInsightsTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800',
  },
  heroInsightsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroInsightsIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(34, 211, 238, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroInsightsText: {
    color: '#cbd5e1',
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  heroStatsGrid: {
    marginTop: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  heroStatCard: {
    width: '31.5%',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#23314a',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  heroStatValue: {
    color: '#22d3ee',
    fontSize: 15,
    fontWeight: '800',
  },
  heroStatLabel: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 2,
  },
  clearButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  clearButtonText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
  },
  clearButtonMobile: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  welcome: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1.2,
    flexShrink: 1,
    minWidth: 0,
  },
  welcomeMobile: { fontSize: 28, lineHeight: 34 },
  highlight: {
    color: '#fbbf24',
    textShadowColor: 'rgba(251, 191, 36, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  subtitle: { color: '#a9b8cb', fontSize: 17, marginTop: 6, flexShrink: 1, minWidth: 0, lineHeight: 25 },
  subtitleMobile: { fontSize: 14 },
  marketPulse: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 211, 238, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    marginTop: 18,
    alignSelf: 'flex-start',
    maxWidth: '100%',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.2)',
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
    flexShrink: 1,
  },
  heroCTAContainer: {
    marginTop: 22,
    gap: 14,
    width: '100%',
  },
  heroCTAText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  heroCTAButtons: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    width: '100%',
  },
  heroCTAButton: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#111c30',
    borderWidth: 1,
    borderColor: '#2b3d5c',
    minWidth: 0,
  },
  heroCTAButtonMobile: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  heroCTAButtonCompact: {
    flexGrow: 1,
    flexBasis: '48%',
    alignItems: 'center',
  },
  heroCTAButtonXs: {
    flexBasis: '100%',
  },
  heroCTAButtonActive: {
    backgroundColor: '#22d3ee',
    borderColor: '#22d3ee',
  },
  heroCTAButtonText: {
    color: '#c0ccdd',
    fontWeight: '700',
    fontSize: 14,
  },
  heroCTAButtonTextMobile: {
    fontSize: 13,
  },
  heroCTAButtonTextActive: {
    color: '#020617',
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 22,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#25344f',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 14,
    elevation: 8,
    overflow: 'hidden',
    minWidth: 0,
    width: '100%',
  },
  cardSingleColumn: {
    width: '100%',
  },
  cardMobile: {
    marginBottom: 16,
    borderRadius: 16,
  },
  cardHover: {
    transform: [{ translateY: -8 }],
    borderColor: '#22d3ee',
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  cardSaved: {
    borderColor: '#f43f5e',
  },
  cardIconButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  saveIconButton: {
    backgroundColor: 'rgba(2, 6, 23, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
  },
  saveIconButtonActive: {
    borderColor: 'rgba(244, 63, 94, 0.6)',
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
  },
  image: { width: '100%', height: 200 },
  info: { padding: 16, minWidth: 0 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minWidth: 0 },
  name: { fontSize: 19, fontWeight: '800', color: '#fff', flex: 1, marginRight: 8, minWidth: 0 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, minWidth: 0 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(251, 191, 36, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ratingText: { color: '#fbbf24', fontWeight: 'bold', fontSize: 12 },
  location: { color: '#b4c0d2', fontSize: 13, flex: 1, minWidth: 0 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, minWidth: 0 },
  price: { fontSize: 18, fontWeight: 'bold', color: '#22d3ee', flexShrink: 1 },
  sqft: { color: '#8ea0b8', fontSize: 14 },
  metaRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  metaText: {
    color: '#b4c0d2',
    fontSize: 11,
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0b1423',
    borderRadius: 18,
    paddingHorizontal: 14,
    marginTop: 20,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#1f2d45',
    minWidth: 0,
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(10px)' } as any) : {}),
  },
  searchContainerMobile: {
    marginTop: 16,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    height: 52,
    color: '#fff',
    fontSize: 15,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  aiSearchBtn: {
    backgroundColor: '#22d3ee',
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  trendingSection: {
    marginTop: 24,
    backgroundColor: '#0b1423',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1f2d45',
    paddingVertical: 16,
  },
  trendingScroll: {
    paddingRight: 20,
    paddingBottom: 4,
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
    backgroundColor: '#111c30',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2b3d5c',
    marginBottom: 8,
  },
  localityName: {
    color: '#c0ccdd',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    minWidth: 0,
    flexWrap: 'wrap',
  },
  cardActionsStack: {
    flexDirection: 'column',
  },
  actionBtnStack: {
    width: '100%',
    flexBasis: '100%',
  },
  mobileActionButton: {
    paddingVertical: 8,
  },
  viewDetailsBtn: {
    flex: 1,
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.3)',
    minWidth: 0,
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
    minWidth: 0,
  },
  virtualTourBtnText: {
    color: '#22d3ee',
    fontWeight: '700',
    fontSize: 14,
  },
  compareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
    borderRadius: 10,
    paddingVertical: 10,
    minWidth: 0,
  },
  compareBtnText: {
    color: '#fbbf24',
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
    marginTop: 4,
  },
  cityFilterContent: {
    paddingRight: 12,
  },
  discoveryPanel: {
    marginTop: 24,
    backgroundColor: '#0b1423',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1f2d45',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  cityChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#111c30',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#2b3d5c',
    ...(Platform.OS === 'web' ? { transitionProperty: 'all', transitionDuration: '0.2s' } : {}),
  },
  chipHover: {
    backgroundColor: '#17243b',
    borderColor: '#3a4f72',
  },
  cityChipActive: {
    backgroundColor: '#22d3ee',
    borderColor: '#22d3ee',
  },
  cityChipText: {
    color: '#c0ccdd',
    fontSize: 13,
    fontWeight: '600',
  },
  cityChipTextActive: {
    color: '#020617',
  },
  filterSection: {
    marginTop: 16,
  },
  filterLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 10,
    marginLeft: 4,
    minWidth: 0,
  },
  filterContent: {
    paddingRight: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#111c30',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#2b3d5c',
  },
  filterChipActive: {
    borderColor: '#22d3ee',
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
  },
  filterChipText: {
    color: '#c0ccdd',
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#22d3ee',
  },
  sortSection: {
    marginTop: 16,
  },
  sortLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 10,
    marginLeft: 4,
    minWidth: 0,
  },
  sortContent: {
    paddingRight: 12,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#111c30',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#2b3d5c',
  },
  sortChipActive: {
    borderColor: '#22d3ee',
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
  },
  sortChipText: {
    color: '#c0ccdd',
    fontSize: 12,
    fontWeight: '600',
  },
  sortChipTextActive: {
    color: '#22d3ee',
  },
  resultsStrip: {
    marginTop: 18,
    backgroundColor: '#101b2f',
    borderWidth: 1,
    borderColor: '#2b3d5c',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  resultsStripCompact: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  resultsStripTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  resultsStripTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '800',
  },
  resultsStripSubtitle: {
    marginTop: 3,
    color: '#b4c0d2',
    fontSize: 12,
  },
  resultsStripBtn: {
    backgroundColor: '#22d3ee',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  resultsStripBtnCompact: {
    width: '100%',
    alignItems: 'center',
  },
  resultsStripBtnText: {
    color: '#04121f',
    fontWeight: '800',
    fontSize: 12,
  },
  insightsSection: {
    marginTop: 24,
    backgroundColor: '#0b1423',
    borderWidth: 1,
    borderColor: '#1f2d45',
    borderRadius: 20,
    padding: 16,
  },
  insightsTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  insightsGridCompact: {
    gap: 8,
  },
  insightCard: {
    backgroundColor: '#111c30',
    borderWidth: 1,
    borderColor: '#2b3d5c',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: '48%',
  },
  insightLabel: {
    color: '#64748b',
    fontSize: 11,
    marginBottom: 4,
  },
  insightValue: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '700',
  },
  featuredSection: {
    marginTop: 24,
    backgroundColor: '#0b1423',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1f2d45',
    paddingVertical: 16,
  },
  featuredSectionMobile: {
    marginTop: 18,
    borderRadius: 16,
    paddingVertical: 12,
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    marginLeft: 4,
    minWidth: 0,
  },
  featuredContent: {
    paddingRight: 20,
  },
  featuredCard: {
    height: 180,
    borderRadius: 20,
    marginRight: 16,
    overflow: 'hidden',
    backgroundColor: '#111c30',
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
    borderTopColor: '#2b3d5c',
    width: '100%',
    minWidth: 0,
  },
  footerContainerMobile: {
    marginTop: 40,
    paddingTop: 40,
    paddingBottom: 36,
  },
  footerTopSection: {
    marginBottom: 60,
    gap: 20,
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
  trustRowCompact: {
    flexWrap: 'wrap',
    gap: 12,
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
    backgroundColor: 'rgba(17, 28, 48, 0.55)',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.28)',
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
  newsletterInputRowCompact: {
    flexDirection: 'column',
    gap: 10,
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
  newsletterBtnDisabled: {
    opacity: 0.7,
  },
  newsletterBtnCompact: {
    width: '100%',
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
    color: '#b4c0d2',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2b3d5c',
    backgroundColor: 'rgba(17, 28, 48, 0.6)',
    ...(Platform.OS === 'web' ? { transitionProperty: 'all', transitionDuration: '0.2s' } : {}),
  },
  footerGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 24,
    width: '100%',
  },
  footerGridCompact: {
    gap: 16,
  },
  footerColumn: {
    minWidth: 0,
  },
  footerSectionTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 16,
  },
  footerLink: {
    color: '#b4c0d2',
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
    color: '#b4c0d2',
    fontSize: 13,
  },
  socialRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 30,
  },
  socialRowCompact: {
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  socialIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#111c30',
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
    marginTop: 26,
    marginBottom: 8,
    backgroundColor: '#0b1423',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1f2d45',
    paddingVertical: 16,
  },
  testimonialsSectionMobile: {
    marginTop: 18,
    borderRadius: 16,
    paddingVertical: 12,
  },
  testimonialsContent: {
    paddingRight: 20,
    paddingBottom: 10,
  },
  testimonialCard: {
    backgroundColor: '#101b2f',
    borderRadius: 20,
    padding: 20,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#2b3d5c',
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
    color: '#8ea0b8',
    fontSize: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 10,
  },
  testimonialComment: {
    color: '#b4c0d2',
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
  floatingChatBtnCompact: {
    width: 52,
    height: 52,
    borderRadius: 26,
    right: 14,
    bottom: 18,
  },
  floatingChatBtnHover: {
    transform: [{ scale: 1.1 }],
    backgroundColor: '#67e8f9',
  },
  compareTray: {
    position: 'absolute',
    left: 16,
    right: 96,
    bottom: 26,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 99,
  },
  compareTrayMobile: {
    left: 12,
    right: 76,
    bottom: 16,
  },
  compareTrayTitle: {
    color: '#e2e8f0',
    fontWeight: '700',
    fontSize: 13,
  },
  compareTraySubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  compareTrayBtn: {
    backgroundColor: '#22d3ee',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  compareTrayBtnDisabled: {
    backgroundColor: '#334155',
  },
  compareTrayBtnText: {
    color: '#020617',
    fontWeight: '800',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#111c30',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: '#2b3d5c',
    minWidth: 0,
  },
  modalContentCompact: {
    padding: 18,
    borderRadius: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
    minWidth: 0,
  },
  modalHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '800', flexShrink: 1 },
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
  typingBubble: { borderColor: '#334155', borderWidth: 1 },
  typingText: { fontStyle: 'italic' },
  chatText: { fontSize: 14, lineHeight: 20 },
  aiChatText: { color: '#e2e8f0' },
  userChatText: { color: '#020617', fontWeight: '500' },
  chatStatusText: { color: '#fbbf24', fontSize: 12, marginBottom: 10 },
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
  quickReplyChipDisabled: {
    opacity: 0.55,
  },
  quickReplyText: {
    color: '#22d3ee',
    fontSize: 12,
    fontWeight: '600',
  },
  chatInputContainer: { flexDirection: 'row', gap: 10, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#1e293b', minWidth: 0, alignItems: 'center' },
  chatInput: {
    flex: 1,
    backgroundColor: '#020617',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
    minWidth: 0,
  },
  chatSendBtn: {
    backgroundColor: '#22d3ee',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center'
  },
  chatSendBtnDisabled: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
  },
  aboutText: {
    color: '#cbd5e1',
    fontSize: 15,
    lineHeight: 24,
  },
  compareCard: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#2b3d5c',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  compareCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  compareName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  compareLocation: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  compareMetrics: {
    marginTop: 10,
    gap: 5,
  },
  compareMetric: {
    color: '#cbd5e1',
    fontSize: 13,
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
  // =================== RESPONSIVE ===================
  headerStack: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 12,
    width: '100%',
  },
  welcomeSmall: {
    fontSize: 21,
    lineHeight: 27,
  },
  welcomeXs: {
    fontSize: 20,
    lineHeight: 26,
  },
  subtitleSmall: {
    fontSize: 13,
  },
  subtitleXs: {
    fontSize: 12,
  },
  ctaWrap: {
    flexWrap: 'wrap',
    gap: 8,
  },
  cardCompact: {
    borderRadius: 14,
    marginBottom: 14,
  },
  imageCompact: {
    height: 160,
  },
  footerColumnMobile: {
    width: '100%',
    marginBottom: 20,
  },
  newsletterMobile: {
    padding: 16,
    width: '100%',
  },
  infoMobile: {
    padding: 12,
  },
  nameMobile: {
    fontSize: 16,
  },
  priceMobile: {
    fontSize: 16,
  },
});


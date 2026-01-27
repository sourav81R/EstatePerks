import React, { useState, useEffect, useRef } from 'react';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

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
  Pressable,
} from 'react-native';

import { useLocalSearchParams, useRouter, useRootNavigationState } from 'expo-router';
import { Image } from 'expo-image';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import Animated, { 
  FadeInUp, 
  FadeInDown, 
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
  icon: SFSymbol;
  label: string;
}

/* ---------------- MOCK DATA ---------------- */

const PROPERTIES_DATA: Record<string, any> = {
  '1': {
    name: 'Modern Luxury Loft',
    location: 'Downtown Los Angeles, CA',
    price: '₹ 1.25 Cr',
    description:
      'This stunning modern loft features floor-to-ceiling windows, premium hardwood floors, and a state-of-the-art kitchen. Located in the heart of the city, it offers unparalleled views and access to the best amenities.',
    type: 'Apartment',
    beds: 3,
    baths: 2,
    sqft: '2,400',
    status: 'Premium',
    builder: 'Skyline Developers',
    reraId: 'RERA/LA/2024/001',
    possession: 'Ready to Move',
    image:
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
    features: [
      { icon: 'wifi', label: 'High-speed Wifi' },
      { icon: 'car.fill', label: 'Parking Space' },
      { icon: 'leaf.fill', label: 'Private Garden' },
      { icon: 'shield.checkerboard', label: '24/7 Security' },
    ],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    priceHistory: [
      { month: 'Jan', value: 1.10 },
      { month: 'Feb', value: 1.15 },
      { month: 'Mar', value: 1.12 },
      { month: 'Apr', value: 1.20 },
      { month: 'May', value: 1.25 },
    ],
  },
  '2': {
    name: 'Sunset Villa',
    location: 'Malibu, California',
    price: '₹ 2.10 Cr',
    description:
      'Luxury villa with ocean views, private pool, and premium interiors.',
    type: 'Villa',
    beds: 4,
    baths: 3,
    sqft: '3,800',
    status: 'New Listing',
    builder: 'Oceanic Group',
    reraId: 'RERA/CA/2024/992',
    possession: 'Dec 2025',
    image:
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750',
    features: [
      { icon: 'sun.max.fill', label: 'Ocean View' },
      { icon: 'drop.fill', label: 'Infinity Pool' },
      { icon: 'bolt.fill', label: 'EV Charging' },
      { icon: 'wineglass.fill', label: 'Wine Cellar' },
    ],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    priceHistory: [
      { month: 'Jan', value: 1.90 },
      { month: 'Feb', value: 1.95 },
      { month: 'Mar', value: 2.05 },
      { month: 'Apr', value: 2.00 },
      { month: 'May', value: 2.10 },
    ],
  },
  '3': {
    name: 'Green Residency',
    location: 'Kolkata, West Bengal',
    price: '₹ 45 Lakhs',
    description:
      'Beautifully designed residency in the heart of Kolkata. Perfect for families looking for a peaceful yet connected lifestyle with traditional charm.',
    type: 'Apartment',
    beds: 1,
    baths: 1,
    sqft: '850',
    status: 'Verified',
    builder: 'Heritage Homes',
    reraId: 'WBRERA/2023/10045',
    possession: 'Ready to Move',
    image:
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb',
    coordinates: { latitude: 22.5726, longitude: 88.3639 },
    features: [
      { icon: 'cpu', label: 'Smart Home' },
      { icon: 'train.side.front.car', label: 'Near Subway' },
      { icon: 'bicycle', label: 'Bike Storage' },
      { icon: 'hammer.fill', label: 'Newly Renovated' },
    ],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    priceHistory: [
      { month: 'Jan', value: 40 },
      { month: 'Feb', value: 42 },
      { month: 'Mar', value: 41 },
      { month: 'Apr', value: 44 },
      { month: 'May', value: 45 },
    ],
  },
  '4': {
    name: 'Goa Palms Villa',
    location: 'North Goa, India',
    price: '₹ 1.80 Cr',
    description: 'A serene villa located near the beaches of North Goa, featuring private access and lush tropical surroundings.',
    type: 'Villa',
    beds: 3,
    baths: 3,
    sqft: '2,200',
    status: 'Hot Deal',
    builder: 'Coastal Realty',
    reraId: 'GOARERA/2024/551',
    possession: 'June 2026',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750',
    coordinates: { latitude: 15.2993, longitude: 73.9815 },
    features: [
      { icon: 'sun.max.fill', label: 'Beach Access' },
      { icon: 'drop.fill', label: 'Private Pool' },
    ],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    priceHistory: [
      { month: 'Jan', value: 1.60 },
      { month: 'Feb', value: 1.65 },
      { month: 'Mar', value: 1.70 },
      { month: 'Apr', value: 1.75 },
      { month: 'May', value: 1.80 },
    ],
  },
};

const parsePrice = (priceStr: string) => {
  const num = parseFloat(priceStr.replace(/[^\d.]/g, ''));
  if (priceStr.includes('Cr')) return num * 10000000;
  if (priceStr.includes('Lakhs')) return num * 100000;
  return num;
};

/* ---------------- SCREEN ---------------- */

export default function PropertyDetails() {
  const params = useLocalSearchParams();
  const propertyId = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const { addVisit } = useVisit();

  const [viewMode, setViewMode] = useState<'image' | '3d' | 'video'>('image');
  const [isFavorited, setIsFavorited] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [progressBarWidth, setProgressBarWidth] = useState(0);

  // Pulse Animation for Virtual Tour Label
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    if (viewMode === 'video') {
      pulseOpacity.value = withRepeat(
        withTiming(0.4, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      pulseOpacity.value = 1;
    }
  }, [viewMode]);

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  // Mortgage Calculator State
  const [isMortgageVisible, setIsMortgageVisible] = useState(false);
  const [downPayment, setDownPayment] = useState('20');
  const [interestRate, setInterestRate] = useState('8.5');
  const [loanTerm, setLoanTerm] = useState('20');

  // Comparison State
  const [isCompareVisible, setIsCompareVisible] = useState(false);
  const [compareWithId, setCompareWithId] = useState<string | null>(null);

  const lastTapRef = useRef<{ time: number; side: 'left' | 'right' | null }>({ time: 0, side: null });

  const property =
    (propertyId && PROPERTIES_DATA[propertyId]) ||
    PROPERTIES_DATA['1'];

  const similarProperties = Object.keys(PROPERTIES_DATA)
    .filter((key) => key !== propertyId)
    .map((key) => ({ id: key, ...PROPERTIES_DATA[key] }));

  const player = useVideoPlayer({ uri: property.videoUrl }, (p) => {
    p.loop = true;
    p.muted = isMuted;
    p.playbackRate = playbackSpeed;
  });

  const [isBuffering, setIsBuffering] = useState(player.status === 'loading');
  const [hasError, setHasError] = useState(player.status === 'error');
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(player.playing);

  useEffect(() => {
    const interval = setInterval(() => {
      if (player.duration > 0) {
        setProgress(player.currentTime / player.duration);
      }
    }, 500);

    const statusSub = player.addListener('statusChange', ({ status }) => {
      setIsBuffering(status === 'loading');
      setHasError(status === 'error');
    });
    const playingSub = player.addListener('playingChange', ({ isPlaying }) => {
      setIsPlaying(isPlaying);
    });
    const bufferSub = player.addListener('bufferingChange', ({ isBuffering }) => {
      setIsBuffering(isBuffering);
    });
    return () => {
      clearInterval(interval);
      statusSub.remove();
      playingSub.remove();
      bufferSub.remove();
    };
  }, [player]);

  const togglePlay = () => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  };

  useEffect(() => {
    player.playbackRate = playbackSpeed;
  }, [playbackSpeed, player]);

  const skipForward = () => {
    player.currentTime = Math.min(player.duration, player.currentTime + 10);
  };

  const skipBackward = () => {
    player.currentTime = Math.max(0, player.currentTime - 10);
  };

  const handleDoubleTap = (side: 'left' | 'right') => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (lastTapRef.current.side === side && (now - lastTapRef.current.time) < DOUBLE_TAP_DELAY) {
      if (side === 'left') skipBackward();
      else skipForward();
      lastTapRef.current = { time: 0, side: null };
    } else {
      lastTapRef.current = { time: now, side };
    }
  };

  const toggleMute = () => {
    player.muted = !player.muted;
    setIsMuted(player.muted);
  };

  const togglePlaybackSpeed = () => {
    const speeds = [1, 1.5, 2, 0.5];
    const nextIndex = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIndex];
    setPlaybackSpeed(nextSpeed);
  };

  useEffect(() => {
    if (viewMode === 'video') {
      player.muted = isMuted;
      player.play();
    } else {
      player.pause();
    }
  }, [viewMode, player, isMuted]);

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

  const animated3DStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${rotation.value}deg` }],
  }));

  const calculateMortgage = () => {
    const dp = Math.max(0, Math.min(100, parseFloat(downPayment) || 0));
    const ir = Math.max(0, Math.min(20, parseFloat(interestRate) || 0));
    const lt = Math.max(1, Math.min(50, parseFloat(loanTerm) || 1));

    const principal = parsePrice(property.price) * (1 - dp / 100);
    const monthlyRate = ir / 100 / 12;
    const numberOfPayments = lt * 12;
    
    if (monthlyRate === 0) return (principal / numberOfPayments).toFixed(0);
    
    const monthlyPayment = 
      (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
      
    return isNaN(monthlyPayment) ? '0' : monthlyPayment.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  const handleShare = async () => {
    await Share.share({
      message: `Check out this property: ${property.name}`,
      url:
        Platform.OS === 'web'
          ? `https://estate-perks.vercel.app/property/${propertyId || '1'}`
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
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      Alert.alert('Error', 'Failed to generate brochure');
    }
  };

  /* ---------------- HEADER ---------------- */

  const headerImage = (
    <View style={styles.mediaContainer}>
      {viewMode === 'image' ? (
        <Image
          source={{ uri: property.image }}
          style={styles.mainImage}
          contentFit="cover"
        />
      ) : viewMode === 'video' ? (
        <View style={styles.mainImage}>
          <VideoView
            key={property.videoUrl}
            player={player}
            contentFit="cover"
            nativeControls={false}
            allowsFullscreen
            allowsPictureInPicture
            style={StyleSheet.absoluteFill}
          />
          {/* Double Tap Zones */}
          <View style={[StyleSheet.absoluteFill, { flexDirection: 'row' }]} pointerEvents="box-none">
            <Pressable 
              style={{ flex: 1 }} 
              onPress={() => handleDoubleTap('left')}
            />
            <Pressable 
              style={{ flex: 1 }} 
              onPress={() => handleDoubleTap('right')}
            />
          </View>

          {/* Virtual Tour Label */}
          <Animated.View style={[styles.virtualTourBadge, pulseAnimatedStyle]}>
            <Text style={styles.virtualTourText}>Virtual Tour</Text>
          </Animated.View>

          {/* Central Play/Pause Button */}
          {!isBuffering && !hasError && (
            <View style={styles.centralControlContainer} pointerEvents="box-none">
              <TouchableOpacity 
                style={styles.centralControlButton} 
                onPress={togglePlay}
                activeOpacity={0.8}
              >
                <SymbolView 
                  name={isPlaying ? "pause.fill" : "play.fill"} 
                  size={32} 
                  tintColor="#fff" 
                />
              </TouchableOpacity>
            </View>
          )}

          {isBuffering && (
            <View style={styles.videoLoader}>
              <ActivityIndicator size="large" color="#22d3ee" />
            </View>
          )}
          {hasError && (
            <View style={styles.videoErrorOverlay}>
              <SymbolView name="exclamationmark.triangle.fill" size={32} tintColor="#ef4444" />
              <Text style={styles.videoErrorText}>Failed to load virtual tour</Text>
              <TouchableOpacity 
                style={styles.retryButton} 
                onPress={() => player.play()}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.videoControlsOverlay}>
            <TouchableOpacity 
              style={styles.controlButton} 
              onPress={skipBackward}
            >
              <SymbolView name="gobackward.10" size={18} tintColor="#fff" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.controlButton} 
              onPress={togglePlay}
            >
              <SymbolView 
                name={isPlaying ? "pause.fill" : "play.fill"} 
                size={18} 
                tintColor="#fff" 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.controlButton} 
              onPress={skipForward}
            >
              <SymbolView name="goforward.10" size={18} tintColor="#fff" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.controlButton} 
              onPress={togglePlaybackSpeed}
            >
              <Text style={styles.speedText}>{playbackSpeed}x</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.controlButton} 
              onPress={() => player.presentFullscreen()}
            >
              <SymbolView name="arrow.up.left.and.arrow.down.right" size={18} tintColor="#fff" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.controlButton} 
              onPress={toggleMute}
            >
              <SymbolView 
                name={isMuted ? "speaker.slash.fill" : "speaker.wave.2.fill"} 
                size={18} 
                tintColor="#fff" 
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={styles.progressBarContainer}
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
        </View>
      ) : (
        <Animated.View style={[styles.placeholder3D, animated3DStyle]}>
          <Image
            source={{ uri: property.image }}
            style={styles.threeDImage}
            contentFit="cover"
          />
          <View style={styles.overlay3D}>
            <SymbolView name="arkit" size={28} tintColor="#22d3ee" />
            <Text style={styles.placeholderText}>Rotating 3D Preview</Text>
          </View>
        </Animated.View>
      )}

      {/* Back */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          if (navigationState?.key) router.back();
        }}
      >
        <SymbolView name="chevron.left" size={24} tintColor="#fff" />
      </TouchableOpacity>

      {/* Actions */}
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setIsFavorited(!isFavorited)}
        >
          <SymbolView
            name={isFavorited ? 'heart.fill' : 'heart'}
            size={22}
            tintColor={isFavorited ? '#ef4444' : '#fff'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleShare}
        >
          <SymbolView
            name="square.and.arrow.up"
            size={22}
            tintColor="#fff"
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
            player.play(); // Play on user gesture for better web support
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
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#020617', dark: '#020617' }}
      headerImage={headerImage}
    >
      <Animated.View entering={FadeInUp.delay(200)}>
        <View style={styles.headerInfo}>
          <View style={{ flex: 1, gap: 4 }}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{property.status}</Text>
            </View>
            <Text style={styles.title}>{property.name}</Text>
            <Text style={styles.location}>{property.location}</Text>
          </View>
          <Text style={styles.price}>{property.price}</Text>
        </View>

        <View style={styles.trustRow}>
          <View style={styles.trustItem}>
            <Text style={styles.trustLabel}>RERA ID</Text>
            <Text style={styles.trustValue}>{property.reraId}</Text>
          </View>
          <View style={styles.trustItem}>
            <Text style={styles.trustLabel}>Possession</Text>
            <Text style={styles.trustValue}>{property.possession}</Text>
          </View>
        </View>

        <View style={styles.specsRow}>
          <View style={styles.specItem}>
            <SymbolView name="bed.double.fill" size={18} tintColor="#94a3b8" />
            <Text style={styles.specText}>{property.beds} Beds</Text>
          </View>
          <View style={styles.specItem}>
            <SymbolView name="bathtub.fill" size={18} tintColor="#94a3b8" />
            <Text style={styles.specText}>{property.baths} Baths</Text>
          </View>
          <View style={styles.specItem}>
            <SymbolView name="square.split.bottomrightquarter.fill" size={18} tintColor="#94a3b8" />
            <Text style={styles.specText}>{property.sqft} sqft</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Key Features</Text>
        <View style={styles.featuresGrid}>
          {property.features.map((f: PropertyFeature, i: number) => (
            <View key={i} style={styles.featureItem}>
              <SymbolView name={f.icon} size={16} tintColor="#22d3ee" />
              <Text style={styles.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.description}>{property.description}</Text>

        <View style={styles.toolsRow}>
          <TouchableOpacity 
            style={styles.toolButton}
            onPress={() => setIsMortgageVisible(true)}
          >
            <SymbolView name="calculator.fill" size={18} tintColor="#22d3ee" />
            <Text style={styles.toolButtonText}>Mortgage Calc</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.toolButton}
            onPress={() => setIsCompareVisible(true)}
          >
            <SymbolView name="arrow.left.and.right.righttriangle.left.righttriangle.right.fill" size={18} tintColor="#22d3ee" />
            <Text style={styles.toolButtonText}>Compare</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.toolButton}
            onPress={handleDownloadBrochure}
          >
            <SymbolView name="doc.text.fill" size={18} tintColor="#22d3ee" />
            <Text style={styles.toolButtonText}>Brochure</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Price Trends</Text>
        <View style={styles.chartContainer}>
          <View style={styles.chartBars}>
            {(() => {
              const history = property.priceHistory || [];
              const maxVal = history.length > 0 ? Math.max(...history.map((d: any) => d.value)) : 1;
              return history.map((data: any, index: number) => {
              const height = (data.value / maxVal) * 100;
              return (
                <View key={index} style={styles.barWrapper}>
                  <View style={[styles.bar, { height: `${height}%` }]} />
                  <Text style={styles.barLabel}>{data.month}</Text>
                </View>
              );
              });
            })()}
          </View>
          <View style={styles.chartInfo}>
            <SymbolView name="arrow.up.right" size={14} tintColor="#22d3ee" />
            <Text style={styles.chartTrendText}>Market value increased by 8% in the last 5 months</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Listed By</Text>
        <View style={styles.agentCard}>
          <Image source={{ uri: 'https://i.pravatar.cc/150?u=agent' }} style={styles.agentImage} />
          <View style={styles.agentInfo}>
            <Text style={styles.agentName}>{property.builder}</Text>
            <Text style={styles.agentTitle}>Official Developer Partner</Text>
          </View>
          <TouchableOpacity style={styles.contactButton}>
            <SymbolView name="phone.fill" size={16} tintColor="#22d3ee" />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Location</Text>
        <TouchableOpacity 
          style={styles.locationPreview}
          onPress={() => {
            if (navigationState?.key) router.push('/explore');
          }}
        >
          <SymbolView name="mappin.and.ellipse" size={20} tintColor="#22d3ee" />
          <Text style={styles.locationPreviewText} numberOfLines={1}>{property.location}</Text>
          <Text style={styles.viewMapLink}>View Map</Text>
        </TouchableOpacity>

        {/* Schedule Visit (NO ERROR) */}
        <TouchableOpacity
          onPress={() => {
            // ✅ Call addVisit to update points in the global context
            addVisit({
              id: propertyId || '1',
              name: property.name,
              date: new Date().toISOString(),
            });

            if (Platform.OS === 'web') {
              alert('Visit Scheduled! +10 Reward Points 🎉');
            } else {
              Alert.alert(
                'Visit Scheduled',
                'You earned +10 reward points 🎉'
              );
            }
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

        <Text style={styles.sectionTitle}>Similar Properties</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.similarScroll}
        >
          {similarProperties.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.similarCard}
              onPress={() => {
                if (navigationState?.key) {
                  router.push(
                    { pathname: '/property/[id]', params: { id: item.id } } as any
                  );
                }
              }}
            >
              <Image
                source={{ uri: item.image }}
                style={styles.similarImage}
              />
              <View style={styles.similarInfo}>
                <Text style={styles.similarName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.similarPrice}>
                  {item.price}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Mortgage Calculator Modal */}
      <Modal visible={isMortgageVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Mortgage Estimator</Text>
              <TouchableOpacity onPress={() => setIsMortgageVisible(false)}>
                <SymbolView name="xmark.circle.fill" size={24} tintColor="#94a3b8" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.calcResultLabel}>Estimated Monthly Payment</Text>
            <Text style={styles.calcResultValue}>₹ {calculateMortgage()}</Text>

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
                <SymbolView name="xmark.circle.fill" size={24} tintColor="#94a3b8" />
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
                      <Text style={styles.compareValueCell}>{property[row.key]}</Text>
                      <Text style={styles.compareValueCell}>{compareWithId ? PROPERTIES_DATA[compareWithId][row.key] : '-'}</Text>
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
    </ParallaxScrollView>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  mediaContainer: { height: '100%', width: '100%' },
  mainImage: { width: '100%', height: '100%' },

  placeholder3D: {
    flex: 1,
    backgroundColor: '#020617',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  threeDImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  overlay3D: {
    position: 'absolute',
    bottom: 80,
    alignItems: 'center',
    gap: 10,
  },
  placeholderText: {
    color: '#22d3ee',
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 20,
  },
  headerActions: {
    position: 'absolute',
    top: 50,
    right: 20,
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 20,
  },
  videoControlsOverlay: {
    position: 'absolute',
    bottom: 110,
    right: 20,
    gap: 10,
  },
  controlButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedText: {
    color: '#22d3ee',
    fontSize: 11,
    fontWeight: '800',
  },
  progressBarContainer: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    right: 20,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#22d3ee',
  },
  videoLoader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  centralControlContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centralControlButton: {
    backgroundColor: 'rgba(34, 211, 238, 0.2)',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#22d3ee',
    shadowColor: '#22d3ee',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
  },
  virtualTourBadge: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.5)',
  },
  virtualTourText: {
    color: '#22d3ee',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  videoErrorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    gap: 12,
  },
  videoErrorText: {
    color: '#e5e7eb',
    fontSize: 14,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#22d3ee',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#020617',
    fontWeight: '700',
  },

  toggleContainer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 25,
    padding: 4,
  },
  toggleBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  activeToggle: { backgroundColor: '#22d3ee' },
  toggleText: { color: '#94a3b8', fontWeight: '600' },
  activeToggleText: { color: '#020617' },

  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusBadge: {
    backgroundColor: 'rgba(34, 211, 238, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.3)',
  },
  statusText: {
    color: '#22d3ee',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  location: { color: '#cbd5e1' },
  price: { fontSize: 24, fontWeight: '900', color: '#22d3ee' },

  trustRow: {
    flexDirection: 'row',
    gap: 24,
    marginVertical: 12,
  },
  trustLabel: { color: '#64748b', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  trustValue: { color: '#e2e8f0', fontSize: 13, fontWeight: '600' },

  specsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  specItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  specText: {
    color: '#e5e7eb',
    fontSize: 15,
    fontWeight: '600',
  },

  divider: {
    height: 1,
    backgroundColor: '#1e293b',
    marginVertical: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e5e7eb',
    marginBottom: 12,
  },

  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    gap: 8,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
  },
  featureLabel: { color: '#cbd5e1' },

  description: {
    color: '#94a3b8',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },

  toolsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  toolButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0f172a',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  toolButtonText: {
    color: '#e2e8f0',
    fontWeight: '600',
    fontSize: 14,
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
    maxWidth: 400,
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
  calcResultLabel: { color: '#94a3b8', textAlign: 'center', fontSize: 13 },
  calcResultValue: { color: '#22d3ee', textAlign: 'center', fontSize: 32, fontWeight: '900', marginVertical: 10 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { color: '#cbd5e1', fontSize: 14, marginBottom: 8, fontWeight: '600' },
  modalInput: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },

  compareSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#020617',
    borderRadius: 12,
    marginBottom: 10,
  },
  compareSelectImg: { width: 50, height: 50, borderRadius: 8 },
  compareSelectName: { color: '#fff', fontWeight: '600' },
  compareSelectPrice: { color: '#22d3ee', fontSize: 12 },
  compareTable: { marginTop: 10 },
  compareRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingVertical: 12,
  },
  compareCellHeader: { flex: 1, color: '#22d3ee', fontWeight: '800', fontSize: 12, textTransform: 'uppercase' },
  compareLabelCell: { flex: 1, color: '#94a3b8', fontWeight: '600', fontSize: 13 },
  compareValueCell: { flex: 1, color: '#fff', fontSize: 13, fontWeight: '500' },
  resetCompareBtn: {
    marginTop: 20,
    padding: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    borderRadius: 12,
  },
  resetCompareText: {
    color: '#22d3ee',
    fontWeight: '700',
  },

  chartContainer: {
    backgroundColor: '#0f172a',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 24,
  },
  chartBars: {
    flexDirection: 'row',
    height: 120,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: 10,
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 12,
    backgroundColor: '#22d3ee',
    borderRadius: 6,
  },
  barLabel: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 8,
  },
  chartInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 12,
    marginTop: 10,
  },
  chartTrendText: {
    color: '#22d3ee',
    fontSize: 13,
    fontWeight: '600',
  },

  agentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 24,
  },
  agentImage: { width: 48, height: 48, borderRadius: 24 },
  agentInfo: { flex: 1, marginLeft: 12 },
  agentName: { color: '#fff', fontWeight: '700', fontSize: 16 },
  agentTitle: { color: '#94a3b8', fontSize: 13 },
  contactButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  locationPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 12,
    marginBottom: 32,
  },
  locationPreviewText: {
    flex: 1,
    color: '#e5e7eb',
    fontSize: 14,
    fontWeight: '500',
  },
  viewMapLink: {
    color: '#22d3ee',
    fontSize: 13,
    fontWeight: '700',
  },

  bookButton: {
    backgroundColor: '#22d3ee',
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 40,
    ...Platform.select({
      ios: {
        shadowColor: '#22d3ee',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0px 8px 12px rgba(34, 211, 238, 0.4)',
      },
    }),
  },
  bookButtonText: {
    color: '#020617',
    fontSize: 16,
    fontWeight: '800',
  },

  similarScroll: { gap: 16, paddingBottom: 20 },
  similarCard: {
    width: 200,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  similarImage: { width: '100%', height: 120 },
  similarInfo: { padding: 12 },
  similarName: {
    color: '#e5e7eb',
    fontSize: 14,
    fontWeight: '700',
  },
  similarPrice: {
    color: '#22d3ee',
    fontSize: 13,
    fontWeight: '800',
  },
});

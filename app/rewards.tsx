import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  FlatList,
  useWindowDimensions,
  DimensionValue,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useVisit } from '../context/VisitContext';

/* ---------------- MOCK DATA ---------------- */

const EARN_OPTIONS = [
  { id: '1', title: 'Site Visit', points: '+500', icon: 'location', color: '#22d3ee' },
  { id: '2', title: 'Refer a Friend', points: '+2000', icon: 'people', color: '#818cf8' },
  { id: '3', title: 'Write a Review', points: '+200', icon: 'star', color: '#fbbf24' },
  { id: '4', title: 'Complete Profile', points: '+150', icon: 'person-add', color: '#10b981' },
];

const REDEEM_OPTIONS = [
  { id: '1', title: 'Amazon Voucher', cost: '2000 pts', brand: 'Amazon', image: 'https://img.icons8.com/color/480/amazon-pay.png' },
  { id: '2', title: 'Home Cleaning', cost: '1500 pts', brand: 'Urban Company', image: 'https://img.icons8.com/color/480/cleaning-service.png' },
  { id: '3', title: 'Interior Consult', cost: '3000 pts', brand: 'Livspace', image: 'https://img.icons8.com/color/480/interior-design.png' },
  { id: '4', title: 'Free Moving', cost: '5000 pts', brand: 'Packers & Movers', image: 'https://img.icons8.com/color/480/truck.png' },
];

const TRANSACTIONS = [
  { id: '1', title: 'Site Visit: Sky High Residency', date: '24 Oct 2023', points: '+500', type: 'earn' },
  { id: '2', title: 'Starbucks Voucher', date: '20 Oct 2023', points: '-1000', type: 'redeem' },
  { id: '3', title: 'Referral: Amit Shah', date: '15 Oct 2023', points: '+1000', type: 'earn' },
];

export default function RewardsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isSmallMobile = width < 380;
  const isMobile = width < 768;
  const isLargeTablet = width >= 1024;
  const horizontalPadding = isSmallMobile ? 14 : isMobile ? 16 : 24;
  const rewardsColumns = isLargeTablet ? 3 : isMobile ? 1 : 2;
  const earnCardWidth: DimensionValue =
    rewardsColumns === 1
      ? '100%'
      : rewardsColumns === 2
      ? '48%'
      : '31.5%';

  const { points: rawPoints } = useVisit();
  const points = Number(rawPoints ?? 0);
  const [activeTab, setActiveTab] = useState('Earn');

  const tierInfo = useMemo(() => {
    if (points >= 500) return { name: 'Platinum', next: 'Diamond', target: 1000, progress: Math.min(points / 1000, 1) };
    if (points >= 150) return { name: 'Gold', next: 'Platinum', target: 500, progress: points / 500 };
    if (points >= 50) return { name: 'Silver', next: 'Gold', target: 150, progress: points / 150 };
    return { name: 'Bronze', next: 'Silver', target: 50, progress: points / 50 };
  }, [points]);

  const renderEarnItem = ({ item, index }: any) => (
    <Animated.View 
      entering={FadeInUp.delay(index * 100)}
      style={[styles.earnCard, { width: earnCardWidth }]}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
        <Ionicons name={item.icon} size={24} color={item.color} />
      </View>
      <Text style={styles.earnTitle}>{item.title}</Text>
      <Text style={[styles.earnPoints, { color: item.color }]}>{item.points} Pts</Text>
      <TouchableOpacity style={styles.earnActionBtn}>
        <Text style={styles.earnActionText}>Go</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderRedeemItem = ({ item, index }: any) => (
    <Animated.View 
      entering={FadeInDown.delay(index * 100)}
      style={styles.redeemCard}
    >
      <Image source={{ uri: item.image }} style={styles.redeemImage} contentFit="contain" />
      <View style={styles.redeemInfo}>
        <Text style={styles.redeemBrand}>{item.brand}</Text>
        <Text style={styles.redeemTitle}>{item.title}</Text>
        <View style={styles.redeemFooter}>
          <Text style={styles.redeemCost}>{item.cost}</Text>
          <TouchableOpacity style={styles.redeemBtn}>
            <Text style={styles.redeemBtnText}>Redeem</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Header Section */}
        <LinearGradient
          colors={['#0ea5e9', '#22d3ee']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.headerGradient,
            { paddingHorizontal: horizontalPadding },
            isSmallMobile && styles.headerGradientSmall,
          ]}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Estate Perks</Text>
            <TouchableOpacity style={styles.infoBtn}>
              <Ionicons name="help-circle-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>Your Balance</Text>
            <View style={styles.pointsRow}>
              <Text style={styles.pointsValue}>{points.toLocaleString()}</Text>
              <Text style={styles.pointsUnit}>Pts</Text>
            </View>
          </View>

          <View style={styles.tierBadge}>
            <Ionicons name="ribbon" size={16} color="#020617" />
            <Text style={styles.tierText}>{tierInfo.name} Member</Text>
          </View>
        </LinearGradient>

        {/* Tier Progress Card */}
        <View style={[styles.progressCard, { marginHorizontal: horizontalPadding }]}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Next Tier: <Text style={styles.platinumText}>{tierInfo.next}</Text></Text>
            <Text style={styles.pointsRemaining}>{tierInfo.target - points} pts to go</Text>
          </View>
          <View style={styles.progressBarBg}>
            <Animated.View 
              style={[styles.progressBarFill, { width: `${tierInfo.progress * 100}%` }]} 
            />
          </View>
          <Text style={styles.progressSubtext}>Unlock exclusive 0.1% cashback on your next booking!</Text>
        </View>

        {/* Tabs */}
        <View style={[styles.tabContainer, { marginHorizontal: horizontalPadding }]}>
          {['Earn', 'Redeem', 'History'].map((tab) => (
            <TouchableOpacity 
              key={tab} 
              onPress={() => setActiveTab(tab)}
              style={[styles.tabItem, activeTab === tab && styles.activeTabItem]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content Based on Tab */}
        <View style={[styles.contentPadding, { paddingHorizontal: horizontalPadding }]}>
          {activeTab === 'Earn' && (
            <FlatList
              data={EARN_OPTIONS}
              renderItem={renderEarnItem}
              keyExtractor={(item) => item.id}
              numColumns={rewardsColumns}
              key={rewardsColumns}
              scrollEnabled={false}
              columnWrapperStyle={rewardsColumns > 1 ? styles.earnRow : undefined}
            />
          )}

          {activeTab === 'Redeem' && (
            <View style={styles.redeemList}>
              {REDEEM_OPTIONS.map((item, index) => renderRedeemItem({ item, index }))}
            </View>
          )}

          {activeTab === 'History' && (
            <View style={styles.historyContainer}>
              {TRANSACTIONS.map((item, index) => (
                <View key={item.id} style={styles.historyItem}>
                  <View style={[styles.historyIcon, { backgroundColor: item.type === 'earn' ? 'rgba(34, 211, 238, 0.1)' : 'rgba(244, 63, 94, 0.1)' }]}>
                    <Ionicons 
                      name={item.type === 'earn' ? 'arrow-up-outline' : 'cart-outline'} 
                      size={18} 
                      color={item.type === 'earn' ? '#22d3ee' : '#f43f5e'} 
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyTitle}>{item.title}</Text>
                    <Text style={styles.historyDate}>{item.date}</Text>
                  </View>
                  <Text style={[styles.historyPoints, { color: item.type === 'earn' ? '#22d3ee' : '#f43f5e' }]}>
                    {item.points}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Referral Banner */}
        <TouchableOpacity style={[styles.referralBanner, { marginHorizontal: horizontalPadding }]}>
          <LinearGradient
            colors={['#1e293b', '#0f172a']}
            style={styles.referralGradient}
          >
            <View style={styles.referralInfo}>
              <Text style={styles.referralTitle}>Invite & Earn 1000 Pts</Text>
              <Text style={styles.referralSub}>Share your code: <Text style={styles.codeText}>ESTATE500</Text></Text>
            </View>
            <Ionicons name="share-social" size={24} color="#22d3ee" />
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  infoBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  
  balanceContainer: { alignItems: 'center' },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  pointsRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  pointsValue: { color: '#fff', fontSize: 48, fontWeight: '900' },
  pointsUnit: { color: '#fff', fontSize: 18, fontWeight: '700', opacity: 0.9 },
  
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  tierText: { color: '#020617', fontWeight: '800', fontSize: 12, textTransform: 'uppercase' },

  progressCard: {
    marginHorizontal: 24,
    marginTop: -25,
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  progressLabel: { color: '#fff', fontWeight: '700', fontSize: 14 },
  platinumText: { color: '#818cf8' },
  pointsRemaining: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  progressBarBg: { height: 8, backgroundColor: '#020617', borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
  progressBarFill: { height: '100%', backgroundColor: '#22d3ee', borderRadius: 4 },
  progressSubtext: { color: '#64748b', fontSize: 11, fontStyle: 'italic' },

  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginTop: 30,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 4,
  },
  tabItem: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  activeTabItem: { backgroundColor: '#1e293b' },
  tabText: { color: '#94a3b8', fontWeight: '700', fontSize: 14 },
  activeTabText: { color: '#22d3ee' },

  contentPadding: { paddingHorizontal: 24, marginTop: 24 },
  earnRow: { justifyContent: 'space-between' },
  earnCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
  },
  iconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  earnTitle: { color: '#e2e8f0', fontSize: 14, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  earnPoints: { fontSize: 16, fontWeight: '800' },
  earnActionBtn: { marginTop: 12, backgroundColor: '#1e293b', paddingHorizontal: 16, paddingVertical: 4, borderRadius: 10 },
  earnActionText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  redeemList: { gap: 16 },
  redeemCard: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
  },
  redeemImage: { width: 60, height: 60, borderRadius: 12, backgroundColor: '#fff', padding: 8 },
  redeemInfo: { flex: 1, marginLeft: 16 },
  redeemBrand: { color: '#22d3ee', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  redeemTitle: { color: '#fff', fontSize: 15, fontWeight: '700', marginVertical: 2 },
  redeemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  redeemCost: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  redeemBtn: { backgroundColor: '#22d3ee', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  redeemBtnText: { color: '#020617', fontSize: 12, fontWeight: '800' },

  historyContainer: { backgroundColor: '#0f172a', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#1e293b' },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  historyIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  historyTitle: { color: '#e2e8f0', fontSize: 14, fontWeight: '600' },
  historyDate: { color: '#64748b', fontSize: 12, marginTop: 2 },
  historyPoints: { fontSize: 14, fontWeight: '800' },

  referralBanner: { marginHorizontal: 24, marginTop: 30, borderRadius: 20, overflow: 'hidden' },
  referralGradient: { flexDirection: 'row', alignItems: 'center', padding: 20, justifyContent: 'space-between' },
  referralInfo: { flex: 1 },
  referralTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  referralSub: { color: '#94a3b8', fontSize: 13, marginTop: 4 },
  codeText: { color: '#22d3ee', fontWeight: '800' },
  headerGradientSmall: {
    paddingBottom: 30,
  },
});

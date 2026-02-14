import React, { useMemo, useState } from 'react';
import {
  Alert,
  DimensionValue,
  FlatList,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight, FadeInUp } from 'react-native-reanimated';
import { useRootNavigationState, useRouter } from 'expo-router';
import { useVisit } from '../context/VisitContext';

type Tab = 'Earn' | 'Redeem' | 'History';
type TransactionType = 'earn' | 'redeem';
type HistoryFilter = 'all' | TransactionType;

interface EarnOption {
  id: string;
  title: string;
  pointsValue: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route?: string;
  action?: 'share';
}

interface RedeemOption {
  id: string;
  title: string;
  costPoints: number;
  brand: string;
  image: string;
  maxRedeems: number;
}

interface TransactionItem {
  id: string;
  title: string;
  date: string;
  pointsValue: number;
  type: TransactionType;
}

const EARN_OPTIONS: EarnOption[] = [
  { id: '1', title: 'Site Visit', pointsValue: 500, icon: 'location', color: '#22d3ee', route: '/explore' },
  { id: '2', title: 'Refer a Friend', pointsValue: 2000, icon: 'people', color: '#818cf8', action: 'share' },
  { id: '3', title: 'Write a Review', pointsValue: 200, icon: 'star', color: '#fbbf24', route: '/property/1' },
  { id: '4', title: 'Complete Profile', pointsValue: 150, icon: 'person-add', color: '#10b981', route: '/profile' },
];

const REDEEM_OPTIONS: RedeemOption[] = [
  { id: '1', title: 'Amazon Voucher', costPoints: 2000, brand: 'Amazon', image: 'https://img.icons8.com/color/480/amazon-pay.png', maxRedeems: 3 },
  { id: '2', title: 'Home Cleaning', costPoints: 1500, brand: 'Urban Company', image: 'https://img.icons8.com/color/480/cleaning-service.png', maxRedeems: 2 },
  { id: '3', title: 'Interior Consult', costPoints: 3000, brand: 'Livspace', image: 'https://img.icons8.com/color/480/interior-design.png', maxRedeems: 2 },
  { id: '4', title: 'Free Moving', costPoints: 5000, brand: 'Packers & Movers', image: 'https://img.icons8.com/color/480/truck.png', maxRedeems: 1 },
];

const INITIAL_TRANSACTIONS: TransactionItem[] = [
  { id: '1', title: 'Site Visit: Sky High Residency', date: '24 Oct 2023', pointsValue: 500, type: 'earn' },
  { id: '2', title: 'Starbucks Voucher', date: '20 Oct 2023', pointsValue: -1000, type: 'redeem' },
  { id: '3', title: 'Referral: Amit Shah', date: '15 Oct 2023', pointsValue: 1000, type: 'earn' },
];

const TAB_OPTIONS: Tab[] = ['Earn', 'Redeem', 'History'];
const HISTORY_FILTERS: HistoryFilter[] = ['all', 'earn', 'redeem'];
const REFERRAL_CODE = 'ESTATE500';

const formatPoints = (value: number) => `${value >= 0 ? '+' : '-'}${Math.abs(value).toLocaleString('en-IN')}`;

const formatDate = (date: Date) =>
  date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

export default function RewardsScreen() {
  const router = useRouter();
  const navigationState = useRootNavigationState();
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

  const { points: rawPoints } = useVisit() as { points?: number | string };
  const parsedBasePoints = Number(rawPoints ?? 0);
  const basePoints = Number.isFinite(parsedBasePoints) ? Math.max(0, parsedBasePoints) : 0;

  const [activeTab, setActiveTab] = useState<Tab>('Earn');
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all');
  const [walletDelta, setWalletDelta] = useState(0);
  const [claimedEarnIds, setClaimedEarnIds] = useState<string[]>([]);
  const [redeemedCounts, setRedeemedCounts] = useState<Record<string, number>>({});
  const [transactions, setTransactions] = useState<TransactionItem[]>(INITIAL_TRANSACTIONS);

  const effectivePoints = Math.max(0, basePoints + walletDelta);

  const tierInfo = useMemo(() => {
    if (effectivePoints >= 1000) {
      return { name: 'Diamond', next: null, target: 1000, progress: 1, remaining: 0 };
    }
    if (effectivePoints >= 500) {
      return {
        name: 'Platinum',
        next: 'Diamond',
        target: 1000,
        progress: Math.min((effectivePoints - 500) / 500, 1),
        remaining: 1000 - effectivePoints,
      };
    }
    if (effectivePoints >= 150) {
      return {
        name: 'Gold',
        next: 'Platinum',
        target: 500,
        progress: Math.min((effectivePoints - 150) / 350, 1),
        remaining: 500 - effectivePoints,
      };
    }
    if (effectivePoints >= 50) {
      return {
        name: 'Silver',
        next: 'Gold',
        target: 150,
        progress: Math.min((effectivePoints - 50) / 100, 1),
        remaining: 150 - effectivePoints,
      };
    }
    return {
      name: 'Bronze',
      next: 'Silver',
      target: 50,
      progress: Math.min(effectivePoints / 50, 1),
      remaining: 50 - effectivePoints,
    };
  }, [effectivePoints]);

  const progressWidth: DimensionValue = `${Math.min(Math.max(tierInfo.progress, 0), 1) * 100}%`;

  const totalEarned = useMemo(
    () => transactions.reduce((sum, item) => (item.pointsValue > 0 ? sum + item.pointsValue : sum), 0),
    [transactions]
  );
  const totalRedeemed = useMemo(
    () => transactions.reduce((sum, item) => (item.pointsValue < 0 ? sum + Math.abs(item.pointsValue) : sum), 0),
    [transactions]
  );

  const filteredTransactions = useMemo(() => {
    if (historyFilter === 'all') return transactions;
    return transactions.filter((item) => item.type === historyFilter);
  }, [historyFilter, transactions]);

  const redeemState = useMemo(() => {
    return REDEEM_OPTIONS.map((reward) => {
      const redeemed = redeemedCounts[reward.id] || 0;
      const soldOut = redeemed >= reward.maxRedeems;
      const canRedeem = !soldOut && effectivePoints >= reward.costPoints;
      return {
        ...reward,
        redeemed,
        soldOut,
        canRedeem,
      };
    });
  }, [effectivePoints, redeemedCounts]);

  const suggestedReward = useMemo(() => {
    return redeemState
      .filter((item) => item.canRedeem)
      .sort((a, b) => b.costPoints - a.costPoints)[0];
  }, [redeemState]);

  const addTransaction = (title: string, pointsValue: number, type: TransactionType) => {
    const newTx: TransactionItem = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title,
      date: formatDate(new Date()),
      pointsValue,
      type,
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  const handleShareReferral = async () => {
    try {
      await Share.share({
        message: `Join Estate Perks and use my referral code ${REFERRAL_CODE} to get bonus points.`,
      });
    } catch {
      Alert.alert('Share Unavailable', 'Could not open share sheet right now.');
    }
  };

  const handleEarn = (item: EarnOption) => {
    if (claimedEarnIds.includes(item.id)) {
      Alert.alert('Already Claimed', 'This reward has already been claimed in this session.');
      return;
    }

    setClaimedEarnIds((prev) => [...prev, item.id]);
    setWalletDelta((prev) => prev + item.pointsValue);
    addTransaction(item.title, item.pointsValue, 'earn');

    if (item.action === 'share') {
      handleShareReferral();
    } else if (item.route) {
      router.push(item.route as any);
    }

    Alert.alert('Points Added', `You earned ${item.pointsValue.toLocaleString('en-IN')} points.`);
  };

  const handleRedeem = (item: (typeof redeemState)[number]) => {
    if (item.soldOut) {
      Alert.alert('Unavailable', 'This reward is currently out of stock.');
      return;
    }

    if (!item.canRedeem) {
      Alert.alert(
        'Insufficient Points',
        `You need ${(item.costPoints - effectivePoints).toLocaleString('en-IN')} more points to redeem this reward.`
      );
      return;
    }

    setWalletDelta((prev) => prev - item.costPoints);
    setRedeemedCounts((prev) => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }));
    addTransaction(item.title, -item.costPoints, 'redeem');
    Alert.alert('Redeemed', `${item.title} has been redeemed successfully.`);
  };

  const renderEarnItem = ({ item, index }: { item: EarnOption; index: number }) => {
    const isClaimed = claimedEarnIds.includes(item.id);
    return (
      <Animated.View
        entering={FadeInUp.delay(index * 100)}
        style={[styles.earnCard, { width: earnCardWidth }]}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
          <Ionicons name={item.icon} size={24} color={item.color} />
        </View>
        <Text style={styles.earnTitle}>{item.title}</Text>
        <Text style={[styles.earnPoints, { color: item.color }]}>
          +{item.pointsValue.toLocaleString('en-IN')} Pts
        </Text>
        <TouchableOpacity
          style={[styles.earnActionBtn, isClaimed && styles.disabledBtn]}
          onPress={() => handleEarn(item)}
          disabled={isClaimed}
        >
          <Text style={[styles.earnActionText, isClaimed && styles.disabledBtnText]}>
            {isClaimed ? 'Claimed' : 'Claim'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderRedeemItem = (item: (typeof redeemState)[number], index: number) => (
    <Animated.View
      key={item.id}
      entering={FadeInDown.delay(index * 100)}
      style={styles.redeemCard}
    >
      <Image source={{ uri: item.image }} style={styles.redeemImage} contentFit="contain" />
      <View style={styles.redeemInfo}>
        <Text style={styles.redeemBrand}>{item.brand}</Text>
        <Text style={styles.redeemTitle}>{item.title}</Text>
        <View style={styles.redeemFooter}>
          <Text style={styles.redeemCost}>{item.costPoints.toLocaleString('en-IN')} pts</Text>
          <TouchableOpacity
            style={[styles.redeemBtn, (!item.canRedeem || item.soldOut) && styles.disabledRedeemBtn]}
            onPress={() => handleRedeem(item)}
            disabled={!item.canRedeem || item.soldOut}
          >
            <Text style={[styles.redeemBtnText, (!item.canRedeem || item.soldOut) && styles.disabledRedeemText]}>
              {item.soldOut ? 'Sold Out' : item.canRedeem ? 'Redeem' : 'Locked'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.rewardMeta}>
          {item.soldOut
            ? 'No stock left'
            : `${Math.max(item.maxRedeems - item.redeemed, 0)} left in this cycle`}
        </Text>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
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
            <TouchableOpacity
              onPress={() => {
                if (navigationState?.key) {
                  router.back();
                } else {
                  router.replace('/');
                }
              }}
              style={styles.backBtn}
            >
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Estate Perks</Text>
            <TouchableOpacity
              style={styles.infoBtn}
              onPress={() =>
                Alert.alert(
                  'Rewards Guide',
                  'Earn points from visits, referrals, reviews and profile completion. Redeem points for partner rewards.'
                )
              }
            >
              <Ionicons name="help-circle-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>Your Balance</Text>
            <View style={styles.pointsRow}>
              <Text style={styles.pointsValue}>{effectivePoints.toLocaleString('en-IN')}</Text>
              <Text style={styles.pointsUnit}>Pts</Text>
            </View>
          </View>

          <View style={styles.tierBadge}>
            <Ionicons name="ribbon" size={16} color="#020617" />
            <Text style={styles.tierText}>{tierInfo.name} Member</Text>
          </View>
        </LinearGradient>

        <View style={[styles.progressCard, { marginHorizontal: horizontalPadding }]}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>
              {tierInfo.next ? (
                <>
                  Next Tier: <Text style={styles.platinumText}>{tierInfo.next}</Text>
                </>
              ) : (
                'Top Tier Achieved'
              )}
            </Text>
            <Text style={styles.pointsRemaining}>
              {tierInfo.next ? `${tierInfo.remaining.toLocaleString('en-IN')} pts to go` : 'Max tier unlocked'}
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: progressWidth }]} />
          </View>
          <Text style={styles.progressSubtext}>Unlock exclusive cashback and premium support perks.</Text>
        </View>

        <View style={[styles.statsRow, { marginHorizontal: horizontalPadding }]}>
          {[
            { label: 'Total Earned', value: totalEarned.toLocaleString('en-IN'), color: '#22d3ee' },
            { label: 'Total Redeemed', value: totalRedeemed.toLocaleString('en-IN'), color: '#f59e0b' },
            { label: 'Session Delta', value: walletDelta.toLocaleString('en-IN'), color: walletDelta >= 0 ? '#22c55e' : '#f43f5e' },
          ].map((stat, index) => (
            <Animated.View key={stat.label} entering={FadeInRight.delay(index * 100)} style={styles.statsCard}>
              <Text style={styles.statsLabel}>{stat.label}</Text>
              <Text style={[styles.statsValue, { color: stat.color }]}>
                {index === 2 && walletDelta > 0 ? '+' : ''}{stat.value}
              </Text>
            </Animated.View>
          ))}
        </View>

        <View style={[styles.tabContainer, { marginHorizontal: horizontalPadding }]}>
          {TAB_OPTIONS.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tabItem, activeTab === tab && styles.activeTabItem]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

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
              {suggestedReward && (
                <View style={styles.suggestedCard}>
                  <Ionicons name="sparkles" size={16} color="#22d3ee" />
                  <Text style={styles.suggestedText}>
                    Best use right now: {suggestedReward.title} ({suggestedReward.costPoints.toLocaleString('en-IN')} pts)
                  </Text>
                </View>
              )}
              {redeemState.map((item, index) => renderRedeemItem(item, index))}
            </View>
          )}

          {activeTab === 'History' && (
            <View style={styles.historyContainer}>
              <View style={styles.historyFilters}>
                {HISTORY_FILTERS.map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    style={[styles.filterChip, historyFilter === filter && styles.filterChipActive]}
                    onPress={() => setHistoryFilter(filter)}
                  >
                    <Text style={[styles.filterChipText, historyFilter === filter && styles.filterChipTextActive]}>
                      {filter === 'all' ? 'All' : filter === 'earn' ? 'Earned' : 'Redeemed'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {filteredTransactions.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="time-outline" size={20} color="#64748b" />
                  <Text style={styles.emptyStateText}>No transactions found for this filter.</Text>
                </View>
              ) : (
                filteredTransactions.map((item, index) => (
                  <View
                    key={item.id}
                    style={[
                      styles.historyItem,
                      index === filteredTransactions.length - 1 && styles.historyItemLast,
                    ]}
                  >
                    <View
                      style={[
                        styles.historyIcon,
                        {
                          backgroundColor:
                            item.type === 'earn' ? 'rgba(34, 211, 238, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                        },
                      ]}
                    >
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
                      {formatPoints(item.pointsValue)}
                    </Text>
                  </View>
                ))
              )}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.referralBanner, { marginHorizontal: horizontalPadding }]}
          onPress={handleShareReferral}
        >
          <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.referralGradient}>
            <View style={styles.referralInfo}>
              <Text style={styles.referralTitle}>Invite & Earn 1000 Pts</Text>
              <Text style={styles.referralSub}>
                Share your code: <Text style={styles.codeText}>{REFERRAL_CODE}</Text>
              </Text>
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

  statsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  statsCard: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
  },
  statsLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '700' },
  statsValue: { marginTop: 6, fontSize: 16, fontWeight: '800' },

  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginTop: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.96)',
    borderRadius: 999,
    padding: 4,
    borderWidth: 1,
    borderColor: '#1e293b',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  tabItem: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 999 },
  activeTabItem: { backgroundColor: '#1e293b', borderRadius: 999 },
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
  earnActionBtn: { marginTop: 12, backgroundColor: '#1e293b', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 10 },
  earnActionText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  disabledBtn: { backgroundColor: '#334155' },
  disabledBtnText: { color: '#94a3b8' },

  redeemList: { gap: 16 },
  suggestedCard: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(34, 211, 238, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.25)',
    borderRadius: 12,
    padding: 10,
  },
  suggestedText: { flex: 1, color: '#cbd5e1', fontSize: 12, fontWeight: '600' },
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
  disabledRedeemBtn: { backgroundColor: '#334155' },
  disabledRedeemText: { color: '#94a3b8' },
  rewardMeta: { marginTop: 6, color: '#64748b', fontSize: 11 },

  historyContainer: { backgroundColor: '#0f172a', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#1e293b' },
  historyFilters: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterChipActive: {
    borderColor: '#22d3ee',
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
  },
  filterChipText: { color: '#94a3b8', fontSize: 12, fontWeight: '700' },
  filterChipTextActive: { color: '#22d3ee' },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  historyItemLast: { borderBottomWidth: 0, paddingBottom: 2 },
  historyIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  historyTitle: { color: '#e2e8f0', fontSize: 14, fontWeight: '600' },
  historyDate: { color: '#64748b', fontSize: 12, marginTop: 2 },
  historyPoints: { fontSize: 14, fontWeight: '800' },
  emptyState: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingVertical: 6 },
  emptyStateText: { color: '#64748b', fontSize: 13 },

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

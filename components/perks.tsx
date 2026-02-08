import React, { useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  Share, 
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useVisit } from '../context/VisitContext';

const REDEEM_COST = 5000;
const POINTS_PER_VISIT = 500;
const INITIAL_POINTS = 2000;

export default function PerksScreen() {
  const router = useRouter();
  const { visits } = useVisit();

  // Calculate dynamic points: 500 per visit + 2000 base points
  const points = useMemo(() => (visits?.length || 0) * POINTS_PER_VISIT + INITIAL_POINTS, [visits]);

  const handleRedeem = (reward: string) => {
    if (points < REDEEM_COST) {
      const errorMsg = `You need ${REDEEM_COST - points} more points to redeem "${reward}".`;
      Platform.OS === 'web' ? window.alert(errorMsg) : Alert.alert("Insufficient Points", errorMsg);
      return;
    }

    const message = `Would you like to redeem ${REDEEM_COST.toLocaleString()} points for "${reward}"?`;
    
    if (Platform.OS === 'web') {
      if (window.confirm(message)) {
        window.alert(`Success! Your ${reward} voucher has been sent to your email.`);
      }
    } else {
      Alert.alert(
        "Redeem Reward",
        message,
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Redeem", 
            onPress: () => Alert.alert("Success", `Your ${reward} voucher has been sent to your email.`) 
          }
        ]
      );
    }
  };

  const handleReferFriend = async () => {
    const shareData = {
      title: 'EstatePerks',
      message: 'Join me on EstatePerks and find your dream home! Use my referral link to get 2,000 bonus points: https://estateperks.app/invite',
    };

    try {
      if (Platform.OS === 'web' && navigator.share) {
        await navigator.share(shareData);
      } else {
        await Share.share({ message: shareData.message });
      }
    } catch (error: any) {
      if (Platform.OS !== 'web') {
        Alert.alert("Error", error.message);
      }
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
        <Text style={styles.title}>Home Services</Text>
        <View style={styles.pointsCard}>
          <Text style={styles.pointsLabel}>Loyalty Points Balance</Text>
          <Text style={styles.pointsValue}>
            {points.toLocaleString()}<Text style={styles.pts}> PTS</Text>
          </Text>
        </View>
      </Animated.View>

      <Text style={styles.sectionTitle}>Premium Home Services</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.horizontalScroll}
        contentContainerStyle={styles.horizontalScrollContent}
      >
        {['Free Moving', 'Interior Design', 'Home Insurance'].map((item, index) => (
          <TouchableOpacity 
            key={item} 
            onPress={() => handleRedeem(item)}
            activeOpacity={0.7}
          >
            <Animated.View 
              entering={FadeInRight.delay(index * 100)}
              style={[
                styles.rewardCard,
                points < REDEEM_COST ? { opacity: 0.6 } : null
              ]}
            >
              <Ionicons 
                name={points < REDEEM_COST ? "lock-closed" : "gift"} 
                size={24} 
                color={points < REDEEM_COST ? "#64748b" : "#22d3ee"} 
              />
              <Text style={styles.rewardText}>{item}</Text>
              <Text style={styles.rewardCost}>{REDEEM_COST.toLocaleString()} PTS</Text>
            </Animated.View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.sectionTitle}>How to earn</Text>
      <View style={styles.earnList}>
        {[
          {
            title: 'Visit an Open House',
            subtitle: '+500 points per visit',
            icon: 'home' as const,
            color: '#34C759',
            action: () => router.push('/'),
          },
          {
            title: 'Refer a Friend',
            subtitle: '+2,000 points on signup',
            icon: 'people' as const,
            color: '#22d3ee',
            action: handleReferFriend,
          }
        ].map((item, index, array) => (
          <TouchableOpacity 
            key={item.title}
            style={[styles.earnItem, index === array.length - 1 && { borderBottomWidth: 0 }]}
            onPress={item.action}
          >
            <Ionicons name={item.icon} size={20} color={item.color} />
            <View style={styles.earnInfo}>
              <Text style={styles.earnTitle}>{item.title}</Text>
              <Text style={styles.earnSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#64748b" />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  content: { padding: 20 },
  header: { marginBottom: 25 },
  title: { fontSize: 34, fontWeight: 'bold', marginBottom: 15, color: '#e5e7eb' },
  pointsCard: {
    backgroundColor: '#0f172a',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.5)',
      },
    }),
  },
  pointsLabel: { color: '#94a3b8', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  pointsValue: { color: '#FFFFFF', fontSize: 36, fontWeight: '800', marginTop: 8 },
  pts: { fontSize: 18, color: '#22d3ee' },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginTop: 32, marginBottom: 16, color: '#e5e7eb' },
  horizontalScroll: { marginHorizontal: -20 },
  horizontalScrollContent: { paddingLeft: 20, paddingRight: 20 },
  rewardCard: {
    backgroundColor: '#0f172a',
    width: 150,
    padding: 20,
    borderRadius: 20,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  rewardText: { fontWeight: '600', marginTop: 12, fontSize: 15, color: '#e5e7eb' },
  rewardCost: { color: '#94a3b8', fontSize: 13, marginTop: 4 },
  earnList: { 
    backgroundColor: '#0f172a', 
    borderRadius: 20, 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  earnItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  earnInfo: { flex: 1, marginLeft: 16 },
  earnTitle: { fontWeight: '600', fontSize: 16, color: '#e5e7eb' },
  earnSubtitle: { color: '#94a3b8', fontSize: 13, marginTop: 2 },
});
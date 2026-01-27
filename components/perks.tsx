import React from 'react';
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
import { SymbolView } from 'expo-symbols';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useVisit } from '../context/VisitContext';

export default function PerksScreen() {
  const router = useRouter();
  const { visits } = useVisit();

  // Calculate dynamic points: 500 per visit + 2000 base points
  const points = (visits?.length || 0) * 500 + 2000;

  const handleRedeem = (reward: string) => {
    const cost = 5000;
    if (points < cost) {
      const errorMsg = `You need ${cost - points} more points to redeem "${reward}".`;
      Platform.OS === 'web' ? alert(errorMsg) : Alert.alert("Insufficient Points", errorMsg);
      return;
    }

    const message = `Would you like to redeem 5,000 points for "${reward}"?`;
    
    if (Platform.OS === 'web') {
      if (confirm(message)) {
        alert(`Success! Your ${reward} voucher has been sent to your email.`);
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
    try {
      await Share.share({
        message: 'Join me on EstatePerks and find your dream home! Use my referral link to get 2,000 bonus points: https://estateperks.app/invite',
      });
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
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
                points < 5000 && { opacity: 0.6 }
              ]}
            >
              <SymbolView 
                name={points < 5000 ? "lock.fill" : "gift.fill"} 
                size={24} 
                tintColor={points < 5000 ? "#64748b" : "#22d3ee"} 
              />
              <Text style={styles.rewardText}>{item}</Text>
              <Text style={styles.rewardCost}>5,000 pts</Text>
            </Animated.View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.sectionTitle}>How to earn</Text>
      <View style={styles.earnList}>
        <TouchableOpacity 
          style={styles.earnItem}
          onPress={() => router.push('/')}
        >
          <SymbolView name="house.fill" size={20} tintColor="#34C759" />
          <View style={styles.earnInfo}>
            <Text style={styles.earnTitle}>Visit an Open House</Text>
            <Text style={styles.earnSubtitle}>+500 points per visit</Text>
          </View>
          <SymbolView name="chevron.right" size={16} tintColor="#C7C7CC" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.earnItem}
          onPress={handleReferFriend}
        >
          <SymbolView name="person.2.fill" size={20} tintColor="#22d3ee" />
          <View style={styles.earnInfo}>
            <Text style={styles.earnTitle}>Refer a Friend</Text>
            <Text style={styles.earnSubtitle}>+2,000 points on signup</Text>
          </View>
          <SymbolView name="chevron.right" size={16} tintColor="#94a3b8" />
        </TouchableOpacity>
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
  horizontalScroll: { marginHorizontal: -20, paddingLeft: 20 },
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
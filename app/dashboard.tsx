import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function AdminDashboard() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isSmallMobile = width < 380;

  const handleAction = (type: 'Approve' | 'Reject') => {
    Alert.alert(
      "Confirm Action",
      `Are you sure you want to ${type.toLowerCase()} this property?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: type, onPress: () => Alert.alert("Success", `Property ${type}d successfully.`) }
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, isSmallMobile && styles.containerSmall]}>
      <View style={[styles.header, isSmallMobile && styles.headerSmall]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Admin Panel</Text>
      </View>

      <Text style={styles.sectionTitle}>Pending Approvals (1)</Text>
      
      <View style={styles.reviewCard}>
        <View style={styles.propertyInfo}>
          <Text style={styles.propertyName}>Skyline Apartments</Text>
          <Text style={styles.agentName}>By Agent: Rahul Sharma</Text>
          <Text style={styles.price}>₹ 1.8 Cr</Text>
        </View>
        
        <View style={[styles.actionRow, isSmallMobile && styles.actionRowSmall]}>
          <TouchableOpacity 
            style={[styles.actionBtn, isSmallMobile && styles.actionBtnSmall, styles.rejectBtn]} 
            onPress={() => handleAction('Reject')}
          >
            <Ionicons name="close-circle" size={20} color="#ef4444" />
            <Text style={styles.rejectText}>Reject</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionBtn, isSmallMobile && styles.actionBtnSmall, styles.approveBtn]} 
            onPress={() => handleAction('Approve')}
          >
            <Ionicons name="checkmark-circle" size={20} color="#020617" />
            <Text style={styles.approveText}>Approve</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617', padding: 20 },
  containerSmall: { padding: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 40, marginBottom: 30 },
  headerSmall: { marginTop: 20, gap: 10, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#fff' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#94a3b8', marginBottom: 20 },
  reviewCard: { 
    backgroundColor: '#0f172a', 
    borderRadius: 20, 
    padding: 20, 
    borderWidth: 1, 
    borderColor: '#1e293b' 
  },
  propertyInfo: { marginBottom: 20 },
  propertyName: { color: '#fff', fontSize: 18, fontWeight: '700' },
  agentName: { color: '#64748b', fontSize: 14, marginTop: 4 },
  price: { color: '#22d3ee', fontSize: 16, fontWeight: '800', marginTop: 8 },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionRowSmall: { flexWrap: 'wrap' },
  actionBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    paddingVertical: 12, 
    borderRadius: 12 
  },
  actionBtnSmall: {
    minWidth: '100%',
  },
  rejectBtn: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 1, borderColor: '#ef4444' },
  rejectText: { color: '#ef4444', fontWeight: '700' },
  approveBtn: { backgroundColor: '#22d3ee' },
  approveText: { color: '#020617', fontWeight: '800' }
});

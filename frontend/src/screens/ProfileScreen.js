import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../styles/theme';
import { api } from '../config/api';
import { useAuth } from '../context/AuthContext';

const ProfileScreen = ({ navigation }) => {
  const [bookings, setBookings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const { user, signOut } = useAuth();

  const fetchBookings = async () => {
    if (!user?.id) {
      console.log('No user ID available for fetching bookings');
      return;
    }
    try {
      console.log('Fetching bookings for user:', user.id);
      const response = await api.getAppointments(user.id);
      console.log('Bookings response:', response);
      setBookings(response?.data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookings([]);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  };

  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  const confirmLogout = async () => {
    setLogoutModalVisible(false);
    await signOut();
    navigation.getParent()?.navigate('Login');
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </Text>
          </View>
        </View>
        <Text style={styles.userName}>{user?.name || user?.email?.split('@')[0] || 'User'}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <Text style={styles.cardTitle}>INFORMASI PROFIL</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Nama</Text>
          <Text style={styles.infoValue}>{user?.name || '-'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{user?.email || '-'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Role</Text>
          <Text style={styles.infoValue}>
            {user?.role === 'admin' ? 'Administrator' : 'Customer'}
          </Text>
        </View>
      </View>

      {/* Booking History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>RIWAYAT BOOKING</Text>
        {bookings.length > 0 ? (
          bookings.map((booking, index) => (
            <View key={`booking-profile-${booking.id || `idx-${index}`}-${booking.date || index}`} style={styles.bookingCard}>
              <View style={styles.bookingHeader}>
                <Text style={styles.bookingService}>
                  {booking.service || 'Service'}
                </Text>
                <Text style={[
                  styles.bookingStatus,
                  (booking.status === 'confirmed' || booking.status === 'approved') && styles.statusConfirmed,
                  booking.status === 'completed' && styles.statusCompleted,
                  (booking.status === 'cancelled' || booking.status === 'not approved') && styles.statusCancelled,
                ]}>
                  {booking.status?.toUpperCase()}
                </Text>
              </View>
              {booking.capsterName && (
                <Text style={styles.bookingDetail}>
                  👤 Capster: {booking.capsterName}
                </Text>
              )}
              <Text style={styles.bookingDetail}>
                📅 {booking.date}
              </Text>
              <Text style={styles.bookingDetail}>
                🕒 {booking.time}
              </Text>
              {booking.notes && (
                <Text style={styles.bookingDetail}>
                  📝 {booking.notes}
                </Text>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Belum ada riwayat booking</Text>
            <TouchableOpacity
              style={styles.bookNowButton}
              onPress={() => navigation.navigate('Booking')}
            >
              <Text style={styles.bookNowButtonText}>BOOKING SEKARANG</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>KELUAR</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Brocode Barbershop</Text>
        <Text style={styles.footerSubtext}>© 2024 All rights reserved</Text>
      </View>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={logoutModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="log-out-outline" size={48} color={Colors.accentColor} />
            </View>
            
            <Text style={styles.modalTitle}>Konfirmasi Logout</Text>
            <Text style={styles.modalMessage}>
              Apakah Anda yakin ingin keluar dari akun?
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Batal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={confirmLogout}
              >
                <Text style={styles.modalButtonTextConfirm}>Keluar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgColor,
  },
  header: {
    backgroundColor: Colors.accentColor,
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.textLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.accentColor,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textLight,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#f5f5f5',
  },
  profileCard: {
    backgroundColor: Colors.cardBg,
    margin: 20,
    padding: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: 20,
    letterSpacing: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.textDark,
    fontWeight: '600',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textDark,
    marginBottom: 16,
    letterSpacing: 1,
  },
  bookingCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookingService: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textDark,
    flex: 1,
  },
  bookingStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textLight,
    backgroundColor: Colors.textMuted,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusConfirmed: {
    backgroundColor: '#4CAF50',
  },
  statusCompleted: {
    backgroundColor: '#2196F3',
  },
  statusCancelled: {
    backgroundColor: '#F44336',
  },
  bookingDetail: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: Colors.cardBg,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textMuted,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  bookNowButton: {
    backgroundColor: Colors.accentColor,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  bookNowButtonText: {
    color: Colors.textLight,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  actions: {
    padding: 20,
  },
  logoutButton: {
    backgroundColor: '#F44336',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: Colors.textLight,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  footer: {
    padding: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: Colors.cardBg,
    borderRadius: 20,
    padding: 30,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.textMuted,
  },
  modalButtonConfirm: {
    backgroundColor: '#F44336',
  },
  modalButtonTextCancel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  modalButtonTextConfirm: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textLight,
  },
});

export default ProfileScreen;

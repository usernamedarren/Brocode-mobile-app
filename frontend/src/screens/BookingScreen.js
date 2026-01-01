import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
  Platform,
  Modal,
  FlatList,
  Animated,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '../styles/theme';
import { api } from '../config/api';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/LoadingScreen';

const BookingScreen = ({ route, navigation }) => {
  const [services, setServices] = useState([]);
  const [capsters, setCapsters] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedCapster, setSelectedCapster] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showCapsterModal, setShowCapsterModal] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const { user } = useAuth();
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const fetchData = async () => {
    try {
      const [servicesRes, capstersRes] = await Promise.all([
        api.getServices(),
        api.getCapsters(),
      ]);
      
      console.log('Services fetched:', JSON.stringify(servicesRes?.data?.slice(0, 2)));
      console.log('Capsters fetched:', JSON.stringify(capstersRes?.data?.slice(0, 2)));
      
      setServices(servicesRes?.data || []);
      setCapsters(capstersRes?.data || []);
      
      // Fetch bookings separately with better error handling
      if (user?.id) {
        try {
          const bookingsRes = await api.getAppointments(user.id);
          setBookings(bookingsRes?.data || []);
        } catch (bookingError) {
          // Silently fail for appointments endpoint (might not be deployed yet)
          console.log('Appointments endpoint not available yet');
          setBookings([]);
        }
      } else {
        console.log('No user ID available for fetching bookings');
        setBookings([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    console.log('BookingScreen mounted, user:', JSON.stringify(user));
    fetchData();
    if (route.params?.serviceId) {
      setSelectedService(route.params.serviceId);
    }
  }, [user]);

  // Reset and trigger animations when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Reset animations
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
      
      // Trigger entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleBooking = async () => {
    // Debug logging
    console.log('=== BOOKING DEBUG ===');
    console.log('Current user object:', user);
    console.log('User ID:', user?.id);
    console.log('Selected service:', selectedService);
    console.log('Selected capster:', selectedCapster);
    
    // Check if user is logged in
    if (!user) {
      console.error('User object is null or undefined');
      Alert.alert('Error', 'Sesi login telah berakhir. Silakan login kembali.');
      navigation.replace('Auth');
      return;
    }
    
    // Check if user has ID
    if (!user.id) {
      console.error('User object exists but ID is missing:', user);
      Alert.alert('Error', 'Data user tidak lengkap. Silakan login kembali.');
      navigation.replace('Auth');
      return;
    }
    
    if (!selectedService) {
      Alert.alert('Error', 'Mohon pilih layanan');
      return;
    }
    
    if (!selectedService.name) {
      Alert.alert('Error', 'Data layanan tidak valid. Silakan pilih ulang layanan.');
      console.error('Service object missing name:', selectedService);
      return;
    }

    setLoading(true);
    try {
      const appointmentDate = selectedDate.toISOString().split('T')[0];
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      const appointmentTime = `${hours}:${minutes}`;
      
      const appointmentData = {
        user_id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        service: selectedService.name,
        capster: selectedCapster?.name || selectedCapster?.alias || '',
        capsterId: selectedCapster?.id || null,
        date: appointmentDate,
        time: appointmentTime,
        status: 'pending',
      };
      
      console.log('Submitting appointment:', appointmentData);
      const result = await api.createAppointment(appointmentData);
      console.log('Appointment created successfully:', result);

      Alert.alert('Berhasil', 'Booking berhasil dibuat!');
      setSelectedService(null);
      setSelectedCapster(null);
      setSelectedDate(new Date());
      setSelectedTime(new Date());
      await fetchData();
    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert('Error', error.message || 'Gagal membuat booking');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const onTimeChange = (event, time) => {
    setShowTimePicker(false);
    if (time) {
      setSelectedTime(time);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>BOOKING APPOINTMENT</Text>
          <Text style={styles.headerSubtitle}>Jadwalkan kunjungan Anda</Text>
        </View>
      </Animated.View>

      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <View style={styles.form}>
        {/* Service Dropdown */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Pilih Layanan *</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowServiceModal(true)}
          >
            <Text style={[styles.dropdownButtonText, !selectedService && styles.placeholderText]}>
              {selectedService ? `${selectedService.name} - Rp ${selectedService.price?.toLocaleString('id-ID')}` : 'Pilih layanan...'}
            </Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Capster Dropdown (Optional) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Pilih Capster (Opsional)</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowCapsterModal(true)}
          >
            <Text style={[styles.dropdownButtonText, !selectedCapster && styles.placeholderText]}>
              {selectedCapster ? selectedCapster.name : 'Pilih capster...'}
            </Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Date Picker */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Pilih Tanggal *</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dropdownButtonText}>
               {selectedDate.toLocaleDateString('id-ID', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={new Date()}
              onChange={onDateChange}
            />
          )}
        </View>

        {/* Time Picker */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Pilih Waktu *</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={styles.dropdownButtonText}>
               {selectedTime.toLocaleTimeString('id-ID', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={selectedTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              is24Hour={true}
              onChange={onTimeChange}
            />
          )}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.buttonDisabled]}
          onPress={handleBooking}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'MEMPROSES...' : 'BUAT BOOKING'}
          </Text>
        </TouchableOpacity>
      </View>
      </Animated.View>

      {/* My Bookings */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
      <View style={styles.bookingsSection}>
        <Text style={styles.sectionTitle}>BOOKING SAYA</Text>
        {bookings.length > 0 ? (
          bookings.map((booking, index) => (
            <View key={`booking-list-${booking.id || `idx-${index}`}-${booking.date || index}`} style={styles.bookingCard}>
              <View style={styles.bookingHeader}>
                <Text style={styles.bookingService}>{booking.service || 'Service'}</Text>
                <Text style={[
                  styles.bookingStatus,
                  (booking.status === 'confirmed' || booking.status === 'approved') && styles.statusConfirmed,
                  booking.status === 'completed' && styles.statusCompleted,
                  (booking.status === 'cancelled' || booking.status === 'not approved') && styles.statusCancelled,
                ]}>
                  {booking.status?.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.bookingDetail}>📅 {booking.date}</Text>
              <Text style={styles.bookingDetail}>🕒 {booking.time}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noBookings}>Belum ada booking</Text>
        )}
      </View>
      </Animated.View>

      {/* Service Modal */}
      <Modal
        visible={showServiceModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowServiceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            activeOpacity={1} 
            onPress={() => setShowServiceModal(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Layanan</Text>
              <TouchableOpacity onPress={() => setShowServiceModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={services}
              keyExtractor={(item, index) => `service-modal-${item.id || index}-${Math.random()}`}
              renderItem={({ item }) => {
                const isSelected = selectedService && item && selectedService.name === item.name;
                return (
                  <TouchableOpacity
                    style={[
                      styles.modalItem,
                      isSelected && styles.modalItemSelected
                    ]}
                    onPress={() => {
                      console.log('Service selected:', item);
                      setSelectedService(item);
                      setShowServiceModal(false);
                    }}
                  >
                    <View style={styles.modalItemContent}>
                      <Text style={[
                        styles.modalItemText,
                        isSelected && styles.modalItemTextSelected
                      ]}>
                        {item.name}
                      </Text>
                      <Text style={[
                        styles.modalItemPrice,
                        isSelected && styles.modalItemTextSelected
                      ]}>
                        Rp {item.price?.toLocaleString('id-ID')}
                      </Text>
                    </View>
                    {isSelected && (
                      <Text style={styles.checkMark}>✓</Text>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Capster Modal */}
      <Modal
        visible={showCapsterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCapsterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            activeOpacity={1} 
            onPress={() => setShowCapsterModal(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Capster (Opsional)</Text>
              <TouchableOpacity onPress={() => setShowCapsterModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[
                styles.modalItem,
                !selectedCapster && styles.modalItemSelected
              ]}
              onPress={() => {
                setSelectedCapster(null);
                setShowCapsterModal(false);
              }}
            >
              <Text style={[
                styles.modalItemText,
                !selectedCapster && styles.modalItemTextSelected
              ]}>
                Tidak memilih capster
              </Text>
              {!selectedCapster && (
                <Text style={styles.checkMark}>✓</Text>
              )}
            </TouchableOpacity>
            <FlatList
              data={capsters}
              keyExtractor={(item, index) => `capster-modal-${item.id || index}-${Math.random()}`}
              renderItem={({ item }) => {
                const isSelected = selectedCapster && item && selectedCapster.name === item.name;
                // Map capster images from assets
                const capsterImages = {
                  1: require('../../assets/capster-1.png'),
                  2: require('../../assets/capster-2.png'),
                  3: require('../../assets/capster-3.png'),
                };
                
                return (
                  <TouchableOpacity
                    style={[
                      styles.modalItem,
                      isSelected && styles.modalItemSelected
                    ]}
                    onPress={() => {
                      console.log('Capster selected:', item);
                      setSelectedCapster(item);
                      setShowCapsterModal(false);
                    }}
                  >
                    {capsterImages[item.id] && (
                      <Image
                        source={capsterImages[item.id]}
                        style={styles.capsterModalImage}
                        resizeMode="cover"
                      />
                    )}
                    <View style={styles.capsterModalInfo}>
                      <Text style={[
                        styles.modalItemText,
                        isSelected && styles.modalItemTextSelected
                      ]}>
                        {item.name}
                      </Text>
                      {item.alias && (
                        <Text style={styles.capsterAlias}>@{item.alias}</Text>
                      )}
                    </View>
                    {isSelected && (
                      <Text style={styles.checkMark}>✓</Text>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Loading Screen Overlay */}
      {(initialLoading || loading) && (
        <LoadingScreen 
          message={initialLoading ? 'Memuat data...' : 'Memproses booking...'}
        />
      )}
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
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textLight,
    marginBottom: 8,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#f5f5f5',
  },
  form: {
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
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: 8,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 8,
    padding: 14,
    backgroundColor: Colors.bgColor,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: Colors.textDark,
    flex: 1,
  },
  placeholderText: {
    color: '#999',
  },
  dropdownIcon: {
    fontSize: 12,
    color: Colors.textDark,
    marginLeft: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 8,
    backgroundColor: Colors.bgColor,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 8,
    padding: 14,
    backgroundColor: Colors.bgColor,
  },
  dateButtonText: {
    fontSize: 16,
    color: Colors.textDark,
  },
  submitButton: {
    backgroundColor: Colors.accentColor,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: Colors.textLight,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  bookingsSection: {
    padding: 20,
    marginTop: 20,
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
  noBookings: {
    fontSize: 16,
    color: Colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.bgColor,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textDark,
  },
  modalClose: {
    fontSize: 24,
    color: Colors.textMuted,
    fontWeight: '300',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
    backgroundColor: '#FFFFFF',
  },
  modalItemSelected: {
    backgroundColor: `${Colors.accentColor}25`,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accentColor,
  },
  modalItemContent: {
    flex: 1,
  },
  modalItemText: {
    fontSize: 16,
    color: Colors.textDark,
    marginBottom: 4,
  },
  modalItemPrice: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  modalItemTextSelected: {
    color: Colors.accentColor,
    fontWeight: '600',
  },
  checkMark: {
    fontSize: 20,
    color: Colors.accentColor,
    fontWeight: '700',
  },
  capsterModalImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  capsterModalInfo: {
    flex: 1,
  },
  capsterAlias: {
    fontSize: 14,
    color: Colors.textMuted,
  },
});

export default BookingScreen;

import React, { useEffect, useMemo, useState, useRef } from 'react';
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
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showCapsterModal, setShowCapsterModal] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [reservedSlots, setReservedSlots] = useState([]);
  const [slotLoading, setSlotLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState('');
  const { user, signOut } = useAuth();
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Prebuild 30-minute slots (09:00 - 20:30 by default)
  const timeSlots = useMemo(() => {
    const slots = [];
    const startHour = 9;
    const endHour = 20;
    const intervalMinutes = 30;

    let cursor = new Date();
    cursor.setHours(startHour, 0, 0, 0);

    const limit = new Date();
    // Include the last half-hour slot (e.g., 20:30)
    limit.setHours(endHour, intervalMinutes, 0, 0);

    while (cursor <= limit) {
      const hours = cursor.getHours().toString().padStart(2, '0');
      const minutes = cursor.getMinutes().toString().padStart(2, '0');
      slots.push(`${hours}:${minutes}`);
      cursor = new Date(cursor.getTime() + intervalMinutes * 60 * 1000);
    }

    return slots;
  }, []);

  const fetchData = async () => {
    try {
      const [servicesRes, capstersRes] = await Promise.all([
        api.getServices(),
        api.getCapsters(),
      ]);
      
      console.log('Services fetched: Total', servicesRes?.data?.length, 'items');
      console.log('Capsters fetched: Total', capstersRes?.data?.length, 'capsters');
      if (capstersRes?.data?.length > 0) {
        console.log('Capster IDs:', capstersRes.data.map(c => `${c.id}:${c.name}`).join(', '));
      }
      
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

  const loadAvailability = async (targetDate = selectedDate, capster = selectedCapster) => {
    if (!targetDate) {
      setReservedSlots([]);
      return;
    }

    setSlotLoading(true);
    try {
      const dateStr = formatDateForApi(targetDate);
      
      if (capster) {
        // Single capster selected - check their availability
        console.log('Calling API with:', { date: dateStr, capsterId: capster.id, statuses: ['pending', 'approved'] });
        const res = await api.getAppointmentsByDate({ date: dateStr, capsterId: capster.id });
        console.log('API response for capster', capster.name, ':', JSON.stringify(res, null, 2));
        const takenSlots = (res?.data || []).map((item) => {
          const t = item.time || '';
          return t.length > 5 ? t.slice(0, 5) : t;
        });
        console.log('Reserved slots for capster', capster.name, ':', takenSlots);
        setReservedSlots(takenSlots);
        console.log('Final reserved slots set:', takenSlots.length, 'slots');
      } else {
        // No capster selected - check all capsters and mark slots booked if ALL are taken
        // First, refresh capster list to ensure we have the latest data
        try {
          const freshCapstersRes = await api.getCapsters();
          const freshCapsters = freshCapstersRes?.data || [];
          console.log('Refreshed capsters for all-check:', freshCapsters.length, 'capsters');
          
          if (freshCapsters.length === 0) {
            setReservedSlots([]);
            return;
          }
          
          console.log('Checking all capsters - total count:', freshCapsters.length);
          
          // Fetch appointments for all capsters using the fresh list
          const allPromises = freshCapsters.map(c => 
            api.getAppointmentsByDate({ date: dateStr, capsterId: c.id })
              .then(res => {
                const slots = (res?.data || []).map(item => {
                  const t = item.time || '';
                  return t.length > 5 ? t.slice(0, 5) : t;
                });
                console.log(`Capster ${c.name} (${c.id}) slots:`, slots);
                return { capsterId: c.id, capsterName: c.name, slots };
              })
              .catch(err => {
                console.error(`Error fetching for capster ${c.name}:`, err);
                return { capsterId: c.id, capsterName: c.name, slots: [] };
              })
          );
          
          const results = await Promise.all(allPromises);
          console.log('All capster results:', results);
          
          // Count how many capsters have each slot booked
          const slotCounts = {};
          results.forEach(({ slots }) => {
            slots.forEach(slot => {
              slotCounts[slot] = (slotCounts[slot] || 0) + 1;
            });
          });
          
          console.log('Slot counts map:', slotCounts);
          console.log('Total capsters:', freshCapsters.length);
          
          // Mark slot as reserved if ALL capsters are booked
          const fullyBookedSlots = Object.keys(slotCounts).filter(
            slot => {
              const isFullyBooked = slotCounts[slot] >= freshCapsters.length;
              console.log(`Slot ${slot}: ${slotCounts[slot]}/${freshCapsters.length} capsters booked - ${isFullyBooked ? 'BOOKED' : 'AVAILABLE'}`);
              return isFullyBooked;
            }
          );
          console.log('All capsters check - fully booked slots:', fullyBookedSlots);
          setReservedSlots(fullyBookedSlots);
          console.log('Final reserved slots set:', fullyBookedSlots.length, 'slots');
        } catch (err) {
          console.error('Error in all-capsters check:', err);
          setReservedSlots([]);
        }
      }
    } catch (error) {
      console.error('Error fetching slot availability:', error);
      setReservedSlots([]);
      console.log('Final reserved slots set: 0 slots (error)');
    } finally {
      setSlotLoading(false);
    }
  };

  useEffect(() => {
    console.log('BookingScreen mounted, user:', JSON.stringify(user));
    fetchData();
    if (route.params?.serviceId) {
      setSelectedService(route.params.serviceId);
    }
  }, [user]);

  useEffect(() => {
    // Refresh slot availability whenever date or capster changes
    setSelectedTimeSlot(null);
    loadAvailability();
  }, [selectedDate, selectedCapster]);

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

  const formatDateForApi = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isSlotInPast = (slot) => {
    if (!selectedDate) return false;
    const now = new Date();
    const candidate = new Date(selectedDate);
    const [hour, minute] = slot.split(':').map((v) => parseInt(v, 10));
    candidate.setHours(hour, minute, 0, 0);
    return candidate < now;
  };

  const isSlotTaken = (slot) => reservedSlots.includes(slot);

  const isSlotDisabled = (slot) => isSlotTaken(slot) || isSlotInPast(slot);

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
      await signOut?.();
      // AppNavigator will automatically show Login screen
      return;
    }
    
    // Check if user has ID
    if (!user.id) {
      console.error('User object exists but ID is missing:', user);
      Alert.alert('Error', 'Data user tidak lengkap. Silakan login kembali.');
      await signOut?.();
      // AppNavigator will automatically show Login screen
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

    if (!selectedTimeSlot) {
      Alert.alert('Error', 'Mohon pilih jam kunjungan.');
      return;
    }

    if (!phoneNumber || phoneNumber.trim() === '') {
      Alert.alert(
        'Nomor Telepon Wajib Diisi', 
        'Mohon masukkan nomor telepon Anda.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (isSlotTaken(selectedTimeSlot)) {
      Alert.alert('Penuh', 'Jam tersebut sudah dibooking. Silakan pilih jam lain.');
      return;
    }

    setLoading(true);
    try {
      const appointmentDate = formatDateForApi(selectedDate);
      const appointmentTime = selectedTimeSlot;
      
      const appointmentData = {
        name: user.name,
        email: user.email,
        phone: phoneNumber.trim(),
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
      setSelectedTimeSlot(null);
      setReservedSlots([]);
      await fetchData();
      await loadAvailability(new Date(), null);
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

        {/* Phone Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nomor Telepon *</Text>
          <TextInput
            style={styles.phoneInput}
            placeholder="Masukkan nomor telepon Anda"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            maxLength={15}
          />
        </View>

        {/* Capster Dropdown */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Pilih Capster *</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowCapsterModal(true)}
          >
            <Text style={[styles.dropdownButtonText, !selectedCapster && styles.placeholderText]}>
              {selectedCapster ? selectedCapster.name : 'Tidak memilih'}
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
          <View style={styles.slotGrid}>
            {timeSlots.map((slot) => {
              const selected = selectedTimeSlot === slot;
              const disabled = isSlotDisabled(slot);
              const taken = isSlotTaken(slot);

              return (
                <TouchableOpacity
                  key={`slot-${slot}`}
                  style={[
                    styles.slotButton,
                    selected && styles.slotButtonSelected,
                    disabled && styles.slotButtonDisabled,
                    taken && styles.slotButtonTaken,
                  ]}
                  onPress={() => setSelectedTimeSlot(slot)}
                  disabled={disabled}
                >
                  <Text
                    style={[
                      styles.slotText,
                      selected && styles.slotTextSelected,
                      disabled && styles.slotTextDisabled,
                    ]}
                  >
                    {slot}
                  </Text>
                  {taken && <Text style={styles.slotTag}>BOOKED</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
          {slotLoading && <Text style={styles.slotHelper}>Memuat ketersediaan...</Text>}
          {!selectedCapster && !slotLoading && (
            <Text style={styles.slotHelper}>Slot bertanda BOOKED berarti semua capster sudah dibooking di jam tersebut.</Text>
          )}
          {selectedCapster && !slotLoading && (
            <Text style={styles.slotHelper}>Slot bertanda BOOKED tidak dapat dipilih untuk capster ini.</Text>
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
              {booking.capsterName && (
                <Text style={styles.bookingDetail}>👤 Capster: {booking.capsterName}</Text>
              )}
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
              <Text style={styles.modalTitle}>Pilih Capster</Text>
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
  phoneInput: {
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 8,
    padding: 14,
    backgroundColor: Colors.bgColor,
    fontSize: 16,
    color: Colors.textDark,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  slotButton: {
    width: '30%',
    marginRight: 8,
    marginBottom: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: Colors.bgColor,
  },
  slotButtonSelected: {
    backgroundColor: Colors.accentColor,
    borderColor: Colors.accentColor,
  },
  slotButtonDisabled: {
    opacity: 0.5,
  },
  slotButtonTaken: {
    borderColor: '#F44336',
  },
  slotText: {
    fontSize: 14,
    color: Colors.textDark,
    fontWeight: '600',
  },
  slotTextSelected: {
    color: Colors.textLight,
  },
  slotTextDisabled: {
    color: '#9E9E9E',
  },
  slotTag: {
    marginTop: 6,
    fontSize: 10,
    color: '#F44336',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  slotHelper: {
    marginTop: 6,
    fontSize: 12,
    color: Colors.textMuted,
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

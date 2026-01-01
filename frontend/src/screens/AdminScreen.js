import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../config/api';
import { useAuth } from '../context/AuthContext';

const AdminScreen = () => {
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [capsters, setCapsters] = useState([]);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    pendingAppointments: 0,
    confirmedAppointments: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const { user, signOut } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Apakah Anda yakin ingin keluar?',
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Keluar', 
          onPress: async () => {
            await signOut();
          },
          style: 'destructive'
        }
      ]
    );
  };

  const fetchData = async () => {
    try {
      // Fetch all appointments using API
      const appointmentsRes = await api.getAllAppointments();
      const appointmentsData = appointmentsRes?.data || [];

      setAppointments(appointmentsData);

      // Calculate stats
      const total = appointmentsData.length;
      const pending = appointmentsData.filter(a => a.status === 'pending').length;
      const confirmed = appointmentsData.filter(a => a.status === 'confirmed' || a.status === 'approved').length;

      setStats({
        totalAppointments: total,
        pendingAppointments: pending,
        confirmedAppointments: confirmed,
      });

      // Fetch services using API
      const servicesRes = await api.getServices();
      setServices(servicesRes?.data || []);

      // Fetch capsters using API
      const capstersRes = await api.getCapsters();
      setCapsters(capstersRes?.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSubtitle}>Selamat datang, {user?.name || 'Admin'}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Statistics */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalAppointments}</Text>
          <Text style={styles.statLabel}>Total Bookings</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.pendingAppointments}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.confirmedAppointments}</Text>
          <Text style={styles.statLabel}>Confirmed</Text>
        </View>
      </View>

      {/* Recent Appointments */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Appointments</Text>
        {appointments.length > 0 ? (
          appointments.slice(0, 10).map((appointment) => (
            <View key={appointment.id} style={styles.appointmentCard}>
              <Text style={styles.appointmentCustomer}>
                {appointment.name || 'Unknown'}
              </Text>
              <Text style={styles.appointmentDetail}>
                Email: {appointment.email || 'N/A'}
              </Text>
              <Text style={styles.appointmentDetail}>
                Service: {appointment.service || 'N/A'}
              </Text>
              <Text style={styles.appointmentDetail}>
                Phone: {appointment.phone || 'N/A'}
              </Text>
              <Text style={styles.appointmentDetail}>
                Date: {appointment.date} at {appointment.time}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  (appointment.status === 'confirmed' || appointment.status === 'approved') && styles.statusConfirmed,
                  appointment.status === 'pending' && styles.statusPending,
                  (appointment.status === 'cancelled' || appointment.status === 'not approved') && styles.statusCancelled,
                ]}
              >
                <Text style={styles.statusText}>
                  {appointment.status?.toUpperCase()}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noData}>No appointments yet</Text>
        )}
      </View>

      {/* Services List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Services ({services.length})</Text>
        {services.length > 0 ? (
          services.map((service) => (
            <View key={service.id} style={styles.itemCard}>
              <Text style={styles.itemName}>{service.name}</Text>
              <Text style={styles.itemPrice}>
                Rp {service.price?.toLocaleString('id-ID')}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.noData}>No services available</Text>
        )}
      </View>

      {/* Capsters List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Team Members ({capsters.length})</Text>
        {capsters.length > 0 ? (
          capsters.map((capster) => (
            <View key={capster.id} style={styles.itemCard}>
              <Text style={styles.itemName}>{capster.name}</Text>
              <Text style={styles.itemDetail}>
                Experience: {capster.experience} years
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.noData}>No team members available</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#C6A96E',
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    marginTop: 4,
    opacity: 0.9,
  },
  logoutButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: '#f9f9f9',
  },
  statCard: {
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  appointmentCard: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  appointmentCustomer: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  appointmentDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statusBadge: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusConfirmed: {
    backgroundColor: '#4CAF50',
  },
  statusPending: {
    backgroundColor: '#FFA726',
  },
  statusCancelled: {
    backgroundColor: '#EF5350',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  itemCard: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4513',
  },
  itemDetail: {
    fontSize: 14,
    color: '#666',
  },
  noData: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
});

export default AdminScreen;

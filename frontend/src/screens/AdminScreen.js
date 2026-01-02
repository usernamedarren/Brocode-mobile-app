import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../config/api';
import { useAuth } from '../context/AuthContext';

const AdminScreen = () => {
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [capsters, setCapsters] = useState([]);
  const [serviceForm, setServiceForm] = useState({ name: '', description: '', price: '', type: '' });
  const [capsterForm, setCapsterForm] = useState({ name: '', alias: '', description: '', instaAcc: '' });
  const [editingServiceName, setEditingServiceName] = useState(null);
  const [editingCapsterId, setEditingCapsterId] = useState(null);
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

  const resetServiceForm = () => { setServiceForm({ name: '', description: '', price: '', type: '' }); setEditingServiceName(null); };
  const resetCapsterForm = () => { setCapsterForm({ name: '', alias: '', description: '', instaAcc: '' }); setEditingCapsterId(null); };

  const saveService = async () => {
    if (!serviceForm.name) return Alert.alert('Error', 'Nama service wajib diisi');
    try {
      if (editingServiceName) {
        await api.updateService(editingServiceName, {
          description: serviceForm.description,
          price: Number(serviceForm.price) || 0,
          type: serviceForm.type,
        });
        Alert.alert('Sukses', 'Service diperbarui');
      } else {
        await api.createService({
          name: serviceForm.name,
          description: serviceForm.description,
          price: Number(serviceForm.price) || 0,
          type: serviceForm.type,
        });
        Alert.alert('Sukses', 'Service ditambahkan');
      }
      resetServiceForm();
      await fetchData();
    } catch (e) {
      Alert.alert('Error', e.message || 'Gagal menyimpan service');
    }
  };

  const deleteServiceItem = async (name) => {
    Alert.alert('Hapus Service', `Hapus service ${name}?`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: async () => {
        try {
          await api.deleteService(name);
          await fetchData();
        } catch (e) {
          Alert.alert('Error', e.message || 'Gagal menghapus service');
        }
      }}
    ]);
  };

  const saveCapster = async () => {
    if (!capsterForm.name) return Alert.alert('Error', 'Nama capster wajib diisi');
    try {
      if (editingCapsterId) {
        await api.updateCapster(editingCapsterId, capsterForm);
        Alert.alert('Sukses', 'Capster diperbarui');
      } else {
        await api.createCapster(capsterForm);
        Alert.alert('Sukses', 'Capster ditambahkan');
      }
      resetCapsterForm();
      await fetchData();
    } catch (e) {
      Alert.alert('Error', e.message || 'Gagal menyimpan capster');
    }
  };

  const deleteCapsterItem = async (id, name) => {
    Alert.alert('Hapus Capster', `Hapus capster ${name || id}?`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: async () => {
        try {
          await api.deleteCapster(id);
          await fetchData();
        } catch (e) {
          Alert.alert('Error', e.message || 'Gagal menghapus capster');
        }
      }}
    ]);
  };

  const updateAppointmentStatus = async (id, status) => {
    try {
      await api.updateAppointment(id, { status });
      await fetchData();
    } catch (e) {
      Alert.alert('Error', e.message || 'Gagal memperbarui appointment');
    }
  };

  const deleteAppointmentItem = async (id) => {
    Alert.alert('Hapus Appointment', 'Yakin ingin menghapus?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: async () => {
        try {
          await api.deleteAppointment(id);
          await fetchData();
        } catch (e) {
          Alert.alert('Error', e.message || 'Gagal menghapus appointment');
        }
      }}
    ]);
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
          appointments.slice(0, 10).map((appointment, idx) => (
            <View key={appointment.id ?? `${appointment.email || 'appt'}-${appointment.date}-${appointment.time}-${idx}`} style={styles.appointmentCard}>
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
              <View style={styles.rowActions}>
                <TouchableOpacity style={[styles.smallButton, styles.buttonApprove]} onPress={() => updateAppointmentStatus(appointment.id, 'approved')}>
                  <Text style={styles.smallButtonText}>APPROVE</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.smallButton, styles.buttonReject]} onPress={() => updateAppointmentStatus(appointment.id, 'not approved')}>
                  <Text style={styles.smallButtonText}>REJECT</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.smallButton, styles.buttonDelete]} onPress={() => deleteAppointmentItem(appointment.id)}>
                  <Text style={styles.smallButtonText}>DELETE</Text>
                </TouchableOpacity>
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
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{editingServiceName ? 'Edit Service' : 'Tambah Service'}</Text>
          <TextInput
            style={styles.input}
            placeholder="Nama"
            value={serviceForm.name}
            onChangeText={(t) => setServiceForm({ ...serviceForm, name: t })}
          />
          <TextInput
            style={styles.input}
            placeholder="Deskripsi"
            value={serviceForm.description}
            onChangeText={(t) => setServiceForm({ ...serviceForm, description: t })}
          />
          <TextInput
            style={styles.input}
            placeholder="Harga"
            keyboardType="numeric"
            value={serviceForm.price}
            onChangeText={(t) => setServiceForm({ ...serviceForm, price: t })}
          />
          <TextInput
            style={styles.input}
            placeholder="Tipe"
            value={serviceForm.type}
            onChangeText={(t) => setServiceForm({ ...serviceForm, type: t })}
          />
          <TouchableOpacity style={styles.primaryButton} onPress={saveService}>
            <Text style={styles.primaryButtonText}>{editingServiceName ? 'UPDATE SERVICE' : 'SIMPAN SERVICE'}</Text>
          </TouchableOpacity>
          {editingServiceName && (
            <TouchableOpacity style={styles.cancelEdit} onPress={resetServiceForm}>
              <Text style={styles.cancelEditText}>Batal edit</Text>
            </TouchableOpacity>
          )}
        </View>
        {services.length > 0 ? (
          services.map((service, idx) => (
            <View key={service.id ?? service.name ?? `svc-${idx}`} style={styles.itemCard}>
              <Text style={styles.itemName}>{service.name}</Text>
              <Text style={styles.itemPrice}>
                Rp {service.price?.toLocaleString('id-ID')}
              </Text>
              <View style={styles.rowActions}>
                <TouchableOpacity
                  style={[styles.smallButton, styles.buttonApprove]}
                  onPress={() => {
                    setEditingServiceName(service.name);
                    setServiceForm({
                      name: service.name || '',
                      description: service.description || '',
                      price: String(service.price || ''),
                      type: service.type || '',
                    });
                  }}
                >
                  <Text style={styles.smallButtonText}>EDIT</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.smallButton, styles.buttonDelete]} onPress={() => deleteServiceItem(service.name)}>
                  <Text style={styles.smallButtonText}>DELETE</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noData}>No services available</Text>
        )}
      </View>

      {/* Capsters List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Team Members ({capsters.length})</Text>
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{editingCapsterId ? 'Edit Capster' : 'Tambah Capster'}</Text>
          <TextInput
            style={styles.input}
            placeholder="Nama"
            value={capsterForm.name}
            onChangeText={(t) => setCapsterForm({ ...capsterForm, name: t })}
          />
          <TextInput
            style={styles.input}
            placeholder="Alias"
            value={capsterForm.alias}
            onChangeText={(t) => setCapsterForm({ ...capsterForm, alias: t })}
          />
          <TextInput
            style={styles.input}
            placeholder="Deskripsi"
            value={capsterForm.description}
            onChangeText={(t) => setCapsterForm({ ...capsterForm, description: t })}
          />
          <TextInput
            style={styles.input}
            placeholder="Instagram"
            value={capsterForm.instaAcc}
            onChangeText={(t) => setCapsterForm({ ...capsterForm, instaAcc: t })}
          />
          <TouchableOpacity style={styles.primaryButton} onPress={saveCapster}>
            <Text style={styles.primaryButtonText}>{editingCapsterId ? 'UPDATE CAPSTER' : 'SIMPAN CAPSTER'}</Text>
          </TouchableOpacity>
          {editingCapsterId && (
            <TouchableOpacity style={styles.cancelEdit} onPress={resetCapsterForm}>
              <Text style={styles.cancelEditText}>Batal edit</Text>
            </TouchableOpacity>
          )}
        </View>
        {capsters.length > 0 ? (
          capsters.map((capster, idx) => (
            <View key={capster.id ?? capster.alias ?? `capster-${idx}`} style={styles.itemCard}>
              <Text style={styles.itemName}>{capster.name}</Text>
              <Text style={styles.itemDetail}>
                Alias: {capster.alias}
              </Text>
              <View style={styles.rowActions}>
                <TouchableOpacity
                  style={[styles.smallButton, styles.buttonApprove]}
                  onPress={() => {
                    setEditingCapsterId(capster.id);
                    setCapsterForm({
                      name: capster.name || '',
                      alias: capster.alias || '',
                      description: capster.description || '',
                      instaAcc: capster.instaAcc || '',
                    });
                  }}
                >
                  <Text style={styles.smallButtonText}>EDIT</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.smallButton, styles.buttonDelete]} onPress={() => deleteCapsterItem(capster.id, capster.name)}>
                  <Text style={styles.smallButtonText}>DELETE</Text>
                </TouchableOpacity>
              </View>
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
  rowActions: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
    flexWrap: 'wrap',
  },
  smallButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  smallButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  buttonApprove: {
    backgroundColor: '#4CAF50',
  },
  buttonReject: {
    backgroundColor: '#FFA726',
  },
  buttonDelete: {
    backgroundColor: '#EF5350',
  },
  formCard: {
    backgroundColor: '#f2f2f2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  formTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  primaryButton: {
    backgroundColor: '#8B4513',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  cancelEdit: {
    marginTop: 8,
    alignItems: 'center',
  },
  cancelEditText: {
    color: '#b91c1c',
    fontWeight: '700',
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

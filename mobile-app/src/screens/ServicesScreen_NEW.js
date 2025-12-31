import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Colors } from '../styles/theme';
import { api } from '../config/api';

const ServicesScreen = ({ navigation }) => {
  const [services, setServices] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchServices = async () => {
    try {
      const response = await api.getServices();
      setServices(response?.data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchServices();
    setRefreshing(false);
  };

  const renderService = ({ item }) => (
    <View style={styles.serviceCard}>
      <Text style={styles.serviceName}>{item.name}</Text>
      <Text style={styles.servicePrice}>Rp {item.price?.toLocaleString('id-ID')}</Text>
      <Text style={styles.serviceDescription}>{item.description}</Text>
      {item.duration && (
        <Text style={styles.serviceDuration}>⏱️ {item.duration} menit</Text>
      )}
      <TouchableOpacity
        style={styles.bookButton}
        onPress={() => navigation.navigate('Booking', { serviceId: item.id })}
      >
        <Text style={styles.bookButtonText}>BOOKING</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>LAYANAN KAMI</Text>
        <Text style={styles.headerSubtitle}>Pilih layanan grooming premium Anda</Text>
      </View>

      <FlatList
        data={services}
        renderItem={renderService}
        keyExtractor={(item) => item.id?.toString()}
        numColumns={2}
        contentContainerStyle={styles.grid}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Belum ada layanan tersedia</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgColor,
  },
  header: {
    backgroundColor: Colors.accentColor,
    padding: 30,
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
    textAlign: 'center',
  },
  grid: {
    padding: 16,
  },
  serviceCard: {
    flex: 1,
    backgroundColor: Colors.cardBg,
    borderRadius: 12,
    padding: 20,
    margin: 8,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: 8,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.accentColor,
    marginBottom: 12,
  },
  serviceDescription: {
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 20,
    marginBottom: 12,
  },
  serviceDuration: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 16,
  },
  bookButton: {
    backgroundColor: Colors.accentColor,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignItems: 'center',
  },
  bookButtonText: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
});

export default ServicesScreen;

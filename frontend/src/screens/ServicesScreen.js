import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  FlatList,
  Animated,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../styles/theme';
import { api } from '../config/api';
import { useAuth } from '../context/AuthContext';

// Animated Card Component
const AnimatedServiceCard = ({ item, index, navigation, shouldAnimate }) => {
  const { user } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  
  useEffect(() => {
    if (shouldAnimate) {
      // Reset animation
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      
      // Trigger animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          delay: index * 100,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          delay: index * 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [shouldAnimate]);

  return (
    <Animated.View
      style={[
        styles.serviceCard,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={styles.cardContent}>
        <Text style={styles.serviceName}>{item.name}</Text>
        <Text style={styles.servicePrice}>Rp {item.price?.toLocaleString('id-ID')}</Text>
        <Text style={styles.serviceDescription} numberOfLines={3}>{item.description}</Text>
        {item.duration && (
          <Text style={styles.serviceDuration}>⏱️ {item.duration} menit</Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.bookButton}
        onPress={() => {
          if (user) {
            navigation.navigate('Booking', { serviceId: item.id });
          } else {
            navigation.navigate('Login');
          }
        }}
      >
        <Text style={styles.bookButtonText}>BOOKING</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const ServicesScreen = ({ navigation }) => {
  const [services, setServices] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const headerFadeAnim = useRef(new Animated.Value(0)).current;
  const headerSlideAnim = useRef(new Animated.Value(-50)).current;

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

  // Reset and trigger animations when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Reset animations
      headerFadeAnim.setValue(0);
      headerSlideAnim.setValue(-50);
      setShouldAnimate(false);
      
      // Trigger header animation
      Animated.parallel([
        Animated.timing(headerFadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(headerSlideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Trigger card animations after header
        setShouldAnimate(true);
      });
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchServices();
    setRefreshing(false);
  };

  const renderService = ({ item, index }) => (
    <AnimatedServiceCard item={item} index={index} navigation={navigation} shouldAnimate={shouldAnimate} />
  );

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: headerFadeAnim,
            transform: [{ translateY: headerSlideAnim }],
          }
        ]}
      >
        <Text style={styles.headerTitle}>LAYANAN KAMI</Text>
        <Text style={styles.headerSubtitle}>Pilih layanan grooming premium Anda</Text>
      </Animated.View>

      <FlatList
        data={services}
        renderItem={renderService}
        keyExtractor={(item, index) => `service-${item.id || index}-${Math.random()}`}
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
    minHeight: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    justifyContent: 'space-between',
  },
  cardContent: {
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: 8,
    minHeight: 24,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.accentColor,
    marginBottom: 12,
    minHeight: 20,
  },
  serviceDescription: {
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 20,
    marginBottom: 12,
    flex: 1,
  },
  serviceDuration: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 16,
    minHeight: 18,
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

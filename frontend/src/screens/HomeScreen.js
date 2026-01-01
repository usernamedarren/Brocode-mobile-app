import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  RefreshControl,
  ImageBackground,
  Dimensions,
  Animated,
  Modal,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import { Colors, CommonStyles } from '../styles/theme';
import { api } from '../config/api';
import { useAuth } from '../context/AuthContext';
import FloatingHeader from '../components/FloatingHeader';

const { width, height } = Dimensions.get('window');

const AnimatedSection = ({ children, style, delay = 0, direction = 'left', shouldReset = true }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(direction === 'left' ? -50 : 50)).current;

  const triggerAnimation = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: delay * 0.3,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 60,
        friction: 8,
        delay: delay * 0.3,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    if (shouldReset) {
      triggerAnimation();
    }
  }, [shouldReset]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

const AnimatedCard = ({ children, index, style, shouldReset = true }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  
  const triggerAnimation = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 7,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    if (shouldReset) {
      triggerAnimation();
    }
  }, [shouldReset]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

const HomeScreen = ({ navigation }) => {
  const [services, setServices] = useState([]);
  const [capsters, setCapsters] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [selectedCapster, setSelectedCapster] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadingInstagram, setLoadingInstagram] = useState(false);
  const { user } = useAuth();
  const heroFadeAnim = useRef(new Animated.Value(0)).current;
  const heroScaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const modalFadeAnim = useRef(new Animated.Value(0)).current;
  const modalScaleAnim = useRef(new Animated.Value(0.8)).current;
  const [instagramModalVisible, setInstagramModalVisible] = useState(false);

  // Header visibility based on scroll position
  const headerOpacity = scrollY.interpolate({
    inputRange: [300, 400],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const preloadImages = async () => {
    try {
      const imageAssets = [
        require('../../assets/home-bg.png'),
        require('../../assets/capster-1.png'),
        require('../../assets/capster-2.png'),
        require('../../assets/capster-3.png'),
      ];
      
      await Promise.all(
        imageAssets.map(image => Asset.fromModule(image).downloadAsync())
      );
      
      setImagesLoaded(true);
    } catch (error) {
      console.log('Error preloading images:', error);
      setImagesLoaded(true);
    }
  };

  const navigateCapster = (direction) => {
    if (!selectedCapster || capsters.length === 0) return;
    
    const currentIndex = capsters.findIndex(c => c.id === selectedCapster.id);
    let newIndex;
    
    if (direction === 'next') {
      newIndex = currentIndex + 1 >= capsters.length ? 0 : currentIndex + 1;
    } else {
      newIndex = currentIndex - 1 < 0 ? capsters.length - 1 : currentIndex - 1;
    }
    
    setSelectedCapster(capsters[newIndex]);
  };

  const getInstagramUrl = (capsterId) => {
    const instagramUrls = {
      1: 'https://www.instagram.com/rickybro_code',
      2: 'https://www.instagram.com/fikslem',
      3: 'https://www.instagram.com/anggaprnma__',
    };
    return instagramUrls[capsterId] || null;
  };

  const openInstagram = async (capsterId) => {
    const url = getInstagramUrl(capsterId);
    if (url) {
      setLoadingInstagram(true);

      Alert.alert(
        'Membuka Instagram',
        'Mengarahkan ke profil Instagram...',
        [],
        { cancelable: false }
      );
      
      // Small delay to show alert
      setTimeout(async () => {
        try {
          const canOpen = await Linking.canOpenURL(url);
          if (canOpen) {
            await Linking.openURL(url);
          }
        } catch (error) {
          Alert.alert('Error', 'Tidak dapat membuka Instagram');
        } finally {
          setLoadingInstagram(false);
        }
      }, 500);
    }
  };

  const fetchData = async (forceRefresh = false) => {
    try {
      // Load from cache first if not force refresh
      if (!forceRefresh) {
        const cachedServices = await AsyncStorage.getItem('cached_services');
        const cachedCapsters = await AsyncStorage.getItem('cached_capsters');
        
        if (cachedServices) {
          setServices(JSON.parse(cachedServices));
        }
        if (cachedCapsters) {
          setCapsters(JSON.parse(cachedCapsters));
        }
      }
      
      // Fetch fresh data in background
      const [servicesRes, capstersRes] = await Promise.all([
        api.getServices(),
        api.getCapsters(),
      ]);
      
      const newServices = servicesRes?.data || [];
      const newCapsters = capstersRes?.data || [];
      
      setServices(newServices);
      setCapsters(newCapsters);
      
      // Update cache
      await AsyncStorage.setItem('cached_services', JSON.stringify(newServices));
      await AsyncStorage.setItem('cached_capsters', JSON.stringify(newCapsters));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    preloadImages();
    fetchData();
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      heroFadeAnim.setValue(0);
      heroScaleAnim.setValue(0.9);
      
      setShouldAnimate(false);
      
      Animated.parallel([
        Animated.timing(heroFadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(heroScaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        setShouldAnimate(true);
      }, 200);
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData(true);
    setRefreshing(false);
  };

  const openCapsterModal = (capster) => {
    setSelectedCapster(capster);
    setModalVisible(true);
    modalFadeAnim.setValue(0);
    modalScaleAnim.setValue(0.8);
    
    Animated.parallel([
      Animated.timing(modalFadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(modalScaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeCapsterModal = () => {
    Animated.parallel([
      Animated.timing(modalFadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modalScaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
      setSelectedCapster(null);
    });
  };

  const headerTranslate = scrollY.interpolate({
    inputRange: [0, 500],
    outputRange: [0, -250],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <FloatingHeader navigation={navigation} scrollY={scrollY} />
      {!imagesLoaded ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <>
      {/* Fixed Hero Background with Parallax */}
      <Animated.View
        style={[
          styles.heroBackground,
          {
            transform: [{ translateY: headerTranslate }],
          },
        ]}
      >
        <ImageBackground
          source={require('../../assets/home-bg.png')}
          style={styles.heroBackgroundImage}
          resizeMode="cover"
        >
          <View style={styles.heroOverlayBackground} />
        </ImageBackground>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={true}
        alwaysBounceVertical={false}
        contentInsetAdjustmentBehavior="never"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Hero Content */}
        <View style={styles.hero}>
          <Animated.View 
            style={[
              styles.heroOverlay,
              {
                opacity: heroFadeAnim,
                transform: [{ scale: heroScaleAnim }],
              }
            ]}
          >
            <Text style={styles.heroTitle}>STAY SHARP AND</Text>
            <Text style={styles.heroTitle}>KEEP HANDSOME,</Text>
            <Text style={styles.heroTitle}>GENTLEMAN!</Text>
            <Text style={styles.heroSubtitle}>
              Cuma butuh 1 jam, upgrade lebih GANTENG!
            </Text>
          <View style={styles.heroButtons}>
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={() => user ? navigation.navigate('Booking') : navigation.navigate('Login')}
            >
              <Text style={styles.btnText}>BOOK AN APPOINTMENT</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={() => navigation.navigate('Services')}
            >
              <Text style={styles.btnTextSecondary}>BROWSE SERVICES</Text>
            </TouchableOpacity>
          </View>
          </Animated.View>
        </View>

      {/* About Section - Animate from left */}
      <AnimatedSection direction="left" delay={100} shouldReset={shouldAnimate}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tentang Kami</Text>
          <Text style={styles.sectionText}>
            Brocode Barbershop adalah tempat di mana gaya bertemu dengan kenyamanan. 
            Kami menawarkan layanan cukur rambut profesional dengan sentuhan modern, 
            menciptakan pengalaman yang tak terlupakan untuk setiap pelanggan.
          </Text>
        </View>
      </AnimatedSection>

      {/* Trust & Experience Section */}
      <AnimatedSection direction="right" delay={150} shouldReset={shouldAnimate}>
        <View style={styles.statsSection}>
          <Text style={styles.statsSectionTitle}>KEPERCAYAAN & PENGALAMAN</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Ionicons name="trophy-outline" size={40} color={Colors.accentColor} style={styles.statIcon} />
              <Text style={styles.statNumber}>20+</Text>
              <Text style={styles.statLabel}>Achievements</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="time-outline" size={40} color={Colors.accentColor} style={styles.statIcon} />
              <Text style={styles.statNumber}>10+</Text>
              <Text style={styles.statLabel}>Years</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="people-outline" size={40} color={Colors.accentColor} style={styles.statIcon} />
              <Text style={styles.statNumber}>5000+</Text>
              <Text style={styles.statLabel}>Client</Text>
            </View>
          </View>
        </View>
      </AnimatedSection>

      {/* Services Preview - Animate from right */}
      <AnimatedSection direction="right" delay={200} shouldReset={shouldAnimate}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Layanan Kami</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.horizontalScroll}
            contentContainerStyle={{ paddingLeft: 20, paddingRight: 20 }}
          >
            {services.length > 0 ? (
              services.slice(0, 4).map((service, index) => (
                <AnimatedCard 
                  key={`service-home-${service.id || index}-${service.name}`}
                  index={index}
                  style={styles.serviceCard}
                  shouldReset={shouldAnimate}
                >
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.servicePrice}>Rp {service.price?.toLocaleString('id-ID')}</Text>
                  <Text style={styles.serviceDesc} numberOfLines={3}>{service.description}</Text>
                </AnimatedCard>
              ))
            ) : (
              <Text style={styles.noData}>Belum ada layanan</Text>
            )}
          </ScrollView>
          <TouchableOpacity
            style={styles.btnOutline}
            onPress={() => navigation.navigate('Services')}
          >
            <Text style={styles.btnOutlineText}>LIHAT SEMUA LAYANAN</Text>
          </TouchableOpacity>
        </View>
      </AnimatedSection>

      {/* Capsters Preview - Animate from left */}
      <AnimatedSection direction="left" delay={300} shouldReset={shouldAnimate}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tim Capster Kami</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.horizontalScroll}
            contentContainerStyle={{ paddingLeft: 20, paddingRight: 20 }}
          >
            {capsters.length > 0 ? (
              capsters.map((capster, index) => {
                const capsterImages = {
                  1: require('../../assets/capster-1.png'),
                  2: require('../../assets/capster-2.png'),
                  3: require('../../assets/capster-3.png'),
                };
                
                return (
                  <AnimatedCard
                    key={`capster-home-${capster.id || index}-${capster.name}`}
                    index={index}
                    style={styles.capsterCard}
                    shouldReset={shouldAnimate}
                  >
                    <TouchableOpacity
                      onPress={() => openCapsterModal(capster)}
                      activeOpacity={0.8}
                    >
                      {capsterImages[capster.id] ? (
                        <Image
                          source={capsterImages[capster.id]}
                          style={styles.capsterImagePhoto}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.capsterImage}>
                          <Text style={styles.capsterInitial}>{capster.name?.[0]}</Text>
                        </View>
                      )}
                      <Text style={styles.capsterName}>{capster.name}</Text>
                      <Text style={styles.capsterAlias}>@{capster.alias || capster.instaAcc}</Text>
                    </TouchableOpacity>
                  </AnimatedCard>
                );
              })
            ) : (
              <Text style={styles.noData}>Belum ada capster</Text>
            )}
          </ScrollView>
        </View>
      </AnimatedSection>

      {/* CTA Section - Animate from bottom */}
      <AnimatedSection direction="left" delay={400} shouldReset={shouldAnimate}>
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Siap untuk Tampil Percaya Diri?</Text>
          <Text style={styles.ctaText}>Booking sekarang dan rasakan pengalaman barbershop terbaik!</Text>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => user ? navigation.navigate('Booking') : navigation.navigate('Login')}
            >
              <Text style={styles.ctaButtonText}>BOOKING SEKARANG</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </AnimatedSection>
      </Animated.ScrollView>
      
      {/* Capster Detail Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closeCapsterModal}
      >
        <View style={styles.modalBackdrop}>
          {/* Backdrop - tap to close */}
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={closeCapsterModal}
          />
          
          {/* Modal Content with Navigation Buttons */}
          <View style={styles.modalContainer}>
            <Animated.View
              style={[
                styles.modalContent,
                {
                  opacity: modalFadeAnim,
                  transform: [{ scale: modalScaleAnim }],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={closeCapsterModal}
              >
                <Ionicons name="close-circle" size={32} color={Colors.textMuted} />
              </TouchableOpacity>
              
              {selectedCapster && (
              <View style={styles.modalBody}>
                {/* Capster Image */}
                {selectedCapster.id && [1, 2, 3].includes(selectedCapster.id) ? (
                  <Image
                    source={
                      selectedCapster.id === 1
                        ? require('../../assets/capster-1.png')
                        : selectedCapster.id === 2
                        ? require('../../assets/capster-2.png')
                        : require('../../assets/capster-3.png')
                    }
                    style={styles.modalCapsterImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.modalCapsterImagePlaceholder}>
                    <Text style={styles.modalCapsterInitial}>
                      {selectedCapster.name?.[0]}
                    </Text>
                  </View>
                )}
                
                {/* Capster Name */}
                <Text style={styles.modalCapsterName}>{selectedCapster.name}</Text>
                
                {/* Alias */}
                {selectedCapster.alias && (
                  <Text style={styles.modalCapsterAlias}>a.k.a {selectedCapster.alias}</Text>
                )}
                
                {/* Description */}
                {selectedCapster.description && (
                  <Text style={styles.modalCapsterDescription}>
                    {selectedCapster.description}
                  </Text>
                )}
                
                {/* Instagram */}
                {(selectedCapster.instaAcc || selectedCapster.alias) && (
                  <TouchableOpacity 
                    style={styles.modalInstagramContainer}
                    onPress={() => openInstagram(selectedCapster.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="logo-instagram" size={20} color={Colors.accentColor} />
                    <Text style={styles.modalInstagramHandle}>
                      @{selectedCapster.instaAcc || selectedCapster.alias}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            </Animated.View>
            
            {/* Navigation Controls Outside Card */}
            {selectedCapster && (
              <Animated.View
                style={[
                  styles.modalNavigationContainer,
                  {
                    opacity: modalFadeAnim,
                  },
                ]}
              >
                {capsters.findIndex(c => c.id === selectedCapster.id) > 0 ? (
                  <TouchableOpacity
                    style={styles.modalNavButton}
                    onPress={() => navigateCapster('prev')}
                  >
                    <Ionicons name="chevron-back" size={28} color={Colors.accentColor} />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.modalNavButton} />
                )}
                
                <Text style={styles.modalNavigationIndicator}>
                  {capsters.findIndex(c => c.id === selectedCapster.id) + 1}/{capsters.length}
                </Text>
                
                {capsters.findIndex(c => c.id === selectedCapster.id) < capsters.length - 1 ? (
                  <TouchableOpacity
                    style={styles.modalNavButton}
                    onPress={() => navigateCapster('next')}
                  >
                    <Ionicons name="chevron-forward" size={28} color={Colors.accentColor} />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.modalNavButton} />
                )}
              </Animated.View>
            )}
          </View>
        </View>
      </Modal>
      </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgColor,
  },
  customHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.accentColor,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 30,
    alignItems: 'center',
    zIndex: 10,
  },
  headerLogo: {
    width: 100,
    height: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bgColor,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textLight,
    fontWeight: '600',
  },
  heroBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height + 50,
    zIndex: 0,
  },
  heroBackgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  heroOverlayBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  scrollView: {
    flex: 1,
    marginTop: -100,
  },
  hero: {
    height: height + 50,
    width: '100%',
    justifyContent: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: 'transparent',
  },
  heroOverlay: {
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textLight,
    lineHeight: 40,
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#e5e5e5',
    marginTop: 16,
    marginBottom: 32,
    lineHeight: 24,
    fontWeight: '600',
  },
  heroButtons: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  btnPrimary: {
    backgroundColor: Colors.accentColor,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    shadowColor: Colors.accentColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.textLight,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  btnText: {
    color: Colors.textLight,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  btnTextSecondary: {
    color: Colors.textLight,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  section: {
    paddingTop: 40,
    paddingBottom: 20,
    backgroundColor: Colors.bgColor,
  },
  sectionTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.textDark,
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  sectionText: {
    fontSize: 16,
    color: Colors.textMuted,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  statsSection: {
    backgroundColor: Colors.darkBgColor,
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  statsSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 35,
    letterSpacing: 1.5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.accentColor,
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textLight,
    textTransform: 'capitalize',
    letterSpacing: 0.5,
    opacity: 0.9,
  },
  horizontalScroll: {
    marginVertical: 20,
  },
  serviceCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 12,
    padding: 20,
    marginRight: 16,
    width: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
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
    marginBottom: 8,
  },
  serviceDesc: {
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 20,
  },
  btnOutline: {
    borderWidth: 2,
    borderColor: Colors.accentColor,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 20,
  },
  btnOutlineText: {
    color: Colors.accentColor,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  capsterCard: {
    marginRight: 20,
    width: 120,
    alignItems: 'center',
  },
  capsterImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.accentColor,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: Colors.accentColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  capsterImagePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  capsterInitial: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.textLight,
  },
  capsterName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
    textAlign: 'center',
    marginBottom: 4,
  },
  capsterAlias: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  ctaSection: {
    backgroundColor: Colors.darkBgColor,
    padding: 40,
    alignItems: 'center',
    marginTop: 0,
  },
  ctaTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 12,
  },
  ctaText: {
    fontSize: 16,
    color: '#e5e5e5',
    textAlign: 'center',
    marginBottom: 24,
  },
  ctaButton: {
    backgroundColor: Colors.accentColor,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 8,
    shadowColor: Colors.accentColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaButtonText: {
    color: Colors.textLight,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  noData: {
    fontSize: 14,
    color: Colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    width: width * 0.85,
    minHeight: 420,
    maxHeight: 420,
    backgroundColor: Colors.cardBg,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 1,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  modalNavigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 30,
  },
  modalNavButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalNavigationIndicator: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textLight,
    minWidth: 50,
    textAlign: 'center',
  },
  modalBody: {
    alignItems: 'center',
    paddingTop: 20,
    flex: 1,
  },
  modalCapsterImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: Colors.accentColor,
  },
  modalCapsterImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.accentColor,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalCapsterInitial: {
    fontSize: 50,
    fontWeight: '700',
    color: Colors.textLight,
  },
  modalCapsterName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textDark,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalCapsterAlias: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalCapsterDescription: {
    fontSize: 14,
    color: Colors.textDark,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  modalInstagramContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgColor,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 8,
  },
  modalInstagramHandle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textDark,
    marginLeft: 8,
  },
});

export default HomeScreen;

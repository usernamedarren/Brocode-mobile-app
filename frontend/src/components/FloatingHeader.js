import React, { useState, useEffect } from 'react';
import { View, Image, TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const FloatingHeader = ({ navigation, scrollY }) => {
  const { user, signOut } = useAuth();
  const isGuest = !user;
  const [headerAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (!scrollY) return;

    const listener = scrollY.addListener(({ value }) => {
      const startScroll = 300;
      const endScroll = 500;
      const newValue = Math.min(Math.max((value - startScroll) / (endScroll - startScroll), 0), 1);
      headerAnim.setValue(newValue);
    });

    return () => scrollY.removeListener(listener);
  }, [scrollY, headerAnim]);

  const handleAuthAction = async () => {
    if (isGuest) {
      navigation.navigate('Login');
    } else {
      await signOut();
      // AppNavigator will automatically show Login screen
    }
  };

  const translateY = headerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 0],
  });

  const opacity = headerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.5, 1],
  });

  return (
    <Animated.View 
      style={[
        styles.headerContainer,
        { 
          transform: [{ translateY }],
          opacity,
        }
      ]}
    >
      <Image 
        source={require('../../assets/logo.png')} 
        style={styles.logo}
        resizeMode="contain"
        width={55}
        height={55}
      />
      <TouchableOpacity 
        style={styles.authButton}
        onPress={handleAuthAction}
      >
        <Ionicons 
          name={isGuest ? 'log-in-outline' : 'log-out-outline'} 
          size={24} 
          color="#fff" 
        />
        <Text style={styles.authButtonText}>
          {isGuest ? 'Login' : 'Logout'}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#C6A96E',
    paddingHorizontal: 20,
    paddingTop: 35,
    paddingBottom: 10,
    height: 90,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  logo: {
    width: 55,
    height: 55,
    marginLeft: 10,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B4513',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  authButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
  },
});

export default FloatingHeader;

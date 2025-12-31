import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { Colors } from '../styles/theme';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    // Sinkronisasi animasi logo float dan text glow
    Animated.loop(
      Animated.parallel([
        // Floating animation for logo
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: -25,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
        // Glow animation for text and logo (sinkron)
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.6,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // Hide splash after 2 seconds
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        if (onFinish) onFinish();
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const textShadowOpacity = glowAnim.interpolate({
    inputRange: [0.6, 1],
    outputRange: [0.6, 1],
  });

  const logoOpacity = glowAnim.interpolate({
    inputRange: [0.6, 1],
    outputRange: [0.6, 1],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      <View style={styles.content}>
        {/* Logo with opacity animation */}
        <Animated.View
          style={{
            opacity: logoOpacity,
          }}
        >
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Text with glow animation */}
        <Animated.Text
          style={[
            styles.text,
            {
              opacity: textShadowOpacity,
            },
          ]}
        >
          {/* BROCODE BARBERSHOP */}
        </Animated.Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 30,
  },
  text: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.accentColor,
    letterSpacing: 4,
    textAlign: 'center',
  },
});

export default SplashScreen;

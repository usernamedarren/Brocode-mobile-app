import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, CommonStyles } from '../styles/theme';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/LoadingScreen';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { signIn } = useAuth();

  const handleLogin = async () => {
    // Clear previous messages
    setErrorMessage('');
    setSuccessMessage('');
    
    if (!email || !password) {
      setErrorMessage('Email dan password harus diisi');
      return;
    }

    setLoading(true);
    const { data, error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      setErrorMessage(error.message || 'Email atau password salah. Silakan coba lagi.');
    } else if (data) {
      // Login berhasil - show success message briefly
      setSuccessMessage(`Selamat datang, ${data.user.name || 'User'}!`);
      // Auto-hide success message and navigate after 1.2 seconds
      setTimeout(() => {
        setSuccessMessage('');
        // Navigation akan otomatis dihandle oleh AppNavigator berdasarkan role
      }, 1200);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.title}>MASUK</Text>
            <Text style={styles.subtitle}>Selamat datang kembali di Brocode Barbershop</Text>

            {/* Loading Card Display */}
            {loading ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator size="large" color={Colors.accentColor} style={styles.loadingSpinner} />
                <Text style={styles.loadingText}>Memproses login...</Text>
              </View>
            ) : null}

            {/* Error Message Display */}
            {!loading && errorMessage ? (
              <View style={styles.messageCard}>
                <View style={styles.errorIconBox}>
                  <Ionicons name="close-circle" size={32} color="#FFFFFF" />
                </View>
                <View style={styles.messageContent}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                  <Text style={styles.errorHint}>Periksa kembali email dan password Anda</Text>
                </View>
              </View>
            ) : null}

            {/* Success Message Display */}
            {!loading && successMessage ? (
              <View style={styles.messageCard}>
                <View style={styles.successIconBox}>
                  <Ionicons name="checkmark-circle" size={32} color="#FFFFFF" />
                </View>
                <View style={styles.messageContent}>
                  <Text style={styles.successText}>{successMessage}</Text>
                </View>
              </View>
            ) : null}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Masukkan email Anda"
                placeholderTextColor={Colors.textMuted}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setErrorMessage(''); // Clear error when user types
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Masukkan password Anda"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setErrorMessage(''); // Clear error when user types
                }}
                secureTextEntry
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'MEMPROSES...' : 'MASUK'}
              </Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Belum punya akun? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.linkText}>Daftar di sini</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgColor,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: 12,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textDark,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: Colors.textDark,
  },
  loadingCard: {
    backgroundColor: Colors.cardBg,
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  loadingSpinner: {
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
    textAlign: 'center',
    letterSpacing: 1,
  },
  messageCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  errorIconBox: {
    backgroundColor: '#C62828',
    borderRadius: 50,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successIconBox: {
    backgroundColor: '#4CAF50',
    borderRadius: 50,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  messageContent: {
    alignItems: 'center',
  },
  errorText: {
    color: '#C62828',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  errorHint: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  successText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    backgroundColor: Colors.bgColor,
    color: Colors.textDark,
  },
  button: {
    backgroundColor: Colors.accentColor,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.textLight,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  linkText: {
    fontSize: 14,
    color: Colors.accentColor,
    fontWeight: '600',
  },
});

export default LoginScreen;

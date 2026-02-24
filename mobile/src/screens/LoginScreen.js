import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  TextInput,
  Button,
  Title,
  Text,
  ActivityIndicator,
  Card,
  HelperText,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService from '../services/auth.service';

console.log('🔐 LoginScreen loaded');

export default function LoginScreen({ navigation }) {
  console.log('🔐 LoginScreen rendering');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  // Check if user is already logged in
  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    const isAuthenticated = await AuthService.isAuthenticated();
    if (isAuthenticated) {
      // User is already logged in, navigate to main app
      navigation.replace('Main');
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle login
  // Handle login
const handleLogin = async () => {
  if (!validateForm()) return;
  
  console.log('🔐 Attempting login with:', { email, password });
  setLoading(true);
  
  try {
    console.log('📡 Calling AuthService.login...');
    const response = await AuthService.login(email, password);
    console.log('📡 Login response:', response);
    
    if (response.success) {
      console.log('✅ Login successful, navigating to Main');
      navigation.replace('Main');
    } else {
      console.log('❌ Login failed:', response.message);
      Alert.alert('Login Failed', response.message || 'Invalid credentials');
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    console.error('❌ Error details:', JSON.stringify(error, null, 2));
    Alert.alert(
      'Login Error',
      error.message || 'Failed to connect to server. Please try again.'
    );
  } finally {
    setLoading(false);
  }
};

  // Handle demo login (for testing)
  const handleDemoLogin = async () => {
    setEmail('admin@pharmacy.com');
    setPassword('admin123');
    setTimeout(() => handleLogin(), 100);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo and Title */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="medical" size={80} color="#007AFF" />
          </View>
          <Title style={styles.title}>Pharmacy Wholesaler</Title>
          <Text style={styles.subtitle}>Inventory Management System</Text>
        </View>

        {/* Login Form */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Welcome Back</Title>
            <Text style={styles.cardSubtitle}>Sign in to continue</Text>

            {/* Email Input */}
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              style={styles.input}
              left={<TextInput.Icon icon="email" />}
              error={!!errors.email}
              disabled={loading}
            />
            {errors.email && (
              <HelperText type="error" visible={!!errors.email}>
                {errors.email}
              </HelperText>
            )}

            {/* Password Input */}
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              style={styles.input}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              error={!!errors.password}
              disabled={loading}
            />
            {errors.password && (
              <HelperText type="error" visible={!!errors.password}>
                {errors.password}
              </HelperText>
            )}

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <Button
              mode="contained"
              onPress={handleLogin}
              style={styles.loginButton}
              contentStyle={styles.buttonContent}
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>

            {/* Demo Login Button */}
            <Button
              mode="outlined"
              onPress={handleDemoLogin}
              style={styles.demoButton}
              icon="account"
              disabled={loading}
            >
              Demo Login
            </Button>
          </Card.Content>
        </Card>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Don't have an account?{' '}
            <Text 
              style={styles.footerLink}
              onPress={() => Alert.alert('Info', 'Contact admin to create account')}
            >
              Contact Admin
            </Text>
          </Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  card: {
    elevation: 4,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#007AFF',
    fontSize: 14,
  },
  loginButton: {
    marginBottom: 10,
    borderRadius: 8,
  },
  demoButton: {
    borderRadius: 8,
    borderColor: '#007AFF',
  },
  buttonContent: {
    paddingVertical: 8,
  },
  footer: {
    alignItems: 'center',
    marginTop: 30,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  footerLink: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  version: {
    fontSize: 12,
    color: '#999',
    marginTop: 10,
  },
});
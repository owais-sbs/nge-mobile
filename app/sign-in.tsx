import axios from 'axios';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AntDesign } from '@expo/vector-icons'; // for Google + Apple icons
import { login, getUserById } from '@/services/auth';
import { storage } from '@/src/lib/storage';
import { getUserIdFromToken } from '@/src/lib/jwt';

const ACCENT_COLOR = '#F5B400';

const SignInScreen = (): React.JSX.Element => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await storage.getToken();
        const user = await storage.getUser();
        
        // If user has token and user data, redirect to tabs
        if (token && user) {
          router.replace('/(tabs)');
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        // Continue to sign-in page if check fails
      }
    };

    checkAuth();
  }, []);

  const handleSignIn = async (): Promise<void> => {
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await login({
        Email: email.trim(),
        Password: password,
      });
      if (!response.IsSuccess || !response.Data?.token) {
        setError('Unable to sign in. Please try again.');
        return;
      }
      
      const token = response.Data.token;
      
      // Store token
      await storage.setToken(token);
      
      // Get user ID from token and fetch user data
      const userId = getUserIdFromToken(token);
      if (userId) {
        try {
          const userResponse = await getUserById(userId);
          if (userResponse.IsSuccess && userResponse.Data) {
            // Store user data
            await storage.setUser(userResponse.Data);
            console.log('User data stored:', userResponse.Data);
          }
        } catch (userErr) {
          console.error('Failed to fetch user data:', userErr);
          // Continue even if user fetch fails
        }
      } else {
        console.warn('Could not extract user ID from token');
      }
      
      router.replace('/(tabs)');
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? (err.response?.data as { message?: string })?.message ??
          'Unable to sign in. Please try again.'
        : 'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.container}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <Image
              source={require('@/assets/images/logo.png')}
              resizeMode="contain"
              style={styles.logo}
            />
          </View>

          {/* FORM */}
          <View style={styles.form}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="default"
              placeholder="Hello@malone.com / 1234567890"
              placeholderTextColor="#9C9C9C"
              style={styles.input}
            />

            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Enter your password"
              placeholderTextColor="#9C9C9C"
              style={styles.input}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Remember + Forgot */}
            <View style={styles.row}>
              <View style={styles.rememberContainer}>
                <View style={styles.checkbox} />
                <Text style={styles.rememberText}>Remember me</Text>
              </View>
              <TouchableOpacity>
                <Text style={styles.forgotText}>Forgot password</Text>
              </TouchableOpacity>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.signInButton, loading && styles.signInButtonDisabled]}
              onPress={handleSignIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#1B1B1B" />
              ) : (
                <Text style={styles.signInText}>Sign in</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>Or</Text>
            <View style={styles.line} />
          </View>

          {/* Social Buttons */}
          <View style={styles.socialContainer}>
            <TouchableOpacity style={styles.googleButton} activeOpacity={0.85}>
              <AntDesign name="google" size={20} color="#000" />
              <Text style={styles.socialText}>Sign in with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.appleButton} activeOpacity={0.85}>
              <AntDesign name="apple1" size={22} color="#FFF" />
              <Text style={styles.socialTextWhite}>
                Sign in with Apple
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/sign-up')} activeOpacity={0.7}>
              <Text style={styles.highlight}>
                Sign Up here
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginTop: 32,
  },
  logo: {
    height: 90,
    width: 180,
  },
  form: {
    marginTop: 32,
    gap: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DADADA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#1B1B1B',
    backgroundColor: '#FAFAFA',
  },
  errorText: {
    color: '#D9534F',
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    marginTop: -4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: ACCENT_COLOR,
    backgroundColor: ACCENT_COLOR,
  },
  rememberText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#404040',
  },
  forgotText: {
    color: '#000',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  signInButton: {
    marginTop: 20,
    backgroundColor: ACCENT_COLOR,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  signInButtonDisabled: {
    opacity: 0.6,
  },
  signInText: {
    color: '#1B1B1B',
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.35,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },
  line: {
    height: 1,
    backgroundColor: '#DADADA',
    flex: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#6F6F6F',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  socialContainer: {
    gap: 12,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DADADA',
    borderRadius: 28,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    paddingVertical: 14,
    backgroundColor: '#000000',
    gap: 8,
  },
  socialText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#1B1B1B',
  },
  socialTextWhite: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFF',
  },
  footer: {
    marginTop: 28,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#6F6F6F',
  },
  highlight: {
    color: ACCENT_COLOR,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
});

export default SignInScreen;

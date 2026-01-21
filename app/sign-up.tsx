import { createAccount } from '@/services/auth';
import { AntDesign, Feather } from '@expo/vector-icons';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
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

const ACCENT_COLOR = '#FFC109';

const SignUpScreen = (): React.JSX.Element => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState<'user' | 'engineer'>('user');
  const [safetyNumber, setSafetyNumber] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission to access camera roll is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri);
        setError(null);
      }
    } catch (err) {
      console.error('Error picking image:', err);
      setError('Failed to pick image');
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
  };

  const handleSignUp = async (): Promise<void> => {
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedMobile = mobile.trim();
    const trimmedPassword = password.trim();

    if (!trimmedName || !trimmedPassword) {
      setError('Full name and password are required.');
      return;
    }

    // Either email OR phone is required (or both)
    if (!trimmedEmail && !trimmedMobile) {
      setError('Please enter an email or phone number.');
      return;
    }

    if (trimmedEmail) {
      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
      if (!isValidEmail) {
        setError('Please enter a valid email address.');
        return;
      }
    }

    if (trimmedMobile) {
      const isValidMobile = /^[0-9+\-\s()]{7,20}$/.test(trimmedMobile);
      if (!isValidMobile) {
        setError('Please enter a valid phone number.');
        return;
      }
    }

    if (accountType === 'engineer') {
      const trimmedSafety = safetyNumber.trim();
      const isValidSafety = /^\d{6}$/.test(trimmedSafety);
      if (!isValidSafety) {
        setError('Invalid safety number.');
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('Id', '0');
      formData.append('Name', trimmedName);
      formData.append('Password', trimmedPassword);

      // Backend compatibility: if only one is provided, send it for both fields.
      // If both are provided, send them as-is.
      if (trimmedEmail || trimmedMobile) {
        formData.append('Email', trimmedEmail || trimmedMobile);
        formData.append('Mobile', trimmedMobile || trimmedEmail);
      }
      
      if (accountType === 'engineer') {
        // For arrays in FormData, append each value separately
        formData.append('RoleIds', '2');
        formData.append('SafetyNumber', safetyNumber.trim());
      } else {
        formData.append('RoleIds', '3');
      }

      if (profileImage) {
        const fileName = profileImage.split('/').pop() || 'profile.jpg';
        const match = /\.(\w+)$/.exec(fileName);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('ProfileImageFile', {
          uri: profileImage,
          name: fileName,
          type: type,
        } as any);
      }

      const response = await createAccount(formData);
      if (!response.IsSuccess) {
        setError(response.Message ?? 'Unable to create account. Please try again.');
        return;
      }
      router.replace('/sign-in');
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? (err.response?.data as { message?: string })?.message ??
          'Unable to create account. Please try again.'
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
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.container}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Create Account,</Text>
            <Text style={styles.subtitle}>Sign up to get started</Text>
          </View>

          <View style={styles.accountTypeSwitch}>
            <TouchableOpacity
              style={[
                styles.accountTypeButton,
                accountType === 'user' && styles.accountTypeSelected,
              ]}
              onPress={() => setAccountType('user')}
              activeOpacity={0.85}
              disabled={loading}
            >
              <Text
                style={[
                  styles.accountTypeLabel,
                  accountType === 'user' && styles.accountTypeLabelSelected,
                ]}
              >
                Sign up as User
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.accountTypeButton,
                accountType === 'engineer' && styles.accountTypeSelected,
              ]}
              onPress={() => setAccountType('engineer')}
              activeOpacity={0.85}
              disabled={loading}
            >
              <Text
                style={[
                  styles.accountTypeLabel,
                  accountType === 'engineer' && styles.accountTypeLabelSelected,
                ]}
              >
                Sign up as Engineer
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            {/* Profile Image Picker */}
            <View style={styles.profileImageContainer}>
              {profileImage ? (
                <View style={styles.profileImageWrapper}>
                  <Image source={{ uri: profileImage }} style={styles.profileImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={handleRemoveImage}
                    activeOpacity={0.7}
                  >
                    <Feather name="x" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.profileImagePlaceholder}
                  onPress={handlePickImage}
                  activeOpacity={0.7}
                >
                  <Feather name="camera" size={24} color="#9C9C9C" />
                  <Text style={styles.profileImageText}>Add Profile Photo</Text>
                </TouchableOpacity>
              )}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#9C9C9C"
              value={fullName}
              onChangeText={setFullName}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#9C9C9C"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone number"
              placeholderTextColor="#9C9C9C"
              keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'phone-pad'}
              value={mobile}
              onChangeText={setMobile}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#9C9C9C"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {accountType === 'engineer' ? (
              <TextInput
                style={styles.input}
                placeholder="Safety Number"
                placeholderTextColor="#9C9C9C"
                value={safetyNumber}
                onChangeText={setSafetyNumber}
              />
            ) : null}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
              activeOpacity={0.9}
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#0F1D3A" />
              ) : (
                <Text style={styles.primaryButtonText}>Sign Up</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.dividerBlock}>
            <View style={styles.divider} />
            <Text style={styles.dividerLabel}>Or</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.socialStack}>
            <TouchableOpacity style={styles.socialButton} activeOpacity={0.85}>
              <AntDesign name="google" size={20} color="#0F9D58" />
              <Text style={styles.socialButtonText}>Sign in with Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialButton, styles.appleButton]} activeOpacity={0.85}>
              <AntDesign name="apple" size={22} color="#FFFFFF" />
              <Text style={[styles.socialButtonText, styles.appleButtonText]}>Sign in with Apple</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              have account?{' '}
              <Text style={styles.linkText} onPress={() => router.replace('/sign-in')}>
                Sign in here
              </Text>
            </Text>
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
    paddingHorizontal: 26,
    paddingBottom: 32,
  },
  header: {
    marginTop: 40,
    marginBottom: 32,
    gap: 8,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 38,
    letterSpacing: 0.2,
    color: '#0F1D3A',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#6F7A91',
  },
  form: {
    gap: 18,
  },
  accountTypeSwitch: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 16,
  },
  accountTypeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  accountTypeSelected: {
    backgroundColor: 'rgba(255, 193, 9, 0.15)',
  },
  accountTypeLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#6F7A91',
  },
  accountTypeLabelSelected: {
    color: '#0F1D3A',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 18,
  },
  profileImageWrapper: {
    position: 'relative',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: ACCENT_COLOR,
  },
  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#D9534F',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
  },
  profileImageText: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#9C9C9C',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#1B1B1B',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  errorText: {
    color: '#D9534F',
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    marginTop: -6,
  },
  primaryButton: {
    marginTop: 12,
    backgroundColor: ACCENT_COLOR,
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: ACCENT_COLOR,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButtonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.35,
    color: '#0F1D3A',
  },
  dividerBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 28,
    columnGap: 12,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E3E3E3',
  },
  dividerLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#9C9C9C',
  },
  socialStack: {
    gap: 14,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 12,
    paddingVertical: 16,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#C9D3E6',
    backgroundColor: '#FFFFFF',
  },
  socialButtonText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#0F1D3A',
  },
  appleButton: {
    backgroundColor: '#0F1D3A',
    borderColor: '#0F1D3A',
  },
  appleButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
  },
  footer: {
    marginTop: 36,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#6F7A91',
  },
  linkText: {
    fontFamily: 'Inter_600SemiBold',
    color: '#34A853',
  },
});

export default SignUpScreen;

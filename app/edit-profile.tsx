import { getUserById, updateAccount, UpdateAccountRequest } from '@/services/auth';
import { storage, UserData } from '@/src/lib/storage';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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

const EditProfileScreen = (): React.JSX.Element => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [formData, setFormData] = useState({
    Name: '',
    Email: '',
    Mobile: '',
    Password: '',
    SafetyNumber: '',
    // Salary: '',
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const currentUser = await storage.getUser();
      if (!currentUser || !currentUser.Id) {
        Alert.alert('Error', 'User not found. Please sign in again.');
        router.back();
        return;
      }

      const response = await getUserById(currentUser.Id);
      if (response.IsSuccess && response.Data) {
        const user = response.Data;
        setUserData(user);
        setFormData({
          Name: user.Name || '',
          Email: user.Email || '',
          Mobile: user.Mobile || '',
          Password: '', // Don't pre-fill password
          SafetyNumber: user.SafetyNumber?.toString() || '',
          // Salary: user.Salary?.toString() || '',
        });
      } else {
        Alert.alert('Error', response.Message || 'Failed to load user data');
        router.back();
      }
    } catch (err: any) {
      console.error('Failed to load user data:', err);
      Alert.alert('Error', 'Failed to load user data. Please try again.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!userData || !userData.Id) {
      Alert.alert('Error', 'User data not found');
      return;
    }

    if (!formData.Name.trim() || !formData.Email.trim()) {
      setError('Name and Email are required');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.Email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Get role IDs from existing user data
      const roleIds = userData.RoleMappings
        ?.filter((rm: any) => rm.IsActive && !rm.IsDeleted)
        .map((rm: any) => rm.RoleId) || [];

      const updatePayload: UpdateAccountRequest = {
        Id: userData.Id,
        Name: formData.Name.trim(),
        Email: formData.Email.trim(),
        Mobile: formData.Mobile.trim() || undefined,
        Password: formData.Password.trim() || undefined, // Only send if provided
        RoleIds: roleIds.length > 0 ? roleIds : undefined,
        SafetyNumber: formData.SafetyNumber.trim() ? parseInt(formData.SafetyNumber.trim(), 10) : undefined,
        // Salary: formData.Salary.trim() ? parseFloat(formData.Salary.trim()) : undefined,
        CreatedBy: userData.CreatedBy || undefined,
        UpdatedBy: userData.Name || undefined,
      };

      const response = await updateAccount(updatePayload);
      
      if (response.IsSuccess && response.Data) {
        // Update stored user data
        await storage.setUser(response.Data);
        Alert.alert('Success', 'Profile updated successfully', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        setError(response.Message || 'Failed to update profile');
      }
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      const errorMessage =
        err.response?.data?.Message ||
        err.message ||
        'Failed to update profile. Please try again.';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F5B400" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor="#999"
                value={formData.Name}
                onChangeText={(text) => setFormData({ ...formData, Name: text })}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                value={formData.Email}
                onChangeText={(text) => setFormData({ ...formData, Email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mobile</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your mobile number"
                placeholderTextColor="#999"
                value={formData.Mobile}
                onChangeText={(text) => setFormData({ ...formData, Mobile: text })}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Leave blank to keep current password"
                placeholderTextColor="#999"
                value={formData.Password}
                onChangeText={(text) => setFormData({ ...formData, Password: text })}
                secureTextEntry
                autoCapitalize="none"
              />
              <Text style={styles.hintText}>
                Leave blank if you don't want to change your password
              </Text>
            </View>

            {userData?.RoleMappings?.some((rm: any) => rm.Role?.Name === 'Engineer' || rm.RoleId === 2) && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Safety Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter safety number"
                  placeholderTextColor="#999"
                  value={formData.SafetyNumber}
                  onChangeText={(text) => setFormData({ ...formData, SafetyNumber: text })}
                  keyboardType="numeric"
                />
              </View>
            )}

            {/* <View style={styles.inputGroup}>
              <Text style={styles.label}>Salary</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter salary"
                placeholderTextColor="#999"
                value={formData.Salary}
                onChangeText={(text) => setFormData({ ...formData, Salary: text })}
                keyboardType="numeric"
              />
            </View> */}
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleUpdate}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#1B1B1B" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  headerSpacer: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  errorContainer: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F44336',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    textAlign: 'center',
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#FAFAFA',
  },
  hintText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#F5B400',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B1B1B',
  },
});

export default EditProfileScreen;
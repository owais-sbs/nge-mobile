import { storage, UserData } from '@/src/lib/storage';
import { getAllPostCategories, PostCategoryDto } from '@/services/postCategory';
import { addOrUpdatePost } from '@/services/posts';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Modal,
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

const ACCENT = '#F5B400';
const BORDER = '#E2E5EC';

const isValidProfileImage = (url: string | undefined | null): boolean => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  // Check if it's just the base CloudFront URL or empty
  if (trimmed === '' || trimmed === 'https://d32fcvmmn6ow56.cloudfront.net/' || trimmed.endsWith('cloudfront.net/')) {
    return false;
  }
  // Check if it has a valid image path
  return trimmed.length > 0 && (
    trimmed.includes('/account_images/') ||
    trimmed.includes('/profile_images/') ||
    /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(trimmed)
  );
};

const AddPostScreen = (): React.JSX.Element => {
  const [content, setContent] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerResult | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [categories, setCategories] = useState<PostCategoryDto[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await storage.getUser();
      setUser(userData);
    };
    loadUser();
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await getAllPostCategories();
        if (response.IsSuccess && response.Data) {
          const activeCategories = response.Data.filter(cat => cat.IsActive && !cat.IsDeleted);
          setCategories(activeCategories);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCategories();
  }, []);

  const handleChooseFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // Accept all file types
        copyToCacheDirectory: true,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFile(result);
        setError(null);
      }
    } catch (err) {
      console.error('Error picking file:', err);
      setError('Failed to select file');
    }
  };

  const handlePublish = async () => {
    if (!content.trim()) {
      setError('Please enter a description');
      return;
    }

    if (!user || !user.Id) {
      setError('User data not found. Please sign in again.');
      return;
    }

    if (!user.Name || !user.Name.trim()) {
      setError('User name not found. Please sign in again.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('Id', '0');
      formData.append('UserId', String(user.Id));
      formData.append('Name', user.Name.trim());
      formData.append('Url', '');
      formData.append('Description', content.trim());
      if (selectedCategoryId !== null) {
        formData.append('PostCategoryId', String(selectedCategoryId));
      }

      if (
        selectedFile &&
        !selectedFile.canceled &&
        selectedFile.assets &&
        selectedFile.assets.length > 0
      ) {
        const file = selectedFile.assets[0];
        const fileName = file.name || 'attachment';
        const mimeType = file.mimeType || 'application/octet-stream';

        formData.append('ImageFile', {
          uri: file.uri,
          name: fileName,
          type: mimeType,
        } as any);
      }

      const response = await addOrUpdatePost(formData);
      console.log('Add post response:', JSON.stringify(response, null, 2));

      if (response.IsSuccess) {
        console.log('Post published successfully');
        // Clear form
        setContent('');
        setSelectedFile(null);
        setError(null);
        
        // Show success modal
        setShowSuccessModal(true);
        
        // Navigate to main page after a short delay
        setTimeout(() => {
          setShowSuccessModal(false);
          router.replace('/(tabs)');
        }, 2000);
      } else {
        const errorMsg = response.Message || 'Failed to publish post';
        console.error('Post publish failed:', errorMsg);
        setError(errorMsg);
        // Try Alert first, if it doesn't work, error is already in state
        if (Platform.OS !== 'web') {
          Alert.alert('Error', errorMsg);
        }
      }
    } catch (err: any) {
      console.error('Error publishing post:', err);
      const errorMessage = err.response?.data?.Message 
        || err.message 
        || 'Failed to publish post. Please try again.';
      setError(errorMessage);
      // Try Alert first, if it doesn't work, error is already in state
      if (Platform.OS !== 'web') {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const getFileName = () => {
    if (!selectedFile || selectedFile.canceled || !selectedFile.assets || selectedFile.assets.length === 0) {
      return null;
    }
    return selectedFile.assets[0].name;
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="x" size={28} color="#2F3542" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add New Posts</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.postCard}>
            <View style={styles.postHeader}>
              <Image 
                source={user?.ProfileImage && isValidProfileImage(user.ProfileImage) ? { uri: user.ProfileImage } : require('@/assets/images/profile3.png')} 
                style={styles.postAvatar} 
              />
              <Text style={styles.postPrompt}>
                What&apos;s on your mind, {user?.Name || 'User'}?
              </Text>
            </View>
            
            <TextInput
              multiline
              value={content}
              onChangeText={setContent}
              placeholder="Share your update with the community..."
              placeholderTextColor="#B3BAC6"
              style={styles.postInput}
            />
            
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            
            <TouchableOpacity style={styles.fileButton} onPress={handleChooseFile}>
              <Feather name="upload" size={18} color="#2F3542" />
              <Text style={styles.fileText}>
                {getFileName() || 'Choose Files'}
              </Text>
            </TouchableOpacity>
            
            {getFileName() && (
              <View style={styles.selectedFileContainer}>
                <Text style={styles.selectedFileText} numberOfLines={1}>
                  Selected: {getFileName()}
                </Text>
                <TouchableOpacity onPress={removeFile}>
                  <Feather name="x" size={16} color="#D9534F" />
                </TouchableOpacity>
              </View>
            )}
            
            <View style={styles.categoriesSection}>
              <Text style={styles.categoriesTitle}>Select Category</Text>
              {loadingCategories ? (
                <ActivityIndicator size="small" color={ACCENT} style={styles.categoryLoader} />
              ) : categories.length > 0 ? (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoriesContainer}
                >
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category.Id}
                      style={[
                        styles.categoryChip,
                        selectedCategoryId === category.Id && styles.categoryChipActive,
                      ]}
                      onPress={() => {
                        setSelectedCategoryId(
                          selectedCategoryId === category.Id ? null : category.Id
                        );
                      }}
                    >
                      <Text
                        style={[
                          styles.categoryText,
                          selectedCategoryId === category.Id && styles.categoryTextActive,
                        ]}
                      >
                        {category.Title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <Text style={styles.noCategoriesText}>No categories available</Text>
              )}
            </View>
          </View>
        </ScrollView>

        <TouchableOpacity
          style={[styles.publishButton, loading && styles.publishButtonDisabled]}
          onPress={handlePublish}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#1B1B1B" />
          ) : (
            <Text style={styles.publishText}>PUBLISH</Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowSuccessModal(false);
          router.replace('/(tabs)');
        }}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalContainer}>
            <View style={styles.successIconContainer}>
              <Feather name="check-circle" size={64} color="#34A853" />
            </View>
            <Text style={styles.successModalTitle}>Success!</Text>
            <Text style={styles.successModalMessage}>
              Post published successfully!
            </Text>
            <TouchableOpacity
              style={styles.successModalButton}
              onPress={() => {
                setShowSuccessModal(false);
                router.replace('/(tabs)');
              }}
            >
              <Text style={styles.successModalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F6FB',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  closeText: {
    fontSize: 24,
    color: '#2F3542',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.35,
    color: '#2F3542',
  },
  placeholder: {
    width: 24,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    gap: 16,
    shadowColor: '#0C182F',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 18,
    elevation: 4,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  postAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  postPrompt: {
    fontSize: 16,
    color: '#2F3542',
    fontFamily: 'Inter_500Medium',
  },
  postInput: {
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
    color: '#2F3542',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  fileIcon: {
    fontSize: 18,
    color: '#2F3542',
  },
  fileText: {
    fontSize: 11,
    color: '#2F3542',
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.35,
  },
  categoriesSection: {
    marginTop: 8,
  },
  categoriesTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#2F3542',
    marginBottom: 12,
  },
  categoriesContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  categoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: BORDER,
  },
  categoryChipActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  categoryText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#2F3542',
  },
  categoryTextActive: {
    color: '#1B1B1B',
    fontFamily: 'Inter_600SemiBold',
  },
  categoryLoader: {
    marginVertical: 8,
  },
  noCategoriesText: {
    fontSize: 13,
    color: '#8A8A8A',
    fontFamily: 'Inter_400Regular',
    marginTop: 8,
  },
  publishButton: {
    margin: 20,
    backgroundColor: ACCENT,
    borderRadius: 32,
    paddingVertical: 18,
    alignItems: 'center',
  },
  publishText: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.35,
    color: '#1B1B1B',
  },
  publishButtonDisabled: {
    opacity: 0.6,
  },
  errorText: {
    color: '#D9534F',
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    marginTop: -8,
    marginBottom: 8,
  },
  selectedFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: -8,
  },
  selectedFileText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#2F3542',
    marginRight: 8,
  },
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  successModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  successModalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  successModalButton: {
    backgroundColor: ACCENT,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  successModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B1B1B',
  },
});

export default AddPostScreen;


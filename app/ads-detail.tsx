import { deleteAd, sendUserDetailsToAd } from '@/services/ads';
import { storage, UserData } from '@/src/lib/storage';
import { hasAdminRole } from '@/src/services/authRoles';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Clipboard,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const AdsDetailScreen = (): React.JSX.Element => {
  const params = useLocalSearchParams<{
    id?: string;
    title?: string;
    description?: string;
    imageUrl?: string;
  }>();
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userMessage, setUserMessage] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const [inputYPosition, setInputYPosition] = useState(0);

  useEffect(() => {
    storage
      .getUser()
      .then((userData) => {
        setUser(userData);
        setIsAdmin(hasAdminRole(userData));
      })
      .catch(() => {
        setUser(null);
        setIsAdmin(false);
      });

    // No automatic scrolling - let KeyboardAvoidingView handle it
  }, []);

  const adId = params.id ? Number(params.id) : null;
  const title = params.title ?? 'Ad details';
  const description = params.description ?? '';
  const imageSource = params.imageUrl
    ? { uri: params.imageUrl }
    : require('@/assets/images/ads2.png');

  const handleInterested = async () => {
    if (!user || !user.Id) {
      Alert.alert('Error', 'Please sign in to express interest in ads.');
      return;
    }

    if (!adId) {
      Alert.alert('Error', 'Invalid ad information.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        AdId: adId,
        AccountId: user.Id,
        UserMessage: userMessage.trim() || undefined,
      };

      const response = await sendUserDetailsToAd(payload);

      if (response.IsSuccess) {
        setHasSubmitted(true);
        setShowSuccessModal(true);
        setUserMessage(''); // Clear message after successful submission
      } else {
        Alert.alert('Error', response.Message || 'Failed to express interest. Please try again.');
      }
    } catch (error: any) {
      console.error('Error expressing interest:', error);
      const errorMessage = 
        error.response?.data?.Message || 
        error.message || 
        'Failed to express interest. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate deep link for the ad (for app-to-app navigation)
  const generateDeepLink = () => {
    if (!adId) return '';
    // Deep link format: ngemobilefinal://ads-detail?id=123
    return `ngemobilefinal://ads-detail?id=${adId}&title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}&imageUrl=${encodeURIComponent(params.imageUrl || '')}`;
  };

  // Generate clickable web URL (primary share link)
  // This will be clickable in WhatsApp and other messaging apps
  // When web page is set up, it will redirect to app if installed, or show download options
  const generateWebLink = () => {
    if (!adId) return '';
    // HTTPS URL that's clickable everywhere
    // Include all parameters so web page can extract them for deep linking
    const urlParams = new URLSearchParams({
      id: adId.toString(),
      title: title,
      description: description,
      imageUrl: params.imageUrl || '',
    });
    // Use the hosted React app URL
    return `https://admin-nge.netlify.app/ads/${adId}?${urlParams.toString()}`;
  };

  // Generate share link - use clickable HTTPS URL
  const generateShareLink = () => {
    const webLink = generateWebLink();
    // Clean, clickable URL with message
    return `${title}\n\n${webLink}\n\nDownload the app to view: ${Platform.OS === 'ios' ? 'https://apps.apple.com/app/ngemobilefinal' : 'https://play.google.com/store/apps/details?id=com.onepath.nge_mobile_final'}`;
  };

  const handleCopyLink = async () => {
    try {
      const shareLink = generateShareLink();
      await Clipboard.setString(shareLink);
      setShowShareModal(false);
      Alert.alert('Success', 'Link copied to clipboard!');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy link');
    }
  };

  const handleShareNative = async () => {
    try {
      const shareText = generateShareLink();
      const shareOptions = Platform.select({
        ios: {
          message: shareText,
        },
        android: {
          message: shareText,
          title: title,
        },
      });
      
      await Share.share(shareOptions || { message: shareText });
      setShowShareModal(false);
    } catch (error) {
      Alert.alert('Error', 'Unable to share');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#1B1B1B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerSpacer}>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={() => setShowShareModal(true)}
              activeOpacity={0.7}
            >
              <Feather name="share-2" size={20} color="#1B1B1B" />
            </TouchableOpacity>
            {isAdmin && adId !== null ? (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={async () => {
                  try {
                    await deleteAd(adId);
                    router.back();
                  } catch (err) {
                    console.error('Failed to delete ad', err);
                  }
                }}>
                <Feather name="trash-2" size={18} color="#D9534F" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        enabled={Platform.OS === 'ios'}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View
            style={[
              styles.cardContainer,
              hasSubmitted && styles.cardContainerDisabled,
            ]}
          >
          <View style={styles.heroWrapper}>
            <Image source={imageSource} style={styles.heroImage} resizeMode="cover" />
            {hasSubmitted && <View style={styles.heroOverlay} />}
          </View>

          {/* Description Section */}
          <View style={styles.textSection}>
            <Text
              style={[styles.titleText, hasSubmitted && styles.disabledText]}
            >
              {title}
            </Text>
            <Text
              style={[styles.descriptionText, hasSubmitted && styles.disabledText]}
            >
              {description || 'No description provided for this ad.'}
            </Text>
          </View>

          {/* Message Input */}
          <View 
            style={styles.messageInputContainer}
            onLayout={(event) => {
              // Store the Y position of the input container
              const { y } = event.nativeEvent.layout;
              setInputYPosition(y);
            }}
          >
            <TextInput
              ref={inputRef}
              style={[
                styles.messageInput,
                hasSubmitted && styles.messageInputDisabled
              ]}
              placeholder="Type your message here"
              placeholderTextColor="#999"
              value={userMessage}
              onChangeText={setUserMessage}
              multiline
              numberOfLines={4}
              editable={!hasSubmitted && !isSubmitting}
              textAlignVertical="top"
              onFocus={() => {
                // Scroll to input position when focused, with some padding
                if (inputYPosition > 0) {
                  setTimeout(() => {
                    scrollViewRef.current?.scrollTo({
                      y: Math.max(0, inputYPosition - 100), // 100px padding above input
                      animated: true,
                    });
                  }, Platform.OS === 'ios' ? 250 : 100);
                }
              }}
            />
          </View>

          {/* CTA Button */}
          <TouchableOpacity
            style={[styles.primaryButton, (hasSubmitted || isSubmitting) && styles.primaryButtonDisabled]}
            activeOpacity={0.9}
            disabled={hasSubmitted || isSubmitting}
            onPress={handleInterested}
          >
            <Text
              style={[styles.primaryButtonText, hasSubmitted && styles.disabledButtonText]}
            >
              I’m Interested
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBackdrop} />
          <View style={styles.modalCard}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowSuccessModal(false)}
            >
              <Feather name="x" size={22} color="#6B6B6B" />
            </TouchableOpacity>
            <View style={styles.modalIllustration}>
              <View style={styles.modalIllustrationCircle}>
                <View style={styles.modalIllustrationInner}>
                  <Feather name="check" size={20} color="#FFFFFF" />
                </View>
              </View>
            </View>
            <Text style={styles.modalTitle}>Successfully sent details to company</Text>
            <Text style={styles.modalSubtitle}>
              Thank you for your interest! We will get back to you soon.
            </Text>
            <TouchableOpacity
              style={styles.modalPrimaryButton}
              activeOpacity={0.9}
              onPress={() => {
                setShowSuccessModal(false);
                router.replace('/(tabs)');
              }}
            >
              <Text style={styles.modalPrimaryText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Share Modal */}
      <Modal
        visible={showShareModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={styles.shareModalOverlay}>
          <TouchableOpacity
            style={styles.shareModalBackdrop}
            activeOpacity={1}
            onPress={() => setShowShareModal(false)}
          />
          <View style={styles.shareModalContent}>
            <View style={styles.shareModalHeader}>
              <Text style={styles.shareModalTitle}>Share Ad</Text>
              <TouchableOpacity
                onPress={() => setShowShareModal(false)}
                style={styles.shareModalClose}
              >
                <Feather name="x" size={24} color="#1B1B1B" />
              </TouchableOpacity>
            </View>

            <View style={styles.shareOptionsContainer}>
              <TouchableOpacity
                style={styles.shareOption}
                onPress={handleCopyLink}
                activeOpacity={0.7}
              >
                <View style={[styles.shareOptionIcon, { backgroundColor: '#E3F2FD' }]}>
                  <Feather name="link" size={24} color="#1976D2" />
                </View>
                <Text style={styles.shareOptionText}>Copy Link</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareOption}
                onPress={handleShareNative}
                activeOpacity={0.7}
              >
                <View style={[styles.shareOptionIcon, { backgroundColor: '#FFF3E0' }]}>
                  <Feather name="share-2" size={24} color="#FF9800" />
                </View>
                <Text style={styles.shareOptionText}>
                  {Platform.OS === 'ios' ? 'Share' : 'Share'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'android' ? 10 : 0,
    paddingBottom: 14,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    color: '#1B1B1B',
  },
  headerSpacer: {
    width: 44,
    height: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shareButton: {
    padding: 8,
    marginRight: 4,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 50, // Minimal padding - let KeyboardAvoidingView handle spacing
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  cardContainerDisabled: {
    backgroundColor: '#F1F1F1',
  },
  heroWrapper: {
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: 420, // 👈 matches big size from your PNG
    borderRadius: 20,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 20,
  },
  textSection: {
    marginTop: 30,
    marginBottom: 36,
  },
  titleText: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#2B2B2B',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
    color: '#6B6B6B',
  },
  messageInputContainer: {
    marginBottom: 20,
  },
  messageInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#1B1B1B',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 100,
    maxHeight: 150,
    textAlignVertical: 'top',
  },
  messageInputDisabled: {
    backgroundColor: '#F1F1F1',
    color: '#9E9E9E',
  },
  primaryButton: {
    backgroundColor: '#FFC107',
    paddingVertical: 18,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: '#D6D6D6',
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#1B1B1B',
  },
  disabledText: {
    color: '#9E9E9E',
  },
  disabledButtonText: {
    color: '#7A7A7A',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    paddingHorizontal: 24,
    paddingVertical: 36,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalClose: {
    position: 'absolute',
    top: 18,
    right: 18,
  },
  modalIllustration: {
    marginBottom: 24,
  },
  modalIllustrationCircle: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: '#F3ECFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalIllustrationInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#34A853',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#1B1B1B',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    color: '#737373',
    textAlign: 'center',
    marginBottom: 28,
  },
  modalPrimaryButton: {
    backgroundColor: '#FFC109',
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 28,
  },
  modalPrimaryText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#1B1B1B',
  },
  deleteButton: {
    padding: 4,
  },
  shareModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  shareModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  shareModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingHorizontal: 20,
    maxHeight: '80%',
  },
  shareModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  shareModalTitle: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    color: '#1B1B1B',
  },
  shareModalClose: {
    padding: 4,
  },
  shareOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  shareOption: {
    width: '45%',
    alignItems: 'center',
    marginBottom: 24,
  },
  shareOptionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  shareOptionText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#1B1B1B',
    textAlign: 'center',
  },
});

export default AdsDetailScreen;

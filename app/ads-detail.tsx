import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { deleteAd } from '@/services/ads';
import { storage } from '@/src/lib/storage';
import { hasAdminRole } from '@/src/services/authRoles';

const AdsDetailScreen = (): React.JSX.Element => {
  const params = useLocalSearchParams<{
    id?: string;
    title?: string;
    description?: string;
    imageUrl?: string;
  }>();
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    storage
      .getUser()
      .then((user) => setIsAdmin(hasAdminRole(user)))
      .catch(() => setIsAdmin(false));
  }, []);

  const adId = params.id ? Number(params.id) : null;
  const title = params.title ?? 'Ad details';
  const description = params.description ?? '';
  const imageSource = params.imageUrl
    ? { uri: params.imageUrl }
    : require('@/assets/images/ads2.png');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#1B1B1B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerSpacer}>
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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

          {/* CTA Button */}
          <TouchableOpacity
            style={[styles.primaryButton, hasSubmitted && styles.primaryButtonDisabled]}
            activeOpacity={0.9}
            disabled={hasSubmitted}
            onPress={() => {
              setHasSubmitted(true);
              setShowSuccessModal(true);
            }}
          >
            <Text
              style={[styles.primaryButtonText, hasSubmitted && styles.disabledButtonText]}
            >
              I’m Interested
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
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
});

export default AdsDetailScreen;

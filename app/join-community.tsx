import { AntDesign } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Dimensions,
    ImageBackground,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const TERMS_TEXT = `Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. laculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.

Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. laculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.

Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. laculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.`;

const JoinCommunityScreen = (): React.JSX.Element => {
  const [termsVisible, setTermsVisible] = useState(false);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ImageBackground
        source={require('@/assets/images/welcome1.png')}
        style={styles.imageBackground}
        imageStyle={styles.imageStyle}
        resizeMode="cover"
      >
        {/* Dark overlay for readability */}
        <LinearGradient
          pointerEvents="none"
          colors={['transparent', 'rgba(0, 0, 0, 0.8)']}
          style={styles.overlay}
        />

        <View style={styles.content}>
          <Text style={styles.title}>For Every Gas Engineer Out There</Text>
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>
              By clicking the button below you consent to our{' '}
            </Text>
            <TouchableOpacity
              onPress={() => setTermsVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.highlight}>Terms and Privacy Policy.</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.button}
            onPress={() => router.push('/sign-in')}
          >
            <Text style={styles.buttonText}>Join the Community</Text>
          </TouchableOpacity>

          <View style={styles.secondaryActions}>
            <Text style={styles.secondaryText}>Need an account?</Text>
            <TouchableOpacity
              onPress={() => router.push('/sign-up')}
              activeOpacity={0.85}
            >
              <Text style={styles.secondaryLink}>Create one</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>

      {/* Terms & Privacy Policy Modal */}
      <Modal
        visible={termsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTermsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          {/* Modal container */}
          <View style={styles.modalWrapper}>
            <View style={styles.modalContainer}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Terms & Privacy Policy</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setTermsVisible(false)}
                  activeOpacity={0.7}
                >
                  <AntDesign name="close" size={20} color="#1B1B1B" />
                </TouchableOpacity>
              </View>

              {/* Modal Content */}
              <ScrollView
                style={styles.modalContent}
                contentContainerStyle={styles.modalContentContainer}
                showsVerticalScrollIndicator={true}
              >
                <Text style={styles.modalText}>{TERMS_TEXT}</Text>
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  imageBackground: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  imageStyle: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    bottom: 0,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    gap: 14,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
    lineHeight: 38,
    letterSpacing: 0.2,
  },
  descriptionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  description: {
    color: '#E0E0E0',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    textAlign: 'center',
  },
  highlight: {
    color: '#FFD54F',
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#F5B400',
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonText: {
    color: '#1B1B1B',
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.35,
  },
  secondaryActions: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  secondaryText: {
    color: '#E0E0E0',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  secondaryLink: {
    color: '#F5B400',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalWrapper: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingTop: 94,
    paddingLeft: 23,
  },
  modalContainer: {
    width: Math.min(384, SCREEN_WIDTH - 46), // 384px design width or screen width - 46 (23*2)
    height: Math.min(637, SCREEN_HEIGHT - 188), // 637px design height, max to fit screen (94*2)
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#1B1B1B',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5B400',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  modalText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#1B1B1B',
    lineHeight: 22,
  },
});

export default JoinCommunityScreen;

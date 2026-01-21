import { Feather } from '@expo/vector-icons';
import { Video } from 'expo-av';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getChatContext, ChatContext } from '@/services/chat';
import { Image as ExpoImage } from 'expo-image';

const SF_PRO_TEXT_REGULAR = Platform.select({
  ios: 'SFProText-Regular',
  default: 'Inter_400Regular',
});

const isImageUrl = (url: string): boolean => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
  return imageExtensions.some((ext) => url.toLowerCase().includes(ext));
};

const isVideoUrl = (url: string): boolean => {
  const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
  return videoExtensions.some((ext) => url.toLowerCase().includes(ext));
};

const isPdfUrl = (url: string): boolean => {
  return url.toLowerCase().includes('.pdf');
};

const isExcelUrl = (url: string): boolean => {
  const excelExtensions = ['.xls', '.xlsx', '.csv'];
  return excelExtensions.some((ext) => url.toLowerCase().includes(ext));
};

const isWordUrl = (url: string): boolean => {
  const wordExtensions = ['.doc', '.docx'];
  return wordExtensions.some((ext) => url.toLowerCase().includes(ext));
};

const isAudioUrl = (url: string): boolean => {
  const audioExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.opus'];
  return audioExtensions.some((ext) => url.toLowerCase().includes(ext));
};

const urlRegex = /(https?:\/\/[^\s]+)/g;

const extractUrls = (text: string): string[] => {
  return text.match(urlRegex) || [];
};

const getDocumentNameFromUrl = (url: string): string => {
  try {
    const lower = url.toLowerCase();
    const marker = 'doc_documents/';
    let startIndex = lower.indexOf(marker);

    let namePart = url;
    if (startIndex !== -1) {
      startIndex += marker.length;
      namePart = url.substring(startIndex);
    }

    const queryIndex = namePart.indexOf('?');
    if (queryIndex !== -1) {
      namePart = namePart.substring(0, queryIndex);
    }

    // Decode %20 etc.
    namePart = decodeURIComponent(namePart);

    return namePart;
  } catch {
    return url;
  }
};

const ChatDetailScreen = () => {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ group: string; line: string, keyword: string }>();
  const [context, setContext] = useState<ChatContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const highlightKeyword = params.keyword?.trim() || ''


  const renderHighlightedText = (text: string, keyword: string) => {
  if (!keyword) {
    return <Text style={styles.messageText}>{text}</Text>;
  }

  const regex = new RegExp(`(${keyword})`, 'gi');
  const parts = text.split(regex);

  return (
    <Text style={styles.messageText}>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <Text key={index} style={styles.highlight}>
            {part}
          </Text>
        ) : (
          part
        )
      )}
    </Text>
  );
};


  useEffect(() => {
    const loadContext = async () => {
      if (!params.group || !params.line) {
        setError('Missing required parameters');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await getChatContext(params.group, parseInt(params.line, 10), 10);
        setContext(data);
      } catch (err: any) {
        setError('Unable to load chat context. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadContext();
  }, [params.group, params.line]);

  const renderMessage = (message: string, index: number) => {
    const isMe = index % 2 === 1; // alternate for WhatsApp-style green/white
    const urls = extractUrls(message);
    const textOnly = message.replace(urlRegex, '').trim();

    const trimmedMessage = message.trim();
    const isOnlyUrls =
      urls.length > 0 &&
      urls.every((url) => trimmedMessage.includes(url)) &&
      trimmedMessage
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .every(
          (part) =>
            part.startsWith('http://') ||
            part.startsWith('https://') ||
            part === '',
        );

    const renderUrlBlock = (url: string, key: number) => {
      if (isImageUrl(url)) {
        return (
          <View key={key} style={styles.mediaContainer}>
            <ExpoImage
              source={{ uri: url }}
              style={styles.mediaImage}
              contentFit="contain"
              transition={200}
            />
          </View>
        );
      }
      if (isVideoUrl(url)) {
        return (
          <View key={key} style={styles.mediaContainer}>
            <Video
              source={{ uri: url }}
              style={styles.mediaVideo}
              useNativeControls
              resizeMode="contain"
            />
          </View>
        );
      }
      if (isPdfUrl(url)) {
        const docName = getDocumentNameFromUrl(url);
        return (
          <TouchableOpacity
            key={key}
            style={styles.mediaContainer}
            onPress={() => Linking.openURL(url)}>
            <View style={styles.documentContainer}>
              <Feather name="file-text" size={32} color="#F5B400" />
              <Text style={styles.mediaLabel}>{docName}</Text>
              <Text style={styles.mediaUrl} numberOfLines={1}>
                {url}
              </Text>
            </View>
          </TouchableOpacity>
        );
      }
      if (isExcelUrl(url)) {
        return (
          <TouchableOpacity
            key={key}
            style={styles.mediaContainer}
            onPress={() => Linking.openURL(url)}>
            <View style={styles.documentContainer}>
              <Feather name="file" size={32} color="#2EBD59" />
              <Text style={styles.mediaLabel}>Excel/CSV File</Text>
              <Text style={styles.mediaUrl} numberOfLines={1}>
                {url}
              </Text>
            </View>
          </TouchableOpacity>
        );
      }
      if (isWordUrl(url)) {
        return (
          <TouchableOpacity
            key={key}
            style={styles.mediaContainer}
            onPress={() => Linking.openURL(url)}>
            <View style={styles.documentContainer}>
              <Feather name="file-text" size={32} color="#4285F4" />
              <Text style={styles.mediaLabel}>Word Document</Text>
              <Text style={styles.mediaUrl} numberOfLines={1}>
                {url}
              </Text>
            </View>
          </TouchableOpacity>
        );
      }
      if (isAudioUrl(url)) {
        return (
          <View key={key} style={styles.mediaContainer}>
            <Video
              source={{ uri: url }}
              style={styles.mediaAudio}
              useNativeControls
              resizeMode="contain"
              isLooping={false}
            />
          </View>
        );
      }
      return (
        <Text
          key={key}
          style={styles.linkText}
          onPress={() => Linking.openURL(url)}>
          {url}
        </Text>
      );
    };

    // Message with only URLs → bubble containing only media blocks
    if (isOnlyUrls && urls.length > 0) {
      return (
        <View
          key={index}
          style={[
            styles.messageContainer,
            isMe ? styles.messageRight : styles.messageLeft,
          ]}>
          <View
            style={[
              styles.messageBubble,
              isMe ? styles.messageBubbleMe : styles.messageBubbleOther,
            ]}>
            {urls.map((url, urlIndex) => renderUrlBlock(url, urlIndex))}
          </View>
        </View>
      );
    }

    // Mixed content: text with embedded URLs → text first, then media blocks
    return (
      <View
        key={index}
        style={[
          styles.messageContainer,
          isMe ? styles.messageRight : styles.messageLeft,
        ]}>
        <View
          style={[
            styles.messageBubble,
            isMe ? styles.messageBubbleMe : styles.messageBubbleOther,
          ]}>
          {textOnly.length > 0 && renderHighlightedText(textOnly, highlightKeyword)}

          {urls.map((url, urlIndex) => renderUrlBlock(url, urlIndex))}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="white" translucent={false} />
        <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? insets.top + 10 : 15 }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="arrow-left" size={28} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chat Context</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F5B400" />
        </View>
      </View>
    );
  }

  if (error || !context) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="white" translucent={false} />
        <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? insets.top + 10 : 15 }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="arrow-left" size={28} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chat Context</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Unable to load chat context'}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" translucent={false} />
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? insets.top + 10 : 15 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={28} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{context.group}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.chatContainer} contentContainerStyle={styles.chatContent}>
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>Line: {context.line}</Text>
          <Text style={styles.infoText}>Messages: {context.snippet.length}</Text>
        </View>

        {context.snippet.map((message, index) => renderMessage(message, index))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingBottom: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.35,
    marginHorizontal: 15,
  },
  headerSpacer: {
    width: 28,
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    padding: 15,
    paddingBottom: 20,
  },
  infoContainer: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#666',
    marginBottom: 2,
  },
  messageContainer: {
    marginBottom: 8,
    flexDirection: 'row',
  },
  messageLeft: {
    justifyContent: 'flex-start',
  },
  messageRight: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  messageBubbleMe: {
    backgroundColor: '#DCF8C6',
    borderTopRightRadius: 0,
  },
  messageBubbleOther: {
    backgroundColor: 'white',
    borderTopLeftRadius: 0,
  },
  messageText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 0.3,
    lineHeight: 20,
    color: '#000',
  },
  linkText: {
    color: '#4285F4',
    textDecorationLine: 'underline',
  },
  mediaContainer: {
    marginVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  highlight: {
  backgroundColor: '#FFE082',
  color: '#000',
  fontWeight: '700',
},

  mediaImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  mediaVideo: {
    width: '100%',
    height: 220,
    borderRadius: 8,
    backgroundColor: '#000',
  },
  mediaAudio: {
    width: '100%',
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  videoContainer: {
    backgroundColor: '#F5F5F5',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  documentContainer: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  mediaLabel: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#000',
  },
  mediaUrl: {
    marginTop: 4,
    fontSize: 11,
    fontFamily: SF_PRO_TEXT_REGULAR,
    color: '#666',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#D9534F',
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
});

export default ChatDetailScreen;


import { ChatMessage, getChatHistory, sendUserMessage } from '@/services/chat';
import { storage, UserData } from '@/src/lib/storage';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type Message = {
  id: string;
  text: string;
  type: 'sent' | 'received';
  createdOn?: string;
};

const ChatSupportScreen = (): React.JSX.Element => {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<UserData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const loadUser = useCallback(async () => {
    try {
      const userData = await storage.getUser();
      setUser(userData);
    } catch (err) {
      console.error('Failed to load user:', err);
      setUser(null);
    }
  }, []);

  const loadChatHistory = useCallback(async () => {
    try {
      const userData = await storage.getUser();
      if (!userData || !userData.Id) {
        console.log('No user ID found');
        setMessages([]);
        return;
      }

      setLoading(true);
      const response = await getChatHistory(userData.Id);
      
      if (response.IsSuccess && response.Data) {
        const chatMessages: Message[] = response.Data.map((msg: ChatMessage) => {
          // Determine message type based on IsAdminReply:
          // - If IsAdminReply is true → message is FROM admin → received (left, white)
          // - If IsAdminReply is false/undefined/null → message is FROM user → sent (right, yellow)
          const messageType: 'sent' | 'received' = msg.IsAdminReply === true ? 'received' : 'sent';
          
          return {
            id: msg.Id?.toString() || `${Date.now()}-${Math.random()}`,
            text: msg.Message || '',
            type: messageType,
            createdOn: msg.CreatedOn,
          };
        });
        setMessages(chatMessages);
      } else {
        setMessages([]);
      }
    } catch (err: any) {
      console.error('Failed to load chat history:', err);
      Alert.alert('Error', 'Failed to load chat history. Please try again.');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser().catch(() => {});
    loadChatHistory().catch(() => {});
  }, [loadUser, loadChatHistory]);

  useFocusEffect(
    useCallback(() => {
      loadChatHistory().catch(() => {});
    }, [loadChatHistory]),
  );

  const handleSendMessage = async () => {
    if (!messageText.trim() || !user || !user.Id || sending) {
      return;
    }

    const messageToSend = messageText.trim();
    setMessageText('');
    setSending(true);

    // Optimistically add the message to the UI
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      text: messageToSend,
      type: 'sent',
    };
    setMessages((prev) => [...prev, tempMessage]);

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const response = await sendUserMessage(user.Id, messageToSend);
      
      if (response.IsSuccess) {
        // Replace temp message with actual response
        const newMessage: Message = {
          id: response.Data?.Id?.toString() || `sent-${Date.now()}`,
          text: messageToSend,
          type: 'sent',
          createdOn: response.Data?.CreatedOn,
        };
        setMessages((prev) => {
          const filtered = prev.filter((msg) => msg.id !== tempMessage.id);
          return [...filtered, newMessage];
        });
        
        // Reload chat history to get any admin replies
        setTimeout(() => {
          loadChatHistory().catch(() => {});
        }, 500);
      } else {
        // Remove temp message on error
        setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id));
        Alert.alert('Error', response.Message || 'Failed to send message');
        setMessageText(messageToSend); // Restore message text
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      // Remove temp message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id));
      Alert.alert('Error', 'Failed to send message. Please try again.');
      setMessageText(messageToSend); // Restore message text
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (dateString?: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';
    
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    });
  } catch {
    return '';
  }
};

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: '#F7F7F7' }]}
      edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7F7" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color="#111" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Messages</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Chat body */}
        <View style={styles.chatBody}>
          {loading && messages.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFD700" />
            </View>
          ) : (
            <>
              {/* {messages.length > 0 && (
  <View style={styles.dateRow}>
    <View style={styles.divider} />
    <Text style={styles.dateText}>
      {new Date().toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })}
    </Text>
    <View style={styles.divider} />
  </View>
)} */}

              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messagesContent}
                renderItem={({ item }) => {
                  // User messages (sent) should be on RIGHT (yellow)
                  // Admin messages (received) should be on LEFT (white)
                  const isSent = item.type === 'sent';
                  
                  return (
                    <View
                      style={
                        isSent
                          ? styles.sentMessageContainer
                          : styles.receivedMessageContainer
                      }>
                      {isSent ? (
                        <LinearGradient
                          colors={['#FFF94C', '#FFD700']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={[styles.messageBubble, styles.sentBubble]}>
                          <Text style={styles.sentText}>{item.text}</Text>
                          {item.createdOn && (
                            <Text style={styles.timeText}>
                              {formatMessageTime(item.createdOn)}
                            </Text>
                          )}
                        </LinearGradient>
                      ) : (
                        <View style={[styles.messageBubble, styles.receivedBubble]}>
                          <Text style={styles.receivedText}>{item.text}</Text>
                          {item.createdOn && (
                            <Text style={styles.timeText}>
                              {formatMessageTime(item.createdOn)}
                            </Text>
                          )}
                        </View>
                      )}
                    </View>
                  );
                }}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No messages yet. Start a conversation!</Text>
                  </View>
                }
              />
            </>
          )}
        </View>

        {/* Composer */}
        <View style={[styles.composer, { marginBottom: insets.bottom + 4 }]}>
          <TouchableOpacity style={styles.iconButton}>
            <Feather name="paperclip" size={20} color="#8A8A8A" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Add comment"
            placeholderTextColor="#B0B0B0"
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={1000}
            editable={!sending && !!user}
          />
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || sending || !user}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFD700" />
            ) : (
              <Feather name="arrow-right" size={20} color={messageText.trim() && user ? "#FFD700" : "#8A8A8A"} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 6,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 19,
    fontWeight: '600',
    color: '#111',
  },
  headerSpacer: {
    width: 38,
  },
  chatBody: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 16,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 8,
  },
  divider: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#DADADA',
  },
  dateText: {
    fontSize: 13,
    color: '#8A8A8A',
  },
  messagesContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 10,
  },
  sentMessageContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    alignItems: 'flex-end',
  },
  receivedMessageContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    width: '100%',
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  sentBubble: {
    // No additional styles needed, container handles alignment
  },
  receivedBubble: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  sentText: {
    color: '#222',
    fontSize: 15,
    lineHeight: 22,
  },
  receivedText: {
    color: '#444',
    fontSize: 15,
    lineHeight: 22,
  },
  timeText: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#8A8A8A',
    textAlign: 'center',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 2,
    elevation: 1,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingHorizontal: 8,
    color: '#222',
  },
});

export default ChatSupportScreen;
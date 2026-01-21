import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
// API Services Import
import { storage } from '@/src/lib/storage';
import { clearAllNotifications, fetchNotifications, markAsRead } from '@/services/notification';

const NotificationScreen = (): React.JSX.Element => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 1. Fetch Notifications from API
  const loadNotifications = useCallback(async () => {
    try {
      const user = await storage.getUser();
      if (user?.Id) {
        const response = await fetchNotifications(user.Id);
        // Backend SuccessResponse check
        if (response.data.IsSuccess) {
          setNotifications(response.data.Data);
        }
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // 2. Mark as Read and Navigate
  const handlePressNotification = async (item: any) => {
    try {
      if (!item.IsRead) {
        await markAsRead(item.Id);
        // Local state update
        setNotifications(prev => 
          prev.map(n => n.Id === item.Id ? { ...n, IsRead: true } : n)
        );
      }
      if (item.PostId) {
        router.push({ pathname: '/post-detail', params: { id: item.PostId.toString() } });
      }
    } catch (error) {
      console.log("Read error:", error);
    }
  };

  // 3. Clear All Notifications
  const handleClearAll = async () => {
    try {
      const user = await storage.getUser();
      if (user?.Id) {
        await clearAllNotifications(user.Id);
        setNotifications([]);
      }
    } catch (error) {
      console.error("Clear Error:", error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>


      
      <StatusBar barStyle="dark-content" backgroundColor="#F5B400" />
      <View style={styles.container}>
        {/* Header */}        
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color="#1B1B1B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notification</Text>
          <TouchableOpacity onPress={handleClearAll}>
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Notifications{' '}
            <Text style={styles.sectionCount}>({notifications.length})</Text>
          </Text>
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#FFC109" />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={loadNotifications} />
            }
          >
            {notifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No notifications found</Text>
              </View>
            ) : (
              notifications.map((item) => (
                <TouchableOpacity 
                  key={item.Id} 
                  style={[styles.card, !item.IsRead && styles.unreadCard]}
                  onPress={() => handlePressNotification(item)}
                >
                  <View style={styles.cardLeading}>
                    {!item.IsRead && <View style={styles.statusDot} />}
                    <View style={styles.avatarPlaceholder}>
                       <Feather name="bell" size={20} color={item.IsRead ? "#8A8A8A" : "#FFC109"} />
                    </View>
                  </View>

                  <View style={styles.cardBody}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardName}>{item.Title}</Text>
                      <Text style={styles.cardTime}>{item.TimeAgo || 'Just now'}</Text>
                    </View>
                    <Text style={styles.cardDescription} numberOfLines={2}>
                      {item.Description}
                    </Text>
                  </View>

                  <View style={styles.cardTrailing}>
                    <View style={styles.favouriteButton}>
                      <Feather 
                        name={item.IsRead ? "check" : "mail"} 
                        size={16} 
                        color={item.IsRead ? "#2ECC71" : "#8A8A8A"} 
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6F6F6' },
  container: { flex: 1, paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  backButton: { width: 44, height: 44, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#1B1B1B' },
  clearText: { fontSize: 14, fontWeight: '600', color: '#D9534F' },
  sectionHeader: { marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1B1B1B' },
  sectionCount: { fontWeight: '500' },
  scrollContent: { paddingBottom: 24 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  unreadCard: {
    backgroundColor: '#FFFBEA',
    borderColor: '#FFC109',
    borderWidth: 1,
  },
  cardLeading: { alignItems: 'center', marginRight: 16 },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFC109',
    position: 'absolute',
    top: -5,
    right: -5,
    zIndex: 1,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F1F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: { flex: 1, gap: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { fontSize: 15, fontWeight: '700', color: '#1B1B1B' },
  cardTime: { fontSize: 12, color: '#8A8A8A' },
  cardDescription: { fontSize: 13, color: '#7A7A7A', lineHeight: 18 },
  cardTrailing: { marginLeft: 10 },
  favouriteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E7E7E7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderContainer: { flex: 1, justifyContent: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#8A8A8A' },
});

export default NotificationScreen;
import { ChatSearchResult, searchChatMatches } from '@/services/chat';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';


const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<ChatSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const cleanChatText = (text: string) => {
  return text.replace(/^\[[^\]]+\]\s*/, '');
};


const renderHighlightedText = (text: string, keyword: string) => {
  if (!keyword) {
    return <Text style={styles.resultContent}>{text}</Text>;
  }

  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return (
    <Text style={styles.resultContent}>
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





  const performSearch = useCallback(async (keyword: string) => {
  if (!keyword.trim()) {
    setResults([]);
    setSkip(0);
    setHasMore(false);
    return;
  }

  try {
    setLoading(true);
    const limit = 10;
    const data = await searchChatMatches(keyword, 0, limit);
    setResults(data);
    setSkip(data.length);
    setHasMore(data.length === limit);
  } finally {
    setLoading(false);
  }
}, []);


const loadMore = async () => {
  if (!hasMore || loading) return;

  setLoading(true);
  const data = await searchChatMatches(searchQuery, skip, 10);

  setResults(prev => [...prev, ...data]);
  setSkip(prev => prev + data.length);
  setHasMore(data.length === 10);

  setLoading(false);
};



  const handleSearch = () => {
    performSearch(searchQuery);
  };


  const getGroupInitials = (groupName: string) => {
    return groupName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>WhatsApp Archive Search</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.searchBarContainer}>
          <Feather name="search" size={18} color="#999" style={styles.searchIcon} />
          <TextInput
            placeholder="Search messages, media, docs..."
            placeholderTextColor="#999"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            blurOnSubmit={true}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => {
                setSearchQuery('');
                setResults([]);
                setHasMore(false);
              }}
              style={styles.clearButton}
            >
              <Feather name="x" size={18} color="#999" />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            onPress={handleSearch} 
            style={styles.searchButton}
            activeOpacity={0.7}
          >
            <Feather name="search" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>

        {loading && results.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F5B400" />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.resultsScrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {results.length > 0 && (
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsCount}>
                  {results.length} {results.length === 1 ? 'result' : 'results'} found
                </Text>
              </View>
            )}
            
            {results.map((item, index) => (
              <TouchableOpacity
                key={`${item.group}-${item.line}-${index}`}
                style={styles.resultCard}
                onPress={() =>
                  router.push({
                    pathname: '/chat-detail',
                    params: {
                      group: item.group,
                      line: item.line.toString(),
                      keyword: searchQuery
                    },
                  })
                }
                activeOpacity={0.7}
              >
                <View style={styles.avatarContainer}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {getGroupInitials(item.group)}
                    </Text>
                  </View>
                </View>
                <View style={styles.textContainer}>
                  <View style={styles.groupHeader}>
                    <Text style={styles.groupName} numberOfLines={1}>
                      {item.group}
                    </Text>
                    <Feather name="chevron-right" size={16} color="#CCC" />
                  </View>
                  <View style={styles.messageContainer}>
                    {renderHighlightedText(cleanChatText(item.text), searchQuery)}
                  </View>
                </View>
              </TouchableOpacity>
            ))}

            {hasMore && results.length > 0 && (
              <TouchableOpacity 
                style={styles.loadMoreButton} 
                onPress={loadMore}
                activeOpacity={0.7}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#F5B400" />
                ) : (
                  <>
                    <Text style={styles.loadMoreText}>Load More</Text>
                    <Feather name="chevron-down" size={18} color="#F5B400" />
                  </>
                )}
              </TouchableOpacity>
            )}

            {results.length === 0 && searchQuery !== '' && !loading && (
              <View style={styles.emptyContainer}>
                <Feather name="search" size={64} color="#DDD" />
                <Text style={styles.emptyTitle}>No results found</Text>
                <Text style={styles.emptyText}>
                  Try different keywords or check your spelling
                </Text>
              </View>
            )}

            {results.length === 0 && searchQuery === '' && (
              <View style={styles.emptyContainer}>
                <Feather name="message-circle" size={64} color="#DDD" />
                <Text style={styles.emptyTitle}>Start searching</Text>
                <Text style={styles.emptyText}>
                  Enter keywords to search through your messages
                </Text>
              </View>
            )}

            <View style={styles.bottomSpacer} /> 
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#F8F9FA' 
  },
  container: { 
    flex: 1 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#1A1A1A',
    flex: 1,
  },
  headerSpacer: {
    width: 32,
  },
  searchBarContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF', 
    borderRadius: 12, 
    marginHorizontal: 16, 
    paddingHorizontal: 12, 
    marginTop: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  searchIcon: { 
    marginRight: 10 
  },
  searchInput: { 
    flex: 1, 
    height: 48, 
    fontSize: 15,
    color: '#1A1A1A',
  },
  clearButton: {
    padding: 4,
    marginRight: 4,
  },
  searchButton: { 
    backgroundColor: '#F5B400',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 4,
  },
  resultsScrollView: { 
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 16,
  },
  resultsCount: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  resultCard: { 
    flexDirection: 'row', 
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5B400',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  textContainer: { 
    flex: 1,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  groupName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 8,
  },
  messageContainer: {
    marginTop: 2,
  },
  resultContent: { 
    fontSize: 14, 
    color: '#4A4A4A', 
    lineHeight: 20,
  },
  highlight: {
    backgroundColor: '#FFF9C4',
    color: '#1A1A1A',
    fontWeight: '700',
    paddingHorizontal: 2,
    borderRadius: 3,
  },
  loadMoreButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#F5B400',
    borderStyle: 'dashed',
  },
  loadMoreText: { 
    color: '#F5B400', 
    fontWeight: '700', 
    fontSize: 15,
    marginRight: 6,
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
  },
  emptyContainer: { 
    padding: 40, 
    alignItems: 'center',
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: { 
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 20,
  },
});

export default SearchScreen;
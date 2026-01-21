import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { getAllFaqs, type FaqDto } from '@/services/faq';

const CATEGORIES = ['All', 'App Issues', 'Technical', 'Account'] as const;
type Category = (typeof CATEGORIES)[number];

const categoryToFaqType = (category: Category): number | null => {
  switch (category) {
    case 'App Issues':
      return 1;
    case 'Technical':
      return 2;
    case 'Account':
      return 3;
    case 'All':
    default:
      return null;
  }
};

const FAQScreen = (): React.JSX.Element => {
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [query, setQuery] = useState('');
  const [faqs, setFaqs] = useState<FaqDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openFaqId, setOpenFaqId] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getAllFaqs();
        if (res.IsSuccess && Array.isArray(res.Data)) {
          setFaqs(res.Data.filter((f) => f.IsActive !== false && f.IsDeleted !== true));
        } else {
          setFaqs([]);
          setError(res.Message ?? 'Unable to load FAQs.');
        }
      } catch (e: any) {
        setFaqs([]);
        setError(e?.message ?? 'Unable to load FAQs.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const typeFilter = categoryToFaqType(activeCategory);
    return faqs.filter((f) => {
      const matchesCategory = typeFilter === null ? true : f.FaqType === typeFilter;

      const matchesQuery =
        q.length === 0
          ? true
          : (f.Question ?? '').toLowerCase().includes(q) ||
            (f.Answer ?? '').toLowerCase().includes(q);

      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, faqs, query]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F8F8" />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#1B1B1B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>FAQ’s</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color="#9E9E9E" />
          <TextInput
            placeholder="Search messages, media, docs & more..."
            placeholderTextColor="#9E9E9E"
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        <View style={styles.categoryRow}>
          {CATEGORIES.map((category) => {
            const active = category === activeCategory;
            return (
              <TouchableOpacity
                key={category}
                style={[styles.categoryChip, active && styles.categoryChipActive]}
                onPress={() => setActiveCategory(category)}
              >
                <Text style={[styles.categoryLabel, active && styles.categoryLabelActive]}>
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <FlatList
          data={filteredItems}
          keyExtractor={(item) => String(item.Id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            loading ? (
              <View style={styles.centerState}>
                <ActivityIndicator color="#F5B400" />
                <Text style={styles.centerStateText}>Loading FAQs…</Text>
              </View>
            ) : error ? (
              <View style={styles.centerState}>
                <Text style={styles.centerStateText}>{error}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={() => router.replace('/faq')}>
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.centerState}>
                <Text style={styles.centerStateText}>No FAQs found.</Text>
              </View>
            )
          }
          renderItem={({ item }) => {
            const isOpen = openFaqId === item.Id;
            return (
              <View style={styles.faqCard}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setOpenFaqId((prev) => (prev === item.Id ? null : item.Id))}
                  style={styles.faqHeaderRow}
                >
                  <Text style={styles.faqQuestion} numberOfLines={2}>
                    {item.Question}
                  </Text>
                  <Feather
                    name="chevron-down"
                    size={18}
                    color="#1B1B1B"
                    style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}
                  />
                </TouchableOpacity>
                {isOpen ? <Text style={styles.faqAnswer}>{item.Answer}</Text> : null}
              </View>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? 6 : 0,
    paddingBottom: 18,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.35,
    color: '#000',
  },
  headerSpacer: {
    width: 44,
    height: 44,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 18,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 0.3,
    color: '#000',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 20,
  },
  categoryChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 22,
    backgroundColor: '#F1F1F1',
  },
  categoryChipActive: {
    backgroundColor: '#FFC109',
  },
  categoryLabel: {
    textAlign: 'center',
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.35,
    color: '#7C7C7C',
  },
  categoryLabelActive: {
    color: '#000',
  },
  listContent: {
    paddingBottom: 40,
    gap: 12,
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  faqHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.35,
    color: '#000',
  },
  faqAnswer: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 0.3,
    lineHeight: 20,
    color: '#666',
  },
  centerState: {
    paddingTop: 40,
    alignItems: 'center',
    gap: 10,
  },
  centerStateText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#666',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: '#FFC109',
  },
  retryText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#000',
  },
});

export default FAQScreen;




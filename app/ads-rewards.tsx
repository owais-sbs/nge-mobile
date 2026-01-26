import { AdDto, fetchAds } from '@/services/ads';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    ImageSourcePropType,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type AdItem = {
  id: string;
  image: ImageSourcePropType;
  title: string;
  cta: string;
};

type MasonryAd = AdItem & { height: number; width: number };

const SCREEN_WIDTH = Dimensions.get('window').width;
const COLUMN_COUNT = 2;
const CARD_GAP = 8; // Moderate gap between cards
const GRID_HORIZONTAL_PADDING = 16; // Better padding for margins

const AdsRewardsScreen = (): React.JSX.Element => {
  const [ads, setAds] = useState<AdDto[]>([]);
  const [imageSizes, setImageSizes] = useState<
    Record<string, { width: number; height: number }>
  >({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const PAGE_SIZE = 10;

  const columnWidth =
    (SCREEN_WIDTH - CARD_GAP - GRID_HORIZONTAL_PADDING * 2) / COLUMN_COUNT;

  // Measure remote image sizes once so we can render them
  // at their natural height (full image) in the masonry grid.
  useEffect(() => {
    ads.forEach((ad) => {
      const key = String(ad.Id);
      if (imageSizes[key] || !ad.ImageUrl) {
        return;
      }

      Image.getSize(
        ad.ImageUrl,
        (width, height) => {
          setImageSizes((prev) => ({
            ...prev,
            [key]: { width, height },
          }));
        },
        () => {
          // ignore failures; we'll fall back to default ratio
        },
      );
    });
  }, [ads, imageSizes]);

  // Pre-calculate masonry columns using the *real* image aspect ratio
  // so each image can use its full height (no artificial clipping).
  const columns = useMemo<MasonryAd[][]>(() => {
    const columnHeights = Array(COLUMN_COUNT).fill(0);
    const distributed: MasonryAd[][] = Array.from({ length: COLUMN_COUNT }, () => []);

    ads.forEach((ad) => {
      const imageSource: ImageSourcePropType = ad.ImageUrl
        ? { uri: ad.ImageUrl }
        : require('@/assets/images/ads1.png');

      let aspectRatio = 1;

      // If we've already measured this image, use its true aspect ratio
      const size = imageSizes[String(ad.Id)];
      if (size && size.width && size.height) {
        aspectRatio = size.height / size.width;
      } else if (typeof imageSource === 'number') {
        // For local bundled images we can reliably read the asset size.
        const asset = Image.resolveAssetSource(imageSource as ImageSourcePropType);
        aspectRatio =
          asset && asset.width && asset.height ? asset.height / asset.width : 1;
      }
      const height = columnWidth * aspectRatio;
      const targetColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
      distributed[targetColumnIndex].push({
        id: String(ad.Id),
        image: imageSource,
        title: ad.Title,
        cta: 'View details',
        width: columnWidth,
        height,
      });
      columnHeights[targetColumnIndex] += height;
    });

    return distributed;
  }, [ads, columnWidth]);

  const loadAds = useCallback(
    async (pageToLoad: number, replace = false) => {
      try {
        setLoading(true);
        const response = await fetchAds(pageToLoad, PAGE_SIZE);
        console.log('Fetch Ads page', pageToLoad, response);
        if (response.IsSuccess && response.Data) {
          const newAds = response.Data.Items ?? [];
          const totalCount = response.Data.TotalCount ?? 0;

          setAds((prev) => {
            const base = replace ? [] : prev;
            const merged = [...base, ...newAds];
            return merged;
          });

          const updatedLength = (replace ? 0 : ads.length) + newAds.length;
          const moreAvailable = updatedLength < totalCount;
          setHasMore(moreAvailable);
          setPage(moreAvailable ? pageToLoad + 1 : pageToLoad);
          setError(null);
        } else {
          setError(response.Message ?? 'Unable to load ads.');
        }
      } catch (err: any) {
        console.error('Failed to load ads', err);
        const message =
          err?.response?.data?.Message ||
          err.message ||
          'Unable to load ads. Please try again.';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [ads.length],
  );

  useEffect(() => {
    loadAds(1, true).catch(() => {
      /* handled */
    });
  }, [loadAds]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadAds(page, false).catch(() => {
        /* handled */
      });
    }
  }, [hasMore, loading, page, loadAds]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        <View style={styles.headerWrapper}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Feather name="arrow-left" size={22} color="#1B1B1B" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Ads & Rewards</Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.grid}>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {loading && ads.length === 0 ? (
            <ActivityIndicator style={styles.initialLoader} color="#F5B400" />
          ) : null}

          {columns.map((column, columnIndex) => (
            <View
              key={`column-${columnIndex}`}
              style={[
                styles.column,
                {
                  width: columnWidth,
                  marginRight: columnIndex === 0 ? CARD_GAP : 0,
                },
              ]}
            >
              {column.map((item, itemIndex) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.9}
                  style={[styles.card, { height: item.height }]}
                  onPress={() =>
                    router.push({
                      pathname: '/ads-detail',
                      params: {
                        id: item.id,
                        title: item.title,
                        description:
                          ads.find((a) => String(a.Id) === item.id)?.Description ?? '',
                        imageUrl:
                          ads.find((a) => String(a.Id) === item.id)?.ImageUrl ?? '',
                      },
                    })
                  }>
                  <Image source={item.image} resizeMode="cover" style={styles.cardImage} />
                </TouchableOpacity>
              ))}
            </View>
          ))}

          {ads.length === 0 && !loading && !error ? (
            <Text style={styles.emptyStateText}>No ads available yet.</Text>
          ) : null}

          {ads.length > 0 && hasMore && (
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={handleLoadMore}
              disabled={loading}
            >
              <Text style={styles.loadMoreText}>
                {loading ? 'Loading…' : 'Load more ads'}
              </Text>
            </TouchableOpacity>
          )}

        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#FFFFFF' 
  },
  container: { 
    flex: 1 
  },
  headerWrapper: { 
    paddingHorizontal: 18, // Balanced padding
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? 14 : 4, // Balanced padding
    paddingBottom: 14, // Balanced padding
  },
  backButton: { 
    width: 44, 
    height: 44, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: '#F8F9FA',
  },
  headerTitle: { 
    flex: 1, 
    textAlign: 'center', 
    fontSize: 22, 
    fontWeight: '700', 
    color: '#1B1B1B',
    letterSpacing: 0.5,
  },
  headerSpacer: { 
    width: 44, 
    height: 44 
  },

  grid: {
    flexDirection: 'row',
    paddingHorizontal: GRID_HORIZONTAL_PADDING,
    paddingTop: 12, // Moderate top padding
    paddingBottom: 20,
  },
  column: {
    flexDirection: 'column',
  },
  card: {
    borderRadius: 14, // Balanced border radius
    overflow: 'hidden',
    marginBottom: 6, // Moderate bottom margin
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    backgroundColor: '#FFFFFF',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  errorContainer: {
    width: '100%',
    paddingVertical: 20,
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
  },
  errorText: {
    color: '#E53E3E',
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    textAlign: 'center',
  },
  initialLoader: {
    marginVertical: 40,
  },
  emptyStateText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#6F6F6F',
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
  },
  loadMoreButton: {
    marginVertical: 20,
    alignSelf: 'center',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#F5B400',
    shadowColor: '#F5B400',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  loadMoreText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default AdsRewardsScreen;

import { hasAdminRole } from '@/src/services/authRoles';
import { storage, UserData } from '@/src/lib/storage';
import { AdDto, fetchAds } from '@/services/ads';
import { getAllPostCategories, PostCategoryDto } from '@/services/postCategory';
import {
  addLike,
  addOrUpdateComment,
  CommentDto,
  deleteComment,
  deletePost,
  fetchPosts,
  getComments,
  getPostsByCategoryId,
  PostDto,
  removeLike,
  toggleSavePost,
} from '@/services/posts';

import { fetchNotifications } from '@/services/notification';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { ResizeMode, Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const SF_PRO_TEXT_REGULAR = Platform.select({
  ios: 'SFProText-Regular',
  default: 'Inter_400Regular',
});

const SCREEN_WIDTH = Dimensions.get('window').width;

// Fallback images if no ads are available
const FALLBACK_HERO_IMAGES = [
  require('@/assets/images/hero3.png'),
  require('@/assets/images/hero2.png'),
  require('@/assets/images/hero4.png'),
];

const DEFAULT_AVATAR = require('@/assets/images/profile1.png');
const FALLBACK_IMAGE = require('@/assets/images/hero2.png');
const DEFAULT_PAGE_SIZE = 10;

const isImageUrl = (url: string): boolean => {
  const lower = url.toLowerCase();
  return (
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.png') ||
    lower.endsWith('.gif') ||
    lower.endsWith('.webp') ||
    lower.endsWith('.bmp')
  );
};

const isVideoUrl = (url: string): boolean => {
  const lower = url.toLowerCase();
  return (
    lower.endsWith('.mp4') ||
    lower.endsWith('.mov') ||
    lower.endsWith('.m4v') ||
    lower.endsWith('.avi') ||
    lower.endsWith('.mkv') ||
    lower.endsWith('.webm')
  );
};

const isValidProfileImage = (url: string | undefined | null): boolean => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  // Check if it's just the base CloudFront URL or empty
  if (trimmed === '' || trimmed === 'https://d32fcvmmn6ow56.cloudfront.net/' || trimmed.endsWith('cloudfront.net/')) {
    return false;
  }
  // Check if it has a valid image extension
  return trimmed.length > 0 && (
    trimmed.includes('/account_images/') ||
    trimmed.includes('/profile_images/') ||
    isImageUrl(trimmed)
  );
};

const HomeScreen = (): React.JSX.Element => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [posts, setPosts] = useState<PostDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<number>>(new Set());
  const [savingPostId, setSavingPostId] = useState<number | null>(null);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [comments, setComments] = useState<CommentDto[]>([]);
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);
  const [loadingComments, setLoadingComments] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);
  const [showDeleteLoader, setShowDeleteLoader] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [postToDelete, setPostToDelete] = useState<number | null>(null);
  const [ads, setAds] = useState<AdDto[]>([]);
  const [loadingAds, setLoadingAds] = useState(false);
  const [categories, setCategories] = useState<PostCategoryDto[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const autoPlayIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
 const [unreadCount, setUnreadCount] = useState(0)

  // Get the first 4 ads for the slider
  const sliderAds = ads.slice(0, 4);
  const hasAds = sliderAds.length > 0 && sliderAds.some(ad => ad.ImageUrl);
  const imageCount = hasAds 
    ? sliderAds.filter(ad => ad.ImageUrl).length 
    : FALLBACK_HERO_IMAGES.length;

  const handlePrevImage = () => {
    const maxIndex = imageCount - 1;
    setCurrentImageIndex((prevIndex) => (prevIndex === 0 ? maxIndex : prevIndex - 1));
  };

  const handleNextImage = useCallback(() => {
    const maxIndex = imageCount - 1;
    setCurrentImageIndex((prevIndex) => (prevIndex === maxIndex ? 0 : prevIndex + 1));
  }, [imageCount]);

  // Load ads for slider
  useEffect(() => {
    const loadAdsForSlider = async () => {
      try {
        setLoadingAds(true);
        const response = await fetchAds(1, 4); // Fetch first 4 ads
        if (response.IsSuccess && response.Data) {
          const adsList = response.Data.Items ?? [];
          setAds(adsList);
        }
      } catch (err) {
        console.error('Failed to load ads for slider:', err);
        // Keep fallback images if ads fail to load
      } finally {
        setLoadingAds(false);
      }
    };
    loadAdsForSlider();
  }, []);

  // Load post categories
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

  // Auto-play slider - change image every 3 seconds
  useEffect(() => {
    if (imageCount === 0) return;
    
    // Set up auto-play interval
    const intervalId = setInterval(() => {
      setCurrentImageIndex((prevIndex) => {
        const maxIndex = imageCount - 1;
        const nextIndex = prevIndex === maxIndex ? 0 : prevIndex + 1;
        return nextIndex;
      });
    }, 3000); // 3 seconds

    // Store interval ID in ref for potential manual clearing
    autoPlayIntervalRef.current = intervalId;

    // Cleanup on unmount
    return () => {
      clearInterval(intervalId);
      autoPlayIntervalRef.current = null;
    };
  }, [imageCount]); // Re-run when image count changes

  const formatPostTime = (dateString: string): string => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return 'Just now';
    }
    return date.toLocaleDateString();
  };

  const loadPosts = useCallback(
  async (pageToLoad: number, replace = false, categoryId: number | null = null) => {
    try {
      setLoading(true);
      let response;
      
      if (categoryId !== null) {
        response = await getPostsByCategoryId(categoryId);
        if (response.IsSuccess && response.Data) {
          const categoryPosts = Array.isArray(response.Data) ? response.Data : [];
          setPosts(categoryPosts); 
          setHasMore(false); // Categories usually aren't paginated in this setup
          setError(null);
        }
      } else {
        response = await fetchPosts(pageToLoad, DEFAULT_PAGE_SIZE);
        if (response.IsSuccess && response.Data) {
          const newPosts = response.Data.Items ?? [];
          const totalCount = response.Data.TotalCount ?? 0;

          setPosts((prev) => (replace ? newPosts : [...prev, ...newPosts]));

          const currentTotalLoaded = (replace ? 0 : posts.length) + newPosts.length;
          setHasMore(currentTotalLoaded < totalCount && newPosts.length > 0);
          
          // Increment page only if we successfully loaded data
          if (newPosts.length > 0) {
            setPage(pageToLoad + 1);
          }
          setError(null);
        }
      }
    } catch (err: any) {
      setError('Unable to load posts.');
    } finally {
      setLoading(false);
    }
  },
  [posts.length]
);

  useEffect(() => {
    // Load user data and determine if current user is admin
    storage
      .getUser()
      .then((userData) => {
        setUser(userData);
        setIsAdmin(hasAdminRole(userData));
      })
      .catch(() => {
        setIsAdmin(false);
        setUser(null);
      });
  }, []);

  useFocusEffect(
  useCallback(() => {
    // Only load if we have no posts (initial load)
    // This prevents the "reset to top" behavior when navigating back
    if (posts.length === 0 && selectedCategoryId === null) {
      loadPosts(1, true, null).catch(() => {});
    }
    
    // Always update notification count
    updateNotificationCount();
  }, [loadPosts, selectedCategoryId, posts.length])
);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore && selectedCategoryId === null) {
      // Only allow load more for all posts, not for category-filtered posts
      loadPosts(page, false, null).catch(() => {
        /* handled */
      });
    }
  }, [hasMore, loading, page, loadPosts, selectedCategoryId]);

  const handleLike = async (postId: number) => {
    if (!user || !user.Id) {
      Alert.alert('Error', 'Please sign in to like posts.');
      return;
    }

    const isLiked = likedPosts.has(postId);

    try {
      let response;
      if (isLiked) {
        // Unlike the post
        console.log('Removing like from post:', postId, 'by user:', user.Id);
        response = await removeLike(postId, user.Id);
      } else {
        // Like the post
        console.log('Adding like to post:', postId, 'by user:', user.Id);
        response = await addLike(postId, user.Id);
      }

      if (response.IsSuccess) {
        // Update the like count in the posts array
        setPosts((prev) =>
          prev.map((post) =>
            post.Id === postId
              ? {
                  ...post,
                  LikeCount: isLiked ? post.LikeCount - 1 : post.LikeCount + 1,
                }
              : post
          )
        );
        // Toggle liked state
        setLikedPosts((prev) => {
          const newSet = new Set(prev);
          if (isLiked) {
            newSet.delete(postId);
          } else {
            newSet.add(postId);
          }
          return newSet;
        });
        console.log(isLiked ? 'Unlike successful' : 'Like successful');
      } else {
        Alert.alert('Error', response.Message || 'Failed to update like');
      }
    } catch (err: any) {
      console.error('Error updating like:', err);
      const errorMessage =
        err.response?.data?.Message ||
        err.message ||
        'Failed to update like. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleSavePost = async (postId: number) => {
    if (!user || !user.Id) {
      Alert.alert('Error', 'Please sign in to save posts.');
      return;
    }

    if (savingPostId === postId) return; // Prevent double clicks

    const isSaved = savedPosts.has(postId);
    setSavingPostId(postId);

    try {
      const response = await toggleSavePost(postId, user.Id);
      
      if (response.IsSuccess) {
        const isNowSaved = !isSaved;
        
        // Toggle saved state
        setSavedPosts((prev) => {
          const newSet = new Set(prev);
          if (isNowSaved) {
            newSet.add(postId);
          } else {
            newSet.delete(postId);
          }
          return newSet;
        });
      } else {
        Alert.alert('Error', response.Message || 'Failed to save post');
      }
    } catch (err: any) {
      console.error('Error saving post:', err);
      const errorMessage =
        err.response?.data?.Message ||
        err.message ||
        'Failed to save post. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setSavingPostId(null);
    }
  };


 ;

// Notification count fetch karne ke liye function
const updateNotificationCount = async () => {
  try {
    const userData = await storage.getUser();
    if (userData?.Id) {
      const response = await fetchNotifications(userData.Id);
      if (response.data.IsSuccess) {
        // Sirf wo count karein jo IsRead: false hain
        const unread = response.data.Data.filter((n: any) => !n.IsRead).length;
        setUnreadCount(unread);
      }
    }
  } catch (err) {
    console.log("Error fetching notification count", err);
  }
};

// Jab bhi Home Screen focus mein aaye (wapas aayein), count update karein
useFocusEffect(
  useCallback(() => {
    updateNotificationCount();
  }, [])
);

  const handleOpenComments = async (postId: number) => {
    setSelectedPostId(postId);
    setShowCommentsModal(true);
    setLoadingComments(true);
    try {
      const response = await getComments(postId);
      if (response.IsSuccess && response.Data) {
        console.log('Comments data with User profile images:', JSON.stringify(response.Data.map(c => ({
          id: c.Id,
          userName: c.User?.Name,
          profileImage: c.User?.ProfileImage
        })), null, 2));
        setComments(response.Data);
      } else {
        setComments([]);
      }
    } catch (err) {
      console.error('Failed to load comments:', err);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const handlePostComment = async () => {
    if (!commentText.trim() || !user || !user.Id || !selectedPostId) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }

    setPostingComment(true);
    try {
      const response = await addOrUpdateComment({
        Id: editingCommentId || 0,
        PostId: selectedPostId,
        UserId: user.Id,
        Comments: commentText.trim(),
      });

      if (response.IsSuccess) {
        setCommentText('');
        setEditingCommentId(null);
        // Refresh comments
        const commentsResponse = await getComments(selectedPostId);
        if (commentsResponse.IsSuccess && commentsResponse.Data) {
          setComments(commentsResponse.Data);
        }
        // Update comment count in posts (only increment if new comment)
        if (!editingCommentId) {
          setPosts((prev) =>
            prev.map((post) =>
              post.Id === selectedPostId
                ? { ...post, CommentCount: post.CommentCount + 1 }
                : post
            )
          );
        }
      } else {
        Alert.alert('Error', response.Message || 'Failed to post comment');
      }
    } catch (err: any) {
      console.error('Error posting comment:', err);
      const errorMessage =
        err.response?.data?.Message ||
        err.message ||
        'Failed to post comment. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setPostingComment(false);
    }
  };

  const handleEditComment = (comment: CommentDto) => {
    if (!user || !user.Id || comment.UserId !== user.Id) return;
    setEditingCommentId(comment.Id);
    setCommentText(comment.Comments || '');
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setCommentText('');
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!user || !user.Id || !selectedPostId) {
      Alert.alert('Error', 'Please sign in to delete comments.');
      return;
    }

    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingCommentId(commentId);
              const response = await deleteComment(commentId);
              
              if (response.IsSuccess) {
                // Remove comment from list
                setComments((prev) => prev.filter((c) => c.Id !== commentId));
                // Update comment count in posts
                setPosts((prev) =>
                  prev.map((post) =>
                    post.Id === selectedPostId
                      ? { ...post, CommentCount: Math.max(0, post.CommentCount - 1) }
                      : post
                  )
                );
              } else {
                Alert.alert('Error', response.Message || 'Failed to delete comment');
              }
            } catch (err: any) {
              console.error('Error deleting comment:', err);
              Alert.alert('Error', 'Failed to delete comment. Please try again.');
            } finally {
              setDeletingCommentId(null);
            }
          },
        },
      ],
    );
  };

  const formatCommentTime = (dateString?: string): string => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return 'Just now';
    }
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
          <LinearGradient colors={['#FFF7D1', '#FFE36B', '#FFC109']} style={styles.header}>
            <Image
              source={require('@/assets/images/Polygon1.png')}
              style={styles.headerDecoration}
              resizeMode="cover"
            />
            <View style={styles.headerContent}>
              <TouchableOpacity onPress={() => router.push('/profile')}>
                <Image 
                          source={isValidProfileImage(user?.ProfileImage) ? { uri: user.ProfileImage } : require('@/assets/images/profile3.png')} 
                          style={styles.profileImage}
                        />
              </TouchableOpacity>
              
<TouchableOpacity
  style={styles.notificationButton}
  onPress={() => router.push('/notification')}
>
  <Feather name="bell" size={24} color="black" />
  {unreadCount > 0 && (
    <View style={styles.notificationBadge}>
      <Text style={styles.notificationCount}>
        {unreadCount > 99 ? '99+' : unreadCount}
      </Text>
    </View>
  )}
</TouchableOpacity>
              <TouchableOpacity style={styles.searchButton} onPress={() => router.push('/search')}>
                <Feather name="search" size={16} color="black" />
                <Text style={styles.searchText}>Search</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.heroContainer}>
              <TouchableOpacity
                onPress={() => {
                  router.push('/ads-rewards');
                }}
                activeOpacity={0.9}
                style={styles.heroImageTouchable}
              >
                {hasAds && sliderAds[currentImageIndex]?.ImageUrl ? (
                  <Image 
                    source={{ uri: sliderAds[currentImageIndex].ImageUrl! }} 
                    style={styles.heroImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Image 
                    source={FALLBACK_HERO_IMAGES[currentImageIndex % FALLBACK_HERO_IMAGES.length]} 
                    style={styles.heroImage}
                    resizeMode="cover"
                  />
                )}
              </TouchableOpacity>
              {imageCount > 1 && (
                <>
                  <TouchableOpacity style={[styles.heroArrow, styles.heroArrowLeft]} onPress={handlePrevImage}>
                    <Feather name="chevron-left" size={24} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.heroArrow, styles.heroArrowRight]} onPress={handleNextImage}>
                    <Feather name="chevron-right" size={24} color="white" />
                  </TouchableOpacity>
                </>
              )}
            </View>

            <TouchableOpacity style={styles.promoButton} onPress={() => router.push('/ads-rewards')}>
              <Text style={styles.promoText}>All Promotions & Rewards</Text>
            </TouchableOpacity>
          </LinearGradient>

          <View style={styles.contentArea}>
            <Text style={styles.trendingTitle}>Trending Topics</Text>
            {loadingCategories ? (
              <View style={styles.trendingContainer}>
                <ActivityIndicator size="small" color="#F5B400" />
              </View>
            ) : categories.length > 0 ? (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.trendingScrollContent}
                style={styles.trendingScrollView}
              >
                <TouchableOpacity
                  style={[
                    styles.topicChip,
                    selectedCategoryId === null && styles.topicChipActive,
                  ]}
                  onPress={() => {
                    setSelectedCategoryId(null);
                    // Load all posts
                    setPage(1);
                    setHasMore(true);
                    loadPosts(1, true, null).catch(() => {
                      /* handled in load */
                    });
                  }}
                >
                  <Text style={styles.topicText}>All</Text>
                </TouchableOpacity>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.Id}
                    style={[
                      styles.topicChip,
                      selectedCategoryId === category.Id && styles.topicChipActive,
                    ]}
                    onPress={() => {
                      const newCategoryId = selectedCategoryId === category.Id ? null : category.Id;
                      setSelectedCategoryId(newCategoryId);
                      // Load posts for the selected category or all posts if deselected
                      setPage(1);
                      setHasMore(true);
                      loadPosts(1, true, newCategoryId).catch(() => {
                        /* handled in load */
                      });
                    }}
                  >
                    <Text style={styles.topicText}>#{category.Title}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.trendingContainer}>
                <Text style={styles.emptyCategoriesText}>No categories available</Text>
              </View>
            )}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {loading ? (
              <ActivityIndicator style={styles.initialLoader} color="#F5B400" />
            ) : null}
            {!loading && posts.length === 0 && !error ? (
              <Text style={styles.emptyStateText}>No posts available just yet.</Text>
            ) : null}
            {posts.map((post) => (
              <View key={post.Id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <TouchableOpacity
                    onPress={() => router.push({ pathname: '/post-detail', params: { id: post.Id.toString() } })}
                    activeOpacity={0.9}
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                  >
                    <Image 
                      source={
                        post.ProfileImage && isValidProfileImage(post.ProfileImage)
                          ? { uri: post.ProfileImage }
                          : (user?.ProfileImage && post.UserId === user.Id && isValidProfileImage(user.ProfileImage)
                              ? { uri: user.ProfileImage }
                              : DEFAULT_AVATAR)
                      } 
                      style={styles.postAvatar} 
                    />
                    <View style={styles.postHeaderText}>
                      <Text style={styles.postUser}>{post.Name}</Text>
                      <Text style={styles.postTime}>{formatPostTime(post.CreatedOn)}</Text>
                    </View>
                  </TouchableOpacity>
                  {isAdmin ? (
                    <Pressable
                      style={styles.deleteButton}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      onPress={() => {
                        console.log('=== DELETE BUTTON PRESSED ===', post.Id);
                        setPostToDelete(post.Id);
                        setShowDeleteConfirm(true);
                      }}
                      disabled={deletingPostId === post.Id}
                    >
                      {deletingPostId === post.Id ? (
                        <ActivityIndicator size="small" color="#D9534F" />
                      ) : (
                        <Feather name="trash-2" size={16} color="#D9534F" />
                      )}
                    </Pressable>
                  ) : null}
                  </View>
                <TouchableOpacity
                  onPress={() => router.push({ pathname: '/post-detail', params: { id: post.Id.toString() } })}
                  activeOpacity={0.9}
                >
                  {post.Description ? (
                    <Text style={styles.postText}>{post.Description}</Text>
                  ) : null}
                  {post.ImageUrl && isImageUrl(post.ImageUrl) && (
                    <Image source={{ uri: post.ImageUrl }} style={styles.postImage} />
                  )}
                  {post.ImageUrl && isVideoUrl(post.ImageUrl) && (
                    <Video
                      source={{ uri: post.ImageUrl }}
                      style={styles.postVideo}
                      useNativeControls
                      resizeMode={ResizeMode.CONTAIN}
                      shouldPlay
                      isLooping
                    />
                  )}
                </TouchableOpacity>
                <View style={styles.postFooter}>
                  <View style={styles.postMeta}>
                    <TouchableOpacity
                      onPress={() => handleLike(post.Id)}
                      style={styles.metaItem}
                      disabled={!user}
                      activeOpacity={0.7}
                    >
                      {likedPosts.has(post.Id) ? (
                        <MaterialIcons
                          name="favorite"
                          size={16}
                          color="#E74C3C"
                        />
                      ) : (
                        <Feather
                          name="heart"
                          size={16}
                          color="#FF4D67"
                        />
                      )}
                      <Text
                        style={[
                          styles.metaText,
                          likedPosts.has(post.Id) && styles.likedText,
                        ]}
                      >
                        {post.LikeCount}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleOpenComments(post.Id)}
                      style={styles.metaItem}
                      activeOpacity={0.7}
                    >
                      <Feather name="message-circle" size={16} color="#FFC109" />
                      <Text style={styles.metaText}>{post.CommentCount}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleSavePost(post.Id)}
                      style={styles.metaItem}
                      disabled={!user || savingPostId === post.Id}
                      activeOpacity={0.7}
                    >
                      {savingPostId === post.Id ? (
                        <ActivityIndicator size="small" color="#F5B400" />
                      ) : savedPosts.has(post.Id) ? (
                        <MaterialIcons
                          name="bookmark"
                          size={16}
                          color="#F5B400"
                        />
                      ) : (
                        <Feather
                          name="bookmark"
                          size={16}
                          color="#6F6F6F"
                        />
                      )}
                      <Text
                        style={[
                          styles.metaText,
                          savedPosts.has(post.Id) && styles.savedText,
                        ]}
                      >
                        {savedPosts.has(post.Id) ? 'Saved' : 'Save'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
            {posts.length >= 10 && hasMore && (
  <TouchableOpacity
    style={styles.loadMoreButton}
    onPress={handleLoadMore}
    disabled={loading}
  >
    {loading ? (
      <ActivityIndicator size="small" color="#8A6A00" />
    ) : (
      <Text style={styles.loadMoreText}>Load more posts</Text>
    )}
  </TouchableOpacity>
)}
          </View>
        </ScrollView>

        <TouchableOpacity style={styles.fab} onPress={() => router.push('/add-post')}>
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Comments Modal */}
      <Modal
        visible={showCommentsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowCommentsModal(false);
          setSelectedPostId(null);
          setComments([]);
          setCommentText('');
          setEditingCommentId(null);
          setDeletingCommentId(null);
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardView}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comments</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowCommentsModal(false);
                  setSelectedPostId(null);
                  setComments([]);
                  setCommentText('');
                }}
              >
                <Feather name="x" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            {/* Comments List */}
            <ScrollView
              style={styles.commentsList}
              contentContainerStyle={styles.commentsListContent}
            >
              {loadingComments ? (
                <ActivityIndicator
                  color="#F5B400"
                  style={styles.commentsLoader}
                />
              ) : comments.length === 0 ? (
                <View style={styles.emptyCommentsContainer}>
                  <Text style={styles.emptyCommentsText}>
                    No comments yet. Be the first to comment!
                  </Text>
                </View>
              ) : (
                comments.map((comment) => (
                  <View key={comment.Id} style={styles.commentItem}>
                    <View style={styles.commentHeader}>
                      <View style={styles.commentHeaderLeft}>
                        <Image
                          source={isValidProfileImage(comment.User?.ProfileImage) ? { uri: comment.User.ProfileImage } : DEFAULT_AVATAR}
                          style={styles.commentAvatar}
                        />
                        <View style={styles.commentUserInfo}>
                          <Text style={styles.commentAuthor}>
                            {comment.User?.Name || 'User'}
                          </Text>
                          <Text style={styles.commentTime}>
                            {formatCommentTime(comment.CreatedOn)}
                          </Text>
                        </View>
                      </View>
                      {user && user.Id === comment.UserId && (
                        <View style={styles.commentActions}>
                          <TouchableOpacity
                            onPress={() => handleEditComment(comment)}
                            style={styles.editCommentButton}
                            disabled={editingCommentId === comment.Id || deletingCommentId === comment.Id}
                          >
                            <Feather 
                              name="edit-2" 
                              size={16} 
                              color={editingCommentId === comment.Id ? "#999" : "#F5B400"} 
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeleteComment(comment.Id)}
                            style={styles.deleteCommentButton}
                            disabled={editingCommentId === comment.Id || deletingCommentId === comment.Id}
                          >
                            {deletingCommentId === comment.Id ? (
                              <ActivityIndicator size="small" color="#D9534F" />
                            ) : (
                              <Feather 
                                name="trash-2" 
                                size={16} 
                                color="#D9534F" 
                              />
                            )}
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                    <Text style={styles.commentText}>{comment.Comments}</Text>
                  </View>
                ))
              )}
            </ScrollView>

            {/* Comment Input */}
            <View style={styles.commentInputContainer}>
              {editingCommentId && (
                <View style={styles.editCommentHeader}>
                  <Text style={styles.editCommentText}>Editing comment...</Text>
                  <TouchableOpacity onPress={handleCancelEdit}>
                    <Feather name="x" size={18} color="#999" />
                  </TouchableOpacity>
                </View>
              )}
              <View style={styles.commentInputRow}>
                <TextInput
                  style={styles.commentInput}
                  placeholder={editingCommentId ? "Edit your comment..." : "Write a comment..."}
                  placeholderTextColor="#999"
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  onPress={handlePostComment}
                  disabled={postingComment || !commentText.trim()}
                  style={[
                    styles.postCommentButton,
                    (!commentText.trim() || postingComment) &&
                      styles.postCommentButtonDisabled,
                  ]}
                >
                  {postingComment ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Feather name="send" size={20} color="#FFF" />
                  )}
                </TouchableOpacity>
              </View>
              {editingCommentId && (
                <TouchableOpacity
                  onPress={handleCancelEdit}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowDeleteConfirm(false);
          setPostToDelete(null);
        }}
      >
        <View style={styles.deleteConfirmOverlay}>
          <View style={styles.deleteConfirmContainer}>
            <Text style={styles.deleteConfirmTitle}>Delete Post</Text>
            <Text style={styles.deleteConfirmMessage}>
              Are you sure you want to delete this post? This action cannot be undone.
            </Text>
            <View style={styles.deleteConfirmButtons}>
              <TouchableOpacity
                style={[styles.deleteConfirmButton, styles.deleteConfirmCancelButton]}
                onPress={() => {
                  setShowDeleteConfirm(false);
                  setPostToDelete(null);
                }}
              >
                <Text style={styles.deleteConfirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteConfirmButton, styles.deleteConfirmDeleteButton]}
                onPress={async () => {
                  if (!postToDelete) return;
                  setShowDeleteConfirm(false);
                  console.log('Delete confirmed, starting deletion...');
                  try {
                    setDeletingPostId(postToDelete);
                    setShowDeleteLoader(true);
                    console.log('Calling deletePost API...');
                    await deletePost(postToDelete);
                    console.log('Post deleted successfully');
                    setPosts((prev) => prev.filter((p) => p.Id !== postToDelete));
                    setShowDeleteLoader(false);
                    setDeletingPostId(null);
                    setPostToDelete(null);
                    Alert.alert('Success', 'Post deleted successfully');
                  } catch (err: any) {
                    console.error('Failed to delete post', err);
                    setShowDeleteLoader(false);
                    setDeletingPostId(null);
                    setPostToDelete(null);
                    const errorMessage =
                      err.response?.data?.Message ||
                      err.message ||
                      'Failed to delete post. Please try again.';
                    Alert.alert('Error', errorMessage);
                  }
                }}
              >
                <Text style={styles.deleteConfirmDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Loading Overlay */}
      <Modal
        visible={showDeleteLoader}
        transparent
        animationType="fade"
      >
        <View style={styles.deleteLoaderOverlay}>
          <View style={styles.deleteLoaderContainer}>
            <ActivityIndicator size="large" color="#F5B400" />
            <Text style={styles.deleteLoaderText}>Deleting post...</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF7D1',
  },
  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    paddingBottom: 20,
    overflow: 'hidden',
  },
  headerDecoration: {
    position: 'absolute',
    top: -40,
    right: -80,
    width: 280,
    height: 200,
    opacity: 0.35,
  },
  
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 21,
    marginBottom: 15,
  },
  profileImage: {
    top: 5,
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  notificationButton: {
    marginLeft: 'auto',
    marginRight: 10,
  },
  notificationBadge: {
    position: 'absolute',
    right: -5,
    top: -5,
    backgroundColor: 'red',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCount: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: 'black',
    paddingVertical: 5,
    paddingHorizontal: 15,
    width: 94,
    height: 30,
  },
  searchText: {
    marginLeft: 5,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#1B1B1B',
  },
  heroContainer: {
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImageTouchable: {
    width: SCREEN_WIDTH - 40, // Full width with small margins (20px on each side)
    maxWidth: '100%',
    height: 163,
    borderRadius: 15,
    overflow: 'hidden',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
  },
  heroArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -12, // Half of icon size
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 15,
    padding: 2,
  },
  heroArrowLeft: {
    left: 15,
  },
  heroArrowRight: {
    right: 15,
  },
  promoButton: {
    backgroundColor: '#34A853',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 18,
    alignSelf: 'center',
    marginTop: 15,
    marginBottom: 10, // Add space below
  },
  promoText: {
    color: 'white',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.35,
  },
  contentArea: {
    backgroundColor: 'white',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    marginTop: -20, // Overlap effect
    flex: 1,
  },
  trendingTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.35,
    marginBottom: 10,
  },
  trendingContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 10,
  },
  trendingScrollView: {
    marginBottom: 10,
  },
  trendingScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyCategoriesText: {
    fontSize: 14,
    color: '#8A8A8A',
    fontFamily: 'Inter_400Regular',
  },
  topicChip: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 10,
    alignSelf: 'flex-start',
    flexShrink: 0,
    flexGrow: 0,
  },
  topicChipActive: {
    backgroundColor: '#FFFBEA',
    borderColor: '#F5B400',
    borderWidth: 1,
  },
  topicText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.35,
  },
  postCard: {
    marginBottom: 18,
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  postHeaderText: {
    flex: 1,
  },
  postUser: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  postTime: {
    color: 'grey',
    fontSize: 11.78,
    fontFamily: SF_PRO_TEXT_REGULAR,
    letterSpacing: 0.98,
  },
  postText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 0.3,
    lineHeight: 20,
    marginBottom: 18,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 15,
    marginBottom: 16,
  },
  postVideo: {
    width: '100%',
    height: 220,
    borderRadius: 15,
    marginBottom: 16,
    backgroundColor: '#000',
  },
  postMeta: {
    flexDirection: 'row',
    columnGap: 18,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
  },
  metaText: {
    color: '#5C5C5C',
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  likedText: {
    color: '#E74C3C',
  },
  savedText: {
    color: '#F5B400',
  },
  savedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
    backgroundColor: '#E3F7EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  loadMoreButton: {
    marginVertical: 16,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F5B400',
    backgroundColor: '#FFFBEA',
  },
  loadMoreText: {
    fontFamily: 'Inter_500Medium',
    color: '#8A6A00',
    fontSize: 14,
  },
  deleteButton: {
    marginLeft: 8,
    padding: 4,
  },
  errorText: {
    color: '#D9534F',
    fontFamily: 'Inter_500Medium',
    marginBottom: 12,
  },
  emptyStateText: {
    textAlign: 'center',
    color: '#6F6F6F',
    fontFamily: 'Inter_500Medium',
    marginTop: 12,
  },
  initialLoader: {
    marginVertical: 12,
  },
  fab: {
    position: 'absolute',
    bottom: 40,
    right: 30,
    backgroundColor: '#FFC109',
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fabIcon: {
    color: 'black',
    fontSize: 36,
    lineHeight: 36,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalKeyboardView: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  commentsList: {
    flex: 1,
  },
  commentsListContent: {
    padding: 16,
    paddingBottom: 20,
  },
  commentsLoader: {
    marginVertical: 20,
  },
  emptyCommentsContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyCommentsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  commentItem: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  commentHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
  },
  commentUserInfo: {
    flex: 1,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editCommentButton: {
    padding: 4,
  },
  deleteCommentButton: {
    padding: 4,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  commentTime: {
    fontSize: 12,
    color: '#999',
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  commentInputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    backgroundColor: '#FAFAFA',
  },
  editCommentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  editCommentText: {
    fontSize: 12,
    color: '#F5B400',
    fontStyle: 'italic',
    fontWeight: '500',
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  commentInput: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 14,
    color: '#000',
  },
  cancelButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  postCommentButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5B400',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postCommentButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  deleteLoaderOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteLoaderContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    minWidth: 200,
  },
  deleteLoaderText: {
    marginTop: 16,
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
  },
  deleteConfirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  deleteConfirmContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  deleteConfirmTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  deleteConfirmMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  deleteConfirmButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  deleteConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteConfirmCancelButton: {
    backgroundColor: '#F0F0F0',
  },
  deleteConfirmDeleteButton: {
    backgroundColor: '#D9534F',
  },
  deleteConfirmCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  deleteConfirmDeleteText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default HomeScreen;


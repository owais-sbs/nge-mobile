import {
    addLike,
    addOrUpdateComment,
    CommentDto,
    getComments,
    getMyPosts,
    getMySavedPosts,
    PostDto,
    removeLike,
} from '@/services/posts';
import { storage, UserData } from '@/src/lib/storage';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const RECENT_POSTS = [
  {
    id: 'recent-1',
    user: 'Sarah Johnson',
    time: '4 mins ago',
    avatar: require('@/assets/images/profile2.png'),
    snippet: 'Looking for recommendations on best multimeter for gas work near Hounslow...',
    likes: 9,
    comments: 10,
  },
  {
    id: 'recent-2',
    user: 'Sarah Johnson',
    time: '4 mins ago',
    avatar: require('@/assets/images/profile2.png'),
    snippet: 'Looking for recommendations on best multimeter for gas work near Hounslow...',
    likes: 9,
    comments: 10,
  },
];

const DEFAULT_AVATAR = require('@/assets/images/profile1.png');

const normalizeRemoteUri = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const uri = value.trim();
  return uri.length > 0 ? uri : null;
};

const isValidProfileImage = (url: string | undefined | null): boolean => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  // Check if it's just the base CloudFront URL or empty
  if (trimmed === '' || trimmed === 'https://d32fcvmmn6ow56.cloudfront.net/' || trimmed.endsWith('cloudfront.net/')) {
    return false;
  }
  // Check if it has a valid image path
  return trimmed.length > 0 && (
    trimmed.includes('/account_images/') ||
    trimmed.includes('/profile_images/') ||
    /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(trimmed)
  );
};

// Backend responses sometimes return the profile image at different locations/keys.
const getPostProfileImage = (post: PostDto): string | null => {
  const anyPost = post as any;
  return (
    normalizeRemoteUri((post as any).ProfileImage) ??
    normalizeRemoteUri(anyPost?.User?.ProfileImage) ??
    normalizeRemoteUri(anyPost?.Account?.ProfileImage) ??
    normalizeRemoteUri(anyPost?.profileImage) ??
    null
  );
};

const getCommentProfileImage = (comment: CommentDto): string | null => {
  const anyComment = comment as any;
  return (
    normalizeRemoteUri(comment.User?.ProfileImage) ??
    normalizeRemoteUri(anyComment?.User?.profileImage) ??
    null
  );
};

const ProfileScreen = (): React.JSX.Element => {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<UserData | null>(null);
  const [posts, setPosts] = useState<PostDto[]>([]);
  const [savedPosts, setSavedPosts] = useState<PostDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSavedPosts, setLoadingSavedPosts] = useState(false);
  const [showAllPosts, setShowAllPosts] = useState(false);
  const [showAllSavedPosts, setShowAllSavedPosts] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [comments, setComments] = useState<CommentDto[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [postingComment, setPostingComment] = useState(false);

  const loadUser = useCallback(async () => {
    try {
      const storedUser = await storage.getUser();
      setUser(storedUser);
    } catch (err) {
      console.error('Failed to load user for profile', err);
      setUser(null);
    }
  }, []);

  const loadPosts = useCallback(async () => {
    try {
      const storedUser = await storage.getUser();
      if (!storedUser || !storedUser.Id) {
        console.log('No user ID found in storage');
        setPosts([]);
        return;
      }

      setLoading(true);
      console.log('Profile - Calling getMyPosts with userId:', storedUser.Id);
      const response = await getMyPosts(storedUser.Id);
      console.log('Profile - API Response:', JSON.stringify(response, null, 2));

      if (response.IsSuccess) {
        const postsData = Array.isArray(response.Data) ? response.Data : [];
        console.log('Profile - Setting posts, count:', postsData.length);
        console.log(
          'Profile - Posts with ProfileImage:',
          JSON.stringify(
            postsData.map((p) => ({
              id: p.Id,
              userId: p.UserId,
              profileImage: (p as any).ProfileImage,
              resolved: getPostProfileImage(p),
            })),
            null,
            2,
          ),
        );
        // Normalize the field so rendering is consistent even if backend shape varies.
        setPosts(
          postsData.map((p) => ({
            ...p,
            ProfileImage: getPostProfileImage(p) ?? undefined,
          })),
        );
      } else {
        console.log('Profile - API returned IsSuccess=false:', response.Message);
        setPosts([]);
      }
    } catch (err) {
      console.error('Profile - Failed to load posts:', err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSavedPosts = useCallback(async () => {
    try {
      const storedUser = await storage.getUser();
      if (!storedUser || !storedUser.Id) {
        console.log('No user ID found in storage for saved posts');
        setSavedPosts([]);
        return;
      }

      setLoadingSavedPosts(true);
      console.log('Profile - Calling getMySavedPosts with userId:', storedUser.Id);
      const response = await getMySavedPosts(storedUser.Id);
      console.log('Profile - Saved Posts API Response:', JSON.stringify(response, null, 2));

      if (response.IsSuccess) {
        const savedPostsData = Array.isArray(response.Data) ? response.Data : [];
        console.log('Profile - Setting saved posts, count:', savedPostsData.length);
        setSavedPosts(savedPostsData);
      } else {
        console.log('Profile - Saved Posts API returned IsSuccess=false:', response.Message);
        setSavedPosts([]);
      }
    } catch (err) {
      console.error('Profile - Failed to load saved posts:', err);
      setSavedPosts([]);
    } finally {
      setLoadingSavedPosts(false);
    }
  }, []);

  // Load once on mount (for direct navigation)
  useEffect(() => {
    loadUser().catch(() => {
      /* handled */
    });
  }, [loadUser]);

  // And refresh whenever the profile screen gains focus
  useFocusEffect(
    useCallback(() => {
      loadUser().catch(() => {
        /* handled */
      });
      loadPosts().catch(() => {
        /* handled */
      });
      loadSavedPosts().catch(() => {
        /* handled */
      });
    }, [loadUser, loadPosts, loadSavedPosts]),
  );

  const displayName = user?.Name || 'Guest User';
  const displayEmail = user?.Email || 'No email available';
  const recentPosts = posts.slice(0, 2);
  const recentSavedPosts = savedPosts.slice(0, 2);

  const formatPostTime = (dateString: string): string => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return 'Just now';
    }
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} mins ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  const handleLogout = async (): Promise<void> => {
    try {
      // Clear all persisted auth/session state
      await storage.clearAll();
    } catch (err) {
      // Even if clearing storage fails, still navigate out of the authed area
      console.error('Failed to clear auth storage on logout', err);
    } finally {
      // Send the user back to the unauthenticated flow
      router.replace('/splash');
    }
  };

  const handleLike = async (postId: number) => {
    if (!user || !user.Id) {
      Alert.alert('Error', 'Please sign in to like posts.');
      return;
    }

    const isLiked = likedPosts.has(postId);

    try {
      let response;
      if (isLiked) {
        response = await removeLike(postId, user.Id);
      } else {
        response = await addLike(postId, user.Id);
      }

      if (response.IsSuccess) {
        setLikedPosts((prev) => {
          const newSet = new Set(prev);
          if (isLiked) {
            newSet.delete(postId);
          } else {
            newSet.add(postId);
          }
          return newSet;
        });
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
      } else {
        Alert.alert('Error', response.Message || 'Failed to update like');
      }
    } catch (err: any) {
      console.error('Error updating like:', err);
      Alert.alert('Error', 'Failed to update like. Please try again.');
    }
  };

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
        Id: 0,
        PostId: selectedPostId,
        UserId: user.Id,
        Comments: commentText.trim(),
      });

      if (response.IsSuccess) {
        setCommentText('');
        const commentsResponse = await getComments(selectedPostId);
        if (commentsResponse.IsSuccess && commentsResponse.Data) {
          setComments(commentsResponse.Data);
        }
        setPosts((prev) =>
          prev.map((post) =>
            post.Id === selectedPostId
              ? { ...post, CommentCount: post.CommentCount + 1 }
              : post
          )
        );
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
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FCE433" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        <LinearGradient
          colors={['#FFF7D1', '#FFE36B', '#FFC109']}
          style={[styles.headerGradient, { paddingTop: insets.top + 12 }]}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Feather name="arrow-left" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profile</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => router.push('/edit-profile')}
            >
              <Feather name="edit-2" size={20} color="black" />
            </TouchableOpacity>
          </View>

          <Image 
            source={user?.ProfileImage && isValidProfileImage(user.ProfileImage) ? { uri: user.ProfileImage } : require('@/assets/images/profile3.png')} 
            style={styles.profileAvatar} 
          />
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileEmail}>{displayEmail}</Text>

          <View style={styles.statsRow}>
            <Pressable 
              style={({ pressed }) => [
                styles.statCard,
                pressed && styles.statCardPressed
              ]}
              onPress={() => {
                setShowAllPosts(true);
              }}
            >
              <Feather name="grid" size={18} color="#FFC109" />
              <Text style={styles.statCount}>{posts.length} My Posts</Text>
            </Pressable>
            <Pressable 
              style={({ pressed }) => [
                styles.statCard,
                pressed && styles.statCardPressed
              ]}
              onPress={() => {
                setShowAllSavedPosts(true);
              }}
            >
              <Feather name="bookmark" size={18} color="#FFC109" />
              <Text style={styles.statCount}>{savedPosts.length} Saved Posts</Text>
            </Pressable>
          </View>
        </LinearGradient>

        <View style={styles.contentBlock}>
          <Pressable 
            style={({ pressed }) => [
              styles.sectionHeader,
              pressed && styles.sectionHeaderPressed
            ]}
            onPress={() => {
              console.log('My Posts clicked');
              setShowAllPosts(true);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.sectionTitle}>My Posts</Text>
            {posts.length > 2 && (
              <Text style={styles.sectionAction}>View All</Text>
            )}
          </Pressable>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFC109" />
            </View>
          ) : posts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No posts available from your account</Text>
            </View>
          ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
              {recentPosts.map((post) => (
                <View key={post.Id} style={styles.recentCard}>
                  <TouchableOpacity
                    onPress={() => router.push({ pathname: '/post-detail', params: { id: post.Id.toString() } })}
                    activeOpacity={0.9}
                  >
                    <View style={styles.cardHeader}>
                      <ExpoImage
                        source={
                          getPostProfileImage(post) && isValidProfileImage(getPostProfileImage(post))
                            ? getPostProfileImage(post)
                            : (user?.ProfileImage && post.UserId === user.Id && isValidProfileImage(user.ProfileImage)
                                ? user.ProfileImage
                                : DEFAULT_AVATAR)
                        }
                        style={styles.cardAvatar}
                        contentFit="cover"
                      />
                      <View style={styles.cardHeaderText}>
                        <Text style={styles.cardUser}>{post.Name || displayName}</Text>
                        <Text style={styles.cardTime}>{formatPostTime(post.CreatedOn)}</Text>
                      </View>
                    </View>
                    <Text style={styles.cardSnippet} numberOfLines={3}>
                      {post.Description || 'No description'}
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.cardFooter}>
                    <TouchableOpacity
                      onPress={() => handleLike(post.Id)}
                      style={styles.metric}
                      activeOpacity={0.7}
                      disabled={!user}
                    >
                      {likedPosts.has(post.Id) ? (
                        <MaterialIcons name="favorite" size={16} color="#E74C3C" />
                      ) : (
                        <Feather name="heart" size={16} color="#F44336" />
                      )}
                      <Text
                        style={[
                          styles.metricText,
                          likedPosts.has(post.Id) && styles.likedText,
                        ]}
                      >
                        {post.LikeCount || 0}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleOpenComments(post.Id)}
                      style={styles.metric}
                      activeOpacity={0.7}
                    >
                      <Feather name="message-circle" size={16} color="#FFC109" />
                      <Text style={styles.metricText}>{post.CommentCount || 0}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
          </ScrollView>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Saved Posts</Text>
            {savedPosts.length > 2 && (
              <TouchableOpacity
                onPress={() => {
                  setShowAllSavedPosts(true);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.sectionAction}>View All</Text>
              </TouchableOpacity>
            )}
          </View>

          <View>
            {loadingSavedPosts ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFC109" />
              </View>
            ) : savedPosts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No saved posts yet</Text>
              </View>
            ) : (
              recentSavedPosts.map((post) => (
                <TouchableOpacity
                  key={post.Id}
                  style={styles.savedRow}
                  onPress={() => router.push({ pathname: '/post-detail', params: { id: post.Id.toString() } })}
                  activeOpacity={0.9}
                >
                  <Image 
                    source={
                      getPostProfileImage(post) && isValidProfileImage(getPostProfileImage(post))
                        ? { uri: getPostProfileImage(post)! } 
                        : (user?.ProfileImage && post.UserId === user.Id && isValidProfileImage(user.ProfileImage)
                            ? { uri: user.ProfileImage } 
                            : DEFAULT_AVATAR)
                    } 
                    style={styles.savedAvatar} 
                  />
                <View style={styles.savedContent}>
                  <View style={styles.savedHeader}>
                      <Text style={styles.cardUser}>{post.Name || 'User'}</Text>
                    <Text style={styles.savedBadge}>SAVED</Text>
                  </View>
                    <Text style={styles.cardTime}>{formatPostTime(post.CreatedOn)}</Text>
                    <Text style={styles.savedSnippet} numberOfLines={2}>
                      {post.Description || 'No description'}
                    </Text>
                </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.85} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* View All Posts Modal */}
      <Modal
        visible={showAllPosts}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAllPosts(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>My Posts</Text>
            <TouchableOpacity onPress={() => setShowAllPosts(false)}>
              <Feather name="x" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {posts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No posts available from your account</Text>
              </View>
            ) : (
              posts.map((post) => (
                <View key={post.Id} style={styles.postCard}>
                  <TouchableOpacity
                    onPress={() => router.push({ pathname: '/post-detail', params: { id: post.Id.toString() } })}
                    activeOpacity={0.9}
                  >
                    <View style={styles.cardHeader}>
                      <ExpoImage
                        source={
                          getPostProfileImage(post) ??
                          (user?.ProfileImage && post.UserId === user.Id ? user.ProfileImage : null) ??
                          DEFAULT_AVATAR
                        }
                        style={styles.cardAvatar}
                        contentFit="cover"
                      />
                      <View style={styles.cardHeaderText}>
                        <Text style={styles.cardUser}>{post.Name || displayName}</Text>
                        <Text style={styles.cardTime}>{formatPostTime(post.CreatedOn)}</Text>
                      </View>
                    </View>
                    <Text style={styles.cardSnippet}>{post.Description || 'No description'}</Text>
                    {post.ImageUrl && (
                      <Image
                        source={{ uri: post.ImageUrl }}
                        style={styles.postImage}
                        resizeMode="cover"
                      />
                    )}
                  </TouchableOpacity>
                  <View style={styles.cardFooter}>
                    <TouchableOpacity
                      onPress={() => handleLike(post.Id)}
                      style={styles.metric}
                      activeOpacity={0.7}
                      disabled={!user}
                    >
                      {likedPosts.has(post.Id) ? (
                        <MaterialIcons name="favorite" size={16} color="#E74C3C" />
                      ) : (
                        <Feather name="heart" size={16} color="#F44336" />
                      )}
                      <Text
                        style={[
                          styles.metricText,
                          likedPosts.has(post.Id) && styles.likedText,
                        ]}
                      >
                        {post.LikeCount || 0}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleOpenComments(post.Id)}
                      style={styles.metric}
                      activeOpacity={0.7}
                    >
                      <Feather name="message-circle" size={16} color="#FFC109" />
                      <Text style={styles.metricText}>{post.CommentCount || 0}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity
          style={[styles.bottomButton, styles.primaryButton]}
          onPress={() => router.push('/chat-support')}
        >
          <Text style={styles.primaryText}>Chat With Support</Text>
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
                        <ExpoImage
                          source={
                            getCommentProfileImage(comment) && isValidProfileImage(getCommentProfileImage(comment))
                              ? getCommentProfileImage(comment)
                              : DEFAULT_AVATAR
                          }
                          style={styles.commentAvatar}
                          contentFit="cover"
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
                    </View>
                    <Text style={styles.commentText}>{comment.Comments}</Text>
                  </View>
                ))
              )}
            </ScrollView>

            {/* Comment Input */}
            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Write a comment..."
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
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* View All Saved Posts Modal */}
      <Modal
        visible={showAllSavedPosts}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAllSavedPosts(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Saved Posts</Text>
            <TouchableOpacity onPress={() => setShowAllSavedPosts(false)}>
              <Feather name="x" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {savedPosts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No saved posts yet</Text>
              </View>
            ) : (
              savedPosts.map((post) => (
                <View key={post.Id} style={styles.postCard}>
                  <TouchableOpacity
                    onPress={() => router.push({ pathname: '/post-detail', params: { id: post.Id.toString() } })}
                    activeOpacity={0.9}
                  >
                    <View style={styles.cardHeader}>
                      <ExpoImage
                        source={
                          getPostProfileImage(post) ??
                          (user?.ProfileImage && post.UserId === user.Id ? user.ProfileImage : null) ??
                          DEFAULT_AVATAR
                        }
                        style={styles.cardAvatar}
                        contentFit="cover"
                      />
                      <View style={styles.cardHeaderText}>
                        <Text style={styles.cardUser}>{post.Name || 'User'}</Text>
                        <Text style={styles.cardTime}>{formatPostTime(post.CreatedOn)}</Text>
                      </View>
                    </View>
                    <Text style={styles.cardSnippet}>{post.Description || 'No description'}</Text>
                    {post.ImageUrl && (
                      <Image
                        source={{ uri: post.ImageUrl }}
                        style={styles.postImage}
                        resizeMode="cover"
                      />
                    )}
                  </TouchableOpacity>
                  <View style={styles.cardFooter}>
                    <TouchableOpacity
                      onPress={() => handleLike(post.Id)}
                      style={styles.metric}
                      activeOpacity={0.7}
                      disabled={!user}
                    >
                      {likedPosts.has(post.Id) ? (
                        <MaterialIcons name="favorite" size={16} color="#E74C3C" />
                      ) : (
                        <Feather name="heart" size={16} color="#F44336" />
                      )}
                      <Text
                        style={[
                          styles.metricText,
                          likedPosts.has(post.Id) && styles.likedText,
                        ]}
                      >
                        {post.LikeCount || 0}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleOpenComments(post.Id)}
                      style={styles.metric}
                      activeOpacity={0.7}
                    >
                      <Feather name="message-circle" size={16} color="#FFC109" />
                      <Text style={styles.metricText}>{post.CommentCount || 0}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF7D1',
  },
  scrollView: {
    backgroundColor: '#FFF7D1',
  },
  scrollContent: {
    paddingBottom: 160,
  },
  headerGradient: {
    paddingBottom: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    paddingHorizontal: 24,
    marginBottom: 14,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
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
    width: 40,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#FFF',
    marginTop: 10,
  },
  profileName: {
    marginTop: 10,
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.35,
    color: '#000',
  },
  profileEmail: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 0.3,
    color: '#333',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
    gap: 12,
  },
  statCard: {
    width: 163,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingVertical: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    cursor: 'pointer',
  },
  statCardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  statCount: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.35,
    color: '#000',
  },
  contentBlock: {
    marginTop: -20,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 28,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#F44336',
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  logoutText: {
    color: '#F44336',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.35,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 4,
    cursor: 'pointer',
  },
  sectionHeaderPressed: {
    opacity: 0.7,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.35,
    color: '#000',
  },
  sectionAction: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 0.3,
    color: '#727272',
  },
  horizontalList: {
    paddingBottom: 20,
  },
  recentCard: {
    width: 240,
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 14,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 10,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardUser: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.35,
    color: '#000',
  },
  cardTime: {
    fontSize: 11.78,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 0.98,
    color: '#8A8A8A',
  },
  cardSnippet: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 0.3,
    lineHeight: 20,
    color: '#000',
    marginBottom: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metricText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.3,
    color: '#333',
  },
  savedRow: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  savedAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 12,
  },
  savedContent: {
    flex: 1,
  },
  savedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savedBadge: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.35,
    color: '#1F8B4C',
  },
  savedSnippet: {
    marginTop: 6,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 0.3,
    lineHeight: 20,
    color: '#000',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#8A8A8A',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.35,
    color: '#000',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  postCard: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 10,
  },
  bottomActions: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#FFF',
  },
  bottomButton: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#121212',
    marginRight: 12,
  },
  secondaryText: {
    color: '#FFF',
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.35,
  },
  primaryButton: {
    backgroundColor: '#FFC109',
  },
  primaryText: {
    color: '#000',
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.35,
  },
  likedText: {
    color: '#E74C3C',
  },
  modalKeyboardView: {
    flex: 1,
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
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    backgroundColor: '#FAFAFA',
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
    marginRight: 8,
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
});

export default ProfileScreen;

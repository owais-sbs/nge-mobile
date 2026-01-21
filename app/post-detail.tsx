import { hasAdminRole } from '@/src/services/authRoles';
import { storage, UserData } from '@/src/lib/storage';
import {
    addLike,
    addOrUpdateComment,
    CommentDto,
    deleteComment,
    deletePost,
    getComments,
    getPostById,
    PostDto,
    removeLike, toggleSavePost
} from '@/services/posts';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';




const DEFAULT_AVATAR = require('@/assets/images/profile1.png');

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

const PostDetailScreen = (): React.JSX.Element => {
  const params = useLocalSearchParams<{ id: string }>();
  const postId = params.id ? parseInt(params.id, 10) : null;

  const [post, setPost] = useState<PostDto | null>(null);
  const [comments, setComments] = useState<CommentDto[]>([]);
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingComments, setLoadingComments] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [liked, setLiked] = useState(false);
  const [liking, setLiking] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteLoader, setShowDeleteLoader] = useState(false);

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load user data
    storage
      .getUser()
      .then((userData) => {
        setUser(userData);
        setIsAdmin(hasAdminRole(userData));
      })
      .catch(() => {
        setUser(null);
        setIsAdmin(false);
      });
  }, []);

  useEffect(() => {
    if (postId) {
      loadPost();
      loadComments();
    }
  }, [postId]);

  const loadPost = async () => {
    if (!postId) return;
    try {
      setLoading(true);
      const response = await getPostById(postId);
      if (response.IsSuccess && response.Data) {
        setPost(response.Data);
      } else {
        Alert.alert('Error', 'Failed to load post');
        router.back();
      }
    } catch (err: any) {
      console.error('Failed to load post:', err);
      Alert.alert('Error', 'Failed to load post. Please try again.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    if (!postId) return;
    try {
      setLoadingComments(true);
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


  const handleSavePost = async () => {
  if (!user || !user.Id || !postId || saving) return;

  setSaving(true);
  try {
    const response = await toggleSavePost(postId, user.Id);
    
    if (response.IsSuccess) {
      const isNowSaved = !saved;
      setSaved(isNowSaved);

    
      Alert.alert(
        isNowSaved ? "Post Saved!" : "Removed!",
        isNowSaved 
          ? "This post has been saved to your collection for later." 
          : "Post has been removed from your saved list.",
        [{ text: "OK", style: "default" }]
      );
    } else {
      Alert.alert("Error", response.Message || "Unable to process request");
    }
  } catch (err) {
    console.error('Error saving post:', err);
    Alert.alert("Connection Error", "Check your internet and try again.");
  } finally {
    setSaving(false);
  }
};

  const handleLike = async () => {
    if (!user || !user.Id || !postId || liking) return;

    setLiking(true);
    try {
      let response;
      if (liked) {
        response = await removeLike(postId, user.Id);
      } else {
        response = await addLike(postId, user.Id);
      }

      if (response.IsSuccess && post) {
        setLiked(!liked);
        setPost({
          ...post,
          LikeCount: liked ? post.LikeCount - 1 : post.LikeCount + 1,
        });
      } else {
        Alert.alert('Error', response.Message || 'Failed to update like');
      }
    } catch (err: any) {
      console.error('Error updating like:', err);
      Alert.alert('Error', 'Failed to update like. Please try again.');
    } finally {
      setLiking(false);
    }
  };

  const handlePostComment = async () => {
    if (!commentText.trim() || !user || !user.Id || !postId) return;

    setPostingComment(true);
    try {
      const response = await addOrUpdateComment({
        Id: editingCommentId || 0,
        PostId: postId,
        UserId: user.Id,
        Comments: commentText.trim(),
      });

      if (response.IsSuccess) {
        setCommentText('');
        setEditingCommentId(null);
        await loadComments();
        if (post) {
          setPost({
            ...post,
            CommentCount: editingCommentId ? post.CommentCount : post.CommentCount + 1,
          });
        }
      } else {
        Alert.alert('Error', response.Message || 'Failed to save comment');
      }
    } catch (err: any) {
      console.error('Error:', err);
      Alert.alert('Error', 'Failed to save comment. Please try again.');
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
    if (!user || !user.Id) {
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
                // Update comment count
                if (post) {
                  setPost({
                    ...post,
                    CommentCount: Math.max(0, post.CommentCount - 1),
                  });
                }
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


  const handleDeletePost = async () => {
    if (!postId) return;
    console.log('handleDeletePost called for post:', postId);
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            console.log('Delete cancelled');
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            console.log('Delete confirmed, starting deletion...');
            try {
              setDeleting(true);
              setShowDeleteLoader(true);
              console.log('Calling deletePost API...');
              await deletePost(postId);
              console.log('Post deleted successfully');
              setShowDeleteLoader(false);
              setDeleting(false);
              Alert.alert('Success', 'Post deleted successfully', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (err: any) {
              console.error('Failed to delete post', err);
              setShowDeleteLoader(false);
              setDeleting(false);
              const errorMessage =
                err.response?.data?.Message ||
                err.message ||
                'Failed to delete post. Please try again.';
              Alert.alert('Error', errorMessage);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const formatTime = (dateString?: string): string => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return 'Just now';
    }
    return date.toLocaleDateString();
  };

  const formatCommentTime = (dateString?: string): string => {
  if (!dateString) return 'Just now';
  const date = new Date(dateString);
  const now = new Date();
  
  // Check if the date is today
  const isToday = date.toDateString() === now.toDateString();
  
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (isToday) {
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return `${diffHours}h ago`;
  }
  
  // If older than today, show date (e.g., "Jan 05")
  return date.toLocaleDateString([], { month: 'short', day: '2-digit' });
};

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F5B400" />
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Post not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post</Text>
          {isAdmin && (
            <TouchableOpacity
              onPress={handleDeletePost}
              style={styles.deleteButton}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#D9534F" />
              ) : (
                <Feather name="trash-2" size={20} color="#D9534F" />
              )}
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Post Content */}
          <View style={styles.postCard}>
            <View style={styles.postHeader}>
              <Image 
                source={isValidProfileImage(post.ProfileImage) ? { uri: post.ProfileImage } : DEFAULT_AVATAR} 
                style={styles.postAvatar} 
              />
              <View style={styles.postHeaderText}>
                <Text style={styles.postUser}>{post.Name}</Text>
                <Text style={styles.postTime}>{formatTime(post.CreatedOn)}</Text>
              </View>
            </View>

            {post.Description ? (
              <Text style={styles.postText}>{post.Description}</Text>
            ) : null}

            {post.ImageUrl && isImageUrl(post.ImageUrl) && (
              <Image
                source={{ uri: post.ImageUrl }}
                style={[
                  styles.postImage,
                  imageAspectRatio ? { aspectRatio: imageAspectRatio } : {},
                ]}
                resizeMode="contain"
                onLoad={() => {
                  if (post.ImageUrl) {
                    Image.getSize(
                      post.ImageUrl,
                      (width, height) => {
                        if (width && height && height > 0) {
                          setImageAspectRatio(width / height);
                        }
                      },
                      (error) => {
                        console.error('Error getting image size:', error);
                      }
                    );
                  }
                }}
              />
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

            {/* Like Button */}
            <View style={styles.postActions}>
              <TouchableOpacity
                onPress={handleLike}
                style={styles.likeButton}
                disabled={!user || liking}
                activeOpacity={0.7}
              >
                {liked ? (
                  <MaterialIcons name="favorite" size={24} color="#E74C3C" />
                ) : (
                  <Feather name="heart" size={24} color="#6F6F6F" />
                )}
                <Text
                  style={[
                    styles.actionText,
                    liked && styles.likedText,
                  ]}
                >
                  {post.LikeCount}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>
              {/* Use comments.length to show the actual count from the API response */}
              Comments ({comments.length})
            </Text>

            {loadingComments ? (
              <ActivityIndicator color="#F5B400" style={styles.commentsLoader} />
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
                        source={isValidProfileImage(comment.User?.ProfileImage) ? { uri: comment.User.ProfileImage } : require('@/assets/images/profile1.png')}
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
          </View>


          <TouchableOpacity
    onPress={handleSavePost}
    style={[styles.likeButton, { marginLeft: 20 }]} 
    disabled={!user || saving}
    activeOpacity={0.7}
  >
    {saving ? (
      <ActivityIndicator size="small" color="#F5B400" />
    ) : saved ? (
      <MaterialIcons name="bookmark" size={24} color="#F5B400" /> // Saved state
    ) : (
      <Feather name="bookmark" size={24} color="#6F6F6F" /> // Unsaved state
    )}
    <Text style={[styles.actionText, saved && { color: '#F5B400' }]}>
      {saved ? 'Saved' : 'Save'}
    </Text>
  </TouchableOpacity>
  
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
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 20,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#F5B400',
    borderRadius: 20,
  },
  backButtonText: {
    color: '#000',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backIcon: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  deleteButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  postTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  postText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    borderRadius: 12,
    marginBottom: 12,
    alignSelf: 'center',
  },
  postVideo: {
    width: '100%',
    height: 400,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#000',
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    fontSize: 16,
    color: '#6F6F6F',
    fontWeight: '600',
  },
  likedText: {
    color: '#E74C3C',
  },
  commentsSection: {
    padding: 16,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
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
});

export default PostDetailScreen;


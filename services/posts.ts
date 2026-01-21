import axiosInstance from '@/src/api/axiosInstance';
import { ApiResponse } from '@/services/auth';

export interface PostDto {
  Id: number;
  Name: string;
  Url: string;
  Description: string;
  ImageUrl: string;
  UserId?: number | null;
  UserName?: string;
  ProfileImage?: string | null;
  CreatedOn: string;
  LikeCount: number;
  CommentCount: number;
}

export interface PaginatedPosts {
  Items: PostDto[];
  TotalCount: number;
}

export const fetchPosts = async (
  pageNumber: number,
  pageSize: number,
): Promise<ApiResponse<PaginatedPosts>> => {
  try {
    const { data } = await axiosInstance.get<ApiResponse<PaginatedPosts>>(
      '/Post/GetAllPosts',
      {
        params: {
          pageNumber,
          pageSize,
        },
      },
    );
    console.log('Posts API Response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error: any) {
    console.error('Posts API Error:', error);
    console.error('Error Response:', error.response?.data);
    console.error('Error Status:', error.response?.status);
    throw error;
  }
};

export const deletePost = async (id: number): Promise<ApiResponse<null>> => {
  try {
    const { data } = await axiosInstance.post<ApiResponse<null>>('/Post/Delete', null, {
      params: { id },
    });
    console.log('Delete Post API Response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error: any) {
    console.error('Delete Post API Error:', error);
    console.error('Error Response:', error.response?.data);
    console.error('Error Status:', error.response?.status);
    throw error;
  }
};

export const getPostById = async (id: number): Promise<ApiResponse<PostDto>> => {
  try {
    console.log('Fetching post by ID:', id);
    const { data } = await axiosInstance.get<ApiResponse<PostDto>>('/Post/GetById', {
      params: {
        id: id,
      },
    });
    console.log('GetPostById API Response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error: any) {
    console.error('GetPostById API Error:', error);
    console.error('Error Response:', error.response?.data);
    console.error('Error Status:', error.response?.status);
       throw error;
  }
};

export const searchPosts = async (keyword: string): Promise<ApiResponse<PostDto[]>> => {
  try {
    const { data } = await axiosInstance.get<ApiResponse<PostDto[]>>('/Post/Search', {
      params: { keyword },
    });
    return data;
  } catch (error: any) {
    console.error('Search Posts Error:', error);
    throw error;
  }
};

export const addOrUpdatePost = async (
  formData: FormData,
): Promise<ApiResponse<null>> => {
  try {
    const { data } = await axiosInstance.post<ApiResponse<null>>(
      '/Post/AddOrUpdatePost',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    console.log('Add Post API Response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error: any) {
    console.error('Add Post API Error:', error);
    console.error('Error Response:', error.response?.data);
    console.error('Error Status:', error.response?.status);
    throw error;
  }
};

export const getMyPosts = async (userId: number): Promise<ApiResponse<PostDto[]>> => {
  try {
    console.log('Fetching my posts from /Post/GetMyPosts with userId:', userId);
    const { data } = await axiosInstance.get<ApiResponse<PostDto[]>>(
      '/Post/GetMyPosts',
      {
        params: {
          userId: userId,
        },
      },
    );
    console.log('GetMyPosts API Response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error: any) {
    console.error('GetMyPosts API Error:', error);
    console.error('Error Response:', error.response?.data);
    console.error('Error Status:', error.response?.status);
    throw error;
  }
};

export const addLike = async (
  postId: number,
  userId: number,
): Promise<ApiResponse<null>> => {
  try {
    console.log('Adding like to post:', postId, 'by user:', userId);
    const { data } = await axiosInstance.post<ApiResponse<null>>(
      '/Post/AddLike',
      null,
      {
        params: {
          postId: postId,
          userId: userId,
        },
      },
    );
    console.log('AddLike API Response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error: any) {
    console.error('AddLike API Error:', error);
    console.error('Error Response:', error.response?.data);
    console.error('Error Status:', error.response?.status);
    throw error;
  }
};

export const removeLike = async (
  postId: number,
  userId: number,
): Promise<ApiResponse<null>> => {
  try {
    console.log('Removing like from post:', postId, 'by user:', userId);
    const { data } = await axiosInstance.post<ApiResponse<null>>(
      '/Post/RemoveLike',
      null,
      {
        params: {
          postId: postId,
          userId: userId,
        },
      },
    );
    console.log('RemoveLike API Response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error: any) {
    console.error('RemoveLike API Error:', error);
    console.error('Error Response:', error.response?.data);
    console.error('Error Status:', error.response?.status);
    throw error;
  }
};

export interface CommentUser {
  Id: number;
  Name: string;
  Email: string;
  Mobile?: string;
  Password?: string;
  ProfileImage?: string | null;
  CreatedOn?: string;
  CreatedBy?: string | null;
  UpdatedOn?: string | null;
  UpdatedBy?: string | null;
  IsActive?: boolean;
  IsDeleted?: boolean;
  RoleMappings?: any;
}

export interface CommentDto {
  Id: number;
  PostId: number;
  UserId: number;
  Comments: string;
  CreatedOn?: string;
  CreatedBy?: string | null;
  UpdatedOn?: string | null;
  UpdatedBy?: string | null;
  IsActive?: boolean;
  IsDeleted?: boolean;
  User?: CommentUser;
}

export const addOrUpdateComment = async (
  commentData: {
    Id: number;
    PostId: number;
    UserId: number;
    Comments: string;
  },
): Promise<ApiResponse<CommentDto>> => {
  try {
    console.log('Adding/updating comment:', commentData);
    const { data } = await axiosInstance.post<ApiResponse<CommentDto>>(
      '/Comment/AddOrUpdateComment',
      commentData,
    );
    console.log('AddOrUpdateComment API Response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error: any) {
    console.error('AddOrUpdateComment API Error:', error);
    console.error('Error Response:', error.response?.data);
    console.error('Error Status:', error.response?.status);
    throw error;
  }
};

export const getComments = async (
  postId: number,
): Promise<ApiResponse<CommentDto[]>> => {
  try {
    console.log('Fetching comments for post:', postId);
    const { data } = await axiosInstance.get<ApiResponse<CommentDto[]>>(
      '/Comment/GetAllCommentOnPost',
      {
        params: {
          postId: postId,
        },
      },
    );
    console.log('GetAllCommentOnPost API Response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error: any) {
    console.error('GetAllCommentOnPost API Error:', error);
    console.error('Error Response:', error.response?.data);
    console.error('Error Status:', error.response?.status);
    throw error;
  }
};

export const deleteComment = async (
  commentId: number,
): Promise<ApiResponse<null>> => {
  try {
    console.log('Deleting comment:', commentId);
    const { data } = await axiosInstance.delete<ApiResponse<null>>(
      '/Comment/DeleteComment',
      {
        params: {
          commentId: commentId,
        },
      },
    );
    console.log('DeleteComment API Response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error: any) {
    console.error('DeleteComment API Error:', error);
    console.error('Error Response:', error.response?.data);
    console.error('Error Status:', error.response?.status);
    throw error;
  }
};

export const toggleSavePost = async (
  postId: number,
  userId: number,
): Promise<ApiResponse<string>> => {
  try {
    console.log(`Toggling save for post: ${postId} by user: ${userId}`);
    
    const { data } = await axiosInstance.post<ApiResponse<string>>(
      '/Post/ToggleSavePost',
      null, 
      {
        params: {
          postId: postId,
          userId: userId,
        },
      }
    );

    console.log('ToggleSavePost API Response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error: any) {
    console.error('ToggleSavePost API Error:', error);
    console.error('Error Response:', error.response?.data);
    
    throw error;
  }
};


export const getMySavedPosts = async (
  userId: number,
): Promise<ApiResponse<PostDto[]>> => {
  try {
    const { data } = await axiosInstance.get<ApiResponse<PostDto[]>>(
      '/Post/GetMySavedPosts',
      {
        params: { userId },
      }
    );
    return data;
  } catch (error: any) {
    console.error('GetMySavedPosts Error:', error);
    throw error;
  }
};

export const getPostsByCategoryId = async (
  postCategoryId: number,
): Promise<ApiResponse<PostDto[]>> => {
  try {
    const { data } = await axiosInstance.get<ApiResponse<PostDto[]>>(
      '/Post/GetByPostCategoryId',
      {
        params: { postCategoryId },
      }
    );
    return data;
  } catch (error: any) {
    console.error('GetPostsByCategoryId Error:', error);
    console.error('Error Response:', error.response?.data);
    throw error;
  }
};


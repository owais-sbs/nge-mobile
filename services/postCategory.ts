import axiosInstance from '@/src/api/axiosInstance';
import { ApiResponse } from '@/services/auth';

export interface PostCategoryDto {
  Id: number;
  Title: string;
  CreatedOn: string;
  CreatedBy: number;
  UpdatedOn: string;
  UpdatedBy: number;
  IsDeleted: boolean;
  IsActive: boolean;
}

export const getAllPostCategories = async (): Promise<ApiResponse<PostCategoryDto[]>> => {
  try {
    const { data } = await axiosInstance.get<ApiResponse<PostCategoryDto[]>>(
      '/PostCategory/GetAll',
    );
    return data;
  } catch (error: any) {
    console.error('GetAllPostCategories API Error:', error);
    console.error('Error Response:', error.response?.data);
    console.error('Error Status:', error.response?.status);
    throw error;
  }
};



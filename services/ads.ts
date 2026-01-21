import axiosInstance from '@/src/api/axiosInstance';
import { ApiResponse } from '@/services/auth';

export interface AdDto {
  Id: number;
  Title: string;
  Description?: string;
  ImageUrl?: string;
  CreatedOn?: string;
  IsActive?: boolean;
}

export interface PaginatedAds {
  Items: AdDto[];
  TotalCount: number;
  PageNumber: number;
  PageSize: number;
}

export const fetchAds = async (
  pageNumber: number,
  pageSize: number,
): Promise<ApiResponse<PaginatedAds>> => {
  try {
    const { data } = await axiosInstance.get<ApiResponse<PaginatedAds>>(
      '/Ad/GetAds',
      {
        params: { pageNumber, pageSize },
      },
    );
    console.log('Fetch Ads API Response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error: any) {
    console.error('Fetch Ads API Error:', error);
    console.error('Error Response:', error.response?.data);
    console.error('Error Status:', error.response?.status);
    throw error;
  }
};

export const deleteAd = async (id: number): Promise<ApiResponse<null>> => {
  try {
    const { data } = await axiosInstance.post<ApiResponse<null>>(
      '/Ad/Delete',
      null,
      {
        params: { id },
      },
    );
    console.log('Delete Ad API Response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error: any) {
    console.error('Delete Ad API Error:', error);
    console.error('Error Response:', error.response?.data);
    console.error('Error Status:', error.response?.status);
    throw error;
  }
};


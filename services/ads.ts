import { ApiResponse } from '@/services/auth';
import axiosInstance from '@/src/api/axiosInstance';

export interface AdDto {
  Id: number;
  Title: string;
  Description?: string;
  ImageUrl?: string;
  ImageUrl1?: string; // Added for horizontal slider images
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

export interface AdSubscriptionRequest {
  Id?: number;
  UserId: number;
  AdId: number;
}

export interface SendUserDetailsRequest {
  AdId: number;
  AccountId: number;
  UserMessage?: string;
}

export const addOrUpdateAdSubscription = async (
  payload: AdSubscriptionRequest,
): Promise<ApiResponse<null>> => {
  try {
    console.log('Adding ad subscription:', payload);
    const { data } = await axiosInstance.post<ApiResponse<null>>(
      '/Adsubscriptions/AddOrUpdate',
      payload,
    );
    console.log('Add Ad Subscription API Response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error: any) {
    console.error('Add Ad Subscription API Error:', error);
    console.error('Error Response:', error.response?.data);
    console.error('Error Status:', error.response?.status);
    throw error;
  }
};

export const sendUserDetailsToAd = async (
  payload: SendUserDetailsRequest,
): Promise<ApiResponse<null>> => {
  try {
    console.log('Sending user details to ad:', payload);
    const response = await axiosInstance.post(
      '/Ad/SendUserDetailsToAd',
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
    
    console.log('SendUserDetailsToAd API Response:', response.data);
    console.log('Response Status:', response.status);
    console.log('Response Type:', typeof response.data);
    
    // Handle plain text response (200 OK with text/plain)
    if (typeof response.data === 'string') {
      // If response is a string and status is 200, treat as success
      if (response.status === 200) {
        return {
          IsSuccess: true,
          Data: null,
          Message: response.data || 'User details sent successfully',
        };
      }
    }
    
    // Handle JSON response
    if (typeof response.data === 'object' && response.data !== null) {
      // If it already has the ApiResponse structure, return it
      if ('IsSuccess' in response.data) {
        return response.data as ApiResponse<null>;
      }
      // Otherwise wrap it
      return {
        IsSuccess: true,
        Data: null,
        Message: response.data.Message || 'Success',
      };
    }
    
    // Default success response
    return {
      IsSuccess: true,
      Data: null,
      Message: 'User details sent successfully',
    };
  } catch (error: any) {
    console.error('SendUserDetailsToAd API Error:', error);
    console.error('Error Response:', error.response?.data);
    console.error('Error Status:', error.response?.status);
    
    // If error response contains a message, extract it
    if (error.response?.data) {
      const errorData = error.response.data;
      if (typeof errorData === 'string') {
        throw new Error(errorData);
      }
      if (errorData.Message) {
        throw new Error(errorData.Message);
      }
    }
    
    throw error;
  }
};


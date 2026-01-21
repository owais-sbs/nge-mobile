import axiosInstance from '@/src/api/axiosInstance';
import { ApiResponse } from '@/services/auth';

export interface FaqDto {
  Id: number;
  FaqType: number;
  Question: string;
  Answer: string;
  CreatedOn?: string;
  CreatedBy?: string | null;
  UpdatedOn?: string | null;
  UpdatedBy?: string | null;
  IsDeleted?: boolean;
  IsActive?: boolean;
}

export const getAllFaqs = async (): Promise<ApiResponse<FaqDto[]>> => {
  const { data } = await axiosInstance.get<ApiResponse<FaqDto[]>>('/Faq/GetAll');
  return data;
};


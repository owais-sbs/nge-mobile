import axiosInstance from '@/src/api/axiosInstance';

export interface ApiResponse<TData> {
  IsSuccess: boolean;
  Data: TData;
  Message?: string;
}

export interface LoginRequest {
  Email: string;
  Password: string;
}

export interface LoginResponseData {
  token: string;
}

export interface CreateAccountRequest {
  Id?: number;
  Name: string;
  Email: string;
  Password: string;
  Mobile?: string;
  RoleIds?: number[];
  Salary?: number;
  CreatedBy?: string;
  UpdatedBy?: string;
  SafetyNumber?: string;
}

export interface CreateAccountResponseData {
  id?: number;
}

export interface UserData {
  Id: number;
  Name: string;
  Email: string;
  Mobile?: string;
  Password?: string;
  ProfileImage?: string | null;
  SafetyNumber?: number | null;
  Salary?: number | null;
  CreatedOn?: string;
  CreatedBy?: string;
  UpdatedOn?: string;
  UpdatedBy?: string;
  IsActive?: boolean;
  IsDeleted?: boolean;
  RoleMappings?: any[];
}

export interface UpdateAccountRequest {
  Id: number;
  Name: string;
  Email: string;
  Password?: string;
  Mobile?: string;
  RoleIds?: number[];
  SafetyNumber?: number;
  Salary?: number;
  CreatedBy?: string;
  UpdatedBy?: string;
}

export const login = async (
  payload: LoginRequest,
): Promise<ApiResponse<LoginResponseData>> => {
  const { data } = await axiosInstance.post<ApiResponse<LoginResponseData>>(
    '/Account/Login',
    payload,
  );
  return data;
};

export const createAccount = async (
  payload: CreateAccountRequest | FormData,
): Promise<ApiResponse<CreateAccountResponseData>> => {
  const isFormData = payload instanceof FormData;
  const { data } = await axiosInstance.post<ApiResponse<CreateAccountResponseData>>(
    '/Account/CreateAccount',
    payload,
    isFormData
      ? {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      : undefined,
  );
  return data;
};

export const getUserById = async (
  id: number,
): Promise<ApiResponse<UserData>> => {
  const { data } = await axiosInstance.get<ApiResponse<UserData>>(
    `/Account/GetById?id=${id}`,
  );
  return data;
};

export const updateAccount = async (
  payload: UpdateAccountRequest,
): Promise<ApiResponse<UserData>> => {
  try {
    const { data } = await axiosInstance.post<ApiResponse<UserData>>(
      '/Account/UpdateAccount',
      payload,
    );
    return data;
  } catch (error: any) {
    console.error('UpdateAccount API Error:', error);
    console.error('Error Response:', error.response?.data);
    throw error;
  }
};


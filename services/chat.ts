import axiosInstance from '@/src/api/axiosInstance';
import { ApiResponse } from '@/services/auth';

export interface ChatSearchResult {
  group: string;
  line: number;
  text: string;
  fullMessage: string;
}

export interface ChatContext {
  group: string;
  line: number;
  snippet: string[];
}

export interface ChatMessage {
  Id?: number;
  Message: string;
  UserId?: number;
  IsFromAdmin?: boolean; // Keep for backward compatibility
  IsAdminReply?: boolean; // Use this to determine if message is from admin
  CreatedOn?: string;
}

export const searchChatMatches = async (keyword: string, skip: number, take: number = 10): Promise<ChatSearchResult[]> => {
  const { data } = await axiosInstance.get<ChatSearchResult[]>('/Chat/SearchChatMatches', {
    params: { keyword, skip, take },
  });
  return data;
};

export const getChatContext = async (
  group: string,
  line: number,
  context: number = 10,
): Promise<ChatContext> => {
  const { data } = await axiosInstance.get<ChatContext>('/Chat/GetChatContext', {
    params: { group, line, context },
  });
  return data;
};

export const sendUserMessage = async (
  userId: number,
  message: string,
): Promise<ApiResponse<ChatMessage>> => {
  try {
    const { data } = await axiosInstance.post<ApiResponse<ChatMessage>>(
      '/Chats/SendUserMessage',
      { Message: message },
      {
        params: { userId },
      },
    );
    return data;
  } catch (error: any) {
    console.error('SendUserMessage API Error:', error);
    throw error;
  }
};

export const getChatHistory = async (
  userId: number,
): Promise<ApiResponse<ChatMessage[]>> => {
  try {
    const { data } = await axiosInstance.get<ApiResponse<ChatMessage[]>>(
      '/Chats/GetChatHistory',
      {
        params: { userId },
      },
    );
    return data;
  } catch (error: any) {
    console.error('GetChatHistory API Error:', error);
    throw error;
  }
};




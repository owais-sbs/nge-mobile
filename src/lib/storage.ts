import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_KEY = '@user_data';
const TOKEN_KEY = '@auth_token';

export interface UserData {
  Id: number;
  Name: string;
  Email: string;
  Mobile?: string;
  Password?: string;
  ProfileImage?: string | null;
  CreatedOn?: string;
  CreatedBy?: string;
  UpdatedOn?: string;
  UpdatedBy?: string;
  IsActive?: boolean;
  IsDeleted?: boolean;
  RoleMappings?: any[];
}

export const storage = {
  // User data
  async setUser(user: UserData): Promise<void> {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  async getUser(): Promise<UserData | null> {
    const data = await AsyncStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  async removeUser(): Promise<void> {
    await AsyncStorage.removeItem(USER_KEY);
  },

  // Token
  async setToken(token: string): Promise<void> {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  },

  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem(TOKEN_KEY);
  },

  async removeToken(): Promise<void> {
    await AsyncStorage.removeItem(TOKEN_KEY);
  },

  // Clear all
  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove([USER_KEY, TOKEN_KEY]);
  },
};


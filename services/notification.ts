import axiosInstance from '@/src/api/axiosInstance';

export const fetchNotifications = async (userId: number) => {
  return await axiosInstance.get(`/Notification/GetMyNotifications?userId=${userId}`);
};

export const clearAllNotifications = async (userId: number) => {
  return await axiosInstance.post(`/Notification/ClearAll?userId=${userId}`);
};

export const markAsRead = async (id: number) => {
  return await axiosInstance.post(`/Notification/MarkAsRead?id=${id}`);
};
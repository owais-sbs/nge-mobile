// axiosInstance.js

import axios from "axios";
import * as SecureStore from "expo-secure-store";

const axiosInstance = axios.create({
 baseURL: 'https://nge.nuzum.tech/api/'
//  baseURL: "https://d04c3103b6ec.ngrok-free.app/api",
  //  baseURL:"https://f6c7-2401-4900-1cb2-32d4-dd42-955d-34aa-1a94.ngrok-free.app/api",
  //  baseURL:"https://be79-2406-b400-b5-a6c-a9ea-c674-ef7b-5a11.ngrok-free.app/api",
  //  baseURL:"https://hudaapi.nuzum.tech/api"
  // timeout: 5000, // Timeout for requests (optional)
});

// Request interceptor to attach token to the headers
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync("authToken"); // Get the token from SecureStore
    if (token) {
      // Attach the token to the Authorization header
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Handle request error
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token might have expired or is invalid; handle this here (e.g., logout or redirect)
      console.log("Unauthorized request, please login again.");
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

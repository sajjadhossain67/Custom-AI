// BACKEND: restore this later — axios instances for backend API calls
// This file contained axiosOpen (unauthenticated) and axiosSecure / axiosSecureFile
// (authenticated, injecting JWT Bearer token via request interceptor).
//
// import axios from "axios";
// import { getUserToken } from "../localdb/user";
//
// export const axiosOpen = axios.create({
//   baseURL: `${process.env.REACT_APP_BASE_URL}/api/v1`,
//   headers: { "Content-Type": "application/json", Accept: "application/json" },
// });
//
// const createAxiosSecureInstance = (contentType) => {
//   const instance = axios.create({
//     baseURL: `${process.env.REACT_APP_BASE_URL}/api/v1`,
//     headers: { "Content-Type": contentType, Accept: "application/json" },
//   });
//   instance.interceptors.request.use(
//     (config) => {
//       if (getUserToken()) config.headers.Authorization = `Bearer ${getUserToken()}`;
//       return config;
//     },
//     (error) => Promise.reject(error)
//   );
//   return instance;
// };
//
// export const axiosSecure = createAxiosSecureInstance("application/json");
// export const axiosSecureFile = createAxiosSecureInstance("multipart/form-data");

// Stub exports so any lingering imports don't break the build
export const axiosOpen = null;
export const axiosSecure = null;
export const axiosSecureFile = null;

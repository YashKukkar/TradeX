import axios from "axios";
import { config } from "../config";

const axiosInstance = axios.create({
  baseURL: config.apiUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

axiosInstance.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export class ApiError extends Error {
  status: number;
  validationErrors?: Record<string, string>;
  path?: string;

  constructor(message: string, status: number, validationErrors?: Record<string, string>, path?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.validationErrors = validationErrors;
    this.path = path;
  }
}

axiosInstance.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const errorData = err.response?.data;
    const message = errorData?.message || err.message || "Request failed";
    const status = err.response?.status || 500;
    const validationErrors = errorData?.validationErrors;
    const path = errorData?.path;
    return Promise.reject(new ApiError(message, status, validationErrors, path));
  }
);

const parseBody = (body: any) => {
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch (e) {
      return body;
    }
  }
  return body;
};

export const api = async (endpoint: string, options: any = {}): Promise<any> => {
  const url = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const data = parseBody(options.body);
  if (options.method === "POST") {
    return axiosInstance.post(url, data || {}, { headers: options.headers });
  }
  if (options.method === "PUT") {
    return axiosInstance.put(url, data || {}, { headers: options.headers });
  }
  if (options.method === "DELETE") {
    return axiosInstance.delete(url, { headers: options.headers });
  }
  return axiosInstance.get(url, { headers: options.headers });
};

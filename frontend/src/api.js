import axios from 'axios';
import { supabase } from './supabaseClient';

const api = axios.create({
  baseURL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000/api'
    : 'https://gis-sppg.onrender.com/api',
});

api.interceptors.request.use(async (config) => {
  let token = localStorage.getItem('access_token');
  if (!token) {
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.access_token) {
        token = data.session.access_token;
        localStorage.setItem('access_token', token);
      }
    } catch (e) {
      console.warn('Could not fetch Supabase session token:', e);
    }
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

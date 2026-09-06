import axios from 'axios';
import { supabase } from './supabaseClient';

const IS_PROD = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const WAKE_THRESHOLD_MS = 3500;

let inflight = 0;
let wakeTimer = null;
let wakeActive = false;

function startWakeClock() {
  inflight += 1;
  if (!IS_PROD || wakeActive || wakeTimer) return;
  wakeTimer = setTimeout(() => {
    if (inflight > 0) {
      wakeActive = true;
      window.dispatchEvent(new window.CustomEvent('sppg:server-waking'));
    }
  }, WAKE_THRESHOLD_MS);
}

function stopWakeClock() {
  inflight = Math.max(0, inflight - 1);
  if (inflight === 0) {
    if (wakeTimer) {
      clearTimeout(wakeTimer);
      wakeTimer = null;
    }
    if (wakeActive) {
      wakeActive = false;
      window.dispatchEvent(new window.CustomEvent('sppg:server-awake'));
    }
  }
}

export function isWakePending() {
  return wakeActive;
}

const api = axios.create({
  baseURL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000/api'
    : 'https://gis-sppg.onrender.com/api',
});

api.interceptors.request.use(async (config) => {
  startWakeClock();
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

api.interceptors.response.use(
  (res) => {
    stopWakeClock();
    return res;
  },
  (err) => {
    stopWakeClock();
    return Promise.reject(err);
  }
);

export default api;
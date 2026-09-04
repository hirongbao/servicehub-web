import { ref, reactive } from 'vue';

export const loggedIn = ref(Boolean(localStorage.getItem('servicehub_token')));
export const username = ref(localStorage.getItem('servicehub_username') || '');
export const password = ref(localStorage.getItem('servicehub_password') || '');
export const rememberPwd = ref(Boolean(localStorage.getItem('servicehub_password')));

export const activeView = ref('overview');

export const toasts = ref([]);
export function showToast(message, type = 'info', duration = 3000) {
  const id = Date.now();
  toasts.value.push({ id, message, type });
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id);
  }, duration);
}

export const confirmState = reactive({
  visible: false,
  title: '',
  message: '',
  confirmText: '确定',
  cancelText: '取消',
  resolve: null,
  reject: null
});

export function showConfirm(title, message, options = {}) {
  return new Promise((resolve, reject) => {
    confirmState.title = title;
    confirmState.message = message;
    confirmState.confirmText = options.confirmText || '确定';
    confirmState.cancelText = options.cancelText || '取消';
    confirmState.resolve = resolve;
    confirmState.reject = reject;
    confirmState.visible = true;
  });
}

export const request = async (url, options = {}) => {
  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {})
  };
  const token = localStorage.getItem('servicehub_token');
  if (token) headers.Authorization = `Bearer ${token}`;
  
  const r = await fetch(url, { ...options, headers });
  const renewed = r.headers.get('X-Renewed-Token');
  if (renewed) localStorage.setItem('servicehub_token', renewed);
  
  const d = await r.json().catch(() => ({ message: '服务响应格式错误' }));
  
  if (r.status === 401) {
    localStorage.removeItem('servicehub_token');
    loggedIn.value = false;
    showToast('登录状态已失效，请重新登录', 'error');
    throw new Error('登录状态已失效，请重新登录');
  }
  
  if (!r.ok || d.code !== 0) {
    throw new Error(d.message || '请求失败');
  }
  
  return d.data;
};

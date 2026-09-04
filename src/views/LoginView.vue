<template>
  <main class="min-h-screen bg-[#F8F9FA] text-zinc-900 font-sans flex items-center justify-center px-6 selection:bg-zinc-900 selection:text-white relative overflow-hidden">
    <div class="absolute -top-40 -left-40 w-96 h-96 bg-zinc-200/50 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-zinc-200/50 rounded-full blur-3xl pointer-events-none"></div>

    <form @submit.prevent="handleLogin" class="w-full max-w-md bg-white/90 backdrop-blur-2xl border border-black/[0.06] rounded-[2.5rem] p-10 md:p-12 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.06)] relative z-10">
      <div class="w-14 h-14 rounded-2xl bg-zinc-900 text-white flex items-center justify-center font-serif text-2xl mx-auto mb-6 shadow-md shadow-zinc-900/20">S</div>
      <h1 class="text-3xl md:text-4xl font-serif font-medium tracking-tight text-center text-zinc-900 mb-2">欢迎回来</h1>
      <p class="text-zinc-400 text-center font-normal text-sm mb-9">ServiceHub 管理控制台</p>
      
      <div class="space-y-5 mb-7">
        <div>
          <label class="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2">管理员账号</label>
          <input v-model="username" type="text" autocomplete="username" class="editorial-input" placeholder="输入管理员账号" />
        </div>
        <div>
          <label class="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2">管理员密码</label>
          <input v-model="password" type="password" autocomplete="current-password" class="editorial-input" placeholder="输入管理员密码" />
        </div>
      </div>

      <div class="flex items-center justify-between mb-9">
        <label class="flex items-center gap-2.5 cursor-pointer group">
          <Switch v-model="rememberPwd" />
          <span class="text-xs font-bold text-zinc-500 group-hover:text-zinc-900 transition-colors">记住密码</span>
        </label>
      </div>

      <button type="submit" :disabled="loginSubmitting" class="w-full h-14 rounded-2xl bg-zinc-900 text-white font-serif italic text-lg hover:bg-zinc-800 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-xl shadow-zinc-900/20 active:scale-[0.98]">
        <RefreshCw v-if="loginSubmitting" class="w-5 h-5 animate-spin mx-auto" />
        <span v-else>Sign in to Dashboard</span>
      </button>
    </form>
  </main>
</template>

<script setup>
import { ref } from 'vue';
import { RefreshCw } from 'lucide-vue-next';
import Switch from '../components/ui/Switch.vue';
import { username, password, rememberPwd, loggedIn, request, showToast } from '../store';

const loginSubmitting = ref(false);

const emit = defineEmits(['login-success']);

const handleLogin = async () => {
  if (!username.value.trim() || !password.value) return showToast('请输入账号和密码', 'warning');
  loginSubmitting.value = true;
  try {
    const d = await request('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username: username.value.trim(), password: password.value })
    });
    localStorage.setItem('servicehub_username', username.value.trim());
    if (rememberPwd.value) localStorage.setItem('servicehub_password', password.value);
    else localStorage.removeItem('servicehub_password');
    localStorage.setItem('servicehub_token', d.token);
    loggedIn.value = true;
    password.value = '';
    showToast('欢迎回来', 'success');
    emit('login-success');
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    loginSubmitting.value = false;
  }
};
</script>

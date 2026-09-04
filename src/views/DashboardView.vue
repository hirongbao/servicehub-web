<template>
  <div class="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10">
    <!-- Tokens Card -->
    <div class="md:col-span-5 bg-white rounded-[2.5rem] lg:rounded-[3rem] p-10 md:p-12 shadow-xl shadow-zinc-200/40 border border-zinc-100 flex flex-col justify-between relative overflow-hidden group min-h-[420px] transition-all duration-500 hover:shadow-2xl hover:shadow-zinc-300/50 hover:-translate-y-2">
      <div class="relative z-10 flex items-center justify-between">
        <div class="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-md">
          <KeyRound class="w-6 h-6" />
        </div>
        <span class="text-xs font-bold font-mono text-zinc-400 bg-zinc-100 px-3 py-1 rounded-full">ACTIVE_TOKENS</span>
      </div>
      
      <div class="relative z-10 mt-8">
        <div class="flex items-baseline mb-6">
          <span class="text-7xl md:text-[5.5rem] font-serif tracking-tighter text-zinc-900 leading-[0.8]">{{ overview?.tokenCount || 0 }}</span>
          <span class="text-lg text-zinc-400 ml-4 font-light">总计</span>
        </div>
        <p class="text-zinc-500 text-sm leading-relaxed max-w-[240px]">有效且未过期的 API 访问凭证，保障各服务的安全接入。</p>
      </div>
      <div class="absolute -bottom-10 -right-10 w-64 h-64 bg-zinc-50 rounded-full blur-3xl group-hover:bg-zinc-100/80 transition-colors pointer-events-none"></div>
    </div>

    <div class="md:col-span-7 flex flex-col gap-8 md:gap-10">
      <!-- Shortlinks -->
      <div class="bg-zinc-900 rounded-[2.5rem] p-10 md:p-12 shadow-xl flex flex-col justify-between relative overflow-hidden group flex-1 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
        <div class="absolute -bottom-6 -right-6 p-8 opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none">
          <Link2 class="w-32 h-32 text-white transform -rotate-12" />
        </div>
        <div class="relative z-10 mb-8">
          <h3 class="text-zinc-400 text-sm font-bold uppercase tracking-[0.2em] mb-3">Shortlinks Routing</h3>
          <p class="text-white text-xl md:text-2xl font-serif">高效、极简的短链分发系统。</p>
        </div>
        <div class="relative z-10 flex items-baseline">
          <span class="text-6xl md:text-7xl font-serif text-white tracking-tighter leading-[0.8]">{{ overview?.linkCount || 0 }}</span>
          <span class="text-sm text-zinc-400 ml-4">路由规则</span>
        </div>
      </div>

      <!-- Storage -->
      <div class="bg-white rounded-[2.5rem] p-10 flex items-center justify-between shadow-xl shadow-zinc-200/40 border border-zinc-100 transition-all duration-500 hover:shadow-2xl hover:shadow-zinc-300/50 hover:-translate-y-1">
        <div class="flex items-center gap-6">
          <div class="w-16 h-16 rounded-full bg-zinc-50 flex items-center justify-center border border-zinc-100">
            <ImageIcon class="w-7 h-7 text-zinc-400" />
          </div>
          <div>
            <h4 class="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-1">Total Assets</h4>
            <div class="flex items-baseline gap-2">
              <span class="text-3xl font-serif text-zinc-900">{{ overview?.fileCount || 0 }}</span>
              <span class="text-xs text-zinc-500">文件归档</span>
            </div>
          </div>
        </div>
        <button @click="openAssetDashboard" class="hidden sm:flex items-center justify-center w-12 h-12 rounded-full border border-zinc-200 text-zinc-400 hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-all shadow-xs">
          <ArrowRight class="w-5 h-5" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { KeyRound, Link2, Image as ImageIcon, ArrowRight } from 'lucide-vue-next';
import { request, showToast } from '../store';

const overview = ref(null);

const loadOverview = async () => {
  try {
    overview.value = await request('/api/overview');
  } catch (e) {
    showToast(e.message, 'error');
  }
};

const openAssetDashboard = () => {
  window.open('http://127.0.0.1:8001/', '_blank');
};

onMounted(() => {
  loadOverview();
});
</script>

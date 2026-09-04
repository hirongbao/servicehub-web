<template>
  <div class="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10">
    
    <!-- Tokens Card (5) -->
    <div class="md:col-span-5 bg-white rounded-[2.5rem] lg:rounded-[3rem] p-10 md:p-12 shadow-xl shadow-zinc-200/40 border border-zinc-100 flex flex-col justify-between relative overflow-hidden group min-h-[380px] transition-all duration-500 hover:shadow-2xl hover:shadow-zinc-300/50 hover:-translate-y-2">
      <div class="relative z-10 flex items-center justify-between">
        <div class="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-md">
          <KeyRound class="w-6 h-6" />
        </div>
        <span class="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">有效凭证</span>
      </div>
      <div class="relative z-10 mt-8">
        <div class="flex items-baseline mb-6">
          <span class="text-7xl md:text-[5.5rem] font-serif tracking-tighter text-zinc-900 leading-[0.8]">{{ overview?.activeTokens || 0 }}</span>
          <span class="text-lg text-zinc-400 ml-4 font-light">ACTIVE</span>
        </div>
        <p class="text-zinc-500 text-sm leading-relaxed max-w-[240px]">安全 API 调用密钥，共签发 <span class="font-bold text-zinc-800">{{ overview?.totalTokens || 0 }}</span> 个。</p>
      </div>
      <div class="absolute -bottom-10 -right-10 w-64 h-64 bg-zinc-50 rounded-full blur-3xl group-hover:bg-zinc-100/80 transition-colors pointer-events-none"></div>
    </div>

    <!-- Links Card (7) -->
    <div class="md:col-span-7 bg-zinc-900 rounded-[2.5rem] lg:rounded-[3rem] p-10 md:p-12 shadow-xl flex flex-col justify-between relative overflow-hidden group min-h-[380px] transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
      <div class="absolute -bottom-6 -right-6 p-8 opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none">
        <Link2 class="w-32 h-32 text-white transform -rotate-12" />
      </div>
      <div class="relative z-10 mb-8 flex justify-between items-start">
        <div>
          <h3 class="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-3">短链路由</h3>
          <p class="text-white text-xl md:text-2xl font-serif">高效、极简的短链分发系统。</p>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-white group-hover:text-zinc-900 transition-colors">
          <Link2 class="w-5 h-5" />
        </div>
      </div>
      <div class="relative z-10 flex items-baseline">
        <span class="text-6xl md:text-7xl font-serif text-white tracking-tighter leading-[0.8]">{{ overview?.activeLinks || 0 }}</span>
        <span class="text-sm text-zinc-400 ml-4">路由规则</span>
      </div>
    </div>

    <!-- Website Manager Card (7) -->
    <div class="md:col-span-7 bg-white rounded-[2.5rem] lg:rounded-[3rem] p-10 md:p-12 shadow-xl shadow-zinc-200/40 border border-zinc-100 flex flex-col justify-between relative overflow-hidden group min-h-[340px] transition-all duration-500 hover:shadow-2xl hover:shadow-zinc-300/50 hover:-translate-y-2">
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center">
            <Newspaper class="w-4 h-4 text-zinc-900" />
          </div>
          <p class="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">网站内容管理</p>
        </div>
        <span class="px-3 py-1 bg-zinc-100 rounded-full text-[10px] font-bold tracking-widest text-zinc-500">TOC</span>
      </div>
      <div class="mt-auto">
        <div class="flex items-baseline mb-4">
          <span class="text-5xl md:text-6xl font-serif tracking-tighter text-zinc-900">{{ postTotal }}</span>
          <span class="text-sm text-zinc-400 ml-3">篇动态</span>
        </div>
        <p class="text-zinc-500 text-sm leading-relaxed max-w-[300px]">最新动态：<span class="italic text-zinc-700">{{ latestPostTitle }}</span></p>
      </div>
    </div>

    <!-- Asset Dashboard Link (5) -->
    <a href="http://127.0.0.1:8001/" target="_blank" rel="noreferrer" class="md:col-span-5 bg-zinc-900 text-white rounded-[2.5rem] lg:rounded-[3rem] p-10 md:p-12 shadow-2xl shadow-zinc-900/20 border border-zinc-800 flex flex-col justify-between relative overflow-hidden group min-h-[340px] transition-all duration-500 hover:-translate-y-2">
      <div class="absolute -right-16 -bottom-16 w-56 h-56 bg-zinc-800 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000 ease-out pointer-events-none"></div>
      <div class="relative z-10 flex items-center justify-between">
        <div class="w-12 h-12 rounded-2xl bg-zinc-800 text-white flex items-center justify-center border border-zinc-700">
          <MonitorPlay class="w-5 h-5" />
        </div>
        <ArrowRight class="w-5 h-5 text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
      </div>
      <div class="relative z-10 mt-8">
        <h3 class="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400 mb-3">PORT: 8001</h3>
        <p class="text-2xl md:text-3xl font-serif leading-tight">个人资产<br/>媒体专属看板</p>
      </div>
    </a>

    <!-- Files / Media Card (12) -->
    <div class="md:col-span-12 bg-white rounded-[2.5rem] lg:rounded-[3rem] p-10 md:p-12 shadow-xl shadow-zinc-200/40 border border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-10 min-h-[280px] transition-all duration-500 hover:shadow-2xl hover:shadow-zinc-300/50 hover:-translate-y-2 group">
      <div>
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-10 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center">
            <ImageIcon class="w-4 h-4 text-zinc-900" />
          </div>
          <p class="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">存储资产</p>
        </div>
        <div class="flex items-baseline gap-4 mt-6">
          <h3 class="text-5xl md:text-6xl font-serif tracking-tighter text-zinc-900">{{ overview?.totalFiles || 0 }}</h3>
          <span class="text-lg text-zinc-400 font-light">个文件归档</span>
        </div>
      </div>
      
      <!-- Mini asset preview grid -->
      <div class="flex flex-wrap items-center gap-4 overflow-hidden mt-6 md:mt-0">
         <div v-for="f in files.slice(0, 5)" :key="f.id" class="group/img w-24 h-24 md:w-28 md:h-28 rounded-[2rem] bg-zinc-50 overflow-hidden shrink-0 border border-zinc-200/80 flex items-center justify-center shadow-sm transition-transform duration-300 hover:scale-105 hover:shadow-md">
           <img v-if="f.fileUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i)" :src="f.fileUrl" class="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-500" />
           <ImageIcon v-else class="w-8 h-8 text-zinc-300" />
         </div>
         <div v-if="(overview?.totalFiles || files.length) > 5" class="w-24 h-24 md:w-28 md:h-28 rounded-[2rem] bg-zinc-50 border border-zinc-200/80 border-dashed flex flex-col items-center justify-center text-zinc-400">
           <span class="font-mono text-xl font-bold mb-1">+{{ (overview?.totalFiles || files.length) - 5 }}</span>
         </div>
      </div>
    </div>
    
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue';
import { KeyRound, Link2, Image as ImageIcon, ArrowRight, Newspaper, MonitorPlay } from 'lucide-vue-next';
import { request, showToast } from '../store';

const overview = ref(null);
const files = ref([]);
const posts = ref([]);
const postTotal = ref(0);

const latestPostTitle = computed(() => {
  if (posts.value.length === 0) return '暂无内容';
  const content = posts.value[0].content || '';
  return content.slice(0, 20) + (content.length > 20 ? '...' : '');
});

const loadData = async () => {
  try {
    // 1. Overview API
    overview.value = await request('/api/overview');
    
    // 2. Fetch some recent files for preview
    const fRes = await request('/api/files?page=1&size=5');
    files.value = fRes.list || fRes.records || fRes || [];
    
    // 3. Fetch posts count and latest post
    const pRes = await request('/api/site/posts?page=1&size=1');
    posts.value = pRes.list || pRes.records || pRes || [];
    postTotal.value = pRes.total || posts.value.length || 0;
    
  } catch (e) {
    showToast(e.message, 'error');
  }
};

onMounted(() => {
  loadData();
});
</script>

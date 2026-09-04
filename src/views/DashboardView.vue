<template>
  <div class="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
    
    <!-- Tokens Card (5) -->
    <div @click="activeView = 'tokens'" class="cursor-pointer md:col-span-5 bg-white rounded-[2rem] lg:rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-zinc-200/40 border border-zinc-100 flex flex-col justify-between relative overflow-hidden group min-h-[280px] transition-all duration-500 hover:shadow-2xl hover:shadow-zinc-300/50 hover:-translate-y-2">
      <div class="relative z-10 flex items-center justify-between">
        <div class="w-10 h-10 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-md">
          <KeyRound class="w-5 h-5" />
        </div>
        <span class="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">有效凭证</span>
      </div>
      <div class="relative z-10 mt-6">
        <div class="flex items-baseline mb-4">
          <span class="text-6xl md:text-[4.5rem] font-serif tracking-tighter text-zinc-900 leading-[0.8]">{{ overview?.activeTokens || 0 }}</span>
          <span class="text-base text-zinc-400 ml-3 font-light">ACTIVE</span>
        </div>
        <p class="text-zinc-500 text-xs md:text-sm leading-relaxed max-w-[220px]">安全 API 调用密钥，共签发 <span class="font-bold text-zinc-800">{{ overview?.totalTokens || 0 }}</span> 个。</p>
      </div>
      <div class="absolute -bottom-10 -right-10 w-48 h-48 bg-zinc-50 rounded-full blur-3xl group-hover:bg-zinc-100/80 transition-colors pointer-events-none"></div>
    </div>

    <!-- Links Card (7) -->
    <div @click="activeView = 'links'" class="cursor-pointer md:col-span-7 bg-zinc-900 rounded-[2rem] lg:rounded-[2.5rem] p-8 md:p-10 shadow-xl flex flex-col justify-between relative overflow-hidden group min-h-[280px] transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
      <div class="absolute -bottom-6 -right-6 p-8 opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none">
        <Link2 class="w-24 h-24 text-white transform -rotate-12" />
      </div>
      <div class="relative z-10 mb-6 flex justify-between items-start">
        <div>
          <h3 class="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-2">短链路由</h3>
          <p class="text-white text-lg md:text-xl font-serif">高效、极简的短链分发系统。</p>
        </div>
        <div class="w-10 h-10 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-white group-hover:text-zinc-900 transition-colors">
          <Link2 class="w-4 h-4" />
        </div>
      </div>
      <div class="relative z-10 flex items-baseline">
        <span class="text-5xl md:text-6xl font-serif text-white tracking-tighter leading-[0.8]">{{ overview?.activeLinks || 0 }}</span>
        <span class="text-xs text-zinc-400 ml-3">路由规则</span>
      </div>
    </div>

    <!-- Website Manager Card (7) -->
    <div @click="activeView = 'posts'" class="cursor-pointer md:col-span-7 bg-white rounded-[2rem] lg:rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-zinc-200/40 border border-zinc-100 flex flex-col justify-between relative overflow-hidden group min-h-[240px] md:min-h-[260px] transition-all duration-500 hover:shadow-2xl hover:shadow-zinc-300/50 hover:-translate-y-2">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center">
            <Newspaper class="w-3.5 h-3.5 text-zinc-900" />
          </div>
          <p class="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">网站内容管理</p>
        </div>
        <span class="px-3 py-1 bg-zinc-100 rounded-full text-[9px] font-bold tracking-widest text-zinc-500">TOC</span>
      </div>
      <div class="mt-auto">
        <div class="flex items-baseline mb-3">
          <span class="text-4xl md:text-5xl font-serif tracking-tighter text-zinc-900">{{ postTotal }}</span>
          <span class="text-xs text-zinc-400 ml-2">篇动态</span>
        </div>
        <p class="text-zinc-500 text-xs md:text-sm leading-relaxed max-w-[280px]">最新动态：<span class="italic text-zinc-700">{{ latestPostTitle }}</span></p>
      </div>
    </div>

    <!-- Asset Dashboard Link (5) -->
    <a href="http://127.0.0.1:8001/" target="_blank" rel="noreferrer" class="md:col-span-5 bg-zinc-900 text-white rounded-[2rem] lg:rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-zinc-900/20 border border-zinc-800 flex flex-col justify-between relative overflow-hidden group min-h-[240px] md:min-h-[260px] transition-all duration-500 hover:-translate-y-2">
      <div class="absolute -right-12 -bottom-12 w-48 h-48 bg-zinc-800 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000 ease-out pointer-events-none"></div>
      <div class="relative z-10 flex items-center justify-between">
        <div class="w-10 h-10 rounded-2xl bg-zinc-800 text-white flex items-center justify-center border border-zinc-700">
          <MonitorPlay class="w-4 h-4" />
        </div>
        <ArrowRight class="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
      </div>
      <div class="relative z-10 mt-6">
        <h3 class="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400 mb-2">PORT: 8001</h3>
        <p class="text-xl md:text-2xl font-serif leading-tight">个人资产<br/>媒体专属看板</p>
      </div>
    </a>

    <!-- Files / Media Card (12) -->
    <div @click="activeView = 'files'" class="cursor-pointer md:col-span-12 bg-white rounded-[2rem] lg:rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-zinc-200/40 border border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-8 min-h-[200px] transition-all duration-500 hover:shadow-2xl hover:shadow-zinc-300/50 hover:-translate-y-2 group">
      <div>
        <div class="flex items-center gap-3 mb-4">
          <div class="w-8 h-8 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center">
            <ImageIcon class="w-3.5 h-3.5 text-zinc-900" />
          </div>
          <p class="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">存储资产</p>
        </div>
        <div class="flex items-baseline gap-3 mt-4">
          <h3 class="text-4xl md:text-5xl font-serif tracking-tighter text-zinc-900">{{ overview?.totalFiles || 0 }}</h3>
          <span class="text-sm text-zinc-400 font-light">个文件归档</span>
        </div>
      </div>
      
      <!-- Mini asset preview grid -->
      <div class="flex flex-wrap items-center gap-3 overflow-hidden mt-6 md:mt-0">
         <div v-for="f in files.slice(0, 5)" :key="f.id" class="group/img w-20 h-20 md:w-24 md:h-24 rounded-[1.5rem] bg-zinc-50 overflow-hidden shrink-0 border border-zinc-200/80 flex items-center justify-center shadow-sm transition-transform duration-300 hover:scale-105 hover:shadow-md">
           <img v-if="f.fileUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i)" :src="f.fileUrl" class="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-500" />
           <ImageIcon v-else class="w-6 h-6 text-zinc-300" />
         </div>
         <div v-if="(overview?.totalFiles || files.length) > 5" class="w-20 h-20 md:w-24 md:h-24 rounded-[1.5rem] bg-zinc-50 border border-zinc-200/80 border-dashed flex flex-col items-center justify-center text-zinc-400">
           <span class="font-mono text-lg font-bold mb-0.5">+{{ (overview?.totalFiles || files.length) - 5 }}</span>
         </div>
      </div>
    </div>
    
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue';
import { KeyRound, Link2, Image as ImageIcon, ArrowRight, Newspaper, MonitorPlay } from 'lucide-vue-next';
import { request, showToast, activeView } from '../store';

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
    overview.value = await request('/api/overview');
    
    const fRes = await request('/api/files?page=1&size=5');
    files.value = fRes.list || fRes.records || fRes || [];
    
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

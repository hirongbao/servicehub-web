<template>
  <div>
    <!-- Global Toast Notifications -->
    <Toast />
    
    <!-- Global Confirm Dialog -->
    <Confirm />

    <!-- 登录页 -->
    <LoginView v-if="!loggedIn" @login-success="initDashboard" />

    <!-- 控制台壳 -->
    <div v-else class="min-h-screen bg-[#F8F9FA] text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white pb-32">
      <!-- 动态导航岛 -->
      <header class="fixed top-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-4">
        <div class="pointer-events-auto bg-white/85 backdrop-blur-2xl shadow-[0_12px_36px_-6px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.04)] p-1.5 rounded-full flex items-center gap-1.5 transition-all hover:bg-white/95">
          <div class="pl-3.5 pr-2.5 flex items-center gap-2.5 border-r border-black/[0.06]">
            <div class="relative">
              <div class="w-7 h-7 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[11px] font-bold shadow-xs">
                {{ username.charAt(0).toUpperCase() }}
              </div>
              <span class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></span>
            </div>
            <span class="text-xs font-serif font-medium tracking-wide mr-1 hidden md:block text-zinc-800">ServiceHub</span>
          </div>

          <button
            v-for="item in navItems"
            :key="item.id"
            @click="activeView = item.id"
            :class="[
              'px-4 md:px-5 py-2 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-2 select-none',
              activeView === item.id 
                ? 'bg-zinc-900 text-white shadow-md shadow-zinc-900/20' 
                : 'text-zinc-500 hover:text-zinc-900 hover:bg-black/[0.04]'
            ]"
          >
            <component :is="item.icon" class="w-3.5 h-3.5" />
            <span class="hidden sm:block tracking-wide">{{ item.label }}</span>
          </button>

          <div class="pl-1.5 pr-1 border-l border-black/[0.06] flex items-center gap-0.5">
            <button @click="handleLogout" class="w-8 h-8 rounded-full hover:bg-black/[0.05] text-zinc-400 hover:text-red-600 transition-colors flex items-center justify-center" title="退出登录">
              <LogOut class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      <!-- 主视图渲染区 -->
      <main class="pt-36 px-6 md:px-12 max-w-[1400px] mx-auto">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-14">
          <div class="max-w-2xl">
            <div class="flex items-center gap-2 mb-3">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p class="text-[10px] font-bold tracking-[0.25em] uppercase text-zinc-400">{{ currentMeta.badge }}</p>
            </div>
            <h1 class="text-4xl md:text-6xl font-serif font-normal text-zinc-900 tracking-tight mb-3 leading-tight">{{ currentMeta.title }}</h1>
            <p class="text-zinc-500 text-base md:text-lg font-light leading-relaxed">{{ currentMeta.desc }}</p>
          </div>
        </div>

        <div v-motion :initial="{ opacity: 0, y: 15 }" :enter="{ opacity: 1, y: 0, transition: { duration: 400 } }" :key="activeView">
          <DashboardView v-if="activeView === 'overview'" />
          <TokensView v-if="activeView === 'tokens'" />
          <LinksView v-if="activeView === 'links'" />
          <FilesView v-if="activeView === 'files'" />
          <WebsiteManagerView v-if="activeView === 'posts'" />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { LayoutDashboard, KeyRound, Link2, Image as ImageIcon, Newspaper, LogOut } from 'lucide-vue-next';
import { loggedIn, username, activeView, request, showToast } from './store';

import Toast from './components/ui/Toast.vue';
import Confirm from './components/ui/Confirm.vue';

import LoginView from './views/LoginView.vue';
import DashboardView from './views/DashboardView.vue';
import TokensView from './views/TokensView.vue';
import LinksView from './views/LinksView.vue';
import FilesView from './views/FilesView.vue';
import WebsiteManagerView from './views/WebsiteManagerView.vue';

const navItems = [
  { id: 'overview', label: '仪表盘', icon: LayoutDashboard },
  { id: 'tokens', label: '访问凭证', icon: KeyRound },
  { id: 'links', label: '短链路由', icon: Link2 },
  { id: 'files', label: '媒体资产', icon: ImageIcon },
  { id: 'posts', label: '网站管理', icon: Newspaper }
];

const metaMap = {
  overview: { title: '工作空间', desc: '全局系统运行状态与服务用量概览。', badge: '01 / WORKSPACE' },
  tokens: { title: '访问凭证', desc: '管理与分发用于调用 API 的安全访问凭证。', badge: '02 / ACCESS TOKENS' },
  links: { title: '短链路由', desc: '创建、管理短链接并实时追踪访问数据。', badge: '03 / ROUTING' },
  files: { title: '媒体资产', desc: '统一管理云端托管的静态文件与图片资源。', badge: '04 / MEDIA ASSETS' },
  posts: { title: '网站管理', desc: '统一维护个人网站资料、信息流与更新日志。', badge: '05 / TOC WEBSITE' }
};

const currentMeta = computed(() => metaMap[activeView.value]);

const initDashboard = () => {
  activeView.value = 'overview';
};

const handleLogout = async () => {
  try { await request('/api/admin/logout', { method: 'POST' }); } catch (_) {}
  localStorage.removeItem('servicehub_token');
  loggedIn.value = false;
  showToast('已退出登录', 'success');
};
</script>

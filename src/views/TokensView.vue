<template>
  <div class="space-y-6 max-w-7xl mx-auto pb-12">
    <!-- Header Area -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h2 class="font-serif text-2xl text-zinc-900 tracking-tight">访问凭证</h2>
        <p class="text-sm text-zinc-500 mt-1">管理与分发用于调用 API 的安全凭证。</p>
      </div>
      <button 
        @click="openCreateDialog" 
        class="bg-zinc-900 text-white px-5 py-2 rounded-full hover:bg-zinc-800 active:scale-95 transition-all text-xs font-medium flex items-center gap-1.5 shadow-sm"
      >
        <Plus class="w-4 h-4" /> 新建凭证
      </button>
    </div>

    <!-- Filter & Table Container (Minimalist Card) -->
    <div class="bg-white rounded-[24px] border border-zinc-100 shadow-sm overflow-hidden">
      
      <!-- Toolbar -->
      <div class="px-6 py-5 border-b border-zinc-100/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <!-- Left: Filters -->
        <div class="flex flex-wrap items-center gap-3">
          <!-- Search -->
          <div class="relative w-full sm:w-60">
            <Search class="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              v-model="searchKeyword" 
              @keyup.enter="handleSearch"
              type="text" 
              placeholder="搜索名称或 Token..." 
              class="w-full bg-zinc-50/50 border border-zinc-200/60 rounded-full pl-9 pr-8 py-2 text-sm focus:outline-none focus:border-zinc-300 focus:bg-white transition-all placeholder:text-zinc-400"
            />
            <button v-if="searchKeyword" @click="searchKeyword = ''; handleSearch()" class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
              <X class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Type Filter -->
          <div class="w-40">
            <Select 
              v-model="typeFilter" 
              size="sm" 
              :options="typeOptions" 
              @change="handleTypeChange" 
            />
          </div>

          <!-- Status Filter (Minimal Pills) -->
          <div class="inline-flex bg-zinc-50/80 p-1 rounded-full border border-zinc-100">
            <button 
              @click="handleStatusChange('active')" 
              :class="statusFilter === 'active' ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/50' : 'text-zinc-500 hover:text-zinc-700'"
              class="px-4 py-1.5 rounded-full text-xs font-medium transition-all"
            >
              可用
            </button>
            <button 
              @click="handleStatusChange('all')" 
              :class="statusFilter === 'all' ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/50' : 'text-zinc-500 hover:text-zinc-700'"
              class="px-4 py-1.5 rounded-full text-xs font-medium transition-all"
            >
              全部
            </button>
            <button 
              @click="handleStatusChange('inactive')" 
              :class="statusFilter === 'inactive' ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/50' : 'text-zinc-500 hover:text-zinc-700'"
              class="px-4 py-1.5 rounded-full text-xs font-medium transition-all"
            >
              失效
            </button>
          </div>
        </div>

        <!-- Right: Actions -->
        <div class="flex items-center gap-4 text-zinc-400 shrink-0">
          <span class="text-xs font-mono">Total: {{ tokenTotal }}</span>
          <button @click="loadTokens" class="hover:text-zinc-900 transition-colors" title="刷新列表">
            <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
          </button>
        </div>
      </div>

      <!-- Data Table -->
      <div class="overflow-x-auto min-h-[400px]">
        <table class="w-full text-left whitespace-nowrap">
          <thead class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-zinc-50/30 border-b border-zinc-100">
            <tr>
              <th class="py-4 px-6 font-medium">名称 / 权限域</th>
              <th class="py-4 px-6 font-medium">访问密钥 (Token)</th>
              <th class="py-4 px-6 font-medium">状态</th>
              <th class="py-4 px-6 font-medium">调用额度</th>
              <th class="py-4 px-6 font-medium">有效期至</th>
              <th class="py-4 px-6 font-medium text-right">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100/80 text-sm">
            <tr v-if="loading && tokens.length === 0">
              <td colspan="6" class="py-24 text-center text-zinc-400">
                <RefreshCw class="w-5 h-5 animate-spin mx-auto mb-3 opacity-50" />
                <span class="text-xs tracking-widest uppercase">Loading Tokens...</span>
              </td>
            </tr>
            <tr v-else-if="tokens.length === 0">
              <td colspan="6" class="py-24 text-center">
                <KeyRound class="w-8 h-8 text-zinc-200 mx-auto mb-4" />
                <h3 class="text-zinc-500 text-sm mb-1">无匹配数据</h3>
                <p class="text-zinc-400 text-xs">调整筛选条件或新建一个访问凭证</p>
              </td>
            </tr>
            <tr 
              v-else
              v-for="t in tokens" 
              :key="t.id" 
              class="hover:bg-zinc-50/50 transition-colors group"
            >
              <!-- 名称 & 权限域 -->
              <td class="py-4 px-6">
                <div class="flex flex-col gap-1.5">
                  <span class="font-medium text-zinc-900 text-sm truncate max-w-[200px]" :title="t.tokenName">
                    {{ t.tokenName }}
                  </span>
                  <span class="text-[10px] font-mono tracking-wider text-zinc-400 uppercase">
                    {{ t.tokenType }}
                  </span>
                </div>
              </td>

              <!-- Token 密钥 -->
              <td class="py-4 px-6">
                <div 
                  @click="copyText(t.tokenValue, 'Token 已复制', t.id)"
                  class="inline-flex items-center gap-2 group/token cursor-pointer"
                  title="点击复制"
                >
                  <span class="font-mono text-zinc-500 text-xs bg-zinc-50 border border-zinc-100 rounded-md px-2 py-1 group-hover/token:border-zinc-200 transition-colors">
                    {{ maskToken(t.tokenValue) }}
                  </span>
                  <Check v-if="copiedMap.has(t.id)" class="w-3.5 h-3.5 text-emerald-500" />
                  <Copy v-else class="w-3.5 h-3.5 text-zinc-300 group-hover/token:text-zinc-600 transition-colors" />
                </div>
              </td>

              <!-- 状态 -->
              <td class="py-4 px-6">
                <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full" :class="getStatusDotClass(t)"></span>
                  <span class="text-xs text-zinc-600 font-medium">{{ tokenStatus(t) }}</span>
                </div>
              </td>

              <!-- 调用额度 -->
              <td class="py-4 px-6">
                <div class="flex items-center gap-3">
                  <span class="font-mono text-xs text-zinc-700">
                    {{ t.usage_count ?? t.usageCount ?? 0 }} <span v-if="t.maxUses > 0" class="text-zinc-400">/ {{ t.maxUses }}</span>
                  </span>
                  <div v-if="t.maxUses > 0" class="w-16 h-1 bg-zinc-100 rounded-full overflow-hidden">
                    <div 
                      class="h-full rounded-full bg-zinc-900"
                      :style="{ width: `${Math.min(100, (((t.usage_count ?? t.usageCount ?? 0) / t.maxUses) * 100))}%` }"
                    ></div>
                  </div>
                  <span v-else class="text-[10px] text-zinc-400 border border-zinc-200 rounded px-1.5 py-0.5">无限制</span>
                </div>
              </td>

              <!-- 有效期 -->
              <td class="py-4 px-6">
                <span class="font-mono text-xs text-zinc-500">
                  {{ formatDateTime(t.expiresAt) }}
                </span>
              </td>

              <!-- 操作 -->
              <td class="py-4 px-6 text-right">
                <div class="inline-flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    @click="toggleToken(t)" 
                    :title="t.status === 1 ? '禁用' : '启用'"
                    class="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                  >
                    <Power class="w-4 h-4" :class="t.status === 1 ? 'text-zinc-800' : 'text-zinc-300'" />
                  </button>
                  <button 
                    @click="revokeToken(t)" 
                    title="彻底吊销"
                    class="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="tokenTotal > 0" class="px-6 py-4 border-t border-zinc-100 bg-white flex items-center justify-between">
        <span class="text-xs text-zinc-400 font-mono">
          Page {{ tokenPage }} · {{ (tokenPage - 1) * pageSize + 1 }}-{{ Math.min(tokenPage * pageSize, tokenTotal) }} of {{ tokenTotal }}
        </span>
        <Pagination v-model="tokenPage" :total="tokenTotal" :page-size="pageSize" @change="loadTokens" />
      </div>
    </div>

    <!-- Create Modal -->
    <Modal v-model:visible="dialogVisible" title="发行凭证">
      <div class="space-y-6 mt-4">
        <div>
          <label class="block text-xs font-medium text-zinc-700 mb-2">凭证名称</label>
          <input 
            v-model="tokenName" 
            type="text" 
            class="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all placeholder:text-zinc-300" 
            placeholder="例如：后端服务器访问" 
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-zinc-700 mb-2">有效期 (天)</label>
            <input 
              v-model="validDays" 
              type="number" 
              class="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all font-mono" 
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-zinc-700 mb-2">调用次数上限 (0=不限)</label>
            <input 
              v-model="maxUses" 
              type="number" 
              class="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all font-mono" 
            />
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-700 mb-2">权限域</label>
          <Select 
            v-model="tokenType" 
            :options="createTypeOptions" 
          />
        </div>
        
        <div class="pt-2">
          <button 
            @click="createToken" 
            :disabled="submitting" 
            class="w-full bg-zinc-900 text-white rounded-xl py-3 text-sm font-medium hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {{ submitting ? '生成中...' : '确认发行' }}
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Plus, RefreshCw, KeyRound, Copy, Check, Power, Trash2, Search, X } from 'lucide-vue-next';
import Modal from '../components/ui/Modal.vue';
import Pagination from '../components/ui/Pagination.vue';
import Select from '../components/ui/Select.vue';
import { request, showToast, showConfirm } from '../store';

const tokens = ref([]);
const loading = ref(false);
const tokenPage = ref(1);
const tokenTotal = ref(0);
const pageSize = 15;
const copiedMap = ref(new Map());

const searchKeyword = ref('');
const statusFilter = ref('active');
const typeFilter = ref('ALL');

const typeOptions = [
  { label: '所有权限域', value: 'ALL' },
  { label: 'FILEHUB', value: 'FILEHUB' },
  { label: 'LINKHUB', value: 'LINKHUB' },
  { label: 'HIRONGBAOHUB', value: 'HIRONGBAOHUB' }
];

const createTypeOptions = [
  { label: '文件总线 (FILEHUB)', value: 'FILEHUB' },
  { label: '短链服务 (LINKHUB)', value: 'LINKHUB' },
  { label: '动态发布 (HIRONGBAOHUB)', value: 'HIRONGBAOHUB' }
];

const dialogVisible = ref(false);
const submitting = ref(false);
const tokenName = ref('');
const validDays = ref(30);
const maxUses = ref(0);
const tokenType = ref('FILEHUB');

const isExpired = t => t.expiresAt && new Date(t.expiresAt) <= new Date();

const tokenStatus = t => {
  if (t.status !== 1) return '已禁用';
  if (isExpired(t)) return '已过期';
  return '可用';
};

const getStatusDotClass = t => {
  if (t.status !== 1) return 'bg-zinc-300';
  if (isExpired(t)) return 'bg-red-500';
  return 'bg-emerald-500';
};

const maskToken = val => {
  if (!val) return '-';
  if (val.length <= 16) return val;
  return `${val.slice(0, 8)}...${val.slice(-6)}`;
};

const formatDateTime = d => {
  if (!d) return '永久有效';
  const date = new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
};

const handleSearch = () => {
  tokenPage.value = 1;
  loadTokens();
};

const handleStatusChange = (status) => {
  statusFilter.value = status;
  tokenPage.value = 1;
  loadTokens();
};

const handleTypeChange = () => {
  tokenPage.value = 1;
  loadTokens();
};

const loadTokens = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      page: String(tokenPage.value),
      size: String(pageSize),
      status: statusFilter.value
    });
    if (typeFilter.value && typeFilter.value !== 'ALL') {
      params.append('tokenType', typeFilter.value);
    }
    if (searchKeyword.value.trim()) {
      params.append('keyword', searchKeyword.value.trim());
    }
    const res = await request(`/api/tokens?${params.toString()}`);
    tokens.value = res.records || res.list || res || [];
    tokenTotal.value = res.total !== undefined ? res.total : tokens.value.length;
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    loading.value = false;
  }
};

const openCreateDialog = () => {
  tokenName.value = '';
  validDays.value = 30;
  maxUses.value = 0;
  tokenType.value = 'FILEHUB';
  dialogVisible.value = true;
};

const createToken = async () => {
  if (!tokenName.value) return showToast('请输入凭证名称', 'warning');
  submitting.value = true;
  try {
    await request('/api/tokens', {
      method: 'POST',
      body: JSON.stringify({ 
        tokenName: tokenName.value.trim(), 
        tokenType: tokenType.value, 
        maxUses: Number(maxUses.value), 
        validDays: Number(validDays.value) 
      })
    });
    showToast('凭证生成成功', 'success');
    dialogVisible.value = false;
    tokenPage.value = 1;
    await loadTokens();
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    submitting.value = false;
  }
};

const toggleToken = async t => {
  try {
    const s = t.status === 1 ? 0 : 1;
    await request(`/api/tokens/${t.id}/status`, { method: 'POST', body: JSON.stringify({ status: s }) });
    showToast(s === 1 ? '凭证已启用' : '凭证已禁用', 'success');
    await loadTokens();
  } catch (e) { showToast(e.message, 'error'); }
};

const revokeToken = async t => {
  try {
    await showConfirm('吊销凭证', '确认吊销并删除该访问凭证？', { confirmText: '吊销' });
    await request(`/api/tokens/${t.id}`, { method: 'DELETE' });
    showToast('凭证已吊销', 'success');
    await loadTokens();
  } catch (e) {}
};

const copyText = async (text, successMsg = '已复制', id = null) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "absolute";
      textArea.style.left = "-999999px";
      document.body.prepend(textArea);
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
    }
    if (id) {
      copiedMap.value.set(id, true);
      setTimeout(() => copiedMap.value.delete(id), 2000);
    }
    showToast(successMsg, 'success');
  } catch (err) {
    showToast('复制失败', 'error');
  }
};

onMounted(() => loadTokens());
</script>

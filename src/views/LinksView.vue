<template>
  <div class="space-y-6 max-w-7xl mx-auto pb-12">
    <!-- Header Area -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h2 class="font-serif text-2xl text-zinc-900 tracking-tight">短链路由</h2>
        <p class="text-sm text-zinc-500 mt-1">创建、管理短链接并实时追踪访问数据。</p>
      </div>
      <button 
        @click="openCreateDialog" 
        class="bg-zinc-900 text-white px-5 py-2 rounded-full hover:bg-zinc-800 active:scale-95 transition-all text-xs font-medium flex items-center gap-1.5 shadow-sm"
      >
        <Plus class="w-4 h-4" /> 创建短链
      </button>
    </div>

    <!-- Filter & Table Container -->
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
              placeholder="搜索短码、目标链接..." 
              class="w-full bg-zinc-50/50 border border-zinc-200/60 rounded-full pl-9 pr-8 py-2 text-sm focus:outline-none focus:border-zinc-300 focus:bg-white transition-all placeholder:text-zinc-400"
            />
            <button v-if="searchKeyword" @click="searchKeyword = ''; handleSearch()" class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
              <X class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Status Filter -->
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
          <span class="text-xs font-mono">Total: {{ linkTotal }}</span>
          <button @click="loadLinks" class="hover:text-zinc-900 transition-colors" title="刷新列表">
            <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
          </button>
        </div>
      </div>

      <!-- Data Table -->
      <div class="overflow-x-auto min-h-[400px]">
        <table class="w-full text-left whitespace-nowrap">
          <thead class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-zinc-50/30 border-b border-zinc-100">
            <tr>
              <th class="py-4 px-6 font-medium">短链路径</th>
              <th class="py-4 px-6 font-medium">备注与目标网址</th>
              <th class="py-4 px-6 font-medium">状态</th>
              <th class="py-4 px-6 font-medium text-center">访问统计</th>
              <th class="py-4 px-6 font-medium">有效期至</th>
              <th class="py-4 px-6 font-medium text-right">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100/80 text-sm">
            <tr v-if="loading && links.length === 0">
              <td colspan="6" class="py-24 text-center text-zinc-400">
                <RefreshCw class="w-5 h-5 animate-spin mx-auto mb-3 opacity-50" />
                <span class="text-xs tracking-widest uppercase">Loading Links...</span>
              </td>
            </tr>
            <tr v-else-if="links.length === 0">
              <td colspan="6" class="py-24 text-center">
                <Link2 class="w-8 h-8 text-zinc-200 mx-auto mb-4" />
                <h3 class="text-zinc-500 text-sm mb-1">未找到短链路由</h3>
                <p class="text-zinc-400 text-xs">调整筛选条件或新建一个短链接</p>
              </td>
            </tr>
            <tr 
              v-else
              v-for="l in links" 
              :key="l.id" 
              class="hover:bg-zinc-50/50 transition-colors group"
            >
              <!-- 短链路径 -->
              <td class="py-4 px-6">
                <div class="flex items-center gap-2">
                  <a :href="shortUrl(l)" target="_blank" class="font-mono text-zinc-900 bg-zinc-100 px-2.5 py-1 rounded-md text-xs hover:bg-zinc-200 transition-colors">
                    /s/{{ l.code }}
                  </a>
                  <button @click="copyText(shortUrl(l), '短链接已复制', l.id)" class="text-zinc-300 hover:text-zinc-600 transition-colors">
                    <Check v-if="copiedId === l.id" class="w-3.5 h-3.5 text-emerald-500" />
                    <Copy v-else class="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>

              <!-- 备注与目标网址 -->
              <td class="py-4 px-6 max-w-sm">
                <div class="flex flex-col gap-1.5">
                  <span class="font-medium text-zinc-900 text-sm truncate" :title="l.remark">
                    {{ l.remark || l.targetUrl }}
                  </span>
                  <a :href="l.targetUrl" target="_blank" class="text-[11px] text-zinc-400 hover:text-zinc-600 truncate underline underline-offset-2 decoration-zinc-200" :title="l.targetUrl">
                    {{ l.targetUrl }}
                  </a>
                </div>
              </td>

              <!-- 状态 -->
              <td class="py-4 px-6">
                <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full" :class="getStatusDotClass(l)"></span>
                  <span class="text-xs text-zinc-600 font-medium">{{ linkStatusText(l) }}</span>
                </div>
              </td>

              <!-- 访问统计 -->
              <td class="py-4 px-6 text-center">
                <button @click="showStats(l)" class="text-zinc-900 font-mono text-base font-medium hover:text-blue-600 hover:underline transition-colors focus:outline-none">
                  {{ l.visitCount || 0 }}
                </button>
              </td>

              <!-- 有效期 -->
              <td class="py-4 px-6">
                <span class="font-mono text-xs text-zinc-500">
                  {{ formatDateTime(l.expiresAt) }}
                </span>
              </td>

              <!-- 操作 -->
              <td class="py-4 px-6 text-right">
                <div class="inline-flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    @click="openQrModal(l)" 
                    title="二维码"
                    class="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                  >
                    <QrCodeIcon class="w-4 h-4" />
                  </button>
                  <button 
                    @click="deleteLink(l)" 
                    title="删除短链"
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
      <div v-if="linkTotal > 0" class="px-6 py-4 border-t border-zinc-100 bg-white flex items-center justify-between">
        <span class="text-xs text-zinc-400 font-mono">
          Page {{ linkPage }} · {{ (linkPage - 1) * pageSize + 1 }}-{{ Math.min(linkPage * pageSize, linkTotal) }} of {{ linkTotal }}
        </span>
        <Pagination v-model="linkPage" :total="linkTotal" :page-size="pageSize" @change="loadLinks" />
      </div>
    </div>

    <!-- Create Modal -->
    <Modal v-model:visible="dialogVisible" title="创建短链">
      <div class="space-y-6 mt-4">
        <div>
          <label class="block text-xs font-medium text-zinc-700 mb-2">目标链接 (URL)</label>
          <input 
            v-model="linkTarget" 
            type="url" 
            class="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all font-mono" 
            placeholder="https://example.com" 
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-zinc-700 mb-2">
              自定义短码 <span class="text-zinc-400 font-normal">(可选)</span>
            </label>
            <div class="relative">
              <input 
                v-model="linkCode" 
                type="text" 
                class="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all font-mono" 
                placeholder="留空则自动生成" 
              />
              <button @click="generateRandomCode" class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900" title="随机生成">
                <RefreshCw class="w-4 h-4" />
              </button>
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-zinc-700 mb-2">有效期</label>
            <Select 
              v-model="linkValidDays" 
              :options="validDaysOptions" 
            />
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-700 mb-2">
            备注 <span class="text-zinc-400 font-normal">(可选)</span>
          </label>
          <input 
            v-model="linkRemark" 
            type="text" 
            class="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all placeholder:text-zinc-300" 
            placeholder="例如：主站首页推广" 
          />
        </div>
        
        <div class="pt-2">
          <button 
            @click="createLink" 
            :disabled="submitting" 
            class="w-full bg-zinc-900 text-white rounded-xl py-3 text-sm font-medium hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {{ submitting ? '创建中...' : '生成短链' }}
          </button>
        </div>
      </div>
    </Modal>

    <!-- Stats Modal -->
    <Modal v-model:visible="statsVisible" title="访问统计">
      <div v-if="statsLoading" class="py-12 flex justify-center text-zinc-300">
        <RefreshCw class="w-8 h-8 animate-spin" />
      </div>
      <div v-else class="space-y-6 mt-2">
        <div class="flex items-center gap-4 bg-zinc-50 border border-zinc-100 p-4 rounded-2xl">
          <div class="w-12 h-12 bg-white shadow-sm border border-zinc-100 rounded-xl flex items-center justify-center text-zinc-900">
            <BarChart3 class="w-5 h-5" />
          </div>
          <div>
            <p class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">总访问量</p>
            <p class="text-2xl font-serif text-zinc-900">{{ statsTotal }}</p>
          </div>
        </div>
        <div>
          <p class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">近期活动趋势 (最近 7 天)</p>
          <div v-if="statsDaily.length > 0" class="space-y-3">
            <div v-for="(day, i) in statsDaily.slice().reverse()" :key="i" class="flex items-center gap-3">
              <span class="text-xs font-mono text-zinc-500 w-12">{{ day.visitDate?.slice(5) || '-' }}</span>
              <div class="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
                <div 
                  class="h-full bg-zinc-900 rounded-full transition-all duration-500" 
                  :style="{ width: `${Math.max(3, (day.visits / Math.max(...statsDaily.map(d=>d.visits), 1)) * 100)}%` }"
                ></div>
              </div>
              <span class="text-xs font-mono font-medium w-8 text-right text-zinc-700">{{ day.visits }}</span>
            </div>
          </div>
          <p v-else class="text-xs text-zinc-400 italic py-4">暂无近期活动记录。</p>
        </div>
      </div>
    </Modal>

    <!-- QR Code Modal -->
    <Modal v-model:visible="qrVisible" title="短链二维码" width="380px">
      <div class="flex flex-col items-center py-4">
        <div class="p-3 bg-white border border-zinc-200/80 shadow-sm rounded-2xl mb-4">
          <img :src="qrCodeDataUrl" alt="QR Code" class="w-48 h-48" v-if="qrCodeDataUrl" />
          <div v-else class="w-48 h-48 flex items-center justify-center bg-zinc-50 text-zinc-300">
            <RefreshCw class="w-6 h-6 animate-spin" />
          </div>
        </div>
        <p class="text-xs font-mono text-zinc-600 bg-zinc-100 px-3 py-1.5 rounded-full select-all max-w-[280px] truncate">
          {{ activeQrCode }}
        </p>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Plus, RefreshCw, Link2, Copy, Trash2, Check, QrCodeIcon, BarChart3, ExternalLink, Search, X } from 'lucide-vue-next';
import QRCode from 'qrcode';
import Pagination from '../components/ui/Pagination.vue';
import Modal from '../components/ui/Modal.vue';
import Select from '../components/ui/Select.vue';
import { request, showToast, showConfirm } from '../store';

const links = ref([]);
const linkTotal = ref(0);
const linkPage = ref(1);
const pageSize = 15;
const loading = ref(false);

const searchKeyword = ref('');
const statusFilter = ref('active');

const dialogVisible = ref(false);
const linkTarget = ref('');
const linkCode = ref('');
const linkRemark = ref('');
const linkValidDays = ref(0);
const submitting = ref(false);

const validDaysOptions = [
  { label: '永久有效', value: 0 },
  { label: '24 小时 (1 天)', value: 1 },
  { label: '7 天', value: 7 },
  { label: '30 天', value: 30 }
];

const statsVisible = ref(false);
const statsLoading = ref(false);
const statsTotal = ref(0);
const statsDaily = ref([]);

const qrVisible = ref(false);
const qrCodeDataUrl = ref('');
const activeQrCode = ref('');
const copiedId = ref(null);

const isExpired = l => {
  if (!l.expiresAt) return false;
  return new Date(l.expiresAt).getTime() < Date.now();
};

const linkStatusText = l => {
  if (l.status !== 1) return '已禁用';
  if (isExpired(l)) return '已过期';
  return '可用';
};

const getStatusDotClass = l => {
  if (l.status !== 1) return 'bg-zinc-400 shadow-sm';
  if (isExpired(l)) return 'bg-red-500 shadow-sm shadow-red-500/50';
  return 'bg-emerald-500 shadow-sm shadow-emerald-500/50';
};

const formatDateTime = d => {
  if (!d) return '永久有效';
  const date = new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
};

const shortUrl = l => `${window.location.protocol}//${window.location.host}/s/${l.code}`;

const handleSearch = () => {
  linkPage.value = 1;
  loadLinks();
};

const handleStatusChange = (status) => {
  statusFilter.value = status;
  linkPage.value = 1;
  loadLinks();
};

const loadLinks = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      page: String(linkPage.value),
      size: String(pageSize),
      status: statusFilter.value
    });
    if (searchKeyword.value.trim()) {
      params.append('keyword', searchKeyword.value.trim());
    }
    const res = await request(`/api/links?${params.toString()}`);
    links.value = res.records || res.list || res || [];
    linkTotal.value = res.total !== undefined ? res.total : links.value.length;
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    loading.value = false;
  }
};

const openCreateDialog = () => {
  linkTarget.value = '';
  linkCode.value = '';
  linkRemark.value = '';
  linkValidDays.value = 0;
  dialogVisible.value = true;
};

const generateRandomCode = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  linkCode.value = result;
};

const createLink = async () => {
  if (!linkTarget.value) return showToast('请输入目标链接', 'warning');
  if (!linkTarget.value.startsWith('http://') && !linkTarget.value.startsWith('https://')) {
    linkTarget.value = 'https://' + linkTarget.value;
  }
  
  submitting.value = true;
  try {
    await request('/api/links', {
      method: 'POST',
      body: JSON.stringify({ 
        targetUrl: linkTarget.value.trim(), 
        code: linkCode.value.trim() || undefined, 
        remark: linkRemark.value.trim() || undefined, 
        validDays: Number(linkValidDays.value) 
      })
    });
    showToast('短链创建成功', 'success');
    dialogVisible.value = false;
    linkPage.value = 1;
    await loadLinks();
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    submitting.value = false;
  }
};

const deleteLink = async l => {
  try {
    await showConfirm('删除路由', '确认删除该短链路由？该操作不可逆，且将导致相关短链失效。', { confirmText: '删除' });
    await request(`/api/links/${l.id}`, { method: 'DELETE' });
    showToast('路由已删除', 'success');
    await loadLinks();
  } catch (e) {}
};

const showStats = async l => {
  statsVisible.value = true;
  statsLoading.value = true;
  try {
    const s = await request(`/api/links/${l.id}/stats`);
    statsTotal.value = s.total; 
    statsDaily.value = s.daily || [];
  } catch (e) { showToast(e.message, 'error'); } finally { statsLoading.value = false; }
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
      copiedId.value = id;
      setTimeout(() => copiedId.value = null, 2000);
    }
    showToast(successMsg, 'success');
  } catch (err) {
    showToast('复制失败', 'error');
  }
};

const openQrModal = async l => {
  activeQrCode.value = shortUrl(l);
  qrCodeDataUrl.value = '';
  qrVisible.value = true;
  try {
    qrCodeDataUrl.value = await QRCode.toDataURL(activeQrCode.value, { margin: 1, width: 256, color: { dark: '#18181b', light: '#ffffff' } });
  } catch (err) {
    showToast('二维码生成失败', 'error');
  }
};

onMounted(() => loadLinks());
</script>

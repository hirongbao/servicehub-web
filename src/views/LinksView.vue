<template>
  <div class="space-y-4">
    <!-- Compact Toolbar Bar (No duplicate page title) -->
    <div class="bg-white rounded-2xl border border-zinc-200/80 p-3 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <!-- Left: Search & Filter Tabs -->
      <div class="flex items-center gap-2.5 flex-1 flex-wrap">
        <!-- Search Input -->
        <div class="relative w-full sm:w-72">
          <Search class="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            v-model="searchKeyword" 
            @keyup.enter="handleSearch"
            type="text" 
            placeholder="搜索短码、目标链接或备注..." 
            class="w-full bg-zinc-50 border border-zinc-200/80 rounded-xl pl-8 pr-7 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all font-mono placeholder:text-zinc-400"
          />
          <button v-if="searchKeyword" @click="searchKeyword = ''; handleSearch()" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
            <X class="w-3 h-3" />
          </button>
        </div>

        <!-- Status Filter Segmented Control -->
        <div class="inline-flex bg-zinc-100 p-0.5 rounded-xl text-xs font-medium">
          <button 
            @click="handleStatusChange('active')" 
            :class="statusFilter === 'active' ? 'bg-white text-zinc-900 shadow-xs font-semibold' : 'text-zinc-500 hover:text-zinc-900'"
            class="px-3 py-1 rounded-lg transition-all"
          >
            仅可用 (默认)
          </button>
          <button 
            @click="handleStatusChange('all')" 
            :class="statusFilter === 'all' ? 'bg-white text-zinc-900 shadow-xs font-semibold' : 'text-zinc-500 hover:text-zinc-900'"
            class="px-3 py-1 rounded-lg transition-all"
          >
            全部
          </button>
          <button 
            @click="handleStatusChange('inactive')" 
            :class="statusFilter === 'inactive' ? 'bg-white text-zinc-900 shadow-xs font-semibold' : 'text-zinc-500 hover:text-zinc-900'"
            class="px-3 py-1 rounded-lg transition-all"
          >
            已失效/过期
          </button>
        </div>
      </div>

      <!-- Right: Summary, Refresh & Create Action -->
      <div class="flex items-center gap-3 shrink-0 self-end lg:self-center">
        <span class="text-xs font-mono text-zinc-400">共 {{ linkTotal }} 条</span>

        <button 
          @click="loadLinks" 
          class="p-1.5 text-zinc-400 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors" 
          title="刷新列表"
        >
          <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" />
        </button>

        <button 
          @click="openCreateDialog" 
          class="bg-zinc-900 text-white px-3.5 py-1.5 rounded-xl hover:bg-zinc-800 active:scale-95 transition-all text-xs font-medium flex items-center gap-1.5 shadow-sm shadow-zinc-900/10"
        >
          <Plus class="w-3.5 h-3.5" /> 创建短链
        </button>
      </div>
    </div>

    <!-- Data Table Container -->
    <div class="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
      <!-- Loading State -->
      <div v-if="loading && links.length === 0" class="py-24 flex flex-col items-center justify-center text-zinc-400 gap-2">
        <RefreshCw class="w-6 h-6 animate-spin text-zinc-400" />
        <span class="text-xs font-serif italic">路由载入中...</span>
      </div>

      <!-- Empty State -->
      <div v-else-if="links.length === 0" class="py-20 text-center">
        <Link2 class="w-10 h-10 text-zinc-300 mx-auto mb-3" />
        <h3 class="font-serif text-lg text-zinc-800 mb-1">未找到匹配的短链路由</h3>
        <p class="text-zinc-400 text-xs mb-4">可尝试更换搜索关键词或切换状态筛选条件。</p>
        <button 
          v-if="statusFilter !== 'all' || searchKeyword" 
          @click="statusFilter = 'all'; searchKeyword = ''; handleSearch()" 
          class="text-xs font-medium text-zinc-900 underline underline-offset-4 hover:opacity-75 transition-opacity"
        >
          查看全部短链
        </button>
      </div>

      <!-- Table View -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse whitespace-nowrap">
          <thead class="bg-zinc-50/80 border-b border-zinc-200/60 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            <tr>
              <th class="py-3 px-4">短链路径</th>
              <th class="py-3 px-4">备注与目标网址</th>
              <th class="py-3 px-4 text-center">状态</th>
              <th class="py-3 px-4 text-center">访问统计</th>
              <th class="py-3 px-4">有效期</th>
              <th class="py-3 px-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100 text-xs">
            <tr 
              v-for="l in links" 
              :key="l.id" 
              class="hover:bg-zinc-50/70 transition-colors group"
            >
              <!-- 短链路径 -->
              <td class="py-3 px-4">
                <div class="inline-flex items-center gap-1.5">
                  <span class="bg-zinc-900 text-white font-mono font-semibold text-xs px-2.5 py-1 rounded-lg shadow-xs">
                    /s/{{ l.code }}
                  </span>
                  <a 
                    :href="shortUrl(l)" 
                    target="_blank" 
                    class="p-1 text-zinc-400 hover:text-zinc-900 rounded transition-colors" 
                    title="在浏览器中测试跳转"
                  >
                    <ExternalLink class="w-3.5 h-3.5" />
                  </a>
                </div>
              </td>

              <!-- 备注与目标网址 -->
              <td class="py-3 px-4">
                <div class="flex flex-col gap-0.5">
                  <span class="font-medium text-zinc-900 text-sm truncate max-w-sm" :title="l.remark">
                    {{ l.remark || '未命名短链' }}
                  </span>
                  <a 
                    :href="l.targetUrl" 
                    target="_blank" 
                    class="text-zinc-400 hover:text-zinc-700 transition-colors font-mono text-[11px] truncate max-w-md"
                    :title="l.targetUrl"
                  >
                    {{ l.targetUrl }}
                  </a>
                </div>
              </td>

              <!-- 状态 -->
              <td class="py-3 px-4 text-center">
                <span 
                  class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border"
                  :class="getStatusBadgeClass(l)"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="getStatusDotClass(l)"></span>
                  {{ linkStatusText(l) }}
                </span>
              </td>

              <!-- 访问量 -->
              <td class="py-3 px-4 text-center">
                <button 
                  @click="showStats(l)" 
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-zinc-100/80 transition-colors text-zinc-800 group/stat"
                  title="点击查看访问趋势图表"
                >
                  <BarChart3 class="w-3.5 h-3.5 text-zinc-400 group-hover/stat:text-zinc-700" />
                  <span class="font-mono font-semibold text-xs">{{ l.visitCount || 0 }}</span>
                  <span class="text-[10px] text-zinc-400 font-sans">次</span>
                </button>
              </td>

              <!-- 有效期 -->
              <td class="py-3 px-4 font-mono text-zinc-500 text-xs">
                {{ formatDateTime(l.expiresAt) }}
              </td>

              <!-- 操作 -->
              <td class="py-3 px-4 text-right">
                <div class="inline-flex items-center gap-1">
                  <!-- 二维码 -->
                  <button 
                    @click="openQrModal(l)" 
                    class="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                    title="生成二维码"
                  >
                    <QrCodeIcon class="w-3.5 h-3.5" />
                  </button>

                  <!-- 复制短链完整地址 -->
                  <button 
                    @click="copyText(shortUrl(l), '短链地址已复制', l.id)" 
                    class="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                    title="复制完整短链"
                  >
                    <Check v-if="copiedId === l.id" class="w-3.5 h-3.5 text-emerald-500" />
                    <Copy v-else class="w-3.5 h-3.5" />
                  </button>

                  <!-- 查看统计 -->
                  <button 
                    @click="showStats(l)" 
                    class="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                    title="访问统计详情"
                  >
                    <BarChart3 class="w-3.5 h-3.5" />
                  </button>

                  <!-- 删除 -->
                  <button 
                    @click="deleteLink(l)" 
                    class="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="删除该短链"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Compact Pagination Footer -->
      <div v-if="linkTotal > pageSize" class="px-4 py-3 flex items-center justify-between bg-zinc-50/60 border-t border-zinc-100">
        <span class="text-xs text-zinc-400 font-mono">
          显示 {{ (linkPage - 1) * pageSize + 1 }} - {{ Math.min(linkPage * pageSize, linkTotal) }} / 共 {{ linkTotal }} 条
        </span>
        <Pagination v-model="linkPage" :total="linkTotal" :page-size="pageSize" @change="loadLinks" />
      </div>
    </div>

    <!-- Create Modal -->
    <Modal v-model:visible="dialogVisible" title="创建新短链">
      <div class="space-y-4 mt-3">
        <div>
          <label class="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">目标长网址 *</label>
          <input 
            v-model="linkTarget" 
            type="text" 
            class="w-full bg-zinc-50 border border-zinc-200/80 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all font-mono" 
            placeholder="https://example.com/very/long/url" 
          />
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">自定义短码 (可选)</label>
            <div class="flex gap-1.5">
              <input 
                v-model="linkCode" 
                type="text" 
                class="flex-1 bg-zinc-50 border border-zinc-200/80 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all font-mono" 
                placeholder="留空随机" 
              />
              <button 
                @click="generateRandomCode" 
                class="px-3 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors text-zinc-600 shrink-0" 
                title="随机生成短码"
              >
                <RefreshCw class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div>
            <label class="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">有效期</label>
            <Select 
              v-model="linkValidDays" 
              :options="validDaysOptions" 
            />
          </div>
        </div>
        <div>
          <label class="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">内部备注 (可选)</label>
          <input 
            v-model="linkRemark" 
            type="text" 
            class="w-full bg-zinc-50 border border-zinc-200/80 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all" 
            placeholder="例如：技术博客推广入口" 
          />
        </div>
        <button 
          @click="createLink" 
          :disabled="submitting" 
          class="w-full mt-2 bg-zinc-900 text-white rounded-xl py-3 text-sm font-semibold hover:bg-zinc-800 active:scale-[0.99] transition-all disabled:opacity-50"
        >
          {{ submitting ? '创建中...' : '确认创建' }}
        </button>
      </div>
    </Modal>

    <!-- Stats Modal -->
    <Modal v-model:visible="statsVisible" title="访问统计">
      <div v-if="statsLoading" class="py-10 flex justify-center">
        <RefreshCw class="w-6 h-6 animate-spin text-zinc-300" />
      </div>
      <div v-else class="mt-4">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-900">
            <BarChart3 class="w-6 h-6" />
          </div>
          <div>
            <p class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">总访问量</p>
            <p class="text-3xl font-serif text-zinc-900">{{ statsTotal }}</p>
          </div>
        </div>
        <div>
          <p class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">近期活动趋势 (最近 7 天)</p>
          <div v-if="statsDaily.length > 0" class="space-y-2.5">
            <div v-for="(day, i) in statsDaily.slice().reverse()" :key="i" class="flex items-center gap-3">
              <span class="text-xs font-mono text-zinc-500 w-12">{{ day.visitDate?.slice(5) || '-' }}</span>
              <div class="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
                <div 
                  class="h-full bg-zinc-800 rounded-full transition-all duration-500" 
                  :style="{ width: `${Math.max(3, (day.visits / Math.max(...statsDaily.map(d=>d.visits), 1)) * 100)}%` }"
                ></div>
              </div>
              <span class="text-xs font-mono font-medium w-8 text-right">{{ day.visits }}</span>
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
const pageSize = 15; // Increased page size for high density
const loading = ref(false);

const searchKeyword = ref('');
const statusFilter = ref('active'); // 默认仅查可用：启用且未过期

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

const getStatusBadgeClass = l => {
  if (l.status !== 1) return 'bg-zinc-100 text-zinc-600 border-zinc-200';
  if (isExpired(l)) return 'bg-rose-50 text-rose-600 border-rose-200/60';
  return 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
};

const getStatusDotClass = l => {
  if (l.status !== 1) return 'bg-zinc-400';
  if (isExpired(l)) return 'bg-rose-500';
  return 'bg-emerald-500';
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
    await showConfirm('删除路由', '确认删除该短链路由？该操作将导致该短链失效。', { confirmText: '删除' });
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

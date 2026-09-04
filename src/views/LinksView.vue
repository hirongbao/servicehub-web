<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between mb-10">
      <div>
        <h2 class="text-3xl font-serif text-zinc-900 tracking-tight mb-2">Routing</h2>
        <p class="text-sm text-zinc-500 font-light">管理短链重定向规则并实时跟踪流量数据。</p>
      </div>
      <button @click="openCreateDialog" class="bg-zinc-900 text-white px-6 py-3 rounded-full hover:bg-zinc-800 active:scale-95 transition-all shadow-xl shadow-zinc-900/20 flex items-center gap-2 font-medium text-xs tracking-widest uppercase">
        <Plus class="w-4 h-4" /> Create Link
      </button>
    </div>

    <div v-if="loading" class="py-20 flex justify-center">
      <RefreshCw class="w-8 h-8 animate-spin text-zinc-300" />
    </div>

    <div v-else-if="links.length > 0">
      <div class="bg-white rounded-[2.5rem] shadow-xl shadow-zinc-200/40 border border-zinc-100 overflow-hidden">
        
        <div v-for="(l, idx) in links" :key="l.id" class="p-8 md:p-10 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-8 group relative" :class="{'border-b border-zinc-100': idx !== links.length - 1}">
          <!-- Hover highlight background -->
          <div class="absolute inset-0 bg-gradient-to-r from-zinc-50/50 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300"></div>

          <!-- Left: Info -->
          <div class="relative z-10 flex-1 min-w-0">
             <div class="flex items-center gap-4 mb-4 flex-wrap">
               <span class="px-4 py-1.5 bg-zinc-900 text-white text-sm font-mono font-bold rounded-full shadow-md shadow-zinc-900/10 tracking-wide">/s/{{ l.code }}</span>
               <span class="text-xs font-mono text-zinc-400">{{ formatDateTime(l.createdAt) }}</span>
               <span v-if="l.status !== 1 || linkExpired(l)" class="px-2.5 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded-full uppercase tracking-widest border border-red-100">Expired</span>
             </div>
             <h3 class="text-3xl font-serif text-zinc-900 mb-3 truncate group-hover:text-zinc-700 transition-colors">{{ l.remark || '未命名路由' }}</h3>
             <a :href="l.targetUrl" target="_blank" class="text-zinc-400 hover:text-zinc-900 transition-colors truncate max-w-2xl text-sm font-mono flex items-center gap-2 w-fit group/url">
               <ExternalLink class="w-4 h-4 opacity-0 -ml-6 group-hover/url:opacity-100 group-hover/url:ml-0 transition-all duration-300" />
               <span class="truncate border-b border-transparent group-hover/url:border-zinc-300 pb-0.5">{{ l.targetUrl }}</span>
             </a>
          </div>

          <!-- Right: Stats & Actions -->
          <div class="relative z-10 flex flex-wrap items-center gap-10 md:gap-16 shrink-0 pt-6 md:pt-0 border-t md:border-t-0 border-zinc-100">
             <!-- Stats Block -->
             <div class="text-left md:text-right cursor-pointer group/stat" @click="showStats(l)">
               <p class="text-5xl font-serif text-zinc-900 group-hover/stat:text-zinc-600 transition-colors tracking-tighter">{{ l.visitCount || 0 }}</p>
               <div class="flex items-center justify-start md:justify-end gap-1.5 mt-2">
                 <div class="w-1.5 h-1.5 rounded-full bg-zinc-800 opacity-0 group-hover/stat:opacity-100 transition-opacity"></div>
                 <p class="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.3em]">Total Visits</p>
               </div>
             </div>
             
             <!-- Actions -->
             <div class="flex items-center gap-3">
               <button @click="openQrModal(l)" class="w-12 h-12 rounded-full bg-white hover:bg-zinc-900 text-zinc-400 hover:text-white flex items-center justify-center transition-all border border-zinc-200 hover:border-zinc-900 shadow-sm hover:shadow-xl hover:-translate-y-1" title="生成二维码">
                 <QrCodeIcon class="w-5 h-5" />
               </button>
               <button @click="copyText(shortUrl(l), '短链已复制', l.id)" class="w-12 h-12 rounded-full bg-white hover:bg-zinc-900 text-zinc-400 hover:text-white flex items-center justify-center transition-all border border-zinc-200 hover:border-zinc-900 shadow-sm hover:shadow-xl hover:-translate-y-1" title="复制短链">
                 <Check v-if="copiedId === l.id" class="w-5 h-5 text-emerald-400" />
                 <Copy v-else class="w-5 h-5" />
               </button>
               <button @click="deleteLink(l)" class="w-12 h-12 rounded-full bg-white hover:bg-red-600 text-zinc-400 hover:text-white flex items-center justify-center transition-all border border-zinc-200 hover:border-red-600 shadow-sm hover:shadow-xl hover:-translate-y-1" title="删除路由">
                 <Trash2 class="w-5 h-5" />
               </button>
             </div>
          </div>
        </div>
        
        <!-- Pagination -->
        <div v-if="linkTotal > 0" class="px-8 py-8 flex justify-center bg-zinc-50 border-t border-zinc-100">
          <Pagination v-model="linkPage" :total="linkTotal" :page-size="pageSize" @change="loadLinks" />
        </div>
      </div>
    </div>
    
    <div v-else class="py-32 text-center bg-white rounded-[3rem] border border-dashed border-zinc-200 shadow-sm">
      <Link2 class="w-16 h-16 text-zinc-200 mx-auto mb-6" />
      <h3 class="font-serif text-3xl text-zinc-800 mb-2">暂无路由</h3>
      <p class="text-zinc-400 text-sm">创建一个新的短链路由，连接世界。</p>
    </div>

    <!-- Create Modal -->
    <Modal v-model:visible="dialogVisible" title="新建短链路由">
      <div class="space-y-6 mt-4">
        <div>
          <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2.5">目标链接 (长链接)</label>
          <input v-model="linkTarget" type="url" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-mono" placeholder="https://" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2.5">自定义短码 (可选)</label>
            <div class="flex gap-2">
              <input v-model="linkCode" type="text" class="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-mono" placeholder="留空自动生成" />
              <button @click="generateRandomCode" class="px-4 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors text-zinc-500" title="随机生成">
                <RefreshCw class="w-4 h-4" />
              </button>
            </div>
          </div>
          <div>
            <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2.5">有效期</label>
            <select v-model="linkValidDays" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all">
              <option :value="0">永久有效</option>
              <option :value="1">24 小时</option>
              <option :value="7">7 天</option>
              <option :value="30">30 天</option>
            </select>
          </div>
        </div>
        <div>
          <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2.5">内部备注 (可选)</label>
          <input v-model="linkRemark" type="text" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all" placeholder="例如：推广活动A" />
        </div>
        <button @click="createLink" :disabled="submitting" class="w-full mt-4 bg-zinc-900 text-white rounded-xl py-3.5 text-sm font-bold tracking-wider hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-50">
          {{ submitting ? '创建中...' : '确认创建' }}
        </button>
      </div>
    </Modal>

    <!-- Stats Modal -->
    <Modal v-model:visible="statsVisible" title="访问统计">
      <div v-if="statsLoading" class="py-10 flex justify-center"><RefreshCw class="w-6 h-6 animate-spin text-zinc-300" /></div>
      <div v-else class="mt-4">
        <div class="flex items-center gap-4 mb-8">
          <div class="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
            <BarChart3 class="w-6 h-6" />
          </div>
          <div>
            <p class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Total Visits</p>
            <p class="text-4xl font-serif text-zinc-900">{{ statsTotal }}</p>
          </div>
        </div>
        <div>
          <p class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">Recent Activity</p>
          <div v-if="statsDaily.length > 0" class="space-y-3">
            <div v-for="(day, i) in statsDaily.slice().reverse()" :key="i" class="flex items-center gap-4">
              <span class="text-xs font-mono text-zinc-500 w-12">{{ day.visitDate?.slice(5) || '-' }}</span>
              <div class="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
                <div class="h-full bg-zinc-800 rounded-full" :style="{ width: `${Math.max(2, (day.visits / Math.max(...statsDaily.map(d=>d.visits))) * 100)}%` }"></div>
              </div>
              <span class="text-xs font-bold w-8 text-right">{{ day.visits }}</span>
            </div>
          </div>
          <p v-else class="text-xs text-zinc-500 italic">暂无近期活动记录。</p>
        </div>
      </div>
    </Modal>

    <!-- QR Code Modal -->
    <Modal v-model:visible="qrVisible" title="短链二维码" width="400px">
      <div class="flex flex-col items-center py-6">
        <div class="p-4 bg-white border border-zinc-100 shadow-md rounded-2xl mb-6">
          <img :src="qrCodeDataUrl" alt="QR Code" class="w-48 h-48" v-if="qrCodeDataUrl" />
          <div v-else class="w-48 h-48 flex items-center justify-center bg-zinc-50 text-zinc-300">
            <RefreshCw class="w-6 h-6 animate-spin" />
          </div>
        </div>
        <p class="text-sm font-mono text-zinc-500 bg-zinc-100 px-4 py-2 rounded-full">{{ activeQrCode }}</p>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Plus, RefreshCw, Link2, Copy, Trash2, Check, QrCodeIcon, BarChart3, ExternalLink } from 'lucide-vue-next';
import QRCode from 'qrcode';
import Pagination from '../components/ui/Pagination.vue';
import Modal from '../components/ui/Modal.vue';
import { request, showToast, showConfirm } from '../store';

const links = ref([]);
const linkTotal = ref(0);
const linkPage = ref(1);
const pageSize = 10;
const loading = ref(false);

const dialogVisible = ref(false);
const linkTarget = ref('');
const linkCode = ref('');
const linkRemark = ref('');
const linkValidDays = ref(0);
const submitting = ref(false);

const statsVisible = ref(false);
const statsLoading = ref(false);
const statsTotal = ref(0);
const statsDaily = ref([]);

const qrVisible = ref(false);
const qrCodeDataUrl = ref('');
const activeQrCode = ref('');
const copiedId = ref(null);

const loadLinks = async () => {
  loading.value = true;
  try {
    const res = await request(`/api/links?page=${linkPage.value}&size=${pageSize}`);
    links.value = res.list || res.records || res || [];
    linkTotal.value = res.total || links.value.length || 0;
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
    const d = await request('/api/links', {
      method: 'POST',
      body: JSON.stringify({ targetUrl: linkTarget.value.trim(), code: linkCode.value.trim() || undefined, remark: linkRemark.value.trim() || undefined, validDays: Number(linkValidDays.value) })
    });
    showToast('短链创建成功', 'success');
    dialogVisible.value = false;
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

const shortUrl = l => `${window.location.protocol}//${window.location.host}/s/${l.code}`;

const copyText = async (text, successMsg = '已复制', id = null) => {
  try {
    // 兼容 HTTP 环境的复制降级方案
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

const linkExpired = l => {
  if (!l.expiresAt) return false;
  return new Date(l.expiresAt).getTime() < Date.now();
};

const formatDateTime = d => {
  if (!d) return '-';
  const date = new Date(d);
  return `${date.getFullYear()}/${String(date.getMonth()+1).padStart(2,'0')}/${String(date.getDate()).padStart(2,'0')} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
};

onMounted(() => loadLinks());
</script>

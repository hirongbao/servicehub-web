<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between mb-8">
      <h2 class="text-xl font-serif text-zinc-900">Routing</h2>
      <button @click="openCreateDialog" class="bg-zinc-900 text-white px-5 py-2.5 rounded-full hover:bg-zinc-800 active:scale-95 transition-all shadow-xl shadow-zinc-900/15 flex items-center gap-2 font-medium text-xs tracking-wider">
        <Plus class="w-4 h-4" /> 新建路由
      </button>
    </div>

    <div v-if="loading" class="py-20 flex justify-center">
      <RefreshCw class="w-8 h-8 animate-spin text-zinc-300" />
    </div>

    <div v-else-if="links.length > 0">
      <div class="bg-white rounded-[2.5rem] lg:rounded-[3rem] shadow-xl shadow-zinc-200/40 border border-zinc-100 overflow-hidden divide-y divide-zinc-100">
        
        <div v-for="l in links" :key="l.id" class="p-8 md:p-9 hover:bg-zinc-50/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6 group">
          
          <!-- Left: Info -->
          <div class="flex-1 min-w-0">
             <div class="flex items-center gap-2.5 mb-3 flex-wrap">
               <span class="px-3 py-1 bg-zinc-900 text-white text-xs font-mono font-semibold rounded-full shadow-xs">/s/{{ l.code }}</span>
               <span v-if="l.status !== 1 || linkExpired(l)" class="px-2.5 py-0.5 border border-zinc-200 text-zinc-400 text-[10px] font-bold rounded-full uppercase tracking-wider">已失效</span>
               <span class="text-xs font-mono text-zinc-400">{{ formatDateTime(l.createdAt) }}</span>
             </div>
             <h3 class="text-2xl font-serif font-medium text-zinc-900 mb-2 truncate group-hover:text-zinc-800 transition-colors">{{ l.remark || '未命名路由' }}</h3>
             <a :href="l.targetUrl" target="_blank" class="text-zinc-400 hover:text-zinc-900 transition-colors truncate block max-w-2xl text-xs font-mono flex items-center gap-1.5 w-fit">
               <ExternalLink class="w-3.5 h-3.5 shrink-0" />
               <span class="truncate">{{ l.targetUrl }}</span>
             </a>
          </div>

          <!-- Right: Stats & Actions -->
          <div class="flex flex-wrap items-center gap-6 md:gap-8 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-zinc-100">
             <div class="text-center md:text-right cursor-pointer group/stat bg-zinc-50/80 px-4 py-2 rounded-2xl border border-zinc-100 hover:border-zinc-300 transition-all" @click="showStats(l)">
               <p class="text-3xl font-serif text-zinc-900 group-hover/stat:text-blue-600 transition-colors">{{ l.visitCount || 0 }}</p>
               <p class="text-[9px] text-zinc-400 font-bold uppercase tracking-[0.2em] mt-0.5">总访问量</p>
             </div>
             
             <div class="flex items-center gap-2">
               <button @click="openQrModal(l)" class="w-10 h-10 rounded-full bg-zinc-50 hover:bg-zinc-900 text-zinc-500 hover:text-white flex items-center justify-center transition-all border border-zinc-200/80 hover:border-zinc-900 shadow-xs" title="生成二维码">
                 <QrCodeIcon class="w-4 h-4" />
               </button>
               <button @click="copyLink(l)" class="w-10 h-10 rounded-full bg-zinc-50 hover:bg-zinc-900 text-zinc-500 hover:text-white flex items-center justify-center transition-all border border-zinc-200/80 hover:border-zinc-900 shadow-xs" title="复制短链">
                 <Check v-if="copiedId === l.id" class="w-4 h-4 text-emerald-400" />
                 <Copy v-else class="w-4 h-4" />
               </button>
               <button @click="deleteLink(l)" class="w-10 h-10 rounded-full bg-zinc-50 hover:bg-red-600 text-zinc-500 hover:text-white flex items-center justify-center transition-all border border-zinc-200/80 hover:border-red-600 shadow-xs" title="删除路由">
                 <Trash2 class="w-4 h-4" />
               </button>
             </div>
          </div>
        </div>
        
        <!-- Pagination -->
        <div v-if="linkTotal > 0" class="px-8 py-6 flex justify-center bg-zinc-50/50">
          <Pagination v-model="linkPage" :total="linkTotal" :page-size="pageSize" @change="loadLinks" />
        </div>
      </div>
    </div>
    
    <div v-else class="py-28 text-center bg-white rounded-[3rem] border border-dashed border-zinc-200 shadow-sm">
      <Link2 class="w-12 h-12 text-zinc-200 mx-auto mb-4" />
      <h3 class="font-serif text-2xl text-zinc-800">暂无路由</h3>
      <p class="text-zinc-400 text-sm mt-1.5">创建一个新的短链路由，连接世界。</p>
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
          <div class="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500">
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
              <span class="text-xs font-mono text-zinc-500 w-12">{{ day.date.slice(5) }}</span>
              <div class="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
                <div class="h-full bg-indigo-500 rounded-full" :style="{ width: `${Math.max(2, (day.count / Math.max(...statsDaily.map(d=>d.count))) * 100)}%` }"></div>
              </div>
              <span class="text-xs font-bold w-8 text-right">{{ day.count }}</span>
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

const copyLink = async l => {
  const url = `${window.location.protocol}//${window.location.host}/s/${l.code}`;
  try {
    await navigator.clipboard.writeText(url);
    copiedId.value = l.id;
    showToast('已复制到剪贴板', 'success');
    setTimeout(() => copiedId.value = null, 2000);
  } catch (e) { showToast('复制失败', 'error'); }
};

const openQrModal = async l => {
  activeQrCode.value = `${window.location.protocol}//${window.location.host}/s/${l.code}`;
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

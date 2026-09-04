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

    <div v-else-if="links.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="l in links" :key="l.id" class="bg-white rounded-[2rem] p-8 border border-zinc-100 shadow-sm shadow-zinc-200/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
        
        <div class="flex items-start justify-between mb-6">
          <div class="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg bg-indigo-50 text-indigo-600">
            <Link2 class="w-5 h-5" />
          </div>
          <button @click="openQrModal(l)" class="w-8 h-8 rounded-full bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center text-zinc-400 transition-colors">
            <QrCodeIcon class="w-3.5 h-3.5" />
          </button>
        </div>

        <div class="mb-6">
          <h3 class="text-base font-bold text-zinc-900 truncate mb-1">/s/{{ l.code }}</h3>
          <p class="text-xs text-zinc-400 font-mono truncate" :title="l.targetUrl">{{ l.targetUrl }}</p>
        </div>

        <div class="flex items-center justify-between pt-4 border-t border-zinc-100/80">
          <div class="flex items-center gap-2 text-[11px] text-zinc-400 font-medium">
            <button @click="showStats(l)" class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-50 hover:bg-zinc-100 transition-colors">
              <BarChart3 class="w-3.5 h-3.5 text-indigo-500" /> 统计
            </button>
          </div>
          <div class="flex items-center gap-2">
            <button @click="copyLink(l)" class="w-8 h-8 rounded-full flex items-center justify-center transition-all border border-zinc-200 hover:bg-zinc-100 text-zinc-500">
              <Copy class="w-3.5 h-3.5" />
            </button>
            <button @click="deleteLink(l)" class="w-8 h-8 rounded-full flex items-center justify-center transition-all border border-red-200 hover:bg-red-50 text-red-500">
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="py-28 text-center bg-white rounded-[3rem] border border-dashed border-zinc-200">
      <Link2 class="w-12 h-12 text-zinc-200 mx-auto mb-4" />
      <h3 class="font-serif text-2xl text-zinc-800">暂无路由</h3>
    </div>

    <div v-if="linkTotal > 0" class="mt-8">
      <Pagination v-model="linkPage" :total="linkTotal" :page-size="pageSize" @change="loadLinks" />
    </div>

    <!-- Create Modal -->
    <Modal v-model:visible="dialogVisible" title="新建短链路由">
      <div class="space-y-6 mt-4">
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">目标链接 Target URL</label>
          <input v-model="linkTarget" type="url" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all" placeholder="https://" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">自定义短码 (可选)</label>
            <div class="flex gap-2">
              <input v-model="linkCode" type="text" class="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all" />
              <button @click="generateRandomCode" class="px-4 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors font-bold text-xs text-zinc-600">随机</button>
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">有效期 (天)</label>
            <input v-model="linkValidDays" type="number" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all" placeholder="0 = 永久" />
          </div>
        </div>
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">备注信息</label>
          <input v-model="linkRemark" type="text" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all" />
        </div>
        <button @click="createLink" :disabled="submitting" class="w-full mt-4 bg-zinc-900 text-white rounded-xl py-3.5 text-sm font-bold tracking-wider hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-50">
          {{ submitting ? '创建中...' : '立即创建' }}
        </button>
      </div>
    </Modal>

    <!-- QR Modal -->
    <Modal v-model:visible="qrDialogVisible" title="路由二维码" width="400px">
      <div class="flex flex-col items-center py-4">
        <div class="bg-white p-4 rounded-3xl shadow-xl shadow-zinc-200/50 mb-6 border border-zinc-100">
          <img :src="qrDataUrl" class="w-48 h-48 rounded-xl" />
        </div>
        <p class="font-mono text-sm font-bold text-zinc-900 mb-2">{{ qrLink ? '/s/' + qrLink.code : '' }}</p>
        <p class="text-xs text-zinc-400 text-center px-8">{{ qrLink?.targetUrl }}</p>
      </div>
    </Modal>

    <!-- Stats Modal -->
    <Modal v-model:visible="statsVisible" title="访问统计">
      <div v-if="statsLoading" class="py-20 flex justify-center"><RefreshCw class="w-6 h-6 animate-spin text-zinc-300" /></div>
      <div v-else class="space-y-8 mt-4">
        <div class="flex items-center gap-6 pb-6 border-b border-zinc-100">
          <div class="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
            <BarChart3 class="w-8 h-8" />
          </div>
          <div>
            <h4 class="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-1">Total Visits</h4>
            <span class="text-4xl font-serif text-zinc-900">{{ statsTotal }}</span>
          </div>
        </div>
        <div>
          <h4 class="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6">Recent Activity</h4>
          <div v-if="statsDaily.length" class="space-y-4">
            <div v-for="d in statsDaily" :key="d.date" class="flex items-center gap-4">
              <span class="w-20 text-xs font-mono text-zinc-500 shrink-0">{{ d.date }}</span>
              <div class="flex-1 h-3 bg-zinc-50 rounded-full overflow-hidden">
                <div class="h-full bg-indigo-500 rounded-full" :style="{ width: Math.max((d.visits / Math.max(...statsDaily.map(x=>x.visits))) * 100, 2) + '%' }"></div>
              </div>
              <span class="w-8 text-right text-xs font-bold text-zinc-900 shrink-0">{{ d.visits }}</span>
            </div>
          </div>
          <p v-else class="text-center text-sm text-zinc-400 py-8">暂无访问数据</p>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Plus, RefreshCw, Link2, Copy, Trash2, QrCode as QrCodeIcon, BarChart3 } from 'lucide-vue-next';
import QRCode from 'qrcode';
import Modal from '../components/ui/Modal.vue';
import Pagination from '../components/ui/Pagination.vue';
import { request, showToast, showConfirm } from '../store';

const links = ref([]);
const loading = ref(false);
const linkPage = ref(1);
const linkTotal = ref(0);
const pageSize = 12;

const dialogVisible = ref(false);
const submitting = ref(false);
const linkTarget = ref('');
const linkRemark = ref('');
const linkCode = ref('');
const linkValidDays = ref(0);

const qrDialogVisible = ref(false);
const qrLink = ref(null);
const qrDataUrl = ref('');

const statsVisible = ref(false);
const statsLoading = ref(false);
const statsLink = ref(null);
const statsTotal = ref(0);
const statsDaily = ref([]);

const shortUrl = l => `${location.origin}/s/${l.code}`;

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
  linkTarget.value = ''; linkRemark.value = ''; linkCode.value = ''; linkValidDays.value = 0;
  dialogVisible.value = true;
};

const generateRandomCode = () => { linkCode.value = Math.random().toString(36).substring(2, 7); };

const createLink = async () => {
  if (!linkTarget.value.trim()) return showToast('目标链接不能为空', 'warning');
  submitting.value = true;
  try {
    const d = await request('/api/links', {
      method: 'POST',
      body: JSON.stringify({ targetUrl: linkTarget.value.trim(), code: linkCode.value.trim() || undefined, remark: linkRemark.value.trim() || undefined, validDays: Number(linkValidDays.value) })
    });
    dialogVisible.value = false;
    showToast('短链创建成功', 'success');
    await loadLinks();
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    submitting.value = false;
  }
};

const deleteLink = async l => {
  try {
    await showConfirm('删除路由', '确认删除此短链路由？其访问统计数据也将被清除。', { confirmText: '删除' });
    await request(`/api/links/${l.id}`, { method: 'DELETE' });
    showToast('路由已删除', 'success');
    await loadLinks();
  } catch (e) {}
};

const copyLink = async l => {
  try {
    await navigator.clipboard.writeText(shortUrl(l));
    showToast('链接已复制', 'success');
  } catch (e) {}
};

const openQrModal = async l => {
  qrLink.value = l; qrDialogVisible.value = true;
  try { qrDataUrl.value = await QRCode.toDataURL(shortUrl(l), { width: 280, margin: 2, color: { dark: '#0A0A0A', light: '#ffffff' } }); } catch (err) {}
};

const showStats = async l => {
  statsLink.value = l; statsVisible.value = true; statsLoading.value = true;
  try {
    const s = await request(`/api/links/${l.id}/stats`);
    statsTotal.value = s.total; statsDaily.value = s.daily || [];
  } catch (e) { showToast(e.message, 'error'); } finally { statsLoading.value = false; }
};

onMounted(() => loadLinks());
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between mb-8">
      <h2 class="text-xl font-serif text-zinc-900">API Tokens</h2>
      <button @click="openCreateDialog" class="bg-zinc-900 text-white px-5 py-2.5 rounded-full hover:bg-zinc-800 active:scale-95 transition-all shadow-xl shadow-zinc-900/15 flex items-center gap-2 font-medium text-xs tracking-wider">
        <Plus class="w-4 h-4" /> 新建凭证
      </button>
    </div>

    <div v-if="loading" class="py-20 flex justify-center">
      <RefreshCw class="w-8 h-8 animate-spin text-zinc-300" />
    </div>

    <div v-else-if="tokens.length > 0" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div v-for="t in tokens" :key="t.id" class="bg-white rounded-[2rem] p-8 border border-zinc-100 shadow-sm shadow-zinc-200/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
        <div class="flex items-start justify-between mb-6">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg"
                 :class="t.status === 1 ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-400'">
              {{ t.tokenName.charAt(0).toUpperCase() }}
            </div>
            <div>
              <h3 class="text-base font-bold text-zinc-900">{{ t.tokenName }}</h3>
              <p class="text-xs text-zinc-400 font-mono mt-1">{{ t.tokenType }}</p>
            </div>
          </div>
          <span :class="['px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border', tokenStatusClass(t)]">
            {{ tokenStatus(t) }}
          </span>
        </div>

        <div class="bg-zinc-50 rounded-2xl p-4 flex items-center justify-between group/code mb-6 border border-zinc-100/50">
          <code class="text-xs text-zinc-500 font-mono break-all line-clamp-1 mr-4">
            {{ t.tokenValue }}
          </code>
          <button @click="copyToken(t.tokenValue, t.id)" class="w-8 h-8 shrink-0 flex items-center justify-center rounded-xl bg-white border border-zinc-200 text-zinc-400 hover:text-zinc-900 hover:border-zinc-300 shadow-sm transition-all active:scale-95">
            <Check v-if="copiedMap.has(t.id)" class="w-3.5 h-3.5 text-emerald-500" />
            <Copy v-else class="w-3.5 h-3.5" />
          </button>
        </div>

        <div class="flex items-center justify-between pt-4 border-t border-zinc-100/80">
          <div class="flex items-center gap-4 text-[11px] text-zinc-400 font-medium">
            <span class="flex items-center gap-1.5"><Calendar class="w-3.5 h-3.5" /> {{ formatDateTime(t.expiresAt) }} 到期</span>
            <span class="flex items-center gap-1.5"><Zap class="w-3.5 h-3.5" /> 已用 {{ t.uses }} / {{ t.maxUses > 0 ? t.maxUses : '无限制' }}</span>
          </div>
          
          <div class="flex items-center gap-2">
            <button @click="toggleToken(t)" class="w-8 h-8 rounded-full flex items-center justify-center transition-all border border-zinc-200 hover:bg-zinc-100 text-zinc-500">
              <Power class="w-3.5 h-3.5" />
            </button>
            <button @click="revokeToken(t)" class="w-8 h-8 rounded-full flex items-center justify-center transition-all border border-red-200 hover:bg-red-50 text-red-500">
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="py-28 text-center bg-white rounded-[3rem] border border-dashed border-zinc-200">
      <KeyRound class="w-12 h-12 text-zinc-200 mx-auto mb-4" />
      <h3 class="font-serif text-2xl text-zinc-800">暂无凭证</h3>
    </div>

    <div v-if="tokenTotal > 0" class="mt-8">
      <Pagination v-model="tokenPage" :total="tokenTotal" :page-size="pageSize" @change="loadTokens" />
    </div>

    <Modal v-model:visible="dialogVisible" title="发行新凭证">
      <div class="space-y-6 mt-4">
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">凭证名称</label>
          <input v-model="tokenName" type="text" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all" placeholder="例如：博客前端专用" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">有效期 (天)</label>
            <input v-model="validDays" type="number" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all" />
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">最大使用次数</label>
            <input v-model="maxUses" type="number" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all" placeholder="0 = 无限制" />
          </div>
        </div>
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">权限域 (Type)</label>
          <Select v-model="tokenType" :options="[{label: '文件总线 (FILEHUB)', value: 'FILEHUB'}, {label: '站点管理 (SITE)', value: 'SITE'}]" />
        </div>
        
        <button @click="createToken" :disabled="submitting" class="w-full mt-4 bg-zinc-900 text-white rounded-xl py-3.5 text-sm font-bold tracking-wider hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-50">
          {{ submitting ? '生成中...' : '生成凭证' }}
        </button>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Plus, RefreshCw, KeyRound, Copy, Check, Calendar, Zap, Power, Trash2 } from 'lucide-vue-next';
import Modal from '../components/ui/Modal.vue';
import Pagination from '../components/ui/Pagination.vue';
import Select from '../components/ui/Select.vue';
import { request, showToast, showConfirm } from '../store';

const tokens = ref([]);
const loading = ref(false);
const tokenPage = ref(1);
const tokenTotal = ref(0);
const pageSize = 12;
const copiedMap = ref(new Map());

const dialogVisible = ref(false);
const submitting = ref(false);
const tokenName = ref('');
const validDays = ref(30);
const maxUses = ref(0);
const tokenType = ref('FILEHUB');

const isExpired = t => t.expiresAt && new Date(t.expiresAt) <= new Date();
const tokenStatus = t => (t.status !== 1 ? '已禁用' : isExpired(t) ? '已过期' : '启用');
const tokenStatusClass = t => (t.status !== 1 ? 'bg-zinc-100 text-zinc-500 border-zinc-200' : isExpired(t) ? 'bg-red-50 text-red-500 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200');

const formatDateTime = d => {
  if (!d) return '-';
  const date = new Date(d);
  return `${date.getFullYear()}/${String(date.getMonth()+1).padStart(2,'0')}/${String(date.getDate()).padStart(2,'0')}`;
};

const loadTokens = async () => {
  loading.value = true;
  try {
    const res = await request(`/api/tokens?page=${tokenPage.value}&size=${pageSize}`);
    tokens.value = res.list || res.records || res || [];
    tokenTotal.value = res.total || tokens.value.length || 0;
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
  if (!tokenName.value.trim()) return showToast('请输入凭证名称', 'warning');
  submitting.value = true;
  try {
    await request('/api/tokens', {
      method: 'POST',
      body: JSON.stringify({ tokenName: tokenName.value.trim(), tokenType: tokenType.value, validDays: Number(validDays.value), maxUses: Number(maxUses.value) })
    });
    dialogVisible.value = false;
    showToast('凭证生成成功', 'success');
    await loadTokens();
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    submitting.value = false;
  }
};

const toggleToken = async (t) => {
  try {
    await request(`/api/tokens/${t.id}/status`, { method: 'POST', body: JSON.stringify({ status: t.status === 1 ? 0 : 1 }) });
    showToast(t.status === 1 ? '凭证已禁用' : '凭证已启用', 'success');
    await loadTokens();
  } catch (e) {
    showToast(e.message, 'error');
  }
};

const revokeToken = async (t) => {
  try {
    await showConfirm('吊销凭证', `确认吊销 "${t.tokenName}" 吗？此操作不可逆。`, { confirmText: '确认吊销' });
    await request(`/api/tokens/${t.id}`, { method: 'DELETE' });
    showToast('凭证已吊销', 'success');
    await loadTokens();
  } catch (e) {}
};

const copyToken = async (val, id) => {
  try {
    await navigator.clipboard.writeText(val);
    copiedMap.value.set(id, true);
    showToast('凭证已复制', 'success');
    setTimeout(() => copiedMap.value.delete(id), 2000);
  } catch (e) {}
};

onMounted(() => loadTokens());
</script>

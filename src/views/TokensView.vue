<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between mb-10">
      <div>
        <h2 class="text-3xl font-serif text-zinc-900 tracking-tight mb-2">API Tokens</h2>
        <p class="text-sm text-zinc-500 font-light">管理与分发用于调用 API 的安全访问凭证。</p>
      </div>
      <button @click="openCreateDialog" class="bg-zinc-900 text-white px-6 py-3 rounded-full hover:bg-zinc-800 active:scale-95 transition-all shadow-xl shadow-zinc-900/20 flex items-center gap-2 font-medium text-xs tracking-widest uppercase">
        <Plus class="w-4 h-4" /> Create Token
      </button>
    </div>

    <div v-if="loading" class="py-20 flex justify-center">
      <RefreshCw class="w-8 h-8 animate-spin text-zinc-300" />
    </div>

    <div v-else-if="tokens.length > 0">
      <div class="bg-white rounded-[2.5rem] shadow-xl shadow-zinc-200/40 border border-zinc-100 overflow-hidden">
        
        <div v-for="(t, idx) in tokens" :key="t.id" class="p-8 md:p-10 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-8 group relative" :class="{'border-b border-zinc-100': idx !== tokens.length - 1}">
          <!-- Hover highlight background -->
          <div class="absolute inset-0 bg-gradient-to-r from-zinc-50/50 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300"></div>

          <!-- Left: Info -->
          <div class="relative z-10 flex-1 min-w-0">
             <div class="flex items-center gap-4 mb-4 flex-wrap">
               <span class="px-4 py-1.5 bg-zinc-900 text-white text-sm font-mono font-bold rounded-full shadow-md shadow-zinc-900/10 tracking-wide">{{ t.tokenType }}</span>
               <span class="text-xs font-mono text-zinc-400 flex items-center gap-1.5"><Calendar class="w-3.5 h-3.5" /> {{ formatDateTime(t.expiresAt) }}</span>
               <span v-if="t.status !== 1 || isExpired(t)" class="px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-widest border" :class="t.status !== 1 ? 'bg-zinc-100 text-zinc-500 border-zinc-200' : 'bg-red-50 text-red-600 border-red-100'">
                 {{ tokenStatus(t) }}
               </span>
             </div>
             
             <h3 class="text-3xl font-serif text-zinc-900 mb-3 truncate group-hover:text-zinc-700 transition-colors">{{ t.tokenName }}</h3>
             
             <div class="flex items-center gap-3 w-fit max-w-full group/code cursor-pointer" @click="copyText(t.tokenValue, '凭证已复制', t.id)">
               <div class="bg-zinc-50 border border-zinc-200/80 rounded-xl px-4 py-2.5 text-sm font-mono text-zinc-500 truncate group-hover/code:border-zinc-400 group-hover/code:text-zinc-900 transition-colors relative overflow-hidden">
                 {{ t.tokenValue }}
                 <!-- 模糊遮罩（可选，这里用渐变遮挡尾部） -->
                 <div class="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-zinc-50 to-transparent group-hover/code:from-white transition-colors"></div>
               </div>
               <span class="text-xs font-bold uppercase tracking-widest text-zinc-900 opacity-0 group-hover/code:opacity-100 transition-opacity">Copy</span>
             </div>
          </div>

          <!-- Right: Stats & Actions -->
          <div class="relative z-10 flex flex-wrap items-center gap-10 md:gap-16 shrink-0 pt-6 md:pt-0 border-t md:border-t-0 border-zinc-100">
             <!-- Uses Stats -->
             <div class="text-left md:text-right">
               <div class="flex items-baseline justify-start md:justify-end gap-1 font-serif tracking-tighter">
                 <p class="text-5xl text-zinc-900">{{ t.uses }}</p>
                 <p class="text-3xl text-zinc-300" v-if="t.maxUses > 0">/{{ t.maxUses }}</p>
               </div>
               <div class="flex items-center justify-start md:justify-end gap-1.5 mt-2">
                 <div class="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                 <p class="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.3em]">API Uses</p>
               </div>
             </div>
             
             <!-- Actions -->
             <div class="flex items-center gap-3">
               <button @click="copyText(t.tokenValue, '凭证已复制', t.id)" class="w-12 h-12 rounded-full bg-white hover:bg-zinc-900 text-zinc-400 hover:text-white flex items-center justify-center transition-all border border-zinc-200 hover:border-zinc-900 shadow-sm hover:shadow-xl hover:-translate-y-1" title="复制凭证">
                 <Check v-if="copiedMap.has(t.id)" class="w-5 h-5 text-emerald-400" />
                 <Copy v-else class="w-5 h-5" />
               </button>
               <button @click="toggleToken(t)" class="w-12 h-12 rounded-full bg-white flex items-center justify-center transition-all border shadow-sm hover:shadow-xl hover:-translate-y-1" :class="t.status === 1 ? 'hover:bg-amber-500 text-zinc-400 hover:text-white border-zinc-200 hover:border-amber-500' : 'hover:bg-emerald-500 text-zinc-300 hover:text-white border-zinc-200 hover:border-emerald-500'" :title="t.status === 1 ? '禁用凭证' : '启用凭证'">
                 <Power class="w-5 h-5" />
               </button>
               <button @click="revokeToken(t)" class="w-12 h-12 rounded-full bg-white hover:bg-red-600 text-zinc-400 hover:text-white flex items-center justify-center transition-all border border-zinc-200 hover:border-red-600 shadow-sm hover:shadow-xl hover:-translate-y-1" title="删除凭证">
                 <Trash2 class="w-5 h-5" />
               </button>
             </div>
          </div>
        </div>
        
        <!-- Pagination -->
        <div v-if="tokenTotal > 0" class="px-8 py-8 flex justify-center bg-zinc-50 border-t border-zinc-100">
          <Pagination v-model="tokenPage" :total="tokenTotal" :page-size="pageSize" @change="loadTokens" />
        </div>
      </div>
    </div>
    
    <div v-else class="py-32 text-center bg-white rounded-[3rem] border border-dashed border-zinc-200 shadow-sm">
      <KeyRound class="w-16 h-16 text-zinc-200 mx-auto mb-6" />
      <h3 class="font-serif text-3xl text-zinc-800 mb-2">暂无凭证</h3>
      <p class="text-zinc-400 text-sm">发行新的 API 访问凭证以授权第三方调用。</p>
    </div>

    <Modal v-model:visible="dialogVisible" title="发行新凭证">
      <div class="space-y-6 mt-4">
        <div>
          <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2.5">凭证名称</label>
          <input v-model="tokenName" type="text" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-mono" placeholder="例如：博客前端专用" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2.5">有效期 (天)</label>
            <input v-model="validDays" type="number" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-mono" />
          </div>
          <div>
            <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2.5">最大使用次数</label>
            <input v-model="maxUses" type="number" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-mono" placeholder="0 = 无限制" />
          </div>
        </div>
        <div>
          <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2.5">权限域 (Type)</label>
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
import { Plus, RefreshCw, KeyRound, Copy, Check, Calendar, Power, Trash2 } from 'lucide-vue-next';
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

const formatDateTime = d => {
  if (!d) return '永久有效';
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
  if (!tokenName.value) return showToast('请输入凭证名称', 'warning');
  submitting.value = true;
  try {
    await request('/api/tokens', {
      method: 'POST',
      body: JSON.stringify({ tokenName: tokenName.value.trim(), tokenType: tokenType.value, maxUses: Number(maxUses.value), validDays: Number(validDays.value) })
    });
    showToast('凭证生成成功', 'success');
    dialogVisible.value = false;
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
    await showConfirm('吊销凭证', '确认吊销并删除该访问凭证？该操作不可逆，将导致相关 API 请求被拒绝。', { confirmText: '吊销' });
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

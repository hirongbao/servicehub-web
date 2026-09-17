<template>
  <div class="space-y-4">
    <!-- Compact Toolbar Bar (No duplicate page title) -->
    <div class="bg-white rounded-2xl border border-zinc-200/80 p-3 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <!-- Left: Search & Filters -->
      <div class="flex items-center gap-2.5 flex-1 flex-wrap">
        <!-- Search Input -->
        <div class="relative w-full sm:w-64">
          <Search class="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            v-model="searchKeyword" 
            @keyup.enter="handleSearch"
            type="text" 
            placeholder="搜索名称、Token..." 
            class="w-full bg-zinc-50 border border-zinc-200/80 rounded-xl pl-8 pr-7 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all font-mono placeholder:text-zinc-400"
          />
          <button v-if="searchKeyword" @click="searchKeyword = ''; handleSearch()" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
            <X class="w-3 h-3" />
          </button>
        </div>

        <!-- Custom Scope Dropdown (No native select) -->
        <div class="w-44">
          <Select 
            v-model="typeFilter" 
            size="sm" 
            :options="typeOptions" 
            @change="handleTypeChange" 
          />
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
            已失效/禁用
          </button>
        </div>
      </div>

      <!-- Right: Summary, Refresh & Create Action -->
      <div class="flex items-center gap-3 shrink-0 self-end lg:self-center">
        <span class="text-xs font-mono text-zinc-400">共 {{ tokenTotal }} 条</span>

        <button 
          @click="loadTokens" 
          class="p-1.5 text-zinc-400 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors" 
          title="刷新列表"
        >
          <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" />
        </button>

        <button 
          @click="openCreateDialog" 
          class="bg-zinc-900 text-white px-3.5 py-1.5 rounded-xl hover:bg-zinc-800 active:scale-95 transition-all text-xs font-medium flex items-center gap-1.5 shadow-sm shadow-zinc-900/10"
        >
          <Plus class="w-3.5 h-3.5" /> 发行凭证
        </button>
      </div>
    </div>

    <!-- Data Table Container -->
    <div class="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
      <!-- Loading State -->
      <div v-if="loading && tokens.length === 0" class="py-24 flex flex-col items-center justify-center text-zinc-400 gap-2">
        <RefreshCw class="w-6 h-6 animate-spin text-zinc-400" />
        <span class="text-xs font-serif italic">凭证载入中...</span>
      </div>

      <!-- Empty State -->
      <div v-else-if="tokens.length === 0" class="py-20 text-center">
        <KeyRound class="w-10 h-10 text-zinc-300 mx-auto mb-3" />
        <h3 class="font-serif text-lg text-zinc-800 mb-1">未找到匹配的访问凭证</h3>
        <p class="text-zinc-400 text-xs mb-4">可尝试更换搜索关键词或切换权限域/状态筛选条件。</p>
        <button 
          v-if="statusFilter !== 'all' || typeFilter !== 'ALL' || searchKeyword" 
          @click="statusFilter = 'all'; typeFilter = 'ALL'; searchKeyword = ''; handleSearch()" 
          class="text-xs font-medium text-zinc-900 underline underline-offset-4 hover:opacity-75 transition-opacity"
        >
          查看全部凭证
        </button>
      </div>

      <!-- Table View -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse whitespace-nowrap">
          <thead class="bg-zinc-50/80 border-b border-zinc-200/60 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            <tr>
              <th class="py-3 px-4">凭证名称</th>
              <th class="py-3 px-4">权限域</th>
              <th class="py-3 px-4">访问密钥 (Token)</th>
              <th class="py-3 px-4 text-center">状态</th>
              <th class="py-3 px-4 text-center">调用量</th>
              <th class="py-3 px-4">有效期</th>
              <th class="py-3 px-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100 text-xs">
            <tr 
              v-for="t in tokens" 
              :key="t.id" 
              class="hover:bg-zinc-50/70 transition-colors group"
            >
              <!-- 凭证名称 -->
              <td class="py-3 px-4">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-zinc-900 text-sm truncate max-w-[200px]" :title="t.tokenName">
                    {{ t.tokenName }}
                  </span>
                </div>
              </td>

              <!-- 权限域 -->
              <td class="py-3 px-4">
                <span 
                  :class="getTypeBadgeClass(t.tokenType)" 
                  class="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold border inline-block"
                >
                  {{ t.tokenType }}
                </span>
              </td>

              <!-- 密钥 Token -->
              <td class="py-3 px-4">
                <div 
                  @click="copyText(t.tokenValue, 'Token 密钥已复制', t.id)"
                  class="inline-flex items-center gap-1.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 rounded-lg px-2.5 py-1 transition-colors cursor-pointer group/token"
                  title="点击复制完整 Token"
                >
                  <span class="font-mono text-zinc-600 text-xs">{{ maskToken(t.tokenValue) }}</span>
                  <Check v-if="copiedMap.has(t.id)" class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <Copy v-else class="w-3.5 h-3.5 text-zinc-400 group-hover/token:text-zinc-700 shrink-0" />
                </div>
              </td>

              <!-- 状态 -->
              <td class="py-3 px-4 text-center">
                <span 
                  class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border"
                  :class="getStatusBadgeClass(t)"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="getStatusDotClass(t)"></span>
                  {{ tokenStatus(t) }}
                </span>
              </td>

              <!-- 调用量 -->
              <td class="py-3 px-4 text-center">
                <div class="inline-flex flex-col items-center">
                  <span class="font-mono font-semibold text-zinc-900 text-xs">
                    {{ t.usage_count ?? t.usageCount ?? 0 }}
                    <span v-if="t.maxUses > 0" class="text-zinc-400 font-normal"> / {{ t.maxUses }}</span>
                  </span>
                  <span v-if="t.maxUses === 0" class="text-[10px] text-zinc-400 font-sans">不限次</span>
                  <div v-else class="w-14 bg-zinc-100 rounded-full h-1 mt-1 overflow-hidden">
                    <div 
                      class="bg-zinc-800 h-full rounded-full" 
                      :style="{ width: `${Math.min(100, (((t.usage_count ?? t.usageCount ?? 0) / t.maxUses) * 100))}%` }"
                    ></div>
                  </div>
                </div>
              </td>

              <!-- 有效期 -->
              <td class="py-3 px-4 font-mono text-zinc-500 text-xs">
                {{ formatDateTime(t.expiresAt) }}
              </td>

              <!-- 操作 -->
              <td class="py-3 px-4 text-right">
                <div class="inline-flex items-center gap-1">
                  <!-- 复制完整密钥 -->
                  <button 
                    @click="copyText(t.tokenValue, 'Token 密钥已复制', t.id)" 
                    class="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                    title="复制完整 Token"
                  >
                    <Check v-if="copiedMap.has(t.id)" class="w-3.5 h-3.5 text-emerald-500" />
                    <Copy v-else class="w-3.5 h-3.5" />
                  </button>

                  <!-- 切换状态 (启用/禁用) -->
                  <button 
                    @click="toggleToken(t)" 
                    :title="t.status === 1 ? '禁用此凭证' : '启用此凭证'"
                    class="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                  >
                    <Power class="w-3.5 h-3.5" :class="t.status === 1 ? 'text-emerald-600' : 'text-zinc-400'" />
                  </button>

                  <!-- 吊销/删除 -->
                  <button 
                    @click="revokeToken(t)" 
                    class="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="吊销并删除凭证"
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
      <div v-if="tokenTotal > pageSize" class="px-4 py-3 flex items-center justify-between bg-zinc-50/60 border-t border-zinc-100">
        <span class="text-xs text-zinc-400 font-mono">
          显示 {{ (tokenPage - 1) * pageSize + 1 }} - {{ Math.min(tokenPage * pageSize, tokenTotal) }} / 共 {{ tokenTotal }} 条
        </span>
        <Pagination v-model="tokenPage" :total="tokenTotal" :page-size="pageSize" @change="loadTokens" />
      </div>
    </div>

    <!-- Create Modal -->
    <Modal v-model:visible="dialogVisible" title="发行新凭证">
      <div class="space-y-5 mt-3">
        <div>
          <label class="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">凭证名称</label>
          <input 
            v-model="tokenName" 
            type="text" 
            class="w-full bg-zinc-50 border border-zinc-200/80 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all font-mono" 
            placeholder="例如：外部同步 Agent 专用" 
          />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">有效期 (天)</label>
            <input 
              v-model="validDays" 
              type="number" 
              class="w-full bg-zinc-50 border border-zinc-200/80 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all font-mono" 
            />
          </div>
          <div>
            <label class="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">最大调用次数</label>
            <input 
              v-model="maxUses" 
              type="number" 
              class="w-full bg-zinc-50 border border-zinc-200/80 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all font-mono" 
              placeholder="0 = 无限制" 
            />
          </div>
        </div>
        <div>
          <label class="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">权限域 (Type)</label>
          <Select 
            v-model="tokenType" 
            :options="createTypeOptions" 
          />
        </div>
        
        <button 
          @click="createToken" 
          :disabled="submitting" 
          class="w-full mt-2 bg-zinc-900 text-white rounded-xl py-3 text-sm font-semibold hover:bg-zinc-800 active:scale-[0.99] transition-all disabled:opacity-50"
        >
          {{ submitting ? '生成中...' : '确认发行' }}
        </button>
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
const pageSize = 15; // Increased page size for dense view
const copiedMap = ref(new Map());

const searchKeyword = ref('');
const statusFilter = ref('active'); // 默认仅查可用：启用且未过期
const typeFilter = ref('ALL');

const typeOptions = [
  { label: '全部权限域', value: 'ALL' },
  { label: '文件总线 (FILEHUB)', value: 'FILEHUB' },
  { label: '短链服务 (LINKHUB)', value: 'LINKHUB' },
  { label: '动态发布 (HIRONGBAOHUB)', value: 'HIRONGBAOHUB' }
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

const getStatusBadgeClass = t => {
  if (t.status !== 1) return 'bg-zinc-100 text-zinc-600 border-zinc-200';
  if (isExpired(t)) return 'bg-rose-50 text-rose-600 border-rose-200/60';
  return 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
};

const getStatusDotClass = t => {
  if (t.status !== 1) return 'bg-zinc-400';
  if (isExpired(t)) return 'bg-rose-500';
  return 'bg-emerald-500';
};

const getTypeBadgeClass = type => {
  switch (type) {
    case 'FILEHUB':
      return 'bg-blue-50 text-blue-700 border-blue-200/60';
    case 'LINKHUB':
      return 'bg-purple-50 text-purple-700 border-purple-200/60';
    case 'HIRONGBAOHUB':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
    default:
      return 'bg-zinc-100 text-zinc-700 border-zinc-200';
  }
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

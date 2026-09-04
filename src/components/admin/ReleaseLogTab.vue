<template>
  <div>
    <div class="flex items-center justify-between mb-8">
      <h3 class="text-xl font-serif text-zinc-900">更新日志</h3>
      <button @click="openDialog()" class="bg-zinc-900 text-white px-6 py-2.5 rounded-full hover:bg-zinc-800 active:scale-95 transition-all shadow-xl shadow-zinc-900/15 flex items-center gap-2 font-medium text-xs tracking-wider">
        <Plus class="w-4 h-4" /> 发布更新
      </button>
    </div>

    <div v-if="loading" class="py-20 flex justify-center">
      <RefreshCw class="w-8 h-8 animate-spin text-zinc-300" />
    </div>

    <div v-else-if="releases.length > 0" class="space-y-6">
      <div v-for="r in releases" :key="r.id" class="bg-white rounded-[2rem] p-8 border border-zinc-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <h4 class="text-xl font-serif text-zinc-900">{{ r.title }}</h4>
            <span v-if="r.version" class="px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded-full text-[10px] font-bold tracking-widest font-mono">{{ r.version }}</span>
            <span v-if="r.status !== 1" class="px-2 py-0.5 bg-red-50 text-red-500 rounded-full text-[10px] font-bold border border-red-100">已下架</span>
          </div>
          <div class="flex items-center gap-2">
            <button @click="openDialog(r)" class="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-50 hover:bg-zinc-100 text-zinc-500 transition-colors"><Pencil class="w-3.5 h-3.5" /></button>
            <button @click="toggleStatus(r)" class="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-50 hover:bg-zinc-100 text-zinc-500 transition-colors">
              <Power v-if="r.status === 1" class="w-3.5 h-3.5" />
              <Check v-else class="w-3.5 h-3.5 text-emerald-500" />
            </button>
            <button @click="deleteRelease(r)" class="w-8 h-8 rounded-full flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-500 transition-colors"><Trash2 class="w-3.5 h-3.5" /></button>
          </div>
        </div>
        <p v-if="r.summary" class="text-sm text-zinc-500 italic mb-4">“{{ r.summary }}”</p>
        <p class="text-[10px] text-zinc-400 font-mono">{{ formatDateTime(r.publishedAt) }}</p>
      </div>
    </div>

    <div v-else class="py-28 text-center bg-white rounded-[3rem] border border-dashed border-zinc-200">
      <BookOpen class="w-12 h-12 text-zinc-200 mx-auto mb-4" />
      <h3 class="font-serif text-2xl text-zinc-800">暂无更新日志</h3>
    </div>

    <Modal v-model:visible="dialogVisible" :title="editing ? '编辑更新日志' : '发布更新日志'" width="720px">
      <div class="space-y-6 mt-4">
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">更新标题</label>
          <input v-model="form.title" type="text" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all" placeholder="例如：重大架构升级" />
        </div>
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">版本号 (可选)</label>
          <input v-model="form.version" type="text" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all" placeholder="例如：v1.2.0" />
        </div>
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">更新摘要 (一句话简介)</label>
          <input v-model="form.summary" type="text" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all" />
        </div>
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">详细内容 (支持换行和标签如 [新增])</label>
          <textarea v-model="form.content" rows="6" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all resize-none"></textarea>
        </div>
        <button @click="submit" :disabled="submitting" class="w-full mt-4 bg-zinc-900 text-white rounded-xl py-3.5 text-sm font-bold tracking-wider hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-50">
          {{ submitting ? '保存中...' : '确认保存' }}
        </button>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Plus, RefreshCw, Pencil, Power, Check, Trash2, BookOpen } from 'lucide-vue-next';
import Modal from '../ui/Modal.vue';
import { request, showToast, showConfirm } from '../../store';

const releases = ref([]);
const loading = ref(false);

const dialogVisible = ref(false);
const submitting = ref(false);
const editing = ref(null);
const form = ref({ title: '', version: '', summary: '', content: '' });

const formatDateTime = d => {
  if (!d) return '-';
  const date = new Date(d);
  return `${date.getFullYear()}/${String(date.getMonth()+1).padStart(2,'0')}/${String(date.getDate()).padStart(2,'0')}`;
};

const loadReleases = async () => {
  loading.value = true;
  try {
    const d = await request('/api/site/releases');
    releases.value = d || [];
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    loading.value = false;
  }
};

const openDialog = (r = null) => {
  editing.value = r;
  if (r) {
    form.value = { title: r.title, version: r.version || '', summary: r.summary || '', content: r.content || '' };
  } else {
    form.value = { title: '', version: '', summary: '', content: '' };
  }
  dialogVisible.value = true;
};

const submit = async () => {
  if (!form.value.title.trim()) return showToast('标题不能为空', 'warning');
  submitting.value = true;
  try {
    if (editing.value) {
      await request(`/api/site/releases/${editing.value.id}`, { method: 'POST', body: JSON.stringify(form.value) });
    } else {
      await request('/api/site/releases', { method: 'POST', body: JSON.stringify(form.value) });
    }
    showToast(editing.value ? '已更新' : '已发布', 'success');
    dialogVisible.value = false;
    await loadReleases();
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    submitting.value = false;
  }
};

const toggleStatus = async (r) => {
  try {
    await request(`/api/site/releases/${r.id}/status`, { method: 'POST', body: JSON.stringify({ status: r.status === 1 ? 0 : 1 }) });
    showToast(r.status === 1 ? '已下架' : '已重新上架', 'success');
    await loadReleases();
  } catch (e) { showToast(e.message, 'error'); }
};

const deleteRelease = async (r) => {
  try {
    await showConfirm('删除更新日志', '确认删除这条记录？不可恢复。', { confirmText: '删除' });
    await request(`/api/site/releases/${r.id}`, { method: 'DELETE' });
    showToast('已删除', 'success');
    await loadReleases();
  } catch (e) {}
};

onMounted(() => loadReleases());
</script>

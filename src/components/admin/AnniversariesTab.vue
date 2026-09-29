<template>
  <div>
    <div v-if="loading" class="py-20 flex justify-center"><RefreshCw class="w-8 h-8 animate-spin text-zinc-300" /></div>
    <div v-else-if="items.length === 0" class="py-32 flex flex-col items-center justify-center text-zinc-400">
      <Calendar class="w-16 h-16 mb-4 opacity-20" />
      <h3 class="font-serif text-2xl text-zinc-800">暂无纪念日</h3>
    </div>
    
    <div v-else class="bg-white rounded-3xl border border-zinc-100 overflow-hidden shadow-sm">
      <table class="w-full text-left text-sm">
        <thead class="bg-zinc-50 border-b border-zinc-100 text-zinc-500 font-medium">
          <tr>
            <th class="px-6 py-4">类型 / 图标</th>
            <th class="px-6 py-4">标题</th>
            <th class="px-6 py-4">日期</th>
            <th class="px-6 py-4">背景图</th>
            <th class="px-6 py-4">状态</th>
            <th class="px-6 py-4 w-32">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-100">
          <tr v-for="item in items" :key="item.id" class="hover:bg-zinc-50/50 transition-colors">
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600">
                  <component :is="iconMap[item.icon || 'Calendar']" class="w-4 h-4" />
                </div>
                <div>
                  <span class="block font-medium text-zinc-900">{{ typeMap[item.type] }}</span>
                  <span class="text-[10px] text-zinc-400 font-mono">{{ item.icon }}</span>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 font-medium text-zinc-900">{{ item.title }}</td>
            <td class="px-6 py-4 font-mono text-zinc-500">{{ item.eventDate }}</td>
            <td class="px-6 py-4">
              <img v-if="item.coverUrl" :src="item.coverUrl" class="w-12 h-12 object-cover rounded-lg border border-zinc-200" />
              <span v-else class="text-zinc-400 text-xs">无</span>
            </td>
            <td class="px-6 py-4">
              <Switch :modelValue="item.isEnabled" @update:modelValue="toggleStatus(item, $event)" />
            </td>
            <td class="px-6 py-4">
              <div class="flex items-center gap-2">
                <button @click="editItem(item)" class="w-8 h-8 rounded-full hover:bg-zinc-200 text-zinc-600 flex items-center justify-center transition-colors" title="编辑">
                  <Pencil class="w-3.5 h-3.5" />
                </button>
                <button @click="deleteItem(item)" class="w-8 h-8 rounded-full hover:bg-red-50 text-red-500 flex items-center justify-center transition-colors" title="删除">
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Edit Modal -->
    <Modal v-model:visible="modalVisible" :title="form.id ? '编辑纪念日' : '新增纪念日'" width="600px">
      <div class="space-y-6">
        <div>
          <label class="block text-xs font-bold tracking-widest text-zinc-500 uppercase mb-2">标题</label>
          <input v-model="form.title" type="text" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all" placeholder="例如：下一个假期" />
        </div>
        
        <div class="grid grid-cols-2 gap-6">
          <div>
            <label class="block text-xs font-bold tracking-widest text-zinc-500 uppercase mb-2">类型</label>
            <div class="flex gap-2 p-1 bg-zinc-100 rounded-xl">
              <button v-for="(label, val) in typeMap" :key="val" @click="form.type = val" 
                :class="['flex-1 py-2 text-xs font-medium rounded-lg transition-all', form.type === val ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700']">
                {{ label }}
              </button>
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold tracking-widest text-zinc-500 uppercase mb-2">日期 (YYYY-MM-DD)</label>
            <input v-model="form.eventDate" type="text" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all" placeholder="2026-10-01" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-6">
          <div>
            <label class="block text-xs font-bold tracking-widest text-zinc-500 uppercase mb-2">图标 (Lucide)</label>
            <input v-model="form.icon" type="text" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all" placeholder="Calendar" />
            <p class="text-[10px] text-zinc-400 mt-1">可选: Heart, Briefcase, Plane, Flag, Gift, Calendar, Clock</p>
          </div>
          <div>
            <label class="block text-xs font-bold tracking-widest text-zinc-500 uppercase mb-2">背景大图 (仅倒数/正数)</label>
            <input v-model="form.coverUrl" type="text" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all" placeholder="https://..." />
          </div>
        </div>

        <div class="pt-4 flex justify-end gap-3">
          <button @click="modalVisible = false" class="px-6 py-2.5 rounded-full text-zinc-500 hover:bg-zinc-100 text-sm font-medium transition-colors">取消</button>
          <button @click="save" :disabled="saving" class="bg-zinc-900 text-white px-8 py-2.5 rounded-full hover:bg-zinc-800 active:scale-95 transition-all shadow-xl shadow-zinc-900/20 text-sm font-medium disabled:opacity-50 flex items-center gap-2">
            <RefreshCw v-if="saving" class="w-4 h-4 animate-spin" />
            保存
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { RefreshCw, Calendar, Pencil, Trash2, Heart, Briefcase, Plane, Flag, Gift, Clock } from 'lucide-vue-next';
import { request, showToast, showConfirm } from '../../store';
import Modal from '../ui/Modal.vue';
import Switch from '../ui/Switch.vue';

const iconMap = {
  Calendar, Heart, Briefcase, Plane, Flag, Gift, Clock
};

const typeMap = {
  'countdown': '倒计时',
  'countup': '正计时',
  'milestone': '里程碑'
};

const items = ref([]);
const loading = ref(false);

const loadData = async () => {
  loading.value = true;
  try {
    const data = await request('/api/admin/anniversaries');
    items.value = data || [];
  } catch (err) {
    showToast('加载失败', 'error');
  } finally {
    loading.value = false;
  }
};

onMounted(loadData);

// Editor
const modalVisible = ref(false);
const saving = ref(false);
const form = ref({
  id: '', title: '', eventDate: '', type: 'milestone', icon: '', coverUrl: '', isEnabled: true
});

const toggleStatus = async (item, val) => {
  try {
    await request('/api/admin/anniversaries', {
      method: 'POST',
      body: JSON.stringify({ ...item, isEnabled: val })
    });
    item.isEnabled = val;
    showToast(val ? '已启用' : '已禁用', 'success');
  } catch (e) {
    showToast('操作失败', 'error');
  }
};

const openEditor = (item = null) => {
  if (item) {
    form.value = { ...item };
  } else {
    form.value = { id: '', title: '', eventDate: '', type: 'milestone', icon: 'Flag', coverUrl: '', isEnabled: true };
  }
  modalVisible.value = true;
};

const editItem = (item) => openEditor(item);

const deleteItem = (item) => {
  showConfirm('删除纪念日', `确定要删除 "${item.title}" 吗？此操作不可恢复。`, async () => {
    try {
      await request(`/api/admin/anniversaries/${item.id}`, { method: 'DELETE' });
      showToast('删除成功', 'success');
      loadData();
    } catch (e) {
      showToast('删除失败', 'error');
    }
  });
};

const save = async () => {
  if (!form.value.title || !form.value.eventDate) {
    showToast('请填写标题和日期', 'error');
    return;
  }
  saving.value = true;
  try {
    await request('/api/admin/anniversaries', {
      method: 'POST',
      body: JSON.stringify(form.value)
    });
    showToast('保存成功', 'success');
    modalVisible.value = false;
    loadData();
  } catch (e) {
    showToast('保存失败', 'error');
  } finally {
    saving.value = false;
  }
};

defineExpose({ openEditor });
</script>

<template>
  <Modal v-model:visible="visible" :title="editing ? '编辑动态' : '发布动态'" width="640px">
    <div class="space-y-6 mt-4">
      <div>
        <label class="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">动态内容</label>
        <textarea v-model="form.content" rows="4" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all resize-none" placeholder="写点什么..."></textarea>
      </div>

      <div>
        <label class="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">分类 (CategoryID)</label>
        <input v-model="form.categoryId" type="text" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all" placeholder="如: notes, tech, life" />
      </div>

      <div>
        <label class="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">分类名称</label>
        <input v-model="form.categoryName" type="text" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all" placeholder="如: 随笔, 技术, 生活" />
      </div>

      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="block text-xs font-bold uppercase tracking-wider text-zinc-500">附加图片 (最多3张)</label>
          <button @click="addMedia" v-if="form.mediaUrls.length < 3" class="text-xs font-bold text-zinc-900 hover:text-zinc-600 transition-colors">+ 添加</button>
        </div>
        <div class="space-y-2">
          <div v-for="(m, i) in form.mediaUrls" :key="i" class="flex items-center gap-2">
            <input v-model="form.mediaUrls[i]" type="text" class="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all" placeholder="图片 URL" />
            <button @click="removeMedia(i)" class="w-8 h-8 rounded-full flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <button @click="submit" :disabled="submitting" class="w-full mt-4 bg-zinc-900 text-white rounded-xl py-3.5 text-sm font-bold tracking-wider hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-50">
        {{ submitting ? '保存中...' : '确认发布' }}
      </button>
    </div>
  </Modal>
</template>

<script setup>
import { ref } from 'vue';
import { X } from 'lucide-vue-next';
import Modal from '../ui/Modal.vue';
import { request, showToast } from '../../store';

const visible = ref(false);
const submitting = ref(false);
const editing = ref(null);
const form = ref({ content: '', categoryId: 'notes', categoryName: '随笔', mediaUrls: [] });

const emit = defineEmits(['success']);

const open = (p = null) => {
  editing.value = p;
  if (p) {
    form.value = {
      content: p.content || '',
      categoryId: p.categoryId || p.category?.id || 'notes',
      categoryName: p.categoryName || p.category?.name || '随笔',
      mediaUrls: p.media ? p.media.filter(m => m.mediaType === 'image').map(m => m.mediaUrl) : []
    };
  } else {
    form.value = { content: '', categoryId: 'notes', categoryName: '随笔', mediaUrls: [] };
  }
  visible.value = true;
};

const addMedia = () => form.value.mediaUrls.push('');
const removeMedia = (i) => form.value.mediaUrls.splice(i, 1);

const submit = async () => {
  const urls = form.value.mediaUrls.filter(u => u.trim());
  if (!form.value.content.trim() && !urls.length) return showToast('写点内容或添加图片', 'warning');
  
  submitting.value = true;
  try {
    const payload = {
      content: form.value.content.trim(),
      mediaType: urls.length ? 'image' : null,
      mediaUrls: urls,
      categoryId: form.value.categoryId.trim() || 'notes',
      categoryName: form.value.categoryName.trim() || '随笔'
    };
    
    if (editing.value) {
      await request(`/api/site/posts/${editing.value.id}`, { method: 'POST', body: JSON.stringify(payload) });
    } else {
      await request('/api/site/posts', { method: 'POST', body: JSON.stringify(payload) });
    }
    
    showToast(editing.value ? '已更新' : '已发布', 'success');
    visible.value = false;
    emit('success');
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    submitting.value = false;
  }
};

defineExpose({ open });
</script>

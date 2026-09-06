<template>
  <Modal v-model:visible="visible" :title="editing ? '编辑动态' : '发布新动态'" width="600px">
    <div class="mt-4 flex flex-col space-y-4">
      
      <!-- Content Area -->
      <div class="relative">
        <textarea 
          v-model="form.content" 
          rows="5" 
          class="w-full bg-zinc-50 border-none rounded-2xl px-4 py-4 text-base placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 transition-all resize-none" 
          placeholder="有什么新鲜事？"
        ></textarea>
      </div>

      <!-- Image Grid -->
      <div v-if="form.mediaUrls.length > 0" class="grid grid-cols-3 gap-2">
        <div v-for="(url, i) in form.mediaUrls" :key="i" class="relative group aspect-square rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200/50">
          <img :src="url" class="w-full h-full object-cover" />
          <button @click="removeMedia(i)" class="absolute top-2 right-2 w-7 h-7 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 backdrop-blur-md">
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="flex flex-wrap items-center justify-between pt-2 border-t border-zinc-100 gap-4">
        <div class="flex items-center gap-4">
          <!-- Image Upload Button -->
          <button @click="fileInput?.click()" :disabled="uploading" class="text-zinc-500 hover:text-zinc-900 transition-colors flex items-center justify-center p-2 rounded-full hover:bg-zinc-100 disabled:opacity-50">
            <ImageIcon class="w-5 h-5" />
          </button>
          <input ref="fileInput" type="file" hidden multiple accept="image/*" @change="handleFileUpload" />
          
          <span v-if="uploading" class="text-xs text-zinc-400 font-medium tracking-wider">上传中...</span>

          <!-- Category Selector -->
          <div class="flex items-center gap-2 flex-wrap">
            <button v-for="cat in categories" :key="cat.id" 
              @click="setCategory(cat)"
              :class="['px-3 py-1.5 rounded-full text-xs font-bold transition-all', form.categoryId === cat.id ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200']">
              {{ cat.name }}
            </button>
          </div>
        </div>

        <button @click="submit" :disabled="submitting || uploading" class="bg-zinc-900 text-white rounded-full px-6 py-2.5 text-sm font-bold tracking-wider hover:bg-zinc-800 active:scale-[0.97] transition-all disabled:opacity-50 shadow-lg shadow-zinc-900/20 whitespace-nowrap ml-auto">
          {{ submitting ? '发送中...' : '发 布' }}
        </button>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { ref } from 'vue';
import { X, Image as ImageIcon } from 'lucide-vue-next';
import Modal from '../ui/Modal.vue';
import { request, showToast } from '../../store';

const visible = ref(false);
const submitting = ref(false);
const uploading = ref(false);
const editing = ref(null);
const fileInput = ref(null);

const categories = [
  { id: 'notes', name: '随笔' },
  { id: 'food', name: '美食' },
  { id: 'scenery', name: '风景' }
];

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

const setCategory = (cat) => {
  form.value.categoryId = cat.id;
  form.value.categoryName = cat.name;
};

const removeMedia = (i) => form.value.mediaUrls.splice(i, 1);

const handleFileUpload = async (e) => {
  const files = Array.from(e.target.files || []);
  e.target.value = '';
  if (!files.length) return;
  
  uploading.value = true;
  for (const file of files) {
    try {
      const b = new FormData();
      b.append('file', file);
      // api返回结构 ApiResponse<FileRecord>，request直接返回 data 也就是 FileRecord 对象
      const fileRecord = await request('/api/files/upload', { method: 'POST', body: b });
      if (fileRecord && fileRecord.fileUrl) {
        form.value.mediaUrls.push(fileRecord.fileUrl);
      }
    } catch (err) {
      showToast(`图片 ${file.name} 上传失败`, 'error');
    }
  }
  uploading.value = false;
};

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

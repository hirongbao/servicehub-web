<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between mb-8">
      <h2 class="text-xl font-serif text-zinc-900">Media Assets</h2>
      <div class="flex items-center gap-3">
        <button @click="fileInput?.click()" :disabled="uploading" class="bg-zinc-900 text-white px-5 py-2.5 rounded-full hover:bg-zinc-800 active:scale-95 transition-all shadow-xl shadow-zinc-900/15 flex items-center gap-2 font-medium text-xs tracking-wider disabled:opacity-50">
          <Upload class="w-4 h-4" /> {{ uploading ? '上传中...' : '上传媒体' }}
        </button>
        <input ref="fileInput" hidden type="file" @change="uploadFile" />
      </div>
    </div>

    <div v-if="loading" class="py-20 flex justify-center">
      <RefreshCw class="w-8 h-8 animate-spin text-zinc-300" />
    </div>

    <div v-else-if="files.length > 0" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      <div v-for="f in files" :key="f.id" class="group relative bg-white rounded-3xl border border-zinc-100 shadow-sm shadow-zinc-200/20 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        <div class="aspect-square bg-zinc-50 relative flex items-center justify-center p-4 overflow-hidden cursor-pointer" @click="previewImage(f)">
          <div class="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors z-10"></div>
          <img v-if="isImage(f.contentType)" :src="f.fileUrl" class="max-w-full max-h-full object-contain drop-shadow-md relative z-0 transition-transform duration-500 group-hover:scale-105" loading="lazy" />
          <div v-else class="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center relative z-0">
            <span class="text-[10px] font-bold text-zinc-400">{{ f.extension || 'FILE' }}</span>
          </div>
          
          <!-- Actions overlay -->
          <div class="absolute top-3 right-3 z-20 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-1 group-hover:translate-y-0">
            <button @click.stop="copyUrl(f)" class="w-8 h-8 rounded-full bg-white/90 backdrop-blur text-zinc-600 hover:text-zinc-900 hover:bg-white flex items-center justify-center shadow-lg transition-colors" title="复制链接">
              <Copy class="w-3.5 h-3.5" />
            </button>
            <button @click.stop="deleteFile(f)" class="w-8 h-8 rounded-full bg-white/90 backdrop-blur text-red-500 hover:text-white hover:bg-red-600 flex items-center justify-center shadow-lg transition-colors" title="删除">
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div class="p-4 border-t border-zinc-100">
          <p class="text-xs font-bold text-zinc-900 truncate mb-1" :title="f.originalName">{{ f.originalName }}</p>
          <div class="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
            <span>{{ formatSize(f.fileSize) }}</span>
            <span>{{ formatDateTime(f.createdAt) }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="py-28 text-center bg-white rounded-[3rem] border border-dashed border-zinc-200">
      <ImageIcon class="w-12 h-12 text-zinc-200 mx-auto mb-4" />
      <h3 class="font-serif text-2xl text-zinc-800">暂无媒体文件</h3>
    </div>

    <div v-if="fileTotal > 0" class="mt-8">
      <Pagination v-model="filePage" :total="fileTotal" :page-size="pageSize" @change="loadFiles" />
    </div>

    <!-- Lightbox -->
    <Lightbox v-model:visible="lightboxVisible" :src="lightboxSrc" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Upload, RefreshCw, Image as ImageIcon, Copy, Trash2 } from 'lucide-vue-next';
import Pagination from '../components/ui/Pagination.vue';
import Lightbox from '../components/ui/Lightbox.vue';
import { request, showToast, showConfirm } from '../store';

const files = ref([]);
const loading = ref(false);
const filePage = ref(1);
const fileTotal = ref(0);
const pageSize = 12;

const fileInput = ref(null);
const uploading = ref(false);

const lightboxVisible = ref(false);
const lightboxSrc = ref('');

const isImage = t => t && t.startsWith('image/');
const formatSize = bytes => {
  if (bytes === 0) return '0 B';
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'], i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};
const formatDateTime = d => {
  if (!d) return '-';
  const date = new Date(d);
  return `${date.getFullYear()}/${String(date.getMonth()+1).padStart(2,'0')}/${String(date.getDate()).padStart(2,'0')}`;
};

const loadFiles = async () => {
  loading.value = true;
  try {
    const res = await request(`/api/files?page=${filePage.value}&size=${pageSize}`);
    files.value = res.list || res.records || res || [];
    fileTotal.value = res.total || files.value.length || 0;
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    loading.value = false;
  }
};

const uploadFile = async e => {
  const f = e.target.files?.[0];
  e.target.value = '';
  if (!f) return;
  const b = new FormData(); b.append('file', f);
  uploading.value = true;
  try {
    await request('/api/files/upload', { method: 'POST', body: b });
    showToast('上传成功', 'success');
    await loadFiles();
  } catch (x) { showToast(x.message, 'error'); } finally { uploading.value = false; }
};

const deleteFile = async f => {
  try {
    await showConfirm('删除文件', `确认删除文件 "${f.originalName}"？`);
    await request(`/api/files/${f.id}`, { method: 'DELETE' });
    showToast('文件已删除', 'success');
    await loadFiles();
  } catch (e) {}
};

const copyUrl = async f => {
  try {
    await navigator.clipboard.writeText(f.fileUrl);
    showToast('链接已复制', 'success');
  } catch (e) {}
};

const previewImage = (f) => {
  if (isImage(f.contentType)) {
    lightboxSrc.value = f.fileUrl;
    lightboxVisible.value = true;
  }
};

onMounted(() => loadFiles());
</script>

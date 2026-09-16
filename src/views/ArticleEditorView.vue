<template>
  <div class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <!-- Header Actions -->
    <div class="flex items-center justify-between mb-8">
      <div class="flex items-center gap-4">
        <button @click="$emit('back')" class="w-10 h-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:border-zinc-900 hover:shadow-md transition-all">
          <ArrowLeft class="w-4 h-4" />
        </button>
        <h2 class="text-xl font-serif text-zinc-900">{{ articleId ? '编辑文章' : '写新文章' }}</h2>
      </div>
      
      <div class="flex items-center gap-3">
        <span class="text-xs text-zinc-400 font-mono tracking-widest uppercase mr-4" v-if="saveTime">Saved at {{ saveTime }}</span>
        
        <label class="flex items-center gap-2 cursor-pointer mr-4">
          <input type="checkbox" v-model="form.status" :true-value="1" :false-value="0" class="sr-only peer" />
          <div class="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 relative"></div>
          <span class="text-xs font-bold text-zinc-600 tracking-wider uppercase">{{ form.status === 1 ? '已发布' : '草稿' }}</span>
        </label>

        <button @click="save" :disabled="saving" class="bg-zinc-900 text-white px-6 py-2.5 rounded-full hover:bg-zinc-800 active:scale-95 transition-all shadow-xl shadow-zinc-900/15 flex items-center gap-2 font-bold text-xs tracking-wider disabled:opacity-50">
          <Save class="w-4 h-4" /> {{ saving ? '保存中...' : '保存文章' }}
        </button>
      </div>
    </div>

    <!-- Meta Info Form -->
    <div class="bg-white rounded-[2rem] border border-zinc-100 p-8 shadow-sm space-y-6">
      <div>
        <input v-model="form.title" type="text" placeholder="在这里输入文章标题..." class="w-full text-3xl font-serif font-bold text-zinc-900 placeholder:text-zinc-300 border-none focus:ring-0 p-0 bg-transparent" />
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">摘要 (Summary)</label>
          <textarea v-model="form.summary" rows="3" placeholder="简短的文章介绍，用于卡片展示..." class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all resize-none"></textarea>
        </div>
        <div>
          <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">封面图 (Cover URL)</label>
          <div class="flex gap-3">
            <input v-model="form.coverUrl" type="text" placeholder="https://..." class="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all" />
            <button @click="coverInput?.click()" class="bg-zinc-100 text-zinc-600 px-4 rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center shrink-0">
              <Upload class="w-4 h-4" />
            </button>
            <input ref="coverInput" hidden type="file" accept="image/*" @change="uploadCover" />
          </div>
          <div v-if="form.coverUrl" class="mt-3 h-20 w-32 rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100 relative group">
            <img :src="form.coverUrl" class="w-full h-full object-cover" />
            <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button @click="form.coverUrl = ''" class="text-white bg-red-500 p-1.5 rounded-full"><Trash2 class="w-3 h-3" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Markdown Editor -->
    <div class="bg-white rounded-[2rem] border border-zinc-100 shadow-sm overflow-hidden h-[800px]">
      <MdEditor 
        v-model="form.content" 
        :theme="theme" 
        language="en-US"
        class="h-full !border-none"
        placeholder="开始使用 Markdown 创作..."
        @onUploadImg="onUploadImg"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { ArrowLeft, Save, Upload, Trash2 } from 'lucide-vue-next';
import { request, showToast } from '../store';
import { MdEditor } from 'md-editor-v3';
import 'md-editor-v3/lib/style.css';

const props = defineProps({
  articleId: {
    type: Number,
    default: null
  }
});
const emit = defineEmits(['back']);

const form = ref({
  title: '',
  summary: '',
  coverUrl: '',
  content: '',
  status: 1
});

const saving = ref(false);
const saveTime = ref('');
const coverInput = ref(null);
const theme = ref('light'); // You could bind this to a system dark mode if present

onMounted(async () => {
  if (props.articleId) {
    try {
      const res = await request(`/api/admin/articles/${props.articleId}`);
      form.value = {
        title: res.title || '',
        summary: res.summary || '',
        coverUrl: res.coverUrl || '',
        content: res.content || '',
        status: res.status !== undefined ? res.status : 1
      };
    } catch (e) {
      console.error(e);
      showToast('加载文章失败', 'error');
    }
  }
});

const save = async () => {
  if (!form.value.title.trim()) {
    showToast('请输入文章标题', 'error');
    return;
  }
  if (!form.value.content.trim()) {
    showToast('文章内容不能为空', 'error');
    return;
  }

  saving.value = true;
  try {
    const payload = { ...form.value };
    if (props.articleId) {
      payload.id = props.articleId;
    }
    const res = await request('/api/admin/articles', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    
    // If it was a new article, we could emit back or update id, but let's just go back
    showToast('文章保存成功', 'success');
    
    const now = new Date();
    saveTime.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    if (!props.articleId) {
      emit('back'); // newly created, return to list
    }
  } catch (e) {
    console.error(e);
    showToast('保存失败', 'error');
  } finally {
    saving.value = false;
  }
};

const uploadCover = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  e.target.value = '';
  
  const fd = new FormData();
  fd.append('file', file);
  fd.append('customKey', `articles/covers/${Date.now()}_${file.name}`);
  
  try {
    const res = await request('/api/files/upload', {
      method: 'POST',
      body: fd,
      headers: {} // let browser set content-type for multipart
    });
    form.value.coverUrl = res.url || res.fileUrl;
    showToast('封面上传成功', 'success');
  } catch (err) {
    console.error(err);
    showToast('封面上传失败', 'error');
  }
};

const onUploadImg = async (files, callback) => {
  const resList = await Promise.all(
    files.map(async (file) => {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('customKey', `articles/content/${Date.now()}_${file.name}`);
      try {
        const res = await request('/api/files/upload', {
          method: 'POST',
          body: fd,
          headers: {}
        });
        return res.url || res.fileUrl;
      } catch (err) {
        console.error(err);
        return null;
      }
    })
  );
  
  callback(resList.filter(url => url !== null));
};
</script>

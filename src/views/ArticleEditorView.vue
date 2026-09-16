<template>
  <div class="h-[calc(100vh-140px)] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white rounded-[2rem] border border-zinc-100 shadow-xl overflow-hidden relative">
    
    <!-- Top Navigation Bar (Sticky & Minimalist) -->
    <div class="h-16 shrink-0 bg-white border-b border-zinc-100 px-6 flex items-center justify-between z-50">
      <div class="flex items-center gap-3">
        <button @click="$emit('back')" class="w-8 h-8 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-all">
          <ArrowLeft class="w-4 h-4" />
        </button>
        <span class="text-[11px] font-bold font-mono tracking-widest text-zinc-400 uppercase">
          {{ articleId ? 'Editing Article' : 'New Article' }}
        </span>
      </div>

      <div class="flex items-center gap-5">
        <span class="text-[10px] font-mono text-zinc-400 tracking-wider hidden sm:block" v-if="saveTime">Saved at {{ saveTime }}</span>

        <div class="flex items-center gap-2">
          <span class="text-[10px] font-bold tracking-widest uppercase transition-colors" :class="form.status === 0 ? 'text-zinc-900' : 'text-zinc-400'">草稿</span>
          <button @click="form.status = form.status === 1 ? 0 : 1" class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors" :class="form.status === 1 ? 'bg-emerald-500' : 'bg-zinc-200'">
            <span class="inline-block h-3 w-3 transform rounded-full bg-white transition-transform shadow-sm" :class="form.status === 1 ? 'translate-x-5' : 'translate-x-1'"></span>
          </button>
          <span class="text-[10px] font-bold tracking-widest uppercase transition-colors" :class="form.status === 1 ? 'text-zinc-900' : 'text-zinc-400'">发布</span>
        </div>

        <button @click="save" :disabled="saving" class="bg-zinc-900 text-white px-5 py-2 rounded-full hover:bg-zinc-800 active:scale-95 transition-all flex items-center gap-2 font-bold text-xs tracking-wider disabled:opacity-50">
          <Save class="w-3.5 h-3.5" /> {{ saving ? '保存中...' : '保存' }}
        </button>
      </div>
    </div>

    <!-- Main Scrollable Area -->
    <div class="flex-1 overflow-y-auto overflow-x-hidden flex flex-col bg-white">
      
      <!-- Notion-style Header Area -->
      <div class="max-w-[900px] w-full mx-auto px-6 sm:px-12 pt-12 pb-4 flex flex-col shrink-0">
        
        <!-- Cover Image Block -->
        <div class="relative w-full h-[200px] sm:h-[280px] rounded-3xl bg-zinc-50 border border-zinc-100 mb-10 group flex items-center justify-center overflow-hidden transition-all">
          <img v-if="form.coverUrl" :src="form.coverUrl" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div v-if="form.coverUrl" class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>

          <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10" :class="{ 'opacity-100': !form.coverUrl }">
            <button @click="coverInput?.click()" class="bg-white/95 backdrop-blur-sm text-zinc-700 px-6 py-2.5 rounded-full font-bold text-xs shadow-xl hover:bg-white hover:scale-105 transition-all flex items-center gap-2">
              <Image class="w-4 h-4" /> {{ form.coverUrl ? '更换封面图' : '添加高质量封面' }}
            </button>
            <button v-if="form.coverUrl" @click.stop="form.coverUrl = ''" class="ml-3 bg-red-500/95 backdrop-blur-sm text-white w-9 h-9 rounded-full flex items-center justify-center hover:bg-red-500 hover:scale-105 transition-all shadow-xl" title="移除封面">
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
          <input ref="coverInput" hidden type="file" accept="image/*" @change="uploadCover" />
        </div>

        <!-- Title -->
        <input 
          v-model="form.title" 
          type="text" 
          placeholder="文章标题..." 
          class="w-full text-4xl sm:text-5xl font-extrabold text-zinc-900 bg-transparent border-none outline-none focus:ring-0 p-0 mb-6 placeholder:text-zinc-200 tracking-tight" 
        />

        <!-- Summary -->
        <textarea 
          v-model="form.summary" 
          rows="2" 
          placeholder="在这里添加一小段引言或摘要，用于信息流卡片展示..." 
          class="w-full text-lg sm:text-xl font-medium text-zinc-400 bg-transparent border-none outline-none focus:ring-0 p-0 mb-4 resize-none placeholder:text-zinc-200 leading-relaxed"
        ></textarea>
      </div>

      <!-- The Markdown Editor (Auto Height) -->
      <div class="max-w-[900px] w-full mx-auto px-2 sm:px-8 pb-24 flex-1 flex flex-col">
        <MdEditor 
          v-model="form.content" 
          :theme="theme" 
          language="en-US"
          placeholder="从这里开始正文..."
          class="flex-1 !border-none !bg-transparent custom-md-editor"
          @onUploadImg="onUploadImg"
          :autoDetectCode="true"
          :editorId="'my-editor'"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ArrowLeft, Save, Trash2, Image } from 'lucide-vue-next';
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
const theme = ref('light');

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
    showToast('文章正文不能为空', 'error');
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
    
    showToast('文章保存成功', 'success');
    
    const now = new Date();
    saveTime.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    if (!props.articleId) {
      emit('back'); 
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
      headers: {} 
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

<style>
/* 强制覆盖 Tailwind 的 Reset，重塑高颜值 Markdown 阅读体验 */
.custom-md-editor .md-editor-preview {
  color: #27272a !important;
  font-size: 1.05rem !important;
  line-height: 1.8 !important;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
}
.custom-md-editor .md-editor-preview h1, 
.custom-md-editor .md-editor-preview h2, 
.custom-md-editor .md-editor-preview h3, 
.custom-md-editor .md-editor-preview h4 {
  color: #18181b !important;
  border-bottom: none !important;
}
.custom-md-editor .md-editor-preview h1 {
  font-size: 2.25rem !important;
  font-weight: 800 !important;
  margin-top: 2.5rem !important;
  margin-bottom: 1.5rem !important;
  line-height: 1.2 !important;
  letter-spacing: -0.02em !important;
}
.custom-md-editor .md-editor-preview h2 {
  font-size: 1.75rem !important;
  font-weight: 700 !important;
  margin-top: 2.5rem !important;
  margin-bottom: 1.25rem !important;
  line-height: 1.3 !important;
  letter-spacing: -0.01em !important;
}
.custom-md-editor .md-editor-preview h3 {
  font-size: 1.375rem !important;
  font-weight: 600 !important;
  margin-top: 2rem !important;
  margin-bottom: 1rem !important;
}
.custom-md-editor .md-editor-preview p {
  margin-bottom: 1.25rem !important;
  color: #3f3f46 !important;
}
.custom-md-editor .md-editor-preview a {
  color: #0ea5e9 !important;
  text-decoration: none !important;
  border-bottom: 1px solid #7dd3fc !important;
  transition: all 0.2s !important;
}
.custom-md-editor .md-editor-preview a:hover {
  background-color: #e0f2fe !important;
}
.custom-md-editor .md-editor-preview ul {
  list-style-type: disc !important;
  padding-left: 1.5rem !important;
  margin-bottom: 1.5rem !important;
}
.custom-md-editor .md-editor-preview ol {
  list-style-type: decimal !important;
  padding-left: 1.5rem !important;
  margin-bottom: 1.5rem !important;
}
.custom-md-editor .md-editor-preview li {
  margin-bottom: 0.5rem !important;
}
.custom-md-editor .md-editor-preview blockquote {
  border-left: 4px solid #d4d4d8 !important;
  padding: 0.5rem 1rem !important;
  margin: 1.5rem 0 !important;
  background: #fafafa !important;
  color: #71717a !important;
  border-radius: 0 0.5rem 0.5rem 0 !important;
  font-style: italic !important;
}
.custom-md-editor .md-editor-preview img {
  border-radius: 1rem !important;
  margin: 2rem auto !important;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
  max-width: 100% !important;
  border: 1px solid #f4f4f5 !important;
}
.custom-md-editor .md-editor-preview pre {
  border-radius: 0.75rem !important;
  background-color: #18181b !important;
  padding: 1.25rem !important;
  margin: 1.5rem 0 !important;
  overflow-x: auto !important;
}
.custom-md-editor .md-editor-preview code {
  background: #f4f4f5 !important;
  color: #ef4444 !important;
  padding: 0.2rem 0.4rem !important;
  border-radius: 0.375rem !important;
  font-size: 0.875em !important;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
}
.custom-md-editor .md-editor-preview pre code {
  background: transparent !important;
  color: #e4e4e7 !important;
  padding: 0 !important;
}
/* 隐藏内部无用边框，打造极简外观 */
.custom-md-editor .md-editor-toolbar-wrapper {
  padding: 12px 16px !important;
  border-bottom: 1px solid #f4f4f5 !important;
}
.custom-md-editor .md-editor-toolbar {
  gap: 8px !important;
}
/* 覆盖编辑器默认高度，让其随外层 flex 伸展 */
.custom-md-editor {
  height: auto !important;
  min-height: 500px !important;
}
</style>

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
          <div v-else class="text-zinc-300">
            <Image class="w-12 h-12 mb-2 mx-auto opacity-50" />
            <span class="text-sm font-bold tracking-widest uppercase">无封面图</span>
          </div>
          
          <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/10 backdrop-blur-[2px] transition-all">
            <button @click="$refs.coverInput.click()" class="bg-white text-zinc-900 px-6 py-2.5 rounded-full font-bold shadow-xl shadow-black/10 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 text-sm">
              <Image class="w-4 h-4" /> {{ form.coverUrl ? '更换封面' : '添加封面' }}
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

      <!-- Vditor Editor Area (Auto Height) -->
      <div class="max-w-[900px] w-full mx-auto px-6 sm:px-12 pb-24 flex-1 flex flex-col">
        <div id="vditor" class="custom-vditor flex-1"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { ArrowLeft, Save, Trash2, Image } from 'lucide-vue-next';
import { request, showToast } from '../store';
import Vditor from 'vditor';
import 'vditor/dist/index.css';
import '../assets/typora-latex.css';

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
const vditorInstance = ref(null);

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
  
  initVditor();
});

onBeforeUnmount(() => {
  if (vditorInstance.value) {
    vditorInstance.value.destroy();
  }
});

const initVditor = () => {
  vditorInstance.value = new Vditor('vditor', {
    value: form.value.content,
    mode: 'ir', // Instant Rendering (Typora-like WYSIWYG)
    minHeight: 500,
    placeholder: '从这里开始沉浸式写作（支持 Markdown 语法与快捷键）...',
    cache: {
      enable: false,
    },
    preview: {
      hljs: {
        style: 'native',
        lineNumber: true
      }
    },
    toolbarConfig: {
      pin: true,
    },
    toolbar: [
      'headings', 'bold', 'italic', 'strike', '|',
      'quote', 'list', 'ordered-list', 'check', '|',
      'code', 'inline-code', '|',
      'link', 'upload', 'table', '|',
      'undo', 'redo', '|',
      'fullscreen', 'edit-mode'
    ],
    input(val) {
      form.value.content = val;
    },
    upload: {
      accept: 'image/*',
      multiple: true,
      async handler(files) {
        for (const file of files) {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('customKey', `articles/content/${Date.now()}_${file.name}`);
          try {
            const res = await request('/api/files/upload', {
              method: 'POST',
              body: fd,
              headers: {}
            });
            const url = res.url || res.fileUrl;
            if (url) {
              vditorInstance.value.insertValue(`\n![${file.name}](${url})\n`);
            }
          } catch (err) {
            console.error(err);
            showToast('图片上传失败', 'error');
          }
        }
        return null;
      }
    }
  });
};

const save = async () => {
  if (vditorInstance.value) {
    form.value.content = vditorInstance.value.getValue();
  }

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
</script>

<style>
/* Vditor 基础外框与工具栏样式 */
.custom-vditor.vditor {
  border: none !important;
  background: transparent !important;
}
.custom-vditor .vditor-toolbar {
  border-bottom: 1px solid #f4f4f5 !important;
  background: white !important;
  padding: 8px 16px !important;
  border-radius: 1rem 1rem 0 0 !important;
}
.custom-vditor .vditor-toolbar__item {
  color: #71717a !important;
}
.custom-vditor .vditor-toolbar__item:hover {
  background: #f4f4f5 !important;
  color: #18181b !important;
  border-radius: 6px !important;
}
.custom-vditor .vditor-content {
  background: transparent !important;
}
</style>

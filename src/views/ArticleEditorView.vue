<template>
  <div class="h-[calc(100vh-140px)] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white rounded-[2rem] border border-zinc-100 shadow-xl overflow-hidden relative">
    
    <!-- Top Navigation Bar -->
    <div class="h-16 shrink-0 bg-white border-b border-zinc-100 px-6 flex items-center justify-between z-30">
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

        <button @click="save" :disabled="saving" class="bg-zinc-900 text-white px-5 py-2 rounded-full hover:bg-zinc-800 active:scale-95 transition-all flex items-center gap-2 font-bold text-xs tracking-wider disabled:opacity-50 shadow-md shadow-zinc-900/10">
          <Save class="w-3.5 h-3.5" /> {{ saving ? '保存中...' : '保存' }}
        </button>
      </div>
    </div>

    <!-- Main Scrollable Writing Area -->
    <div class="flex-1 overflow-y-auto flex flex-col bg-white" @keydown.ctrl.s.prevent="save" @keydown.meta.s.prevent="save">
      <div class="max-w-[860px] w-full mx-auto px-6 sm:px-12 pt-10 pb-20 flex flex-col flex-1">
        
        <!-- Cover Image Block -->
        <div class="relative w-full h-[200px] sm:h-[260px] rounded-3xl bg-zinc-50 border border-zinc-100 mb-8 group flex items-center justify-center overflow-hidden transition-all">
          <img v-if="form.coverUrl" :src="form.coverUrl" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div v-else class="text-zinc-300 text-center">
            <Image class="w-10 h-10 mb-2 mx-auto opacity-40" />
            <span class="text-xs font-bold tracking-widest uppercase">点击添加封面图</span>
          </div>
          
          <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/15 backdrop-blur-[2px] transition-all gap-3">
            <button @click="$refs.coverInput.click()" class="bg-white text-zinc-900 px-5 py-2 rounded-full font-bold shadow-xl shadow-black/10 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 text-xs">
              <Image class="w-3.5 h-3.5" /> {{ form.coverUrl ? '更换封面' : '上传封面' }}
            </button>
            <button v-if="form.coverUrl" @click="form.coverUrl = ''" class="bg-white/90 text-rose-600 px-3.5 py-2 rounded-full font-bold shadow-xl hover:bg-rose-50 active:scale-95 transition-all text-xs">
              移除
            </button>
          </div>
          <input ref="coverInput" hidden type="file" accept="image/*" @change="uploadCover" />
        </div>

        <!-- Title -->
        <input 
          v-model="form.title" 
          type="text" 
          placeholder="文章标题..." 
          class="w-full text-3xl sm:text-4xl font-extrabold text-zinc-900 bg-transparent border-none outline-none focus:ring-0 p-0 mb-4 placeholder:text-zinc-300 tracking-tight" 
        />

        <!-- Summary -->
        <textarea 
          v-model="form.summary" 
          rows="2" 
          placeholder="文章摘要（选填，用于信息流卡片展示）..." 
          class="w-full text-base font-normal text-zinc-500 bg-transparent border-none outline-none focus:ring-0 p-0 mb-8 resize-none placeholder:text-zinc-300 leading-relaxed border-b border-zinc-100 pb-4"
        ></textarea>

        <!-- Markdown Plain Text Area (Zero Rendering, Distraction-free) -->
        <div class="flex-1 flex flex-col min-h-[500px] relative">
          <!-- Toolbar Hint -->
          <div class="flex items-center justify-between py-2 border-b border-zinc-100 mb-4 text-xs text-zinc-400 font-mono">
            <div class="flex items-center gap-4">
              <span>MARKDOWN SOURCE</span>
              <span class="text-zinc-300">|</span>
              <label class="hover:text-zinc-900 cursor-pointer flex items-center gap-1.5 transition-colors">
                <Image class="w-3.5 h-3.5" />
                <span>插入图片</span>
                <input type="file" accept="image/*" class="hidden" @change="handleInsertImage" />
              </label>
              <span class="hidden sm:inline text-zinc-300 text-[11px]">（支持直接粘贴截图或拖入图片）</span>
            </div>
            <div class="flex items-center gap-3">
              <span>{{ charCount }} 字</span>
              <span>{{ lineCount }} 行</span>
            </div>
          </div>

          <!-- The Textarea -->
          <textarea
            ref="contentArea"
            v-model="form.content"
            placeholder="在此直接撰写或粘贴 Markdown 正文内容...&#10;&#10;支持标题、段落、代码块、数学公式等 Markdown 语法。&#10;可直接 Ctrl+V 粘贴截图，自动上传并插入图片链接。"
            @paste="handlePaste"
            @drop="handleDrop"
            @keydown.tab.prevent="handleTab"
            class="flex-1 w-full bg-transparent border-none outline-none focus:ring-0 p-0 text-zinc-800 font-mono text-sm sm:text-base leading-relaxed resize-none placeholder:text-zinc-300 placeholder:font-sans"
          ></textarea>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ArrowLeft, Save, Image } from 'lucide-vue-next';
import { request, showToast } from '../store';

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
const contentArea = ref(null);

const charCount = computed(() => (form.value.content ? form.value.content.length : 0));
const lineCount = computed(() => (form.value.content ? form.value.content.split('\n').length : 0));

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
    await request('/api/admin/articles', {
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

const uploadFile = async (file, customKey) => {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('customKey', customKey);
  const res = await request('/api/files/upload', {
    method: 'POST',
    body: fd,
    headers: {}
  });
  return res.url || res.fileUrl;
};

const uploadCover = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  e.target.value = '';
  
  try {
    const url = await uploadFile(file, `articles/covers/${Date.now()}_${file.name}`);
    form.value.coverUrl = url;
    showToast('封面上传成功', 'success');
  } catch (err) {
    console.error(err);
    showToast('封面上传失败', 'error');
  }
};

const insertAtCursor = (text) => {
  const el = contentArea.value;
  if (!el) {
    form.value.content += text;
    return;
  }
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const val = form.value.content;
  form.value.content = val.substring(0, start) + text + val.substring(end);
  setTimeout(() => {
    el.selectionStart = el.selectionEnd = start + text.length;
    el.focus();
  }, 0);
};

const handleTab = (e) => {
  insertAtCursor('  ');
};

const handleInsertImage = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  e.target.value = '';
  try {
    showToast('正在上传图片...', 'info');
    const url = await uploadFile(file, `articles/content/${Date.now()}_${file.name}`);
    insertAtCursor(`\n![${file.name}](${url})\n`);
    showToast('图片插入成功', 'success');
  } catch (err) {
    console.error(err);
    showToast('图片上传失败', 'error');
  }
};

const handlePaste = async (e) => {
  const items = e.clipboardData?.items;
  if (!items) return;

  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf('image') !== -1) {
      const file = items[i].getAsFile();
      if (file) {
        e.preventDefault();
        try {
          showToast('检测到截图，正在上传...', 'info');
          const ext = file.type.split('/')[1] || 'png';
          const filename = `image_${Date.now()}.${ext}`;
          const url = await uploadFile(file, `articles/content/${Date.now()}_${filename}`);
          insertAtCursor(`\n![${filename}](${url})\n`);
          showToast('截图已插入', 'success');
        } catch (err) {
          console.error(err);
          showToast('截图上传失败', 'error');
        }
        break;
      }
    }
  }
};

const handleDrop = async (e) => {
  e.preventDefault();
  const file = e.dataTransfer?.files?.[0];
  if (file && file.type.startsWith('image/')) {
    try {
      showToast('正在上传拖入图片...', 'info');
      const url = await uploadFile(file, `articles/content/${Date.now()}_${file.name}`);
      insertAtCursor(`\n![${file.name}](${url})\n`);
      showToast('图片已插入', 'success');
    } catch (err) {
      console.error(err);
      showToast('图片上传失败', 'error');
    }
  }
};
</script>

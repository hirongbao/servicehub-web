<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between mb-8">
      <h2 class="text-xl font-serif text-zinc-900">Articles</h2>
      <button @click="$emit('edit', null)" class="bg-zinc-900 text-white px-5 py-2.5 rounded-full hover:bg-zinc-800 active:scale-95 transition-all shadow-xl shadow-zinc-900/15 flex items-center gap-2 font-medium text-xs tracking-wider">
        <PenTool class="w-4 h-4" /> 撰写新文章
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="py-20 flex justify-center">
      <RefreshCw class="w-8 h-8 animate-spin text-zinc-300" />
    </div>

    <div v-else-if="articles.length === 0" class="py-20 text-center text-zinc-500 font-serif italic">
      暂无文章，点击右上角开始创作吧。
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="item in articles" :key="item.id" class="bg-white rounded-[2rem] border border-zinc-100 shadow-sm overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 flex flex-col relative group">
        <!-- Cover (Optional) -->
        <div v-if="item.coverUrl" class="h-48 w-full bg-zinc-100 overflow-hidden relative">
          <img :src="item.coverUrl" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
        </div>
        <div v-else class="h-32 w-full bg-zinc-900 flex items-center justify-center overflow-hidden relative">
          <div class="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-zinc-900 to-zinc-900"></div>
          <PenTool class="w-8 h-8 text-white/30 relative z-10" />
        </div>

        <!-- Status Badge -->
        <div class="absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase backdrop-blur-md"
             :class="item.status === 1 ? 'bg-emerald-500/90 text-white' : 'bg-white/90 text-zinc-600'">
          {{ item.status === 1 ? 'Published' : 'Draft' }}
        </div>

        <div class="p-6 flex-1 flex flex-col">
          <h3 class="text-xl font-serif text-zinc-900 font-bold mb-2 line-clamp-2 leading-snug">{{ item.title || 'Untitled' }}</h3>
          <p class="text-sm text-zinc-500 mb-6 line-clamp-3 leading-relaxed flex-1">{{ item.summary || '暂无摘要' }}</p>
          
          <div class="flex items-center justify-between text-xs text-zinc-400 font-mono border-t border-zinc-100 pt-4 mt-auto">
            <span class="flex items-center gap-1.5"><Eye class="w-3.5 h-3.5" /> {{ item.viewCount || 0 }}</span>
            <span>{{ formatDateTime(item.createdAt) }}</span>
          </div>
        </div>
        
        <!-- Hover Actions Overlay -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 z-20">
          <button @click="$emit('edit', item.id)" class="w-12 h-12 bg-white text-zinc-900 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-2xl" title="编辑文章">
            <Edit2 class="w-5 h-5" />
          </button>
          <button @click="deleteArticle(item.id)" class="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-2xl" title="删除文章">
            <Trash2 class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
    
    <Pagination v-if="total > pageSize" v-model="page" :total="total" :page-size="pageSize" @change="loadArticles" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { PenTool, RefreshCw, Eye, Edit2, Trash2 } from 'lucide-vue-next';
import { request, showToast, showConfirm } from '../store';
import Pagination from '../components/ui/Pagination.vue';

const emit = defineEmits(['edit']);

const articles = ref([]);
const loading = ref(false);
const page = ref(1);
const pageSize = ref(12);
const total = ref(0);

const loadArticles = async () => {
  loading.value = true;
  try {
    const res = await request(`/api/admin/articles?page=${page.value}&size=${pageSize.value}`);
    articles.value = res.records;
    total.value = res.total;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const deleteArticle = async (id) => {
  const confirmed = await showConfirm('删除确认', '确定要彻底删除这篇文章吗？操作不可逆。');
  if (!confirmed) return;
  
  try {
    await request(`/api/admin/articles/${id}`, { method: 'DELETE' });
    showToast('文章已删除', 'success');
    loadArticles();
  } catch (e) {
    console.error(e);
  }
};

const formatDateTime = (arr) => {
  if (!arr || !Array.isArray(arr)) return '';
  const [y, m, d] = arr;
  return `${y}.${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')}`;
};

onMounted(() => {
  loadArticles();
});
</script>

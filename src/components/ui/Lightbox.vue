<template>
  <Transition name="lightbox-fade">
    <div 
      v-if="visible" 
      class="fixed inset-0 z-[9999] bg-zinc-950/85 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 select-none"
      @click.self="close"
    >
      <!-- Top Bar -->
      <div class="w-full flex items-center justify-between z-50 max-w-6xl mx-auto pointer-events-auto">
        <!-- Title & Dimensions -->
        <div class="flex items-center gap-3 min-w-0 pr-4">
          <span v-if="title" class="text-sm font-medium text-zinc-200 truncate max-w-xs sm:max-w-md" :title="title">
            {{ title }}
          </span>
          <span v-if="naturalWidth && naturalHeight" class="text-[11px] font-mono text-zinc-400 bg-white/10 px-2.5 py-0.5 rounded-full whitespace-nowrap">
            {{ naturalWidth }} × {{ naturalHeight }}
          </span>
        </div>

        <!-- Top Actions -->
        <div class="flex items-center gap-2">
          <a 
            v-if="src" 
            :href="src" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-all" 
            title="新标签页打开原图"
          >
            <ExternalLink class="w-4 h-4" />
          </a>
          <button 
            @click="copyLink" 
            class="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-all" 
            title="复制图片链接"
          >
            <Check v-if="copied" class="w-4 h-4 text-emerald-400" />
            <Copy v-else class="w-4 h-4" />
          </button>
          <button 
            @click="close" 
            class="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-all ml-1" 
            title="关闭 (Esc)"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Main Image Preview Area -->
      <div 
        class="flex-1 w-full flex items-center justify-center min-h-0 relative my-2 sm:my-4 overflow-hidden" 
        @click.self="close"
      >
        <div 
          class="relative max-w-[85vw] max-h-[75vh] flex items-center justify-center transition-transform duration-200 ease-out"
          :style="{ transform: `scale(${zoomScale})` }"
        >
          <img 
            :src="src" 
            class="max-w-[85vw] max-h-[75vh] w-auto h-auto object-contain rounded-2xl shadow-2xl ring-1 ring-white/10 border border-white/5 transition-all"
            :class="zoomScale > 1 ? 'cursor-zoom-out' : 'cursor-zoom-in'"
            alt="Preview"
            @load="onImageLoad"
            @click.stop="toggleZoom"
          />
        </div>
      </div>

      <!-- Bottom Floating Toolbar -->
      <div class="z-50 pointer-events-auto">
        <div class="flex items-center gap-1.5 px-4 py-2 rounded-full bg-zinc-900/90 border border-white/10 shadow-2xl backdrop-blur-xl text-zinc-300">
          <button 
            @click="zoomOut" 
            :disabled="zoomScale <= 0.5" 
            class="p-2 hover:text-white hover:bg-white/10 rounded-full transition-colors disabled:opacity-30 disabled:hover:bg-transparent" 
            title="缩小"
          >
            <ZoomOut class="w-4 h-4" />
          </button>
          <span class="text-xs font-mono px-2 text-zinc-400 min-w-[3.5rem] text-center cursor-pointer hover:text-white" @click="resetZoom" title="点击重置为 100%">
            {{ Math.round(zoomScale * 100) }}%
          </span>
          <button 
            @click="zoomIn" 
            :disabled="zoomScale >= 3" 
            class="p-2 hover:text-white hover:bg-white/10 rounded-full transition-colors disabled:opacity-30 disabled:hover:bg-transparent" 
            title="放大"
          >
            <ZoomIn class="w-4 h-4" />
          </button>
          <div class="w-px h-4 bg-white/10 mx-1"></div>
          <button 
            @click="resetZoom" 
            class="p-2 hover:text-white hover:bg-white/10 rounded-full transition-colors text-xs flex items-center gap-1" 
            title="恢复适应屏幕"
          >
            <RotateCcw class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { X, ZoomIn, ZoomOut, RotateCcw, Copy, Check, ExternalLink } from 'lucide-vue-next';
import { showToast } from '../../store';

const props = defineProps({
  visible: { type: Boolean, default: false },
  src: { type: String, default: '' },
  title: { type: String, default: '' }
});

const emit = defineEmits(['update:visible', 'close']);

const zoomScale = ref(1);
const naturalWidth = ref(0);
const naturalHeight = ref(0);
const copied = ref(false);

const onImageLoad = (e) => {
  naturalWidth.value = e.target.naturalWidth || 0;
  naturalHeight.value = e.target.naturalHeight || 0;
};

const toggleZoom = () => {
  if (zoomScale.value === 1) {
    zoomScale.value = 1.5;
  } else {
    zoomScale.value = 1;
  }
};

const zoomIn = () => {
  zoomScale.value = Math.min(3, +(zoomScale.value + 0.25).toFixed(2));
};

const zoomOut = () => {
  zoomScale.value = Math.max(0.5, +(zoomScale.value - 0.25).toFixed(2));
};

const resetZoom = () => {
  zoomScale.value = 1;
};

const copyLink = async () => {
  if (!props.src) return;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(props.src);
    } else {
      const ta = document.createElement('textarea');
      ta.value = props.src;
      ta.style.position = 'absolute';
      ta.style.left = '-999999px';
      document.body.prepend(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    copied.value = true;
    showToast('图片链接已复制', 'success');
    setTimeout(() => { copied.value = false; }, 2000);
  } catch (err) {
    showToast('复制失败', 'error');
  }
};

const close = () => {
  emit('update:visible', false);
  emit('close');
};

const handleKeyDown = (e) => {
  if (props.visible && e.key === 'Escape') {
    close();
  }
};

watch(() => props.visible, (val) => {
  if (val) {
    resetZoom();
  }
});

watch(() => props.src, () => {
  resetZoom();
  naturalWidth.value = 0;
  naturalHeight.value = 0;
});

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
.lightbox-fade-enter-active,
.lightbox-fade-leave-active {
  transition: opacity 0.25s ease;
}
.lightbox-fade-enter-from,
.lightbox-fade-leave-to {
  opacity: 0;
}
</style>

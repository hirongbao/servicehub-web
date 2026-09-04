<template>
  <Transition name="fade">
    <div v-if="confirmState.visible" class="fixed inset-0 z-[9998] bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        v-motion
        :initial="{ opacity: 0, scale: 0.95, y: 20 }"
        :enter="{ opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } }"
        class="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-zinc-100"
      >
        <div class="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-6">
          <AlertTriangle class="w-6 h-6" />
        </div>
        <h3 class="text-xl font-bold text-zinc-900 mb-2">{{ confirmState.title }}</h3>
        <p class="text-sm text-zinc-500 mb-8 leading-relaxed">{{ confirmState.message }}</p>
        
        <div class="flex items-center gap-3">
          <button @click="cancel" class="flex-1 py-3 px-4 rounded-xl bg-zinc-50 text-zinc-600 hover:bg-zinc-100 font-bold text-sm transition-colors">
            {{ confirmState.cancelText }}
          </button>
          <button @click="confirm" class="flex-1 py-3 px-4 rounded-xl bg-red-600 text-white hover:bg-red-700 font-bold text-sm transition-colors shadow-lg shadow-red-500/30">
            {{ confirmState.confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { AlertTriangle } from 'lucide-vue-next';
import { confirmState } from '../../store';

const cancel = () => {
  confirmState.visible = false;
  if (confirmState.reject) confirmState.reject(new Error('cancel'));
};

const confirm = () => {
  confirmState.visible = false;
  if (confirmState.resolve) confirmState.resolve(true);
};
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

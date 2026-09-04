<template>
  <Transition name="fade">
    <div v-if="visible" class="fixed inset-0 z-[990] bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6" @click.self="closeOnMask && close()">
      <div 
        v-motion
        :initial="{ opacity: 0, scale: 0.95, y: 20 }"
        :enter="{ opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } }"
        class="bg-white rounded-[2.5rem] p-8 sm:p-10 w-full shadow-2xl border border-zinc-100 flex flex-col max-h-[90vh]"
        :style="{ maxWidth: width }"
      >
        <div class="flex items-center justify-between mb-8 shrink-0">
          <h2 class="text-2xl font-serif text-zinc-900">{{ title }}</h2>
          <button @click="close" class="w-10 h-10 rounded-full bg-zinc-50 hover:bg-zinc-100 text-zinc-500 flex items-center justify-center transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>
        
        <div class="flex-1 overflow-y-auto pr-2 -mr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-200 [&::-webkit-scrollbar-thumb]:rounded-full">
          <slot></slot>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { X } from 'lucide-vue-next';

const props = defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: '' },
  width: { type: String, default: '540px' },
  closeOnMask: { type: Boolean, default: false }
});

const emit = defineEmits(['update:visible', 'close']);

const close = () => {
  emit('update:visible', false);
  emit('close');
};
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

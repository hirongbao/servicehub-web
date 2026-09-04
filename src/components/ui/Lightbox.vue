<template>
  <Transition name="fade">
    <div v-if="visible" class="fixed inset-0 z-[9999] bg-zinc-900/95 backdrop-blur-xl flex items-center justify-center" @click.self="close">
      
      <button @click="close" class="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-all z-50">
        <X class="w-6 h-6" />
      </button>

      <div 
        v-motion
        :initial="{ opacity: 0, scale: 0.9 }"
        :enter="{ opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 20 } }"
        class="w-full h-full p-4 sm:p-12 flex items-center justify-center pointer-events-none"
      >
        <img 
          :src="src" 
          class="max-w-full max-h-full object-contain pointer-events-auto rounded-lg shadow-2xl"
          alt="Preview"
          @click.stop
        />
      </div>

    </div>
  </Transition>
</template>

<script setup>
import { X } from 'lucide-vue-next';

defineProps({
  visible: { type: Boolean, default: false },
  src: { type: String, default: '' }
});

const emit = defineEmits(['update:visible', 'close']);

const close = () => {
  emit('update:visible', false);
  emit('close');
};
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

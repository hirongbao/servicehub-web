<template>
  <div class="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none">
    <TransitionGroup name="toast">
      <div v-for="t in toasts" :key="t.id" 
           class="flex items-center gap-3 px-5 py-3 rounded-full shadow-xl shadow-zinc-200/50 backdrop-blur-md border pointer-events-auto"
           :class="{
             'bg-white/95 border-zinc-100 text-zinc-700': t.type === 'info',
             'bg-emerald-50/95 border-emerald-100 text-emerald-700': t.type === 'success',
             'bg-red-50/95 border-red-100 text-red-700': t.type === 'error',
             'bg-amber-50/95 border-amber-100 text-amber-700': t.type === 'warning'
           }">
        <CheckCircle2 v-if="t.type === 'success'" class="w-4 h-4" />
        <AlertCircle v-else-if="t.type === 'error'" class="w-4 h-4" />
        <Info v-else class="w-4 h-4 text-zinc-400" />
        <span class="text-sm font-medium tracking-wide">{{ t.message }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { CheckCircle2, AlertCircle, Info } from 'lucide-vue-next';
import { toasts } from '../../store';
</script>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.toast-enter-from { opacity: 0; transform: translateY(-20px) scale(0.95); }
.toast-leave-to { opacity: 0; transform: translateY(-20px) scale(0.95); }
</style>

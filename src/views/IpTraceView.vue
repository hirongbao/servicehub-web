<template>
  <div class="space-y-6">
    <!-- Header: Back + IP Info + Range Toggle -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <button @click="$emit('back')" class="w-9 h-9 rounded-xl bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-600 transition-colors">
          <ArrowLeft class="w-4 h-4" />
        </button>
        <div>
          <div class="flex items-center gap-3">
            <h2 class="text-2xl font-serif text-zinc-900 tracking-tight font-medium">{{ ip }}</h2>
            <span v-if="statsData?.region" class="text-sm text-zinc-500 bg-zinc-100 px-2.5 py-0.5 rounded-lg">{{ statsData.region }}</span>
          </div>
          <p class="text-xs text-zinc-400 mt-1">IP 访问轨迹分析</p>
        </div>
      </div>
      <div class="flex items-center space-x-2">
        <button @click="range = '24h'" :class="['px-3 py-1 text-sm rounded-lg', range === '24h' ? 'bg-zinc-200 text-zinc-900' : 'text-zinc-500 hover:bg-zinc-100']">24h</button>
        <button @click="range = '7d'" :class="['px-3 py-1 text-sm rounded-lg', range === '7d' ? 'bg-zinc-200 text-zinc-900' : 'text-zinc-500 hover:bg-zinc-100']">7d</button>
        <button @click="loadAll" class="p-2 rounded-lg hover:bg-zinc-100 text-zinc-500">
          <RefreshCw class="w-4 h-4" :class="{'animate-spin': loadingStats}" />
        </button>
      </div>
    </div>

    <div v-if="loadingStats && !statsData" class="py-20 flex justify-center">
      <RefreshCw class="w-8 h-8 text-zinc-300 animate-spin" />
    </div>

    <template v-if="statsData">
      <!-- Summary Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-2xl p-5 shadow-sm border border-zinc-100">
          <div class="text-2xl font-serif text-zinc-900 mb-1">{{ formatNumber(statsData.summary?.total_requests) }}</div>
          <div class="text-xs text-zinc-500 uppercase tracking-wider">总请求</div>
        </div>
        <div class="bg-white rounded-2xl p-5 shadow-sm border border-zinc-100">
          <div class="text-2xl font-serif text-zinc-900 mb-1">{{ successRate }}%</div>
          <div class="text-xs text-zinc-500 uppercase tracking-wider">成功率</div>
        </div>
        <div class="bg-white rounded-2xl p-5 shadow-sm border border-zinc-100">
          <div class="text-2xl font-serif text-zinc-900 mb-1">{{ Math.round(statsData.summary?.avg_cost_ms || 0) }}ms</div>
          <div class="text-xs text-zinc-500 uppercase tracking-wider">平均耗时</div>
        </div>
        <div class="bg-white rounded-2xl p-5 shadow-sm border border-zinc-100">
          <div class="text-2xl font-serif text-zinc-900 mb-1">{{ statsData.summary?.unique_paths || 0 }}</div>
          <div class="text-xs text-zinc-500 uppercase tracking-wider">访问接口数</div>
        </div>
      </div>

      <!-- Second row: more stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-2xl p-5 shadow-sm border border-zinc-100">
          <div class="text-2xl font-serif text-amber-600 mb-1">{{ statsData.summary?.error_4xx || 0 }}</div>
          <div class="text-xs text-zinc-500 uppercase tracking-wider">4xx 错误</div>
        </div>
        <div class="bg-white rounded-2xl p-5 shadow-sm border border-zinc-100">
          <div class="text-2xl font-serif text-red-600 mb-1">{{ statsData.summary?.error_5xx || 0 }}</div>
          <div class="text-xs text-zinc-500 uppercase tracking-wider">5xx 错误</div>
        </div>
        <div class="bg-white rounded-2xl p-5 shadow-sm border border-zinc-100">
          <div class="text-lg font-mono text-zinc-700 mb-1">{{ formatDate(statsData.summary?.first_seen) }}</div>
          <div class="text-xs text-zinc-500 uppercase tracking-wider">首次访问</div>
        </div>
        <div class="bg-white rounded-2xl p-5 shadow-sm border border-zinc-100">
          <div class="text-lg font-mono text-zinc-700 mb-1">{{ formatDate(statsData.summary?.last_seen) }}</div>
          <div class="text-xs text-zinc-500 uppercase tracking-wider">最后访问</div>
        </div>
      </div>

      <!-- Frequency Alert -->
      <div v-if="(statsData.summary?.error_4xx || 0) > 20" class="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
        <AlertTriangle class="w-5 h-5 text-amber-500 shrink-0" />
        <span class="text-sm text-amber-800">该 IP 在当前时间范围内产生了 {{ statsData.summary.error_4xx }} 次 4xx 请求</span>
      </div>

      <!-- Request Frequency Chart -->
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100">
        <h3 class="text-lg font-medium text-zinc-800 mb-6">请求频率分布</h3>
        <div v-if="statsData.timeDistribution && statsData.timeDistribution.length > 0" class="h-40 flex items-end space-x-px sm:space-x-1">
          <div v-for="(item, idx) in statsData.timeDistribution" :key="idx" class="flex-1 flex flex-col justify-end h-full group relative">
            <div class="w-full bg-zinc-800 hover:bg-zinc-600 rounded-t-sm transition-all cursor-default"
                 :style="{ height: Math.max((item.count / maxTimeCount) * 100, 1) + '%' }">
            </div>
            <div class="absolute bottom-full mb-2 hidden group-hover:block w-max bg-zinc-900 text-white text-xs py-1 px-2 rounded opacity-90 z-10 -translate-x-1/2 left-1/2 pointer-events-none">
              {{ item.time_bucket }}: {{ item.count }}
            </div>
          </div>
        </div>
        <div v-else class="h-40 flex items-center justify-center text-zinc-400 text-sm">暂无数据</div>
        <div v-if="statsData.timeDistribution && statsData.timeDistribution.length > 0" class="flex justify-between text-xs text-zinc-400 mt-2">
          <span v-for="(item, idx) in statsData.timeDistribution" :key="'lb-'+idx"
                v-show="idx % Math.max(1, Math.ceil(statsData.timeDistribution.length / 6)) === 0">
            {{ item.time_bucket.split(' ')[1] || item.time_bucket }}
          </span>
        </div>
      </div>

      <!-- Two Column: Top Paths + Status Distribution -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Top Paths (2/3 width) -->
        <div class="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-zinc-100">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-zinc-800">访问接口 Top</h3>
            <div class="flex items-center space-x-1">
              <button @click="pathSort = 'count'" :class="['px-2 py-1 text-xs rounded', pathSort === 'count' ? 'bg-zinc-200 text-zinc-900' : 'text-zinc-400 hover:bg-zinc-100']">按次数</button>
              <button @click="pathSort = 'avg_ms'" :class="['px-2 py-1 text-xs rounded', pathSort === 'avg_ms' ? 'bg-zinc-200 text-zinc-900' : 'text-zinc-400 hover:bg-zinc-100']">按耗时</button>
              <button @click="pathSort = 'error_count'" :class="['px-2 py-1 text-xs rounded', pathSort === 'error_count' ? 'bg-zinc-200 text-zinc-900' : 'text-zinc-400 hover:bg-zinc-100']">按错误</button>
            </div>
          </div>
          <div class="overflow-auto max-h-[400px]">
            <table class="w-full text-sm text-left">
              <thead class="text-xs text-zinc-500 uppercase bg-zinc-50 sticky top-0">
                <tr>
                  <th class="px-4 py-2 font-medium">Path</th>
                  <th class="px-4 py-2 font-medium text-right">请求数</th>
                  <th class="px-4 py-2 font-medium text-right">平均耗时</th>
                  <th class="px-4 py-2 font-medium text-right">错误数</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-100">
                <tr v-for="item in sortedPaths" :key="item.path" class="hover:bg-zinc-50">
                  <td class="px-4 py-3 font-mono text-xs text-zinc-800 max-w-[300px] truncate" :title="item.path">{{ item.path }}</td>
                  <td class="px-4 py-3 text-right font-medium">{{ formatNumber(item.count) }}</td>
                  <td class="px-4 py-3 text-right" :class="{'text-red-600 font-bold': item.avg_ms > 1000}">{{ Math.round(item.avg_ms) }}ms</td>
                  <td class="px-4 py-3 text-right" :class="{'text-red-600 font-bold': item.error_count > 0}">{{ item.error_count }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Status Distribution (1/3 width) -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100">
          <h3 class="text-lg font-medium text-zinc-800 mb-4">状态码分布</h3>
          <div class="space-y-4">
            <div v-for="item in statsData.statusDistribution" :key="item.status_group">
              <div class="flex justify-between text-sm mb-1.5">
                <span class="font-medium text-zinc-700">{{ item.status_group }}</span>
                <span class="text-zinc-500">{{ formatNumber(item.count) }} ({{ statusPercent(item.count) }}%)</span>
              </div>
              <div class="w-full bg-zinc-100 rounded-full h-2.5">
                <div class="h-2.5 rounded-full transition-all" :class="getStatusBarColor(item.status_group)" :style="{ width: statusPercent(item.count) + '%' }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Access Timeline -->
      <div class="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
        <div class="p-4 border-b border-zinc-100 flex flex-wrap gap-3 items-center">
          <h3 class="text-lg font-medium text-zinc-800 mr-auto">访问时间线</h3>
          <div class="w-36"><Select v-model="tlMethod" :options="methodOptions" placeholder="全部方法" /></div>
          <div class="w-28"><Select v-model="tlStatus" :options="statusOptions" placeholder="全部状态" /></div>
          <input v-model="tlPath" type="text" placeholder="Path 过滤..." class="rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:border-zinc-400 w-40" @keyup.enter="loadTimeline" />
          <button @click="loadTimeline" class="bg-zinc-900 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-zinc-800 transition-colors flex items-center">
            <Search class="w-4 h-4 mr-1" /> 查询
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left whitespace-nowrap">
            <thead class="text-xs text-zinc-500 uppercase bg-zinc-50">
              <tr>
                <th class="px-4 py-3 font-medium">时间</th>
                <th class="px-4 py-3 font-medium">方法</th>
                <th class="px-4 py-3 font-medium">路径</th>
                <th class="px-4 py-3 font-medium">状态码</th>
                <th class="px-4 py-3 font-medium">耗时</th>
                <th class="px-4 py-3 font-medium">User Agent</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-100">
              <tr v-if="loadingTimeline && timeline.length === 0">
                <td colspan="6" class="px-4 py-8 text-center text-zinc-500">
                  <RefreshCw class="w-5 h-5 animate-spin mx-auto mb-2" /> Loading...
                </td>
              </tr>
              <tr v-else-if="timeline.length === 0">
                <td colspan="6" class="px-4 py-8 text-center text-zinc-400">暂无访问记录</td>
              </tr>
              <tr v-for="log in timeline" :key="log.id" class="hover:bg-zinc-50 transition-colors">
                <td class="px-4 py-3 text-zinc-500 font-mono text-xs">{{ formatDate(log.created_at) }}</td>
                <td class="px-4 py-3">
                  <span :class="getMethodBadgeClass(log.method)" class="px-2 py-0.5 rounded text-xs font-medium">{{ log.method }}</span>
                </td>
                <td class="px-4 py-3 font-mono text-xs text-zinc-800 max-w-xs truncate" :title="log.path">{{ log.path }}</td>
                <td class="px-4 py-3">
                  <span :class="getStatusTextClass(log.status_code)">{{ log.status_code }}</span>
                </td>
                <td class="px-4 py-3" :class="{'text-red-600 font-bold': log.cost_ms > 1000}">{{ log.cost_ms }}ms</td>
                <td class="px-4 py-3 max-w-[200px] truncate text-zinc-500 text-xs" :title="log.user_agent">{{ log.user_agent || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="p-4 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2 text-sm text-zinc-500">
            <span>每页</span>
            <select v-model.number="tlPageSize" @change="loadTimeline" class="rounded-lg border border-zinc-200 px-2 py-1 text-sm focus:outline-none">
              <option :value="50">50</option>
              <option :value="100">100</option>
              <option :value="200">200</option>
            </select>
            <span>条</span>
          </div>
          <Pagination v-model="tlPage" :total="tlTotal" :page-size="tlPageSize" @change="loadTimeline" />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ArrowLeft, RefreshCw, AlertTriangle, Search } from 'lucide-vue-next'
import { request, showToast } from '../store'
import Pagination from '../components/ui/Pagination.vue'
import Select from '../components/ui/Select.vue'

const props = defineProps({
  ip: { type: String, required: true }
})

defineEmits(['back'])

const range = ref('24h')
const loadingStats = ref(false)
const statsData = ref(null)
const pathSort = ref('count')

// Timeline state
const timeline = ref([])
const tlPage = ref(1)
const tlPageSize = ref(50)
const tlTotal = ref(0)
const loadingTimeline = ref(false)
const tlMethod = ref('')
const tlStatus = ref('')
const tlPath = ref('')

const methodOptions = [
  { label: '全部方法', value: '' },
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' }
]

const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '2xx', value: '2xx' },
  { label: '3xx', value: '3xx' },
  { label: '4xx', value: '4xx' },
  { label: '5xx', value: '5xx' }
]

// Computed
const maxTimeCount = computed(() => {
  if (!statsData.value?.timeDistribution) return 1
  const max = Math.max(...statsData.value.timeDistribution.map(t => t.count))
  return max > 0 ? max : 1
})

const successRate = computed(() => {
  const s = statsData.value?.summary
  if (!s || !s.total_requests) return 0
  return (((s.success_count || 0) / s.total_requests) * 100).toFixed(1)
})

const sortedPaths = computed(() => {
  if (!statsData.value?.topPaths) return []
  return [...statsData.value.topPaths].sort((a, b) => (b[pathSort.value] || 0) - (a[pathSort.value] || 0))
})

// Helpers
const formatNumber = (num) => {
  if (!num) return '0'
  return new Intl.NumberFormat('en-US').format(num)
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const pad = n => n < 10 ? '0'+n : n
  return `${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const statusPercent = (count) => {
  const total = statsData.value?.summary?.total_requests || 1
  return Math.round((count / total) * 100)
}

const getStatusBarColor = (group) => {
  if (group === '2xx') return 'bg-emerald-500'
  if (group === '3xx') return 'bg-blue-500'
  if (group === '4xx') return 'bg-amber-500'
  if (group === '5xx') return 'bg-red-500'
  return 'bg-zinc-500'
}

const getMethodBadgeClass = (method) => {
  switch (method?.toUpperCase()) {
    case 'GET': return 'text-emerald-700 bg-emerald-100'
    case 'POST': return 'text-blue-700 bg-blue-100'
    case 'PUT': return 'text-amber-700 bg-amber-100'
    case 'DELETE': return 'text-red-700 bg-red-100'
    default: return 'text-zinc-700 bg-zinc-100'
  }
}

const getStatusTextClass = (status) => {
  const s = parseInt(status)
  if (s >= 200 && s < 300) return 'text-emerald-600 font-medium'
  if (s >= 300 && s < 400) return 'text-blue-600 font-medium'
  if (s >= 400 && s < 500) return 'text-amber-600 font-medium'
  if (s >= 500) return 'px-2 py-0.5 bg-red-500 text-white rounded text-xs font-medium'
  return 'text-zinc-600'
}

// Data loading
const loadStats = async () => {
  loadingStats.value = true
  try {
    const data = await request(`/api/logs/access/ip/${encodeURIComponent(props.ip)}/stats?range=${range.value}`)
    statsData.value = data
  } catch (err) {
    showToast('加载 IP 统计失败', 'error')
  } finally {
    loadingStats.value = false
  }
}

const loadTimeline = async () => {
  loadingTimeline.value = true
  try {
    const params = new URLSearchParams()
    params.append('page', tlPage.value)
    params.append('size', tlPageSize.value)
    params.append('range', range.value)
    if (tlMethod.value) params.append('method', tlMethod.value)
    if (tlStatus.value) params.append('statusGroup', tlStatus.value)
    if (tlPath.value) params.append('path', tlPath.value)
    const data = await request(`/api/logs/access/ip/${encodeURIComponent(props.ip)}?${params}`)
    timeline.value = data.list || []
    tlTotal.value = data.total || 0
  } catch (err) {
    showToast('加载访问时间线失败', 'error')
  } finally {
    loadingTimeline.value = false
  }
}

const loadAll = () => {
  tlPage.value = 1
  loadStats()
  loadTimeline()
}

// Watchers
watch(range, () => {
  tlPage.value = 1
  loadAll()
})

// Init
onMounted(() => {
  loadAll()
})
</script>

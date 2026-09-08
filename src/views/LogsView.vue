<template>
  <div class="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-serif text-zinc-900 tracking-tight">Logs & Analytics</h1>
      <div class="flex p-1 bg-zinc-100 rounded-full space-x-1">
        <button v-for="(tab, idx) in tabs" :key="idx"
          @click="activeTab = idx"
          :class="['flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors',
            activeTab === idx ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-900']"
        >
          <component :is="tab.icon" class="w-4 h-4 mr-2" />
          {{ tab.name }}
        </button>
      </div>
    </div>

    <!-- Tab 1: Traffic Overview -->
    <div v-if="activeTab === 0" class="space-y-6">
      <div class="flex justify-between items-center">
        <h2 class="text-xl font-serif text-zinc-800">Traffic Overview</h2>
        <div class="flex items-center space-x-2">
           <button @click="overviewRange = '24h'" :class="['px-3 py-1 text-sm rounded-lg', overviewRange === '24h' ? 'bg-zinc-200 text-zinc-900' : 'text-zinc-500 hover:bg-zinc-100']">24h</button>
           <button @click="overviewRange = '7d'" :class="['px-3 py-1 text-sm rounded-lg', overviewRange === '7d' ? 'bg-zinc-200 text-zinc-900' : 'text-zinc-500 hover:bg-zinc-100']">7d</button>
           <button @click="loadOverview" class="p-2 rounded-lg hover:bg-zinc-100 text-zinc-500">
             <RefreshCw class="w-4 h-4" :class="{'animate-spin': loadingOverview}" />
           </button>
        </div>
      </div>

      <div v-if="overviewData" class="space-y-6">
        <!-- Top Stats Row -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100">
            <div class="text-3xl font-serif text-zinc-900 mb-1">{{ formatNumber(overviewData.total_requests) }}</div>
            <div class="text-sm text-zinc-500 uppercase tracking-wider">Total Requests</div>
          </div>
          <div class="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100">
            <div class="text-3xl font-serif text-zinc-900 mb-1">{{ Math.round(overviewData.avg_cost_ms || 0) }}ms</div>
            <div class="text-sm text-zinc-500 uppercase tracking-wider">Avg Latency</div>
          </div>
          <div class="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100">
            <div class="text-3xl font-serif text-zinc-900 mb-1">{{ errorRate }}%</div>
            <div class="text-sm text-zinc-500 uppercase tracking-wider">Error Rate</div>
          </div>
          <div class="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100">
            <div class="text-3xl font-serif text-zinc-900 mb-1">{{ formatNumber(overviewData.unique_ips) }}</div>
            <div class="text-sm text-zinc-500 uppercase tracking-wider">Unique IPs</div>
          </div>
        </div>

        <!-- Hourly Trend Chart -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100">
          <h3 class="text-lg font-medium text-zinc-800 mb-6">Traffic Trend</h3>
          <div class="h-48 flex items-end space-x-1 sm:space-x-2">
            <div v-for="item in overviewData.hourly_stats" :key="item.hour" class="flex-1 flex flex-col justify-end h-full group relative">
              <div class="w-full bg-zinc-800 hover:bg-zinc-700 rounded-t-sm transition-all"
                   :style="{ height: Math.max((item.count / maxHourlyCount) * 100, 1) + '%' }">
              </div>
              <!-- Tooltip -->
              <div class="absolute bottom-full mb-2 hidden group-hover:block w-max bg-zinc-900 text-white text-xs py-1 px-2 rounded opacity-90 z-10 -translate-x-1/2 left-1/2">
                {{ item.hour }}: {{ item.count }}
              </div>
            </div>
          </div>
          <div class="flex justify-between text-xs text-zinc-400 mt-2">
            <span v-for="(item, index) in overviewData.hourly_stats" :key="'label-'+index" v-show="index % Math.ceil(overviewData.hourly_stats.length / 8) === 0">
              {{ item.hour.split(' ')[1] || item.hour }}
            </span>
          </div>
        </div>

        <!-- Two Column Row 1 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100">
            <h3 class="text-lg font-medium text-zinc-800 mb-4">Status Codes</h3>
            <div class="space-y-3">
              <div v-for="(count, code) in overviewData.status_distribution" :key="code">
                <div class="flex justify-between text-sm mb-1">
                  <span class="font-medium text-zinc-700">{{ code }}</span>
                  <span class="text-zinc-500">{{ count }} ({{ Math.round(count/overviewData.total_requests*100) }}%)</span>
                </div>
                <div class="w-full bg-zinc-100 rounded-full h-2">
                  <div class="h-2 rounded-full" :class="getStatusColorClass(code)" :style="{ width: (count/overviewData.total_requests*100) + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100">
            <h3 class="text-lg font-medium text-zinc-800 mb-4">Latency Distribution</h3>
            <div class="space-y-3">
              <div v-for="item in overviewData.latency_distribution" :key="item.label">
                <div class="flex justify-between text-sm mb-1">
                  <span class="font-medium text-zinc-700">{{ item.label }}</span>
                  <span class="text-zinc-500">{{ item.count }} ({{ item.percentage }}%)</span>
                </div>
                <div class="w-full bg-zinc-100 rounded-full h-2">
                  <div class="h-2 rounded-full bg-zinc-800" :style="{ width: item.percentage + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Two Column Row 2 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100 overflow-hidden flex flex-col">
            <h3 class="text-lg font-medium text-zinc-800 mb-4">Top Paths</h3>
            <div class="overflow-auto flex-1">
              <table class="w-full text-sm text-left">
                <thead class="text-xs text-zinc-500 uppercase bg-zinc-50">
                  <tr>
                    <th class="px-4 py-2 font-medium">Rank</th>
                    <th class="px-4 py-2 font-medium">Path</th>
                    <th class="px-4 py-2 font-medium">Count</th>
                    <th class="px-4 py-2 font-medium">Avg ms</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-zinc-100">
                  <tr v-for="(item, idx) in overviewData.top_paths" :key="idx" class="hover:bg-zinc-50">
                    <td class="px-4 py-3 text-zinc-500">{{ idx + 1 }}</td>
                    <td class="px-4 py-3 font-medium text-zinc-800 max-w-[200px] truncate" :title="item.path">{{ item.path }}</td>
                    <td class="px-4 py-3">{{ formatNumber(item.count) }}</td>
                    <td class="px-4 py-3">{{ Math.round(item.avg_ms) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100 overflow-hidden flex flex-col">
            <h3 class="text-lg font-medium text-zinc-800 mb-4">Top IPs</h3>
            <div class="overflow-auto flex-1">
              <table class="w-full text-sm text-left">
                <thead class="text-xs text-zinc-500 uppercase bg-zinc-50">
                  <tr>
                    <th class="px-4 py-2 font-medium">Rank</th>
                    <th class="px-4 py-2 font-medium">IP</th>
                    <th class="px-4 py-2 font-medium">Count</th>
                    <th class="px-4 py-2 font-medium">Last Seen</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-zinc-100">
                  <tr v-for="(item, idx) in overviewData.top_ips" :key="idx" class="hover:bg-zinc-50">
                    <td class="px-4 py-3 text-zinc-500">{{ idx + 1 }}</td>
                    <td class="px-4 py-3 font-medium text-zinc-800">{{ item.ip }}</td>
                    <td class="px-4 py-3">{{ formatNumber(item.count) }}</td>
                    <td class="px-4 py-3 text-zinc-500">{{ formatDate(item.last_seen) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div v-else-if="loadingOverview" class="py-20 flex justify-center">
        <RefreshCw class="w-8 h-8 text-zinc-300 animate-spin" />
      </div>
    </div>

    <!-- Tab 2: Access Log -->
    <div v-if="activeTab === 1" class="space-y-4">
      <!-- Filter Bar -->
      <div class="bg-white rounded-2xl p-4 shadow-sm border border-zinc-100 flex flex-wrap gap-3 items-center">
        <input v-model="accessFilters.ip" type="text" placeholder="IP Address" class="rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:border-zinc-400 w-32 md:w-40" />
        
        <select v-model="accessFilters.method" class="rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:border-zinc-400 bg-white">
          <option value="">ALL Methods</option>
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
        </select>
        
        <input v-model="accessFilters.path" type="text" placeholder="Path (/api/...)" class="rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:border-zinc-400 flex-1 min-w-[150px]" />
        
        <div class="flex items-center space-x-1">
          <input v-model="accessFilters.minStatus" type="number" placeholder="Min Status" class="rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:border-zinc-400 w-24" />
          <span class="text-zinc-400">-</span>
          <input v-model="accessFilters.maxStatus" type="number" placeholder="Max Status" class="rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:border-zinc-400 w-24" />
        </div>
        
        <input v-model="accessFilters.minCost" type="number" placeholder="Min ms" class="rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:border-zinc-400 w-24" />
        
        <button @click="loadAccessLogs" class="bg-zinc-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-zinc-800 transition-colors flex items-center">
          <Search class="w-4 h-4 mr-2" /> Search
        </button>
        <button @click="resetAccessFilters" class="bg-zinc-100 text-zinc-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-zinc-200 transition-colors">
          Reset
        </button>
        
        <div class="ml-auto flex items-center space-x-2 border-l border-zinc-200 pl-4">
          <span class="text-sm text-zinc-500">Auto-refresh</span>
          <Switch v-model="autoRefreshAccess" />
        </div>
      </div>

      <!-- Data Table -->
      <div class="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left whitespace-nowrap">
            <thead class="text-xs text-zinc-500 uppercase bg-zinc-50">
              <tr>
                <th class="px-4 py-3 font-medium">Time</th>
                <th class="px-4 py-3 font-medium">IP</th>
                <th class="px-4 py-3 font-medium">Method</th>
                <th class="px-4 py-3 font-medium">Path</th>
                <th class="px-4 py-3 font-medium">Status</th>
                <th class="px-4 py-3 font-medium">Cost</th>
                <th class="px-4 py-3 font-medium">User Agent</th>
                <th class="px-4 py-3 font-medium">Referer</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-100">
              <tr v-if="loadingAccess && accessLogs.length === 0">
                <td colspan="8" class="px-4 py-8 text-center text-zinc-500">
                  <RefreshCw class="w-5 h-5 animate-spin mx-auto mb-2" /> Loading...
                </td>
              </tr>
              <tr v-else-if="accessLogs.length === 0">
                <td colspan="8" class="px-4 py-8 text-center text-zinc-500">No logs found</td>
              </tr>
              <template v-for="log in accessLogs" :key="log.id || log.time">
                <tr class="hover:bg-zinc-50 cursor-pointer transition-colors" @click="expandedLog = (expandedLog === log ? null : log)">
                  <td class="px-4 py-3 text-zinc-500">{{ formatDate(log.time) }}</td>
                  <td class="px-4 py-3">{{ log.ip }}</td>
                  <td class="px-4 py-3">
                    <span :class="getMethodBadgeClass(log.method)" class="px-2 py-0.5 rounded text-xs font-medium bg-opacity-10">{{ log.method }}</span>
                  </td>
                  <td class="px-4 py-3 font-mono text-xs max-w-xs truncate" :title="log.path">{{ log.path }}</td>
                  <td class="px-4 py-3">
                    <span :class="getStatusTextClass(log.status)">{{ log.status }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <span :class="{'text-red-600 font-bold': log.cost_ms > 1000, 'text-zinc-600': log.cost_ms <= 1000}">{{ log.cost_ms }}ms</span>
                  </td>
                  <td class="px-4 py-3 max-w-[150px] truncate text-zinc-500" :title="log.user_agent">{{ log.user_agent || '-' }}</td>
                  <td class="px-4 py-3 max-w-[150px] truncate text-zinc-500" :title="log.referer">{{ log.referer || '-' }}</td>
                </tr>
                <tr v-if="expandedLog === log" class="bg-zinc-50 border-t-0">
                  <td colspan="8" class="px-4 py-4 text-xs text-zinc-600 whitespace-normal">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div class="font-medium text-zinc-800 mb-1">User Agent</div>
                        <div class="bg-white p-2 rounded border border-zinc-200 break-all">{{ log.user_agent || 'None' }}</div>
                      </div>
                      <div>
                        <div class="font-medium text-zinc-800 mb-1">Referer</div>
                        <div class="bg-white p-2 rounded border border-zinc-200 break-all">{{ log.referer || 'None' }}</div>
                      </div>
                      <div class="md:col-span-2">
                        <div class="font-medium text-zinc-800 mb-1">Full Path & Query</div>
                        <div class="bg-white p-2 rounded border border-zinc-200 break-all font-mono">{{ log.path }}</div>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
        <div class="p-4 border-t border-zinc-100 flex justify-between items-center">
          <Pagination v-model="accessPage" :total="accessTotal" :page-size="accessPageSize" @change="loadAccessLogs" />
        </div>
      </div>
    </div>

    <!-- Tab 3: System / Runtime Log -->
    <div v-if="activeTab === 2" class="space-y-4">
      <div class="flex items-center space-x-3 bg-white p-3 rounded-2xl shadow-sm border border-zinc-100">
        <div class="flex-1 relative">
          <Search class="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
          <input v-model="runtimeKeyword" @keyup.enter="loadRuntimeLogs" type="text" placeholder="Search logs..." class="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-zinc-400" />
        </div>
        <select v-model="runtimeLines" @change="loadRuntimeLogs" class="rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:border-zinc-400 bg-white">
          <option :value="100">100 lines</option>
          <option :value="200">200 lines</option>
          <option :value="500">500 lines</option>
        </select>
        <button @click="loadRuntimeLogs" class="p-2 rounded-xl bg-zinc-100 text-zinc-700 hover:bg-zinc-200 flex items-center justify-center">
          <RefreshCw class="w-4 h-4" :class="{'animate-spin': loadingRuntime}" />
        </button>
      </div>

      <div class="bg-zinc-900 rounded-2xl shadow-sm overflow-hidden flex flex-col border border-zinc-800">
        <div class="bg-zinc-800/50 px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <Terminal class="w-4 h-4 text-zinc-400" />
            <span class="text-xs font-medium text-zinc-300">system.log</span>
          </div>
          <span v-if="loadingRuntime" class="text-xs text-zinc-500 flex items-center"><RefreshCw class="w-3 h-3 animate-spin mr-1"/> Tailing...</span>
        </div>
        <div ref="terminalRef" class="p-4 overflow-y-auto font-mono text-xs text-zinc-300 h-[70vh] w-full break-all">
          <div v-if="runtimeLogs.length === 0 && !loadingRuntime" class="text-zinc-600 text-center py-10">No logs found.</div>
          <div v-for="(line, idx) in runtimeLogs" :key="idx" class="flex hover:bg-zinc-800/50">
            <div class="w-10 flex-shrink-0 text-zinc-600 select-none text-right pr-3">{{ idx + 1 }}</div>
            <div class="flex-1 whitespace-pre-wrap" v-html="highlightLogLine(line)"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, computed, onUnmounted } from 'vue'
import { BarChart3, List, Terminal, RefreshCw, Search } from 'lucide-vue-next'
import { request, showToast } from '../store'
import Pagination from '../components/ui/Pagination.vue'
import Switch from '../components/ui/Switch.vue'

const tabs = [
  { name: '流量概览', icon: BarChart3 },
  { name: '访问日志', icon: List },
  { name: '系统日志', icon: Terminal }
]

const activeTab = ref(0)

// Helper formatting
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

// --- Tab 1: Overview ---
const overviewRange = ref('24h')
const overviewData = ref(null)
const loadingOverview = ref(false)

const maxHourlyCount = computed(() => {
  if (!overviewData.value || !overviewData.value.hourly_stats) return 1
  const max = Math.max(...overviewData.value.hourly_stats.map(s => s.count))
  return max > 0 ? max : 1
})

const errorRate = computed(() => {
  if (!overviewData.value || !overviewData.value.total_requests) return 0
  return ((overviewData.value.error_count / overviewData.value.total_requests) * 100).toFixed(2)
})

const loadOverview = async () => {
  loadingOverview.value = true
  try {
    const data = await request('/api/logs/access/stats?range=' + overviewRange.value)
    
    // Convert statusDistribution array to object map
    const statusMap = {}
    if (data.statusDistribution) {
      data.statusDistribution.forEach(s => {
        statusMap[s.status_group] = s.count
      })
    }
    
    // Map latency brackets
    const latencyDist = (data.latencyDistribution || []).map(l => ({
      label: l.bracket,
      count: l.count
    }))
    
    // Map top IPs
    const topIps = (data.topIps || []).map(ip => ({
      ip: ip.ip_address,
      count: ip.count,
      last_seen: ip.last_seen
    }))
    
    overviewData.value = {
      total_requests: data.summary?.total_requests || 0,
      avg_cost_ms: data.summary?.avg_cost_ms || 0,
      error_count: data.summary?.error_count || 0,
      unique_ips: data.summary?.unique_ips || 0,
      hourly_stats: data.hourlyTrend || [],
      status_distribution: statusMap,
      latency_distribution: latencyDist,
      top_paths: data.topPaths || [],
      top_ips: topIps
    }
  } catch (err) {
    showToast('Failed to load overview data', 'error')
  } finally {
    loadingOverview.value = false
  }
}

watch(overviewRange, () => {
  loadOverview()
})

const getStatusColorClass = (codeStr) => {
  if (codeStr.startsWith('2')) return 'bg-emerald-500'
  if (codeStr.startsWith('3')) return 'bg-blue-500'
  if (codeStr.startsWith('4')) return 'bg-amber-500'
  if (codeStr.startsWith('5')) return 'bg-red-500'
  return 'bg-zinc-500'
}

// --- Tab 2: Access Log ---
const accessLogs = ref([])
const accessTotal = ref(0)
const accessPage = ref(1)
const accessPageSize = ref(20)
const loadingAccess = ref(false)
const expandedLog = ref(null)

const accessFilters = ref({
  ip: '',
  method: '',
  path: '',
  minStatus: '',
  maxStatus: '',
  minCost: ''
})

const autoRefreshAccess = ref(false)
let accessTimer = null

const buildAccessQuery = () => {
  const params = new URLSearchParams()
  params.append('page', accessPage.value)
  params.append('size', accessPageSize.value)
  if (accessFilters.value.ip) params.append('ip', accessFilters.value.ip)
  if (accessFilters.value.method) params.append('method', accessFilters.value.method)
  if (accessFilters.value.path) params.append('path', accessFilters.value.path)
  if (accessFilters.value.minStatus) params.append('minStatus', accessFilters.value.minStatus)
  if (accessFilters.value.maxStatus) params.append('maxStatus', accessFilters.value.maxStatus)
  if (accessFilters.value.minCost) params.append('minCost', accessFilters.value.minCost)
  return params.toString()
}

const loadAccessLogs = async () => {
  loadingAccess.value = true
  try {
    const data = await request(`/api/logs/access?${buildAccessQuery()}`)
    accessLogs.value = data.list || data.items || data || []
    accessTotal.value = data.total || 0
  } catch (err) {
    showToast('Failed to load access logs', 'error')
  } finally {
    loadingAccess.value = false
  }
}

const resetAccessFilters = () => {
  accessFilters.value = {
    ip: '', method: '', path: '', minStatus: '', maxStatus: '', minCost: ''
  }
  accessPage.value = 1
  loadAccessLogs()
}

watch(autoRefreshAccess, (val) => {
  if (val) {
    accessTimer = setInterval(() => {
      loadAccessLogs()
    }, 10000)
  } else {
    clearInterval(accessTimer)
  }
})

onUnmounted(() => {
  if (accessTimer) clearInterval(accessTimer)
})

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


// --- Tab 3: Runtime Log ---
const runtimeLogs = ref([])
const runtimeKeyword = ref('')
const runtimeLines = ref(200)
const loadingRuntime = ref(false)
const terminalRef = ref(null)

const loadRuntimeLogs = async () => {
  loadingRuntime.value = true
  try {
    let url = `/api/logs/tail?lines=${runtimeLines.value}`
    if (runtimeKeyword.value) {
      url += `&keyword=${encodeURIComponent(runtimeKeyword.value)}`
    }
    const data = await request(url)
    // Assume data is an array of strings, or an object with a 'lines' array
    runtimeLogs.value = Array.isArray(data) ? data : (data.lines || [])
    
    // Auto scroll to bottom
    nextTick(() => {
      if (terminalRef.value) {
        terminalRef.value.scrollTop = terminalRef.value.scrollHeight
      }
    })
  } catch (err) {
    showToast('Failed to tail runtime logs', 'error')
  } finally {
    loadingRuntime.value = false
  }
}

const escapeHtml = (unsafe) => {
    return (unsafe || '').toString()
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

const highlightLogLine = (line) => {
  let safeLine = escapeHtml(line)
  
  // Coloring based on log level (ERROR, WARN, INFO)
  let classPrefix = ''
  if (safeLine.includes('ERROR') || safeLine.includes('Exception') || safeLine.includes('FATAL')) {
    classPrefix = '<span class="text-red-400">'
  } else if (safeLine.includes('WARN')) {
    classPrefix = '<span class="text-amber-400">'
  } else if (safeLine.includes('INFO')) {
    classPrefix = '<span class="text-zinc-300">'
  } else if (safeLine.includes('DEBUG')) {
    classPrefix = '<span class="text-zinc-500">'
  } else {
    classPrefix = '<span>'
  }
  
  if (runtimeKeyword.value) {
    const safeKw = escapeHtml(runtimeKeyword.value)
    // Simple replace (case sensitive to preserve exact HTML)
    const regex = new RegExp(`(${safeKw.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')})`, 'gi')
    safeLine = safeLine.replace(regex, '<span class="bg-yellow-500/30 text-yellow-200">$1</span>')
  }
  
  return `${classPrefix}${safeLine}</span>`
}

// --- Watch Tab Change ---
watch(activeTab, (newTab) => {
  if (newTab === 0 && !overviewData.value) {
    loadOverview()
  } else if (newTab === 1 && accessLogs.value.length === 0) {
    loadAccessLogs()
  } else if (newTab === 2 && runtimeLogs.value.length === 0) {
    loadRuntimeLogs()
  }
})

// Initialize
onMounted(() => {
  loadOverview()
})

</script>


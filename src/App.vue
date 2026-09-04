<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import QRCode from 'qrcode'
import {
  LayoutDashboard, KeyRound, Link2, Image as ImageIcon,
  Plus, RefreshCw, Copy, Check, Trash2, LogOut, Power, Wallet,
  QrCode as QrCodeIcon, BarChart3, Upload,
  ArrowRight, Shield, Newspaper, Pencil, UserRound, Heart, Send, Tag, BookOpen,
  Calendar, CheckCircle2, ExternalLink, MessageSquare, MessageCircle
} from 'lucide-vue-next'

const loggedIn = ref(Boolean(localStorage.getItem('servicehub_token')))
const username = ref(localStorage.getItem('servicehub_username') || '')
const password = ref(localStorage.getItem('servicehub_password') || '')
const rememberPwd = ref(Boolean(localStorage.getItem('servicehub_password')))
const loginSubmitting = ref(false)

const overview = ref(null)
const tokens = ref([])
const files = ref([])
const links = ref([])
const activeView = ref('overview')

// Token creation state
const tokenName = ref('')
const validDays = ref(30)
const tokenType = ref('FILEHUB')
const maxUses = ref(0) // Added max uses field
const tokenDialogVisible = ref(false)
const tokenSubmitting = ref(false)
const loading = ref(false)
const copiedMap = ref(new Map())

const pageSize = 12
const tokenPage = ref(1)
const tokenTotal = ref(0)
const linkPage = ref(1)
const linkTotal = ref(0)
const filePage = ref(1)
const fileTotal = ref(0)

// Link creation state
const linkLoading = ref(false)
const linkDialogVisible = ref(false)
const linkSubmitting = ref(false)
const linkTarget = ref('')
const linkRemark = ref('')
const linkCode = ref('')
const linkValidDays = ref(0)

// Link stats modal
const statsVisible = ref(false)
const statsLoading = ref(false)
const statsLink = ref(null)
const statsTotal = ref(0)
const statsDaily = ref([])

// QR Code modal
const qrDialogVisible = ref(false)
const qrLink = ref(null)
const qrDataUrl = ref('')

// Image file state
const fileLoading = ref(false)
const fileUploading = ref(false)
const fileInput = ref(null)

// 动态管理 state
const posts = ref([])
const postsLoading = ref(false)
const postDialogVisible = ref(false)
const postSubmitting = ref(false)
const postEditing = ref(null)
const postContent = ref('')
const postMediaType = ref('')
const postMediaUrls = ref([]) // 图片模式下的多张图链接
const postCategoryId = ref('notes')
const postCategoryName = ref('随笔')
const postCategories = [
  { id: 'notes', name: '随笔', hint: '记录想法与日常' },
  { id: 'food', name: '美食', hint: '好吃的，值得分享' },
  { id: 'scenery', name: '风景', hint: '沿途所见与旅行' }
]

// 更新日志 state
const releaseLogs = ref([])
const releaseLoading = ref(false)
const releaseDialogVisible = ref(false)
const releaseSubmitting = ref(false)
const releaseEditing = ref(null)
const releaseTitle = ref('')
const releaseVersion = ref('')
const releaseSummary = ref('')
const releaseContent = ref('')
const websiteSection = ref('posts')

// 评论审核 state
const comments = ref([])
const commentsLoading = ref(false)
const commentPage = ref(1)
const commentTotal = ref(0)

// 站点资料 state
const profileDialogVisible = ref(false)
const profileLoading = ref(false)
const profileSaving = ref(false)
const siteProfile = ref(null)
const siteSocials = ref([])
const socialSaving = ref(null)

// 通用图片上传（动态媒体 / 头像 / 社媒二维码共用一个隐藏 input）
const uploadTarget = ref('')
const uploading = ref(false)
const mediaInput = ref(null)

// --- Computed & Helpers ---
const isExpired = t => t.expiresAt && new Date(t.expiresAt) <= new Date()
const linkExpired = l => l.expiresAt && new Date(l.expiresAt) <= new Date()

const activeTokens = computed(() => tokens.value.filter(t => t.status === 1 && !isExpired(t)))
const activeLinks = computed(() => links.value.filter(l => l.status === 1 && !linkExpired(l)))

// 凭证状态文案与样式
const tokenStatus = t => (t.status !== 1 ? '已禁用' : isExpired(t) ? '已过期' : '启用')
const tokenStatusClass = t => (t.status !== 1
  ? 'bg-gray-100 text-gray-500 border-gray-200'
  : isExpired(t) ? 'bg-red-50 text-red-500 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100')

const totalStorageUsed = computed(() => {
  const bytes = files.value.reduce((acc, curr) => acc + (curr.fileSize || 0), 0)
  return formatSize(bytes)
})

const navItems = computed(() => [
  { id: 'overview', label: '仪表盘', icon: LayoutDashboard },
  { id: 'tokens', label: '访问凭证', icon: KeyRound },
  { id: 'links', label: '短链路由', icon: Link2 },
  { id: 'files', label: '媒体资产', icon: ImageIcon },
  { id: 'posts', label: '网站管理', icon: Newspaper }
])

const meta = computed(() => ({
  overview: { title: '工作空间', desc: '全局系统运行状态与服务用量概览。', badge: '01 / WORKSPACE' },
  tokens: { title: '访问凭证', desc: '管理与分发用于调用 API 的安全访问凭证。', badge: '02 / ACCESS TOKENS' },
  links: { title: '短链路由', desc: '创建、管理短链接并实时追踪访问数据。', badge: '03 / ROUTING' },
  files: { title: '媒体资产', desc: '统一管理云端托管的静态文件与图片资源。', badge: '04 / MEDIA ASSETS' },
  posts: { title: '网站管理', desc: '统一维护个人网站资料、信息流与更新日志。', badge: '05 / TOC WEBSITE' }
})[activeView.value])

const shortUrl = l => `${location.origin}/s/${l.code}`
const maxVisits = computed(() => Math.max(...statsDaily.value.map(d => Number(d.visits || 0)), 1))

// 个人资产看板跳转地址
const ASSET_DASHBOARD_URL = 'http://127.0.0.1:8001/'

// --- API Request Layer ---
const request = async (url, options = {}) => {
  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {})
  }
  const token = localStorage.getItem('servicehub_token')
  if (token) headers.Authorization = `Bearer ${token}`
  const r = await fetch(url, { ...options, headers })
  const renewed = r.headers.get('X-Renewed-Token')
  if (renewed) localStorage.setItem('servicehub_token', renewed)
  const d = await r.json().catch(() => ({ message: '服务响应格式错误' }))
  if (r.status === 401) {
    localStorage.removeItem('servicehub_token')
    loggedIn.value = false
    throw Error('登录状态已失效，请重新登录')
  }
  if (!r.ok || d.code !== 0) throw Error(d.message || '请求失败')
  return d.data
}

// 登录管理后台，按勾选决定是否记住密码
const login = async () => {
  if (!username.value.trim() || !password.value) return ElMessage.warning('请输入账号和密码')
  loginSubmitting.value = true
  try {
    const d = await request('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username: username.value.trim(), password: password.value })
    })
    localStorage.setItem('servicehub_username', username.value.trim())
    if (rememberPwd.value) localStorage.setItem('servicehub_password', password.value)
    else localStorage.removeItem('servicehub_password')
    localStorage.setItem('servicehub_token', d.token)
    loggedIn.value = true
    password.value = ''
    loadOverview(); loadTokens(); loadLinks(); loadFiles()
    ElMessage.success('欢迎回来')
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    loginSubmitting.value = false
  }
}

const logout = async () => {
  try { await request('/api/admin/logout', { method: 'POST' }) } catch (_) {}
  localStorage.removeItem('servicehub_token')
  loggedIn.value = false
  password.value = localStorage.getItem('servicehub_password') || ''
  ElMessage.success('已退出登录')
}

// --- Data Loaders ---
const loadOverview = async () => {
  try {
    overview.value = await request('/api/overview')
  } catch (e) {
    ElMessage.error(e.message)
  }
}

const loadTokens = async () => {
  loading.value = true
  try {
    const res = await request(`/api/tokens?page=${tokenPage.value}&size=${pageSize}`)
    tokens.value = res.list || res.records || res || []
    tokenTotal.value = res.total || tokens.value.length || 0
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    loading.value = false
  }
}

const loadLinks = async () => {
  linkLoading.value = true
  try {
    const res = await request(`/api/links?page=${linkPage.value}&size=${pageSize}`)
    links.value = res.list || res.records || res || []
    linkTotal.value = res.total || links.value.length || 0
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    linkLoading.value = false
  }
}

const loadFiles = async () => {
  fileLoading.value = true
  try {
    const res = await request(`/api/files?page=${filePage.value}&size=${pageSize}`)
    files.value = res.list || res.records || res || []
    fileTotal.value = res.total || files.value.length || 0
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    fileLoading.value = false
  }
}

const loadPosts = async () => {
  postsLoading.value = true
  try {
    const res = await request('/api/site/posts')
    posts.value = res.list || res.records || res || []
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    postsLoading.value = false
  }
}

// 拉取更新日志
const loadReleases = async () => {
  releaseLoading.value = true
  try {
    const res = await request('/api/site/releases')
    releaseLogs.value = res.list || res.records || res || []
  } catch (e) { ElMessage.error(e.message) } finally { releaseLoading.value = false }
}

// 评论管理
const loadComments = async () => {
  commentsLoading.value = true
  try {
    const res = await request(`/api/site/comments/page?page=${commentPage.value}&size=${pageSize}`)
    comments.value = res.list || res.records || res || []
    commentTotal.value = res.total || 0
  } catch (e) { ElMessage.error(e.message) } finally { commentsLoading.value = false }
}

const updateCommentStatus = async (comment, status) => {
  try {
    await request(`/api/site/comments/${comment.comment.id}/status`, { method: 'POST', body: JSON.stringify({ status }) })
    await loadComments()
    ElMessage.success(status === 1 ? '评论已通过' : '评论已驳回')
  } catch (e) { ElMessage.error(e.message) }
}

const deleteComment = async (comment) => {
  try {
    await ElMessageBox.confirm('确认删除这条评论？', '删除评论', { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' })
    await request(`/api/site/comments/${comment.comment.id}`, { method: 'DELETE' })
    await loadComments()
    ElMessage.success('评论已删除')
  } catch (e) {}
}

// 打开更新日志编辑弹窗
const openReleaseDialog = log => {
  releaseEditing.value = log || null
  releaseTitle.value = log?.title || ''
  releaseVersion.value = log?.version || ''
  releaseSummary.value = log?.summary || ''
  releaseContent.value = log?.content || ''
  releaseDialogVisible.value = true
}

// 保存更新日志
const saveRelease = async () => {
  if (!releaseTitle.value.trim()) return ElMessage.warning('请输入更新标题')
  releaseSubmitting.value = true
  try {
    const payload = { title: releaseTitle.value.trim(), version: releaseVersion.value.trim(), summary: releaseSummary.value.trim(), content: releaseContent.value.trim() }
    if (releaseEditing.value) await request(`/api/site/releases/${releaseEditing.value.id}`, { method: 'POST', body: JSON.stringify(payload) })
    else await request('/api/site/releases', { method: 'POST', body: JSON.stringify(payload) })
    releaseDialogVisible.value = false
    await loadReleases()
    ElMessage.success(releaseEditing.value ? '更新日志已保存' : '更新日志已发布')
  } catch (e) { ElMessage.error(e.message) } finally { releaseSubmitting.value = false }
}

// 切换更新日志发布状态
const toggleRelease = async log => {
  try { await request(`/api/site/releases/${log.id}/status`, { method: 'POST', body: JSON.stringify({ status: log.status === 1 ? 0 : 1 }) }); await loadReleases(); ElMessage.success(log.status === 1 ? '更新日志已下架' : '更新日志已发布') } catch (e) { ElMessage.error(e.message) }
}

// 删除更新日志
const deleteRelease = async log => {
  try { await ElMessageBox.confirm('确认删除这条更新日志？删除后不可恢复。', '删除更新日志', { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning' }); await request(`/api/site/releases/${log.id}`, { method: 'DELETE' }); await loadReleases(); ElMessage.success('更新日志已删除') } catch (e) {}
}

const selectView = v => {
  activeView.value = v
  if (v === 'overview') { loadOverview(); loadTokens(); loadLinks(); loadFiles() }
  if (v === 'files') loadFiles()
  if (v === 'tokens') loadTokens()
  if (v === 'links') loadLinks()
  if (v === 'posts') { loadPosts(); loadReleases(); loadComments() }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const refreshView = async () => {
  if (activeView.value === 'overview') {
    await loadOverview(); await Promise.all([loadTokens(), loadLinks(), loadFiles()])
  } else if (activeView.value === 'files') {
    await loadFiles()
  } else if (activeView.value === 'tokens') {
    await loadTokens()
  } else if (activeView.value === 'posts') {
    await Promise.all([loadPosts(), loadReleases(), loadComments()])
  } else {
    await loadLinks()
  }
  ElMessage.success('数据已同步')
}

// --- Token Actions ---
const openCreateDialog = () => {
  tokenName.value = ''
  validDays.value = 30
  tokenType.value = 'FILEHUB'
  maxUses.value = 0 // reset max uses
  tokenDialogVisible.value = true
}

const createToken = async () => {
  if (!tokenName.value.trim()) return ElMessage.warning('请输入凭证名称')
  tokenSubmitting.value = true
  try {
    await request('/api/tokens', {
      method: 'POST',
      body: JSON.stringify({ 
        tokenName: tokenName.value.trim(), 
        tokenType: tokenType.value, 
        validDays: Number(validDays.value),
        maxUses: Number(maxUses.value) || 0
      })
    })
    tokenDialogVisible.value = false
    await loadTokens()
    loadOverview()
    ElMessage.success('凭证创建成功')
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    tokenSubmitting.value = false
  }
}

const deleteToken = async t => {
  try {
    await ElMessageBox.confirm(`确认吊销凭证 "${t.tokenName}" 吗？此操作无法撤销。`, '吊销凭证', {
      confirmButtonText: '确认吊销', cancelButtonText: '取消', type: 'warning'
    })
    await request(`/api/tokens/${t.id}`, { method: 'DELETE' })
    await loadTokens()
    loadOverview()
    ElMessage.success('凭证已吊销')
  } catch (e) {}
}

// 切换凭证启用状态
const toggleToken = async t => {
  try {
    await request(`/api/tokens/${t.id}/status`, { method: 'POST', body: JSON.stringify({ status: t.status === 1 ? 0 : 1 }) })
    await loadTokens()
    loadOverview()
    ElMessage.success(t.status === 1 ? '凭证已禁用' : '凭证已启用')
  } catch (e) {
    ElMessage.error(e.message)
  }
}

// --- Shortlink Actions ---
const openLinkDialog = () => {
  linkTarget.value = ''; linkRemark.value = ''; linkCode.value = ''; linkValidDays.value = 0
  linkDialogVisible.value = true
}

const generateRandomCode = () => { linkCode.value = Math.random().toString(36).substring(2, 7) }

const createLink = async () => {
  if (!linkTarget.value.trim()) return ElMessage.warning('目标链接不能为空')
  linkSubmitting.value = true
  try {
    const d = await request('/api/links', {
      method: 'POST',
      body: JSON.stringify({
        targetUrl: linkTarget.value.trim(), code: linkCode.value.trim() || undefined,
        remark: linkRemark.value.trim() || undefined, validDays: Number(linkValidDays.value)
      })
    })
    linkDialogVisible.value = false
    await loadLinks()
    loadOverview()
    ElMessage.success(`短链路由创建成功`)
    copyText(shortUrl(d), '链接已复制到剪贴板')
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    linkSubmitting.value = false
  }
}

const deleteLink = async l => {
  try {
    await ElMessageBox.confirm(`确认删除此短链路由？其访问统计数据也将被一并清除。`, '删除短链', { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning' })
    await request(`/api/links/${l.id}`, { method: 'DELETE' })
    await loadLinks()
    loadOverview()
    ElMessage.success('路由已删除')
  } catch (e) {}
}

const showStats = async l => {
  statsLink.value = l; statsVisible.value = true; statsLoading.value = true
  try {
    const s = await request(`/api/links/${l.id}/stats`)
    statsTotal.value = s.total; statsDaily.value = s.daily || []
  } catch (e) { ElMessage.error(e.message) } finally { statsLoading.value = false }
}

const openQrModal = async l => {
  qrLink.value = l; qrDialogVisible.value = true
  try {
    qrDataUrl.value = await QRCode.toDataURL(shortUrl(l), { width: 280, margin: 2, color: { dark: '#0A0A0A', light: '#ffffff' } })
  } catch (err) { ElMessage.error('二维码生成失败') }
}

// --- Image Actions ---
const uploadFile = async e => {
  const f = e.target.files?.[0]
  e.target.value = ''
  if (!f) return
  const b = new FormData(); b.append('file', f)
  fileUploading.value = true
  try {
    await request('/api/files/upload', { method: 'POST', body: b })
    await loadFiles()
    loadOverview()
    ElMessage.success('文件上传成功')
  } catch (x) { ElMessage.error(x.message) } finally { fileUploading.value = false }
}

const deleteFile = async f => {
  try {
    await ElMessageBox.confirm(`确认删除文件 "${f.originalName}"？`, '删除文件', { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning' })
    await request(`/api/files/${f.id}`, { method: 'DELETE' })
    await loadFiles()
    loadOverview()
    ElMessage.success('文件已删除')
  } catch (e) {}
}

// --- 动态管理 Actions ---
// 打开发布/编辑动态弹窗（传入动态对象为编辑模式）
const openPostDialog = p => {
  postEditing.value = p || null
  postContent.value = p ? (p.content || '') : ''
  postMediaType.value = (p && p.media && p.media.some(m => m.mediaType === 'image')) ? 'image' : ''
  postMediaUrls.value = p && p.media ? p.media.filter(m => m.mediaType === 'image').map(m => m.mediaUrl) : []
  postCategoryId.value = p?.category?.id || p?.categoryId || 'notes'
  postCategoryName.value = p?.category?.name || p?.categoryName || postCategories.find(c => c.id === postCategoryId.value)?.name || '随笔'
  postDialogVisible.value = true
}

// 汇总当前提交的图片链接
const collectMediaUrls = () => [...postMediaUrls.value]

// 发布或保存动态
const savePost = async () => {
  const urls = collectMediaUrls()
  if (!postContent.value.trim() && !urls.length) return ElMessage.warning('写点内容，或添加图片再发布')
  postSubmitting.value = true
  try {
    const payload = { content: postContent.value.trim() || null, mediaType: urls.length ? 'image' : null, mediaUrls: urls, categoryId: postCategoryId.value, categoryName: postCategoryName.value }
    if (postEditing.value) await request(`/api/site/posts/${postEditing.value.id}`, { method: 'POST', body: JSON.stringify(payload) })
    else await request('/api/site/posts', { method: 'POST', body: JSON.stringify(payload) })
    postDialogVisible.value = false
    await loadPosts()
    ElMessage.success(postEditing.value ? '动态已更新' : '动态已发布')
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    postSubmitting.value = false
  }
}

// 切换动态发布/下架状态
const togglePost = async p => {
  try {
    await request(`/api/site/posts/${p.id}/status`, { method: 'POST', body: JSON.stringify({ status: p.status === 1 ? 0 : 1 }) })
    await loadPosts()
    ElMessage.success(p.status === 1 ? '动态已下架' : '动态已重新发布')
  } catch (e) {
    ElMessage.error(e.message)
  }
}

const deletePost = async p => {
  try {
    await ElMessageBox.confirm('确认删除这条动态？删除后不可恢复。', '删除动态', { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning' })
    await request(`/api/site/posts/${p.id}`, { method: 'DELETE' })
    await loadPosts()
    ElMessage.success('动态已删除')
  } catch (e) {}
}

// --- 站点资料 Actions ---
// 拉取站点资料与社媒名片
const loadSiteAdmin = async () => {
  const d = await request('/api/site/profile')
  siteProfile.value = d.profile || {}
  siteSocials.value = d.socials || []
}

// 打开站点资料弹窗并加载数据
const openProfileDialog = async () => {
  profileDialogVisible.value = true
  profileLoading.value = true
  try {
    await loadSiteAdmin()
  } catch (e) {
    ElMessage.error(e.message)
    profileDialogVisible.value = false
  } finally {
    profileLoading.value = false
  }
}

// 保存站点资料
const saveProfile = async () => {
  if (!siteProfile.value || !siteProfile.value.name?.trim()) return ElMessage.warning('名称不能为空')
  profileSaving.value = true
  try {
    const p = siteProfile.value
    await request('/api/site/profile', {
      method: 'POST',
      body: JSON.stringify({
        name: p.name.trim(), handle: (p.handle || '').trim(), bio: p.bio || '', avatarUrl: p.avatarUrl || ''
      })
    })
    ElMessage.success('站点资料已更新')
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    profileSaving.value = false
  }
}

// 新增一行空白社媒名片（未入库，保存时才提交）
const addSocialRow = () => {
  siteSocials.value.push({ platform: '', iconName: '', url: '', qrCodeUrl: '', sortOrder: siteSocials.value.length + 1, status: 1 })
}

// 保存单条社媒名片（有 id 为更新，否则新增）
const saveSocial = async s => {
  if (!s.platform?.trim()) return ElMessage.warning('平台名称不能为空')
  if (!s.iconName?.trim()) return ElMessage.warning('图标名不能为空')
  socialSaving.value = s.id || `new-${siteSocials.value.indexOf(s)}`
  try {
    const payload = {
      platform: s.platform.trim(), iconName: s.iconName.trim(),
      url: (s.url || '').trim(), qrCodeUrl: (s.qrCodeUrl || '').trim(),
      sortOrder: Number(s.sortOrder) || 0, status: s.status === 1 ? 1 : 0
    }
    if (s.id) await request(`/api/site/socials/${s.id}`, { method: 'POST', body: JSON.stringify(payload) })
    else await request('/api/site/socials', { method: 'POST', body: JSON.stringify(payload) })
    ElMessage.success('社媒名片已保存')
    await loadSiteAdmin()
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    socialSaving.value = null
  }
}

// 删除社媒名片（未入库的新行仅本地移除）
const deleteSocial = async s => {
  try {
    if (s.id) {
      await ElMessageBox.confirm(`确认删除名片 "${s.platform}"？`, '删除名片', { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning' })
      await request(`/api/site/socials/${s.id}`, { method: 'DELETE' })
      await loadSiteAdmin()
    } else {
      siteSocials.value.splice(siteSocials.value.indexOf(s), 1)
    }
    ElMessage.success('名片已删除')
  } catch (e) {}
}

// --- 通用图片上传（按 uploadTarget 分发到对应字段）---
const pickUpload = target => {
  uploadTarget.value = target
  if (target === 'post') {
    postMediaType.value = 'image'
  }
  mediaInput.value?.click()
}

const handleUpload = async e => {
  const fs = [...(e.target.files || [])]
  e.target.value = ''
  if (!fs.length) return
  uploading.value = true
  try {
    const urls = []
    for (const f of fs) {
      const b = new FormData(); b.append('file', f)
      const d = await request('/api/files/upload', { method: 'POST', body: b })
      urls.push(d.fileUrl)
    }
    const target = uploadTarget.value
    if (target === 'post') {
      const room = 9 - postMediaUrls.value.length
      if (room <= 0) ElMessage.warning('图片最多 9 张，多出的没有添加')
      else postMediaUrls.value.push(...urls.slice(0, room))
    } else if (target === 'avatar') {
      siteProfile.value && (siteProfile.value.avatarUrl = urls[0])
    } else if (target.startsWith('qr-')) {
      const row = siteSocials.value[Number(target.slice(3))]
      row && (row.qrCodeUrl = urls[0])
    }
    ElMessage.success('图片已上传，记得点击保存')
  } catch (x) {
    ElMessage.error(x.message)
  } finally {
    uploading.value = false
  }
}

// 动态媒体类型文案（含图片数量）
const postMediaLabel = p => {
  if (!p.media || !p.media.length) return '纯文字'
  return p.media[0].mediaType === 'image' ? `图片 ×${p.media.length}` : '视频'
}

// 动态时间展示
const formatDateTime = v => (v ? new Date(v).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '')

// --- Utilities ---
const copyText = async (v, tip = '已复制到剪贴板', key = null) => {
  try {
    await navigator.clipboard.writeText(v)
    if (key) {
      copiedMap.value.set(key, true)
      setTimeout(() => copiedMap.value.delete(key), 2000)
    }
    ElMessage.success({ message: tip, duration: 1500 })
  } catch (_) { ElMessage.error('复制失败') }
}
const copyToken = (v, id) => copyText(v, '凭证已复制到剪贴板', `token-${id}`)
const formatExpiry = v => (v ? new Date(v).toLocaleDateString('zh-CN') : '永久有效')
const formatSize = v => {
  if (!v) return '0 KB'
  const u = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(v) / Math.log(1024)), 3)
  return `${(v / 1024 ** i).toFixed(1)} ${u[i]}`
}
const maskToken = v => (v && v.length > 14 ? `${v.slice(0, 8)}......${v.slice(-4)}` : '......')

onMounted(() => {
  if (loggedIn.value) {
    loadOverview(); loadTokens(); loadLinks(); loadFiles(); loadPosts()
  }
})
</script>

<template>
  <!-- 登录页 -->
  <main v-if="!loggedIn" class="min-h-screen bg-[#F8F9FA] text-zinc-900 font-sans flex items-center justify-center px-6 selection:bg-zinc-900 selection:text-white relative overflow-hidden">
    <!-- Ambient background soft spots -->
    <div class="absolute -top-40 -left-40 w-96 h-96 bg-zinc-200/50 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-zinc-200/50 rounded-full blur-3xl pointer-events-none"></div>

    <form @submit.prevent="login" class="w-full max-w-md bg-white/90 backdrop-blur-2xl border border-black/[0.06] rounded-[2.5rem] p-10 md:p-12 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.06)] relative z-10">
      <div class="w-14 h-14 rounded-2xl bg-zinc-900 text-white flex items-center justify-center font-serif text-2xl mx-auto mb-6 shadow-md shadow-zinc-900/20">S</div>
      <h1 class="text-3xl md:text-4xl font-serif font-medium tracking-tight text-center text-zinc-900 mb-2">欢迎回来</h1>
      <p class="text-zinc-400 text-center font-normal text-sm mb-9">ServiceHub 管理控制台</p>
      
      <div class="space-y-5 mb-7">
        <div>
          <label class="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2">管理员账号</label>
          <input v-model="username" type="text" autocomplete="username" class="editorial-input" placeholder="输入管理员账号" />
        </div>
        <div>
          <label class="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2">管理员密码</label>
          <input v-model="password" type="password" autocomplete="current-password" class="editorial-input" placeholder="输入管理员密码" />
        </div>
      </div>

      <div class="flex items-center justify-between mb-8">
        <label class="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-zinc-500 hover:text-zinc-800 transition-colors select-none">
          <input type="checkbox" v-model="rememberPwd" class="h-4 w-4 rounded-md border-zinc-300 accent-zinc-900 cursor-pointer" />
          记住密码
        </label>
        <span class="text-[11px] text-zinc-400 font-mono tracking-wider">SECURE · ADMIN</span>
      </div>

      <button type="submit" :disabled="loginSubmitting" class="w-full bg-zinc-900 text-white rounded-full py-4 text-sm font-semibold tracking-wider hover:bg-zinc-800 active:scale-[0.99] transition-all shadow-xl shadow-zinc-900/15 disabled:opacity-50">
        {{ loginSubmitting ? '验证登录中...' : '登 录' }}
      </button>
    </form>
  </main>

  <!-- 控制台 -->
  <div v-else class="min-h-screen bg-[#F8F9FA] text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white">
    
    <!-- Floating 'Dynamic Island' Navigation -->
    <header class="fixed top-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-4">
      <div class="pointer-events-auto bg-white/85 backdrop-blur-2xl shadow-[0_12px_36px_-6px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.04)] p-1.5 rounded-full flex items-center gap-1.5 transition-all hover:bg-white/95">
        
        <!-- User Avatar / Brand -->
        <div class="pl-3.5 pr-2.5 flex items-center gap-2.5 border-r border-black/[0.06]">
          <div class="relative">
            <div class="w-7 h-7 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[11px] font-bold shadow-xs">
              {{ username.charAt(0).toUpperCase() }}
            </div>
            <span class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></span>
          </div>
          <span class="text-xs font-serif font-medium tracking-wide mr-1 hidden md:block text-zinc-800">ServiceHub</span>
        </div>

        <!-- Nav Items -->
        <button
          v-for="item in navItems"
          :key="item.id"
          @click="selectView(item.id)"
          :class="[
            'px-4 md:px-5 py-2 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-2 select-none',
            activeView === item.id 
              ? 'bg-zinc-900 text-white shadow-md shadow-zinc-900/20' 
              : 'text-zinc-500 hover:text-zinc-900 hover:bg-black/[0.04]'
          ]"
        >
          <component :is="item.icon" class="w-3.5 h-3.5" />
          <span class="hidden sm:block tracking-wide">{{ item.label }}</span>
        </button>

        <!-- Actions / Logout -->
        <div class="pl-1.5 pr-1 border-l border-black/[0.06] flex items-center gap-0.5">
          <button @click="refreshView" class="w-8 h-8 rounded-full hover:bg-black/[0.05] text-zinc-400 hover:text-zinc-800 transition-colors flex items-center justify-center" title="同步数据">
            <RefreshCw :class="['w-3.5 h-3.5', loading || linkLoading || fileLoading || postsLoading ? 'animate-spin' : '']" />
          </button>
          <button @click="logout" class="w-8 h-8 rounded-full hover:bg-black/[0.05] text-zinc-400 hover:text-red-600 transition-colors flex items-center justify-center" title="退出登录">
            <LogOut class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content Canvas -->
    <main class="pt-36 pb-32 px-6 md:px-12 max-w-[1400px] mx-auto">
      
      <!-- Spatial Header -->
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-14">
        <div class="max-w-2xl">
          <div class="flex items-center gap-2 mb-3">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <p class="text-[10px] font-bold tracking-[0.25em] uppercase text-zinc-400">{{ meta.badge }}</p>
          </div>
          <h1 class="text-4xl md:text-6xl font-serif font-normal text-zinc-900 tracking-tight mb-3 leading-tight">{{ meta.title }}</h1>
          <p class="text-zinc-500 text-base md:text-lg font-light leading-relaxed">{{ meta.desc }}</p>
        </div>
        
        <!-- Contextual Master Action -->
        <div class="shrink-0 flex items-center gap-3">
          <button v-if="activeView === 'tokens'" @click="openCreateDialog" class="bg-zinc-900 text-white px-7 py-3.5 rounded-full hover:bg-zinc-800 active:scale-95 transition-all shadow-xl shadow-zinc-900/15 flex items-center gap-2.5 font-medium text-xs tracking-wider">
            <Plus class="w-4 h-4" /> 新建凭证
          </button>
          <button v-else-if="activeView === 'links'" @click="openLinkDialog" class="bg-zinc-900 text-white px-7 py-3.5 rounded-full hover:bg-zinc-800 active:scale-95 transition-all shadow-xl shadow-zinc-900/15 flex items-center gap-2.5 font-medium text-xs tracking-wider">
            <Plus class="w-4 h-4" /> 新建路由
          </button>
          <div v-else-if="activeView === 'files'">
            <button @click="fileInput?.click()" :disabled="fileUploading" class="bg-zinc-900 text-white px-7 py-3.5 rounded-full hover:bg-zinc-800 active:scale-95 transition-all shadow-xl shadow-zinc-900/15 flex items-center gap-2.5 font-medium text-xs tracking-wider disabled:opacity-50">
              <Upload class="w-4 h-4" /> {{ fileUploading ? '上传中...' : '上传媒体' }}
            </button>
            <input ref="fileInput" hidden type="file" @change="uploadFile" />
          </div>
          <div v-else-if="activeView === 'posts'" class="flex items-center gap-3">
            <button @click="openProfileDialog()" class="bg-white border border-zinc-200/80 text-zinc-800 px-6 py-3.5 rounded-full hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-all shadow-xs flex items-center gap-2 font-medium text-xs tracking-wider">
              <UserRound class="w-4 h-4" /> 站点资料
            </button>
            <button v-if="websiteSection === 'posts'" @click="openPostDialog()" class="bg-zinc-900 text-white px-7 py-3.5 rounded-full hover:bg-zinc-800 active:scale-95 transition-all shadow-xl shadow-zinc-900/15 flex items-center gap-2.5 font-medium text-xs tracking-wider">
              <Plus class="w-4 h-4" /> 发布动态
            </button>
            <button v-else @click="openReleaseDialog()" class="bg-zinc-900 text-white px-7 py-3.5 rounded-full hover:bg-zinc-800 active:scale-95 transition-all shadow-xl shadow-zinc-900/15 flex items-center gap-2.5 font-medium text-xs tracking-wider">
              <Plus class="w-4 h-4" /> 发布更新
            </button>
          </div>
        </div>
      </div>

      <!-- ==================== 1. OVERVIEW (EDITORIAL BENTO) ==================== -->
      <template v-if="activeView === 'overview'">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10">
          
          <!-- Tokens Card -->
          <div class="md:col-span-5 bg-white rounded-[2.5rem] lg:rounded-[3rem] p-10 md:p-12 shadow-xl shadow-zinc-200/40 border border-zinc-100 flex flex-col justify-between relative overflow-hidden group min-h-[420px] transition-all duration-500 hover:shadow-2xl hover:shadow-zinc-300/50 hover:-translate-y-2">
            
            <div class="relative z-10">
              <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center">
                    <Shield class="w-4 h-4 text-zinc-900" />
                  </div>
                  <p class="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">有效凭证</p>
                </div>
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  ACTIVE
                </span>
              </div>
              <h3 class="text-7xl md:text-8xl font-serif tracking-tighter text-zinc-900 mt-8 mb-4">{{ overview?.activeTokens || activeTokens.length }}</h3>
            </div>
            
            <div class="relative z-10 mt-auto flex flex-col pt-8">
              <div class="h-px w-16 bg-zinc-200 mb-8"></div>
              <div class="flex items-end justify-between">
                <p class="text-zinc-500 font-light text-sm leading-relaxed max-w-[200px]">系统中共颁发了 {{ overview?.totalTokens || tokens.length }} 个安全 API 调用密钥。</p>
                <button @click="selectView('tokens')" class="w-12 h-12 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-400 hover:bg-zinc-900 hover:text-white transition-all duration-300 group-hover:border-zinc-900">
                  <ArrowRight class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <!-- Links Card -->
          <div class="md:col-span-7 bg-white rounded-[2.5rem] lg:rounded-[3rem] p-10 md:p-12 shadow-xl shadow-zinc-200/40 border border-zinc-100 flex flex-col justify-between relative overflow-hidden group min-h-[420px] transition-all duration-500 hover:shadow-2xl hover:shadow-zinc-300/50 hover:-translate-y-2">
            <div class="flex justify-between items-start">
              <div>
                <div class="flex items-center gap-3 mb-6">
                  <div class="w-10 h-10 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center">
                    <Link2 class="w-4 h-4 text-zinc-900" />
                  </div>
                  <p class="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">有效短链路由</p>
                </div>
                <h3 class="text-7xl md:text-8xl font-serif tracking-tighter text-zinc-900 mt-8 mb-4">{{ overview?.activeLinks || activeLinks.length }}</h3>
              </div>
              <div class="w-16 h-16 rounded-[2rem] bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-300 group-hover:bg-zinc-900 group-hover:text-white transition-all duration-500">
                <Link2 class="w-6 h-6" />
              </div>
            </div>
            
            <div class="mt-auto flex flex-col pt-8">
              <div class="h-px w-16 bg-zinc-200 mb-8"></div>
              <div class="flex items-end justify-between">
                <p class="text-zinc-500 font-light text-base">
                  累计已处理 <span class="text-zinc-900 font-mono font-bold mx-1 text-xl">{{ links.reduce((s, i) => s + (i.visitCount || 0), 0) }}</span> 次成功重定向
                </p>
                <button @click="selectView('links')" class="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 flex items-center gap-2 transition-colors">
                  流量分析 <ArrowRight class="w-3.5 h-3.5"/>
                </button>
              </div>
            </div>
          </div>

          <!-- Media Card -->
          <div class="md:col-span-8 bg-white rounded-[2.5rem] lg:rounded-[3rem] p-10 md:p-12 shadow-xl shadow-zinc-200/40 border border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-10 hover:shadow-2xl hover:shadow-zinc-300/50 transition-all duration-500 hover:-translate-y-2 group min-h-[280px]">
            <div>
              <div class="flex items-center gap-3 mb-6">
                <div class="w-10 h-10 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center">
                  <ImageIcon class="w-4 h-4 text-zinc-900" />
                </div>
                <p class="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">存储用量</p>
              </div>
              <div class="flex items-baseline gap-4 mt-6">
                <h3 class="text-5xl md:text-6xl font-serif tracking-tighter text-zinc-900">{{ totalStorageUsed }}</h3>
                <span class="text-lg text-zinc-400 font-light">/ {{ overview?.totalFiles || files.length }} 个文件</span>
              </div>
            </div>
            
            <!-- Mini asset preview grid -->
            <div class="flex items-center gap-4 overflow-hidden mt-6 md:mt-0">
               <div v-for="f in files.slice(0, 3)" :key="f.id" class="group/img w-28 h-28 rounded-[2rem] bg-zinc-50 overflow-hidden shrink-0 border border-zinc-200/80 flex items-center justify-center shadow-sm transition-transform duration-300 hover:scale-105 hover:shadow-md">
                 <img v-if="f.fileUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i)" :src="f.fileUrl" class="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-500" />
                 <ImageIcon v-else class="w-8 h-8 text-zinc-300" />
               </div>
               <button @click="selectView('files')" v-if="files.length > 3" class="w-28 h-28 rounded-[2rem] bg-zinc-50 border border-zinc-200/80 border-dashed flex flex-col items-center justify-center text-zinc-400 hover:text-zinc-900 hover:border-zinc-900 transition-colors shrink-0 group-hover:border-zinc-300">
                 <span class="font-mono text-xl font-bold mb-1">+{{ files.length - 3 }}</span>
                 <span class="text-[9px] uppercase tracking-[0.2em] font-semibold">全部媒体</span>
               </button>
            </div>
          </div>

          <!-- Asset Dashboard Link Card -->
          <a :href="ASSET_DASHBOARD_URL" target="_blank" rel="noreferrer" class="md:col-span-4 bg-zinc-900 text-white rounded-[2.5rem] lg:rounded-[3rem] p-10 flex flex-col justify-between relative overflow-hidden group min-h-[280px] shadow-2xl shadow-zinc-900/20 border border-zinc-800 hover:-translate-y-2 transition-all duration-500">
            <div class="absolute -right-16 -bottom-16 w-56 h-56 bg-zinc-800 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000 ease-out pointer-events-none"></div>
            <div class="relative z-10">
              <div class="flex items-center gap-3 mb-6">
                <div class="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                  <Wallet class="w-4 h-4 text-white/80" />
                </div>
                <p class="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">外部集成</p>
              </div>
              <h3 class="text-3xl md:text-4xl font-serif tracking-tight text-white mt-4">个人资产看板</h3>
            </div>
            <div class="relative z-10 mt-auto flex items-center justify-between pt-8">
              <p class="text-zinc-400 font-light text-sm">打开独立看板面板</p>
              <div class="w-12 h-12 rounded-full border border-zinc-700 text-white flex items-center justify-center group-hover:bg-white group-hover:text-zinc-900 transition-all duration-300">
                <ArrowRight class="w-4 h-4" />
              </div>
            </div>
          </a>

        </div>
      </template>

      <!-- ==================== 2. TOKENS (EDITORIAL LIST) ==================== -->
      <template v-if="activeView === 'tokens'">
        <div class="bg-white rounded-[2.5rem] lg:rounded-[3rem] shadow-xl shadow-zinc-200/40 border border-zinc-100 overflow-hidden flex flex-col min-h-[420px]">
          
          <!-- Header -->
          <div class="hidden md:grid grid-cols-12 gap-4 px-10 py-4.5 border-b border-zinc-100 bg-zinc-50/70 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
            <div class="col-span-3 text-left">凭证名称</div>
            <div class="col-span-2 text-center">授权范围</div>
            <div class="col-span-3 text-center">安全密钥</div>
            <div class="col-span-1 text-center">调用额度</div>
            <div class="col-span-1 text-center">状态</div>
            <div class="col-span-2 text-right">有效期 / 操作</div>
          </div>

          <!-- List Body -->
          <div class="flex-1 divide-y divide-zinc-100/70">
            <div v-for="t in tokens" :key="t.id" class="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 md:px-10 py-5 hover:bg-zinc-50/50 items-center transition-colors group">
              
              <div class="md:col-span-3 text-left font-semibold text-zinc-900 truncate">
                {{ t.tokenName }}
              </div>

              <div class="md:col-span-2 flex justify-center">
                <span class="inline-flex px-3 py-1 rounded-full bg-zinc-100 text-zinc-700 text-[10px] font-mono font-semibold tracking-wider uppercase border border-zinc-200/60">{{ t.tokenType }}</span>
              </div>

              <div class="md:col-span-3 flex items-center justify-center gap-2 min-w-0">
                <span @click="copyToken(t.tokenValue, t.id)" class="inline-flex items-center gap-1.5 font-mono text-xs text-zinc-600 bg-zinc-50 hover:bg-zinc-100 px-3 py-1 rounded-xl border border-zinc-200/80 transition-colors cursor-pointer truncate max-w-full" title="点击复制完整密钥">
                  <span class="truncate">{{ maskToken(t.tokenValue) }}</span>
                  <Check v-if="copiedMap.get(`token-${t.id}`)" class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <Copy v-else class="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                </span>
              </div>

              <div class="md:col-span-1 text-center text-xs font-mono font-medium text-zinc-800">
                 {{ t.usageCount || 0 }} <span class="text-zinc-400 font-normal">/ {{ t.maxUses || '∞' }}</span>
              </div>

              <div class="md:col-span-1 flex justify-center">
                <span :class="['inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border', tokenStatusClass(t)]">{{ tokenStatus(t) }}</span>
              </div>

              <div class="md:col-span-2 flex items-center justify-end gap-2">
                 <span class="text-xs font-mono text-zinc-400 whitespace-nowrap mr-2">{{ formatExpiry(t.expiresAt) }}</span>
                 <button @click="toggleToken(t)" class="w-8 h-8 rounded-full border border-zinc-200/80 flex items-center justify-center transition-all"
                   :class="t.status === 1 ? 'text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white hover:border-zinc-900'"
                   :title="t.status === 1 ? '禁用凭证' : '启用凭证'">
                   <Power class="w-3.5 h-3.5"/>
                 </button>
                 <button @click="deleteToken(t)" class="w-8 h-8 rounded-full border border-zinc-200/80 flex items-center justify-center text-zinc-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all" title="吊销凭证">
                   <Trash2 class="w-3.5 h-3.5"/>
                 </button>
              </div>

            </div>

            <div v-if="!tokens.length" class="py-28 flex flex-col items-center justify-center text-center">
              <KeyRound class="w-12 h-12 text-zinc-200 mb-4" />
              <h3 class="font-serif text-2xl text-zinc-800">暂无访问凭证</h3>
              <p class="text-zinc-400 text-sm mt-1.5">创建一个新的访问凭证以获取 API 接口权限。</p>
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="tokenTotal > 0" class="px-8 py-4 flex justify-center border-t border-zinc-100 bg-zinc-50/50">
            <el-pagination v-model:current-page="tokenPage" :page-size="pageSize" :total="tokenTotal" @current-change="loadTokens" layout="prev, pager, next" background />
          </div>
        </div>
      </template>

      <!-- ==================== 3. LINKS (EXPANSIVE LIST) ==================== -->
      <template v-if="activeView === 'links'">
        <div class="bg-white rounded-[2.5rem] lg:rounded-[3rem] shadow-xl shadow-zinc-200/40 border border-zinc-100 overflow-hidden divide-y divide-zinc-100">
          
          <div v-for="l in links" :key="l.id" class="p-8 md:p-9 hover:bg-zinc-50/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6 group">
            
            <!-- Left: Info -->
            <div class="flex-1 min-w-0">
               <div class="flex items-center gap-2.5 mb-3 flex-wrap">
                 <span class="px-3 py-1 bg-zinc-900 text-white text-xs font-mono font-semibold rounded-full shadow-xs">/s/{{ l.code }}</span>
                 <span v-if="l.status !== 1 || linkExpired(l)" class="px-2.5 py-0.5 border border-zinc-200 text-zinc-400 text-[10px] font-bold rounded-full uppercase tracking-wider">已失效</span>
                 <span class="text-xs font-mono text-zinc-400">{{ formatDateTime(l.createdAt) }}</span>
               </div>
               <h3 class="text-2xl font-serif font-medium text-zinc-900 mb-2 truncate group-hover:text-zinc-800 transition-colors">{{ l.remark || '未命名路由' }}</h3>
               <a :href="l.targetUrl" target="_blank" class="text-zinc-400 hover:text-zinc-900 transition-colors truncate block max-w-2xl text-xs font-mono flex items-center gap-1.5">
                 <ExternalLink class="w-3.5 h-3.5 shrink-0" />
                 <span class="truncate">{{ l.targetUrl }}</span>
               </a>
            </div>

            <!-- Right: Stats & Actions -->
            <div class="flex flex-wrap items-center gap-6 md:gap-8 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-zinc-100">
               <div class="text-center md:text-right cursor-pointer group/stat bg-zinc-50/80 px-4 py-2 rounded-2xl border border-zinc-100 hover:border-zinc-300 transition-all" @click="showStats(l)">
                 <p class="text-3xl font-serif text-zinc-900 group-hover/stat:text-blue-600 transition-colors">{{ l.visitCount || 0 }}</p>
                 <p class="text-[9px] text-zinc-400 font-bold uppercase tracking-[0.2em] mt-0.5">总访问量</p>
               </div>
               
               <div class="flex items-center gap-2">
                 <button @click="copyText(shortUrl(l), '短链已复制', `l-${l.id}`)" class="w-10 h-10 rounded-full bg-zinc-50 hover:bg-zinc-900 text-zinc-500 hover:text-white flex items-center justify-center transition-all border border-zinc-200/80 hover:border-zinc-900 shadow-xs" title="复制短链">
                   <Check v-if="copiedMap.get(`l-${l.id}`)" class="w-4 h-4 text-emerald-400" />
                   <Copy v-else class="w-4 h-4" />
                 </button>
                 <button @click="openQrModal(l)" class="w-10 h-10 rounded-full bg-zinc-50 hover:bg-zinc-900 text-zinc-500 hover:text-white flex items-center justify-center transition-all border border-zinc-200/80 hover:border-zinc-900 shadow-xs" title="生成二维码">
                   <QrCodeIcon class="w-4 h-4" />
                 </button>
                 <button @click="deleteLink(l)" class="w-10 h-10 rounded-full bg-zinc-50 hover:bg-red-600 text-zinc-500 hover:text-white flex items-center justify-center transition-all border border-zinc-200/80 hover:border-red-600 shadow-xs" title="删除路由">
                   <Trash2 class="w-4 h-4" />
                 </button>
               </div>
            </div>
          </div>

          <div v-if="!links.length" class="py-28 text-center">
            <Link2 class="w-12 h-12 text-zinc-200 mx-auto mb-4" />
            <h3 class="font-serif text-2xl text-zinc-800">暂无短链路由</h3>
            <p class="text-zinc-400 text-sm mt-1.5">创建一条短链以开始分发和追踪网络流量。</p>
          </div>

          <!-- Pagination -->
          <div v-if="linkTotal > 0" class="px-8 py-4 flex justify-center border-t border-zinc-100 bg-zinc-50/50">
            <el-pagination v-model:current-page="linkPage" :page-size="pageSize" :total="linkTotal" @current-change="loadLinks" layout="prev, pager, next" background />
          </div>
        </div>
      </template>

      <!-- ==================== 4. FILES (GALLERY MASONRY/GRID) ==================== -->
      <template v-if="activeView === 'files'">
        <div class="columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
          <div v-for="f in files" :key="f.id" class="break-inside-avoid relative group rounded-[2rem] overflow-hidden bg-white shadow-md shadow-zinc-200/40 border border-zinc-100 media-item transition-all duration-500 hover:shadow-xl hover:shadow-zinc-300/50 hover:-translate-y-2">
            <el-image v-if="f.fileUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i)" :src="f.fileUrl" :preview-src-list="[f.fileUrl]" preview-teleported hide-on-click-modal loading="lazy" />
            <div v-else class="w-full h-48 flex items-center justify-center bg-zinc-50">
               <ImageIcon class="w-10 h-10 text-zinc-300" />
            </div>

            <!-- Hover Overlay -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 pointer-events-none">
              <div class="flex justify-end gap-2 pointer-events-auto">
                <button @click="copyText(f.fileUrl, '链接已复制', `f-${f.id}`)" class="w-9 h-9 rounded-full bg-white/25 backdrop-blur-md text-white flex items-center justify-center hover:bg-white hover:text-zinc-900 transition-colors shadow-sm" title="复制文件链接">
                  <Check v-if="copiedMap.get(`f-${f.id}`)" class="w-3.5 h-3.5 text-emerald-400" />
                  <Copy v-else class="w-3.5 h-3.5" />
                </button>
                <button @click="deleteFile(f)" class="w-9 h-9 rounded-full bg-white/25 backdrop-blur-md text-white flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors shadow-sm" title="删除文件">
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
              <div class="pointer-events-auto">
                <p class="text-white font-medium truncate text-xs shadow-xs">{{ f.originalName }}</p>
                <p class="text-white/70 text-[10px] font-mono mt-0.5">{{ formatSize(f.fileSize) }}</p>
              </div>
            </div>
          </div>
        </div>

        <div v-if="!files.length" class="py-28 flex flex-col items-center justify-center border border-dashed border-zinc-200 rounded-[2.5rem] lg:rounded-[3rem] bg-white/60">
          <ImageIcon class="w-12 h-12 text-zinc-200 mb-4" />
          <h3 class="font-serif text-2xl text-zinc-800">媒体库为空</h3>
          <p class="text-zinc-400 text-sm mt-1.5">上传图片或静态文件以存储至云端。</p>
        </div>
        
        <!-- Pagination -->
        <div v-if="fileTotal > 0" class="mt-8 flex justify-center">
          <div class="bg-white px-6 py-3 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/[0.04]">
            <el-pagination v-model:current-page="filePage" :page-size="pageSize" :total="fileTotal" @current-change="loadFiles" layout="prev, pager, next" background />
          </div>
        </div>
      </template>

      <!-- ==================== 5. POSTS (网站管理) ==================== -->
      <template v-if="activeView === 'posts'">
        <!-- Segmented Tab Switcher -->
        <div class="mb-8 inline-flex rounded-full bg-white/90 backdrop-blur-md p-1.5 border border-black/[0.05] shadow-xs gap-1">
          <button @click="websiteSection = 'posts'" :class="['px-6 py-2 rounded-full text-xs font-semibold tracking-wide transition-all flex items-center gap-2', websiteSection === 'posts' ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900']">
            <Newspaper class="w-3.5 h-3.5" />
            信息流动态
          </button>
          <button @click="websiteSection = 'releases'" :class="['px-6 py-2 rounded-full text-xs font-semibold tracking-wide transition-all flex items-center gap-2', websiteSection === 'releases' ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900']">
            <BookOpen class="w-3.5 h-3.5" />
            更新日志
          </button>
          <button @click="websiteSection = 'comments'" :class="['px-6 py-2 rounded-full text-xs font-semibold tracking-wide transition-all flex items-center gap-2', websiteSection === 'comments' ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900']">
            <MessageSquare class="w-3.5 h-3.5" />
            评论审核
          </button>
        </div>

        <!-- Section 1: Releases (Major Polish!) -->
        <template v-if="websiteSection === 'releases'">
          <div class="bg-white rounded-[2.5rem] lg:rounded-[3rem] shadow-xl shadow-zinc-200/40 border border-zinc-100 overflow-hidden divide-y divide-zinc-100">
            <div v-if="releaseLoading" class="py-28 flex flex-col items-center justify-center text-zinc-400">
              <RefreshCw class="w-8 h-8 animate-spin mb-3 text-zinc-300" />
              <span class="text-xs font-medium uppercase tracking-widest">加载日志中...</span>
            </div>
            <template v-else>
              <div v-for="log in releaseLogs" :key="log.id" class="p-8 md:p-9 hover:bg-zinc-50/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2.5 mb-3 flex-wrap">
                    <span :class="['px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border', log.status === 1 ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' : 'bg-zinc-100 text-zinc-400 border-zinc-200']">
                      {{ log.status === 1 ? '已发布上线' : '已下架' }}
                    </span>
                    <span v-if="log.version" class="inline-flex items-center gap-1 bg-zinc-900 text-white text-xs font-mono font-semibold px-3 py-1 rounded-full shadow-xs">
                      <Tag class="w-3 h-3 opacity-70" />
                      {{ log.version }}
                    </span>
                    <span class="text-xs font-mono text-zinc-400 flex items-center gap-1">
                      <Calendar class="w-3 h-3" />
                      {{ formatDateTime(log.publishedAt || log.createdAt) }}
                    </span>
                  </div>
                  <h3 class="text-2xl font-serif font-medium text-zinc-900 mb-2 truncate group-hover:text-zinc-800 transition-colors">{{ log.title }}</h3>
                  <p v-if="log.summary" class="text-sm text-zinc-500 italic font-serif leading-relaxed line-clamp-2 pl-3 border-l-2 border-zinc-900/30 mt-2 bg-zinc-50/50 py-1 rounded-r-xl max-w-3xl">
                    “{{ log.summary }}”
                  </p>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <button @click="toggleRelease(log)" class="w-10 h-10 rounded-full border border-zinc-200/80 flex items-center justify-center transition-all shadow-xs"
                    :class="log.status === 1 ? 'text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white hover:border-zinc-900'"
                    :title="log.status === 1 ? '下架' : '发布'">
                    <Power class="w-4 h-4" />
                  </button>
                  <button @click="openReleaseDialog(log)" class="w-10 h-10 rounded-full border border-zinc-200/80 text-zinc-500 hover:bg-zinc-900 hover:text-white hover:border-zinc-900 flex items-center justify-center transition-all shadow-xs" title="编辑日志">
                    <Pencil class="w-4 h-4" />
                  </button>
                  <button @click="deleteRelease(log)" class="w-10 h-10 rounded-full border border-zinc-200/80 text-zinc-500 hover:bg-red-600 hover:text-white hover:border-red-600 flex items-center justify-center transition-all shadow-xs" title="删除日志">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div v-if="!releaseLogs.length" class="py-28 text-center text-zinc-400">
                <BookOpen class="w-12 h-12 mx-auto mb-4 text-zinc-200" />
                <h3 class="font-serif text-2xl text-zinc-800">暂无更新日志</h3>
                <p class="text-zinc-400 text-sm mt-1.5">发布第一条更新日志，向访客展示产品迭代历程。</p>
              </div>
            </template>
          </div>
        </template>

        <!-- Section 2: Posts -->
        <template v-else-if="websiteSection === 'posts'">
          <div class="bg-white rounded-[2.5rem] lg:rounded-[3rem] shadow-xl shadow-zinc-200/40 border border-zinc-100 overflow-hidden divide-y divide-zinc-100">

            <div v-if="postsLoading" class="py-28 flex flex-col items-center justify-center text-zinc-400">
              <RefreshCw class="w-8 h-8 animate-spin mb-3 text-zinc-300" />
              <span class="text-xs font-medium uppercase tracking-widest">加载动态中...</span>
            </div>

            <template v-else>
              <div v-for="p in posts" :key="p.id" class="p-8 md:p-9 hover:bg-zinc-50/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6 group">

                <!-- Left: content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2.5 mb-3 flex-wrap">
                    <span :class="['px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border', p.status === 1 ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' : 'bg-zinc-100 text-zinc-400 border-zinc-200']">
                      {{ p.status === 1 ? '已发布' : '已下架' }}
                    </span>
                    <span v-if="p.category?.name || p.categoryName" class="px-2.5 py-0.5 bg-zinc-100 text-zinc-700 text-xs font-medium rounded-full border border-zinc-200/60">
                      {{ p.category?.name || p.categoryName }}
                    </span>
                    <span v-if="p.media && p.media.length" class="px-2.5 py-0.5 bg-zinc-50 border border-zinc-200/60 text-zinc-500 text-xs font-medium rounded-full">
                      {{ postMediaLabel(p) }}
                    </span>
                  </div>
                  <p class="text-xl font-serif text-zinc-900 leading-relaxed mb-3 line-clamp-2 group-hover:text-zinc-700 transition-colors">
                    {{ p.content || '（纯媒体动态）' }}
                  </p>
                  <div class="flex items-center gap-5 text-xs text-zinc-400 font-mono">
                    <span class="inline-flex items-center gap-1.5 text-zinc-500"><Heart class="w-3.5 h-3.5 text-rose-500" /> {{ p.likeCount || 0 }}</span>
                    <span>{{ formatDateTime(p.createdAt) }}</span>
                  </div>
                </div>

                <!-- Middle: media thumb -->
                <div v-if="p.media && p.media.length" class="relative w-22 h-22 rounded-2xl bg-zinc-100 overflow-hidden border border-black/[0.06] shrink-0 shadow-xs">
                  <img v-if="p.media[0].mediaType === 'image'" :src="p.media[0].mediaUrl" class="w-full h-full object-cover" />
                  <video v-else-if="p.media[0].mediaType === 'video'" :src="p.media[0].mediaUrl" class="w-full h-full object-cover" muted preload="metadata" />
                  <span v-if="p.media.length > 1" class="absolute bottom-1 right-1 bg-zinc-900/80 text-white text-[9px] font-mono px-1.5 py-0.5 rounded-full">×{{ p.media.length }}</span>
                </div>

                <!-- Right: actions -->
                <div class="flex items-center gap-2 shrink-0">
                  <button @click="togglePost(p)" class="w-10 h-10 rounded-full border border-zinc-200/80 flex items-center justify-center transition-all shadow-xs"
                    :class="p.status === 1 ? 'text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white hover:border-zinc-900'"
                    :title="p.status === 1 ? '下架动态' : '重新发布'">
                    <Power class="w-4 h-4" />
                  </button>
                  <button @click="openPostDialog(p)" class="w-10 h-10 rounded-full border border-zinc-200/80 text-zinc-500 hover:bg-zinc-900 hover:text-white hover:border-zinc-900 flex items-center justify-center transition-all shadow-xs" title="编辑动态">
                    <Pencil class="w-4 h-4" />
                  </button>
                  <button @click="deletePost(p)" class="w-10 h-10 rounded-full border border-zinc-200/80 text-zinc-500 hover:bg-red-600 hover:text-white hover:border-red-600 flex items-center justify-center transition-all shadow-xs" title="删除动态">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div v-if="!posts.length" class="py-28 text-center">
                <Newspaper class="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                <h3 class="font-serif text-2xl text-zinc-800">暂无动态</h3>
                <p class="text-zinc-400 text-sm mt-1.5">发布第一条动态，即刻展示在个人网站主页。</p>
              </div>
            </template>
          </div>
        </template>
        <!-- Section 3: Comments -->
        <template v-else-if="websiteSection === 'comments'">
          
          <div v-if="commentsLoading" class="py-28 flex flex-col items-center justify-center text-zinc-400 bg-white rounded-[3rem] shadow-xl shadow-zinc-200/40 border border-zinc-100">
            <RefreshCw class="w-8 h-8 animate-spin mb-3 text-zinc-300" />
            <span class="text-xs font-medium uppercase tracking-widest">加载评论中...</span>
          </div>
          
          <template v-else>
            <div v-if="comments.length > 0" class="columns-1 md:columns-2 gap-6 space-y-6">
              <div v-for="c in comments" :key="c.comment.id" class="break-inside-avoid relative group rounded-[2rem] overflow-hidden bg-white shadow-sm shadow-zinc-200/20 border border-zinc-100 transition-all duration-500 hover:shadow-xl hover:shadow-zinc-300/40 hover:-translate-y-1 flex flex-col p-8">
                
                <!-- Header: Status & Meta -->
                <div class="flex items-start justify-between mb-6">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center font-serif italic text-lg shadow-md">
                      {{ (c.comment.author || 'V').charAt(0).toUpperCase() }}
                    </div>
                    <div>
                      <h4 class="text-sm font-bold text-zinc-900">{{ c.comment.author || '访客' }}</h4>
                      <p class="text-[10px] text-zinc-400 font-mono mt-0.5">{{ formatDateTime(c.comment.createdAt) }}</p>
                    </div>
                  </div>
                  
                  <div :class="['flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest', c.comment.status === 1 ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : c.comment.status === 2 ? 'bg-red-50 border-red-200 text-red-600' : 'bg-amber-50 border-amber-200 text-amber-600']">
                    <span :class="['w-1.5 h-1.5 rounded-full', c.comment.status === 1 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : c.comment.status === 2 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.6)]']"></span>
                    {{ c.comment.status === 1 ? '已通过' : c.comment.status === 2 ? '已驳回' : '待审核' }}
                  </div>
                </div>

                <!-- Content: Editorial Quote Style -->
                <p class="text-2xl font-serif text-zinc-900 leading-snug mb-6">
                  “{{ c.comment.content }}”
                </p>
                
                <!-- Reference Snippet -->
                <div class="bg-zinc-50/80 rounded-2xl p-4 border border-zinc-100 flex items-start gap-3 mb-6 group-hover:bg-zinc-100/50 transition-colors">
                  <MessageCircle class="w-4 h-4 text-zinc-300 shrink-0 mt-0.5" />
                  <p class="text-xs text-zinc-500 font-medium leading-relaxed line-clamp-2">
                    {{ c.postContentSummary }}
                  </p>
                </div>

                <!-- Actions -->
                <div class="mt-auto flex items-center gap-2 pt-4 border-t border-zinc-100/60">
                  <button v-if="c.comment.status !== 1" @click="updateCommentStatus(c, 1)" class="flex-1 py-2.5 rounded-xl border border-zinc-200 flex items-center justify-center gap-2 text-xs font-bold text-zinc-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all">
                    <Check class="w-3.5 h-3.5" />
                    通过
                  </button>
                  <button v-if="c.comment.status !== 2" @click="updateCommentStatus(c, 2)" class="flex-1 py-2.5 rounded-xl border border-zinc-200 flex items-center justify-center gap-2 text-xs font-bold text-zinc-600 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 transition-all">
                    <Power class="w-3.5 h-3.5" />
                    驳回
                  </button>
                  <button @click="deleteComment(c)" class="w-12 py-2.5 rounded-xl border border-zinc-200 flex items-center justify-center text-zinc-400 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shrink-0">
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            </div>

            <div v-if="!comments.length" class="py-28 flex flex-col items-center justify-center border border-dashed border-zinc-200 rounded-[3rem] bg-white/60">
              <MessageSquare class="w-12 h-12 text-zinc-200 mb-4" />
              <h3 class="font-serif text-2xl text-zinc-800">暂无评论记录</h3>
              <p class="text-zinc-400 text-sm mt-1.5">当访客提交新评论时，将会在这里展示并等待审核。</p>
            </div>

            <!-- Pagination -->
            <div v-if="commentTotal > 0" class="mt-8 flex justify-center">
              <div class="bg-white px-6 py-3 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/[0.04]">
                <el-pagination v-model:current-page="commentPage" :page-size="pageSize" :total="commentTotal" @current-change="loadComments" layout="prev, pager, next" background />
              </div>
            </div>
          </template>
        </template>
      </template>

    </main>

    <!-- ==================== MODALS (EDITORIAL STYLE) ==================== -->
    
    <!-- Token Provisioning Modal -->
    <el-dialog v-model="tokenDialogVisible" title="新建访问凭证" width="540px" :show-close="false" destroy-on-close>
      <div class="space-y-6 pt-3">
        <div>
          <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2.5">凭证名称 (备注)</label>
          <input v-model="tokenName" type="text" placeholder="例如：前端上传接口专用凭证" class="editorial-input text-base" />
        </div>
        
        <div class="grid grid-cols-2 gap-5">
          <div>
            <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2.5">服务范围</label>
            <el-select v-model="tokenType" class="editorial-select" popper-class="editorial-popper">
              <el-option label="文件与图片服务 (FILEHUB)" value="FILEHUB" />
              <el-option label="短链路由服务 (LINKHUB)" value="LINKHUB" />
            </el-select>
          </div>
          <div>
            <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2.5">有效期</label>
            <el-select v-model="validDays" class="editorial-select" popper-class="editorial-popper">
              <el-option label="7 天" :value="7" />
              <el-option label="30 天" :value="30" />
              <el-option label="6 个月" :value="180" />
              <el-option label="永久有效（不安全）" :value="0" />
            </el-select>
          </div>
        </div>

        <div>
          <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2.5">使用次数限制 (最大调用次数)</label>
          <input v-model.number="maxUses" type="number" placeholder="0 表示无限制" min="0" class="editorial-input font-mono text-base" />
          <p class="text-xs text-zinc-400 mt-2">设为 0 表示不限制调用次数。</p>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button @click="tokenDialogVisible = false" class="px-6 py-2.5 rounded-full text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors">取消</button>
          <button @click="createToken" :disabled="tokenSubmitting" class="px-7 py-2.5 rounded-full text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 transition-all shadow-md disabled:opacity-50">
            签发凭证
          </button>
        </div>
      </template>
    </el-dialog>

    <!-- Create Route Modal -->
    <el-dialog v-model="linkDialogVisible" title="创建短链路由" width="540px" :show-close="false" destroy-on-close>
      <div class="space-y-6 pt-3">
        <div>
          <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2.5">目标链接 (长链接)</label>
          <input v-model="linkTarget" type="url" placeholder="https://..." class="editorial-input font-mono text-base" />
        </div>
        
        <div class="grid grid-cols-2 gap-5">
          <div>
            <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2.5">自定义短码 (可选)</label>
            <div class="relative">
              <input v-model="linkCode" type="text" placeholder="留空自动生成" class="editorial-input font-mono text-base pr-10" />
              <button @click="generateRandomCode" class="absolute inset-y-0 right-2 w-8 flex items-center justify-center text-zinc-400 hover:text-zinc-900 transition-colors" title="随机生成">
                <RefreshCw class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div>
            <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2.5">有效期</label>
            <el-select v-model="linkValidDays" class="editorial-select" popper-class="editorial-popper">
              <el-option label="永久有效" :value="0" />
              <el-option label="24 小时" :value="1" />
              <el-option label="7 天" :value="7" />
              <el-option label="30 天" :value="30" />
            </el-select>
          </div>
        </div>
        
        <div>
          <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2.5">内部备注</label>
          <input v-model="linkRemark" type="text" placeholder="例如：推广活动 A、官网主页..." class="editorial-input text-base" />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button @click="linkDialogVisible = false" class="px-6 py-2.5 rounded-full text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors">取消</button>
          <button @click="createLink" :disabled="linkSubmitting" class="px-7 py-2.5 rounded-full text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 transition-all shadow-md disabled:opacity-50">
            创建路由
          </button>
        </div>
      </template>
    </el-dialog>

    <!-- Stats Analytics Modal -->
    <el-dialog v-model="statsVisible" title="路由数据分析" width="600px" :show-close="false">
      <div v-if="statsLoading" class="py-24 flex flex-col items-center justify-center text-zinc-400">
        <RefreshCw class="w-8 h-8 animate-spin mb-4 text-zinc-300" />
        <span class="text-xs font-medium uppercase tracking-[0.2em]">数据汇总中...</span>
      </div>
      <div v-else class="space-y-8 pt-3">
        
        <div class="flex justify-between items-end border-b border-zinc-100 pb-6">
          <div>
             <p class="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-1.5">监控节点</p>
             <p class="text-2xl font-mono text-zinc-900 font-medium">/s/{{ statsLink?.code }}</p>
          </div>
          <div class="text-right">
             <p class="text-5xl font-serif text-zinc-900 leading-none">{{ statsTotal }}</p>
             <p class="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mt-2">总访问量</p>
          </div>
        </div>
        
        <div>
          <h4 class="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-6">最近 7 天访问趋势</h4>
          
          <div>
            <div class="h-44 flex items-end justify-between gap-3 px-2">
              <div v-for="(day, idx) in statsDaily" :key="idx" class="h-full flex-1 flex flex-col items-center justify-end gap-1.5 group">
                <!-- 访问量常显在柱体上方，悬浮柱体加深 -->
                <span class="text-[11px] font-mono font-semibold text-zinc-700">{{ day.visits }}</span>
                <div class="w-full max-w-[44px] bg-zinc-100 rounded-t-xl group-hover:bg-zinc-900 transition-all duration-300" :style="{ height: `${Math.max(day.visits / maxVisits * 82, 4)}%` }"></div>
              </div>
            </div>
            <div class="flex justify-between gap-3 px-2 mt-3 pt-2 border-t border-zinc-100">
              <span v-for="(day, idx) in statsDaily" :key="idx" class="flex-1 text-center text-[10px] font-mono text-zinc-400">{{ day.visitDate.slice(-5).replace('-', '/') }}</span>
            </div>
          </div>
        </div>

      </div>
      <template #footer>
        <button @click="statsVisible = false" class="px-8 py-2.5 w-full rounded-full text-xs font-semibold text-zinc-800 bg-zinc-100 hover:bg-zinc-200 transition-colors">关闭面板</button>
      </template>
    </el-dialog>

    <!-- QR Code Modal -->
    <el-dialog v-model="qrDialogVisible" title="二维码" width="380px" :show-close="false">
      <div class="flex flex-col items-center py-6">
        <div class="bg-white p-5 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-zinc-100">
          <img :src="qrDataUrl" alt="QR Code" class="w-[220px] h-[220px] mix-blend-multiply" />
        </div>
        <p class="mt-6 text-xs font-mono text-zinc-400 text-center break-all w-full px-4">{{ shortUrl(qrLink) }}</p>
      </div>
      <template #footer>
        <button @click="qrDialogVisible = false" class="w-full px-8 py-2.5 rounded-full text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 transition-colors shadow-md">完成</button>
      </template>
    </el-dialog>

    <!-- Post Publish/Edit Modal -->
    <el-dialog v-model="postDialogVisible" :title="postEditing ? '编辑动态' : '发布动态'" width="700px" class="post-dialog" :show-close="false" destroy-on-close>
      <div class="post-composer space-y-6 pt-2">
        <div class="post-compose-head">
          <div class="w-11 h-11 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-xs"><Send class="w-4 h-4" /></div>
          <div><p class="font-semibold text-zinc-900 text-sm">分享此刻</p><p class="text-xs text-zinc-400 mt-0.5">一条动态，可以是文字、照片或日常记录</p></div>
        </div>
        <div>
          <textarea v-model="postContent" rows="6" maxlength="5000" placeholder="此刻在想什么？" class="editorial-input post-content-input text-base resize-none"></textarea>
          <div class="flex justify-end mt-2 text-xs text-zinc-400 font-mono">{{ postContent.length }}/5000</div>
        </div>

        <div>
          <div class="flex items-center gap-2 mb-3"><Tag class="w-3.5 h-3.5 text-zinc-400" /><span class="text-xs font-bold uppercase tracking-wider text-zinc-700">选择一个主题</span><span class="text-xs text-zinc-400">帮助访客发现内容</span></div>
          <div class="grid grid-cols-3 gap-3">
            <button v-for="category in postCategories" :key="category.id" type="button" @click="postCategoryId = category.id; postCategoryName = category.name" :class="['post-category-chip', postCategoryId === category.id ? 'is-selected' : '']">
              <span>{{ category.name }}</span><small>{{ category.hint }}</small>
            </button>
          </div>
        </div>

        <div class="post-media-panel">
          <label class="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-3">图片附件 <span class="text-xs font-normal text-zinc-400">最多 9 张，首图为封面</span></label>
          <div class="flex flex-wrap gap-3">
            <div v-for="(u, i) in postMediaUrls" :key="u" class="relative w-20 h-20 rounded-2xl overflow-hidden border border-zinc-200 group">
              <img :src="u" class="w-full h-full object-cover" />
              <span v-if="i === 0" class="absolute top-1 left-1 bg-zinc-900/80 text-white text-[9px] px-1.5 py-0.5 rounded-full font-mono">封面</span>
              <button @click="postMediaUrls.splice(i, 1)" class="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity" title="移除">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
            <button v-if="postMediaUrls.length < 9" @click="pickUpload('post')" :disabled="uploading" class="w-20 h-20 rounded-2xl border border-dashed border-zinc-300 text-zinc-400 hover:border-zinc-900 hover:text-zinc-900 flex flex-col items-center justify-center gap-1 transition-colors disabled:opacity-50">
              <Plus class="w-4 h-4" />
              <span class="text-[10px]">{{ uploading ? '上传中' : '上传' }}</span>
            </button>
          </div>
          <p class="text-xs text-zinc-400 mt-2.5">支持一次选择多张图片上传，点击即可选择本地文件。</p>
        </div>

      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button @click="postDialogVisible = false" class="px-6 py-2.5 rounded-full text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors">取消</button>
          <button @click="savePost" :disabled="postSubmitting" class="px-7 py-2.5 rounded-full text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 transition-all shadow-md disabled:opacity-50">
            {{ postEditing ? '保存修改' : '发布动态' }}
          </button>
        </div>
      </template>
    </el-dialog>

    <!-- Release Log Modal -->
    <el-dialog v-model="releaseDialogVisible" :title="releaseEditing ? '编辑更新日志' : '发布更新日志'" width="700px" :show-close="false" destroy-on-close>
      <div class="space-y-5 pt-3">
        <div class="grid grid-cols-[1fr_180px] gap-4">
          <div><label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2">标题</label><input v-model="releaseTitle" maxlength="120" placeholder="例如：网站全新改版" class="editorial-input text-base" /></div>
          <div><label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2">版本号</label><input v-model="releaseVersion" maxlength="40" placeholder="v1.2.0" class="editorial-input font-mono text-base" /></div>
        </div>
        <div><label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2">摘要引语</label><input v-model="releaseSummary" maxlength="500" placeholder="一句话说明这次更新的核心内容" class="editorial-input" /></div>
        <div><label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2">详细说明 (支持换行条目与 [新增]、[优化] 标签)</label><textarea v-model="releaseContent" rows="7" maxlength="10000" placeholder="[新增] 全站支持更新日志模块&#10;[优化] 动态流卡片视觉升级……" class="editorial-input resize-none text-sm leading-relaxed"></textarea></div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button @click="releaseDialogVisible = false" class="px-6 py-2.5 rounded-full text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors">取消</button>
          <button @click="saveRelease" :disabled="releaseSubmitting" class="px-7 py-2.5 rounded-full text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 transition-all shadow-md disabled:opacity-50">
            {{ releaseEditing ? '保存修改' : '立即发布' }}
          </button>
        </div>
      </template>
    </el-dialog>

    <!-- Site Profile & Socials Modal（左右两栏：左个人信息，右社媒名片） -->
    <el-dialog v-model="profileDialogVisible" title="站点资料与社媒名片" width="980px" :show-close="false" destroy-on-close>
      <div v-if="profileLoading" class="py-24 flex flex-col items-center justify-center text-zinc-400">
        <RefreshCw class="w-8 h-8 animate-spin mb-4 text-zinc-300" />
        <span class="text-xs font-medium uppercase tracking-[0.2em]">加载中...</span>
      </div>
      <div v-else-if="siteProfile" class="grid grid-cols-1 md:grid-cols-2 gap-8 pt-3">

        <!-- 左：个人信息 -->
        <div class="space-y-5 flex flex-col">
          <div class="flex items-center gap-5">
            <div class="w-18 h-18 rounded-3xl bg-zinc-100 overflow-hidden border border-black/[0.06] shrink-0 shadow-xs">
              <img v-if="siteProfile.avatarUrl" :src="siteProfile.avatarUrl" class="w-full h-full object-cover" />
            </div>
            <button @click="pickUpload('avatar')" :disabled="uploading" class="px-5 py-2.5 rounded-full bg-zinc-100 hover:bg-zinc-900 hover:text-white text-xs font-semibold transition-colors flex items-center gap-2 disabled:opacity-50">
              <Upload class="w-3.5 h-3.5" /> {{ uploading ? '上传中...' : '更换头像' }}
            </button>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2">名称</label>
              <input v-model="siteProfile.name" type="text" class="editorial-input text-base" />
            </div>
            <div>
              <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2">Handle</label>
              <input v-model="siteProfile.handle" type="text" class="editorial-input font-mono text-base" />
            </div>
          </div>

          <div>
            <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2">简介</label>
            <textarea v-model="siteProfile.bio" rows="4" class="editorial-input resize-none text-sm leading-relaxed"></textarea>
          </div>

          <div class="flex justify-end md:mt-auto pt-2">
            <button @click="saveProfile" :disabled="profileSaving" class="px-7 py-2.5 rounded-full text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 transition-all shadow-md disabled:opacity-50">
              {{ profileSaving ? '保存中...' : '保存资料' }}
            </button>
          </div>
        </div>

        <!-- 右：社媒名片 -->
        <div class="md:border-l md:border-zinc-100 md:pl-8 flex flex-col min-w-0">
          <div class="flex items-center justify-between mb-4">
            <h4 class="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">社媒名片</h4>
            <button @click="addSocialRow" class="px-3.5 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-900 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1.5">
              <Plus class="w-3.5 h-3.5" /> 添加名片
            </button>
          </div>

          <div class="space-y-3 flex-1 md:max-h-[420px] md:overflow-y-auto md:pr-1">
            <div v-for="(s, idx) in siteSocials" :key="s.id || `new-${idx}`" class="p-4 bg-zinc-50/80 border border-zinc-200/60 rounded-2xl space-y-3">
              <div class="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                <input v-model="s.platform" placeholder="平台（微信等）" class="profile-mini-input" />
                <input v-model="s.iconName" placeholder="图标名" class="profile-mini-input font-mono" />
                <div class="flex items-center justify-end gap-2 col-span-2 md:col-span-1">
                  <span class="text-[11px] text-zinc-400">启用</span>
                  <el-switch v-model="s.status" :active-value="1" :inactive-value="0" size="small" />
                </div>
              </div>
              <div class="grid grid-cols-1 gap-2.5">
                <input v-model="s.url" placeholder="跳转链接（GitHub 主页等，可空）" class="profile-mini-input font-mono" />
                <div class="flex gap-2">
                  <input v-model="s.qrCodeUrl" placeholder="二维码图片链接（可空）" class="profile-mini-input font-mono flex-1" />
                  <button @click="pickUpload(`qr-${idx}`)" :disabled="uploading" class="shrink-0 w-10 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-900 hover:text-white hover:border-zinc-900 flex items-center justify-center transition-colors disabled:opacity-50" title="上传二维码图片">
                    <Upload class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div class="flex justify-end gap-2 pt-1">
                <button v-if="!s.id" @click="siteSocials.splice(idx, 1)" class="px-3 py-1 rounded-full text-xs font-medium text-zinc-500 hover:bg-zinc-200 transition-colors">移除</button>
                <button v-else @click="deleteSocial(s)" class="px-3 py-1 rounded-full text-xs font-medium text-red-500 hover:bg-red-50 transition-colors">删除名片</button>
                <button @click="saveSocial(s)" :disabled="socialSaving === (s.id || `new-${idx}`)" class="px-4 py-1 rounded-full text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 transition-colors disabled:opacity-50">保存</button>
              </div>
            </div>
          </div>
          <p class="text-[11px] text-zinc-400 mt-3">跳转链接与二维码至少保留一个；二维码上传后自动填充，点击保存生效。</p>
        </div>
      </div>
      <template #footer>
        <button @click="profileDialogVisible = false" class="w-full px-8 py-2.5 rounded-full text-xs font-semibold text-zinc-800 bg-zinc-100 hover:bg-zinc-200 transition-colors">完成</button>
      </template>
    </el-dialog>

    <!-- 动态媒体 / 头像 / 社媒二维码共用的图片上传入口 -->
    <input ref="mediaInput" hidden type="file" accept="image/*" multiple @change="handleUpload" />

  </div>
</template>

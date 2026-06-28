export const STATUS_CONFIG = {
  pending: { text: '等待中', class: 'pending' },
  running: { text: '进行中', class: 'running' },
  completed: { text: '已完成', class: 'completed' },
  success: { text: '成功', class: 'completed' },
  failed: { text: '失败', class: 'failed' },
  error: { text: '失败', class: 'failed' },
  cancelled: { text: '已取消', class: 'cancelled' },
}

export function getStatusText(status) {
  return STATUS_CONFIG[status]?.text || status || '未知'
}

export function getStatusClass(status) {
  return STATUS_CONFIG[status]?.class || status || ''
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return dateStr
  return date.toLocaleDateString('zh-CN')
}

export function formatDateTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return dateStr
  return date.toLocaleString('zh-CN')
}

export function formatTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return dateStr
  return date.toLocaleTimeString('zh-CN')
}

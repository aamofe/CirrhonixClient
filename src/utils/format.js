export const STATUS_CONFIG = {
  pending: { text: '等待中', class: 'pending' },
  queued: { text: '已排队', class: 'queued' },
  running: { text: '进行中', class: 'running' },
  processing: { text: '进行中', class: 'running' },
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

export function formatDateTimeShort(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return dateStr
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDateTimeOrDash(dateStr) {
  return dateStr ? formatDateTime(dateStr) : '-'
}

export function getAnalysisStatusLabel(status) {
  if (status === 'running') return '分析中'
  return getStatusText(status)
}

export function formatTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return dateStr
  return date.toLocaleTimeString('zh-CN')
}

import { ElMessage, ElMessageBox } from 'element-plus'
import { getApiErrorMessage } from './apiError'

export const notify = {
  success(message) {
    ElMessage.success(message)
  },
  error(message) {
    ElMessage.error(message)
  },
  warning(message) {
    ElMessage.warning(message)
  },
  info(message) {
    ElMessage.info(message)
  },
  apiError(error, fallback = '请求失败') {
    ElMessage.error(getApiErrorMessage(error, fallback))
  },
  confirm(message, title = '确认', options = {}) {
    return ElMessageBox.confirm(message, title, {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      ...options,
    })
  },
}

export default notify

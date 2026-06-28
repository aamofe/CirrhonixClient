/**
 * 解析后端字段级校验错误。
 * 格式：{ message: "参数错误", data: { question: ["..."], options: { recursion_limit: ["..."] } } }
 */
export function formatApiValidationErrors(data) {
  if (!data || typeof data !== 'object') return ''

  const lines = []
  const walk = (obj) => {
    for (const val of Object.values(obj)) {
      if (Array.isArray(val)) {
        val.forEach((msg) => lines.push(msg))
      } else if (val && typeof val === 'object') {
        walk(val)
      }
    }
  }
  walk(data)
  return lines.join('；')
}

export function getApiErrorMessage(error, fallback = '请求失败') {
  const res = error?.response?.data
  if (!res) return error?.message || fallback

  if (res.data && typeof res.data === 'object' && Object.keys(res.data).length) {
    const fieldErrors = formatApiValidationErrors(res.data)
    if (fieldErrors) return fieldErrors
  }

  return res.message || fallback
}

/**
 * 解析 fetch 响应体中的错误信息（含 400 字段级错误）。
 */
export async function parseFetchErrorResponse(res, fallback) {
  const defaultMsg = fallback || `HTTP ${res.status}: ${res.statusText}`
  try {
    const body = await res.json()
    if (body.data && typeof body.data === 'object' && Object.keys(body.data).length) {
      const fieldErrors = formatApiValidationErrors(body.data)
      if (fieldErrors) return fieldErrors
    }
    return body.message || defaultMsg
  } catch {
    return defaultMsg
  }
}

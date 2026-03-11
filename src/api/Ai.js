import service from '@/http'

/**
 * api/Ai.js  —  RAG v2 接口封装
 *
 * 对应后端 rag_v2/urls.py 的 4 个端点：
 *   POST /rag/ask/            非流式问答
 *   POST /rag/ask/stream/     流式问答（SSE，原生 fetch）
 *   POST /rag/history/clear/  清除对话历史
 *   GET  /rag/health/         健康检查
 *
 * 注意：流式接口不走 axios，因为 axios 不支持逐帧读取 text/event-stream。
 *       改用原生 fetch + ReadableStream，认证 token 从 localStorage 读取，
 *       与 axios 拦截器保持一致。
 */

const BASE = {
  ask:          '/rag/ask/',
  askStream:    '/rag/ask/stream/',
  clearHistory: '/rag/history/clear/',
  health:       '/rag/health/',
}

export default class AI {

  // ─────────────────────────────────────────────
  // 1. 非流式问答
  // ─────────────────────────────────────────────

  /**
   * @param {Object} data
   * @param {string} data.question          用户问题
   * @param {Object} [data.options]
   * @param {number} [data.options.recursion_limit=10]
   * @param {boolean}[data.options.debug=false]
   *
   * @returns {Promise<{
   *   message: string,
   *   data: {
   *     answer:         string,
   *     method_used:    string,
   *     intent:         string,
   *     question_type:  string,
   *     entities_found: string[],
   *     confidence:     number,
   *     citations:      Array<{pmid:string, claim:string}>
   *   }
   * }>}
   */
  static ask(data) {
    return service.post(BASE.ask, data)
  }

  // ─────────────────────────────────────────────
  // 2. 流式问答（SSE）
  // ─────────────────────────────────────────────

  /**
   * 用原生 fetch 接 text/event-stream，通过回调把每帧数据传给调用方。
   *
   * 后端 SSE 帧类型（rag_v2/views.py _sse_generator）：
   *   status 帧  { type:'status', message:'正在检索知识库...' }
   *   token  帧  { type:'token',  token:'HBV' }
   *   done   帧  { type:'done',   citations:[...], confidence:0.88,
   *                entities_found:[...], method_used:'hybrid',
   *                intent:'knowledge_query', question_type:'mechanism',
   *                elapsed_seconds:3.2 }
   *   error  帧  { type:'error',  message:'...' }
   *
   * @param {Object}   data
   * @param {string}   data.question
   * @param {Object}   [data.options]
   *
   * @param {Object}   callbacks
   * @param {Function} [callbacks.onStatus]  (message: string) => void
   * @param {Function} [callbacks.onToken]   (token: string)   => void
   * @param {Function} [callbacks.onDone]    (meta: Object)    => void
   * @param {Function} [callbacks.onError]   (err: string)     => void
   *
   * @returns {AbortController}  调用 .abort() 可中止流
   */
  static askStream(data, callbacks = {}) {
    const { onStatus, onToken, onDone, onError } = callbacks
    const controller = new AbortController()

    const baseURL = service.defaults?.baseURL ?? ''
    const token   = localStorage.getItem('token') ?? ''

    ;(async () => {
      try {
        const res = await fetch(baseURL + BASE.askStream, {
          method:  'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body:   JSON.stringify(data),
          signal: controller.signal,
        })

        if (!res.ok) {
          onError?.(`HTTP ${res.status}: ${res.statusText}`)
          return
        }

        const reader  = res.body.getReader()
        const decoder = new TextDecoder('utf-8')
        let   buffer  = ''

        while (true) {
          const { value, done } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          // SSE 帧之间以 "\n\n" 分隔
          const parts = buffer.split('\n\n')
          buffer = parts.pop()           // 最后一段可能不完整，留着

          for (const part of parts) {
            const line = part.trim()
            if (!line.startsWith('data: ')) continue
            const jsonStr = line.slice(6).trim()
            if (!jsonStr) continue

            try {
              const frame = JSON.parse(jsonStr)
              if      (frame.type === 'status') onStatus?.(frame.message)
              else if (frame.type === 'token')  onToken?.(frame.token)
              else if (frame.type === 'done')   onDone?.(frame)
              else if (frame.type === 'error')  onError?.(frame.message)
            } catch (_) { /* 单帧解析失败，跳过 */ }
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          onError?.(err.message ?? '流式请求失败')
        }
      }
    })()

    return controller
  }

  // ─────────────────────────────────────────────
  // 3. 清除对话历史
  // ─────────────────────────────────────────────

  /** @returns {Promise} */
  static clearHistory() {
    return service.post(BASE.clearHistory)
  }

  // ─────────────────────────────────────────────
  // 4. 健康检查
  // ─────────────────────────────────────────────

  /**
   * 页面初始化时用于检测后端服务是否就绪。
   * @returns {Promise<{data:{status:string, graph_ready:boolean, version:string}}>}
   */
  static health() {
    return service.get(BASE.health)
  }
}
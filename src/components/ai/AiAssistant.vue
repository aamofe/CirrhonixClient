<template>
  <!--
    AiAssistant.vue

    两种使用模式：
    1. 浮层模式（默认）:  <AiAssistant />
       右下角固定定位浮动按钮，点击展开聊天面板。

    2. 嵌入模式:          <AiAssistant :embedded="true" />
       直接渲染聊天面板，填满父容器，不显示浮动按钮，不占用 fixed 定位。
       父容器需提供明确的高度（如 flex:1 + min-height:0）。

    外部控制：
       通过 ref 调用 fill(question) 可向输入框填入文字。
  -->
  <div :class="embedded ? 'aia-embedded' : 'aia-float'">

    <!-- ══ 浮层模式：收起态胶囊 ══ -->
    <transition name="fab-pop">
      <div
        v-if="!embedded && !panelOpen"
        class="aia-fab"
        @click="panelOpen = true"
      >
        <svg class="aia-fab-icon" viewBox="0 0 24 24" fill="none">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill="currentColor"/>
        </svg>
        <span>AI 问答</span>
        <span v-if="badge > 0" class="aia-badge">{{ badge }}</span>
      </div>
    </transition>

    <!-- ══ 聊天面板 ══ -->
    <!--
      浮层模式：transition 动画 + 条件渲染
      嵌入模式：始终渲染，撑满父容器
    -->
    <transition :name="embedded ? '' : 'panel-rise'">
      <div
        v-if="embedded || panelOpen"
        :class="['aia-panel', embedded ? 'aia-panel-embedded' : 'aia-panel-float']"
      >

        <!-- 头部 -->
        <div class="aia-header">
          <div class="aia-header-left">
            <span class="aia-dot" :class="svcStatus" />
            <div>
              <div class="aia-title">知识图谱助手</div>
              <div class="aia-sub">{{ svcLabel }}</div>
            </div>
          </div>
          <div class="aia-header-right">
            <button class="aia-icon-btn" title="清除记录" @click="doClear">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm13-15h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
            </button>
            <!-- 浮层模式才显示收起按钮 -->
            <button v-if="!embedded" class="aia-icon-btn" title="收起" @click="panelOpen = false">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- 消息列表 -->
        <div class="aia-messages" ref="msgBox">

          <!-- 欢迎屏 -->
          <div v-if="msgs.length === 0" class="aia-welcome">
            <div class="aia-welcome-icon">🔬</div>
            <h4>肝硬化知识助手</h4>
            <p>基于知识图谱与医学文献，解答肝硬化相关问题</p>
            <div class="aia-chips">
              <span
                v-for="(q, i) in presets"
                :key="i"
                class="aia-chip"
                @click="fill(q)"
              >{{ q }}</span>
            </div>
          </div>

          <!-- 消息 -->
          <template v-for="(m, idx) in msgs" :key="idx">

            <!-- 用户气泡 -->
            <div v-if="m.isUser" class="aia-row aia-row-user">
              <div class="aia-bubble aia-bubble-user">{{ m.text }}</div>
              <span class="aia-time">{{ m.time }}</span>
            </div>

            <!-- AI 气泡 -->
            <div v-else class="aia-row aia-row-ai">
              <div class="aia-avatar">AI</div>
              <div class="aia-ai-body">
                <div class="aia-bubble aia-bubble-ai">
                  <span v-html="renderMd(m.text)" />
                  <span v-if="streaming && idx === msgs.length - 1" class="aia-cursor">▋</span>
                </div>

                <!-- 元信息：只显示识别到的实体标签，不显示置信度 -->
                <div v-if="m.meta && (m.meta.entities_found || []).length > 0" class="aia-meta">
                  <span
                    v-for="(e, ei) in (m.meta.entities_found || []).slice(0, 4)"
                    :key="ei"
                    class="aia-tag aia-tag-ent"
                  >{{ e }}</span>
                </div>

                <!-- 引用文献 -->
                <div v-if="m.citations && m.citations.length" class="aia-cits">
                  <div class="aia-cits-hd">📚 参考文献</div>
                  <div v-for="(c, ci) in m.citations" :key="ci" class="aia-cit-row">
                    <span class="aia-cit-num">{{ ci + 1 }}</span>
                    <span class="aia-cit-text">{{ c.claim || c.content_snippet || '' }}</span>
                  </div>
                </div>

                <span class="aia-time">{{ m.time }}</span>
              </div>
            </div>
          </template>

          <!-- 非流式 loading -->
          <div v-if="loading && !streaming" class="aia-row aia-row-ai">
            <div class="aia-avatar">AI</div>
            <div class="aia-bubble aia-bubble-ai aia-dots">
              <span /><span /><span />
            </div>
          </div>

          <!-- 流式检索阶段提示 -->
          <div v-if="statusHint" class="aia-hint">
            <span class="aia-spinner" />{{ statusHint }}
          </div>
        </div>

        <!-- 模式切换 -->
        <div class="aia-mode-bar">
          <button :class="['aia-mode-btn', { active: useStream }]" @click="useStream = true">⚡ 流式</button>
          <button :class="['aia-mode-btn', { active: !useStream }]" @click="useStream = false">📄 普通</button>
        </div>

        <!-- 输入区 -->
        <div class="aia-input-bar">
          <textarea
            v-model="input"
            ref="ta"
            rows="2"
            maxlength="2000"
            placeholder="输入问题，Enter 发送，Shift+Enter 换行（最多 2000 字）"
            :disabled="loading"
            @keydown="onKey"
          />
          <button
            class="aia-send-btn"
            :disabled="!input.trim() && !loading"
            :title="loading ? '点击中止' : '发送'"
            @click="loading ? abort() : send()"
          >
            <svg v-if="!loading" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h12v12H6z"/>
            </svg>
          </button>
        </div>

      </div>
    </transition>

  </div>
</template>

<script>
import AI from '@/api/Ai'
import notify from '@/utils/notify'
import { getApiErrorMessage } from '@/utils/apiError'

const QUESTION_MAX_LENGTH = 2000

const HIST_KEY = 'aia_msgs_v2'

/* ── 极简 Markdown 渲染 ── */
function esc(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}

/**
 * 从原始文本中提取显示内容。
 *
 * 流式模式下 LLM 输出的是 JSON 字符串，例如：
 *   {"answer":"你好！我是...","citations":[],"confidence":0.8,"needs_more_context":false}
 * 需要解析出 answer 字段，避免把整个 JSON 显示给用户。
 *
 * 处理策略：
 *  1. 尝试解析完整 JSON → 取 answer 字段
 *  2. 检测到以 { 开头（流式未完成，JSON 还没闭合）→ 提取 "answer" 后面的内容
 *  3. 纯文本 → 直接渲染 Markdown
 */
function extractDisplayText(raw) {
  if (!raw) return ''

  const trimmed = raw.trim()

  // ── 策略1：尝试解析完整 JSON ──
  if (trimmed.startsWith('{')) {
    try {
      const obj = JSON.parse(trimmed)
      if (obj && typeof obj.answer === 'string') {
        return obj.answer
      }
    } catch (_) {
      // JSON 还没完整（流式中途），走策略2
    }

    // ── 策略2：流式中途，JSON 不完整，提取 "answer": "..." 的内容 ──
    // 匹配 "answer" 后面双引号内的内容（允许不完整）
    const m = trimmed.match(/"answer"\s*:\s*"((?:[^"\\]|\\.)*)/)
    if (m) {
      // 反转义 JSON 字符串中的转义序列
      try {
        return JSON.parse(`"${m[1]}"`)
      } catch (_) {
        return m[1]
      }
    }

    // 如果连 answer 字段都没出现，说明还在输出 JSON 开头的 key，暂时显示空
    return ''
  }

  // ── 策略3：纯文本，直接返回 ──
  return trimmed
}

function renderMd(raw) {
  if (!raw) return ''
  let s = extractDisplayText(raw)
  if (!s) return ''
  s = s.replace(/```[\s\S]*?```/g, m => {
    const code = esc(m.slice(3, -3).replace(/^[a-z]*\n/, ''))
    return `<pre><code>${code}</code></pre>`
  })
  s = s.replace(/`([^`]+)`/g, (_, c) => `<code>${esc(c)}</code>`)
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  s = s.replace(/\*([^*]+)\*/g,     '<em>$1</em>')
  s = s.replace(/\[Lit\s*(\d+)\]/g, '<span class="aia-litref">[Lit $1]</span>')
  s = s.replace(/\n/g, '<br>')
  return s
}

function nowHM() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

export default {
  name: 'AiAssistant',

  props: {
    /**
     * embedded=true  → 面板填满父容器，无浮动按钮，无收起功能
     * embedded=false → 右下角浮动胶囊，点击展开/收起
     */
    embedded: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      panelOpen:  false,   // 浮层模式专用，嵌入模式忽略
      msgs:       [],
      input:      '',
      loading:    false,
      streaming:  false,
      statusHint: '',
      useStream:  true,
      badge:      0,
      svcStatus:  'ok',
      abortCtrl:  null,

      presets: [
        'HBV 是如何导致肝硬化的？',
        '肝纤维化的分子机制是什么？',
        '肝硬化与哪些病原体相关？',
        '门静脉高压的并发症有哪些？',
      ],

      renderMd,
    }
  },

  computed: {
    svcLabel() {
      return { ok: '服务正常', degraded: '服务降级', error: '服务异常' }[this.svcStatus]
    },
  },

  created()  { this._loadHist() },
  mounted()  { this._checkHealth() },

  methods: {

    /**
     * 对外暴露：填入问题文字（GraphSidebar 通过 ref 调用）
     * @param {string} question
     */
    fill(question) {
      this.input = question
      this.$nextTick(() => this.$refs.ta?.focus())
    },

    onKey(e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send() }
    },

    async send() {
      const q = this.input.trim()
      if (!q || this.loading) return
      if (q.length > QUESTION_MAX_LENGTH) {
        notify.error(`问题长度不能超过 ${QUESTION_MAX_LENGTH} 个字符`)
        return
      }
      this._pushUser(q)
      this.input   = ''
      this.loading = true
      this.useStream ? await this._sendStream(q) : await this._sendNormal(q)
    },

    abort() {
      this.abortCtrl?.abort()
      this.streaming  = false
      this.loading    = false
      this.statusHint = ''
    },

    async _sendNormal(q) {
      try {
        const res = await AI.ask({ question: q, options: {} })
        const d   = res?.data?.data ?? {}
        this._pushAi(
          d.answer || '暂无回答',
          d.citations ?? [],
          { confidence: d.confidence, entities_found: d.entities_found,
            intent: d.intent, question_type: d.question_type },
        )
      } catch (err) {
        const msg = getApiErrorMessage(err, '请求失败，请稍后重试。')
        this._pushAi(msg, [], null)
      } finally {
        this.loading = false
        this._scrollBottom()
      }
    },

    async _sendStream(q) {
      const idx = this._pushAi('', [], null)
      this.streaming  = true
      this.statusHint = ''

      this.abortCtrl = AI.askStream(
        { question: q, options: {} },
        {
          onStatus: msg => { this.statusHint = msg },

          onToken: tok => {
            this.statusHint      = ''
            this.msgs[idx].text += tok
            this._scrollBottom()
          },

          onDone: meta => {
            this.statusHint          = ''
            this.streaming           = false
            this.loading             = false
            this.msgs[idx].citations = meta.citations ?? []
            this.msgs[idx].meta      = {
              confidence:     meta.confidence,
              entities_found: meta.entities_found,
              intent:         meta.intent,
              question_type:  meta.question_type,
            }
            this._saveHist()
            this._scrollBottom()
            if (!this.embedded && !this.panelOpen) this.badge++
          },

          onError: err => {
            this.statusHint = ''
            this.streaming  = false
            this.loading    = false
            if (!this.msgs[idx].text) this.msgs[idx].text = `⚠️ ${err}`
            this._scrollBottom()
          },
        },
      )
    },

    async doClear() {
      if (!confirm('确认清除所有对话记录？')) return
      try { await AI.clearHistory() } catch (_) {}
      this.msgs = []
      sessionStorage.removeItem(HIST_KEY)
    },

    async _checkHealth() {
      try {
        const r = await AI.health()
        this.svcStatus = r?.data?.data?.graph_ready ? 'ok' : 'degraded'
      } catch { this.svcStatus = 'error' }
    },

    _pushUser(text) {
      this.msgs.push({ isUser: true, text, time: nowHM() })
      this._saveHist()
      this._scrollBottom()
    },

    _pushAi(text, citations, meta) {
      const i = this.msgs.length
      this.msgs.push({ isUser: false, text, citations, meta, time: nowHM() })
      this._saveHist()
      return i
    },

    _scrollBottom() {
      this.$nextTick(() => {
        const el = this.$refs.msgBox
        if (el) el.scrollTop = el.scrollHeight
      })
    },

    _saveHist() {
      try { sessionStorage.setItem(HIST_KEY, JSON.stringify(this.msgs.slice(-40))) }
      catch (_) {}
    },

    _loadHist() {
      try {
        const raw = sessionStorage.getItem(HIST_KEY)
        if (raw) this.msgs = JSON.parse(raw)
      } catch (_) {}
    },
  },
}
</script>

<style scoped>
/* ══ 浮层模式容器 ══ */
.aia-float {
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 1200;
  font-family: 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
}

/* ══ 嵌入模式容器：撑满父容器 ══ */
.aia-embedded {
  display: flex;
  flex-direction: column;
  height: 100%;
  font-family: 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
}

/* ── FAB ── */
.fab-pop-enter-active, .fab-pop-leave-active { transition: all .2s ease; }
.fab-pop-enter-from, .fab-pop-leave-to       { opacity: 0; transform: scale(.85); }

.aia-fab {
  position: relative;
  display: flex; align-items: center; gap: 8px;
  padding: 11px 20px 11px 14px;
  background: #1a91c1; color: #fff;
  border-radius: 50px; cursor: pointer;
  box-shadow: 0 4px 18px rgba(26,145,193,.38);
  transition: transform .2s, box-shadow .2s;
  user-select: none; font-weight: 600; font-size: 14px;
}
.aia-fab:hover { transform: translateY(-2px); box-shadow: 0 6px 22px rgba(26,145,193,.48); }
.aia-fab-icon  { width: 20px; height: 20px; flex-shrink: 0; }
.aia-badge {
  position: absolute; top: -4px; right: -4px;
  background: #e53e3e; color: #fff;
  border-radius: 999px; font-size: 11px; font-weight: 700;
  padding: 2px 5px; min-width: 18px; text-align: center;
}

/* ── 面板动画（浮层模式）── */
.panel-rise-enter-active, .panel-rise-leave-active { transition: all .26s cubic-bezier(.4,0,.2,1); }
.panel-rise-enter-from, .panel-rise-leave-to       { opacity: 0; transform: translateY(14px) scale(.97); }

/* ── 面板基础 ── */
.aia-panel {
  display: flex; flex-direction: column;
  background: #fff; overflow: hidden;
  border: 1px solid #e2e8f0;
}

/* 浮层面板：固定尺寸 */
.aia-panel-float {
  width: 380px; height: 570px;
  border-radius: 14px;
  box-shadow: 0 16px 48px rgba(0,0,0,.17);
}

/* 嵌入面板：填满父容器 */
.aia-panel-embedded {
  width: 100%; height: 100%;
  border-radius: 10px;
  box-shadow: none;
}

/* ── 头部 ── */
.aia-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 11px 14px;
  background: #1a91c1; color: #fff; flex-shrink: 0;
}
.aia-header-left  { display: flex; align-items: center; gap: 10px; }
.aia-header-right { display: flex; gap: 4px; }

.aia-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.aia-dot.ok       { background: #68d391; box-shadow: 0 0 0 3px rgba(104,211,145,.3); }
.aia-dot.degraded { background: #f6ad55; box-shadow: 0 0 0 3px rgba(246,173,85,.3);  }
.aia-dot.error    { background: #fc8181; box-shadow: 0 0 0 3px rgba(252,129,129,.3); }

.aia-title { font-size: 14px; font-weight: 700; line-height: 1.2; }
.aia-sub   { font-size: 11px; opacity: .75; margin-top: 1px; }

.aia-icon-btn {
  width: 27px; height: 27px;
  background: rgba(255,255,255,.18);
  border: none; border-radius: 6px; color: #fff;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: background .15s;
}
.aia-icon-btn svg { width: 14px; height: 14px; }
.aia-icon-btn:hover { background: rgba(255,255,255,.3); }

/* ── 消息区 ── */
.aia-messages {
  flex: 1; min-height: 0;
  overflow-y: auto;
  padding: 12px 11px;
  background: #f7f9fb;
  display: flex; flex-direction: column; gap: 10px;
}
.aia-messages::-webkit-scrollbar { width: 4px; }
.aia-messages::-webkit-scrollbar-thumb { background: #c9d5e0; border-radius: 4px; }

/* 欢迎屏 */
.aia-welcome {
  display: flex; flex-direction: column; align-items: center;
  text-align: center; padding: 20px 12px; gap: 7px; color: #4a5568;
}
.aia-welcome-icon { font-size: 34px; }
.aia-welcome h4   { margin: 0; font-size: 14px; font-weight: 700; color: #1a2332; }
.aia-welcome p    { margin: 0; font-size: 12px; }
.aia-chips { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; margin-top: 4px; }
.aia-chip  {
  background: #fff; border: 1px solid #e2e8f0;
  border-radius: 999px; padding: 4px 11px;
  font-size: 11.5px; color: #1a91c1; cursor: pointer;
  transition: all .15s; user-select: none;
}
.aia-chip:hover { background: #1a91c1; color: #fff; border-color: #1a91c1; }

/* 消息行 */
.aia-row      { display: flex; align-items: flex-start; gap: 7px; }
.aia-row-user { flex-direction: row-reverse; }

/* 气泡 */
.aia-bubble {
  padding: 8px 12px; border-radius: 14px;
  line-height: 1.65; max-width: 86%; word-break: break-word;
  font-size: 13px;
}
.aia-bubble-user {
  background: #1a91c1; color: #fff; border-top-right-radius: 4px;
}
.aia-bubble-ai {
  background: #fff; color: #1a2332;
  border-top-left-radius: 4px; box-shadow: 0 1px 4px rgba(0,0,0,.06);
}

/* loading 点 */
.aia-dots { display: flex; gap: 5px; align-items: center; padding: 10px 14px; }
.aia-dots span {
  width: 6px; height: 6px; background: #a0aec0; border-radius: 50%;
  animation: aia-dot 1.2s infinite ease-in-out both;
}
.aia-dots span:nth-child(1) { animation-delay: -.3s; }
.aia-dots span:nth-child(2) { animation-delay: -.15s; }
@keyframes aia-dot {
  0%,80%,100% { transform:scale(.55); opacity:.5; }
  40%         { transform:scale(1);   opacity:1;  }
}

/* 流式光标 */
.aia-cursor { display:inline-block; color:#1a91c1; animation:aia-blink .8s step-end infinite; }
@keyframes aia-blink { 0%,100%{opacity:1} 50%{opacity:0} }

/* AI 头像 */
.aia-avatar {
  flex-shrink: 0; width: 26px; height: 26px;
  background: #1a91c1; color: #fff;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700; margin-top: 2px;
}

.aia-ai-body { display: flex; flex-direction: column; gap: 4px; max-width: 87%; }

/* 元信息 */
.aia-meta { display: flex; flex-wrap: wrap; gap: 4px; }
.aia-tag  { font-size: 11px; padding: 2px 7px; border-radius: 999px; font-weight: 600; }
.aia-tag-conf { background: #ebf8f0; color: #22863a; }
.aia-tag-ent  { background: #e8f4fd; color: #1a91c1; }

/* 引用 */
.aia-cits    { margin-top: 5px; }
.aia-cits-hd { font-size: 11px; font-weight: 700; color: #8898aa; margin-bottom: 3px; }
.aia-cit-row {
  display: flex; align-items: flex-start; gap: 5px;
  font-size: 11px; color: #4a5568;
  padding: 3px 0; border-top: 1px dashed #e2e8f0;
}
.aia-cit-num {
  flex-shrink: 0; width: 16px; height: 16px;
  background: #1a91c1; color: #fff;
  border-radius: 50%; font-size: 9px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.aia-cit-text { line-height: 1.4; }

/* 时间 */
.aia-time { font-size: 11px; color: #a0aec0; padding: 0 2px; }

/* 状态提示 */
.aia-hint {
  display: flex; align-items: center; gap: 5px;
  font-size: 12px; color: #a0aec0; padding: 2px 0;
}
.aia-spinner {
  display: inline-block; width: 11px; height: 11px;
  border: 2px solid #e2e8f0; border-top-color: #1a91c1;
  border-radius: 50%; animation: aia-spin .7s linear infinite;
}
@keyframes aia-spin { to { transform: rotate(360deg); } }

/* Markdown 内联 */
.aia-bubble-ai :deep(strong) { font-weight: 700; }
.aia-bubble-ai :deep(em)     { font-style: italic; color: #4a5568; }
.aia-bubble-ai :deep(code)   {
  background: #f0f4f8; border-radius: 4px; padding: 1px 5px;
  font-size: 11.5px; font-family: 'JetBrains Mono', 'Courier New', monospace;
}
.aia-bubble-ai :deep(pre) {
  background: #1a2332; color: #e2e8f0; border-radius: 8px;
  padding: 10px 12px; overflow-x: auto; font-size: 11.5px; margin: 6px 0;
}
.aia-bubble-ai :deep(.aia-litref) {
  background: linear-gradient(135deg,#667eea,#764ba2);
  color:#fff; padding: 1px 6px; border-radius: 8px;
  font-size: 11px; font-weight: 600; display: inline-block; margin: 0 2px;
}

/* ── 模式切换 ── */
.aia-mode-bar {
  display: flex; gap: 4px; padding: 5px 10px;
  background: #f7f9fb; border-top: 1px solid #e2e8f0; flex-shrink: 0;
}
.aia-mode-btn {
  flex: 1; padding: 4px 0; border-radius: 6px;
  border: 1px solid #e2e8f0; background: #fff; color: #8898aa;
  font-size: 12px; font-weight: 600; cursor: pointer; transition: all .15s;
}
.aia-mode-btn.active { background: #1a91c1; color: #fff; border-color: #1a91c1; }

/* ── 输入区 ── */
.aia-input-bar {
  display: flex; align-items: flex-end; gap: 7px;
  padding: 9px 10px;
  border-top: 1px solid #e2e8f0; background: #fff; flex-shrink: 0;
}
.aia-input-bar textarea {
  flex: 1; padding: 7px 10px;
  border: 1px solid #e2e8f0; border-radius: 9px;
  font-size: 13px; resize: none; outline: none;
  line-height: 1.5; max-height: 90px; overflow-y: auto;
  font-family: inherit; transition: border-color .15s;
}
.aia-input-bar textarea:focus { border-color: #1a91c1; box-shadow: 0 0 0 2px rgba(26,145,193,.12); }
.aia-input-bar textarea:disabled { background: #f7f9fb; }

.aia-send-btn {
  flex-shrink: 0; width: 36px; height: 36px;
  border: none; border-radius: 9px;
  background: #1a91c1; color: #fff;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: background .15s, transform .1s;
}
.aia-send-btn svg { width: 16px; height: 16px; }
.aia-send-btn:hover:not(:disabled) { background: #0e7cab; transform: scale(1.05); }
.aia-send-btn:disabled { background: #c9d5e0; cursor: not-allowed; transform: none; }
</style>
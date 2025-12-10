<template>
  <div class="graph-sidebar">
    <!-- 问答区域 -->
    <div class="sidebar-card chat-card">
      <h3>知识图谱问答</h3>
      
      <!-- 消息区域 -->
      <div class="messages-container" ref="messagesContainer">
        <!-- 欢迎消息 -->
        <div v-if="messages.length === 0" class="welcome-message">
          <p>您好！我是知识图谱助手</p>
          <p class="welcome-hint">您可以问我关于文献、实体关系的问题</p>
        </div>

        <!-- 聊天消息 -->
        <div v-for="(message, index) in messages" :key="index" 
             class="message-item" 
             :class="{ 'message-user': message.isUser, 'message-ai': !message.isUser }">
          <div class="message-content">
            <!-- AI 消息使用格式化显示 -->
            <div v-if="!message.isUser" class="ai-response">
              <div class="response-text" v-html="formatAnswer(message.content)"></div>
              <!-- 引用来源 -->
              <div v-if="message.citations && message.citations.length > 0" class="citations-section">
                <div class="citations-header">📚 参考来源</div>
                <div class="citations-list">
                  <div v-for="(citation, idx) in message.citations" :key="idx" class="citation-item">
                    <span class="citation-badge">{{ idx + 1 }}</span>
                    <span class="citation-text">{{ citation.content_snippet }}</span>
                  </div>
                </div>
              </div>
            </div>
            <!-- 用户消息 -->
            <p v-else>{{ message.content }}</p>
          </div>
          <div class="message-time">{{ message.created_at }}</div>
        </div>

        <!-- 加载中 -->
        <div v-if="isLoading" class="message-item message-ai">
          <div class="message-loading">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="input-container">
        <textarea 
          v-model="userInput" 
          placeholder="问我任何关于知识图谱的问题..."
          @keydown.enter.prevent="sendMessage"
          rows="2"
          ref="inputArea"
        ></textarea>
        <button 
          :disabled="!userInput.trim() || isLoading" 
          @click="sendMessage"
          class="send-button"
        >
          发送
        </button>
      </div>
    </div>

    <!-- 热门问题 -->
    <div class="sidebar-card">
      <h3>💡 热门问题</h3>
      <div class="popular-questions">
        <div 
          v-for="(question, index) in popularQuestions" 
          :key="index"
          class="question-item"
          @click="askQuestion(question)"
        >
          <span class="question-icon">🔍</span>
          <span class="question-text">{{ question }}</span>
        </div>
      </div>
    </div>

    <!-- 最近搜索 -->
    <div class="sidebar-card">
      <h3>最近搜索</h3>
      <div v-if="recentSearches.length === 0" class="empty-state">
        暂无搜索记录
      </div>
      <div v-else class="recent-list">
        <div 
          v-for="(search, index) in recentSearches" 
          :key="index"
          class="recent-item"
          @click="askQuestion(search.question)"
        >
          <span class="recent-text">{{ search.question }}</span>
          <span class="recent-time">{{ search.time }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, nextTick } from 'vue'
import AI from '@/api/Ai'
import KnowledgeGraph from '@/api/knowledgeGraph'

const STORAGE_KEY = 'ragChatMessages'
const RECENT_SEARCH_KEY = 'ragRecentSearches'

export default {
  name: 'GraphSidebar',
  emits: ['focus-node'],
  setup(props, { emit }) {
    const messages = ref([])
    const userInput = ref('')
    const isLoading = ref(false)
    const statsLoading = ref(false)
    const messagesContainer = ref(null)
    const inputArea = ref(null)

    const graphStats = reactive({
      totalNodes: 0,
      totalRelations: 0,
      literatureCount: 0,
      conceptCount: 0,
      authorCount: 0,
    })

    const popularQuestions = ref([
      '有哪些关于肝硬化治疗的最新研究？',
      '谁是肝病研究领域的权威专家？',
      '肝硬化与肝癌之间有什么关系？',
      '近期有哪些高影响因子的肝病文献？',
      '肝纤维化的分子机制是什么？',
    ])

    const recentSearches = ref([])

    // 格式化 AI 回答
    const formatAnswer = (text) => {
      if (!text) return ''
      
      // 1. 处理 \n 换行符，转换为 <br>
      let formatted = text.replace(/\\n/g, '<br>')
      
      // 2. 处理【Literature X】引用格式，转换为徽章样式
      formatted = formatted.replace(/【Literature (\d+)】/g, 
        '<span class="lit-badge" title="文献引用 $1">📄 Lit.$1</span>')
      
      // 3. 处理段落（连续两个换行符）
      formatted = formatted.replace(/<br><br>/g, '</p><p>')
      
      // 4. 高亮专业术语（可选）
      const terms = ['cirrhosis', 'hepatitis', 'HBV', 'HCV', 'fibrosis', 'portal hypertension']
      terms.forEach(term => {
        const regex = new RegExp(`\\b(${term})\\b`, 'gi')
        formatted = formatted.replace(regex, '<strong class="term-highlight">$1</strong>')
      })
      
      // 5. 包裹在段落标签中
      if (!formatted.startsWith('<p>')) {
        formatted = '<p>' + formatted + '</p>'
      }
      
      return formatted
    }

    // 加载聊天历史
    const loadChatHistory = () => {
      try {
        const saved = sessionStorage.getItem(STORAGE_KEY)
        if (saved) {
          messages.value = JSON.parse(saved)
        }
      } catch (error) {
        console.error('加载聊天历史失败:', error)
      }
    }

    // 保存聊天历史
    const saveChatHistory = () => {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.value))
      } catch (error) {
        console.error('保存聊天历史失败:', error)
      }
    }

    // 加载最近搜索
    const loadRecentSearches = () => {
      try {
        const saved = sessionStorage.getItem(RECENT_SEARCH_KEY)
        if (saved) {
          recentSearches.value = JSON.parse(saved)
        }
      } catch (error) {
        console.error('加载最近搜索失败:', error)
      }
    }

    // 保存最近搜索
    const saveRecentSearch = (question) => {
      const now = new Date()
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      
      recentSearches.value.unshift({
        question,
        time: timeStr,
      })

      // 只保留最近5条
      if (recentSearches.value.length > 5) {
        recentSearches.value = recentSearches.value.slice(0, 5)
      }

      try {
        sessionStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(recentSearches.value))
      } catch (error) {
        console.error('保存最近搜索失败:', error)
      }
    }

    // 添加消息
    const addMessage = (content, isUser, citations = null) => {
      const now = new Date()
      const created_at = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0') + ' ' +
        String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0') + ':' +
        String(now.getSeconds()).padStart(2, '0')

      messages.value.push({
        content,
        isUser,
        created_at,
        citations,
      })

      saveChatHistory()
      nextTick(() => {
        scrollToBottom()
      })
    }

    // 滚动到底部
    const scrollToBottom = () => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    }

    // 发送消息
    const sendMessage = async () => {
      const question = userInput.value.trim()
      if (!question || isLoading.value) return

      addMessage(question, true)
      saveRecentSearch(question)
      userInput.value = ''
      isLoading.value = true

      try {
        const response = await AI.ask({
          question: question,
          options: {
            max_entities: 10,
            max_edges: 50,
            top_k: 5,
          },
        })

        if (response.data && response.data.data) {
          const data = response.data.data
          const answer = data.answer || data.response || '抱歉，我无法理解您的问题。'
          const citations = data.citations || []
          
          addMessage(answer, false, citations)
        } else {
          addMessage('抱歉，获取答案失败。请稍后再试。', false)
        }
      } catch (error) {
        console.error('RAG问答失败:', error)
        addMessage('抱歉，服务暂时不可用。请稍后再试。', false)
      } finally {
        isLoading.value = false
      }
    }

    // 快速提问
    const askQuestion = (question) => {
      userInput.value = question
      nextTick(() => {
        if (inputArea.value) {
          inputArea.value.focus()
        }
      })
    }

    // 加载图谱统计
    const loadStatistics = async () => {
      try {
        statsLoading.value = true
        const response = await KnowledgeGraph.statistics()

        if (response.data.data && response.data.data.basic_stats) {
          const data = response.data.data.basic_stats
          Object.assign(graphStats, {
            totalNodes: data.total_entities || 0,
            totalRelations: data.total_relations || 0,
            literatureCount: data.literature_count || 0,
            conceptCount: data.concept_count || 0,
            authorCount: data.author_count || 0,
          })
        }
      } catch (error) {
        console.error('加载统计数据失败:', error)
      } finally {
        statsLoading.value = false
      }
    }

    onMounted(() => {
      loadChatHistory()
      loadRecentSearches()
      loadStatistics()
    })

    return {
      messages,
      userInput,
      isLoading,
      statsLoading,
      messagesContainer,
      inputArea,
      graphStats,
      popularQuestions,
      recentSearches,
      sendMessage,
      askQuestion,
      formatAnswer,
    }
  },
}
</script>

<style scoped>
.graph-sidebar {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sidebar-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 16px;
}

.sidebar-card h3 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 15px;
  font-weight: 600;
}

/* 聊天卡片 */
.chat-card {
  display: flex;
  flex-direction: column;
  height: 450px;
  padding: 12px;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 12px;
  padding: 8px;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.welcome-message {
  text-align: center;
  padding: 20px 10px;
  color: #666;
}

.welcome-message p:first-child {
  font-size: 16px;
  font-weight: 500;
  color: #1a91c1;
  margin-bottom: 8px;
}

.welcome-hint {
  font-size: 13px;
  color: #888;
}

.message-item {
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
  max-width: 85%;
}

.message-user {
  align-self: flex-end;
  margin-left: auto;
}

.message-ai {
  align-self: flex-start;
  margin-right: auto;
}

.message-content {
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.6;
  word-wrap: break-word;
}

.message-user .message-content {
  background-color: #1a91c1;
  color: white;
  border-top-right-radius: 4px;
}

.message-ai .message-content {
  background-color: #e9ecef;
  color: #212529;
  border-top-left-radius: 4px;
  max-width: 100%;
}

/* AI 回答格式化样式 */
.ai-response {
  width: 100%;
}

.response-text {
  font-size: 13px;
  line-height: 1.7;
  color: #2c3e50;
}

.response-text :deep(p) {
  margin: 0 0 10px 0;
  text-align: justify;
}

.response-text :deep(p:last-child) {
  margin-bottom: 0;
}

.response-text :deep(br) {
  display: block;
  content: "";
  margin-top: 6px;
}

/* 文献引用徽章 */
.response-text :deep(.lit-badge) {
  display: inline-block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  margin: 0 3px;
  cursor: help;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
  transition: transform 0.2s;
}

.response-text :deep(.lit-badge:hover) {
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(102, 126, 234, 0.4);
}

/* 术语高亮 */
.response-text :deep(.term-highlight) {
  color: #1a91c1;
  font-weight: 600;
  background: linear-gradient(to bottom, transparent 60%, rgba(26, 145, 193, 0.15) 60%);
}

/* 引用来源区域 */
.citations-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #d0d7de;
}

.citations-header {
  font-size: 12px;
  font-weight: 600;
  color: #57606a;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.citations-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.citation-item {
  display: flex;
  align-items: flex-start;
  font-size: 11px;
  line-height: 1.5;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 6px;
  border-left: 3px solid #1a91c1;
}

.citation-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  background: #1a91c1;
  color: white;
  border-radius: 50%;
  font-size: 10px;
  font-weight: 600;
  margin-right: 8px;
  flex-shrink: 0;
}

.citation-text {
  flex: 1;
  color: #57606a;
  line-height: 1.4;
}

.message-time {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
  padding: 0 4px;
}

.message-loading {
  display: flex;
  padding: 8px;
  gap: 4px;
}

.message-loading span {
  width: 6px;
  height: 6px;
  background-color: #6c757d;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.message-loading span:nth-child(1) {
  animation-delay: -0.32s;
}

.message-loading span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.input-container {
  display: flex;
  gap: 8px;
}

.input-container textarea {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-size: 13px;
  resize: none;
  outline: none;
  font-family: inherit;
}

.input-container textarea:focus {
  border-color: #1a91c1;
}

.send-button {
  background-color: #1a91c1;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 14px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: background-color 0.2s;
  white-space: nowrap;
}

.send-button:hover:not(:disabled) {
  background-color: #0e7cab;
}

.send-button:disabled {
  background-color: #e9ecef;
  color: #6c757d;
  cursor: not-allowed;
}

/* 热门问题 */
.popular-questions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.question-item {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  background-color: #f8f9fa;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.question-item:hover {
  background-color: #e9ecef;
  transform: translateX(2px);
}

.question-icon {
  margin-right: 8px;
  font-size: 14px;
}

.question-text {
  font-size: 12px;
  color: #495057;
  line-height: 1.4;
}

/* 最近搜索 */
.recent-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.recent-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  background-color: #f8f9fa;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.recent-item:hover {
  background-color: #e9ecef;
}

.recent-text {
  flex: 1;
  font-size: 12px;
  color: #495057;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 8px;
}

.recent-time {
  font-size: 11px;
  color: #999;
  white-space: nowrap;
}

/* 图谱统计 */
.stats-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f5f5f5;
}

.stats-item:last-child {
  border-bottom: none;
}

.stats-label {
  color: #666;
  font-size: 13px;
}

.stats-value {
  color: #1a91c1;
  font-weight: 600;
  font-size: 14px;
}

.loading-state,
.empty-state {
  text-align: center;
  color: #999;
  font-size: 13px;
  padding: 12px 0;
}

/* 滚动条样式 */
.messages-container::-webkit-scrollbar {
  width: 4px;
}

.messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.messages-container::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 4px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: #999;
}
</style>
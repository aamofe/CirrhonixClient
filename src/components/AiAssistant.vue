<!-- src/components/AiAssistant.vue -->
<template>
  <div class="ai-assistant-container" :class="{ 'is-expanded': isExpanded }">
    <!-- 收起状态的浮动按钮 -->
    <div v-if="!isExpanded" class="ai-assistant-button" @click="toggleAssistant">
      <div class="assistant-avatar">
        <img src="@/assets/assistant-avatar.png" alt="AI助手" />
      </div>
      <span class="assistant-hint">有问题? 点击咨询</span>
    </div>

    <!-- 展开的聊天界面 -->
    <div v-else class="ai-assistant-panel">
      <!-- 聊天头部 -->
      <div class="assistant-header">
        <div class="assistant-info">
          <img src="@/assets/assistant-avatar.png" alt="AI助手" class="assistant-avatar-sm" />
          <div class="assistant-title">
            <h3>智能助手</h3>
            <span class="assistant-status">在线</span>
          </div>
        </div>
        <button class="close-button" @click="toggleAssistant">
          <span>&times;</span>
        </button>
      </div>

      <!-- 聊天消息区域 -->
      <div class="assistant-messages" ref="messagesContainer">
        <!-- 欢迎消息 -->
        <div v-if="messages.length === 0" class="message-welcome">
          <h4>您好！我是LiverScholar的AI助手</h4>
          <p>我可以帮您:</p>
          <ul class="welcome-message">
            <li>解答有关肝硬化的问题</li>
            <li>总结和分析文献内容</li>
            <li>提供相关文献推荐</li>
            <li>翻译医学文本</li>
          </ul>
          <p>请输入您的问题，我会尽力协助您！</p>
        </div>

        <!-- 聊天消息 -->
        <div v-for="(message, index) in messages" :key="index" class="message-item" :class="{
          'message-user': message.isUser,
          'message-ai': !message.isUser,
        }">
          <div class="message-content">
            <!-- 使用MarkdownDisplayer组件显示AI的消息 -->
            <MarkdownDisplayer v-if="!message.isUser" :content="message.content" />
            <!-- 用户的消息仍然使用普通格式 -->
            <p v-else>{{ message.content }}</p>
          </div>
          <div class="message-time">{{ formatTime(message.timestamp) }}</div>
        </div>

        <!-- 加载中指示器 -->
        <div v-if="isLoading" class="message-item message-ai">
          <div class="message-loading">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="assistant-input">
        <textarea v-model="userInput" placeholder="输入您的问题..." @keydown.enter.prevent="sendMessage" rows="1"
          ref="inputArea"></textarea>
        <button :disabled="!userInput.trim() || isLoading" @click="sendMessage" class="send-button">
          发送
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import AI from "@/api/Ai" // 假设您的AI类导入路径
import MarkdownDisplayer from "@/components/markdown/MarkdownDisplayer.vue"

const STORAGE_KEY = 'aiAssistantMessages'
const CONTEXT_KEY = 'aiAssistantContext'

export default {
  name: "AiAssistant",
  components: {
    MarkdownDisplayer
  },
  data() {
    return {
      isExpanded: false,
      messages: [],
      userInput: "",
      isLoading: false,
      currentContext: [],
    }
  },
  created() {
    this.loadChatHistory()
  },
  methods: {
    toggleAssistant() {
      this.isExpanded = !this.isExpanded
      if (this.isExpanded) {
        this.$nextTick(() => {
          this.$refs.inputArea.focus()
          this.scrollToBottom()
        })
      }
    },

    async sendMessage(e) {
      if (e.shiftKey && e.key === "Enter") return // 允许shift+enter换行

      const message = this.userInput.trim()
      if (!message || this.isLoading) return

      // 添加用户消息到聊天
      this.addMessage(message, true)
      this.userInput = ""
      this.isLoading = true

      try {
        const response = await AI.query({
          query: message,
          context_literature_ids: this.currentContext,
          system_message: `您是LiverScholar肝硬化文献智能检索系统的AI助手，请基于专业医学知识解答用户的问题。`,
          temperature: 0.7,
        })

        if (response.data && response.data.data.response) {
          this.addMessage(response.data.data.response, false)
          if (response.data.related_literature_ids) {
            this.currentContext = response.data.related_literature_ids
            // 保存上下文到sessionStorage
            this.saveChatContext()
          }
        }
      } catch (error) {
        this.$message.error(error?.response?.data?.message)
        this.addMessage("抱歉，我暂时无法回答您的问题。请稍后再试。", false)
      } finally {
        this.isLoading = false
        // 滚动到最新消息
        this.$nextTick(() => {
          this.scrollToBottom()
        })
      }
    },

    addMessage(content, isUser) {
      this.messages.push({
        content,
        isUser,
        timestamp: new Date(),
      })

      // 保存消息历史到sessionStorage
      this.saveChatHistory()

      // 如果是用户发送的消息，立即滚动
      if (isUser) {
        this.$nextTick(() => {
          this.scrollToBottom()
        })
      }
    },

    scrollToBottom() {
      const container = this.$refs.messagesContainer
      if (container) {
        container.scrollTop = container.scrollHeight
      }
    },

    formatTime(date) {
      if (typeof date === 'string') {
        date = new Date(date)
      }
      return new Intl.DateTimeFormat("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(date)
    },

    // 保存聊天历史到sessionStorage
    saveChatHistory() {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.messages))
      } catch (error) {
        console.error('保存聊天历史失败', error)
      }
    },

    // 保存上下文到sessionStorage
    saveChatContext() {
      try {
        sessionStorage.setItem(CONTEXT_KEY, JSON.stringify(this.currentContext))
      } catch (error) {
        console.error('保存上下文失败', error)
      }
    },

    // 从sessionStorage加载聊天历史
    loadChatHistory() {
      try {
        const savedMessages = sessionStorage.getItem(STORAGE_KEY)
        if (savedMessages) {
          this.messages = JSON.parse(savedMessages)
        }

        const savedContext = sessionStorage.getItem(CONTEXT_KEY)
        if (savedContext) {
          this.currentContext = JSON.parse(savedContext)
        }
      } catch (error) {
        console.error('加载聊天历史失败', error)
      }
    },
  },
}
</script>

<style scoped>
.ai-assistant-container {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 1000;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    Arial, sans-serif;
}

/* 收起状态的按钮样式 */
.ai-assistant-button {
  display: flex;
  align-items: center;
  background-color: #1a91c1;
  color: white;
  border-radius: 24px;
  padding: 12px 20px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.ai-assistant-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.assistant-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-right: 10px;
  overflow: hidden;
}

.assistant-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.assistant-avatar-sm {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.assistant-hint {
  font-size: 14px;
  font-weight: 500;
}

/* 展开后的面板样式 */
.ai-assistant-panel {
  display: flex;
  flex-direction: column;
  width: 360px;
  height: 500px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.assistant-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: #1a91c1;
  color: white;
}

.assistant-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.assistant-title {
  display: flex;
  flex-direction: column;
}

.assistant-title h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.assistant-status {
  font-size: 12px;
  opacity: 0.8;
}

.close-button {
  background: transparent;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  transition: background-color 0.3s;
}

.close-button:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

/* 消息区域 */
.assistant-messages {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  background-color: #f8f9fa;
}

.message-welcome {
  background-color: #e6f7ff;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.message-welcome h4 {
  margin-top: 0;
  margin-bottom: 8px;
  color: #1a91c1;
}

.message-welcome ul {
  padding-left: 20px;
  margin: 8px 0;
}

.message-welcome li {
  margin-bottom: 4px;
}

.message-item {
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  max-width: 80%;
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
  padding: 10px 14px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.5;
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
}

.message-ai .message-content :deep(.mavon-editor) {
  min-height: 0;
  width: 100%;
  border: none;
  background: transparent;
  margin: 0;
  padding: 0;
}

.message-ai .message-content :deep(.v-note-wrapper) {
  min-height: 0;
  border: none;
  box-shadow: none !important;
}

.message-ai .message-content :deep(.v-note-panel) {
  border: none;
}

.message-ai .message-content :deep(.v-note-navigation-wrapper) {
  display: none;
}

.message-ai .message-content :deep(.v-note-show) {
  padding: 0;
  background: transparent;
}

.message-time {
  font-size: 11px;
  color: #6c757d;
  margin-top: 4px;
  align-self: flex-end;
}

.message-loading {
  display: flex;
  padding: 10px;
  gap: 4px;
}

.message-loading span {
  display: inline-block;
  width: 8px;
  height: 8px;
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

  0%,
  80%,
  100% {
    transform: scale(0);
  }

  40% {
    transform: scale(1);
  }
}

/* 输入区域 */
.assistant-input {
  display: flex;
  padding: 12px;
  border-top: 1px solid #dee2e6;
  background-color: white;
}

.assistant-input textarea {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #dee2e6;
  border-radius: 20px;
  font-size: 14px;
  resize: none;
  outline: none;
  max-height: 100px;
  overflow-y: auto;
}

.assistant-input textarea:focus {
  border-color: #1a91c1;
}

.send-button {
  background-color: #1a91c1;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  margin-left: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s;
}

.send-button:hover:not(:disabled) {
  background-color: #0e7cab;
}

.send-button:disabled {
  background-color: #e9ecef;
  color: #6c757d;
  cursor: not-allowed;
}

.welcome-message {
  list-style: none;
  padding-left: 0;
  /* 可选，让内容更贴边 */
  margin: 0;
}
</style>
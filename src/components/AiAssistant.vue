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
          <div class="message-time">
            <span class="date">{{ message.created_at }}</span>
          </div>
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

      <!-- 功能上拉框 -->
      <div class="assistant-features" v-if="literatureId">
        <div class="feature-panel" :class="{ 'is-expanded': isFeaturePanelOpen }">
          <div class="feature-items">
            <div class="feature-item" @click="handleTranslate">
              <span class="feature-icon">🔠</span>
              <span class="feature-name">翻译</span>
            </div>
            <div class="feature-item" @click="handleSummarize">
              <span class="feature-icon">📝</span>
              <span class="feature-name">总结</span>
            </div>
            <div class="feature-item" @click="handleRecommend">
              <span class="feature-icon">📚</span>
              <span class="feature-name">推荐</span>
            </div>
          </div>
        </div>
        <div class="feature-toggle" @click="toggleFeaturePanel" :class="{ 'is-expanded': isFeaturePanelOpen }">
          <span class="toggle-icon">{{ isFeaturePanelOpen ? "▼" : "▲" }}</span>
          <span>文献工具</span>
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
import AI from "@/api/Ai"
import MarkdownDisplayer from "@/components/markdown/MarkdownDisplayer.vue"

const STORAGE_KEY = "aiAssistantMessages"
const CONTEXT_KEY = "aiAssistantContext"

export default {
  name: "AiAssistant",
  components: {
    MarkdownDisplayer,
  },
  props: {
    literatureId: {
      type: [Number, String],
      default: null,
    },
  },
  data() {
    return {
      isExpanded: false,
      messages: [],
      userInput: "",
      isLoading: false,
      currentContext: [],
      isFeaturePanelOpen: false,
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

    toggleFeaturePanel() {
      this.isFeaturePanelOpen = !this.isFeaturePanelOpen
    },

    async sendMessage(e) {
      if (e.shiftKey && e.key === "Enter") return

      const message = this.userInput.trim()
      if (!message || this.isLoading) return


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

            this.saveChatContext()
          }
        }
      } catch (error) {
        this.$message.error(error?.response?.data?.message)
        this.addMessage("抱歉，我暂时无法回答您的问题。请稍后再试。", false)
      } finally {
        this.isLoading = false

        this.$nextTick(() => {
          this.scrollToBottom()
        })
      }
    },

    async handleTranslate() {
      if (this.isLoading) return
      this.isLoading = true

      try {
        this.addMessage("请帮我翻译当前文献", true)


        const response = await AI.translate({
          literature_id: this.literatureId,
          source_language: "en",
          target_language: "zh-cn",
        })


        const translationData = response.data
        let translatedText = null


        if (translationData.data && translationData.data.translated_text) {
          translatedText = translationData.data.translated_text
        } else if (translationData.translated_text) {
          translatedText = translationData.translated_text
        } else if (translationData.translation) {
          translatedText = translationData.translation
        } else if (typeof translationData === "string") {
          translatedText = translationData
        }

        if (translatedText) {
          this.addMessage(translatedText, false)
        } else {
          ;
          this.addMessage(
            "抱歉，翻译数据解析失败。收到的响应格式可能有问题。",
            false
          )
        }
      } catch (error) {
        ;
        this.$message.error(error?.response?.data?.message || "翻译失败")
        this.addMessage("抱歉，翻译请求失败。请稍后再试。", false)
      } finally {
        this.isLoading = false
        this.$nextTick(() => {
          this.scrollToBottom()
        })
      }


      this.isFeaturePanelOpen = false
    },

    async handleSummarize() {
      if (this.isLoading) return
      this.isLoading = true

      try {
        this.addMessage("请帮我总结当前文献", true)


        const response = await AI.summarize(this.literatureId, {
          language: "zh-cn",
          max_length: 300,
        })


        const summaryData = response.data
        let summary = null


        if (summaryData.data && summaryData.data.summary_text) {
          summary = summaryData.data.summary_text
        } else if (summaryData.data && summaryData.data.summary) {
          summary = summaryData.data.summary
        } else if (summaryData.summary_text) {
          summary = summaryData.summary_text
        } else if (summaryData.summary) {
          summary = summaryData.summary
        }

        if (summary) {
          this.addMessage(summary, false)
        } else {
          ;
          this.addMessage(
            "抱歉，摘要数据解析失败。收到的响应格式可能有问题。",
            false
          )
        }
      } catch (error) {
        ;
        this.$message.error(error?.response?.data?.message || "总结失败")
        this.addMessage("抱歉，总结请求失败。请稍后再试。", false)
      } finally {
        this.isLoading = false
        this.$nextTick(() => {
          this.scrollToBottom()
        })
      }


      this.isFeaturePanelOpen = false
    },

    async handleRecommend() {
      if (this.isLoading) return
      this.isLoading = true

      try {
        this.addMessage("请为我推荐与当前文献相关的论文", true)


        const response = await AI.recommend(this.literatureId, {
          count: 5,
        })


        const recommendData = response.data
        let recommendations = null


        if (recommendData.data && recommendData.data.recommendations) {
          recommendations = recommendData.data.recommendations
        } else if (recommendData.recommendations) {
          recommendations = recommendData.recommendations
        } else if (recommendData.data && Array.isArray(recommendData.data)) {
          recommendations = recommendData.data
        } else if (Array.isArray(recommendData)) {
          recommendations = recommendData
        }

        if (recommendations && recommendations.length > 0) {

          let message = "### 推荐文献\n\n"

          recommendations.forEach((item, index) => {
            message += `${index + 1}. **${item.title || "无标题"}**\n`

            if (item.authors) {
              message += `   作者: ${item.authors}\n`
            }

            if (item.journal || item.year) {
              message += `   期刊: ${item.journal || "未知"}, ${item.year || "未知年份"
                }\n`
            }

            if (item.relevance_score !== undefined) {
              message += `   相关度: ${Number(item.relevance_score).toFixed(
                2
              )}\n`
            }

            message += "\n"
          })

          this.addMessage(message, false)
        } else {
          ;
          this.addMessage("抱歉，未找到相关文献推荐或数据格式有问题。", false)
        }
      } catch (error) {
        ;
        this.$message.error(error?.response?.data?.message || "推荐失败")
        this.addMessage("抱歉，文献推荐请求失败。请稍后再试。", false)
      } finally {
        this.isLoading = false
        this.$nextTick(() => {
          this.scrollToBottom()
        })
      }


      this.isFeaturePanelOpen = false
    },

    addMessage(content, isUser) {
      const now = new Date()
      // 格式化为与后端一致的时间格式 "YYYY-MM-DD HH:MM:SS"
      const created_at = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0') + ' ' +
        String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0') + ':' +
        String(now.getSeconds()).padStart(2, '0')

      this.messages.push({
        content,
        isUser,
        created_at, // 与后端格式一致
        // 可以保留 timestamp 用于其他用途，但模板只使用 created_at
      })

      this.saveChatHistory()

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



    saveChatHistory() {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.messages))
      } catch (error) {
        ;
      }
    },


    saveChatContext() {
      try {
        sessionStorage.setItem(
          CONTEXT_KEY,
          JSON.stringify(this.currentContext)
        )
      } catch (error) {
        ;
      }
    },


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
        ;
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

/* 功能上拉框 */
.assistant-features {
  border-top: 1px solid #dee2e6;
  background-color: #f8f9fa;
}

.feature-toggle {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  color: #495057;
  background-color: #e9ecef;
  transition: background-color 0.2s;
}

.feature-toggle:hover {
  background-color: #dee2e6;
}

.feature-toggle .toggle-icon {
  margin-right: 8px;
  transition: transform 0.3s;
}

.feature-toggle.is-expanded .toggle-icon {
  transform: rotate(180deg);
}

.feature-panel {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.feature-panel.is-expanded {
  max-height: 120px;
}

.feature-items {
  display: flex;
  padding: 12px;
  justify-content: space-around;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.feature-item:hover {
  background-color: #dee2e6;
}

.feature-icon {
  font-size: 20px;
  margin-bottom: 4px;
}

.feature-name {
  font-size: 12px;
  color: #495057;
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
  color: #888;
  font-size: 12px;
  white-space: nowrap;
  line-height: 1.4;
}

.message-time .date,
.message-time .time {
  display: inline-block;
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
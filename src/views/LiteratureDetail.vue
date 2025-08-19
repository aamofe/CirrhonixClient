<!-- src/views/LiteratureDetail.vue -->
<template>
  <div class="literature-detail">
    <div class="container" v-if="!isLoading">
      <div class="article-header">
        <div class="article-actions">
          <router-link to="/literature" class="back-link">
            <el-icon>
              <Back />
            </el-icon>
            返回检索结果
          </router-link>

          <div class="action-buttons">
            <button class="action-btn" @click="showCollectionDialog">
              <span :class="['icon', isInAnyCollection ? 'favorited' : '']">★</span>
              {{ isInAnyCollection ? "已收藏" : "收藏" }}
            </button>

            <button class="action-btn" @click="toggleTranslation">
              <span class="icon">🔄</span>
              {{ showTranslation ? "原文" : "翻译" }}
            </button>

            <button class="action-btn" @click="downloadPDF">
              <span class="icon">↓</span>
              下载
            </button>
          </div>
        </div>

        <h1>{{ showTranslation && translatedTitle ? translatedTitle : article.title }}</h1>

        <div class="article-meta-section">
          <div class="article-meta">
            <div class="meta-row">
              <span class="meta-label">作者:</span>
              <span class="meta-value">
                <span v-for="(author, index) in article.authors" :key="index" class="author-name">
                  {{ author }}{{ index < article.authors.length - 1 ? ", " : "" }} </span>
                </span>
            </div>

            <div class="meta-row">
              <span class="meta-label">期刊:</span>
              <span class="meta-value">{{ article.source }}</span>
            </div>

            <div class="meta-row">
              <span class="meta-label">发表日期:</span>
              <span class="meta-value">{{ formatDate(article.publication_date) }}</span>
            </div>

            <div class="meta-row">
              <span class="meta-label">DOI:</span>
              <span class="meta-value">
                <a :href="'https://doi.org/' + article.doi" target="_blank" class="doi-link">
                  {{ article.doi }}
                </a>
              </span>
            </div>

            <div class="meta-row">
              <span class="meta-label">引用次数:</span>
              <span class="meta-value">{{ article.citation_count || 0 }}</span>
            </div>

            <div class="meta-row">
              <span class="meta-label">文献类型:</span>
              <span class="meta-value">{{ article.publication_type || "研究文章" }}</span>
            </div>

            <div class="meta-row" v-if="article.publisher">
              <span class="meta-label">出版商:</span>
              <span class="meta-value">{{ article.publisher || "N/A" }}</span>
            </div>

            <div class="meta-row" v-if="article.journal">
              <span class="meta-label">影响因子:</span>
              <span class="meta-value">{{ article.journal.impact_factor || "N/A" }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="article-body">
        <div class="main-content">
          <div class="section-card">
            <h2>摘要</h2>
            <div v-if="showTranslation && translatedAbstract">
              {{ translatedAbstract }}
            </div>
            <div v-else>
              {{ article.abstract }}
            </div>
          </div>

          <div class="section-card" v-if="article.keywords && article.keywords.length > 0">
            <h2>关键词</h2>
            <div class="keywords">
              <span v-for="(keyword, index) in article.keywords" :key="index" class="keyword-tag">
                {{ keyword }}
              </span>
            </div>
          </div>

          <!-- <div class="section-card">
            <h2>全文</h2>
            <div class="content-placeholder">
              {{ article.full_text || "全文内容将在此显示" }}
            </div>
          </div> -->

          <!-- 文献分析功能区域 - 移到这里 -->
          <div class="section-card analysis-section">
            <h2>文献分析</h2>
            <primary-button @click="startAnalysis" :disabled="isAnalyzing" class="analysis-btn" :loading="isAnalyzing">
              {{ isAnalyzing ? '分析中...' : '分析全文' }}
            </primary-button>

            <!-- 分析任务列表 -->
            <div v-if="analysisTasks.length > 0" class="analysis-tasks">
              <h3>分析任务</h3>

              <!-- 小于4个：直接显示 -->
              <div v-if="analysisTasks.length < 4" class="task-list-simple">
                <div v-for="task in analysisTasks" :key="task.id" class="analysis-task-item"
                  @click="showTaskDetail(task)">
                  <div class="task-info">
                    <div class="task-id">任务 #{{ task.id }}</div>
                    <div class="task-status" :class="getStatusClass(task.status)">
                      {{ getStatusText(task.status) }}
                    </div>
                  </div>
                  <div class="task-time">
                    {{ task.start_time ? formatDateTime(task.start_time) : '未开始' }}
                  </div>
                </div>
              </div>

              <!-- 4-8个：显示成2列 -->
              <div v-else-if="analysisTasks.length < 8" class="task-list-grid">
                <div v-for="task in analysisTasks" :key="task.id" class="analysis-task-item"
                  @click="showTaskDetail(task)">
                  <div class="task-info">
                    <div class="task-id">任务 #{{ task.id }}</div>
                    <div class="task-status" :class="getStatusClass(task.status)">
                      {{ getStatusText(task.status) }}
                    </div>
                  </div>
                  <div class="task-time">
                    {{ task.start_time ? formatDateTime(task.start_time) : '未开始' }}
                  </div>
                </div>
              </div>

              <!-- 大于8个：2列+滑动框 -->
              <div v-else class="task-list-scrollable">
                <el-scrollbar height="300px" class="task-scrollbar">
                  <div class="task-list-grid">
                    <div v-for="task in analysisTasks" :key="task.id" class="analysis-task-item"
                      @click="showTaskDetail(task)">
                      <div class="task-info">
                        <div class="task-id">任务 #{{ task.id }}</div>
                        <div class="task-status" :class="getStatusClass(task.status)">
                          {{ getStatusText(task.status) }}
                        </div>
                      </div>
                      <div class="task-time">
                        {{ task.start_time ? formatDateTime(task.start_time) : '未开始' }}
                      </div>
                    </div>
                  </div>
                </el-scrollbar>
              </div>
            </div>
          </div>

          <div class="section-card" v-if="article.references && article.references.length > 0">
            <h2>参考文献</h2>
            <ul class="references-list">
              <li v-for="(reference, index) in article.references" :key="index" class="reference-item"
                @click="navigateToReference(reference.id)">
                {{ reference.authors }} ({{ reference.year }}).
                {{ reference.title }}.
                <span class="reference-journal">{{ reference.journal }}</span>.
              </li>
            </ul>
          </div>
        </div>

        <div class="sidebar">
          <!-- 个人笔记 -->
          <div class="sidebar-card">
            <h3>个人笔记</h3>
            <textarea v-model="personalNotes" class="notes-textarea" placeholder="在此添加您的个人笔记..."></textarea>
            <div class="notes-actions">
              <primary-button @click="saveNotes" class="save-notes-btn">保存笔记</primary-button>
            </div>
          </div>

          <!-- AI助手 -->
          <AiAssistant :literatureId="articleId" />

          <div class="sidebar-card">
            <h3>相关文献</h3>
            <div class="related-articles">
              <div v-if="relatedArticles.length === 0" class="no-related">
                暂无相关文献
              </div>
              <div v-for="(related, index) in relatedArticles" :key="index" class="related-article"
                @click="navigateToArticle(related.id)">
                <div class="related-title">{{ related.title }}</div>
                <div class="related-meta">
                  {{ getAuthorDisplay(related.authors) }}
                  {{ related.publication_date ? new Date(related.publication_date).getFullYear() : '' }}
                </div>
              </div>
            </div>
          </div>

          <div class="sidebar-card ai-summary" v-if="aiSummary">
            <h3>AI 文献总结</h3>
            <div class="summary-content">
              {{ aiSummary }}
            </div>
            <primary-button :fullWidth="true" @click="generateAISummary" :disabled="isGeneratingSummary"
              class="ai-summary-btn">
              {{ aiSummary ? "重新生成总结" : "生成AI总结" }}
            </primary-button>
          </div>
        </div>
      </div>
    </div>
    <div class="loading-container" v-else>
      <div class="spinner"></div>
      <p>正在加载文献详情...</p>
    </div>
    <!-- 收藏夹选择对话框 -->
    <CollectionDialog title="选择收藏夹" :visible.sync="collectionDialogVisible" :literature-id="articleId"
      :collections="collections" @collections-updated="onCollectionsUpdated"
      @cancel="collectionDialogVisible = false" />

    <!-- 分析任务详情卡片 -->
    <AnalysisResultCard :visible="showAnalysisCard" :task-id="taskId" @close="closeAnalysisCard" />
    <site-footer />
  </div>
</template>

<script>
import PrimaryButton from "@/components/buttons/PrimaryButton.vue"
import SiteFooter from "@/components/layout/SiteFooter.vue"
import Literature from "@/api/Literature"
import { Back } from "@element-plus/icons-vue"
import AiAssistant from "@/components/AiAssistant.vue"
import CollectionDialog from "@/components/layout/CollectionDialog.vue"
import AnalysisResultCard from "@/components/AnalysisResultCard.vue"

export default {
  name: "LiteratureDetail",
  components: {
    PrimaryButton,
    SiteFooter,
    Back,
    AiAssistant,
    CollectionDialog,
    AnalysisResultCard
  },
  data() {
    return {
      isLoading: true,
      articleId: null,
      article: {
        title: "",
        abstract: "",
        content: "",
        publication_date: "",
        doi: "",
        authors: [],
        journal: {
          name: "",
          impact_factor: null,
        },
        keywords: [],
        references: [],
        citation_count: 0,
        publisher: "",
        type: "",
      },
      personalNotes: "",
      isInAnyCollection: false,
      showTranslation: false,
      translatedTitle: "",
      translatedAbstract: "",
      relatedArticles: [],
      collections: [],
      // selectedCollectionIds: [],
      // newCollectionName: "",
      collectionDialogVisible: false,
      aiSummary: "",
      isGeneratingSummary: false,
      isAnalyzing: false,
      analysisTasks: [],
      showAnalysisCard: false,
      taskId: 0,
      isSavingNote: false,
    }
  },
  methods: {
    async loadAnalysisTasks() {
      try {
        const response = await Literature.getAnalyzeList(null, this.articleId)
        this.analysisTasks = response.data.data || []
      } catch (error) {
        console.error("Error loading analysis tasks:", error)
      }
    },

    async startAnalysis() {
      if (!this.article.full_text) {
        this.$message.warning('该文献暂无全文内容，无法进行分析')
        return
      }

      this.isAnalyzing = true
      try {
        const response = await Literature.analyzeLiterature(this.articleId)
        this.$message.success('分析任务已启动')

        await this.loadAnalysisTasks()
      } catch (error) {
        console.error("Error starting analysis:", error)
        this.$message.error(error.response?.data?.message || '启动分析失败')
      } finally {
        this.isAnalyzing = false
      }
    },

    async showTaskDetail(task) {
      try {
        // console.log('点击任务:', task)
        this.taskId = task.id
        // console.log("父文件中id:", this.taskId)
        await this.$nextTick()
        this.showAnalysisCard = true

        // console.log('卡片状态:', this.showAnalysisCard, 'TaskId:', this.taskId) // 调试日志
      } catch (error) {
        console.error("Error loading task detail:", error)
        this.$message.error('加载任务详情失败')
      }
    },

    closeAnalysisCard() {
      console.log('closeAnalysisCard called in parent')
      this.showAnalysisCard = false
      this.taskId = 0 // 清空 taskId
    },

    getStatusText(status) {
      const statusMap = {
        'pending': '等待中',
        'running': '分析中',
        'completed': '已完成',
        'failed': '失败'
      }
      return statusMap[status] || status
    },

    getStatusClass(status) {
      return `status-${status}`
    },

    formatDateTime(dateTimeStr) {
      if (!dateTimeStr) return ''
      const date = new Date(dateTimeStr)
      return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    async loadArticleDetail() {
      this.isLoading = true
      try {
        if (!this.articleId) {
          this.articleId = this.$route.params.id
        }
        const response = await Literature.detail(this.articleId)
        this.article = response.data.data
        await this.loadUserInteraction()

        await this.loadUserCollections()
        await this.loadAnalysisTasks()
        if (this.article.title) {
          this.translateText(this.article.title, 'title')
        }
        if (this.article.abstract) {
          this.translateText(this.article.abstract, 'abstract')
        }
      } catch (error) {
        console.error("Error loading article details:", error)
        this.$message.error(error.response.data.message)
      } finally {
        this.isLoading = false
      }
    },
    async loadUserInteraction() {
      try {
        const response = await Literature.getInteraction(this.articleId)
        const interaction = response.data.data
        if (interaction) {
          this.personalNotes = interaction.personal_notes || ""
        }
      } catch (error) {
        console.error("Error loading user interaction:", error)
      }
    },
    async loadUserCollections() {
      try {
        const response = await Literature.getCollections(this.articleId)

        this.collections = (response.data.data || []).map(collection => ({
          ...collection,
          selected: collection.has_literature
        }))

        this.isInAnyCollection = this.collections.some(collection => collection.has_literature)

        this.selectedCollectionIds = this.collections
          .filter(collection => collection.has_literature)
          .map(collection => collection.id)
      } catch (error) {
        console.error("Error loading user collections:", error)
      }
    },
    formatDate(dateString) {
      if (!dateString) return ""

      const date = new Date(dateString)
      return date.toLocaleDateString("zh-CN")
    },
    showCollectionDialog() {
      this.collectionDialogVisible = true
    },

    toggleTranslation() {
      this.showTranslation = !this.showTranslation
    },
    async translateText(text, type) {
      try {
        const response = await Literature.translate({ "text": text })

        if (type === 'title') {
          this.translatedTitle = response.data.data.translated
        } else if (type === 'abstract') {
          this.translatedAbstract = response.data.data.translated
        }
      } catch (error) {
        console.error(`Error translating ${type}:`, error)
      }
    },
    async saveNotes() {
      if (this.isSavingNote) return
      this.isSavingNote = true
      try {
        await Literature.createInteraction({
          literature_id: this.articleId,
          personal_notes: this.personalNotes,
        })
        this.$message.success('笔记已保存')
      } catch (error) {
        console.error("Error saving notes:", error)
        this.$message.error('笔记保存失败')
      } finally {
        this.isSavingNote = false
      }
    },
    downloadPDF() {
      if (this.article.pdf_url) {
        window.open(this.article.pdf_url, "_blank")
      } else {
        this.$message.warning('PDF暂不可用')
      }
    },

    navigateToReference(referenceId) {
      if (referenceId) {
        this.$router.push(`/literature/${referenceId}`)
      }
    },
    navigateToArticle(articleId) {
      if (articleId) {
        this.$router.push(`/literature/${articleId}`)
      }
    },
    getAuthorDisplay(authors) {
      if (!authors || !authors.length) return ''

      if (typeof authors === 'string') {
        return authors
      }

      if (authors.length === 1) {
        return authors[0].name || authors[0]
      }

      if (authors.length > 1) {
        const firstAuthor = authors[0].name || authors[0]
        return `${firstAuthor} 等. `
      }

      return ''
    },
    async generateAISummary() {
      if (this.isGeneratingSummary) return

      this.isGeneratingSummary = true

      try {
        // 这里可以调用AI生成摘要的接口
        // 假设接口返回的结构中包含summary字段
        // const response = await AIService.generateSummary(this.article.id)
        // this.aiSummary = response.data.summary

        // 模拟API调用
        setTimeout(() => {
          this.aiSummary = `这篇文章研究了非酒精性脂肪性肝炎向肝硬化转变的分子机制。通过多组学分析揭示了NASH患者肝脏中炎症反应与细胞外基质累积的分子调控网络，发现了TGF-β1信号通路在肝纤维化进展中的关键作用。研究结果为肝纤维化的精准治疗提供了新的靶点。`
          this.isGeneratingSummary = false
        }, 2000)
      } catch (error) {
        console.error("Error generating AI summary:", error)
        this.isGeneratingSummary = false
      }
    },
    onCollectionsUpdated(updatedCollections) {
      // 更新本地收藏夹数据
      this.collections = updatedCollections

      // 更新是否已收藏到任意收藏夹
      this.isInAnyCollection = updatedCollections.some(collection => collection.selected)
    },

  },
  created() {
    this.articleId = this.$route.params.id
    this.loadArticleDetail()
  },
  watch: {
    "$route.params.id"(newId) {
      if (newId && newId !== this.articleId) {
        this.articleId = newId
        this.loadArticleDetail()
      }
    },
  },
}
</script>

<style scoped>
.literature-detail {
  background-color: #f5fbff;
  min-height: 100vh;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 30px 5%;
}

.article-header {
  margin-bottom: 30px;
}

.article-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.back-link {
  display: flex;
  align-items: center;
  color: #1a91c1;
  text-decoration: none;
  font-size: 14px;
}

.back-icon {
  margin-right: 5px;
  font-size: 20px;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.action-btn {
  display: flex;
  align-items: center;
  padding: 8px 15px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.action-btn:hover {
  background: #f9f9f9;
  border-color: #ccc;
}

.action-btn .icon {
  margin-right: 5px;
}

.action-btn .icon.favorited {
  color: #ffc107;
}

.article-header h1 {
  font-size: 26px;
  color: #333;
  margin-bottom: 20px;
  line-height: 1.4;
}

/* 调整作者信息区域，与主内容宽度一致 */
.article-meta-section {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.article-meta {
  flex: 1;
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  /* 确保与摘要等卡片样式一致 */
}

.meta-row {
  display: flex;
  margin-bottom: 10px;
}

.meta-row:last-child {
  margin-bottom: 0;
}

.meta-label {
  font-weight: 500;
  color: #555;
  width: 80px;
  flex-shrink: 0;
}

.meta-value {
  color: #333;
}

.author-name {
  color: #1a91c1;
  cursor: pointer;
}

.author-name:hover {
  text-decoration: underline;
}

.doi-link {
  color: #1a91c1;
  text-decoration: none;
}

.doi-link:hover {
  text-decoration: underline;
}

.article-body {
  display: flex;
  gap: 30px;
}

.main-content {
  flex: 1;
}

.sidebar {
  width: 320px;
  flex-shrink: 0;
}

.section-card,
.sidebar-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 20px;
  margin-bottom: 20px;
}

.section-card h2,
.sidebar-card h3 {
  margin-bottom: 15px;
  color: #333;
  font-size: 18px;
  font-weight: 500;
}

/* 分析功能区域样式 - 现在在主内容区 */
.analysis-section h2 {
  margin-bottom: 15px;
}

.analysis-btn {
  width: 120px;
  height: 36px;
  font-size: 14px;
  margin-bottom: 20px;
}

.analysis-tasks h3 {
  font-size: 16px;
  color: #333;
  margin-bottom: 15px;
  font-weight: 500;
}

/* 直接显示样式（小于4个任务） */
.task-list-simple {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 网格显示样式（4-8个任务） */
.task-list-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

/* 滚动显示样式（大于8个任务） */
.task-list-scrollable {
  border-radius: 6px;
}

.task-scrollbar {
  border-radius: 6px;
}

.analysis-task-item {
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.analysis-task-item:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
}

.task-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.task-id {
  font-weight: 500;
  color: #111827;
  font-size: 14px;
}

.task-status {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 500;
}

.status-pending {
  background-color: #fef3c7;
  color: #d97706;
}

.status-running {
  background-color: #dbeafe;
  color: #2563eb;
}

.status-completed {
  background-color: #d1fae5;
  color: #059669;
}

.status-failed {
  background-color: #fee2e2;
  color: #dc2626;
}

.task-time {
  font-size: 12px;
  color: #6b7280;
}

/* 自定义滚动条样式 */
:deep(.el-scrollbar__thumb) {
  background-color: rgba(144, 147, 153, 0.3);
  border-radius: 4px;
}

:deep(.el-scrollbar__thumb:hover) {
  background-color: rgba(144, 147, 153, 0.5);
}

:deep(.el-scrollbar__bar) {
  right: 2px;
  border-radius: 2px;
}

:deep(.el-scrollbar__wrap) {
  overflow-x: hidden;
}

.keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.keyword-tag {
  background: #e9f7f2;
  color: #66bb6a;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.content-placeholder {
  color: #666;
  line-height: 1.6;
}

.references-list {
  list-style-type: none;
  padding: 0;
}

.reference-item {
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
  color: #555;
  cursor: pointer;
}

.reference-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.reference-item:hover {
  color: #1a91c1;
}

.reference-journal {
  font-style: italic;
}

.notes-textarea {
  width: 100%;
  min-height: 150px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
}

/* 调整保存笔记按钮 */
.notes-actions {
  margin-top: 12px;
}

.save-notes-btn {
  width: 100px;
  height: 36px;
  font-size: 14px;
}

.info-item {
  display: flex;
  margin-bottom: 12px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  font-weight: 500;
  color: #555;
  width: 90px;
  flex-shrink: 0;
}

.info-value {
  color: #333;
}

.related-articles {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.no-related {
  color: #999;
  text-align: center;
  padding: 20px 0;
}

.related-article {
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
}

.related-article:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.related-title {
  color: #1a91c1;
  font-size: 14px;
  margin-bottom: 5px;
}

.related-meta {
  font-size: 12px;
  color: #888;
}

.ai-summary {
  position: relative;
}

.summary-content {
  margin-bottom: 15px;
  line-height: 1.6;
  color: #444;
}

.ai-summary-btn {
  margin-top: 10px;
}

.collections-list {
  margin-bottom: 15px;
}

.collection-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
  cursor: pointer;
}

.collection-item:last-child {
  border-bottom: none;
}

.collection-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #f5f5f5;
  margin-right: 10px;
  color: #888;
  font-size: 12px;
}

.collection-item.active .collection-icon {
  background: #a8e6cf;
  color: white;
}

.collection-name {
  color: #555;
}

.create-collection {
  display: flex;
  margin-top: 15px;
}

.create-collection input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px 0 0 4px;
  font-size: 14px;
}

.create-collection button {
  padding: 8px 15px;
  background: #1a91c1;
  color: white;
  border: none;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
}

.create-collection button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 3px solid rgba(26, 145, 193, 0.3);
  border-radius: 50%;
  border-top-color: #1a91c1;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 992px) {
  .article-body {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .article-actions {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .action-buttons {
    width: 100%;
    justify-content: space-between;
  }

  .meta-row {
    flex-direction: column;
  }

  .meta-label {
    width: auto;
    margin-bottom: 5px;
  }
}
</style>
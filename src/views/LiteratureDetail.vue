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

        <div class="article-meta">
          <div class="meta-row">
            <span class="meta-label">作者:</span>
            <span class="meta-value">
              <span v-for="(author, index) in article.authors" :key="index" class="author-name"
                @click="navigateToAuthor(author.id)">
                {{ author.name }}{{ index < article.authors.length - 1 ? ", " : "" }} </span>
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

          <div class="section-card">
            <h2>全文</h2>
            <div class="content-placeholder">
              {{ article.full_text || "全文内容将在此显示" }}
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

          <div class="section-card">
            <h2>个人笔记</h2>
            <textarea v-model="personalNotes" class="notes-textarea" placeholder="在此添加您的个人笔记..."></textarea>
            <div class="notes-actions">
              <primary-button @click="saveNotes" class="save-notes-btn">保存笔记</primary-button>
            </div>
          </div>
        </div>

        <div class="sidebar">
          <div class="sidebar-card">
            <h3>文章信息</h3>
            <div class="info-item">
              <span class="info-label">引用次数:</span>
              <span class="info-value">{{ article.citation_count || 0 }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">文献类型:</span>
              <span class="info-value">{{ article.publication_type || "研究文章" }}</span>
            </div>
            <div class="info-item" v-if="article.publisher">
              <span class="info-label">出版商:</span>
              <span class="info-value">{{ article.publisher || "N/A" }}</span>
            </div>
            <div class="info-item" v-if="article.journal">
              <span class="info-label">影响因子:</span>
              <span class="info-value">{{ article.journal.impact_factor || "N/A" }}</span>
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
    <el-dialog title="选择收藏夹" v-model="collectionDialogVisible" width="400px">
      <div class="collections-dialog">
        <div v-if="collections.length === 0" class="no-collections">
          您还没有创建收藏夹
        </div>
        <div v-else class="collections-list-dialog">
          <div v-for="(collection, index) in collections" :key="index" class="collection-item-dialog"
            @click="toggleCollectionSelection(collection.id)">
            <el-checkbox v-model="collection.selected"></el-checkbox>
            <span class="collection-name">{{ collection.name }}</span>
          </div>
        </div>

        <div class="create-collection-dialog">
          <el-input v-model="newCollectionName" placeholder="创建新收藏夹..." @keyup.enter="createNewCollection"></el-input>
          <el-button type="primary" @click="createNewCollection" :disabled="!newCollectionName.trim()">创建</el-button>
        </div>

        <div class="dialog-footer">
          <el-button @click="collectionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveCollectionSelections">确定</el-button>
        </div>
      </div>
    </el-dialog>



    <site-footer />
  </div>
</template>

<script>
import PrimaryButton from "@/components/buttons/PrimaryButton.vue"
import SiteFooter from "@/components/layout/SiteFooter.vue"
import Literature from "@/api/Literature"
import { Back } from "@element-plus/icons-vue"
import AiAssistant from "@/components/AiAssistant.vue"
export default {
  name: "LiteratureDetail",
  components: {
    PrimaryButton,
    SiteFooter,
    Back,
    AiAssistant,
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
      selectedCollectionIds: [],
      newCollectionName: "",
      collectionDialogVisible: false,
      aiSummary: "",
      isGeneratingSummary: false,
    }
  },
  methods: {
    async loadArticleDetail() {
      this.isLoading = true
      try {
        if (!this.articleId) {
          this.articleId = this.$route.params.id
        }
        const response = await Literature.detail(this.articleId)
        // console.log("文献详情", response)
        this.article = response.data.data
        this.reference = this.article.references
        await this.loadUserInteraction()

        await this.loadUserCollections()

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
        const response = await Literature.getInteractions(this.articleId)
        const interaction = response.data.data
        console.log(interaction)
        if (interaction) {
          this.personalNotes = interaction.personal_notes || ""
        }
      } catch (error) {
        console.log(error.response.data.message)
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
    toggleCollectionSelection(collectionId) {
      const collection = this.collections.find(c => c.id === collectionId)
      if (collection) {
        collection.selected = !collection.selected
      }
    },
    async saveCollectionSelections() {
      try {
        // 获取选中的收藏夹ID
        const selectedIds = this.collections
          .filter(collection => collection.selected)
          .map(collection => collection.id)

        // 调用API更新收藏夹
        await Literature.updateLiteratureCollections(this.articleId, {
          collection_ids: selectedIds
        })

        // 更新已选择的收藏夹ID
        this.selectedCollectionIds = [...selectedIds]

        // 更新是否已收藏到任意收藏夹
        this.isInAnyCollection = selectedIds.length > 0

        // 关闭对话框
        this.collectionDialogVisible = false
      } catch (error) {
        console.error("Error updating collections:", error)
      }
    },
    async createNewCollection() {
      const name = this.newCollectionName.trim()

      if (!name) return

      try {
        const response = await Literature.createCollection({
          name,
          literature_ids: [this.articleId],
        })

        // 添加新创建的收藏夹并设为选中
        const newCollection = {
          ...response.data,
          selected: true,
          has_literature: true
        }

        this.collections.push(newCollection)
        this.selectedCollectionIds.push(newCollection.id)
        this.isInAnyCollection = true

        // 清空输入
        this.newCollectionName = ""
      } catch (error) {
        console.error("Error creating collection:", error)
      }
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
      try {
        await Literature.createInteraction({
          literature_id: this.articleId,
          personal_notes: this.personalNotes,
        })
        this.$message.success('笔记已保存')
      } catch (error) {
        console.error("Error saving notes:", error)
        this.$message.error('笔记保存失败')
      }
    },
    downloadPDF() {
      if (this.article.pdf_url) {
        window.open(this.article.pdf_url, "_blank")
      } else {
        this.$message.warning('PDF暂不可用')
      }
    },
    navigateToAuthor(authorId) {
      if (authorId) {
        this.$router.push(`/authors/${authorId}`)
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

.article-meta {
  background: white;
  border-radius: 8px;
  padding: 15px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
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

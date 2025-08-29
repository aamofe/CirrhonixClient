<!-- src/views/Home.vue -->
<template>
  <div class="home-page">
    <section class="search-container">
      <h1>肝硬化文献智能检索系统</h1>
      <search-box @search="onSearch" />
    </section>

    <div class="main-content">
      <section class="workflow-section">
        <h2 class="section-header">研究工作流程</h2>
        <div class="workflow-steps">
          <div v-for="(step, index) in workflowSteps" :key="index" class="workflow-step" @click="navigateToStep(step)">
            <div class="step-icon">
              <i :class="step.icon"></i>
            </div>
            <h3>{{ step.title }}</h3>
            <p>{{ step.description }}</p>
          </div>
        </div>
      </section>

      <section class="tasks-section">
        <h2 class="section-header">执行中心</h2>
        <div class="tasks-grid">
          <div class="task-card">
            <div class="task-header">
              <h3>智能解析任务</h3>
              <span class="task-count">{{ analysisTasksCount }}</span>
            </div>
            <div class="task-content">
              <div v-if="analysisTasksLoading" class="loading-state">
                <div class="spinner"></div>
                <span>加载中...</span>
              </div>
              <div v-else-if="recentAnalysisTasks.length === 0" class="empty-state">
                <p>暂无解析任务</p>
                <primary-button @click="$router.push('/literature')" size="small">
                  开始解析
                </primary-button>
              </div>
              <div v-else class="tasks-list">
                <div v-for="task in recentAnalysisTasks.slice(0, 3)" :key="task.id" class="task-item"
                  @click="viewAnalysisTask(task.id, task)">
                  <div class="task-info">
                    <span class="task-title">{{ getAnalysisTaskTitle(task) }}</span>
                    <span class="task-time">
                      <span class="date">{{ task.start_time?.split(' ')[0] }}</span><br>
                      <span class="time">{{ task.start_time?.split(' ')[1] }}</span>
                    </span>
                  </div>
                  <div class="task-status" :class="task.status">
                    {{ getStatusText(task.status) }}
                  </div>
                </div>
                <div v-if="recentAnalysisTasks.length > 3" class="view-all">
                  <router-link to="/literature/analyze/list">查看全部</router-link>
                </div>
              </div>
            </div>
          </div>

          <div class="task-card">
            <div class="task-header">
              <h3>数据采集引擎</h3>
              <span class="task-count">{{ crawlTasksCount }}</span>
            </div>
            <div class="task-content">
              <div v-if="crawlTasksLoading" class="loading-state">
                <div class="spinner"></div>
                <span>加载中...</span>
              </div>
              <div v-else-if="crawlTasks.length === 0" class="empty-state">
                <p>暂无采集任务</p>
                <primary-button @click="$router.push('/crawler')" size="small">
                  创建任务
                </primary-button>
              </div>
              <div v-else class="tasks-list">
                <div v-for="task in crawlTasks.slice(0, 3)" :key="task.id" class="task-item"
                  @click="viewCrawlTask(task.id)">
                  <div class="task-info">
                    <span class="task-title">{{ getCrawlTaskTitle(task) }}</span>
                    <span class="task-time">
                      <span class="date">{{ task.start_time?.split(' ')[0] }}</span><br>
                      <span class="time">{{ task.start_time?.split(' ')[1] }}</span>
                    </span>
                  </div>
                  <div class="task-status" :class="task.status">
                    {{ getStatusText(task.status) }}
                    <span v-if="task.progress" class="task-progress">{{ formatProgress(task.progress) }}</span>
                  </div>
                </div>
                <div v-if="crawlTasks.length > 3" class="view-all">
                  <router-link to="/crawler">查看全部</router-link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="workspace-section">
        <h2 class="section-header">学术工作台</h2>
        <div class="workspace-grid">
          <div class="workspace-card" @click="$router.push('/profile')">
            <div class="card-icon">
              <i class="icon-folder"></i>
            </div>
            <div class="card-content">
              <h3>文献收藏库</h3>
              <p class="card-count">{{ collectionsCount }} 个专题集</p>
              <div v-if="recentCollections.length > 0" class="recent-items">
                <div v-for="collection in recentCollections.slice(0, 2)" :key="collection.id" class="recent-item"
                  @click.stop="$router.push(`/profile?collectionId=${collection.id}`)">
                  {{ collection.name }}
                </div>
              </div>
            </div>
          </div>

          <div class="workspace-card">
            <div class="card-icon">
              <i class="icon-analysis"></i>
            </div>
            <div class="card-content">
              <h3>近期分析文献</h3>
              <p class="card-count">{{ recentLiteratureCount }} 篇已解析</p>
              <div v-if="recentAnalyzedLiterature.length > 0" class="recent-items">
                <div v-for="literature in recentAnalyzedLiterature.slice(0, 2)" :key="literature.id" class="recent-item"
                  @click="$router.push(`/literature/${literature.id}`)">
                  {{ truncateTitle(literature.title) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="capabilities-section">
        <h2 class="section-header">平台能力矩阵</h2>
        <div class="capabilities-grid">
          <div class="capability-card">
            <div class="capability-header">
              <h3>学术数据源</h3>
              <span class="capability-count">{{ dataSources.length }}个数据源</span>
            </div>
            <div class="capability-content">
              <div v-if="dataSourcesLoading" class="loading-state">
                <div class="spinner"></div>
              </div>
              <div v-else class="data-sources-list">
                <div v-for="source in dataSources.filter(s => s.name !== 'Local')" :key="source.id"
                  class="data-source-item">
                  <i :class="getSourceIcon(source.name)"></i>
                  <span class="source-text">{{ source.name }} - {{ source.description }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="capability-card">
            <div class="capability-header">
              <h3>认知计算引擎</h3>
            </div>
            <div class="capability-content">
              <div class="analysis-examples">
                <div class="example-item">
                  <h4>语义摘要生成</h4>
                  <p>基于深度学习的文献核心信息提取</p>
                </div>
                <div class="example-item">
                  <h4>关联文献发现</h4>
                  <p>多维度语义相似性分析与推荐</p>
                </div>
                <div class="example-item">
                  <h4>知识问答系统</h4>
                  <p>上下文感知的文献内容交互式查询</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <site-footer />
  </div>
</template>

<script>
import SearchBox from "@/components/navigation/SearchBox.vue"
import PrimaryButton from "@/components/ui/PrimaryButton.vue"
import SiteFooter from "@/components/navigation/SiteFooter.vue"
import Literature from "@/api/Literature"
import Crawling from "@/api/Crawler"

export default {
  name: "HomeView",
  components: {
    SearchBox,
    PrimaryButton,
    SiteFooter,
  },
  data() {
    return {
      workflowSteps: [
        {
          title: "数据采集",
          description: "全自动文献资源获取",
          icon: "icon-crawler",
          path: "/crawler"
        },
        {
          title: "智能检索",
          description: "语义级文献精准发现",
          icon: "icon-search",
          path: "/literature"
        },
        {
          title: "深度解析",
          description: "AI驱动的内容理解",
          icon: "icon-ai",
          id: Math.floor(Math.random() * 20) + 1,
          path: "/literature"
        },
        {
          title: "知识图谱",
          description: "多维关系可视化呈现",
          icon: "icon-graph",
          path: "/knowledge-graph"
        }
      ],

      recentAnalysisTasks: [],
      analysisTasksCount: 0,
      analysisTasksLoading: false,

      crawlTasks: [],
      crawlTasksCount: 0,
      crawlTasksLoading: false,

      collectionsCount: 0,
      recentCollections: [],
      recentAnalyzedLiterature: [],
      recentLiteratureCount: 0,

      dataSources: [],
      dataSourcesLoading: false,
    }
  },

  methods: {
    navigateToStep(step) {
      if (step.title === "深度解析") {
        this.$router.push(`/literature/${step.id}`)
      } else {
        this.$router.push(step.path)
      }
    },

    onSearch(query) {
      this.$router.push({
        name: "literature-list",
        query: { q: query }
      })
    },

    viewAnalysisTask(taskId, task) {
      if (task && task.literature && task.literature.id) {
        this.$router.push(`/literature/${task.literature.id}`)
      } else {
        this.$router.push('/literature')
      }
    },

    viewCrawlTask(taskId) {
      this.$router.push('/crawler')
    },



    formatProgress(progress) {
      if (!progress) return ""
      if (typeof progress === 'string' && progress.includes('%')) return progress
      if (typeof progress === 'number') return `${(progress * 100).toFixed(1)}%`
      return progress
    },

    getStatusText(status) {
      const statusMap = {
        'pending': '待处理',
        'running': '执行中',
        'queued': '队列中',
        'completed': '已完成',
        'failed': '执行失败',
        'paused': '已暂停'
      }
      return statusMap[status] || '状态未知'
    },

    getAnalysisTaskTitle(task) {
      if (task.literature && task.literature.title) {
        return this.truncateTitle(task.literature.title)
      }
      return `解析任务 #${task.id}`
    },

    getCrawlTaskTitle(task) {
      if (task.keywords && task.keywords.keywords) {
        const keywords = task.keywords.keywords
          .replace(/\bAND\b/gi, ' & ')
          .replace(/\bOR\b/gi, ' | ')
          .replace(/\bNOT\b/gi, ' ! ')
        return `检索: ${keywords}`
      }
      return `采集任务 #${task.id}`
    },

    truncateTitle(title, maxLength = 30) {
      if (!title) return "无标题"
      return title.length > maxLength ? title.substring(0, maxLength) + '...' : title
    },

    getSourceIcon(sourceName) {
      const icons = {
        'PubMed Central': 'icon-pubmed',
        'arXiv': 'icon-arxiv',
        'Semantic Scholar': 'icon-semantic',
        'bioRxiv': 'icon-biorxiv',
        'DOAJ': 'icon-doaj'
      }
      return icons[sourceName] || 'icon-database'
    },

    async loadAnalysisTasks() {
      try {
        this.analysisTasksLoading = true
        const response = await Literature.getAnalyzeList(null, null, true)
        if (response.data && response.data.data) {
          this.recentAnalysisTasks = response.data.data
          this.analysisTasksCount = this.recentAnalysisTasks.length
        }
      } catch (error) {
        console.error('加载分析任务失败:', error)
        this.recentAnalysisTasks = []
        this.analysisTasksCount = 0
      } finally {
        this.analysisTasksLoading = false
      }
    },

    async loadCrawlTasks() {
      try {
        this.crawlTasksLoading = true
        const [pendingResponse, runningResponse] = await Promise.all([
          Crawling.getCrawlList('pending', null, 1, 10),
          // Crawling.getCrawlList('pending', null, 1, 10),
          Crawling.getCrawlList('running', null, 1, 10)
        ])

        let allTasks = []
        if (pendingResponse.data && pendingResponse.data.data) {
          allTasks = allTasks.concat(pendingResponse.data.data)
        }
        if (runningResponse.data && runningResponse.data.data) {
          allTasks = allTasks.concat(runningResponse.data.data)
        }

        allTasks.sort((a, b) => b.id - a.id)
        this.crawlTasks = allTasks
        this.crawlTasksCount = allTasks.length

      } catch (error) {
        console.error('加载爬虫任务失败:', error)
        this.crawlTasks = []
        this.crawlTasksCount = 0
      } finally {
        this.crawlTasksLoading = false
      }
    },

    async loadCollections() {
      try {
        const response = await Literature.getCollections()
        if (response.data && response.data.data) {
          const collections = response.data.data
          this.collectionsCount = collections.length
          this.recentCollections = collections
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
            .slice(0, 4)
        }
      } catch (error) {
        console.error('加载收藏夹失败:', error)
        this.collectionsCount = 0
        this.recentCollections = []
      }
    },

    async loadRecentAnalyzedLiterature() {
      try {
        const response = await Literature.getAnalyzeRecent()
        if (response.data && response.data.data) {
          this.recentAnalyzedLiterature = response.data.data
          this.recentLiteratureCount = this.recentAnalyzedLiterature.length
        }
      } catch (error) {
        console.error('加载最近分析文献失败:', error)
        this.recentAnalyzedLiterature = []
        this.recentLiteratureCount = 0
      }
    },

    async loadDataSources() {
      try {
        this.dataSourcesLoading = true
        const response = await Crawling.getSourceList()
        if (response.data && response.data.data) {
          this.dataSources = response.data.data
        }
      } catch (error) {
        console.error('加载数据源失败:', error)
        this.dataSources = []
      } finally {
        this.dataSourcesLoading = false
      }
    },

    async initializeData() {
      try {
        await Promise.all([
          this.loadAnalysisTasks(),
          this.loadCrawlTasks(),
          this.loadCollections(),
          this.loadRecentAnalyzedLiterature(),
          this.loadDataSources()
        ])
      } catch (error) {
        console.error('页面初始化失败:', error)
      }
    }
  },

  async mounted() {
    await this.initializeData()
  },
}
</script>

<style scoped>
.home-page {
  background-color: #f8fcff;
  min-height: 100vh;
}

.search-container {
  background: linear-gradient(135deg, #1a91c1 0%, #a8e6cf 100%);
  padding: 50px 5%;
  text-align: center;
}

.search-container h1 {
  color: white;
  font-size: 28px;
  margin-bottom: 12px;
  font-weight: 600;
}

.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 30px 5%;
}

.section-header {
  color: #1a91c1;
  font-size: 20px;
  margin-bottom: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.section-header::before {
  content: "";
  width: 4px;
  height: 20px;
  background-color: #1a91c1;
  margin-right: 12px;
  border-radius: 2px;
}

/* 通用卡片样式 */
.workflow-section,
.task-card,
.workspace-card,
.capability-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

/* 工作流程区域 */
.workflow-section {
  padding: 25px;
  margin-bottom: 30px;
}

.workflow-steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.workflow-step {
  background: #f8fcff;
  border-radius: 10px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.workflow-step:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(26, 145, 193, 0.15);
  border-color: rgba(26, 145, 193, 0.2);
}

.step-icon {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #1a91c1, #a8e6cf);
  border-radius: 50%;
  margin: 0 auto 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
}

.workflow-step h3 {
  color: #333;
  font-size: 16px;
  margin-bottom: 8px;
  font-weight: 600;
}

.workflow-step p {
  color: #666;
  font-size: 14px;
  margin: 0;
}

/* 任务区域 */
.tasks-section {
  margin-bottom: 30px;
}

.tasks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
}

.task-card {
  overflow: hidden;
}

.task-header {
  padding: 20px 20px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-header h3 {
  color: #333;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.task-count {
  background: #e8f4f8;
  color: #1a91c1;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
}

.task-content {
  padding: 15px 20px 20px;
}

/* 加载和空状态 */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px;
  color: #666;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e3e3e3;
  border-top: 2px solid #1a91c1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 10px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.empty-state {
  text-align: center;
  padding: 30px 20px;
  color: #999;
}

.empty-state p {
  margin: 0 0 20px;
  font-size: 14px;
}

/* 任务列表 */
.tasks-list {
  margin-top: 1rem;
}

.task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background: #f8fcff;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 10px;
}

.task-item:hover {
  background: #e8f4f8;
  transform: translateX(5px);
}

.task-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.task-title {
  color: #333;
  font-weight: 500;
  font-size: 14px;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-time {
  color: #888;
  font-size: 12px;
  white-space: nowrap;
  line-height: 1.4;
}

.task-time .date,
.task-time .time {
  display: inline-block;
}

.task-status {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.task-progress {
  font-size: 10px;
  color: inherit;
  opacity: 0.8;
}

/* 任务状态颜色 */
.task-status.pending {
  background: #fff3cd;
  color: #856404;
}

.task-status.processing,
.task-status.running {
  background: #cce7ff;
  color: #004085;
}

.task-status.completed {
  background: #d4edda;
  color: #155724;
}

.task-status.failed {
  background: #f8d7da;
  color: #721c24;
}

.view-all {
  text-align: center;
  margin-top: 15px;
}

.view-all a {
  color: #1a91c1;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
}

.view-all a:hover {
  text-decoration: underline;
}

/* 工作空间区域 */
.workspace-section {
  margin-bottom: 30px;
}

.workspace-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.workspace-card {
  padding: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: flex-start;
  gap: 15px;
}

.workspace-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.card-icon {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #1a91c1, #a8e6cf);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  flex-shrink: 0;
}

.card-content {
  flex: 1;
  min-width: 0;
}

.card-content h3 {
  color: #333;
  font-size: 16px;
  margin: 0 0 8px;
  font-weight: 600;
}

.card-count {
  color: #1a91c1;
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 12px;
}

.recent-items {
  margin-top: 10px;
}

.recent-item {
  color: #666;
  font-size: 13px;
  padding: 4px 0;
  border-bottom: 1px solid #f0f0f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recent-item:last-child {
  border-bottom: none;
}

/* 系统能力区域 */
.capabilities-section {
  margin-bottom: 30px;
}

.capabilities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.capability-card {
  overflow: hidden;
}

.capability-header {
  padding: 20px 20px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.capability-header h3 {
  color: #333;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.capability-count {
  background: #e8f4f8;
  color: #1a91c1;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
}

.capability-content {
  padding: 15px 20px 20px;
}

.data-sources-list {
  margin-top: 1rem;
}

.data-source-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  background: #f8fcff;
  border-radius: 8px;
  margin-bottom: 10px;
  gap: 12px;
}

.data-source-item i {
  font-size: 16px;
  color: #1a91c1;
  width: 20px;
  text-align: center;
}

.source-text {
  color: #333;
  font-size: 14px;
  flex: 1;
}

.analysis-examples {
  margin-top: 1rem;
}

.example-item {
  padding: 15px;
  background: #f8fcff;
  border-radius: 8px;
  margin-bottom: 15px;
}

.example-item h4 {
  color: #1a91c1;
  font-size: 14px;
  margin: 0 0 8px;
  font-weight: 600;
}

.example-item p {
  color: #666;
  font-size: 13px;
  margin: 0;
  line-height: 1.4;
}

/* 图标字体 */
.icon-crawler:before {
  content: "🕷️";
}

.icon-search:before {
  content: "🔍";
}

.icon-ai:before {
  content: "🤖";
}

.icon-graph:before {
  content: "🕸️";
}

.icon-folder:before {
  content: "📁";
}

.icon-analysis:before {
  content: "📊";
}

.icon-pubmed:before {
  content: "🏥";
}

.icon-arxiv:before {
  content: "📄";
}

.icon-semantic:before {
  content: "🧠";
}

.icon-biorxiv:before {
  content: "🧬";
}

.icon-doaj:before {
  content: "📖";
}

.icon-database:before {
  content: "💾";
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .workflow-steps {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .main-content {
    padding: 20px 3%;
  }

  .workflow-steps,
  .tasks-grid,
  .workspace-grid,
  .capabilities-grid {
    grid-template-columns: 1fr;
  }

  .search-container h1 {
    font-size: 24px;
  }
}

@media (max-width: 480px) {
  .search-container {
    padding: 30px 3%;
  }

  .workflow-step {
    padding: 15px;
  }

  .step-icon {
    width: 40px;
    height: 40px;
    font-size: 16px;
  }

  .workspace-card {
    padding: 20px;
    flex-direction: column;
    text-align: center;
    align-items: center;
  }

  .card-icon {
    margin-bottom: 10px;
  }

  .task-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .task-status {
    align-self: flex-end;
  }
}
</style>
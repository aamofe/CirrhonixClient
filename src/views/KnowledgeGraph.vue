<!-- src/views/KnowledgeGraph.vue -->
<template>
  <div class="knowledge-graph">
    <div class="graph-header">
      <h1>肝硬化知识图谱</h1>
      <p>可视化展示肝硬化相关研究的关键概念、文献间的引用关系及研究进展脉络</p>

      <div class="graph-controls">
        <div class="search-filter">
          <input
            type="text"
            v-model="searchKeyword"
            placeholder="搜索节点..."
            @input="filterGraph"
          />
        </div>

        <div class="view-toggles">
          <span>视图:</span>
          <button
            :class="['view-btn', currentView === 'concept' ? 'active' : '']"
            @click="switchView('concept')"
          >
            概念网络
          </button>
          <button
            :class="['view-btn', currentView === 'citation' ? 'active' : '']"
            @click="switchView('citation')"
          >
            引用关系
          </button>
          <button
            :class="['view-btn', currentView === 'timeline' ? 'active' : '']"
            @click="switchView('timeline')"
          >
            时间轴
          </button>
        </div>
      </div>

      <div class="filter-tags">
        <div class="filter-group">
          <span class="filter-label">节点类型:</span>
          <div class="tag-options">
            <span
              v-for="(type, index) in nodeTypes"
              :key="index"
              :class="[
                'filter-tag',
                selectedNodeTypes.includes(type.value) ? 'active' : '',
              ]"
              @click="toggleNodeType(type.value)"
            >
              {{ type.label }}
            </span>
          </div>
        </div>

        <div class="filter-group">
          <span class="filter-label">关系类型:</span>
          <div class="tag-options">
            <span
              v-for="(type, index) in relationTypes"
              :key="index"
              :class="[
                'filter-tag',
                selectedRelationTypes.includes(type.value) ? 'active' : '',
              ]"
              @click="toggleRelationType(type.value)"
            >
              {{ type.label }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="graph-container">
      <div class="graph-sidebar">
        <div class="sidebar-card">
          <h3>图谱统计</h3>
          <div class="stats-item">
            <span class="stats-label">节点总数:</span>
            <span class="stats-value">{{ graphStats.totalNodes }}</span>
          </div>
          <div class="stats-item">
            <span class="stats-label">关系总数:</span>
            <span class="stats-value">{{ graphStats.totalRelations }}</span>
          </div>
          <div class="stats-item">
            <span class="stats-label">文献数量:</span>
            <span class="stats-value">{{ graphStats.literatureCount }}</span>
          </div>
          <div class="stats-item">
            <span class="stats-label">概念数量:</span>
            <span class="stats-value">{{ graphStats.conceptCount }}</span>
          </div>
          <div class="stats-item">
            <span class="stats-label">作者数量:</span>
            <span class="stats-value">{{ graphStats.authorCount }}</span>
          </div>
        </div>

        <div class="sidebar-card">
          <h3>热门概念</h3>
          <div class="popular-list">
            <div
              v-for="(concept, index) in popularConcepts"
              :key="index"
              class="popular-item"
              @click="focusNode(concept.id)"
            >
              <span class="item-name">{{ concept.name }}</span>
              <span class="item-count">{{ concept.count }}</span>
            </div>
          </div>
        </div>

        <div class="sidebar-card">
          <h3>核心文献</h3>
          <div class="popular-list">
            <div
              v-for="(paper, index) in keyPapers"
              :key="index"
              class="popular-item"
              @click="viewArticleDetail(paper.id)"
            >
              <span class="item-name">{{ paper.title }}</span>
              <span class="item-count">{{ paper.citation_count }}</span>
            </div>
          </div>
        </div>

        <div class="sidebar-card">
          <h3>图谱设置</h3>
          <div class="setting-item">
            <span class="setting-label">节点大小:</span>
            <input
              type="range"
              v-model="graphSettings.nodeSize"
              min="1"
              max="20"
              @change="updateGraphSettings"
            />
          </div>
          <div class="setting-item">
            <span class="setting-label">边线粗细:</span>
            <input
              type="range"
              v-model="graphSettings.edgeWidth"
              min="1"
              max="10"
              @change="updateGraphSettings"
            />
          </div>
          <div class="setting-item">
            <span class="setting-label">显示标签:</span>
            <input
              type="checkbox"
              v-model="graphSettings.showLabels"
              @change="updateGraphSettings"
            />
          </div>
          <div class="setting-item">
            <span class="setting-label">物理引擎:</span>
            <input
              type="checkbox"
              v-model="graphSettings.physics"
              @change="updateGraphSettings"
            />
          </div>
          <div class="setting-actions">
            <button @click="resetGraphSettings" class="reset-btn">
              重置设置
            </button>
          </div>
        </div>
      </div>

      <div class="graph-main">
        <div class="graph-view" ref="graphContainer">
          <!-- 图谱将由JS渲染在这里 -->
          <div v-if="isLoading" class="loading-overlay">
            <div class="spinner"></div>
            <p>加载知识图谱中...</p>
          </div>
        </div>

        <div class="node-detail-panel" v-if="selectedNode">
          <div class="panel-header">
            <h3>{{ selectedNode.label }}</h3>
            <button class="close-btn" @click="closeNodeDetail">×</button>
          </div>

          <div class="panel-content">
            <div class="detail-item">
              <span class="detail-label">类型:</span>
              <span class="detail-value">{{
                getNodeTypeName(selectedNode.type)
              }}</span>
            </div>

            <div class="detail-item" v-if="selectedNode.type === 'literature'">
              <span class="detail-label">作者:</span>
              <span class="detail-value">{{
                selectedNode.authors ? selectedNode.authors.join(", ") : "N/A"
              }}</span>
            </div>

            <div class="detail-item" v-if="selectedNode.type === 'literature'">
              <span class="detail-label">发表日期:</span>
              <span class="detail-value">{{
                formatDate(selectedNode.publication_date)
              }}</span>
            </div>

            <div class="detail-item" v-if="selectedNode.description">
              <span class="detail-label">描述:</span>
              <p class="detail-value description">
                {{ selectedNode.description }}
              </p>
            </div>

            <div
              class="detail-item"
              v-if="selectedNode.relations && selectedNode.relations.length > 0"
            >
              <span class="detail-label">关系:</span>
              <ul class="relations-list">
                <li
                  v-for="(relation, index) in selectedNode.relations"
                  :key="index"
                  @click="focusNode(relation.target_id)"
                >
                  <span class="relation-type">{{ relation.type }}</span>
                  <span class="relation-node">{{ relation.target_name }}</span>
                </li>
              </ul>
            </div>

            <div
              class="detail-actions"
              v-if="selectedNode.type === 'literature'"
            >
              <primary-button @click="viewArticleDetail(selectedNode.id)">
                查看文献详情
              </primary-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <site-footer />
  </div>
</template>

<script>
import PrimaryButton from "@/components/buttons/PrimaryButton.vue";
import SiteFooter from "@/components/layout/SiteFooter.vue";
import Literature from "@/api/Literature";

export default {
  name: "KnowledgeGraph",
  components: {
    PrimaryButton,
    SiteFooter,
  },
  data() {
    return {
      currentView: "concept",
      searchKeyword: "",
      isLoading: true,
      graphNetwork: null, // 这将是图形库的网络实例（如vis.js）
      graphData: {
        nodes: [],
        edges: [],
      },
      nodeTypes: [
        { value: "concept", label: "概念" },
        { value: "literature", label: "文献" },
        { value: "author", label: "作者" },
        { value: "journal", label: "期刊" },
      ],
      relationTypes: [
        { value: "cites", label: "引用" },
        { value: "authored_by", label: "作者关系" },
        { value: "published_in", label: "发表于" },
        { value: "related_to", label: "相关概念" },
      ],
      selectedNodeTypes: ["concept", "literature"],
      selectedRelationTypes: ["cites", "related_to"],
      graphStats: {
        totalNodes: 0,
        totalRelations: 0,
        literatureCount: 0,
        conceptCount: 0,
        authorCount: 0,
      },
      popularConcepts: [],
      keyPapers: [],
      selectedNode: null,
      graphSettings: {
        nodeSize: 10,
        edgeWidth: 2,
        showLabels: true,
        physics: true,
      },
    };
  },
  methods: {
    async loadGraphData() {
      this.isLoading = true;

      try {
        const params = {
          node_type: this.selectedNodeTypes.join(","),
          relation_type: this.selectedRelationTypes.join(","),
          keyword: this.searchKeyword,
          view: this.currentView,
          limit: 150, // 限制节点数量以提高性能
        };

        const response = await Literature.getGraphData(params);
        this.graphData = response.data;

        // 更新统计信息
        this.updateStats();

        // 加载热门概念和核心文献
        await this.loadSidebarData();

        // 渲染图谱
        this.renderGraph();
      } catch (error) {
        console.error("Error loading graph data:", error);
      } finally {
        this.isLoading = false;
      }
    },
    async loadSidebarData() {
      try {
        // 假设这里有用于获取热门概念的接口
        const conceptsResponse = await Literature.getConceptNet({
          sort: "-weight",
          limit: 10,
        });
        this.popularConcepts = conceptsResponse.data.items || [];

        // 获取引用次数最多的文献
        const papersResponse = await Literature.list({
          sort: "-citation_count",
          page: 1,
          size: 10,
        });
        this.keyPapers = papersResponse.data.items || [];
      } catch (error) {
        console.error("Error loading sidebar data:", error);
      }
    },
    updateStats() {
      // 计算图谱统计信息
      const nodes = this.graphData.nodes || [];
      const edges = this.graphData.edges || [];

      this.graphStats.totalNodes = nodes.length;
      this.graphStats.totalRelations = edges.length;

      // 统计不同类型的节点数量
      this.graphStats.literatureCount = nodes.filter(
        (node) => node.type === "literature"
      ).length;
      this.graphStats.conceptCount = nodes.filter(
        (node) => node.type === "concept"
      ).length;
      this.graphStats.authorCount = nodes.filter(
        (node) => node.type === "author"
      ).length;
    },
    renderGraph() {
      // 这里需要使用图形可视化库（如vis.js）渲染图谱
      // 下面是一个简化的示例，具体实现取决于使用的库

      // 假设我们使用vis.js作为图形库
      // 首先需要在mounted钩子中导入vis.js

      if (!this.graphNetwork) {
        // 初始化网络
        // const container = this.$refs.graphContainer;
        // const options = {
        //   nodes: {
        //     shape: "dot",
        //     size: this.graphSettings.nodeSize,
        //     font: {
        //       size: 14,
        //       face: "Arial",
        //     },
        //   },
        //   edges: {
        //     width: this.graphSettings.edgeWidth,
        //     arrows: {
        //       to: { enabled: true, scaleFactor: 0.5 },
        //     },
        //   },
        //   physics: {
        //     enabled: this.graphSettings.physics,
        //     stabilization: {
        //       iterations: 100,
        //     },
        //   },
        // }

        // this.graphNetwork = new vis.Network(container, this.graphData, options)
        // this.graphNetwork.on('click', this.onNodeClick)

        // 由于我们不能在这里实际渲染vis.js，所以这只是一个示例
        console.log("Graph would be rendered here with data:", this.graphData);
      } else {
        // 更新现有网络
        // this.graphNetwork.setData(this.graphData)
        console.log("Graph would be updated here with data:", this.graphData);
      }
    },
    switchView(view) {
      if (this.currentView === view) return;

      this.currentView = view;
      this.loadGraphData();
    },
    toggleNodeType(type) {
      const index = this.selectedNodeTypes.indexOf(type);

      if (index === -1) {
        this.selectedNodeTypes.push(type);
      } else {
        this.selectedNodeTypes.splice(index, 1);
      }

      // 确保至少选择一种节点类型
      if (this.selectedNodeTypes.length === 0) {
        this.selectedNodeTypes.push(type);
        return;
      }

      this.loadGraphData();
    },
    toggleRelationType(type) {
      const index = this.selectedRelationTypes.indexOf(type);

      if (index === -1) {
        this.selectedRelationTypes.push(type);
      } else {
        this.selectedRelationTypes.splice(index, 1);
      }

      this.loadGraphData();
    },
    filterGraph() {
      // 延迟执行，避免频繁请求
      if (this.filterTimeout) {
        clearTimeout(this.filterTimeout);
      }

      this.filterTimeout = setTimeout(() => {
        this.loadGraphData();
      }, 500);
    },
    onNodeClick(event) {
      // 当用户点击节点时触发
      // 这里应该根据实际使用的图形库调整

      // 假设event.nodes包含被点击节点的ID
      if (event.nodes && event.nodes.length > 0) {
        const nodeId = event.nodes[0];
        const node = this.graphData.nodes.find((n) => n.id === nodeId);

        if (node) {
          this.selectedNode = node;
        }
      } else {
        this.selectedNode = null;
      }
    },
    focusNode(nodeId) {
      // 聚焦到特定节点
      // 在实际实现中，这将使用图形库的API

      // 查找节点
      const node = this.graphData.nodes.find((n) => n.id === nodeId);

      if (node) {
        this.selectedNode = node;

        // 如果使用vis.js，可以这样聚焦节点
        // this.graphNetwork.focus(nodeId, {
        //   scale: 1.5,
        //   animation: {
        //     duration: 1000,
        //     easingFunction: 'easeInOutQuad'
        //   }
        // })

        console.log("Would focus on node:", nodeId);
      }
    },
    closeNodeDetail() {
      this.selectedNode = null;
    },
    updateGraphSettings() {
      // 更新图谱设置
      if (this.graphNetwork) {
        // 更新节点大小
        // this.graphNetwork.setOptions({
        //   nodes: { size: this.graphSettings.nodeSize },
        //   edges: { width: this.graphSettings.edgeWidth },
        //   physics: { enabled: this.graphSettings.physics }
        // })

        console.log("Graph settings updated:", this.graphSettings);
      }
    },
    resetGraphSettings() {
      this.graphSettings = {
        nodeSize: 10,
        edgeWidth: 2,
        showLabels: true,
        physics: true,
      };

      this.updateGraphSettings();
    },
    getNodeTypeName(type) {
      const nodeType = this.nodeTypes.find((t) => t.value === type);
      return nodeType ? nodeType.label : type;
    },
    formatDate(dateString) {
      if (!dateString) return "N/A";

      const date = new Date(dateString);
      return date.toLocaleDateString("zh-CN");
    },
    viewArticleDetail(id) {
      if (id) {
        this.$router.push(`/literature/${id}`);
      }
    },
  },
  mounted() {
    // 这里需要导入图形库
    // 在实际项目中，可以使用动态导入
    // import('vis-network').then(vis => {
    //   window.vis = vis
    //   this.loadGraphData()
    // })

    // 由于我们不能实际导入库，所以直接加载数据
    this.loadGraphData();
  },
  beforeUnmount() {
    // 清理网络实例
    if (this.graphNetwork) {
      // this.graphNetwork.destroy()
      console.log("Graph would be destroyed here");
    }
  },
};
</script>

<style scoped>
.knowledge-graph {
  background-color: #f5fbff;
  min-height: 100vh;
}

.graph-header {
  background: linear-gradient(135deg, #1a91c1 0%, #a8e6cf 100%);
  padding: 30px 5%;
  color: white;
}

.graph-header h1 {
  font-size: 28px;
  margin-bottom: 10px;
}

.graph-header p {
  margin-bottom: 20px;
  max-width: 800px;
}

.graph-controls {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.search-filter {
  width: 300px;
}

.search-filter input {
  width: 100%;
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
}

.view-toggles {
  display: flex;
  align-items: center;
  gap: 10px;
}

.view-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.view-btn.active {
  background: white;
  color: #1a91c1;
}

.filter-tags {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.filter-group {
  display: flex;
  align-items: center;
}

.filter-label {
  width: 80px;
  font-weight: 500;
}

.tag-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-tag {
  background: rgba(255, 255, 255, 0.2);
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.filter-tag.active {
  background: white;
  color: #1a91c1;
}

.graph-container {
  display: flex;
  max-width: 1400px;
  margin: 30px auto;
  padding: 0 5%;
  gap: 30px;
}

.graph-sidebar {
  width: 280px;
  flex-shrink: 0;
}

.sidebar-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 20px;
  margin-bottom: 20px;
}

.sidebar-card h3 {
  margin-bottom: 15px;
  color: #333;
  font-size: 16px;
  font-weight: 500;
}

.stats-item,
.setting-item {
  display: flex;
  margin-bottom: 12px;
  align-items: center;
}

.stats-label,
.setting-label {
  font-weight: 500;
  color: #555;
  width: 90px;
  flex-shrink: 0;
}

.stats-value {
  color: #333;
}

.popular-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.popular-item {
  display: flex;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
}

.popular-item:hover .item-name {
  color: #1a91c1;
}

.popular-item:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.item-name {
  color: #444;
  transition: color 0.3s;
}

.item-count {
  background: #e9f7f2;
  color: #66bb6a;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
}

.setting-actions {
  margin-top: 15px;
}

.reset-btn {
  width: 100%;
  background: none;
  border: 1px solid #1a91c1;
  color: #1a91c1;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.reset-btn:hover {
  background: rgba(26, 145, 193, 0.05);
}

.graph-main {
  flex: 1;
  position: relative;
}

.graph-view {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  height: 600px;
  position: relative;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(26, 145, 193, 0.3);
  border-radius: 50%;
  border-top-color: #1a91c1;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.node-detail-panel {
  position: absolute;
  right: 20px;
  top: 20px;
  width: 300px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 3px 15px rgba(0, 0, 0, 0.1);
  z-index: 20;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.panel-header h3 {
  font-size: 16px;
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #888;
  cursor: pointer;
}

.panel-content {
  padding: 15px 20px;
}

.detail-item {
  margin-bottom: 12px;
}

.detail-label {
  font-weight: 500;
  color: #555;
  display: block;
  margin-bottom: 5px;
}

.detail-value {
  color: #333;
}

.detail-value.description {
  line-height: 1.6;
  font-size: 14px;
}

.relations-list {
  list-style-type: none;
  padding: 0;
}

.relations-list li {
  padding: 5px 0;
  cursor: pointer;
  color: #1a91c1;
}

.relation-type {
  font-size: 12px;
  color: #888;
  margin-right: 5px;
}

.detail-actions {
  margin-top: 20px;
}

@media (max-width: 992px) {
  .graph-container {
    flex-direction: column;
  }

  .graph-sidebar {
    width: 100%;
  }

  .graph-view {
    height: 400px;
  }

  .node-detail-panel {
    position: relative;
    right: auto;
    top: auto;
    width: 100%;
    margin-top: 20px;
  }
}

@media (max-width: 768px) {
  .graph-controls {
    flex-direction: column;
    gap: 15px;
  }

  .search-filter {
    width: 100%;
  }

  .filter-group {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .filter-label {
    width: auto;
  }
}
</style>

<!-- src/components/profile/Collections.vue -->
<template>
  <div class="collections-component">
    <div v-if="!showCollectionDetail">
      <h3>我的收藏夹</h3>
      <div class="collections-header">
        <div class="search-filter">
          <input type="text" v-model="collectionFilter" placeholder="搜索收藏夹..." class="search-input" />
        </div>
        <PrimaryButton :fullWidth="false" @click="showNewCollectionModal = true">
          创建收藏夹
        </PrimaryButton>
      </div>

      <div v-if="!loading && filteredCollections.length" class="collections-grid">
        <CollectionCard v-for="collection in filteredCollections" :key="collection.id" :collection="collection"
          @edit="editCollection" @delete="deleteCollection" @view="viewCollectionDetail" />
      </div>
      <div v-else-if="loading" class="loading">加载中...</div>
      <div v-else class="empty-state">您还没有创建任何收藏夹</div>
    </div>

    <!-- 收藏夹详情组件 -->
    <CollectionDetail v-if="showCollectionDetail" :collectionId="selectedCollectionId"
      @back-to-collections="backToCollections" />

    <!-- 创建收藏夹模态框 -->
    <ModalComponent v-if="showNewCollectionModal" title="创建新收藏夹" @close="closeNewCollectionModal">
      <CollectionForm 
        :collections="collections"
        @success="handleFormSuccess" 
        @cancel="closeNewCollectionModal" />
    </ModalComponent>

    <!-- 编辑收藏夹模态框 -->
    <ModalComponent v-if="showEditCollectionModal" title="编辑收藏夹" @close="closeEditCollectionModal">
      <CollectionForm 
        v-if="selectedCollection" 
        :collection="selectedCollection" 
        :collections="collections"
        @success="handleFormSuccess" 
        @cancel="closeEditCollectionModal" />
    </ModalComponent>
  </div>
</template>

<script>
import PrimaryButton from "@/components/buttons/PrimaryButton.vue"
import ModalComponent from "@/components/common/ModalComponent.vue"
import CollectionForm from "@/components/form/CollectionForm.vue"
import CollectionCard from "@/components/cards/CollectionCard.vue"
import CollectionDetail from "@/components/profile/CollectionDetail.vue"
import Literature from "@/api/Literature"

export default {
  name: "CollectionsComponent",
  components: {
    PrimaryButton,
    ModalComponent,
    CollectionForm,
    CollectionCard,
    CollectionDetail
  },
  data() {
    return {
      loading: true,
      collections: [],
      collectionFilter: "",
      showNewCollectionModal: false,
      showEditCollectionModal: false,
      selectedCollection: null,
      selectedCollectionId: null,
      showCollectionDetail: false
    }
  },
  computed: {
    filteredCollections() {
      if (!this.collectionFilter) return this.collections

      const filter = this.collectionFilter.toLowerCase()
      return this.collections.filter(
        (collection) =>
          collection.name.toLowerCase().includes(filter) ||
          (collection.description &&
            collection.description.toLowerCase().includes(filter))
      )
    },
  },
  methods: {
    async fetchCollections() {
      this.loading = true
      try {
        const response = await Literature.getCollections()
        this.collections = response.data.data.items || []
      } catch (error) {
        console.error("获取收藏夹失败", error)
        this.$message.error("获取收藏夹失败")
      } finally {
        this.loading = false
      }
    },

    // 处理表单操作成功 (无论是创建还是更新)
    handleFormSuccess(result) {
      if (result.action === 'create') {
        // 创建收藏夹成功，添加到列表的最前面
        this.collections.unshift(result.data)
        this.closeNewCollectionModal()
      } else if (result.action === 'update') {
        // 更新收藏夹成功，更新本地集合数据
        const index = this.collections.findIndex(c => c.id === result.data.id)
        if (index !== -1) {
          this.collections[index] = result.data
        }
        this.closeEditCollectionModal()
      }
    },

    editCollection(collection) {
      this.selectedCollection = collection
      this.showEditCollectionModal = true
    },

    async deleteCollection(collection) {
      try {
        await Literature.deleteCollection(collection.id)
        
        this.collections = this.collections.filter(
          c => c.id !== collection.id
        )
        
        // 显示成功提示
        this.$message.success(`"${collection.name}" 删除成功`)
      } catch (error) {
        console.error("删除收藏夹失败", error)
        
        // 显示错误提示（可根据API返回细化提示）
        const msg = error.response?.data?.message || "删除操作失败，请稍后重试"
        this.$message.error(msg)
      }
    },

    // 关闭模态框的方法
    closeNewCollectionModal() {
      this.showNewCollectionModal = false
    },

    closeEditCollectionModal() {
      this.showEditCollectionModal = false
      this.selectedCollection = null
    },

    // 查看收藏夹详情
    viewCollectionDetail(collection) {
      this.selectedCollectionId = collection.id
      this.showCollectionDetail = true

      // 更新URL，但不改变路由（保持在 Profile 页面内）
      if (this.$router) {
        this.$router.replace({
          query: {
            ...this.$route.query,
            collectionId: collection.id
          }
        })
      }
    },

    // 返回收藏夹列表
    backToCollections() {
      this.showCollectionDetail = false
      this.selectedCollectionId = null

      // 移除URL中的collectionId参数
      if (this.$router) {
        const query = { ...this.$route.query }
        delete query.collectionId
        this.$router.replace({ query })
      }
    },

    // 检查URL中是否有collectionId
    checkUrlForCollectionId() {
      const urlParams = new URLSearchParams(window.location.search)
      const collectionId = urlParams.get('collectionId')

      if (collectionId) {
        this.selectedCollectionId = collectionId
        this.showCollectionDetail = true
      }
    }
  },
  created() {
    this.fetchCollections()
    this.checkUrlForCollectionId()
  },
}
</script>

<style scoped>
.collections-component {
  width: 100%;
}

.collections-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.search-input {
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  width: 300px;
  font-size: 14px;
}

.collections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #777;
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
}

@media (max-width: 768px) {
  .collections-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .search-input {
    width: 100%;
  }
}
</style>
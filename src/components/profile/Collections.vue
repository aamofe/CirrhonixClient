<!-- src/components/profile/Collections.vue -->
<template>
  <div class="collections-component">
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
        @edit="editCollection" @delete="deleteCollection" />
    </div>
    <div v-else-if="loading" class="loading">加载中...</div>
    <div v-else class="empty-state">您还没有创建任何收藏夹</div>

    <!-- 创建收藏夹模态框 -->
    <ModalComponent v-if="showNewCollectionModal" title="创建新收藏夹" @close="showNewCollectionModal = false">
      <CollectionForm @submit="createCollection" />
    </ModalComponent>

    <!-- 编辑收藏夹模态框 -->
    <ModalComponent v-if="showEditCollectionModal" title="编辑收藏夹" @close="showEditCollectionModal = false">
      <CollectionForm v-if="selectedCollection" :collection="selectedCollection" @submit="updateCollection" />
    </ModalComponent>
  </div>
</template>

<script>
import PrimaryButton from "@/components/buttons/PrimaryButton.vue"
import ModalComponent from "@/components/common/ModalComponent.vue"
import CollectionForm from "@/components/form/CollectionForm.vue"
import CollectionCard from "@/components/cards/CollectionCard.vue"
import Literature from "@/api/Literature"

export default {
  name: "CollectionsComponent",
  components: {
    PrimaryButton,
    ModalComponent,
    CollectionForm,
    CollectionCard,
  },
  data() {
    return {
      loading: true,
      collections: [],
      collectionFilter: "",
      showNewCollectionModal: false,
      showEditCollectionModal: false,
      selectedCollection: null,
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
        this.collections = response.data.items || []
      } catch (error) {
        console.error("获取收藏夹失败", error)
        this.$message.error("获取收藏夹失败")
      } finally {
        this.loading = false
      }
    },

    async createCollection(data) {
      try {
        const response = await Literature.createCollection(data)
        this.collections.unshift(response.data)
        this.showNewCollectionModal = false
        this.$message.success("收藏夹创建成功")
      } catch (error) {
        console.error("创建收藏夹失败", error)
        this.$message.error("创建收藏夹失败")
      }
    },

    editCollection(collection) {
      this.selectedCollection = collection
      this.showEditCollectionModal = true
    },

    async updateCollection(data) {
      try {
        await Literature.updateCollection(this.selectedCollection.id, data)

        // 更新本地集合数据
        const index = this.collections.findIndex(
          (c) => c.id === this.selectedCollection.id
        )
        if (index !== -1) {
          this.collections[index] = {
            ...this.collections[index],
            ...data,
          }
        }

        this.showEditCollectionModal = false
        this.selectedCollection = null
        this.$message.success("收藏夹更新成功")
      } catch (error) {
        console.error("更新收藏夹失败", error)
        this.$message.error("更新收藏夹失败")
      }
    },

    async deleteCollection(collection) {
      if (!confirm(`确定要删除收藏夹"${collection.name}"吗？`)) return

      try {
        await Literature.deleteCollection(collection.id)
        this.collections = this.collections.filter(
          (c) => c.id !== collection.id
        )
        this.$message.success("收藏夹删除成功")
      } catch (error) {
        console.error("删除收藏夹失败", error)
        this.$message.error("删除收藏夹失败")
      }
    },
  },
  created() {
    this.fetchCollections()
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

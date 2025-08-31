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

    <CollectionDetail v-if="showCollectionDetail" :collectionId="selectedCollectionId"
      @back-to-collections="backToCollections" />

    <ModalComponent v-if="showNewCollectionModal" title="创建新收藏夹" @close="closeNewCollectionModal">
      <form @submit.prevent="submitForm" class="collection-form">
        <div class="form-group">
          <label for="new-name">收藏夹名称 <span class="required">*</span></label>
          <input type="text" id="new-name" v-model="form.name" required class="form-input" />
        </div>

        <div class="form-group">
          <label for="new-description">描述</label>
          <textarea id="new-description" v-model="form.description" rows="4" class="form-input"></textarea>
        </div>

        <div class="form-actions">
          <CancelButton @click="closeNewCollectionModal">取消</CancelButton>
          <button type="submit" class="submit-button" :disabled="isSubmitting">
            保存
          </button>
        </div>
      </form>
    </ModalComponent>

    <ModalComponent v-if="showEditCollectionModal" title="编辑收藏夹" @close="closeEditCollectionModal">
      <form @submit.prevent="submitForm" class="collection-form" v-if="selectedCollection">
        <div class="form-group">
          <label for="edit-name">收藏夹名称 <span class="required">*</span></label>
          <input type="text" id="edit-name" v-model="form.name" required class="form-input" />
        </div>

        <div class="form-group">
          <label for="edit-description">描述</label>
          <textarea id="edit-description" v-model="form.description" rows="4" class="form-input"></textarea>
        </div>

        <div class="form-actions">
          <CancelButton @click="closeEditCollectionModal">取消</CancelButton>
          <button type="submit" class="submit-button" :disabled="isSubmitting">
            保存
          </button>
        </div>
      </form>
    </ModalComponent>
  </div>
</template>

<script>
import PrimaryButton from "@/components/ui/PrimaryButton.vue"
import ModalComponent from "@/components/ui/BaseModal.vue"
import CollectionCard from "@/components/profile/CollectionCard.vue"
import CollectionDetail from "@/components/profile/CollectionDetail.vue"
import CancelButton from "@/components/ui/CancelButton.vue" // Import CancelButton
import Literature from "@/api/Literature"

export default {
  name: "CollectionsComponent",
  components: {
    PrimaryButton,
    ModalComponent,
    CollectionCard,
    CollectionDetail,
    CancelButton,
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
      showCollectionDetail: false,
      // 表单相关数据
      form: {
        name: "",
        description: "",
      },
      isSubmitting: false,
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
        this.collections = response.data.data || []
      } catch (error) {
        this.$message.error("获取收藏夹失败")
      } finally {
        this.loading = false
      }
    },

    // 表单提交方法
    async submitForm() {
      if (this.isSubmitting) return

      this.isSubmitting = true

      try {
        if (this.selectedCollection) {
          // 编辑模式
          await this.updateCollection()
        } else {
          // 创建模式
          await this.createCollection()
        }
      } finally {
        this.isSubmitting = false
      }
    },

    async createCollection() {
      try {
        const response = await Literature.createCollection(this.form)

        this.collections.unshift(response.data.data)
        this.closeNewCollectionModal()

        this.$message.success("收藏夹创建成功")
      } catch (error) {
        this.$message.error("创建收藏夹失败")
      }
    },

    async updateCollection() {
      try {
        const collectionId = this.selectedCollection.id

        await Literature.updateCollection(collectionId, this.form)

        const updatedCollection = {
          ...this.selectedCollection,
          ...this.form,
        }

        const index = this.collections.findIndex(
          (c) => c.id === updatedCollection.id
        )
        if (index !== -1) {
          this.collections[index] = updatedCollection
        }

        this.closeEditCollectionModal()

        this.$message.success("收藏夹更新成功")
      } catch (error) {
        this.$message.error("更新收藏夹失败")
      }
    },

    editCollection(collection) {
      this.selectedCollection = collection
      // 初始化编辑表单数据
      this.form.name = collection.name
      this.form.description = collection.description || ""
      this.showEditCollectionModal = true
    },

    async deleteCollection(collection) {
      try {
        await Literature.deleteCollection(collection.id)

        this.collections = this.collections.filter(
          (c) => c.id !== collection.id
        )

        this.$message.success(`"${collection.name}" 删除成功`)
      } catch (error) {
        const msg = error.response?.data?.message || "删除操作失败，请稍后重试"
        this.$message.error(msg)
      }
    },

    closeNewCollectionModal() {
      this.showNewCollectionModal = false
      // 清空表单数据
      this.form.name = ""
      this.form.description = ""
    },

    closeEditCollectionModal() {
      this.showEditCollectionModal = false
      this.selectedCollection = null
      // 清空表单数据
      this.form.name = ""
      this.form.description = ""
    },

    viewCollectionDetail(collection) {
      this.selectedCollectionId = collection.id
      this.showCollectionDetail = true

      if (this.$router) {
        this.$router.replace({
          query: {
            ...this.$route.query,
            collectionId: collection.id,
          },
        })
      }
    },

    backToCollections() {
      this.showCollectionDetail = false
      this.selectedCollectionId = null

      if (this.$router) {
        const query = { ...this.$route.query }
        delete query.collectionId
        this.$router.replace({ query })
      }
    },

    checkUrlForCollectionId() {
      const urlParams = new URLSearchParams(window.location.search)
      const collectionId = urlParams.get("collectionId")

      if (collectionId) {
        this.selectedCollectionId = collectionId
        this.showCollectionDetail = true
      }
    },
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

/* 表单样式 */
.collection-form {
  width: 100%;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.required {
  color: #ff6b6b;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
}

.form-input:focus {
  outline: none;
  border-color: #1a91c1;
  box-shadow: 0 0 0 2px rgba(26, 145, 193, 0.2);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.submit-button {
  padding: 0.75rem 1.5rem;
  background-color: #1a91c1;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-button:hover:not(:disabled) {
  background-color: #157aa3;
}

.submit-button:disabled {
  background-color: #a0c4d4;
  cursor: not-allowed;
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
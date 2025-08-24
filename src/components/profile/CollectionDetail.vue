<!-- src/components/profile/CollectionDetail.vue -->
<template>
  <div class="collection-detail">
    <div class="collection-header">
      <button class="back-button" @click="goBack">
        <el-icon>
          <Back />
        </el-icon>
        返回收藏夹列表
      </button>
      <h3>{{ collection ? collection.name : "收藏夹详情" }}</h3>
    </div>

    <p v-if="collection && collection.description" class="collection-description">
      {{ collection.description }}
    </p>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="literatures && literatures.length" class="literatures-list">
      <literature-item v-for="article in literatures" :key="article.id" :article="article"
        @view-detail="viewArticleDetail" />
    </div>

    <div v-else-if="collection" class="empty-state">
      此收藏夹还没有添加任何文献
    </div>
  </div>
</template>

<script>
import LiteratureItem from "@/components/layout/LiteratureItem.vue"
import { Back } from "@element-plus/icons-vue"
import Literature from "@/api/Literature"

export default {
  name: "CollectionDetail",
  components: {
    LiteratureItem,
    Back,
  },
  props: {
    collectionId: {
      type: [String, Number],
      required: true,
    },
  },
  data() {
    return {
      loading: true,
      collection: null,
      literatures: [],
    }
  },
  methods: {
    async fetchCollectionDetail() {
      this.loading = true
      try {
        const response = await Literature.getCollection(this.collectionId)

        this.collection = response.data.data

        this.literatures = this.collection.literatures || []
      } catch (error) {
        this.$message.error("获取收藏夹详情失败")
      } finally {
        this.loading = false
      }
    },
    goBack() {

      this.$emit("back-to-collections")
    },
    viewArticleDetail(articleId) {
      if (articleId === undefined || articleId === null || articleId === '') {
        console.error('文章ID无效:', articleId)
        this.$message.error('无法查看文章详情：文章ID无效')
        return
      }
      try {
        this.$router.push({
          name: "literature-detail",
          params: { id: String(articleId) }
        })
      } catch (error) {
        this.$message.error('页面跳转失败')
      }
    }
  },
  watch: {
    collectionId: {
      immediate: true,
      handler() {
        this.fetchCollectionDetail()
      },
    },
  },
}
</script>

<style scoped>
.collection-detail {
  width: 100%;
}

.collection-header {
  display: flex;
  flex-direction: column;
  margin-bottom: 1.5rem;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: #1a91c1;
  font-size: 14px;
  font-weight: 500;
  padding: 0.5rem 0;
  cursor: pointer;
  margin-bottom: 1rem;
  width: fit-content;
}

.back-button:hover {
  color: #157aa3;
  text-decoration: underline;
}

.collection-description {
  color: #666;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.literatures-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #777;
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
}
</style>

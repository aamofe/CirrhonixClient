<template>
  <div class="collection-detail">
    <div class="collection-header">
      <button class="back-button" @click="goBack">
        <el-icon><Back /></el-icon>
        返回收藏夹列表
      </button>
      <h3>{{ collection ? collection.name : "收藏夹详情" }}</h3>
    </div>

    <p v-if="collection && collection.description" class="collection-description">
      {{ collection.description }}
    </p>

    <LoadingSpinner v-if="loading" />

    <div v-else-if="literatures && literatures.length" class="literatures-list">
      <LiteratureCard
        v-for="article in literatures"
        :key="article.id"
        :article="article"
        @view-detail="viewArticleDetail"
      />
    </div>

    <EmptyState v-else-if="collection" message="此收藏夹还没有添加任何文献" />
  </div>
</template>

<script>
import LiteratureCard from "@/components/literature/LiteratureCard.vue"
import LoadingSpinner from "@/components/ui/LoadingSpinner.vue"
import EmptyState from "@/components/ui/EmptyState.vue"
import { Back } from "@element-plus/icons-vue"
import Literature from "@/api/Literature"
import notify from "@/utils/notify"

export default {
  name: "CollectionDetail",
  components: {
    LiteratureCard,
    LoadingSpinner,
    EmptyState,
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
        notify.error("获取收藏夹详情失败")
      } finally {
        this.loading = false
      }
    },
    goBack() {
      this.$emit("back-to-collections")
    },
    viewArticleDetail(articleId) {
      if (articleId === undefined || articleId === null || articleId === '') {
        notify.error('无法查看文章详情：文章ID无效')
        return
      }
      this.$router.push({
        name: "literature-detail",
        params: { id: String(articleId) }
      })
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
  color: var(--color-primary);
  font-size: 14px;
  font-weight: 500;
  padding: 0.5rem 0;
  cursor: pointer;
  margin-bottom: 1rem;
  width: fit-content;
}

.back-button:hover {
  color: var(--color-primary-dark);
  text-decoration: underline;
}

.collection-description {
  color: var(--color-text-muted);
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.literatures-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>

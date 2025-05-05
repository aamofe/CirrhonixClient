<!-- src/components/LiteratureItem.vue -->
<template>
  <div class="result-item" @click="handleClick">
    <h3>{{ article.title }}</h3>

    <div class="article-meta">
      <span>{{ formatAuthors }}</span>
      <span>{{ article.source }}</span>
      <span>{{ formattedDate }}</span>
    </div>

    <p class="article-abstract">{{ article.abstract }}</p>

    <div class="article-footer">
      <div class="tags">
        <span
          class="tag"
          v-for="(keyword, i) in limitedKeywords"
          :key="i"
        >
          {{ keyword }}
        </span>
      </div>

      <div class="article-stats">
        <span>引用: {{ article.citation_count }}</span>
        <span class="view-btn">查看全文</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LiteratureItem',
  props: {
    article: {
      type: Object,
      required: true
    }
  },
  computed: {
    formatAuthors() {
      const authors = this.article.authors || []
      if (authors.length === 0) return "未知作者"
      if (authors.length === 1) return authors[0]
      if (authors.length === 2) return `${authors[0]} 和 ${authors[1]}`
      return `${authors[0]} 等.`
    },
    formattedDate() {
      if (!this.article.publication_date) return ""
      const date = new Date(this.article.publication_date)
      return date.toLocaleDateString("zh-CN")
    },
    limitedKeywords() {
      return this.article.keywords?.slice(0, 3) || []
    }
  },
  methods: {
    handleClick() {
      this.$emit('view-detail', this.article.id)
    }
  }
}
</script>

<style scoped>
.result-item {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 20px;
  margin-bottom: 20px;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
}

.result-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

h3 {
  color: #1a91c1;
  font-size: 18px;
  margin-bottom: 10px;
}

.article-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  color: #666;
  font-size: 14px;
  margin-bottom: 15px;
}

.article-abstract {
  color: #444;
  margin-bottom: 15px;
  line-height: 1.5;
}

.article-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.tag {
  background: #e9f7f2;
  color: #66bb6a;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.article-stats {
  display: flex;
  align-items: center;
  gap: 15px;
  color: #666;
  font-size: 14px;
}

.view-btn {
  color: #1a91c1;
  font-weight: 500;
}

@media (max-width: 768px) {
  .article-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .article-stats {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
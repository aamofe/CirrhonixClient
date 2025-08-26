<template>
  <div class="literature-item" @click="handleClick">
    <h3 class="title">{{ article.title }}</h3>

    <div class="meta-info">
      <span class="authors">{{ formatAuthors }}</span>
      <span class="divider" v-if="article.authors?.length && article.source">|</span>
      <span class="source">{{ article.source }}</span>
      <span class="divider" v-if="(article.authors?.length || article.source) && formattedDate">|</span>
      <!-- <span>{{ article.authors }}</span> -->
      <span class="date">{{ formattedDate }}</span>
      <span class="divider" v-if="article.publication_type && formattedDate">|</span>
      <span class="type" v-if="article.publication_type">{{
        formatPublicationType
        }}</span>
    </div>

    <!-- <p class="abstract" v-if="article.abstract">{{ article.abstract }}</p> -->

    <div class="footer">
      <div class="left">
        <div class="tags" v-if="limitedKeywords.length > 0">
          <span class="tag-label">关键词:</span>
          <span class="tag" v-for="(keyword, i) in limitedKeywords" :key="i">
            {{ keyword }}
            <span v-if="i < limitedKeywords.length - 1">;</span>
          </span>
        </div>

        <div class="info">
          <span v-if="article.citation_count !== undefined" class="info-item">
            被引: {{ article.citation_count }}
          </span>
          <span class="divider" v-if="article.citation_count !== undefined && article.language">|</span>
          <span v-if="article.language" class="info-item">
            {{ getLanguageName(article.language) }}
          </span>
          <span class="divider" v-if="article.language && article.doi">|</span>
          <span v-if="article.doi" class="info-item">
            DOI: {{ article.doi }}
          </span>
        </div>
      </div>

      <div class="view-btn-container">
        <button class="view-btn" @click.stop="viewFullText">查看原文</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "LiteratureItem",
  props: {
    article: {
      type: Object,
      required: true,
    },
  },
  computed: {
    formatAuthors() {
      const authors = this.article.authors || []
      if (authors.length === 0) return "未知作者"
      if (authors.length === 1) return authors[0]
      if (authors.length === 2)
        return `${authors[0]} 和 ${authors[1]}`
      return `${authors[0]} 等.`
    },
    formattedDate() {
      if (!this.article.publication_date) return ""
      const date = new Date(this.article.publication_date)
      return date.toLocaleDateString("zh-CN")
    },
    limitedKeywords() {
      return this.article.keywords?.slice(0, 3) || []
    },
    formatPublicationType() {
      const types = {
        article: "期刊文章",
        review: "综述",
        conference: "会议论文",
        book: "书籍",
        thesis: "学位论文",
      }
      return (
        types[this.article.publication_type] || this.article.publication_type
      )
    },
  },
  methods: {
    handleClick() {
      this.$emit("view-detail", this.article.id)
    },
    viewFullText(e) {
      e.stopPropagation()


      if (this.article.url) {
        window.open(this.article.url, "_blank")
      } else {
        this.$emit("view-detail", this.article.id)
      }
    },
    getLanguageName(code) {
      const languages = {
        en: "英文",
        zh: "中文",
        ja: "日文",
        fr: "法文",
        de: "德文",
        es: "西班牙文",
        ru: "俄文",
      }
      return languages[code] || code
    },
  },
}
</script>

<style scoped>
.literature-item {
  background: white;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
  transition: all 0.2s ease;
  border: 1px solid #e8e8e8;
  padding: 16px 20px;
  cursor: pointer;
}

.literature-item:hover {
  background: #f5fbff;
  border-color: #a8e6cf;
}

.title {
  color: #333;
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 10px;
  line-height: 1.4;
  text-align: left;
}

.literature-item:hover .title {
  color: #1a91c1;
}

.meta-info {
  color: #666;
  font-size: 13px;
  margin-bottom: 12px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.divider {
  margin: 0 8px;
  color: #ddd;
}

.authors {
  font-weight: 500;
}

.source {
  color: #1a91c1;
}

.type {
  color: #666;
}

.abstract {
  color: #555;
  line-height: 1.5;
  margin-bottom: 16px;
  font-size: 14px;
  text-align: justify;
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.left {
  flex: 1;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 8px;
  font-size: 13px;
  color: #666;
}

.tag-label {
  margin-right: 5px;
  color: #999;
}

.tag {
  color: #1a91c1;
}

.info {
  font-size: 12px;
  color: #999;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  line-height: 1.5;
}

.info-item {
  margin-right: 12px;
  display: inline-flex;
  align-items: center;
  height: 20px;
}

.view-btn-container {
  margin-left: 15px;
}

.view-btn {
  background: #1a91c1;
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 3px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

.view-btn:hover {
  background: #0e7ca6;
}

@media (max-width: 768px) {
  .footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .view-btn-container {
    margin-left: 0;
    margin-top: 10px;
    align-self: flex-end;
  }

  .info {
    margin-bottom: 10px;
  }
}
</style>

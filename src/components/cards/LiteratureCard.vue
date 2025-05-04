<!-- src/components/LiteratureCard.vue -->
<template>
  <div class="card" @click="$emit('click')">
    <h3>{{ article.title }}</h3>
    <p>{{ truncatedAbstract }}</p>
    <div class="tags">
      <span
        class="tag"
        v-for="(tag, index) in article.keywords.slice(0, 2)"
        :key="index"
      >
        {{ tag }}
      </span>
    </div>
    <div class="meta">
      <span>{{ article.authors.slice(0, 3).join(", ") }}</span>
      <span>{{ formatDate(article.publication_date) }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: "LiteratureCard",
  props: {
    article: {
      type: Object,
      required: true,
      validator: function (obj) {
        return "title" in obj && "abstract" in obj;
      },
    },
  },
  computed: {
    truncatedAbstract() {
      if (!this.article.abstract) return "暂无摘要";
      return this.article.abstract.length > 100
        ? this.article.abstract.substring(0, 100) + "..."
        : this.article.abstract;
    },
  },
  methods: {
    formatDate(dateString) {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toLocaleDateString("zh-CN");
    },
  },
};
</script>

<style scoped>
.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 20px;
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.card h3 {
  color: #1a91c1;
  margin-bottom: 10px;
  font-size: 18px;
  font-weight: 500;
}

.card p {
  color: #666;
  font-size: 14px;
  margin-bottom: 15px;
  flex-grow: 1;
}

.tags {
  display: flex;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.tag {
  background: #e9f7f2;
  color: #66bb6a;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin-right: 5px;
  margin-bottom: 5px;
  display: inline-block;
}

.meta {
  display: flex;
  justify-content: space-between;
  color: #888;
  font-size: 12px;
  margin-top: auto;
}
</style>

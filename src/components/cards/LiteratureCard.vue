<!-- src/components/cards/LiteratureCard.vue -->
<template>
  <div class="card" @click="navigateToDetail">
    <div class="card-content">
      <h3 class="title">{{ literature_title }}</h3>
      <span class="read-date">{{ formatDate(readDate) }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: "LiteratureCard",
  props: {
    literature_id: {
      type: [Number, String],
      required: true
    },
    literature_title: {
      type: String,
      required: true
    },
    readDate: {
      type: String,
      default: null
    }
  },
  methods: {
    formatDate(dateString) {
      if (!dateString) return ""
      const date = new Date(dateString)
      return date.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    },
    navigateToDetail() {
      this.$router.push(`/literature/${this.literature_id}`)
    }
  },
}
</script>

<style scoped>
.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 16px;
  cursor: pointer;
}

.card-content {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: baseline;
}

.title {
  color: #333;
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  padding: 0;
  flex: 1 1 auto;
  min-width: 200px;
  text-align: left;
}

.card:hover .title {
  color: #1a91c1;
}

.read-date {
  color: #888;
  font-size: 12px;
  white-space: nowrap;
  flex: 0 0 auto;
}
</style>
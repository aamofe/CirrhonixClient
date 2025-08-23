<!-- src/components/AuthorCard.vue -->
<template>
  <div class="card" @click="$emit('click')">
    <div class="author-avatar">{{ authorInitial }}</div>
    <h3>{{ author.name }}</h3>
    <p class="affiliation">{{ author.affiliation }}</p>
    <div class="stats">
      <div class="stat-item">
        <div class="stat-value">{{ author.publication_count }}</div>
        <div class="stat-label">发表文献</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ author.citation_count }}</div>
        <div class="stat-label">被引次数</div>
      </div>
    </div>
    <div class="research-areas">
      <span class="area" v-for="(area, index) in displayedAreas" :key="index">
        {{ area }}
      </span>
    </div>
  </div>
</template>

<script>
export default {
  name: "AuthorCard",
  props: {
    author: {
      type: Object,
      required: true,
      validator: function (obj) {
        return "name" in obj;
      },
    },
  },
  computed: {
    authorInitial() {
      return this.author.name ? this.author.name.charAt(0) : "A";
    },
    displayedAreas() {
      if (
        !this.author.research_areas ||
        !Array.isArray(this.author.research_areas)
      ) {
        return [];
      }
      return this.author.research_areas.slice(0, 3);
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
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.author-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #a8e6cf;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 15px;
}

.card h3 {
  color: #1a91c1;
  margin-bottom: 5px;
  font-size: 18px;
  font-weight: 500;
}

.affiliation {
  color: #666;
  font-size: 14px;
  margin-bottom: 15px;
}

.stats {
  display: flex;
  justify-content: space-around;
  width: 100%;
  margin-bottom: 15px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-weight: bold;
  color: #1a91c1;
  font-size: 18px;
}

.stat-label {
  font-size: 12px;
  color: #888;
}

.research-areas {
  margin-top: auto;
  padding-top: 10px;
}

.area {
  background: #e9f7f2;
  color: #66bb6a;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin-right: 5px;
  margin-bottom: 5px;
  display: inline-block;
}
</style>

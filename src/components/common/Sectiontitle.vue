<!-- src/components/SectionTitle.vue -->
<template>
  <div class="section-title">
    <h2>{{ title }}</h2>
    <router-link v-if="url" :to="url">{{ linkText }}</router-link>
  </div>
</template>

<script>
export default {
  name: "SectionTitle",
  props: {
    title: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      default: "",
    },
    linkText: {
      type: String,
      default: "查看更多",
    },
  },
};
</script>

<style scoped>
.section-title {
  font-size: 20px;
  color: #333;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title h2 {
  font-size: 20px;
  font-weight: 500;
  color: #333;
  margin: 0;
}

.section-title a {
  font-size: 14px;
  color: #1a91c1;
  text-decoration: none;
  transition: color 0.3s;
}

.section-title a:hover {
  color: #157a9e;
  text-decoration: underline;
}
</style>

<!-- src/components/SearchBox.vue -->
<template>
  <div class="search-box">
    <input type="text" v-model="searchQuery" :placeholder="placeholder" @keyup.enter="handleSearch" />
    <button @click="handleSearch">搜索</button>
  </div>
</template>

<script>
export default {
  name: "SearchBox",
  props: {
    placeholder: {
      type: String,
      default: "输入关键词、作者、疾病名称等...",
    },
    initialQuery: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      searchQuery: this.initialQuery,
    }
  },
  methods: {
    handleSearch() {
      this.$emit("search", this.searchQuery.trim())
    },
  },
  watch: {
    initialQuery(newVal) {
      this.searchQuery = newVal
    },
  },
}
</script>

<style scoped>
.search-box {
  display: flex;
  max-width: 700px;
  margin: 0 auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.search-box input {
  flex: 1;
  padding: 15px 20px;
  border: none;
  font-size: 16px;
  color: #333;
}

.search-box input:focus {
  outline: none;
}

.search-box button {
  background-color: #1a91c1;
  color: white;
  border: none;
  padding: 0 25px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.search-box button:hover {
  background-color: #157a9e;
}
</style>
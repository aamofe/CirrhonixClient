<!-- src/components/SearchBox.vue -->
<template>
  <div class="search-box" :class="{ compact }">
    <el-input
      v-model="searchQuery"
      :placeholder="placeholder"
      clearable
      @keyup.enter="handleSearch"
      @clear="handleClear"
    >
      <template #prefix>
        <el-icon><Search /></el-icon>
      </template>
    </el-input>
    <PrimaryButton
      :fullWidth="false"
      :loading="loading"
      size="small"
      class="search-btn"
      @click="handleSearch"
    >
      搜索
    </PrimaryButton>
  </div>
</template>

<script>
import { Search } from '@element-plus/icons-vue'
import PrimaryButton from '@/components/ui/PrimaryButton.vue'

export default {
  name: 'SearchBox',
  components: { Search, PrimaryButton },
  props: {
    placeholder: {
      type: String,
      default: '输入关键词、作者、疾病名称等...',
    },
    initialQuery: {
      type: String,
      default: '',
    },
    loading: {
      type: Boolean,
      default: false,
    },
    compact: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['search', 'clear'],
  data() {
    return {
      searchQuery: this.initialQuery,
    }
  },
  watch: {
    initialQuery(newVal) {
      this.searchQuery = newVal
    },
  },
  methods: {
    handleSearch() {
      this.$emit('search', this.searchQuery.trim())
    },
    handleClear() {
      this.searchQuery = ''
      this.$emit('clear')
    },
  },
}
</script>

<style scoped>
.search-box {
  display: flex;
  max-width: 700px;
  margin: 0 auto;
  gap: 12px;
  align-items: center;
}

.search-box.compact {
  max-width: 600px;
}

.search-box :deep(.el-input) {
  flex: 1;
}

.search-box :deep(.el-input__wrapper) {
  border-radius: var(--radius-md);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.search-btn {
  flex-shrink: 0;
}
</style>

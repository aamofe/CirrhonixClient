<!-- src/components/cards/CollectionCard.vue -->
<template>
  <div class="collection-card">
    <div class="collection-header">
      <h4 class="collection-title" @click="$emit('view', collection)">
        {{ collection.name }}
      </h4>

      <!-- 三点式下拉菜单 -->
      <!-- 修改后的三点式下拉菜单部分 -->
      <el-dropdown trigger="click" size="small">
        <button class="action-btn more-btn">
          <el-icon><MoreFilled /></el-icon>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="$emit('edit', collection)">
              <el-icon><EditPen /></el-icon>
              <span>编辑信息</span>
            </el-dropdown-item>

            <!-- 修改后的删除选项 -->
            <el-dropdown-item @click="confirmDelete">
              <el-icon><Delete /></el-icon>
              <span>删除收藏夹</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <p v-if="collection.description" class="collection-description">
      {{ collection.description }}
    </p>

    <div class="collection-meta">
      <div class="meta-item">
        <el-icon><Document /></el-icon>
        <span>{{ collection.literature_count || 0 }} 篇文献</span>
      </div>
      <div class="meta-item">
        <el-icon><Calendar /></el-icon>
        <span>{{ formatDate(collection.updated_at) }}</span>
      </div>
    </div>

    <button class="view-collection" @click="$emit('view', collection)">
      查看收藏夹
    </button>
  </div>
</template>

<script>
import {
  Document,
  Calendar,
  MoreFilled,
  EditPen,
  Delete,
} from "@element-plus/icons-vue";
import { ElMessageBox } from "element-plus";
export default {
  name: "CollectionCard",
  components: {
    Document,
    Calendar,
    MoreFilled,
    EditPen,
    Delete,
  },
  props: {
    collection: {
      type: Object,
      required: true,
    },
  },
  methods: {
    formatDate(dateString) {
      if (!dateString) return "";

      const date = new Date(dateString);
      return date.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    },
    confirmDelete() {
      ElMessageBox.confirm("确定要删除该收藏夹吗？", "警告", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          this.$emit("delete", this.collection);
        })
        .catch(() => {});
    },
  },
};
</script>

<style scoped>
.collection-card {
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 1.25rem;
  background-color: white;
  transition: all 0.3s;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.collection-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: #a8e6cf;
}

.collection-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.collection-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  cursor: pointer;
}

.collection-title:hover {
  color: #1a91c1;
}

.action-btn {
  background: none;
  border: none;
  padding: 0.25rem;
  display: flex;
  cursor: pointer;
  color: #777;
  border-radius: 4px;
  transition: all 0.2s;
}

.more-btn:hover {
  color: #1a91c1;
  background-color: rgba(26, 145, 193, 0.1);
}

.collection-description {
  margin: 0 0 1rem;
  color: #666;
  font-size: 14px;
  line-height: 1.5;
  flex-grow: 1;
}

.collection-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: #777;
  font-size: 13px;
}

.view-collection {
  display: inline-block;
  padding: 0.5rem 0;
  color: #1a91c1;
  text-decoration: none;
  font-weight: 500;
  font-size: 14px;
  transition: color 0.2s;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
}

.view-collection:hover {
  color: #157aa3;
  text-decoration: underline;
}
</style>

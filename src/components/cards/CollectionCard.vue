<!-- src/components/profile/CollectionCard.vue -->
<template>
  <div class="collection-card">
    <div class="collection-header">
      <router-link :to="{ name: 'collection', params: { id: collection.id } }">
        <h4 class="collection-title">{{ collection.name }}</h4>
      </router-link>
      <div class="collection-actions">
        <button class="action-btn edit-btn" @click="$emit('edit', collection)">
          <EditIcon />
        </button>
        <button
          class="action-btn delete-btn"
          @click="$emit('delete', collection)"
        >
          <DeleteIcon />
        </button>
      </div>
    </div>

    <p v-if="collection.description" class="collection-description">
      {{ collection.description }}
    </p>

    <div class="collection-meta">
      <div class="meta-item">
        <BookIcon />
        <span>{{ collection.literature_count || 0 }} 篇文献</span>
      </div>
      <div class="meta-item">
        <CalendarIcon />
        <span>{{ formatDate(collection.updated_at) }}</span>
      </div>
    </div>

    <router-link
      :to="{ name: 'collection', params: { id: collection.id } }"
      class="view-collection"
    >
      查看收藏夹
    </router-link>
  </div>
</template>

<script>
// 假设的图标组件
import EditIcon from "@/components/icons/EditIcon.vue";
import DeleteIcon from "@/components/icons/DeleteIcon.vue";
import BookIcon from "@/components/icons/BookIcon.vue";
import CalendarIcon from "@/components/icons/CalendarIcon.vue";

export default {
  name: "CollectionCard",
  components: {
    EditIcon,
    DeleteIcon,
    BookIcon,
    CalendarIcon,
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
}

.collection-title a {
  color: inherit;
  text-decoration: none;
}

.collection-title a:hover {
  color: #1a91c1;
}

.collection-actions {
  display: flex;
  gap: 0.5rem;
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

.edit-btn:hover {
  color: #1a91c1;
  background-color: rgba(26, 145, 193, 0.1);
}

.delete-btn:hover {
  color: #ff6b6b;
  background-color: rgba(255, 107, 107, 0.1);
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
}

.view-collection:hover {
  color: #157aa3;
  text-decoration: underline;
}
</style>

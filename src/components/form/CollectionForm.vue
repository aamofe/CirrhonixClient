<!-- src/components/profile/CollectionForm.vue -->
<template>
  <form @submit.prevent="handleSubmit" class="collection-form">
    <div class="form-group">
      <label for="name">收藏夹名称</label>
      <input
        type="text"
        id="name"
        v-model="form.name"
        class="form-input"
        required
        placeholder="输入收藏夹名称"
      />
    </div>

    <div class="form-group">
      <label for="description">收藏夹描述 (可选)</label>
      <textarea
        id="description"
        v-model="form.description"
        class="form-textarea"
        rows="4"
        placeholder="简短描述这个收藏夹的内容或用途"
      ></textarea>
    </div>

    <div class="form-actions">
      <button type="button" class="cancel-btn" @click="$emit('cancel')">
        取消
      </button>
      <PrimaryButton type="submit" :fullWidth="false">{{
        isEdit ? "保存修改" : "创建收藏夹"
      }}</PrimaryButton>
    </div>
  </form>
</template>

<script>
import PrimaryButton from "@/components/buttons/PrimaryButton.vue";

export default {
  name: "CollectionForm",
  components: {
    PrimaryButton,
  },
  props: {
    collection: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      form: {
        name: "",
        description: "",
      },
    };
  },
  computed: {
    isEdit() {
      return !!this.collection;
    },
  },
  created() {
    // 如果是编辑模式，填充表单数据
    if (this.collection) {
      this.form.name = this.collection.name || "";
      this.form.description = this.collection.description || "";
    }
  },
  methods: {
    handleSubmit() {
      // 发送表单数据给父组件
      this.$emit("submit", { ...this.form });
    },
  },
};
</script>

<style scoped>
.collection-form {
  width: 100%;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #444;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #a8e6cf;
  box-shadow: 0 0 0 3px rgba(168, 230, 207, 0.2);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-actions {
  margin-top: 2rem;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.cancel-btn {
  padding: 0.75rem 1.5rem;
  background: none;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  color: #555;
}

.cancel-btn:hover {
  background-color: #f5f5f5;
  border-color: #ccc;
}
</style>

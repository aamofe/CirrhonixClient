<!-- src/components/form/CollectionForm.vue -->
<template>
  <form @submit.prevent="submitForm" class="collection-form">
    <div class="form-group">
      <label for="name">收藏夹名称 <span class="required">*</span></label>
      <input
        type="text"
        id="name"
        v-model="form.name"
        required
        class="form-input"
      />
    </div>

    <div class="form-group">
      <label for="description">描述</label>
      <textarea
        id="description"
        v-model="form.description"
        rows="4"
        class="form-input"
      ></textarea>
    </div>

    <div class="form-actions">
      <button type="button" class="cancel-button" @click="cancel">取消</button>
      <button type="submit" class="submit-button" :disabled="isSubmitting">
        保存
      </button>
    </div>
  </form>
</template>

<script>
import Literature from "@/api/Literature";

export default {
  name: "CollectionForm",
  props: {
    collection: {
      type: Object,
      default: null,
    },
    collections: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      form: {
        name: "",
        description: "",
      },
      isSubmitting: false,
    };
  },
  created() {
    // 如果有collection prop，填充表单
    if (this.collection) {
      this.form.name = this.collection.name;
      this.form.description = this.collection.description || "";
    }
  },
  methods: {
    async submitForm() {
      if (this.isSubmitting) return;

      this.isSubmitting = true;

      try {
        if (this.collection) {
          // 更新现有收藏夹
          await this.updateCollection();
        } else {
          // 创建新收藏夹
          await this.createCollection();
        }
      } finally {
        this.isSubmitting = false;
      }
    },

    async createCollection() {
      try {
        const response = await Literature.createCollection(this.form);

        // 通知父组件关闭模态框和刷新列表
        this.$emit("success", {
          action: "create",
          data: response.data.data,
        });

        this.$message.success("收藏夹创建成功");
      } catch (error) {
        console.error("创建收藏夹失败", error);
        this.$message.error("创建收藏夹失败");
      }
    },

    async updateCollection() {
      try {
        // 确保我们有收藏夹ID
        const collectionId = this.collection.id;

        await Literature.updateCollection(collectionId, this.form);

        // 创建更新后的收藏夹对象
        const updatedCollection = {
          ...this.collection,
          ...this.form,
        };

        // 通知父组件关闭模态框和更新列表
        this.$emit("success", {
          action: "update",
          data: updatedCollection,
        });

        this.$message.success("收藏夹更新成功");
      } catch (error) {
        console.error("更新收藏夹失败", error);
        this.$message.error("更新收藏夹失败");
      }
    },

    cancel() {
      this.$emit("cancel");
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
  color: #333;
}

.required {
  color: #ff6b6b;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
}

.form-input:focus {
  outline: none;
  border-color: #1a91c1;
  box-shadow: 0 0 0 2px rgba(26, 145, 193, 0.2);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.cancel-button {
  padding: 0.75rem 1.5rem;
  background-color: #f2f2f2;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.cancel-button:hover {
  background-color: #e0e0e0;
}

.submit-button {
  padding: 0.75rem 1.5rem;
  background-color: #1a91c1;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-button:hover:not(:disabled) {
  background-color: #157aa3;
}

.submit-button:disabled {
  background-color: #a0c4d4;
  cursor: not-allowed;
}
</style>

<!-- src/components/layout/CollectionDialog.vue -->
<template>
  <el-dialog :title="title" v-model="dialogVisible" width="400px" @close="handleClose">
    <div class="collections-dialog">
      <div v-if="collections.length === 0" class="no-collections">
        您还没有创建收藏夹
      </div>
      <div v-else class="collections-list-dialog">
        <div v-for="(collection, index) in collectionsData" :key="index" class="collection-item-dialog"
          @click="toggleCollectionSelection(collection.id)">
          <el-checkbox v-model="collection.selected" @click.stop class="collection-checkbox">
          </el-checkbox>
          <span class="collection-name">{{ collection.name }}</span>
        </div>
      </div>

      <div class="create-collection-section">
        <div class="input-button-group">
          <el-input v-model="newCollectionName" placeholder="创建新收藏夹..." @keyup.enter="createNewCollection"
            class="create-input"></el-input>
          <el-button type="primary" @click="createNewCollection" :disabled="!newCollectionName.trim()">创建</el-button>
        </div>
      </div>

      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSave">确定</el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script>
import Literature from "@/api/Literature"

export default {
  name: "CollectionDialog",
  props: {
    title: {
      type: String,
      default: "选择收藏夹"
    },
    modelValue: {
      type: Boolean,
      default: false
    },
    literatureId: {
      type: String,
      required: true
    },
    collections: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      collectionsData: [],
      newCollectionName: "",
    }
  },
  computed: {
    dialogVisible: {
      get() {
        return this.modelValue
      },
      set(value) {
        this.$emit('update:modelValue', value)
      }
    }
  },
  watch: {
    collections: {
      handler(newCollections) {
        this.collectionsData = JSON.parse(JSON.stringify(newCollections))
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    handleClose() {
      this.$emit("update:modelValue", false)
    },
    handleCancel() {
      this.$emit("update:modelValue", false)
      this.$emit("cancel")
    },
    async handleSave() {
      try {
        // 获取选中的收藏夹ID
        const selectedIds = this.collectionsData
          .filter(collection => collection.selected)
          .map(collection => collection.id)

        // 更新文献的收藏夹关联
        await Literature.updateLiteratureCollections(this.literatureId, {
          collection_ids: selectedIds
        })

        // 通知父组件更新收藏夹数据
        this.$emit("collections-updated", this.collectionsData)

        // 关闭对话框
        this.$emit("update:modelValue", false)

        this.$message.success('已收藏')
      } catch (error) {
        console.error('更新收藏夹失败:', error)
        this.$message.error('更新收藏夹失败')
      }
    },
    toggleCollectionSelection(collectionId) {
      const collection = this.collectionsData.find(c => c.id === collectionId)
      if (collection) {
        collection.selected = !collection.selected
      }
    },
    async createNewCollection() {
      const name = this.newCollectionName.trim()

      if (!name) return

      try {
        // 只创建新收藏夹，不添加文献
        const response = await Literature.createCollection({
          name,
          description: '',
        })

        const newCollection = response.data.data

        // 将新收藏夹添加到本地数据中，默认未选中
        const updatedCollection = {
          ...newCollection,
          selected: false, // 默认不选中，让用户自己决定是否添加
          has_literature: false // 新创建的收藏夹还没有当前文献
        }

        this.collectionsData.push(updatedCollection)

        // 清空输入框
        this.newCollectionName = ""

        // 通知父组件有新的收藏夹创建
        this.$emit("collection-created", updatedCollection)

        this.$message.success('收藏夹创建成功')
      } catch (error) {
        console.error('创建收藏夹失败:', error)
        this.$message.error('创建收藏夹失败')
      }
    }
  }
}
</script>

<style scoped>
.collections-dialog {
  padding: 10px 0;
}

.collections-list-dialog {
  max-height: 250px;
  overflow-y: auto;
  margin-bottom: 20px;
}

.collection-item-dialog {
  display: flex;
  align-items: center;
  padding: 8px 0;
  cursor: pointer;
  text-align: left;
}

.collection-checkbox {
  pointer-events: auto !important;
}

.collection-name {
  margin-left: 10px;
  text-align: left;
}

.no-collections {
  text-align: center;
  color: #999;
  padding: 20px 0;
}

.create-collection-section {
  margin-bottom: 20px;
}

.input-button-group {
  display: flex;
  align-items: center;
}

.create-input {
  flex: 1;
  margin-right: 10px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
</style>
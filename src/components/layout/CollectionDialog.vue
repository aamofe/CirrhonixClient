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
    visible: {
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
      dialogVisible: this.visible,
      collectionsData: [],
      newCollectionName: "",
    }
  },
  watch: {
    visible(newVal) {
      this.dialogVisible = newVal
    },
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
      this.$emit("update:visible", false)
    },
    handleCancel() {
      this.$emit("update:visible", false)
      this.$emit("cancel")
    },
    async handleSave() {
      try {
        // 获取选中的收藏夹ID
        const selectedIds = this.collectionsData
          .filter(collection => collection.selected)
          .map(collection => collection.id)

        // 调用API更新收藏夹
        await Literature.updateLiteratureCollections(this.literatureId, {
          collection_ids: selectedIds
        })

        // 传递更新后的收藏夹数据给父组件
        this.$emit("collections-updated", this.collectionsData)
        this.$emit("update:visible", false)
        this.$message.success('收藏夹已更新')
      } catch (error) {
        console.error("Error updating collections:", error)
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
        // 创建新收藏夹
        const response = await Literature.createCollection({
          name,
          description: '',
        })

        const newCollection = response.data.data

        // 将文献添加到新收藏夹
        await Literature.updateCollection(newCollection.id, {
          add_literature_ids: [this.literatureId]
        })

        // 添加新创建的收藏夹并设为选中
        const updatedCollection = {
          ...newCollection,
          selected: true,
          has_literature: true
        }

        this.collectionsData.push(updatedCollection)

        // 清空输入
        this.newCollectionName = ""

        this.$message.success('收藏夹创建成功')
      } catch (error) {
        console.error("Error creating collection:", error)
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
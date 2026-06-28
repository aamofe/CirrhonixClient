<!-- src/components/literature/CollectionSelector.vue -->
<template>
  <BaseModal v-if="modelValue" :title="title" max-width="440px" @close="handleClose">
    <div class="collections-dialog">
      <EmptyState v-if="collections.length === 0" message="您还没有创建收藏夹" />

      <div v-else class="collections-list-dialog">
        <div
          v-for="(collection, index) in collectionsData"
          :key="index"
          class="collection-item-dialog"
          @click="toggleCollectionSelection(collection.id)"
        >
          <el-checkbox v-model="collection.selected" @click.stop class="collection-checkbox" />
          <span class="collection-name">{{ collection.name }}</span>
        </div>
      </div>

      <div class="create-collection-section">
        <div class="input-button-group">
          <el-input
            v-model="newCollectionName"
            placeholder="创建新收藏夹..."
            @keyup.enter="createNewCollection"
            class="create-input"
          />
          <PrimaryButton :fullWidth="false" @click="createNewCollection" :disabled="!newCollectionName.trim()">
            创建
          </PrimaryButton>
        </div>
      </div>
    </div>

    <template #footer>
      <CancelButton @click="handleCancel">取消</CancelButton>
      <PrimaryButton :fullWidth="false" @click="handleSave">确定</PrimaryButton>
    </template>
  </BaseModal>
</template>

<script>
import BaseModal from '@/components/ui/BaseModal.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import PrimaryButton from '@/components/ui/PrimaryButton.vue'
import CancelButton from '@/components/ui/CancelButton.vue'
import Literature from '@/api/Literature'
import notify from '@/utils/notify'

export default {
  name: 'CollectionSelector',
  components: {
    BaseModal,
    EmptyState,
    PrimaryButton,
    CancelButton,
  },
  props: {
    title: { type: String, default: '选择收藏夹' },
    modelValue: { type: Boolean, default: false },
    literatureId: { type: String, required: true },
    collections: { type: Array, default: () => [] },
  },
  emits: ['update:modelValue', 'collections-updated', 'collection-created', 'cancel'],
  data() {
    return {
      collectionsData: [],
      newCollectionName: '',
    }
  },
  watch: {
    collections: {
      handler(newCollections) {
        this.collectionsData = JSON.parse(JSON.stringify(newCollections))
      },
      immediate: true,
      deep: true,
    },
  },
  methods: {
    handleClose() {
      this.$emit('update:modelValue', false)
    },
    handleCancel() {
      this.$emit('update:modelValue', false)
      this.$emit('cancel')
    },
    async handleSave() {
      try {
        const selectedIds = this.collectionsData
          .filter((collection) => collection.selected)
          .map((collection) => collection.id)

        await Literature.updateLiteratureCollections(this.literatureId, {
          collection_ids: selectedIds,
        })

        this.$emit('collections-updated', this.collectionsData)
        this.$emit('update:modelValue', false)
        notify.success('已收藏')
      } catch (error) {
        console.error('更新收藏夹失败:', error)
        notify.error('更新收藏夹失败')
      }
    },
    toggleCollectionSelection(collectionId) {
      const collection = this.collectionsData.find((c) => c.id === collectionId)
      if (collection) {
        collection.selected = !collection.selected
      }
    },
    async createNewCollection() {
      const name = this.newCollectionName.trim()
      if (!name) return

      try {
        const response = await Literature.createCollection({ name, description: '' })
        const newCollection = response.data.data

        this.collectionsData.push({
          ...newCollection,
          selected: false,
          has_literature: false,
        })

        this.newCollectionName = ''
        this.$emit('collection-created', newCollection)
        notify.success('收藏夹创建成功')
      } catch (error) {
        console.error('创建收藏夹失败:', error)
        notify.error('创建收藏夹失败')
      }
    },
  },
}
</script>

<style scoped>
.collections-dialog {
  padding: 0;
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

.create-collection-section {
  margin-bottom: 0;
}

.input-button-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.create-input {
  flex: 1;
}
</style>

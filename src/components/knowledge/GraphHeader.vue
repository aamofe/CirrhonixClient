<!-- src/components/knowledge/GraphHeader.vue -->
<template>
  <div class="graph-header">
    <h1>肝硬化知识图谱</h1>
    <p>可视化展示肝硬化相关研究的关键概念、文献间的引用关系及研究进展脉络</p>

    <div class="graph-controls">
      <div class="search-filter">
        <input
          type="text"
          :value="searchKeyword"
          @input="$emit('update:searchKeyword', $event.target.value)"
          placeholder="搜索节点..."
        />
      </div>

      <div class="view-toggles">
        <span>视图:</span>
        <button
          v-for="view in viewOptions"
          :key="view.value"
          :class="['view-btn', currentView === view.value ? 'active' : '']"
          @click="$emit('update:currentView', view.value)"
        >
          {{ view.label }}
        </button>
      </div>
    </div>

    <div class="filter-tags">
      <div class="filter-group">
        <span class="filter-label">节点类型:</span>
        <div class="tag-options">
          <span
            v-for="type in nodeTypes"
            :key="type.value"
            :class="[
              'filter-tag',
              selectedNodeTypes.includes(type.value) ? 'active' : '',
            ]"
            @click="toggleNodeType(type.value)"
          >
            {{ type.label }}
          </span>
        </div>
      </div>

      <div class="filter-group">
        <span class="filter-label">关系类型:</span>
        <div class="tag-options">
          <span
            v-for="type in relationTypes"
            :key="type.value"
            :class="[
              'filter-tag',
              selectedRelationTypes.includes(type.value) ? 'active' : '',
            ]"
            @click="toggleRelationType(type.value)"
          >
            {{ type.label }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GraphHeader',
  props: {
    searchKeyword: String,
    currentView: String,
    selectedNodeTypes: Array,
    selectedRelationTypes: Array,
    nodeTypes: Array,
    relationTypes: Array,
  },
  emits: [
    'update:searchKeyword',
    'update:currentView',
    'update:selectedNodeTypes',
    'update:selectedRelationTypes',
    'filter-change',
  ],
  setup(props, { emit }) {
    const viewOptions = [
      { label: '概念网络', value: 'concept' },
      { label: '引用关系', value: 'citation' },
      { label: '时间轴', value: 'timeline' },
    ]

    const toggleNodeType = (typeValue) => {
      const newTypes = [...props.selectedNodeTypes]
      const index = newTypes.indexOf(typeValue)

      if (index > -1) {
        newTypes.splice(index, 1)
      } else {
        newTypes.push(typeValue)
      }

      emit('update:selectedNodeTypes', newTypes)
      emit('filter-change')
    }

    const toggleRelationType = (typeValue) => {
      const newTypes = [...props.selectedRelationTypes]
      const index = newTypes.indexOf(typeValue)

      if (index > -1) {
        newTypes.splice(index, 1)
      } else {
        newTypes.push(typeValue)
      }

      emit('update:selectedRelationTypes', newTypes)
      emit('filter-change')
    }

    return {
      viewOptions,
      toggleNodeType,
      toggleRelationType,
    }
  },
}
</script>

<style scoped>
.graph-header {
  background: linear-gradient(135deg, #1a91c1 0%, #a8e6cf 100%);
  padding: 30px 5%;
  color: white;
}

.graph-header h1 {
  font-size: 28px;
  margin-bottom: 10px;
}

.graph-header p {
  margin-bottom: 20px;
  max-width: 800px;
}

.graph-controls {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.search-filter {
  width: 300px;
}

.search-filter input {
  width: 100%;
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
}

.view-toggles {
  display: flex;
  align-items: center;
  gap: 10px;
}

.view-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.view-btn.active {
  background: white;
  color: #1a91c1;
}

.filter-tags {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.filter-group {
  display: flex;
  align-items: center;
}

.filter-label {
  width: 80px;
  font-weight: 500;
}

.tag-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-tag {
  background: rgba(255, 255, 255, 0.2);
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.filter-tag.active {
  background: white;
  color: #1a91c1;
}
</style>

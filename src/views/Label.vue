<template>
  <div class="label-tool">
    <!-- 统一的头部样式 -->
    <section class="tool-header">
      <div class="header-content">
        <div class="header-text">
          <h1>关系抽取标注工具</h1>
          <p>导出格式直接用于模型训练 - 基于位置的实体标注（智能位置修复）</p>
        </div>
      </div>
    </section>

    <div class="container">
      <!-- 文献选择区域 -->
      <div class="config-card">
        <div class="config-row">
          <div class="config-item">
            <label class="config-label">选择文献</label>
            <select
              v-model="selectedLiteratureId"
              @change="onLiteratureSelect"
              class="config-select"
            >
              <option value="">请选择要标注的文献</option>
              <option
                v-for="item in annotationList"
                :key="item.literature_id"
                :value="item.literature_id"
              >
                [{{ item.literature_id }}] {{ item.title }} 
                <span v-if="item.is_annotated">✓</span>
                <span v-if="item.entity_count > 0"> ({{ item.entity_count }}E/{{ item.relation_count }}R)</span>
              </option>
            </select>
          </div>

          <div class="config-item">
            <label class="config-label">或输入文献ID</label>
            <div class="search-box">
              <input
                v-model="searchLiteratureId"
                type="number"
                class="config-input"
                placeholder="输入文献ID"
                @keyup.enter="onSearchLiterature"
              />
              <button @click="onSearchLiterature" class="search-btn">
                <svg class="icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
                搜索
              </button>
            </div>
          </div>
          
          <div class="action-buttons">
            <button 
              @click="saveAnnotation" 
              :disabled="!currentLiteratureId || isSaving"
              class="primary-btn"
            >
              <svg class="icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              <span v-if="isSaving">保存中...</span>
              <span v-else>保存标注</span>
            </button>
            
            <button 
              @click="downloadAnnotations" 
              :disabled="isDownloading"
              class="secondary-btn"
            >
              <svg class="icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
              </svg>
              <span v-if="isDownloading">下载中...</span>
              <span v-else>下载所有标注</span>
            </button>
          </div>
        </div>

        <!-- 标注状态统计 -->
        <div class="stats-row">
          <div class="stat-item">
            <span class="stat-label">总文献数:</span>
            <span class="stat-value">{{ annotationList?.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">已标注:</span>
            <span class="stat-value stat-annotated">{{ annotatedCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">未标注:</span>
            <span class="stat-value stat-unannotated">{{ unannotatedCount }}</span>
          </div>
          <div v-if="currentLiteratureId" class="stat-item current-lit">
            <span class="stat-label">当前文献ID:</span>
            <span class="stat-value">{{ currentLiteratureId }}</span>
            <span 
              :class="['status-badge', currentIsAnnotated ? 'annotated' : 'unannotated']"
            >
              {{ currentIsAnnotated ? '已标注' : '未标注' }}
            </span>
          </div>
          <div v-if="currentLiteratureId" class="stat-item">
            <span class="stat-label">实体:</span>
            <span class="stat-value">{{ entities.length }}</span>
            <span class="stat-label" style="margin-left: 12px;">关系:</span>
            <span class="stat-value">{{ relations.length }}</span>
          </div>
        </div>
      </div>

      <!-- 主要内容区域 -->
      <div v-if="currentLiteratureId" class="main-content">
        <!-- 实体标注区 -->
        <div class="content-card">
          <h2 class="card-title">
            <span class="step-number">1</span>
            标注实体 (基于文本位置)
          </h2>
          
          <!-- 文本显示区 -->
          <div
            ref="textContent"
            class="text-display"
            @mouseup="handleTextSelection"
          >
            <template v-if="fullText && sentences?.length > 0">
              <span
                v-for="sentence in renderedSentences"
                :key="sentence.id"
                class="sentence-wrapper"
              >
                <span class="sentence-id">[{{ sentence.id }}]</span>
                <span
                  v-for="(part, index) in sentence.parts"
                  :key="`${sentence.id}-${index}`"
                  :class="['text-part', part.isEntity ? `entity-${part.type.toLowerCase()}` : '']"
                  :style="part.isEntity ? getEntityStyle(part.type) : {}"
                  :title="part.isEntity ? `${part.type} (${part.id}) [${part.start}-${part.end}]` : ''"
                  :data-start="part.start"
                  :data-end="part.end"
                >
                  {{ part.text }}
                  <span v-if="part.isEntity" class="entity-tooltip">
                    {{ part.type }} ({{ part.id }})<br/>
                    <small>pos: {{ part.start }}-{{ part.end }}</small>
                  </span>
                </span>
              </span>
            </template>
            <span v-else-if="!fullText" class="placeholder-text">选择文献后将显示文本内容</span>
            <span v-else>{{ fullText }}</span>
          </div>

          <!-- 选中文本操作 -->
          <div v-if="selectedText" class="selection-panel">
            <p class="selection-info">
              选中的文本: <strong>{{ selectedText }}</strong>
              <span class="selection-range">(位置: {{ selectionRange.start }} - {{ selectionRange.end }})</span>
            </p>
            <div class="selection-actions">
              <select v-model="entityLabel" class="entity-select">
                <option v-for="type in entityTypes" :key="type" :value="type">{{ type }}</option>
              </select>
              <button @click="addEntity" class="add-btn">
                <svg class="icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                添加实体
              </button>
            </div>
          </div>

          <!-- 已标注实体列表 -->
          <div class="entity-list-section">
            <h3 class="list-title">已标注实体 ({{ entities?.length }})</h3>
            <div class="entity-list">
              <div
                v-for="entity in entities"
                :key="entity.id"
                :class="['entity-item', `entity-bg-${entity.type.toLowerCase()}`]"
              >
                <div class="entity-info">
                  <span class="entity-text">{{ entity.text || entity.mention || '未命名实体' }}</span>
                  <span class="entity-meta">
                    <span class="entity-type-badge">{{ entity.type }}</span>
                    <span class="entity-id-badge">[{{ entity.id }}]</span>
                    <small>pos: {{ entity.start }}-{{ entity.end }}</small>
                  </span>
                </div>
                <button @click="deleteEntity(entity.id)" class="delete-btn">
                  <svg class="icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 关系标注区 -->
        <div class="content-card">
          <h2 class="card-title">
            <span class="step-number">2</span>
            添加关系
          </h2>
          
          <div class="relation-form">
            <!-- Source Entity -->
            <div class="form-group">
              <label class="form-label">Source Entity *</label>
              <select v-model="currentRelation.source_entity" class="form-select">
                <option value="">选择 source 实体</option>
                <option v-for="e in entities" :key="e.id" :value="e.id">
                  {{ e.text }} ({{ e.type }}) [{{ e.id }}]
                </option>
              </select>
            </div>

            <!-- Target Entity -->
            <div class="form-group">
              <label class="form-label">Target Entity *</label>
              <select v-model="currentRelation.target_entity" class="form-select">
                <option value="">选择 target 实体</option>
                <option v-for="e in entities" :key="e.id" :value="e.id">
                  {{ e.text }} ({{ e.type }}) [{{ e.id }}]
                </option>
              </select>
            </div>

            <!-- Relation Type -->
            <div class="form-group">
              <label class="form-label">Relation Type *</label>
              <input
                v-model="currentRelation.relation_type"
                type="text"
                class="form-input"
                placeholder="例如: ASSOCIATION, INHIBITION, ACTIVATION"
              />
            </div>

            <!-- Evidence Sentence IDs -->
            <div class="form-group">
              <label class="form-label">Evidence Sentence IDs</label>
              <input
                v-model="currentRelation.evidence_sentence_ids_input"
                type="text"
                class="form-input"
                placeholder="输入句子ID，多个用逗号分隔，例如: 0,1,2"
              />
              <small class="form-hint">多个句子ID请用逗号分隔</small>
            </div>

            <!-- 操作按钮 -->
            <div class="form-actions">
              <button
                @click="addRelation"
                :disabled="!currentRelation.source_entity || !currentRelation.target_entity || !currentRelation.relation_type"
                class="save-btn"
              >
                <template v-if="editingRelationIndex !== null">
                  <svg class="icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                  </svg>
                  保存修改
                </template>
                <template v-else>
                  <svg class="icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  添加关系
                </template>
              </button>
              <button v-if="editingRelationIndex !== null" @click="cancelEdit" class="cancel-btn">
                <svg class="icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- 已添加关系列表 -->
          <div class="relation-list-section">
            <h3 class="list-title">已添加关系 ({{ relations?.length }})</h3>
            <div class="relation-list">
              <div v-for="(rel, idx) in relations" :key="idx" class="relation-item">
                <div class="relation-content">
                  <div class="relation-entities">
                    <span class="source-entity">{{ rel.source_text || '未命名' }}</span>
                    <span class="entity-type-tag">{{ rel.source_type }}</span>
                    <span class="entity-id">[{{ rel.source_entity }}]</span>
                    <span class="arrow">→</span>
                    <span class="target-entity">{{ rel.target_text || '未命名' }}</span>
                    <span class="entity-type-tag">{{ rel.target_type }}</span>
                    <span class="entity-id">[{{ rel.target_entity }}]</span>
                  </div>
                  <div class="relation-details">
                    <div><strong>Type:</strong> {{ rel.relation_type }}</div>
                    <div v-if="rel.evidence_sentence_ids && rel.evidence_sentence_ids.length > 0">
                      <strong>Evidence Sentences:</strong> 
                      <span class="sentence-ids-list">
                        <span 
                          v-for="(sid, idx) in rel.evidence_sentence_ids" 
                          :key="idx"
                          class="sentence-id-tag"
                        >
                          [{{ sid }}]
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
                <div class="relation-actions">
                  <button @click="editRelation(idx)" class="edit-btn">
                    <svg class="icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button @click="deleteRelation(idx)" class="delete-btn">
                    <svg class="icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
        <p class="empty-text">请从上方选择或搜索文献开始标注</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import Literature from '@/api/Literature'

// ============ 核心新增：智能文本位置匹配函数 ============
const findBestTextPosition = (fullText, entityText, suggestedStart, suggestedEnd) => {
  if (!fullText || !entityText) {
    return { start: suggestedStart, end: suggestedEnd, matched: false }
  }

  const normalizedEntity = entityText.trim()
  
  // 1. 验证建议位置
  const textAtSuggested = fullText.slice(suggestedStart, suggestedEnd).trim()
  if (textAtSuggested === normalizedEntity) {
    return { start: suggestedStart, end: suggestedEnd, matched: true }
  }
  
  // 2. 在建议位置附近搜索（前后50字符）
  const searchStart = Math.max(0, suggestedStart - 50)
  const searchEnd = Math.min(fullText.length, suggestedEnd + 50)
  const searchArea = fullText.slice(searchStart, searchEnd)
  const localIndex = searchArea.indexOf(normalizedEntity)
  
  if (localIndex !== -1) {
    const actualStart = searchStart + localIndex
    return {
      start: actualStart,
      end: actualStart + normalizedEntity.length,
      matched: true
    }
  }
  
  // 3. 尝试模糊匹配（忽略多余空格和标点）
  const cleanEntity = normalizedEntity.replace(/[\s\.\,\!\?\;\:]+/g, '').toLowerCase()
  for (let i = searchStart; i < searchEnd - normalizedEntity.length; i++) {
    const window = fullText.slice(i, i + normalizedEntity.length + 20)
    const cleanWindow = window.replace(/[\s\.\,\!\?\;\:]+/g, '').toLowerCase()
    
    if (cleanWindow.startsWith(cleanEntity)) {
      // 找到模糊匹配，确定精确边界
      let end = i
      let matchedChars = 0
      
      for (let j = i; j < fullText.length && matchedChars < cleanEntity.length; j++) {
        const char = fullText[j]
        if (!/[\s\.\,\!\?\;\:]/.test(char)) {
          matchedChars++
        }
        end = j + 1
      }
      
      return { start: i, end: end, matched: true }
    }
  }
  
  // 4. 全文搜索作为最后手段
  const globalIndex = fullText.indexOf(normalizedEntity)
  if (globalIndex !== -1) {
    return {
      start: globalIndex,
      end: globalIndex + normalizedEntity.length,
      matched: true
    }
  }
  
  // 5. 无法匹配，返回原位置
  console.warn(`⚠️ 无法精确匹配实体: "${entityText}" 建议位置 ${suggestedStart}-${suggestedEnd}`)
  return { start: suggestedStart, end: suggestedEnd, matched: false }
}

// 状态管理
const annotationList = ref([])
const selectedLiteratureId = ref('')
const searchLiteratureId = ref('')
const currentLiteratureId = ref(null)
const currentIsAnnotated = ref(false)

const fullText = ref('')
const sentences = ref([])
const entities = ref([])
const relations = ref([])
const selectedText = ref('')
const selectionRange = ref(null)
const entityLabel = ref('CELL')
const currentRelation = ref({
  source_entity: '',
  target_entity: '',
  relation_type: 'ASSOCIATION',
  evidence_sentence_ids_input: ''
})
const editingRelationIndex = ref(null)
const textContent = ref(null)

const isSaving = ref(false)
const isDownloading = ref(false)

// 常量
const entityTypes = ['CELL', 'DISEASE', 'PROTEIN', 'GENE', 'DRUG', 'PATHOGEN', 'CIRRHOSIS', 'OTHER']

const entityTypeColors = {
  'CELL': '#3b82f6',
  'DISEASE': '#ef4444',
  'PROTEIN': '#10b981',
  'GENE': '#8b5cf6',
  'DRUG': '#f59e0b',
  'PATHOGEN': '#ec4899',
  'CIRRHOSIS': '#dc2626',
  'OTHER': '#6b7280'
}

// 计算属性
const annotatedCount = computed(() => 
  annotationList.value.filter(item => item.is_annotated)?.length || 0
)

const unannotatedCount = computed(() => 
  annotationList.value.filter(item => !item.is_annotated)?.length || 0
)

// 按句子渲染文本
const renderedSentences = computed(() => {
  if (!fullText.value || !sentences.value || sentences.value.length === 0) {
    return []
  }

  return sentences.value.map(sentence => {
    const sentenceStart = sentence.start
    const sentenceEnd = sentence.end
    
    const sentenceEntities = entities.value
      .filter(entity => entity.start >= sentenceStart && entity.end <= sentenceEnd)
      .sort((a, b) => a.start - b.start)
    
    const parts = []
    let lastIndex = sentenceStart
    
    sentenceEntities.forEach(entity => {
      if (entity.start > lastIndex) {
        parts.push({
          text: fullText.value.slice(lastIndex, entity.start),
          isEntity: false,
          start: lastIndex,
          end: entity.start
        })
      }
      
      parts.push({
        text: entity.text || entity.mention || fullText.value.slice(entity.start, entity.end),
        isEntity: true,
        type: entity.type,
        id: entity.id,
        start: entity.start,
        end: entity.end
      })
      
      lastIndex = entity.end
    })
    
    if (lastIndex < sentenceEnd) {
      parts.push({
        text: fullText.value.slice(lastIndex, sentenceEnd),
        isEntity: false,
        start: lastIndex,
        end: sentenceEnd
      })
    }
    
    if (parts.length === 0) {
      parts.push({
        text: sentence.text || fullText.value.slice(sentenceStart, sentenceEnd),
        isEntity: false,
        start: sentenceStart,
        end: sentenceEnd
      })
    }
    
    return {
      id: sentence.id,
      start: sentenceStart,
      end: sentenceEnd,
      parts: parts
    }
  })
})

// 方法
const loadAnnotationList = async () => {
  try {
    const res = await Literature.getAnnotationList()
    if (res.data && res.data.data) {
      annotationList.value = res.data.data
    }
  } catch (error) {
    console.error('加载标注列表失败:', error)
    ElMessage.error('加载标注列表失败')
  }
}

const loadLiteratureDetail = async (literatureId) => {
  try {
    const res = await Literature.getAnnotationDetail(literatureId)
    
    if (res.data && res.data.data) {
      const data = res.data.data
      
      currentLiteratureId.value = data.literature_id
      currentIsAnnotated.value = data.is_annotated
      fullText.value = data.full_text || ''
      sentences.value = data.sentences || []
      
      // ============ 关键修改：加载时自动修复实体位置 ============
      if (data.annotation_data && data.annotation_data.entities) {
        entities.value = data.annotation_data.entities.map(entity => {
          const entityText = entity.text || entity.mention
          const { start, end, matched } = findBestTextPosition(
            fullText.value,
            entityText,
            entity.start,
            entity.end
          )
          
          if (!matched) {
            console.warn(`实体 ${entity.id} 位置可能不准确: "${entityText}"`)
          }
          
          return {
            ...entity,
            start,
            end,
            text: entityText,
            mention: entityText
          }
        })
      } else {
        entities.value = []
      }
      
      if (data.annotation_data && data.annotation_data.relations) {
        relations.value = data.annotation_data.relations.map(rel => {
          const sourceEntity = entities.value.find(e => e.id === rel.source_entity)
          const targetEntity = entities.value.find(e => e.id === rel.target_entity)
          
          return {
            id: rel.id,
            source_entity: rel.source_entity,
            target_entity: rel.target_entity,
            source_text: sourceEntity?.text || sourceEntity?.mention || '',
            target_text: targetEntity?.text || targetEntity?.mention || '',
            source_type: sourceEntity?.type || '',
            target_type: targetEntity?.type || '',
            relation_type: rel.relation_type || 'ASSOCIATION',
            evidence_sentence_ids: rel.evidence_sentence_ids || [],
            cross_sentence: rel.cross_sentence || false,
            confidence: rel.confidence || 'medium'
          }
        })
      } else {
        relations.value = []
      }
      
      ElMessage.success('文献加载成功')
    }
  } catch (error) {
    console.error('加载文献详情失败:', error)
    ElMessage.error('加载文献详情失败')
  }
}

const onLiteratureSelect = () => {
  if (selectedLiteratureId.value) {
    loadLiteratureDetail(selectedLiteratureId.value)
    searchLiteratureId.value = ''
  }
}

const onSearchLiterature = () => {
  if (searchLiteratureId.value) {
    loadLiteratureDetail(parseInt(searchLiteratureId.value))
    selectedLiteratureId.value = searchLiteratureId.value
  }
}

const getNextEntityId = () => {
  const maxId = entities.value.reduce((max, e) => {
    const num = parseInt(e.id.replace('E', ''))
    return num > max ? num : max
  }, 0)
  return `E${maxId + 1}`
}

const handleTextSelection = () => {
  const selection = window.getSelection()
  const selected = selection.toString().trim()
  
  if (!selected || !textContent.value) return
  
  const range = selection.getRangeAt(0)
  const startContainer = range.startContainer
  
  let startElement = startContainer.nodeType === Node.TEXT_NODE 
    ? startContainer.parentElement 
    : startContainer
  
  while (startElement && !startElement.hasAttribute('data-start') && startElement !== textContent.value) {
    startElement = startElement.parentElement
  }
  
  if (startElement && startElement.hasAttribute('data-start')) {
    const partStart = parseInt(startElement.getAttribute('data-start'))
    let textOffset = 0
    
    if (startContainer.nodeType === Node.TEXT_NODE) {
      textOffset = range.startOffset
    }
    
    const start = partStart + textOffset
    const end = start + selected.length
    
    selectionRange.value = { start, end }
    selectedText.value = selected
  }
}

const addEntity = () => {
  if (selectedText.value && selectionRange.value) {
    const newEntity = {
      id: getNextEntityId(),
      text: selectedText.value,
      type: entityLabel.value,
      start: selectionRange.value.start,
      end: selectionRange.value.end
    }
    
    entities.value.push(newEntity)
    selectedText.value = ''
    selectionRange.value = null
    window.getSelection().removeAllRanges()
    
    ElMessage.success(`已添加实体: ${newEntity.text}`)
  }
}

const deleteEntity = (id) => {
  entities.value = entities.value.filter(e => e.id !== id)
  relations.value = relations.value.filter(r => 
    r.source_entity !== id && r.target_entity !== id
  )
  ElMessage.success('实体已删除')
}

const getEntityStyle = (type) => {
  const color = entityTypeColors[type] || entityTypeColors.OTHER
  return {
    backgroundColor: `${color}20`,
    borderBottom: `2px solid ${color}`,
    padding: '2px 4px',
    margin: '0 1px',
    borderRadius: '3px',
    cursor: 'pointer'
  }
}

const addRelation = () => {
  if (currentRelation.value.source_entity && currentRelation.value.target_entity && currentRelation.value.relation_type) {
    const sourceEntity = entities.value.find(e => e.id === currentRelation.value.source_entity)
    const targetEntity = entities.value.find(e => e.id === currentRelation.value.target_entity)
    
    let evidenceSentenceIds = []
    if (currentRelation.value.evidence_sentence_ids_input) {
      evidenceSentenceIds = currentRelation.value.evidence_sentence_ids_input
        .split(',')
        .map(id => id.trim())
        .filter(id => id !== '')
        .map(id => {
          const numId = parseInt(id)
          return isNaN(numId) ? id : numId
        })
    }
    
    const newRelation = {
      id: editingRelationIndex.value !== null ? relations.value[editingRelationIndex.value].id : `R${relations.value?.length + 1}`,
      source_entity: currentRelation.value.source_entity,
      target_entity: currentRelation.value.target_entity,
      source_text: sourceEntity?.text || sourceEntity?.mention || '',
      target_text: targetEntity?.text || targetEntity?.mention || '',
      source_type: sourceEntity?.type || '',
      target_type: targetEntity?.type || '',
      relation_type: currentRelation.value.relation_type,
      evidence_sentence_ids: evidenceSentenceIds,
      cross_sentence: evidenceSentenceIds.length > 1 || false,
      confidence: 'medium'
    }

    if (editingRelationIndex.value !== null) {
      relations.value[editingRelationIndex.value] = newRelation
      editingRelationIndex.value = null
      ElMessage.success('关系已更新')
    } else {
      relations.value.push(newRelation)
      ElMessage.success('关系已添加')
    }
    
    currentRelation.value = { 
      source_entity: '', 
      target_entity: '', 
      relation_type: 'ASSOCIATION',
      evidence_sentence_ids_input: ''
    }
  }
}

const editRelation = (index) => {
  const rel = relations.value[index]
  currentRelation.value = { 
    ...rel,
    evidence_sentence_ids_input: rel.evidence_sentence_ids && rel.evidence_sentence_ids.length > 0
      ? rel.evidence_sentence_ids.join(', ')
      : ''
  }
  editingRelationIndex.value = index
}

const deleteRelation = (index) => {
  relations.value = relations.value.filter((_, i) => i !== index)
  ElMessage.success('关系已删除')
}

const cancelEdit = () => {
  currentRelation.value = { 
    source_entity: '', 
    target_entity: '', 
    relation_type: 'ASSOCIATION',
    evidence_sentence_ids_input: ''
  }
  editingRelationIndex.value = null
}
const saveAnnotation = async () => {
  if (!currentLiteratureId.value) {
    ElMessage.warning('请先选择文献')
    return
  }

  try {
    isSaving.value = true
    
    // 🔥 调试：打印 full_text 构造方式
    console.log('=== 调试信息 ===')
    console.log('fullText 长度:', fullText.value.length)
    console.log('fullText 前100字符:', fullText.value.substring(0, 100))
    
    // 保存前修复所有实体的位置
    const fixedEntities = entities.value.map(entity => {
      const { start, end, matched } = findBestTextPosition(
        fullText.value,
        entity.text || entity.mention,
        entity.start,
        entity.end
      )
      
      // 🔥 调试：打印每个实体的信息
      console.log(`实体 ${entity.id}:`)
      console.log(`  文本: "${entity.text}"`)
      console.log(`  原位置: ${entity.start}-${entity.end}`)
      console.log(`  新位置: ${start}-${end}`)
      console.log(`  匹配: ${matched}`)
      console.log(`  实际文本: "${fullText.value.slice(start, end)}"`)
      
      if (!matched) {
        console.warn(`⚠️ 实体 ${entity.id} 位置修复失败`)
      }
      
      return {
        id: entity.id,
        start,
        end,
        text: entity.text || entity.mention,
        mention: entity.mention || entity.text,
        type: entity.type,
        sentence_id: entity.sentence_id
      }
    })
    
    const annotationData = {
      entities: fixedEntities,
      relations: relations.value.map(rel => ({
        id: rel.id,
        source_entity: rel.source_entity,
        target_entity: rel.target_entity,
        relation_type: rel.relation_type,
        evidence_sentence_ids: rel.evidence_sentence_ids || [],
        cross_sentence: rel.cross_sentence !== undefined ? rel.cross_sentence : (rel.evidence_sentence_ids && rel.evidence_sentence_ids.length > 1),
        confidence: rel.confidence || 'medium'
      }))
    }
    
    console.log('发送的数据:', JSON.stringify(annotationData, null, 2))
    
    await Literature.saveAnnotation(currentLiteratureId.value, annotationData)
    
    ElMessage.success('标注保存成功')
    currentIsAnnotated.value = true
    entities.value = fixedEntities
    await loadAnnotationList()
    
  } catch (error) {
    console.error('保存标注失败:', error)
    console.error('错误详情:', error.response?.data)
    ElMessage.error('保存标注失败: ' + (error.response?.data?.message || error.message))
  } finally {
    isSaving.value = false
  }
}

const downloadAnnotations = async () => {
  try {
    isDownloading.value = true
    
    const response = await Literature.downloadAnnotations()
    
    const blob = new Blob([response.data], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `literature_annotations_${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('下载成功')
    
  } catch (error) {
    console.error('下载失败:', error)
    ElMessage.error('下载失败')
  } finally {
    isDownloading.value = false
  }
}

// 生命周期
onMounted(() => {
  loadAnnotationList()
})
</script>

<style scoped>
.label-tool {
  background-color: #f5fbff;
  min-height: 100vh;
}

.tool-header {
  background: linear-gradient(135deg, #1a91c1 0%, #a8e6cf 100%);
  padding: 40px 5%;
  position: relative;
}

.header-content {
  text-align: center;
}

.header-text h1 {
  color: white;
  font-size: 28px;
  margin-bottom: 10px;
  font-weight: 600;
}

.header-text p {
  color: rgba(255, 255, 255, 0.9);
  font-size: 16px;
}

.container {
  max-width: 1400px;
  margin: 30px auto;
  padding: 0 5%;
}

.config-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.config-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.config-item {
  display: flex;
  flex-direction: column;
}

.config-label {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.config-select,
.config-input {
  width: 100%;
  padding: 10px 14px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.config-select {
  cursor: pointer;
  background: white;
}

.config-select:focus,
.config-input:focus {
  outline: none;
  border-color: #1a91c1;
  box-shadow: 0 0 0 3px rgba(26, 145, 193, 0.1);
}

.search-box {
  display: flex;
  gap: 8px;
}

.search-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: #1a91c1;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.search-btn:hover {
  background: #1579a3;
  transform: translateY(-1px);
}

.action-buttons {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.primary-btn, .secondary-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.primary-btn {
  background: #10b981;
  color: white;
}

.primary-btn:hover:not(:disabled) {
  background: #059669;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  transform: translateY(-2px);
}

.primary-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
  opacity: 0.6;
}

.secondary-btn {
  background: #1a91c1;
  color: white;
}

.secondary-btn:hover:not(:disabled) {
  background: #1579a3;
  box-shadow: 0 4px 12px rgba(26, 145, 193, 0.3);
  transform: translateY(-2px);
}

.secondary-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
  opacity: 0.6;
}

.icon {
  flex-shrink: 0;
}

.stats-row {
  display: flex;
  gap: 24px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  align-items: center;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
}

.stat-annotated {
  color: #10b981;
}

.stat-unannotated {
  color: #f59e0b;
}

.current-lit {
  margin-left: auto;
  padding: 8px 16px;
  background: white;
  border-radius: 6px;
  border: 2px solid #e5e7eb;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  margin-left: 8px;
}

.status-badge.annotated {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.unannotated {
  background: #fef3c7;
  color: #92400e;
}

.main-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.content-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 20px;
}

.step-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #1a91c1, #a8e6cf);
  color: white;
  border-radius: 50%;
  font-size: 16px;
  font-weight: 600;
}

.text-display {
  padding: 16px;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  min-height: 200px;
  line-height: 1.8;
  user-select: text;
  margin-bottom: 16px;
  font-size: 14px;
}

.text-part {
  position: relative;
}

.placeholder-text {
  color: #9ca3af;
}

.entity-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: #1f2937;
  color: white;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 11px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
  margin-bottom: 6px;
  z-index: 10;
  line-height: 1.4;
}

.text-part:hover .entity-tooltip {
  opacity: 1;
}

.selection-panel {
  padding: 16px;
  background: #eff6ff;
  border: 2px solid #3b82f6;
  border-radius: 8px;
  margin-bottom: 16px;
}

.selection-info {
  font-size: 14px;
  color: #374151;
  margin-bottom: 12px;
}

.selection-range {
  color: #6b7280;
  font-size: 13px;
  margin-left: 8px;
}

.selection-actions {
  display: flex;
  gap: 12px;
}

.entity-select {
  flex: 1;
  padding: 10px 14px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.entity-select:focus {
  outline: none;
  border-color: #1a91c1;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #1a91c1;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.add-btn:hover {
  background: #1579a3;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(26, 145, 193, 0.3);
}

.entity-list-section, .relation-list-section {
  margin-top: 20px;
}

.list-title {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
}

.entity-list, .relation-list {
  max-height: 280px;
  overflow-y: auto;
}

.entity-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 8px;
  border: 2px solid;
  margin-bottom: 8px;
  transition: all 0.3s ease;
}

.entity-bg-cell { background: #dbeafe; border-color: #3b82f6; }
.entity-bg-disease { background: #fee2e2; border-color: #ef4444; }
.entity-bg-protein { background: #dcfce7; border-color: #22c55e; }
.entity-bg-gene { background: #e9d5ff; border-color: #a855f7; }
.entity-bg-drug { background: #fef3c7; border-color: #eab308; }
.entity-bg-pathogen { background: #fed7aa; border-color: #f97316; }
.entity-bg-cirrhosis { background: #fee2e2; border-color: #dc2626; }
.entity-bg-other { background: #e5e7eb; border-color: #6b7280; }

.entity-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.entity-info {
  flex: 1;
}

.entity-text {
  font-weight: 600;
  color: #1f2937;
}

.entity-meta {
  margin-left: 8px;
  font-size: 13px;
  color: #6b7280;
}

.entity-type-badge {
  display: inline-block;
  background: #f3f4f6;
  color: #374151;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 4px;
}

.entity-id-badge {
  display: inline-block;
  color: #6b7280;
  font-size: 11px;
  font-family: 'Courier New', monospace;
  margin-left: 4px;
}

.delete-btn, .edit-btn {
  padding: 6px;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s ease;
  color: #6b7280;
}

.delete-btn:hover {
  background: #fee2e2;
  color: #ef4444;
}

.edit-btn:hover {
  background: #dbeafe;
  color: #3b82f6;
}

.relation-form {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
}

.form-select, .form-input {
  width: 100%;
  padding: 10px 14px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.form-select {
  background: white;
  cursor: pointer;
}

.form-select:focus, .form-input:focus {
  outline: none;
  border-color: #1a91c1;
  box-shadow: 0 0 0 3px rgba(26, 145, 193, 0.1);
}

.form-hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
}

.form-actions {
  display: flex;
  gap: 12px;
}

.save-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.save-btn:hover:not(:disabled) {
  background: #059669;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.save-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

.cancel-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: #6b7280;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background: #4b5563;
}

.relation-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16px;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 8px;
  transition: all 0.3s ease;
}

.relation-item:hover {
  border-color: #1a91c1;
  box-shadow: 0 2px 8px rgba(26, 145, 193, 0.1);
}

.relation-content {
  flex: 1;
}

.relation-entities {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.source-entity {
  font-weight: 600;
  color: #3b82f6;
}

.target-entity {
  font-weight: 600;
  color: #22c55e;
}

.entity-id {
  font-size: 12px;
  color: #6b7280;
}

.entity-type-tag {
  display: inline-block;
  background: #eff6ff;
  color: #1e40af;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  margin: 0 4px;
}

.arrow {
  color: #9ca3af;
  font-weight: 600;
}

.relation-details {
  font-size: 13px;
  color: #374151;
  line-height: 1.6;
}

.sentence-ids-list {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-left: 8px;
}

.sentence-id-tag {
  display: inline-block;
  background: #fef3c7;
  color: #92400e;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
}

.relation-actions {
  display: flex;
  gap: 6px;
  margin-left: 12px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.empty-icon {
  color: #d1d5db;
  margin-bottom: 20px;
}

.empty-text {
  font-size: 16px;
  color: #6b7280;
}

.sentence-wrapper {
  display: inline-block;
  margin-right: 8px;
  margin-bottom: 4px;
}

.sentence-id {
  display: inline-block;
  background: #e5e7eb;
  color: #374151;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  margin-right: 6px;
  vertical-align: top;
  font-family: 'Courier New', monospace;
}

@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 1fr;
  }
  
  .config-row {
    grid-template-columns: 1fr;
  }
}

.entity-list::-webkit-scrollbar,
.relation-list::-webkit-scrollbar {
  width: 6px;
}

.entity-list::-webkit-scrollbar-track,
.relation-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.entity-list::-webkit-scrollbar-thumb,
.relation-list::-webkit-scrollbar-thumb {
  background: #1a91c1;
  border-radius: 3px;
}
</style>
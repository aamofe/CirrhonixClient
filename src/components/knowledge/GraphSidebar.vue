<template>
  <div class="graph-sidebar">

    <!-- ══ AI 问答（直接嵌入）══ -->
    <div class="sidebar-card chat-card">
      <AiAssistant :embedded="true" ref="assistant" />
    </div>

    <!-- ══ 最近搜索 ══ -->
    <div class="sidebar-card recent-card">
      <h3>最近搜索</h3>
      <div v-if="recentSearches.length === 0" class="empty-state">暂无搜索记录</div>
      <div v-else class="recent-list">
        <div
          v-for="(s, i) in recentSearches"
          :key="i"
          class="recent-item"
          @click="fillQuestion(s.question)"
        >
          <span class="recent-text">{{ s.question }}</span>
          <span class="recent-time">{{ s.time }}</span>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import AiAssistant from '@/components/ai/AiAssistant.vue'

const RECENT_KEY = 'ragRecentSearches'

export default {
  name: 'GraphSidebar',
  components: { AiAssistant },
  emits: ['focus-node'],

  setup() {
    const assistant      = ref(null)   // ref 到 AiAssistant 实例
    const recentSearches = ref([])

    /** 点击最近搜索 → 填入 AiAssistant 输入框 */
    function fillQuestion(question) {
      assistant.value?.fill(question)
      _saveRecent(question)
    }

    function _saveRecent(question) {
      const now  = new Date()
      const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
      const list = recentSearches.value
      const idx  = list.findIndex(s => s.question === question)
      if (idx !== -1) list.splice(idx, 1)   // 去重，移到最前
      list.unshift({ question, time })
      if (list.length > 8) recentSearches.value = list.slice(0, 8)
      try { sessionStorage.setItem(RECENT_KEY, JSON.stringify(recentSearches.value)) }
      catch (_) {}
    }

    onMounted(() => {
      try {
        const raw = sessionStorage.getItem(RECENT_KEY)
        if (raw) recentSearches.value = JSON.parse(raw)
      } catch (_) {}
    })

    return { assistant, recentSearches, fillQuestion }
  },
}
</script>

<style scoped>
.graph-sidebar {
  width: 300px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 100%;        /* 必须有明确高度，chat-card 才能 flex:1 撑满 */
}

/* ── 聊天卡片：占满剩余空间 ── */
.chat-card {
  flex: 1;
  min-height: 0;       /* flex 子项若没有 min-height:0，overflow 会失效 */
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,.06);
  overflow: hidden;
  background: #fff;
}

/* ── 最近搜索卡片：固定高度，不占弹性空间 ── */
.recent-card {
  flex-shrink: 0;
  padding: 14px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,.06);
}

.recent-card h3 {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.recent-list { display: flex; flex-direction: column; gap: 6px; }

.recent-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 7px 10px;
  background: #f8f9fa;
  border-radius: 6px;
  cursor: pointer;
  transition: background .15s;
}
.recent-item:hover { background: #e9ecef; }

.recent-text {
  flex: 1;
  font-size: 12px;
  color: #495057;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 8px;
}
.recent-time { font-size: 11px; color: #aaa; white-space: nowrap; }

.empty-state {
  text-align: center;
  color: #aaa;
  font-size: 13px;
  padding: 10px 0;
}
</style>
<template>
  <aside :class="['side-nav', variant]">
    <nav>
      <div
        v-for="item in items"
        :key="item.id"
        :class="['nav-item', { active: activeSection === item.id }]"
        @click="$emit('change', item.id)"
      >
        <span class="nav-icon">
          <el-icon>
            <component :is="item.icon" />
          </el-icon>
        </span>
        <span>{{ item.label }}</span>
      </div>
    </nav>
  </aside>
</template>

<script>
export default {
  name: 'SideNav',
  props: {
    items: { type: Array, required: true },
    activeSection: { type: String, required: true },
    variant: {
      type: String,
      default: 'embedded',
      validator: (v) => ['embedded', 'standalone'].includes(v),
    },
  },
  emits: ['change'],
}
</script>

<style scoped>
.side-nav {
  width: 250px;
  flex-shrink: 0;
  background: var(--color-bg-card);
  padding: 1.5rem 0;
}

.side-nav.embedded {
  border-right: 1px solid var(--color-border);
}

.side-nav.standalone {
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  height: fit-content;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  cursor: pointer;
  color: #555;
  transition: background-color 0.2s, color 0.2s;
}

.nav-item:hover {
  background-color: rgba(168, 230, 207, 0.1);
  color: var(--color-primary);
}

.nav-item.active {
  background-color: rgba(168, 230, 207, 0.2);
  color: var(--color-primary);
  border-left: 3px solid var(--color-primary);
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

@media (max-width: 768px) {
  .side-nav {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--color-border);
    padding: 0;
  }

  .nav-item {
    padding: 0.75rem 1.25rem;
  }
}
</style>

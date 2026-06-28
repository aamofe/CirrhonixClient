<template>
  <section :class="['page-hero', { compact, 'has-actions': $slots.actions }]">
    <div v-if="$slots.actions" class="hero-top">
      <div class="hero-text">
        <h1>{{ title }}</h1>
        <p v-if="subtitle">{{ subtitle }}</p>
      </div>
      <div class="hero-actions">
        <slot name="actions" />
      </div>
    </div>
    <template v-else>
      <h1>{{ title }}</h1>
      <p v-if="subtitle">{{ subtitle }}</p>
    </template>
    <slot />
  </section>
</template>

<script>
export default {
  name: 'PageHero',
  props: {
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    compact: { type: Boolean, default: false },
  },
}
</script>

<style scoped>
.page-hero {
  background: var(--gradient-primary);
  padding: 40px 5%;
  text-align: center;
}

.page-hero.compact {
  padding: 20px 5%;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}

.page-hero h1 {
  color: white;
  font-size: 28px;
  margin: 0 0 10px;
  font-weight: 600;
}

.page-hero p {
  color: rgba(255, 255, 255, 0.9);
  margin: 0 auto 20px;
  max-width: 700px;
}

.page-hero.compact p {
  margin-bottom: 0;
}

.hero-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.hero-text {
  flex: 1;
  text-align: center;
}

.hero-text h1,
.hero-text p {
  margin-left: auto;
  margin-right: auto;
}

.hero-actions {
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .hero-top {
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
}
</style>

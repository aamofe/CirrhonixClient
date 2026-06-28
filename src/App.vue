<template>
  <div id="app">
    <HeaderComponent v-if="$route.path !== '/login'" />
    <router-view />
  </div>
</template>

<script>
import HeaderComponent from '@/components/navigation/HeaderComponent.vue'

export default {
  components: {
    HeaderComponent,
  },
}
</script>

<style lang="scss">
@import '@/styles/variables.scss';
@import '@/styles/common.scss';

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: var(--color-text);
}

nav {
  padding: 0;

  a {
    font-weight: bold;
    color: var(--color-text);

    &.router-link-exact-active {
      color: var(--color-primary);
    }
  }
}
</style>

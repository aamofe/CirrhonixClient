<template>
  <div id="app">
    <HeaderComponent v-if="$route.path !== '/login'" />
    <router-view />
  </div>
</template>

<script>
import HeaderComponent from "@/components/layout/HeaderComponent.vue"

export default {
  components: {
    HeaderComponent,
  },
}
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

nav {
  padding: 0;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>

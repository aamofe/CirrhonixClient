<template>
  <md-preview :modelValue="value" :theme="theme" codeTheme="atom-one-dark" previewTheme="github"
    style="min-height: 0" />
</template>

<script>
import { MdPreview } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'

export default {
  name: 'MarkdownDisplayer',
  components: {
    MdPreview
  },
  props: {
    content: {
      required: true
    }
  },
  data() {
    return {
      value: this.content,
      theme: 'light' // 可以使用 'dark' 切换为暗色主题
    }
  },
  watch: {
    content: {
      handler(newVal) {
        this.value = newVal
      },
      immediate: true
    }
  }
}
</script>
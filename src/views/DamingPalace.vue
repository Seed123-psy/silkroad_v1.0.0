<template>
  <div class="silkroad-page">
    <div class="content">
      <h1>占位页面</h1>
      <p class="subtitle"></p>
    </div>
  </div>
</template>

<script setup lang="ts">
// 简洁占位页，仅含标题与说明，保持路由兼容。
</script>

<style scoped>
.silkroad-page {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #0a1220, #07101a);
  color: #fff;
  font-family: "Noto Serif SC", serif;
}
.content { text-align: center; }
h1 { font-size: 3rem; margin: 0 0 8px 0; color: #ffd66b; }
.subtitle { color: rgba(255,255,255,0.7); }
</style>


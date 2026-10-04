<template>
  <div class="api-docs-view">
    <div class="header">
      <h2>API Documentation</h2>
      <p class="subtitle">Interactive REST API documentation provided by Swagger UI</p>
    </div>
    
    <div class="iframe-container">
      <iframe src="/swagger-ui/index.html" frameborder="0" class="swagger-iframe"></iframe>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.api-docs-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

h2 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #18181b;
  margin: 0;
}

.subtitle {
  color: #71717a;
  font-size: 0.95rem;
  margin: 0;
}

.iframe-container {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  overflow: hidden;
  height: 80vh;
  width: 100%;
  border: 1px solid #e4e4e7;
}

.swagger-iframe {
  width: 100%;
  height: 100%;
  display: block;
}
</style>

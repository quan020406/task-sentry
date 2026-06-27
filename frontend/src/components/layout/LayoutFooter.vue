<script setup lang="ts">
/**
 * LayoutFooter - 新野兽派底部
 *
 * 黑色背景，顶部 3px 金色粗边框
 * 三段式布局：品牌 slogan / 快速链接 / 版权
 */
</script>

<template>
  <footer class="layout-footer">
    <div class="layout-footer__inner">
      <!-- 左侧：品牌 + slogan -->
      <div class="layout-footer__brand">
        <span class="layout-footer__name">先别开工</span>
        <span class="layout-footer__slogan">开工前多问一句，省下返工一天</span>
      </div>

      <!-- 中间：快速链接 -->
      <nav class="layout-footer__links" aria-label="快速链接">
        <span class="layout-footer__link-item">使用说明</span>
        <span class="layout-footer__link-sep">/</span>
        <span class="layout-footer__link-item">常见问题</span>
        <span class="layout-footer__link-sep">/</span>
        <span class="layout-footer__link-item">关于我们</span>
      </nav>

      <!-- 右侧：版权信息 -->
      <div class="layout-footer__copy">
        <span>© 2026 先别开工</span>
        <span class="layout-footer__copy-divider">·</span>
        <span>AI 任务需求防返工扫描仪</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.layout-footer {
  background: var(--color-black);
  border-top: var(--border-width-thick) solid var(--color-gold);
}

.layout-footer__inner {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: var(--space-md) var(--container-px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-lg);
}

/* ===== 左侧：品牌 + slogan ===== */
.layout-footer__brand {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.layout-footer__name {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: var(--fw-bold);
  color: var(--color-gold);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
}

.layout-footer__slogan {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--color-gray-1);
  letter-spacing: var(--ls-label);
}

/* ===== 中间：快速链接 ===== */
.layout-footer__links {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  flex-wrap: wrap;
  justify-content: center;
}

.layout-footer__link-item {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--color-gray-1);
  letter-spacing: var(--ls-label);
  cursor: pointer;
  transition: color var(--transition-fast);
}

.layout-footer__link-item:hover {
  color: var(--color-gold);
}

.layout-footer__link-sep {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--color-gray-1);
  opacity: 0.4;
}

/* ===== 右侧：版权 ===== */
.layout-footer__copy {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--color-gray-1);
  letter-spacing: var(--ls-label);
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.layout-footer__copy-divider {
  opacity: 0.4;
}
</style>

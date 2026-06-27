<script setup lang="ts">
/**
 * BrTag - 新野兽派标签组件
 *
 * 变体：
 * - default：黑底白字
 * - high：黑底红字（高风险）
 * - mid：黑底黄字（中风险）
 * - low：黑底绿字（低风险）
 * - gold：金底黑字
 */
type TagVariant = 'default' | 'high' | 'mid' | 'low' | 'gold'

interface Props {
  variant?: TagVariant
}

withDefaults(defineProps<Props>(), {
  variant: 'default',
})
</script>

<template>
  <span class="br-tag" :class="`br-tag--${variant}`">
    <slot />
  </span>
</template>

<style scoped>
.br-tag {
  display: inline-flex;
  align-items: center;
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  font-weight: var(--fw-bold);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
  padding: 3px 8px;
  border: var(--border-width-thin) solid var(--color-black);
  white-space: nowrap;
  line-height: 1.4;
}

/* default：黑底白字 */
.br-tag--default {
  background: var(--color-black);
  color: var(--color-white);
}

/* high：黑底红字 */
.br-tag--high {
  background: var(--color-black);
  color: var(--color-risk-high);
}

/* mid：黑底黄字 */
.br-tag--mid {
  background: var(--color-black);
  color: var(--color-risk-mid);
}

/* low：黑底绿字 */
.br-tag--low {
  background: var(--color-black);
  color: var(--color-risk-low);
}

/* gold：金底黑字 */
.br-tag--gold {
  background: var(--color-gold);
  color: var(--color-black);
}
</style>

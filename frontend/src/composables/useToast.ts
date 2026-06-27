import { ref } from 'vue'

/** Toast 消息类型 */
export type ToastType = 'success' | 'error' | 'info' | 'warning'

/** Toast 消息项 */
export interface ToastItem {
  id: number
  type: ToastType
  message: string
}

/** 全局 toast 列表（响应式） */
const toasts = ref<ToastItem[]>([])

// 自增 ID
let toastId = 0

/**
 * 显示 toast 消息
 * @param message 消息内容
 * @param type 消息类型，默认 info
 * @param duration 显示时长（ms），默认 3000，传 0 则不自动关闭
 */
function showToast(message: string, type: ToastType = 'info', duration = 3000): void {
  const id = ++toastId
  toasts.value.push({ id, type, message })
  if (duration > 0) {
    setTimeout(() => removeToast(id), duration)
  }
}

/** 移除指定 toast */
function removeToast(id: number): void {
  const idx = toasts.value.findIndex((t) => t.id === id)
  if (idx > -1) {
    toasts.value.splice(idx, 1)
  }
}

/** 快捷方法 */
const toast = {
  success: (msg: string, duration?: number) => showToast(msg, 'success', duration),
  error: (msg: string, duration?: number) => showToast(msg, 'error', duration),
  info: (msg: string, duration?: number) => showToast(msg, 'info', duration),
  warning: (msg: string, duration?: number) => showToast(msg, 'warning', duration),
  remove: removeToast,
}

/**
 * useToast composable
 * 在任意组件中获取 toast 状态和操作方法
 */
export function useToast() {
  return {
    toasts,
    showToast,
    removeToast,
    toast,
  }
}

// ============================================================
// useFullscreen — 沉浸式全屏 API 封装
// Android Chrome / WebView 需要在用户手势回调中调用
// ============================================================

/** 请求进入全屏（需用户手势触发，可重复调用） */
export function requestFullscreen(): void {
  const el = document.documentElement
  // 标准 API（Android Chrome 用 navigationUI: 'hide' 隐藏导航栏）
  if (el.requestFullscreen) {
    el.requestFullscreen({ navigationUI: 'hide' } as any).catch(() => {
      // 部分浏览器不支持 navigationUI 选项，回退到无参数调用
      el.requestFullscreen().catch(() => {})
    })
  }
  // WebKit 旧版
  else if ((el as any).webkitRequestFullscreen) {
    ;(el as any).webkitRequestFullscreen()
  }
  // 三星 / 旧 Android
  else if ((el as any).webkitRequestFullScreen) {
    ;(el as any).webkitRequestFullScreen()
  }
}

/** 检查是否已处于全屏状态 */
export function isFullscreen(): boolean {
  return !!(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).webkitFullScreenElement
  )
}

/** 退出全屏 */
export function exitFullscreen(): void {
  if (document.exitFullscreen) {
    document.exitFullscreen().catch(() => {})
  } else if ((document as any).webkitExitFullscreen) {
    ;(document as any).webkitExitFullscreen()
  }
}

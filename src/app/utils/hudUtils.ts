/**
 * Globally triggers a premium, non-blocking mini glassmorphic HUD notification pill at the top of the screen.
 * Reserves standard corner toasts only for critical errors or major state alerts.
 */
export function showMiniHUD(message: string, type: 'success' | 'info' | 'error' = 'success') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('elva-show-hud', {
        detail: { message, type }
      })
    );
  }
}

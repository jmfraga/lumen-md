import type { LumenApi } from '../shared/ipc'

declare global {
  interface Window {
    lumen: LumenApi
  }
}

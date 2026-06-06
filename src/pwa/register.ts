import { registerSW as registerServiceWorker } from 'virtual:pwa-register'

export const registerSW = () => {
  registerServiceWorker({
    immediate: true,
  })
}

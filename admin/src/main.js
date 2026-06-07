import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index.js'
import { useAuthStore } from './stores/auth.js'

const app = createApp(App)
app.use(router)

// Auth state ni tiklash
const auth = useAuthStore()
auth.init()

app.mount('#app')

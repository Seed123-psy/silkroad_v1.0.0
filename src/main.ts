import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import pinia from './stores'
import './styles/global.scss'
import 'mapbox-gl/dist/mapbox-gl.css'

// Dev helper: swallow Mapbox telemetry POSTs to avoid noisy console errors
if (import.meta.env.DEV && typeof window !== 'undefined') {
	const origFetch = window.fetch.bind(window)
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	window.fetch = (input: RequestInfo, init?: RequestInit) => {
		try {
			const url = typeof input === 'string' ? input : (input as Request).url
			if (url && url.includes('events.mapbox.com')) {
				return Promise.resolve(new Response(null, { status: 204 }))
			}
		} catch (e) {
			// ignore and fall through to real fetch
		}
		return origFetch(input, init)
	}
}

const app = createApp(App)

app.use(router)
app.use(pinia)

app.mount('#app')

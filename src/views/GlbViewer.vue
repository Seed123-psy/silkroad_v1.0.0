<template>
  <div class="glb-viewer-shell">
    <div class="viewer-toolbar">
      <h2>{{ title }}</h2>
    </div>
    <div ref="container" class="viewer-container" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import * as THREE from 'three'
// @ts-ignore
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { useI18n } from '@/composables/useI18n'

const container = ref<HTMLElement | null>(null)
let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let controls: OrbitControls | null = null
let animId: number | null = null

const { t } = useI18n()
const title = computed(() => t.value.sidebar.glbViewer)

const GLB_PATH = '/glb/蒙古包_实体反光有纹理.glb'

function fitCameraToObject(obj: THREE.Object3D, camera: THREE.PerspectiveCamera, controls?: OrbitControls) {
  const box = new THREE.Box3().setFromObject(obj)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())

  const maxSize = Math.max(size.x, size.y, size.z)
  const fov = camera.fov * (Math.PI / 180)
  let distance = Math.abs(maxSize / 2 / Math.tan(fov / 2))

  // Add some margin
  distance *= 1.5

  const dir = new THREE.Vector3(0, 0, 1)
  camera.position.copy(center).add(dir.multiplyScalar(distance))
  camera.near = distance / 100
  camera.far = distance * 100
  camera.updateProjectionMatrix()

  if (controls) {
    controls.target.copy(center)
    controls.update()
  }
}

onMounted(() => {
  if (!container.value) return

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x05060a)

  const width = container.value.clientWidth
  const height = container.value.clientHeight

  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
  camera.position.set(0, 1.2, 3)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(width, height)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  container.value.appendChild(renderer.domElement)

  // lights
  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6)
  hemi.position.set(0, 20, 0)
  scene.add(hemi)

  const dirLight = new THREE.DirectionalLight(0xffffff, 1)
  dirLight.position.set(5, 10, 7.5)
  scene.add(dirLight)

  // controls
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.screenSpacePanning = false
  controls.minDistance = 0.2
  controls.maxDistance = 50

  // load model
  const loader = new GLTFLoader()
  loader.load(
    GLB_PATH,
    (gltf: any) => {
      const model = gltf.scene
      scene!.add(model)
      try {
        fitCameraToObject(model, camera!, controls!)
      } catch (e) {
        // ignore
      }
    },
    undefined,
    (err: any) => {
      // eslint-disable-next-line no-console
      console.error('GLB load error:', err)
    }
  )

  // resize handling
  const onWindowResize = () => {
    if (!container.value || !camera || !renderer) return
    const w = container.value.clientWidth
    const h = container.value.clientHeight
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  }

  window.addEventListener('resize', onWindowResize)

  // animation loop
  const animate = () => {
    animId = requestAnimationFrame(animate)
    if (controls) controls.update()
    if (renderer && scene && camera) renderer.render(scene, camera)
  }
  animate()

  onBeforeUnmount(() => {
    if (animId) cancelAnimationFrame(animId)
    window.removeEventListener('resize', onWindowResize)
    if (controls) controls.dispose()
    if (renderer) {
      renderer.dispose()
      if (renderer.domElement && renderer.domElement.parentElement)
        renderer.domElement.parentElement.removeChild(renderer.domElement)
    }
    // dispose scene children materials/geometry
    if (scene) {
      scene.traverse((child) => {
        const obj: any = child
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m: THREE.Material) => m.dispose())
          } else {
            obj.material.dispose()
          }
        }
      })
    }
  })
})
</script>

<style scoped lang="scss">
.glb-viewer-shell {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.viewer-toolbar {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid rgba(255,255,255,0.03);
}
.viewer-container {
  flex: 1;
  position: relative;
  width: 100%;
  height: calc(100% - 64px);
}
</style>

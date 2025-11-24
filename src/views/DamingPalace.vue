<template>
  <div class="daming-page">
    <div ref="containerRef" class="canvas-container"></div>
    
    <div class="ui-layer">
      <div class="header">
        <h1>大明宫 · 含元殿</h1>
        <p class="subtitle">千宫之宫 · 盛唐气象</p>
      </div>

      <div class="stats">
        <p>粒子数量: 300,000</p>
        <p>建筑组件: 三层大台 / 含元殿 / 翔鸾阁 / 栖凤阁 / 龙尾道(直道)</p>
      </div>
    </div>

    <div class="controls-container">
      <div class="controls">
        <button 
          v-for="(view, index) in views" 
          :key="index"
          class="view-btn"
          :class="{ active: currentView === index }"
          @click="switchView(index)"
        >
          {{ view.name }}
        </button>
      </div>
    </div>

    <button class="back-btn" @click="$router.push('/')">
      ← 返回首页
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import gsap from 'gsap'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// 配置
const PARTICLE_COUNT = 300000 // 提升到 30万以获得更细腻的表现
const PARTICLE_SIZE = 0.45 // 增大粒子尺寸以增强可见性

// 视图定义（添加类型）
interface View {
  name: string
  cameraPos: { x: number; y: number; z: number }
  target: { x: number; y: number; z: number }
}
const views: View[] = [
  { name: '全景鸟瞰', cameraPos: { x: 0, y: 60, z: 120 }, target: { x: 0, y: 0, z: 0 } },
  { name: '正立面', cameraPos: { x: 0, y: 10, z: 100 }, target: { x: 0, y: 10, z: 0 } },
  { name: '龙尾道', cameraPos: { x: 0, y: -10, z: 60 }, target: { x: 0, y: 10, z: 0 } },
  { name: '飞廊细节', cameraPos: { x: 40, y: 20, z: 40 }, target: { x: 30, y: 15, z: 0 } },
]

const currentView = ref(0)
const containerRef = ref<HTMLDivElement | null>(null)

// Three.js 变量
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let particles: THREE.Points
let geometry: THREE.BufferGeometry
let animationFrameId: number

// 粒子数据
const positions = new Float32Array(PARTICLE_COUNT * 3)
const colors = new Float32Array(PARTICLE_COUNT * 3)
const originalPositions = new Float32Array(PARTICLE_COUNT * 3) // 存储生成的建筑形态

function initScene() {
  if (!containerRef.value) return

  // 1. 场景
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x05080f)
  scene.fog = new THREE.FogExp2(0x05080f, 0.008)

  // 2. 相机
  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight
  camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000)

  // 初始视图防护（fallback 避免 views[0] 为 undefined）
  const initialView: View = views[0] ?? { name: 'default', cameraPos: { x: 0, y: 60, z: 120 }, target: { x: 0, y: 0, z: 0 } }
  camera.position.set(initialView.cameraPos.x, initialView.cameraPos.y, initialView.cameraPos.z)

  // 3. 渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  containerRef.value.appendChild(renderer.domElement)

  // 4. 控制器
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.maxDistance = 200
  controls.minDistance = 20
  controls.autoRotate = true
  controls.autoRotateSpeed = 0.5

  // 将 controls.target 显式设置为初始视图的 target 并立即更新
  controls.target.set(initialView.target.x, initialView.target.y, initialView.target.z)
  controls.update()

  // 5. 生成粒子
  generateDamingPalace()
  
  // 6. 创建粒子系统
  geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const texture = createParticleTexture()
  const material = new THREE.PointsMaterial({
    size: PARTICLE_SIZE,
    map: texture,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    opacity: 0.8
  })

  particles = new THREE.Points(geometry, material)
  scene.add(particles)

  // 7. 动画循环
  animate()

  // 8. 监听
  window.addEventListener('resize', handleResize)
}

function createParticleTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 32
  canvas.height = 32
  const ctx = canvas.getContext('2d')!
  const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.2, 'rgba(255,255,255,0.95)') // 核心更亮更大
  grad.addColorStop(0.4, 'rgba(255,245,220,0.8)') // 光晕更强
  grad.addColorStop(0.7, 'rgba(255,255,255,0.3)')
  grad.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 32, 32)
  return new THREE.CanvasTexture(canvas)
}

// 核心：生成大明宫含元殿粒子数据
function generateDamingPalace() {
  let idx = 0
  
  // 颜色定义
  const C_PLATFORM = { r: 0.95, g: 0.95, b: 0.98 } // 汉白玉
  const C_WALL = { r: 0.85, g: 0.25, b: 0.2 }     // 朱红
  const C_ROOF = { r: 1.0, g: 0.85, b: 0.2 }      // 金黄
  const C_FLOOR = { r: 0.35, g: 0.35, b: 0.4 }    // 地面
  const C_RAILING = { r: 0.9, g: 0.9, b: 0.9 }    // 栏杆

  // 辅助函数：添加粒子
  const addParticle = (x: number, y: number, z: number, color: {r: number, g: number, b: number}, noise = 0.15) => {
    if (idx >= PARTICLE_COUNT) return
    positions[idx * 3] = x + (Math.random() - 0.5) * noise
    positions[idx * 3 + 1] = y + (Math.random() - 0.5) * noise
    positions[idx * 3 + 2] = z + (Math.random() - 0.5) * noise
    
    colors[idx * 3] = color.r
    colors[idx * 3 + 1] = color.g
    colors[idx * 3 + 2] = color.b
    
    idx++
  }

  // 尺寸定义 (基于设计图扩大规模)
  const baseW = 140 // 基座总宽
  const baseD = 90  // 基座总深
  const baseY = -15 // 基座底部Y
  const levelH = 6  // 每层台基高度
  const levels = 3  // 层数

  const hallW = 76  // 主殿宽
  const hallD = 32  // 主殿深
  const hallH = 22  // 主殿高

  // --- 1. 三层大台 (Triple Terrace) ---
  for (let l = 0; l < levels; l++) {
    const scale = 1 - l * 0.12
    const w = baseW * scale
    const d = baseD * scale
    const yStart = baseY + l * levelH
    const yEnd = baseY + (l + 1) * levelH
    
    // 填充台基
    const count = 18000 // 增加密度
    for (let i = 0; i < count; i++) {
      if (idx >= PARTICLE_COUNT) break
      
      // 随机分布
      const px = (Math.random() - 0.5) * w
      const pz = (Math.random() - 0.5) * d
      
      // 剔除中央楼梯区域 (简单的矩形剔除)
      if (l < 2 && Math.abs(px) < 10 && pz > d * 0.1) {
         // 中央御道区域，留空或特殊处理
         continue
      }

      const py = yStart + Math.random() * levelH
      
      // 边缘检测
      const isEdge = Math.abs(px) > w * 0.49 || Math.abs(pz) > d * 0.49
      
      if (isEdge) {
        // 侧壁
        addParticle(px, py, pz, C_PLATFORM, 0.1)
      } else if (py > yEnd - 0.5) {
        // 顶面地板
        addParticle(px, yEnd, pz, C_FLOOR, 0.1)
        
        // 栏杆 (Railings) - 沿边缘一圈
        if (Math.abs(px) > w * 0.48 || Math.abs(pz) > d * 0.48) {
           if (Math.random() > 0.6) {
             addParticle(px, yEnd + 1, pz, C_RAILING, 0.05)
             addParticle(px, yEnd + 2, pz, C_RAILING, 0.05)
           }
        }
      }
    }
  }

  // --- 2. 中央御道 (Central Imperial Staircase) ---
  // 连接地面到第二层/第三层，宽阔笔直
  const stairW = 36 // 加宽，体现"中间宽宽的一个道"
  const stairZStart = baseD * 0.8 // 延伸更远
  const stairZEnd = -baseD * 0.1
  const stairYStart = baseY
  const stairYEnd = baseY + levels * levelH
  const steps = 80
  
  for (let s = 0; s < steps; s++) {
     const t = s / steps
     const z = stairZStart + (stairZEnd - stairZStart) * t
     const y = stairYStart + (stairYEnd - stairYStart) * t
     
     // 踏步
     for (let k = 0; k < 80; k++) { // 增加密度
        const x = (Math.random() - 0.5) * stairW
        addParticle(x, y, z, C_FLOOR, 0.1)
     }
     // 扶手
     if (s % 2 === 0) {
        addParticle(-stairW/2, y+1, z, C_RAILING)
        addParticle(stairW/2, y+1, z, C_RAILING)
     }
     // 中央御路石刻 (丹陛石)
     if (s % 3 === 0) {
        for(let k=0; k<5; k++) {
           addParticle((Math.random()-0.5)*6, y+0.2, z, C_PLATFORM, 0.05)
        }
     }
  }

  // --- 3. 龙尾道 (Dragon Tail Ways - Side Ramps) ---
  // 左右各一根窄窄的道，比较直
  const createRamp = (isLeft: boolean) => {
     const side = isLeft ? -1 : 1
     const rampW = 8 // 窄窄的道
     
     // 直线路径：从地面远端直达台基侧面
     const startZ = 100
     const endZ = 10
     const startY = baseY
     const endY = baseY + levels * levelH
     // 位于中央御道两侧，保持一定距离
     const startX = side * 55 
     const endX = side * 55 // 笔直平行
     
     const rampSteps = 100
     
     for(let i=0; i<rampSteps; i++) {
        const t = i / rampSteps
        const x = startX + (endX - startX) * t
        const y = startY + (endY - startY) * t
        const z = startZ + (endZ - startZ) * t
        
        // 铺设路面
        const density = 20
        for(let k=0; k<density; k++) {
           const offsetX = (Math.random() - 0.5) * rampW
           addParticle(x + offsetX, y, z, C_FLOOR, 0.1)
        }
        
        // 侧边栏杆
        if (i % 3 === 0) {
           addParticle(x - rampW/2, y + 1, z, C_RAILING, 0.05)
           addParticle(x + rampW/2, y + 1, z, C_RAILING, 0.05)
           
           // 支撑柱 (每隔一段)
           if (i % 8 === 0 && y > baseY + 2) {
              for(let h = baseY; h < y; h+=2) {
                 addParticle(x - rampW/2, h, z, C_PLATFORM, 0.1)
                 addParticle(x + rampW/2, h, z, C_PLATFORM, 0.1)
              }
           }
        }
        
        // 灯饰 (Lanterns)
        if (i % 12 === 0) {
           addParticle(x - rampW/2, y + 1.8, z, {r:1, g:0.9, b:0.5}, 0.1)
           addParticle(x + rampW/2, y + 1.8, z, {r:1, g:0.9, b:0.5}, 0.1)
        }
     }
  }
  
  createRamp(true)  // 左龙尾道
  createRamp(false) // 右龙尾道

  // --- 4. 含元殿主体 (Main Hall) ---
  const hallBaseY = baseY + levels * levelH
  
  // 柱网 (Columns)
  const colsX = 11
  const colsZ = 5
  for (let ix = 0; ix < colsX; ix++) {
    for (let iz = 0; iz < colsZ; iz++) {
      const px = (ix / (colsX-1) - 0.5) * hallW
      const pz = (iz / (colsZ-1) - 0.5) * hallD
      
      // 柱子
      for (let h = 0; h < hallH; h+=0.5) {
        addParticle(px, hallBaseY + h, pz, C_WALL, 0.15)
      }
      
      // 斗拱层 (DouGong)
      if (ix === 0 || ix === colsX-1 || iz === 0 || iz === colsZ-1) {
         for(let k=0; k<5; k++) {
            addParticle(px, hallBaseY + hallH + k*0.5, pz, C_WALL, 0.1)
            // 出跳
            addParticle(px + (px>0?1:-1)*k*0.3, hallBaseY + hallH + k*0.5, pz, C_WALL, 0.1)
         }
      }
    }
  }
  
  // 墙体与门窗 (Walls & Windows)
  for (let i = 0; i < 8000; i++) {
     const side = Math.floor(Math.random() * 4)
     let px, pz, py
     py = hallBaseY + Math.random() * hallH
     
     if (side === 0) { px = (Math.random()-0.5)*hallW; pz = hallD/2; }
     else if (side === 1) { px = (Math.random()-0.5)*hallW; pz = -hallD/2; }
     else if (side === 2) { px = hallW/2; pz = (Math.random()-0.5)*hallD; }
     else { px = -hallW/2; pz = (Math.random()-0.5)*hallD; }
     
     // 简单的直棂窗纹理
     if (Math.sin(px*3) * Math.sin(py*3) > 0) {
        addParticle(px, py, pz, C_WALL, 0.1)
     }
  }

  // 庑殿顶 (Hipper Roof) - 优化曲线
  const roofH = 18
  const roofW = hallW * 1.25
  const roofD = hallD * 1.3
  const roofY = hallBaseY + hallH + 2
  
  const roofParticles = 40000
  for (let i = 0; i < roofParticles; i++) {
    const u = Math.random()
    const v = Math.random()
    const x = (u - 0.5) * roofW
    const z = (v - 0.5) * roofD
    
    const nx = Math.abs(x) / (roofW/2)
    const nz = Math.abs(z) / (roofD/2)
    
    // 庑殿顶高度计算
    const ridgeLen = roofW * 0.4
    let h = 0
    if (Math.abs(x) < ridgeLen/2) {
      h = roofH * (1 - nz)
    } else {
      const dx = Math.abs(x) - ridgeLen/2
      const dist = Math.max(dx / ((roofW-ridgeLen)/2), nz)
      h = roofH * (1 - dist)
    }
    
    // 反宇向阳 (曲线优化)
    h = roofH * Math.pow(h/roofH, 0.75)
    
    // 飞檐翘角
    const cornerDist = Math.sqrt(nx*nx + nz*nz)
    const curve = Math.pow(Math.max(0, cornerDist - 0.6), 3) * 12
    
    // 瓦垄
    const wave = Math.sin(x * 4) * 0.2
    
    addParticle(x, roofY + h + curve + wave, z, C_ROOF, 0.1)
    
    // 脊兽与鸱吻
    if (h > roofH * 0.9 && Math.abs(x) > ridgeLen/2 - 1 && Math.abs(x) < ridgeLen/2 + 1) {
       // 鸱吻
       for(let k=0; k<10; k++) addParticle(x, roofY + h + k, z, C_ROOF, 0.2)
    }
  }

  // --- 5. 翔鸾阁 & 栖凤阁 (Side Pavilions) ---
  const pavDist = 85 // 更远
  const pavW = 18
  const pavH = 20
  
  const createPavilion = (offsetX: number) => {
    // 高台基
    for(let i=0; i<2000; i++) {
       addParticle(offsetX + (Math.random()-0.5)*pavW, baseY + Math.random()*(levels*levelH), 20 + (Math.random()-0.5)*pavW, C_PLATFORM)
    }
    // 楼阁
    const pavBaseY = baseY + levels*levelH
    for(let i=0; i<3000; i++) {
       const x = offsetX + (Math.random()-0.5)*pavW
       const z = 20 + (Math.random()-0.5)*pavW
       const y = pavBaseY + Math.random() * pavH
       addParticle(x, y, z, C_WALL)
    }
    // 攒尖顶
    for(let i=0; i<2000; i++) {
       const x = (Math.random()-0.5) * pavW * 1.3
       const z = (Math.random()-0.5) * pavW * 1.3
       const dist = Math.sqrt(x*x + z*z) / (pavW*0.65)
       const h = (1 - dist) * 8
       addParticle(offsetX + x, pavBaseY + pavH + h, 20 + z, C_ROOF)
    }
  }
  
  createPavilion(pavDist)
  createPavilion(-pavDist)

  // --- 6. 飞廊 (Flying Corridors) ---
  const createCorridor = (startX: number, endX: number) => {
     const steps = 200
     for(let i=0; i<steps; i++) {
        const t = i / steps
        const x = startX + (endX - startX) * t
        // 弧形路径
        const z = (1-t) * 0 + t * 20 
        const y = hallBaseY + 2 + Math.sin(t * Math.PI) * 4
        
        // 廊顶
        for(let k=0; k<30; k++) {
           addParticle(x, y + Math.random()*2, z + (Math.random()-0.5)*5, C_ROOF)
        }
        // 柱子
        if (i % 4 === 0) {
           for(let h=baseY+10; h<y; h+=1) {
              addParticle(x, h, z-2.5, C_WALL, 0.1)
              addParticle(x, h, z+2.5, C_WALL, 0.1)
           }
        }
     }
  }
  
  createCorridor(hallW/2, pavDist - pavW/2)
  createCorridor(-hallW/2, -pavDist + pavW/2)

  // 填充剩余粒子 (环境)
  while(idx < PARTICLE_COUNT) {
     const r = 120 + Math.random() * 150
     const theta = Math.random() * Math.PI * 2
     addParticle(r * Math.cos(theta), baseY, r * Math.sin(theta), {r:0.2, g:0.2, b:0.3})
  }

  // 备份原始位置用于动画恢复
  originalPositions.set(positions)
}

function switchView(index: number) {
  currentView.value = index
  const view = views[index]
  if (!view) return
  
  gsap.to(camera.position, {
    x: view.cameraPos.x,
    y: view.cameraPos.y,
    z: view.cameraPos.z,
    duration: 2,
    ease: 'power2.inOut'
  })
  
  gsap.to(controls.target, {
    x: view.target.x,
    y: view.target.y,
    z: view.target.z,
    duration: 2,
    ease: 'power2.inOut'
  })
}

function handleResize() {
  if (!containerRef.value) return
  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

function animate() {
  animationFrameId = requestAnimationFrame(animate)
  controls.update()
  
  // 粒子微动效果 (呼吸感)
  const time = Date.now() * 0.001
  if (geometry && geometry.attributes.position) {
     const pos = geometry.attributes.position.array as Float32Array
     for(let i=0; i<PARTICLE_COUNT; i++) {
        const idx = i * 3
        const cR = colors[idx]
        const cG = colors[idx + 1]
        const pX = positions[idx]
        const oY = originalPositions[idx + 1]

        if (cR === undefined || cG === undefined || pX === undefined || oY === undefined) continue

        // 仅让屋顶粒子轻微浮动
        if (cR > 0.9 && cG > 0.7) { // 金色屋顶
           pos[idx + 1] = oY + Math.sin(time + pX * 0.1) * 0.1
        }
     }
     geometry.attributes.position.needsUpdate = true
  }

  renderer.render(scene, camera)
}

onMounted(() => {
  initScene()
})

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId)
  window.removeEventListener('resize', handleResize)
  if (renderer) renderer.dispose()
  if (geometry) geometry.dispose()
})
</script>

<style scoped lang="scss">
.daming-page {
  width: 100vw;
  height: 100vh;
  position: relative;
  background: #05080f;
  overflow: hidden;
  font-family: 'Noto Serif SC', serif;
}

.canvas-container {
  width: 100%;
  height: 100%;
}

.ui-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  padding: 40px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.header {
  color: #fff;
  text-shadow: 0 2px 10px rgba(0,0,0,0.8);
  
  h1 {
    font-size: 3.5rem;
    margin: 0;
    letter-spacing: 0.5rem;
    background: linear-gradient(to bottom, #fff, #d4af37);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  .subtitle {
    font-size: 1.2rem;
    color: #d4af37;
    letter-spacing: 0.3rem;
    margin-top: 10px;
    opacity: 0.8;
  }
}

.controls-container {
  position: absolute;
  bottom: 40px;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: center;
  pointer-events: none;
  z-index: 10;
}

.controls {
  pointer-events: auto;
  display: flex;
  gap: 15px;
  background: rgba(0,0,0,0.5);
  padding: 10px 20px;
  border-radius: 30px;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255,255,255,0.1);
  
  .view-btn {
    background: transparent;
    border: 1px solid transparent;
    color: rgba(255,255,255,0.7);
    padding: 8px 20px;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.3s;
    font-family: 'Noto Serif SC', serif;
    font-size: 0.9rem;
    
    &:hover {
      color: #fff;
      background: rgba(255,255,255,0.1);
    }

    &.active {
      background: #d4af37;
      color: #000;
      font-weight: bold;
      box-shadow: 0 0 15px rgba(212, 175, 55, 0.5);
    }
  }
}

.stats {
  position: absolute;
  top: 40px;
  right: 140px; /* 避开返回按钮 */
  color: rgba(255,255,255,0.4);
  font-size: 0.8rem;
  text-align: right;
  line-height: 1.5;
}

.back-btn {
  position: absolute;
  top: 40px;
  right: 40px;
  background: transparent;
  border: 1px solid rgba(255,255,255,0.2);
  color: rgba(255,255,255,0.6);
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  pointer-events: auto;
  transition: all 0.3s;
  
  &:hover {
    color: #fff;
    border-color: #fff;
  }
}
</style>

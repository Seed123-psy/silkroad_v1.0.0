<template>
  <div class="architecture-particles-container" ref="container">
    <div class="ui-overlay">
      <h1 class="title">{{ currentArchitectureName }}</h1>
      <p class="subtitle">点击屏幕切换建筑 ({{ currentIndex + 1 }} / {{ architectures.length }})</p>
      <div class="loading" v-if="loading">生成模型数据中...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import * as THREE from 'three';
import gsap from 'gsap';

const container = ref<HTMLElement | null>(null);
const loading = ref(true);
const currentArchitectureName = ref('');
const currentIndex = ref(0);

// 配置参数
const PARTICLE_COUNT = 65000; // 增加粒子数量
const PARTICLE_SIZE = 0.1;

// 状态管理
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let points: THREE.Points;
let geometry: THREE.BufferGeometry;
let animationId: number;
let isTransitioning = false;

// 建筑数据定义
interface ArchitectureData {
  name: string;
  positions: Float32Array;
  colors: Float32Array;
  baseColor: THREE.Color;
}

const architectures: ArchitectureData[] = [];

// 辅助函数：生成随机点在立方体内
function randomPointInBox(w: number, h: number, d: number, cx: number, cy: number, cz: number) {
  return {
    x: (Math.random() - 0.5) * w + cx,
    y: (Math.random() - 0.5) * h + cy,
    z: (Math.random() - 0.5) * d + cz
  };
}

// 生成大雁塔 (Big Wild Goose Pagoda) - 深度优化版
function generateBigWildGoosePagoda(): ArchitectureData {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  // 参考图片：夕阳下的砖红色/暖赭石色
  const baseColor = new THREE.Color(0xD27D46); 

  let offset = 0;
  const levels = 7;
  const startY = -5.5;
  const baseWidth = 7.5; // 底层更宽，显得敦实
  const heightStep = 1.35; // 层高
  // 收缩率减小，避免太尖，保持方正感
  const taperRate = 0.09; 

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const rand = Math.random();
    let p;
    let colorVar = 0; 
    
    if (rand < 0.08) {
      // 宽大的底座平台 (须弥座)
      p = randomPointInBox(12, 1.2, 12, 0, startY - 0.6, 0);
      colorVar = -0.15; 
    } else if (rand > 0.985) {
      // 塔刹 (顶部细节优化)
      const topY = startY + levels * heightStep;
      // 塔刹基座 (方形)
      if (Math.random() < 0.4) {
         p = randomPointInBox(2, 0.5, 2, 0, topY + 0.25, 0);
      } else {
         // 宝瓶/葫芦 (圆形)
         const h = Math.random() * 1.8;
         // 曲线造型
         let r = 0.4;
         if (h < 0.4) r = 0.6; // 底部圆座
         else if (h < 1.0) r = 0.3 + (h-0.4)*0.2; // 瓶身
         else r = 0.1; // 尖顶
         
         const theta = Math.random() * Math.PI * 2;
         const rad = Math.random() * r;
         p = {
           x: rad * Math.cos(theta),
           y: topY + 0.5 + h,
           z: rad * Math.sin(theta)
         };
         colorVar = 0.2; // 塔刹金光
      }
    } else {
      // 塔身 7层
      const level = Math.floor(Math.pow(Math.random(), 1.1) * levels);
      
      const currentBaseY = startY + level * heightStep;
      // 线性收缩，但保持方正
      const currentW = baseWidth * (1 - level * taperRate);
      
      const layerRand = Math.random();
      
      if (layerRand < 0.35) {
        // 屋檐 (Eaves) - 重点优化
        // 屋檐分为：檐口(挑出部分) 和 檐下(斗拱层)
        const eaveW = currentW * 1.15; // 挑出不要太夸张
        
        if (Math.random() < 0.6) {
           // 檐口表面 (斜面)
           // 模拟四阿顶的斜坡，但大雁塔屋檐比较平缓
           const u = (Math.random() - 0.5) * eaveW;
           const v = (Math.random() - 0.5) * eaveW;
           
           // 简单的棱台形状
           // 距离中心的距离
           const dist = Math.max(Math.abs(u), Math.abs(v));
           // 越靠外越低
           const slope = (dist / (eaveW/2)) * 0.3; 
           
           p = {
             x: u,
             y: currentBaseY + 0.2 - slope, // 屋檐在层底
             z: v
           };
           
           // 挖空中心
           if (Math.max(Math.abs(p.x), Math.abs(p.z)) < currentW/2 * 0.9) {
              p.y += 100; // 移除
           }
           colorVar = 0.05; // 屋檐受光
        } else {
           // 檐下阴影/斗拱层
           p = randomPointInBox(eaveW * 0.95, 0.2, eaveW * 0.95, 0, currentBaseY - 0.1, 0);
           if (Math.max(Math.abs(p.x), Math.abs(p.z)) < currentW/2 * 0.95) {
              p.y += 100;
           }
           colorVar = -0.25; // 檐下深暗
        }
        
      } else {
        // 墙体 (Wall)
        const wallH = heightStep * 0.8; 
        const localY = Math.random() * wallH;
        const y = currentBaseY + 0.2 + localY; // 0.2是屋檐高度
        
        // 墙体几乎垂直，微弱收分
        p = randomPointInBox(currentW, 0, currentW, 0, y, 0);
        
        // 拱门 (Arch) - 优化形状
        const archH = wallH * 0.55;
        const archW = currentW * 0.22;
        
        // 检查是否在拱门范围内 (四面)
        const isArchX = Math.abs(p.x) < archW/2 && p.y < currentBaseY + 0.2 + archH && Math.abs(p.z) > currentW/2 - 0.6;
        const isArchZ = Math.abs(p.z) < archW/2 && p.y < currentBaseY + 0.2 + archH && Math.abs(p.x) > currentW/2 - 0.6;
        
        if (isArchX || isArchZ) {
           // 拱门上半部分是圆弧
           const archTopY = currentBaseY + 0.2 + archH - archW/2;
           let inArch = true;
           
           if (p.y > archTopY) {
              // 圆弧判断
              const dx = isArchX ? p.x : p.z;
              const dy = p.y - archTopY;
              if (dx*dx + dy*dy > (archW/2)*(archW/2)) {
                 inArch = false; // 在圆弧外，是墙体
              }
           }
           
           if (inArch) {
             if (Math.random() > 0.2) {
               // 门洞深处
               if (isArchX) p.z *= 0.85;
               if (isArchZ) p.x *= 0.85;
               colorVar = -0.4; // 很暗
             } else {
               // 门框/栏杆
               colorVar = -0.1;
             }
           }
        }
        
        // 砖缝纹理 (横向)
        if (Math.abs(p.y % 0.2) < 0.02) {
           colorVar -= 0.1;
        }
      }
    }

    positions[offset] = p.x;
    positions[offset + 1] = p.y;
    positions[offset + 2] = p.z;

    let c = baseColor.clone();
    
    // 整体光照：模拟夕阳侧光
    // x正方向亮，x负方向暗
    if (p.x > 0) colorVar += 0.05;
    else colorVar -= 0.05;

    c.offsetHSL(0, 0, colorVar + (Math.random() - 0.5) * 0.06);

    colors[offset] = c.r;
    colors[offset + 1] = c.g;
    colors[offset + 2] = c.b;

    offset += 3;
  }

  return { name: '大雁塔 (Big Wild Goose Pagoda)', positions, colors, baseColor };
}

// 生成嘉峪关 (Jiayuguan Pass) - 重构精细版
function generateJiayuguanPass(): ArchitectureData {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const baseColor = new THREE.Color(0xD2B48C); // 黄土色

  let offset = 0;

  // 嘉峪关核心特征：高台之上，三重楼阁，飞檐翘角
  const baseH = 5; 
  const baseW = 14;
  const baseD = 10;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const rand = Math.random();
    let p = {x:0, y:0, z:0};
    let colorType = 0; // 0:土墙, 1:红柱/墙, 2:灰瓦, 3:绿脊, 4:深色阴影
    
    if (rand < 0.5) {
      // === 1. 关城底座 (Base) ===
      // 巨大的梯形夯土台
      const y = (Math.random() - 0.5) * baseH - 2.5; // -5 ~ 0
      const progress = (y + 5) / baseH; // 0 ~ 1
      
      // 收分 (下宽上窄)
      const w = baseW * (1 - progress * 0.15);
      const d = baseD * (1 - progress * 0.15);
      
      p = randomPointInBox(w, 0, d, 0, y, 0);
      
      // 门洞 (Archway)
      if (Math.abs(p.x) < 2 && p.y < -1.5) {
         // 拱门
         const archH = 3;
         const archTop = -2.5 + archH; 
         if (p.y > archTop - 1.5) {
            // 圆拱
            const dy = p.y - (archTop - 1.5);
            if (p.x*p.x + dy*dy < 2*2) p.y = 100; // 挖空
         } else {
            p.y = 100; // 挖空
         }
         // 门洞内部深色
         if (Math.abs(p.x) < 2.2) colorType = 4; 
      }
      
      // 马道/坡道 (Ramp) - 简单的斜坡示意
      if (p.z > d/2 - 1 && p.x > w/2 - 4) {
         // 稍微抬高一点做坡道感
         p.y += 0.2;
      }
      
      // 垛口 (Battlements)
      if (y > -0.2) {
         const isEdge = Math.abs(p.x) > w/2 - 0.8 || Math.abs(p.z) > d/2 - 0.8;
         if (isEdge) {
            // 凹凸垛口
            if (Math.sin(p.x * 3 + p.z * 3) > 0) p.y += 0.8;
         }
      }
      
    } else {
      // === 2. 城楼 (Tower) ===
      // 嘉峪关城楼通常是三层歇山顶
      // 位置在城台正中
      const towerBaseY = 0;
      const towerH = 7;
      const localY = Math.random() * towerH;
      const y = towerBaseY + localY;
      
      // 楼阁宽度随高度收缩
      const level = Math.floor(localY / 2.5); // 0, 1, 2
      
      if (level === 0) {
         // 第一层：回廊 + 核心墙体
         const w = 8;
         const d = 6;
         
         // 柱网
         const isPillar = (Math.abs(p.x) > w/2 - 0.5 || Math.abs(p.z) > d/2 - 0.5) && Math.random() < 0.4;
         const isCore = Math.abs(p.x) < w/2 - 1.5 && Math.abs(p.z) < d/2 - 1.5;
         
         if (isPillar) {
            p = randomPointInBox(w, 0, d, 0, y, 0);
            colorType = 1; // 红柱
         } else if (isCore) {
            p = randomPointInBox(w-3, 0, d-3, 0, y, 0);
            colorType = 1; // 红墙
         } else {
            p.y = 100; // 空心回廊
         }
         
         // 一层檐
         if (localY > 2.0) {
            const eaveW = 10;
            const eaveD = 8;
            // 飞檐翘角
            const u = (Math.random()-0.5)*eaveW;
            const v = (Math.random()-0.5)*eaveD;
            const dist = Math.sqrt((u/(eaveW/2))**2 + (v/(eaveD/2))**2);
            let h = 0;
            if (dist > 0.8) h = (dist-0.8)*1.5;
            
            p = {x:u, y: y + h, z:v};
            colorType = 2; // 灰瓦
         }
         
      } else if (level === 1) {
         // 第二层
         const w = 6;
         const d = 4;
         p = randomPointInBox(w, 0, d, 0, y, 0);
         colorType = 1; // 红墙
         
         // 窗户
         if (Math.random() > 0.7) colorType = 4; // 深色窗
         
         // 二层檐
         if (localY > 4.5) {
            const eaveW = 8;
            const eaveD = 6;
            const u = (Math.random()-0.5)*eaveW;
            const v = (Math.random()-0.5)*eaveD;
            const dist = Math.sqrt((u/(eaveW/2))**2 + (v/(eaveD/2))**2);
            let h = 0;
            if (dist > 0.8) h = (dist-0.8)*1.5;
            
            p = {x:u, y: y + h, z:v};
            colorType = 2;
         }
         
      } else {
         // 第三层 + 屋顶
         const w = 5;
         const d = 3;
         
         if (localY < 6.0) {
            p = randomPointInBox(w, 0, d, 0, y, 0);
            colorType = 1;
         } else {
            // 大屋顶
            const eaveW = 7;
            const eaveD = 5;
            const u = (Math.random()-0.5)*eaveW;
            const v = (Math.random()-0.5)*eaveD;
            
            // 歇山顶脊线
            const ridgeW = 2;
            
            // 距离脊线的距离
            const distX = Math.max(0, Math.abs(u) - ridgeW/2);
            const distZ = Math.abs(v);
            
            // 高度下降
            const drop = Math.sqrt(distX*distX + distZ*distZ) * 0.8;
            
            // 翘角
            const cornerDist = Math.sqrt((u/(eaveW/2))**2 + (v/(eaveD/2))**2);
            let lift = 0;
            if (cornerDist > 0.7) lift = (cornerDist-0.7) * 2.0;
            
            p = {x:u, y: 7.5 - drop + lift, z:v};
            colorType = 2;
            
            // 脊兽/正脊
            if (distX < 0.1 && distZ < 0.1) colorType = 3; // 绿脊
         }
      }
    }

    // 赋值
    if (p.y < 50) {
        positions[offset] = p.x;
        positions[offset + 1] = p.y;
        positions[offset + 2] = p.z;

        let c = baseColor.clone();
        
        if (colorType === 0) { // 土墙
           c.setHex(0xD2B48C);
        } else if (colorType === 1) { // 红柱/墙
           c.setHex(0x8B2323); // 这里的红要深沉一点
        } else if (colorType === 2) { // 灰瓦
           c.setHex(0x444444);
           c.offsetHSL(0, 0, 0.1); // 稍微亮一点
        } else if (colorType === 3) { // 绿脊
           c.setHex(0x2E8B57);
        } else if (colorType === 4) { // 深色/阴影
           c.setHex(0x221100);
        }
        
        // 随机杂色
        c.offsetHSL(0, 0, (Math.random() - 0.5) * 0.1);
        
        colors[offset] = c.r;
        colors[offset + 1] = c.g;
        colors[offset + 2] = c.b;
    } else {
        positions[offset] = 0;
        positions[offset + 1] = 1000;
        positions[offset + 2] = 0;
    }

    offset += 3;
  }

  return { name: '嘉峪关 (Jiayuguan Pass)', positions, colors, baseColor };
}

// 生成莫高窟九层楼 (Mogao Caves 9-story Pagoda) - 重构精细版
function generateMogaoCaves(): ArchitectureData {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const baseColor = new THREE.Color(0xC2B280); // 沙色

  let offset = 0;

  // 九层楼参数
  const levels = 9;
  const totalH = 13;
  const baseY = -6.5;
  const baseW = 9;
  const depth = 4;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const rand = Math.random();
    let p = {x:0, y:0, z:0};
    let colorType = 0; // 0:山崖, 1:红柱/墙, 2:绿瓦, 3:深色阴影/内构, 4:栏杆/装饰

    if (rand < 0.35) {
      // === 1. 背景山崖 (Cliff) ===
      // 高大的不规则岩壁
      const cliffW = 20;
      const cliffH = 18;
      const cliffD = 5;
      
      const x = (Math.random() - 0.5) * cliffW;
      const y = (Math.random() - 0.5) * cliffH;
      // 崖面在 Z = -2 左右，往后延伸
      const z = -2 - Math.random() * cliffD;
      
      // 表面噪点，模拟岩石肌理
      const noise = Math.sin(x * 0.5) * Math.cos(y * 0.5) * 0.5 + (Math.random()-0.5)*0.5;
      
      p = { x, y, z: z + noise };
      colorType = 0;

    } else {
      // === 2. 九层楼主体 (Pavilion) ===
      // 依山而建，层层收分
      
      // 随机选择一层
      const level = Math.floor(Math.random() * levels); // 0 ~ 8
      const levelProgress = level / (levels - 1); // 0 ~ 1
      
      // 当前层的参数
      const currentY = baseY + level * (totalH / levels);
      const nextY = baseY + (level + 1) * (totalH / levels);
      const currentW = baseW * (1 - levelProgress * 0.5); // 底部宽，顶部窄
      const currentD = depth * (1 - levelProgress * 0.3);
      
      const subRand = Math.random();
      
      if (subRand < 0.4) {
         // --- 柱子与墙体 (Structure) ---
         // 主要是前面的柱廊
         const w = currentW;
         // const d = currentD; // 已移除：未使用，避免 TS6133
         
         // 随机点
         const lx = (Math.random() - 0.5) * w;
         const ly = Math.random() * (nextY - currentY);
         
         // 调整Z坐标，使其贴在崖壁前
         // 假设崖壁在 Z=-2，建筑从 Z=-2 向前延伸
         // 实际 Z 范围: -2 ~ -2 + currentD
         const absZ = -2 + Math.random() * currentD;
         
         // 柱子逻辑：主要分布在最外侧和两侧
         const isPillar = Math.abs(lx) > w/2 - 0.5 || absZ > -2 + currentD - 0.5;
         
         if (isPillar) {
            p = { x: lx, y: currentY + ly, z: absZ };
            colorType = 1; // 红柱
         } else {
            // 内部稍微空一点，或者暗色
            if (Math.random() < 0.3) {
               p = { x: lx, y: currentY + ly, z: absZ };
               colorType = 3; // 内部阴影
            } else {
               p = { x: 0, y: 100, z: 0 }; // 挖空
            }
         }
         
         // 栏杆 (Railings) - 每层底部
         if (ly < 0.4 && absZ > -2 + currentD - 0.5) {
             p = { x: lx, y: currentY + ly, z: absZ };
             colorType = 4; // 栏杆
         }

      } else {
         // --- 屋檐 (Eaves) ---
         // 每一层都有飞檐
         const eaveW = currentW * 1.3;
         const eaveD = currentD * 1.2; // 向前伸出
         
         const u = (Math.random() - 0.5) * eaveW;
         const v = Math.random() * eaveD; // 0 ~ eaveD
         
         // 屋檐高度位置：在本层顶部
         const roofBaseY = nextY - 0.2;
         
         // 距离中心的距离 (用于计算坡度)
         // Z方向：从崖壁(-2)向外
         const zPos = -2 + v;
         const distFromWall = v;
         
         // 简单的坡屋顶
         // 这里做成向外下倾的单坡，但在边缘翘起
         
         let h = -distFromWall * 0.3; // 向外下倾
         
         // 飞檐翘角 (两侧)
         const xDist = Math.abs(u) / (eaveW/2); // 0 ~ 1
         if (xDist > 0.7) {
            h += (xDist - 0.7) * 1.5; // 翘起
         }
         
         // 前端也翘起一点
         if (v > eaveD * 0.8) {
            h += (v - eaveD * 0.8) * 0.5;
         }
         
         p = { x: u, y: roofBaseY + h, z: zPos };
         colorType = 2; // 绿瓦
         
         // 瓦当/脊 (装饰)
         if (Math.abs(u) > eaveW/2 - 0.2 || v > eaveD - 0.2) {
             colorType = 4; // 装饰色
         }
      }
    }

    // 赋值
    if (p.y < 50) {
        positions[offset] = p.x;
        positions[offset + 1] = p.y;
        positions[offset + 2] = p.z;

        let c = baseColor.clone();
        
        if (colorType === 0) { // 山崖
           c.setHex(0xC2B280);
           c.offsetHSL(0, 0, (Math.random()-0.5)*0.1);
        } else if (colorType === 1) { // 红柱
           c.setHex(0x8B0000); // 深红
        } else if (colorType === 2) { // 绿瓦
           c.setHex(0x2E8B57); // 海藻绿
           // 稍微加点灰度，不要太鲜艳
           c.offsetHSL(0, -0.2, 0);
        } else if (colorType === 3) { // 内部
           c.setHex(0x1a0b00); // 极深红黑
        } else if (colorType === 4) { // 装饰/栏杆
           c.setHex(0xFFD700); // 金色/亮色点缀
           c.multiplyScalar(0.8); // 暗一点
        }
        
        // 统一光照感/杂色
        c.offsetHSL(0, 0, (Math.random() - 0.5) * 0.05);
        
        colors[offset] = c.r;
        colors[offset + 1] = c.g;
        colors[offset + 2] = c.b;
    } else {
        positions[offset] = 0;
        positions[offset + 1] = 1000;
        positions[offset + 2] = 0;
    }

    offset += 3;
  }

  return { name: '莫高窟九层楼 (Mogao Caves)', positions, colors, baseColor };
}

// 生成赵州桥 (Zhaozhou Bridge) - 真实还原版
function generateBridge(): ArchitectureData {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const baseColor = new THREE.Color(0xD8D8D0); // 石灰白/米灰色

  let offset = 0;
  
  // 赵州桥参数
  // 跨度约37米，拱矢约7.2米，扁平率低
  // 缩放比例：跨度设为 18
  const span = 18;      
  const rise = 3.5;     // 拱高 (扁平拱)
  const width = 5.5;    // 桥宽
  const startY = -3.0;  // 起拱点高度
  
  // 主拱几何计算
  // x^2 + (y-yc)^2 = R^2
  // 拱顶: (0, startY + rise)
  // 拱脚: (span/2, startY)
  const s = span / 2;
  const h = rise;
  const R = (s*s + h*h) / (2*h);
  const yc = startY + rise - R; // 圆心Y
  
  // 小拱参数 (敞肩)
  const smallArchW = 2.2;
  const smallArchX = 5.5; // 小拱中心X距离原点的偏移
  
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const rand = Math.random();
    let p = {x:0, y:0, z:0};
    let colorType = 0; // 0:石, 1:栏杆, 2:水, 3:阴影/缝隙, 4:桥面
    
    if (rand < 0.25) {
       // === 1. 水面 (Water) ===
       const wx = (Math.random() - 0.5) * (span + 12);
       const wz = (Math.random() - 0.5) * (width + 16);
       // 水面波动
       const wave = Math.sin(wx * 0.5) * 0.2 + Math.cos(wz * 0.5) * 0.2;
       p = { x: wx, y: startY - 1.5 + wave, z: wz };
       colorType = 2;
       
    } else if (rand < 0.55) {
       // === 2. 主拱圈 (Main Arch Ring) ===
       // 沿着圆弧
       const angleMax = Math.asin(s / R);
       const angle = (Math.random() - 0.5) * 2 * angleMax;
       
       // 拱圈厚度
       const thickness = 0.8;
       const r = R - Math.random() * thickness; // 向内厚度
       
       const x = r * Math.sin(angle);
       const y = yc + r * Math.cos(angle);
       const z = (Math.random() - 0.5) * width;
       
       p = { x, y, z };
       colorType = 0;
       
       // 拱圈侧面刻字/装饰 (随机噪点)
       if (Math.abs(z) > width/2 - 0.2) colorType = 3;

    } else if (rand < 0.85) {
       // === 3. 拱上侧墙 (Spandrel Walls) & 小拱 ===
       // 填充主拱背到桥面之间的区域
       
       const x = (Math.random() - 0.5) * span;
       const z = (Math.random() - 0.5) * width;
       
       // 计算该x处的主拱上表面高度
       let archTopY = startY;
       if (Math.abs(x) < s) {
          const dy = Math.sqrt(R*R - x*x);
          archTopY = yc + dy;
       }
       
       // 桥面曲线 (抛物线近似)
       // 桥顶在 startY + rise + 0.5
       // 桥头在 startY
       const deckH = startY + rise + 0.5 - (x/s)*(x/s)*2.0;
       
       // 随机高度
       const y = archTopY + Math.random() * (deckH - archTopY);
       
       // 只有在拱背之上、桥面之下才生成
       if (y > archTopY && y < deckH) {
          p = { x, y, z };
          colorType = 0;
          
          // === 挖去小拱 (Cutout Small Arches) ===
          const absX = Math.abs(x);
          // 小拱位置
          if (absX > smallArchX - smallArchW/2 && absX < smallArchX + smallArchW/2) {
             // 小拱中心高度 (大概在主拱背上方一点)
             // 计算主拱在此处的切线角度? 简化处理
             const smallArchCenterY = archTopY + 0.5; 
             
             const dx = absX - smallArchX;
             const dy = y - smallArchCenterY;
             
             // 圆洞
             if (dx*dx + dy*dy < (smallArchW/2)*(smallArchW/2)) {
                p.y = 100; // 挖掉
             }
             // 或者是上半圆洞 + 下方矩形
             if (Math.abs(dx) < smallArchW/2 && y > smallArchCenterY && y < smallArchCenterY + 1.0) {
                 // p.y = 100; 
             }
          }
          
          // 侧墙只在两侧有，中间是填土(不可见)或实心
          // 粒子化处理：中间稍微稀疏
          if (Math.abs(z) < width/2 - 0.5) {
             if (Math.random() > 0.3) p.y = 100;
          }
       } else {
          p = {x:0, y:100, z:0};
       }

    } else {
       // === 4. 桥面与栏杆 (Deck & Railings) ===
       const x = (Math.random() - 0.5) * (span + 2);
       // 桥面曲线
       const deckH = startY + rise + 0.5 - (x/s)*(x/s)*2.0;
       
       const z = (Math.random() - 0.5) * width;
       
       // 桥面
       p = { x, y: deckH, z };
       colorType = 4;
       
       // 栏杆
       if (Math.abs(z) > width/2 - 0.3) {
          if (Math.random() < 0.7) {
             p.y += 0.5 + Math.random() * 0.5; // 栏杆高度
             colorType = 1;
             
             // 望柱
             if (Math.abs(x % 1.5) < 0.2) {
                p.y += 0.3;
                colorType = 1;
             }
          }
       }
    }

    // 颜色处理
    if (p.y < 50) {
        positions[offset] = p.x;
        positions[offset + 1] = p.y;
        positions[offset + 2] = p.z;

        let c = baseColor.clone();
        
        if (colorType === 2) { // 水
           c.setHex(0x87CEEB);
           c.offsetHSL(0, 0, 0.1);
        } else if (colorType === 1) { // 栏杆
           c.setHex(0xE0E0E0); // 白玉栏杆
        } else if (colorType === 3) { // 阴影
           c.setHex(0x808080);
        } else if (colorType === 4) { // 桥面
           c.setHex(0xC0C0C0);
        }
        
        // 随机杂色
        c.offsetHSL(0, 0, (Math.random() - 0.5) * 0.1);
        
        colors[offset] = c.r;
        colors[offset + 1] = c.g;
        colors[offset + 2] = c.b;
    } else {
        positions[offset] = 0;
        positions[offset + 1] = 1000;
        positions[offset + 2] = 0;
    }

    offset += 3;
  }

  return { name: '赵州桥 (Zhaozhou Bridge)', positions, colors, baseColor };
}

function initThree() {
  if (!container.value) return;

  // 场景
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050510); // 深邃夜空蓝
  scene.fog = new THREE.FogExp2(0x050510, 0.02);

  // 相机
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 16;
  camera.position.y = 5;
  camera.lookAt(0, 0, 0);

  // 渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.value.appendChild(renderer.domElement);

  // 粒子材质 - 使用更柔和的光点
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  if (context) {
    // 径向渐变，中心亮，边缘透明
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);
  }
  const texture = new THREE.CanvasTexture(canvas);

  const material = new THREE.PointsMaterial({
    size: PARTICLE_SIZE,
    map: texture,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    opacity: 0.9,
    sizeAttenuation: true
  });

  // 初始几何体
  geometry = new THREE.BufferGeometry();
  // 保证 initialData 在编译期对 TS 为非 undefined（提供安全回退）
  const initialData = architectures[0] ?? {
    name: '',
    positions: new Float32Array(PARTICLE_COUNT * 3),
    colors: new Float32Array(PARTICLE_COUNT * 3),
    baseColor: new THREE.Color(0xffffff)
  };

  geometry.setAttribute('position', new THREE.BufferAttribute(Float32Array.from(initialData.positions), 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(Float32Array.from(initialData.colors), 3));

  points = new THREE.Points(geometry, material);
  scene.add(points);

  currentArchitectureName.value = initialData.name;

  // 动画循环
  const animate = () => {
    animationId = requestAnimationFrame(animate);
    
    // 缓慢旋转
    points.rotation.y += 0.001;
    
    // 简单的浮动效果 (如果性能允许)
    // 这里为了性能只做整体旋转
    
    renderer.render(scene, camera);
  };
  animate();

  // 窗口大小调整
  window.addEventListener('resize', onWindowResize);
  
  // 点击事件
  window.addEventListener('click', onCanvasClick);
}

function onWindowResize() {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onCanvasClick() {
  if (isTransitioning) return;
  
  const nextIndex = (currentIndex.value + 1) % architectures.length;
  transitionTo(nextIndex);
}

function transitionTo(index: number) {
  isTransitioning = true;
  currentIndex.value = index;
  const targetData = architectures[index];
  if (!targetData) {
    isTransitioning = false;
    return;
  }

  // geometry.getAttribute 更明确地取属性并进行空值检查
  const positionAttribute = geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
  const colorAttribute = geometry.getAttribute('color') as THREE.BufferAttribute | undefined;
  if (!positionAttribute || !colorAttribute) {
    isTransitioning = false;
    return;
  }

  currentArchitectureName.value = targetData.name;

   // 明确初始化，确保类型为 Float32Array（非 undefined）
   // 注：这些数组在 onUpdate 回调中通过闭包访问
   const startPositions = Float32Array.from(positionAttribute.array as Float32Array);
   const startColors = Float32Array.from(colorAttribute.array as Float32Array);

   const endPositions = targetData.positions;
   const endColors = targetData.colors;

  const duration = 2.0;

  const progress = { t: 0 };

  // 使用更复杂的缓动
  gsap.to(progress, {
    t: 1,
    duration: duration,
    ease: "power3.inOut",
    onUpdate: () => {
      const t = progress.t;
      // 使用外部闭包中的数组，确保类型安全
      const posArr: Float32Array = positionAttribute.array as Float32Array;
      const colArr: Float32Array = colorAttribute.array as Float32Array;

          // 将起止数据提升为局部常量，避免 TS 对索引访问产生“可能为 undefined”的推断
          const sp = startPositions;
          const ep = endPositions;
          const sc = startColors;
          const ec = endColors;

       for (let i = 0; i < PARTICLE_COUNT; i++) {
         const i3 = i * 3;

         // 加入一点随机扰动，让变换过程像流沙/星尘
         const noise = Math.sin(t * Math.PI) * (Math.random() - 0.5) * 5;

             posArr[i3]   = sp[i3]!   + (ep[i3]!   - sp[i3]!)   * t + noise;
             posArr[i3+1] = sp[i3+1]! + (ep[i3+1]! - sp[i3+1]!) * t + noise;
             posArr[i3+2] = sp[i3+2]! + (ep[i3+2]! - sp[i3+2]!) * t + noise;

             colArr[i3]   = sc[i3]!   + (ec[i3]!   - sc[i3]!)   * t;
             colArr[i3+1] = sc[i3+1]! + (ec[i3+1]! - sc[i3+1]!) * t;
             colArr[i3+2] = sc[i3+2]! + (ec[i3+2]! - sc[i3+2]!) * t;
       }

       positionAttribute.needsUpdate = true;
       colorAttribute.needsUpdate = true;
     },
     onComplete: () => {
      isTransitioning = false;
     }
   });
}

onMounted(() => {
  setTimeout(() => {
    // 顺序：大雁塔 -> 嘉峪关 -> 莫高窟 -> 赵州桥
    architectures.push(generateBigWildGoosePagoda());
    architectures.push(generateJiayuguanPass());
    architectures.push(generateMogaoCaves());
    architectures.push(generateBridge());
    
    loading.value = false;
    initThree();
  }, 100);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', onWindowResize);
  window.removeEventListener('click', onCanvasClick);
  cancelAnimationFrame(animationId);
  if (renderer) {
    renderer.dispose();
  }
  if (geometry) {
    geometry.dispose();
  }
});
</script>

<style scoped>
.architecture-particles-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: radial-gradient(circle at center, #1a1a2e 0%, #0f0f1a 100%);
  position: relative;
  cursor: pointer;
}

.ui-overlay {
  position: absolute;
  top: 40px;
  left: 0;
  width: 100%;
  text-align: center;
  pointer-events: none;
  z-index: 10;
  color: #fff;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.title {
  font-size: 3rem;
  font-weight: 400;
  margin: 0;
  letter-spacing: 4px;
  font-family: "STKaiti", "KaiTi", serif;
  background: linear-gradient(to bottom, #fff, #ffd700);
   background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  font-size: 1.1rem;
  opacity: 0.8;
  margin-top: 15px;
  letter-spacing: 1px;
}

.loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 1.5rem;
  letter-spacing: 2px;
}
</style>

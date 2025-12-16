<template>
  <div class="landing-page">
    <div class="background-effects">
      <div class="stars" :style="{ transform: `translate(${mouseX * 10}px, ${mouseY * 10}px)` }"></div>
      <div class="moon" :style="{ transform: `translate(${mouseX * 5}px, ${mouseY * 5}px)` }"></div>
      <div class="dunes-container">
        <!-- 远景沙丘 -->
        <div class="dune-wrapper" :style="{ transform: `translate(${mouseX * 15}px, ${mouseY * 5}px)` }">
          <svg viewBox="0 0 1440 320" preserveAspectRatio="none" class="dune dune-back">
            <path fill="url(#dune-gradient-back)" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,202.7C1248,181,1344,171,1392,165.3L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            <defs>
              <linearGradient id="dune-gradient-back" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:#1a1d24;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#0f1115;stop-opacity:1" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        
        <!-- 中景沙丘 -->
        <div class="dune-wrapper" :style="{ transform: `translate(${mouseX * 25}px, ${mouseY * 8}px)` }">
          <svg viewBox="0 0 1440 320" preserveAspectRatio="none" class="dune dune-mid">
            <path fill="url(#dune-gradient-mid)" d="M0,128L48,144C96,160,192,192,288,197.3C384,203,480,181,576,165.3C672,149,768,139,864,149.3C960,160,1056,192,1152,208C1248,224,1344,224,1392,224L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            <defs>
              <linearGradient id="dune-gradient-mid" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:#3d3226;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#2a221b;stop-opacity:1" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <!-- 远景驼队 -->
        <div class="caravan-wrapper distant" :style="{ transform: `translate(${mouseX * 20}px, ${mouseY * 8}px)` }">
          <div class="caravan slow">
            <svg class="camel" viewBox="0 0 50 40" width="30" height="24" v-for="n in 6" :key="n" :style="{ animationDelay: `${n * 0.4}s` }">
               <g class="camel-group">
                 <path class="leg leg-far front-leg" d="M16,28 L16,38" stroke="#1a1612" stroke-width="2" stroke-linecap="round" />
                 <path class="leg leg-far back-leg" d="M34,28 L34,38" stroke="#1a1612" stroke-width="2" stroke-linecap="round" />
                 <!-- 双峰骆驼身体：弯曲的脖子，明显的双峰 -->
                 <path class="body" d="M16,28 C12,28 10,22 8,16 L5,17 L5,14 L9,13 L12,18 C14,22 16,20 18,14 C20,8 24,18 26,22 C28,18 30,10 34,20 C36,24 36,28 35,32 L34,28 C30,34 20,34 16,28 Z" fill="#1a1612" />
                 <path class="leg leg-near front-leg" d="M16,28 L16,38" stroke="#1a1612" stroke-width="2" stroke-linecap="round" />
                 <path class="leg leg-near back-leg" d="M34,28 L34,38" stroke="#1a1612" stroke-width="2" stroke-linecap="round" />
               </g>
            </svg>
          </div>
        </div>

        <!-- 近景驼队 -->
        <div class="caravan-wrapper" :style="{ transform: `translate(${mouseX * 30}px, ${mouseY * 10}px)` }">
          <div class="caravan">
            <!-- 领队人 -->
            <svg class="person" viewBox="0 0 30 50" width="30" height="50">
               <g class="body-group">
                  <circle cx="15" cy="10" r="4" fill="#1a1612" />
                  <path d="M10,14 L20,14 L18,32 L12,32 Z" fill="#1a1612" />
               </g>
               <g class="legs">
                  <path class="leg left-leg" d="M13,30 L13,48" stroke="#1a1612" stroke-width="3" stroke-linecap="round" />
                  <path class="leg right-leg" d="M17,30 L17,48" stroke="#1a1612" stroke-width="3" stroke-linecap="round" />
               </g>
               <line x1="18" y1="20" x2="40" y2="25" stroke="#1a1612" stroke-width="1" opacity="0.8" />
            </svg>
            <svg class="camel" viewBox="0 0 50 40" width="60" height="48" v-for="n in 5" :key="n" :style="{ animationDelay: `${n * 0.5}s` }">
               <g class="camel-group">
                 <path class="leg leg-far front-leg" d="M16,28 L16,40" stroke="#1a1612" stroke-width="3" stroke-linecap="round" />
                 <path class="leg leg-far back-leg" d="M34,28 L34,40" stroke="#1a1612" stroke-width="3" stroke-linecap="round" />
                 <!-- 双峰骆驼身体：弯曲的脖子，明显的双峰 -->
                 <path class="body" d="M16,28 C12,28 10,22 8,16 L5,17 L5,14 L9,13 L12,18 C14,22 16,20 18,14 C20,8 24,18 26,22 C28,18 30,10 34,20 C36,24 36,28 35,32 L34,28 C30,34 20,34 16,28 Z" fill="#1a1612" />
                 <path class="leg leg-near front-leg" d="M16,28 L16,40" stroke="#1a1612" stroke-width="3" stroke-linecap="round" />
                 <path class="leg leg-near back-leg" d="M34,28 L34,40" stroke="#1a1612" stroke-width="3" stroke-linecap="round" />
               </g>
            </svg>
          </div>
        </div>

        <!-- 近景流光 -->
        <div class="dune-wrapper" :style="{ transform: `translate(${mouseX * 40}px, ${mouseY * 12}px)` }">
          <svg viewBox="0 0 1440 320" preserveAspectRatio="none" class="dune dune-front">
            <path fill="url(#silk-gradient)" fill-opacity="0.1" d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            <defs>
              <linearGradient id="silk-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#E2C792;stop-opacity:0.2" />
                <stop offset="50%" style="stop-color:#E2C792;stop-opacity:0.8" />
                <stop offset="100%" style="stop-color:#E2C792;stop-opacity:0.2" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </div>
    
    <div class="content-wrapper">
      <div class="main-title-group">
        <div class="vertical-line top"></div>
        
        <h1 class="chinese-title">
          <span 
            class="char-wrapper" 
            v-for="(char, index) in titleChars" 
            :key="index" 
            :style="{ animationDelay: `${index * 0.15 + 0.5}s` }"
          >
            <span class="char-inner" :style="{ animationDelay: `${index * 0.2}s` }">{{ char }}</span>
          </span>
        </h1>
        
        <div class="subtitle-wrapper">
          <div class="decoration-line left"></div>
          <h2 class="subtitle">东西方商品流通和文化交融的丝路可视化</h2>
          <div class="decoration-line right"></div>
        </div>

        <!-- English line for design point -->
        <div class="english-wrapper" aria-hidden="false">
          <h3 class="english-title">{{ englishTitle }}</h3>
        </div>
        
        <div class="vertical-line bottom"></div>
      </div>
      
      <div class="enter-action" @click="startJourney">
        <div class="circle-text-wrapper">
          <svg viewBox="0 0 100 100" width="140" height="140" class="rotating-ring">
            <path id="circlePath" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" fill="transparent" />
            <text font-size="10.5">
              <textPath href="#circlePath" fill="#E2C792" letter-spacing="2px">
                EXPLORE THE SILK ROAD • ENTER THE JOURNEY •
              </textPath>
            </text>
          </svg>
          <div class="center-btn">
             <div class="pulse-circle"></div>
             <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E2C792" stroke-width="1.5">
               <path d="M5 12h14M12 5l7 7-7 7"/>
             </svg>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import zh from '@/locales/zh'
import en from '@/locales/en'

const emit = defineEmits(['start'])

// Always show bilingual on the landing page: Chinese from `zh`, English from `en`.
const title = computed(() => zh.landing?.title ?? '驼铃回荡的千年')
const titleChars = computed(() => title.value.split(''))
const englishTitle = computed(() => en.landing?.subtitle ?? 'The Silk Road — A thousand years of trade and cultural exchange between East and West')

const mouseX = ref(0)
const mouseY = ref(0)

const handleMouseMove = (e: MouseEvent) => {
  mouseX.value = (e.clientX / window.innerWidth - 0.5) * 2 // -1 to 1
  mouseY.value = (e.clientY / window.innerHeight - 0.5) * 2 // -1 to 1
}

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
})

const startJourney = () => {
  emit('start')
}
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.landing-page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: $bg-primary;
  color: $text-primary;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.background-effects {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  background: radial-gradient(circle at 50% 0%, #1c2333 0%, $bg-primary 70%);
  
  .stars {
    position: absolute;
    width: 100%;
    height: 100%;
    will-change: opacity;
    background-image: 
      radial-gradient(1px 1px at 20px 30px, #fff, transparent),
      radial-gradient(1px 1px at 40px 70px, #fff, transparent),
      radial-gradient(1px 1px at 50px 160px, #fff, transparent),
      radial-gradient(2px 2px at 90px 40px, #fff, transparent),
      radial-gradient(2px 2px at 130px 80px, #fff, transparent);
    background-size: 200px 200px;
    opacity: 0.3;
    animation: twinkle 5s infinite alternate;
  }
  
  .moon {
    position: absolute;
    top: 15%;
    right: 20%;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, #fff9e6, #e2c792);
    box-shadow: 0 0 60px rgba(226, 199, 146, 0.2);
    opacity: 0.8;
    
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: radial-gradient(circle at 50% 50%, transparent 60%, $bg-primary 120%);
      opacity: 0.4;
    }
  }
  
  .dunes-container {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 60%;
    
    .dune {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 100%;
      will-change: transform;
      
      &.dune-back {
        transform: scaleY(0.8);
        opacity: 0.6;
      }
      
      &.dune-mid {
        transform: scaleY(0.6) translateY(20px);
        opacity: 0.8;
        animation: drift 20s ease-in-out infinite alternate;
      }
      
      &.dune-front {
        transform: scaleY(0.4) translateY(40px);
        mix-blend-mode: screen;
        animation: flow 15s linear infinite;
      }
    }
  }
}

.content-wrapper {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding-bottom: 60px;
}

.main-title-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 80px;
  position: relative;
  
  .vertical-line {
    width: 1px;
    background: linear-gradient(to bottom, transparent, $color-gold, transparent);
    height: 60px;
    opacity: 0.5;
    
    &.top {
      margin-bottom: 30px;
      animation: growVertical 1s ease-out forwards;
    }
    
    &.bottom {
      margin-top: 30px;
      animation: growVertical 1s ease-out forwards 1s;
    }
  }
  
  .chinese-title {
    font-family: $font-family-serif;
    font-size: 6rem;
    font-weight: 700;
    color: $color-gold;
    margin: 0;
    line-height: 1.2;
    display: flex;
    gap: 1rem;
    text-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    
    .char-wrapper {
      display: inline-block;
      opacity: 0;
      transform: translate3d(0, 24px, 0);
      will-change: transform, opacity;
      backface-visibility: hidden;
      animation: fadeUpChar 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
      
      .char-inner {
        display: inline-block;
        animation: floatChar 3s ease-in-out infinite;
        
        // 增加一点文字纹理感
        background: linear-gradient(180deg, #fff 0%, $color-gold 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
    }
  }
  
  .subtitle-wrapper {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-top: 24px;
    opacity: 0;
    animation: fadeIn 1s ease-out forwards 1.5s;
    
    .decoration-line {
      width: 40px;
      height: 1px;
      background: rgba($color-gold, 0.3);
    }
    
    .subtitle {
      font-family: $font-family-base;
      font-size: 1.2rem;
      font-weight: 300;
      letter-spacing: 0.2em;
      color: rgba($text-primary, 0.8);
      margin: 0;
      text-transform: uppercase;
    }
  }

  .english-wrapper {
    margin-top: 10px;
    opacity: 0;
    animation: fadeIn 1s ease-out forwards 1.9s;
    display: flex;
    justify-content: center;
    width: 100%;
  }

  .english-title {
    font-family: $font-family-base;
    font-size: 1rem;
    font-weight: 400;
    letter-spacing: 0.08em;
    color: rgba($text-primary, 0.75);
    margin: 0;
    text-transform: none;
    max-width: 900px;
    text-align: center;
    line-height: 1.4;
  }
}

.enter-action {
  cursor: pointer;
  transition: transform 0.3s ease;
  opacity: 0;
  animation: fadeIn 1s ease-out forwards 2s;
  
  &:hover {
    transform: scale(1.05);
    
    .center-btn {
      background: rgba($color-gold, 0.1);
      border-color: $color-gold;
    }
    
    .pulse-circle {
      transform: scale(1.5);
      opacity: 0;
    }
  }
  
  .circle-text-wrapper {
    position: relative;
    width: 140px;
    height: 140px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .rotating-ring {
      position: absolute;
      width: 100%;
      height: 100%;
      animation: rotate 20s linear infinite;
    }
    
    .center-btn {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      border: 1px solid rgba($color-gold, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      transition: all 0.3s ease;
      background: rgba(0,0,0,0.3);
      backdrop-filter: blur(4px);
      z-index: 2;
    }
    
    .pulse-circle {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 1px solid rgba($color-gold, 0.2);
      transition: all 0.6s ease-out;
      z-index: 1;
    }
  }
}

@keyframes twinkle {
  0% { opacity: 0.3; }
  100% { opacity: 0.6; }
}

@keyframes drift {
  0% { transform: scaleY(0.6) translateY(20px) translateX(0); }
  100% { transform: scaleY(0.6) translateY(20px) translateX(-20px); }
}

@keyframes flow {
  0% { transform: scaleY(0.4) translateY(40px) translateX(0); }
  100% { transform: scaleY(0.4) translateY(40px) translateX(-50px); }
}

@keyframes growVertical {
  from { height: 0; opacity: 0; }
  to { height: 60px; opacity: 0.5; }
}

@keyframes fadeUpChar {
  0% {
    opacity: 0;
    transform: translate3d(0, 24px, 0);
  }
  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

@keyframes fadeIn {
  to { opacity: 1; }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.dune-wrapper {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  will-change: transform;
  transition: transform 0.1s ease-out;
}

.caravan-wrapper {
  position: absolute;
  bottom: 15%;
  left: 0;
  width: 100%;
  height: 100px;
  pointer-events: none;
  z-index: 2;
  will-change: transform;
  transition: transform 0.1s ease-out;

  &.distant {
    bottom: 22%;
    z-index: 1;
    opacity: 0.8;
    filter: blur(0.5px);
  }
}

.caravan {
  position: absolute;
  bottom: 0;
  left: -300px;
  display: flex;
  flex-direction: row-reverse;
  align-items: flex-end;
  gap: 5px;
  animation: caravanWalk 60s linear infinite;
  
  &.slow {
    animation-duration: 90s;
    left: -200px;
  }
  
  .camel {
    transform-origin: bottom center;
    animation: camelBob 2s ease-in-out infinite alternate;
    
    .leg {
      transform-origin: top center;
    }
    
    .leg-far.front-leg {
      transform-origin: 16px 28px;
      animation: legWalk 1s infinite ease-in-out alternate;
    }
    
    .leg-near.back-leg {
      transform-origin: 34px 28px;
      animation: legWalk 1s infinite ease-in-out alternate;
    }
    
    .leg-near.front-leg {
      transform-origin: 16px 28px;
      animation: legWalk 1s infinite ease-in-out alternate-reverse;
    }
    
    .leg-far.back-leg {
      transform-origin: 34px 28px;
      animation: legWalk 1s infinite ease-in-out alternate-reverse;
    }
  }

  .person {
    transform-origin: bottom center;
    margin-left: 15px;
    margin-right: 0;
    animation: personWalk 1s ease-in-out infinite alternate;
    
    .left-leg {
      transform-origin: 13px 30px;
      animation: legWalk 0.8s infinite ease-in-out alternate;
    }
    
    .right-leg {
      transform-origin: 17px 30px;
      animation: legWalk 0.8s infinite ease-in-out alternate-reverse;
    }
  }
}

@keyframes caravanWalk {
  from { transform: translateX(0); }
  to { transform: translateX(calc(100vw + 500px)); }
}

@keyframes camelBob {
  0% { transform: scaleX(-1) translateY(0) rotate(0deg); }
  100% { transform: scaleX(-1) translateY(-2px) rotate(1deg); }
}

@keyframes legWalk {
  from { transform: rotate(-20deg); }
  to { transform: rotate(20deg); }
}

@keyframes personWalk {
  0% { transform: scaleX(-1) translateY(0) rotate(-2deg); }
  100% { transform: scaleX(-1) translateY(-1px) rotate(2deg); }
}

@keyframes floatChar {
  0%, 100% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(0, -5px, 0); }
}

@media (max-width: 768px) {
  .chinese-title {
    font-size: 3rem !important;
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .subtitle {
    font-size: 0.9rem !important;
    text-align: center;
    line-height: 1.6;
  }
  
  .decoration-line {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .stars,
  .dune-mid,
  .dune-front,
  .rotating-ring {
    animation: none !important;
  }

  .main-title-group .vertical-line,
  .main-title-group .subtitle-wrapper,
  .main-title-group .chinese-title .char-wrapper,
  .enter-action {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
}
</style>

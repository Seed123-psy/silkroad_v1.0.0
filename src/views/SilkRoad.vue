<template>
  <div class="silkroad-page">
    <div class="silk-background"></div>
    
    <header class="header">
      <h1 class="title">丝绸之路 · 千年回响</h1>
      <p class="subtitle">一条连接东西方的文明纽带</p>
    </header>

    <div class="timeline-container">
      <div class="timeline-line"></div>
      
      <div v-for="group in timelineData" :key="group.dynasty.id" class="dynasty-section">
        <div class="dynasty-marker" :style="{ borderColor: group.dynasty.color }">
          <div class="dynasty-name" :style="{ backgroundColor: group.dynasty.color }">
            {{ group.dynasty.name }}
            <span class="dynasty-year">{{ group.dynasty.startYear }} ~ {{ group.dynasty.endYear }}</span>
          </div>
          <p class="dynasty-desc">{{ group.dynasty.description }}</p>
        </div>

        <div class="events-list">
          <div 
            v-for="(event, eIndex) in group.events" 
            :key="event.id" 
            class="event-card"
            :class="{ 'left': eIndex % 2 === 0, 'right': eIndex % 2 !== 0 }"
            v-observe-visibility
          >
            <div class="card-content">
              <div class="event-year">{{ formatYear(event.year) }}</div>
              <h3 class="event-title">{{ event.title }}</h3>
              <p class="event-desc">{{ event.description }}</p>
              <div class="event-tags">
                <span class="tag type-tag">{{ formatType(event.type) }}</span>
              </div>
            </div>
            <div class="connector"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import eventsData from '@/assets/data/events.json';
import dynastiesData from '@/assets/data/dynasties.json';

// Types
interface Event {
  id: string;
  title: string;
  year: number;
  dynasty: string;
  type: string;
  description: string;
}

interface Dynasty {
  id: string;
  name: string;
  startYear: number;
  endYear: number;
  color: string;
  description: string;
}

// Data Processing
const events = eventsData.events as Event[];
const dynasties = dynastiesData.dynasties as Dynasty[];

const timelineData = computed(() => {
  // Sort dynasties by start year
  const sortedDynasties = [...dynasties].sort((a, b) => a.startYear - b.startYear);
  
  return sortedDynasties.map(dynasty => {
    // Get events for this dynasty and sort by year
    const dynastyEvents = events
      .filter(e => e.dynasty === dynasty.id)
      .sort((a, b) => a.year - b.year);
      
    return {
      dynasty,
      events: dynastyEvents
    };
  }).filter(group => group.events.length > 0); // Only show dynasties with events
});

const formatYear = (year: number) => {
  return year < 0 ? `公元前${Math.abs(year)}年` : `公元${year}年`;
};

const formatType = (type: string) => {
  const map: Record<string, string> = {
    political: '政治',
    military: '军事',
    cultural: '文化',
    economic: '经济'
  };
  return map[type] || type;
};

// Simple Intersection Observer for fade-in effect
const vObserveVisibility = {
  mounted: (el: HTMLElement) => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          el.classList.add('visible');
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.1 });
    observer.observe(el);
  }
};
</script>

<style scoped>
.silkroad-page {
  min-height: 100vh;
  background-color: #0a0a0a;
  color: #e0e0e0;
  font-family: "Noto Serif SC", serif;
  position: relative;
  overflow-x: hidden;
  padding-bottom: 100px;
}

/* Silk Background Effect */
.silk-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(circle at 50% 50%, rgba(194, 160, 99, 0.05) 0%, transparent 60%),
    linear-gradient(45deg, rgba(0,0,0,1) 0%, #1a1a1a 100%);
  z-index: 0;
  pointer-events: none;
}

.silk-background::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 20px,
    rgba(212, 175, 55, 0.03) 20px,
    rgba(212, 175, 55, 0.03) 40px
  );
  animation: silk-wave 60s linear infinite;
}

@keyframes silk-wave {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.header {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 80px 20px;
  background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent);
}

.title {
  font-size: 3.5rem;
  color: #d4af37;
  margin-bottom: 10px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
  letter-spacing: 4px;
}

.subtitle {
  font-size: 1.2rem;
  color: #a0a0a0;
  letter-spacing: 2px;
}

.timeline-container {
  position: relative;
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  z-index: 1;
}

/* The Central Silk Thread */
.timeline-line {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, 
    transparent, 
    #d4af37 10%, 
    #d4af37 90%, 
    transparent
  );
  transform: translateX(-50%);
  box-shadow: 0 0 10px rgba(212, 175, 55, 0.3);
}

.dynasty-section {
  margin-bottom: 60px;
  position: relative;
}

.dynasty-marker {
  text-align: center;
  margin-bottom: 40px;
  position: relative;
  z-index: 2;
}

.dynasty-name {
  display: inline-block;
  padding: 10px 30px;
  border-radius: 50px;
  color: #000;
  font-weight: bold;
  font-size: 1.5rem;
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
  border: 2px solid rgba(255,255,255,0.2);
}

.dynasty-year {
  display: block;
  font-size: 0.9rem;
  font-weight: normal;
  opacity: 0.8;
  margin-top: 4px;
}

.dynasty-desc {
  margin-top: 15px;
  color: #ccc;
  font-style: italic;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  background: rgba(0,0,0,0.6);
  padding: 10px;
  border-radius: 8px;
}

.events-list {
  position: relative;
}

.event-card {
  position: relative;
  width: 45%;
  margin-bottom: 40px;
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.8s ease-out;
}

.event-card.visible {
  opacity: 1;
  transform: translateY(0);
}

.event-card.left {
  left: 0;
  text-align: right;
}

.event-card.right {
  left: 55%;
  text-align: left;
}

.card-content {
  background: rgba(255, 255, 255, 0.05);
  padding: 20px;
  border-radius: 8px;
  border: 1px solid rgba(212, 175, 55, 0.2);
  backdrop-filter: blur(5px);
  transition: transform 0.3s;
}

.card-content:hover {
  transform: scale(1.02);
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(212, 175, 55, 0.5);
}

.event-year {
  font-size: 1.2rem;
  color: #d4af37;
  font-weight: bold;
  margin-bottom: 5px;
}

.event-title {
  font-size: 1.4rem;
  margin: 5px 0 10px;
  color: #fff;
}

.event-desc {
  font-size: 0.95rem;
  color: #bbb;
  line-height: 1.6;
}

.event-tags {
  margin-top: 10px;
}

.tag {
  display: inline-block;
  padding: 2px 8px;
  font-size: 0.8rem;
  border-radius: 4px;
  background: rgba(212, 175, 55, 0.1);
  color: #d4af37;
  border: 1px solid rgba(212, 175, 55, 0.3);
}

/* Connector dots */
.connector {
  position: absolute;
  top: 20px;
  width: 12px;
  height: 12px;
  background: #d4af37;
  border-radius: 50%;
  box-shadow: 0 0 10px #d4af37;
}

.event-card.left .connector {
  right: -11.1%; /* Adjust based on width/margin */
}

.event-card.right .connector {
  left: -9.1%; /* Adjust based on width/margin */
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .timeline-line {
    left: 20px;
  }
  
  .event-card {
    width: calc(100% - 50px);
    left: 50px !important;
    text-align: left !important;
  }
  
  .event-card.left .connector,
  .event-card.right .connector {
    left: -36px;
    right: auto;
  }

  .title {
    font-size: 2rem;
  }
}
</style>


<template>
  <div class="trade-analytics">
    <header class="panel-header">
      <div class="panel-titles">
        <h3 class="panel-title">{{ title }}</h3>
        <p class="panel-subtitle">{{ contextLabel }}</p>
      </div>
      <div class="panel-actions">
        <div class="metric-toggle" role="group" aria-label="指标维度切换">
        <button
          type="button"
          class="metric-btn"
          :class="{ active: activeMetric === 'value' }"
          @click="setMetric('value')"
        >
          以价值观察
        </button>
        <button
          type="button"
          class="metric-btn"
          :class="{ active: activeMetric === 'volume' }"
          @click="setMetric('volume')"
        >
          以数量观察
        </button>
        </div>

        <div class="chart-controls" role="group" aria-label="图表视图切换">
          <button
            type="button"
            class="control-btn"
            :class="{ active: timelineMode === 'line' }"
            @click="timelineMode = 'line'"
            title="折线"
          >
            折线
          </button>
          <button
            type="button"
            class="control-btn"
            :class="{ active: timelineMode === 'area' }"
            @click="timelineMode = 'area'"
            title="面积图"
          >
            面积
          </button>
          <button
            type="button"
            class="control-btn"
            :class="{ active: timelineMode === 'bar' }"
            @click="timelineMode = 'bar'"
            title="柱状图"
          >
            柱状
          </button>
          <button type="button" class="control-btn" @click="exportTimelineImage" title="导出为图片">导出</button>
        </div>
      </div>
    </header>

    <section class="insight-metrics">
      <article class="metric-card">
        <span class="metric-label">总交易价值</span>
        <strong class="metric-value">{{ formatStat(metrics.totalValue, '￥') }}</strong>
        <div class="metric-spark">
          <v-chart :option="sparkOptions('value')" :autoresize="true" class="metric-spark-chart" />
        </div>
        <span class="metric-hint">涵盖当前筛选条件</span>
      </article>
      <article class="metric-card">
        <span class="metric-label">总交易量</span>
        <strong class="metric-value">{{ formatStat(metrics.totalVolume) }}</strong>
        <div class="metric-spark">
          <v-chart :option="sparkOptions('volume')" :autoresize="true" class="metric-spark-chart" />
        </div>
        <span class="metric-hint">单位指商品数量</span>
      </article>
      <article class="metric-card">
        <span class="metric-label">覆盖商品</span>
        <strong class="metric-value">{{ metrics.goodsCount }}</strong>
        <span class="metric-hint">类别越多越多维</span>
      </article>
      <article class="metric-card">
        <span class="metric-label">连接城市</span>
        <strong class="metric-value">{{ metrics.citiesCount }}</strong>
        <span class="metric-hint">含起点与终点</span>
      </article>
    </section>

    <section class="chart-grid">
      <article class="chart-card chart-card--wide">
        <header class="chart-header">
          <h4>时期走势</h4>
          <span class="chart-hint">价值与数量并行观察</span>
        </header>
        <v-chart ref="timelineChart" :option="timelineOption" :autoresize="true" class="chart" />
      </article>

      <article class="chart-card">
        <header class="chart-header">
          <h4>高频商品 TOP8</h4>
          <span class="chart-hint">{{ metricLabel }}占比</span>
        </header>
        <v-chart :option="goodsBarOption" :autoresize="true" class="chart" />
      </article>

      <article class="chart-card">
        <header class="chart-header">
          <h4>商品分类占比</h4>
          <span class="chart-hint">同样依据{{ metricLabel }}</span>
        </header>
        <v-chart :option="categoryPieOption" :autoresize="true" class="chart" />
      </article>

      <article class="chart-card chart-card--tall">
        <header class="chart-header">
          <h4>城市流向网络</h4>
          <span class="chart-hint">主干路线强度</span>
        </header>
        <v-chart :option="flowSankeyOption" :autoresize="true" class="chart" />
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart, PieChart, SankeyChart } from 'echarts/charts'
import {
  TooltipComponent,
  LegendComponent,
  GridComponent,
  TitleComponent,
  DatasetComponent,
} from 'echarts/components'
import type { EChartsOption } from 'echarts'
import type { TradeGoods, TradeRecord } from '@/types'

use([
  CanvasRenderer,
  BarChart,
  LineChart,
  PieChart,
  SankeyChart,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  TitleComponent,
  DatasetComponent,
])

type MetricKey = 'value' | 'volume'

interface Props {
  data?: TradeRecord[]
  goodsData?: TradeGoods[]
  period?: string
  city?: string
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  goodsData: () => [],
  period: undefined,
  city: undefined,
  title: '丝绸之路贸易洞察',
})

const activeMetric = ref<MetricKey>('value')

// 图表显示模式：折线 / 面积 / 柱状
const timelineMode = ref<'line' | 'area' | 'bar'>('line')

// 引用用于导出图片
const timelineChart = ref<any>(null)

const exportTimelineImage = () => {
  try {
    const echartsInstance = timelineChart.value?.getEchartsInstance?.() || timelineChart.value
    if (!echartsInstance) return
    const url = echartsInstance.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#0b1220' })
    const link = document.createElement('a')
    link.href = url
    link.download = `${props.title || 'trade-chart'}.png`
    document.body.appendChild(link)
    link.click()
    link.remove()
  } catch (err) {
    // ignore
  }
}

const sparkOptions = (key: MetricKey): EChartsOption => {
  const data = key === 'value' ? periodSeries.value.values : periodSeries.value.volumes
  if (!data || !data.length) {
    return {
      title: { text: '', left: 'center' },
    }
  }
  return {
    grid: { left: 0, right: 0, top: 0, bottom: 0 },
    xAxis: { show: false, type: 'category', data: periodSeries.value.categories },
    yAxis: { show: false, type: 'value' },
    series: [
      {
        type: 'line',
        data,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2, color: key === 'value' ? '#ff9f1c' : '#5ec4ff' },
        areaStyle: { color: key === 'value' ? 'rgba(255,159,28,0.12)' : 'rgba(94,196,255,0.08)' },
      },
    ],
    tooltip: { show: false },
    animation: false,
  }
}

const periodNames: Record<string, string> = {
  han: '汉朝',
  tang: '唐朝',
  song: '宋朝',
  yuan: '元朝',
  ming: '明朝',
  qing: '清朝',
}

const palette = [
  '#f4a259',
  '#5b8def',
  '#ce5a57',
  '#6fb98f',
  '#a26ea1',
  '#ffd166',
  '#6c63ff',
  '#06d6a0',
]

const filteredData = computed(() => {
  let result = [...props.data]
  if (props.period) {
    result = result.filter(record => record.period === props.period)
  }
  if (props.city) {
    result = result.filter(record => record.fromCity === props.city || record.toCity === props.city)
  }
  return result
})

const goodsLookup = computed(() => {
  const map = new Map<string, TradeGoods>()
  props.goodsData.forEach(goods => {
    map.set(goods.id, goods)
  })
  return map
})

const metrics = computed(() => {
  const totalValue = filteredData.value.reduce((sum, item) => sum + item.value, 0)
  const totalVolume = filteredData.value.reduce((sum, item) => sum + item.volume, 0)
  const goodsSet = new Set(filteredData.value.map(item => item.goods))
  const citySet = new Set<string>()
  filteredData.value.forEach(item => {
    citySet.add(item.fromCity)
    citySet.add(item.toCity)
  })
  return {
    totalValue,
    totalVolume,
    goodsCount: goodsSet.size,
    citiesCount: citySet.size,
  }
})

const contextLabel = computed(() => {
  const parts: string[] = []
  parts.push(props.period ? periodNames[props.period] || props.period : '全部时期')
  parts.push(props.city ? `${props.city}相关` : '全部城市')
  return parts.join(' · ')
})

const metricLabel = computed(() => (activeMetric.value === 'value' ? '交易价值' : '交易量'))

const setMetric = (metric: MetricKey) => {
  activeMetric.value = metric
}

const goodsRanking = computed(() => {
  const aggregates = new Map<
    string,
    { name: string; category: string; value: number; volume: number }
  >()
  filteredData.value.forEach(record => {
    const goods = goodsLookup.value.get(record.goods)
    const name = goods?.name || record.goods
    const category = goods?.category || 'other'
    const entry = aggregates.get(record.goods) || { name, category, value: 0, volume: 0 }
    entry.value += record.value
    entry.volume += record.volume
    aggregates.set(record.goods, entry)
  })
  const sorted = Array.from(aggregates.values())
  const key: MetricKey = activeMetric.value
  sorted.sort((a, b) => b[key] - a[key])
  return sorted
})

const goodsCategoryBreakdown = computed(() => {
  const categoryMap = new Map<string, { value: number; volume: number }>()
  filteredData.value.forEach(record => {
    const goods = goodsLookup.value.get(record.goods)
    const category = goods?.category || 'other'
    const entry = categoryMap.get(category) || { value: 0, volume: 0 }
    entry.value += record.value
    entry.volume += record.volume
    categoryMap.set(category, entry)
  })
  return Array.from(categoryMap.entries()).map(([category, stats]) => ({
    category,
    value: stats.value,
    volume: stats.volume,
  }))
})

const periodSeries = computed(() => {
  const order = ['han', 'tang', 'song', 'yuan', 'ming', 'qing']
  const periodMap = new Map<string, { value: number; volume: number }>()
  filteredData.value.forEach(record => {
    const entry = periodMap.get(record.period) || { value: 0, volume: 0 }
    entry.value += record.value
    entry.volume += record.volume
    periodMap.set(record.period, entry)
  })
  const categories: string[] = []
  const values: number[] = []
  const volumes: number[] = []
  order.forEach(period => {
    if (periodMap.has(period)) {
      categories.push(periodNames[period] || period)
      values.push(periodMap.get(period)!.value)
      volumes.push(periodMap.get(period)!.volume)
    }
  })
  return { categories, values, volumes }
})

const flowDataset = computed(() => {
  const flowMap = new Map<string, { source: string; target: string; value: number; volume: number }>()
  filteredData.value.forEach(record => {
    const key = `${record.fromCity}->${record.toCity}`
    const entry = flowMap.get(key) || {
      source: record.fromCity,
      target: record.toCity,
      value: 0,
      volume: 0,
    }
    entry.value += record.value
    entry.volume += record.volume
    flowMap.set(key, entry)
  })
  const key: MetricKey = activeMetric.value
  const flows = Array.from(flowMap.values())
  flows.sort((a, b) => b[key] - a[key])
  const trimmed = flows.slice(0, 18)
  const nodes = new Map<string, { name: string }>()
  trimmed.forEach(item => {
    nodes.set(item.source, { name: item.source })
    nodes.set(item.target, { name: item.target })
  })
  return {
    nodes: Array.from(nodes.values()),
    links: trimmed.map(item => ({
      source: item.source,
      target: item.target,
      value: item[key],
    })),
  }
})

const emptyOption = (text: string): EChartsOption => ({
  title: {
    text,
    left: 'center',
    top: 'middle',
    textStyle: {
      color: '#8795af',
      fontSize: 14,
    },
  },
})

const timelineOption = computed<EChartsOption>(() => {
  if (!periodSeries.value.categories.length) {
    return emptyOption('暂无时期数据')
  }

  const seriesType = timelineMode.value === 'bar' ? 'bar' : 'line'
  const showArea = timelineMode.value === 'area'

  const lineStyles = {
    value: {
      color: '#ff9f1c',
      area: 'rgba(255, 159, 28, 0.18)',
      width: activeMetric.value === 'value' ? 4 : 2,
      opacity: activeMetric.value === 'value' ? 1 : 0.6,
    },
    volume: {
      color: '#5ec4ff',
      area: 'rgba(94, 196, 255, 0.16)',
      width: activeMetric.value === 'volume' ? 4 : 2,
      opacity: activeMetric.value === 'volume' ? 1 : 0.6,
    },
  }

  const baseSeries = (name: string, data: number[], style: any) => {
    const s: any = {
      name,
      type: seriesType,
      data,
      smooth: seriesType === 'line',
      showSymbol: false,
      lineStyle: {
        color: style.color,
        width: style.width,
        opacity: style.opacity,
      },
      itemStyle: { opacity: style.opacity },
      emphasis: { focus: 'series' },
    }
    if (showArea && seriesType === 'line') {
      s.areaStyle = { color: style.area }
    }
    return s
  }

  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.88)',
      borderWidth: 0,
      textStyle: { color: '#e2e8f0' },
      formatter: (params: any) => {
        if (!Array.isArray(params)) return ''
        const lines = [`${params[0].axisValue}`]
        params.forEach((item: any) => {
          lines.push(`${item.marker} ${item.seriesName}: ${formatStat(item.value)}`)
        })
        return lines.join('<br/>')
      },
    },
    legend: { data: ['交易价值', '交易量'], top: 12, textStyle: { color: '#cbd5f5' } },
    grid: { top: 60, left: '3%', right: '3%', bottom: 20, containLabel: true },
    xAxis: {
      type: 'category',
      data: periodSeries.value.categories,
      axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.4)' } },
      axisLabel: { color: '#cbd5f5' },
      boundaryGap: seriesType === 'bar',
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisLabel: { color: '#cbd5f5', formatter: (val: number) => formatStat(val) },
      splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.15)' } },
    },
    series: [
      baseSeries('交易价值', periodSeries.value.values, lineStyles.value),
      baseSeries('交易量', periodSeries.value.volumes, lineStyles.volume),
    ],
    color: ['#ff9f1c', '#5ec4ff'],
  }
})

const goodsBarOption = computed<EChartsOption>(() => {
  const ranking = goodsRanking.value.slice(0, 8)
  if (!ranking.length) {
    return emptyOption('暂无商品数据')
  }
  const categories = ranking.map(item => item.name).reverse()
  const values = ranking.map(item => item[activeMetric.value]).reverse()
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(15, 23, 42, 0.88)',
      borderWidth: 0,
      textStyle: { color: '#e2e8f0' },
      formatter: (params: any) => {
        if (!Array.isArray(params) || !params.length) return ''
        const { axisValue, value } = params[0]
        return `${axisValue}<br/>${metricLabel.value}: ${formatStat(value)}`
      },
    },
    grid: {
      top: 24,
      left: 0,
      right: 0,
      bottom: 0,
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      axisLabel: { color: '#cbd5f5', formatter: (val: number) => formatStat(val) },
      splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.15)' } },
    },
    yAxis: {
      type: 'category',
      data: categories,
      axisLabel: { color: '#e2e8f0' },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'bar',
        data: values,
        barWidth: 16,
        itemStyle: {
          borderRadius: [0, 12, 12, 0],
          color: (params: { dataIndex: number }) => pickColor(params.dataIndex),
        },
        label: {
          show: true,
          position: 'right',
          color: '#cbd5f5',
          formatter: (val: any) => formatStat(val.value),
        },
      },
    ],
  }
})

const categoryPieOption = computed<EChartsOption>(() => {
  const dataset = goodsCategoryBreakdown.value
  if (!dataset.length) {
    return emptyOption('暂无分类数据')
  }
  const legendLabels = dataset.map(item => categoryLabel(item.category))
  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(15, 23, 42, 0.88)',
      borderWidth: 0,
      textStyle: { color: '#e2e8f0' },
      formatter: (params: any) => {
        return `${params.marker} ${params.name}<br/>${metricLabel.value}: ${formatStat(params.value)}<br/>占比: ${params.percent}%`
      },
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      textStyle: { color: '#cbd5f5' },
      data: legendLabels,
    },
    series: [
      {
        type: 'pie',
        radius: ['35%', '70%'],
        center: ['50%', '45%'],
        roseType: 'radius',
        label: {
          color: '#e2e8f0',
          formatter: '{b}\n{d}%',
        },
        labelLine: {
          smooth: true,
          length: 14,
          length2: 6,
        },
        itemStyle: {
          borderRadius: 8,
          borderColor: '#0f172a',
          borderWidth: 2,
        },
        data: dataset.map((item, index) => ({
          name: categoryLabel(item.category),
          value: item[activeMetric.value],
          itemStyle: {
            color: pickColor(index),
          },
        })),
      },
    ],
  }
})

const flowSankeyOption = computed<EChartsOption>(() => {
  if (!flowDataset.value.links.length) {
    return emptyOption('暂无流向数据')
  }
  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(15, 23, 42, 0.88)',
      borderWidth: 0,
      textStyle: { color: '#e2e8f0' },
      formatter: (params: any) => {
        if (params.dataType === 'edge') {
          return `${params.data.source} → ${params.data.target}<br/>${metricLabel.value}: ${formatStat(params.data.value)}`
        }
        return params.name
      },
    },
    series: [
      {
        type: 'sankey',
        data: flowDataset.value.nodes,
        links: flowDataset.value.links,
        nodeGap: 18,
        nodeWidth: 16,
        layoutIterations: 0,
        draggable: false,
        lineStyle: {
          color: 'source',
          opacity: 0.45,
          curveness: 0.5,
        },
        itemStyle: {
          borderWidth: 1,
          borderColor: '#1e2330',
        },
        label: {
          color: '#e2e8f0',
          fontSize: 12,
        },
        emphasis: {
          focus: 'adjacency',
        },
        color: palette,
      },
    ],
  }
})

const pickColor = (index: number): string => {
  if (!palette.length) {
    return '#5b8def'
  }
  return palette[Math.abs(index) % palette.length] || '#5b8def'
}

const categoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    textile: '纺织品',
    spice: '香料',
    metal: '金属',
    ceramic: '陶瓷',
    other: '其他',
  }
  return labels[category] || category
}

const formatStat = (value: number, prefix = '') => {
  if (!Number.isFinite(value)) return `${prefix}0`
  const abs = Math.abs(value)
  let formatted = value.toFixed(0)
  let unit = ''
  if (abs >= 1_0000_0000) {
    formatted = (value / 1_0000_0000).toFixed(2)
    unit = '亿'
  } else if (abs >= 1_0000) {
    formatted = (value / 1_0000).toFixed(1)
    unit = '万'
  } else if (abs >= 1_000) {
    formatted = (value / 1_000).toFixed(1)
    unit = '千'
  }
  return `${prefix}${parseFloat(formatted)}${unit}`
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;
@use '@/assets/styles/mixins.scss' as *;

.trade-analytics {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
  width: 100%;
  color: $text-inverse;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: $spacing-lg;
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.chart-controls {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  margin-left: 6px;
}

.control-btn {
  border: none;
  background: transparent;
  color: rgba(255,255,255,0.65);
  padding: 6px 10px;
  font-size: 13px;
  border-radius: $border-radius-lg;
  cursor: pointer;
  transition: all $transition-duration-fast $transition-timing-function;
}

.control-btn.active {
  background: rgba(255,255,255,0.08);
  color: $text-inverse;
  box-shadow: 0 6px 14px rgba(14, 30, 55, 0.25);
}

.panel-titles {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.panel-title {
  margin: 0;
  font-size: 24px;
  letter-spacing: 0.04em;
}

.panel-subtitle {
  margin: 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}

.metric-toggle {
  display: inline-flex;
  background: rgba(255, 255, 255, 0.06);
  border-radius: $border-radius-xl;
  padding: 4px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.metric-btn {
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.65);
  padding: 6px 14px;
  font-size: 13px;
  border-radius: $border-radius-lg;
  cursor: pointer;
  transition: all $transition-duration-fast $transition-timing-function;

  &.active {
    background: rgba(255, 255, 255, 0.18);
    color: $text-inverse;
    box-shadow: 0 6px 16px rgba(14, 30, 55, 0.35);
  }

  &:hover:not(.active) {
    color: $text-inverse;
  }
}

.insight-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: $spacing-md;
}

.metric-card {
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.04));
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: $border-radius-xl;
  padding: $spacing-md;
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  box-shadow: 0 20px 45px rgba(10, 15, 30, 0.45);
}

.metric-spark {
  width: 100%;
  height: 40px;
  margin-top: 8px;
}

.metric-spark-chart {
  width: 100%;
  height: 100%;
}

.metric-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.metric-value {
  font-size: 26px;
  font-weight: $font-weight-bold;
  letter-spacing: 0.02em;
}

.metric-hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: minmax(280px, auto);
  gap: $spacing-lg;
}

.chart-card {
  background: rgba(9, 14, 28, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: $border-radius-xl;
  padding: $spacing-md;
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.3);
}

.chart-card--wide {
  grid-column: span 2;
}

.chart-card--tall {
  grid-row: span 2;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $spacing-sm;

  h4 {
    margin: 0;
    font-size: 16px;
    letter-spacing: 0.02em;
  }
}

.chart-hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
}

.chart {
  width: 100%;
  height: 100%;
  flex: 1;
}

@include tablet {
  .insight-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .chart-grid {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }

  .chart-card--wide,
  .chart-card--tall {
    grid-column: span 1;
    grid-row: span 1;
  }
}

@include mobile {
  .panel-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .panel-title {
    font-size: 20px;
  }

  .metric-toggle {
    width: 100%;
    justify-content: space-between;
  }

  .metric-card {
    padding: $spacing-sm;
  }

  .chart-card {
    padding: $spacing-sm;
  }
}
</style>

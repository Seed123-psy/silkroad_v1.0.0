/**
 * Chart Store - 图表状态管理
 * 管理图表类型、数据和导出功能
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { exportToJSON, exportToCSV, exportChartAsImage } from '@/services/exportService'

/**
 * 图表类型
 */
export type ChartType = 'bar' | 'line' | 'pie'

/**
 * 导出格式
 */
export type ExportFormat = 'json' | 'csv' | 'image'

/**
 * 图表数据接口
 */
export interface ChartData {
  labels?: string[]
  datasets?: any[]
  series?: any[]
  [key: string]: any
}

export const useChartStore = defineStore('chart', () => {
  // 状态
  const chartType = ref<ChartType>('bar')
  const chartData = ref<ChartData>({})
  const exportFormat = ref<ExportFormat>('json')

  // Actions
  /**
   * 设置图表类型
   * @param type - 图表类型（bar、line、pie）
   */
  const setChartType = (type: ChartType): void => {
    if (!['bar', 'line', 'pie'].includes(type)) {
      console.warn(`Invalid chart type: ${type}. Using default 'bar'.`)
      chartType.value = 'bar'
      return
    }
    chartType.value = type
  }

  /**
   * 更新图表数据
   * @param data - 新的图表数据
   */
  const updateChartData = (data: ChartData): void => {
    if (!data || typeof data !== 'object') {
      console.warn('Invalid chart data provided')
      return
    }
    chartData.value = { ...data }
  }

  /**
   * 导出数据
   * @param format - 导出格式（json、csv、image）
   * @param filename - 文件名（不含扩展名）
   * @param chartInstance - 图表实例（导出图片时需要）
   */
  const exportData = (
    format: ExportFormat,
    filename: string = 'chart-data',
    chartInstance?: any
  ): void => {
    try {
      exportFormat.value = format

      switch (format) {
        case 'json':
          exportToJSON(chartData.value, filename)
          break

        case 'csv': {
          // 将图表数据转换为适合CSV的数组格式
          const csvData = convertChartDataToCSV(chartData.value)
          if (csvData.length === 0) {
            console.warn('No data available for CSV export')
            return
          }
          exportToCSV(csvData, filename)
          break
        }

        case 'image':
          if (!chartInstance) {
            console.error('Chart instance is required for image export')
            throw new Error('图表实例不能为空')
          }
          exportChartAsImage(chartInstance, filename, {
            type: 'png',
            pixelRatio: 2,
            backgroundColor: '#ffffff',
          })
          break

        default:
          console.warn(`Unsupported export format: ${format}`)
      }
    } catch (error) {
      console.error('Export failed:', error)
      throw error
    }
  }

  /**
   * 重置图表状态
   */
  const resetChart = (): void => {
    chartType.value = 'bar'
    chartData.value = {}
    exportFormat.value = 'json'
  }

  return {
    // 状态
    chartType,
    chartData,
    exportFormat,
    // Actions
    setChartType,
    updateChartData,
    exportData,
    resetChart,
  }
})

/**
 * 将图表数据转换为CSV格式的数组
 * @param data - 图表数据
 * @returns CSV格式的数据数组
 */
function convertChartDataToCSV(data: ChartData): any[] {
  const csvData: any[] = []

  // 处理包含datasets的数据结构（常见于bar和line图表）
  if (data.datasets && Array.isArray(data.datasets) && data.labels) {
    const labels = data.labels
    const datasets = data.datasets

    // 为每个数据点创建一行
    labels.forEach((label, index) => {
      const row: any = { label }
      datasets.forEach(dataset => {
        const datasetName = dataset.label || dataset.name || 'value'
        row[datasetName] = dataset.data?.[index] ?? ''
      })
      csvData.push(row)
    })
  }
  // 处理包含series的数据结构（常见于pie图表）
  else if (data.series && Array.isArray(data.series)) {
    data.series.forEach(item => {
      csvData.push({
        name: item.name || '',
        value: item.value ?? '',
        ...item,
      })
    })
  }
  // 处理其他数据结构
  else if (Array.isArray(data)) {
    return data
  }
  // 如果数据是对象，尝试将其转换为数组
  else if (typeof data === 'object' && data !== null) {
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        csvData.push({ key, ...value })
      } else {
        csvData.push({ key, value })
      }
    })
  }

  return csvData
}

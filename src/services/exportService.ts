/**
 * 导出服务
 * 提供数据导出功能，支持JSON、CSV和图表图片导出
 */

/**
 * 导出数据为JSON文件
 * @param data - 要导出的数据对象
 * @param filename - 文件名（不含扩展名）
 */
export function exportToJSON(data: any, filename: string): void {
  try {
    // 将数据转换为格式化的JSON字符串
    const jsonString = JSON.stringify(data, null, 2)

    // 创建Blob对象
    const blob = new Blob([jsonString], { type: 'application/json' })

    // 创建下载链接
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.json`

    // 触发下载
    document.body.appendChild(link)
    link.click()

    // 清理
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('导出JSON失败:', error)
    throw new Error('导出JSON文件失败')
  }
}

/**
 * 导出数据为CSV文件
 * @param data - 要导出的数据数组
 * @param filename - 文件名（不含扩展名）
 */
export function exportToCSV(data: any[], filename: string): void {
  try {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('数据必须是非空数组')
    }

    // 获取所有列名（从第一个对象的键）
    const headers = Object.keys(data[0])

    // 创建CSV内容
    const csvRows: string[] = []

    // 添加表头
    csvRows.push(headers.join(','))

    // 添加数据行
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header]

        // 处理特殊字符和换行符
        if (value === null || value === undefined) {
          return ''
        }

        const stringValue = String(value)

        // 如果包含逗号、引号或换行符，需要用引号包裹并转义引号
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }

        return stringValue
      })

      csvRows.push(values.join(','))
    }

    // 合并所有行
    const csvString = csvRows.join('\n')

    // 添加BOM以支持Excel正确显示中文
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvString], { type: 'text/csv;charset=utf-8;' })

    // 创建下载链接
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.csv`

    // 触发下载
    document.body.appendChild(link)
    link.click()

    // 清理
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('导出CSV失败:', error)
    throw new Error('导出CSV文件失败')
  }
}

/**
 * 导出ECharts图表为图片
 * @param chartInstance - ECharts图表实例
 * @param filename - 文件名（不含扩展名）
 * @param options - 导出选项
 */
export function exportChartAsImage(
  chartInstance: any,
  filename: string,
  options?: {
    type?: 'png' | 'jpeg'
    pixelRatio?: number
    backgroundColor?: string
  }
): void {
  try {
    if (!chartInstance) {
      throw new Error('图表实例不能为空')
    }

    // 默认选项
    const defaultOptions = {
      type: 'png' as const,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
    }

    const exportOptions = { ...defaultOptions, ...options }

    // 使用ECharts的getDataURL方法获取图片数据
    const dataURL = chartInstance.getDataURL({
      type: exportOptions.type,
      pixelRatio: exportOptions.pixelRatio,
      backgroundColor: exportOptions.backgroundColor,
    })

    // 创建下载链接
    const link = document.createElement('a')
    link.href = dataURL
    link.download = `${filename}.${exportOptions.type}`

    // 触发下载
    document.body.appendChild(link)
    link.click()

    // 清理
    document.body.removeChild(link)
  } catch (error) {
    console.error('导出图表图片失败:', error)
    throw new Error('导出图表图片失败')
  }
}

/**
 * 导出服务类（可选的面向对象封装）
 */
export class ExportService {
  /**
   * 导出为JSON
   */
  exportToJSON(data: any, filename: string): void {
    exportToJSON(data, filename)
  }

  /**
   * 导出为CSV
   */
  exportToCSV(data: any[], filename: string): void {
    exportToCSV(data, filename)
  }

  /**
   * 导出图表为图片
   */
  exportChartAsImage(
    chartInstance: any,
    filename: string,
    options?: {
      type?: 'png' | 'jpeg'
      pixelRatio?: number
      backgroundColor?: string
    }
  ): void {
    exportChartAsImage(chartInstance, filename, options)
  }
}

// 导出默认实例
export default new ExportService()

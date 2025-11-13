/**
 * 数据处理工具函数
 * 提供数据分组、聚合和统计计算功能
 */

import type { TradeRecord, TradeData } from '@/types'

/**
 * 按时期分组数据
 * @param data 要分组的数据数组
 * @param periodKey 时期字段的键名
 * @returns 按时期分组的对象，键为时期，值为该时期的数据数组
 *
 * @example
 * const cities = [
 *   { id: '1', name: 'City1', period: ['han', 'tang'] },
 *   { id: '2', name: 'City2', period: ['tang'] }
 * ]
 * const grouped = groupByPeriod(cities, 'period')
 * // 结果: { han: [city1], tang: [city1, city2] }
 */
export function groupByPeriod<T extends Record<string, any>>(
  data: T[],
  periodKey: string = 'period'
): Record<string, T[]> {
  const grouped: Record<string, T[]> = {}

  data.forEach(item => {
    const periodValue = item[periodKey]

    // 处理单个时期字符串
    if (typeof periodValue === 'string') {
      if (!grouped[periodValue]) {
        grouped[periodValue] = []
      }
      grouped[periodValue].push(item)
    }
    // 处理时期数组（一个项目可能属于多个时期）
    else if (Array.isArray(periodValue)) {
      periodValue.forEach((period: string) => {
        if (!grouped[period]) {
          grouped[period] = []
        }
        grouped[period].push(item)
      })
    }
  })

  return grouped
}

/**
 * 聚合贸易数据
 * @param records 贸易记录数组
 * @param groupBy 分组依据：'city'（城市）、'goods'（商品）或'period'（时期）
 * @returns 聚合后的贸易数据数组
 *
 * @example
 * const records = [
 *   { period: 'tang', city: 'xian', goods: 'silk', volume: 100, value: 1000 },
 *   { period: 'tang', city: 'xian', goods: 'silk', volume: 50, value: 500 }
 * ]
 * const aggregated = aggregateTradeData(records, 'city')
 * // 结果: [{ period: 'tang', city: 'xian', goods: 'silk', volume: 150, value: 1500 }]
 */
export function aggregateTradeData(
  records: TradeRecord[],
  groupBy: 'city' | 'goods' | 'period'
): TradeData[] {
  // 创建聚合映射
  const aggregationMap = new Map<string, TradeData>()

  records.forEach(record => {
    // 根据分组依据生成唯一键
    let key: string
    switch (groupBy) {
      case 'city':
        // 按城市分组：period-fromCity-goods
        key = `${record.period}-${record.fromCity}-${record.goods}`
        break
      case 'goods':
        // 按商品分组：period-goods
        key = `${record.period}-${record.goods}`
        break
      case 'period':
        // 按时期分组：period-goods
        key = `${record.period}-${record.goods}`
        break
      default:
        key = `${record.period}-${record.fromCity}-${record.goods}`
    }

    // 获取或创建聚合数据
    if (aggregationMap.has(key)) {
      const existing = aggregationMap.get(key)!
      existing.volume += record.volume
      existing.value += record.value
    } else {
      const tradeData: TradeData = {
        period: record.period,
        city: groupBy === 'city' ? record.fromCity : '',
        goods: record.goods,
        volume: record.volume,
        value: record.value,
      }
      aggregationMap.set(key, tradeData)
    }
  })

  // 转换为数组并返回
  return Array.from(aggregationMap.values())
}

/**
 * 计算统计数据
 * @param data 数值数组
 * @returns 包含平均值、中位数、最大值和最小值的统计对象
 *
 * @example
 * const values = [10, 20, 30, 40, 50]
 * const stats = calculateStatistics(values)
 * // 结果: { mean: 30, median: 30, max: 50, min: 10 }
 */
export function calculateStatistics(data: number[]): {
  mean: number
  median: number
  max: number
  min: number
} {
  // 处理空数组
  if (data.length === 0) {
    return {
      mean: 0,
      median: 0,
      max: 0,
      min: 0,
    }
  }

  // 过滤掉非数字值
  const validData = data.filter(value => typeof value === 'number' && !isNaN(value))

  if (validData.length === 0) {
    return {
      mean: 0,
      median: 0,
      max: 0,
      min: 0,
    }
  }

  // 计算平均值
  const sum = validData.reduce((acc, val) => acc + val, 0)
  const mean = sum / validData.length

  // 计算中位数
  const sorted = [...validData].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  let median: number
  if (sorted.length % 2 === 0) {
    median = ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
  } else {
    median = sorted[mid] ?? 0
  }

  // 计算最大值和最小值
  const max = Math.max(...validData)
  const min = Math.min(...validData)

  return {
    mean: Math.round(mean * 100) / 100, // 保留两位小数
    median: Math.round(median * 100) / 100,
    max,
    min,
  }
}

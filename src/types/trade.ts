/**
 * 贸易相关类型定义
 */

/**
 * 贸易记录接口
 */
export interface TradeRecord {
  id: string
  period: string
  fromCity: string
  toCity: string
  goods: string
  volume: number
  value: number
  route: string
}

/**
 * 贸易商品接口
 */
export interface TradeGoods {
  id: string
  name: string
  category: 'textile' | 'spice' | 'metal' | 'ceramic' | 'other'
  origin: string[]
  destination: string[]
  peakPeriod: string
}

/**
 * 贸易数据接口（用于图表展示）
 */
export interface TradeData {
  period: string
  city: string
  goods: string
  volume: number
  value: number
}

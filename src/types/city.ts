/**
 * 城市相关类型定义
 */

/**
 * 城市接口
 */
export interface City {
  id: string
  name: string
  nameEn: string
  lat: number
  lng: number
  description: string
  period: string[]
  importance: number // 1-5
  population?: number
  tradeItems?: string[] // 主要贸易商品
  culturalExchange?: string // 文化交流描述
  geography?: string // 地理位置
  events?: string[] // 历史事件
  modernSites?: string[] // 现代遗址
  images: string[]
}

/**
 * 路线接口
 */
export interface Route {
  id: string
  name: string
  nameEn: string
  type: 'land' | 'sea'
  description: string
  period: string[]
  color: string
  weight: number
  coordinates: [number, number][] // [lat, lng]
  cities: string[]
  points?: [number, number][] // 向后兼容的可选字段
}

/**
 * 朝代接口
 */
export interface Dynasty {
  id: string
  name: string
  startYear: number
  endYear: number
  color: string
}

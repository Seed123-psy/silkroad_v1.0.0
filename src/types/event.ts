/**
 * 历史事件相关类型定义
 */

/**
 * 历史事件接口
 */
export interface HistoricalEvent {
  id: string
  title: string
  year: number
  dynasty: string
  type: 'political' | 'economic' | 'cultural' | 'military'
  description: string
  importance: number // 1-5
  relatedCities: string[]
  relatedRoutes: string[]
  images?: string[]
  references?: string[]
}

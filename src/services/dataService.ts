/**
 * 数据服务 - 负责加载和处理应用数据
 */

import type {
  City,
  Route,
  Dynasty,
  HistoricalEvent,
  TradeRecord,
  TradeGoods,
  CulturalSite,
  DisplayPresetsConfig,
} from '@/types'

/**
 * 数据服务类
 */
class DataService {
  private citiesCache: City[] | null = null
  private routesCache: Route[] | null = null
  private dynastiesCache: Dynasty[] | null = null
  private eventsCache: HistoricalEvent[] | null = null
  private tradeRecordsCache: TradeRecord[] | null = null
  private tradeGoodsCache: TradeGoods[] | null = null
  private sitesCache: CulturalSite[] | null = null
  private displayPresetsCache: DisplayPresetsConfig | null = null

  /**
   * 加载城市数据
   */
  async loadCities(): Promise<City[]> {
    if (this.citiesCache) {
      return this.citiesCache
    }

    try {
      // 使用动态导入来加载JSON文件
      const data = await import('@/assets/data/cities.json')

      // 转换数据格式以匹配City接口
      const cities: City[] = data.default.cities.map((city: any) => ({
        id: city.id,
        name: city.name,
        nameEn: city.nameEn,
        lat: city.lat,
        lng: city.lng,
        description: city.description,
        period: city.period,
        importance: city.importance,
        population: city.population,
        trades: city.tradeItems || [],
        culture: city.culturalExchange ? [city.culturalExchange] : [],
        images: city.images,
      }))

      this.citiesCache = cities
      return cities
    } catch (error) {
      console.error('Error loading cities:', error)
      throw error
    }
  }

  /**
   * 加载路线数据
   */
  async loadRoutes(): Promise<Route[]> {
    if (this.routesCache) {
      return this.routesCache
    }

    try {
      const response = await fetch('/src/assets/data/routes.json')
      if (!response.ok) {
        throw new Error(`Failed to load routes: ${response.statusText}`)
      }
      const data = await response.json()

      // 转换数据格式以匹配Route接口
      const routes: Route[] = data.routes.map((route: any) => ({
        id: route.id,
        name: route.name,
        nameEn: route.nameEn,
        type: route.type,
        description: route.description,
        period: route.period,
        color: route.color,
        weight: route.weight,
        coordinates: route.coordinates,
        cities: route.cities,
      }))

      this.routesCache = routes
      return routes
    } catch (error) {
      console.error('Error loading routes:', error)
      throw error
    }
  }

  /**
   * 加载朝代数据
   */
  async loadDynasties(): Promise<Dynasty[]> {
    if (this.dynastiesCache) {
      return this.dynastiesCache
    }

    try {
      const response = await fetch('/src/assets/data/dynasties.json')
      if (!response.ok) {
        throw new Error(`Failed to load dynasties: ${response.statusText}`)
      }
      const data = await response.json()
      const dynasties: Dynasty[] = data.dynasties
      this.dynastiesCache = dynasties
      return dynasties
    } catch (error) {
      console.error('Error loading dynasties:', error)
      throw error
    }
  }

  /**
   * 加载历史事件数据
   */
  async loadEvents(): Promise<HistoricalEvent[]> {
    if (this.eventsCache) {
      return this.eventsCache
    }

    try {
      const response = await fetch('/src/assets/data/events.json')
      if (!response.ok) {
        throw new Error(`Failed to load events: ${response.statusText}`)
      }
      const data = await response.json()
      const events: HistoricalEvent[] = data.events
      this.eventsCache = events
      return events
    } catch (error) {
      console.error('Error loading events:', error)
      throw error
    }
  }

  /**
   * 加载贸易数据
   */
  async loadTradeData(): Promise<{ records: TradeRecord[]; goods: TradeGoods[] }> {
    if (this.tradeRecordsCache && this.tradeGoodsCache) {
      return {
        records: this.tradeRecordsCache,
        goods: this.tradeGoodsCache,
      }
    }

    try {
      const response = await fetch('/src/assets/data/trades.json')
      if (!response.ok) {
        throw new Error(`Failed to load trade data: ${response.statusText}`)
      }
      const data = await response.json()
      const records: TradeRecord[] = data.tradeRecords
      const goods: TradeGoods[] = data.tradeGoods

      this.tradeRecordsCache = records
      this.tradeGoodsCache = goods

      return {
        records,
        goods,
      }
    } catch (error) {
      console.error('Error loading trade data:', error)
      throw error
    }
  }

  /**
   * 加载遗址数据
   */
  async loadSites(): Promise<CulturalSite[]> {
    if (this.sitesCache) {
      return this.sitesCache
    }

    try {
      const response = await fetch('/src/assets/data/sites.json')
      if (!response.ok) {
        throw new Error(`Failed to load sites: ${response.statusText}`)
      }
      const data = await response.json()
      const sites: CulturalSite[] = data.sites
      this.sitesCache = sites
      return sites
    } catch (error) {
      console.error('Error loading sites:', error)
      throw error
    }
  }

  /**
   * 加载展示预设配置
   */
  async loadDisplayPresets(): Promise<DisplayPresetsConfig> {
    if (this.displayPresetsCache) {
      return this.displayPresetsCache
    }

    try {
      const response = await fetch('/src/assets/data/displayPresets.json')
      if (!response.ok) {
        throw new Error(`Failed to load display presets: ${response.statusText}`)
      }
      const presets: DisplayPresetsConfig = await response.json()
      this.displayPresetsCache = presets
      return presets
    } catch (error) {
      console.error('Error loading display presets:', error)
      throw error
    }
  }

  /**
   * 加载GeoJSON数据
   */
  async loadGeoJSON(type: string): Promise<any> {
    try {
      const response = await fetch(`/src/assets/geojson/${type}.geojson`)
      if (!response.ok) {
        throw new Error(`Failed to load GeoJSON (${type}): ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error(`Error loading GeoJSON (${type}):`, error)
      throw error
    }
  }

  /**
   * 根据时期筛选数据
   */
  filterByPeriod<T extends { period: string | string[] }>(data: T[], period: string): T[] {
    return data.filter(item => {
      if (Array.isArray(item.period)) {
        return item.period.includes(period)
      }
      return item.period === period
    })
  }

  /**
   * 根据城市筛选数据
   */
  filterByCity<T extends { relatedCities?: string[]; fromCity?: string; toCity?: string }>(
    data: T[],
    cityId: string
  ): T[] {
    return data.filter(item => {
      // 检查relatedCities字段（用于历史事件）
      if (item.relatedCities) {
        return item.relatedCities.includes(cityId)
      }

      // 检查fromCity和toCity字段（用于贸易记录）
      if (item.fromCity || item.toCity) {
        return item.fromCity === cityId || item.toCity === cityId
      }

      return false
    })
  }

  /**
   * 根据城市名称筛选数据
   */
  filterByCityName<T extends { fromCity?: string; toCity?: string }>(
    data: T[],
    cityName: string
  ): T[] {
    return data.filter(item => {
      return item.fromCity === cityName || item.toCity === cityName
    })
  }

  /**
   * 根据朝代筛选数据
   */
  filterByDynasty<T extends { dynasty: string | string[] }>(data: T[], dynasty: string): T[] {
    return data.filter(item => {
      if (Array.isArray(item.dynasty)) {
        return item.dynasty.includes(dynasty)
      }
      return item.dynasty === dynasty
    })
  }

  /**
   * 根据类型筛选数据
   */
  filterByType<T extends { type: string }>(data: T[], type: string): T[] {
    return data.filter(item => item.type === type)
  }

  /**
   * 根据重要性筛选数据
   */
  filterByImportance<T extends { importance: number }>(data: T[], minImportance: number): T[] {
    return data.filter(item => item.importance >= minImportance)
  }

  /**
   * 根据年份范围筛选历史事件
   */
  filterEventsByYearRange(
    events: HistoricalEvent[],
    startYear: number,
    endYear: number
  ): HistoricalEvent[] {
    return events.filter(event => event.year >= startYear && event.year <= endYear)
  }

  /**
   * 根据ID获取城市
   */
  async getCityById(id: string): Promise<City | undefined> {
    const cities = await this.loadCities()
    return cities.find(city => city.id === id)
  }

  /**
   * 根据ID获取遗址
   */
  async getSiteById(id: string): Promise<CulturalSite | undefined> {
    const sites = await this.loadSites()
    return sites.find(site => site.id === id)
  }

  /**
   * 根据ID获取历史事件
   */
  async getEventById(id: string): Promise<HistoricalEvent | undefined> {
    const events = await this.loadEvents()
    return events.find(event => event.id === id)
  }

  /**
   * 清除所有缓存
   */
  clearCache(): void {
    this.citiesCache = null
    this.routesCache = null
    this.dynastiesCache = null
    this.eventsCache = null
    this.tradeRecordsCache = null
    this.tradeGoodsCache = null
    this.sitesCache = null
    this.displayPresetsCache = null
  }
}

// 导出单例实例
export const dataService = new DataService()

// 导出类型供其他模块使用
export type { DataService }

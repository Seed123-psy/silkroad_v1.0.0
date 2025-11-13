/**
 * 3D模型加载服务
 * 提供GLB/GLTF模型加载、缓存和预加载功能
 */

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'

/**
 * 模型加载进度回调
 */
export type LoadProgressCallback = (progress: number) => void

/**
 * 模型加载选项
 */
export interface ModelLoadOptions {
  onProgress?: LoadProgressCallback
  useCache?: boolean
}

/**
 * 模型加载服务类
 */
class ModelLoaderService {
  private loader: GLTFLoader
  private cache: Map<string, GLTF>
  private loadingPromises: Map<string, Promise<GLTF>>

  constructor() {
    this.loader = new GLTFLoader()
    this.cache = new Map()
    this.loadingPromises = new Map()
  }

  /**
   * 加载3D模型
   * @param url 模型文件URL
   * @param options 加载选项
   * @returns Promise<GLTF>
   */
  async loadModel(url: string, options: ModelLoadOptions = {}): Promise<GLTF> {
    const { onProgress, useCache = true } = options

    // 检查缓存
    if (useCache && this.cache.has(url)) {
      return this.cache.get(url)!
    }

    // 检查是否正在加载
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)!
    }

    // 创建加载Promise
    const loadPromise = new Promise<GLTF>((resolve, reject) => {
      this.loader.load(
        url,
        gltf => {
          // 加载成功，存入缓存
          if (useCache) {
            this.cache.set(url, gltf)
          }
          // 清除加载Promise
          this.loadingPromises.delete(url)
          resolve(gltf)
        },
        progressEvent => {
          // 进度回调
          if (onProgress && progressEvent.lengthComputable) {
            const progress = (progressEvent.loaded / progressEvent.total) * 100
            onProgress(progress)
          }
        },
        (error: unknown) => {
          // 加载失败
          this.loadingPromises.delete(url)
          const errorMessage = error instanceof Error ? error.message : String(error)
          reject(new Error(`Failed to load model from ${url}: ${errorMessage}`))
        }
      )
    })

    // 存储加载Promise，避免重复加载
    this.loadingPromises.set(url, loadPromise)

    return loadPromise
  }

  /**
   * 预加载多个模型
   * @param urls 模型文件URL数组
   * @param onProgress 总体进度回调
   * @returns Promise<void>
   */
  async preloadModels(
    urls: string[],
    onProgress?: (loaded: number, total: number) => void
  ): Promise<void> {
    if (urls.length === 0) {
      return
    }

    let loadedCount = 0
    const total = urls.length

    // 创建所有加载Promise
    const loadPromises = urls.map(async url => {
      try {
        await this.loadModel(url, { useCache: true })
        loadedCount++
        if (onProgress) {
          onProgress(loadedCount, total)
        }
      } catch (error) {
        console.error(`Failed to preload model: ${url}`, error)
        loadedCount++
        if (onProgress) {
          onProgress(loadedCount, total)
        }
      }
    })

    // 等待所有模型加载完成
    await Promise.all(loadPromises)
  }

  /**
   * 检查模型是否已缓存
   * @param url 模型文件URL
   * @returns boolean
   */
  isCached(url: string): boolean {
    return this.cache.has(url)
  }

  /**
   * 获取缓存的模型
   * @param url 模型文件URL
   * @returns GLTF | undefined
   */
  getCached(url: string): GLTF | undefined {
    return this.cache.get(url)
  }

  /**
   * 清除指定模型的缓存
   * @param url 模型文件URL
   */
  clearCache(url?: string): void {
    if (url) {
      this.cache.delete(url)
    } else {
      this.cache.clear()
    }
  }

  /**
   * 获取缓存大小
   * @returns number
   */
  getCacheSize(): number {
    return this.cache.size
  }

  /**
   * 获取所有缓存的模型URL
   * @returns string[]
   */
  getCachedUrls(): string[] {
    return Array.from(this.cache.keys())
  }

  /**
   * 检查模型是否正在加载
   * @param url 模型文件URL
   * @returns boolean
   */
  isLoading(url: string): boolean {
    return this.loadingPromises.has(url)
  }
}

// 导出单例实例
export const modelLoaderService = new ModelLoaderService()

// 导出类以便测试
export { ModelLoaderService }

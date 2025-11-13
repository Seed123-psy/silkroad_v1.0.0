/**
 * 文物和遗址相关类型定义
 */

import type { DisplayConfig } from './display'

/**
 * 文物类型枚举
 */
export type ArtifactType =
  | 'pottery'
  | 'sculpture'
  | 'textile'
  | 'metalware'
  | 'jade'
  | 'painting'
  | 'other'

/**
 * 文物接口
 */
export interface Artifact {
  id: string
  name: string
  type: ArtifactType
  period: string
  material: string
  description: string
  images: string[]
  model3D?: string // GLB/GLTF文件路径
  dimensions?: {
    height: number
    width: number
    depth: number
  }
  displayConfig?: DisplayConfig // 自定义展示配置
}

/**
 * 文化遗址接口
 */
export interface CulturalSite {
  id: string
  name: string
  nameEn: string
  type: 'city' | 'temple' | 'tomb' | 'fortress' | 'other'
  lat: number
  lng: number
  period: string[]
  dynasty: string[]
  description: string
  history: string
  discovery: string
  images: string[]
  artifacts: Artifact[]
  videos?: string[]
}

/**
 * 3D展示配置相关类型定义
 */

import type { ArtifactType } from './artifact'

/**
 * 展示配置接口
 */
export interface DisplayConfig {
  cameraDistance?: number // 相机距离
  cameraAngle?: {
    azimuth: number // 方位角（水平旋转）
    elevation: number // 仰角（垂直旋转）
  }
  targetOffset?: {
    // 相机目标点偏移
    x: number
    y: number
    z: number
  }
  lightIntensity?: number
  autoRotateSpeed?: number
}

/**
 * 展示预设接口
 */
export interface DisplayPreset {
  name: string
  description: string
  config: DisplayConfig
}

/**
 * 展示预设配置文件接口
 */
export interface DisplayPresetsConfig {
  version: string
  presets: Record<ArtifactType, DisplayPreset>
  customPresets?: Record<string, DisplayPreset>
}

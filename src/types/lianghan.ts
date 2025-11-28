import type { Feature, LineString, MultiLineString, Point } from 'geojson'

export type HanPointDataset = 'western' | 'eastern'

export interface HanPointProperties {
  id: number | string
  dataset: HanPointDataset
  dynasty?: string
  nameZh: string
  nameEn?: string
  type?: string
  classification?: string
  province?: string
  prefecture?: string
  county?: string
  town?: string
  village?: string
  site?: string
  locationCode?: number
  beginYear?: number
  endYear?: number
  postalCode?: string
  color: string
  coordinates: [number, number]
}

export type HanPointFeature = Feature<Point, HanPointProperties>

export interface HanLineProperties {
  id: string
  name: string
  folderPath?: string
  popupHtml?: string
  description?: string
  length?: number
  color: string
}

export type HanLineFeature = Feature<LineString | MultiLineString, HanLineProperties>

export type HanFeaturePanelData =
  | { kind: 'point'; properties: HanPointProperties }
  | { kind: 'line'; properties: HanLineProperties }

export interface HanPointRecord {
  OBJECTID?: number | string
  Postal_cod?: string | number
  Name_Chine?: string
  Name_Engli?: string
  type?: string
  Dynasty?: string
  dynasty?: string
  Province?: string
  PL_City?: string
  Country?: string
  County?: string
  Town?: string
  Village?: string
  Site?: string
  Location?: string | number
  beg_year?: string | number
  end_year?: string | number
  class?: string
}

// SPDX-License-Identifier: MIT
import fs from 'node:fs'
import path from 'node:path'
import shp from 'shpjs'

const targets = ['eastern_han_points.zip', 'western_han_points.zip', 'han_silk_road.zip']

async function inspect() {
  const root = new URL('../public/data/lianghan/', import.meta.url)
  for (const file of targets) {
    const fileUrl = new URL(file, root)
    const buffer = fs.readFileSync(fileUrl)
    const geojson = await shp(buffer)
    const collections = Array.isArray(geojson) ? geojson : [geojson]
    const features = collections.flatMap(item => item?.features ?? [])
    const keys = new Set()
    features.forEach(feature => {
      Object.keys(feature?.properties ?? {}).forEach(key => keys.add(key))
    })
    console.log(`\n${file}`)
    console.log('  Feature count:', features.length)
    console.log('  Attribute keys:', Array.from(keys))
    console.log('  Sample properties:', features[0]?.properties)
  }
}

inspect().catch(err => {
  console.error(err)
  process.exit(1)
})

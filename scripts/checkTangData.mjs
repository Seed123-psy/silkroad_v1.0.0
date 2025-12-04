import fs from 'node:fs/promises'
import { unzipSync } from 'fflate'
import { open as openShapefile } from 'shapefile'
// SPDX-License-Identifier: MIT

async function inspect(zipPath, label) {
  const file = await fs.readFile(zipPath)
  const archive = unzipSync(new Uint8Array(file))
  const entries = Object.keys(archive)
  const shpName = entries.find(name => name.toLowerCase().endsWith('.shp'))
  const dbfName = entries.find(name => name.toLowerCase().endsWith('.dbf'))
  if (!shpName || !dbfName) {
    throw new Error(`${label} 缺少 shp/dbf 文件`)
  }
  const source = await openShapefile(
    sliceArrayBuffer(archive[shpName]),
    sliceArrayBuffer(archive[dbfName]),
    { encoding: 'gb18030' }
  )
  const features = []
  while (true) {
    const result = await source.read()
    if (!result || result.done) break
    features.push(result.value)
  }
  console.log(`\n=== ${label} ===`)
  console.log('feature count:', features.length)
  console.log('sample properties:', features[0]?.properties)
}

function sliceArrayBuffer(entry) {
  return entry.buffer.slice(entry.byteOffset, entry.byteOffset + entry.byteLength)
}

const base = new URL('../public/data/tang/', import.meta.url)
await inspect(new URL('nodes.zip', base), 'nodes.zip')
await inspect(new URL('routes.zip', base), 'routes.zip')

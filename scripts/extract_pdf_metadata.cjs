const fs = require('fs')
const path = require('path')

let pdf

async function extract() {
  const pagesDir = path.resolve(__dirname, '..', 'docs', 'pages')
  const outFile = path.join(pagesDir, 'papers_metadata.json')
  const files = fs.readdirSync(pagesDir).filter(f => f.toLowerCase().endsWith('.pdf'))
  const results = []

  for (const file of files) {
    const filePath = path.join(pagesDir, file)
    try {
      const dataBuffer = fs.readFileSync(filePath)
      const data = await pdf(dataBuffer)
      const info = data.info || {}
      const meta = data.metadata || {}
      const text = (data.text || '').replace(/\r/g, '\n')

      // Try to extract an abstract: look for '摘要' or 'Abstract'
      let abstract = null
      const zhMatch = text.match(/摘要[\s\S]{0,800}?(?=\n\s*\n|\n\s*[A-Za-z]|$)/)
      if (zhMatch) abstract = zhMatch[0].replace(/\n+/g, '\n').trim()
      if (!abstract) {
        const enMatch = text.match(/Abstract[\s\S]{0,800}?(?=\n\s*\n|\n\s*[\u4e00-\u9fff]|$)/i)
        if (enMatch) abstract = enMatch[0].replace(/\n+/g, '\n').trim()
      }

      // Parse year from CreationDate if available
      let year = null
      if (info && info.CreationDate) {
        const m = info.CreationDate.match(/(\d{4})/)
        if (m) year = m[1]
      }

      results.push({
        filename: file,
        path: `docs/pages/${file}`,
        title: info.Title || meta['dc:title'] || file.replace(/\.pdf$/i, ''),
        author: info.Author || meta['dc:creator'] || null,
        year,
        abstract,
        rawInfo: info,
      })
    } catch (e) {
      results.push({ filename: file, path: `docs/pages/${file}`, error: String(e) })
    }
  }

  fs.writeFileSync(outFile, JSON.stringify(results, null, 2), 'utf8')
  console.log(`Wrote metadata for ${results.length} files to ${outFile}`)
}

// dynamic import to support ESM export shapes
;(async () => {
  try {
    const mod = await import('pdf-parse')
    console.log('pdf-parse module keys:', Object.keys(mod))
    pdf = mod.default || mod
    console.log('pdf-parse resolved type:', typeof pdf)
  } catch (e) {
    console.error('Failed to import pdf-parse:', e)
    process.exit(1)
  }

  extract().catch(err => {
    console.error(err)
    process.exit(1)
  })
})()

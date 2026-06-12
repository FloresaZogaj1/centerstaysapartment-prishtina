const fs = require('fs')
const path = require('path')

const repoRoot = path.resolve(__dirname, '..')
const publicDir = path.join(repoRoot, 'public')

function walk(dir, exts = ['.js', '.jsx', '.html']) {
  const files = []
  const items = fs.readdirSync(dir)
  for (const it of items) {
    const full = path.join(dir, it)
    const stat = fs.statSync(full)
    if (stat.isDirectory()) {
      files.push(...walk(full, exts))
    } else {
      if (exts.includes(path.extname(full).toLowerCase())) files.push(full)
    }
  }
  return files
}

function extractImagePathsFromFile(file) {
  const txt = fs.readFileSync(file, 'utf8')
  // match strings containing image filenames
  const re = /["'`]([^"'`]*?\.(?:jpg|jpeg|png|avif))["'`]/gi
  const matches = []
  let m
  while ((m = re.exec(txt)) !== null) {
    matches.push(m[1])
  }
  return matches
}

function normalizeToPublic(p) {
  if (!p) return null
  // remove leading ./ or .\
  p = p.replace(/^\.\//, '').replace(/^\.\\/, '')
  // remove leading slash
  p = p.replace(/^\//, '')
  // windows backslashes
  p = p.replace(/\\/g, '/')
  return path.join(publicDir, p)
}

function main() {
  const srcDir = path.join(repoRoot, 'src')
  const htmlFilesRoot = repoRoot // also scan root HTML files
  let files = [...walk(srcDir), ...walk(htmlFilesRoot, ['.html'])]
  // exclude saved/archived folders (like scraped Instagram HTML under `city/`) to avoid external references
  files = files.filter(f => !f.includes(path.join(repoRoot, 'city')))
  const refs = new Map()

  for (const f of files) {
    const imgs = extractImagePathsFromFile(f)
    for (const img of imgs) {
      // skip external URLs and data URIs (we only check local public/ assets)
      if (/^\s*(https?:)?\/\//i.test(img) || /^data:/i.test(img)) continue
      if (!refs.has(img)) refs.set(img, new Set())
      refs.get(img).add(path.relative(repoRoot, f))
    }
  }

  const report = []
  for (const [img, locations] of refs) {
    const normalized = normalizeToPublic(img)
    const exists = normalized ? fs.existsSync(normalized) : false
    report.push({ image: img, exists, normalizedPath: normalized ? path.relative(repoRoot, normalized) : null, referencedIn: Array.from(locations) })
  }

  // sort missing first
  report.sort((a,b) => (a.exists === b.exists) ? a.image.localeCompare(b.image) : (a.exists ? 1 : -1))
  const missing = report.filter(r => !r.exists)
  const present = report.filter(r => r.exists)

  console.log('\n=== Image verification report ===\n')
  console.log(`Total referenced images: ${report.length}`)
  console.log(`Missing: ${missing.length}`)
  console.log(`Present: ${present.length}\n`)

  if (missing.length) {
    console.log('Missing files:')
    for (const m of missing) {
      console.log(`- ${m.image}  -> referenced in: ${m.referencedIn.join(', ')}`)
    }
  }

  if (present.length) {
    console.log('\nPresent files (sample up to 30):')
    for (const p of present.slice(0,30)) console.log(`- ${p.image} -> ${p.normalizedPath}`)
  }

  // also write JSON for further inspection
  fs.writeFileSync(path.join(repoRoot, 'image-report.json'), JSON.stringify({ total: report.length, missing: missing, present: present }, null, 2))
  console.log('\nWrote image-report.json')
}

main()

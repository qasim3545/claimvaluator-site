/**
 * After an import: requests every old published WordPress URL on the new site and
 * reports anything that does not answer 200.
 *
 *   node scripts/check-urls.mjs http://localhost:3000
 */
import fs from 'fs'

const base = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '')
const urls = JSON.parse(fs.readFileSync('migration/old-urls.json', 'utf8'))
const bad = []
let ok = 0
for (let i = 0; i < urls.length; i += 8) {
  await Promise.all(
    urls.slice(i, i + 8).map(async (u) => {
      const res = await fetch(base + u.path, { redirect: 'manual' }).catch((e) => ({ status: String(e) }))
      if (res.status === 200) ok++
      else bad.push(`${res.status} ${u.path} (${u.kind})`)
    }),
  )
}
console.log(`${ok}/${urls.length} old URLs answer 200 on ${base}`)
if (bad.length) console.log(bad.join('\n'))
process.exit(bad.length ? 1 : 0)

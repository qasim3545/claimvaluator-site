// Replace absolute example dates (computed on export day) with month offsets, so the app computes them per request.
import fs from 'fs'
const f = JSON.parse(fs.readFileSync(new URL('./fields.json', import.meta.url)))
const exportDay = new Date(Date.UTC(2026, 10, 3)) // 2026-11-03, the day of the PHP export
const monthsAgo = (iso) => {
  const [y, m, d] = iso.split('-').map(Number)
  const months = (exportDay.getUTCFullYear() - y) * 12 + (exportDay.getUTCMonth() + 1 - m)
  return months
}
let n = 0
const fix = (list) => list.forEach((fld) => {
  if (fld.type === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(String(fld.default))) {
    fld.agoMonths = monthsAgo(fld.default); n++
  }
})
Object.values(f.tools).forEach((t) => fix(t.base))
Object.values(f.variants).forEach(fix)
fs.writeFileSync(new URL('./fields.json', import.meta.url), JSON.stringify(f))
console.log('date fields converted:', n)

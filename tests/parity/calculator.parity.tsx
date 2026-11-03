/**
 * Parity check: the new React calculator must produce the same form as the WordPress plugin.
 * Run: npx tsx tests/parity/calculator.parity.tsx
 */
import fs from 'fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { canon } from './canon'
import React from 'react'
import { Calculator } from '../../src/calculators/Calculator'
import { allTools } from '../../src/calculators/data'

const snaps = JSON.parse(fs.readFileSync('seed/calc_html_base.json', 'utf8')) as Record<string, string>
const NOW = new Date(Date.UTC(2026, 10, 3))

let fail = 0
allTools().forEach((t, i) => {
  const uid = `cv${i + 1}`
  const ours = renderToStaticMarkup(<Calculator toolSlug={t.slug} uid={uid} now={NOW} />)
  const a = canon(snaps[t.slug])
  const b = canon(ours)
  if (a !== b) {
    fail++
    const al = a.split('\n'), bl = b.split('\n')
    const k = al.findIndex((l, j) => l !== bl[j])
    console.log(`DIFF ${t.slug} at line ${k}\n  php:   ${al[k]}\n  react: ${bl[k]}`)
  }
})
console.log(fail ? `${fail} of ${allTools().length} tools differ` : `All ${allTools().length} calculators match the WordPress plugin`)
process.exit(fail ? 1 : 0)

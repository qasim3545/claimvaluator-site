/** Parity for every state-specific calculator (tool x state). Run: npx tsx tests/parity/calculator-state.parity.tsx */
import fs from 'fs'
import { renderToStaticMarkup } from 'react-dom/server'
import React from 'react'
import { Calculator } from '../../src/calculators/Calculator'
import { canon } from './canon'

const snaps = JSON.parse(fs.readFileSync('tests/parity/calc_html_state.json', 'utf8')) as Record<string, string>
const NOW = new Date(Date.UTC(2026, 10, 3))
let fail = 0, n = 0
for (const key of Object.keys(snaps)) {
  n++
  const [tool, state] = key.split('|')
  const uid = (snaps[key].match(/id="(cv\d+)-/) || [])[1] || 'cv1'
  const a = canon(snaps[key])
  const b = canon(renderToStaticMarkup(<Calculator toolSlug={tool} stateSlug={state} uid={uid} now={NOW} />))
  if (a !== b) {
    fail++
    if (fail <= 8) {
      const al = a.split('\n'), bl = b.split('\n'); const k = al.findIndex((l, j) => l !== bl[j])
      console.log(`DIFF ${key} at ${k}\n  php:   ${al[k]}\n  react: ${bl[k]}`)
    }
  }
}
console.log(fail ? `${fail} of ${n} state calculators differ` : `All ${n} state calculators match the WordPress plugin`)
process.exit(fail ? 1 : 0)

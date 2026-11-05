import { allStates } from '@/calculators/data'

/**
 * The state rules as JSON, at the address the old WordPress site published them
 * (linked from the methodology page). Same facts the calculators use.
 */
export const dynamic = 'force-static'

export function GET() {
  const states = allStates().map((s: any) => {
    const { reviewer, ...rest } = s
    return rest
  })
  return Response.json(
    { source: 'https://claimvaluator.com/methodology/', count: states.length, states },
    { headers: { 'Cache-Control': 'public, max-age=86400' } },
  )
}

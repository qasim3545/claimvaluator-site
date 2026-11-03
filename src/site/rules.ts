import type { State } from '@/calculators/data'

export const FAULT_LABEL: Record<string, string> = {
  pure: 'Pure comparative',
  bar51: '51% bar',
  bar50: '50% bar',
  contributory: 'Contributory',
  slight_gross: 'Slight/gross',
}

export const faultLabel = (s: State) => FAULT_LABEL[s.fault] || s.fault
export const isNoFaultState = (s: State) => !!(s.nf && (s.nf as any).type)

const FAULT_PHRASE: Record<string, string> = {
  pure: 'pure comparative fault rule',
  bar51: '51% fault bar',
  bar50: '50% fault bar',
  contributory: 'contributory negligence rule',
  slight_gross: 'slight/gross negligence rule',
}
const years = (n?: number) => (n ? `${n}-year` : '')
const MOTOR_TOOLS = ['car', 'truck', 'motorcycle', 'rideshare', 'pedestrian', 'bicycle', 'dui', 'um']

/** Fallback meta description for /{tool}/{state}/ when the editor hasn't written one. */
export function stateCalcDescription(s: State, toolShort: string, variant = ''): string {
  const motor = MOTOR_TOOLS.includes(variant)
  const sol = motor && s.solMv ? s.solMv : s.sol
  const parts = [`${s.name}’s ${FAULT_PHRASE[s.fault] || 'fault rule'}`, sol ? `${years(sol)} filing deadline` : '']
  if (motor && Array.isArray(s.ins) && s.ins[0]) parts.push(`$${Number(s.ins[0]).toLocaleString('en-US')} minimum injury coverage`)
  const list = parts.filter(Boolean)
  const joined = list.length > 1 ? `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}` : list[0]
  const base = `Estimate a ${s.name} ${toolShort.toLowerCase()} settlement with ${joined} applied.`
  const withNote = `${base} Free, with the law cited.`
  return withNote.length <= 158 ? withNote : base
}

/** Fallback meta description for /states/{state}/. */
export function stateHubDescription(s: State): string {
  const nf = isNoFaultState(s) ? ', no-fault insurance rules' : ''
  return `${s.name} injury claim laws: the ${FAULT_PHRASE[s.fault] || 'fault rule'}, the ${years(s.sol)} filing deadline${nf}, damage caps and calculators that apply them.`
}

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

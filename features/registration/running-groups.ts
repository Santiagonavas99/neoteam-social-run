export const RUNNING_GROUP_OPTIONS = [
  { value: 'byrunners', label: 'ByRunners' },
  { value: 'el-cartel-running-club', label: 'El Cartel Running Club' },
  { value: '365-run-club', label: '365 Run Club' },
  { value: 'neoteam', label: 'Neo Team' },
  { value: 'pacifik-runners', label: 'Pacifik Runners' },
  { value: 'beer-runners', label: 'Beer Runners' },
  { value: 'integral-fit', label: 'Integral Fit' },
  { value: 'running-social', label: 'Running Social' },
  { value: 'united-runner-club', label: 'United Runner Club' },
  { value: 'guabinas-run-club', label: 'Guabinas Run Club' },
  { value: 'pace-running', label: 'Pace Running' },
] as const

export const RUNNING_GROUP_VALUES = [
  'byrunners',
  'el-cartel-running-club',
  '365-run-club',
  'neoteam',
  'pacifik-runners',
  'beer-runners',
  'integral-fit',
  'running-social',
  'united-runner-club',
  'guabinas-run-club',
  'pace-running',
  'independiente',
  'otro',
] as const

export function listedExternalRunningGroupName(value: string): string | null {
  const group = RUNNING_GROUP_OPTIONS.find((option) => option.value === value)
  return group && group.value !== 'neoteam' ? group.label : null
}

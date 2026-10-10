import type { ComponentType } from 'react'

export type AeroShardsProps = {
  backgroundColor?: string
  shardColor?: string
  accentColor?: string
  placement?: 'full' | 'left' | 'right' | 'center'
  flow?: 'stream' | 'vortex' | 'ribbon'
  material?: 'satin' | 'chrome' | 'pearl'
  detail?: 'bold' | 'balanced' | 'fine'
  speed?: number
  density?: number
  glow?: number
  bloom?: number
  grain?: number
  chromaticAberration?: number
  interaction?: 'none' | 'repel' | 'attract'
  holdToGather?: boolean
  onError?: (error: Error) => void
}

declare const AeroShards: ComponentType<AeroShardsProps>
export default AeroShards

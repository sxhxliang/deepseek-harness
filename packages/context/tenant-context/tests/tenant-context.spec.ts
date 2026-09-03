import { describe, it, expect } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { TenantContextManager } from '../src/index.ts'

describe('TenantContextManager Cordis Isolation', () => {
  it('creates isolated sub-contexts for different tenants', () => {
    const rootCtx = new Context()
    const manager = new TenantContextManager(rootCtx)

    const ctxA = manager.getTenantContext('tenant-A')
    const ctxB = manager.getTenantContext('tenant-B')

    expect(ctxA).toBeDefined()
    expect(ctxB).toBeDefined()
    expect(ctxA).not.toBe(ctxB)
  })

  it('registers and isolates tools and presets per tenant', () => {
    const rootCtx = new Context()
    const manager = new TenantContextManager(rootCtx)

    manager.registerTenantTool('tenant-A', {
      name: 'toolA',
      handler: () => 'resultA',
    })

    manager.registerTenantPreset('tenant-A', {
      name: 'presetA',
      config: { mode: 'fast' },
    })

    expect(manager.getTenantTools('tenant-A')).toHaveLength(1)
    expect(manager.getTenantTools('tenant-A')[0]?.name).toBe('toolA')
    expect(manager.getTenantPresets('tenant-A')).toHaveLength(1)

    // Tenant-B should have no tools or presets
    expect(manager.getTenantTools('tenant-B')).toHaveLength(0)
    expect(manager.getTenantPresets('tenant-B')).toHaveLength(0)
  })

  it('cleans up tools and presets on dispose', () => {
    const rootCtx = new Context()
    const manager = new TenantContextManager(rootCtx)

    manager.registerTenantTool('tenant-A', {
      name: 'toolA',
      handler: () => 'resultA',
    })

    manager.disposeTenantContext('tenant-A')
    expect(manager.getTenantTools('tenant-A')).toHaveLength(0)
  })
})

import { Context, Service } from '@deepseek-ai/cordis'

export interface TenantScope {
  readonly tenantId: string
  readonly userId?: string
}

export interface TenantPresetDefinition {
  readonly name: string
  readonly config: Record<string, unknown>
}

export interface TenantToolDefinition {
  readonly name: string
  readonly handler: (...args: unknown[]) => unknown | Promise<unknown>
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    tenantContextManager: TenantContextManager
  }
}

/**
 * Cordis Multi-Tenant Context Manager (`ctx.tenantContextManager`).
 * Provides runtime lifecycle isolation via Cordis `ctx.isolate()`, ensuring that
 * each tenant runs within its isolated sub-context with tenant-scoped tool and preset registrations.
 */
export class TenantContextManager extends Service {
  private readonly tenantContexts = new Map<string, Context>()
  private readonly tenantPresets = new Map<string, Map<string, TenantPresetDefinition>>()
  private readonly tenantTools = new Map<string, Map<string, TenantToolDefinition>>()

  constructor(ctx: Context) {
    super(ctx, 'tenantContextManager')
  }

  /**
   * Resolve or create an isolated Cordis sub-context for a specific tenant.
   * Leverages `ctx.isolate()` to decouple runtime service lifecycles across tenants.
   */
  getTenantContext(tenantId: string): Context {
    let tenantCtx = this.tenantContexts.get(tenantId)
    if (!tenantCtx) {
      // Isolate key services for tenant boundary
      tenantCtx = this.ctx.isolate(['sessionPersistence', 'storage'])
      this.tenantContexts.set(tenantId, tenantCtx)

      // Lifecycle cleanup on dispose
      tenantCtx.effect(() => {
        return () => {
          this.tenantContexts.delete(tenantId)
          this.tenantPresets.delete(tenantId)
          this.tenantTools.delete(tenantId)
        }
      }, `tenantContext:${tenantId}`)
    }
    return tenantCtx
  }

  /**
   * Register a tenant-scoped Agent Preset within the tenant's isolated context.
   */
  registerTenantPreset(tenantId: string, preset: TenantPresetDefinition): void {
    const tenantCtx = this.getTenantContext(tenantId)
    let presets = this.tenantPresets.get(tenantId)
    if (!presets) {
      presets = new Map()
      this.tenantPresets.set(tenantId, presets)
    }
    presets.set(preset.name, preset)

    tenantCtx.effect(() => {
      return () => {
        presets?.delete(preset.name)
      }
    }, `tenantPreset:${tenantId}:${preset.name}`)
  }

  /**
   * Register a tenant-scoped Tool within the tenant's isolated context.
   */
  registerTenantTool(tenantId: string, tool: TenantToolDefinition): void {
    const tenantCtx = this.getTenantContext(tenantId)
    let tools = this.tenantTools.get(tenantId)
    if (!tools) {
      tools = new Map()
      this.tenantTools.set(tenantId, tools)
    }
    tools.set(tool.name, tool)

    tenantCtx.effect(() => {
      return () => {
        tools?.delete(tool.name)
      }
    }, `tenantTool:${tenantId}:${tool.name}`)
  }

  /**
   * List all registered tools for a specific tenant scope.
   */
  getTenantTools(tenantId: string): readonly TenantToolDefinition[] {
    const tools = this.tenantTools.get(tenantId)
    return tools ? [...tools.values()] : []
  }

  /**
   * List all registered presets for a specific tenant scope.
   */
  getTenantPresets(tenantId: string): readonly TenantPresetDefinition[] {
    const presets = this.tenantPresets.get(tenantId)
    return presets ? [...presets.values()] : []
  }

  /**
   * Dispose and cleanup an isolated tenant runtime context and all associated scoped tools/presets.
   */
  disposeTenantContext(tenantId: string): void {
    const tenantCtx = this.tenantContexts.get(tenantId)
    if (tenantCtx) {
      this.tenantContexts.delete(tenantId)
      this.tenantPresets.delete(tenantId)
      this.tenantTools.delete(tenantId)
    }
  }
}

export default TenantContextManager

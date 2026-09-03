import * as fs from 'node:fs/promises'
import * as path from 'node:path'

/** Multi-tenant scope context identifying tenant and user ownership. */
export interface TenantScope {
  /** Unique tenant identifier. */
  readonly tenantId: string
  /** Optional user identifier within the tenant. */
  readonly userId?: string
}

/**
 * Abstract Storage Provider Adapter for tenant-isolated file operations.
 * Allows switching between local filesystem (PoC) and remote object storage (S3/MinIO).
 */
export interface TenantStorageProvider {
  /**
   * Resolve physical or relative storage path for a given tenant scope.
   */
  getTenantPath(scope: TenantScope, relativePath?: string): string

  /**
   * Read file content for a tenant.
   */
  readFile(scope: TenantScope, relativePath: string): Promise<Uint8Array>

  /**
   * Write file content for a tenant.
   */
  writeFile(scope: TenantScope, relativePath: string, data: Uint8Array | string): Promise<void>

  /**
   * Delete file for a tenant.
   */
  deleteFile(scope: TenantScope, relativePath: string): Promise<void>

  /**
   * Check if file exists for a tenant.
   */
  exists(scope: TenantScope, relativePath: string): Promise<boolean>

  /**
   * List files or directories under a relative path for a tenant.
   */
  listDirectory(scope: TenantScope, relativePath?: string): Promise<readonly string[]>
}

/**
 * Local file system implementation of TenantStorageProvider.
 * Isolates data under baseDir/tenants/<tenantId>/<userId|default>/...
 */
export class LocalTenantStorageProvider implements TenantStorageProvider {
  constructor(private readonly baseDir: string = '.dsh/tenants') {}

  getTenantPath(scope: TenantScope, relativePath: string = ''): string {
    const tenantDir = path.join(this.baseDir, scope.tenantId, scope.userId ?? 'default')
    return relativePath ? path.join(tenantDir, relativePath) : tenantDir
  }

  async readFile(scope: TenantScope, relativePath: string): Promise<Uint8Array> {
    const fullPath = this.getTenantPath(scope, relativePath)
    return await fs.readFile(fullPath)
  }

  async writeFile(scope: TenantScope, relativePath: string, data: Uint8Array | string): Promise<void> {
    const fullPath = this.getTenantPath(scope, relativePath)
    await fs.mkdir(path.dirname(fullPath), { recursive: true })
    await fs.writeFile(fullPath, data)
  }

  async deleteFile(scope: TenantScope, relativePath: string): Promise<void> {
    const fullPath = this.getTenantPath(scope, relativePath)
    await fs.rm(fullPath, { force: true })
  }

  async exists(scope: TenantScope, relativePath: string): Promise<boolean> {
    const fullPath = this.getTenantPath(scope, relativePath)
    try {
      await fs.access(fullPath)
      return true
    } catch {
      return false
    }
  }

  async listDirectory(scope: TenantScope, relativePath: string = ''): Promise<readonly string[]> {
    const fullPath = this.getTenantPath(scope, relativePath)
    try {
      const entries = await fs.readdir(fullPath)
      return entries
    } catch {
      return []
    }
  }
}

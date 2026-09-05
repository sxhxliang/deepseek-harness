import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { LocalTenantStorageProvider } from '../src/tenant-storage-provider.ts'

describe('LocalTenantStorageProvider', () => {
  let tmpDir: string
  let provider: LocalTenantStorageProvider

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'dsh-storage-test-'))
    provider = new LocalTenantStorageProvider(tmpDir)
  })

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  it('resolves valid relative path within tenant boundary', () => {
    const scope = { tenantId: 'tenant-123' }
    const resolvedPath = provider.getTenantPath(scope, 'docs/file.txt')
    expect(resolvedPath).toContain('tenant-123')
    expect(resolvedPath).toContain('docs/file.txt')
  })

  it('prevents path traversal attempts out of tenant boundary', () => {
    const scope = { tenantId: 'tenant-123' }
    expect(() => provider.getTenantPath(scope, '../../secret.txt')).toThrow('Path traversal attempt detected')
  })
})

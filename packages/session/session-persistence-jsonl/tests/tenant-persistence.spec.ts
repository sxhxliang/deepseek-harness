import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import type { SessionId } from '@deepseek-ai/dsh-session'
import { projectDir, sessionDir, logPath } from '../src/format.ts'

describe('Multi-tenant Session Persistence Paths', () => {
  let tmpDir: string

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'dsh-tenant-test-'))
  })

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  it('generates tenant-isolated project and session directories when tenantScope is provided', () => {
    const tenantScope = { tenantId: 'tenant-abc', userId: 'user-xyz' }
    const pDir = projectDir(tmpDir, '/workspace', tenantScope)
    const sDir = sessionDir(tmpDir, '/workspace', 'session-123' as unknown as SessionId, tenantScope)
    const lPath = logPath(tmpDir, '/workspace', 'session-123' as unknown as SessionId, 'none', tenantScope)

    expect(pDir).toContain(join('tenants', 'tenant-abc'))
    expect(sDir).toContain(join('tenants', 'tenant-abc'))
    expect(lPath).toContain(join('tenants', 'tenant-abc'))
  })

  it('uses root directory when tenantScope is omitted', () => {
    const pDir = projectDir(tmpDir, '/workspace')
    expect(pDir).not.toContain('tenants')
  })
})

import { describe, it, expect } from 'vitest'
import type { IncomingMessage } from 'node:http'
import { extractTenantScope } from '../src/auth-middleware.ts'

describe('extractTenantScope auth middleware', () => {
  it('extracts tenantId and userId from X-Tenant-ID and X-User-ID headers', () => {
    const req = {
      headers: {
        'x-tenant-id': 'tenant-123',
        'x-user-id': 'user-456',
      },
    } as unknown as IncomingMessage

    const scope = extractTenantScope(req)
    expect(scope.tenantId).toBe('tenant-123')
    expect(scope.userId).toBe('user-456')
  })

  it('extracts tenantId and userId from Bearer JWT payload', () => {
    const payload = Buffer.from(JSON.stringify({ tenantId: 'jwt-tenant', userId: 'jwt-user' })).toString('base64url')
    const token = `header.${payload}.signature`
    const req = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    } as unknown as IncomingMessage

    const scope = extractTenantScope(req)
    expect(scope.tenantId).toBe('jwt-tenant')
    expect(scope.userId).toBe('jwt-user')
  })

  it('falls back to default tenant when no headers provided', () => {
    const req = {
      headers: {},
    } as unknown as IncomingMessage

    const scope = extractTenantScope(req)
    expect(scope.tenantId).toBe('default')
    expect(scope.userId).toBe('anonymous')
  })
})

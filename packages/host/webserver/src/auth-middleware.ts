import type { IncomingMessage } from 'node:http'

/** Extracted tenant context scope from incoming request headers or JWT token. */
export interface TenantContext {
  readonly tenantId: string
  readonly userId?: string
}

/**
 * Extracts multi-tenant scope (`tenantId`, `userId`) from HTTP/WebSocket request headers or Bearer JWT token.
 * Looks for `X-Tenant-ID`, `X-User-ID`, or `Authorization: Bearer <token>`.
 * Defaults to `tenantId: 'default'` when omitted.
 */
export function extractTenantScope(req: IncomingMessage): TenantContext {
  const tenantHeader = req.headers['x-tenant-id']
  const userHeader = req.headers['x-user-id']
  const authHeader = req.headers['authorization']

  let tenantId = typeof tenantHeader === 'string' && tenantHeader ? tenantHeader : undefined
  let userId = typeof userHeader === 'string' && userHeader ? userHeader : undefined

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim()
    try {
      const parts = token.split('.')
      if (parts.length === 3 && parts[1]) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as Record<string, unknown>
        if (typeof payload.tenantId === 'string') tenantId = payload.tenantId
        if (typeof payload.userId === 'string') userId = payload.userId
        else if (typeof payload.sub === 'string') userId = payload.sub
      }
    } catch {
      // Ignored for non-JWT bearer tokens
    }
  }

  return {
    tenantId: tenantId ?? 'default',
    userId: userId ?? 'anonymous',
  }
}

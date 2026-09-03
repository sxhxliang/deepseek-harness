import { describe, it, expect } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { E2BSandboxProvider } from '../src/sandbox-provider.ts'

describe('E2BSandboxProvider', () => {
  it('returns confined argv delegating execution to E2B sandbox', () => {
    const ctx = new Context()
    const provider = new E2BSandboxProvider(ctx)

    const result = provider.confine(['ls', '-la'], {
      mode: 'workspace-write',
      workspaceRoot: '/home/user/workspace',
    })

    expect(result.argv).toEqual(['ls', '-la'])
    expect(result.enforcement).toBe('full')
  })
})

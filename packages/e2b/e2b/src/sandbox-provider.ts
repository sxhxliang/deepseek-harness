import { SandboxProvider, type SandboxPolicy, type ConfinedArgv } from '@deepseek-ai/dsh-sandbox'

interface E2BContext {
  e2b: {
    getSandbox: () => Promise<{
      commands: {
        run: (cmd: string, opts: unknown) => Promise<{ stdout: string; stderr: string; exitCode: number }>
      }
    }>
    cwd: string
  }
}

/**
 * Remote E2B Sandbox Provider implementing `SandboxProvider` (`ctx.sandbox`).
 * Offloads process execution and terminal commands to an isolated remote E2B container.
 */
export class E2BSandboxProvider extends SandboxProvider {
  static inject = ['e2b']

  /**
   * Confine execution by delegating argv to remote E2B container execution.
   */
  confine(argv: readonly string[], _policy: SandboxPolicy): ConfinedArgv {
    // E2B handles sandbox isolation remotely in a microVM environment
    return {
      argv: [...argv],
      enforcement: 'full',
      denialSignatures: ['Permission denied', 'EACCES', 'Operation not permitted'],
      runnerFailureRules: [
        {
          allowedExitCodes: [126, 127],
          fatalSignatures: ['E2B sandbox service is disposing', 'Command failed'],
        },
      ],
    }
  }

  /**
   * Execute a shell command directly inside the remote E2B sandbox environment.
   */
  async executeRemoteCommand(
    command: string,
    options: { cwd?: string; envs?: Record<string, string> } = {},
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const e2bCtx = this.ctx as unknown as E2BContext
    const sandbox = await e2bCtx.e2b.getSandbox()
    const result = await sandbox.commands.run(command, {
      cwd: options.cwd,
      envs: options.envs,
    })
    return {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
    }
  }
}

export default E2BSandboxProvider

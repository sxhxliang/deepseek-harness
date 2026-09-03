import { Context } from '@deepseek-ai/cordis'
import { SandboxProvider, type SandboxPolicy, type ConfinedArgv } from '@deepseek-ai/dsh-sandbox'
import { E2BRuntime } from './index.ts'

/**
 * Remote E2B Sandbox Provider implementing `SandboxProvider` (`ctx.sandbox`).
 * Offloads process execution and terminal commands to an isolated remote E2B container.
 */
export class E2BSandboxProvider extends SandboxProvider {
  static inject = ['e2b']

  constructor(ctx: Context) {
    super(ctx)
  }

  /**
   * Confine execution by delegating argv to remote E2B container execution.
   */
  confine(argv: readonly string[], policy: SandboxPolicy): ConfinedArgv {
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
  async executeRemoteCommand(command: string, options: { cwd?: string; envs?: Record<string, string> } = {}): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const sandbox = await this.ctx.e2b.getSandbox()
    const result = await sandbox.commands.run(command, {
      cwd: options.cwd ?? this.ctx.e2b.cwd,
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

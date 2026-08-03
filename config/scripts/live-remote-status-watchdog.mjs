/**
 * Mid-storm host health samples for forever-freeze detection.
 * Polls `orca status --json` on an interval while a load storm runs.
 */
import { spawn } from 'node:child_process'
import { resolveOrcaCliCommand } from './live-remote-freeze-rpc.mjs'

/**
 * @param {{ intervalMs?: number, timeoutMs?: number, cliCommand?: string }} opts
 */
export function startStatusWatchdog(opts = {}) {
  const intervalMs = opts.intervalMs ?? 2000
  const timeoutMs = opts.timeoutMs ?? 30_000
  const cliCommand = opts.cliCommand ?? resolveOrcaCliCommand()
  const samples = []
  let stopped = false
  let inFlight = false
  const startedAt = performance.now()

  const probe = () =>
    new Promise((resolve) => {
      const t0 = performance.now()
      const child = spawn(cliCommand, ['status', '--json'], {
        stdio: ['ignore', 'pipe', 'pipe']
      })
      let settled = false
      const finish = (result) => {
        if (settled) {
          return
        }
        settled = true
        resolve(result)
      }
      const timer = setTimeout(() => {
        child.kill('SIGKILL')
        finish({
          tMs: t0 - startedAt,
          ms: performance.now() - t0,
          ok: false,
          hang: true
        })
      }, timeoutMs)
      child.stdout.on('data', () => {})
      child.stderr.on('data', () => {})
      child.on('error', (error) => {
        clearTimeout(timer)
        finish({
          tMs: t0 - startedAt,
          ms: performance.now() - t0,
          ok: false,
          hang: false,
          infrastructureError: true,
          error: String(error)
        })
      })
      child.on('close', (code) => {
        clearTimeout(timer)
        finish({
          tMs: t0 - startedAt,
          ms: performance.now() - t0,
          ok: code === 0,
          hang: false
        })
      })
    })

  const tick = async ({ force = false } = {}) => {
    if ((!force && stopped) || inFlight) {
      return
    }
    inFlight = true
    try {
      const sample = await probe()
      samples.push(sample)
    } finally {
      inFlight = false
    }
  }

  const interval = setInterval(() => {
    void tick()
  }, intervalMs)
  void tick()

  return {
    stop: async () => {
      stopped = true
      clearInterval(interval)
      // Wait for in-flight probe, then force one final sample.
      const deadline = performance.now() + timeoutMs + 1000
      while (inFlight && performance.now() < deadline) {
        await new Promise((r) => setTimeout(r, 20))
      }
      await tick({ force: true })
      return {
        samples: [...samples],
        durationMs: performance.now() - startedAt
      }
    },
    getSamples: () => [...samples]
  }
}

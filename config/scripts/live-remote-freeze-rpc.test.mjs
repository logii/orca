import { describe, expect, it } from 'vitest'
import { appendOrcaRpcOutput, resolveOrcaCliCommand } from './live-remote-freeze-rpc.mjs'

describe('live remote freeze RPC', () => {
  it('resolves the Orca CLI for managed, dev, Linux, and default runtimes', () => {
    expect(resolveOrcaCliCommand({ env: { ORCA_CLI_COMMAND: 'custom-orca' } })).toBe('custom-orca')
    expect(resolveOrcaCliCommand({ env: { ORCA_DEV_REPO_ROOT: '/repo' } })).toBe('orca-dev')
    expect(resolveOrcaCliCommand({ env: {}, platform: 'linux' })).toBe('orca-ide')
    expect(resolveOrcaCliCommand({ env: {}, platform: 'win32' })).toBe('orca')
  })

  it('caps combined asynchronous output before retaining the overflow chunk', () => {
    const first = appendOrcaRpcOutput('', '1234', 0, 5)
    expect(first).toEqual({ output: '1234', bytes: 4, exceeded: false })

    const overflow = appendOrcaRpcOutput(first.output, '67', first.bytes, 5)
    expect(overflow).toEqual({ output: '1234', bytes: 6, exceeded: true })
  })
})

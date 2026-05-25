import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { isRobotsAllowed } from '../robots'

describe('isRobotsAllowed', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns true when robots.txt allows the path', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      text: async () => 'User-agent: *\nAllow: /',
    } as Response)

    expect(await isRobotsAllowed('https://example.com/page')).toBe(true)
  })

  it('returns false when robots.txt disallows all paths', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      text: async () => 'User-agent: *\nDisallow: /',
    } as Response)

    expect(await isRobotsAllowed('https://example.com/page')).toBe(false)
  })

  it('returns true when robots.txt fetch returns 404', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 404 } as Response)

    expect(await isRobotsAllowed('https://example.com/page')).toBe(true)
  })

  it('returns true when robots.txt fetch throws a network error', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

    expect(await isRobotsAllowed('https://example.com/page')).toBe(true)
  })
})

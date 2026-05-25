import robotsParser from 'robots-parser'

const USER_AGENT = 'AsiaLongStay-SERP-Research/1.0 (local research tool; not a crawler)'

export async function isRobotsAllowed(targetUrl: string): Promise<boolean> {
  const { origin } = new URL(targetUrl)
  const robotsUrl = `${origin}/robots.txt`

  try {
    const res = await fetch(robotsUrl, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return true
    const text = await res.text()
    const robots = robotsParser(robotsUrl, text)
    return robots.isAllowed(targetUrl, USER_AGENT) !== false
  } catch {
    return true
  }
}

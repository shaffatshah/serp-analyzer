const API = 'http://localhost:3000/api/captures'

const previewTitle = document.getElementById('preview-title')
const previewUrl = document.getElementById('preview-url')
const previewStats = document.getElementById('preview-stats')
const saveBtn = document.getElementById('saveBtn')
const statusEl = document.getElementById('status')

let captured = null

function extractPageData() {
  const headings = []
  document.querySelectorAll('h1, h2, h3, h4').forEach(el => {
    const level = parseInt(el.tagName[1])
    const text = el.innerText.trim()
    if (text) headings.push({ level, text })
  })

  const schemaTypes = []
  document.querySelectorAll('script[type="application/ld+json"]').forEach(el => {
    try {
      const data = JSON.parse(el.textContent)
      const items = Array.isArray(data) ? data : [data]
      items.forEach(item => {
        if (item['@type']) {
          const types = Array.isArray(item['@type']) ? item['@type'] : [item['@type']]
          types.forEach(t => { if (!schemaTypes.includes(t)) schemaTypes.push(t) })
        }
      })
    } catch {}
  })

  const allLinks = document.querySelectorAll('a[href]')
  let internal = 0
  let external = 0
  const host = location.hostname
  allLinks.forEach(a => {
    try {
      const linkHost = new URL(a.href).hostname
      if (linkHost === host) internal++
      else external++
    } catch {}
  })

  const words = (document.body.innerText || '').trim().split(/\s+/).filter(Boolean)
  const wordCount = words.length

  const excerptWords = words.slice(0, 500)
  const excerpt = excerptWords.join(' ')

  return {
    url: location.href,
    domain: location.hostname,
    title: document.title || null,
    metaDescription: document.querySelector('meta[name="description"]')?.content ?? null,
    canonicalUrl: document.querySelector('link[rel="canonical"]')?.href ?? null,
    robotsMeta: document.querySelector('meta[name="robots"]')?.content ?? null,
    headingOutline: headings,
    excerpt: excerpt || null,
    wordCount,
    schemaTypes,
    internalLinkCount: internal,
    externalLinkCount: external,
  }
}

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (!tab?.id) {
    previewTitle.textContent = 'No active tab'
    return
  }

  chrome.scripting.executeScript(
    { target: { tabId: tab.id }, func: extractPageData },
    results => {
      if (chrome.runtime.lastError || !results?.[0]?.result) {
        previewTitle.textContent = 'Could not read page'
        statusEl.textContent = chrome.runtime.lastError?.message ?? 'Script injection failed'
        statusEl.className = 'status error'
        return
      }

      captured = results[0].result
      previewTitle.textContent = captured.title || captured.url
      previewUrl.textContent = captured.url
      const h2Count = captured.headingOutline.filter(h => h.level === 2).length
      previewStats.textContent = `${captured.wordCount.toLocaleString()} words · ${captured.headingOutline.length} headings (${h2Count} H2s) · ${captured.schemaTypes.length} schema types`
      saveBtn.disabled = false
    }
  )
})

saveBtn.addEventListener('click', async () => {
  if (!captured) return

  saveBtn.disabled = true
  statusEl.textContent = 'Saving…'
  statusEl.className = 'status loading'

  const payload = {
    ...captured,
    keyword: document.getElementById('keyword').value.trim(),
    serpPosition: document.getElementById('serpPosition').value.trim(),
    country: document.getElementById('country').value.trim(),
    pageType: document.getElementById('pageType').value,
  }

  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    statusEl.textContent = 'Saved. Open the app to review.'
    statusEl.className = 'status success'
  } catch (err) {
    statusEl.textContent = `Failed: ${err.message}. Is the app running?`
    statusEl.className = 'status error'
    saveBtn.disabled = false
  }
})

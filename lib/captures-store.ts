import fs from 'fs'
import path from 'path'
import type { Capture } from './types'

const DATA_FILE = path.join(process.cwd(), 'data', 'captures.json')

function ensureDir() {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true })
}

export function getCaptures(): Capture[] {
  try {
    ensureDir()
    if (!fs.existsSync(DATA_FILE)) return []
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
  } catch {
    return []
  }
}

export function addCapture(capture: Capture): void {
  ensureDir()
  const captures = getCaptures()
  captures.unshift(capture)
  fs.writeFileSync(DATA_FILE, JSON.stringify(captures, null, 2))
}

export function updateCapture(id: string, patch: Partial<Capture>): Capture | null {
  const captures = getCaptures()
  const idx = captures.findIndex(c => c.id === id)
  if (idx === -1) return null
  captures[idx] = { ...captures[idx], ...patch }
  fs.writeFileSync(DATA_FILE, JSON.stringify(captures, null, 2))
  return captures[idx]
}

export function deleteCapture(id: string): boolean {
  const captures = getCaptures()
  const filtered = captures.filter(c => c.id !== id)
  if (filtered.length === captures.length) return false
  fs.writeFileSync(DATA_FILE, JSON.stringify(filtered, null, 2))
  return true
}

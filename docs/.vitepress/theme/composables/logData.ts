export interface LogEntry {
  date: string
  text: string
  tags: string[]
}

export interface TagItem {
  id: string
  label: string
  emoji: string
}

const ENTRIES_KEY = 'journal-entries'
const TAGS_KEY = 'journal-tags'
const GIST_KEY = 'journal-gist'

export const DEFAULT_TAGS: TagItem[] = [
  { id: 'study', label: '学习', emoji: '📚' },
  { id: 'programming', label: '编程', emoji: '💻' },
  { id: 'english', label: '英语', emoji: '🗣️' },
  { id: 'reading', label: '阅读', emoji: '📖' },
  { id: 'project', label: '项目', emoji: '🚀' },
  { id: 'life', label: '生活', emoji: '🌿' },
  { id: 'other', label: '其他', emoji: '📌' },
]

function hasWindow(): boolean {
  return typeof window !== 'undefined'
}

export function loadEntries(): LogEntry[] {
  if (!hasWindow()) return []
  try {
    const raw = localStorage.getItem(ENTRIES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveEntries(entries: LogEntry[]) {
  if (!hasWindow()) return
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries))
}

export function loadCustomTags(): TagItem[] {
  if (!hasWindow()) return []
  try {
    const raw = localStorage.getItem(TAGS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveCustomTags(tags: TagItem[]) {
  if (!hasWindow()) return
  localStorage.setItem(TAGS_KEY, JSON.stringify(tags))
}

export function todayKey(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function calculateStreak(entries: LogEntry[]): number {
  const dates = new Set(entries.map(e => e.date))
  if (!dates.has(todayKey())) return 0
  let streak = 0
  const d = new Date()
  for (let i = 0; i < 365; i++) {
    const k = todayKeyFromDate(d)
    if (dates.has(k)) { streak++; d.setDate(d.getDate() - 1) } else break
  }
  return streak
}

function todayKeyFromDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getMonth() + 1}月${d.getDate()}日 周${weekdays[d.getDay()]}`
}

export interface GistConfig {
  token: string
  gistId: string
}

export function loadGistConfig(): GistConfig | null {
  if (!hasWindow()) return null
  try {
    const raw = localStorage.getItem(GIST_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function saveGistConfig(config: GistConfig) {
  if (!hasWindow()) return
  localStorage.setItem(GIST_KEY, JSON.stringify(config))
}

export function clearGistConfig() {
  if (!hasWindow()) return
  localStorage.removeItem(GIST_KEY)
}

async function githubFetch(url: string, token: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options?.headers as Record<string, string> || {}),
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) throw new Error(`GitHub API ${res.status}`)
  return res.json()
}

export async function fetchFromGist(gistId: string, token: string): Promise<LogEntry[]> {
  const data = await githubFetch(`https://api.github.com/gists/${gistId}`, token)
  const content = data.files?.['journal-data.json']?.content
  if (!content) throw new Error('Gist 中未找到数据')
  return JSON.parse(content)
}

export async function pushToGist(gistId: string, token: string, entries: LogEntry[]) {
  await githubFetch(`https://api.github.com/gists/${gistId}`, token, {
    method: 'PATCH',
    body: JSON.stringify({
      files: { 'journal-data.json': { content: JSON.stringify(entries, null, 2) } },
    }),
  })
}

export async function createSyncGist(token: string, entries: LogEntry[]): Promise<string> {
  const data = await githubFetch('https://api.github.com/gists', token, {
    method: 'POST',
    body: JSON.stringify({
      description: 'Journal Data Sync',
      public: false,
      files: { 'journal-data.json': { content: JSON.stringify(entries, null, 2) } },
    }),
  })
  return data.id
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    return (await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${token}` },
    })).ok
  } catch { return false }
}

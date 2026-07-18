<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  type LogEntry, type TagItem, type GistConfig,
  loadEntries, saveEntries,
  loadCustomTags, saveCustomTags,
  DEFAULT_TAGS,
  todayKey, calculateStreak, formatDate,
  loadGistConfig, saveGistConfig, clearGistConfig,
  fetchFromGist, pushToGist, createSyncGist, verifyToken,
} from '../composables/logData'

const entries = ref<LogEntry[]>([])
const customTags = ref<TagItem[]>([])
const gistConfig = ref<GistConfig | null>(null)

const inputText = ref('')
const selectedTags = ref<string[]>([])
const editing = ref(false)
const showNewTag = ref(false)
const newTagLabel = ref('')
const newTagEmoji = ref('🏷️')
const filterTagId = ref<string | null>(null)
const showAdmin = ref(false)
const tokenInput = ref('')
const syncStatus = ref<'idle' | 'syncing' | 'connected' | 'error'>('idle')
const syncErrorMsg = ref('')

onMounted(() => {
  entries.value = loadEntries()
  customTags.value = loadCustomTags()

  const gc = loadGistConfig()
  if (gc) {
    gistConfig.value = gc
    tokenInput.value = gc.token
    syncStatus.value = 'syncing'
    fetchFromGist(gc.gistId, gc.token)
      .then(remote => {
        if (remote.length > entries.value.length) {
          entries.value = remote
          saveEntries(remote)
        }
        syncStatus.value = 'connected'
      })
      .catch(() => { syncStatus.value = 'error' })
  }
})

const allTags = computed<TagItem[]>(() => [...DEFAULT_TAGS, ...customTags.value])
const today = todayKey()

const todayEntry = computed(() => entries.value.find(e => e.date === today))
const streak = computed(() => calculateStreak(entries.value))
const totalDays = computed(() => new Set(entries.value.map(e => e.date)).size)

const tagCounts = computed(() => {
  const map: Record<string, number> = {}
  for (const e of entries.value) {
    for (const t of e.tags) {
      map[t] = (map[t] || 0) + 1
    }
  }
  return map
})

const timeline = computed(() => {
  let filtered = entries.value
  if (filterTagId.value) {
    filtered = entries.value.filter(e => e.tags.includes(filterTagId.value!))
  }
  return [...filtered].sort((a, b) => b.date.localeCompare(a.date))
})

function toggleFilterTag(id: string) {
  filterTagId.value = filterTagId.value === id ? null : id
}

function toggleSelectedTag(id: string) {
  const idx = selectedTags.value.indexOf(id)
  if (idx >= 0) selectedTags.value.splice(idx, 1)
  else selectedTags.value.push(id)
}

function startEdit() {
  if (todayEntry.value) {
    inputText.value = todayEntry.value.text
    selectedTags.value = [...todayEntry.value.tags]
  } else {
    inputText.value = ''
    selectedTags.value = []
  }
  editing.value = true
}

function cancelEdit() {
  editing.value = false
  inputText.value = ''
  selectedTags.value = []
}

function saveEntry() {
  const text = inputText.value.trim()
  if (!text) return

  const idx = entries.value.findIndex(e => e.date === today)
  const entry: LogEntry = { date: today, text, tags: [...selectedTags.value] }

  if (idx >= 0) entries.value[idx] = entry
  else entries.value.push(entry)

  saveEntries(entries.value)
  inputText.value = ''
  selectedTags.value = []
  editing.value = false
  debounceSync()
}

function deleteEntry(date: string) {
  entries.value = entries.value.filter(e => e.date !== date)
  saveEntries(entries.value)
  debounceSync()
}

function addCustomTag() {
  const label = newTagLabel.value.trim()
  if (!label) return
  if (allTags.value.some(t => t.label === label)) return
  customTags.value.push({
    id: `c-${Date.now()}`,
    label,
    emoji: newTagEmoji.value,
  })
  saveCustomTags(customTags.value)
  newTagLabel.value = ''
  newTagEmoji.value = '🏷️'
  showNewTag.value = false
}

function deleteCustomTag(id: string) {
  customTags.value = customTags.value.filter(t => t.id !== id)
  saveCustomTags(customTags.value)

  for (const e of entries.value) {
    e.tags = e.tags.filter(t => t !== id)
  }
  saveEntries(entries.value)
}

function findTag(id: string): TagItem | undefined {
  return allTags.value.find(t => t.id === id)
}

function exportData() {
  const data = JSON.stringify(entries.value, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `journal-backup-${today}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function importData() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string)
        if (!Array.isArray(data)) throw new Error('Invalid format')
        entries.value = data
        saveEntries(data)
      } catch {
        alert('文件格式错误，请选择有效的 JSON 文件')
      }
    }
    reader.readAsText(file)
  }
  input.click()
}

function resetAll() {
  if (!confirm('确定要清除所有记录吗？此操作不可恢复。')) return
  entries.value = []
  saveEntries([])
}

let syncTimer: ReturnType<typeof setTimeout> | null = null

function debounceSync() {
  if (!gistConfig.value) return
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(doSync, 3000)
}

async function doSync() {
  if (!gistConfig.value) return
  syncStatus.value = 'syncing'
  try {
    await pushToGist(gistConfig.value.gistId, gistConfig.value.token, entries.value)
    syncStatus.value = 'connected'
  } catch {
    syncStatus.value = 'error'
  }
}

async function connectSync() {
  const token = tokenInput.value.trim()
  if (!token) return

  syncStatus.value = 'syncing'
  syncErrorMsg.value = ''

  try {
    const valid = await verifyToken(token)
    if (!valid) throw new Error('Token 无效，请检查权限')

    if (gistConfig.value && gistConfig.value.token === token) {
      const remote = await fetchFromGist(gistConfig.value.gistId, token)
      if (remote.length > entries.value.length) {
        entries.value = remote
        saveEntries(remote)
      }
      await pushToGist(gistConfig.value.gistId, token, entries.value)
    } else {
      const gistId = await createSyncGist(token, entries.value)
      gistConfig.value = { token, gistId }
      saveGistConfig(gistConfig.value)
    }
    syncStatus.value = 'connected'
  } catch (e: unknown) {
    syncStatus.value = 'error'
    syncErrorMsg.value = e instanceof Error ? e.message : '连接失败'
  }
}

function disconnectSync() {
  gistConfig.value = null
  clearGistConfig()
  syncStatus.value = 'idle'
  syncErrorMsg.value = ''
}
</script>

<template>
  <div class="sl">
    <div class="sl-hd">
      <span class="sl-tt">📖 学习手记</span>
      <div class="sl-hd-r">
        <span class="sl-bg">📅 {{ streak }} 天连续</span>
        <span class="sl-bg">📌 {{ totalDays }} 篇</span>
        <span v-if="syncStatus === 'connected'" class="sl-sync" title="已同步到 Gist">☁️</span>
      </div>
    </div>

    <div class="sl-fl">
      <button class="sl-fl-b" :class="{ on: !filterTagId }" @click="filterTagId = null">全部</button>
      <button
        v-for="t in allTags"
        :key="t.id"
        class="sl-fl-b"
        :class="{ on: filterTagId === t.id }"
        @click="toggleFilterTag(t.id)"
      >
        {{ t.emoji }} {{ t.label }}
        <span class="sl-fl-c">{{ tagCounts[t.id] || 0 }}</span>
      </button>
    </div>

    <div class="sl-td" :class="{ 'sl-td-empty': !todayEntry && !editing }" @click="!editing && startEdit()">
      <div class="sl-td-d">{{ today }}</div>

      <div v-if="editing" @click.stop>
        <textarea v-model="inputText" class="sl-ta" placeholder="今天发生了什么？学了什么？有什么感受？" rows="4"></textarea>

        <div class="sl-tg">
          <span
            v-for="t in allTags"
            :key="t.id"
            class="sl-tg-b"
            :class="{ on: selectedTags.includes(t.id) }"
            @click="toggleSelectedTag(t.id)"
          >{{ t.emoji }} {{ t.label }}</span>
          <span class="sl-tg-b sl-tg-add" @click="showNewTag = !showNewTag">+ 新建</span>
        </div>

        <div v-if="showNewTag" class="sl-nt">
          <input v-model="newTagEmoji" class="sl-nt-e" maxlength="2" />
          <input v-model="newTagLabel" class="sl-nt-i" placeholder="标签名" @keyup.enter="addCustomTag" />
          <button class="sl-btn sl-btn-p" @click="addCustomTag">确定</button>
          <button class="sl-btn" @click="showNewTag = false">取消</button>
        </div>

        <div class="sl-ta-acts">
          <button class="sl-btn sl-btn-p" @click="saveEntry">保存</button>
          <button class="sl-btn" @click="cancelEdit">取消</button>
        </div>
      </div>

      <div v-else-if="todayEntry">
        <div class="sl-td-t">{{ todayEntry.text }}</div>
        <div v-if="todayEntry.tags.length" class="sl-tgs">
          <span v-for="t in todayEntry.tags" :key="t" class="sl-tg2">
            {{ findTag(t)?.emoji ?? '📌' }} {{ findTag(t)?.label ?? t }}
          </span>
        </div>
        <div class="sl-td-m">
          <span class="sl-td-e" @click.stop="startEdit">✏️ 编辑</span>
          <span class="sl-td-dl" @click.stop="deleteEntry(today)">🗑️ 删除</span>
        </div>
      </div>

      <div v-else class="sl-td-ep">✍️ 今天还没记，点这里写</div>
    </div>

    <div class="sl-tl">
      <div v-for="log in timeline" :key="log.date" class="sl-el">
        <div class="sl-el-d">{{ formatDate(log.date) }}</div>
        <div class="sl-el-c">
          <div class="sl-el-t">{{ log.text }}</div>
          <div v-if="log.tags.length" class="sl-tgs">
            <span v-for="t in log.tags" :key="t" class="sl-tg2">
              {{ findTag(t)?.emoji ?? '📌' }} {{ findTag(t)?.label ?? t }}
            </span>
          </div>
          <button class="sl-el-rm" @click="deleteEntry(log.date)">✕</button>
        </div>
      </div>
      <div v-if="timeline.length === 0" class="sl-em">
        <div class="sl-em-i">🌱</div>
        <div class="sl-em-t">{{ filterTagId ? '没有匹配的记录' : '还没有记录，写第一篇吧' }}</div>
      </div>
    </div>

    <div class="sl-ad">
      <div class="sl-ad-h" @click="showAdmin = !showAdmin">
        <span>⚙️ 管理</span>
        <span>{{ showAdmin ? '▲' : '▼' }}</span>
      </div>
      <div v-if="showAdmin" class="sl-ad-b">
        <div class="sl-ad-acts">
          <button class="sl-btn" @click="exportData">📥 导出</button>
          <button class="sl-btn" @click="importData">📤 导入</button>
          <button class="sl-btn" @click="resetAll">🗑️ 重置</button>
        </div>

        <div class="sl-sc">
          <div class="sl-sc-tt">☁️ 多设备同步</div>
          <input v-model="tokenInput" type="password" class="sl-inp" placeholder="GitHub Personal Access Token" />
          <div class="sl-sc-acts">
            <button class="sl-btn sl-btn-p" @click="connectSync">
              {{ gistConfig ? '重新同步' : '连接' }}
            </button>
            <button v-if="gistConfig" class="sl-btn" @click="disconnectSync">断开</button>
          </div>
          <div class="sl-sc-st">
            <span v-if="syncStatus === 'connected'">✅ 已同步</span>
            <span v-else-if="syncStatus === 'syncing'">⟳ 同步中...</span>
            <span v-else-if="syncStatus === 'error'" class="sl-sc-err">❌ 同步失败{{ syncErrorMsg ? '：' + syncErrorMsg : '' }}</span>
            <span v-else>未连接</span>
          </div>
          <div class="sl-sc-hint">
            <a href="https://github.com/settings/tokens/new?scopes=gist&description=Journal+Sync" target="_blank">创建 Token（需要 gist 权限）→</a>
          </div>
        </div>

        <div v-if="customTags.length" class="sl-cts">
          <span class="sl-cts-tt">🏷️ 自定义标签：</span>
          <span v-for="t in customTags" :key="t.id" class="sl-ct">
            {{ t.emoji }} {{ t.label }}
            <span class="sl-ct-rm" @click="deleteCustomTag(t.id)">✕</span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sl { max-width: 560px; margin: 0 auto; padding: 4px 0 40px; color: #2d2a24; }
.sl-hd { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.sl-hd-r { display: flex; align-items: center; gap: 8px; }
.sl-tt { font-size: 20px; font-weight: 700; }
.sl-bg { font-size: 12px; padding: 2px 10px; border-radius: 20px; background: #fff; border: 1px solid #e8e4df; color: #8b8580; }
.sl-sync { font-size: 14px; }

.sl-fl { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 16px; }
.sl-fl-b { padding: 4px 12px; border: 1px solid #e8e4df; border-radius: 20px; background: #fff; color: #8b8580; font-size: 12px; cursor: pointer; }
.sl-fl-b:hover { border-color: #e07a5f; color: #e07a5f; }
.sl-fl-b.on { background: #e07a5f; border-color: #e07a5f; color: #fff; }
.sl-fl-c { margin-left: 3px; opacity: 0.6; font-size: 11px; }

.sl-td { background: #fff; border: 1px solid #e8e4df; border-radius: 14px; padding: 16px 18px; margin-bottom: 22px; cursor: pointer; }
.sl-td-empty { border-style: dashed; }
.sl-td-empty:hover { border-color: #e07a5f; }
.sl-td-d { font-size: 11px; color: #8b8580; font-weight: 600; letter-spacing: 1px; margin-bottom: 10px; }
.sl-td-t { font-size: 15px; line-height: 1.7; white-space: pre-wrap; word-break: break-word; }
.sl-td-m { margin-top: 8px; display: flex; gap: 12px; font-size: 12px; }
.sl-td-e { color: #8b8580; cursor: pointer; }
.sl-td-dl { color: #e07a5f; cursor: pointer; }
.sl-td-ep { display: flex; align-items: center; gap: 6px; color: #8b8580; font-size: 14px; }
.sl-ta { width: 100%; padding: 10px 14px; border: 1px solid #e8e4df; border-radius: 10px; background: #f8f6f3; font-size: 14px; font-family: inherit; line-height: 1.7; resize: vertical; outline: none; box-sizing: border-box; }
.sl-ta:focus { border-color: #e07a5f; }
.sl-tg { display: flex; flex-wrap: wrap; gap: 5px; margin: 8px 0; }
.sl-tg-b { padding: 4px 10px; border-radius: 14px; border: 1px solid #e8e4df; background: #fff; font-size: 12px; cursor: pointer; user-select: none; }
.sl-tg-b:hover { border-color: #e07a5f; }
.sl-tg-b.on { background: #e07a5f; border-color: #e07a5f; color: #fff; }
.sl-tg-add { color: #8b8580; border-style: dashed; }
.sl-tg-add:hover { color: #e07a5f; }
.sl-nt { display: flex; gap: 5px; margin-bottom: 8px; align-items: center; flex-wrap: wrap; }
.sl-nt-e { width: 34px; padding: 5px 6px; border: 1px solid #e8e4df; border-radius: 6px; background: #f8f6f3; font-size: 14px; text-align: center; outline: none; box-sizing: border-box; }
.sl-nt-e:focus { border-color: #e07a5f; }
.sl-nt-i { flex: 1; min-width: 80px; padding: 5px 10px; border: 1px solid #e8e4df; border-radius: 6px; background: #f8f6f3; font-size: 13px; outline: none; }
.sl-nt-i:focus { border-color: #e07a5f; }
.sl-ta-acts { display: flex; gap: 8px; margin-top: 2px; }
.sl-btn { padding: 6px 18px; border: 1px solid #e8e4df; border-radius: 8px; background: #fff; color: #2d2a24; font-size: 12px; cursor: pointer; }
.sl-btn:hover { border-color: #8b8580; }
.sl-btn-p { background: #e07a5f; border-color: #e07a5f; color: #fff; }
.sl-btn-p:hover { opacity: 0.9; }
.sl-tgs { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
.sl-tg2 { font-size: 11px; padding: 2px 8px; border-radius: 10px; background: #f8f6f3; border: 1px solid #e8e4df; color: #8b8580; }

.sl-tl { }
.sl-el { padding-bottom: 14px; }
.sl-el:last-child { padding-bottom: 0; }
.sl-el-d { font-size: 11px; color: #8b8580; font-weight: 500; margin-bottom: 5px; }
.sl-el-c { background: #fff; border: 1px solid #e8e4df; border-radius: 10px; padding: 12px 16px; position: relative; }
.sl-el-t { font-size: 14px; line-height: 1.6; white-space: pre-wrap; word-break: break-word; }
.sl-el-rm { position: absolute; top: 7px; right: 8px; opacity: 0; background: none; border: none; color: #8b8580; cursor: pointer; font-size: 12px; padding: 2px 4px; }
.sl-el-c:hover .sl-el-rm { opacity: 1; }
.sl-el-rm:hover { color: #e07a5f; }
.sl-em { text-align: center; padding: 40px 0; color: #8b8580; font-size: 14px; }
.sl-em-i { font-size: 36px; margin-bottom: 6px; }
.sl-em-t { font-size: 15px; }

.sl-ad { margin-top: 24px; background: #fff; border: 1px solid #e8e4df; border-radius: 12px; overflow: hidden; }
.sl-ad-h { display: flex; justify-content: space-between; padding: 11px 16px; cursor: pointer; font-size: 13px; color: #8b8580; user-select: none; }
.sl-ad-h:hover { background: rgba(0,0,0,0.01); }
.sl-ad-b { padding: 0 16px 14px; }
.sl-ad-acts { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.sl-sc { border-top: 1px solid #e8e4df; padding-top: 12px; display: flex; flex-direction: column; gap: 8px; }
.sl-sc-tt { font-size: 13px; font-weight: 600; }
.sl-inp { padding: 7px 12px; border: 1px solid #e8e4df; border-radius: 8px; background: #f8f6f3; font-size: 12px; outline: none; box-sizing: border-box; width: 100%; }
.sl-inp:focus { border-color: #e07a5f; }
.sl-sc-acts { display: flex; gap: 8px; }
.sl-sc-st { font-size: 12px; color: #81b29a; }
.sl-sc-err { color: #e07a5f; }
.sl-sc-hint { font-size: 11px; color: #aaa; }
.sl-sc-hint a { color: #e07a5f; text-decoration: none; }
.sl-cts { margin-top: 12px; display: flex; flex-wrap: wrap; gap: 5px; align-items: center; }
.sl-cts-tt { font-size: 12px; color: #8b8580; }
.sl-ct { font-size: 12px; padding: 2px 8px; border-radius: 6px; background: #f8f6f3; border: 1px solid #e8e4df; display: inline-flex; align-items: center; gap: 2px; }
.sl-ct-rm { cursor: pointer; color: #8b8580; font-size: 10px; margin-left: 2px; }
.sl-ct-rm:hover { color: #e07a5f; }
</style>

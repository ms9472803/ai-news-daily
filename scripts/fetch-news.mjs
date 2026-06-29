#!/usr/bin/env node
// Daily AI news collector: fetches the RSS/Atom feeds listed in feeds.config.json,
// parses, dedupes, sorts by date, then writes public/news.json for the frontend.
//
// Usage: node scripts/fetch-news.mjs
// No API key required; uses Node's built-in fetch (Node 18+).

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const CONFIG_PATH = join(ROOT, 'feeds.config.json')
const OUT_PATH = join(ROOT, 'public', 'news.json')

const MAX_ITEMS = 200 // Max number of articles to keep
const MAX_PER_SOURCE = 30 // Max articles per source, to stop one source (e.g. arXiv) from flooding
const FETCH_TIMEOUT_MS = 15000
const FETCH_RETRIES = 2 // Retry transient failures up to this many times
const RETRY_DELAY_MS = 1500 // Base delay between retries (doubles each attempt)

// Low-signal titles (e.g. smol.ai's daily "not much happened today") — skip so they don't crowd out real news
const NOISE_TITLE_PATTERNS = [/^not much happened today/i]
function isNoise(title) {
  return NOISE_TITLE_PATTERNS.some((re) => re.test(title.trim()))
}

/** Extract the first <tag>...</tag> from XML (CDATA-aware); returns '' if not found */
function pick(block, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const m = block.match(re)
  if (!m) return ''
  return stripCdata(m[1]).trim()
}

/** Read an attribute value, e.g. Atom's <link href="..."/> */
function pickAttr(block, tag, attr) {
  const re = new RegExp(`<${tag}\\b[^>]*\\b${attr}=["']([^"']+)["'][^>]*>`, 'i')
  const m = block.match(re)
  return m ? m[1].trim() : ''
}

function stripCdata(s) {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
}

const NAMED_ENTITIES = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&hellip;': '…',
  '&mdash;': '—',
  '&ndash;': '–',
}

/** Decode HTML entities: named (table above) plus decimal (&#8217;) and hex (&#x2019;) */
function decodeEntities(s) {
  return s
    .replace(/&[a-z]+;/gi, (m) => NAMED_ENTITIES[m] ?? m)
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
}

/** Strip HTML tags, decode entities, collapse whitespace, truncate into a summary */
function toSummary(html, max = 280) {
  const text = decodeEntities(stripCdata(html).replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > max ? text.slice(0, max).trimEnd() + '…' : text
}

function parseDate(raw) {
  if (!raw) return null
  const t = Date.parse(raw)
  return Number.isNaN(t) ? null : new Date(t).toISOString()
}

/** Parse an array of articles from feed XML (supports both RSS <item> and Atom <entry>) */
function parseFeed(xml, source) {
  const items = []
  const isAtom = /<entry[\s>]/i.test(xml) && !/<item[\s>]/i.test(xml)
  const blockRe = isAtom
    ? /<entry[\s>][\s\S]*?<\/entry>/gi
    : /<item[\s>][\s\S]*?<\/item>/gi

  const blocks = xml.match(blockRe) || []
  for (const block of blocks) {
    const title = pick(block, 'title')
    let link = pick(block, 'link') || pickAttr(block, 'link', 'href')
    if (!link) link = pick(block, 'guid')
    const rawDate =
      pick(block, 'pubDate') ||
      pick(block, 'published') ||
      pick(block, 'updated') ||
      pick(block, 'dc:date')
    const summary =
      pick(block, 'description') ||
      pick(block, 'summary') ||
      pick(block, 'content') ||
      pick(block, 'content:encoded')

    if (!title || !link) continue
    if (isNoise(title)) continue
    items.push({
      title: toSummary(title, 200),
      link: link.trim(),
      summary: toSummary(summary),
      publishedAt: parseDate(rawDate),
      source: source.name,
      category: source.category,
    })
  }
  return items
}

async function fetchFeed(feed) {
  for (let attempt = 0; attempt <= FETCH_RETRIES; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    try {
      const res = await fetch(feed.url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'ai-news-daily/1.0 (+https://github.com)' },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const xml = await res.text()
      const items = parseFeed(xml, feed)
      console.log(`  ✓ ${feed.name}: ${items.length} 篇`)
      return items
    } catch (err) {
      clearTimeout(timer)
      const isLast = attempt === FETCH_RETRIES
      if (isLast) {
        console.warn(`  ✗ ${feed.name}: ${err.message}`)
        return []
      }
      const delay = RETRY_DELAY_MS * (attempt + 1)
      console.warn(`  ↻ ${feed.name}: ${err.message} — retrying in ${delay}ms (attempt ${attempt + 1}/${FETCH_RETRIES})`)
      await new Promise((r) => setTimeout(r, delay))
    } finally {
      clearTimeout(timer)
    }
  }
  return []
}

async function main() {
  const { feeds } = JSON.parse(await readFile(CONFIG_PATH, 'utf8'))
  console.log(`抓取 ${feeds.length} 個來源…`)

  const results = await Promise.all(feeds.map(fetchFeed))
  const all = results.flat()

  // Dedupe by link
  const seen = new Set()
  const deduped = []
  for (const item of all) {
    const key = item.link
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(item)
  }

  const byDateDesc = (a, b) => {
    const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0
    const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0
    return tb - ta
  }

  // Keep the newest MAX_PER_SOURCE items per source to prevent any one source from flooding
  const perSource = new Map()
  for (const item of deduped) {
    const list = perSource.get(item.source) ?? []
    list.push(item)
    perSource.set(item.source, list)
  }
  const capped = []
  for (const list of perSource.values()) {
    list.sort(byDateDesc)
    capped.push(...list.slice(0, MAX_PER_SOURCE))
  }

  // After merging, sort globally by published date, newest first (undated items last)
  capped.sort(byDateDesc)
  const items = capped.slice(0, MAX_ITEMS)
  const payload = {
    generatedAt: new Date().toISOString(),
    sources: feeds.map((f) => f.name),
    count: items.length,
    items,
  }

  await mkdir(dirname(OUT_PATH), { recursive: true })
  await writeFile(OUT_PATH, JSON.stringify(payload, null, 2) + '\n', 'utf8')
  console.log(`完成：寫入 ${items.length} 篇到 public/news.json`)
}

main().catch((err) => {
  console.error('搜集失敗：', err)
  process.exit(1)
})

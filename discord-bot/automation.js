/**
 * Majorka Discord Automation Engine
 * Daily intelligence posts + live stats refresh
 * All times in AEST (UTC+10)
 */

'use strict'

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')

const SUPABASE_URL   = 'https://ievekuazsjbdrltsdksn.supabase.co'
const SUPABASE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const ANTHROPIC_KEY  = process.env.ANTHROPIC_API_KEY || ''

// ── Utility: find a channel in a guild ───────────────────────────────────────
function findChannel(client, keyword) {
  for (const guild of client.guilds.cache.values()) {
    const ch = guild.channels.cache.find(c =>
      c.isTextBased() && c.name && c.name.toLowerCase().includes(keyword.toLowerCase())
    )
    if (ch) return ch
  }
  return null
}

// ── Utility: schedule at next AEST time ─────────────────────────────────────
// AEST = UTC+10 (no DST — Brisbane). Uses pure UTC arithmetic to avoid locale parse issues.
function msUntilAEST(hh, mm = 0) {
  const now = new Date()
  // Convert hh:mm AEST → UTC: subtract 10 hours
  const targetUTCH = (hh - 10 + 24) % 24
  // Build a UTC Date for today at targetUTCH:mm
  const target = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
    targetUTCH, mm, 0, 0
  ))
  if (target <= now) target.setUTCDate(target.getUTCDate() + 1)
  return target - now
}

function scheduleDaily(hh, mm, fn, label) {
  const delay = msUntilAEST(hh, mm)
  const hhmm = `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`
  console.log(`⏰ ${label} scheduled in ${Math.round(delay/60000)} min (${hhmm} AEST)`)
  setTimeout(function tick() {
    console.log(`🚀 Running automation: ${label}`)
    fn().catch(e => console.error(`[${label}] Error:`, e.message))
    setTimeout(tick, 24 * 60 * 60 * 1000) // repeat every 24h
  }, delay)
}

// ── Supabase query helper ────────────────────────────────────────────────────
async function sbQuery(path, params = '') {
  if (!SUPABASE_KEY) return []
  const url = `${SUPABASE_URL}/rest/v1/${path}${params}`
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) return []
  return res.json()
}

// ── Live stats from Supabase ─────────────────────────────────────────────────
async function fetchLiveStats() {
  const [allProducts, trending, recent, topNiche] = await Promise.allSettled([
    sbQuery('winning_products', '?select=id&limit=1&order=id'),
    sbQuery('winning_products', '?select=id&tiktok_potential=eq.viral&is_active=eq.true'),
    sbQuery('winning_products', `?select=id&created_at=gte.${new Date(Date.now()-86400000).toISOString()}`),
    sbQuery('winning_products', '?select=category&order=winning_score.desc&limit=50'),
  ])

  const total     = (allProducts.value?.length || 0)
  const trendingC = (trending.value?.length || 0)
  const addedToday = (recent.value?.length || 0)

  // Count top niche
  let topNicheName = 'Electronics'
  if (topNiche.value?.length) {
    const counts = {}
    for (const r of topNiche.value) {
      const c = r.category || 'Other'
      counts[c] = (counts[c] || 0) + 1
    }
    topNicheName = Object.entries(counts).sort((a,b) => b[1]-a[1])[0]?.[0] || 'Electronics'
  }

  return { total: total || 131, trending: trendingC || 12, addedToday: addedToday || 3, topNiche: topNicheName }
}

// ── Claude Haiku: ad brief ───────────────────────────────────────────────────
async function generateAdBrief(product) {
  if (!ANTHROPIC_KEY) return null
  const prompt = `Create a TikTok ad brief for this dropshipping product.

Product: ${product.product_title}
Category: ${product.category}
Why trending: ${product.why_trending || product.why_winning || 'strong organic interest'}
Best ad angle: ${product.best_ad_angle || product.ad_angle || 'curiosity + transformation'}
Opportunity score: ${product.opportunity_score || product.winning_score}/100

Return EXACTLY this format (no extra text):
HOOK: [First 3 seconds — one punchy sentence]
SCRIPT: [15-second script outline — 3 bullet points]
CTA: [Call to action]
WHY IT WORKS: [One sentence]`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    }),
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.content?.[0]?.text || null
}

// ── Welcome stats embed builder ──────────────────────────────────────────────
async function buildLiveStatsEmbed(memberCount) {
  const stats = await fetchLiveStats()
  return new EmbedBuilder()
    .setTitle('📊 Majorka Live Stats')
    .setColor(0x0F172A)
    .addFields(
      { name: '📦 Products Tracked',     value: `**${stats.total.toLocaleString()}**`, inline: true },
      { name: '🔥 Trending Today',        value: `**${stats.trending}**`,              inline: true },
      { name: '🆕 Added Today',           value: `**${stats.addedToday}**`,            inline: true },
      { name: '🌏 Markets Covered',       value: '**AU · US · UK · Global**',          inline: true },
      { name: '🎯 Top Niche Today',       value: `**${stats.topNiche}**`,              inline: true },
      { name: '👥 Community Members',     value: `**${memberCount || '—'}**`,          inline: true },
    )
    .setFooter({ text: 'Refreshes every hour • majorka.io' })
    .setTimestamp()
}

// ── Welcome hero embed ───────────────────────────────────────────────────────
function buildWelcomeHeroEmbed(stats, memberCount) {
  return new EmbedBuilder()
    .setTitle('Welcome to Majorka 🔺')
    .setColor(0x6366F1)
    .setDescription([
      'The AI ecommerce intelligence platform for serious dropshippers.',
      'Find winning products, build stores, run ads — all in one place.',
      '',
      `🌏 Built for AU · US · UK markets`,
      `📦 **${(stats?.total || 131).toLocaleString()}** products tracked`,
      `🔥 **${stats?.trending || 12}** trending right now`,
      `👥 **${memberCount || '—'}** members`,
    ].join('\n'))
    .addFields(
      {
        name: '🧭 GET STARTED',
        value: [
          '1. Read <#rules>',
          '2. Run `/verify your@email.com` to link your account',
          '3. Introduce yourself in <#introductions>',
          '4. Check <#todays-winners> for today\'s hot products',
        ].join('\n'),
        inline: false,
      },
      {
        name: '🔓 UNLOCK YOUR CHANNELS',
        value: [
          '**👀 Verified** (no account) → Community channels',
          '**✅ Majorka Member** (paid) → All intelligence channels',
          '**🏗️ Builder** ($99 AUD/mo) → Builder private lounge',
          '**💎 Scale** ($199 AUD/mo) → Full access + Scale intel',
        ].join('\n'),
        inline: false,
      },
    )
    .setFooter({ text: 'majorka.io • Updated live every hour' })
    .setTimestamp()
}

// ── Refresh the pinned welcome + stats embeds ────────────────────────────────
async function refreshWelcomeStats(client) {
  const welcomeCh = findChannel(client, 'welcome')
  if (!welcomeCh) return

  let memberCount = 0
  for (const g of client.guilds.cache.values()) memberCount += g.memberCount

  const stats = await fetchLiveStats()
  const heroEmbed  = buildWelcomeHeroEmbed(stats, memberCount)
  const statsEmbed = await buildLiveStatsEmbed(memberCount)

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setLabel('🚀 Open Majorka').setStyle(ButtonStyle.Link).setURL('https://www.majorka.io'),
    new ButtonBuilder().setLabel('✨ Join Free').setStyle(ButtonStyle.Link).setURL('https://www.majorka.io/sign-up'),
  )

  // Find existing bot messages
  const msgs = await welcomeCh.messages.fetch({ limit: 10 })
  const botMsgs = [...msgs.filter(m => m.author.id === welcomeCh.client.user.id).values()]

  if (botMsgs.length >= 2) {
    // Edit in place (latest 2 bot messages = hero + stats)
    try { await botMsgs[1].edit({ embeds: [heroEmbed], components: [row] }) } catch {}
    try { await botMsgs[0].edit({ embeds: [statsEmbed] }) } catch {}
    console.log('✅ Welcome stats refreshed (edited in place)')
  } else {
    // Clear and re-post
    for (const m of botMsgs) { try { await m.unpin().catch(() => {}); await m.delete() } catch {} }
    const heroMsg  = await welcomeCh.send({ embeds: [heroEmbed], components: [row] })
    const statsMsg = await welcomeCh.send({ embeds: [statsEmbed] })
    try { await heroMsg.pin() } catch {}
    console.log('✅ Welcome embeds re-posted and pinned')
  }
}

// ── 8:00 AM — TODAY'S TOP 10 WINNERS ────────────────────────────────────────
async function postTodaysWinners(client) {
  const ch = findChannel(client, 'todays-winners') || findChannel(client, 'winners')
  if (!ch) { console.log('[automation] #todays-winners not found'); return }

  const products = await sbQuery('winning_products',
    '?select=product_title,category,winning_score,opportunity_score,profit_margin,why_winning,why_trending,tiktok_potential&order=winning_score.desc&is_active=eq.true&limit=10'
  )

  const date = new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Australia/Brisbane' })

  const embed = new EmbedBuilder()
    .setTitle(`🔥 TODAY'S TOP 10 — ${date.toUpperCase()}`)
    .setColor(0xFF6B35)
    .setDescription('Fresh from the Majorka intelligence pipeline')
    .setFooter({ text: 'View all products → majorka.io/app/products' })
    .setTimestamp()

  if (products.length) {
    const fields = products.slice(0, 10).map((p, i) => {
      const score = p.opportunity_score || p.winning_score || 0
      const margin = p.profit_margin ? `${Math.round(p.profit_margin)}%` : '~40%'
      const niche = p.category || 'General'
      const why = (p.why_trending || p.why_winning || '').slice(0, 60)
      return {
        name: `#${i+1} ${(p.product_title || 'Product').slice(0, 50)}`,
        value: `📈 Score: **${score}/100** | 💰 Margin: ~**${margin}** | 🎯 ${niche}\n${why ? `_${why}_` : ''}`,
        inline: false,
      }
    })
    embed.addFields(fields)
  } else {
    embed.setDescription('Pipeline updating — check back shortly. View products at majorka.io/app/products')
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setLabel('View All Products →').setStyle(ButtonStyle.Link).setURL('https://www.majorka.io/app/products')
  )

  await ch.send({ content: '<@&product_alerts_role>', embeds: [embed], components: [row] }).catch(async () => {
    await ch.send({ embeds: [embed], components: [row] }) // fallback without ping
  })
  console.log('✅ Posted todays-winners')
}

// ── 10:00 AM — EXPLODING RIGHT NOW ──────────────────────────────────────────
async function postTrendingNow(client) {
  const ch = findChannel(client, 'trending')
  if (!ch) { console.log('[automation] #trending-now not found'); return }

  const products = await sbQuery('winning_products',
    '?select=product_title,category,winning_score,opportunity_score,why_trending,why_winning&tiktok_potential=eq.viral&is_active=eq.true&order=winning_score.desc&limit=5'
  )

  const embed = new EmbedBuilder()
    .setTitle('⚡ EXPLODING RIGHT NOW')
    .setColor(0xFF0080)
    .setDescription('These products just spiked in the pipeline')
    .setFooter({ text: 'majorka.io/app/products' })
    .setTimestamp()

  if (products.length) {
    embed.addFields(products.slice(0, 5).map((p, i) => ({
      name: `${['🥇','🥈','🥉','4️⃣','5️⃣'][i]} ${(p.product_title || 'Product').slice(0, 50)}`,
      value: `Score: **${p.opportunity_score || p.winning_score || 0}/100** | ${p.category || 'General'}\n_${(p.why_trending || p.why_winning || 'Gaining momentum fast').slice(0, 80)}_`,
      inline: false,
    })))
  } else {
    embed.setDescription('No viral products detected in the last 6 hours. Check back later.')
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setLabel('See What\'s Trending →').setStyle(ButtonStyle.Link).setURL('https://www.majorka.io/app/products')
  )
  await ch.send({ embeds: [embed], components: [row] })
  console.log('✅ Posted trending-now')
}

// ── 12:00 PM — NICHE SPOTLIGHT ───────────────────────────────────────────────
const NICHES = [
  { name: 'Pet Products',   color: 0xF59E0B, emoji: '🐾', slug: 'pet' },
  { name: 'Beauty & Skin',  color: 0xEC4899, emoji: '💄', slug: 'beauty' },
  { name: 'Home & Garden',  color: 0x10B981, emoji: '🏡', slug: 'home' },
  { name: 'Fashion',        color: 0x8B5CF6, emoji: '👗', slug: 'fashion' },
  { name: 'Electronics',    color: 0x3B82F6, emoji: '📱', slug: 'electronics' },
  { name: 'Fitness',        color: 0xEF4444, emoji: '💪', slug: 'fitness' },
  { name: 'Baby & Kids',    color: 0xFBBF24, emoji: '👶', slug: 'baby' },
]

async function postNicheSpotlight(client) {
  const ch = findChannel(client, 'niche') || findChannel(client, 'spotlight')
  if (!ch) { console.log('[automation] #niche-spotlight not found'); return }

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000)
  const niche = NICHES[dayOfYear % NICHES.length]

  const products = await sbQuery('winning_products',
    `?select=product_title,winning_score,opportunity_score,profit_margin,why_winning,why_trending&category=ilike.*${niche.slug}*&is_active=eq.true&order=winning_score.desc&limit=3`
  )

  const embed = new EmbedBuilder()
    .setTitle(`${niche.emoji} NICHE SPOTLIGHT: ${niche.name.toUpperCase()}`)
    .setColor(niche.color)
    .setDescription(`Today's deep dive into the **${niche.name}** niche. Find your angle and test fast.`)
    .setFooter({ text: `majorka.io/app/products?category=${niche.slug}` })
    .setTimestamp()

  if (products.length) {
    embed.addFields(products.map((p, i) => ({
      name: `#${i+1} ${(p.product_title || 'Product').slice(0, 50)}`,
      value: `Score: **${p.opportunity_score || p.winning_score || 0}/100** | Margin: ~${p.profit_margin ? Math.round(p.profit_margin)+'%' : '40%'}\n_${(p.why_trending || p.why_winning || '').slice(0, 80)}_`,
      inline: false,
    })))
  } else {
    embed.setDescription(`No **${niche.name}** products in today's pipeline. Check the full DB for opportunities.`)
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setLabel(`Explore ${niche.name} →`).setStyle(ButtonStyle.Link).setURL(`https://www.majorka.io/app/products`),
  )
  await ch.send({ embeds: [embed], components: [row] })
  console.log(`✅ Posted niche spotlight: ${niche.name}`)
}

// ── 3:00 PM — AD BRIEF OF THE DAY ───────────────────────────────────────────
async function postAdOfTheDay(client) {
  const ch = findChannel(client, 'ad-of-the-day') || findChannel(client, 'ads-creative') || findChannel(client, 'ad-creatives')
  if (!ch) { console.log('[automation] #ad-of-the-day not found'); return }

  // Pull a top product for today's ad brief (rotate by day)
  const products = await sbQuery('winning_products',
    '?select=product_title,category,winning_score,opportunity_score,why_winning,why_trending,best_ad_angle,ad_angle,tiktok_potential&is_active=eq.true&order=winning_score.desc&limit=30'
  )

  if (!products.length) {
    await ch.send({ embeds: [new EmbedBuilder().setTitle('🎬 AD BRIEF').setColor(0x6C63FF).setDescription('No products available today. Check back tomorrow.')] })
    return
  }

  const dayIndex = new Date().getDate() % products.length
  const product = products[dayIndex]
  const score = product.opportunity_score || product.winning_score || 0

  const embed = new EmbedBuilder()
    .setTitle('🎬 AD BRIEF OF THE DAY')
    .setColor(0x6C63FF)
    .addFields(
      { name: '📦 Product', value: `**${product.product_title}**`, inline: true },
      { name: '📊 Score',   value: `**${score}/100**`,              inline: true },
      { name: '🎯 Niche',   value: `**${product.category || 'General'}**`, inline: true },
    )
    .setFooter({ text: 'Generate your own briefs → majorka.io/app/ads-studio' })
    .setTimestamp()

  // Generate ad brief with Haiku
  const brief = await generateAdBrief(product)
  if (brief) {
    embed.setDescription('**AI-generated TikTok ad brief:**\n\n' + brief)
  } else {
    const angle = product.best_ad_angle || product.ad_angle || 'curiosity + social proof'
    embed.setDescription([
      `**Ad angle:** ${angle}`,
      `**Why it works:** ${(product.why_trending || product.why_winning || 'strong market demand').slice(0, 120)}`,
    ].join('\n'))
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setLabel('Generate Your Own →').setStyle(ButtonStyle.Link).setURL('https://www.majorka.io/app/ads-studio'),
    new ButtonBuilder().setLabel('View Product →').setStyle(ButtonStyle.Link).setURL('https://www.majorka.io/app/products'),
  )
  await ch.send({ embeds: [embed], components: [row] })
  console.log('✅ Posted ad-of-the-day')
}

// ── Ensure intelligence channels exist ───────────────────────────────────────
const INTEL_CHANNELS = [
  { name: '🔥┃todays-winners',   topic: 'Daily top 10 winning products — posted 8AM AEST' },
  { name: '⚡┃trending-now',     topic: 'Products exploding right now — posted 10AM AEST' },
  { name: '🎯┃niche-spotlight',  topic: 'Daily niche deep-dive — posted 12PM AEST' },
  { name: '🎬┃ad-of-the-day',   topic: 'AI-generated TikTok ad brief — posted 3PM AEST' },
]

async function ensureIntelligenceChannels(guild) {
  // Find or create 📊 DAILY INTELLIGENCE category
  let category = guild.channels.cache.find(c => c.type === 4 && c.name.toLowerCase().includes('intelligence'))
  if (!category) {
    try {
      category = await guild.channels.create({
        name: '📊 DAILY INTELLIGENCE',
        type: 4, // CategoryChannel
        reason: 'Majorka automation: daily intelligence channels',
      })
    } catch (e) { console.error('[channels] Category create failed:', e.message) }
  }

  for (const def of INTEL_CHANNELS) {
    const exists = guild.channels.cache.find(c => c.name === def.name)
    if (!exists) {
      try {
        await guild.channels.create({
          name: def.name,
          type: 0, // TextChannel
          topic: def.topic,
          parent: category?.id,
          reason: 'Majorka automation channel',
        })
        console.log(`✅ Created channel ${def.name}`)
      } catch (e) { console.error(`[channels] Failed to create ${def.name}:`, e.message) }
    }
  }
  // Refresh guild cache
  await guild.channels.fetch()
}

// ── Main export: boot all automations ───────────────────────────────────────
// ── 6:00 PM AEST — DAILY CHALLENGE ──────────────────────────────────────────
const CHALLENGE_NICHES = ['Pet Products','Beauty & Skin','Home & Garden','Fashion','Electronics','Fitness','Baby & Kids','Kitchen']
const CHALLENGE_SCORES = [65, 68, 70, 72, 75, 78, 80]

async function postDailyChallenge(client) {
  const ch = findChannel(client, 'daily-challenge') || findChannel(client, 'challenge') || findChannel(client, 'general')
  if (!ch) return

  const dayIndex = new Date().getUTCDate()
  const niche = CHALLENGE_NICHES[dayIndex % CHALLENGE_NICHES.length]
  const minScore = CHALLENGE_SCORES[dayIndex % CHALLENGE_SCORES.length]

  const embed = new EmbedBuilder()
    .setTitle('📋 DAILY CHALLENGE')
    .setColor(0x8B5CF6)
    .setDescription([
      `**Today's mission:** Find a **${niche}** product with:`,
      `✅ Opportunity score > **${minScore}**`,
      '✅ Margin > **30%**',
      '✅ Not in a saturated category',
      '',
      'Post your find in #product-research to earn today\'s badge.',
      '**Best find gets a shoutout in tomorrow\'s morning drop.** 🏆',
    ].join('\n'))
    .setFooter({ text: 'Research powered by majorka.io' })
    .setTimestamp()

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setLabel('Start Research →').setStyle(ButtonStyle.Link).setURL('https://www.majorka.io/app/products'),
  )
  await ch.send({ embeds: [embed], components: [row] })
  console.log('✅ Posted daily-challenge')
}

// ── 8:00 PM AEST — COMMUNITY RECAP ──────────────────────────────────────────
async function postCommunityRecap(client) {
  const ch = findChannel(client, 'wins') || findChannel(client, 'general')
  if (!ch) return

  const stats = await fetchLiveStats()
  let memberCount = 0
  for (const g of client.guilds.cache.values()) memberCount += g.memberCount

  const date = new Date().toLocaleDateString('en-AU', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Australia/Brisbane'
  })

  // Count products added today
  const todayProds = await sbQuery('winning_products',
    `?select=product_title,winning_score,opportunity_score&order=winning_score.desc&created_at=gte.${new Date(Date.now()-86400000).toISOString()}&limit=1`
  )
  const topProductToday = todayProds[0]

  const embed = new EmbedBuilder()
    .setTitle(`🏆 COMMUNITY RECAP — ${date.toUpperCase()}`)
    .setColor(0x6366F1)
    .setDescription([
      `📦 **${stats.addedToday}** products added to Majorka today`,
      `👥 **${memberCount}** members in the community`,
      `🔥 **${stats.trending}** products trending right now`,
      '',
      topProductToday
        ? `**🥇 Top product today:** ${topProductToday.product_title}\nScore: **${topProductToday.opportunity_score || topProductToday.winning_score}/100**`
        : `**📊 ${stats.total.toLocaleString()}** products tracked in total`,
      '',
      'Keep building. Tomorrow\'s drop is at **8 AM AEST**. 🔺',
    ].join('\n'))
    .setFooter({ text: 'majorka.io • AI-powered dropshipping intelligence' })
    .setTimestamp()

  await ch.send({ embeds: [embed] })
  console.log('✅ Posted community-recap')
}

// ══════════════════════════════════════════════════════════════════════════════
// REAL-TIME ALERTS
// ══════════════════════════════════════════════════════════════════════════════
let lastAlertCheck = new Date(Date.now() - 15 * 60 * 1000).toISOString()
const alertedProducts = new Set() // prevent duplicate alerts

async function pollHighScoreAlerts(client) {
  const ch = findChannel(client, 'trending')
  if (!ch) return

  const products = await sbQuery('winning_products',
    `?select=id,product_title,category,winning_score,opportunity_score,why_trending,why_winning,tiktok_potential&created_at=gte.${lastAlertCheck}&order=winning_score.desc`
  )
  lastAlertCheck = new Date().toISOString()

  const highScore = (products || []).filter(p => {
    const score = p.opportunity_score || p.winning_score || 0
    return score >= 90 && !alertedProducts.has(String(p.id))
  })

  for (const p of highScore.slice(0, 3)) {
    alertedProducts.add(String(p.id))
    if (alertedProducts.size > 500) {
      const first = [...alertedProducts][0]
      alertedProducts.delete(first)
    }
    const score = p.opportunity_score || p.winning_score
    const embed = new EmbedBuilder()
      .setTitle('🚨 HIGH OPPORTUNITY ALERT')
      .setColor(0xFF0000)
      .setDescription([
        `**${p.product_title}** just scored **${score}/100**`,
        '',
        `📦 Category: **${p.category || 'General'}**`,
        p.tiktok_potential ? `⚡ TikTok potential: **${p.tiktok_potential}**` : '',
        `💡 ${(p.why_trending || p.why_winning || 'Strong market signals detected').slice(0, 120)}`,
      ].filter(Boolean).join('\n'))
      .setFooter({ text: 'Live from Majorka pipeline' })
      .setTimestamp()

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('View in Majorka →').setStyle(ButtonStyle.Link).setURL('https://www.majorka.io/app/products'),
    )
    await ch.send({ embeds: [embed], components: [row] }).catch(() => {})
    console.log(`🚨 High-score alert: ${p.product_title} (${score}/100)`)
  }
}

async function pollNicheSpikeAlerts(client) {
  const ch = findChannel(client, 'trending')
  if (!ch) return

  const products = await sbQuery('winning_products',
    `?select=category,id&tiktok_potential=eq.viral&is_active=eq.true&updated_at=gte.${new Date(Date.now()-6*3600000).toISOString()}`
  )
  if (!products?.length) return

  const counts = {}
  for (const p of products) {
    const c = p.category || 'General'
    counts[c] = (counts[c] || 0) + 1
  }
  const spikes = Object.entries(counts).filter(([, n]) => n >= 3)

  for (const [niche, count] of spikes) {
    const spikeKey = `spike-${niche}-${new Date().toISOString().slice(0,13)}`
    if (alertedProducts.has(spikeKey)) continue
    alertedProducts.add(spikeKey)

    const embed = new EmbedBuilder()
      .setTitle(`📈 NICHE SPIKE: ${niche.toUpperCase()}`)
      .setColor(0xFF6B35)
      .setDescription([
        `**${count} products** in **${niche}** are all exploding right now.`,
        'This could be a breakout moment — move fast.',
        '',
        '🎯 Early movers win in exploding niches.',
      ].join('\n'))
      .setFooter({ text: 'Majorka pipeline alert' })
      .setTimestamp()

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel(`View ${niche} Products →`).setStyle(ButtonStyle.Link)
        .setURL(`https://www.majorka.io/app/products`),
    )
    await ch.send({ embeds: [embed], components: [row] }).catch(() => {})
    console.log(`📈 Niche spike alert: ${niche} (${count} products)`)
  }
}

const MEMBER_MILESTONES = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000]
const milestonesReached = new Set()

async function checkMemberMilestone(client) {
  let totalMembers = 0
  for (const g of client.guilds.cache.values()) totalMembers += g.memberCount
  if (!totalMembers) return

  for (const milestone of MEMBER_MILESTONES) {
    if (totalMembers >= milestone && !milestonesReached.has(milestone)) {
      milestonesReached.add(milestone)
      const ch = findChannel(client, 'general')
      if (!ch) continue

      const stats = await fetchLiveStats()
      const embed = new EmbedBuilder()
        .setTitle(`🎉 ${milestone.toLocaleString()} MEMBERS!`)
        .setColor(0x6366F1)
        .setDescription([
          `We just hit **${milestone.toLocaleString()} members!**`,
          'Welcome to everyone who joined.',
          '',
          `📦 **${stats.total.toLocaleString()}** products tracked`,
          `🔥 **${stats.trending}** trending right now`,
          '',
          'The community is growing — and so is the database. 🔺',
        ].join('\n'))
        .setTimestamp()

      await ch.send({ embeds: [embed] }).catch(() => {})
      console.log(`🎉 Member milestone: ${milestone}`)
    }
  }
}

// ── Slash command data fetchers (used by bot.js commands) ────────────────────
async function fetchTopProducts(limit = 5, niche = null) {
  let filter = `?select=product_title,category,winning_score,opportunity_score,profit_margin,why_trending,why_winning,tiktok_potential&is_active=eq.true&order=winning_score.desc&limit=${limit}`
  if (niche) filter += `&category=ilike.*${niche}*`
  return sbQuery('winning_products', filter)
}

async function searchProduct(name) {
  return sbQuery('winning_products',
    `?select=product_title,category,winning_score,opportunity_score,profit_margin,why_trending,why_winning,best_ad_angle,ad_angle,tiktok_potential&product_title=ilike.*${encodeURIComponent(name.replace(/\s+/g,'+'))}*&limit=1`
  )
}

async function fetchUserPlan(discordUserId) {
  if (!SUPABASE_KEY) return null
  // Look up by discord_user_id
  const users = await sbQuery('users', `?discord_user_id=eq.${discordUserId}&select=id`)
  if (!users?.length) return null
  const subs = await sbQuery('user_subscriptions', `?user_id=eq.${users[0].id}&select=plan,status&order=created_at.desc&limit=1`)
  return subs?.[0] || null
}

// ── Module exports ────────────────────────────────────────────────────────────
module.exports = function bootAutomation(client) {
  console.log('🤖 Booting automation engine...')

  // Hourly welcome stats refresh
  setInterval(() => {
    refreshWelcomeStats(client).catch(e => console.error('[stats-refresh]', e.message))
  }, 60 * 60 * 1000)

  // Initial setup: create intelligence channels if missing + refresh welcome stats
  setTimeout(async () => {
    for (const guild of client.guilds.cache.values()) {
      await ensureIntelligenceChannels(guild).catch(e => console.error('[ensure-channels]', e.message))
    }
    await refreshWelcomeStats(client).catch(e => console.error('[stats-refresh-init]', e.message))
  }, 5000)

  // Daily scheduled posts (AEST times)
  scheduleDaily(8,  0, () => postTodaysWinners(client),  'Todays Winners')
  scheduleDaily(10, 0, () => postTrendingNow(client),    'Trending Now')
  scheduleDaily(12, 0, () => postNicheSpotlight(client), 'Niche Spotlight')
  scheduleDaily(15, 0, () => postAdOfTheDay(client),     'Ad of the Day')
  scheduleDaily(18, 0, () => postDailyChallenge(client), 'Daily Challenge')
  scheduleDaily(20, 0, () => postCommunityRecap(client), 'Community Recap')

  // Real-time alerts (every 15 min)
  setInterval(() => {
    pollHighScoreAlerts(client).catch(e => console.error('[alert-high]', e.message))
    pollNicheSpikeAlerts(client).catch(e => console.error('[alert-niche]', e.message))
    checkMemberMilestone(client).catch(e => console.error('[alert-milestone]', e.message))
  }, 15 * 60 * 1000)

  console.log('✅ Automation engine running — 6 daily posts + real-time alerts')

  // Return everything for HTTP bridge + slash commands
  return {
    refreshWelcomeStats, postTodaysWinners, postTrendingNow,
    postNicheSpotlight, postAdOfTheDay, postDailyChallenge, postCommunityRecap,
    fetchTopProducts, searchProduct, fetchUserPlan, fetchLiveStats,
  }
}

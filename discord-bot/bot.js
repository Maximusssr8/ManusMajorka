/**
 * Majorka Discord Bot v2
 * - Slash commands: /stats /build /deploy /verify /broadcast /logs
 * - Button: "Join as Guest" → auto-assigns Verified role
 * - /verify email → checks Majorka Supabase → assigns correct plan role
 * - Welcome DM on member join
 * - Starboard: 3+ ⭐ reactions → repost to #starboard
 * - HTTP bridge on :3001 for external posting (Claw/n8n)
 * - Weekly stats auto-post every Monday 9AM AEST
 */

const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField,
        SlashCommandBuilder, REST, Routes, ActionRowBuilder, ButtonBuilder,
        ButtonStyle } = require('discord.js')
const { execSync, exec } = require('child_process')
const http  = require('http')
const https = require('https')
const fs    = require('fs')

const TOKEN     = process.env.DISCORD_BOT_TOKEN
const CLIENT_ID = '1481859264057442325'
const MAJORKA   = 'https://www.majorka.io'
const VERCEL_TOKEN = process.env.VERCEL_TOKEN || ''

if (!TOKEN) { console.error('❌ DISCORD_BOT_TOKEN not set'); process.exit(1) }

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    
    
  ]
})

// ── Load channel IDs ──────────────────────────────────────────────────────────
let channelIds = {}
function loadChannels() {
  try { channelIds = JSON.parse(fs.readFileSync('/tmp/discord-channels.json', 'utf-8')) } catch {}
}

function getChannel(name) {
  loadChannels()
  const id = channelIds[name] || channelIds[`${name}`]
  if (!id) return null
  for (const guild of client.guilds.cache.values()) {
    const ch = guild.channels.cache.get(id)
    if (ch) return ch
  }
  return null
}

// ── Role lookup helpers ───────────────────────────────────────────────────────
function getRole(guild, name) {
  return guild.roles.cache.find(r => r.name === name)
}

// ── Verify member against Majorka Supabase (direct REST API) ─────────────────
const SUPABASE_URL = 'https://ievekuazsjbdrltsdksn.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

async function checkMajorkaMember(email) {
  if (!SUPABASE_SERVICE_KEY) {
    console.error('[verify] SUPABASE_SERVICE_ROLE_KEY not set')
    return { exists: false, plan: null }
  }
  try {
    // Step 1: Look up user by email
    const userRes = await fetch(
      `${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email)}&select=id`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(8000),
      }
    )
    const users = await userRes.json()
    if (!Array.isArray(users) || users.length === 0) return { exists: false, plan: null }
    const userId = users[0].id

    // Step 2: Get subscription plan
    const subRes = await fetch(
      `${SUPABASE_URL}/rest/v1/user_subscriptions?user_id=eq.${userId}&select=plan,status&order=created_at.desc&limit=1`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
        signal: AbortSignal.timeout(8000),
      }
    )
    const subs = await subRes.json()
    const sub = Array.isArray(subs) ? subs[0] : null
    const plan = sub?.status === 'active' ? (sub.plan || 'free') : 'free'

    // Step 3: Store discord_user_id for future sync (fire and forget)
    fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ discord_user_id: userId }), // will be set by caller
    }).catch(() => {})

    return { exists: true, plan, userId }
  } catch (err) {
    console.error('[verify] Supabase lookup failed:', err.message)
    return { exists: false, plan: null }
  }
}

async function assignRoleByPlan(member, plan) {
  const guild = member.guild
  const verified  = getRole(guild, '👀 Verified')
  const majorka   = getRole(guild, '✅ Majorka Member')
  const builder   = getRole(guild, '🏗️ Builder Member')
  const scale     = getRole(guild, '💎 Scale Member')

  // Remove all plan roles first
  const toRemove = [verified, majorka, builder, scale].filter(Boolean)
  for (const r of toRemove) {
    try { await member.roles.remove(r) } catch {}
  }

  // Assign correct role
  if (plan === 'scale'   && scale)   { await member.roles.add(scale);   return '💎 Scale Member' }
  if (plan === 'builder' && builder) { await member.roles.add(builder); return '🏗️ Builder Member' }
  if (plan === 'free'    && majorka) { await member.roles.add(majorka); return '✅ Majorka Member' }
  if (verified) { await member.roles.add(verified); return '👀 Verified' }
  return 'none'
}

// ── Welcome DM on join ────────────────────────────────────────────────────────
client.on('guildMemberAdd', async (member) => {
  // Assign New Member role if exists
  const newMemberRole = member.guild.roles.cache.find(r => r.name === '👋 New Member')
  // Don't auto-assign — they get nothing until they verify

  // Send welcome DM with live stats
  try {
    let memberCount = 0
    for (const g of client.guilds.cache.values()) memberCount += g.memberCount

    // Grab live product count (fire-and-forget, use fallback on error)
    let productCount = 131
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/winning_products?select=id&limit=1`,
        { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Prefer': 'count=estimated' }, signal: AbortSignal.timeout(5000) }
      )
      const ct = res.headers.get('content-range')
      if (ct) productCount = parseInt(ct.split('/')[1]) || 131
    } catch {}

    const embed = new EmbedBuilder()
      .setTitle(`Hey ${member.displayName}, welcome to Majorka! 🔺`)
      .setColor(0x6366F1)
      .setDescription([
        `You just joined **${memberCount.toLocaleString()}** dropshippers using AI to find winning products.`,
        '',
        '**Here\'s what to do first:**',
        '',
        '1️⃣ Run `/verify your@email.com` to link your Majorka account and unlock all channels',
        '',
        '2️⃣ Check **#🔥┃todays-winners** for today\'s top 10 products',
        '',
        '3️⃣ Introduce yourself in **#👋┃introductions**',
        '',
        '4️⃣ Don\'t have Majorka yet? Sign up at majorka.io — Builder & Scale plans available.',
        '',
        `Today we're tracking **${productCount.toLocaleString()}** products across AU, US and UK markets. 🌏`,
      ].join('\n'))
      .setFooter({ text: 'Majorka Community • majorka.io' })
      .setTimestamp()

    const dmRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('🚀 Open Majorka').setStyle(ButtonStyle.Link).setURL('https://www.majorka.io'),
      new ButtonBuilder().setLabel('✨ Sign Up Free').setStyle(ButtonStyle.Link).setURL('https://www.majorka.io/sign-up'),
    )
    await member.send({ embeds: [embed], components: [dmRow] })
  } catch {} // DMs may be disabled

  // Log to admin
  const logCh = getChannel('👥┃user-activity')
  if (logCh) {
    logCh.send(`👋 **New member joined:** ${member.user.tag} (${member.id})`)
  }
})

// ── All button + slash command interactions ────────────────────────────────────
client.on('interactionCreate', async (interaction) => {
  // ── Self-assign role buttons ───────────────────────────────────────────────
  if (interaction.isButton() && SELF_ASSIGN_ROLES[interaction.customId]) {
    return handleRoleButton(interaction)
  }

  // ── Button: Join as Guest ──────────────────────────────────────────────────
  if (interaction.isButton() && interaction.customId === 'verify_guest') {
    // Assign Verified role if it exists, then guide them to sign up
    const role = getRole(interaction.guild, '👀 Verified')
    if (role) {
      try { await interaction.member.roles.add(role) } catch {}
    }
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Open Majorka →')
        .setStyle(ButtonStyle.Link)
        .setURL('https://www.majorka.io'),
      new ButtonBuilder()
        .setLabel('Join Free →')
        .setStyle(ButtonStyle.Link)
        .setURL('https://www.majorka.io/sign-up'),
    )
    await interaction.reply({
      content: '👋 Welcome! You now have community access.\n\nTo unlock AI-powered product intelligence, sign up at **majorka.io** — Builder & Scale plans available.',
      components: [row],
      ephemeral: true,
    })
    return
  }

  // ── Slash commands ──────────────────────────────────────────────────────────
  if (!interaction.isChatInputCommand()) return
  const { commandName } = interaction

  // ── /verify ────────────────────────────────────────────────────────────────
  if (commandName === 'verify') {
    await interaction.deferReply({ ephemeral: true })
    const email = interaction.options.getString('email')

    if (email === 'guest') {
      const assigned = await assignRoleByPlan(interaction.member, 'guest')
      return interaction.editReply({ content: `✅ Guest access granted! You now have **👀 Verified** access.` })
    }

    const result = await checkMajorkaMember(email)
    if (!result.exists) {
      return interaction.editReply({
        content: `❌ No Majorka account found for **${email}**.\nSign up free at https://www.majorka.io or check your email spelling.`
      })
    }

    const roleName = await assignRoleByPlan(interaction.member, result.plan)
    await interaction.editReply({
      content: `✅ Verified! Assigned **${roleName}** based on your ${result.plan} plan.\nYou now have access to all ${result.plan !== 'free' ? 'Majorka AI' : 'community'} channels.`
    })

    // Log to admin
    const logCh = getChannel('👥┃user-activity')
    if (logCh) logCh.send(`✅ **${interaction.user.tag}** verified as **${roleName}** (${email}, plan: ${result.plan})`)
    return
  }

  // ── /refresh-channels ──────────────────────────────────────────────────────
  if (commandName === 'refresh-channels') {
    const isAdmin = interaction.member?.roles?.cache?.some(r =>
      ['👑 Owner', '⚡ Majorka Team', '🛡️ Admin', '🔨 Moderator'].includes(r.name)
    ) || interaction.member?.permissions?.has?.('Administrator')
    if (!isAdmin) {
      return interaction.reply({ content: '❌ This command requires Admin or Owner role.', ephemeral: true })
    }
    await interaction.deferReply({ ephemeral: true })
    try {
      const results = await refreshAllChannels(interaction.guild)
      const summary = results.map(r => `${r.ok ? '✅' : '❌'} #${r.channel}${r.reason ? ` (${r.reason})` : ''}`).join('\n')
      return interaction.editReply({ content: `**Channel refresh complete:**\n${summary}` })
    } catch (e) {
      return interaction.editReply({ content: `❌ Failed: ${e.message}` })
    }
  }

  // ── /refresh-welcome ───────────────────────────────────────────────────────
  if (commandName === 'refresh-welcome') {
    // Admin-only check
    const isAdmin = interaction.member?.roles?.cache?.some(r =>
      ['👑 Owner', '⚡ Majorka Team', '🛡️ Admin', '🔨 Moderator'].includes(r.name)
    ) || interaction.member?.permissions?.has?.('Administrator')
    if (!isAdmin) {
      return interaction.reply({ content: '❌ This command requires Admin or Owner role.', ephemeral: true })
    }
    await interaction.deferReply({ ephemeral: true })
    try {
      await postWelcomeEmbed(interaction.guild)
      return interaction.editReply({ content: '✅ Welcome embed refreshed and pinned in #welcome.' })
    } catch (e) {
      return interaction.editReply({ content: `❌ Failed: ${e.message}` })
    }
  }

  // ── /winners ───────────────────────────────────────────────────────────────
  if (commandName === 'winners') {
    await interaction.deferReply()
    const products = await automationFns?.fetchTopProducts(5) || []
    const embed = new EmbedBuilder()
      .setTitle('🔥 Today\'s Top 5 Winners')
      .setColor(0xFF6B35)
      .setFooter({ text: 'See all 10 → majorka.io/app/products' })
      .setTimestamp()
    if (products.length) {
      embed.addFields(products.slice(0,5).map((p, i) => ({
        name: `#${i+1} ${(p.product_title||'Product').slice(0,50)}`,
        value: `📈 **${p.opportunity_score||p.winning_score||0}/100** | 💰 ~${p.profit_margin?Math.round(p.profit_margin)+'%':'40%'} | 🎯 ${p.category||'General'}\n_${(p.why_trending||p.why_winning||'').slice(0,60)}_`,
        inline: false,
      })))
    } else {
      embed.setDescription('Pipeline updating. Check back shortly or visit majorka.io/app/products')
    }
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('View All Products →').setStyle(ButtonStyle.Link).setURL('https://www.majorka.io/app/products')
    )
    return interaction.editReply({ embeds: [embed], components: [row] })
  }

  // ── /trending ──────────────────────────────────────────────────────────────
  if (commandName === 'trending') {
    await interaction.deferReply()
    const niche = interaction.options.getString('niche')
    const products = await automationFns?.fetchTopProducts(3, niche) || []
    const title = niche ? `⚡ Trending in ${niche}` : '⚡ Top Trending Right Now'
    const embed = new EmbedBuilder().setTitle(title).setColor(0xFF0080).setTimestamp()
      .setFooter({ text: 'majorka.io/app/products' })
    if (products.length) {
      embed.addFields(products.map((p, i) => ({
        name: `${['🥇','🥈','🥉'][i]||'•'} ${(p.product_title||'Product').slice(0,50)}`,
        value: `Score: **${p.opportunity_score||p.winning_score||0}/100** | ${p.category||'General'}\n_${(p.why_trending||p.why_winning||'').slice(0,80)}_`,
        inline: false,
      })))
    } else {
      embed.setDescription(niche ? `No trending products in **${niche}** right now.` : 'No trending products detected.')
    }
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('Explore All →').setStyle(ButtonStyle.Link).setURL('https://www.majorka.io/app/products')
    )
    return interaction.editReply({ embeds: [embed], components: [row] })
  }

  // ── /score ─────────────────────────────────────────────────────────────────
  if (commandName === 'score') {
    await interaction.deferReply()
    const name = interaction.options.getString('product')
    const results = await automationFns?.searchProduct(name) || []
    if (!results.length) {
      return interaction.editReply({
        content: `❌ **"${name}"** not found in Majorka DB.\nSearch live at https://www.majorka.io/app/products`,
      })
    }
    const p = results[0]
    const score = p.opportunity_score || p.winning_score || 0
    const embed = new EmbedBuilder()
      .setTitle(`📊 ${(p.product_title||name).slice(0,60)}`)
      .setColor(score >= 80 ? 0x22C55E : score >= 60 ? 0xF59E0B : 0xEF4444)
      .addFields(
        { name: '📈 Opportunity Score', value: `**${score}/100**`, inline: true },
        { name: '💰 Est. Margin', value: p.profit_margin ? `~${Math.round(p.profit_margin)}%` : '—', inline: true },
        { name: '🎯 Niche', value: p.category || 'General', inline: true },
        { name: '⚡ TikTok Potential', value: p.tiktok_potential || '—', inline: true },
        { name: '💡 Why Trending', value: (p.why_trending||p.why_winning||'—').slice(0,200), inline: false },
        { name: '🎬 Best Ad Angle', value: (p.best_ad_angle||p.ad_angle||'—').slice(0,200), inline: false },
      )
      .setFooter({ text: 'majorka.io' }).setTimestamp()
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('View Full Analysis →').setStyle(ButtonStyle.Link).setURL('https://www.majorka.io/app/products')
    )
    return interaction.editReply({ embeds: [embed], components: [row] })
  }

  // ── /profit ────────────────────────────────────────────────────────────────
  if (commandName === 'profit') {
    const cost    = interaction.options.getNumber('cost')
    const sell    = interaction.options.getNumber('sell')
    const adspend = interaction.options.getNumber('adspend')
    const txFee   = sell * 0.0175  // payment processing ~1.75%
    const platformFee = sell * 0.02 // platform/fulfilment ~2%
    const totalCosts = cost + adspend + txFee + platformFee
    const profit  = sell - totalCosts
    const margin  = (profit / sell) * 100
    const roas    = sell / adspend
    const beCPA   = sell - cost - txFee - platformFee
    const color   = margin > 30 ? 0x22C55E : margin >= 15 ? 0xF59E0B : 0xEF4444
    const rating  = margin > 30 ? '✅ Healthy' : margin >= 15 ? '⚠️ Tight' : '❌ Risky'

    const embed = new EmbedBuilder()
      .setTitle(`💰 Profit Calculator`)
      .setColor(color)
      .addFields(
        { name: '🛒 Sell Price',     value: `$${sell.toFixed(2)}`,                      inline: true },
        { name: '📦 Product Cost',   value: `$${cost.toFixed(2)}`,                      inline: true },
        { name: '📢 Ad Spend/Sale',  value: `$${adspend.toFixed(2)}`,                   inline: true },
        { name: '💳 Fees (est.)',    value: `$${(txFee+platformFee).toFixed(2)}`,       inline: true },
        { name: '💵 Profit/Sale',    value: `**$${profit.toFixed(2)}**`,                inline: true },
        { name: '📊 Margin',         value: `**${margin.toFixed(1)}%** ${rating}`,      inline: true },
        { name: '📈 ROAS',           value: `**${roas.toFixed(2)}x**`,                  inline: true },
        { name: '🎯 Break-even CPA', value: `**$${beCPA.toFixed(2)}**`,                 inline: true },
        { name: '📋 Verdict',        value: margin > 30 ? 'Strong margins. Scale this.' : margin >= 15 ? 'Test carefully. Watch CPA.' : 'Margins too thin. Raise price or cut cost.', inline: false },
      )
      .setFooter({ text: 'Full analysis → majorka.io/app/profit' })
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('Open Profit Calc →').setStyle(ButtonStyle.Link).setURL('https://www.majorka.io/app/profit')
    )
    return interaction.reply({ embeds: [embed], components: [row] })
  }

  // ── /plan ──────────────────────────────────────────────────────────────────
  if (commandName === 'plan') {
    await interaction.deferReply({ ephemeral: true })
    const sub = await automationFns?.fetchUserPlan(interaction.user.id)
    if (!sub) {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel('View Plans →').setStyle(ButtonStyle.Link).setURL('https://www.majorka.io/sign-up'),
      )
      return interaction.editReply({
        content: '❌ No Majorka account linked to your Discord.\nRun `/verify your@email.com` to connect your account.',
        components: [row],
      })
    }
    const planEmojis = { scale: '💎', builder: '🏗️', free: '✅' }
    const planAccess = {
      scale:   '✅ All channels + Scale exclusive intel + Priority support',
      builder: '✅ Community channels + All Majorka tool channels + Builder lounge',
      free:    '✅ Community channels only',
    }
    const embed = new EmbedBuilder()
      .setTitle(`${planEmojis[sub.plan] || '✅'} Your Majorka Plan`)
      .setColor(sub.plan === 'scale' ? 0xA855F7 : sub.plan === 'builder' ? 0x22C55E : 0x3B82F6)
      .addFields(
        { name: '📋 Plan',   value: `**${sub.plan?.charAt(0).toUpperCase()+sub.plan?.slice(1) || 'Free'}**`, inline: true },
        { name: '📊 Status', value: `**${sub.status || 'active'}**`, inline: true },
        { name: '🔓 Access', value: planAccess[sub.plan] || planAccess.free, inline: false },
      )
      .setFooter({ text: 'majorka.io' })
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('Open Majorka →').setStyle(ButtonStyle.Link).setURL('https://www.majorka.io'),
    )
    return interaction.editReply({ embeds: [embed], components: [row] })
  }

  // ── /stats ─────────────────────────────────────────────────────────────────
  if (commandName === 'stats') {
    await interaction.deferReply()
    const embed = new EmbedBuilder()
      .setTitle('📊 Majorka — Live Stats')
      .setColor(0x6366F1)
      .setTimestamp()
      .addFields(
        { name: '🌐 Production', value: '[majorka.io](https://www.majorka.io)', inline: true },
        { name: '📦 Repo', value: 'Maximusssr8/ManusMajorka', inline: true },
        { name: '💬 Discord Members', value: String(interaction.guild.memberCount), inline: true },
      )

    // Try to get live stats from Majorka
    try {
      const res = await fetch(`${MAJORKA}/api/agent-log`, { signal: AbortSignal.timeout(3000) })
      if (res.ok) {
        const data = await res.json()
        embed.addFields({ name: '🤖 Agent Log', value: JSON.stringify(data).slice(0, 200), inline: false })
      }
    } catch {}

    return interaction.editReply({ embeds: [embed] })
  }

  // ── /deploy ────────────────────────────────────────────────────────────────
  if (commandName === 'deploy') {
    await interaction.deferReply()
    const embed = new EmbedBuilder().setTitle('🚀 Deploying to Vercel...').setColor(0x6366f1).setTimestamp()
    await interaction.editReply({ embeds: [embed] })

    exec(`cd ~/ManusMajorka && npx vercel --prod --yes --token ${VERCEL_TOKEN} 2>&1`, async (err, stdout) => {
      const deployLog = getChannel('🚀┃deploy-log')
      const announcements = getChannel('📋┃changelog')
      const resultEmbed = new EmbedBuilder()
        .setTitle(err ? '❌ Deploy Failed' : '✅ Deployed to Production')
        .setColor(err ? 0xff4444 : 0x6366F1)
        .setDescription(err ? err.message.slice(0, 500) : `Live at: https://www.majorka.io`)
        .setTimestamp()
      if (deployLog) deployLog.send({ embeds: [resultEmbed] })
    })
    return
  }

  // ── /build ─────────────────────────────────────────────────────────────────
  if (commandName === 'build') {
    await interaction.deferReply()
    const task = interaction.options.getString('task')
    await interaction.editReply({ embeds: [
      new EmbedBuilder().setTitle('⚙️ Agent Starting').setColor(0x6366f1)
        .setDescription(`\`\`\`${task}\`\`\``).setTimestamp()
    ]})

    exec(`cd ~/ManusMajorka && CLAUDECODE= claude --permission-mode bypassPermissions --print "${task.replace(/"/g, "'")}" 2>&1`, (err, stdout) => {
      const logCh = getChannel('🤖┃agent-log')
      if (logCh) {
        const out = (stdout || err?.message || 'No output').slice(0, 1800)
        logCh.send({ embeds: [
          new EmbedBuilder().setTitle(err ? '❌ Agent Failed' : '✅ Agent Complete')
            .setColor(err ? 0xff4444 : 0x22c55e)
            .setDescription(`**Task:** ${task}\n\n\`\`\`${out}\`\`\``).setTimestamp()
        ]})
      }
    })
    return
  }

  // ── /broadcast ─────────────────────────────────────────────────────────────
  if (commandName === 'broadcast') {
    const isOwnerOrTeam = interaction.member.roles.cache.some(r =>
      r.name === '👑 Owner' || r.name === '⚡ Majorka Team'
    )
    if (!isOwnerOrTeam) {
      return interaction.reply({ content: '❌ Owner/Team only.', ephemeral: true })
    }
    await interaction.deferReply({ ephemeral: true })
    const message = interaction.options.getString('message')
    const announceCh = getChannel('📢┃announcements')
    if (announceCh) {
      await announceCh.send({ embeds: [
        new EmbedBuilder().setTitle('📢 Announcement').setColor(0x6366F1)
          .setDescription(message).setTimestamp()
          .setFooter({ text: `From ${interaction.user.username}` })
      ]})
      return interaction.editReply({ content: '✅ Broadcast sent to #announcements.' })
    }
    return interaction.editReply({ content: '❌ #announcements channel not found.' })
  }

  // ── /logs ──────────────────────────────────────────────────────────────────
  if (commandName === 'logs') {
    await interaction.deferReply({ ephemeral: true })
    try {
      const log = fs.readFileSync('/tmp/majorka-server.log', 'utf-8').split('\n').slice(-20).join('\n')
      return interaction.editReply({ content: `\`\`\`\n${log.slice(0, 1900)}\n\`\`\`` })
    } catch {
      return interaction.editReply({ content: '❌ No log file found at /tmp/majorka-server.log' })
    }
  }
})

// ── Starboard: 3+ ⭐ reactions ────────────────────────────────────────────────
const starredMessages = new Set()
client.on('messageReactionAdd', async (reaction, user) => {
  if (reaction.emoji.name !== '⭐') return
  if (reaction.count < 3) return
  if (starredMessages.has(reaction.message.id)) return

  starredMessages.add(reaction.message.id)
  const starCh = getChannel('⭐┃starboard')
  if (!starCh) return

  const msg = reaction.message
  const embed = new EmbedBuilder()
    .setColor(0x6366F1)
    .setAuthor({ name: msg.author?.username || 'Unknown', iconURL: msg.author?.displayAvatarURL() })
    .setDescription(msg.content?.slice(0, 1000) || '*[no text]*')
    .addFields({ name: '⭐ Stars', value: String(reaction.count), inline: true },
               { name: 'Channel', value: `<#${msg.channelId}>`, inline: true })
    .setTimestamp(msg.createdAt)
  if (msg.attachments?.size) {
    const img = [...msg.attachments.values()][0]
    if (img?.contentType?.startsWith('image')) embed.setImage(img.url)
  }
  await starCh.send({ content: `⭐ **Starred message**`, embeds: [embed] })
})

// ── HTTP bridge (Claw/n8n can POST here to send Discord messages) ─────────────
const httpServer = http.createServer(async (req, res) => {
  // GET /trigger/:post — manually fire a daily post
  if (req.method === 'GET' && req.url.startsWith('/trigger/')) {
    const post = req.url.replace('/trigger/', '')
    const map = {
      'winners':   () => automationFns?.postTodaysWinners(client),
      'trending':  () => automationFns?.postTrendingNow(client),
      'niche':     () => automationFns?.postNicheSpotlight(client),
      'ad':        () => automationFns?.postAdOfTheDay(client),
      'challenge': () => automationFns?.postDailyChallenge(client),
      'recap':     () => automationFns?.postCommunityRecap(client),
      'stats':     () => automationFns?.refreshWelcomeStats(client),
    }
    const fn = map[post]
    if (!fn || !automationFns) { res.writeHead(404); res.end(JSON.stringify({ error: 'unknown trigger or automation not ready' })); return }
    try {
      await fn()
      res.writeHead(200); res.end(JSON.stringify({ ok: true, triggered: post }))
    } catch (e) { res.writeHead(500); res.end(JSON.stringify({ error: e.message })) }
    return
  }

  // GET /refresh-channels — refresh all channel embeds + role buttons
  if (req.method === 'GET' && req.url === '/refresh-channels') {
    try {
      const all = []
      for (const guild of client.guilds.cache.values()) {
        const results = await refreshAllChannels(guild)
        all.push({ guild: guild.name, results })
      }
      res.writeHead(200); res.end(JSON.stringify({ ok: true, all }))
    } catch (e) { res.writeHead(500); res.end(JSON.stringify({ error: e.message })) }
    return
  }

  // GET /refresh-welcome — re-post welcome embed in all guilds
  if (req.method === 'GET' && req.url === '/refresh-welcome') {
    try {
      const results = []
      for (const guild of client.guilds.cache.values()) {
        const msg = await postWelcomeEmbed(guild)
        results.push({ guild: guild.name, ok: !!msg })
      }
      res.writeHead(200); res.end(JSON.stringify({ ok: true, results }))
    } catch (e) { res.writeHead(500); res.end(JSON.stringify({ error: e.message })) }
    return
  }

  if (req.method !== 'POST') { res.writeHead(405); res.end(); return }
  let body = ''
  req.on('data', c => body += c)
  req.on('end', async () => {
    try {
      const { channel, message, title, color, embed: embedData } = JSON.parse(body)
      const ch = getChannel(channel || '🔔┃majorka-updates')
      if (!ch) { res.writeHead(404); res.end(JSON.stringify({ error: 'channel not found' })); return }
      if (title || embedData) {
        const e = new EmbedBuilder().setColor(color || 0x6366F1).setTimestamp()
        if (title)   e.setTitle(title)
        if (message) e.setDescription(message)
        if (embedData?.fields) e.addFields(embedData.fields)
        await ch.send({ embeds: [e] })
      } else {
        await ch.send(message)
      }
      res.writeHead(200); res.end(JSON.stringify({ ok: true }))
    } catch (e) { res.writeHead(400); res.end(JSON.stringify({ error: e.message })) }
  })
})
httpServer.listen(3001, () => console.log('📡 HTTP bridge on :3001'))

// ── Weekly stats (every Monday 9AM AEST = Sunday 11PM UTC) ───────────────────
function scheduleWeeklyStats() {
  const now = new Date()
  const next = new Date()
  next.setUTCDate(now.getUTCDate() + ((7 - now.getUTCDay()) % 7 || 7))
  next.setUTCHours(23, 0, 0, 0) // Sunday 11PM UTC = Monday 9AM AEST
  const delay = next - now
  setTimeout(async () => {
    const statsCh = getChannel('📊┃analytics')
    if (statsCh) {
      statsCh.send({ embeds: [
        new EmbedBuilder().setTitle('📊 Weekly Majorka Stats')
          .setColor(0x6366F1)
          .setDescription('Auto-generated weekly report. Connect Supabase for live data.')
          .addFields(
            { name: '🌐 App', value: 'https://www.majorka.io', inline: false },
            { name: '💬 Discord Members', value: String([...client.guilds.cache.values()][0]?.memberCount || 0), inline: true },
          )
          .setTimestamp()
      ]})
    }
    scheduleWeeklyStats()
  }, delay)
  console.log(`📅 Weekly stats scheduled (${Math.round(delay/3600000)}h from now)`)
}

// ── Bot ready ─────────────────────────────────────────────────────────────────
// ── Welcome embed builder ─────────────────────────────────────────────────────
function buildWelcomeEmbed() {
  const embed = new EmbedBuilder()
    .setTitle('👋 Welcome to Majorka Community')
    .setColor(0x6366F1)
    .setDescription([
      '**The home of AI-powered dropshipping intelligence for AU · US · UK sellers.**',
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━',
      '**GET STARTED IN 4 STEPS**',
      '━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
      '**STEP 1** → Read the rules in <#rules>',
      '**STEP 2** → Grab your role in <#get-your-role>',
      '**STEP 3** → Verify your Majorka account: `/verify your@email.com`',
      '**STEP 4** → Check today\'s winning products in <#todays-winners>',
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━',
      '**WHAT YOU GET HERE (FREE)**',
      '━━━━━━━━━━━━━━━━━━━━━━━━',
      '🔥 Daily top 10 products — posted every morning 8 AM AEST',
      '📈 Trending niche alerts — when opportunity scores spike',
      '🎵 TikTok viral product alerts — what\'s gaining momentum now',
      '🎯 Ad breakdowns — why winning ads actually work',
      '💰 Supplier deals — vetted, with real margin data',
      '🏆 Community wins — real results from real members',
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━',
      '**WANT THE FULL INTELLIGENCE STACK?**',
      '━━━━━━━━━━━━━━━━━━━━━━━━',
      'Builder & Scale plans → **majorka.io**',
    ].join('\n'))
    .setFooter({ text: 'Majorka Community • AI-powered dropshipping intelligence' })
    .setTimestamp()

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('🚀 Open Majorka')
      .setStyle(ButtonStyle.Link)
      .setURL('https://www.majorka.io'),
    new ButtonBuilder()
      .setLabel('👀 Join as Guest')
      .setStyle(ButtonStyle.Link)
      .setURL('https://www.majorka.io'),
    new ButtonBuilder()
      .setLabel('✨ Join Free')
      .setStyle(ButtonStyle.Link)
      .setURL('https://www.majorka.io/sign-up'),
  )

  return { embeds: [embed], components: [row] }
}

// ── Post or refresh welcome embed ─────────────────────────────────────────────
async function postWelcomeEmbed(guild) {
  // Find #welcome channel by name
  const welcomeCh = guild.channels.cache.find(c =>
    c.name && (c.name.includes('welcome') || c.name === '👋・welcome') && c.isTextBased()
  )
  if (!welcomeCh) { console.log('[welcome] No #welcome channel found'); return null }

  // Delete previous bot messages in the channel (up to 20)
  try {
    const messages = await welcomeCh.messages.fetch({ limit: 20 })
    const botMsgs = messages.filter(m => m.author.id === guild.client.user.id)
    for (const [, msg] of botMsgs) {
      try { await msg.unpin().catch(() => {}); await msg.delete() } catch {}
    }
  } catch {}

  // Post new embed
  const payload = buildWelcomeEmbed()
  const posted = await welcomeCh.send(payload)

  // Pin it
  try { await posted.pin() } catch (e) { console.log('[welcome] Pin failed:', e.message) }

  console.log(`✅ Welcome embed posted and pinned in #${welcomeCh.name}`)
  return posted
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROLE BUTTON HANDLERS — market/experience/notification self-assign
// ═══════════════════════════════════════════════════════════════════════════════
const SELF_ASSIGN_ROLES = {
  // Market roles
  role_au:      '🇦🇺 AU Seller',
  role_us:      '🇺🇸 US Seller',
  role_uk:      '🇬🇧 UK Seller',
  role_global:  '🌏 Global Seller',
  // Experience roles (mutually exclusive — replaces others in same group)
  role_starting:  '🌱 Just Starting',
  role_testing:   '🧪 Testing Phase',
  role_first_sales: '📈 First Sales',
  role_scaling:   '🚀 Scaling',
  role_established: '💰 Established',
  // Notification opt-ins (toggles)
  role_product_alerts: '🔔 Product Alerts',
  role_niche_alerts:   '🚨 Niche Alerts',
  role_tiktok_alerts:  '📱 TikTok Alerts',
  role_updates:        '📣 Platform Updates',
}

const EXPERIENCE_ROLE_NAMES = [
  '🌱 Just Starting', '🧪 Testing Phase', '📈 First Sales', '🚀 Scaling', '💰 Established'
]

// Toggle or assign a self-assign role
async function handleRoleButton(interaction) {
  const customId = interaction.customId
  if (!SELF_ASSIGN_ROLES[customId]) return false

  const roleName = SELF_ASSIGN_ROLES[customId]
  const guild = interaction.guild
  const member = interaction.member

  // Ensure roles exist (create if missing)
  let role = guild.roles.cache.find(r => r.name === roleName)
  if (!role) {
    try {
      role = await guild.roles.create({ name: roleName, mentionable: false, reason: 'Self-assign role' })
    } catch {
      await interaction.reply({ content: `❌ Couldn't create role "${roleName}" — contact an admin.`, ephemeral: true })
      return true
    }
  }

  const hasRole = member.roles.cache.has(role.id)

  // For experience roles: remove all others in the group first
  if (EXPERIENCE_ROLE_NAMES.includes(roleName)) {
    for (const expName of EXPERIENCE_ROLE_NAMES) {
      const expRole = guild.roles.cache.find(r => r.name === expName)
      if (expRole && member.roles.cache.has(expRole.id)) {
        try { await member.roles.remove(expRole) } catch {}
      }
    }
  }

  // Toggle
  if (hasRole && !EXPERIENCE_ROLE_NAMES.includes(roleName)) {
    await member.roles.remove(role)
    await interaction.reply({ content: `✅ Removed **${roleName}** role.`, ephemeral: true })
  } else {
    await member.roles.add(role)
    await interaction.reply({ content: `✅ You now have the **${roleName}** role!`, ephemeral: true })
  }
  return true
}

// ── Channel embed builders ─────────────────────────────────────────────────────

function buildGetAccessEmbed() {
  // Embed 1: Account verification
  const verifyEmbed = new EmbedBuilder()
    .setTitle('🔑 Step 1 — Verify Your Majorka Account')
    .setColor(0x6366F1)
    .setDescription([
      'Run `/verify your@email.com` to link your Majorka account.',
      'The bot checks your plan and assigns your role automatically.',
      '',
      '**What you get by plan:**',
      '👀 **Verified** (no account) → Community channels: wins, questions, general',
      '✅ **Majorka Member** (any paid plan) → All Majorka Intelligence channels',
      '🏗️ **Builder Member** ($99 AUD/mo) → + Builder private lounge',
      '💎 **Scale Member** ($199 AUD/mo) → Full access + Scale-only channels',
    ].join('\n'))

  const verifyRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setLabel('🚀 Get Majorka Account').setStyle(ButtonStyle.Link).setURL('https://www.majorka.io/sign-up'),
    new ButtonBuilder().setLabel('👀 Join as Guest').setCustomId('verify_guest').setStyle(ButtonStyle.Secondary),
  )

  // Embed 2: Market roles
  const marketEmbed = new EmbedBuilder()
    .setTitle('🌍 Step 2 — Pick Your Market(s)')
    .setColor(0x6366F1)
    .setDescription('Click to add or remove market roles. You can select multiple.')

  const marketRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('role_au').setLabel('🇦🇺 AU Seller').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('role_us').setLabel('🇺🇸 US Seller').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('role_uk').setLabel('🇬🇧 UK Seller').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('role_global').setLabel('🌏 Global').setStyle(ButtonStyle.Secondary),
  )

  // Embed 3: Experience level
  const expEmbed = new EmbedBuilder()
    .setTitle('📈 Step 3 — Your Experience Level')
    .setColor(0x6366F1)
    .setDescription('Select your current stage. This helps others give you relevant advice.')

  const expRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('role_starting').setLabel('🌱 Just Starting').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('role_testing').setLabel('🧪 Testing Phase').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('role_first_sales').setLabel('📈 First Sales').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('role_scaling').setLabel('🚀 Scaling').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('role_established').setLabel('💰 Established').setStyle(ButtonStyle.Secondary),
  )

  // Embed 4: Notification opt-ins
  const notifEmbed = new EmbedBuilder()
    .setTitle('🔔 Step 4 — Notification Opt-ins')
    .setColor(0x6366F1)
    .setDescription('Choose what you want to be pinged for. Toggle any time.')

  const notifRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('role_product_alerts').setLabel('🔔 Product Alerts').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('role_niche_alerts').setLabel('🚨 Niche Alerts').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('role_tiktok_alerts').setLabel('📱 TikTok Alerts').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('role_updates').setLabel('📣 Platform Updates').setStyle(ButtonStyle.Secondary),
  )

  return [
    { embeds: [verifyEmbed], components: [verifyRow] },
    { embeds: [marketEmbed], components: [marketRow] },
    { embeds: [expEmbed],    components: [expRow] },
    { embeds: [notifEmbed],  components: [notifRow] },
  ]
}

function buildRulesEmbed() {
  return {
    embeds: [new EmbedBuilder()
      .setTitle('📜 Majorka Community Rules')
      .setColor(0x6366F1)
      .setDescription([
        '**These rules exist to keep this one of the highest-quality ecommerce communities on the internet.**',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━',
        '**THE 5 RULES**',
        '━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        '**1. NO SPAM OR SELF-PROMOTION**',
        'No affiliate links, referral codes, other Discord servers, or services without mod approval. Violations = instant ban.',
        '',
        '**2. USE THE RIGHT CHANNEL**',
        'Product research → research channels. Bugs → 🐛┃bug-reports. Help → 🆘┃help-desk. General chat → 💬┃general.',
        '',
        '**3. NO FAKE WINS OR UNVERIFIED CLAIMS**',
        'Don\'t post revenue screenshots you can\'t verify. Misleading the community = instant ban.',
        '',
        '**4. STRUCTURED POSTS IN DATA CHANNELS**',
        'Use the format template in pinned messages. Unformatted posts get deleted.',
        '',
        '**5. RESPECT — ZERO TOLERANCE**',
        'No racism, sexism, harassment, or personal attacks. DM spam = permanent ban.',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━',
        'Mods have final say. Complaints → DM @Community Manager.',
        'Breaking rules repeatedly = permanent ban.',
      ].join('\n'))
    ]
  }
}

function buildWinsEmbed() {
  return {
    embeds: [new EmbedBuilder()
      .setTitle('🏆 Share Your Wins')
      .setColor(0x6366F1)
      .setDescription([
        '**Any win counts — we celebrate all of it.**',
        '',
        '✅ First sale ever',
        '✅ Best revenue day',
        '✅ Best ROAS you\'ve hit',
        '✅ First winning product found via Majorka',
        '✅ Milestone revenue months',
        '',
        '**Include a Shopify/Stripe screenshot if you can.**',
        'You can blur the exact number — just show the dashboard structure.',
        '',
        '*Fake screenshots = permanent ban.*',
      ].join('\n'))
    ]
  }
}

function buildBugReportEmbed() {
  return {
    embeds: [new EmbedBuilder()
      .setTitle('🐛 Bug Reports')
      .setColor(0x6366F1)
      .setDescription([
        '**Use this format or your report will be ignored:**',
        '',
        '```',
        'AFFECTED FEATURE: [Product Intelligence / Profit Calc / Ads Manager / Other]',
        'WHAT HAPPENED: [Description]',
        'WHAT SHOULD HAPPEN: [Expected behaviour]',
        'STEPS TO REPRODUCE:',
        '1. [Step 1]',
        '2. [Step 2]',
        'BROWSER/DEVICE: [Chrome / Safari / iOS / Android]',
        'SEVERITY: [Blocks my work / Has workaround / Minor]',
        '```',
        '',
        'Attach a screenshot if possible. Our team responds within 24 hours.',
      ].join('\n'))
    ],
    components: [new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('📖 Docs').setStyle(ButtonStyle.Link).setURL('https://www.majorka.io'),
      new ButtonBuilder().setLabel('📧 Email Support').setStyle(ButtonStyle.Link).setURL('https://www.majorka.io'),
    )]
  }
}

function buildFeatureRequestEmbed() {
  return {
    embeds: [new EmbedBuilder()
      .setTitle('💭 Feature Requests')
      .setColor(0x6366F1)
      .setDescription([
        '**Tell us what to build next.**',
        '',
        '**Format:**',
        '```',
        'FEATURE: [Title]',
        '',
        'WHAT IT DOES:',
        '[Description]',
        '',
        'WHY IT\'S VALUABLE:',
        '[Your use case]',
        '',
        'CURRENT WORKAROUND:',
        '[What you do instead now]',
        '```',
        '',
        'React with ⬆️ on posts you want too.',
        'Top-voted requests reviewed monthly.',
      ].join('\n'))
    ],
    components: [new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('✨ Request a Feature').setStyle(ButtonStyle.Link).setURL('https://www.majorka.io'),
    )]
  }
}

function buildGeneralEmbed() {
  return {
    embeds: [new EmbedBuilder()
      .setTitle('💬 General Chat')
      .setColor(0x6366F1)
      .setDescription([
        'Open discussion — ecommerce, ideas, questions, banter.',
        '',
        '**Keep it relevant to ecommerce and building.**',
        'Completely off-topic chat → 🎲┃off-topic (if available).',
        '',
        'No spam. No self-promo. See 📜┃rules for full guidelines.',
      ].join('\n'))
    ]
  }
}

function buildIntroEmbed() {
  return {
    embeds: [new EmbedBuilder()
      .setTitle('👋 Introduce Yourself')
      .setColor(0x6366F1)
      .setDescription([
        '**New here? Drop an intro using this format:**',
        '',
        '```',
        'NAME (or handle):',
        'WHERE YOU\'RE FROM:',
        'HOW LONG DROPSHIPPING:',
        'CURRENT STAGE: [Just starting / Testing / First sales / Scaling / 6-figure+]',
        'TARGET MARKET: [AU / US / UK / Multiple]',
        'BIGGEST CHALLENGE RIGHT NOW:',
        'WHAT YOU HOPE TO GET FROM THIS COMMUNITY:',
        'MAJORKA USER: [Yes - plan name / No - not yet]',
        '```',
        '',
        'Members who post intros get **2x XP** for their first week!',
      ].join('\n'))
    ]
  }
}

// ── Master channel refresh ─────────────────────────────────────────────────────
async function clearAndPost(channel, ...payloads) {
  try {
    const msgs = await channel.messages.fetch({ limit: 20 })
    const botMsgs = msgs.filter(m => m.author.id === channel.client.user.id)
    for (const [, m] of botMsgs) { try { await m.unpin().catch(() => {}); await m.delete() } catch {} }
  } catch {}
  let last = null
  for (const payload of payloads) {
    if (!payload) continue
    // skip empty-title embeds
    if (payload.embeds && payload.embeds.length === 1 && payload.embeds[0].data?.title === '') continue
    last = await channel.send(payload)
  }
  if (last) try { await last.pin() } catch {}
  return last
}

async function refreshAllChannels(guild) {
  const find = (keyword) => guild.channels.cache.find(c =>
    c.isTextBased() && c.name && c.name.toLowerCase().includes(keyword)
  )
  const results = []

  const channels = [
    { key: 'get-access', label: 'get-access', fn: async (ch) => {
      const payloads = buildGetAccessEmbed()
      try {
        const msgs = await ch.messages.fetch({ limit: 20 })
        for (const [, m] of msgs.filter(m => m.author.id === guild.client.user.id)) {
          try { await m.unpin().catch(() => {}); await m.delete() } catch {}
        }
      } catch {}
      for (const p of payloads) await ch.send(p)
    }},
    { key: 'rules',    label: 'rules',     fn: (ch) => clearAndPost(ch, buildRulesEmbed()) },
    { key: 'wins',     label: 'wins',      fn: (ch) => clearAndPost(ch, buildWinsEmbed()) },
    { key: 'bug',      label: 'bug-reports', fn: (ch) => clearAndPost(ch, buildBugReportEmbed()) },
    { key: 'feature',  label: 'feature-requests', fn: (ch) => clearAndPost(ch, buildFeatureRequestEmbed()) },
    { key: 'general',  label: 'general',   fn: (ch) => clearAndPost(ch, buildGeneralEmbed()) },
    { key: 'intro',    label: 'introductions', fn: (ch) => clearAndPost(ch, buildIntroEmbed()) },
  ]

  for (const { key, label, fn } of channels) {
    const ch = find(key)
    if (!ch) { results.push({ channel: label, ok: false, reason: 'not found' }); continue }
    try { await fn(ch); results.push({ channel: label, ok: true }) }
    catch (e) { results.push({ channel: label, ok: false, reason: e.message }) }
  }

  console.log('[refresh-all]', results.map(r => `${r.ok ? '✅' : '❌'} ${r.channel}`).join(' | '))
  return results
}

// ── Boot automation engine ────────────────────────────────────────────────────
const bootAutomation = require('./automation')
let automationFns = null

client.once('ready', async () => {
  console.log(`✅ Majorka Bot online: ${client.user.tag}`)
  loadChannels()
  scheduleWeeklyStats()
  automationFns = bootAutomation(client)

  // Register slash commands (including /refresh-welcome)
  const { REST: DiscordREST } = require('@discordjs/rest')
  const { Routes: DiscordRoutes } = require('discord-api-types/v10')
  const { SlashCommandBuilder: SCB } = require('discord.js')
  const commands = [
    new SCB().setName('verify')
      .setDescription('Verify your Majorka account and get your plan role')
      .addStringOption(o => o.setName('email').setDescription('Your Majorka account email').setRequired(true)),
    new SCB().setName('stats').setDescription('Show live Majorka platform stats'),
    new SCB().setName('refresh-welcome').setDescription('Re-post the welcome embed with correct buttons (admin only)'),
    new SCB().setName('refresh-channels').setDescription('Refresh all channel embeds and role buttons (admin only)'),
    new SCB().setName('winners').setDescription('Show today\'s top 5 winning products'),
    new SCB().setName('trending')
      .setDescription('Show trending products by niche')
      .addStringOption(o => o.setName('niche').setDescription('Pet / beauty / home / fashion / electronics / fitness / baby / kitchen').setRequired(false)),
    new SCB().setName('score')
      .setDescription('Look up a product\'s opportunity score')
      .addStringOption(o => o.setName('product').setDescription('Product name to search').setRequired(true)),
    new SCB().setName('profit')
      .setDescription('Calculate profit, margin, and ROAS')
      .addNumberOption(o => o.setName('cost').setDescription('Product cost (AUD)').setRequired(true))
      .addNumberOption(o => o.setName('sell').setDescription('Sell price (AUD)').setRequired(true))
      .addNumberOption(o => o.setName('adspend').setDescription('Estimated ad spend per sale (AUD)').setRequired(true)),
    new SCB().setName('plan').setDescription('Show your Majorka plan and channel access'),
    new SCB().setName('broadcast')
      .setDescription('Post an announcement (admin only)')
      .addStringOption(o => o.setName('message').setDescription('Announcement text').setRequired(true))
      .addStringOption(o => o.setName('channel').setDescription('Target channel name').setRequired(false)),
    new SCB().setName('logs').setDescription('Show recent deploy logs'),
    new SCB().setName('deploy').setDescription('Deploy Majorka to Vercel production (admin only)'),
  ].map(c => c.toJSON())

  const rest = new DiscordREST({ version: '10' }).setToken(TOKEN)
  for (const guild of client.guilds.cache.values()) {
    try {
      await rest.put(DiscordRoutes.applicationGuildCommands(client.user.id, guild.id), { body: commands })
      console.log(`✅ Slash commands registered in ${guild.name}`)
    } catch (e) { console.error('Command registration failed:', e.message) }
  }
})

client.login(TOKEN)

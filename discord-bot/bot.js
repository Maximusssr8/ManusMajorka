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

  // Send welcome DM
  try {
    const embed = new EmbedBuilder()
      .setTitle('👋 Welcome to Majorka Community')
      .setColor(0x6366F1)
      .setDescription([
        `Hey ${member.displayName}! Welcome to the **Majorka** community — AI-powered dropshipping intelligence for AU · US · UK sellers.`,
        '',
        '**Get started in 3 steps:**',
        '1. **Verify your account** → run `/verify your@email.com` in any channel',
        '   This assigns your plan role and unlocks premium channels.',
        '2. **Not a member yet?** Sign up free at majorka.io — Builder & Scale plans.',
        '3. **Introduce yourself** in #introductions and check today\'s winners in #todays-winners.',
        '',
        '**Questions?** Drop them in #majorka-help and the team will respond.',
        '',
        'See you inside 🚀',
      ].join('\n'))
      .setFooter({ text: 'Majorka Community • majorka.io' })
    const dmRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('🚀 Open Majorka').setStyle(ButtonStyle.Link).setURL('https://www.majorka.io'),
      new ButtonBuilder().setLabel('✨ Join Free').setStyle(ButtonStyle.Link).setURL('https://www.majorka.io/sign-up'),
    )
    await member.send({ embeds: [embed], components: [dmRow] })
  } catch {} // DMs may be disabled

  // Log to admin
  const logCh = getChannel('👥┃user-activity')
  if (logCh) {
    logCh.send(`👋 **New member joined:** ${member.user.tag} (${member.id})`)
  }
})

// ── Button: Join as Guest ─────────────────────────────────────────────────────
client.on('interactionCreate', async (interaction) => {
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

client.once('ready', async () => {
  console.log(`✅ Majorka Bot online: ${client.user.tag}`)
  loadChannels()
  scheduleWeeklyStats()

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

/**
 * Majorka Discord — Full Server Setup v2
 * - @everyone: ONLY #welcome #rules #get-verified
 * - @Verified (free/unknown): community channels
 * - @Majorka Member (paid): all Majorka AI tools channels
 * - @Builder / @Scale: premium channels
 * - @Owner / @Team: admin-only channels
 * Extras: verification by email, welcome DM, starboard, weekly stats, auto-mod
 */

const {
  Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder,
  ChannelType, SlashCommandBuilder, REST, Routes,
  ButtonBuilder, ButtonStyle, ActionRowBuilder,
  StringSelectMenuBuilder
} = require('discord.js')

const TOKEN = process.env.DISCORD_BOT_TOKEN
const MAJORKA_API = 'http://localhost:3000'

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
})

// ── Role definitions ──────────────────────────────────────────────────────────
const ROLE_DEFS = [
  { name: '👑 Owner',            color: 0xd4af37, hoist: true,  perms: ['Administrator'] },
  { name: '⚡ Majorka Team',     color: 0x6366f1, hoist: true,  perms: ['ManageMessages','KickMembers','ManageChannels'] },
  { name: '💎 Scale Member',     color: 0xa855f7, hoist: true,  perms: [] },
  { name: '🏗️ Builder Member',   color: 0x22c55e, hoist: true,  perms: [] },
  { name: '✅ Majorka Member',   color: 0x3b82f6, hoist: true,  perms: [] },
  { name: '👀 Verified',         color: 0x64748b, hoist: false, perms: [] },
  { name: '🤖 Bot',              color: 0x374151, hoist: false, perms: [] },
]

// ── Channel/category structure ────────────────────────────────────────────────
// access levels: 'everyone' | 'verified' | 'member' | 'builder' | 'scale' | 'team' | 'admin'
const STRUCTURE = [
  {
    category: '👋 START HERE',
    access: 'everyone',
    readOnly: true,
    channels: [
      { name: '📋┃welcome',        topic: 'Welcome to Majorka! New here? Start here.' },
      { name: '📜┃rules',          topic: 'Community guidelines — read before participating' },
      { name: '🔑┃get-access',     topic: 'Verify your Majorka account to unlock channels', readOnly: false },
    ]
  },
  {
    category: '💬 COMMUNITY',
    access: 'verified',
    channels: [
      { name: '💬┃general',             topic: 'General discussion — ecommerce, ideas, questions' },
      { name: '👋┃introductions',        topic: 'New here? Introduce yourself — niche, market, goals' },
      { name: '🏆┃wins',                topic: 'Share your wins — products, sales, launches' },
      { name: '💡┃ideas',               topic: 'Brainstorm and share ecommerce ideas' },
      { name: '❓┃questions',            topic: 'Ask the community anything' },
    ]
  },
  {
    category: '🤖 MAJORKA AI',
    access: 'member',
    channels: [
      { name: '🔬┃product-research',    topic: 'Share winning products found with Majorka' },
      { name: '🎨┃ads-creative',        topic: 'Share ads created with Majorka Ads Studio' },
      { name: '🏪┃stores-built',        topic: 'Show stores you built with the Website Generator' },
      { name: '📊┃market-insights',     topic: 'AU/US/EU/UK market tips from the community' },
      { name: '📧┃email-sequences',     topic: 'Share email sequences that convert' },
      { name: '🛒┃supplier-finds',      topic: 'Great suppliers worth sharing' },
    ]
  },
  {
    category: '💎 BUILDER+ PRIVATE',
    access: 'builder',
    channels: [
      { name: '💎┃vip-lounge',          topic: 'Private channel for Builder and Scale members' },
      { name: '🧠┃strategy',            topic: 'High-level ecommerce strategy — no basics here' },
      { name: '📈┃scaling',             topic: '$10K+ months — how to get there' },
      { name: '🤝┃collab',              topic: 'Find collab partners — JVs, media buyers, suppliers' },
      { name: '🔒┃private-wins',        topic: 'Big wins you don\'t want shared publicly' },
    ]
  },
  {
    category: '📢 ANNOUNCEMENTS',
    access: 'everyone',
    readOnly: true,
    channels: [
      { name: '📢┃announcements',       topic: 'Official Majorka announcements' },
      { name: '🚀┃product-updates',     topic: 'New features shipped this week' },
      { name: '📋┃changelog',           topic: 'Version changelog — auto-posted on deploy' },
    ]
  },
  {
    category: '⭐ SHOWCASE',
    access: 'verified',
    channels: [
      { name: '🏪┃store-showcase',      topic: 'Show off your store — drop a link + screenshot' },
      { name: '⭐┃starboard',           topic: 'Best community posts — 3+ ⭐ reactions to appear here', readOnly: true },
    ]
  },
  {
    category: '🆘 SUPPORT',
    access: 'verified',
    channels: [
      { name: '🆘┃help-desk',           topic: 'Get help — tag @Majorka Team' },
      { name: '🐛┃bug-reports',         topic: 'Bug reports — include steps to reproduce' },
      { name: '💭┃feature-requests',    topic: 'What do you want Majorka to build next?' },
    ]
  },
  {
    category: '🔒 ADMIN ONLY',
    access: 'admin',
    channels: [
      { name: '⚡┃admin-commands',      topic: 'Bot commands — /deploy /build /stats /broadcast' },
      { name: '🚀┃deploy-log',          topic: 'Auto: every Vercel deployment result' },
      { name: '👥┃user-activity',       topic: 'Auto: new signups, upgrades, plan changes' },
      { name: '🤖┃agent-log',           topic: 'Auto: Claude Code agent task completions' },
      { name: '🔔┃majorka-updates',     topic: 'Auto: all Majorka system notifications' },
      { name: '❌┃error-log',           topic: 'Auto: Sentry errors, API failures, exceptions' },
      { name: '📊┃analytics',           topic: 'Auto: weekly user/revenue/engagement stats' },
    ]
  },
]

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function rebuildServer(guild) {
  console.log(`\n🚀 Rebuilding: ${guild.name}\n`)

  // ── Delete ALL existing channels ──────────────────────────────────────────
  console.log('Clearing all channels...')
  const allChannels = [...guild.channels.cache.values()]
  for (const ch of allChannels) {
    try { await ch.delete(); await sleep(250) } catch {}
  }
  await sleep(1000)

  // ── Create roles ──────────────────────────────────────────────────────────
  console.log('Creating roles...')
  // Delete default roles except @everyone
  for (const role of guild.roles.cache.values()) {
    if (role.name !== '@everyone' && !role.managed) {
      try { await role.delete(); await sleep(200) } catch {}
    }
  }
  await sleep(500)

  const roleMap = {}
  for (const r of ROLE_DEFS) {
    const permFlags = r.perms.map(p => PermissionsBitField.Flags[p]).filter(Boolean)
    const role = await guild.roles.create({
      name: r.name,
      color: r.color,
      hoist: r.hoist,
      permissions: permFlags.length ? permFlags : [],
    })
    roleMap[r.name] = role
    console.log(`  ✅ ${r.name}`)
    await sleep(300)
  }

  const ownerRole   = roleMap['👑 Owner']
  const teamRole    = roleMap['⚡ Majorka Team']
  const scaleRole   = roleMap['💎 Scale Member']
  const builderRole = roleMap['🏗️ Builder Member']
  const memberRole  = roleMap['✅ Majorka Member']
  const verifiedRole = roleMap['👀 Verified']
  const everyone    = guild.roles.everyone

  // Helper to build permission overwrites per access level
  function getPerms(access, readOnly = false) {
    const DENY_ALL = [PermissionsBitField.Flags.ViewChannel]
    const ALLOW_VIEW = [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory]
    const ALLOW_SEND = [...ALLOW_VIEW, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles, PermissionsBitField.Flags.EmbedLinks]
    const BOT_SEND   = [...ALLOW_VIEW, PermissionsBitField.Flags.SendMessages]

    const base = [
      { id: everyone.id,    deny: DENY_ALL },
      { id: ownerRole.id,   allow: ALLOW_SEND },
      { id: teamRole.id,    allow: ALLOW_SEND },
      { id: client.user.id, allow: BOT_SEND },
    ]

    if (access === 'everyone') {
      base[0] = { id: everyone.id, allow: readOnly ? ALLOW_VIEW : ALLOW_SEND }
      if (readOnly) {
        base.push({ id: everyone.id, deny: [PermissionsBitField.Flags.SendMessages] })
      }
    } else if (access === 'verified') {
      base.push({ id: verifiedRole.id, allow: readOnly ? ALLOW_VIEW : ALLOW_SEND })
      base.push({ id: memberRole.id,   allow: ALLOW_SEND })
      base.push({ id: builderRole.id,  allow: ALLOW_SEND })
      base.push({ id: scaleRole.id,    allow: ALLOW_SEND })
    } else if (access === 'member') {
      base.push({ id: memberRole.id,   allow: ALLOW_SEND })
      base.push({ id: builderRole.id,  allow: ALLOW_SEND })
      base.push({ id: scaleRole.id,    allow: ALLOW_SEND })
    } else if (access === 'builder') {
      base.push({ id: builderRole.id,  allow: ALLOW_SEND })
      base.push({ id: scaleRole.id,    allow: ALLOW_SEND })
    } else if (access === 'admin') {
      // already handled by ownerRole + teamRole above
    }

    return base
  }

  // ── Create categories + channels ──────────────────────────────────────────
  console.log('\nCreating channels...')
  const channelMap = {}

  for (const section of STRUCTURE) {
    const catPerms = getPerms(section.access, section.readOnly)
    const category = await guild.channels.create({
      name: section.category,
      type: ChannelType.GuildCategory,
      permissionOverwrites: catPerms,
    })
    console.log(`\n  📁 ${section.category}`)
    await sleep(400)

    for (const ch of section.channels) {
      const chPerms = ch.readOnly === false
        ? getPerms(section.access, false)   // override to writable
        : getPerms(section.access, section.readOnly || ch.readOnly)

      const channel = await guild.channels.create({
        name: ch.name,
        topic: ch.topic || '',
        type: ChannelType.GuildText,
        parent: category.id,
        permissionOverwrites: chPerms,
      })
      const cleanName = ch.name.replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-') || ch.name
      channelMap[ch.name] = channel
      channelMap[cleanName] = channel
      console.log(`    ✅ ${ch.name}`)
      await sleep(400)
    }
  }

  // ── Post welcome messages ─────────────────────────────────────────────────
  console.log('\nPosting messages...')
  await sleep(2000)

  // Welcome
  const welcomeCh = channelMap['📋┃welcome']
  if (welcomeCh) {
    const embed = new EmbedBuilder()
      .setTitle('👋 Welcome to the Majorka Community')
      .setColor(0xd4af37)
      .setDescription([
        '**The AI Ecommerce OS for sellers worldwide.**',
        '',
        'This is the official Majorka community — built for dropshippers, brand builders, and ecom operators across AU 🇦🇺 US 🇺🇸 UK 🇬🇧 EU 🇪🇺 and beyond.',
        '',
        '**To get started:**',
        '1️⃣ Read 📜┃rules',
        '2️⃣ Go to 🔑┃get-access and verify your Majorka account',
        '3️⃣ Introduce yourself in 👋┃introductions',
        '4️⃣ Share your first win in 🏆┃wins',
        '',
        '**Not a member yet?**',
        '🔗 [Start free at manus-majorka.vercel.app](https://manus-majorka.vercel.app)',
      ].join('\n'))
      .setFooter({ text: 'Built for sellers worldwide 🌍' })
    const msg = await welcomeCh.send({ embeds: [embed] })
    try { await msg.pin() } catch {}
  }

  // Rules
  const rulesCh = channelMap['📜┃rules']
  if (rulesCh) {
    const embed = new EmbedBuilder()
      .setTitle('📜 Community Rules')
      .setColor(0x6366f1)
      .addFields(
        { name: '1. Respect everyone', value: 'No harassment, hate speech, or personal attacks. Zero tolerance.' },
        { name: '2. Stay on topic', value: 'Keep it ecommerce. Off-topic chat → 💬┃general.' },
        { name: '3. No spam or self-promo', value: 'No unsolicited promos, affiliate links, or competitor mentions.' },
        { name: '4. Share real value', value: 'Wins, strategies, products, tips — be genuine.' },
        { name: '5. Builder+ confidentiality', value: 'What\'s shared in 💎 BUILDER+ PRIVATE stays there.' },
        { name: '6. Use the right channels', value: 'Bugs → 🐛┃bug-reports. Help → 🆘┃help-desk. Wins → 🏆┃wins.' },
        { name: '7. English only', value: 'Keep it English so everyone can participate.' },
      )
      .setFooter({ text: 'Breaking rules → warning → kick → ban' })
    const msg = await rulesCh.send({ embeds: [embed] })
    try { await msg.pin() } catch {}
  }

  // Get Access
  const getAccessCh = channelMap['🔑┃get-access']
  if (getAccessCh) {
    const embed = new EmbedBuilder()
      .setTitle('🔑 Unlock Your Access')
      .setColor(0xd4af37)
      .setDescription([
        'Verify your Majorka account to unlock community channels.',
        '',
        '**How it works:**',
        'Type `/verify email@youremail.com` — the bot checks your Majorka account and assigns your role automatically.',
        '',
        '**Roles & Access:**',
        '👀 **Verified** (free) → Community channels, wins, questions',
        '✅ **Majorka Member** (any paid plan) → All Majorka AI channels',
        '🏗️ **Builder Member** ($49/mo) → + Builder+ private channels',
        '💎 **Scale Member** ($149/mo) → All access',
        '',
        '**Not a member yet?**',
        '🔗 [Start free → manus-majorka.vercel.app](https://manus-majorka.vercel.app)',
        '',
        '*Just want community access? Type `/verify guest` to get basic verified access.*',
      ].join('\n'))
    const verifyBtn = new ButtonBuilder().setCustomId('verify_guest').setLabel('Join as Guest').setStyle(ButtonStyle.Secondary).setEmoji('👀')
    const signupBtn = new ButtonBuilder().setLabel('Get Majorka Account').setStyle(ButtonStyle.Link).setURL('https://manus-majorka.vercel.app')
    const row = new ActionRowBuilder().addComponents(verifyBtn, signupBtn)
    const msg = await getAccessCh.send({ embeds: [embed], components: [row] })
    try { await msg.pin() } catch {}
  }

  // Admin welcome
  const adminUpdates = channelMap['🔔┃majorka-updates']
  if (adminUpdates) {
    const embed = new EmbedBuilder()
      .setTitle('🤖 Majorka Bot v2 Online')
      .setColor(0xd4af37)
      .setDescription([
        '**Server fully configured.**',
        '',
        '**Slash commands:**',
        '`/stats` — live Majorka app stats',
        '`/deploy` — deploy to Vercel prod',
        '`/build [task]` — run a Claude Code agent',
        '`/broadcast [msg]` — send announcement to all verified members',
        '`/verify [email]` — manually verify a member',
        '',
        '**Auto-posts:**',
        '• 🚀┃deploy-log — every Vercel deploy',
        '• 👥┃user-activity — new signups + upgrades',
        '• 🤖┃agent-log — Claude Code task completions',
        '• ❌┃error-log — app errors',
        '• 📊┃analytics — weekly stats (every Monday 9AM)',
      ].join('\n'))
      .setTimestamp()
    await adminUpdates.send({ embeds: [embed] })
  }

  // Save channel map
  const ids = {}
  for (const [name, ch] of Object.entries(channelMap)) ids[name] = ch.id
  require('fs').writeFileSync('/tmp/discord-channels.json', JSON.stringify(ids, null, 2))

  // ── Register slash commands ───────────────────────────────────────────────
  const commands = [
    new SlashCommandBuilder().setName('stats').setDescription('Live Majorka app stats'),
    new SlashCommandBuilder().setName('deploy').setDescription('Deploy Majorka to Vercel production'),
    new SlashCommandBuilder().setName('build')
      .setDescription('Run a Claude Code agent task')
      .addStringOption(o => o.setName('task').setDescription('Task to run').setRequired(true)),
    new SlashCommandBuilder().setName('logs').setDescription('Show recent deploy + agent logs'),
    new SlashCommandBuilder().setName('verify')
      .setDescription('Verify your Majorka account to unlock channels')
      .addStringOption(o => o.setName('email').setDescription('Your Majorka email address').setRequired(true)),
    new SlashCommandBuilder().setName('broadcast')
      .setDescription('Send announcement to #announcements (Owner/Team only)')
      .addStringOption(o => o.setName('message').setDescription('Message to broadcast').setRequired(true)),
  ].map(c => c.toJSON())

  const rest = new REST({ version: '10' }).setToken(TOKEN)
  await rest.put(Routes.applicationGuildCommands(client.user.id, guild.id), { body: commands })

  console.log('\n🎉 Server rebuild complete!')
  return channelMap
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`)
  for (const guild of client.guilds.cache.values()) {
    await rebuildServer(guild)
  }
  process.exit(0)
})

client.login(TOKEN)

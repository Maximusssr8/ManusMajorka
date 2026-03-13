/**
 * Majorka Discord — Full Server Setup
 * Roles, categories, channels, permissions, welcome messages, pinned posts
 */

const {
  Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder,
  ChannelType, SlashCommandBuilder, REST, Routes
} = require('discord.js')

const TOKEN = process.env.DISCORD_BOT_TOKEN
const OWNER_ID = '5185376886' // Max's Discord user ID — update after first run

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
})

// ── Role definitions ──────────────────────────────────────────────────────────
const ROLES = [
  { name: '👑 Owner',         color: 0xd4af37, hoist: true,  position: 10, admin: true  },
  { name: '⚡ Majorka Team',  color: 0x6366f1, hoist: true,  position: 9,  admin: false },
  { name: '💎 Scale',         color: 0xa855f7, hoist: true,  position: 8,  admin: false },
  { name: '🏗️ Builder',       color: 0x22c55e, hoist: true,  position: 7,  admin: false },
  { name: '🌱 Starter',       color: 0x64748b, hoist: false, position: 6,  admin: false },
  { name: '🤖 Bot',           color: 0x374151, hoist: false, position: 5,  admin: false },
  { name: '👋 New Member',    color: 0x1f2937, hoist: false, position: 1,  admin: false },
]

// ── Channel structure ─────────────────────────────────────────────────────────
const STRUCTURE = [
  {
    category: '🔒 ADMIN',
    adminOnly: true,
    channels: [
      { name: 'admin-commands',  topic: 'Bot commands for Max only — /deploy /build /stats' },
      { name: 'deploy-log',      topic: 'Auto-posted: every Vercel deployment result' },
      { name: 'user-analytics',  topic: 'Auto-posted: new signups, upgrades, churns' },
      { name: 'agent-log',       topic: 'Claude Code agent task outputs' },
      { name: 'error-log',       topic: 'Sentry errors and server exceptions' },
    ]
  },
  {
    category: '📢 ANNOUNCEMENTS',
    readOnly: true,
    channels: [
      { name: 'announcements',   topic: 'Official Majorka announcements — new features, updates' },
      { name: 'product-updates', topic: 'What shipped this week' },
      { name: 'changelog',       topic: 'Full version changelog — auto-posted on deploy' },
    ]
  },
  {
    category: '👋 START HERE',
    channels: [
      { name: 'welcome',         topic: 'Welcome to Majorka! Read before anything else', readOnly: true },
      { name: 'rules',           topic: 'Community rules — keep it friendly', readOnly: true },
      { name: 'get-roles',       topic: 'Assign yourself a role based on your plan' },
    ]
  },
  {
    category: '💬 COMMUNITY',
    channels: [
      { name: 'general',          topic: 'General chat — anything goes (keep it ecom-related)' },
      { name: 'introduce-yourself', topic: 'New here? Tell us your niche, market, and goals' },
      { name: 'wins',             topic: '🏆 Share your wins — products found, sales made, stores launched' },
      { name: 'showcase',         topic: 'Share your Majorka-built stores' },
      { name: 'feedback',         topic: 'Feature requests, product feedback, what you want next' },
    ]
  },
  {
    category: '🤖 MAJORKA AI',
    channels: [
      { name: 'majorka-updates',  topic: 'Live bot updates — deploys, signups, agent completions' },
      { name: 'product-research', topic: 'Share winning products you found with Majorka' },
      { name: 'ads-creative',     topic: 'Share ads generated with Majorka Ads Studio' },
      { name: 'stores-built',     topic: 'Stores generated with Majorka Website Builder' },
    ]
  },
  {
    category: '💎 BUILDER+ ONLY',
    premiumOnly: true,
    channels: [
      { name: 'vip-chat',         topic: 'Private channel for Builder and Scale members' },
      { name: 'strategy-session', topic: 'Deep-dive strategy discussions' },
      { name: 'private-wins',     topic: 'High-value finds — keep it in the circle' },
    ]
  },
  {
    category: '🆘 SUPPORT',
    channels: [
      { name: 'help-desk',        topic: 'Get help with Majorka — tag @Majorka Team' },
      { name: 'bug-reports',      topic: 'Found a bug? Report it here with steps to reproduce' },
      { name: 'feature-requests', topic: 'Vote on and submit feature ideas' },
    ]
  },
]

// ── Main setup ────────────────────────────────────────────────────────────────
async function setupServer(guild) {
  console.log(`\n🚀 Setting up: ${guild.name} (${guild.id})\n`)

  // ── 1. Delete default channels except general (clean slate) ─────────────
  console.log('Cleaning default channels...')
  for (const ch of guild.channels.cache.values()) {
    if (ch.name !== 'general' && ch.type !== ChannelType.GuildCategory) {
      try { await ch.delete(); await sleep(300) } catch {}
    }
  }

  // ── 2. Create roles ───────────────────────────────────────────────────────
  console.log('\nCreating roles...')
  const roleMap = {}
  for (const r of ROLES) {
    const existing = guild.roles.cache.find(x => x.name === r.name)
    if (existing) { roleMap[r.name] = existing; console.log(`  ↳ ${r.name} exists`); continue }

    const permissions = r.admin
      ? [PermissionsBitField.Flags.Administrator]
      : [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory]

    const role = await guild.roles.create({ name: r.name, color: r.color, hoist: r.hoist, permissions })
    roleMap[r.name] = role
    console.log(`  ✅ Created role: ${r.name}`)
    await sleep(300)
  }

  const ownerRole    = roleMap['👑 Owner']
  const teamRole     = roleMap['⚡ Majorka Team']
  const scaleRole    = roleMap['💎 Scale']
  const builderRole  = roleMap['🏗️ Builder']
  const starterRole  = roleMap['🌱 Starter']
  const newMember    = roleMap['👋 New Member']
  const everyone     = guild.roles.everyone

  // ── 3. Create categories + channels ──────────────────────────────────────
  console.log('\nCreating channels...')
  const channelMap = {}

  for (const section of STRUCTURE) {
    // Build category permissions
    const catPerms = []

    if (section.adminOnly) {
      catPerms.push(
        { id: everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: ownerRole.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Administrator] },
        { id: teamRole.id,  allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
      )
    } else if (section.premiumOnly) {
      catPerms.push(
        { id: everyone.id,    deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: starterRole.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: builderRole.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
        { id: scaleRole.id,   allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
        { id: ownerRole.id,   allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Administrator] },
      )
    } else {
      catPerms.push(
        { id: everyone.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory] },
      )
    }

    const category = await guild.channels.create({
      name: section.category,
      type: ChannelType.GuildCategory,
      permissionOverwrites: catPerms,
    })
    console.log(`\n  📁 ${section.category}`)
    await sleep(400)

    for (const ch of section.channels) {
      const chPerms = [...catPerms]

      if (section.readOnly || ch.readOnly) {
        chPerms.push(
          { id: everyone.id, deny: [PermissionsBitField.Flags.SendMessages] },
          { id: client.user.id, allow: [PermissionsBitField.Flags.SendMessages] },
          { id: ownerRole.id,   allow: [PermissionsBitField.Flags.SendMessages] },
          { id: teamRole.id,    allow: [PermissionsBitField.Flags.SendMessages] },
        )
      } else if (!section.adminOnly) {
        chPerms.push(
          { id: everyone.id, allow: [PermissionsBitField.Flags.SendMessages] },
          { id: newMember.id, allow: [PermissionsBitField.Flags.SendMessages] },
        )
      }

      const channel = await guild.channels.create({
        name: ch.name,
        topic: ch.topic || '',
        type: ChannelType.GuildText,
        parent: category.id,
        permissionOverwrites: chPerms,
      })
      channelMap[ch.name] = channel
      console.log(`    ✅ #${ch.name}`)
      await sleep(400)
    }
  }

  // ── 4. Save channel IDs ───────────────────────────────────────────────────
  const ids = {}
  for (const [name, ch] of Object.entries(channelMap)) ids[name] = ch.id
  require('fs').writeFileSync('/tmp/discord-channels.json', JSON.stringify(ids, null, 2))

  // ── 5. Post welcome messages ──────────────────────────────────────────────
  console.log('\nPosting welcome messages...')
  await sleep(2000)

  const welcomeCh = channelMap['welcome']
  if (welcomeCh) {
    const embed = new EmbedBuilder()
      .setTitle('👋 Welcome to Majorka AI')
      .setColor(0xd4af37)
      .setDescription([
        '**The AI Ecommerce OS for sellers worldwide.**',
        '',
        'This server is your community hub for everything Majorka.',
        '',
        '**Getting started:**',
        '1️⃣ Head to <#' + (channelMap['rules']?.id || 'rules') + '> and read the rules',
        '2️⃣ Go to <#' + (channelMap['get-roles']?.id || 'get-roles') + '> to claim your plan role',
        '3️⃣ Introduce yourself in <#' + (channelMap['introduce-yourself']?.id || 'general') + '>',
        '4️⃣ Share your first win in <#' + (channelMap['wins']?.id || 'wins') + '>',
        '',
        '**🌐 App:** https://manus-majorka.vercel.app',
      ].join('\n'))
      .setFooter({ text: 'Built for sellers worldwide 🌍' })
    const msg = await welcomeCh.send({ embeds: [embed] })
    await msg.pin()
  }

  const rulesCh = channelMap['rules']
  if (rulesCh) {
    const embed = new EmbedBuilder()
      .setTitle('📋 Community Rules')
      .setColor(0x6366f1)
      .addFields(
        { name: '1. Be respectful', value: 'No hate speech, harassment, or personal attacks.' },
        { name: '2. Stay on topic', value: 'Keep discussions ecommerce-related. Off-topic → #general.' },
        { name: '3. No spam', value: 'No self-promotion, affiliate links, or competitor mentions.' },
        { name: '4. Share value', value: 'Wins, tips, products, strategies — share what works.' },
        { name: '5. Keep secrets', value: 'What\'s shared in Builder+ stays in Builder+.' },
        { name: '6. Tag support', value: 'For help, use #help-desk and tag @Majorka Team.' },
      )
    const msg = await rulesCh.send({ embeds: [embed] })
    await msg.pin()
  }

  const getRolesCh = channelMap['get-roles']
  if (getRolesCh) {
    const embed = new EmbedBuilder()
      .setTitle('🎭 Claim Your Role')
      .setColor(0xd4af37)
      .setDescription([
        'Reply with your plan to get the right role:',
        '',
        '🌱 **Starter** (Free plan) → reply `starter`',
        '🏗️ **Builder** ($49/mo) → reply `builder`',
        '💎 **Scale** ($149/mo) → reply `scale`',
        '',
        'Builder and Scale members unlock **💎 BUILDER+ ONLY** channels with private strategy sessions.',
        '',
        '🌐 Not a member yet? → https://manus-majorka.vercel.app',
      ].join('\n'))
    const msg = await getRolesCh.send({ embeds: [embed] })
    await msg.pin()
  }

  const updatesCh = channelMap['majorka-updates']
  if (updatesCh) {
    const embed = new EmbedBuilder()
      .setTitle('🤖 Majorka Bot is Online')
      .setColor(0xd4af37)
      .setDescription([
        'Connected to **Majorka AI** production system.',
        '',
        '**Slash commands (in any channel):**',
        '`/stats` — live Majorka stats',
        '`/build [task]` — trigger a Claude Code agent',
        '`/deploy` — deploy to Vercel production',
        '',
        '**Auto-posts here:**',
        '• New user signups',
        '• Vercel deployments',
        '• Agent task completions',
        '• Weekly growth reports',
      ].join('\n'))
      .setTimestamp()
    await updatesCh.send({ embeds: [embed] })
  }

  // ── 6. Register slash commands ────────────────────────────────────────────
  const commands = [
    new SlashCommandBuilder().setName('stats').setDescription('Live Majorka stats'),
    new SlashCommandBuilder().setName('deploy').setDescription('Deploy to Vercel production'),
    new SlashCommandBuilder().setName('build')
      .setDescription('Run a Claude Code agent task')
      .addStringOption(o => o.setName('task').setDescription('Task to execute').setRequired(true)),
    new SlashCommandBuilder().setName('logs').setDescription('Show recent agent + deploy logs'),
  ].map(c => c.toJSON())

  const rest = new REST({ version: '10' }).setToken(TOKEN)
  await rest.put(Routes.applicationGuildCommands(client.user.id, guild.id), { body: commands })
  console.log('\n✅ Slash commands registered')

  console.log('\n🎉 Server setup complete!')
  return channelMap
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`)
  for (const guild of client.guilds.cache.values()) {
    await setupServer(guild)
  }
  process.exit(0)
})

client.login(TOKEN)

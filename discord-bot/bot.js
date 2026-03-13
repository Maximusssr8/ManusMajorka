/**
 * Majorka Discord Bot
 * Commands: /stats, /build [task], /deploy
 * Auto-posts: new signups, deploys, agent task completions
 */

const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder, SlashCommandBuilder, REST, Routes } = require('discord.js')
const { execSync, exec } = require('child_process')
const https = require('https')

const TOKEN = process.env.DISCORD_BOT_TOKEN
const CLIENT_ID = '1481859264057442325'
const MAJORKA_URL = 'http://localhost:3000'

if (!TOKEN) {
  console.error('❌ DISCORD_BOT_TOKEN not set')
  process.exit(1)
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    // MessageContent requires enabling in Discord Dev Portal → Bot → Privileged Gateway Intents
    // GatewayIntentBits.MessageContent,
  ]
})

// ── Channel IDs (populated after setup) ──────────────────────────────────────
let channelIds = {}

// ── Setup server channels ─────────────────────────────────────────────────────
async function setupChannels(guild) {
  console.log(`Setting up channels in: ${guild.name}`)

  const structure = [
    { name: 'announcements', topic: 'Official Majorka announcements', readonly: true },
    { name: 'majorka-updates', topic: 'Live updates from Majorka — new users, deploys, AI agent activity' },
    { name: 'build-log', topic: 'Agent task logs and build activity' },
    { name: 'general', topic: 'General discussion' },
    { name: 'feedback', topic: 'Share feedback and feature requests' },
    { name: 'showcase', topic: 'Show off stores you built with Majorka 🚀' },
  ]

  const created = {}
  for (const ch of structure) {
    try {
      const existing = guild.channels.cache.find(c => c.name === ch.name)
      if (existing) {
        created[ch.name] = existing.id
        console.log(`  ↳ #${ch.name} already exists`)
        continue
      }

      const permissionOverwrites = []
      if (ch.readonly) {
        permissionOverwrites.push(
          { id: guild.roles.everyone, deny: [PermissionsBitField.Flags.SendMessages] },
          { id: guild.members.me, allow: [PermissionsBitField.Flags.SendMessages] }
        )
      }

      const channel = await guild.channels.create({
        name: ch.name,
        topic: ch.topic || '',
        permissionOverwrites,
      })
      created[ch.name] = channel.id
      console.log(`  ✅ Created #${ch.name}`)
    } catch (e) {
      console.error(`  ❌ Failed to create #${ch.name}:`, e.message)
    }
  }

  channelIds = created

  // Save channel IDs for later use
  const fs = require('fs')
  fs.writeFileSync('/tmp/discord-channels.json', JSON.stringify(created, null, 2))
  console.log('Channel IDs saved to /tmp/discord-channels.json')
  return created
}

// ── Register slash commands ───────────────────────────────────────────────────
async function registerCommands(guildId) {
  const commands = [
    new SlashCommandBuilder()
      .setName('stats')
      .setDescription('Get live Majorka stats — users, top tool, market breakdown'),
    new SlashCommandBuilder()
      .setName('build')
      .setDescription('Trigger a Claude Code agent with a task')
      .addStringOption(opt =>
        opt.setName('task').setDescription('The task to execute').setRequired(true)
      ),
    new SlashCommandBuilder()
      .setName('deploy')
      .setDescription('Deploy Majorka to Vercel (npx vercel --prod)'),
  ].map(cmd => cmd.toJSON())

  const rest = new REST({ version: '10' }).setToken(TOKEN)
  try {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, guildId), { body: commands })
    console.log(`✅ Slash commands registered for guild ${guildId}`)
  } catch (e) {
    console.error('❌ Failed to register commands:', e.message)
  }
}

// ── Fetch Majorka stats ───────────────────────────────────────────────────────
async function getMajorkaStats() {
  return new Promise((resolve) => {
    const req = https.request(`${MAJORKA_URL}/api/agent-log`, { method: 'GET' }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch { resolve(null) }
      })
    })
    req.on('error', () => resolve(null))
    req.setTimeout(3000, () => { req.destroy(); resolve(null) })
    req.end()
  })
}

// ── Slash command handlers ────────────────────────────────────────────────────
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return

  const { commandName } = interaction
  await interaction.deferReply()

  if (commandName === 'stats') {
    const stats = await getMajorkaStats()
    const embed = new EmbedBuilder()
      .setTitle('📊 Majorka Live Stats')
      .setColor(0xd4af37)
      .setTimestamp()
      .addFields(
        { name: '🌐 Production', value: 'https://manus-majorka.vercel.app', inline: false },
        { name: '🤖 Dev Server', value: `${MAJORKA_URL} (localhost)`, inline: true },
        { name: '📦 Repo', value: 'Maximusssr8/ManusMajorka', inline: true },
      )
    if (stats) {
      embed.addFields({ name: '📋 Agent Log', value: JSON.stringify(stats).slice(0, 200), inline: false })
    }
    await interaction.editReply({ embeds: [embed] })
  }

  if (commandName === 'build') {
    const task = interaction.options.getString('task')
    const embed = new EmbedBuilder()
      .setTitle('⚙️ Build Task Started')
      .setColor(0x6366f1)
      .setDescription(`\`\`\`${task}\`\`\``)
      .setTimestamp()
    await interaction.editReply({ embeds: [embed] })

    // Run Claude Code agent
    exec(
      `cd ~/ManusMajorka && CLAUDECODE= claude --permission-mode bypassPermissions --print "${task.replace(/"/g, "'")}" > /tmp/discord-build.log 2>&1`,
      async (err, stdout, stderr) => {
        const result = err ? `❌ Failed: ${err.message}` : '✅ Build complete'
        const logChannel = client.channels.cache.get(channelIds['build-log'])
        if (logChannel) {
          const doneEmbed = new EmbedBuilder()
            .setTitle(result)
            .setColor(err ? 0xff4444 : 0x22c55e)
            .setDescription(`Task: ${task}`)
            .setTimestamp()
          logChannel.send({ embeds: [doneEmbed] })
        }
      }
    )
  }

  if (commandName === 'deploy') {
    const embed = new EmbedBuilder()
      .setTitle('🚀 Deploying to Vercel...')
      .setColor(0x6366f1)
      .setTimestamp()
    await interaction.editReply({ embeds: [embed] })

    exec(
      `cd ~/ManusMajorka && npx vercel --prod --yes --token ${process.env.VERCEL_TOKEN || ''} 2>&1`,
      async (err, stdout) => {
        const logChannel = client.channels.cache.get(channelIds['majorka-updates'])
        if (logChannel) {
          const deployEmbed = new EmbedBuilder()
            .setTitle(err ? '❌ Deploy Failed' : '✅ Deployed to Production')
            .setColor(err ? 0xff4444 : 0xd4af37)
            .setDescription(err ? err.message : 'https://manus-majorka.vercel.app')
            .setTimestamp()
          logChannel.send({ embeds: [deployEmbed] })
        }
      }
    )
  }
})

// ── Post to Discord (exported for external use) ───────────────────────────────
async function postToChannel(channelName, message) {
  const id = channelIds[channelName]
  if (!id) {
    // Try to load from saved file
    try {
      const saved = JSON.parse(require('fs').readFileSync('/tmp/discord-channels.json', 'utf-8'))
      channelIds = { ...channelIds, ...saved }
    } catch {}
  }
  const ch = client.channels.cache.get(channelIds[channelName])
  if (!ch) return false
  if (typeof message === 'string') {
    await ch.send(message)
  } else {
    await ch.send({ embeds: [message] })
  }
  return true
}

// ── HTTP server for external posting (Claw/n8n can POST to this) ──────────────
const http = require('http')
const httpServer = http.createServer(async (req, res) => {
  if (req.method !== 'POST') { res.writeHead(405); res.end(); return }

  let body = ''
  req.on('data', chunk => body += chunk)
  req.on('end', async () => {
    try {
      const { channel, message, title, color } = JSON.parse(body)
      let payload = message
      if (title) {
        payload = new EmbedBuilder()
          .setTitle(title)
          .setDescription(message)
          .setColor(color || 0xd4af37)
          .setTimestamp()
      }
      const ok = await postToChannel(channel || 'majorka-updates', payload)
      res.writeHead(ok ? 200 : 404)
      res.end(JSON.stringify({ ok }))
    } catch (e) {
      res.writeHead(400); res.end(JSON.stringify({ error: e.message }))
    }
  })
})
httpServer.listen(3001, () => console.log('📡 Discord HTTP bridge running on :3001'))

// ── Bot ready ─────────────────────────────────────────────────────────────────
client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`)

  for (const guild of client.guilds.cache.values()) {
    console.log(`Found guild: ${guild.name} (${guild.id})`)
    await setupChannels(guild)
    await registerCommands(guild.id)
  }

  // Welcome message
  const updatesCh = client.channels.cache.find(c => c.name === 'majorka-updates')
  if (updatesCh) {
    const embed = new EmbedBuilder()
      .setTitle('🤖 Majorka Bot Online')
      .setColor(0xd4af37)
      .setDescription('Majorka AI Ecommerce OS is connected. Use `/stats`, `/build [task]`, `/deploy` to interact.')
      .setTimestamp()
    updatesCh.send({ embeds: [embed] })
  }
})

client.login(TOKEN)

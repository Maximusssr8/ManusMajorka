/**
 * Post beautifully themed pinned guides to every Majorka Discord channel
 */

const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')
const fs = require('fs')

const TOKEN = process.env.DISCORD_BOT_TOKEN
const GOLD  = 0xd4af37
const INDIGO = 0x6366f1
const GREEN  = 0x22c55e
const PURPLE = 0xa855f7
const DARK   = 0x0d1117

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] })

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// Load saved channel IDs
let channelIds = {}
try { channelIds = JSON.parse(fs.readFileSync('/tmp/discord-channels.json', 'utf-8')) } catch {}

function findChannel(guild, name) {
  const id = channelIds[name]
  if (id) return guild.channels.cache.get(id)
  return guild.channels.cache.find(c => c.name.includes(name.replace(/[^\w]/g, '').toLowerCase()))
}

async function clearAndPin(channel, embeds, components) {
  // Delete old bot messages
  try {
    const msgs = await channel.messages.fetch({ limit: 10 })
    for (const msg of msgs.values()) {
      if (msg.author.id === client.user.id) {
        try { await msg.delete(); await sleep(300) } catch {}
      }
    }
  } catch {}
  await sleep(500)

  // Send new message
  const sent = await channel.send({ embeds, components: components || [] })
  try { await sent.pin() } catch {}
  return sent
}

async function postAllGuides(guild) {
  console.log(`\n✨ Posting channel guides to: ${guild.name}\n`)

  // ── 📋 WELCOME ────────────────────────────────────────────────────────────
  const welcomeCh = findChannel(guild, 'welcome')
  if (welcomeCh) {
    await clearAndPin(welcomeCh, [
      new EmbedBuilder()
        .setColor(GOLD)
        .setTitle('✦ Welcome to Majorka AI ✦')
        .setDescription([
          '```',
          'The AI Ecommerce OS for sellers worldwide.',
          '```',
          '',
          'From **Sydney** to **San Francisco** — Majorka gives you the AI tools that 7-figure ecom operators use to find winning products, build stores, run ads, and scale — all in one platform.',
          '',
          '> 🇦🇺 🇺🇸 🇬🇧 🇪🇺 🌏  Built for every market.',
        ].join('\n'))
        .addFields(
          {
            name: '━━━━━━━━━━━━━━━━━━━━━━━\n📍 Getting Started',
            value: [
              '**1.** Read 📜┃rules — know the vibe',
              '**2.** Go to 🔑┃get-access — verify your account',
              '**3.** Introduce yourself in 👋┃introductions',
              '**4.** Share your first win in 🏆┃wins',
            ].join('\n'),
            inline: false
          },
          {
            name: '━━━━━━━━━━━━━━━━━━━━━━━\n🔑 Unlock Your Channels',
            value: [
              '**Free member** → Community channels',
              '**Paid plan** → All Majorka AI tools channels',
              '**Builder+** → Private strategy channels',
            ].join('\n'),
            inline: false
          }
        )
        .setImage('https://og-image.vercel.app/Majorka%20AI.png')
        .setFooter({ text: 'manus-majorka.vercel.app  •  The AI Ecommerce OS' })
        .setTimestamp(),

      new EmbedBuilder()
        .setColor(DARK)
        .addFields(
          { name: '🔬 Research', value: 'Product Discovery · Keyword Miner · Saturation Checker · Store Spy', inline: true },
          { name: '✅ Validate', value: 'Profit Calculator · Audience Profiler · Validate Tool', inline: true },
          { name: '🏗️ Build', value: 'Website Generator · Brand DNA · Supplier Finder', inline: true },
          { name: '🚀 Launch', value: 'Meta Ads Pack · TikTok Builder · Email Sequences', inline: true },
          { name: '📈 Grow', value: 'Scaling Playbook · Copywriter · AI Chat', inline: true },
          { name: '🌍 Markets', value: 'AU · US · EU · UK · Asia · Global', inline: true },
        )
        .setFooter({ text: '20+ AI tools. One platform. Your unfair advantage.' }),
    ], [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel('Open Majorka').setStyle(ButtonStyle.Link).setURL('https://manus-majorka.vercel.app').setEmoji('🚀'),
        new ButtonBuilder().setCustomId('verify_guest').setLabel('Join as Guest').setStyle(ButtonStyle.Secondary).setEmoji('👀'),
      )
    ])
    console.log('  ✅ #welcome')
    await sleep(1000)
  }

  // ── 📜 RULES ──────────────────────────────────────────────────────────────
  const rulesCh = findChannel(guild, 'rules')
  if (rulesCh) {
    await clearAndPin(rulesCh, [
      new EmbedBuilder()
        .setColor(INDIGO)
        .setTitle('📜 Community Guidelines')
        .setDescription('*Keep this a high-signal, zero-noise community. We built it for serious operators.*')
        .addFields(
          { name: '01 ·  Respect everyone', value: 'No harassment, hate, or personal attacks. Treat others how you want to be treated.', inline: false },
          { name: '02 ·  Stay on topic', value: 'Ecommerce, dropshipping, building — keep it relevant. Off-topic → 💬┃general.', inline: false },
          { name: '03 ·  No spam or self-promo', value: 'No unsolicited links, competitor mentions, or affiliate spam. We see it immediately.', inline: false },
          { name: '04 ·  Share real value', value: 'Post wins, strategies, findings, and tips. Low-effort or vague posts get removed.', inline: false },
          { name: '05 ·  Builder+ is confidential', value: 'What\'s shared in 💎 Builder+ stays there. No screenshots, no sharing outside.', inline: false },
          { name: '06 ·  Use the right channel', value: 'Bugs → 🐛┃bug-reports · Help → 🆘┃help-desk · Wins → 🏆┃wins', inline: false },
          { name: '07 ·  English only', value: 'Global community — keep it English so everyone can participate.', inline: false },
        )
        .setFooter({ text: 'Violations: warning → mute → kick → ban  •  No appeals for hate speech' }),
    ])
    console.log('  ✅ #rules')
    await sleep(800)
  }

  // ── 🔑 GET ACCESS ─────────────────────────────────────────────────────────
  const getAccessCh = findChannel(guild, 'get-access')
  if (getAccessCh) {
    await clearAndPin(getAccessCh, [
      new EmbedBuilder()
        .setColor(GOLD)
        .setTitle('🔑 Unlock Your Access')
        .setDescription([
          'Verify your Majorka account to unlock the full server.',
          '',
          '**Run this command:**',
          '```',
          '/verify your@email.com',
          '```',
          'The bot checks your account and assigns your role instantly.',
          '',
        ].join('\n'))
        .addFields(
          {
            name: '━━━━━━━━━━━━━━━━━━━━━━━\n🎭 Roles & What They Unlock',
            value: [
              '👀 **Verified** (Guest) → Community: general, wins, ideas, questions, support',
              '✅ **Majorka Member** (Free/Paid) → + All Majorka AI channels',
              '🏗️ **Builder Member** ($49/mo) → + Builder+ private channels',
              '💎 **Scale Member** ($149/mo) → Full access + priority support',
              '⚡ **Majorka Team** → Admin access',
            ].join('\n'),
            inline: false
          },
          {
            name: '━━━━━━━━━━━━━━━━━━━━━━━\n💡 Not a member yet?',
            value: 'Click **Get Majorka Free** below — no credit card required.\nStart free and upgrade when you\'re ready.',
            inline: false
          },
        )
        .setFooter({ text: 'Having issues? Ping @Majorka Team in #help-desk' }),
    ], [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('verify_guest').setLabel('Join as Guest (Free)').setStyle(ButtonStyle.Secondary).setEmoji('👀'),
        new ButtonBuilder().setLabel('Get Majorka Free').setStyle(ButtonStyle.Link).setURL('https://manus-majorka.vercel.app').setEmoji('🚀'),
      )
    ])
    console.log('  ✅ #get-access')
    await sleep(800)
  }

  // ── 💬 GENERAL ────────────────────────────────────────────────────────────
  const generalCh = findChannel(guild, 'general')
  if (generalCh) {
    await clearAndPin(generalCh, [
      new EmbedBuilder()
        .setColor(DARK)
        .setTitle('💬 General')
        .setDescription([
          'The main hangout. Talk ecommerce, share thoughts, ask random questions.',
          '',
          '**Good topics for here:**',
          '- Ecommerce news and trends',
          '- General dropshipping chat',
          '- Tool recommendations (not just Majorka)',
          '- Random thoughts and discussions',
          '',
          '**Better channels for:**',
          '→ Wins → 🏆┃wins',
          '→ Product finds → 🔬┃product-research',
          '→ Help → 🆘┃help-desk',
        ].join('\n'))
        .setFooter({ text: 'Keep it chill, keep it relevant.' }),
    ])
    console.log('  ✅ #general')
    await sleep(600)
  }

  // ── 👋 INTRODUCTIONS ──────────────────────────────────────────────────────
  const introCh = findChannel(guild, 'introductions')
  if (introCh) {
    await clearAndPin(introCh, [
      new EmbedBuilder()
        .setColor(GREEN)
        .setTitle('👋 Introduce Yourself')
        .setDescription('New here? Tell the community who you are. Copy the template below:')
        .addFields({
          name: '📋 Introduction Template',
          value: [
            '```',
            '🌍 Market: [AU / US / UK / EU / Other]',
            '🛒 Niche: [What do you sell or plan to sell?]',
            '📊 Stage: [Just starting / First sales / Scaling]',
            '🎯 Goal: [What do you want to achieve in the next 90 days?]',
            '🔧 Using Majorka for: [Which tools are you most excited about?]',
            '```',
          ].join('\n'),
          inline: false
        })
        .setFooter({ text: 'The more specific you are, the more useful the community can be.' }),
    ])
    console.log('  ✅ #introductions')
    await sleep(600)
  }

  // ── 🏆 WINS ───────────────────────────────────────────────────────────────
  const winsCh = findChannel(guild, 'wins')
  if (winsCh) {
    await clearAndPin(winsCh, [
      new EmbedBuilder()
        .setColor(GOLD)
        .setTitle('🏆 Share Your Wins')
        .setDescription([
          'This channel is for celebrating. Big wins, small wins — all welcome.',
          '',
          '**Examples of what to share:**',
          '- Found a winning product with Majorka Product Discovery',
          '- First sale / First $1K / First $10K month',
          '- Built a store in a day with the Website Generator',
          '- Ad started converting — share the angle',
          '- Supplier found, margin locked in',
          '',
          '*No win is too small. Progress is progress.*',
        ].join('\n'))
        .setFooter({ text: 'Inspire someone. Share the win. 🏆' }),
    ])
    console.log('  ✅ #wins')
    await sleep(600)
  }

  // ── 🔬 PRODUCT RESEARCH ───────────────────────────────────────────────────
  const researchCh = findChannel(guild, 'product-research')
  if (researchCh) {
    await clearAndPin(researchCh, [
      new EmbedBuilder()
        .setColor(INDIGO)
        .setTitle('🔬 Product Research')
        .setDescription([
          'Share winning products you\'ve found using Majorka tools.',
          '',
          '**Format for sharing a product:**',
          '```',
          '📦 Product: [Name]',
          '💰 Price Range: [Cost / Sell price]',
          '📊 Margin: [Est. margin %]',
          '🌍 Market: [AU / US / UK / EU]',
          '🔥 Demand Signal: [Why you think it\'s winning]',
          '🛠️ Found with: [Which Majorka tool]',
          '```',
        ].join('\n'))
        .setFooter({ text: 'Majorka Member only channel. Use /verify to access.' }),
    ])
    console.log('  ✅ #product-research')
    await sleep(600)
  }

  // ── 🏪 STORES BUILT ───────────────────────────────────────────────────────
  const storesCh = findChannel(guild, 'stores-built')
  if (storesCh) {
    await clearAndPin(storesCh, [
      new EmbedBuilder()
        .setColor(GREEN)
        .setTitle('🏪 Stores Built with Majorka')
        .setDescription([
          'Show off stores you\'ve built using the Majorka Website Generator.',
          '',
          '**What to include:**',
          '- Screenshot of the store',
          '- Store URL (if live)',
          '- Niche + market',
          '- Time it took to build',
          '- Template used (if applicable)',
          '',
          '> **Tip:** The Website Generator produces Shopify Liquid files — deploy directly to Shopify.',
        ].join('\n'))
        .setFooter({ text: 'Built something great? Share it here. 🏪' }),
    ])
    console.log('  ✅ #stores-built')
    await sleep(600)
  }

  // ── 💎 VIP LOUNGE ─────────────────────────────────────────────────────────
  const vipCh = findChannel(guild, 'vip-lounge')
  if (vipCh) {
    await clearAndPin(vipCh, [
      new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle('💎 Builder+ Private Lounge')
        .setDescription([
          '**You\'re in the inner circle.**',
          '',
          'This section is for Builder ($49/mo) and Scale ($149/mo) members only.',
          '',
          '**What lives here:**',
          '💎 **VIP Lounge** → Open chat for Builder+ members. No basics.',
          '🧠 **Strategy** → High-level plays — brand building, scaling, acquisitions.',
          '📈 **Scaling** → $10K/mo and beyond — real numbers, real strategies.',
          '🤝 **Collab** → Find JV partners, media buyers, suppliers.',
          '🔒 **Private Wins** → Wins you\'d rather not post publicly.',
          '',
          '> *What\'s shared here stays here. No screenshots. No sharing outside.*',
        ].join('\n'))
        .setFooter({ text: 'Builder+ only. Upgrade at manus-majorka.vercel.app' }),
    ])
    console.log('  ✅ #vip-lounge')
    await sleep(600)
  }

  // ── 🆘 HELP DESK ──────────────────────────────────────────────────────────
  const helpCh = findChannel(guild, 'help-desk')
  if (helpCh) {
    await clearAndPin(helpCh, [
      new EmbedBuilder()
        .setColor(0xff6b35)
        .setTitle('🆘 Help Desk')
        .setDescription([
          'Stuck on something? Ask here. Tag **@Majorka Team** for urgent issues.',
          '',
          '**Before asking, check:**',
          '- 📚 In-app Knowledge Base at `/app/knowledge-base`',
          '- Previous messages in this channel',
          '',
          '**When asking for help, include:**',
          '- What you\'re trying to do',
          '- What you\'ve already tried',
          '- Any error messages (screenshot helps)',
          '- Which tool or page the issue is on',
          '',
          '**Response time:** Usually within a few hours during business hours AEST.',
        ].join('\n'))
        .setFooter({ text: 'For bugs: use 🐛┃bug-reports  •  For feature ideas: use 💭┃feature-requests' }),
    ])
    console.log('  ✅ #help-desk')
    await sleep(600)
  }

  // ── ⭐ STARBOARD ──────────────────────────────────────────────────────────
  const starCh = findChannel(guild, 'starboard')
  if (starCh) {
    await clearAndPin(starCh, [
      new EmbedBuilder()
        .setColor(GOLD)
        .setTitle('⭐ Starboard')
        .setDescription([
          'The best posts from across the server, automatically collected here.',
          '',
          '**How it works:**',
          'React with ⭐ to any message. When it hits **3 stars**, the bot reposts it here.',
          '',
          '*Only the best content makes it. Use ⭐ wisely.*',
        ].join('\n'))
        .setFooter({ text: 'React ⭐ on any message to nominate it.' }),
    ])
    console.log('  ✅ #starboard')
    await sleep(600)
  }

  // ── 🤖 MAJORKA UPDATES (admin) ────────────────────────────────────────────
  const updatesCh = findChannel(guild, '🔔┃majorka-updates')
  if (updatesCh) {
    await clearAndPin(updatesCh, [
      new EmbedBuilder()
        .setColor(GOLD)
        .setTitle('🤖 Majorka System — Admin Channel')
        .setDescription([
          'All automated posts from the Majorka system land here.',
          '',
          '**Auto-posted events:**',
          '🚀 Vercel deployments (success/fail)',
          '👥 New user signups + plan upgrades',
          '🤖 Claude Code agent completions',
          '❌ Application errors (Sentry)',
          '📊 Weekly analytics digest (Monday 9AM)',
          '',
          '**Slash commands (use in ⚡┃admin-commands):**',
          '`/stats` — live Majorka app stats',
          '`/deploy` — push to Vercel production',
          '`/build [task]` — run a Claude Code agent',
          '`/broadcast [message]` — post to #announcements',
          '`/verify [email]` — manually verify a member',
          '`/logs` — view recent server logs',
        ].join('\n'))
        .setFooter({ text: 'Admin only  •  Majorka#7641' })
        .setTimestamp(),
    ])
    console.log('  ✅ #majorka-updates (admin)')
    await sleep(600)
  }

  console.log('\n✨ All channel guides posted and pinned!\n')
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`)
  for (const guild of client.guilds.cache.values()) {
    await postAllGuides(guild)
  }
  process.exit(0)
})

client.login(TOKEN)

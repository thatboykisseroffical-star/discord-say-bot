// Main bot file: simplified to only require Send Messages permission and no placeholder messages.
// Adds three slash commands: /say, /uwuify, /furryaf.
// Behavior:
// - Always sends the transformed message directly to the channel (or DM) using channel.send()
// - Requires only Send Messages permission in guild channels; in DMs no permission required
// - Replies to the command user with an ephemeral acknowledgement
// - Keeps basic diagnostics for login and token verification

require('dotenv').config();
const { Client, GatewayIntentBits, Partials, PermissionsBitField, REST, Routes } = require('discord.js');

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('Missing DISCORD_TOKEN in environment.');
  process.exit(1);
}

// token verification (helpful diagnostic in logs)
const rest = new REST({ version: '10' }).setToken(token);
rest.get(Routes.user()).then(u => console.log(`Token verified for ${u.username} (${u.id})`)).catch(err => {
  console.error('Token verification failed:', err && err.message ? err.message : err);
  process.exit(1);
});

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  partials: [Partials.Message, Partials.Channel]
});

client.on('ready', () => console.log(`Logged in as ${client.user.tag}`));
client.on('clientReady', () => console.log(`clientReady event (compat) - ${client.user?.tag}`));
client.on('error', console.error);

// Simple text transforms
function uwuify(text) {
  // basic uwu transformation
  let s = text;
  // replace r/l with w
  s = s.replace(/[rl]/g, 'w').replace(/[RL]/g, 'W');
  // replace n't -> n'ty? skip
  // add faces and stuttering occasionally
  s = s.replace(/\!+/g, '! owo');
  // replace you -> u
  s = s.replace(/\byou\b/gi, 'u');
  // add kawaii faces randomly after sentences (deterministic simple rule)
  s = s.replace(/\.\s*|\?\s*|!\s*|\n/g, match => match + ' ');
  // small chance of stutter at start of words
  s = s.split(' ').map(word => {
    if (word.length > 2 && Math.random() < 0.18) {
      return word[0] + '-' + word;
    }
    return word;
  }).join(' ');
  // append an uwu face if none
  if (!/uwu|owo|rawr/i.test(s)) s = s + ' uwu';
  return s;
}

function furryify(text) {
  // simple "furry" transformation: add ~ sounds, replace o with owo for cute affect
  let s = text;
  s = s.replace(/\byou\b/gi, 'u');
  s = s.replace(/o/g, 'owo').replace(/O/g, 'OwO');
  s = s.replace(/!+/g, '! *paws*');
  // add playful suffixes and emojis
  s = s.replace(/\.$/, ' :3');
  // insert some animal-themed words randomly (deterministic approach: based on word length)
  s = s.split(' ').map(w => {
    if (w.length >= 6) return w + ' *purr*';
    return w;
  }).join(' ');
  // add a signature
  if (!/\*/.test(s)) s = s + ' \n~ fursona~';
  return s;
}

// Handle interactions
client.on('interactionCreate', async (interaction) => {
  try {
    if (!interaction.isChatInputCommand()) return;

    const cmd = interaction.commandName;
    const text = interaction.options.getString('message', true);

    // Defer ephemeral so user gets quick feedback
    await interaction.deferReply({ ephemeral: true });

    const channel = interaction.channel;
    if (!channel || !channel.isTextBased()) {
      await interaction.editReply('I cannot send messages in this channel.');
      return;
    }

    const isDm = !interaction.guild;

    // In guilds require only SendMessages permission
    if (!isDm) {
      const me = interaction.guild?.members?.me;
      if (me && !me.permissionsIn(channel).has(PermissionsBitField.Flags.SendMessages)) {
        await interaction.editReply('I need permission to send messages in that channel (Send Messages).');
        return;
      }
    }

    let out = text;
    if (cmd === 'say') {
      out = text; // no placeholder, direct send
    } else if (cmd === 'uwuify') {
      out = uwuify(text);
    } else if (cmd === 'furryaf') {
      out = furryify(text);
    }

    // Send directly. This will show the bot as the author (can't avoid that without webhooks or external permissions)
    await channel.send(out);

    await interaction.editReply({ content: 'Message sent.' });
  } catch (err) {
    console.error('Interaction error:', err);
    try { await interaction.editReply('Failed to process command.'); } catch (e) { /* ignore */ }
  }
});

client.login(token).catch(err => {
  console.error('Login failed:', err && err.message ? err.message : err);
  process.exit(1);
});

// index.js
// Auto-registers commands on startup if AUTO_REGISTER=true (global when GUILD_ID is omitted).
// Simplified message sends and an improved smart uwuify transformation.
require('dotenv').config();
const { Client, GatewayIntentBits, Partials, PermissionsBitField, REST, Routes, SlashCommandBuilder } = require('discord.js');

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID; // optional
const autoRegister = (process.env.AUTO_REGISTER || '').toLowerCase() === 'true';

if (!token || !clientId) {
  console.error('DISCORD_TOKEN and CLIENT_ID are required in environment.');
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(token);

const commandsSchema = [
  new SlashCommandBuilder().setName('say').setDescription('Send a message (direct send, no placeholder)').addStringOption(opt => opt.setName('message').setDescription('Text to send').setRequired(true)),
  new SlashCommandBuilder().setName('uwuify').setDescription('Transform your message into uwu-speak (smart).').addStringOption(opt => opt.setName('message').setDescription('Text to transform').setRequired(true)),
  new SlashCommandBuilder().setName('furryaf').setDescription('Furry-ify your message (playful).').addStringOption(opt => opt.setName('message').setDescription('Text to transform').setRequired(true)),
].map(c => c.toJSON());

async function registerCommands() {
  try {
    if (guildId) {
      console.log(`Registering ${commandsSchema.length} commands to guild ${guildId}...`);
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commandsSchema });
      console.log('Registered commands to guild.');
    } else {
      console.log(`Registering ${commandsSchema.length} commands globally (may take up to 1 hour)...`);
      await rest.put(Routes.applicationCommands(clientId), { body: commandsSchema });
      console.log('Registered commands globally.');
    }
  } catch (err) {
    console.error('Error registering commands:', err);
  }
}

if (autoRegister) {
  // run registration but don't block startup for too long
  registerCommands().catch(err => console.error('Auto-register failed:', err));
}

// --- Smart uwuify implementation ---
function hashString(s) {
  // simple deterministic hash for pseudo-random choices
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i), h |= 0;
  return Math.abs(h);
}

function replaceCasePreserving(orig, repl) {
  // preserve capitalization pattern of orig in repl where possible
  if (orig.toUpperCase() === orig) return repl.toUpperCase();
  if (orig[0] === orig[0].toUpperCase()) return repl[0].toUpperCase() + repl.slice(1);
  return repl;
}

function uwuifySmart(text) {
  if (!text) return text;
  // basic tokenization keeping punctuation
  const tokens = text.split(/(\s+|[^\w\s]+)/g).filter(t => t !== undefined && t !== null);
  const out = tokens.map(tok => {
    // whitespace or punctuation passthrough
    if (/^\s+$/.test(tok) || /^[^\w\s]+$/.test(tok)) return tok;

    const raw = tok;
    const lower = raw.toLowerCase();

    // exact-word mappings for especially "cute" outputs
    const special = {
      'so': 's-so',
      'cool': 'cwute',
      'cute': 'cwute',
      'you': 'u',
      'lol': 'lulz',
      'lmao': 'lulz',
      'omg': 'omg',
      'love': 'wuv',
    };

    if (special[lower]) {
      // add special tails for some tokens
      if (lower === 'lol') return replaceCasePreserving(raw, special[lower] + '!~ 0w0');
      return replaceCasePreserving(raw, special[lower]);
    }

    // run character-level transforms
    let s = raw.split('').map(ch => {
      if (ch === 'r' || ch === 'l') return 'w';
      if (ch === 'R' || ch === 'L') return 'W';
      return ch;
    }).join('');

    // replace sequences: oo -> u (makes cool -> cwut -> cwute later)
    s = s.replace(/oo/gi, match => {
      return match[0] === match[0].toUpperCase() ? 'Uw' : 'uw';
    });

    // convert trailing period to a cute suffix instead later (handled outside)

    // deterministic stutter for short words
    const clean = s.replace(/[^a-zA-Z]/g, '');
    if (clean.length <= 3 && clean.length > 0) {
      const h = hashString(clean + text.length);
      if (h % 2 === 0 && !/^a$/i.test(clean)) {
        s = s[0] + '-' + s;
      }
    }

    // sometimes append small faces for longer words deterministically
    const h2 = hashString(s);
    if (h2 % 7 === 0 && !/0w0|owo|uwu|lulz/i.test(s)) {
      s = s + ' owo';
    }

    // subtle vowel changes to make "cute" feel
    s = s.replace(/ness\b/gi, 'ness~');

    return s;
  });

  // Reassemble and do sentence-level tweaks
  let result = out.join('');

  // If the final string doesn't contain an emoticon, add one based on punctuation
  if (!/(uwu|owo|0w0|lulz|uwu!|owo!)/i.test(result)) {
    // add an emoticon after exclamation or at end
    result = result.replace(/([!]+)\s*$/,'$1~ owo');
    if (!/[!?.~]/.test(result.slice(-1))) result = result + ' ~ 0w0';
  }

  // small final polish: make double spaces single
  result = result.replace(/\s{2,}/g, ' ');
  return result;
}

function furryify(text) {
  if (!text) return text;
  let s = text;
  s = s.replace(/you/gi, 'u');
  s = s.replace(/o/g, 'owo').replace(/O/g, 'OwO');
  s = s.replace(/!+/g, '! *paws*');
  s = s.replace(/\.$/, ' :3');
  s = s.split(' ').map(w => (w.length >= 6 ? w + ' *purr*' : w)).join(' ');
  if (!/\*/.test(s)) s = s + '\n~ fursona~';
  return s;
}

// --- Bot setup ---
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  partials: [Partials.Message, Partials.Channel]
});

client.once('ready', () => console.log(`Logged in as ${client.user.tag}`));
client.on('clientReady', () => console.log('clientReady (compat)')); 
client.on('error', console.error);

client.on('interactionCreate', async (interaction) => {
  try {
    if (!interaction.isChatInputCommand()) return;
    const cmd = interaction.commandName;
    const text = interaction.options.getString('message', true);

    await interaction.deferReply({ ephemeral: true });

    const channel = interaction.channel;
    if (!channel || !channel.isTextBased()) {
      await interaction.editReply('I cannot send messages in this channel.');
      return;
    }

    const isDm = !interaction.guild;
    if (!isDm) {
      const me = interaction.guild?.members?.me;
      if (me && !me.permissionsIn(channel).has(PermissionsBitField.Flags.SendMessages)) {
        await interaction.editReply('I need permission to send messages in that channel (Send Messages).');
        return;
      }
    }

    let out = text;
    if (cmd === 'say') out = text;
    else if (cmd === 'uwuify') out = uwuifySmart(text);
    else if (cmd === 'furryaf') out = furryify(text);

    await channel.send(out);
    await interaction.editReply({ content: 'Message sent.' });
  } catch (err) {
    console.error('Interaction error:', err);
    try { await interaction.editReply('Failed to process command.'); } catch (e) { /* ignore */ }
  }
});

client.login(token).catch(err => { console.error('Login failed:', err && err.message ? err.message : err); process.exit(1); });

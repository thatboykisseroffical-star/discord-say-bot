// Main bot file with diagnostics to help debug WebSocket connection failures.
// Adds token verification and shard/gateway event logging.
require('dotenv').config();
const { Client, GatewayIntentBits, Partials, PermissionsBitField, REST, Routes } = require('discord.js');

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('Missing DISCORD_TOKEN in environment.');
  process.exit(1);
}

// Verify token before attempting to login (helps surface 401 early)
const rest = new REST({ version: '10' }).setToken(token);
rest.get(Routes.user())
  .then(u => console.log(`Token verified for ${u.username} (${u.id})`))
  .catch(err => {
    console.error('Token verification failed:', err && err.message ? err.message : err);
    process.exit(1);
  });

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

let readyHandled = false;
const handleReady = () => {
  if (readyHandled) return;
  readyHandled = true;
  console.log(`Logged in as ${client.user.tag}`);
};
client.on('ready', handleReady);
client.on('clientReady', handleReady);

// Shard / gateway diagnostics
client.on('shardError', (error) => console.error('Shard error:', error));
client.on('shardDisconnect', (closeEvent, shardId) => console.warn('Shard disconnected:', { shardId, closeEvent }));
client.on('shardReconnecting', (shardId) => console.log('Shard reconnecting:', shardId));
client.on('rateLimit', (info) => console.warn('Rate limit:', info));
client.on('debug', (msg) => console.debug('DEBUG:', msg));

// WebSocket errors (best-effort)
try {
  if (client.ws) {
    client.ws.on('error', err => console.error('WebSocket error:', err));
    client.ws.on('close', (code, reason) => console.warn('WebSocket closed:', { code, reason }));
    client.ws.on('open', () => console.log('WebSocket opened'));
  }
} catch (e) {
  console.warn('Failed to attach ws listeners:', e && e.message ? e.message : e);
}

client.on('interactionCreate', async (interaction) => {
  try {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName !== 'say') return;

    const text = interaction.options.getString('message', true);

    // Defer reply so the command doesn't time out; keep this ephemeral for privacy.
    await interaction.deferReply({ ephemeral: true });

    const channel = interaction.channel;
    if (!channel || !channel.isTextBased()) {
      await interaction.editReply('I cannot send messages in this channel.');
      return;
    }

    // In DMs, interaction.guild is null and permissions are not applicable.
    const isDm = !interaction.guild;

    // Check Send Messages permission in guild channels
    if (!isDm) {
      const me = interaction.guild?.members?.me;
      if (me && !me.permissionsIn(channel).has(PermissionsBitField.Flags.SendMessages)) {
        await interaction.editReply('I do not have permission to send messages in that channel.');
        return;
      }
    }

    // If bot has ManageMessages we can use the placeholder trick (reply to a placeholder then delete it)
    const canManage = !isDm && interaction.guild?.members?.me?.permissionsIn(channel).has(PermissionsBitField.Flags.ManageMessages);

    try {
      if (canManage) {
        // Placeholder + reply + delete (original behavior when Manage Messages is available)
        const placeholder = await channel.send('.');
        await placeholder.reply({ content: text });
        // best-effort delete; don't fail the command if delete is not possible
        try { await placeholder.delete(); } catch (delErr) { console.warn('Failed to delete placeholder:', delErr && delErr.message ? delErr.message : delErr); }
      } else {
        // Fallback: send the message directly (works in DMs and channels where bot can send)
        await channel.send(text);
      }

      await interaction.editReply({ content: 'Message sent.' });
    } catch (err) {
      console.error('Error sending message in /say command:', err);
      // Provide a helpful error to the user (without leaking internals)
      await interaction.editReply('Failed to send message. I might be missing permissions in that channel.');
    }
  } catch (outerErr) {
    console.error('Unexpected error handling interaction:', outerErr);
    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply('An unexpected error occurred.');
      }
    } catch (e) { /* ignore */ }
  }
});

client.on('error', (err) => console.error('Client error:', err));

client.login(token).catch(err => {
  console.error('Login failed:', err && err.message ? err.message : err);
  process.exit(1);
});

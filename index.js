// Main bot file
// Sends messages with minimal permissions. If the bot has Manage Messages, it will use the placeholder reply+delete trick.
// Otherwise it will just send the message directly (only requires Send Messages) and work in DMs and guilds.
require('dotenv').config();
const { Client, GatewayIntentBits, Partials, PermissionsBitField } = require('discord.js');

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('Missing DISCORD_TOKEN in environment.');
  process.exit(1);
}

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
        await placeholder.delete();
      } else {
        // Fallback: simply send the user's message directly. This only requires Send Messages permission and works in DMs and guilds.
        await channel.send(text);
      }

      await interaction.editReply({ content: 'Message sent.' });
    } catch (err) {
      console.error('Error sending message in /say command:', err);
      await interaction.editReply('Failed to send message. I might be missing permissions in that channel.');
    }
  } catch (outerErr) {
    console.error('Unexpected error handling interaction:', outerErr);
    try { if (interaction.deferred || interaction.replied) await interaction.editReply('An unexpected error occurred.'); } catch (e) { /* ignore */ }
  }
});

client.on('error', console.error);

client.login(token);

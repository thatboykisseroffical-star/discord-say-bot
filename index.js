// Main bot file
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

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'say') {
    const text = interaction.options.getString('message', true);

    // Defer reply so the command doesn't time out; keep this ephemeral for privacy.
    await interaction.deferReply({ ephemeral: true });

    const channel = interaction.channel;
    if (!channel || !channel.isTextBased()) {
      await interaction.editReply('I cannot send messages in this channel.');
      return;
    }

    // Permission checks
    const me = interaction.guild?.members?.me;
    if (me) {
      const missing = [];
      if (!me.permissionsIn(channel).has(PermissionsBitField.Flags.SendMessages)) missing.push('Send Messages');
      if (!me.permissionsIn(channel).has(PermissionsBitField.Flags.ManageMessages)) missing.push('Manage Messages (required to delete placeholder)');
      if (missing.length) {
        await interaction.editReply(`I need these permissions in this channel: ${missing.join(', ')}`);
        return;
      }
    }

    try {
      // 1) Send placeholder
      const placeholder = await channel.send('.');

      // 2) Reply to placeholder with the user's message
      // Use message.reply to create a reply reference
      await placeholder.reply({ content: text });

      // 3) Delete the placeholder message - the reply will remain visible
      await placeholder.delete();

      await interaction.editReply({ content: 'Message sent.' });
    } catch (err) {
      console.error('Error in /say command:', err);
      await interaction.editReply('Failed to send message. Ensure I have permission to send and delete messages.');
    }
  }
});

client.on('error', console.error);

client.login(token);

// Register the commands: /say, /uwuify, /furryaf
// If GUILD_ID is present the commands are registered to that guild (instant). Otherwise they register globally (may take ~1 hour).
require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID; // optional

if (!token || !clientId) {
  console.error('Missing DISCORD_TOKEN or CLIENT_ID in environment.');
  process.exit(1);
}

const sayCommand = new SlashCommandBuilder()
  .setName('say')
  .setDescription('Send a message (no placeholder).')
  .addStringOption(opt => opt.setName('message').setDescription('Text to send').setRequired(true));

const uwuCommand = new SlashCommandBuilder()
  .setName('uwuify')
  .setDescription('Transform your message into uwu-speak.')
  .addStringOption(opt => opt.setName('message').setDescription('Text to transform').setRequired(true));

const furryCommand = new SlashCommandBuilder()
  .setName('furryaf')
  .setDescription('Furry-ify your message (playful).')
  .addStringOption(opt => opt.setName('message').setDescription('Text to transform').setRequired(true));

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    const body = [sayCommand.toJSON(), uwuCommand.toJSON(), furryCommand.toJSON()];
    if (guildId) {
      console.log(`Registering commands to guild ${guildId}...`);
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body });
      console.log('Registered commands to guild.');
    } else {
      console.log('Registering commands globally (may take up to 1 hour)...');
      await rest.put(Routes.applicationCommands(clientId), { body });
      console.log('Registered commands globally.');
    }
  } catch (error) {
    console.error('Error registering commands:', error);
    process.exit(1);
  }
})();

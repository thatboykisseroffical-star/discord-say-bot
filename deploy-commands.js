// Register the /say command. If GUILD_ID is provided the command will be registered to that guild (instant).
// If GUILD_ID is not provided the command will be registered globally (available in all guilds, may take up to 1 hour).
// Usage:
//   - For a single guild (fast): set DISCORD_TOKEN, CLIENT_ID, GUILD_ID and run: node deploy-commands.js
//   - For global registration: set DISCORD_TOKEN and CLIENT_ID (omit GUILD_ID) and run: node deploy-commands.js

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
  .setDescription('Send a message silently by using a temporary placeholder.')
  .addStringOption(option =>
    option.setName('message')
      .setDescription('What to say')
      .setRequired(true)
  )
  .toJSON();

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    if (guildId) {
      console.log(`Registering /say command to guild ${guildId}...`);
      await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: [sayCommand] },
      );
      console.log('Registered /say command to guild.');
    } else {
      console.log('Registering /say command globally (may take up to 1 hour to appear)...');
      await rest.put(
        Routes.applicationCommands(clientId),
        { body: [sayCommand] },
      );
      console.log('Registered /say command globally.');
    }
  } catch (error) {
    console.error('Error registering commands:', error);
    process.exit(1);
  }
})();

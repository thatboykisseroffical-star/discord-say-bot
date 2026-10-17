// Run this once to register the /say command in a guild for testing.
// Usage: set DISCORD_TOKEN, CLIENT_ID, GUILD_ID in environment (or .env) and run:
//   node deploy-commands.js

require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId || !guildId) {
  console.error('Missing DISCORD_TOKEN, CLIENT_ID, or GUILD_ID in environment.');
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
    console.log(`Registering /say command to guild ${guildId}...`);
    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: [sayCommand] },
    );
    console.log('Registered /say command.');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
})();

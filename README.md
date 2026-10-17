# Discord "say" bot

This bot provides a /say command that sends a placeholder message ("."), replies to that placeholder with your message, then deletes the placeholder — making the posted message appear "silent".

Quick overview:
- Node 18+ recommended
- Uses discord.js v14
- Deploy with Railway (connect your GitHub repo to Railway and set environment variables)

Environment variables (set these in Railway / GitHub Secrets / .env locally):
- DISCORD_TOKEN — the bot token
- CLIENT_ID — the Application (client) ID
- GUILD_ID — the development Guild ID (for registering the command during testing)

Files:
- index.js — bot runtime
- deploy-commands.js — register the /say command (guild during development)
- package.json — dependencies & start script
- .gitignore

Usage:
1. Create a Discord Application and Bot on the Discord Developer Portal.
2. Copy CLIENT_ID and DISCORD_TOKEN.
3. Invite the bot to a server with scopes `applications.commands` and `bot` and appropriate permissions (Send Messages, Manage Messages).
   Example invite URL:
   https://discord.com/oauth2/authorize?client_id=<CLIENT_ID>&permissions=268435456&scope=bot%20applications.commands
   (Permission integer above includes Send Messages and Manage Messages — adjust if needed.)
4. Push this repo to GitHub.
5. Connect the GitHub repo to Railway and set environment variables: DISCORD_TOKEN, CLIENT_ID, GUILD_ID.
6. In a dev guild, run `node deploy-commands.js` once (or run from Railway temporarily) to register /say, or modify for global registration.
7. Deploy on Railway with start command: `node index.js`.

Notes:
- The bot needs the Manage Messages permission to delete the placeholder.
- For production/global commands, change registration in deploy-commands.js from guild to global.

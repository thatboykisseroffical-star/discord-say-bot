# Discord "say" bot

This bot provides a /say command that sends a placeholder message ("."), replies to that placeholder with your message, then deletes the placeholder — making the posted message appear "silent".

Quick overview:
- Node 18+ recommended
- Uses discord.js v14
- Deploy with Railway (connect your GitHub repo to Railway and set environment variables)

Environment variables (set these in Railway / GitHub Secrets / .env locally):
- DISCORD_TOKEN — the bot token
- CLIENT_ID — the Application (client) ID
- GUILD_ID — optional. If provided the /say command will be registered to that guild immediately. If omitted the command will be registered globally (available in all servers) but global registration can take up to an hour to propagate.

Files:
- index.js — bot runtime
- deploy-commands.js — register the /say command (guild during development or global if GUILD_ID omitted)
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
5. Connect the GitHub repo to Railway and set environment variables: DISCORD_TOKEN, CLIENT_ID, and optionally GUILD_ID.
6. Register the slash command:
   - For development (fast): set GUILD_ID and run `npm run register-commands`.
   - For global availability: set DISCORD_TOKEN and CLIENT_ID (omit GUILD_ID) and run `npm run register-commands`. Note: global commands can take up to an hour to appear in servers.
7. Deploy on Railway with start command: `node index.js`.

Notes:
- The bot needs the Manage Messages permission to delete the placeholder.
- For production/global commands, omit GUILD_ID when running deploy-commands.js. Global registration may take up to an hour to propagate.

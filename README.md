# Discord "say" bot

This bot provides a few slash commands that send messages directly with minimal permissions.

Commands:
- /say message: Sends the provided message directly to the channel (no placeholder).
- /uwuify message: Transforms text into a playful "uwu" style and sends it.
- /furryaf message: Applies a playful "furry"-style transform and sends it.

Design goals:
- Only needs Send Messages permission in guild channels. In DMs no permissions needed.
- No placeholder + delete behavior by default, so Manage Messages is not required.

Deployment notes:
- Environment variables (Railway or local .env):
  - DISCORD_TOKEN (required)
  - CLIENT_ID (required for registering commands)
  - GUILD_ID (optional; set for quick guild registration, omit for global)

Register commands (local or Railway console):
- npm install
- npm run register-commands

Start the bot:
- npm start

Invite URL example:
https://discord.com/oauth2/authorize?client_id=<CLIENT_ID>&permissions=2048&scope=bot%20applications.commands

Notes:
- Permission integer 2048 is Send Messages only. If you want Manage Messages previously used, it is not required anymore.
- Global command registration may take up to one hour to appear in servers. For immediate testing, set GUILD_ID and register to a dev server.

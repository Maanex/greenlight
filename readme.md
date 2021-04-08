# Greenlight

More info soon

## Run the bot

Rename and modify your config.template.js to config.js

Configure your top.gg endpoint to `server:port/api/webhooks/topgg`

Run `node scripts/register-commands.js` to register the slash commands

To start for development use `yarn dev`

To start for production use `yarn install && yarn build` then `yarn start`

## Database

Create a collection `greenlight._projects` in your mongodb cluster.

Insert one object for each "project" with the following structure

```json
{
    "_id": "name_in_base64",
    "admins": ["137258778092503042"],
    "display": {
        "token_icon_one": "<:token:793061680506077226>",
        "token_icon_multiple": "<:tokens:793172861673275473>",
        "token_name_zero": "Tokens",
        "token_name_one": "Token",
        "token_name_multiple": "Tokens"
    },
    "texts": {
        "info": "In order to see which updates you would like to see most, we're introducing tokens! Spend your tokens on suggestions and ideas above, once the required amount of tokens is matched, we'll start turning that suggestion into reality! Please notice that this is a team effort, you don't have to collect all the required tokens yourself!\nTo check your current balance, run `/tokens` in any text channel",
        "get_tokens": "• [Upvote the bot on top.gg](LINK_HERE) to get 1 token\n• [Donate](DONATE_URL) over [Patreon](LINK_HERE) or [Ko-Fi](LINK_HERE), 1€ = 10 Tokens",
        "store_info": "Unlike the other goals above, the store is a place to spend your tokens selfishly! Take a look below to see what you can buy:"
    },
    "integrations": {
        "topgg": {
            "bots": [{
                "id": "672822334641537041",
                "auth": "aaaaa",
                "reward": 1
            }],
            "announce": {
                "location": "342620626592464897/694580263648231545", // guildid/channelid OR dms
                "text": "Yooo {user} voted on top.gg! Here's one token for you! *smoch\\*"
            }
        }
    },
    "discord_guild_id": {
        "$numberLong": "342620626592464897"
    },
    "goal_complete_webhook": "https://canary.discord.com/api/webhooks/81123123123",
    "store": {
        "products": [{
            "name": "test",
            "emoji": "🍺",
            "price": 20,
            "description": "Bla bla",
            "type": "role",
            "id": "487358755764305930"
        }],
        "message_id": "819346955435769876",
        "channel_id": "803010833117872158"
    },
    "item_purchase_webhook": "https://canary.discord.com/api/webhooks/8184435123"
}
```

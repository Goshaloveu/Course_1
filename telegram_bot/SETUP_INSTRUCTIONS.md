# Telegram Bot Setup Instructions

We have successfully created a Telegram bot integration for our competition platform. Here's what we've accomplished:

1. Created a Telegram bot module with:
   - Authentication functionality
   - Token generation and verification
   - API endpoints for the backend to verify authentication

2. Updated the backend with:
   - New endpoint for Telegram bot authentication
   - Integration with existing user system

3. Updated the frontend with:
   - New Telegram Bot authentication button
   - Login form for entering authentication codes

## How to Complete the Setup

1. **Create a real Telegram bot**:
   - Go to [@BotFather](https://t.me/botfather) on Telegram
   - Send the `/newbot` command and follow the instructions
   - Get your bot token
   - Configure commands for your bot with `/setcommands`:
     ```
     start - Start the bot
     auth - Get authentication code
     help - Show help information
     ```

2. **Configure environment variables**:
   - Create a `.env` file in the `telegram_bot` directory based on `env.example`
   - Set your real bot token in the `BOT_TOKEN` variable
   - Generate a secure random string for `API_BOT_KEY` to be used for API access
   - Set the correct URLs for your frontend and backend

3. **Update backend settings**:
   - Set the same `API_BOT_KEY` value in your backend's `.env` file
   - Make sure the backend URL matches what's in the Telegram bot config

4. **Update frontend settings**:
   - Add your bot's username to the frontend environment variables
   - Set `VITE_TELEGRAM_BOT_USERNAME` in the frontend `.env` file

5. **Run the bot**:
   ```bash
   python -m telegram_bot.run
   ```

## Testing the Integration

1. Start your backend server and frontend development server
2. Start the Telegram bot using the instructions above
3. Open your application and go to the login page
4. Try the Telegram bot login option
5. Follow the authentication flow in Telegram
6. You should be able to log in successfully

## Troubleshooting

If you encounter issues:

1. **Check logs**: The bot has detailed logs that can help identify issues
2. **Verify API connectivity**: Make sure your backend can reach the bot's API
3. **Token issues**: Make sure environment variables are set correctly
4. **Network problems**: Ensure ports are open and services can communicate

## Security Considerations

1. **Keep your bot token secure**
2. **Use HTTPS in production**
3. **Regularly rotate your API keys**
4. **Monitor for unusual authentication patterns** 
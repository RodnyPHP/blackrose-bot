// server.js - FINAL VERSION FOR RENDER
const express = require('express');
const { Telegraf } = require('telegraf');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Configuration
const SITE_URL = "https://rodny.free.nf";
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

// 1. Health Check Route (Required for Render)
app.get('/', (req, res) => {
  res.send('BLACK ROSE BOT IS RUNNING! 🖤');
});

// 2. Webhook from Site
app.post('/webhook', async (req, res) => {
  const payload = req.body;
  let msg = `🖤 **BLACK ROSE ALERT**\n\n`;
  if (payload.event === 'post_published') {
    msg += `📢 **New Post!**\nTitle: ${payload.title}\nID: ${payload.id}`;
  } else {
    msg += `🔔 Update: ${JSON.stringify(payload)}`;
  }
  try {
    await bot.telegram.sendMessage(process.env.ADMIN_ID, msg, { parse_mode: 'Markdown' });
    res.send('OK');
  } catch (e) {
    console.error(e);
    res.status(500).send('Error');
  }
});

// 3. Mini-App Route
app.get('/miniapp', (req, res) => {
  const html = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="background:#0f0f12;color:white;text-align:center;padding:20px;font-family:sans-serif"><h1 style="color:#6d4aff">🖤 Black Rose</h1><div id="s">Loading...</div><script src="https://telegram.org/js/telegram-web-app.js"></script><script>Telegram.WebApp.expand();fetch('/api/stats.php').then(r=>r.json()).then(d=>{document.getElementById('s').innerHTML='Views: '+d.views+'<br>Users: '+d.users}).catch(()=>document.getElementById('s').innerText='Offline')</script></body></html>`;
  res.send(html);
});

// 4. Start Web Server FIRST (Critical for Render)
app.listen(PORT, () => {
  console.log(`✅ Web server listening on port ${PORT}`);
});

// 5. Then Launch Bot
bot.launch()
  .then(() => {
    console.log('✅ Bot launched successfully!');
  })
  .catch(err => {
    console.error('❌ Bot launch error:', err);
    process.exit(1);
  });

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
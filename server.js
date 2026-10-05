// server.js - BLACK ROSE ALERT BOT (Final Fixed Version)
const express = require('express');
const { Telegraf } = require('telegraf');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Configuration
const SITE_URL = "https://rodny.free.nf";
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

// 1. Health Check Route (Required for Render to stay alive)
app.get('/', (req, res) => {
  res.send('BLACK ROSE BOT IS RUNNING! 🖤');
});

// 2. Webhook Endpoint (Telegram sends updates here)
app.post('/telegram', (req, res) => {
  bot.handleUpdate(req.body, res);
});

// 3. Handle /stats Command
bot.command('stats', async (ctx) => {
  try {
    // Fetch from your site with a longer timeout for free hosts
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout
    
    const res = await fetch(`${SITE_URL}/api/stats.php`, { signal: controller.signal });
    clearTimeout(timeout);
    
    if (!res.ok) throw new Error('HTTP error');
    
    const data = await res.json();
    const txt = `📊 **Live Stats**\n\nViews: ${data.views}\nUsers: ${data.users}\nPosts: ${data.posts}`;
    await ctx.reply(txt);
  } catch (e) {
    console.error("Stats error:", e);
    await ctx.reply("❌ Site offline or timeout.");
  }
});

// 4. Handle /start Command
bot.command('start', async (ctx) => {
  await ctx.reply("🖤 Welcome to BLACK ROSE Alert!\nUse /stats for analytics.\nVisit: https://rodny.free.nf");
});

// 5. Handle Approval Buttons
bot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery.data;
  if (data.startsWith('approve:')) {
    const id = data.split(':')[1];
    try {
      await fetch(`${SITE_URL}/api/approve.php?id=${id}`);
      await ctx.answerCbQuery();
      await ctx.editMessageText(`✅ Post ${id} Approved!`);
    } catch (e) {
      await ctx.answerCbQuery();
      await ctx.editMessageText(`❌ Failed to approve ${id}.`);
    }
  }
});

// 6. Mini-App Dashboard
app.get('/miniapp', (req, res) => {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Black Rose</title>
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
  <style>
    body { background: #0f0f12; color: white; font-family: sans-serif; text-align: center; padding: 20px; }
    h1 { color: #6d4aff; }
    .card { background: #1e1e24; padding: 15px; border-radius: 10px; margin: 10px 0; }
    .val { font-size: 24px; font-weight: bold; color: #6d4aff; }
  </style>
</head>
<body>
  <h1>🖤 Black Rose CMS</h1>
  <div class="card"><h3>Views</h3><div id="v" class="val">Loading...</div></div>
  <div class="card"><h3>Users</h3><div id="u" class="val">Loading...</div></div>
  <button onclick="window.Telegram.WebApp.close()" style="background:#6d4aff;color:white;border:none;padding:10px 20px;border-radius:5px;">Close</button>
  <script>
    window.Telegram.WebApp.expand();
    fetch('/api/stats.php').then(r=>r.json()).then(d=>{
      document.getElementById('v').innerText = d.views;
      document.getElementById('u').innerText = d.users;
    }).catch(()=>{
      document.getElementById('v').innerText = 'Offline';
      document.getElementById('u').innerText = 'Offline';
    });
  </script>
</body>
</html>`;
  res.send(html);
});

// 7. Start Web Server
app.listen(PORT, () => {
  console.log(`✅ Web server listening on port ${PORT}`);
});

// 8. Set Webhook (Fixed URL Logic)
const WEBHOOK_PATH = '/telegram';

// Safely construct the domain
let domain = process.env.RENDER_EXTERNAL_URL || 'blackrose-bot-190j.onrender.com';

// Ensure it starts with https://
if (!domain.startsWith('http')) {
  domain = `https://${domain}`;
}

const FULL_WEBHOOK_URL = `${domain}${WEBHOOK_PATH}`;

console.log(`Setting webhook to: ${FULL_WEBHOOK_URL}`);

bot.telegram.setWebhook(FULL_WEBHOOK_URL)
  .then(() => {
    console.log(`✅ Webhook successfully set to: ${FULL_WEBHOOK_URL}`);
    console.log('✅ Bot is ready! Send /start in Telegram.');
  })
  .catch(err => {
    console.error('❌ Failed to set webhook:', err);
  });

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
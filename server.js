// server.js - BLACK ROSE ALERT BOT FOR RENDER
const express = require('express');
const { Telegraf } = require('telegraf');
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Bot
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
app.use(express.json());

// Your Website URL
const SITE_URL = "https://rodny.free.nf";

// 1. Handle Webhooks from your site (POST /webhook)
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

// 2. Handle Telegram Commands (/stats, /start)
bot.command('stats', async (ctx) => {
  try {
    // Try fetching 3 times with delays
    let data;
    for (let i = 0; i < 3; i++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout
        const res = await fetch(`${SITE_URL}/api/stats.php`, { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
          data = await res.json();
          break;
        }
      } catch (e) {
        if (i === 2) throw e; // Last attempt failed
        await new Promise(r => setTimeout(r, 2000)); // Wait 2s before retry
      }
    }
    
    const txt = `📊 **Stats**\nViews: ${data.views}\nUsers: ${data.users}\nPosts: ${data.posts}`;
    await ctx.reply(txt);
  } catch (e) {
    console.error("Stats fetch error:", e);
    await ctx.reply("❌ Site offline (Timeout or Error)");
  }
});

bot.command('start', async (ctx) => {
  await ctx.reply("🖤 Welcome to BLACK ROSE Alert!\nUse /stats for analytics.");
});

// Handle Inline Buttons (Approve)
bot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery.data;
  if (data.startsWith('approve:')) {
    const id = data.split(':')[1];
    await fetch(`${SITE_URL}/api/approve.php?id=${id}`);
    await ctx.answerCbQuery();
    await ctx.editMessageText(`✅ Post ${id} Approved!`);
  }
});

// 3. Mini-App Endpoint
app.get('/miniapp', (req, res) => {
  const html = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="background:#0f0f12;color:white;text-align:center;padding:20px;font-family:sans-serif"><h1 style="color:#6d4aff">🖤 Black Rose</h1><div id="s">Loading...</div><script src="https://telegram.org/js/telegram-web-app.js"></script><script>Telegram.WebApp.expand();fetch('/api/stats.php').then(r=>r.json()).then(d=>{document.getElementById('s').innerHTML='Views: '+d.views+'<br>Users: '+d.users}).catch(()=>document.getElementById('s').innerText='Offline')</script></body></html>`;
  res.send(html);
});

// Start Server
bot.launch().then(() => {
  console.log('Bot launched successfully!');
  
  // Add a simple health check route for Render
  app.get('/', (req, res) => {
    res.send('BLACK ROSE BOT IS RUNNING! 🖤');
  });

  // Listen on the port Render provides
  app.listen(PORT, () => {
    console.log(`Web server listening on port ${PORT}`);
  });
}).catch(err => {
  console.error('Bot launch error:', err);
  process.exit(1);
});

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
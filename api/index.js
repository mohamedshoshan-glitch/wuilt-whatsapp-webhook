import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
app.use(bodyParser.json());

// بيانات بوت تليجرام
const TELEGRAM_BOT_TOKEN = "YOUR_TELEGRAM_BOT_TOKEN";
const TELEGRAM_CHAT_ID = "YOUR_TELEGRAM_CHAT_ID"; // معرف الجروب أو الحساب

app.post("/", async (req, res) => {
  const event = req.body;

  try {
    const order = event.order;
    const phone = order?.customer?.phone || "غير متوفر";

    let message = `📦 *تحديث طلب جديد من المتجر*\n`;
    message += `رقم الطلب: ${order.id}\n`;
    message += `العميل: ${order.customer.name}\n`;
    message += `الهاتف: ${phone}\n`;
    message += `الحالة: ${order.status}\n\n`;

    switch (event.event) {
      case "order.created":
        message += "✅ تم إنشاء الطلب بنجاح.";
        break;
      case "order.updated":
        message += "🔄 تم تحديث الطلب.";
        break;
      case "order.cancelled":
        message += "❌ تم إلغاء الطلب.";
        break;
      case "order.completed":
        message += "🚚 تم تسليم الطلب.";
        break;
      default:
        message += "📢 حدث جديد في الطلب.";
    }

    // إرسال إلى تليجرام
    await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: "Markdown",
        }),
      }
    );

    res.status(200).send("Message sent to Telegram");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error sending message to Telegram");
  }
});

export default app;

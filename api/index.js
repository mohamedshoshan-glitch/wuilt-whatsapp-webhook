export default async function handler(req, res) {
  // تحديد المسار الفرعي من الـ URL
  const path = req.url.split("?")[0];

  if (path === "/api/wuilt-webhook") {
    return await handleWuiltWebhook(req, res);
  }

  // أي أكواد أخرى تخص API endpoints تانية
  return res.status(200).json({ message: "API running" });
}

// دالة مستقلة للتعامل مع Webhook
async function handleWuiltWebhook(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const body = req.body;
    const eventType = body.event;
    const order = body.order || {};
    const customer = order.customer || {};

    console.log("📩 Received Webhook Event:", eventType);

    const phone = customer.phone || customer.whatsapp || "";
    if (!phone) return res.status(200).json({ message: "No phone number" });

    let message = "";

    switch (eventType) {
      case "ORDER_CREATED":
        message = `مرحبًا ${customer.name || "عميلنا العزيز"} 👋
تم استلام طلبك بنجاح ✅
رقم الطلب: ${order.orderSerial || "غير متاح"}
هنقوم بالتواصل معك قريب لتأكيد التفاصيل.
شكرًا لاختيارك دجاج سيزر 🐔❤️`;
        break;

      case "ORDER_CANCELED":
        message = `مرحبًا ${customer.name || "عميلنا العزيز"} 👋
طلبك رقم ${order.orderSerial || "غير متاح"} تم إلغاؤه ❌`;
        break;

      case "ORDER_FULFILLED":
        message = `مرحبًا ${customer.name || "عميلنا العزيز"} 👋
طلبك رقم ${order.orderSerial || "غير متاح"} جاهز للتوصيل 🚚`;
        break;

      default:
        return res.status(200).json({ message: "Event ignored" });
    }

    await sendWhatsAppMessage(phone, message);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function sendWhatsAppMessage(phone, message) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;

  const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;

  await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone.replace(/\D/g, ""),
      type: "text",
      text: { body: message },
    }),
  });
}

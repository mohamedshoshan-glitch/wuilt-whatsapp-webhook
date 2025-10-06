const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("✅ Wuilt WhatsApp Webhook is running");
  }

  try {
    console.log("✅ New request from Wuilt:", req.body);

    // 🧩 Webhook validation test
    if (req.body.test === true && req.body.message) {
      console.log("⚙️ Webhook validation test request");
      return res.status(200).json({ success: true, message: "Webhook validated" });
    }

    const data = req.body.data;
    const eventType = data?.event;
    const order = data?.payload?.order;

    if (!order) {
      console.error("❌ No order data found in payload");
      return res.status(400).json({ error: "No order data" });
    }

    console.log("🧾 Order Object:", order);

    const customer = order.customer || {};
    console.log("📱 Customer Object:", customer);

    const customerName = customer.name || "عميلنا العزيز";
    let customerPhone = customer.phone || "";

    // ✅ Normalize phone format
    if (customerPhone.startsWith("0")) {
      customerPhone = "+2" + customerPhone.substring(1);
    } else if (!customerPhone.startsWith("+")) {
      customerPhone = "+2" + customerPhone;
    }

    const orderNumber = order.orderSerial || order._id;

    // 💬 Message text depends on the event type
    let message = "";

    switch (eventType) {
      case "ORDER_CREATED":
        message = `مرحبًا ${customerName} 👋
تم استلام طلبك بنجاح ✅
رقم الطلب: ${orderNumber}
هنقوم بالتواصل معك قريب لتأكيد التفاصيل.
شكرًا لاختيارك دجاج سيزر 🐔❤️`;
        break;

      case "ORDER_CANCELED":
        message = `مرحبًا ${customerName} 👋
يؤسفنا نبلغك إن طلبك رقم ${orderNumber} تم إلغاؤه ❌
لو تم الإلغاء بالخطأ، برجاء التواصل مع خدمة عملاء دجاج سيزر 📞`;
        break;

      case "ORDER_FULFILLED":
        message = `مرحبًا ${customerName} 👋
طلبك رقم ${orderNumber} تم شحنه 🚚✨
قريب جدًا هيوصل لعندك، شكرًا لثقتك في دجاج سيزر ❤️`;
        break;

      default:
        console.log(`ℹ️ Event "${eventType}" not handled specifically.`);
        return res.status(200).json({ success: true, message: "Event ignored" });
    }

    console.log("📞 Sending WhatsApp to:", customerPhone);
    console.log("💬 Message:", message);

    const response = await fetch(
      `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: customerPhone,
          type: "text",
          text: { body: message },
        }),
      }
    );

    const result = await response.json();
    console.log("📦 WhatsApp API response:", result);

    return res.status(200).json({ success: true, result });
  } catch (error) {
    console.error("❌ Error in handler:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

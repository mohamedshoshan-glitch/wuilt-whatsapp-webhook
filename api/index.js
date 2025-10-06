const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

// Cache to prevent duplicate messages within short period
const sentOrders = new Map();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("✅ Wuilt WhatsApp Webhook is running");
  }

  try {
    console.log("✅ New request from Wuilt:", req.body);

    const data = req.body.data;
    if (!data) {
      console.error("❌ No data received from Wuilt");
      return res.status(400).json({ error: "Invalid payload" });
    }

    const eventType = data.event;
    const order = data?.payload?.order;

    if (!order) {
      console.error("❌ No order object found in payload");
      return res.status(400).json({ error: "No order data" });
    }

    const customer = order.customer || {};
    let customerPhone = customer.phone || "";

    if (!customerPhone) {
      console.error("❌ Missing customer phone number");
      return res.status(400).json({ error: "No phone" });
    }

    // Normalize phone number
    if (customerPhone.startsWith("0")) {
      customerPhone = "+2" + customerPhone.substring(1);
    } else if (!customerPhone.startsWith("+")) {
      customerPhone = "+2" + customerPhone;
    }

    const orderNumber = order.orderSerial || order._id;
    const customerName = customer.name || "عميلنا العزيز";

    // Prevent duplicate messages for the same order within 3 minutes
    const cacheKey = `${eventType}-${orderNumber}`;
    const lastSent = sentOrders.get(cacheKey);
    if (lastSent && Date.now() - lastSent < 180000) {
      console.log(`⚠️ Skipped duplicate message for ${cacheKey}`);
      return res.status(200).json({ message: "Duplicate skipped" });
    }

    let message = "";

    // Choose message based on event type
    switch (eventType) {
      case "ORDER_PLACED":
        message = `مرحبًا ${customerName} 👋
تم استلام طلبك بنجاح ✅
رقم الطلب: ${orderNumber}
هنقوم بالتواصل معك قريب لتأكيد التفاصيل.
شكرًا لاختيارك دجاج سيزر 🐔❤️`;
        break;

      case "ORDER_CANCELED":
        message = `مرحبًا ${customerName} 👋
تم إلغاء طلبك رقم ${orderNumber} ❌
لو في أي مشكلة حصلت أثناء الطلب، ياريت تبلغنا عشان نساعدك 😊`;
        break;

      case "ORDER_FULFILLED":
        message = `مرحبًا ${customerName} 👋
طلبك رقم ${orderNumber} تم تجهيزه وجاري التوصيل 🚚
تابع حالة الطلب من موقعنا أو التطبيق 📦`;
        break;

      default:
        console.log("⚪ Ignored Event:", eventType);
        return res.status(200).json({ message: "Event ignored" });
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

    // Mark order as notified
    sentOrders.set(cacheKey, Date.now());

    return res.status(200).json({ success: true, result });
  } catch (error) {
    console.error("❌ Error in handler:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

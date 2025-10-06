import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const data = req.body.data || req.body; // بعض منصات wuilt ترسل داخل data
    const event = data?.event;
    const order = data?.payload?.order;

    console.info("✅ New request from Wuilt:", data);

    if (!order) throw new Error("No order found in payload");

    const customer = order.customer;
    const phone = customer?.phone?.replace(/\s+/g, "");
    const name = customer?.name || "العميل";

    let message = "";

    switch (event) {
      case "ORDER_PLACED":
        message = `مرحبًا ${name} 👋\nتم استلام طلبك بنجاح ✅\nرقم الطلب: ${order.orderSerial}\nهنقوم بالتواصل معك قريب لتأكيد التفاصيل.\nشكرًا لاختيارك دجاج سيزر 🐔❤️`;
        break;

      case "ORDER_CANCELED":
        message = `عزيزي ${name} 😔\nتم إلغاء طلبك رقم ${order.orderSerial}.\nلو تم الإلغاء عن طريق الخطأ، يمكنك إعادة الطلب من موقعنا www.ceasarchicken.com`;
        break;

      case "ORDER_FULFILLED":
        message = `أهلاً ${name} 🎉\nطلبك رقم ${order.orderSerial} تم تجهيزه وجاري شحنه إليك 🚚💨\nشكرًا لاختيارك دجاج سيزر 🐔`;
        break;

      case "ORDER_REFUNDED":
        message = `مرحبًا ${name} 👋\nتم رد المبلغ لطلبك رقم ${order.orderSerial} بنجاح 💰\nلو عندك أي استفسار، تواصل معنا على رقم الدعم.`;
        break;

      default:
        console.info(`⚠️ Event ${event} غير مدعوم حاليًا.`);
        return res.status(200).send("Ignored event");
    }

    if (!phone) throw new Error("No phone number found");

    console.info("📞 Sending WhatsApp to:", phone);
    console.info("💬 Message:", message);

    const response = await axios.post(
      `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: phone,
        text: { body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.info("📦 WhatsApp API response:", response.data);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Error in webhook handler:", error.message);
    return res.status(500).json({ error: error.message });
  }
}

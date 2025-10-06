import fetch from "node-fetch";

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("✅ Wuilt WhatsApp Webhook is running");
  }

  try {
    console.log("✅ New request from Wuilt:", req.body);

    const data = req.body.data;
    const event = data?.event;
    const order = data?.payload?.order;

    if (!event || !order) {
      console.error("❌ Missing event or order in payload");
      return res.status(400).json({ error: "Invalid payload" });
    }

    const customer = order.customer || {};
    let customerPhone = customer.phone || "";
    const customerName = customer.name || "عميلنا العزيز";

    // إصلاح صيغة الرقم الدولي
    if (customerPhone.startsWith("0")) {
      customerPhone = "+2" + customerPhone.substring(1);
    } else if (!customerPhone.startsWith("+")) {
      customerPhone = "+2" + customerPhone;
    }

    const orderNumber = order.orderSerial || order._id;

    // 🧩 تحديد نوع الرسالة حسب الحدث
    let templateName;
    let messageParams = [];

    switch (event) {
      case "ORDER_CREATED":
        templateName = "order_confirmation";
        messageParams = [customerName, orderNumber];
        break;

      case "ORDER_CANCELED":
        templateName = "order_canceled";
        messageParams = [customerName, orderNumber];
        break;

      case "ORDER_FULFILLED":
        templateName = "order_shipped";
        messageParams = [orderNumber, "الـ ٢٤ ساعة القادمة"];
        break;

      case "ORDER_REFUNDED":
        templateName = "order_refunded";
        messageParams = [customerName, orderNumber];
        break;

      case "ORDER_PAID":
        templateName = "order_paid";
        messageParams = [customerName, orderNumber];
        break;

      default:
        console.log("ℹ️ Ignored event type:", event);
        return res.status(200).json({ ignored: true });
    }

    console.log(`📩 Sending template "${templateName}" to ${customerPhone}`);

    const response = await fetch(
      `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: customerPhone,
          type: "template",
          template: {
            name: templateName,
            language: { code: "ar" },
            components: [
              {
                type: "body",
                parameters: messageParams.map((param) => ({
                  type: "text",
                  text: param,
                })),
              },
            ],
          },
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

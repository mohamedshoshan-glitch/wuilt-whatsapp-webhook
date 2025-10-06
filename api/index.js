const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("✅ Wuilt WhatsApp Webhook is running");
  }

  try {
    const data = req.body.data;
    const event = data?.event;
    const order = data?.payload?.order;

    if (!order || !event) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const customer = order.customer || {};
    let customerPhone = customer.phone || order.shippingAddress?.phone || "";
    const customerName = customer.name || "عميلنا العزيز";

    // رقم الهاتف بصيغة دولية
    if (customerPhone.startsWith("0")) customerPhone = "+2" + customerPhone.substring(1);
    else if (!customerPhone.startsWith("+")) customerPhone = "+2" + customerPhone;

    const orderNumber = order.orderSerial || order._id;
    const orderTotal = `${order.totalPrice.amount} ${order.totalPrice.currencyCode}`;
    const supportPhone = order.storeData?.phone || "+201508640042";
    const trackingNumber = order.trackingNumber || "—";
    const deliveryEstimate = order.deliveryEstimate || "خلال 24 ساعة";

    // تحديد القالب المناسب
    let templateName = "";
    let parameters = [];

    switch (event) {
      case "ORDER_PLACED":
      case "ORDER_CREATED":
        templateName = "order_confirmation"; // نفس اسم القالب في واتساب
        parameters = [
          { type: "text", text: customerName },
          { type: "text", text: orderNumber },
          { type: "text", text: orderTotal },
        ];
        break;

      case "ORDER_CANCELED":
        templateName = "order_canceled";
        parameters = [
          { type: "text", text: customerName },
          { type: "text", text: orderNumber },
          { type: "text", text: supportPhone },
        ];
        break;

      case "ORDER_PAID":
        templateName = "order_paid";
        parameters = [
          { type: "text", text: customerName },
          { type: "text", text: orderNumber },
          { type: "text", text: orderTotal },
        ];
        break;

      case "ORDER_FULFILLED":
        templateName = "order_shipped";
        parameters = [
          { type: "text", text: customerName },
          { type: "text", text: orderNumber },
          { type: "text", text: deliveryEstimate },
          { type: "text", text: trackingNumber },
        ];
        break;

      default:
        console.log("⚠️ Unhandled event:", event);
        return res.status(200).json({ success: true, message: "Event ignored" });
    }

    // إعداد بيانات الإرسال
    const payload = {
      messaging_product: "whatsapp",
      to: customerPhone,
      type: "template",
      template: {
        name: templateName,
        language: { code: "ar" },
        components: [
          {
            type: "body",
            parameters: parameters,
          },
        ],
      },
    };

    // إرسال الطلب إلى WhatsApp API
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();
    console.log("📦 WhatsApp API response:", result);

    return res.status(200).json({ success: true, result });
  } catch (error) {
    console.error("❌ Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

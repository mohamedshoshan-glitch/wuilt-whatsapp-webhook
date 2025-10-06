const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("✅ Wuilt WhatsApp Webhook is running");
  }

  try {
    const body = req.body.data || req.body;
    let event = body?.event || "";
    const order = body?.payload?.order || body?.order;

    if (!order) {
      console.error("❌ Missing order data:", req.body);
      return res.status(400).json({ error: "Invalid payload" });
    }

    // 🧠 لو الحدث فاضي أو مش واضح نحدده من حالة الطلب
    if (!event || event === "ORDER_UPDATED" || event === "ORDER_CHANGED") {
      if (order.isCanceled) event = "ORDER_CANCELED";
      else if (order.paymentStatus === "PAID") event = "ORDER_PAID";
      else if (order.fulfillmentStatus === "FULFILLED") event = "ORDER_FULFILLED";
      else event = "ORDER_CREATED";
    }

    console.log("🧩 Detected event:", event);
    console.log("🧾 Order data:", {
      isCanceled: order.isCanceled,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
    });

    const customer = order.customer || {};
    let customerPhone = customer.phone || order.shippingAddress?.phone || "";
    const customerName = customer.name || "عميلنا العزيز";

    if (customerPhone.startsWith("0")) customerPhone = "+2" + customerPhone.substring(1);
    else if (!customerPhone.startsWith("+")) customerPhone = "+2" + customerPhone;

    const orderNumber = order.orderSerial || order._id;
    const orderTotal = `${order.totalPrice.amount} ${order.totalPrice.currencyCode}`;
    const supportPhone = order.storeData?.phone || "+201508640042";
    const trackingNumber = order.trackingNumber || "—";
    const deliveryEstimate = order.deliveryEstimate || "خلال 24 ساعة";

    let templateName = "";
    let parameters = [];

    switch (event) {
      case "ORDER_CREATED":
        templateName = "order_confirmation";
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

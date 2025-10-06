const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

export default async function handler(req, res) {
  // ✅ لتأكيد أن السيرفر شغال
  if (req.method !== "POST") {
    return res.status(200).send("✅ Wuilt WhatsApp Webhook is running");
  }

  try {
    // 🧩 قراءة البيانات من Webhook (تعمل مع كل صيغ Wuilt)
    const data = req.body.data || req.body;
    const event = data?.event;
    const order = data?.payload?.order || data?.order;

    console.log("🧩 Incoming event:", event);
    console.log("🧾 Order Object:", JSON.stringify(order, null, 2));

    // 🔒 تأكيد وجود بيانات الطلب
    if (!order || !event) {
      console.error("❌ Invalid payload:", req.body);
      return res.status(400).json({ error: "Invalid payload" });
    }

    // 📱 استخراج بيانات العميل
    const customer = order.customer || {};
    let customerPhone =
      customer.phone || order.shippingAddress?.phone || "";

    const customerName = customer.name || "عميلنا العزيز";

    // ☎️ تنسيق رقم الهاتف دوليًا
    if (customerPhone.startsWith("0"))
      customerPhone = "+2" + customerPhone.substring(1);
    else if (!customerPhone.startsWith("+"))
      customerPhone = "+2" + customerPhone;

    // 🧮 بيانات الطلب
    const orderNumber = order.orderSerial || order._id;
    const orderTotal = `${order.totalPrice.amount} ${order.totalPrice.currencyCode}`;
    const supportPhone = order.storeData?.phone || "+201508640042";
    const trackingNumber = order.trackingNumber || "—";
    const deliveryEstimate = order.deliveryEstimate || "خلال 24 ساعة";

    // 🧱 اختيار القالب حسب نوع الحدث
    let templateName = "";
    let parameters = [];

    switch (event) {
      case "ORDER_PLACED":
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
        return res
          .status(200)
          .json({ success: true, message: `Event ${event} ignored` });
    }

    // 📦 إنشاء الـ payload لإرسال الرسالة عبر WhatsApp API
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

    // 🚀 إرسال الطلب إلى Meta API
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

    // ✅ إرسال الرد إلى Wuilt
    return res.status(200).json({ success: true, result });
  } catch (error) {
    console.error("❌ Error:", error);
    return res
      .status(500)
      .json({ success: false, message: error.message || "Server error" });
  }
}

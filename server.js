import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();
app.use(bodyParser.json());

// ثوابت
const VERIFY_TOKEN = "wuilt_webhook_verify";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const SUPPORT_PHONE = "+201508640042"; // رقم الدعم الفني

// تحقق من التوكن عند التحقق من Webhook
app.get("/api", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  } else {
    return res.sendStatus(403);
  }
});

// استقبال Webhook من Wuilt
app.post("/api", async (req, res) => {
  try {
    const { data } = req.body;
    console.log("✅ New request from Wuilt:", JSON.stringify(data, null, 2));

    const order = data?.payload?.order;
    if (!order) {
      console.log("❌ No order data received");
      return res.sendStatus(400);
    }

    const customer = order.customer || {};
    const customerName = customer.name || "عميلنا العزيز";
    let customerPhone = customer.phone || order.shippingAddress?.phone || "";
    if (customerPhone.startsWith("0")) customerPhone = "+2" + customerPhone.substring(1);
    else if (!customerPhone.startsWith("+")) customerPhone = "+2" + customerPhone;

    const orderId = order.orderSerial || order._id;
    const orderTotal = `${order.totalPrice?.amount || 0} ${order.totalPrice?.currencyCode || "EGP"}`;
    const deliveryEstimate = order.deliveryEstimate || "خلال 24 ساعة";
    const trackingNumber = order.trackingNumber || "—";

    // استنتاج نوع الحدث بناءً على حالة الطلب
    let eventType = "ORDER_CREATED"; // الافتراضي

    if (order.isCanceled) {
      eventType = "ORDER_CANCELED";
    } else if (order.paymentStatus === "PAID" || order.paymentStatus === "SUCCESSFUL") {
      eventType = "ORDER_PAID";
    } else if (order.fulfillmentStatus === "FULFILLED") {
      eventType = "ORDER_FULFILLED";
    }

    console.log(`📦 Derived Event Type: ${eventType}`);

    // تحديد الرسالة المناسبة
    let messageTemplate = "";

    switch (eventType) {
      case "ORDER_CANCELED":
        messageTemplate = `مرحبًا ${customerName} 😔\nنأسف لإبلاغك أن طلب رقم ${orderId} تم إلغاؤه.\nلو رغبت بإعادة الطلب أو لديك استفسار، تواصل معنا: ${SUPPORT_PHONE}`;
        break;

      case "ORDER_PAID":
        messageTemplate = `مرحبًا ${customerName} ✅\nتم تأكيد الدفع لطلب رقم ${orderId} بمبلغ ${orderTotal}.\nسنبدأ في تجهيز طلبك الآن.`;
        break;

      case "ORDER_FULFILLED":
        messageTemplate = `مرحبًا ${customerName} 🚚\nطلبك رقم ${orderId} خرج للشحن — متوقع الوصول خلال ${deliveryEstimate}.\nرقم التتبع: ${trackingNumber}`;
        break;

      default:
        messageTemplate = `مرحبًا ${customerName} 👋\nتم استلام طلبك رقم ${orderId} بنجاح ✅\nقيمة الطلب: ${orderTotal}\nهنقوم بالتواصل معك قريب لتأكيد التفاصيل.\nشكرًا لاختيارك دجاج سيزر 🐔❤️`;
        break;
    }

    // إرسال الرسالة عبر واتساب
    if (customerPhone && messageTemplate) {
      console.log(`📞 Sending WhatsApp to: ${customerPhone}`);
      console.log(`💬 Message: ${messageTemplate}`);

      await axios.post(
        `https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: "whatsapp",
          to: customerPhone,
          type: "text",
          text: { body: messageTemplate },
        },
        { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } }
      );
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Error handling webhook:", error.response?.data || error.message);
    res.sendStatus(500);
  }
});

app.listen(3000, () => console.log("🚀 Server running on port 3000"));

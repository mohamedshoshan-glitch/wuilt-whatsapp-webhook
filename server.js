import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();
app.use(bodyParser.json());

// ثابت
const VERIFY_TOKEN = "wuilt_webhook_verify";
const WHATSAPP_TOKEN = "YOUR_WHATSAPP_TOKEN";
const PHONE_NUMBER_ID = "YOUR_PHONE_NUMBER_ID";
const SUPPORT_PHONE = "+201234567890"; // رقم الدعم الفني

// تحقق من التوكن لما wuilt تعمل verification
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

// استقبال بيانات الطلبات من Wuilt
app.post("/api", async (req, res) => {
  try {
    const data = req.body;

    if (!data || !data.event || !data.data) {
      console.log("Invalid payload:", data);
      return res.sendStatus(400);
    }

    const eventType = data.event;
    const order = data.data;
    const customerName = order.customer?.name || "العميل";
    const customerPhone = order.customer?.phone?.replace("+", "");
    const orderId = order.id;
    const orderTotal = order.total || "غير محدد";
    const trackingNumber = order.tracking_number || "—";
    const deliveryEstimate = order.delivery_estimate || "قريبًا";

    // بناء الرسالة حسب نوع الحدث
    let messageTemplate = "";

    switch (eventType) {
      case "order.created":
        messageTemplate = `مرحبًا ${customerName} 👋\nتم استلام طلبك رقم ${orderId} بنجاح ✅\nقيمة الطلب: ${orderTotal}\nهنقوم بالتواصل معك قريب لتأكيد التفاصيل.\nشكرًا لاختيارك دجاج سيزر 🐔❤️`;
        break;

      case "order.canceled":
        messageTemplate = `مرحبًا ${customerName} 😔\nنأسف لإبلاغك أن طلب رقم ${orderId} تم إلغاؤه.\nلو رغبت بإعادة الطلب أو لديك استفسار، تواصل معنا: ${SUPPORT_PHONE}`;
        break;

      case "order.paid":
        messageTemplate = `مرحبًا ${customerName} ✅\nتم تأكيد الدفع لطلب رقم ${orderId} بمبلغ ${orderTotal}.\nسنبدأ في تجهيز طلبك الآن.`;
        break;

      case "order.fulfilled":
        messageTemplate = `مرحبًا ${customerName} 🚚\nطلبك رقم ${orderId} خرج للشحن — متوقع الوصول خلال ${deliveryEstimate}.\nرقم التتبع: ${trackingNumber}`;
        break;

      default:
        console.log("غير معروف نوع الحدث:", eventType);
        return res.sendStatus(200);
    }

    // إرسال الرسالة عبر واتساب
    if (customerPhone && messageTemplate) {
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
      console.log(`📩 رسالة أُرسلت إلى ${customerPhone} (${eventType})`);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Error handling webhook:", err.response?.data || err.message);
    res.sendStatus(500);
  }
});

app.listen(3000, () => console.log("🚀 Server running on port 3000"));

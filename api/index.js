// api/index.js

// استبدل التوكن والبزنس ID ببياناتك من Meta for Developers
const WHATSAPP_TOKEN = "EAASMOvuYpAgBPiZAEiY62aj80Oa77neowrcG928iGZBdNWdpMbXZAonimRdV1R2kTRTkpfjMMMmn149qMkxQPuaqhSbnXVkBmd9BBC1JaLJE80VNRxqcgzEEKRjuGHilzfiZC0OyIFMz961A7w3hqocuoWicPKZCyDRcNO0p7Lsw6PnZBpU0eZCuSNgPEmUHq9ZCzL0HTvajunumZA9T3RAJBPRumdGBXoXyFSWgieuTcLwZDZD";
const PHONE_NUMBER_ID = "853519121172052";

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const order = req.body;

      console.log("✅ New order received from Wuilt:", order);

      // استخراج بيانات العميل من الطلب (عدّل حسب هيكل بيانات Wuilt)
      const customerPhone = order.customer?.phone || "";
      const customerName = order.customer?.name || "عميلنا العزيز";

      // نص الرسالة
      const message = `مرحبًا ${customerName} 👋
تم استلام طلبك بنجاح ✅
رقم الطلب: ${order.id}
هنقوم بالتواصل معاك قريب لتأكيد التفاصيل.
شكرًا لاختيارك دجاج سيزر 🐔❤️`;

      // إرسال الرسالة عبر واتساب Cloud API
      if (customerPhone) {
        await fetch(`https://graph.facebook.com/v20.0/${853519121172052}/messages`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${EAASMOvuYpAgBPiZAEiY62aj80Oa77neowrcG928iGZBdNWdpMbXZAonimRdV1R2kTRTkpfjMMMmn149qMkxQPuaqhSbnXVkBmd9BBC1JaLJE80VNRxqcgzEEKRjuGHilzfiZC0OyIFMz961A7w3hqocuoWicPKZCyDRcNO0p7Lsw6PnZBpU0eZCuSNgPEmUHq9ZCzL0HTvajunumZA9T3RAJBPRumdGBXoXyFSWgieuTcLwZDZD}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: customerPhone,
            type: "text",
            text: { body: message },
          }),
        });
      }

      return res.status(200).json({
        status: "success",
        message: "Order received and WhatsApp message sent",
      });
    } catch (error) {
      console.error("❌ Error:", error);
      return res.status(500).json({
        status: "error",
        message: "Internal server error",
        details: error.message,
      });
    }
  } else {
    return res.status(200).send("✅ Wuilt WhatsApp Webhook is running");
  }
}

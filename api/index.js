const WHATSAPP_TOKEN = "YOUR_WHATSAPP_CLOUD_API_TOKEN";
const PHONE_NUMBER_ID = "YOUR_PHONE_NUMBER_ID";

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      console.log("✅ New order received from Wuilt:", req.body);

      const order = req.body.data?.payload?.order || {};
      console.log("🧾 Order Object:", order);
      console.log("📱 Customer Object:", order.customer);

      const customerName = order.customer?.name || "عميلنا العزيز";
      let customerPhone = order.customer?.phone || "";

      if (customerPhone.startsWith("0")) {
        customerPhone = "+2" + customerPhone.substring(1);
      } else if (!customerPhone.startsWith("+")) {
        customerPhone = "+2" + customerPhone;
      }

      const message = `مرحبًا ${customerName} 👋
تم استلام طلبك بنجاح ✅
رقم الطلب: ${order.orderSerial}
هنقوم بالتواصل معاك قريب لتأكيد التفاصيل.
شكرًا لاختيارك دجاج سيزر 🐔❤️`;

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

      return res.status(200).json({ status: "success", message: "Order processed" });
    } catch (error) {
      console.error("❌ Error:", error);
      return res.status(500).json({ status: "error", message: error.message });
    }
  } else {
    return res.status(200).send("✅ Wuilt WhatsApp Webhook is running");
  }
}

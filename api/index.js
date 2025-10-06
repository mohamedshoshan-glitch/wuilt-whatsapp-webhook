export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      console.log("✅ New order received from Wuilt:", req.body);

      // ✅ تعديل مهم علشان يقرأ البيانات صح
      const order = req.body.data?.payload?.order || {};
      console.log("🧾 Order Object:", order);
      console.log("📱 Customer Object:", order.customer);

      const customerName = order.customer?.name || "عميلنا العزيز";
      let customerPhone = order.customer?.phone || "";

      // تأكد إن الرقم بصيغة دولية (يبدأ بـ +2)
      if (customerPhone.startsWith("0")) {
        customerPhone = "+2" + customerPhone.substring(1);
      } else if (!customerPhone.startsWith("+")) {
        customerPhone = "+2" + customerPhone;
      }

      const message = `مرحبًا ${customerName} 👋
تم استلام طلبك بنجاح ✅
رقم الطلب: ${order.id}
هنقوم بالتواصل معاك قريب لتأكيد التفاصيل.
شكرًا لاختيارك دجاج سيزر 🐔❤️`;

      console.log("📞 Sending WhatsApp to:", customerPhone);
      console.log("💬 Message:", message);

      const response = await fetch(
        `https://graph.facebook.com/v20.0/${839520552574293}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${EAAPnaEVSsi4BPpOj25BgAxqjxpEB2nlKvptoIm9z4Ni1C4apdJrIX6Faa6I09ZBktisZBtt4qCvtBZCbGgi3SFiv6515Cnhw4aFaQrocoEkKk5IA3SGDzehA4hwveWVfoNe27iHEukK4Aj0EoXE9oiFAsn4sFFVNoIzHUIS7IBi6jAF36gk1nF0AsjPyLIfMRw7R9uxSO493q6LnFcc0PMLKz3EJbHlq9kcDmZBJpTZAQVqoE7g9ZA5ujy8ckZD}`,
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

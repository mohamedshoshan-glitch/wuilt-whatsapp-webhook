import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const WHATSAPP_TOKEN = "EAAPnaEVSsi4BPi6XOmwzd058fOOIGZC3uJJbwUga0H8I4He7KL49HYZAxcJSlBVcmfrC2AHBYMA0iEeOtgbEnYBoAmNbcw0IyeJqw0W9XyZCzdOZCvqyVd9TVg4IDMbv24AvxfxIEPvyRuoeZBQvF5mq52glZChPSckrld7Oh9Ag3X8AFiO351zsiunkZB5uz0jaI16ZAEbDaIcbcCOfl8paodlpuXsZBcMhMvQENC592Wsv8hBl9Fq9jYYAgIQZDZD";
const PHONE_NUMBER_ID = "839520552574293";

app.get("/", (req, res) => {
  res.send("Wuilt WhatsApp Webhook is running ✅");
});

app.post("/wuilt-order-webhook", async (req, res) => {
  const order = req.body;

  const customerName = order.customer?.name || "عميل";
  const customerPhone = order.customer?.phone || "";
  const orderId = order.id || "غير محدد";
  const total = order.total || "غير محدد";
  const items = order.items?.map(i => `${i.name} × ${i.quantity}`).join("\n") || "";

  const message = `
👋 أهلاً ${customerName}!
تم استلام طلبك رقم #${orderId}.
📦 تفاصيل الطلب:
${items}
💰 الإجمالي: ${total} جنيه
سيتم التواصل معك قريبًا لتأكيد الطلب.
`;

  try {
    const response = await fetch(`https://graph.facebook.com/v19.0/${839520552574293}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${EAAPnaEVSsi4BPi6XOmwzd058fOOIGZC3uJJbwUga0H8I4He7KL49HYZAxcJSlBVcmfrC2AHBYMA0iEeOtgbEnYBoAmNbcw0IyeJqw0W9XyZCzdOZCvqyVd9TVg4IDMbv24AvxfxIEPvyRuoeZBQvF5mq52glZChPSckrld7Oh9Ag3X8AFiO351zsiunkZB5uz0jaI16ZAEbDaIcbcCOfl8paodlpuXsZBcMhMvQENC592Wsv8hBl9Fq9jYYAgIQZDZD}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: customerPhone,
        type: "text",
        text: { body: message },
      }),
    });

    const data = await response.json();
    console.log("WhatsApp Response:", data);
  } catch (err) {
    console.error("Error sending WhatsApp message:", err);
  }

  res.sendStatus(200);
});

app.listen(10000, () => console.log("Server running on port 10000"));

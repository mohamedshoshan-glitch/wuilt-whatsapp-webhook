export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      console.log('✅ New order received from Wuilt:', req.body);

      // ردّ بسيط يوضح إن السيرفر استقبل البيانات بنجاح
      return res.status(200).json({
        status: 'success',
        message: 'Order data received successfully',
      });
    } catch (error) {
      console.error('❌ Error:', error);
      return res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  } else {
    // لو حد فتح الرابط في المتصفح (GET request)
    return res.status(200).send('✅ Wuilt WhatsApp Webhook is running');
  }
}

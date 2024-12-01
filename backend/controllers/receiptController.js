const axios = require('axios');
const supabase = require('../lib/supabase');

const sendReceiptViaSMS = async (req, res) => {
    try {
        const { saleId, phoneNumber } = req.body;
        const userId = req.user.id;
        
        if (!saleId || !phoneNumber) {
            return res.status(400).json({ error: 'Sale ID and phone number are required' });
        }

        // Get user's SME details
        const { data: userProfile, error: profileError } = await supabase
            .from('user_profiles')
            .select(`
                sme_id,
                sme_details:sme_id (
                    business_name,
                    contact_phone,
                    website
                )
            `)
            .eq('user_id', userId)
            .single();

        if (profileError || !userProfile?.sme_id) {
            console.error('Error fetching user profile:', profileError);
            return res.status(404).json({ error: 'Business profile not found' });
        }

        // Fetch sale details
        const { data: sale, error: saleError } = await supabase
            .from('sales')
            .select(`
                *,
                sales_items (
                    *,
                    stock_items (
                        name,
                        unit_price
                    )
                )
            `)
            .eq('id', saleId)
            .eq('sme_id', userProfile.sme_id)
            .single();

        if (saleError) {
            console.error('Error fetching sale:', saleError);
            return res.status(404).json({ error: 'Sale not found' });
        }

        if (!sale) {
            return res.status(404).json({ error: 'Sale not found' });
        }

        // Calculate total amount
        const totalAmount = sale.sales_items.reduce((sum, item) => {
            return sum + (item.quantity * item.stock_items.unit_price);
        }, 0);

        // Format receipt message
        const items = sale.sales_items.map(item => 
            `• ${item.stock_items.name}\n  ${item.quantity} x ${item.stock_items.unit_price.toFixed(2)} = ${(item.quantity * item.stock_items.unit_price).toFixed(2)} KES`
        ).join('\n');

        const message = 
            `🧾 Digital Receipt\n` +
            `\n${userProfile.sme_details.business_name}\n` +
            (userProfile.sme_details.contact_phone ? `Tel: ${userProfile.sme_details.contact_phone}\n` : '') +
            (userProfile.sme_details.website ? `${userProfile.sme_details.website}\n` : '') +
            `\nOrder #${sale.id}\n` +
            `Date: ${new Date(sale.created_at).toLocaleString()}\n` +
            `\nItems:\n${items}\n` +
            `\nTotal: ${totalAmount.toFixed(2)} KES\n` +
            `\nThank you for your business!`;

        // Send SMS using Infobip
        const response = await axios.post(`https://${process.env.INFOBIP_BASE_URL}/sms/2/text/advanced`, {
            messages: [{
                destinations: [{ to: phoneNumber }],
                from: "SMEReceipt",
                text: message
            }]
        }, {
            headers: {
                'Authorization': `App ${process.env.INFOBIP_API_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        // Check if SMS was sent successfully
        if (response.data.messages?.[0]?.status?.groupName === 'PENDING') {
            res.json({ message: 'Receipt sent successfully' });
        } else {
            throw new Error('Failed to send SMS');
        }
    } catch (error) {
        console.error('Error sending receipt:', error);
        res.status(500).json({ 
            error: 'Failed to send receipt',
            details: error.message
        });
    }
};

module.exports = {
    sendReceiptViaSMS
};
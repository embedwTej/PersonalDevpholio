const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const MESSAGES_FILE = path.join(__dirname, 'messages.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Utility to read messages from JSON file
function readMessages() {
    try {
        if (!fs.existsSync(MESSAGES_FILE)) {
            return [];
        }
        const data = fs.readFileSync(MESSAGES_FILE, 'utf8');
        return JSON.parse(data) || [];
    } catch (err) {
        console.error('Error reading messages file:', err);
        return [];
    }
}

// Utility to write messages to JSON file
function writeMessages(messages) {
    try {
        fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2), 'utf8');
    } catch (err) {
        console.error('Error writing messages file:', err);
    }
}

// Route to handle contact form submissions (Send & Store Email)
app.post('/api/contact', async (req, res) => {
    const { name, email, subject, message } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const newMessage = {
        id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        name,
        email,
        subject,
        message,
        timestamp: new Date().toISOString(),
        read: false
    };

    // Receive message: Store locally in JSON file
    const messages = readMessages();
    messages.push(newMessage);
    writeMessages(messages);
    console.log(`[Database] Message stored locally from: ${name} <${email}>`);

    // Send email using Nodemailer
    const contactEmail = process.env.CONTACT_EMAIL || 'yogeshmene00@gmail.com';
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT || 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    let emailSent = false;
    let emailStatusMessage = '';

    if (!smtpUser || !smtpPass) {
        emailStatusMessage = 'SMTP credentials not configured. Email dispatch simulated.';
        console.warn(`[Mailer] ${emailStatusMessage}`);
    } else {
        try {
            const transporter = nodemailer.createTransport({
                host: smtpHost,
                port: parseInt(smtpPort),
                secure: parseInt(smtpPort) === 465, // true for 465, false for other ports
                auth: {
                    user: smtpUser,
                    pass: smtpPass
                }
            });

            const mailOptions = {
                from: `"${name} (Portfolio Contact Form)" <${smtpUser}>`,
                to: contactEmail,
                replyTo: email,
                subject: `[Portfolio Contact] ${subject}`,
                text: `You have received a new message from your portfolio contact form.\n\n` +
                      `Name: ${name}\n` +
                      `Email: ${email}\n` +
                      `Subject: ${subject}\n\n` +
                      `Message:\n${message}\n\n` +
                      `---`,
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 600px; background-color: #f9f9f9;">
                        <h2 style="color: #333; border-bottom: 2px solid #00f0ff; padding-bottom: 8px;">New Contact Message</h2>
                        <p><strong>Name:</strong> ${name}</p>
                        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                        <p><strong>Subject:</strong> ${subject}</p>
                        <div style="margin-top: 20px; padding: 15px; background-color: #fff; border-left: 4px solid #00f0ff; border-radius: 4px;">
                            <p style="white-space: pre-wrap; margin: 0; line-height: 1.5;">${message}</p>
                        </div>
                        <p style="font-size: 11px; color: #777; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">Submitted on ${new Date().toLocaleString()}</p>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            emailSent = true;
            emailStatusMessage = 'Email sent successfully via SMTP.';
            console.log(`[Mailer] ${emailStatusMessage}`);
        } catch (err) {
            emailStatusMessage = `Failed to send email: ${err.message}`;
            console.error('[Mailer] SMTP Error:', err);
        }
    }

    res.status(200).json({
        success: true,
        message: 'Message received and stored.',
        emailSent,
        emailStatus: emailStatusMessage,
        data: newMessage
    });
});

// Route to fetch all received messages (Admin Console API)
app.get('/api/messages', (req, res) => {
    // Basic verification could be added here, but for simplicity, we serve the stored messages
    const messages = readMessages();
    // Sort descending by timestamp
    const sortedMessages = messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(sortedMessages);
});

// Route to delete a message by ID
app.delete('/api/messages/:id', (req, res) => {
    const { id } = req.params;
    let messages = readMessages();
    const originalLength = messages.length;
    messages = messages.filter(msg => msg.id !== id);

    if (messages.length === originalLength) {
        return res.status(404).json({ error: 'Message not found' });
    }

    writeMessages(messages);
    console.log(`[Database] Message ${id} deleted.`);
    res.json({ success: true, message: 'Message deleted successfully.' });
});

// Serve index.html for all other routes to support client routing if any
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  PORTFOLIO SYSTEM ENGINE ONLINE                       `);
    console.log(`  Access Local Interface: http://localhost:${PORT}      `);
    console.log(`  Database File Path: ${MESSAGES_FILE}                 `);
    console.log(`=======================================================`);
});

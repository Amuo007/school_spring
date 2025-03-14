const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Slider = require('../models/Slider');
const Staff = require('../models/Staff');
const Contact = require('../models/Contact');
const Settings = require('../models/Settings');
const nodemailer = require('nodemailer');

// Configure nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Home page
router.get('/', async (req, res) => {
    const recentEvents = await Event.find()
        .sort({ date: -1 })
        .limit(6);
    const sliders = await Slider.find()
        .sort({ order: 1 });
    const staff = await Staff.find();

    // Convert staff array to object for easier access
    const staffMap = staff.reduce((acc, member) => {
        acc[member.role] = member;
        return acc;
    }, {});

    res.render('index', {
        recentEvents,
        sliders,
        schoolInfo: {
            name: 'Spring School',
            ceo: staffMap.ceo?.name || 'Rajvinder Kaur',
            director: staffMap.director?.name || 'Balhar Singh',
            principal: staffMap.principal?.name || 'Deepika Sharma',
            address: 'Shiv Colony near new Sai Mandir, Bitna Road, Pinjore',
            contacts: ['9896567058', '9416140649']
        },
        staffImages: {
            ceo: staffMap.ceo?.imageUrl,
            director: staffMap.director?.imageUrl,
            principal: staffMap.principal?.imageUrl
        }
    });
});

// About page
router.get('/about', async (req, res) => {
    const staff = await Staff.find();
    const staffMap = staff.reduce((acc, member) => {
        acc[member.role] = member;
        return acc;
    }, {});

    res.render('about', {
        schoolInfo: {
            ceo: staffMap.ceo?.name || 'Rajvinder Kaur',
            director: staffMap.director?.name || 'Balhar Singh',
            principal: staffMap.principal?.name || 'Deepika Sharma'
        },
        staffImages: {
            ceo: staffMap.ceo?.imageUrl,
            director: staffMap.director?.imageUrl,
            principal: staffMap.principal?.imageUrl
        }
    });
});

// Gallery page
router.get('/gallery', async (req, res) => {
    const events = await Event.find().sort({ date: -1 });
    res.render('gallery', { events });
});

// Contact page
router.get('/contact', (req, res) => {
    res.render('contact', {
        contactInfo: {
            address: 'Shiv Colony near new Sai Mandir, Bitna Road, Pinjore',
            phones: ['9896567058', '9416140649']
        }
    });
});

// Handle contact form submission
router.post('/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // Save to database
        await Contact.create({
            name,
            email,
            subject,
            message
        });

        // Get notification email from settings
        const settings = await Settings.findOne() || await Settings.create({});
        
        // Send email notification
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: settings.notificationEmail,
            subject: `New Contact Form Submission: ${subject}`,
            text: `
Name: ${name}
Email: ${email}
Subject: ${subject}
Message: ${message}
            `,
            html: `
<h3>New Contact Form Submission</h3>
<p><strong>Name:</strong> ${name}</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Subject:</strong> ${subject}</p>
<p><strong>Message:</strong> ${message}</p>
            `
        };

        await transporter.sendMail(mailOptions);

        res.render('contact', {
            success: 'Your message has been sent successfully!',
            contactInfo: {
                address: 'Shiv Colony near new Sai Mandir, Bitna Road, Pinjore',
                phones: ['9896567058', '9416140649']
            }
        });
    } catch (error) {
        console.error('Contact form error:', error);
        res.render('contact', {
            error: 'Sorry, there was an error sending your message. Please try again.',
            contactInfo: {
                address: 'Shiv Colony near new Sai Mandir, Bitna Road, Pinjore',
                phones: ['9896567058', '9416140649']
            }
        });
    }
});

module.exports = router; 
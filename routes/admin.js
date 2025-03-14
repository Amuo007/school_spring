const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/auth');
const upload = require('../config/multer');
const Event = require('../models/Event');
const Slider = require('../models/Slider');
const Staff = require('../models/Staff');
const Contact = require('../models/Contact');
const Settings = require('../models/Settings');
const fs = require('fs');
const path = require('path');

// Helper function to delete old image
const deleteOldImage = (imagePath) => {
    if (imagePath) {
        const fullPath = path.join(__dirname, '..', 'public', imagePath);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
    }
};

// Admin dashboard
router.get('/', isAdmin, async (req, res) => {
    const events = await Event.find().sort({ createdAt: -1 });
    const sliders = await Slider.find().sort({ order: 1 });
    const staff = await Staff.find();
    const contacts = await Contact.find().sort({ createdAt: -1 });
    const settings = await Settings.findOne() || await Settings.create({});
    res.render('admin/dashboard', { 
        events, 
        sliders, 
        staff, 
        contacts,
        settings,
        contactCount: await Contact.countDocuments({ status: 'new' })
    });
});

// Event management
router.get('/events', isAdmin, async (req, res) => {
    const events = await Event.find().sort({ createdAt: -1 });
    res.render('admin/events', { events });
});

router.post('/events', isAdmin, upload.single('image'), async (req, res) => {
    try {
        const { title, description, date } = req.body;
        const imageUrl = `/uploads/${req.file.filename}`;

        await Event.create({
            title,
            description,
            date,
            imageUrl
        });

        res.redirect('/admin/events');
    } catch (error) {
        res.status(500).render('admin/events', { error: 'Error creating event' });
    }
});

router.delete('/events/:id', isAdmin, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (event) {
            deleteOldImage(event.imageUrl);
            await Event.findByIdAndDelete(req.params.id);
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// Slider management
router.post('/slider', isAdmin, upload.single('image'), async (req, res) => {
    try {
        const sliderCount = await Slider.countDocuments();
        if (sliderCount >= 5) {
            return res.status(400).render('admin/dashboard', { 
                error: 'Maximum limit of 5 sliders reached. Please delete an existing slider first.',
                events: await Event.find().sort({ createdAt: -1 }),
                sliders: await Slider.find().sort({ order: 1 }),
                staff: await Staff.find()
            });
        }

        const { title, description, order } = req.body;
        const imageUrl = `/uploads/${req.file.filename}`;

        await Slider.create({
            title,
            description,
            imageUrl,
            order: parseInt(order) || 0
        });

        res.redirect('/admin');
    } catch (error) {
        res.status(500).redirect('/admin');
    }
});

// Edit slider
router.post('/slider/:id', isAdmin, upload.single('image'), async (req, res) => {
    try {
        const { title, description, order } = req.body;
        const slider = await Slider.findById(req.params.id);
        
        if (!slider) {
            return res.status(404).redirect('/admin');
        }

        const updateData = {
            title,
            description,
            order: parseInt(order) || 0
        };

        // If new image is uploaded
        if (req.file) {
            deleteOldImage(slider.imageUrl);
            updateData.imageUrl = `/uploads/${req.file.filename}`;
        }

        await Slider.findByIdAndUpdate(req.params.id, updateData);
        res.redirect('/admin');
    } catch (error) {
        res.status(500).redirect('/admin');
    }
});

router.delete('/slider/:id', isAdmin, async (req, res) => {
    try {
        const slider = await Slider.findById(req.params.id);
        if (slider) {
            deleteOldImage(slider.imageUrl);
            await Slider.findByIdAndDelete(req.params.id);
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// Staff management
router.post('/staff', isAdmin, upload.single('image'), async (req, res) => {
    try {
        const { role, name } = req.body;
        const imageUrl = `/uploads/${req.file.filename}`;

        // Find existing staff member with same role
        const existingStaff = await Staff.findOne({ role });
        if (existingStaff) {
            // Delete old image
            deleteOldImage(existingStaff.imageUrl);
            // Update staff member
            await Staff.findByIdAndUpdate(existingStaff._id, {
                name,
                imageUrl
            });
        } else {
            // Create new staff member
            await Staff.create({
                role,
                name,
                imageUrl
            });
        }

        res.redirect('/admin');
    } catch (error) {
        res.status(500).redirect('/admin');
    }
});

// Contact management
router.post('/settings/email', isAdmin, async (req, res) => {
    try {
        const { notificationEmail } = req.body;
        const settings = await Settings.findOne() || new Settings();
        settings.notificationEmail = notificationEmail;
        await settings.save();
        res.redirect('/admin');
    } catch (error) {
        res.status(500).redirect('/admin');
    }
});

router.post('/contact/:id/status', isAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        await Contact.findByIdAndUpdate(req.params.id, { status });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

router.delete('/contact/:id', isAdmin, async (req, res) => {
    try {
        await Contact.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

module.exports = router; 
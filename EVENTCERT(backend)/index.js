require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const dns = require('dns');
const bcrypt = require('bcrypt');
const puppeteer = require('puppeteer');
const cors = require('cors');
const path = require('path');

const User = require('./models/User');
const Event = require('./models/Event');
const Registration = require('./models/Registration');
const checkRole = require('./middleware/checkRole');

dns.setServers(['8.8.8.8', '8.8.4.4']);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());
app.use(express.static('public'));

const MONGO_URI = process.env.MONGO_URI;

// ===============================
// MongoDB Connection
// ===============================

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB!'))
  .catch((err) => console.log('Connection failed:', err));

// ===============================
// USER REGISTRATION
// ===============================

app.post('/register', async (req, res) => {
  try {
    const {
      name,
      registerNumber,
      department,
      email,
      password
    } = req.body;

    const existingUser = await User.findOne({ registerNumber });

    if (existingUser) {
      return res.status(400).json({
        message: 'This register number is already registered.'
      });
    }

    const existingEmail = await User.findOne({ email });

    if (existingEmail) {
      return res.status(400).json({
        message: 'This email is already registered.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      registerNumber,
      department,
      email,
      password: hashedPassword
    });

    await newUser.save();

    res.status(201).json({
      message: 'Registered successfully!'
    });

  } catch (err) {
    res.status(500).json({
      message: 'Something went wrong.',
      error: err.message
    });
  }
});

// ===============================
// USER LOGIN
// ===============================

app.post('/login', async (req, res) => {
  try {
    const {
      email,
      password
    } = req.body;
    const createdBy = req.headers['x-user-id'];

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: 'Invalid email or password.'
      });
    }

    res.status(200).json({
      message: 'Login successful!',
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        department: user.department,
        permissions: user.permissions
      }
    });

  } catch (err) {
    res.status(500).json({
      message: 'Something went wrong.',
      error: err.message
    });
  }
});

// ===============================
// CREATE EVENT
// ===============================

app.post('/events', checkRole(['coordinator', 'admin'], 'createEvents'),
 async (req, res) => {
    try {
      console.log("CREATE EVENT REQUEST:", req.body);
console.log("USER ID:", req.headers['x-user-id']);
console.log("USER ROLE:", req.headers['x-user-role']);
      const {
        name,
        description,
        capacity,
        date,
        venue,
        category,
        certificateTemplate
      } = req.body;
      const createdBy = req.headers['x-user-id'];
      if (!capacity || capacity < 1) {
  return res.status(400).json({
    message: 'Event capacity must be at least 1.'
  });
}

      const newEvent = new Event({
        name,
        description,
        capacity,
        createdBy,
        date,
        venue,
        category,
        certificateTemplate
      });

      await newEvent.save();

      res.status(201).json({
        message: 'Event created!',
        event: newEvent
      });

    } catch (err) {
      res.status(500).json({
        message: 'Something went wrong.',
        error: err.message
      });
    }
  }
);

// ===============================
// GET ALL EVENTS
// ===============================

app.get('/events', async (req, res) => {
  try {
    const events = await Event.find();

    res.status(200).json(events);

  } catch (err) {
    res.status(500).json({
      message: 'Something went wrong.',
      error: err.message
    });
  }
});

// ===============================
// REGISTER FOR EVENT
// ===============================

app.post('/registrations', async (req, res) => {
  try {
    const {
      userId,
      eventId
    } = req.body;

    const existing = await Registration.findOne({
      user: userId,
      event: eventId
    });

    if (existing) {
      return res.status(400).json({
        message: 'You are already registered for this event.'
      });
    }
const event = await Event.findById(eventId);

if (!event) {
  return res.status(404).json({
    message: 'Event not found.'
  });
}

const registrationCount = await Registration.countDocuments({
  event: eventId
});
console.log(
  "Capacity:",
  event.capacity,
  "Registrations:",
  registrationCount
);

if (registrationCount >= event.capacity) {
  return res.status(400).json({
    message: 'This event is full.'
  });
}
    const newRegistration = new Registration({
      user: userId,
      event: eventId
    });

    await newRegistration.save();

    res.status(201).json({
      message: 'Registered for event successfully!',
      registration: newRegistration
    });

  } catch (err) {
    res.status(500).json({
      message: 'Something went wrong.',
      error: err.message
    });
  }
});

// ===============================
// MARK ATTENDANCE
// ===============================

app.patch(
  '/registrations/:id/attendance',
  checkRole(['coordinator', 'admin']),
  async (req, res) => {
    try {
      const { id } = req.params;

      const registration = await Registration
        .findById(id)
        .populate('event');

      if (!registration) {
        return res.status(404).json({
          message: 'Registration not found.'
        });
      }

      const userRole = req.headers['x-user-role'];
      const userId = req.headers['x-user-id'];

      // Admins can mark attendance for any event
      if (userRole !== 'admin') {

        const user = await User.findById(userId);

        if (!user) {
          return res.status(403).json({
            message: 'User not found.'
          });
        }

        const eventId = registration.event._id.toString();

        const isEventCreator =
          registration.event.createdBy &&
          registration.event.createdBy.toString() === userId;

        const hasAttendanceAccess =
          user.attendanceEvents &&
          user.attendanceEvents.some(
            event => event.toString() === eventId
          );

        if (!isEventCreator && !hasAttendanceAccess) {
          return res.status(403).json({
            message:
              'You do not have attendance access for this event.'
          });
        }
      }

      registration.attended = true;

      await registration.save();

      res.status(200).json({
        message: 'Attendance marked!',
        registration
      });

    } catch (err) {
      res.status(500).json({
        message: 'Something went wrong.',
        error: err.message
      });
    }
  }
);
// GET ALL REGISTRATIONS
// ===============================

app.get(
  '/registrations',
  checkRole(['coordinator', 'admin']),
  async (req, res) => {
    try {
      const userRole = req.headers['x-user-role'];
      const userId = req.headers['x-user-id'];

      let registrations;

      // Admins can see all registrations
      if (userRole === 'admin') {
        registrations = await Registration
          .find()
          .populate('user')
          .populate('event');

      } else {
        const user = await User.findById(userId);

        if (!user) {
          return res.status(403).json({
            message: 'User not found.'
          });
        }

        const accessibleEventIds = user.attendanceEvents || [];

        registrations = await Registration
          .find()
          .populate('user')
          .populate('event');

        registrations = registrations.filter((registration) => {
          if (!registration.event) {
            return false;
          }

          const eventId =
            registration.event._id.toString();

          const createdBy =
            registration.event.createdBy
              ? registration.event.createdBy.toString()
              : null;

          const isEventCreator =
            createdBy === userId;

          const hasAttendanceAccess =
            accessibleEventIds.some(
              id => id.toString() === eventId
            );

          return isEventCreator || hasAttendanceAccess;
        });
      }

      res.status(200).json(registrations);

    } catch (err) {
      res.status(500).json({
        message: 'Something went wrong.',
        error: err.message
      });
    }
  }
);
// ===============================
// UPDATE USER PERMISSIONS
// ===============================

app.patch(
  '/users/:id/permissions',
  checkRole(['admin']),
  async (req, res) => {
    try {
      const { createEvents } = req.body;

      const user = await User.findByIdAndUpdate(
        req.params.id,
        {
          'permissions.createEvents': createEvents
        },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({
          message: 'User not found.'
        });
      }

      res.json({
        message: 'Permissions updated successfully.',
        user
      });

    } catch (error) {
      res.status(500).json({
        message: 'Failed to update permissions.'
      });
    }
  }
);
// ===============================
// UPDATE ATTENDANCE ACCESS
// ===============================

app.patch(
  '/users/:id/attendance-access',
  checkRole(['admin']),
  async (req, res) => {
    try {
      const { eventId, allowed } = req.body;

      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          message: 'User not found.'
        });
      }

      if (user.role !== 'coordinator') {
        return res.status(400).json({
          message: 'Only coordinators can receive attendance access.'
        });
      }

      if (allowed) {
        if (!user.attendanceEvents.includes(eventId)) {
          user.attendanceEvents.push(eventId);
        }
      } else {
        user.attendanceEvents =
          user.attendanceEvents.filter(
            id => id.toString() !== eventId
          );
      }

      await user.save();

      res.json({
        message: allowed
          ? 'Attendance access granted.'
          : 'Attendance access removed.',
        user
      });

    } catch (error) {
      res.status(500).json({
        message: 'Failed to update attendance access.'
      });
    }
  }
);

// ===============================
// GET ALL USERS
// ===============================

app.get(
  '/users',
  checkRole(['admin']),
  async (req, res) => {
    try {
      const users = await User
        .find()
        .select('-password');

      res.status(200).json(users);

    } catch (err) {
      res.status(500).json({
        message: 'Something went wrong.',
        error: err.message
      });
    }
  }
);

// ===============================
// UPDATE USER ROLE
// ===============================

app.patch(
  '/users/:id/role',
  checkRole(['admin']),
  async (req, res) => {
    try {
      const {
        id
      } = req.params;

      const {
        role
      } = req.body;

      if (
        !['participant', 'coordinator', 'admin'].includes(role)
      ) {
        return res.status(400).json({
          message: 'Invalid role.'
        });
      }

      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({
          message: 'User not found.'
        });
      }

      user.role = role;

      await user.save();

      res.status(200).json({
        message: 'Role updated!',
        user
      });
     

    } catch (err) {
      res.status(500).json({
        message: 'Something went wrong.',
        error: err.message
      });
    }
  }
);

// ===============================
// GENERATE CERTIFICATE
// ===============================

app.get(
  '/registrations/:id/certificate',
  async (req, res) => {
    try {
      const {
        id
      } = req.params;

      const registration = await Registration
        .findById(id)
        .populate('user')
        .populate('event');

      if (!registration) {
        return res.status(404).json({
          message: 'Registration not found.'
        });
      }

      if (!registration.attended) {
        return res.status(400).json({
          message:
            'Certificate not available — attendance not marked yet.'
        });
      }

      const templateFile = path.join(
        __dirname,
        'certificates',
        `${registration.event.certificateTemplate}.html`
      );

      let html = require('fs').readFileSync(
        templateFile,
        'utf8'
      );

      const dateStr = new Date(
        registration.event.date
      ).toLocaleDateString(
        'en-GB',
        {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }
      );

      const certId =
        'EC-' +
        registration._id
          .toString()
          .slice(-6)
          .toUpperCase();

      html = html
        .replace(
          /{{name}}/g,
          registration.user.name
        )
        .replace(
          /{{eventName}}/g,
          registration.event.name
        )
        .replace(
          /{{date}}/g,
          dateStr
        )
        .replace(
          /{{venue}}/g,
          registration.event.venue || 'the venue'
        )
        .replace(
          /{{certId}}/g,
          certId
        );

      const browser = await puppeteer.launch({
        headless: 'new'
      });

      const page = await browser.newPage();

      await page.setContent(html);

      const pdfBuffer = await page.pdf({
        width: '1400px',
        height: '990px',
        printBackground: true
      });

      await browser.close();

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition':
          `attachment; filename=certificate-${certId}.pdf`
      });

      res.send(pdfBuffer);

    } catch (err) {
      res.status(500).json({
        message: 'Something went wrong.',
        error: err.message
      });
    }
  }
);

// ===============================
// GET USER REGISTRATIONS
// ===============================

app.get(
  '/users/:userId/registrations',
  async (req, res) => {
    try {
      const {
        userId
      } = req.params;

      const registrations = await Registration
        .find({
          user: userId
        })
        .populate('event');

      res.status(200).json(registrations);

    } catch (err) {
      res.status(500).json({
        message: 'Something went wrong.',
        error: err.message
      });
    }
  }
);

// ===============================
// GET USER CERTIFICATES
// ===============================

app.get(
  '/users/:userId/certificates',
  async (req, res) => {
    try {
      const {
        userId
      } = req.params;

      const registrations = await Registration
        .find({
          user: userId,
          attended: true
        })
        .populate('event');

      res.status(200).json(registrations);

    } catch (err) {
      res.status(500).json({
        message: 'Something went wrong.',
        error: err.message
      });
    }
  }
);

// ===============================
// START SERVER
// ===============================

app.listen(PORT, () => {
  console.log(
    `Server running at http://localhost:${PORT}`
  );
});
// Import required modules
const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const session = require('express-session');
require('dotenv').config(); // Load environment variables from .env file
const bcrypt = require('bcryptjs');// Import bcrypt for password hashing
const multer = require('multer');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// CORS configuration - MUST be first
app.use(cors({
    origin: ['http://0.0.0.0:3000', 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests
app.options('*', cors());

// Configure middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up session management
app.use(session({
    secret: 'your_secret_key', // Change this to a random secret key
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false,
        sameSite: 'lax' // Important for cross-origin requests
    }
}));

// Set up MySQL connection
const db = mysql.createConnection({
    host: 'mysql-service',       // Kubernetes service name
    user: 'appuser',             // The app-specific user you created
    password: 'app_password',    // The password you set
    database: 'user_profiles'    // Your app database
});

// Connect to MySQL
db.connect(err => {
    if (err) {
        console.error('MySQL connection failed:', err);
        return;
    }
    console.log('MySQL Connected...');
});

// Serve static files including uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve HTML pages
app.get('/', (req, res) => {
    if (req.session.user) {
        // If user is logged in, go to index.html
        res.redirect('/index.html');
    } else {
        // Otherwise, show login page
        res.redirect('/login.html');
    }
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/signin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'signin.html'));
});

app.get('/index.html', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login.html');
    }
    res.sendFile(path.join(__dirname, 'index.html'));
});


app.get('/profile.html', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login.html');
    }
    res.sendFile(path.join(__dirname, 'profile.html'));
});


// Login functionality
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const query = 'SELECT * FROM users WHERE email = ?';

    db.query(query, [email], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Internal Server Error');
        }

        if (results.length > 0) {
            const user = results[0];

            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) {
                    console.error('Error comparing passwords:', err);
                    return res.status(500).send('Internal Server Error');
                }

                if (isMatch) {
                    if (user.blocked === 1) {
                        return res.send(`<html>Your account is blocked.</html>`);
                    }

                    req.session.user = user;

                    // Check if profile exists
                    const profileQuery = 'SELECT * FROM profiles WHERE email = ?';
                    db.query(profileQuery, [email], (err, profileResults) => {
                        if (err) {
                            console.error('Error checking profile:', err);
                            return res.status(500).send('Internal Server Error');
                        }

                        if (profileResults.length > 0) {
                            // Profile exists; redirect to index
                            return res.redirect('/index.html');
                        } else {
                            // No profile; redirect to profile creation
                            return res.redirect('/profile.html');
                        }
                    });
                } else {
                    return res.send('Invalid credentials!');
                }
            });
        } else {
            return res.send('Invalid credentials!');
        }
    });
});


// Function to validate email domain
function isValidEmail(email) {
    const domain = '@karunya.edu.in';
    return email.endsWith(domain);
}

// Signin route
app.post('/signin', (req, res) => {
    const { email, password } = req.body;

    // Validate email
    if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Invalid email address. Please use a @karunya.edu.in email.' });
    }

    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            return res.status(500).send('Error hashing password: ' + err);
        }

        const insertQuery = 'INSERT INTO users (email, password) VALUES (?, ?)';
        db.query(insertQuery, [email, hashedPassword], (err) => {
            if (err) {
                return res.status(500).send('Error saving user: ' + err);
            }

            // Store user in session after signup
            req.session.user = { email };
            return res.redirect('/profile.html');
        });
    });
});

app.use(express.static(path.join(__dirname), { index: false })); // Serve static files from the project root

// Configure Multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Save files to 'uploads/' directory
    },
    filename: (req, file, cb) => {
        const originalExt = path.extname(file.originalname); // Extract original file extension
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${originalExt}`;
        cb(null, uniqueName); // Set filename as unique
    }
});

// Set up Multer with customized storage
const upload = multer({ storage });

app.post('/profile', upload.single('profilePic'), (req, res) => {
    if (!req.session.user) {
        console.log('User not logged in');
        return res.status(403).send('Not logged in');
    }

    const { email } = req.session.user; // Get the logged-in user's email from the session
    const { degree, year, project, projectDate, profilename, oldproject } = req.body; // Profile form data

    console.log('Received profile data:', { email, degree, year, project, projectDate, oldproject });

    if (!degree || !year || !project || !projectDate || !profilename || !oldproject) {
        console.log('Missing required fields');
        return res.status(400).send('All fields are required!');
    }

    // Handle profile picture upload path with original extension
    const profilePicPath = req.file ? path.join('uploads', req.file.filename) : null;

    // Modify the insert query to include oldproject
    const insertQuery = 'INSERT INTO profiles (email, name, degree, year, project, project_date, profile_pic, oldproject) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(insertQuery, [email, profilename, degree, year, project, projectDate, profilePicPath, oldproject], (err) => {
        if (err) {
            console.error('Error saving profile:', err);
            return res.status(500).send('Error saving profile');
        }

        console.log('Profile saved successfully for', email);
        res.redirect('/index.html');
    });
});

// Serve profile page data
app.get('/viewProfile', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login.html');
    }

    const { email } = req.session.user; // Get the logged-in user's email from the session

    const query = 'SELECT * FROM profiles WHERE email = ?';
    db.query(query, [email], (err, results) => {
        if (err) {
            console.error('Error fetching profile:', err);
            return res.status(500).send('Internal Server Error');
        }

        if (results.length > 0) {
            const profile = results[0]; // Assuming one profile per email
            res.json({ profile });
        } else {
            console.log('No profile found for', email);
            res.status(404).send('Profile not found');
        }
    });
});

// Get Profile - FIXED: Use relative paths for images
app.get('/getProfile', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'User not logged in' });
    }

    const email = req.session.user.email;
    const query = 'SELECT * FROM profiles WHERE email = ?';
    db.query(query, [email], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch profile' });
        }

        if (results.length > 0) {
            const profile = results[0];
            // FIX: Use relative path instead of hardcoded localhost
            const imagePath = profile.profile_pic ? `/uploads/${path.basename(profile.profile_pic)}` : '/uploads/default.jpg';
            res.json({ 
                profile: profile, 
                imagePath: imagePath 
            });
        } else {
            res.json({ profile: null });
        }
    });
});

app.post('/updateProfile', upload.single('profilePic'), (req, res) => {
    const { email } = req.session.user; // Assuming the user is logged in
    const { name, degree, year, project, project_date, oldproject } = req.body;

    // Check if required fields are provided
    if (!name || !degree || !year || !project || !project_date) {
        return res.status(400).send('All fields are required!');
    }

    // Handle profile picture update if new file is uploaded
    let updateQuery;
    let queryParams;

    if (req.file) {
        const profilePicPath = path.join('uploads', req.file.filename);
        updateQuery = `
            UPDATE profiles
            SET name = ?, degree = ?, year = ?, project = ?, project_date = ?, oldproject = ?, profile_pic = ?
            WHERE email = ?
        `;
        queryParams = [name, degree, year, project, project_date, oldproject, profilePicPath, email];
    } else {
        updateQuery = `
            UPDATE profiles
            SET name = ?, degree = ?, year = ?, project = ?, project_date = ?, oldproject = ?
            WHERE email = ?
        `;
        queryParams = [name, degree, year, project, project_date, oldproject, email];
    }

    // Update the profile in the database
    db.query(updateQuery, queryParams, (err) => {
        if (err) {
            console.error('Error updating profile:', err);
            return res.status(500).send('Error updating profile');
        }

        res.send('Profile updated successfully');
    });
});

// API to fetch profiles by year
app.get('/getProfilesByYear', (req, res) => {
    const year = req.query.year; // Query parameter for year

    if (!year) {
        console.error('Year parameter is missing.');
        return res.status(400).json({ error: 'Year parameter is missing.' });
    }

    // Log the year value to make sure it's being passed correctly
    console.log('Fetching profiles for year:', year);

    // Query to fetch profiles based on the year
    const query = 'SELECT * FROM profiles WHERE year = ?';
    db.query(query, [year], (err, results) => {
        if (err) {
            console.error('Error fetching profiles by year:', err);
            return res.status(500).json({ error: 'Failed to fetch profiles by year' });
        }

        if (results.length > 0) {
            // Fix image paths for all profiles
            const profilesWithFixedPaths = results.map(profile => ({
                ...profile,
                profile_pic: profile.profile_pic ? `/uploads/${path.basename(profile.profile_pic)}` : '/uploads/default.jpg'
            }));
            
            console.log('Profiles fetched:', profilesWithFixedPaths.length);
            res.json({ profiles: profilesWithFixedPaths });
        } else {
            console.log('No profiles found for year:', year);
            res.json({ profiles: [], message: `No profiles found for year: ${year}` });
        }
    });
});

// API route to fetch user details from session based on email
app.get('/getUserDetails', (req, res) => {
    if (!req.session.user) {
        return res.json({ error: 'Session expired' });
    }

    const { email } = req.session.user;  // Use email from session
    const query = 'SELECT id, name, email FROM profiles WHERE email = ?';

    db.query(query, [email], (err, results) => {
        if (err) {
            console.error('Error fetching user details:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        if (results.length > 0) {
            const user = results[0];
            res.json({ id: user.id, name: user.name, email: user.email });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    });
});

// API route to send a message based on email
app.post('/sendMessage', upload.single('image'), (req, res) => {
    const { text } = req.body;
    const sender_email = req.session.user.email;  // Assuming session contains the logged-in user's email

    // Log the sender_email to ensure it's correct
    console.log('Sender Email:', sender_email);

    // Check if sender_email exists in session
    if (!sender_email) {
        console.log('No sender email in session.');
        return res.status(400).json({ message: 'Sender email is required or session is expired.' });
    }

    // Handle image upload
    const image = req.file ? req.file.filename : null;
    console.log('Received Image:', image);

    // Get all user emails from the profiles table except the sender's email
    const getReceiversQuery = 'SELECT id, email FROM profiles WHERE email != ?';
    db.query(getReceiversQuery, [sender_email], (err, result) => {
        if (err) {
            console.error('Error fetching receivers:', err);
            return res.status(500).json({ message: 'Error fetching receivers', error: err });
        }

        // If no receivers are found, return an appropriate message
        if (result.length === 0) {
            console.log('No receivers found.');
            return res.status(404).json({ message: 'No other users found to send message to' });
        }

        // Extract receiver emails
        const receivers = result.map(user => user.email);
        console.log('Receiver Emails:', receivers);

        // Verify sender_email exists in users table
        const checkSenderQuery = 'SELECT id FROM users WHERE email = ?';
        db.query(checkSenderQuery, [sender_email], (err, senderResult) => {
            if (err || senderResult.length === 0) {
                console.log('Sender email not found in users table.');
                return res.status(400).json({ message: 'Invalid sender email, user not found in the system.' });
            }

            // Check if all receivers exist in users table
            const checkReceiversQuery = 'SELECT email FROM users WHERE email IN (?)';
            db.query(checkReceiversQuery, [receivers], (err, receiverResults) => {
                if (err) {
                    console.error('Error checking receivers:', err);
                    return res.status(500).json({ message: 'Error checking receivers', error: err });
                }

                const validReceiverEmails = receiverResults.map(row => row.email);
                const invalidReceiverEmails = receivers.filter(email => !validReceiverEmails.includes(email));

                if (invalidReceiverEmails.length > 0) {
                    console.log('Invalid receiver emails:', invalidReceiverEmails);
                    return res.status(400).json({ message: 'Some receiver emails are invalid: ' + invalidReceiverEmails.join(', ') });
                }

                // All checks passed, proceed to insert messages
                const insertQuery = 'INSERT INTO messages (sender_email, receiver_email, text, image) VALUES (?, ?, ?, ?)';
                console.log('Inserting messages...');
                
                // Create a list of insert promises for each receiver
                const insertPromises = receivers.map(receiver_email => {
                    return new Promise((resolve, reject) => {
                        db.query(insertQuery, [sender_email, receiver_email, text, image], (err, result) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(result);
                            }
                        });
                    });
                });

                // Wait for all insert operations to complete
                Promise.all(insertPromises)
                    .then(() => {
                        console.log('Messages sent successfully.');
                        res.status(200).json({ message: 'Message sent to all users successfully' });
                    })
                    .catch((err) => {
                        console.error('Error sending messages:', err);
                        res.status(500).json({ message: 'Error sending message', error: err });
                    });
            });
        });
    });
});

// Get messages route
app.get('/getMessages', (req, res) => {
    const { senderEmail, receiverEmails } = req.query;

    if (!senderEmail || !receiverEmails) {
        return res.status(400).json({ error: 'Sender email and receiver emails are required' });
    }

    // Parse receiverEmails to an array
    const receivers = receiverEmails.split(',');

    // Construct the query for multiple receivers
    const query = `
        SELECT * FROM messages
        WHERE (sender_email = ? AND receiver_email IN (?))
        OR (receiver_email = ? AND sender_email IN (?))
        ORDER BY created_at DESC;
    `;

    // Run the query
    db.query(query, [senderEmail, receivers, senderEmail, receivers], (err, results) => {
        if (err) {
            console.error('Error fetching messages:', err);
            return res.status(500).json({ error: 'Failed to fetch messages' });
        }
        res.json(results);
    });
});

// Logout route
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Could not log out' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Logout successful' });
    });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
    console.log(`Also accessible via http://localhost:${port}`);
});
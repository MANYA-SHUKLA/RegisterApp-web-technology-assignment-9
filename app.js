const express = require('express');
const { body, validationResult } = require('express-validator');
const UserDataManager = require('./fileManager');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const userManager = new UserDataManager();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// Validation rules
const validateForm = [
    body('firstName')
        .trim()
        .isLength({ min: 2 })
        .withMessage('First name must be at least 2 characters long')
        .isAlpha('en-US', { ignore: ' -' })
        .withMessage('First name can only contain letters'),
    
    body('lastName')
        .trim()
        .isLength({ min: 2 })
        .withMessage('Last name must be at least 2 characters long')
        .isAlpha('en-US', { ignore: ' -' })
        .withMessage('Last name can only contain letters'),
    
    body('email')
        .trim()
        .isEmail()
        .withMessage('Please enter a valid email address')
        .normalizeEmail(),
    
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain uppercase, lowercase, and number'),
    
    body('confirmPassword')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords do not match');
            }
            return true;
        })
];

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/users', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'users.html'));
});

// API Routes
app.post('/api/register', validateForm, async (req, res) => {
    try {
        const errors = validationResult(req);
        
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { firstName, lastName, email, password } = req.body;
        
        const userData = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.toLowerCase().trim(),
            password: password
        };

        const storedUser = await userManager.addUser(userData);

        res.json({
            success: true,
            message: 'Registration successful!',
            user: {
                id: storedUser.id,
                firstName: storedUser.firstName,
                lastName: storedUser.lastName,
                email: storedUser.email
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        
        if (error.message === 'User with this email already exists') {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const users = await userManager.getAllUsers();
        const userCount = await userManager.getUserCount();
        
        res.json({
            success: true,
            count: userCount,
            users: users.map(user => ({
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                registrationDate: user.registrationDate
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error reading user data'
        });
    }
});

// Health check route for Render
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'Form Validation App'
    });
});

// Initialize server
async function startServer() {
    try {
        await userManager.initialize();
        
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📝 Form: http://localhost:${PORT}/`);
            console.log(`👥 Users: http://localhost:${PORT}/users`);
            console.log(`❤️ Health: http://localhost:${PORT}/health`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
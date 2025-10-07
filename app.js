const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const methodOverride = require('method-override');
require('dotenv').config();

const { initializeDatabase, userModel } = require('./src/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Set EJS as template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, 'profile-' + uniqueSuffix + fileExtension);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: process.env.MAX_FILE_SIZE || 5000000 // 5MB default
  },
  fileFilter: fileFilter
});

// Routes

// Home page - display all users
app.get('/', async (req, res) => {
  try {
    const users = await userModel.getAll();
    res.render('index', { 
      users, 
      success: req.query.success,
      error: req.query.error 
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.render('index', { 
      users: [], 
      error: 'Failed to fetch users' 
    });
  }
});

// Add user page
app.get('/add', (req, res) => {
  res.render('add-user', { error: null });
});

// Edit user page (must come before /users/:id to avoid conflict)
app.get('/users/:id/edit', async (req, res) => {
  try {
    const user = await userModel.getById(req.params.id);
    if (!user) {
      return res.render('404', { 
        message: 'User not found', 
        backUrl: '/' 
      });
    }
    res.render('edit-user', { user, error: null });
  } catch (error) {
    console.error('Error fetching user for edit:', error);
    res.render('error', { 
      error: 'Failed to fetch user for editing',
      backUrl: '/'
    });
  }
});

// Handle user update from form
app.put('/users/:id', upload.single('profileImage'), async (req, res) => {
  try {
    const { name, email, removeImage } = req.body;
    const userId = req.params.id;
    
    // Validation
    if (!name || !email) {
      const user = await userModel.getById(userId);
      return res.render('edit-user', { 
        user, 
        error: 'Name and email are required' 
      });
    }

    // Check if email already exists for different user
    const existingUser = await userModel.getByEmail(email);
    if (existingUser && existingUser.id != userId) {
      const user = await userModel.getById(userId);
      return res.render('edit-user', { 
        user,
        error: 'Email address is already in use by another user' 
      });
    }

    // Get current user data
    const currentUser = await userModel.getById(userId);
    if (!currentUser) {
      return res.render('404', { 
        message: 'User not found', 
        backUrl: '/' 
      });
    }

    // Handle profile image
    let profileImage = currentUser.profile_image;
    
    // If removing current image
    if (removeImage === 'true') {
      // Delete old image file if exists
      if (currentUser.profile_image) {
        const oldImagePath = path.join(__dirname, 'uploads', currentUser.profile_image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      profileImage = null;
    }
    
    // If new image uploaded
    if (req.file) {
      // Delete old image file if exists and we're not explicitly removing
      if (currentUser.profile_image && removeImage !== 'true') {
        const oldImagePath = path.join(__dirname, 'uploads', currentUser.profile_image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      profileImage = req.file.filename;
    }
    
    const updatedUser = await userModel.update(userId, name, email, profileImage);
    
    console.log('✅ User updated:', updatedUser);
    res.redirect('/?success=User updated successfully');
  } catch (error) {
    console.error('❌ Error updating user:', error);
    const user = await userModel.getById(req.params.id);
    res.render('edit-user', { 
      user,
      error: 'Failed to update user. Please try again.' 
    });
  }
});

// User detail page (must come after specific routes)
app.get('/users/:id', async (req, res) => {
  try {
    const user = await userModel.getById(req.params.id);
    if (!user) {
      return res.render('404', { 
        message: 'User not found', 
        backUrl: '/' 
      });
    }
    res.render('user-detail', { user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.render('error', { 
      error: 'Failed to fetch user details',
      backUrl: '/'
    });
  }
});

// Handle user creation
app.post('/users', upload.single('profileImage'), async (req, res) => {
  try {
    const { name, email } = req.body;
    
    // Validation
    if (!name || !email) {
      return res.render('add-user', { 
        error: 'Name and email are required' 
      });
    }

    // Check if user already exists
    const existingUser = await userModel.getByEmail(email);
    if (existingUser) {
      return res.render('add-user', { 
        error: 'User with this email already exists' 
      });
    }

    const profileImage = req.file ? req.file.filename : null;
    const newUser = await userModel.create(name, email, profileImage);
    
    console.log('✅ New user created:', newUser);
    res.redirect('/?success=User created successfully');
  } catch (error) {
    console.error('❌ Error creating user:', error);
    res.render('add-user', { 
      error: 'Failed to create user. Please try again.' 
    });
  }
});

// Get single user (API endpoint)
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await userModel.getById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users (API endpoint)
app.get('/api/users', async (req, res) => {
  try {
    const users = await userModel.getAll();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user
app.put('/api/users/:id', upload.single('profileImage'), async (req, res) => {
  try {
    const { name, email } = req.body;
    const profileImage = req.file ? req.file.filename : null;
    
    const updatedUser = await userModel.update(req.params.id, name, email, profileImage);
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user
app.delete('/api/users/:id', async (req, res) => {
  try {
    const deletedUser = await userModel.delete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Delete profile image if exists
    if (deletedUser.profile_image) {
      const imagePath = path.join(__dirname, 'uploads', deletedUser.profile_image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('404');
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Application error:', error);
  
  // Handle multer errors
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.render('add-user', { 
        error: 'File too large. Maximum size is 5MB.' 
      });
    }
  }
  
  if (error.message === 'Only image files are allowed!') {
    return res.render('add-user', { 
      error: 'Only image files (JPEG, JPG, PNG, GIF, WEBP) are allowed.' 
    });
  }
  
  res.status(500).render('error', { 
    error: 'Something went wrong!' 
  });
});

// Initialize database and start server
async function startServer() {
  try {
    console.log('🔄 Initializing database...');
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Server shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Server shutting down gracefully...');
  process.exit(0);
});

startServer();

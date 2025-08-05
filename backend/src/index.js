// Main backend server file
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { auth } from './firebaseConfig.js';
import { 
  signUp, 
  signIn, 
  signInAnon, 
  signOutUser, 
  resetPassword,
  getCurrentUser,
  isAuthenticated 
} from './auth.js';
import { 
  addComplaint, 
  getComplaints, 
  getComplaintById, 
  updateComplaint, 
  deleteComplaint,
  getComplaintsByUser,
  getComplaintsByCategory,
  getComplaintsByStatus,
  addAlert,
  getAlerts
} from './firestore.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8081',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Authentication middleware
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Neighborhood-Aware Backend'
  });
});

// Authentication routes
app.post('/auth/signup', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await signUp(email, password, displayName);
    res.status(201).json({ 
      message: 'User created successfully',
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await signIn(email, password);
    res.json({ 
      message: 'User signed in successfully',
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      }
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/auth/anonymous', async (req, res) => {
  try {
    const user = await signInAnon();
    res.json({ 
      message: 'Anonymous sign in successful',
      user: {
        uid: user.uid,
        isAnonymous: user.isAnonymous
      }
    });
  } catch (error) {
    console.error('Anonymous signin error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/auth/signout', authenticateUser, async (req, res) => {
  try {
    await signOutUser();
    res.json({ message: 'User signed out successfully' });
  } catch (error) {
    console.error('Signout error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/auth/reset-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    await resetPassword(email);
    res.json({ message: 'Password reset email sent successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Complaints routes
app.post('/complaints', authenticateUser, async (req, res) => {
  try {
    const { text, category, location, images } = req.body;
    
    if (!text || !category || !location) {
      return res.status(400).json({ 
        error: 'Text, category, and location are required' 
      });
    }

    const complaint = {
      text,
      category,
      location,
      userId: req.user.uid,
      images: images || [],
      status: 'pending'
    };

    const complaintId = await addComplaint(complaint);
    res.status(201).json({ 
      message: 'Complaint added successfully',
      complaintId 
    });
  } catch (error) {
    console.error('Add complaint error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.get('/complaints', authenticateUser, async (req, res) => {
  try {
    const { category, status, limit = 50 } = req.query;
    let complaints;

    if (category) {
      complaints = await getComplaintsByCategory(category);
    } else if (status) {
      complaints = await getComplaintsByStatus(status);
    } else {
      complaints = await getComplaints();
    }

    // Apply limit
    complaints = complaints.slice(0, parseInt(limit));
    
    res.json({ complaints });
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.get('/complaints/user', authenticateUser, async (req, res) => {
  try {
    const complaints = await getComplaintsByUser(req.user.uid);
    res.json({ complaints });
  } catch (error) {
    console.error('Get user complaints error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.get('/complaints/:id', authenticateUser, async (req, res) => {
  try {
    const complaint = await getComplaintById(req.params.id);
    res.json({ complaint });
  } catch (error) {
    console.error('Get complaint error:', error);
    res.status(404).json({ error: error.message });
  }
});

app.put('/complaints/:id', authenticateUser, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const updates = {};
    
    if (status) updates.status = status;
    if (notes) updates.notes = notes;

    await updateComplaint(req.params.id, updates);
    res.json({ message: 'Complaint updated successfully' });
  } catch (error) {
    console.error('Update complaint error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.delete('/complaints/:id', authenticateUser, async (req, res) => {
  try {
    await deleteComplaint(req.params.id);
    res.json({ message: 'Complaint deleted successfully' });
  } catch (error) {
    console.error('Delete complaint error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Alerts routes
app.post('/alerts', authenticateUser, async (req, res) => {
  try {
    const { type, title, message, location, radius } = req.body;
    
    if (!type || !title || !message) {
      return res.status(400).json({ 
        error: 'Type, title, and message are required' 
      });
    }

    const alert = {
      type,
      title,
      message,
      location,
      radius,
      createdBy: req.user.uid
    };

    const alertId = await addAlert(alert);
    res.status(201).json({ 
      message: 'Alert added successfully',
      alertId 
    });
  } catch (error) {
    console.error('Add alert error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.get('/alerts', authenticateUser, async (req, res) => {
  try {
    const alerts = await getAlerts();
    res.json({ alerts });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(400).json({ error: error.message });
  }
});

// User profile routes
app.get('/user/profile', authenticateUser, async (req, res) => {
  try {
    const user = getCurrentUser();
    res.json({ 
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        isAnonymous: user.isAnonymous
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Neighborhood-Aware Backend server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:8081'}`);
});

export default app; 
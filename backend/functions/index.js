/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Complaint routing function - triggered when a new complaint is created
exports.routeComplaint = functions.firestore
  .document('complaints/{complaintId}')
  .onCreate(async (snapshot, context) => {
    const complaint = snapshot.data();
    const { text, category, location, userId } = complaint;
    const complaintId = context.params.complaintId;

    console.log(`New complaint received: ${text}`);
    console.log(`Category: ${category}, Location: ${location?.lat}, ${location?.lng}`);

    try {
      // Update complaint status to 'processing'
      await admin.firestore().collection('complaints').doc(complaintId).update({
        status: 'processing',
        processedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Route based on category
      let department = '';
      let priority = 'medium';

      switch (category) {
        case 'streetlight':
          department = 'KMC (Karachi Metropolitan Corporation)';
          priority = 'high';
          break;
        case 'water':
          department = 'KW&SB (Karachi Water & Sewerage Board)';
          priority = 'high';
          break;
        case 'garbage':
          department = 'KMC (Karachi Metropolitan Corporation)';
          priority = 'medium';
          break;
        case 'road':
          department = 'KMC (Karachi Metropolitan Corporation)';
          priority = 'high';
          break;
        case 'sewage':
          department = 'KW&SB (Karachi Water & Sewerage Board)';
          priority = 'high';
          break;
        case 'noise':
          department = 'Police Department';
          priority = 'low';
          break;
        case 'security':
          department = 'Police Department';
          priority = 'high';
          break;
        default:
          department = 'General Administration';
          priority = 'medium';
      }

      // Update complaint with routing information
      await admin.firestore().collection('complaints').doc(complaintId).update({
        department: department,
        priority: priority,
        routedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'routed'
      });

      // Create an alert for the neighborhood
      await admin.firestore().collection('alerts').add({
        type: 'new_complaint',
        title: `New ${category} complaint reported`,
        message: `A ${category} issue has been reported in your area and has been routed to ${department}`,
        location: location,
        complaintId: complaintId,
        category: category,
        priority: priority,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`Complaint routed to ${department} with priority ${priority}`);

      return null;
    } catch (error) {
      console.error('Error routing complaint:', error);
      
      // Update complaint status to 'error'
      await admin.firestore().collection('complaints').doc(complaintId).update({
        status: 'error',
        errorMessage: error.message
      });

      throw error;
    }
  });

// Function to classify complaint text using simple keyword matching
exports.classifyComplaint = functions.https.onCall(async (data, context) => {
  const { text } = data;

  if (!text) {
    throw new functions.https.HttpsError('invalid-argument', 'Text is required');
  }

  const lowerText = text.toLowerCase();
  let category = 'general';
  let confidence = 0.5;

  // Simple keyword-based classification
  const keywords = {
    'streetlight': ['light', 'streetlight', 'lamp', 'dark', 'illumination', 'bulb'],
    'water': ['water', 'supply', 'leak', 'pipe', 'tap', 'drainage'],
    'garbage': ['garbage', 'trash', 'waste', 'rubbish', 'litter', 'clean'],
    'road': ['road', 'street', 'pothole', 'asphalt', 'pavement', 'surface'],
    'sewage': ['sewage', 'sewer', 'drain', 'blocked', 'overflow', 'smell'],
    'noise': ['noise', 'loud', 'sound', 'disturbance', 'music', 'construction'],
    'security': ['security', 'theft', 'robbery', 'safety', 'police', 'crime']
  };

  for (const [cat, words] of Object.entries(keywords)) {
    const matches = words.filter(word => lowerText.includes(word)).length;
    if (matches > 0) {
      const matchRatio = matches / words.length;
      if (matchRatio > confidence) {
        category = cat;
        confidence = matchRatio;
      }
    }
  }

  return {
    category: category,
    confidence: confidence
  };
});

// Function to get complaint statistics
exports.getComplaintStats = functions.https.onCall(async (data, context) => {
  try {
    const stats = {};
    
    // Get total complaints
    const totalSnapshot = await admin.firestore().collection('complaints').get();
    stats.total = totalSnapshot.size;

    // Get complaints by status
    const pendingSnapshot = await admin.firestore().collection('complaints')
      .where('status', '==', 'pending').get();
    stats.pending = pendingSnapshot.size;

    const processingSnapshot = await admin.firestore().collection('complaints')
      .where('status', '==', 'processing').get();
    stats.processing = processingSnapshot.size;

    const routedSnapshot = await admin.firestore().collection('complaints')
      .where('status', '==', 'routed').get();
    stats.routed = routedSnapshot.size;

    // Get complaints by category
    const categories = ['streetlight', 'water', 'garbage', 'road', 'sewage', 'noise', 'security'];
    stats.byCategory = {};

    for (const category of categories) {
      const categorySnapshot = await admin.firestore().collection('complaints')
        .where('category', '==', category).get();
      stats.byCategory[category] = categorySnapshot.size;
    }

    return stats;
  } catch (error) {
    console.error('Error getting complaint stats:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get statistics');
  }
});

// Function to send notification to users in the area
exports.sendAreaNotification = functions.https.onCall(async (data, context) => {
  const { title, message, location, radius = 1000 } = data; // radius in meters

  if (!title || !message || !location) {
    throw new functions.https.HttpsError('invalid-argument', 'Title, message, and location are required');
  }

  try {
    // Create a new alert
    const alertRef = await admin.firestore().collection('alerts').add({
      type: 'area_notification',
      title: title,
      message: message,
      location: location,
      radius: radius,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`Area notification created with ID: ${alertRef.id}`);

    return {
      alertId: alertRef.id,
      message: 'Notification sent successfully'
    };
  } catch (error) {
    console.error('Error sending area notification:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send notification');
  }
});

// Function to update complaint status
exports.updateComplaintStatus = functions.https.onCall(async (data, context) => {
  const { complaintId, status, notes } = data;

  if (!complaintId || !status) {
    throw new functions.https.HttpsError('invalid-argument', 'Complaint ID and status are required');
  }

  try {
    const updateData = {
      status: status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (notes) {
      updateData.notes = notes;
    }

    await admin.firestore().collection('complaints').doc(complaintId).update(updateData);

    console.log(`Complaint ${complaintId} status updated to ${status}`);

    return {
      message: 'Complaint status updated successfully'
    };
  } catch (error) {
    console.error('Error updating complaint status:', error);
    throw new functions.https.HttpsError('internal', 'Failed to update complaint status');
  }
});

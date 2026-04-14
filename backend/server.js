require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// Initialize Firebase Admin with your service account
const serviceAccount = require('./firebase-admin.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ========== AUTH MIDDLEWARE ==========
const verifyToken = async (req, res, next) => {
  const token = req.headers['x-auth-token'];
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }
  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Invalid token' });
  }
};

// ========== AUTH ROUTES ==========

// Signup - Store additional user data
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { uid, email, name, role } = req.body;
    
    // Store user data in Firestore
    await db.collection('users').doc(uid).set({
      uid: uid,
      name: name,
      email: email,
      role: role,
      selectedCompany: null,
      testScore: null,
      isSelected: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({
      user: {
        uid: uid,
        name: name,
        email: email,
        role: role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err.message });
  }
});

// Login - Verify user exists
app.post('/api/auth/login', async (req, res) => {
  try {
    const { uid, email, role } = req.body;
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return res.status(400).json({ msg: 'User not found' });
    }
    
    const userData = userDoc.data();
    if (userData.role !== role) {
      return res.status(400).json({ msg: 'Invalid role' });
    }
    
    res.json({
      user: {
        uid: userData.uid,
        name: userData.name,
        email: userData.email,
        role: userData.role
      }
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ========== STUDENT ROUTES ==========

// Get available offers for student
app.get('/api/student/offers', verifyToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (userDoc.data().role !== 'student') {
      return res.status(403).json({ msg: 'Access denied' });
    }
    
    const offersSnapshot = await db.collection('offers')
      .where('studentId', '==', req.user.uid)
      .where('status', '==', 'pending')
      .get();
    
    const offers = [];
    for (const doc of offersSnapshot.docs) {
      const offerData = doc.data();
      const companyDoc = await db.collection('companies').doc(offerData.companyId).get();
      offers.push({
        id: doc.id,
        ...offerData,
        companyId: { id: companyDoc.id, ...companyDoc.data() }
      });
    }
    
    res.json(offers);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Student selects a company
app.post('/api/student/select-company', verifyToken, async (req, res) => {
  try {
    const { offerId } = req.body;
    
    const offerRef = db.collection('offers').doc(offerId);
    const offerDoc = await offerRef.get();
    
    if (!offerDoc.exists || offerDoc.data().studentId !== req.user.uid) {
      return res.status(404).json({ msg: 'Offer not found' });
    }
    
    await offerRef.update({ status: 'selected' });
    await db.collection('users').doc(req.user.uid).update({
      selectedCompany: offerDoc.data().companyId
    });
    
    res.json({ msg: 'Company selected successfully' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Get test
app.get('/api/student/test', verifyToken, async (req, res) => {
  try {
    const testSnapshot = await db.collection('tests').limit(1).get();
    if (testSnapshot.empty) {
      return res.status(404).json({ msg: 'No test available' });
    }
    
    const testDoc = testSnapshot.docs[0];
    res.json({ id: testDoc.id, ...testDoc.data() });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Submit test with proctoring
app.post('/api/student/submit-test', verifyToken, async (req, res) => {
  try {
    const { answers, snapshots } = req.body;
    
    const testSnapshot = await db.collection('tests').limit(1).get();
    if (testSnapshot.empty) {
      return res.status(404).json({ msg: 'Test not found' });
    }
    
    const testDoc = testSnapshot.docs[0];
    const testData = testDoc.data();
    
    // Calculate score
    let score = 0;
    answers.forEach((ans, idx) => {
      if (ans === testData.questions[idx].correctOption) score++;
    });
    const finalScore = (score / testData.questions.length) * 100;
    
    // Save test attempt
    await db.collection('testAttempts').add({
      studentId: req.user.uid,
      testId: testDoc.id,
      answers,
      score: finalScore,
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      proctoredImages: snapshots || []
    });
    
    // Update user's test score
    await db.collection('users').doc(req.user.uid).update({
      testScore: finalScore
    });
    
    res.json({ score: finalScore });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Get selection status
app.get('/api/student/selection-status', verifyToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const userData = userDoc.data();
    
    let company = null;
    if (userData.selectedCompany) {
      const companyDoc = await db.collection('companies').doc(userData.selectedCompany).get();
      company = { id: companyDoc.id, ...companyDoc.data() };
    }
    
    res.json({
      isSelected: userData.isSelected || false,
      company
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ========== PLACEMENT ROUTES ==========

// Get all students
app.get('/api/placement/students', verifyToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (userDoc.data().role !== 'placement') {
      return res.status(403).json({ msg: 'Placement only' });
    }
    
    const studentsSnapshot = await db.collection('users')
      .where('role', '==', 'student')
      .get();
    
    const students = [];
    studentsSnapshot.forEach(doc => {
      const data = doc.data();
      students.push({
        id: doc.id,
        name: data.name,
        email: data.email,
        testScore: data.testScore || null,
        isSelected: data.isSelected || false
      });
    });
    
    res.json(students);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Get all companies
app.get('/api/placement/companies', verifyToken, async (req, res) => {
  try {
    const companiesSnapshot = await db.collection('companies').get();
    const companies = [];
    companiesSnapshot.forEach(doc => {
      companies.push({ id: doc.id, ...doc.data() });
    });
    res.json(companies);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Create or update test
app.post('/api/placement/test', verifyToken, async (req, res) => {
  try {
    const { title, questions, passingScore } = req.body;
    
    // Delete existing tests
    const existingTests = await db.collection('tests').get();
    const deletePromises = [];
    existingTests.forEach(doc => {
      deletePromises.push(db.collection('tests').doc(doc.id).delete());
    });
    await Promise.all(deletePromises);
    
    // Create new test
    const newTest = await db.collection('tests').add({
      title,
      questions,
      passingScore,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({ id: newTest.id, title, questions, passingScore });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Send offer to student
app.post('/api/placement/send-offer', verifyToken, async (req, res) => {
  try {
    const { studentId, companyId } = req.body;
    
    // Check if offer already exists
    const existingOffers = await db.collection('offers')
      .where('studentId', '==', studentId)
      .where('companyId', '==', companyId)
      .get();
    
    if (!existingOffers.empty) {
      return res.status(400).json({ msg: 'Offer already exists' });
    }
    
    const newOffer = await db.collection('offers').add({
      studentId,
      companyId,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({ id: newOffer.id });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Get test attempts
app.get('/api/placement/test-attempts', verifyToken, async (req, res) => {
  try {
    const attemptsSnapshot = await db.collection('testAttempts').get();
    const attempts = [];
    
    for (const doc of attemptsSnapshot.docs) {
      const attemptData = doc.data();
      const studentDoc = await db.collection('users').doc(attemptData.studentId).get();
      const testDoc = await db.collection('tests').doc(attemptData.testId).get();
      
      attempts.push({
        id: doc.id,
        ...attemptData,
        studentId: { id: studentDoc.id, name: studentDoc.data().name, email: studentDoc.data().email },
        testId: { id: testDoc.id, title: testDoc.data().title }
      });
    }
    
    res.json(attempts);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Select final student
app.post('/api/placement/select-student', verifyToken, async (req, res) => {
  try {
    const { studentId, select } = req.body;
    await db.collection('users').doc(studentId).update({
      isSelected: select
    });
    res.json({ msg: select ? 'Student selected' : 'Student rejected' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Create company
app.post('/api/placement/company', verifyToken, async (req, res) => {
  try {
    const { name, description, package, location } = req.body;
    const newCompany = await db.collection('companies').add({
      name,
      description,
      package,
      location,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    res.json({ id: newCompany.id, name, description, package, location });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`✅ Firebase Admin initialized with project: ${process.env.FIREBASE_PROJECT_ID}`);
});
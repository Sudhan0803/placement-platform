const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Company = require('../models/Company');
const Offer = require('../models/Offer');
const Test = require('../models/Test');
const TestAttempt = require('../models/TestAttempt');
const router = express.Router();

// Only placement team can access
router.use(auth);
router.use((req, res, next) => {
  if (req.user.role !== 'placement') return res.status(403).json({ msg: 'Placement only' });
  next();
});

// Get all students
router.get('/students', async (req, res) => {
  const students = await User.find({ role: 'student' }).select('-password');
  res.json(students);
});

// Get all companies
router.get('/companies', async (req, res) => {
  const companies = await Company.find();
  res.json(companies);
});

// Create or update test
router.post('/test', async (req, res) => {
  const { title, questions, passingScore } = req.body;
  await Test.deleteMany();
  const test = await Test.create({ title, questions, passingScore });
  res.json(test);
});

// Send company offer to a student
router.post('/send-offer', async (req, res) => {
  const { studentId, companyId } = req.body;
  const existing = await Offer.findOne({ studentId, companyId });
  if (existing) return res.status(400).json({ msg: 'Offer already exists' });
  const offer = await Offer.create({ studentId, companyId });
  res.json(offer);
});

// Get test attempts with scores
router.get('/test-attempts', async (req, res) => {
  const attempts = await TestAttempt.find().populate('studentId', 'name email').populate('testId');
  res.json(attempts);
});

// Select final student
router.post('/select-student', async (req, res) => {
  const { studentId, select } = req.body;
  await User.findByIdAndUpdate(studentId, { isSelected: select });
  res.json({ msg: select ? 'Student selected' : 'Student rejected' });
});

// Create company
router.post('/company', async (req, res) => {
  const { name, description, package, location } = req.body;
  const company = await Company.create({ name, description, package, location });
  res.json(company);
});

module.exports = router;
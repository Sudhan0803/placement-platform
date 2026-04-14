const express = require('express');
const auth = require('../middleware/auth');
const Offer = require('../models/Offer');
const User = require('../models/User');
const Test = require('../models/Test');
const TestAttempt = require('../models/TestAttempt');
const router = express.Router();

// Get available company offers for this student
router.get('/offers', auth, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ msg: 'Access denied' });
  const offers = await Offer.find({ studentId: req.user.id, status: 'pending' }).populate('companyId');
  res.json(offers);
});

// Student selects a company
router.post('/select-company', auth, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ msg: 'Access denied' });
  const { offerId } = req.body;
  const offer = await Offer.findOne({ _id: offerId, studentId: req.user.id });
  if (!offer) return res.status(404).json({ msg: 'Offer not found' });
  offer.status = 'selected';
  await offer.save();
  await User.findByIdAndUpdate(req.user.id, { selectedCompany: offer.companyId });
  res.json({ msg: 'Company selected successfully' });
});

// Get test for the student
router.get('/test', auth, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ msg: 'Access denied' });
  const test = await Test.findOne();
  if (!test) return res.status(404).json({ msg: 'No test available' });
  res.json(test);
});

// Submit test with camera images
router.post('/submit-test', auth, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ msg: 'Access denied' });
  const { answers, snapshots } = req.body;
  const test = await Test.findOne();
  if (!test) return res.status(404).json({ msg: 'Test not found' });
  
  let score = 0;
  answers.forEach((ans, idx) => {
    if (ans === test.questions[idx].correctOption) score++;
  });
  const finalScore = (score / test.questions.length) * 100;
  
  await TestAttempt.create({
    studentId: req.user.id,
    testId: test._id,
    answers,
    score: finalScore,
    submittedAt: new Date(),
    proctoredImages: snapshots || []
  });
  
  await User.findByIdAndUpdate(req.user.id, { testScore: finalScore });
  res.json({ score: finalScore });
});

// Check selection status
router.get('/selection-status', auth, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ msg: 'Access denied' });
  const user = await User.findById(req.user.id).populate('selectedCompany');
  res.json({ isSelected: user.isSelected, company: user.selectedCompany });
});

module.exports = router;
const mongoose = require('mongoose');

const TestAttemptSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  answers: [Number],
  score: Number,
  submittedAt: { type: Date, default: Date.now },
  proctoredImages: [String]
});

module.exports = mongoose.model('TestAttempt', TestAttemptSchema);
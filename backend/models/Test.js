const mongoose = require('mongoose');

const TestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  questions: [{
    questionText: String,
    options: [String],
    correctOption: Number
  }],
  passingScore: { type: Number, default: 50 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Test', TestSchema);
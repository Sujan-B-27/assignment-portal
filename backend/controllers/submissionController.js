const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');

exports.submitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.body;
    
    // Check if assignment exists
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    // Check deadline
    if (new Date() > new Date(assignment.deadline)) {
      return res.status(400).json({ message: 'Deadline has passed. Cannot submit.' });
    }
    
    // Check if already submitted
    const existingSubmission = await Submission.findOne({
      assignmentId,
      studentId: req.user.id
    });
    
    if (existingSubmission) {
      return res.status(400).json({ message: 'You have already submitted this assignment' });
    }
    
    // Create submission
    const submission = new Submission({
      assignmentId,
      studentId: req.user.id,
      filePath: req.file.path,
      originalFileName: req.file.originalname,
      fileSize: req.file.size
    });
    
    await submission.save();
    res.status(201).json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSubmissionsByAssignment = async (req, res) => {
  try {
    const submissions = await Submission.find({ 
      assignmentId: req.params.assignmentId 
    })
      .populate('studentId', 'name loginId')
      .populate('assignmentId', 'title deadline')
      .sort('-submittedAt');
    
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMySubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ 
      studentId: req.user.id 
    })
      .populate('assignmentId', 'title description deadline')
      .sort('-submittedAt');
    
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.evaluateSubmission = async (req, res) => {
  try {
    const { marks, feedback } = req.body;
    
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    
    submission.marks = marks;
    submission.feedback = feedback;
    await submission.save();
    
    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSubmissionById = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('studentId', 'name loginId')
      .populate('assignmentId', 'title deadline');
    
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    
    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
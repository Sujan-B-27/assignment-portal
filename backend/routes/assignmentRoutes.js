const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment');
const { auth, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for assignment PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'assignment-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only document files are allowed'));
    }
  }
});

// POST /api/assignments - Create assignment (Faculty only)
router.post('/', auth, authorize('faculty'), upload.single('assignmentPDF'), async (req, res) => {
  console.log('📝 Create assignment request received');
  console.log('Body:', req.body);
  console.log('File:', req.file);
  
  try {
    const { title, description, deadline } = req.body;
    
    // Validation
    if (!title || !description || !deadline) {
      return res.status(400).json({ 
        message: 'All fields are required: title, description, deadline' 
      });
    }
    
    const assignmentData = {
      title,
      description,
      deadline: new Date(deadline),
      createdBy: req.user.id
    };
    
    // Add PDF if uploaded
    if (req.file) {
      assignmentData.assignmentPDF = {
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size
      };
    }
    
    const assignment = new Assignment(assignmentData);
    await assignment.save();
    
    console.log('✅ Assignment created:', assignment._id);
    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      assignment
    });
  } catch (error) {
    console.error('❌ Error creating assignment:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET /api/assignments - Get all assignments
router.get('/', auth, async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate('createdBy', 'name loginId')
      .sort('-createdAt');
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET /api/assignments/:id - Get single assignment
router.get('/:id', auth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('createdBy', 'name loginId');
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/assignments/:id - Delete assignment (Faculty only)
router.delete('/:id', auth, authorize('faculty'), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    // Check if user is the creator
    if (assignment.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this assignment' });
    }
    
    await assignment.deleteOne();
    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
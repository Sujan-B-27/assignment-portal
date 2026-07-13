const Assignment = require('../models/Assignment');
const User = require('../models/User');

exports.createAssignment = async (req, res) => {
  try {
    console.log('Creating assignment with data:', req.body);
    console.log('File uploaded:', req.file);
    
    const { title, description, deadline } = req.body;
    
    const assignmentData = {
      title,
      description,
      deadline,
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
    
    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      assignment
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getAllAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate('createdBy', 'name loginId')
      .sort('-createdAt');
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAssignmentById = async (req, res) => {
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
};

exports.updateAssignment = async (req, res) => {
  try {
    const { title, description, deadline } = req.body;
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    if (assignment.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    assignment.title = title || assignment.title;
    assignment.description = description || assignment.description;
    assignment.deadline = deadline || assignment.deadline;
    
    if (req.file) {
      assignment.assignmentPDF = {
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size
      };
    }
    
    await assignment.save();
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    if (assignment.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    await assignment.deleteOne();
    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('name loginId _id');
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
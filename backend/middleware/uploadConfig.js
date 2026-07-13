const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure all upload directories exist
const uploadDirs = [
  'uploads',
  'uploads/assignment-pdfs',
  'uploads/student-submissions',
  'uploads/student-assignments'
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// File filter for documents
const documentFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx|txt|zip|rar|ppt|pptx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only document files (PDF, DOC, DOCX, PPT, TXT, ZIP) are allowed'), false);
  }
};

// Storage for student submissions
const submissionStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/student-submissions');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'submission-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Storage for assignment PDFs (faculty upload)
const assignmentPDFStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/assignment-pdfs');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'assignment-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Create upload middlewares
const uploadSubmission = multer({
  storage: submissionStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: documentFilter
});

const uploadAssignmentPDF = multer({
  storage: assignmentPDFStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB for assignments
  fileFilter: documentFilter
});

module.exports = { 
  uploadSubmission, 
  uploadAssignmentPDF 
};
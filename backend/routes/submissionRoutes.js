const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const { auth, authorize } = require('../middleware/auth');
const { uploadSubmission } = require('../middleware/uploadConfig');

// Student routes
router.post('/', 
  auth, 
  authorize('student'), 
  uploadSubmission.single('file'), 
  submissionController.submitAssignment
);

router.get('/my-submissions', 
  auth, 
  authorize('student'), 
  submissionController.getMySubmissions
);

// Faculty routes
router.get('/assignment/:assignmentId', 
  auth, 
  authorize('faculty'), 
  submissionController.getSubmissionsByAssignment
);

router.put('/:id/evaluate', 
  auth, 
  authorize('faculty'), 
  submissionController.evaluateSubmission
);

// Both can access
router.get('/:id', 
  auth, 
  submissionController.getSubmissionById
);

module.exports = router;
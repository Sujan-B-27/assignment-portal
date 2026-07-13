import React, { useState } from 'react';
import { submissionAPI } from '../services/api';

const AssignmentCard = ({ assignment, hasSubmitted, submission, onSubmitSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const isDeadlinePassed = new Date() > new Date(assignment.deadline);

  const handleSubmit = async () => {
    if (!selectedFile) {
      setMessage('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('assignmentId', assignment._id);
    formData.append('file', selectedFile);

    setUploading(true);
    try {
      await submissionAPI.submit(formData);
      setMessage('Assignment submitted successfully!');
      setSelectedFile(null);
      if (onSubmitSuccess) onSubmitSuccess();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Submission failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="card mb-3 assignment-card">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h5 className="card-title text-primary">
              {assignment.customTopic || assignment.title}
            </h5>
            <p className="card-text">{assignment.description}</p>
          </div>
          <span className={`badge ${isDeadlinePassed ? 'bg-danger' : 'bg-success'}`}>
            {isDeadlinePassed ? 'Closed' : 'Open'}
          </span>
        </div>

        {/* Show personalized message if student has specific assignment */}
        {assignment.isPersonalizedForStudent && (
          <div className="alert alert-info mt-2">
            <i className="fas fa-user-graduate"></i> This assignment is personalized for you!
          </div>
        )}

        {/* Show Assignment PDF if available */}
        {assignment.assignmentPDF && assignment.assignmentPDF.filePath && (
          <div className="mt-2">
            <a 
              href={`http://localhost:5000/${assignment.assignmentPDF.filePath}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-outline-primary"
            >
              <i className="fas fa-download"></i> Download Assignment File
            </a>
            <small className="text-muted ms-2">
              {assignment.assignmentPDF.fileName}
            </small>
          </div>
        )}

        <div className="mt-2">
          <small className="text-muted">
            Created by: {assignment.createdBy?.name || 'Faculty'}
          </small>
          <br />
          <small className="text-danger">
            Deadline: {new Date(assignment.deadline).toLocaleString()}
          </small>
        </div>

        {hasSubmitted ? (
          <div className="alert alert-success mt-3">
            <strong>✅ Submitted!</strong>
            {submission?.marks !== null && submission?.marks !== undefined && (
              <div className="mt-2">
                <strong>Marks:</strong> {submission.marks}/100<br />
                <strong>Feedback:</strong> {submission.feedback || 'No feedback yet'}
              </div>
            )}
          </div>
        ) : isDeadlinePassed ? (
          <div className="alert alert-warning mt-3">
            ⚠️ Deadline has passed. Cannot submit.
          </div>
        ) : (
          <div className="mt-3">
            <div className="mb-2">
              <input
                type="file"
                className="form-control"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                accept=".pdf,.doc,.docx,.txt,.zip"
              />
              <small className="text-muted">
                Submit your assignment (PDF, DOC, DOCX, TXT, ZIP - Max 10MB)
              </small>
            </div>
            {message && (
              <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-danger'} mt-2`}>
                {message}
              </div>
            )}
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={uploading || !selectedFile}
            >
              {uploading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Uploading...
                </>
              ) : (
                'Submit Assignment'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentCard;
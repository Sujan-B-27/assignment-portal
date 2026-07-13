import React, { useState } from 'react';

const SubmissionTable = ({ submissions, onEvaluate }) => {
  const [evaluationData, setEvaluationData] = useState({});

  const handleMarksChange = (submissionId, marks) => {
    setEvaluationData(prev => ({
      ...prev,
      [submissionId]: { ...prev[submissionId], marks }
    }));
  };

  const handleFeedbackChange = (submissionId, feedback) => {
    setEvaluationData(prev => ({
      ...prev,
      [submissionId]: { ...prev[submissionId], feedback }
    }));
  };

  const handleSave = (submissionId) => {
    const data = evaluationData[submissionId];
    if (onEvaluate) {
      onEvaluate(submissionId, data);
    }
  };

  if (submissions.length === 0) {
    return (
      <div className="text-center p-4">
        <p className="text-muted">No submissions yet.</p>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-bordered table-hover">
        <thead className="table-primary">
          <tr>
            <th>Student Name</th>
            <th>USN</th>
            <th>Submitted At</th>
            <th>File</th>
            <th>File Size</th>
            <th>Marks (out of 100)</th>
            <th>Feedback</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map(submission => (
            <tr key={submission._id}>
              <td>{submission.studentId?.name}</td>
              <td>{submission.studentId?.loginId}</td>
              <td>{new Date(submission.submittedAt).toLocaleString()}</td>
              <td>
                <a
                  href={`http://localhost:5000/${submission.filePath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-info"
                >
                  📄 View
                </a>
              </td>
              <td>
                {submission.fileSize 
                  ? `${(submission.fileSize / 1024).toFixed(2)} KB`
                  : 'N/A'}
              </td>
              <td style={{ width: '100px' }}>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  min="0"
                  max="100"
                  placeholder="Marks"
                  value={evaluationData[submission._id]?.marks !== undefined 
                    ? evaluationData[submission._id].marks 
                    : submission.marks || ''}
                  onChange={(e) => handleMarksChange(submission._id, e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Feedback"
                  value={evaluationData[submission._id]?.feedback !== undefined
                    ? evaluationData[submission._id].feedback
                    : submission.feedback || ''}
                  onChange={(e) => handleFeedbackChange(submission._id, e.target.value)}
                />
              </td>
              <td>
                <button
                  className="btn btn-sm btn-success"
                  onClick={() => handleSave(submission._id)}
                >
                  Save
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SubmissionTable;
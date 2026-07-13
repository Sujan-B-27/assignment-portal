import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { assignmentAPI, submissionAPI } from '../services/api';

const StudentDashboard = () => {
  const [assignments, setAssignments] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [assignmentsRes, submissionsRes] = await Promise.all([
        assignmentAPI.getAll(),
        submissionAPI.getMySubmissions()
      ]);
      setAssignments(assignmentsRes.data);
      setMySubmissions(submissionsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (assignmentId) => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Please select a file to upload' });
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('assignmentId', assignmentId);
    formData.append('file', selectedFile);

    try {
      await submissionAPI.submit(formData);
      setMessage({ type: 'success', text: 'Assignment submitted successfully!' });
      setSelectedFile(null);
      setSelectedAssignment(null);
      fetchData(); // Refresh data
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Submission failed';
      setMessage({ type: 'error', text: errorMsg });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const hasSubmitted = (assignmentId) => {
    return mySubmissions.some(sub => sub.assignmentId?._id === assignmentId);
  };

  const getSubmission = (assignmentId) => {
    return mySubmissions.find(sub => sub.assignmentId?._id === assignmentId);
  };

  const isDeadlinePassed = (deadline) => {
    return new Date() > new Date(deadline);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="text-center mt-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <div className="dashboard-header">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-0">📝 Student Dashboard</h2>
              <p className="text-muted">Welcome, {user?.name} ({user?.loginId})</p>
            </div>
            <button className="btn btn-danger" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`}>
            {message.text}
            <button type="button" className="btn-close" onClick={() => setMessage({ type: '', text: '' })}></button>
          </div>
        )}

        <h3 className="mb-3">📋 Available Assignments</h3>
        {assignments.length === 0 ? (
          <div className="text-center p-5 bg-light rounded">
            <p className="text-muted">No assignments available at the moment.</p>
          </div>
        ) : (
          assignments.map(assignment => {
            const submitted = hasSubmitted(assignment._id);
            const submission = getSubmission(assignment._id);
            const deadlinePassed = isDeadlinePassed(assignment.deadline);
            
            return (
              <div key={assignment._id} className="card mb-3 shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h5 className="card-title text-primary">{assignment.title}</h5>
                      <p className="card-text">{assignment.description}</p>
                    </div>
                    <span className={`badge ${deadlinePassed ? 'bg-danger' : 'bg-success'}`}>
                      {deadlinePassed ? 'Closed' : 'Open'}
                    </span>
                  </div>

                  {/* Assignment PDF Download */}
                  {assignment.assignmentPDF && assignment.assignmentPDF.filePath && (
                    <div className="mt-3 p-3 bg-light rounded">
                      <strong>📎 Assignment Material:</strong>
                      <div className="mt-2">
                        <a 
                          href={`http://localhost:5002/${assignment.assignmentPDF.filePath}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-primary me-2"
                        >
                          📥 Download Assignment File
                        </a>
                        <span className="text-muted">
                          {assignment.assignmentPDF.fileName}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Submission Status */}
                  {submitted && (
                    <div className="mt-3 alert alert-success">
                      <strong>✅ Submitted!</strong>
                      {submission?.marks !== null && submission?.marks !== undefined && (
                        <div className="mt-2">
                          <strong>Marks:</strong> {submission.marks}/100<br />
                          <strong>Feedback:</strong> {submission.feedback || 'Pending...'}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Upload Form - Only show if not submitted and deadline not passed */}
                  {!submitted && !deadlinePassed && (
                    <div className="mt-3 border-top pt-3">
                      <h6>Submit Your Assignment</h6>
                      <div className="row">
                        <div className="col-md-8">
                          <input
                            type="file"
                            className="form-control"
                            onChange={(e) => {
                              setSelectedFile(e.target.files[0]);
                              setSelectedAssignment(assignment._id);
                            }}
                            accept=".pdf,.doc,.docx,.txt,.zip"
                            disabled={submitting && selectedAssignment === assignment._id}
                          />
                          <small className="text-muted">
                            Allowed: PDF, DOC, DOCX, TXT, ZIP (Max 10MB)
                          </small>
                        </div>
                        <div className="col-md-4">
                          <button
                            className="btn btn-success w-100"
                            onClick={() => handleSubmit(assignment._id)}
                            disabled={submitting || !selectedFile || selectedAssignment !== assignment._id}
                          >
                            {submitting && selectedAssignment === assignment._id ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2"></span>
                                Uploading...
                              </>
                            ) : (
                              '📤 Submit Assignment'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {!submitted && deadlinePassed && (
                    <div className="mt-3 alert alert-warning">
                      ⚠️ Deadline has passed. Cannot submit.
                    </div>
                  )}

                  <div className="mt-2">
                    <small className="text-muted">
                      Created by: {assignment.createdBy?.name || 'Faculty'}
                    </small>
                    <br />
                    <small className={deadlinePassed ? 'text-danger' : 'text-warning'}>
                      <strong>Deadline:</strong> {new Date(assignment.deadline).toLocaleString()}
                    </small>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* My Submissions Section */}
        {mySubmissions.length > 0 && (
          <div className="mt-5">
            <h3 className="mb-3">📊 My Submissions</h3>
            {mySubmissions.map(submission => (
              <div key={submission._id} className="card mb-2 bg-light">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{submission.assignmentId?.title}</strong>
                      <br />
                      <small>Submitted: {new Date(submission.submittedAt).toLocaleString()}</small>
                    </div>
                    <div className="text-end">
                      {submission.marks !== null ? (
                        <>
                          <span className="badge bg-success fs-6">Marks: {submission.marks}/100</span>
                          <br />
                          <small className="text-muted">Feedback: {submission.feedback}</small>
                        </>
                      ) : (
                        <span className="badge bg-warning">Not evaluated yet</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default StudentDashboard;
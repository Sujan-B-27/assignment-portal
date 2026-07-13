import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { assignmentAPI, submissionAPI } from '../services/api';

const FacultyDashboard = () => {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedAssignment, setExpandedAssignment] = useState(null);
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    deadline: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await assignmentAPI.getAll();
      setAssignments(response.data);
      
      // Fetch submissions for each assignment
      for (let assignment of response.data) {
        await fetchSubmissions(assignment._id);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const fetchSubmissions = async (assignmentId) => {
    try {
      const response = await submissionAPI.getByAssignment(assignmentId);
      console.log(`Submissions for ${assignmentId}:`, response.data);
      setSubmissions(prev => ({
        ...prev,
        [assignmentId]: response.data
      }));
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    if (!newAssignment.title || !newAssignment.description || !newAssignment.deadline) {
      setError('Please fill all fields');
      setLoading(false);
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('title', newAssignment.title);
      formData.append('description', newAssignment.description);
      formData.append('deadline', newAssignment.deadline);
      if (selectedFile) {
        formData.append('assignmentPDF', selectedFile);
      }
      
      await assignmentAPI.create(formData);
      setSuccess('Assignment created successfully!');
      setShowCreateForm(false);
      setNewAssignment({ title: '', description: '', deadline: '' });
      setSelectedFile(null);
      fetchAssignments();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async (submissionId, marks, feedback) => {
    try {
      await submissionAPI.evaluate(submissionId, { marks, feedback });
      alert('Evaluation saved successfully!');
      // Refresh submissions
      const assignmentId = Object.keys(submissions).find(key => 
        submissions[key].some(sub => sub._id === submissionId)
      );
      if (assignmentId) {
        await fetchSubmissions(assignmentId);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save evaluation');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const toggleSubmissions = (assignmentId) => {
    if (expandedAssignment === assignmentId) {
      setExpandedAssignment(null);
    } else {
      setExpandedAssignment(assignmentId);
      // Refresh submissions when opening
      fetchSubmissions(assignmentId);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <div className="dashboard-header">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-0">👨‍🏫 Faculty Dashboard</h2>
              <p className="text-muted">Welcome, {user?.name} ({user?.loginId})</p>
            </div>
            <button className="btn btn-danger" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger alert-dismissible fade show">
            <strong>Error!</strong> {error}
            <button type="button" className="btn-close" onClick={() => setError('')}></button>
          </div>
        )}
        
        {success && (
          <div className="alert alert-success alert-dismissible fade show">
            <strong>Success!</strong> {success}
            <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
          </div>
        )}

        <button 
          className="btn btn-success mb-3"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : '+ Create Assignment'}
        </button>

        {showCreateForm && (
          <div className="card mb-4 shadow">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">Create New Assignment</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleCreateAssignment}>
                <div className="mb-3">
                  <label className="form-label">Title *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newAssignment.title}
                    onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})}
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Description *</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={newAssignment.description}
                    onChange={(e) => setNewAssignment({...newAssignment, description: e.target.value})}
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Deadline *</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={newAssignment.deadline}
                    onChange={(e) => setNewAssignment({...newAssignment, deadline: e.target.value})}
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Assignment PDF (Optional)</label>
                  <input
                    type="file"
                    className="form-control"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    accept=".pdf,.doc,.docx,.txt"
                  />
                </div>
                
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Assignment'}
                </button>
              </form>
            </div>
          </div>
        )}

        <h3 className="mb-3">📚 Your Assignments</h3>
        {assignments.length === 0 ? (
          <div className="text-center p-5 bg-light rounded">
            <p className="text-muted">No assignments created yet.</p>
          </div>
        ) : (
          assignments.map(assignment => {
            const submissionCount = submissions[assignment._id]?.length || 0;
            const hasSubmissions = submissionCount > 0;
            
            return (
              <div key={assignment._id} className="card mb-3 shadow-sm">
                <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-0">{assignment.title}</h5>
                    <small>Deadline: {new Date(assignment.deadline).toLocaleString()}</small>
                  </div>
                  <button
                    className="btn btn-sm btn-light"
                    onClick={() => toggleSubmissions(assignment._id)}
                  >
                    {expandedAssignment === assignment._id ? 'Hide' : 'View'} Submissions 
                    {hasSubmissions && <span className="badge bg-danger ms-2">{submissionCount}</span>}
                  </button>
                </div>
                
                <div className="card-body">
                  <p>{assignment.description}</p>
                  
                  {assignment.assignmentPDF && assignment.assignmentPDF.filePath && (
                    <div className="mb-2">
                      <a 
                        href={`http://localhost:5002/${assignment.assignmentPDF.filePath}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline-primary"
                      >
                        📄 Download Assignment PDF
                      </a>
                    </div>
                  )}
                  
                  {expandedAssignment === assignment._id && (
                    <div className="mt-3">
                      <h6>Student Submissions</h6>
                      {!hasSubmissions ? (
                        <div className="alert alert-info">
                          No submissions yet for this assignment.
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-bordered table-hover">
                            <thead className="table-dark">
                              <tr>
                                <th>Student Name</th>
                                <th>USN</th>
                                <th>Submitted File</th>
                                <th>Submitted At</th>
                                <th>Marks (out of 100)</th>
                                <th>Feedback</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {submissions[assignment._id]?.map(sub => (
                                <SubmissionRow 
                                  key={sub._id} 
                                  submission={sub} 
                                  onEvaluate={handleEvaluate}
                                />
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
};

// Component for each submission row with evaluation form
const SubmissionRow = ({ submission, onEvaluate }) => {
  const [marks, setMarks] = useState(submission.marks || '');
  const [feedback, setFeedback] = useState(submission.feedback || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (marks === '' || marks < 0 || marks > 100) {
      alert('Please enter valid marks (0-100)');
      return;
    }
    setSaving(true);
    await onEvaluate(submission._id, marks, feedback);
    setSaving(false);
  };

  return (
    <tr>
      <td>{submission.studentId?.name}</td>
      <td>{submission.studentId?.loginId}</td>
      <td>
        {submission.filePath && (
          <a 
            href={`http://localhost:5002/${submission.filePath}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-info"
          >
            📥 Download ({submission.originalFileName})
          </a>
        )}
      </td>
      <td>{new Date(submission.submittedAt).toLocaleString()}</td>
      <td style={{ width: '100px' }}>
        <input
          type="number"
          className="form-control form-control-sm"
          value={marks}
          onChange={(e) => setMarks(e.target.value)}
          min="0"
          max="100"
          placeholder="Marks"
        />
      </td>
      <td>
        <input
          type="text"
          className="form-control form-control-sm"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Feedback"
        />
      </td>
      <td>
        <button 
          className="btn btn-sm btn-success"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </td>
    </tr>
  );
};

export default FacultyDashboard;
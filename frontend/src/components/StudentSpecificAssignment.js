import React, { useState, useEffect } from "react";
import { assignmentAPI } from "../services/api";

const StudentSpecificAssignment = ({ assignment, onAdd }) => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [customPDF, setCustomPDF] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await assignmentAPI.getAllStudents();
      setStudents(response.data);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) {
      setMessage("Please select a student");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("assignmentId", assignment._id);
    formData.append("studentId", selectedStudent);
    formData.append("customTopic", customTopic);
    if (customPDF) {
      formData.append("customPDF", customPDF);
    }

    try {
      await assignmentAPI.addStudentSpecific(formData);
      setMessage("Student-specific assignment added successfully!");
      setSelectedStudent("");
      setCustomTopic("");
      setCustomPDF(null);
      if (onAdd) onAdd();
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to add");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card mt-3">
      <div className="card-header bg-info text-white">
        <h6 className="mb-0">Assign Different Topic to Student</h6>
      </div>
      <div className="card-body">
        {message && (
          <div
            className={`alert ${message.includes("success") ? "alert-success" : "alert-danger"} mb-3`}
          >
            {message}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Select Student</label>
            <select
              className="form-select"
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              required
            >
              <option value="">Choose student...</option>
              {students.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.name} ({student.loginId})
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Custom Topic (Optional)</label>
            <textarea
              className="form-control"
              rows="2"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="Enter specific topic for this student"
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Custom PDF/File (Optional)</label>
            <input
              type="file"
              className="form-control"
              onChange={(e) => setCustomPDF(e.target.files[0])}
              accept=".pdf,.doc,.docx,.ppt,.pptx"
            />
            <small className="text-muted">
              Upload specific assignment file for this student
            </small>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Assigning..." : "Assign to Student"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentSpecificAssignment;

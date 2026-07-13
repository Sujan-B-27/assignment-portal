import React, { useState } from 'react';

const CreateAssignmentForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    isPersonalized: false,
    assignmentPDF: null
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.deadline) {
      newErrors.deadline = 'Deadline is required';
    } else if (new Date(formData.deadline) <= new Date()) {
      newErrors.deadline = 'Deadline must be in the future';
    }
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length === 0) {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('deadline', formData.deadline);
      formDataToSend.append('isPersonalized', formData.isPersonalized);
      if (formData.assignmentPDF) {
        formDataToSend.append('assignmentPDF', formData.assignmentPDF);
      }
      onSubmit(formDataToSend);
    } else {
      setErrors(newErrors);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value
    });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  return (
    <div className="card mb-4">
      <div className="card-header bg-success text-white">
        <h5 className="mb-0">Create New Assignment</h5>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Title *</label>
            <input
              type="text"
              className={`form-control ${errors.title ? 'is-invalid' : ''}`}
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter assignment title"
            />
            {errors.title && <div className="invalid-feedback">{errors.title}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label">Description *</label>
            <textarea
              className={`form-control ${errors.description ? 'is-invalid' : ''}`}
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter assignment description"
            />
            {errors.description && <div className="invalid-feedback">{errors.description}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label">Deadline *</label>
            <input
              type="datetime-local"
              className={`form-control ${errors.deadline ? 'is-invalid' : ''}`}
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
            />
            {errors.deadline && <div className="invalid-feedback">{errors.deadline}</div>}
          </div>

          <div className="mb-3">
            <div className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                name="isPersonalized"
                checked={formData.isPersonalized}
                onChange={handleChange}
                id="isPersonalized"
              />
              <label className="form-check-label" htmlFor="isPersonalized">
                Enable personalized assignments (different topics for different students)
              </label>
            </div>
            <small className="text-muted">
              If enabled, you can assign different topics/PDFs to individual students
            </small>
          </div>

          <div className="mb-3">
            <label className="form-label">Assignment PDF/File (Optional)</label>
            <input
              type="file"
              className="form-control"
              name="assignmentPDF"
              onChange={handleChange}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip"
            />
            <small className="text-muted">
              Upload assignment instructions, PDF, or any reference material (Max 20MB)
            </small>
          </div>

          <div className="d-flex gap-2">
            <button type="submit" className="btn btn-success">
              Create Assignment
            </button>
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAssignmentForm;
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Load environment variables
require("dotenv").config();

const app = express();

// ========== CORS CONFIGURATION ==========
// For Render deployment, allow all origins (or specify your frontend URL)
app.use(
  cors({
    origin: "*", // Or: 'https://assignment-portal-frontend.onrender.com'
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ========== MIDDLEWARE ==========
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== CREATE UPLOADS FOLDER ==========
if (!fs.existsSync("./uploads")) {
  fs.mkdirSync("./uploads");
}
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ========== MONGODB CONNECTION ==========
// Use environment variable for MongoDB URI
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/assignment_portal",
  )
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB error:", err.message));

// ========== MODELS ==========
const UserSchema = new mongoose.Schema({
  loginId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ["student", "faculty"], required: true },
});
const User = mongoose.model("User", UserSchema);

const AssignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    deadline: { type: Date, required: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignmentPDF: {
      fileName: String,
      filePath: String,
      fileSize: Number,
    },
  },
  { timestamps: true },
);
const Assignment = mongoose.model("Assignment", AssignmentSchema);

const SubmissionSchema = new mongoose.Schema({
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Assignment",
    required: true,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  filePath: String,
  originalFileName: String,
  fileSize: Number,
  marks: { type: Number, default: null },
  feedback: { type: String, default: "" },
  submittedAt: { type: Date, default: Date.now },
});
const Submission = mongoose.model("Submission", SubmissionSchema);

// ========== AUTH MIDDLEWARE ==========
const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) throw new Error();
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Please authenticate" });
  }
};

const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };

// ========== FILE UPLOAD CONFIG ==========
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /pdf|doc|docx|txt/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    ext ? cb(null, true) : cb(new Error("Only documents allowed"));
  },
});

// ========== TEST ROUTE ==========
app.get("/api/test", (req, res) => {
  res.json({
    message: "Server is working!",
    environment: process.env.NODE_ENV || "development",
  });
});

// ========== AUTH ROUTES ==========
app.post("/api/auth/register", async (req, res) => {
  console.log("📝 Register:", req.body);
  try {
    const { loginId, password, name, role } = req.body;
    if (!loginId || !password || !name || !role) {
      return res.status(400).json({ message: "All fields required" });
    }

    const existing = await User.findOne({ loginId });
    if (existing)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      loginId,
      password: hashedPassword,
      name,
      role: role.toLowerCase(),
    });
    await user.save();

    const token = jwt.sign(
      { id: user._id, loginId: user.loginId, role: user.role },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "7d" },
    );

    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, loginId, name, role },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  console.log("🔐 Login:", req.body.loginId);
  try {
    const { loginId, password } = req.body;
    const user = await User.findOne({ loginId });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, loginId: user.loginId, role: user.role },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "7d" },
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        loginId: user.loginId,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== ASSIGNMENT ROUTES ==========
app.post(
  "/api/assignments",
  auth,
  authorize("faculty"),
  upload.single("assignmentPDF"),
  async (req, res) => {
    console.log("📝 Creating assignment");
    try {
      const { title, description, deadline } = req.body;

      if (!title || !description || !deadline) {
        return res
          .status(400)
          .json({ message: "Title, description, and deadline are required" });
      }

      const assignment = new Assignment({
        title,
        description,
        deadline: new Date(deadline),
        createdBy: req.user.id,
      });

      if (req.file) {
        assignment.assignmentPDF = {
          fileName: req.file.originalname,
          filePath: req.file.path,
          fileSize: req.file.size,
        };
      }

      await assignment.save();
      res
        .status(201)
        .json({ success: true, message: "Assignment created", assignment });
    } catch (error) {
      console.error("❌ Error:", error);
      res.status(500).json({ message: error.message });
    }
  },
);

app.get("/api/assignments", auth, async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate("createdBy", "name loginId")
      .sort("-createdAt");
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete(
  "/api/assignments/:id",
  auth,
  authorize("faculty"),
  async (req, res) => {
    try {
      const assignment = await Assignment.findById(req.params.id);
      if (!assignment) return res.status(404).json({ message: "Not found" });
      if (assignment.createdBy.toString() !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      await assignment.deleteOne();
      res.json({ message: "Deleted" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

// ========== SUBMISSION ROUTES ==========
app.post(
  "/api/submissions",
  auth,
  authorize("student"),
  upload.single("file"),
  async (req, res) => {
    console.log("📤 Submission received");
    try {
      const { assignmentId } = req.body;

      if (!assignmentId) {
        return res.status(400).json({ message: "Assignment ID required" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Please select a file" });
      }

      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }

      if (new Date() > new Date(assignment.deadline)) {
        return res.status(400).json({ message: "Deadline passed" });
      }

      const existingSubmission = await Submission.findOne({
        assignmentId,
        studentId: req.user.id,
      });
      if (existingSubmission) {
        return res.status(400).json({ message: "Already submitted" });
      }

      const submission = new Submission({
        assignmentId,
        studentId: req.user.id,
        filePath: req.file.path,
        originalFileName: req.file.originalname,
        fileSize: req.file.size,
      });

      await submission.save();
      res
        .status(201)
        .json({
          success: true,
          message: "Submitted successfully!",
          submission,
        });
    } catch (error) {
      console.error("❌ Submission error:", error);
      res.status(500).json({ message: error.message });
    }
  },
);

app.get(
  "/api/submissions/my-submissions",
  auth,
  authorize("student"),
  async (req, res) => {
    try {
      const submissions = await Submission.find({
        studentId: req.user.id,
      }).populate("assignmentId", "title description deadline");
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

app.get(
  "/api/submissions/assignment/:assignmentId",
  auth,
  authorize("faculty"),
  async (req, res) => {
    try {
      const submissions = await Submission.find({
        assignmentId: req.params.assignmentId,
      })
        .populate("studentId", "name loginId")
        .populate("assignmentId", "title");
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

app.put(
  "/api/submissions/:id/evaluate",
  auth,
  authorize("faculty"),
  async (req, res) => {
    try {
      const { marks, feedback } = req.body;
      const submission = await Submission.findById(req.params.id);

      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }

      submission.marks = marks;
      submission.feedback = feedback;
      await submission.save();

      res.json({ success: true, message: "Evaluation saved!", submission });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

// ========== START SERVER ==========
// Use PORT from environment variable (Render sets this)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`========================================`);
});

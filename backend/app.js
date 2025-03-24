const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectToDB = require("./config/db");

// Route imports
const patientRoutes = require("./routes/patient.route");
const doctorRoutes = require("./routes/doctor.route");

// Initialize environment variables and DB connection
dotenv.config();
connectToDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); // To handle JSON data in requests

app.use("/patients", patientRoutes);
app.use("/doctors", doctorRoutes);

// Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

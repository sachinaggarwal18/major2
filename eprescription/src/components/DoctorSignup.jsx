import "../styles/Auth.css";
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function DoctorSignup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    specialization: "",
    phone: "",
    experienceYears: "",
    clinicAddress: "",
    password: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.placeholder]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:8000/doctors/register",
        {
          name: formData["Full Name"],
          email: formData["Email"],
          specialization: formData["Specialization"],
          phone: formData["Phone Number"],
          experienceYears: formData["Years of Experience"],
          clinicAddress: formData["Clinic Address"],
          password: formData["Password"],
        }
      );

      console.log("Doctor registered:", response.data);
      // ✅ Navigate to Doctor Dashboard after successful signup
      navigate("/doctor-dashboard");
    } catch (error) {
      console.error("Signup failed:", error.response?.data || error.message);
      alert("Signup failed. Check the console for details.");
    }
  };

  return (
    <div className="auth-container">
      <h2>Doctor Signup</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Full Name"
          required
          onChange={handleChange}
        />
        <input
          type="email"
          placeholder="Email"
          required
          onChange={handleChange}
        />
        <input
          type="text"
          placeholder="Specialization"
          required
          onChange={handleChange}
        />
        <input
          type="text"
          placeholder="Phone Number"
          required
          onChange={handleChange}
        />
        <input
          type="number"
          placeholder="Years of Experience"
          required
          onChange={handleChange}
        />
        <input
          type="text"
          placeholder="Clinic Address"
          required
          onChange={handleChange}
        />
        <input
          type="password"
          placeholder="Password"
          required
          onChange={handleChange}
        />
        <button type="submit">Signup</button>
      </form>
    </div>
  );
}

export default DoctorSignup;

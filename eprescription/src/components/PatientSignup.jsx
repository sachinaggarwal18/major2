import { useState } from "react";
import "../styles/Auth.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function PatientSignup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    age: "",
    gender: "",
    address: "",
    password: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Debug: all form fields before sending
    console.log("Form Data:", formData);

    // Validate if any field is accidentally empty
    for (const [key, value] of Object.entries(formData)) {
      if (!value) {
        alert(`${key} is empty! Please fill all fields.`);
        return;
      }
    }

    try {
      const res = await axios.post(
        "http://localhost:8000/patients/signup",
        formData
      );
      alert("Patient registered successfully!");
      console.log("Response:", res.data);
      navigate("/patient-dashboard"); // ✅ Navigate after success
    } catch (err) {
      console.error("Signup failed:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="auth-container">
      <h2>Patient Signup</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="phoneNumber"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="age"
          placeholder="Age"
          value={formData.age}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="gender"
          placeholder="Gender"
          value={formData.gender}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="address"
          placeholder="Address"
          value={formData.address}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <button type="submit">Signup</button>
      </form>
    </div>
  );
}

export default PatientSignup;

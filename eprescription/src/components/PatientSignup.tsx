import { FC, useState, ChangeEvent, FormEvent } from "react";
import "../styles/Auth.css";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/api";
import { PatientSignupRequest } from "../types/api";

const PatientSignup: FC = () => {
  const [formData, setFormData] = useState<PatientSignupRequest>({
    name: "",
    email: "",
    phoneNumber: "",
    age: 0,
    gender: "Male" as "Male" | "Female" | "Other",
    address: "",
    password: "",
    medicalHistory: "",
  });

  const navigate = useNavigate();

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "age" ? parseInt(value) || 0 : value,
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    try {
      const response = await authService.patientSignup(formData);
      
      // Store the token in localStorage
      localStorage.setItem('token', response.token);
      localStorage.setItem('userType', 'patient');
      
      alert("Patient registered successfully!");
      navigate("/patient-dashboard");
    } catch (error) {
      console.error("Signup failed:", error);
      alert("Signup failed. Please check your information and try again.");
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
          value={formData.phoneNumber}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="age"
          placeholder="Age"
          value={formData.age || ""}
          onChange={handleChange}
          required
        />
        <select
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          required
        >
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
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
        <textarea
          name="medicalHistory"
          placeholder="Medical History (Optional)"
          value={formData.medicalHistory}
          onChange={handleChange as any}
        />
        <button type="submit">Signup</button>
      </form>
    </div>
  );
};

export default PatientSignup;
import "../styles/Auth.css";

function DoctorSignup() {
  return (
    <div className="auth-container">
      <h2>Doctor Signup</h2>
      <form>
        <input type="text" placeholder="Full Name" required />
        <input type="email" placeholder="Email" required />
        <input type="text" placeholder="Specialization" required />
        <input type="text" placeholder="Phone Number" required />
        <input type="number" placeholder="Years of Experience" required />
        <input type="text" placeholder="Clinic Address" required />
        <input type="password" placeholder="Password" required />
        <button type="submit">Signup</button>
      </form>
    </div>
  );
}

export default DoctorSignup;

import "../styles/Auth.css";

function PatientSignup() {
  return (
    <div className="auth-container">
      <h2>Patient Signup</h2>
      <form>
        <input type="text" placeholder="Full Name" required />
        <input type="email" placeholder="Email" required />
        <input type="text" placeholder="Phone Number" required />
        <input type="number" placeholder="Age" required />
        <input type="text" placeholder="Gender" required />
        <input type="text" placeholder="Address" required />
        <input type="password" placeholder="Password" required />
        <button type="submit">Signup</button>
      </form>
    </div>
  );
}

export default PatientSignup;

import "../styles/Auth.css";

function PatientLogin() {
  return (
    <div className="auth-container">
      <h2>Patient Login</h2>
      <form>
        <input type="email" placeholder="Email" required />
        <input type="password" placeholder="Password" required />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default PatientLogin;

import { Link } from "react-router-dom";
import "./Sidebar.css";

function Sidebar({ teacher = false }) {
  return (
    <div className="sidebar">

      <h2 className="logo">
        Smart Classroom
      </h2>

      {!teacher ? (
        <>

          <Link to="/student-dashboard">
            Dashboard
          </Link>

          <Link to="/my-doubts">
            My Doubts
          </Link>

          <Link to="/discussion">
            Discussion
          </Link>

          <Link to="/quiz">
            Quiz
          </Link>

          <Link to="/leaderboard">
            Leaderboard
          </Link>

          <Link to="/">
            Leave Session
          </Link>

        </>
      ) : (
        <>

          <Link to="/teacher-dashboard">
            Dashboard
          </Link>

          <Link to="/create-session">
            Create Session
          </Link>

          <Link to="/my-sessions">
            My Sessions
          </Link>

          <Link to="/statistics">
            Statistics
          </Link>

          <Link to="/">
            Logout
          </Link>

        </>
      )}

    </div>
  );
}

export default Sidebar;
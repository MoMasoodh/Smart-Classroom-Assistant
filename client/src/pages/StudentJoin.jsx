import { useState } from "react";

function StudentLogin() {

  const [studentName, setStudentName] = useState("");
  const [sessionCode, setSessionCode] = useState("");

  const handleJoin = () => {
    console.log(studentName);
    console.log(sessionCode);
  };

  return (
    <div className="home">

      <div className="card">

        <h2>Join Classroom</h2>

        <input
          type="text"
          placeholder="Enter Your Name"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
        />

        <input
          type="text"
          placeholder="Enter Session Code"
          value={sessionCode}
          onChange={(e) => setSessionCode(e.target.value)}
        />

        <button
          className="join-btn"
          onClick={handleJoin}
        >
          Join Session
        </button>

      </div>

    </div>
  );
}

export default StudentLogin;
import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import QuizPage from "./pages/QuizPage";
import Leaderboard from "./pages/Leaderboard";
import Statistics from "./pages/Statistics";
import StudentLogin from "./pages/StudentJoin";
import TeacherLogin from "./pages/TeacherLogin";
import CreateSession from "./pages/CreateSession";
import MySessions from "./pages/MySessions";
import AskDoubt from "./pages/AskDoubt";
import MyDoubts from "./pages/MyDoubts";
import PendingDoubts from "./pages/PendingDoubts";

import "./styles/App.css";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/student-dashboard" element={<StudentDashboard />} />
      <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
      <Route path="/quiz" element={<QuizPage />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/statistics" element={<Statistics />} />
      <Route path="/student-login"element={<StudentLogin />}/>
      <Route path="/teacher-login" element={<TeacherLogin />}/>
      <Route path="/create-session" element={<CreateSession />} />
      <Route path="/my-sessions" element={<MySessions />} />
      <Route path="/ask-doubt" element={<AskDoubt />} />
      <Route path="/my-doubts" element={<MyDoubts />}/>
      <Route path="/pending-doubts"element={<PendingDoubts />}/>
   
    </Routes>
  );
}

export default App;
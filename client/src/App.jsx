import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import QuizPage from "./pages/QuizPage";
import Leaderboard from "./pages/Leaderboard";
import Statistics from "./pages/Statistics";
import StudentLogin from "./pages/StudentJoin";

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
    </Routes>
  );
}

export default App;
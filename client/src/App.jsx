import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import QuizPage from "./pages/QuizPage";
import Leaderboard from "./pages/Leaderboard";
import Statistics from "./pages/Statistics";
import StudentJoin from "./pages/StudentJoin";
import TeacherLogin from "./pages/TeacherLogin";
import CreateSession from "./pages/CreateSession";
import MySessions from "./pages/MySessions";
import AskDoubt from "./pages/AskDoubt";
import MyDoubts from "./pages/MyDoubts";
import PendingDoubts from "./pages/PendingDoubts";
import Discussion from "./pages/Discussion";
import ManageSession from "./pages/ManageSession";
import AnswerDoubt from "./pages/AnswerDoubt";
import TeacherRegister from "./pages/TeacherRegister";
import ProtectedRoute from "./components/ProtectedRoute";
import StudentRegister from "./pages/StudentRegister";
import StudentLogin from "./pages/StudentLogin";

import "./styles/App.css";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/student-dashboard" element={<StudentDashboard />} />
      <Route path="/teacher-login" element={<TeacherLogin />} />
      <Route path="/teacher-register" element={<TeacherRegister />} />
      <Route path="/teacher-dashboard" element={<ProtectedRoute><TeacherDashboard /></ProtectedRoute>} />
      <Route path="/quiz" element={<QuizPage />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/statistics" element={<ProtectedRoute><Statistics /></ProtectedRoute>} />
      <Route path="/student-login" element={<StudentLogin />} />
      <Route path="/create-session" element={<ProtectedRoute><CreateSession /></ProtectedRoute>} />
      <Route path="/my-sessions" element={<ProtectedRoute><MySessions /></ProtectedRoute>} />
      <Route path="/ask-doubt" element={<AskDoubt />} />
      <Route path="/my-doubts" element={<MyDoubts />}/>
      <Route path="/pending-doubts" element={<ProtectedRoute><PendingDoubts /></ProtectedRoute>} />
      <Route path="/discussion" element={<Discussion />} />
      <Route path="/manage-session" element={<ProtectedRoute><ManageSession /></ProtectedRoute>} />
      <Route path="/answer-doubt" element={<ProtectedRoute><AnswerDoubt /></ProtectedRoute>} />
      <Route path="/join/:sessionCode" element={<StudentJoin />} />
      <Route path="/student-register" element={<StudentRegister />} />
      <Route path="/student-login" element={<StudentLogin />} />
   
    </Routes>
  );
}

export default App;
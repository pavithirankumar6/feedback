import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Pages
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

// Faculty Pages
import FacultyDashboard from './pages/faculty/Dashboard.jsx';
import CreateForm from './pages/faculty/CreateForm.jsx';
import EditForm from './pages/faculty/EditForm.jsx';
import Analysis from './pages/faculty/Analysis.jsx';

// Student Pages
import StudentDashboard from './pages/student/Dashboard.jsx';
import SubmitFeedback from './pages/student/SubmitFeedback.jsx';
import EditFeedback from './pages/student/EditFeedback.jsx';
import History from './pages/student/History.jsx';

const HomeRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return user.role === 'faculty' ? <FacultyDashboard /> : <StudentDashboard />;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route element={<Layout />}>
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<HomeRedirect />} />
              
              {/* Faculty Routes */}
              <Route element={<ProtectedRoute role="faculty" />}>
                <Route path="/forms/new" element={<CreateForm />} />
                <Route path="/forms/:id/edit" element={<EditForm />} />
                <Route path="/forms/:id/analysis" element={<Analysis />} />
              </Route>

              {/* Student Routes */}
              <Route element={<ProtectedRoute role="student" />}>
                <Route path="/forms/:id/submit" element={<SubmitFeedback />} />
                <Route path="/forms/:id/edit" element={<EditFeedback />} />
                <Route path="/history" element={<History />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

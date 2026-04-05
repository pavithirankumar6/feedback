import React from 'react';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { LogOut, LayoutDashboard, ClipboardList, User as UserIcon, GraduationCap, School } from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return <Outlet />;

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <nav className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="bg-indigo-600 p-1.5 rounded-lg">
                  <School className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-neutral-900 tracking-tight">FeedbackSystem</span>
              </Link>
              
              <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
                <Link
                  to="/"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-neutral-600 hover:text-indigo-600 transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
                {user.role === 'student' && (
                  <Link
                    to="/history"
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-neutral-600 hover:text-indigo-600 transition-colors"
                  >
                    <ClipboardList className="h-4 w-4 mr-2" />
                    My History
                  </Link>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center px-3 py-1.5 bg-neutral-100 rounded-full">
                {user.role === 'faculty' ? (
                  <UserIcon className="h-4 w-4 text-indigo-600 mr-2" />
                ) : (
                  <GraduationCap className="h-4 w-4 text-emerald-600 mr-2" />
                )}
                <span className="text-sm font-medium text-neutral-700">{user.name}</span>
                <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-white rounded border border-neutral-200 text-neutral-500">
                  {user.role}
                </span>
              </div>
              
              <button
                onClick={handleLogout}
                className="p-2 text-neutral-400 hover:text-red-600 transition-colors rounded-full hover:bg-red-50"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-neutral-200 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-neutral-500 italic serif">
            Empowering education through meaningful feedback.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { getAvailableForms, getStudentHistory } from '../../services/firebaseData.js';
import { ClipboardList, CheckCircle2, Clock, ChevronRight, AlertCircle, Loader2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';

const StudentDashboard = () => {
  const [availableForms, setAvailableForms] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const [availableRes, historyRes] = await Promise.all([
          getAvailableForms(user),
          getStudentHistory(user)
        ]);
        setAvailableForms(availableRes);
        setHistory(historyRes);
      } catch (err) {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Student Dashboard</h1>
        <p className="text-neutral-500 mt-1">Share your thoughts on your courses and instructors</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center">
          <AlertCircle className="h-5 w-5 mr-3" />
          {error}
        </div>
      )}

      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-500" />
          <h2 className="text-xl font-bold text-neutral-900">Pending Feedback</h2>
          <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
            {availableForms.length}
          </span>
        </div>

        {availableForms.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-neutral-200 border-dashed text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
            <p className="text-neutral-500 font-medium">All caught up! No pending feedback forms.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {availableForms.map((form, idx) => (
              <motion.div
                key={form.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-neutral-900 group-hover:text-indigo-600 transition-colors">{form.title}</h3>
                    <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600 rounded border border-amber-100">Pending</span>
                  </div>
                  <p className="text-neutral-500 text-sm line-clamp-2 mb-6 flex-grow">{form.description || 'No description provided.'}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-neutral-50">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Deadline</span>
                      <span className="text-sm font-semibold text-neutral-700">{format(new Date(form.deadline), 'MMM d, yyyy')}</span>
                    </div>
                    <Link
                      to={`/forms/${form.id}/submit`}
                      className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-sm"
                    >
                      Start Feedback
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-indigo-500" />
          <h2 className="text-xl font-bold text-neutral-900">Recently Completed</h2>
        </div>

        {history.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-neutral-200 text-center">
            <p className="text-neutral-500">You haven't submitted any feedback yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-neutral-100">
              {history.slice(0, 5).map((item, idx) => (
                <div key={item.id} className="px-6 py-4 flex items-center justify-between hover:bg-neutral-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                      <ClipboardList className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-neutral-900">{item.title}</h4>
                      <p className="text-xs text-neutral-500">Submitted on {format(new Date(item.submitted_at), 'MMM d, h:mm a')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {item.allow_edit_response && new Date(item.deadline) > new Date() && (
                      <Link
                        to={`/responses/${item.form_id}/edit`}
                        className="text-sm font-bold text-indigo-600 hover:underline"
                      >
                        Edit Response
                      </Link>
                    )}
                    <ChevronRight className="h-5 w-5 text-neutral-300" />
                  </div>
                </div>
              ))}
            </div>
            {history.length > 5 && (
              <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-100 text-center">
                <Link to="/history" className="text-sm font-bold text-indigo-600 hover:underline">View All History</Link>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default StudentDashboard;

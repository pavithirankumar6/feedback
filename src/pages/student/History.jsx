import React, { useEffect, useState } from 'react';
import api from '../../services/api.js';
import { ClipboardList, ChevronRight, AlertCircle, Loader2, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get('/student/history');
        setHistory(response.data);
      } catch (err) {
        setError('Failed to load your history.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Feedback History</h1>
        <p className="text-neutral-500 mt-1">Review your past submissions</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center">
          <AlertCircle className="h-5 w-5 mr-3" />
          {error}
        </div>
      )}

      {history.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-neutral-200 text-center">
          <ClipboardList className="h-12 w-12 text-neutral-200 mx-auto mb-4" />
          <p className="text-neutral-500">You haven't submitted any feedback yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-neutral-900">{item.title}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1.5 text-neutral-400" />
                      {item.faculty_name}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1.5 text-neutral-400" />
                      Submitted {format(new Date(item.submitted_at), 'MMM d, yyyy')}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {item.allow_edit_response && new Date(item.deadline) > new Date() ? (
                    <Link
                      to={`/forms/${item.form_id}/edit`}
                      className="px-4 py-2 bg-indigo-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-100 transition-all text-sm"
                    >
                      Edit Response
                    </Link>
                  ) : (
                    <span className="px-3 py-1.5 bg-neutral-50 text-neutral-400 text-xs font-bold uppercase tracking-wider rounded-lg border border-neutral-100">
                      View Only
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;

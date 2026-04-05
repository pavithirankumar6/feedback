import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { getFacultyFormAnalysis } from '../../services/firebaseData.js';
import { BarChart3, Users, Calendar, ArrowLeft, Loader2, AlertCircle, MessageSquare, Star, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';

const Analysis = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!user) return;
      try {
        const response = await getFacultyFormAnalysis(id, user);
        setData(response);
      } catch (err) {
        setError('Failed to load analysis data.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [id, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-3xl mx-auto p-8 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center">
        <AlertCircle className="h-5 w-5 mr-3" />
        {error || 'Data not found'}
      </div>
    );
  }

  const overallAverage = data.questions
    .filter(q => q.type === 'rating')
    .reduce((acc, q) => acc + q.analysis.average, 0) / (data.questions.filter(q => q.type === 'rating').length || 1);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">{data.form.title}</h1>
          <p className="text-neutral-500">Feedback Analysis & Statistics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm col-span-1 md:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Overall Average Score</h3>
            <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-neutral-900">{overallAverage.toFixed(1)}</span>
            <span className="text-neutral-400 font-medium">/ 5.0</span>
          </div>
          <div className="mt-4 w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-600 h-full transition-all duration-1000" 
              style={{ width: `${(overallAverage / 5) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Total Responses</h3>
            <Users className="h-5 w-5 text-indigo-500" />
          </div>
          <span className="text-4xl font-black text-neutral-900">{data.totalResponses}</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Status</h3>
            <Calendar className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-neutral-900">
              {new Date(data.form.deadline) < new Date() ? 'Closed' : 'Active'}
            </span>
            <span className="text-xs text-neutral-400">
              {format(new Date(data.form.deadline), 'MMM d, yyyy')}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-neutral-900">Question Breakdown</h2>
        
        {data.questions.map((q, idx) => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden"
          >
            <div className="px-8 py-6 border-b border-neutral-100 bg-neutral-50/50">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4">
                  <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-white border border-neutral-200 text-neutral-900 font-bold rounded-lg shadow-sm">
                    {idx + 1}
                  </span>
                  <h3 className="text-lg font-bold text-neutral-900 leading-tight">{q.question_text}</h3>
                </div>
                <span className="px-2.5 py-1 bg-white border border-neutral-200 text-[10px] font-bold uppercase tracking-wider text-neutral-500 rounded-full shadow-sm">
                  {q.type}
                </span>
              </div>
            </div>

            <div className="p-8">
              {q.type === 'rating' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-sm font-semibold text-neutral-500">Rating Distribution</span>
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full">
                        <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                        <span className="text-sm font-bold">{q.analysis.average.toFixed(1)} Avg</span>
                      </div>
                    </div>
                    
                    {[5, 4, 3, 2, 1].map(rating => {
                      const count = q.analysis.distribution[rating] || 0;
                      const percentage = q.analysis.total > 0 ? (count / q.analysis.total) * 100 : 0;
                      return (
                        <div key={rating} className="flex items-center gap-4">
                          <span className="text-sm font-bold text-neutral-500 w-4">{rating}</span>
                          <div className="flex-grow h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              className="h-full bg-indigo-500"
                            />
                          </div>
                          <span className="text-sm font-medium text-neutral-400 w-12 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="flex flex-col items-center justify-center bg-neutral-50 rounded-2xl p-8 border border-neutral-100">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="58"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          className="text-neutral-200"
                        />
                        <motion.circle
                          cx="64"
                          cy="64"
                          r="58"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={364.4}
                          initial={{ strokeDashoffset: 364.4 }}
                          animate={{ strokeDashoffset: 364.4 - (364.4 * q.analysis.average) / 5 }}
                          className="text-indigo-600"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-neutral-900">{q.analysis.average.toFixed(1)}</span>
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Score</span>
                      </div>
                    </div>
                    <p className="mt-6 text-sm text-neutral-500 text-center font-medium">
                      Based on {q.analysis.total} student responses
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-neutral-500">Text Responses ({q.analysis.responses.length})</span>
                    <MessageSquare className="h-4 w-4 text-neutral-300" />
                  </div>
                  
                  {q.analysis.responses.length === 0 ? (
                    <p className="text-neutral-400 italic text-sm py-4 text-center bg-neutral-50 rounded-xl border border-dashed border-neutral-200">No text responses yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {q.analysis.responses.map((resp, rIdx) => (
                        <motion.div
                          key={rIdx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: rIdx * 0.05 }}
                          className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 text-neutral-700 text-sm leading-relaxed"
                        >
                          "{resp}"
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Analysis;

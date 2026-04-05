import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import { Plus, BarChart3, Edit3, Users, Calendar, Clock, ChevronRight, AlertCircle, Loader2, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';

const FacultyDashboard = () => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const response = await api.get('/forms/faculty');
        setForms(response.data);
      } catch (err) {
        setError('Failed to load your forms. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchForms();
  }, []);

  const getStatus = (deadline) => {
    const isClosed = new Date(deadline) < new Date();
    return isClosed ? (
      <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-600 rounded border border-red-100">Closed</span>
    ) : (
      <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 rounded border border-emerald-100">Active</span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Faculty Dashboard</h1>
          <p className="text-neutral-500 mt-1">Manage and analyze your feedback forms</p>
        </div>
        <Link
          to="/forms/new"
          className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-sm"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create New Form
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center">
          <AlertCircle className="h-5 w-5 mr-3" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <ClipboardList className="h-6 w-6 text-indigo-600" />
            </div>
            <span className="text-2xl font-bold text-neutral-900">{forms.length}</span>
          </div>
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Total Forms</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Users className="h-6 w-6 text-emerald-600" />
            </div>
            <span className="text-2xl font-bold text-neutral-900">
              {forms.reduce((acc, f) => acc + (f.response_count || 0), 0)}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Total Responses</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <span className="text-2xl font-bold text-neutral-900">
              {forms.filter(f => new Date(f.deadline) > new Date()).length}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Active Forms</h3>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="font-bold text-neutral-900">Recent Forms</h2>
          <Link to="/forms" className="text-sm text-indigo-600 font-semibold hover:underline">View All</Link>
        </div>
        
        {forms.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="bg-neutral-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="h-8 w-8 text-neutral-300" />
            </div>
            <p className="text-neutral-500">You haven't created any forms yet.</p>
            <Link to="/forms/new" className="text-indigo-600 font-bold mt-2 inline-block">Create your first form</Link>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {forms.map((form, idx) => (
              <motion.div
                key={form.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group hover:bg-neutral-50 transition-colors"
              >
                <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-neutral-900 group-hover:text-indigo-600 transition-colors">{form.title}</h3>
                      {getStatus(form.deadline)}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1.5" />
                        Expires {format(new Date(form.deadline), 'MMM d, yyyy')}
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1.5" />
                        {form.response_count} responses
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/forms/${form.id}/analysis`}
                      className="p-2 text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      title="View Analysis"
                    >
                      <BarChart3 className="h-5 w-5" />
                    </Link>
                    <Link
                      to={`/forms/${form.id}/edit`}
                      className="p-2 text-neutral-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                      title="Edit Form"
                    >
                      <Edit3 className="h-5 w-5" />
                    </Link>
                    <Link
                      to={`/forms/${form.id}/analysis`}
                      className="ml-2 p-2 bg-neutral-100 text-neutral-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-all"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyDashboard;

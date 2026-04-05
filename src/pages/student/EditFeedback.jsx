import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { editFeedback, getFormDetails } from '../../services/firebaseData.js';
import { ArrowLeft, Save, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const EditFeedback = () => {
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchForm = async () => {
      if (!user) return;
      try {
        const response = await getFormDetails(id, user);
        const { form, questions, answers: existingAnswers } = response;
        
        if (!form.allow_edit_response) {
          navigate('/');
          return;
        }

        setForm(form);
        setQuestions(questions);
        
        const initialAnswers = {};
        questions.forEach((question) => {
          initialAnswers[question.id] = question.type === 'rating'
            ? { rating_value: 0, answer_text: '' }
            : { answer_text: '', rating_value: null };
        });
        existingAnswers.forEach((a) => {
          initialAnswers[a.question_id] = { 
            rating_value: a.rating_value, 
            answer_text: a.answer_text || '' 
          };
        });
        setAnswers(initialAnswers);
      } catch (err) {
        setError(err.message || 'Failed to load feedback details.');
      } finally {
        setLoading(false);
      }
    };
    fetchForm();
  }, [id, navigate, user]);

  const handleRatingChange = (questionId, rating) => {
    setAnswers({
      ...answers,
      [questionId]: { ...(answers[questionId] || {}), rating_value: rating }
    });
  };

  const handleTextChange = (questionId, text) => {
    setAnswers({
      ...answers,
      [questionId]: { ...(answers[questionId] || {}), answer_text: text }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const formattedAnswers = Object.keys(answers).map((qId) => {
        const val = answers[qId];
        return {
          question_id: qId,
          rating_value: val.rating_value,
          answer_text: val.answer_text
        };
      });
      await editFeedback(id, formattedAnswers, user);
      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.message || 'Failed to update feedback.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="max-w-3xl mx-auto p-8 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center">
        <AlertCircle className="h-5 w-5 mr-3" />
        {error || 'Feedback details not found'}
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-xl"
        >
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Updated!</h2>
          <p className="text-neutral-500">Your feedback has been updated successfully.</p>
          <p className="text-xs text-neutral-400 mt-4 italic">Redirecting to dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Edit Feedback</h1>
          <p className="text-neutral-500">{form.title}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center">
            <AlertCircle className="h-5 w-5 mr-3" />
            {error}
          </div>
        )}

        <div className="space-y-6">
          {questions.map((q, idx) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm"
            >
              <div className="flex gap-4 mb-6">
                <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-neutral-100 text-neutral-900 font-bold rounded-lg">
                  {idx + 1}
                </span>
                <h3 className="text-lg font-bold text-neutral-900">{q.question_text}</h3>
              </div>

              {q.type === 'rating' ? (
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-4">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => handleRatingChange(q.id, rating)}
                        className={cn(
                          "w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all",
                          answers[q.id]?.rating_value === rating
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-lg scale-110"
                            : "bg-white border-neutral-100 text-neutral-400 hover:border-indigo-200 hover:text-indigo-400"
                        )}
                      >
                        <span className="text-lg font-black">{rating}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <textarea
                  required
                  value={answers[q.id]?.answer_text || ''}
                  onChange={(e) => handleTextChange(q.id, e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none min-h-[120px] transition-all"
                />
              )}
            </motion.div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 text-neutral-600 font-bold hover:bg-neutral-100 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-10 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg flex items-center disabled:opacity-70"
          >
            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : (
              <Save className="h-5 w-5 mr-2" />
            )}
            Update Feedback
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditFeedback;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { createFeedbackForm } from '../../services/firebaseData.js';
import { Plus, Trash2, Save, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

const CreateForm = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [allowEdit, setAllowEdit] = useState(false);
  const [questions, setQuestions] = useState([
    { question_text: '', type: 'rating' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  const addQuestion = () => {
    setQuestions([...questions, { question_text: '', type: 'rating' }]);
  };

  const removeQuestion = (index) => {
    if (questions.length === 1) return;
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (questions.some(q => !q.question_text.trim())) {
      setError('Please fill in all question texts.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createFeedbackForm({
        title,
        description,
        deadline,
        allow_edit_response: allowEdit,
        questions
      }, user);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to create form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Create Feedback Form</h1>
          <p className="text-neutral-500">Design your questions and set a deadline</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center">
            <AlertCircle className="h-5 w-5 mr-3" />
            {error}
          </div>
        )}

        <div className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-neutral-900 border-b border-neutral-100 pb-4">General Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Form Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g., Course Feedback - Spring 2024"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px]"
                placeholder="Provide context for the feedback..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Deadline</label>
                <input
                  type="datetime-local"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center cursor-pointer group p-2.5 rounded-xl hover:bg-neutral-50 transition-colors w-full">
                  <input
                    type="checkbox"
                    checked={allowEdit}
                    onChange={(e) => setAllowEdit(e.target.checked)}
                    className="w-5 h-5 text-indigo-600 border-neutral-300 rounded focus:ring-indigo-500"
                  />
                  <span className="ml-3 text-sm font-semibold text-neutral-700">Allow students to edit responses</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-neutral-900">Questions</h2>
            <button
              type="button"
              onClick={addQuestion}
              className="inline-flex items-center px-3 py-1.5 text-sm font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add Question
            </button>
          </div>

          <div className="space-y-4">
            {questions.map((q, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm relative group"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-grow space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 bg-neutral-100 text-neutral-500 text-xs font-bold rounded-full">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        required
                        value={q.question_text}
                        onChange={(e) => updateQuestion(idx, 'question_text', e.target.value)}
                        className="flex-grow px-3 py-2 bg-transparent border-b border-neutral-100 focus:border-indigo-500 outline-none font-medium text-neutral-900"
                        placeholder="Enter your question here..."
                      />
                    </div>
                    <div className="flex items-center gap-4 pl-8">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name={`type-${idx}`}
                          checked={q.type === 'rating'}
                          onChange={() => updateQuestion(idx, 'type', 'rating')}
                          className="w-4 h-4 text-indigo-600 border-neutral-300 focus:ring-indigo-500"
                        />
                        <span className="ml-2 text-sm text-neutral-600">Rating (1-5)</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name={`type-${idx}`}
                          checked={q.type === 'text'}
                          onChange={() => updateQuestion(idx, 'type', 'text')}
                          className="w-4 h-4 text-indigo-600 border-neutral-300 focus:ring-indigo-500"
                        />
                        <span className="ml-2 text-sm text-neutral-600">Text Response</span>
                      </label>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeQuestion(idx)}
                    disabled={questions.length === 1}
                    className="p-2 text-neutral-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all self-start disabled:opacity-0"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
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
            disabled={loading}
            className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-sm flex items-center disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : (
              <Save className="h-5 w-5 mr-2" />
            )}
            Create Form
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateForm;

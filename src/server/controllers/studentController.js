import db from '../db.js';

export const getAvailableForms = async (req, res) => {
  const student_id = req.user?.id;
  try {
    const forms = db.prepare(`
      SELECT f.*, u.name as faculty_name
      FROM feedback_forms f
      JOIN users u ON f.faculty_id = u.id
      WHERE f.deadline > CURRENT_TIMESTAMP
      AND f.id NOT IN (SELECT form_id FROM responses WHERE student_id = ?)
      ORDER BY f.deadline ASC
    `).all(student_id);
    res.json(forms);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching available forms', error: error.message });
  }
};

export const getStudentHistory = async (req, res) => {
  const student_id = req.user?.id;
  try {
    const history = db.prepare(`
      SELECT r.*, f.title, f.description, f.deadline, f.allow_edit_response, u.name as faculty_name
      FROM responses r
      JOIN feedback_forms f ON r.form_id = f.id
      JOIN users u ON f.faculty_id = u.id
      WHERE r.student_id = ?
      ORDER BY r.submitted_at DESC
    `).all(student_id);
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching history', error: error.message });
  }
};

export const submitResponse = async (req, res) => {
  const { id: form_id } = req.params;
  const { answers } = req.body;
  const student_id = req.user?.id;

  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({ message: 'Answers are required' });
  }

  const transaction = db.transaction(() => {
    const form = db.prepare('SELECT * FROM feedback_forms WHERE id = ?').get(form_id);
    if (!form) throw new Error('Form not found');
    if (new Date(form.deadline) < new Date()) throw new Error('Deadline has passed');

    const existing = db.prepare('SELECT id FROM responses WHERE form_id = ? AND student_id = ?').get(form_id, student_id);
    if (existing) throw new Error('Already submitted');

    const responseStmt = db.prepare(`
      INSERT INTO responses (form_id, student_id)
      VALUES (?, ?)
    `);
    const responseResult = responseStmt.run(form_id, student_id);
    const responseId = responseResult.lastInsertRowid;

    const answerStmt = db.prepare(`
      INSERT INTO answers (response_id, question_id, answer_text, rating_value)
      VALUES (?, ?, ?, ?)
    `);

    for (const a of answers) {
      answerStmt.run(responseId, a.question_id, a.answer_text || null, a.rating_value || null);
    }

    return responseId;
  });

  try {
    transaction();
    res.status(201).json({ message: 'Feedback submitted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const editResponse = async (req, res) => {
  const { id: form_id } = req.params;
  const { answers } = req.body;
  const student_id = req.user?.id;

  const transaction = db.transaction(() => {
    const form = db.prepare('SELECT * FROM feedback_forms WHERE id = ?').get(form_id);
    if (!form) throw new Error('Form not found');
    if (!form.allow_edit_response) throw new Error('Editing responses is not allowed for this form');
    if (new Date(form.deadline) < new Date()) throw new Error('Deadline has passed');

    const response = db.prepare('SELECT id FROM responses WHERE form_id = ? AND student_id = ?').get(form_id, student_id);
    if (!response) throw new Error('Response not found');

    db.prepare('UPDATE responses SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(response.id);

    const updateAnswerStmt = db.prepare(`
      UPDATE answers 
      SET answer_text = ?, rating_value = ?
      WHERE response_id = ? AND question_id = ?
    `);

    for (const a of answers) {
      updateAnswerStmt.run(a.answer_text || null, a.rating_value || null, response.id, a.question_id);
    }
  });

  try {
    transaction();
    res.json({ message: 'Response updated successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getFormDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const form = db.prepare(`
      SELECT f.*, u.name as faculty_name
      FROM feedback_forms f
      JOIN users u ON f.faculty_id = u.id
      WHERE f.id = ?
    `).get(id);
    
    if (!form) return res.status(404).json({ message: 'Form not found' });

    const questions = db.prepare('SELECT * FROM questions WHERE form_id = ?').all(id);
    
    const response = db.prepare('SELECT * FROM responses WHERE form_id = ? AND student_id = ?').get(id, req.user?.id);
    let answers = [];
    if (response) {
      answers = db.prepare('SELECT * FROM answers WHERE response_id = ?').all(response.id);
    }

    res.json({ form, questions, response, answers });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching form details', error: error.message });
  }
};

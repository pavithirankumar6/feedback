import db from '../db.js';

export const createForm = async (req, res) => {
  const { title, description, deadline, allow_edit_response, questions } = req.body;
  const faculty_id = req.user?.id;

  if (!title || !deadline || !questions || !Array.isArray(questions)) {
    return res.status(400).json({ message: 'Title, deadline, and questions are required' });
  }

  const transaction = db.transaction(() => {
    const formStmt = db.prepare(`
      INSERT INTO feedback_forms (faculty_id, title, description, deadline, allow_edit_response)
      VALUES (?, ?, ?, ?, ?)
    `);
    const formResult = formStmt.run(faculty_id, title, description, deadline, allow_edit_response ? 1 : 0);
    const formId = formResult.lastInsertRowid;

    const questionStmt = db.prepare(`
      INSERT INTO questions (form_id, question_text, type)
      VALUES (?, ?, ?)
    `);

    for (const q of questions) {
      questionStmt.run(formId, q.question_text, q.type);
    }

    return formId;
  });

  try {
    const formId = transaction();
    res.status(201).json({ message: 'Form created successfully', formId });
  } catch (error) {
    res.status(500).json({ message: 'Error creating form', error: error.message });
  }
};

export const updateForm = async (req, res) => {
  const { id } = req.params;
  const { title, description, deadline, allow_edit_response, questions } = req.body;
  const faculty_id = req.user?.id;

  const transaction = db.transaction(() => {
    // Check ownership
    const form = db.prepare('SELECT * FROM feedback_forms WHERE id = ? AND faculty_id = ?').get(id, faculty_id);
    if (!form) throw new Error('Form not found or unauthorized');

    db.prepare(`
      UPDATE feedback_forms 
      SET title = ?, description = ?, deadline = ?, allow_edit_response = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title, description, deadline, allow_edit_response ? 1 : 0, id);

    if (questions && Array.isArray(questions)) {
      db.prepare('DELETE FROM questions WHERE form_id = ?').run(id);
      const questionStmt = db.prepare(`
        INSERT INTO questions (form_id, question_text, type)
        VALUES (?, ?, ?)
      `);
      for (const q of questions) {
        questionStmt.run(id, q.question_text, q.type);
      }
    }
  });

  try {
    transaction();
    res.json({ message: 'Form updated successfully' });
  } catch (error) {
    res.status(error.message === 'Form not found or unauthorized' ? 403 : 500).json({ message: error.message });
  }
};

export const getFacultyForms = async (req, res) => {
  const faculty_id = req.user?.id;
  try {
    const forms = db.prepare(`
      SELECT f.*, 
      (SELECT COUNT(*) FROM responses r WHERE r.form_id = f.id) as response_count
      FROM feedback_forms f 
      WHERE f.faculty_id = ?
      ORDER BY f.created_at DESC
    `).all(faculty_id);
    res.json(forms);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching forms', error: error.message });
  }
};

export const getFormResponses = async (req, res) => {
  const { id } = req.params;
  const faculty_id = req.user?.id;

  try {
    const form = db.prepare('SELECT * FROM feedback_forms WHERE id = ? AND faculty_id = ?').get(id, faculty_id);
    if (!form) return res.status(403).json({ message: 'Unauthorized' });

    const responses = db.prepare(`
      SELECT r.*, u.name as student_name, u.email as student_email
      FROM responses r
      JOIN users u ON r.student_id = u.id
      WHERE r.form_id = ?
      ORDER BY r.submitted_at DESC
    `).all(id);

    const responsesWithAnswers = responses.map((r) => {
      const answers = db.prepare(`
        SELECT a.*, q.question_text, q.type
        FROM answers a
        JOIN questions q ON a.question_id = q.id
        WHERE a.response_id = ?
      `).all(r.id);
      return { ...r, answers };
    });

    res.json(responsesWithAnswers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching responses', error: error.message });
  }
};

export const getFormAnalysis = async (req, res) => {
  const { id } = req.params;
  const faculty_id = req.user?.id;

  try {
    const form = db.prepare('SELECT * FROM feedback_forms WHERE id = ? AND faculty_id = ?').get(id, faculty_id);
    if (!form) return res.status(403).json({ message: 'Unauthorized' });

    const questions = db.prepare('SELECT * FROM questions WHERE form_id = ?').all(id);
    
    const analysis = questions.map((q) => {
      if (q.type === 'rating') {
        const stats = db.prepare(`
          SELECT 
            AVG(rating_value) as average,
            COUNT(rating_value) as total,
            SUM(CASE WHEN rating_value = 1 THEN 1 ELSE 0 END) as r1,
            SUM(CASE WHEN rating_value = 2 THEN 1 ELSE 0 END) as r2,
            SUM(CASE WHEN rating_value = 3 THEN 1 ELSE 0 END) as r3,
            SUM(CASE WHEN rating_value = 4 THEN 1 ELSE 0 END) as r4,
            SUM(CASE WHEN rating_value = 5 THEN 1 ELSE 0 END) as r5
          FROM answers
          WHERE question_id = ?
        `).get(q.id);
        
        return {
          ...q,
          analysis: {
            average: stats.average || 0,
            total: stats.total || 0,
            distribution: {
              1: stats.r1 || 0,
              2: stats.r2 || 0,
              3: stats.r3 || 0,
              4: stats.r4 || 0,
              5: stats.r5 || 0
            }
          }
        };
      } else {
        const textResponses = db.prepare(`
          SELECT answer_text 
          FROM answers 
          WHERE question_id = ? AND answer_text IS NOT NULL AND answer_text != ''
        `).all(q.id);
        return {
          ...q,
          analysis: {
            responses: textResponses.map((r) => r.answer_text)
          }
        };
      }
    });

    const totalResponses = db.prepare('SELECT COUNT(*) as count FROM responses WHERE form_id = ?').get(id);

    res.json({
      form,
      totalResponses: totalResponses.count,
      questions: analysis
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analysis', error: error.message });
  }
};

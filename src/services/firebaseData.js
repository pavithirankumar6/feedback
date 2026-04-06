import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth, db, firebaseMissingConfig } from './firebase.js';

const USERS_COLLECTION = 'users';
const FORMS_COLLECTION = 'feedbackForms';
const RESPONSES_COLLECTION = 'responses';

function ensureFirebaseConfigured() {
  if (firebaseMissingConfig.length > 0) {
    throw new Error('Firebase configuration is incomplete. Add the VITE_FIREBASE_* values to your environment.');
  }
}

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function toIsoDate(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return null;
}

function mapUserProfile(id, data) {
  return {
    id,
    name: data.name,
    email: data.email,
    role: data.role,
  };
}

function mapForm(id, data) {
  return {
    id,
    ...data,
    deadline: toIsoDate(data.deadline) || data.deadline,
    createdAt: toIsoDate(data.createdAt),
    updatedAt: toIsoDate(data.updatedAt),
    allow_edit_response: Boolean(data.allowEditResponse),
    faculty_name: data.facultyName,
    questions: Array.isArray(data.questions) ? data.questions : [],
  };
}

function mapResponse(id, data) {
  return {
    id,
    ...data,
    form_id: data.formId,
    faculty_name: data.facultyName,
    submitted_at: toIsoDate(data.submittedAt),
    updated_at: toIsoDate(data.updatedAt),
    deadline: toIsoDate(data.deadline) || data.deadline,
    allow_edit_response: Boolean(data.allowEditResponse),
    answers: Array.isArray(data.answers) ? data.answers : [],
  };
}

function formatFirebaseError(error) {
  const code = error?.code || '';
  if (code === 'auth/email-already-in-use') return 'Email already exists';
  if (code === 'auth/invalid-email') return 'Please enter a valid email address';
  if (code === 'auth/weak-password') return 'Password must be at least 6 characters';
  if (code === 'auth/operation-not-allowed') return 'Enable Email/Password sign-in in Firebase Authentication.';
  if (code === 'auth/api-key-not-valid') return 'Your Firebase API key is invalid. Check the VITE_FIREBASE_* values.';
  if (code === 'auth/app-deleted') return 'Firebase app is not initialized correctly.';
  if (code === 'auth/invalid-api-key') return 'Your Firebase API key is invalid. Check the Firebase config.';
  if (code === 'auth/network-request-failed') return 'Network request failed. Check your internet connection and Firebase project settings.';
  if (code === 'auth/unauthorized-domain') return 'This domain is not authorized in Firebase Authentication settings.';
  if (code === 'auth/invalid-credential') return 'Invalid email or password';
  if (code === 'auth/user-not-found') return 'Invalid email or password';
  if (code === 'auth/wrong-password') return 'Invalid email or password';
  if (code === 'permission-denied') return 'You do not have permission to do this action';
  return error?.message || 'Something went wrong. Please try again.';
}

async function getUserProfile(uid) {
  ensureFirebaseConfigured();
  const userRef = doc(db, USERS_COLLECTION, uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    throw new Error('User profile not found');
  }
  return mapUserProfile(userSnap.id, userSnap.data());
}

function normalizeQuestions(questions) {
  return questions.map((question) => ({
    id: question.id || makeId(),
    question_text: question.question_text.trim(),
    type: question.type,
  }));
}

function buildResponseDocId(formId, studentId) {
  return `${formId}_${studentId}`;
}

function normalizeAnswers(answers) {
  return answers.map((answer) => ({
    question_id: answer.question_id,
    rating_value: answer.rating_value ?? null,
    answer_text: answer.answer_text?.trim() || '',
  }));
}

function sortByDateDesc(items, key) {
  return [...items].sort((a, b) => new Date(b[key] || 0) - new Date(a[key] || 0));
}

export async function registerWithFirebase({ name, email, password, role }) {
  ensureFirebaseConfigured();
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, USERS_COLLECTION, credential.user.uid), {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      createdAt: serverTimestamp(),
    });
    return await getUserProfile(credential.user.uid);
  } catch (error) {
    throw new Error(formatFirebaseError(error));
  }
}

export async function loginWithFirebase(email, password) {
  ensureFirebaseConfigured();
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return await getUserProfile(credential.user.uid);
  } catch (error) {
    throw new Error(formatFirebaseError(error));
  }
}

export function onFirebaseAuthChange(callback) {
  ensureFirebaseConfigured();
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      callback(null);
      return;
    }

    try {
      const userProfile = await getUserProfile(firebaseUser.uid);
      callback(userProfile);
    } catch (error) {
      console.error('Failed to load user profile', error);
      callback(null);
    }
  });
}

export async function logoutFromFirebase() {
  ensureFirebaseConfigured();
  await signOut(auth);
}

export async function createFeedbackForm(formData, currentUser) {
  ensureFirebaseConfigured();
  if (!currentUser || currentUser.role !== 'faculty') {
    throw new Error('Only faculty can create forms');
  }

  const questions = normalizeQuestions(formData.questions);
  const formRef = await addDoc(collection(db, FORMS_COLLECTION), {
    facultyId: currentUser.id,
    facultyName: currentUser.name,
    title: formData.title.trim(),
    description: formData.description?.trim() || '',
    deadline: new Date(formData.deadline).toISOString(),
    allowEditResponse: Boolean(formData.allow_edit_response ?? formData.allowEdit),
    questions,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return formRef.id;
}

export async function updateFeedbackForm(formId, formData, currentUser) {
  ensureFirebaseConfigured();
  const formRef = doc(db, FORMS_COLLECTION, formId);
  const formSnap = await getDoc(formRef);

  if (!formSnap.exists()) {
    throw new Error('Form not found');
  }

  if (formSnap.data().facultyId !== currentUser?.id) {
    throw new Error('You are not allowed to edit this form');
  }

  await updateDoc(formRef, {
    title: formData.title.trim(),
    description: formData.description?.trim() || '',
    deadline: new Date(formData.deadline).toISOString(),
    allowEditResponse: Boolean(formData.allow_edit_response ?? formData.allowEdit),
    questions: normalizeQuestions(formData.questions),
    updatedAt: serverTimestamp(),
  });
}

export async function getFacultyForms(currentUser) {
  ensureFirebaseConfigured();
  if (!currentUser) return [];

  const formsQuery = query(collection(db, FORMS_COLLECTION), where('facultyId', '==', currentUser.id));
  const responsesQuery = query(collection(db, RESPONSES_COLLECTION), where('facultyId', '==', currentUser.id));

  const [formsSnap, responsesSnap] = await Promise.all([getDocs(formsQuery), getDocs(responsesQuery)]);

  const responseCounts = {};
  responsesSnap.forEach((responseDoc) => {
    const response = responseDoc.data();
    responseCounts[response.formId] = (responseCounts[response.formId] || 0) + 1;
  });

  const forms = formsSnap.docs.map((formDoc) => {
    const form = mapForm(formDoc.id, formDoc.data());
    return {
      ...form,
      response_count: responseCounts[form.id] || 0,
    };
  });

  return sortByDateDesc(forms, 'createdAt');
}

export async function getFacultyFormAnalysis(formId, currentUser) {
  ensureFirebaseConfigured();
  const formSnap = await getDoc(doc(db, FORMS_COLLECTION, formId));
  if (!formSnap.exists()) {
    throw new Error('Form not found');
  }

  const form = mapForm(formSnap.id, formSnap.data());
  if (form.facultyId !== currentUser?.id) {
    throw new Error('You are not allowed to view this form');
  }

  const responsesSnap = await getDocs(
    query(
      collection(db, RESPONSES_COLLECTION),
      where('facultyId', '==', currentUser.id),
      where('formId', '==', formId)
    )
  );
  const responses = responsesSnap.docs.map((responseDoc) => mapResponse(responseDoc.id, responseDoc.data()));

  const questions = form.questions.map((question) => {
    const questionAnswers = responses
      .flatMap((response) => response.answers)
      .filter((answer) => answer.question_id === question.id);

    if (question.type === 'rating') {
      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let total = 0;
      let sum = 0;

      questionAnswers.forEach((answer) => {
        if (answer.rating_value) {
          distribution[answer.rating_value] += 1;
          total += 1;
          sum += answer.rating_value;
        }
      });

      return {
        ...question,
        analysis: {
          average: total > 0 ? sum / total : 0,
          total,
          distribution,
        },
      };
    }

    return {
      ...question,
      analysis: {
        responses: questionAnswers.map((answer) => answer.answer_text).filter(Boolean),
      },
    };
  });

  return {
    form,
    totalResponses: responses.length,
    questions,
  };
}

export async function getFormDetails(formId, currentUser) {
  ensureFirebaseConfigured();
  const formSnap = await getDoc(doc(db, FORMS_COLLECTION, formId));
  if (!formSnap.exists()) {
    throw new Error('Form not found');
  }

  const form = mapForm(formSnap.id, formSnap.data());
  let response = null;

  if (currentUser) {
    const responsesSnap = await getDocs(
      query(collection(db, RESPONSES_COLLECTION), where('studentId', '==', currentUser.id))
    );

    const matchingResponse = responsesSnap.docs.find((responseDoc) => responseDoc.data().formId === formId);
    response = matchingResponse ? mapResponse(matchingResponse.id, matchingResponse.data()) : null;
  }

  return {
    form,
    questions: form.questions,
    response,
    answers: response?.answers || [],
  };
}

export async function getAvailableForms(currentUser) {
  ensureFirebaseConfigured();
  if (!currentUser) return [];

  const [formsSnap, responsesSnap] = await Promise.all([
    getDocs(collection(db, FORMS_COLLECTION)),
    getDocs(query(collection(db, RESPONSES_COLLECTION), where('studentId', '==', currentUser.id))),
  ]);

  const submittedFormIds = new Set(responsesSnap.docs.map((responseDoc) => responseDoc.data().formId));

  return formsSnap.docs
    .map((formDoc) => mapForm(formDoc.id, formDoc.data()))
    .filter((form) => new Date(form.deadline) > new Date())
    .filter((form) => !submittedFormIds.has(form.id))
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
}

export async function getStudentHistory(currentUser) {
  ensureFirebaseConfigured();
  if (!currentUser) return [];

  const historySnap = await getDocs(
    query(collection(db, RESPONSES_COLLECTION), where('studentId', '==', currentUser.id))
  );

  const history = historySnap.docs.map((responseDoc) => mapResponse(responseDoc.id, responseDoc.data()));
  return sortByDateDesc(history, 'submitted_at');
}

export async function submitFeedback(formId, answers, currentUser) {
  ensureFirebaseConfigured();
  const formDetails = await getFormDetails(formId, currentUser);
  const { form, response } = formDetails;

  if (!currentUser || currentUser.role !== 'student') {
    throw new Error('Only students can submit feedback');
  }

  if (response) {
    throw new Error('Already submitted');
  }

  if (new Date(form.deadline) < new Date()) {
    throw new Error('Deadline has passed');
  }

  const responseId = buildResponseDocId(formId, currentUser.id);
  await setDoc(doc(db, RESPONSES_COLLECTION, responseId), {
    formId,
    studentId: currentUser.id,
    studentName: currentUser.name,
    studentEmail: currentUser.email,
    facultyId: form.facultyId,
    facultyName: form.facultyName,
    title: form.title,
    description: form.description,
    deadline: form.deadline,
    allowEditResponse: form.allow_edit_response,
    answers: normalizeAnswers(answers),
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function editFeedback(formId, answers, currentUser) {
  ensureFirebaseConfigured();
  const formDetails = await getFormDetails(formId, currentUser);
  const { form, response } = formDetails;

  if (!response) {
    throw new Error('Response not found');
  }

  if (!form.allow_edit_response) {
    throw new Error('Editing responses is not allowed for this form');
  }

  if (new Date(form.deadline) < new Date()) {
    throw new Error('Deadline has passed');
  }

  await updateDoc(doc(db, RESPONSES_COLLECTION, response.id), {
    answers: normalizeAnswers(answers),
    title: form.title,
    description: form.description,
    deadline: form.deadline,
    allowEditResponse: form.allow_edit_response,
    updatedAt: serverTimestamp(),
  });
}

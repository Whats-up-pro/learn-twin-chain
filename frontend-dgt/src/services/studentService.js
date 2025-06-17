export async function fetchStudents() {
  const res = await fetch('http://localhost:8000/api/v1/learning/students');
  if (!res.ok) throw new Error('Failed to fetch students');
  return res.json();
}

export async function fetchStudentDetail(twin_id) {
  const res = await fetch(`http://localhost:8000/api/v1/learning/students/${twin_id}`);
  if (!res.ok) throw new Error('Failed to fetch student detail');
  return res.json();
} 
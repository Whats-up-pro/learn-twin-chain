export async function fetchStudents() {
  console.log('Fetching students from API...');
  const res = await fetch('http://localhost:8000/api/v1/learning/students');
  if (!res.ok) throw new Error('Failed to fetch students');
  const data = await res.json();
  console.log('Raw API response:', data);
  
  // Handle both formats: array directly or object with students property
  let studentsArray;
  if (Array.isArray(data)) {
    // Old format: array directly
    studentsArray = data;
  } else if (data.students && Array.isArray(data.students)) {
    // New format: object with students property
    studentsArray = data.students;
  } else {
    throw new Error('Invalid data format from API');
  }
  
  console.log('Students array:', studentsArray);
  
  // Transform data to match expected format
  const transformedStudents = studentsArray.map(student => ({
    twin_id: student.twin_id || student.user_id,
    name: student.profile?.full_name || student.name || 'Unknown',
    avatar_url: student.avatar_url || '',
    has_digital_twin: true,
    digital_twin: student,
    // Add default values for missing data
    progress: student.learning_state?.progress || {},
    checkpoints: student.learning_state?.checkpoint_history || [],
    skills: student.skill_profile || {},
    last_updated: student.last_updated || new Date().toISOString(),
    // Add direct access to nested data
    profile: student.profile || {},
    learning_state: student.learning_state || {},
    skill_profile: student.skill_profile || {},
    interaction_logs: student.interaction_logs || {},
    latest_cid: student.latest_cid
  }));
  
  console.log('Transformed students:', transformedStudents);
  return transformedStudents;
}

export async function fetchStudentDetail(twin_id) {
  const res = await fetch(`http://localhost:8000/api/v1/learning/students/${twin_id}`);
  if (!res.ok) throw new Error('Failed to fetch student detail');
  return res.json();
}

export async function syncUsersAndTwins() {
  const res = await fetch('http://localhost:8000/api/v1/sync-users-twins', {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to sync users and twins');
  return res.json();
} 
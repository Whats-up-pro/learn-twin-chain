import { Grid, CircularProgress, Alert } from '@mui/material';
import StudentCard from './StudentCard';
import { useEffect, useState } from 'react';
import { fetchStudents } from '../services/studentService';

export default function StudentTwinOverview() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStudents()
      .then(setStudents)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Grid container spacing={3}>
      {students.map(student => (
        <Grid item xs={12} md={6} lg={4} key={student.twin_id}>
          <StudentCard student={student} />
        </Grid>
      ))}
    </Grid>
  );
} 
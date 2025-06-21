import { Stack, Box, CircularProgress, Alert } from '@mui/material';
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
    <Stack direction="row" flexWrap="wrap" sx={{ gap: 3 }}>
      {students.map(student => (
        <Box 
          key={student.twin_id}
          sx={{
            width: { 
              xs: '100%', 
              sm: 'calc(50% - 12px)', 
              md: 'calc(33.333% - 16px)', 
              lg: 'calc(20% - 20px)' 
            }
          }}
        >
          <StudentCard student={student} />
        </Box>
      ))}
    </Stack>
  );
} 
import { Stack, Box, CircularProgress, Alert, Button, Typography } from '@mui/material';
import StudentCard from './StudentCard';
import { useEffect, useState } from 'react';
import { fetchStudents, syncUsersAndTwins } from '../services/studentService';

export default function StudentTwinOverview() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);

  const loadStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchStudents();
      console.log('Fetched students data:', data);
      setStudents(data);
    } catch (e) {
      console.error('Error loading students:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncUsersAndTwins();
      await loadStudents(); // Reload data after sync
    } catch (e) {
      setError(e.message);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h2">
          Student Digital Twins ({students.length})
        </Typography>
        <Button 
          variant="contained" 
          onClick={handleSync}
          disabled={syncing}
        >
          {syncing ? 'Syncing...' : 'Sync Users & Twins'}
        </Button>
      </Box>
      
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
    </Box>
  );
} 
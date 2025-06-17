import React from 'react';
import { Box, Container } from '@mui/material';
import Header from './components/Header';
import SystemStatusCard from './components/SystemStatusCard';
import StudentTwinOverview from './components/StudentTwinOverview';

function App() {
  return (
    <Box sx={{ bgcolor: '#f4f8fb', minHeight: '100vh' }}>
      <Header />
      <Container maxWidth="xl" sx={{ mt: 3 }}>
        <SystemStatusCard />
        <StudentTwinOverview />
      </Container>
    </Box>
  );
}
export default App; 
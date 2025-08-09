import { AppBar, Toolbar, Typography } from '@mui/material';

export default function Header() {
  return (
    <AppBar position="static" sx={{ bgcolor: '#222' }}>
      <Toolbar>
        <Typography variant="h6" sx={{ flex: 1 }}>Student Digital Twin Dashboard</Typography>
      </Toolbar>
    </AppBar>
  );
} 
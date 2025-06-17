import { Card, CardContent, Typography, Grid, Chip } from '@mui/material';

export default function SystemStatusCard() {
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ bgcolor: '#00bcd4', color: '#fff', p: 1, borderRadius: 1, mb: 2 }}>
          System Status
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Typography fontWeight={700}>IPFS</Typography>
            <Chip label="Connected" color="success" size="small" sx={{ mt: 1, mb: 1 }} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography fontWeight={700}>Blockchain</Typography>
            <Chip label="Synced" color="success" size="small" sx={{ mt: 1, mb: 1 }} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography fontWeight={700}>API</Typography>
            <Chip label="Online" color="success" size="small" sx={{ mt: 1, mb: 1 }} />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
} 
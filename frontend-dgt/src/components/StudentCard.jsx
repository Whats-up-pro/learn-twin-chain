import { Card, CardContent, Typography, Button, Box, Chip, Dialog, DialogTitle, DialogContent, Divider, Grid } from '@mui/material';
import { useState } from 'react';
import ProgressChart from './ProgressChart';
import SkillRadar from './SkillRadar';
import CheckpointHistoryTable from './CheckpointHistoryTable';
import BlockchainNFTTable from './BlockchainNFTTable';

export default function StudentCard({ student }) {
  const [open, setOpen] = useState(false);
  const profile = student.profile || {};
  const learningState = student.learning_state || {};
  const skillProfile = student.skill_profile || {};
  const blockchain = student.blockchain_status || {};
  const interaction = student.interaction_logs || {};

  return (
    <>
      <Card>
        <CardContent>
          <Typography fontWeight={700}>{profile.full_name || student.twin_id}</Typography>
          <Typography variant="body2" color="text.secondary">{student.twin_id}</Typography>
          <Box sx={{ mt: 1 }}>
            <Chip label={profile.program || 'N/A'} color="primary" size="small" sx={{ mr: 1 }} />
            <Chip label={profile.institution || 'N/A'} color="info" size="small" />
          </Box>
          <Typography sx={{ mt: 1 }}>Birth Year: {profile.birth_year || 'N/A'}</Typography>
          <Typography sx={{ mt: 1 }}>Enrolled: {profile.enrollment_date || 'N/A'}</Typography>
          <Typography sx={{ mt: 1 }}>Current Modules: {(learningState.current_modules && learningState.current_modules.join(', ')) || 'N/A'}</Typography>
          <Typography sx={{ mt: 1 }}>Skills: {skillProfile.programming_languages ? Object.keys(skillProfile.programming_languages).join(', ') : 'N/A'}</Typography>
          <Button size="small" variant="contained" sx={{ mt: 2 }} onClick={() => setOpen(true)}>
            View Details
          </Button>
        </CardContent>
      </Card>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Student Digital Twin Details</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight={700}>Profile</Typography>
              <Typography>Name: {profile.full_name}</Typography>
              <Typography>Birth Year: {profile.birth_year}</Typography>
              <Typography>Institution: {profile.institution}</Typography>
              <Typography>Program: {profile.program}</Typography>
              <Typography>Enrollment: {profile.enrollment_date}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight={700}>Learning State</Typography>
              <Typography>Current Modules: {(learningState.current_modules && learningState.current_modules.join(', ')) || 'N/A'}</Typography>
              <ProgressChart progress={learningState.progress} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight={700}>Programming Skills</Typography>
              <SkillRadar skills={skillProfile.programming_languages} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight={700}>Soft Skills</Typography>
              <SkillRadar skills={skillProfile.soft_skills} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight={700}>Checkpoint History</Typography>
              <CheckpointHistoryTable history={learningState.checkpoint_history} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight={700}>NFT Issued</Typography>
              <BlockchainNFTTable nfts={blockchain.nft_issued} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight={700}>Interaction Logs</Typography>
              <Typography>Last LLM Session: {interaction.last_llm_session || 'N/A'}</Typography>
              <Typography>Most Asked Topics: {(interaction.most_asked_topics && interaction.most_asked_topics.join(', ')) || 'N/A'}</Typography>
              <Typography>Preferred Learning Style: {interaction.preferred_learning_style || 'N/A'}</Typography>
            </Grid>
          </Grid>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" color="text.secondary">Raw JSON</Typography>
          <pre style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(student, null, 2)}
          </pre>
        </DialogContent>
      </Dialog>
    </>
  );
} 
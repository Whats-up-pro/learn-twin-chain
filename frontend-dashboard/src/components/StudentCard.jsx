import { Card, CardContent, Typography, Button, Box, Chip, Dialog, DialogTitle, DialogContent, Grid, Stack, Divider } from '@mui/material';
import { useState } from 'react';
import ProgressChart from './ProgressChart';
import SkillRadar from './SkillRadar';
import CheckpointHistoryTable from './CheckpointHistoryTable';
import BlockchainNFTTable from './BlockchainNFTTable';

export default function StudentCard({ student }) {
  const [open, setOpen] = useState(false);
  
  // Debug logging
  console.log('StudentCard received student data:', student);
  
  const profile = student.profile || {};
  const learningState = student.learning_state || {};
  const skillProfile = student.skill_profile || {};
  const blockchain = student.blockchain_status || {};
  const interaction = student.interaction_logs || {};

  return (
    <>
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography fontWeight={700} noWrap title={profile.full_name}>
              {profile.full_name || student.twin_id}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {student.twin_id}
            </Typography>
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              <Chip label={profile.program || 'N/A'} color="primary" size="small" />
              <Chip label={profile.institution || 'N/A'} color="info" size="small" />
            </Box>
            <Typography sx={{ mt: 1 }}>
              Birth Year: {profile.birth_year || 'N/A'}
            </Typography>
            <Typography sx={{ mt: 1 }}>
              Enrolled: {profile.enrollment_date || 'N/A'}
            </Typography>
            <Typography sx={{ mt: 1 }} noWrap title={(learningState.current_modules && learningState.current_modules.join(', ')) || 'N/A'}>
              Current Modules: {(learningState.current_modules && learningState.current_modules.join(', ')) || 'N/A'}
            </Typography>
            <Typography sx={{ mt: 1 }} noWrap title={skillProfile.programming_languages ? Object.keys(skillProfile.programming_languages).join(', ') : 'N/A'}>
              Skills: {skillProfile.programming_languages ? Object.keys(skillProfile.programming_languages).join(', ') : 'N/A'}
            </Typography>
          </Box>
          <Button size="small" variant="contained" sx={{ mt: 2 }} onClick={() => setOpen(true)}>
            View Details
          </Button>
        </CardContent>
      </Card>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Student Digital Twin Details</DialogTitle>
        <DialogContent>
          <Stack spacing={3} divider={<Divider />}>
            {/* --- Profile --- */}
            <Box sx={{ pt: 1 }}>
              <Typography variant="h6" gutterBottom>Profile</Typography>
              <Grid container spacing={1}>
                <Grid item xs={12} sm={6}>
                  <Typography><strong>Name:</strong> {profile.full_name}</Typography>
                  <Typography sx={{ mt: 1 }}><strong>Birth Year:</strong> {profile.birth_year}</Typography>
                  <Typography sx={{ mt: 1 }}><strong>Enrollment:</strong> {profile.enrollment_date}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography><strong>Institution:</strong> {profile.institution}</Typography>
                  <Typography sx={{ mt: 1 }}><strong>Program:</strong> {profile.program}</Typography>
                </Grid>
              </Grid>
            </Box>

            {/* --- Academic Snapshot --- */}
            <Box>
              <Typography variant="h6" gutterBottom>Academic Snapshot</Typography>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={500}>Learning State</Typography>
                  <Typography><strong>Current Modules:</strong> {(learningState.current_modules && learningState.current_modules.join(', ')) || 'N/A'}</Typography>
                  <Box sx={{ mt: 1, p: 2, border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                    <ProgressChart progress={learningState.progress} />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={500}>Skills</Typography>
                  <Stack spacing={2} sx={{ mt: 1 }}>
                    <Box>
                      <Typography align="center">Programming Skills</Typography>
                      <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: '4px', mt: 1 }}>
                        <SkillRadar skills={skillProfile.programming_languages} />
                      </Box>
                    </Box>
                    <Box>
                      <Typography align="center">Soft Skills</Typography>
                      <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: '4px', mt: 1 }}>
                        <SkillRadar skills={skillProfile.soft_skills} />
                      </Box>
                    </Box>
                  </Stack>
                </Box>
              </Stack>
            </Box>
            
            {/* --- Blockchain Records --- */}
            <Box>
              <Typography variant="h6" gutterBottom>Blockchain Records</Typography>
              <Grid container spacing={3}>
                <Grid item xs={6} sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="subtitle1" fontWeight={500}>Checkpoint History</Typography>
                  <Box sx={{ flexGrow: 1, mt: 1 }}>
                    <CheckpointHistoryTable history={learningState.checkpoint_history} />
                  </Box>
                </Grid>
                <Grid item xs={6} sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="subtitle1" fontWeight={500}>NFT Issued</Typography>
                  <Box sx={{ flexGrow: 1, mt: 1 }}>
                    <BlockchainNFTTable nfts={blockchain.nft_issued} />
                  </Box>
                </Grid>
              </Grid>
            </Box>

            {/* --- Additional Data --- */}
            <Box>
              <Typography variant="h6" gutterBottom>Additional Data</Typography>
              <Grid container spacing={3}>
                <Grid item xs={6} sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="subtitle1" fontWeight={500}>Interaction Logs</Typography>
                  <Box sx={{ mt: 1, p: 2, border: '1px solid #e0e0e0', borderRadius: '4px', flexGrow: 1 }}>
                    {student.latest_cid && (
                      <Typography>
                        <strong>Latest CID:</strong>{' '}
                        <a 
                          href={`https://gateway.pinata.cloud/ipfs/${student.latest_cid}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          {student.latest_cid.substring(0, 15)}...
                        </a>
                      </Typography>
                    )}
                    <Typography><strong>Last LLM Session:</strong> {interaction.last_llm_session || 'N/A'}</Typography>
                    <Typography><strong>Most Asked Topics:</strong> {(interaction.most_asked_topics && interaction.most_asked_topics.join(', ')) || 'N/A'}</Typography>
                    <Typography><strong>Preferred Learning Style:</strong> {interaction.preferred_learning_style || 'N/A'}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="subtitle1" fontWeight={500}>Raw JSON</Typography>
                  <Box sx={{ mt: 1, p: 2, border: '1px solid #e0e0e0', borderRadius: '4px', flexGrow: 1, overflow: 'auto' }}>
                    <pre style={{ fontSize: 14, whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>
                      {JSON.stringify(student, null, 2)}
                    </pre>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
} 
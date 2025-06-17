import { Table, TableHead, TableRow, TableCell, TableBody, Chip } from '@mui/material';

export default function CheckpointHistoryTable({ history }) {
  if (!history || !history.length) return null;
  return (
    <Table size="small" sx={{ mt: 2 }}>
      <TableHead>
        <TableRow>
          <TableCell>Module</TableCell>
          <TableCell>Completed At</TableCell>
          <TableCell>Tokenized</TableCell>
          <TableCell>NFT CID</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {history.map((item, idx) => (
          <TableRow key={idx}>
            <TableCell>{item.module}</TableCell>
            <TableCell>{item.completed_at || 'N/A'}</TableCell>
            <TableCell>
              <Chip label={item.tokenized ? 'Yes' : 'No'} color={item.tokenized ? 'success' : 'default'} size="small" />
            </TableCell>
            <TableCell>{item.nft_cid || 'N/A'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
} 
import { Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';

// Helper function to format date to Vietnam timezone
const formatToVietnamTime = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    const vietnamTime = new Date(date.getTime() + (7 * 60 * 60 * 1000)); // UTC+7
    
    const day = String(vietnamTime.getUTCDate()).padStart(2, '0');
    const month = String(vietnamTime.getUTCMonth() + 1).padStart(2, '0');
    const year = vietnamTime.getUTCFullYear();
    const hours = String(vietnamTime.getUTCHours()).padStart(2, '0');
    const minutes = String(vietnamTime.getUTCMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (error) {
    return dateString; // Return original if parsing fails
  }
};

export default function BlockchainNFTTable({ nfts }) {
  if (!nfts || !nfts.length) return null;
  return (
    <Table size="small" sx={{ mt: 2 }}>
      <TableHead>
        <TableRow>
          <TableCell>Title</TableCell>
          <TableCell>CID</TableCell>
          <TableCell>Issued At</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {nfts.map((item, idx) => (
          <TableRow key={idx}>
            <TableCell>{item.title}</TableCell>
            <TableCell>{item.cid}</TableCell>
            <TableCell>{formatToVietnamTime(item.issued_at)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
} 
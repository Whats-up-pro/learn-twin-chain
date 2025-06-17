import { Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';

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
            <TableCell>{item.issued_at}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
} 
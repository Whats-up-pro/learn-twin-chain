import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ProgressChart({ progress }) {
  if (!progress) return null;
  const data = Object.entries(progress).map(([module, value]) => ({ module, value }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="module" />
        <YAxis domain={[0, 1]} />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke="#1976d2" />
      </LineChart>
    </ResponsiveContainer>
  );
} 
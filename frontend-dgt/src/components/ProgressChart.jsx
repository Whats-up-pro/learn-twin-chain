import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ProgressChart({ progress }) {
  if (!progress) return null;
  const data = Object.entries(progress).map(([module, value]) => ({ module, value }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 10, right: 20, left: 20, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="module" angle={-25} textAnchor="end" interval={0} tick={{ fontSize: 12 }} />
        <YAxis domain={[0, 1]} />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke="#1976d2" />
      </LineChart>
    </ResponsiveContainer>
  );
} 
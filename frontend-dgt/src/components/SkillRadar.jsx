import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

export default function SkillRadar({ skills }) {
  if (!skills) return null;
  const data = Object.entries(skills).map(([name, value]) => ({ skill: name, value }));
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="skill" tick={{ fontSize: 14 }} />
        <PolarRadiusAxis angle={45} domain={[0, 1]} />
        <Radar name="Skill" dataKey="value" stroke="#1976d2" fill="#1976d2" fillOpacity={0.6} />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  );
} 
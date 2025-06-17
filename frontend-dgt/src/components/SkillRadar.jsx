import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

export default function SkillRadar({ skills }) {
  if (!skills) return null;
  const data = Object.entries(skills).map(([name, value]) => ({ skill: name, value }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <RadarChart data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="skill" />
        <PolarRadiusAxis domain={[0, 1]} />
        <Radar name="Skill" dataKey="value" stroke="#1976d2" fill="#1976d2" fillOpacity={0.6} />
      </RadarChart>
    </ResponsiveContainer>
  );
} 
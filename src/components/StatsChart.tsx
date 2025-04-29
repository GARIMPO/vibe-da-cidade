import React, { memo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartProps {
  viewCount: number;
}

const StatsChart: React.FC<ChartProps> = ({ viewCount }) => {
  // Preparar dados para o gráfico
  const chartData = [{ name: 'Visualizações', value: viewCount }];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis dataKey="name" stroke="#fff" />
        <YAxis stroke="#fff" />
        <Tooltip 
          contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#fff' }}
          labelStyle={{ color: '#fff' }}
        />
        <Bar dataKey="value" fill="#40ffaa" />
      </BarChart>
    </ResponsiveContainer>
  );
};

// Uso de memo para evitar re-renderizações desnecessárias
export default memo(StatsChart); 
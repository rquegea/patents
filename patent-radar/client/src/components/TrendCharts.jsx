import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { COUNTRY_COORDS } from '../utils/countryCoords';

const COLORS = ['#2eaadc', '#cb912f', '#0f7b6c', '#9065b0', '#e03e3e', '#d9730d', '#6940a5', '#448361', '#337ea9', '#c29243'];

const chartTooltipStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e9e9e7',
  borderRadius: '4px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  color: '#37352f',
  fontSize: '12px',
};

export default function TrendCharts({ analytics }) {
  if (!analytics) return (
    <div className="py-12 text-center text-sm text-text-secondary">Run a search to see trends.</div>
  );

  const yearData = useMemo(() => {
    return Object.entries(analytics.byYear || {})
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year.localeCompare(b.year));
  }, [analytics.byYear]);

  const countryData = useMemo(() => {
    return Object.entries(analytics.byCountry || {})
      .map(([code, count]) => ({ name: COUNTRY_COORDS[code]?.name || code, code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [analytics.byCountry]);

  const applicantData = useMemo(() => {
    return Object.entries(analytics.byApplicant || {})
      .map(([name, count]) => ({ name: name.length > 25 ? name.substring(0, 25) + '...' : name, fullName: name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [analytics.byApplicant]);

  const ipcData = useMemo(() => {
    return Object.entries(analytics.byIPC || {})
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [analytics.byIPC]);

  const axisStyle = { fill: '#9b9a97', fontSize: 11 };
  const axisLine = { stroke: '#e9e9e7' };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div>
        <h3 className="text-xs text-text-secondary mb-3">Patents by year</h3>
        {yearData.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={yearData}>
              <XAxis dataKey="year" tick={axisStyle} axisLine={axisLine} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={axisLine} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
              <Bar dataKey="count" fill="#2eaadc" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <div className="h-[180px] flex items-center justify-center text-text-secondary text-xs">No data</div>}
      </div>

      <div>
        <h3 className="text-xs text-text-secondary mb-3">By country</h3>
        {countryData.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={countryData}
                dataKey="count"
                nameKey="code"
                cx="50%" cy="50%"
                outerRadius={70}
                label={({ code, percent }) => `${code} ${(percent * 100).toFixed(0)}%`}
                labelLine={{ stroke: '#d3d1cb' }}
                fontSize={10}
                strokeWidth={1}
                stroke="#ffffff"
              >
                {countryData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={chartTooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        ) : <div className="h-[180px] flex items-center justify-center text-text-secondary text-xs">No data</div>}
      </div>

      <div>
        <h3 className="text-xs text-text-secondary mb-3">Top applicants</h3>
        {applicantData.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={applicantData} layout="vertical" margin={{ left: 5 }}>
              <XAxis type="number" tick={axisStyle} axisLine={axisLine} tickLine={false} />
              <YAxis type="category" dataKey="name" width={130} tick={{ ...axisStyle, fontSize: 10 }} axisLine={axisLine} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(value, name, props) => [value, props.payload.fullName]} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
              <Bar dataKey="count" fill="#cb912f" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <div className="h-[180px] flex items-center justify-center text-text-secondary text-xs">No data</div>}
      </div>

      <div>
        <h3 className="text-xs text-text-secondary mb-3">IPC classification</h3>
        {ipcData.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={ipcData}
                dataKey="count"
                nameKey="code"
                cx="50%" cy="50%"
                outerRadius={70}
                label={({ code, percent }) => `${code} ${(percent * 100).toFixed(0)}%`}
                labelLine={{ stroke: '#d3d1cb' }}
                fontSize={10}
                strokeWidth={1}
                stroke="#ffffff"
              >
                {ipcData.map((_, i) => (
                  <Cell key={i} fill={COLORS[(i + 3) % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={chartTooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        ) : <div className="h-[180px] flex items-center justify-center text-text-secondary text-xs">No data</div>}
      </div>
    </div>
  );
}

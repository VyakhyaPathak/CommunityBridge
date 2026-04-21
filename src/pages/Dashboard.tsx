import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Building, 
  Users, 
  CheckCircle2, 
  TrendingUp, 
  AlertTriangle, 
  Calendar,
  Sparkles,
  Map as MapIcon,
  ArrowUpRight
} from 'lucide-react';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Heatmap logic component
const Heatmap: React.FC<{ data: any[] }> = ({ data }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !data.length) return;

    const heatmapData = data.map(point => ({
      location: new google.maps.LatLng(point.lat, point.lng),
      weight: point.weight
    }));

    const heatmap = new google.maps.visualization.HeatmapLayer({
      data: heatmapData,
      map: map,
      radius: 40,
      opacity: 0.8
    });

    return () => {
      heatmap.setMap(null);
    };
  }, [map, data]);

  return null;
};

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({ total: 0, open: 0, resolved: 0, volunteers: 0 });
  const [heatmapData, setHeatmapData] = useState([]);
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, heatmapRes, reportRes] = await Promise.all([
          axios.get('/api/needs/stats'),
          axios.get('/api/needs/heatmap'),
          axios.get('/api/ai/report?period=30d')
        ]);
        setStats(statsRes.data.data);
        setHeatmapData(heatmapRes.data.data);
        setReport(reportRes.data.data);
      } catch (error) {
        console.error('Dashboard fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const chartData = useMemo(() => {
    if (!report?.top_categories) return [];
    return report.top_categories.map((cat: string, idx: number) => ({
      name: cat,
      value: 100 - idx * 15 // Mocking relative frequency for chart
    }));
  }, [report]);

  const mapCenter = { lat: 26.9124, lng: 75.7873 }; // Jaipur center

  return (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''} libraries={['visualization']}>
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-brand-primary">Network Overview</h1>
            <p className="text-slate-500">Global response status and regional hotspot tracking.</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-3">
             <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Last updated</span>
                <span className="text-xs font-medium text-slate-900 leading-none">A few moments ago</span>
             </div>
             <div className="w-10 h-10 bg-white border border-brand-border rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-slate-400" />
             </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Needs', value: stats.total, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
            { label: 'Active Tasks', value: stats.open, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50' },
            { label: 'Resolved', value: stats.resolved, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
            { label: 'Network Volunteers', value: stats.volunteers, icon: Users, color: 'text-brand-primary', bg: 'bg-slate-100' },
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="card-base p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bg} p-3 rounded-xl`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <button className="text-slate-300 hover:text-slate-900 transition-colors">
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-slate-900">{stat.value}</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">{stat.label}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Map View */}
          <div className="lg:col-span-8 flex flex-col space-y-6">
            <div className="card-base h-[500px] relative">
              <div className="absolute top-4 left-4 z-10 space-y-2">
                 <div className="bg-white/90 backdrop-blur-md border border-brand-border px-4 py-2 rounded-lg shadow-sm flex items-center space-x-3">
                    <div className="w-2 h-2 bg-brand-accent rounded-full animate-pulse" />
                    <span className="text-xs font-bold text-slate-900">Live Needs Heatmap</span>
                 </div>
              </div>
              <Map
                defaultCenter={mapCenter}
                defaultZoom={5}
                gestureHandling={'greedy'}
                disableDefaultUI={true}
                styles={[
                   {
                     featureType: 'all',
                     elementType: 'labels.text.fill',
                     stylers: [{ color: '#746855' }]
                   },
                   {
                     featureType: 'water',
                     elementType: 'geometry.fill',
                     stylers: [{ color: '#c9ccd0' }]
                   },
                   {
                      featureType: 'landscape',
                      elementType: 'geometry.fill',
                      stylers: [{ color: '#f5f5f5' }]
                   }
                ]}
              >
                <Heatmap data={heatmapData} />
              </Map>
            </div>

            {/* AI Insights Section */}
            <div className="card-base p-8 relative overflow-hidden">
               <div className="absolute -right-12 -top-12 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-50" />
               <div className="relative z-10">
                  <div className="flex items-center space-x-2 text-brand-primary mb-6">
                    <Sparkles className="w-5 h-5 text-brand-accent" />
                    <h3 className="text-lg font-bold">Community Trend Analysis</h3>
                  </div>
                  
                  {isLoading ? (
                    <div className="space-y-4 animate-pulse">
                      <div className="h-4 bg-slate-100 rounded w-3/4" />
                      <div className="h-4 bg-slate-100 rounded w-1/2" />
                    </div>
                  ) : report ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div>
                          <p className="text-slate-600 text-sm leading-relaxed mb-6">{report.summary}</p>
                          <div className="space-y-3">
                             <div className="p-3 bg-slate-50 rounded-lg">
                                <span className="section-label">Critical Hotspots</span>
                                <div className="flex flex-wrap gap-2 mt-2">
                                   {report.hotspots.map((h: string) => (
                                     <span key={h} className="px-2 py-0.5 bg-white border border-slate-200 text-[10px] font-bold text-slate-500 rounded uppercase">{h}</span>
                                   ))}
                                </div>
                             </div>
                             <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                                <span className="text-[10px] font-bold text-emerald-600 uppercase">Strategic Priority</span>
                                <p className="text-xs text-emerald-800 font-medium mt-1">{report.strategic_recommendation}</p>
                             </div>
                          </div>
                       </div>
                       <div>
                          <span className="section-label mb-4">Resource Distribution</span>
                          <div className="h-48">
                             <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                   <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                                   <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                   <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                      {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#0f172a'} />
                                      ))}
                                   </Bar>
                                </BarChart>
                             </ResponsiveContainer>
                          </div>
                       </div>
                    </div>
                  ) : (
                    <p className="text-slate-400 italic">Report data unavailable.</p>
                  )}
               </div>
            </div>
          </div>

          {/* Right Column: Alerts & Recent Activity */}
          <div className="lg:col-span-4 space-y-6">
             <div className="card-base p-6">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="font-bold text-slate-900">Urgent Gaps</h3>
                   <span className="bg-red-50 text-red-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase ring-1 ring-red-200">Alerts</span>
                </div>
                <div className="space-y-4">
                   {isLoading ? (
                     [1,2,3].map(i => <div key={i} className="h-12 bg-slate-100 rounded animate-pulse" />)
                   ) : report?.resource_gaps?.length > 0 ? (
                      report.resource_gaps.map((gap: string) => (
                         <div key={gap} className="flex items-start space-x-3 p-3 hover:bg-slate-50 transition-colors rounded-lg group cursor-pointer">
                            <div className="mt-1 w-2 h-2 rounded-full bg-red-400 group-hover:scale-110 transition-transform" />
                            <div>
                               <p className="text-sm font-bold text-slate-900 tracking-tight">{gap}</p>
                               <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Critical Supply Shortage</p>
                            </div>
                         </div>
                      ))
                   ) : (
                     <p className="text-xs text-slate-400 italic">No critical resource gaps identified.</p>
                   )}
                </div>
             </div>

             <div className="card-base p-6 bg-slate-900 border-none overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4">
                   <Users className="w-12 h-12 text-white/5" />
                </div>
                <h3 className="font-bold text-white mb-2">Volunteer Growth</h3>
                <p className="text-slate-400 text-xs mb-6">Network capacity has increased by **12%** this week.</p>
                <div className="flex items-center space-x-2 text-brand-accent">
                   <div className="flex -space-x-2">
                      {[1,2,3,4].map(i => (
                         <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px font-medium text-white">
                            {String.fromCharCode(64 + i)}
                         </div>
                      ))}
                   </div>
                   <span className="text-xs font-bold">+ {stats.volunteers} Active</span>
                </div>
             </div>

             <div className="card-base p-6 flex flex-col items-center justify-center text-center space-y-4">
                <div className="bg-slate-50 p-4 rounded-full">
                   <Building className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                   <h4 className="font-bold text-slate-900 text-sm">Need Help?</h4>
                   <p className="text-xs text-slate-500 max-w-[180px] mx-auto mt-1">Access NGO partnership resources and coordinator training documentation.</p>
                </div>
                <button className="btn-outline w-full tracking-wide uppercase text-[10px] font-black">Open Support</button>
             </div>
          </div>
        </div>
      </div>
    </APIProvider>
  );
};

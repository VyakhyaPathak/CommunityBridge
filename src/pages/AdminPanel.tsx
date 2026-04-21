import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { 
  BarChart3, 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  X,
  UserPlus,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function AdminPanel() {
  const { needs, fetchNeeds } = useStore();
  const [selectedNeed, setSelectedNeed] = useState<any>(null);
  const [aiMatches, setAiMatches] = useState<any[]>([]);
  const [isMatching, setIsMatching] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    fetchNeeds({ status: 'open' });
  }, []);

  const handleGetMatches = async (need: any) => {
    setSelectedNeed(need);
    setIsMatching(true);
    setAiMatches([]);
    try {
      const res = await axios.post('/api/ai/match', { need_id: need.id });
      const { need: needData, volunteers } = res.data.data;
      
      const { matchVolunteers } = await import('../lib/gemini');
      const matches = await matchVolunteers(needData, volunteers);
      setAiMatches(matches);
    } catch (err) {
      toast.error('Failed to get AI matches');
    } finally {
      setIsMatching(false);
    }
  };

  const handleAssign = async (volunteerId: string) => {
    try {
      await axios.post('/api/tasks', {
        need_id: selectedNeed.id,
        volunteer_id: volunteerId,
        coordinator_notes: note
      });
      toast.success('Volunteer assigned successfully!');
      setSelectedNeed(null);
      fetchNeeds({ status: 'open' });
    } catch (err) {
      toast.error('Failed to assign volunteer');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-10"
    >
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Resource Control Center</h1>
          <p className="text-sm text-slate-500 mt-1">Authorized portal for community dispatch and volunteer synchronization.</p>
        </div>
      </header>

      <div className="card-base">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h2 className="section-label !mb-0">Queued Commitments</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Title</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Urgency</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {needs.map((need: any) => (
                <tr key={need.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-900 group-hover:text-brand-primary transition-colors">{need.title}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono truncate max-w-xs">{need.description}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest py-1 px-2 bg-slate-100 rounded">
                      {need.category || 'Triage'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <span className={cn(
                        "text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center border",
                        (need.urgency_score || 0) >= 8 ? "bg-red-50 text-red-600 border-red-100" :
                        (need.urgency_score || 0) >= 5 ? "bg-amber-50 text-amber-600 border-amber-100" :
                        "bg-emerald-50 text-emerald-600 border-emerald-100"
                      )}>
                        {(need.urgency_score || 5).toFixed(0)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-[10px] text-slate-400 font-medium">
                      <MapPin className="w-3 h-3 mr-1 opacity-50" />
                      <span className="truncate max-w-[120px]">{need.address}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleGetMatches(need)}
                      className="btn-outline !py-1 text-[10px] uppercase tracking-widest font-bold"
                    >
                      AI Match
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Matching Modal */}
      <AnimatePresence>
        {selectedNeed && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNeed(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl card-base shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                   <h3 className="section-label !mb-0">Gemini Optimization Layer</h3>
                   <p className="text-lg font-bold text-slate-900">{selectedNeed.title}</p>
                </div>
                <button onClick={() => setSelectedNeed(null)} className="text-slate-400 hover:text-slate-900 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6">
                {isMatching ? (
                  <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
                    <p className="text-xs font-bold uppercase tracking-[0.2em] animate-pulse">Running Logistic Simulations...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <p className="section-label">Candidate Analysis</p>
                      <div className="space-y-3">
                        {aiMatches.map((match: any, idx: number) => (
                          <motion.div
                            key={match.volunteer_id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="p-5 border border-slate-100 rounded-xl hover:border-brand-primary transition-all group"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex gap-4">
                                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 font-bold text-xs">
                                  {match.volunteer_id.substring(0,2).toUpperCase()}
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-slate-900">Volunteer {match.volunteer_id.substring(0,4)}</h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-bold text-emerald-600 px-2 py-0.5 bg-emerald-50 rounded">OPTIMIZATION: {match.match_score || match.score}%</span>
                                    {match.is_local && (
                                      <span className="text-[10px] font-bold text-blue-600 px-2 py-0.5 bg-blue-50 rounded">LOCAL ASSET</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => handleAssign(match.volunteer_id)}
                                className="btn-primary !py-1.5 text-xs flex items-center gap-2"
                              >
                                Deploy <ChevronRight className="w-3 h-3" />
                              </button>
                            </div>
                            
                            <div className="mt-4 p-3 bg-slate-50 border-l-2 border-emerald-500 rounded text-[11px] text-slate-600 leading-relaxed font-medium italic">
                               "{match.reason}"
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <p className="section-label">Coordinator Dispatch Notes</p>
                      <textarea 
                        rows={3} 
                        placeholder="Specify deployment details..." 
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-1 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all text-sm mt-2"
                        value={note}
                        onChange={e => setNote(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

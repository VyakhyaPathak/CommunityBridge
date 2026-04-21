import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, MapPin, Briefcase, ChevronRight, CheckCircle2, Clock, Map as MapIcon, Star, Filter } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface Need {
  id: string;
  title: string;
  description: string;
  category: string;
  address: string;
  urgency_score: number;
}

interface MatchCandidate {
  id: string;
  name: string;
  distance_km: number;
  match_score: number;
  match_reason: string;
  skill_tags: string[];
}

export const VolunteerPortal: React.FC = () => {
  const [needs, setNeeds] = useState<Need[]>([]);
  const [selectedNeed, setSelectedNeed] = useState<Need | null>(null);
  const [matches, setMatches] = useState<MatchCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMatching, setIsMatching] = useState(false);

  useEffect(() => {
    const fetchNeeds = async () => {
      try {
        const response = await axios.get('/api/needs?status=open');
        setNeeds(response.data.data);
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNeeds();
  }, []);

  const handleSelectNeed = async (need: Need) => {
    setSelectedNeed(need);
    setIsMatching(true);
    setMatches([]);
    
    try {
      const response = await axios.get(`/api/ai/match/${need.id}`);
      setMatches(response.data.data);
    } catch (error) {
      toast.error('Matching failed. Service offline.');
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-brand-primary mb-1">Volunteer Portal</h1>
          <p className="text-slate-500">Connecting specialized skills to critical regional needs.</p>
        </div>
        <div className="flex items-center bg-white rounded-lg border border-brand-border p-1">
          <button className="px-4 py-1.5 text-xs font-bold bg-slate-900 text-white rounded-md">Open Needs</button>
          <button className="px-4 py-1.5 text-xs font-bold text-slate-400">My Assignments</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column: Needs list */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="section-label">{needs.length} Active Requests</span>
            <button className="text-xs font-bold text-brand-accent flex items-center space-x-1">
              <Filter className="w-3 h-3" />
              <span>Filter</span>
            </button>
          </div>
          
          <div className="space-y-3 h-[700px] overflow-y-auto pr-2 custom-scrollbar">
            {isLoading ? (
              [1, 2, 3].map(i => <div key={i} className="card-base h-24 animate-pulse bg-slate-50" />)
            ) : needs.length === 0 ? (
               <div className="card-base p-8 text-center bg-slate-50">
                  <p className="text-slate-400">No active needs found.</p>
               </div>
            ) : (
              needs.map((need) => (
                <motion.div
                  key={need.id}
                  whileHover={{ x: 4 }}
                  onClick={() => handleSelectNeed(need)}
                  className={`card-base p-5 cursor-pointer transition-all border-l-4 ${
                    selectedNeed?.id === need.id ? 'border-l-brand-accent bg-emerald-50/30' : 'border-l-transparent hover:border-l-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {need.category}
                    </span>
                    <div className="flex items-center text-amber-500 font-bold text-xs">
                      <Star className="w-3 h-3 mr-1 fill-current" />
                      <span>{need.urgency_score.toFixed(1)}</span>
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-900 line-clamp-1 mb-1">{need.title}</h3>
                  <div className="flex items-center text-slate-400 text-xs mt-2">
                    <MapPin className="w-3 h-3 mr-1" />
                    <span>{need.address.split(',')[0]}</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Right column: Matching / Details */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {!selectedNeed ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full card-base bg-slate-50 border-dashed flex flex-col items-center justify-center p-12 text-center"
              >
                <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                  <Briefcase className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-slate-900 font-bold mb-2">Select a need to coordinate</h3>
                <p className="text-slate-400 text-sm max-w-sm">
                  Choose a request from the list to see AI-ranked volunteer matches and resource allocation options.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={selectedNeed.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="card-base p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="section-label mb-2">Selected Request</span>
                      <h2 className="text-2xl font-bold text-slate-900">{selectedNeed.title}</h2>
                    </div>
                    <button className="btn-outline">Edit Need</button>
                  </div>
                  
                  <div className="bg-slate-50 rounded-lg p-5 mb-8">
                    <p className="text-slate-600 text-sm leading-relaxed">{selectedNeed.description}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-2">
                    <div className="p-4 bg-white rounded-xl border border-slate-100 flex flex-col">
                       <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Urgency</span>
                       <span className="text-lg font-bold text-slate-900">{selectedNeed.urgency_score.toFixed(1)}</span>
                    </div>
                    <div className="p-4 bg-white rounded-xl border border-slate-100 flex flex-col">
                       <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Category</span>
                       <span className="text-lg font-bold text-slate-900">{selectedNeed.category}</span>
                    </div>
                    <div className="p-4 bg-white rounded-xl border border-slate-100 flex flex-col">
                       <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Assignments</span>
                       <span className="text-lg font-bold text-slate-900">0</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-brand-accent" />
                        AI Recommended Matches
                      </h3>
                      <button className="text-xs font-bold text-brand-primary">View All Volunteers</button>
                   </div>

                   {isMatching ? (
                     <div className="card-base p-12 flex flex-col items-center justify-center space-y-4">
                        <div className="relative">
                          <div className="w-12 h-12 border-4 border-emerald-100 border-t-brand-accent rounded-full animate-spin" />
                          <MapIcon className="w-5 h-5 text-brand-accent absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-slate-900">Calculating Proximity & Skill Fit</p>
                          <p className="text-xs text-slate-400">Gemini 1.5 is ranking top candidates...</p>
                        </div>
                     </div>
                   ) : matches.length === 0 ? (
                     <div className="card-base p-8 text-center bg-slate-50">
                        <p className="text-slate-500 italic">No matches found within the service radius.</p>
                     </div>
                   ) : (
                     <div className="space-y-3">
                        {matches.map((match, idx) => (
                           <motion.div
                              key={match.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className="card-base p-6 hover:shadow-md transition-shadow"
                           >
                              <div className="flex items-center justify-between mb-4">
                                 <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500">
                                       {match.name[0]}
                                    </div>
                                    <div>
                                       <h4 className="font-bold text-slate-900">{match.name}</h4>
                                       <div className="flex items-center space-x-3 mt-0.5">
                                          <span className="flex items-center text-slate-400 text-[10px]">
                                             <MapPin className="w-3 h-3 mr-0.5" />
                                             {match.distance_km} km away
                                          </span>
                                       </div>
                                    </div>
                                 </div>
                                 <div className="bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 flex flex-col items-center">
                                    <span className="text-[10px] uppercase font-bold text-emerald-600 leading-none mb-1">Score</span>
                                    <span className="text-lg font-bold text-emerald-700 leading-none">{Math.round(match.match_score)}%</span>
                                 </div>
                              </div>
                              
                              <p className="text-xs text-slate-500 leading-relaxed bg-slate-50/50 p-3 rounded-lg border border-slate-100 mb-4 italic">
                                 &ldquo;{match.match_reason}&rdquo;
                              </p>

                              <div className="flex items-center justify-between">
                                 <div className="flex flex-wrap gap-1">
                                    {match.skill_tags.slice(0, 3).map(tag => (
                                       <span key={tag} className="px-2 py-0.5 bg-slate-100 text-[10px] text-slate-500 rounded font-medium">#{tag}</span>
                                    ))}
                                 </div>
                                 <button className="flex items-center space-x-1 text-sm font-bold text-brand-primary group">
                                    <span>Assign Task</span>
                                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                 </button>
                              </div>
                           </motion.div>
                        ))}
                     </div>
                   )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

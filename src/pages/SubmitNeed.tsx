import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, MapPin, AlertCircle, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export const SubmitNeed: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    urgency_input: 3,
    submitted_by_email: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await axios.post('/api/needs', formData);
      setIsSuccess(true);
      toast.success('Need submitted successfully! AI analysis is in progress.');
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to submit need. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="card-base p-10 flex flex-col items-center"
        >
          <div className="bg-emerald-50 p-4 rounded-full mb-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Request Received</h2>
          <p className="text-slate-500 mb-8 max-w-sm">
            Thank you for helping your community. Our AI is currently analyzing your request to match it with the best volunteers.
          </p>
          <button
            onClick={() => {
              setIsSuccess(false);
              setFormData({ title: '', description: '', address: '', urgency_input: 3, submitted_by_email: '' });
            }}
            className="btn-primary"
          >
            Submit Another Request
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-primary mb-2">Submit a Community Need</h1>
        <p className="text-slate-500">Provide details about what's needed. AI will help categorize and prioritize your request.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="card-base p-6 space-y-4">
              <div>
                <label className="section-label">Short Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Medical supplies needed for rural clinic"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div>
                <label className="section-label">Detailed Description</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Explain the situation in detail..."
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all resize-none"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div>
                <label className="section-label">Location Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Full street address, city, state"
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="card-base p-6">
              <label className="section-label">Self-Reported Urgency</label>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData({ ...formData, urgency_input: level })}
                    className={`py-3 rounded-lg text-sm font-bold transition-all ${
                      formData.urgency_input === level
                        ? 'bg-brand-primary text-white shadow-lg'
                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    Level {level}
                  </button>
                ))}
              </div>
              <div className="flex items-center space-x-2 mt-4 text-xs text-slate-400">
                <AlertCircle className="w-3 h-3" />
                <span>1 = Low Importance, 5 = Critical/Emergency</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-3 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Submit Request</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="card-base p-6 bg-slate-900 border-none">
            <div className="flex items-center space-x-2 text-brand-accent mb-4">
              <Sparkles className="w-5 h-5" />
              <span className="font-bold text-sm tracking-widest uppercase">Smart Analysis</span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              Your request is processed by **Gemini 1.5 Flash** to automatically identify categories and calculate geospatial priority scores for local volunteer networks.
            </p>
            <div className="space-y-3">
               <div className="flex items-center space-x-3 text-xs text-slate-400">
                  <div className="w-1.5 h-1.5 bg-brand-accent rounded-full" />
                  <span>Automatic Categorization</span>
               </div>
               <div className="flex items-center space-x-3 text-xs text-slate-400">
                  <div className="w-1.5 h-1.5 bg-brand-accent rounded-full" />
                  <span>Geospatial Optimization</span>
               </div>
            </div>
          </div>

          <div className="card-base p-6">
            <h4 className="font-bold text-slate-900 mb-2">Privacy Note</h4>
            <p className="text-xs text-slate-500">
              Only verified volunteers near the location will be able to see the specific address once assigned.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

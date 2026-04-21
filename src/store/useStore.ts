import { create } from 'zustand';
import axios from 'axios';
import toast from 'react-hot-toast';

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

interface AppState {
  user: any;
  userProfile: any;
  isAuthLoading: boolean;
  needs: any[];
  needsTotal: number;
  needsFilters: any;
  heatmapData: any[];
  stats: any;
  myTasks: any[];
  isLoading: boolean;
  fetchNeeds: (filters?: any) => Promise<void>;
  fetchHeatmap: () => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchMyTasks: () => Promise<void>;
  submitNeed: (needData: any) => Promise<any>;
  updateTaskStatus: (taskId: string, status: string) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  // Auth state
  user: null,
  userProfile: null,
  isAuthLoading: false,

  // Needs state
  needs: [],
  needsTotal: 0,
  needsFilters: { status: 'open', category: null },
  heatmapData: [],
  stats: null,

  // Tasks state
  myTasks: [],

  // UI state
  isLoading: false,

  // Actions
  fetchNeeds: async (filters = {}) => {
    set({ isLoading: true });
    try {
      const activeFilters = { ...get().needsFilters, ...filters };
      const res = await apiClient.get('/needs', { params: activeFilters });
      set({ 
        needs: res.data.data, 
        needsTotal: res.data.total,
        needsFilters: activeFilters
      });
    } catch (err) {
      console.error(err);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchHeatmap: async () => {
    try {
      const res = await apiClient.get('/needs/heatmap');
      set({ heatmapData: res.data.data });
    } catch (err) {
      console.error(err);
    }
  },

  fetchStats: async () => {
    try {
      const res = await apiClient.get('/needs/stats');
      set({ stats: res.data.data });
    } catch (err) {
      console.error(err);
    }
  },

  fetchMyTasks: async () => {
    try {
      const res = await apiClient.get('/tasks/my');
      set({ myTasks: res.data.data });
    } catch (err) {
      console.error(err);
    }
  },

  submitNeed: async (needData: any) => {
    set({ isLoading: true });
    try {
      // 1. Perform AI Analysis on frontend
      const { analyzeNeed } = await import('../lib/gemini');
      const analysis = await analyzeNeed(
        needData.title, 
        needData.description, 
        needData.address, 
        needData.urgency_input
      );

      // 2. Submit complete data to backend
      const res = await apiClient.post('/needs', {
        ...needData,
        ...analysis,
        ai_analysis_json: analysis
      });

      toast.success('Your request has been submitted and auto-categorized by AI!');
      get().fetchNeeds();
      return res.data.data;
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to analyze or submit request');
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  updateTaskStatus: async (taskId: string, status: string) => {
    try {
      await apiClient.patch(`/tasks/${taskId}`, { status });
      toast.success(`Task ${status}!`);
      get().fetchMyTasks();
    } catch (err) {
      toast.error('Failed to update status');
    }
  }
}));

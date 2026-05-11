import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import toast from 'react-hot-toast';

export const useSPPG = (filters = {}) => {
  const queryClient = useQueryClient();

  // Fetch SPPG Units
  const { data: sppgs = [], isLoading, error } = useQuery({
    queryKey: ['sppgs', filters],
    queryFn: async () => {
      const { data } = await api.get('/sppg', { params: filters });
      return data;
    },
  });

  // Create SPPG
  const createMutation = useMutation({
    mutationFn: async (newSppg) => {
      const { data } = await api.post('/sppg', newSppg);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sppgs'] });
      toast.success('Unit SPPG berhasil ditambahkan!');
    },
    onError: (err) => {
      const detail = err.response?.data?.detail;
      let message = err.message;
      if (Array.isArray(detail)) {
        message = detail.map(d => `${d.loc[d.loc.length - 1]}: ${d.msg}`).join(', ');
      } else if (typeof detail === 'string') {
        message = detail;
      }
      toast.error(`Gagal menambahkan SPPG: ${message}`);
    },
  });

  // Update SPPG
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.put(`/sppg/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sppgs'] });
      toast.success('Unit SPPG berhasil diperbarui!');
    },
    onError: (err) => {
      const detail = err.response?.data?.detail;
      let message = err.message;
      if (Array.isArray(detail)) {
        message = detail.map(d => `${d.loc[d.loc.length - 1]}: ${d.msg}`).join(', ');
      } else if (typeof detail === 'string') {
        message = detail;
      }
      toast.error(`Gagal memperbarui SPPG: ${message}`);
    },
  });

  // Delete SPPG
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/sppg/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sppgs'] });
      toast.success('Unit SPPG berhasil dihapus!');
    },
    onError: (err) => {
      const detail = err.response?.data?.detail;
      let message = err.message;
      if (Array.isArray(detail)) {
        message = detail.map(d => `${d.loc[d.loc.length - 1]}: ${d.msg}`).join(', ');
      } else if (typeof detail === 'string') {
        message = detail;
      }
      toast.error(`Gagal menghapus SPPG: ${message}`);
    },
  });

  // Raport Points
  const { data: raportPoints = [], isLoading: loadingPoints } = useQuery({
    queryKey: ['raport-points'],
    queryFn: async () => {
      const { data } = await api.get('/raport-points');
      return data;
    },
  });

  const createPointMutation = useMutation({
    mutationFn: async (point) => {
      const { data } = await api.post('/raport-points', point);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raport-points'] });
      toast.success('Poin raport berhasil ditambahkan!');
    },
  });

  const deletePointMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/raport-points/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raport-points'] });
      toast.success('Poin raport berhasil dihapus!');
    },
  });

  // Checklist Answers
  const useChecklist = (sppgId) => {
    return useQuery({
      queryKey: ['sppg-checklist', sppgId],
      queryFn: async () => {
        if (!sppgId) return [];
        const { data } = await api.get(`/sppg/${sppgId}/checklist`);
        return data;
      },
      enabled: !!sppgId,
    });
  };

  const updateChecklistMutation = useMutation({
    mutationFn: async ({ sppgId, answers }) => {
      const { data } = await api.put(`/sppg/${sppgId}/checklist`, { answers });
      return data;
    },
    onSuccess: (_, { sppgId }) => {
      queryClient.invalidateQueries({ queryKey: ['sppg-checklist', sppgId] });
      queryClient.invalidateQueries({ queryKey: ['sppgs'] });
      toast.success('Checklist raport berhasil diperbarui!');
    },
  });

  return {
    sppgs,
    isLoading,
    error,
    createSPPG: createMutation.mutateAsync,
    updateSPPG: updateMutation.mutateAsync,
    deleteSPPG: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Checklist & Points
    raportPoints,
    loadingPoints,
    createPoint: createPointMutation.mutateAsync,
    deletePoint: deletePointMutation.mutateAsync,
    useChecklist,
    updateChecklist: updateChecklistMutation.mutateAsync,
    isUpdatingChecklist: updateChecklistMutation.isPending
  };
};

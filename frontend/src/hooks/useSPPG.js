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
  };
};

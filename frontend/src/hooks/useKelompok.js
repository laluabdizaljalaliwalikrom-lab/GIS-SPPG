import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import toast from 'react-hot-toast';

export const useKelompok = (filters = {}) => {
  const queryClient = useQueryClient();

  // Fetch Kelompok Penerima
  const { data: kelompoks = [], isLoading, error } = useQuery({
    queryKey: ['kelompoks', filters],
    queryFn: async () => {
      const { data } = await api.get('/kelompok', { params: filters });
      return data;
    },
  });

  // Create Kelompok
  const createMutation = useMutation({
    mutationFn: async (newKelompok) => {
      const { data } = await api.post('/kelompok', newKelompok);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kelompoks'] });
      toast.success('Kelompok berhasil ditambahkan!');
    },
    onError: (err) => {
      const detail = err.response?.data?.detail;
      let message = err.message;
      
      if (Array.isArray(detail)) {
        message = detail.map(d => `${d.loc[d.loc.length - 1]}: ${d.msg}`).join(', ');
      } else if (typeof detail === 'string') {
        message = detail;
      }
      
      toast.error(`Gagal menambahkan kelompok: ${message}`);
    },
  });

  // Update Kelompok
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.put(`/kelompok/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kelompoks'] });
      toast.success('Kelompok berhasil diperbarui!');
    },
    onError: (err) => {
      const detail = err.response?.data?.detail;
      let message = err.message;
      if (Array.isArray(detail)) {
        message = detail.map(d => `${d.loc[d.loc.length - 1]}: ${d.msg}`).join(', ');
      } else if (typeof detail === 'string') {
        message = detail;
      }
      toast.error(`Gagal memperbarui kelompok: ${message}`);
    },
  });

  // Delete Kelompok
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/kelompok/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kelompoks'] });
      toast.success('Kelompok berhasil dihapus!');
    },
    onError: (err) => {
      const detail = err.response?.data?.detail;
      let message = err.message;
      if (Array.isArray(detail)) {
        message = detail.map(d => `${d.loc[d.loc.length - 1]}: ${d.msg}`).join(', ');
      } else if (typeof detail === 'string') {
        message = detail;
      }
      toast.error(`Gagal menghapus kelompok: ${message}`);
    },
  });

  // Verify Kelompok
  const verifyMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const { data } = await api.post(`/kelompok/${id}/verify`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kelompoks'] });
      toast.success('Status kelompok berhasil diperbarui!');
    },
    onError: (err) => {
      const detail = err.response?.data?.detail;
      let message = err.message;
      if (Array.isArray(detail)) {
        message = detail.map(d => `${d.loc[d.loc.length - 1]}: ${d.msg}`).join(', ');
      } else if (typeof detail === 'string') {
        message = detail;
      }
      toast.error(`Gagal memperbarui status: ${message}`);
    },
  });

  return {
    kelompoks,
    isLoading,
    error,
    createKelompok: createMutation.mutateAsync,
    updateKelompok: updateMutation.mutateAsync,
    deleteKelompok: deleteMutation.mutateAsync,
    verifyKelompok: verifyMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

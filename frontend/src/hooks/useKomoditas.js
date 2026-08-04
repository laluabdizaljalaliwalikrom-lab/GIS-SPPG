import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import toast from 'react-hot-toast';

export const useKomoditas = () => {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['commodity-items'] });
    queryClient.invalidateQueries({ queryKey: ['commodity-prices'] });
    queryClient.invalidateQueries({ queryKey: ['latest-prices'] });
    queryClient.invalidateQueries({ queryKey: ['commodities-surveys'] });
  };

  const { data: items = [], isLoading: loadingItems } = useQuery({
    queryKey: ['commodity-items'],
    queryFn: async () => {
      const { data } = await api.get('/commodities/items');
      return data;
    },
  });

  const createItemMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/commodities/items', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commodity-items'] });
      toast.success('Komoditas berhasil ditambahkan!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Gagal menambah komoditas.');
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.put(`/commodities/items/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commodity-items'] });
      toast.success('Komoditas berhasil diperbarui!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Gagal memperbarui komoditas.');
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/commodities/items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commodity-items'] });
      toast.success('Komoditas berhasil dihapus!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Gagal menghapus komoditas.');
    },
  });

  const { data: latestPrices = [], isLoading: loadingPrices } = useQuery({
    queryKey: ['latest-prices'],
    queryFn: async () => {
      const { data } = await api.get('/commodities/prices/latest');
      return data;
    },
  });

  const { data: allPrices = [], isLoading: loadingAllPrices } = useQuery({
    queryKey: ['commodity-prices'],
    queryFn: async () => {
      const { data } = await api.get('/commodities/prices', { params: { limit: 500 } });
      return data;
    },
  });

  const submitSurveyMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/commodities/survey', payload);
      return data;
    },
    onSuccess: (result) => {
      invalidateAll();
      toast.success(`Survey pasar berhasil! ${result.success} item tersimpan.`);
      if (result.failed > 0) {
        toast.error(`${result.failed} item gagal disimpan.`, { duration: 5000 });
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Gagal menyimpan survey pasar.');
    },
  });

  return {
    items,
    loadingItems,
    createItem: createItemMutation.mutateAsync,
    updateItem: updateItemMutation.mutateAsync,
    deleteItem: deleteItemMutation.mutateAsync,
    isCreating: createItemMutation.isPending,
    isUpdating: updateItemMutation.isPending,
    isDeleting: deleteItemMutation.isPending,

    latestPrices,
    loadingPrices,
    allPrices,
    loadingAllPrices,
    submitSurvey: submitSurveyMutation.mutateAsync,
    isSubmitting: submitSurveyMutation.isPending,
  };
};

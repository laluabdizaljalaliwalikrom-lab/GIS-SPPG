import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';

export const useLandingConfig = () => {
  return useQuery({
    queryKey: ['landing_config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_config')
        .select('*')
        .order('section_name');
      
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

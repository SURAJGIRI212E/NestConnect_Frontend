import { useQuery } from '@tanstack/react-query';
import axios from '../utils/axios';

export const useSuggestedUsers = (limit = 5) => {
  return useQuery({
    queryKey: ['suggestedUsers', limit],
    queryFn: async () => {
      const res = await axios.get(`/users/suggested?limit=${limit}`);
      return res.data.data;
    },
  });
};

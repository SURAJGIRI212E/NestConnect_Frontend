import { useQuery } from '@tanstack/react-query';
import axios from '../utils/axios';

export const useSubscriptionPlans = () =>
  useQuery({
    queryKey: ['subscriptionPlans'],
    queryFn: async () => {
      const { data } = await axios.get('/api/subscription/plans');
      return data;
    }
  });

export const useSubscriptionStatus = () =>
  useQuery({
    queryKey: ['subscriptionStatus'],
    queryFn: async () => {
      const { data } = await axios.get('/api/subscription/status');
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

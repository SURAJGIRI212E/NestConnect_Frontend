import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../utils/axios';

export const useSubscriptionPlans = () =>
  useQuery({
    queryKey: ['subscriptionPlans'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/api/subscription/plans');
      return data;
    }
  });

export const useSubscriptionStatus = () =>
  useQuery({
    queryKey: ['subscriptionStatus'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/api/subscription/status');
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

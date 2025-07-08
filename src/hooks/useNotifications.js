import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../utils/axios';

const fetchNotifications = async (page = 1) => {
  const res = await axiosInstance.get(`/api/notifications?page=${page}`);
  return res.data.data;
};

const fetchUnreadCount = async () => {
  const res = await axiosInstance.get('/api/notifications/unread-count');
  return res.data.data.unreadCount;
};

export const useNotifications = (page = 1) => {
  const queryClient = useQueryClient();

  // Notifications list
  const {
    data: notificationsData,
    isLoading: notificationsLoading,
    refetch: refetchNotifications,
  } = useQuery({
    queryKey: ['notifications', page],
    queryFn: () => fetchNotifications(page),
    keepPreviousData: true,
    enabled: false, // Disable by default
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Unread count
  const {
    data: unreadCount,
    isLoading: unreadLoading,
    refetch: refetchUnread,
  } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: fetchUnreadCount,
    enabled: false, // Disable by default
    staleTime: 1000 * 10, // 10 seconds for unread count as it might change more frequently
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: () => axiosInstance.patch('/api/notifications/mark-all-read'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', page] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  // Mark single as read
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) => axiosInstance.patch(`/api/notifications/${notificationId}/mark-read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', page] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  // Delete all
  const deleteAllMutation = useMutation({
    mutationFn: () => axiosInstance.delete('/api/notifications'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', page] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  // Delete single
  const deleteOneMutation = useMutation({
    mutationFn: (notificationId) => axiosInstance.delete(`/api/notifications/${notificationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', page] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  // For real-time: function to prepend a new notification
  const prependNotification = (notification) => {
    queryClient.setQueryData(['notifications', page], (oldData) => {
      if (!oldData) return;
      return {
        ...oldData,
        notifications: [notification, ...oldData.notifications],
        pagination: {
          ...oldData.pagination,
          totalNotifications: oldData.pagination.totalNotifications + 1,
        },
      };
    });
    queryClient.setQueryData(['notifications-unread'], (old) => (typeof old === 'number' ? old + 1 : 1));
  };

  return {
    notifications: notificationsData?.notifications || [],
    pagination: notificationsData?.pagination,
    unreadCount: unreadCount || 0,
    notificationsLoading,
    unreadLoading,
    refetchNotifications,
    refetchUnread,
    markAllAsRead: markAllAsReadMutation.mutate,
    markAsRead: markAsReadMutation.mutate,
    deleteAll: deleteAllMutation.mutate,
    deleteOne: deleteOneMutation.mutate,
    prependNotification,
  };
};
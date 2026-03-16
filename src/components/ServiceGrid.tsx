import { useEffect, useState, useCallback } from 'react';
import { listServices, deleteService, Service } from '@/lib/services';
import ServiceCard from './ServiceCard';
import { EditServiceModal } from './EditServiceModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ServiceGridProps {
  searchQuery?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  limit?: number;
  refreshTrigger?: number;
  showActions?: boolean;
  currentUserId?: string;
  onResultCount?: (count: number) => void;
}

const ServiceGrid = ({ searchQuery, category, minPrice, maxPrice, city, limit, refreshTrigger, showActions = false, currentUserId, onResultCount }: ServiceGridProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingService, setDeletingService] = useState<Service | null>(null);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    const data = await listServices({ query: searchQuery, category, minPrice, maxPrice, city, limit });
    setServices(data);
    onResultCount?.(data.length);
    setLoading(false);
  }, [searchQuery, category, minPrice, maxPrice, city, limit, onResultCount]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices, refreshTrigger]);

  const handleDelete = async () => {
    if (!deletingService) return;
    const success = await deleteService(deletingService.id);
    if (success) setServices(prev => prev.filter(s => s.id !== deletingService.id));
    setDeletingService(null);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(limit || 6)].map((_, i) => (
          <div key={i} className="aspect-[4/5] bg-card rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="mx-auto w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-1">No services found</h3>
        <p className="text-muted-foreground text-sm">
          {searchQuery ? `No results for "${searchQuery}"` : 'Try a different search or category'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            onEdit={(s) => setEditingService(s)}
            onDelete={(id) => setDeletingService(services.find(s => s.id === id) || null)}
            showActions={showActions && currentUserId === service.provider_id}
          />
        ))}
      </div>

      <EditServiceModal
        open={!!editingService}
        onOpenChange={(open) => !open && setEditingService(null)}
        service={editingService}
        onServiceUpdated={() => { setEditingService(null); fetchServices(); }}
      />

      <AlertDialog open={!!deletingService} onOpenChange={(open) => !open && setDeletingService(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingService?.title}"? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ServiceGrid;

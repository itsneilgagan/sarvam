import { useEffect, useState, useCallback } from 'react';
import { listServices, deleteService, Service } from '@/lib/services';
import ServiceCard from './ServiceCard';
import { EditServiceModal } from './EditServiceModal';

interface ServiceGridProps {
  searchQuery: string;
  refreshTrigger?: number;
}

const ServiceGrid = ({ searchQuery, refreshTrigger }: ServiceGridProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    const data = await listServices(searchQuery);
    setServices(data);
    setLoading(false);
  }, [searchQuery]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices, refreshTrigger]);

  const handleEdit = (service: Service) => {
    setEditingService(service);
  };

  const handleDelete = async (serviceId: string) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      const success = await deleteService(serviceId);
      if (success) {
        setServices(prev => prev.filter(s => s.id !== serviceId));
      }
    }
  };

  const handleEditComplete = () => {
    setEditingService(null);
    fetchServices();
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-80 bg-card/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold mb-2">No services found</h3>
        <p className="text-muted-foreground">
          {searchQuery ? `No services match "${searchQuery}"` : 'No services available at the moment'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>
      
      <EditServiceModal
        open={!!editingService}
        onOpenChange={(open) => !open && setEditingService(null)}
        service={editingService}
        onServiceUpdated={handleEditComplete}
      />
    </>
  );
};

export default ServiceGrid;

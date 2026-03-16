import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { Service } from '@/lib/services';

interface ServiceCardProps {
  service: Service;
  onEdit?: (service: Service) => void;
  onDelete?: (serviceId: string) => void;
  showActions?: boolean;
}

const ServiceCard = ({ service, onEdit, onDelete, showActions = false }: ServiceCardProps) => {
  const navigate = useNavigate();

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined) return 'Price on request';
    return `₹${Math.round(price)}`;
  };

  return (
    <div
      className="group bg-card rounded-xl border border-border overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
      onClick={() => navigate(`/services/${service.id}`)}
    >
      {/* Cover Image */}
      <div className="relative aspect-video bg-secondary overflow-hidden">
        {service.cover_image_url ? (
          <img
            src={service.cover_image_url}
            alt={service.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {service.category && (
          <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs px-2.5 py-0.5 rounded-full">
            {service.category}
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-foreground line-clamp-2 leading-tight">{service.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {service.short_description || service.description}
        </p>

        {service.tags && service.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {service.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <span className="text-lg font-bold text-primary">{formatPrice(service.price)}</span>

          {showActions && (
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit?.(service)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete?.(service.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;

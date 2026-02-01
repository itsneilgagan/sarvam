import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2 } from 'lucide-react';
import { Service } from '@/lib/services';

interface ServiceCardProps {
  service: Service;
  onEdit: (service: Service) => void;
  onDelete: (serviceId: string) => void;
}

const ServiceCard = ({ service, onEdit, onDelete }: ServiceCardProps) => {
  const formatPrice = (price: number | null | undefined, currency: string | null | undefined) => {
    if (price === null || price === undefined) return 'Price on request';
    const symbol = currency === 'INR' ? '₹' : currency || '';
    return `${symbol}${price}`;
  };

  return (
    <Card className="h-full hover:shadow-lg transition-all duration-300 hover:scale-105 bg-card border-burgundy/20 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-2">
          {service.category && (
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {service.category}
            </Badge>
          )}
        </div>
        <CardTitle className="text-xl line-clamp-2">{service.title}</CardTitle>
        <CardDescription className="text-muted-foreground line-clamp-3">
          {service.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-3 flex-grow">
        {service.tags && service.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {service.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {service.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{service.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <div className="flex items-center justify-between w-full">
          <div className="text-lg font-bold text-primary">
            {formatPrice(service.price, service.currency)}
          </div>
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onEdit(service)}
              className="h-8 w-8 p-0"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onDelete(service.id)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ServiceCard;

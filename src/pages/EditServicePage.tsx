import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getService, updateService, uploadServiceCover, Service } from '@/lib/services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Loader2, Upload, X } from 'lucide-react';

const CATEGORIES = ['Cleaning', 'Plumbing', 'Beauty', 'Tutoring', 'Repairs', 'Gardening', 'Tech', 'Events'];

const EditServicePage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [service, setService] = useState<Service | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagsInput, setTagsInput] = useState('');
  const [price, setPrice] = useState('');
  const [serviceArea, setServiceArea] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getService(id).then((s) => {
      if (!s) { navigate('/browse'); return; }
      if (s.provider_id !== user?.id) { navigate('/browse'); return; }
      setService(s);
      setTitle(s.title);
      setCategory(s.category || '');
      setShortDesc(s.short_description || '');
      setDescription(s.description);
      setTags(s.tags || []);
      setPrice(s.price?.toString() || '');
      setServiceArea(s.city || '');
      setIsActive(s.is_active);
      setCoverPreview(s.cover_image_url || null);
      setPageLoading(false);
    });
  }, [id, user, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({ title: "Invalid file", description: "Only JPG, PNG, or WebP.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB.", variant: "destructive" });
      return;
    }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && tagsInput.trim()) {
      e.preventDefault();
      if (tags.length >= 8) return;
      const t = tagsInput.trim().replace(',', '');
      if (t && !tags.includes(t)) setTags([...tags, t]);
      setTagsInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service) return;
    setLoading(true);

    let coverUrl = service.cover_image_url;
    if (coverFile) {
      const url = await uploadServiceCover(coverFile);
      if (!url) { setLoading(false); return; }
      coverUrl = url;
    }

    const result = await updateService(service.id, {
      title, description, short_description: shortDesc,
      category: category || null, price: price ? parseFloat(price) : null,
      tags, is_active: isActive, cover_image_url: coverUrl, city: serviceArea || null,
    });

    setLoading(false);
    if (result) navigate('/profile');
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Edit Service</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label>Cover Image</Label>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
            {coverPreview ? (
              <div className="relative aspect-video rounded-xl overflow-hidden bg-secondary">
                <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                <button type="button" onClick={() => { setCoverFile(null); setCoverPreview(null); }} className="absolute top-2 right-2 bg-background/80 rounded-full p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()} className="w-full aspect-video rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50">
                <Upload className="w-8 h-8" /><span className="text-sm">Upload image</span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            <Label>Title * <span className="text-xs text-muted-foreground">{title.length}/80</span></Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 80))} required />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button key={cat} type="button" onClick={() => setCategory(cat === category ? '' : cat)}
                  className={`px-3 py-1.5 rounded-full text-sm ${category === cat ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>{cat}</button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Short Description * <span className="text-xs text-muted-foreground">{shortDesc.length}/150</span></Label>
            <Textarea value={shortDesc} onChange={(e) => setShortDesc(e.target.value.slice(0, 150))} className="min-h-[80px]" required />
          </div>

          <div className="space-y-2">
            <Label>Full Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value.slice(0, 1000))} className="min-h-[120px]" />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((t) => <Badge key={t} variant="secondary" className="gap-1">{t} <button type="button" onClick={() => setTags(tags.filter(x => x !== t))}><X className="w-3 h-3" /></button></Badge>)}
            </div>
            <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} onKeyDown={addTag} placeholder="Type and press Enter" />
          </div>

          <div className="space-y-2">
            <Label>Price ₹ *</Label>
            <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} min="1" required />
          </div>

          <div className="space-y-2">
            <Label>Service Area</Label>
            <Input value={serviceArea} onChange={(e) => setServiceArea(e.target.value)} />
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label>{isActive ? 'Active' : 'Inactive'}</Label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditServicePage;

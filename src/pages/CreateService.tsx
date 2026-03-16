import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { createService, uploadServiceCover } from '@/lib/services';
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';

const CATEGORIES = [
  { value: 'Cleaning', emoji: '🧹' },
  { value: 'Plumbing', emoji: '🔧' },
  { value: 'Beauty', emoji: '💇' },
  { value: 'Tutoring', emoji: '📚' },
  { value: 'Repairs', emoji: '🔨' },
  { value: 'Gardening', emoji: '🌿' },
  { value: 'Tech', emoji: '💻' },
  { value: 'Events', emoji: '🎉' },
];

const CreateService = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [price, setPrice] = useState('');
  const [serviceArea, setServiceArea] = useState(profile?.city ? `${profile.city}${profile.area ? ', ' + profile.area : ''}` : '');
  const [isActive, setIsActive] = useState(true);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({ title: "Invalid file", description: "Only JPG, PNG, or WebP images allowed.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 5MB.", variant: "destructive" });
      return;
    }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && tagsInput.trim()) {
      e.preventDefault();
      if (tags.length >= 8) return;
      const newTag = tagsInput.trim().replace(',', '');
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagsInput('');
    }
  };

  const removeTag = (tag: string) => setTags(tags.filter(t => t !== tag));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !shortDesc || !price) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    setLoading(true);

    let coverUrl: string | null = null;
    if (coverFile) {
      coverUrl = await uploadServiceCover(coverFile);
      if (!coverUrl) { setLoading(false); return; }
    }

    const result = await createService({
      title,
      description,
      short_description: shortDesc,
      category: category || null,
      price: parseFloat(price),
      currency: 'INR',
      tags,
      is_active: isActive,
      provider_id: user?.id || null,
      cover_image_url: coverUrl,
      city: serviceArea || null,
    });

    setLoading(false);
    if (result) navigate('/profile');
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Create New Service</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Cover */}
            <div className="space-y-2">
              <Label>Cover Image</Label>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
              {coverPreview ? (
                <div className="relative aspect-video rounded-xl overflow-hidden bg-secondary">
                  <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setCoverFile(null); setCoverPreview(null); }}
                    className="absolute top-2 right-2 bg-background/80 rounded-full p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full aspect-video rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 transition-colors"
                >
                  <Upload className="w-8 h-8" />
                  <span className="text-sm">Click or drag to upload</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              <Label>Service Title * <span className="text-xs text-muted-foreground">{title.length}/80</span></Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 80))} placeholder="e.g., Professional Home Cleaning" required />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value === category ? '' : cat.value)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      category === cat.value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {cat.emoji} {cat.value}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Short Description * <span className="text-xs text-muted-foreground">{shortDesc.length}/150</span></Label>
              <Textarea value={shortDesc} onChange={(e) => setShortDesc(e.target.value.slice(0, 150))} placeholder="Brief summary shown on cards..." className="min-h-[80px]" required />
            </div>

            <div className="space-y-2">
              <Label>Detailed Description <span className="text-xs text-muted-foreground">{description.length}/1000</span></Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value.slice(0, 1000))} placeholder="Full description..." className="min-h-[120px]" />
            </div>

            <div className="space-y-2">
              <Label>Tags <span className="text-xs text-muted-foreground">{tags.length}/8</span></Label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag} <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive"><X className="w-3 h-3" /></button>
                  </Badge>
                ))}
              </div>
              <Input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                onKeyDown={addTag}
                placeholder="Type tag and press Enter"
              />
            </div>

            <div className="space-y-2">
              <Label>Price in ₹ *</Label>
              <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="500" min="1" required />
            </div>

            <div className="space-y-2">
              <Label>Service Area</Label>
              <Input value={serviceArea} onChange={(e) => setServiceArea(e.target.value)} placeholder="Mumbai, Andheri West" />
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label>{isActive ? 'Active' : 'Inactive'}</Label>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Publish Service
            </Button>
          </form>

          {/* Live preview */}
          <div className="hidden lg:block">
            <p className="text-sm text-muted-foreground mb-4">Live Preview</p>
            <div className="bg-card border border-border rounded-xl overflow-hidden sticky top-20">
              <div className="aspect-video bg-secondary overflow-hidden">
                {coverPreview ? (
                  <img src={coverPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <ImageIcon className="w-10 h-10" />
                  </div>
                )}
                {category && (
                  <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground rounded-full">{category}</Badge>
                )}
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-semibold">{title || 'Service Title'}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{shortDesc || 'Short description...'}</p>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{tag}</span>
                    ))}
                  </div>
                )}
                <p className="text-lg font-bold text-primary">{price ? `₹${price}` : '₹---'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateService;

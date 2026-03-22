import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { createService, uploadServiceCover } from '@/lib/services';
import { Loader2, Upload, X, Image as ImageIcon, AlertTriangle } from 'lucide-react';

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
  const [searchParams] = useSearchParams();
  const fileRef = useRef<HTMLInputElement>(null);
  const accessToastShown = useRef(false);

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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const isWelcomeFlow = searchParams.get('welcome') === '1';

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    if (profile && profile.role !== 'provider') {
      if (!accessToastShown.current) {
        toast({
          title: 'Providers only',
          description: 'Only providers can create services. Update your role in profile.',
          variant: 'destructive',
        });
        accessToastShown.current = true;
      }
      navigate('/browse', { replace: true });
    }
  }, [user, profile, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({ title: "Invalid file type", description: "Only JPG, PNG, and WebP files are allowed.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 5MB.", variant: "destructive" });
      return;
    }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const fakeEvent = { target: { files: [file] } } as any;
      handleFileChange(fakeEvent);
    }
  };

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && tagsInput.trim()) {
      e.preventDefault();
      if (tags.length >= 8) {
        toast({ title: "Max tags", description: "You can add up to 8 tags.", variant: "destructive" });
        return;
      }
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

    if (!coverFile) {
      toast({ title: "Cover image required", description: "Please upload a service image before publishing.", variant: "destructive" });
      return;
    }

    setLoading(true);

    let coverUrl: string | null = null;
    if (coverFile) {
      setUploadProgress(30);
      coverUrl = await uploadServiceCover(coverFile);
      setUploadProgress(100);
      if (!coverUrl) { setLoading(false); setUploadProgress(0); return; }
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
    setUploadProgress(0);
    if (result) {
      toast({ title: "🎉 Service published!", description: "Your service is now live!" });
      navigate(`/browse?created=1&q=${encodeURIComponent(title)}`);
    }
  };

  const noCitySet = !profile?.city;

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">Create New Service</h1>

        {isWelcomeFlow && (
          <div className="mb-4 rounded-xl border border-primary/30 bg-primary/10 p-4">
            <p className="text-sm font-medium text-primary">Set up your first service card</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add a strong title, details, price, and a cover image so your service appears on Home and Browse.
            </p>
          </div>
        )}

        {noCitySet && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-500">Complete your profile first</p>
              <p className="text-xs text-muted-foreground mt-1">
                Set your city in your profile to auto-fill service area.{' '}
                <Link to="/profile" className="text-primary hover:underline">Go to Profile →</Link>
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
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
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <Progress value={uploadProgress} className="h-1.5" />
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="w-full aspect-video rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 transition-colors"
                >
                  <Upload className="w-8 h-8" />
                  <span className="text-sm font-medium">Click to upload or drag image here</span>
                  <span className="text-xs text-muted-foreground">JPG, PNG, WebP — max 5MB</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              <Label>Service Title * <span className="text-xs text-muted-foreground">{title.length}/80</span></Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 80))} placeholder="e.g., Professional Home Cleaning" required className="focus-visible:ring-primary" />
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
              <Textarea value={shortDesc} onChange={(e) => setShortDesc(e.target.value.slice(0, 150))} placeholder="Brief summary shown on cards..." className="min-h-[80px] focus-visible:ring-primary" required />
            </div>

            <div className="space-y-2">
              <Label>Detailed Description <span className="text-xs text-muted-foreground">{description.length}/1000</span></Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value.slice(0, 1000))} placeholder="Full description..." className="min-h-[120px] focus-visible:ring-primary" />
            </div>

            <div className="space-y-2">
              <Label>Tags <span className="text-xs text-muted-foreground">{tags.length}/8</span></Label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((tag) => (
                  <Badge key={tag} className="bg-primary/20 text-primary border-0 gap-1">
                    {tag} <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive"><X className="w-3 h-3" /></button>
                  </Badge>
                ))}
              </div>
              <Input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                onKeyDown={addTag}
                placeholder="Type tag and press Enter"
                className="focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label>Price in ₹ *</Label>
              <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="500" min="1" required className="focus-visible:ring-primary" />
            </div>

            <div className="space-y-2">
              <Label>Service Area</Label>
              <Input value={serviceArea} onChange={(e) => setServiceArea(e.target.value)} placeholder="Mumbai, Andheri West" className="focus-visible:ring-primary" />
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
              <div className="relative aspect-video bg-secondary overflow-hidden">
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
                {price && (
                  <span className="absolute top-3 right-3 text-sm font-bold text-primary bg-background/80 backdrop-blur-sm px-2 py-0.5 rounded-full">
                    ₹{price}
                  </span>
                )}
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-semibold line-clamp-1">{title || 'Service Title'}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{shortDesc || 'Short description...'}</p>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{tag}</span>
                    ))}
                    {tags.length > 3 && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">+{tags.length - 3} more</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile preview */}
          <div className="lg:hidden">
            <p className="text-sm text-muted-foreground mb-4">Preview</p>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="relative aspect-video bg-secondary overflow-hidden">
                {coverPreview ? (
                  <img src={coverPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <ImageIcon className="w-10 h-10" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold">{title || 'Service Title'}</h3>
                <p className="text-sm text-muted-foreground mt-1">{shortDesc || 'Short description...'}</p>
                <p className="text-lg font-bold text-primary mt-2">{price ? `₹${price}` : '₹---'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateService;

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

interface Video {
  id: string;
  title: string;
  title_bg?: string;
  youtube_video_id: string;
  thumbnail_url?: string;
  description?: string;
  description_bg?: string;
  access_tier_id?: string;
  is_published: boolean;
  views_count: number;
  created_at: string;
}

export default function CreatorVideosPage() {
  const searchParams = useSearchParams();
  const telegramId = searchParams.get('telegramId');
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);

  const [formData, setFormData] = useState({
    youtube_video_id: '',
    title: '',
    title_bg: '',
    description: '',
    description_bg: '',
    thumbnail_url: '',
    access_tier_id: '',
  });

  useEffect(() => {
    if (telegramId) {
      fetchVideos();
    }
  }, [telegramId]);

  const fetchVideos = async () => {
    try {
      const response = await fetch(`/api/creators/${telegramId}/videos`);
      const data = await response.json();
      setVideos(data.videos || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement video creation/update API
    alert('Video creation API needs to be implemented');
  };

  const handleDelete = async (videoId: string) => {
    if (!confirm('Сигурни ли сте, че искате да изтриете това видео?')) return;
    // TODO: Implement video deletion API
    alert('Video deletion API needs to be implemented');
  };

  const togglePublish = async (video: Video) => {
    // TODO: Implement publish toggle API
    alert('Publish toggle API needs to be implemented');
  };

  if (loading) {
    return (
      <div className="py-6">
        <GlassCard>
          <GlassCardContent className="py-16 text-center">
            <p>Зареждане...</p>
          </GlassCardContent>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Моите видеа</h1>
        <Button
          onClick={() => {
            setShowAddForm(true);
            setEditingVideo(null);
            setFormData({
              youtube_video_id: '',
              title: '',
              title_bg: '',
              description: '',
              description_bg: '',
              thumbnail_url: '',
              access_tier_id: '',
            });
          }}
          className="gradient-primary text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Добави видео
        </Button>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingVideo) && (
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>
              {editingVideo ? 'Редактирай видео' : 'Добави ново видео'}
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="youtube_video_id">YouTube Video ID *</Label>
                <Input
                  id="youtube_video_id"
                  value={formData.youtube_video_id}
                  onChange={(e) => setFormData({ ...formData, youtube_video_id: e.target.value })}
                  placeholder="dQw4w9WgXcQ"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Вземете ID от YouTube URL: youtube.com/watch?v=VIDEO_ID
                </p>
              </div>

              <div>
                <Label htmlFor="title">Заглавие (EN) *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="title_bg">Заглавие (BG)</Label>
                <Input
                  id="title_bg"
                  value={formData.title_bg}
                  onChange={(e) => setFormData({ ...formData, title_bg: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="description">Описание (EN)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="description_bg">Описание (BG)</Label>
                <Textarea
                  id="description_bg"
                  value={formData.description_bg}
                  onChange={(e) => setFormData({ ...formData, description_bg: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
                <Input
                  id="thumbnail_url"
                  type="url"
                  value={formData.thumbnail_url}
                  onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="gradient-primary text-white">
                  {editingVideo ? 'Запази промените' : 'Добави видео'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingVideo(null);
                  }}
                >
                  Отказ
                </Button>
              </div>
            </form>
          </GlassCardContent>
        </GlassCard>
      )}

      {/* Videos List */}
      {videos.length === 0 ? (
        <GlassCard>
          <GlassCardContent className="py-16 text-center">
            <p className="text-muted-foreground mb-4">Все още нямате видеа</p>
            <Button
              onClick={() => setShowAddForm(true)}
              className="gradient-primary text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Добави първото видео
            </Button>
          </GlassCardContent>
        </GlassCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <GlassCard key={video.id} hover>
              {video.thumbnail_url && (
                <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
                  <img
                    src={video.thumbnail_url}
                    alt={video.title_bg || video.title}
                    className="w-full h-full object-cover"
                  />
                  {!video.is_published && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary">Чернова</Badge>
                    </div>
                  )}
                </div>
              )}
              <GlassCardHeader>
                <GlassCardTitle className="text-lg line-clamp-2">
                  {video.title_bg || video.title}
                </GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <span>👁️ {video.views_count}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => togglePublish(video)}
                  >
                    {video.is_published ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingVideo(video);
                      setShowAddForm(false);
                      setFormData({
                        youtube_video_id: video.youtube_video_id,
                        title: video.title,
                        title_bg: video.title_bg || '',
                        description: video.description || '',
                        description_bg: video.description_bg || '',
                        thumbnail_url: video.thumbnail_url || '',
                        access_tier_id: video.access_tier_id || '',
                      });
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(video.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </GlassCardContent>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

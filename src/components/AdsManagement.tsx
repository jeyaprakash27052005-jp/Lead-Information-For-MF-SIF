import React, { useState, useEffect, useRef } from 'react';
import { AdBanner } from '../types';
import { adsStorageService, prepareAdImage } from '../services/adsStorage';
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Plus,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Link,
  Tag,
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react';

interface AdsManagementProps {
  onNotify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AdsManagement: React.FC<AdsManagementProps> = ({ onNotify }) => {
  const [ads, setAds] = useState<AdBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [badge, setBadge] = useState('Special Offer');
  const [linkUrl, setLinkUrl] = useState<'none' | 'register' | 'custom' | string>('none');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [customLinkUrl, setCustomLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Live Carousel Preview State
  const [previewSlide, setPreviewSlide] = useState(0);
  const [isPreviewPaused, setIsPreviewPaused] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchAds = async () => {
    try {
      setLoading(true);
      const data = await adsStorageService.getAds();
      setAds(data);
    } catch (_err) {
      setError('Failed to load advertisements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  // Live Preview auto-slides
  useEffect(() => {
    if (ads.length <= 1 || isPreviewPaused) return;
    const timer = setInterval(() => {
      setPreviewSlide((prev) => (prev + 1) % ads.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [ads.length, isPreviewPaused]);

  // Handle image file selection (JPG, JPEG, PNG, GIF)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image format
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!validTypes.includes(file.type) && !validExtensions.includes(ext)) {
      setError('Please upload a valid image file (.jpg, .jpeg, .png, or .gif).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError('Image file size exceeds 15MB. Please choose a smaller image file.');
      return;
    }

    setError(null);
    try {
      const dataUrl = await prepareAdImage(file);
      setImageFileName(file.name);
      setImagePreview(dataUrl);
      setImageUrl(dataUrl);
    } catch (err) {
      setImageFileName(null);
      setImagePreview(null);
      setImageUrl('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setError(err instanceof Error ? err.message : 'Could not process this image.');
    }
  };

  const resetForm = () => {
    setTitle('');
    setSubtitle('');
    setBadge('Special Offer');
    setLinkUrl('none');
    setCustomLinkUrl('');
    setImageUrl('');
    setImagePreview(null);
    setImageFileName(null);
    setEditingId(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleStartEdit = (ad: AdBanner) => {
    setEditingId(ad.id);
    setTitle(ad.title);
    setSubtitle(ad.subtitle || '');
    setBadge(ad.badge || '');
    if (!ad.linkUrl || ad.linkUrl === 'mf-calc' || ad.linkUrl === 'nps-calc') {
      setLinkUrl('none');
      setCustomLinkUrl('');
    } else if (ad.linkUrl === 'register') {
      setLinkUrl('register');
      setCustomLinkUrl('');
    } else {
      setLinkUrl('custom');
      setCustomLinkUrl(ad.linkUrl);
    }
    setImageUrl(ad.imageUrl);
    setImagePreview(ad.imageUrl);
    setImageFileName(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddAdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter an ad title / headline');
      return;
    }
    const finalImageUrl = imageUrl || imagePreview;
    if (!finalImageUrl) {
      setError('Please upload an image file (JPG, JPEG, PNG or GIF)');
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      const targetLink =
        linkUrl === 'custom' ? customLinkUrl.trim() : linkUrl === 'none' ? '' : linkUrl;
      if (editingId) {
        const updated = await adsStorageService.updateAd(editingId, {
          title: title.trim(),
          subtitle: subtitle.trim(),
          badge: badge.trim(),
          imageUrl: finalImageUrl,
          linkUrl: targetLink,
        });
        setAds((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        if (onNotify) onNotify('Advertisement updated successfully!', 'success');
      } else {
        const newAd = await adsStorageService.createAd({
          title: title.trim(),
          subtitle: subtitle.trim() || undefined,
          badge: badge.trim() || undefined,
          imageUrl: finalImageUrl,
          linkUrl: targetLink || undefined,
          isActive: true,
          order: ads.length + 1,
        });
        setAds((prev) => [...prev, newAd]);
        if (onNotify) onNotify('Advertisement banner added successfully!', 'success');
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save advertisement');
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggleActive = async (ad: AdBanner) => {
    try {
      const updated = await adsStorageService.updateAd(ad.id, { isActive: !ad.isActive });
      setAds((prev) => prev.map((a) => (a.id === ad.id ? updated : a)));
      if (onNotify) onNotify(`Ad "${ad.title}" is now ${updated.isActive ? 'Active' : 'Hidden'}.`, 'info');
    } catch (_e) {
      if (onNotify) onNotify('Failed to update ad status', 'error');
    }
  };

  const handleDelete = async (id: string, adTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete the ad "${adTitle}"?`)) return;
    try {
      await adsStorageService.deleteAd(id);
      setAds((prev) => prev.filter((a) => a.id !== id));
      if (editingId === id) resetForm();
      if (onNotify) onNotify(`Ad "${adTitle}" deleted.`, 'info');
    } catch (_e) {
      if (onNotify) onNotify('Failed to delete ad', 'error');
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const newAds = [...ads];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newAds.length) return;

    const temp = newAds[index];
    newAds[index] = newAds[targetIdx];
    newAds[targetIdx] = temp;

    setAds(newAds);
    await adsStorageService.reorderAds(newAds);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Moving Screen Ads & Banners Control</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Moving Ads & Banner Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload custom promotional advertisement images in <strong>JPG, JPEG, PNG, or GIF</strong> to run and move across the visitor Home Screen.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAds}
          className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Ads</span>
        </button>
      </div>

      {/* LIVE MOVING ADS PREVIEW */}
      <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-lg border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-300">
              Live Home Screen Moving Ads Preview ({ads.filter((a) => a.isActive).length} Active)
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsPreviewPaused(!isPreviewPaused)}
            className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 flex items-center gap-1 cursor-pointer"
          >
            {isPreviewPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            <span>{isPreviewPaused ? 'Play' : 'Pause'}</span>
          </button>
        </div>

        {ads.length > 0 ? (
          <div className="relative h-56 sm:h-64 rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
            {ads.map((ad, idx) => (
              <div
                key={ad.id}
                className={`absolute inset-0 transition-opacity duration-700 flex flex-col justify-end p-5 ${
                  idx === previewSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                <img
                  src={ad.imageUrl}
                  alt={ad.title}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
                <div className="relative z-20 space-y-1 max-w-lg">
                  {ad.badge && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-indigo-600 text-white">
                      {ad.badge}
                    </span>
                  )}
                  <h3 className="text-base sm:text-lg font-black text-white">{ad.title}</h3>
                  {ad.subtitle && <p className="text-xs text-slate-300 line-clamp-2">{ad.subtitle}</p>}
                </div>
              </div>
            ))}

            {/* Preview Controls */}
            <div className="absolute bottom-3 right-4 z-30 flex items-center gap-1">
              {ads.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPreviewSlide(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === previewSlide ? 'w-4 bg-white' : 'w-1.5 bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-6 text-center">No ads created yet.</p>
        )}
      </div>

      {/* ADD NEW ADVERTISEMENT FORM */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              {editingId ? 'Edit Advertisement' : 'Add New Moving Advertisement'}
            </h2>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
            Supported Formats: JPG, JPEG, PNG, GIF
          </span>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAddAdSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ad Headline */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Ad Headline / Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Exclusive High-Yield SIF Scheme Launch"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Badge */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Badge / Tag
              </label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="e.g. Special Offer, Tax Saver, New Launch"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Promotional Tagline / Description
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g. Start compounding with ₹500/month. View projections & download official PDF report."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Image Upload Zone (.jpg, .jpeg, .png, .gif) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Upload Ad Image File (JPG, JPEG, PNG, GIF) <span className="text-rose-500">*</span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              {/* File upload dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/30 hover:bg-indigo-50/60 rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 min-h-[110px]"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif,image/jpeg,image/png,image/gif"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Upload className="w-5 h-5 text-indigo-600" />
                <div className="text-xs font-bold text-indigo-900">
                  {imageFileName ? `Selected: ${imageFileName}` : 'Click to Browse & Upload Image File'}
                </div>
                <p className="text-[10px] text-slate-500">
                  Accepts JPG, JPEG, PNG, GIF (large images are shrunk automatically)
                </p>
              </div>

              {/* Thumbnail Preview */}
              <div>
                {imagePreview ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={imagePreview}
                      alt="Upload Preview"
                      className="w-28 h-20 object-cover rounded-lg border border-slate-300"
                    />
                    <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {editingId && !imageFileName ? 'Current image (upload a file to replace)' : 'Image ready'}
                    </span>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">No image selected yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Action Destination */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Ad Click Target Action
              </label>
              <select
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="none">No click action</option>
                <option value="register">Open Customer Registration Form</option>
                <option value="custom">Custom External URL</option>
              </select>
            </div>

            {linkUrl === 'custom' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Custom Destination URL
                </label>
                <input
                  type="url"
                  value={customLinkUrl}
                  onChange={(e) => setCustomLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end gap-2">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300 cursor-pointer"
              >
                Cancel Edit
              </button>
            )}
            <button
              type="submit"
              disabled={isUploading}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4 text-indigo-400" />
              <span>{isUploading ? 'Saving...' : editingId ? 'Save Changes' : 'Publish Moving Ad'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* ADVERTISEMENTS LIST & MANAGEMENT TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            Active Advertisements Roster ({ads.length})
          </h2>
          <span className="text-xs text-slate-500">
            Ads are displayed and moved in order on the Home Screen
          </span>
        </div>

        {ads.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No advertisements added yet. Use the form above to upload your first JPG, JPEG, PNG, or GIF ad.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {ads.map((ad, index) => (
              <div
                key={ad.id}
                className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* Image Thumbnail */}
                  <img
                    src={ad.imageUrl}
                    alt={ad.title}
                    className="w-20 h-14 object-cover rounded-lg border border-slate-200 shadow-2xs shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{ad.title}</span>
                      {ad.badge && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {ad.badge}
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          ad.isActive
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {ad.isActive ? 'Active on Screen' : 'Disabled'}
                      </span>
                    </div>
                    {ad.subtitle && (
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{ad.subtitle}</p>
                    )}
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Target: {ad.linkUrl || 'None'} • Order: #{index + 1}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  {/* Reorder Buttons */}
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => handleMoveOrder(index, 'up')}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={index === ads.length - 1}
                    onClick={() => handleMoveOrder(index, 'down')}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  {/* Toggle Active */}
                  <button
                    type="button"
                    onClick={() => handleToggleActive(ad)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                      ad.isActive
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {ad.isActive ? (
                      <>
                        <ToggleRight className="w-4 h-4 text-emerald-600" />
                        <span>Active</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4 text-slate-400" />
                        <span>Disabled</span>
                      </>
                    )}
                  </button>

                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={() => handleStartEdit(ad)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 cursor-pointer"
                    title="Edit Advertisement"
                  >
                    Edit
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDelete(ad.id, ad.title)}
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                    title="Delete Advertisement"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

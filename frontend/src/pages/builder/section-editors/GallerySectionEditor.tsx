import React, { useState } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, RotateCcw, ImageIcon } from 'lucide-react';
import { ImageUploader } from '../../../components/ImageUploader';
import { DEFAULT_ASSETS } from '../../../constants/defaultWebsiteData';

interface GallerySectionEditorProps {
  content: any;
  onChange: (field: string, value: any) => void;
}

export const GallerySectionEditor: React.FC<GallerySectionEditorProps> = ({ content, onChange }) => {
  const images = (content.images && content.images.length > 0)
    ? content.images
    : DEFAULT_ASSETS.gallery;

  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  const categories = [
    'Bridal & Makeup',
    'Hair Styling',
    'Skin & Facial',
    'Mehendi & Art',
    'Nails & Care',
    'Studio Ambience',
  ];

  const handleAddImage = () => {
    const newImg = {
      id: `img_${Date.now()}`,
      url: '',
      category: 'Bridal & Makeup',
      caption: 'New bridal transformation / haircut showcase',
    };
    const updated = [...images, newImg];
    onChange('images', updated);
    setActiveImageIndex(updated.length - 1);
  };

  const handleUpdateImage = (index: number, field: string, val: any) => {
    const updated = [...images];
    updated[index] = { ...updated[index], [field]: val };
    onChange('images', updated);
  };

  const handleRemoveImage = (index: number) => {
    const updated = images.filter((_: any, i: number) => i !== index);
    onChange('images', updated);
    if (activeImageIndex >= updated.length) {
      setActiveImageIndex(Math.max(0, updated.length - 1));
    }
  };

  const handleReorderImage = (index: number, dir: 'up' | 'down') => {
    const target = dir === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= images.length) return;
    const updated = [...images];
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;
    onChange('images', updated);
    setActiveImageIndex(target);
  };

  const handleResetToDefault = () => {
    onChange('images', DEFAULT_ASSETS.gallery);
    setActiveImageIndex(0);
  };

  const currentActiveImg = images[activeImageIndex] || images[0];

  return (
    <div className="space-y-5 text-xs">
      {/* Headings */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
          Section Headings
        </h4>

        <div>
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Section Title
          </label>
          <input
            type="text"
            value={content.heading || ''}
            onChange={(e) => onChange('heading', e.target.value)}
            placeholder="e.g. Salon Portfolio & Bridal Transformations"
            className="input-field py-1.5 text-xs font-semibold"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Subtitle / Description
          </label>
          <textarea
            rows={2}
            value={content.subheading || ''}
            onChange={(e) => onChange('subheading', e.target.value)}
            placeholder="Real client results from our Himmatnagar and Ahmedabad studios."
            className="input-field py-1.5 text-xs"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200 dark:border-slate-700/60">
          <div>
            <label className="block text-[10px] text-slate-500 mb-1">Grid Columns</label>
            <select
              value={content.grid_columns || 4}
              onChange={(e) => onChange('grid_columns', Number(e.target.value))}
              className="input-field py-1 text-xs"
            >
              <option value={2}>2 Columns (Showcase)</option>
              <option value={3}>3 Columns (Standard)</option>
              <option value={4}>4 Columns (Grid View)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-500 mb-1">Aspect Ratio</label>
            <select
              value={content.aspect_ratio || 'square'}
              onChange={(e) => onChange('aspect_ratio', e.target.value)}
              className="input-field py-1 text-xs"
            >
              <option value="square">Square 1:1</option>
              <option value="portrait">Portrait 3:4</option>
              <option value="landscape">Landscape 16:9</option>
            </select>
          </div>
        </div>
      </div>

      {/* Gallery Items Manager */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
            Gallery Photos ({images.length})
          </h4>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
              title="Reset gallery to default photos"
            >
              <RotateCcw className="w-3 h-3" /> Reset Defaults
            </button>
            <button
              type="button"
              onClick={handleAddImage}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400"
            >
              <Plus className="w-3.5 h-3.5" /> Add Photo
            </button>
          </div>
        </div>

        {/* Thumbnails row / selector */}
        <div className="grid grid-cols-4 gap-2">
          {images.map((img: any, idx: number) => {
            const isSelected = idx === activeImageIndex;
            const fallbackDefault = DEFAULT_ASSETS.gallery[idx % DEFAULT_ASSETS.gallery.length].url;
            const imgSrc = (typeof img === 'string') ? img : (img.url || fallbackDefault);

            return (
              <div
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition ${
                  isSelected
                    ? 'border-purple-600 shadow-md ring-2 ring-purple-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 opacity-80'
                }`}
              >
                <img
                  src={imgSrc}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-[9px] text-white px-1 rounded font-mono">
                  #{idx + 1}
                </span>
              </div>
            );
          })}
        </div>

        {/* Selected Image Detail Editor */}
        {currentActiveImg && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[11px] text-purple-700 dark:text-purple-300">
                Photo #{activeImageIndex + 1} Settings
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={activeImageIndex === 0}
                  onClick={() => handleReorderImage(activeImageIndex, 'up')}
                  className="p-1 rounded text-slate-500 hover:text-slate-800 disabled:opacity-30"
                  title="Move forward"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={activeImageIndex === images.length - 1}
                  onClick={() => handleReorderImage(activeImageIndex, 'down')}
                  className="p-1 rounded text-slate-500 hover:text-slate-800 disabled:opacity-30"
                  title="Move backward"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={images.length <= 1}
                  onClick={() => handleRemoveImage(activeImageIndex)}
                  className="p-1 rounded text-rose-500 hover:text-rose-700 disabled:opacity-30"
                  title="Delete photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <ImageUploader
              label={`Photo #${activeImageIndex + 1} Upload`}
              helperText="Upload a salon transformation photo or select a category below."
              currentValue={typeof currentActiveImg === 'string' ? currentActiveImg : currentActiveImg.url}
              defaultImage={DEFAULT_ASSETS.gallery[activeImageIndex % DEFAULT_ASSETS.gallery.length].url}
              sectionType="GALLERY"
              aspectRatio="square"
              onChange={(url) => handleUpdateImage(activeImageIndex, 'url', url)}
              onResetToDefault={() => handleUpdateImage(activeImageIndex, 'url', '')}
            />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Category</label>
                <select
                  value={currentActiveImg.category || 'Bridal & Makeup'}
                  onChange={(e) => handleUpdateImage(activeImageIndex, 'category', e.target.value)}
                  className="input-field py-1 text-xs"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Caption</label>
                <input
                  type="text"
                  value={currentActiveImg.caption || ''}
                  onChange={(e) => handleUpdateImage(activeImageIndex, 'caption', e.target.value)}
                  placeholder="e.g. Royal Bridal Look"
                  className="input-field py-1 text-xs"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

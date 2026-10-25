import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  RefreshCw,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { api } from '../services/api';
import { resolveImageUrl, handleImageFallback } from '../constants/defaultWebsiteData';

interface ImageUploaderProps {
  label: string;
  helperText?: string;
  currentValue?: string;
  defaultImage: string;
  sectionType?: string;
  aspectRatio?: 'video' | 'square' | 'portrait' | 'wide';
  onChange: (newUrl: string) => void;
  onResetToDefault?: () => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  label,
  helperText,
  currentValue,
  defaultImage,
  sectionType,
  aspectRatio = 'video',
  onChange,
  onResetToDefault,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isCustomImage = Boolean(currentValue && currentValue.trim() !== '' && currentValue !== defaultImage);
  const displayImage = resolveImageUrl(currentValue, defaultImage);

  const getAspectClass = () => {
    switch (aspectRatio) {
      case 'square':
        return 'aspect-square max-h-48';
      case 'portrait':
        return 'aspect-[3/4] max-h-60';
      case 'wide':
        return 'aspect-[21/9] max-h-40';
      case 'video':
      default:
        return 'aspect-video max-h-48';
    }
  };

  const validateAndUpload = async (file: File) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validate format
    const validExtensions = ['image/jpeg', 'image/png', 'image/webp'];
    const lowerName = file.name.toLowerCase();
    const isExtensionValid =
      lowerName.endsWith('.jpg') ||
      lowerName.endsWith('.jpeg') ||
      lowerName.endsWith('.png') ||
      lowerName.endsWith('.webp');

    if (!validExtensions.includes(file.type) && !isExtensionValid) {
      setErrorMessage('Invalid file format. Allowed formats: JPG, JPEG, PNG, WEBP.');
      return;
    }

    // Validate size (10 MB = 10 * 1024 * 1024 bytes)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrorMessage('Image size must be less than 10 MB.');
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('image', file);
      if (sectionType) {
        formData.append('section_type', sectionType);
      }

      const res: any = await api.upload('/builder/upload/', formData);
      if (res && res.url) {
        onChange(res.url);
        setSuccessMessage('Image uploaded and applied!');
        setTimeout(() => setSuccessMessage(null), 3500);
      } else {
        throw new Error('Upload succeeded but no image URL was returned.');
      }
    } catch (err: any) {
      const msg = err?.message || 'Unable to upload image. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndUpload(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    onChange('');
    setErrorMessage(null);
    setSuccessMessage('Custom image removed. Restored system default image.');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleResetToDefault = () => {
    if (onResetToDefault) {
      onResetToDefault();
    } else {
      onChange('');
    }
    setErrorMessage(null);
    setSuccessMessage('Reset to system default image.');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
          {label}
        </label>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
            isCustomImage
              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
          }`}
        >
          {isCustomImage ? 'Custom Uploaded' : 'System Default'}
        </span>
      </div>

      {helperText && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400">{helperText}</p>
      )}

      {/* Preview Card & Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative overflow-hidden rounded-xl border-2 border-dashed transition-all ${
          isDragging
            ? 'border-purple-600 bg-purple-50/50 dark:border-purple-400 dark:bg-purple-950/20'
            : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-900/50'
        }`}
      >
        <div className={`relative w-full ${getAspectClass()} overflow-hidden rounded-lg bg-slate-900/10`}>
          <img
            src={displayImage}
            alt={label}
            onError={(e) => handleImageFallback(e, defaultImage)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {isUploading && (
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm flex flex-col items-center justify-center text-white space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
              <span className="text-xs font-medium">Uploading & Processing Image...</span>
            </div>
          )}

          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
            <span className="bg-slate-900/80 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded-md shadow">
              {isCustomImage ? 'Live Custom Image' : 'Default Salon Image'}
            </span>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="p-2.5 bg-white dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileSelect}
          />

          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition disabled:opacity-50"
          >
            {isCustomImage ? (
              <>
                <RefreshCw className="w-3.5 h-3.5" /> Replace Image
              </>
            ) : (
              <>
                <UploadCloud className="w-3.5 h-3.5" /> Upload Image
              </>
            )}
          </button>

          {isCustomImage && (
            <button
              type="button"
              disabled={isUploading}
              onClick={handleRemove}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition disabled:opacity-50"
              title="Remove custom image and return to default"
            >
              <Trash2 className="w-3.5 h-3.5" /> Remove
            </button>
          )}

          <button
            type="button"
            disabled={isUploading || !isCustomImage}
            onClick={handleResetToDefault}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/50 transition disabled:opacity-30 disabled:pointer-events-none ml-auto"
            title="Reset to default image"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset to Default
          </button>
        </div>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs border border-rose-200 dark:border-rose-900/50">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Success alert */}
      {successMessage && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs border border-emerald-200 dark:border-emerald-900/50">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
    </div>
  );
};

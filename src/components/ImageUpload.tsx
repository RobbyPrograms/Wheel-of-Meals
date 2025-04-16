import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { FaImage, FaTimes, FaSpinner } from 'react-icons/fa';

interface ImageUploadProps {
  onUpload: (url: string) => void;
  onClear: () => void;
  url?: string | null;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function ImageUpload({ onUpload, onClear, url }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  const validateFile = (file: File) => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      throw new Error('File type not allowed. Please upload a JPEG, PNG, or WebP image.');
    }
    
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size too large. Maximum size is 2MB.');
    }
  };

  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      
      // Validate file before upload
      validateFile(file);

      const fileExt = file.name.split('.').pop();
      // Use timestamp + random number for unique filename
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload the file to Supabase storage
      const { data, error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(filePath);

      onUpload(publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(error instanceof Error ? error.message : 'Error uploading image!');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {url ? (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-50 border-2 border-[#319141] shadow-sm">
          <Image
            src={url}
            alt="Post image"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
          <button
            onClick={onClear}
            className="absolute top-4 right-4 bg-white/90 text-[#0F1E0F] p-2.5 rounded-xl hover:bg-white transition-all shadow-lg"
            title="Remove image"
          >
            <FaTimes size={16} />
          </button>
        </div>
      ) : (
        <label className="w-full cursor-pointer">
          <div className="flex flex-col items-center justify-center w-full aspect-video rounded-xl border-2 border-dashed border-gray-300 hover:border-[#319141] transition-all bg-gray-50/50 hover:bg-gray-50 group">
            <div className="text-gray-400 group-hover:text-[#319141] transition-colors">
              <FaImage size={36} />
            </div>
            <div className="mt-4 text-sm font-medium text-gray-600 group-hover:text-[#0F1E0F] transition-colors">
              Click to upload image
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Max size: 2MB • JPEG, PNG, WebP
            </div>
            {uploading && (
              <div className="mt-4 flex items-center gap-2 text-sm text-[#319141]">
                <FaSpinner className="animate-spin" />
                <span>Uploading...</span>
              </div>
            )}
          </div>
          <input
            type="file"
            className="hidden"
            accept={ALLOWED_FILE_TYPES.join(',')}
            onChange={uploadImage}
            disabled={uploading}
          />
        </label>
      )}
    </div>
  );
} 
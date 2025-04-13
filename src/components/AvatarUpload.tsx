import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { FaUser, FaCamera, FaSpinner } from 'react-icons/fa';
import Image from 'next/image';

interface AvatarUploadProps {
  url: string | null;
  onUpload: (url: string) => void;
  size?: number;
}

export default function AvatarUpload({ url, onUpload, size = 150 }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setError(null);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload the file to Supabase storage
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      onUpload(publicUrl);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error uploading avatar');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div 
        className="relative group cursor-pointer"
        style={{ width: size, height: size }}
      >
        {url ? (
          <div className="relative w-full h-full rounded-full overflow-hidden">
            <Image
              src={url}
              alt="Avatar"
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-full bg-accent/10 rounded-full flex items-center justify-center">
            <FaUser className="text-accent" style={{ fontSize: size / 3 }} />
          </div>
        )}
        
        <label 
          className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          htmlFor="avatar-upload"
        >
          {uploading ? (
            <FaSpinner className="animate-spin text-white" style={{ fontSize: size / 6 }} />
          ) : (
            <FaCamera className="text-white" style={{ fontSize: size / 6 }} />
          )}
        </label>
        <input
          type="file"
          id="avatar-upload"
          accept="image/*"
          onChange={uploadAvatar}
          disabled={uploading}
          className="hidden"
        />
      </div>
      
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
} 
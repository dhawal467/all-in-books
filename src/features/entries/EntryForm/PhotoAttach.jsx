import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, Check } from 'lucide-react';
import { useUiStore } from '../../../stores/uiStore';
import { db } from '../../../db/db';
import Modal from '../../../components/Modal';

// Max file size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;
// Target compressed size ~ 400KB
const TARGET_SIZE_KB = 400;

export default function PhotoAttach({ onAttach, label = "Attach Photo" }) {
  const fileInputRef = useRef(null);
  const { showToast, openModal, closeModal } = useUiStore();
  
  const [attachmentId, setAttachmentId] = useState(null);
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);

  // Clean up object URLs when component unmounts or thumbnail changes
  useEffect(() => {
    return () => {
      if (thumbnailUrl) {
        URL.revokeObjectURL(thumbnailUrl);
      }
    };
  }, [thumbnailUrl]);

  /**
   * Compresses the given file using Canvas API.
   * Returns a Blob.
   */
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimensions
          const MAX_WIDTH = 1280;
          const MAX_HEIGHT = 1280;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Start with 0.7 quality
          let quality = 0.7;
          
          const convertToBlob = (q) => {
            canvas.toBlob((blob) => {
              if (!blob) {
                 reject(new Error("Canvas to Blob failed"));
                 return;
              }
              // If it's still over 400KB and quality > 0.3, drop quality and try again.
              if (blob.size > TARGET_SIZE_KB * 1024 && q > 0.3) {
                 convertToBlob(q - 0.2);
              } else {
                 resolve(blob);
              }
            }, 'image/jpeg', q);
          };
          
          convertToBlob(quality);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so the same file could be selected again if needed
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }

    // 1. Check size guard (>50MB)
    if (file.size > MAX_FILE_SIZE) {
      showToast('File too large. Max size is 50 MB.', 'error');
      return;
    }

    setIsCompressing(true);
    try {
      // 2. Compress to JPEG 0.7 max ~400KB
      const compressedBlob = await compressImage(file);
      
      // 3. Convert to Uint8Array for IndexedDB storage
      const arrayBuffer = await compressedBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // 4. Store in IndexedDB (db.attachments)
      const newAttachmentId = await db.attachments.add({
        data: uint8Array,
        type: 'image/jpeg',
        createdAt: Date.now()
      });
      
      // 5. Update UI State & Thumbnail
      setAttachmentId(newAttachmentId);
      
      if (thumbnailUrl) {
         URL.revokeObjectURL(thumbnailUrl);
      }
      setThumbnailUrl(URL.createObjectURL(compressedBlob));
      
      onAttach(newAttachmentId);
      showToast('Photo attached safely', 'success');

    } catch (err) {
      console.error("Compression/Storage Error:", err);
      showToast('Failed to attach photo', 'error');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRemove = async (e) => {
    e.stopPropagation();
    if (attachmentId) {
      try {
        await db.attachments.delete(attachmentId);
      } catch (err) {
        console.error("Failed to delete attachment from DB", err);
      }
    }
    setAttachmentId(null);
    if (thumbnailUrl) {
      URL.revokeObjectURL(thumbnailUrl);
      setThumbnailUrl(null);
    }
    onAttach(null);
  };

  const openLightbox = () => {
    if (thumbnailUrl) {
      openModal('photoLightbox', { url: thumbnailUrl });
    }
  };

  return (
    <div className="px-4 pb-4">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-primary">
          {label}
        </label>
        {isCompressing && (
           <span className="text-xs text-primary/60 italic">Processing...</span>
        )}
      </div>

      {!attachmentId ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isCompressing}
          className="w-full relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#B8D0E8] rounded-[12px] bg-[#F4F8FA] hover:bg-primary/5 transition-colors disabled:opacity-50"
        >
          <Camera size={24} className="text-primary/40 mb-2" />
          <span className="text-sm font-medium text-primary/60">Tap to attach bill</span>
        </button>
      ) : (
        <div className="relative group rounded-[12px] overflow-hidden border border-[#B8D0E8] w-full aspect-[21/9] bg-black/5 flex items-center justify-center cursor-pointer" onClick={openLightbox}>
           <img 
             src={thumbnailUrl} 
             alt="Attachment Thumbnail" 
             className="w-full h-full object-cover"
           />
           {/* Success Indicator Overlay */}
           <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 flex justify-between items-end">
             <div className="flex items-center gap-1.5 text-white">
                <Check size={16} className="text-green-400" />
                <span className="text-xs font-medium">Attached successfully</span>
             </div>
             
             {/* Remove Button */}
             <button
               type="button"
               onClick={handleRemove}
               className="p-1.5 bg-black/40 hover:bg-red-500/80 rounded-full text-white backdrop-blur-sm transition-colors"
               aria-label="Remove attachment"
             >
               <X size={16} />
             </button>
           </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Lightbox Modal Configuration */}
      <Modal name="photoLightbox" title="Receipt Preview">
        {(data) => (
          <div className="flex flex-col items-center space-y-4">
            {data?.url && (
              <div className="max-h-[70vh] w-full overflow-hidden rounded-[8px] bg-black/5 flex items-center justify-center p-2">
                <img 
                  src={data.url} 
                  alt="Full resolution receipt" 
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            )}
            <button
              onClick={() => closeModal('photoLightbox')}
              className="w-full py-3 bg-primary text-white rounded-[12px] font-medium transition-transform active:scale-95"
            >
              Close
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}

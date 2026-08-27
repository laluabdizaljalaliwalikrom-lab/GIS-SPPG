/**
 * Client-Side Image Compression Utility
 * Resizes and compresses images using HTML5 Canvas before uploading.
 * Supports converting to WebP / JPEG with configurable max dimensions & quality.
 */

export const compressImage = (file, options = {}) => {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.75,
    mimeType = 'image/webp'
  } = options;

  return new Promise((resolve, reject) => {
    // If it's a PDF, bypass image compression
    if (file.type === 'application/pdf') {
      resolve({
        file,
        previewUrl: null,
        originalSize: file.size,
        compressedSize: file.size,
        savedPercent: 0,
        isCompressed: false,
        name: file.name,
      });
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate scaling maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        // Smoother downscaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({
                file,
                previewUrl: event.target.result,
                originalSize: file.size,
                compressedSize: file.size,
                savedPercent: 0,
                isCompressed: false,
                name: file.name
              });
              return;
            }

            // Create compressed File instance
            const extension = mimeType === 'image/webp' ? 'webp' : 'jpg';
            const baseName = file.name.replace(/\.[^/.]+$/, '');
            const compressedFile = new File([blob], `${baseName}.${extension}`, {
              type: mimeType,
              lastModified: Date.now()
            });

            const savedPercent = Math.max(0, Math.round((1 - compressedFile.size / file.size) * 100));

            resolve({
              file: compressedFile,
              previewUrl: URL.createObjectURL(blob),
              originalSize: file.size,
              compressedSize: compressedFile.size,
              savedPercent,
              isCompressed: true,
              name: compressedFile.name
            });
          },
          mimeType,
          quality
        );
      };

      img.onerror = (err) => reject(err);
    };

    reader.onerror = (err) => reject(err);
  });
};

/**
 * Format bytes into human-readable string (KB, MB)
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

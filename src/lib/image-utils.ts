/**
 * Resizes an image file to a maximum width maintaining aspect ratio.
 * @param file The input image file
 * @param maxWidth The maximum width in pixels
 * @param quality The quality of the output image (0 to 1)
 * @returns A Promise resolving to a Blob of the resized image
 */
export const resizeImage = (file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error("Could not get canvas context"));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error("Canvas to Blob conversion failed"));
                        }
                    },
                    file.type, // Maintain original format (e.g., image/jpeg, image/png)
                    quality
                );
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};

/**
 * Maximum Base64 size allowed for Firestore storage (in bytes).
 * Firestore docs have a 1MB limit; we keep images well under that.
 */
const MAX_BASE64_BYTES = 700 * 1024; // 700 KB

/**
 * Converts an image file to a compressed Base64 data URL string
 * suitable for storing directly in Firestore.
 *
 * - Resizes to max 800px width (maintains aspect ratio)
 * - Converts to JPEG at 60% quality (retries at 40% if still too large)
 * - Validates the output is under 700 KB
 *
 * @param file The input image file
 * @returns A Promise resolving to a Base64 data URL string
 */
export const imageToBase64 = async (file: File): Promise<string> => {
    const convert = (maxWidth: number, quality: number): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error("Could not get canvas context"));
                        return;
                    }

                    ctx.drawImage(img, 0, 0, width, height);

                    // Always output as JPEG for smaller size
                    const dataUrl = canvas.toDataURL('image/jpeg', quality);
                    resolve(dataUrl);
                };
                img.onerror = () => reject(new Error("Failed to load image"));
            };
            reader.onerror = () => reject(new Error("Failed to read file"));
        });
    };

    // First attempt: 800px width, 60% quality
    let base64 = await convert(800, 0.6);
    console.log(`[imageToBase64] First pass size: ${(base64.length / 1024).toFixed(1)} KB`);

    if (base64.length <= MAX_BASE64_BYTES) {
        return base64;
    }

    // Second attempt: same width, lower quality
    console.log("[imageToBase64] Too large, retrying at 40% quality...");
    base64 = await convert(800, 0.4);
    console.log(`[imageToBase64] Second pass size: ${(base64.length / 1024).toFixed(1)} KB`);

    if (base64.length <= MAX_BASE64_BYTES) {
        return base64;
    }

    // Third attempt: smaller width + low quality
    console.log("[imageToBase64] Still too large, retrying at 600px / 30% quality...");
    base64 = await convert(600, 0.3);
    console.log(`[imageToBase64] Third pass size: ${(base64.length / 1024).toFixed(1)} KB`);

    if (base64.length <= MAX_BASE64_BYTES) {
        return base64;
    }

    throw new Error(
        `Image is still too large after compression (${(base64.length / 1024).toFixed(0)} KB). ` +
        `Please use a smaller image (under 2 MB recommended).`
    );
};

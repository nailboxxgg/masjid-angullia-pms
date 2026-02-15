import { storage } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * Uploads an image to Firebase Storage and returns the download URL.
 * @param file The file object to upload
 * @param path The path in storage (e.g., 'events', 'avatars')
 */
export const uploadImage = async (file: File, path: string = 'uploads'): Promise<string> => {
    try {
        // Diagnostic: Check if bucket is configured
        const bucket = storage.app.options.storageBucket;
        if (!bucket) {
            throw new Error("Firebase Storage Bucket is not configured in environment variables.");
        }
        console.log(`[Upload] Starting upload to bucket: ${bucket}`);

        // Create a unique filename: timestamp_originalName
        // Sanitize filename to avoid issues
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const filename = `${Date.now()}_${sanitizedName}`;
        const storageRef = ref(storage, `${path}/${filename}`);

        console.log(`[Upload] Target path: ${path}/${filename}`);

        // Add timeout to prevent infinite hanging (e.g. CORS or Firewall issues)
        const uploadPromise = uploadBytes(storageRef, file);
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Upload timed out. Check your network or CORS configuration.")), 15000)
        );

        const snapshot = await Promise.race([uploadPromise, timeoutPromise]) as any; // Cast to avoid type mismatch with timeout

        console.log("[Upload] Upload completed, fetching URL...");
        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log("[Upload] URL fetched successfully.");

        return downloadURL;
    } catch (error) {
        console.error("Error uploading image:", error);
        throw error;
    }
};

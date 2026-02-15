import { storage } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * Uploads an image to Firebase Storage and returns the download URL.
 * @param file The file object to upload
 * @param path The path in storage (e.g., 'events', 'avatars')
 */
export const uploadImage = async (file: File, path: string = 'uploads'): Promise<string> => {
    try {
        // Create a unique filename: timestamp_originalName
        // Sanitize filename to avoid issues
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const filename = `${Date.now()}_${sanitizedName}`;
        const storageRef = ref(storage, `${path}/${filename}`);

        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        return downloadURL;
    } catch (error) {
        console.error("Error uploading image:", error);
        throw error;
    }
};

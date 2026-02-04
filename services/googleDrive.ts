import { Platform } from 'react-native';

const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';
const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3/files';

export const GoogleDriveService = {

    // Search for the recipes.json file specifically created by this app
    // Returns the file ID if found, null otherwise
    findComponentsFile: async (accessToken: string) => {
        try {
            const q = encodeURIComponent("name = 'recipes.json' and trashed = false");
            const response = await fetch(`${DRIVE_API_URL}?q=${q}&spaces=drive`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            const data = await response.json();
            if (data.files && data.files.length > 0) {
                return data.files[0].id; // Return the first match
            }
            return null;
        } catch (e) {
            console.error("Error finding file", e);
            return null;
        }
    },

    // Create an initial empty recipes.json
    createFile: async (accessToken: string) => {
        try {
            console.log("Creating new recipes.json file...");
            const metadata = {
                name: 'recipes.json',
                mimeType: 'application/json',
            };

            if (Platform.OS === 'web') {
                console.log("Web: Creating file (2-step)...");
                // 1. Create Metadata only
                const createResponse = await fetch(`${DRIVE_API_URL}`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(metadata),
                });

                if (!createResponse.ok) console.error("Web: Create Metadata Failed", await createResponse.text());

                const createData = await createResponse.json();
                const fileId = createData.id;
                console.log("Web: File created, ID:", fileId);

                // 2. Upload Content
                const emptyContent = JSON.stringify([]);
                await fetch(`${DRIVE_UPLOAD_URL}/${fileId}?uploadType=media`, {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: emptyContent,
                });

                return fileId;
            } else {
                const formData = new FormData();
                formData.append('metadata', {
                    string: JSON.stringify(metadata),
                    type: 'application/json',
                } as any);

                // Empty content
                formData.append('file', {
                    string: JSON.stringify([]),
                    type: 'application/json',
                } as any);

                const response = await fetch(`${DRIVE_UPLOAD_URL}?uploadType=multipart`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${accessToken}` },
                    body: formData,
                });
                const data = await response.json();
                return data.id;
            }
        } catch (e) {
            console.error("Error creating file", e);
            throw e;
        }
    },

    // Download the JSON content of the file
    downloadData: async (accessToken: string, fileId: string) => {
        try {
            // console.log("Downloading data from", fileId);
            const response = await fetch(`${DRIVE_API_URL}/${fileId}?alt=media`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            return await response.json();
        } catch (e) {
            console.error("Error downloading data", e);
            return [];
        }
    },

    // Update the JSON content of the existing file
    updateData: async (accessToken: string, fileId: string, data: any) => {
        try {
            const response = await fetch(`${DRIVE_UPLOAD_URL}/${fileId}?uploadType=media`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data),
            });
            return response.status === 200;
        } catch (e) {
            console.error("Error updating data", e);
            return false;
        }
    },

    // Upload an image and return the link
    uploadImage: async (accessToken: string, localUri: string) => {
        try {
            console.log("Starting uploadImage...", localUri);

            // 1. Prepare Metadata
            const metadata = {
                name: `recipe_photo_${Date.now()}.jpg`,
                mimeType: 'image/jpeg',
            };

            if (Platform.OS === 'web') {
                console.log("Web Upload: Step 1 - Creating Metadata");
                // 1. Create Metadata only
                const createResponse = await fetch(`${DRIVE_API_URL}`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(metadata),
                });

                if (!createResponse.ok) {
                    const err = await createResponse.text();
                    console.error("Web Upload: Metadata Creation Failed", err);
                    return null;
                }

                const createData = await createResponse.json();
                const fileId = createData.id;
                console.log("Web Upload: Metadata Created. ID:", fileId);

                // 2. Fetch Blob and Upload Media
                console.log("Web Upload: Step 2 - Fetching Blob from URI");
                const imageResponse = await fetch(localUri);
                const blob = await imageResponse.blob();
                console.log("Web Upload: Blob fetched, size:", blob.size, "type:", blob.type);

                console.log("Web Upload: Step 3 - Patching Media Content");
                const uploadResponse = await fetch(`${DRIVE_UPLOAD_URL}/${fileId}?uploadType=media`, {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'image/jpeg',
                    },
                    body: blob,
                });

                if (uploadResponse.ok) {
                    console.log("Web Upload: Success!");
                    return fileId;
                } else {
                    const err = await uploadResponse.text();
                    console.error("Web Upload: Media Patch Failed", err);
                    return null;
                }

            } else {
                // RN specific hack for sending JSON as a part with content-type
                const formData = new FormData();
                formData.append('metadata', {
                    string: JSON.stringify(metadata),
                    type: 'application/json',
                } as any);

                // RN compatible FormData file append
                formData.append('file', {
                    uri: localUri,
                    name: 'photo.jpg',
                    type: 'image/jpeg'
                } as any);

                const response = await fetch(`${DRIVE_UPLOAD_URL}?uploadType=multipart`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        // Content-Type is set automatically by FormData
                    },
                    body: formData,
                });

                const result = await response.json();
                if (result.id) {
                    return result.id;
                }
                return null;
            }
        } catch (e) {
            console.error("Error uploading image", e);
            return null;
        }
    }
};

import { useAuth } from '@/contexts/AuthContext';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, ImageProps, ImageStyle, Platform, StyleProp, View } from 'react-native';

interface DriveImageProps extends Omit<ImageProps, 'source'> {
    source: { uri?: string } | number;
    style?: StyleProp<ImageStyle>;
}

export const DriveImage: React.FC<DriveImageProps> = ({ source, style, ...props }) => {
    const { accessToken } = useAuth();
    const [webImageUri, setWebImageUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    const isDriveUri = typeof source === 'object' && source.uri && source.uri.startsWith('google-drive-id:');

    useEffect(() => {
        let isActive = true;

        const fetchWebImage = async (fileId: string) => {
            if (!accessToken) return;
            setLoading(true);
            setError(false);
            try {
                const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });
                if (!response.ok) throw new Error('Failed to fetch image');
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                if (isActive) setWebImageUri(url);
            } catch (e) {
                console.error("Error fetching Drive image on Web", e);
                if (isActive) setError(true);
            } finally {
                if (isActive) setLoading(false);
            }
        };

        if (Platform.OS === 'web' && isDriveUri && accessToken) {
            const fileId = (source as any).uri.split('google-drive-id:')[1];
            fetchWebImage(fileId);
        }

        return () => {
            isActive = false;
            // potential cleanup: URL.revokeObjectURL(webImageUri) 
            // but we need to verify if we can safely revoke if component re-mounts.
            // keeping it simple for now.
        };
    }, [source, accessToken, isDriveUri]);

    const finalSource = useMemo(() => {
        if (isDriveUri) {
            const fileId = (source as any).uri.split('google-drive-id:')[1];

            if (Platform.OS === 'web') {
                return webImageUri ? { uri: webImageUri } : null;
            } else {
                // Native supports headers in Image source
                if (accessToken) {
                    return {
                        uri: `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
                        headers: { Authorization: `Bearer ${accessToken}` },
                    };
                }
                return { uri: '' };
            }
        }
        return source;
    }, [source, accessToken, isDriveUri, webImageUri]);

    if (isDriveUri && Platform.OS === 'web') {
        if (loading) {
            return (
                <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }]}>
                    <ActivityIndicator size="small" />
                </View>
            );
        }
        if (error || !webImageUri) {
            // Fallback or empty view
            return <View style={[style, { backgroundColor: '#eee' }]} />;
        }
    }

    return <Image source={finalSource as any} style={style} {...props} />;
};

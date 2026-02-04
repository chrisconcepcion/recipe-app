import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

const STORAGE_KEY = 'recipe_app_auth_v2';

// Initialize WebBrowser for Web Auth
WebBrowser.maybeCompleteAuthSession();

interface UserInfo {
    id: string;
    email: string;
    verified_email: boolean;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
    locale: string;
}

interface AuthContextType {
    user: UserInfo | null;
    accessToken: string | null;
    signIn: () => void;
    signOut: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<UserInfo | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Web Auth Request Hook
    const [request, response, promptAsync] = Google.useAuthRequest({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        androidClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    useEffect(() => {
        // Native Configuration (Android/iOS only)
        if (Platform.OS !== 'web') {
            GoogleSignin.configure({
                webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
                scopes: ['https://www.googleapis.com/auth/drive.file'],
                offlineAccess: true,
                forceCodeForRefreshToken: true,
            });
        }

        const restoreSession = async () => {
            console.log("AuthContext: Restoring session...");
            // Web Restoration checking local storage
            if (Platform.OS === 'web') {
                try {
                    const stored = await AsyncStorage.getItem(STORAGE_KEY);
                    if (stored) {
                        const { user, accessToken } = JSON.parse(stored);
                        if (user && accessToken) {
                            setUser(user);
                            setAccessToken(accessToken);
                        }
                    }
                } catch (e) {
                    console.error("Web restoration failed", e);
                }
                setIsLoading(false); // Ensure loading state is cleared for web
                return;
            }

            // Native Restoration
            try {
                const response = await GoogleSignin.signInSilently();

                if (response.type === 'success' && response.data) {
                    const currentUser = response.data;
                    const tokens = await GoogleSignin.getTokens();

                    const mappedUser: UserInfo = {
                        id: currentUser.user.id,
                        email: currentUser.user.email,
                        verified_email: true,
                        name: currentUser.user.name || '',
                        given_name: currentUser.user.givenName || '',
                        family_name: currentUser.user.familyName || '',
                        picture: currentUser.user.photo || '',
                        locale: 'en',
                    };

                    setUser(mappedUser);
                    setAccessToken(tokens.accessToken);
                } else {
                    console.log("AuthContext: No previous session or silent sign-in failed/cancelled");
                }
            } catch (error) {
                console.log("AuthContext: Session restore check finished (nosession/error)", error);
            } finally {
                setIsLoading(false);
            }
        };
        restoreSession();
    }, []);

    // Handle Web Response
    useEffect(() => {
        if (response?.type === 'success') {
            const { authentication } = response;
            if (authentication?.accessToken) {
                setAccessToken(authentication.accessToken);
                fetchUserInfo(authentication.accessToken);
            } else {
                setIsLoading(false); // If success but no token, clear loading
            }
        } else if (response?.type === 'cancel' || response?.type === 'error') {
            setIsLoading(false); // Clear loading on cancel or error
        }
    }, [response]);

    const fetchUserInfo = async (token: string) => {
        setIsLoading(true);
        try {
            const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const userDetails = await res.json();
            const mappedUser: UserInfo = {
                id: userDetails.id,
                email: userDetails.email,
                verified_email: userDetails.verified_email,
                name: userDetails.name,
                given_name: userDetails.given_name,
                family_name: userDetails.family_name,
                picture: userDetails.picture,
                locale: userDetails.locale,
            };
            setUser(mappedUser);

            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
                accessToken: token,
                user: mappedUser
            }));

        } catch (e) {
            console.error("Failed to fetch web user info", e);
        } finally {
            setIsLoading(false);
        }
    };

    const signIn = async () => {
        setIsLoading(true);

        if (Platform.OS === 'web') {
            promptAsync();
            // Loading state will be handled by the response effect
            return;
        }

        // Native Sign In
        try {
            await GoogleSignin.hasPlayServices();
            const response = await GoogleSignin.signIn();

            if (response.type === 'cancelled') {
                console.log("Google Sign-In cancelled");
                setIsLoading(false); // Clear loading on cancel
                return;
            }

            if (response.type === 'success' && response.data) {
                const currentUser = response.data;
                const tokens = await GoogleSignin.getTokens();

                const mappedUser: UserInfo = {
                    id: currentUser.user.id,
                    email: currentUser.user.email,
                    verified_email: true,
                    name: currentUser.user.name || '',
                    given_name: currentUser.user.givenName || '',
                    family_name: currentUser.user.familyName || '',
                    picture: currentUser.user.photo || '',
                    locale: 'en',
                };

                setUser(mappedUser);
                setAccessToken(tokens.accessToken);

                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
                    accessToken: tokens.accessToken,
                    user: mappedUser
                }));
            } else {
                console.error("Sign-in succeeded but no data returned?");
            }

        } catch (error: any) {
            console.error("Sign in failed", error);
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                // user cancelled the login flow
            } else if (error.code === statusCodes.IN_PROGRESS) {
                // operation (e.g. sign in) is in progress already
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                // play services not available or outdated
            } else {
                // some other error happened
            }
        } finally {
            setIsLoading(false);
        }
    };

    const signOut = async () => {
        try {
            if (Platform.OS !== 'web') {
                await GoogleSignin.signOut();
            }
            // For web, we just clear the local state; we can't force logout from Google easily without opening a URL
            setUser(null);
            setAccessToken(null);
            await AsyncStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.error("Sign out failed", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, accessToken, signIn, signOut, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

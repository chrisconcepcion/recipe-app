import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'recipe_app_auth';

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

    useEffect(() => {
        GoogleSignin.configure({
            webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
            scopes: ['https://www.googleapis.com/auth/drive.file'],
            offlineAccess: true,
            forceCodeForRefreshToken: true,
        });

        const restoreSession = async () => {
            console.log("AuthContext: Restoring session...");
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
                // Ignore "no saved credential" errors which are common on fresh installs
                console.log("AuthContext: Session restore check finished (nosession/error)", error);
            } finally {
                setIsLoading(false);
            }
        };
        restoreSession();
    }, []);

    const signIn = async () => {
        setIsLoading(true);
        try {
            await GoogleSignin.hasPlayServices();
            const response = await GoogleSignin.signIn();

            if (response.type === 'cancelled') {
                console.log("Google Sign-In cancelled");
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
            await GoogleSignin.signOut();
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

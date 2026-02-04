import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
    const { signIn, isLoading } = useAuth();

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Ionicons name="restaurant-outline" size={80} color="#E25822" />
                <Text style={styles.title}>Recipe Manager</Text>
                <Text style={styles.subtitle}>Store your favorite recipes in the cloud.</Text>

                <TouchableOpacity
                    style={styles.button}
                    onPress={signIn}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <View style={styles.btnContent}>
                            <Ionicons name="logo-google" size={24} color="#fff" style={{ marginRight: 10 }} />
                            <Text style={styles.buttonText}>Sign in with Google</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <Text style={styles.disclaimer}>
                    Uses Google Photos for storage.
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        alignItems: 'center',
        width: '80%',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 20,
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 40,
    },
    button: {
        backgroundColor: '#4285F4',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center'
    },
    btnContent: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    disclaimer: {
        marginTop: 20,
        fontSize: 12,
        color: '#aaa'
    }
});

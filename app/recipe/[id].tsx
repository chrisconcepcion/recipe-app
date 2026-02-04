import { useRecipeStore } from '@/hooks/useRecipeStore';
import { DriveImage } from '@/src/components/DriveImage';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';


export default function RecipeDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { state: { recipes }, deleteRecipe } = useRecipeStore();

    const recipe = recipes.find((r) => r.id === id);

    if (!recipe) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Recipe not found</Text>
            </View>
        );
    }

    const handleDelete = () => {
        Alert.alert(
            "Delete Recipe",
            `Are you sure you want to delete "${recipe.title}"?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        deleteRecipe(recipe.id);
                        router.back();
                    }
                }
            ]
        );
    };

    const handleEdit = () => {
        router.push({
            pathname: '/create-recipe',
            params: { recipeId: recipe.id }
        });
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <DriveImage source={{ uri: recipe.image }} style={styles.image} />
                <Text style={styles.title}>{recipe.title}</Text>
                <Text style={styles.description}>{recipe.description}</Text>

                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Ingredients</Text>
                    {recipe.ingredients.map((ing) => (
                        <View key={ing.id} style={styles.listItem}>
                            <Text style={styles.itemText}>{ing.quantity} {ing.unit} {ing.name}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Phases</Text>
                    {recipe.phases.map((phase, index) => (
                        <View key={phase.id} style={styles.phaseContainer}>
                            <Text style={styles.phaseTitle}>{index + 1}. {phase.name}</Text>
                            <Text style={styles.phaseInstructions}>{phase.instructions}</Text>
                            {phase.photoUris && phase.photoUris.length > 0 && (
                                <DriveImage source={{ uri: phase.photoUris[0] }} style={styles.phaseImage} />
                            )}
                        </View>
                    ))}
                </View>

                <View style={styles.actionContainer}>
                    <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                        <Text style={styles.buttonText}>Edit Recipe</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                        <Text style={styles.buttonText}>Delete Recipe</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Floating Back Button */}
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        paddingBottom: 40,
    },
    errorText: {
        fontSize: 18,
        textAlign: 'center',
        marginTop: 40,
        color: '#666',
    },
    image: {
        width: '100%',
        height: 250,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        padding: 16,
        color: '#333',
    },
    description: {
        fontSize: 16,
        paddingHorizontal: 16,
        color: '#666',
        marginBottom: 24,
    },
    section: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    sectionHeader: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#333',
    },
    listItem: {
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    itemText: {
        fontSize: 16,
        color: '#444',
    },
    phaseContainer: {
        marginBottom: 20,
        backgroundColor: '#fafafa',
        padding: 12,
        borderRadius: 8,
    },
    phaseTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    phaseInstructions: {
        fontSize: 16,
        lineHeight: 24,
        color: '#444',
    },
    phaseImage: {
        width: '100%',
        height: 150,
        borderRadius: 8,
        marginTop: 12,
    },
    actionContainer: {
        padding: 16,
        flexDirection: 'row',
        gap: 16,
    },
    editButton: {
        flex: 1,
        backgroundColor: '#007AFF', // Blue
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    deleteButton: {
        flex: 1,
        backgroundColor: '#FF3B30', // Red
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    backButton: {
        position: 'absolute',
        top: 40,
        left: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 8,
        borderRadius: 20,
        zIndex: 10,
    },
});

import { useRecipeStore } from '@/hooks/useRecipeStore';
import { useRouter } from 'expo-router';
import React from 'react';
import { Button, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import the RecipeList component from its correct location
import RecipeList from '@/components/recipe-list';

const HomeScreen = () => {
    const router = useRouter();
    const { state: { recipes } } = useRecipeStore();

    const handleAddRecipe = () => {
        router.push('/create-recipe');
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <RecipeList recipeList={recipes} />
            <View style={styles.footer}>
                <Button title="Add Recipe" onPress={handleAddRecipe} />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    footer: {
        padding: 16,
        paddingBottom: 32,
    }
});

export default HomeScreen;

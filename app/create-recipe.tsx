import { useAuth } from '@/contexts/AuthContext';
import { useRecipeStore } from '@/hooks/useRecipeStore';
import { DriveImage } from '@/src/components/DriveImage';
import { Ingredient } from '@/src/interfaces/Ingredient';
import { Phase } from '@/src/interfaces/Phase';
import { Recipe } from '@/src/interfaces/Recipe';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COOKING_UNITS = [
    // Volume
    'cup', 'tbsp', 'tsp', 'ml', 'l', 'cl', 'fl oz', 'pint', 'quart', 'gallon',
    // Weight
    'g', 'kg', 'oz', 'lb',
    // Count/Misc
    'pinch', 'dash', 'piece', 'slice', 'clove',
    'can', 'jar', 'package', 'bag', 'stick',
    'sprig', 'bunch', 'head', 'stalk', 'fillet'
];

export default function CreateRecipeScreen() {
    const router = useRouter();
    const { recipeId } = useLocalSearchParams(); // Get ID from params
    const { state: { recipes }, addRecipe, editRecipe } = useRecipeStore();
    const { accessToken } = useAuth();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState('');
    const [sourceUrl, setSourceUrl] = useState('');
    const [calories, setCalories] = useState('');
    const [servingSize, setServingSize] = useState('');
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [phases, setPhases] = useState<Phase[]>([]);

    // Ingredient State
    const [ingName, setIngName] = useState('');
    const [ingQty, setIngQty] = useState('');
    const [ingUnit, setIngUnit] = useState('g');
    const [showUnitPicker, setShowUnitPicker] = useState(false);
    const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null);

    // Phase State
    const [phaseName, setPhaseName] = useState('');
    const [phaseInstructions, setPhaseInstructions] = useState('');
    const [phasePhoto, setPhasePhoto] = useState('');
    const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load recipe if in edit mode
    useEffect(() => {
        if (recipeId && !isLoaded && recipes.length > 0) {
            const existingRecipe = recipes.find(r => r.id === recipeId);
            if (existingRecipe) {
                console.log("Loading existing recipe into form:", existingRecipe.title);
                setTitle(existingRecipe.title);
                setDescription(existingRecipe.description);
                setImage(existingRecipe.image);
                setSourceUrl(existingRecipe.sourceUrl || '');
                setCalories(existingRecipe.calories || '');
                setServingSize(existingRecipe.servingSize || '');
                setIngredients(existingRecipe.ingredients || []);
                setPhases(existingRecipe.phases || []);
                setIsLoaded(true);
            }
        }
    }, [recipeId, recipes, isLoaded]);

    const pickImage = async (isPhase: boolean = false) => {
        // No permissions request is necessary for launching the image library
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            if (isPhase) {
                setPhasePhoto(result.assets[0].uri);
            } else {
                setImage(result.assets[0].uri);
            }
        }
    };

    const handleAddOrUpdateIngredient = () => {
        if (!ingName || !ingQty || !ingUnit) {
            Alert.alert('Error', 'Please fill in all ingredient fields');
            return;
        }

        const quantity = parseFloat(ingQty) || ingQty;

        if (editingIngredientId) {
            // Update existing
            setIngredients(ingredients.map(ing =>
                ing.id === editingIngredientId
                    ? { ...ing, name: ingName, quantity, unit: ingUnit }
                    : ing
            ));
            setEditingIngredientId(null);
        } else {
            // Add new
            const newIng: Ingredient = {
                id: Date.now().toString(),
                name: ingName,
                quantity,
                unit: ingUnit,
            };
            setIngredients([...ingredients, newIng]);
        }

        setIngName('');
        setIngQty('');
        // Keep unit
    };

    const handleEditIngredient = (ing: Ingredient) => {
        setIngName(ing.name);
        setIngQty(ing.quantity.toString());
        setIngUnit(ing.unit);
        setEditingIngredientId(ing.id);
    };

    const handleAddOrUpdatePhase = () => {
        if (!phaseName || !phaseInstructions) return;

        const photoUris = phasePhoto ? [phasePhoto] : [];

        if (editingPhaseId) {
            setPhases(phases.map(p =>
                p.id === editingPhaseId
                    ? { ...p, name: phaseName, instructions: phaseInstructions, photoUris }
                    : p
            ));
            setEditingPhaseId(null);
        } else {
            const newPhase: Phase = {
                id: Date.now().toString(),
                name: phaseName,
                instructions: phaseInstructions,
                ingredientIds: [],
                ingredients: [],
                photoUris,
            };
            setPhases([...phases, newPhase]);
        }
        setPhaseName('');
        setPhaseInstructions('');
        setPhasePhoto('');
    };

    const handleEditPhase = (p: Phase) => {
        setPhaseName(p.name);
        setPhaseInstructions(p.instructions);
        setPhasePhoto(p.photoUris[0] || '');
        setEditingPhaseId(p.id);
    };

    const handleDeleteIngredient = (id: string) => {
        setIngredients(ingredients.filter(ing => ing.id !== id));
        if (editingIngredientId === id) {
            setEditingIngredientId(null);
            setIngName('');
            setIngQty('');
        }
    };

    const handleDeletePhase = (id: string) => {
        setPhases(phases.filter(p => p.id !== id));
        if (editingPhaseId === id) {
            setEditingPhaseId(null);
            setPhaseName('');
            setPhaseInstructions('');
            setPhasePhoto('');
        }
    };

    const handleSave = async () => {
        if (!title) {
            Alert.alert('Error', 'Please enter a title');
            return;
        }

        setIsSaving(true);
        try {
            const newRecipe: Recipe = {
                id: (recipeId as string) || Date.now().toString(), // Use existing ID if editing
                title,
                description,
                image,
                sourceUrl,
                calories,
                servingSize,
                ingredients,
                phases,
            };

            console.log("Saving Recipe State:", JSON.stringify({
                title,
                ingredientsCount: ingredients.length,
                phasesCount: phases.length,
                ingredientsFirst: ingredients[0],
                phasesFirst: phases[0]
            }, null, 2));

            if (recipeId) {
                await editRecipe(newRecipe);
            } else {
                await addRecipe(newRecipe);
            }

            router.back();
        } catch (error) {
            console.error("Save failed", error);
            Alert.alert("Error", "Failed to save recipe");
        } finally {
            setIsSaving(false);
        }
    };

    const selectUnit = (unit: string) => {
        setIngUnit(unit);
        setShowUnitPicker(false);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top']}>
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.cancelButton}>
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.header}>{recipeId ? 'Edit Recipe' : 'New Recipe'}</Text>
                    <View style={{ width: 60 }} />
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Title</Text>
                    <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Recipe Title" />
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Image</Text>
                    <TouchableOpacity onPress={() => pickImage(false)} style={styles.imagePickerButton}>
                        <Text style={styles.imagePickerText}>{image ? 'Change Image' : 'Select Image'}</Text>
                    </TouchableOpacity>
                    {image ? <DriveImage source={{ uri: image }} style={styles.imagePreview} /> : null}
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Describe your delicious creation..."
                        multiline
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Details (Optional)</Text>
                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.subLabel}>Calories (kcal)</Text>
                            <TextInput
                                style={styles.input}
                                value={calories}
                                onChangeText={setCalories}
                                placeholder="e.g. 450"
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.subLabel}>Serving Size</Text>
                            <TextInput
                                style={styles.input}
                                value={servingSize}
                                onChangeText={setServingSize}
                                placeholder="e.g. 2 servings"
                            />
                        </View>
                    </View>
                    <View style={{ marginTop: 8 }}>
                        <Text style={styles.subLabel}>Source URL</Text>
                        <TextInput
                            style={styles.input}
                            value={sourceUrl}
                            onChangeText={setSourceUrl}
                            placeholder="https://..."
                            autoCapitalize="none"
                            keyboardType="url"
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Ingredients</Text>
                    {ingredients.map((ing) => (
                        <View key={ing.id} style={[styles.listItem, editingIngredientId === ing.id && styles.editingItem]}>
                            <TouchableOpacity onPress={() => handleEditIngredient(ing)} style={{ flex: 1 }}>
                                <Text>{ing.quantity} {ing.unit} {ing.name}</Text>
                            </TouchableOpacity>
                            <View style={styles.actionButtons}>
                                <TouchableOpacity onPress={() => handleEditIngredient(ing)}>
                                    <Text style={styles.editHint}>Edit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDeleteIngredient(ing.id)}>
                                    <Text style={styles.deleteHint}>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                    <View style={styles.row}>
                        <TextInput
                            style={[styles.input, { flex: 2 }]}
                            value={ingName}
                            onChangeText={setIngName}
                            placeholder="Name"
                        />
                        <TextInput
                            style={[styles.input, { flex: 1 }]}
                            value={ingQty}
                            onChangeText={setIngQty}
                            placeholder="Qty"
                            keyboardType="numeric"
                        />
                        <TouchableOpacity
                            style={[styles.input, { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#eee' }]}
                            onPress={() => setShowUnitPicker(true)}
                        >
                            <Text style={{ fontWeight: '600' }}>{ingUnit || 'Unit'}</Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={[styles.addButton, editingIngredientId ? styles.updateButton : {}]} onPress={handleAddOrUpdateIngredient}>
                        <Text style={styles.addButtonText}>{editingIngredientId ? 'Update Ingredient' : 'Add Ingredient'}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Phases</Text>
                    {phases.map((p) => (
                        <View key={p.id} style={[styles.listItem, editingPhaseId === p.id && styles.editingItem]}>
                            <TouchableOpacity onPress={() => handleEditPhase(p)} style={{ flex: 1 }}>
                                <Text style={styles.phaseTitle}>{p.name}</Text>
                                <Text style={styles.phaseInstructions} numberOfLines={2}>{p.instructions}</Text>
                                {p.photoUris.length > 0 && <Text style={{ fontSize: 12, color: '#007AFF', marginTop: 4 }}>Has Photo</Text>}
                            </TouchableOpacity>
                            <View style={styles.actionButtons}>
                                <TouchableOpacity onPress={() => handleEditPhase(p)}>
                                    <Text style={styles.editHint}>Edit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDeletePhase(p.id)}>
                                    <Text style={styles.deleteHint}>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                    <TextInput style={styles.input} value={phaseName} onChangeText={setPhaseName} placeholder="Phase Name (e.g. Prep)" />
                    <TextInput style={[styles.input, styles.textArea]} value={phaseInstructions} onChangeText={setPhaseInstructions} placeholder="Instructions" multiline />

                    <TouchableOpacity onPress={() => pickImage(true)} style={styles.imagePickerButton}>
                        <Text style={styles.imagePickerText}>{phasePhoto ? 'Change Phase Image' : 'Add Phase Image'}</Text>
                    </TouchableOpacity>
                    {phasePhoto ? <DriveImage source={{ uri: phasePhoto }} style={{ width: 100, height: 100, borderRadius: 8, marginTop: 8 }} /> : null}

                    <TouchableOpacity style={[styles.addButton, editingPhaseId ? styles.updateButton : {}]} onPress={handleAddOrUpdatePhase}>
                        <Text style={styles.addButtonText}>{editingPhaseId ? 'Update Phase' : 'Add Phase'}</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={[styles.saveButton, isSaving && styles.disabledButton]} onPress={handleSave} disabled={isSaving}>
                    <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : (recipeId ? 'Update Recipe' : 'Save Recipe')}</Text>
                </TouchableOpacity>

                {/* Loading Overlay */}
                {isSaving && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#ffffff" />
                        <Text style={styles.loadingText}>Saving to Drive...</Text>
                    </View>
                )}

                {/* Unit Picker Modal */}
                <Modal visible={showUnitPicker} transparent animationType="slide">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalHeader}>Select Unit</Text>
                            <FlatList
                                data={COOKING_UNITS}
                                keyExtractor={(item) => item}
                                renderItem={({ item }) => (
                                    <TouchableOpacity style={styles.modalItem} onPress={() => selectUnit(item)}>
                                        <Text style={styles.modalItemText}>{item}</Text>
                                    </TouchableOpacity>
                                )}
                            />
                            <TouchableOpacity style={styles.closeButton} onPress={() => setShowUnitPicker(false)}>
                                <Text style={styles.closeButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        padding: 16,
        paddingBottom: 40,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    cancelButton: {
        padding: 8,
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#FF3B30',
        fontWeight: '600',
    },
    section: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#444',
    },
    subLabel: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 4,
        color: '#666',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 8,
        backgroundColor: '#fafafa',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    imagePreview: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginTop: 8,
    },
    listItem: {
        padding: 12,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        marginBottom: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    editingItem: {
        backgroundColor: '#e3f2fd', // Light blue to indicate editing
        borderColor: '#007AFF',
        borderWidth: 1,
    },
    editHint: {
        fontSize: 12,
        color: '#007AFF',
    },
    row: {
        flexDirection: 'row',
        gap: 8,
    },
    addButton: {
        backgroundColor: '#e0e0e0',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    updateButton: {
        backgroundColor: '#bbdefb', // Slightly different color for update
    },
    addButtonText: {
        color: '#333',
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: '#007AFF', // Example primary color
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 16,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    phaseTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    phaseInstructions: {
        fontSize: 14,
        color: '#666',
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginLeft: 8,
    },
    deleteHint: {
        fontSize: 12,
        color: '#FF3B30', // Red for delete
        fontWeight: '600',
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        maxHeight: '60%',
        padding: 16,
    },
    modalHeader: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    modalItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        alignItems: 'center',
    },
    modalItemText: {
        fontSize: 16,
        color: '#333',
    },
    closeButton: {
        marginTop: 16,
        padding: 12,
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
    },
    closeButtonText: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '600',
    },
    imagePickerButton: {
        backgroundColor: '#e3f2fd',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#007AFF',
        borderStyle: 'dashed',
    },
    imagePickerText: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '600',
    },
    disabledButton: {
        opacity: 0.7,
        backgroundColor: '#aaa',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    loadingText: {
        color: '#fff',
        marginTop: 16,
        fontSize: 18,
        fontWeight: 'bold',
    },
});

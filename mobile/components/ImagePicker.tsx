import React, { useState } from 'react';
import { View, Pressable, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Camera, Image, X } from 'lucide-react-native';
import { cn } from '@/lib/utils';

interface ImagePickerProps {
    onImageSelected: (imageData: {
        uri: string;
        base64: string;
        filename: string;
        mimeType: string;
        size: number;
        width?: number;
        height?: number;
    }) => void;
    disabled?: boolean;
    className?: string;
}

export function ImagePickerComponent({
    onImageSelected,
    disabled = false,
    className
}: ImagePickerProps) {
    const [isLoading, setIsLoading] = useState(false);

    const requestPermissions = async () => {
        if (Platform.OS !== 'web') {
            const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
            const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
                Alert.alert(
                    'Permissions Required',
                    'Sorry, we need camera and photo library permissions to share images.',
                    [{ text: 'OK' }]
                );
                return false;
            }
        }
        return true;
    };

    const showImagePicker = async () => {
        if (disabled || isLoading) return;

        const hasPermissions = await requestPermissions();
        if (!hasPermissions) return;

        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        Alert.alert(
            'Select Image',
            'Choose how you want to select an image',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Camera', onPress: () => openCamera() },
                { text: 'Photo Library', onPress: () => openImageLibrary() },
            ]
        );
    };

    const openCamera = async () => {
        try {
            setIsLoading(true);

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
                base64: true,
            });

            if (!result.canceled && result.assets[0]) {
                await processImage(result.assets[0]);
            }
        } catch (error) {
            console.error('Error opening camera:', error);
            Alert.alert('Error', 'Failed to open camera');
        } finally {
            setIsLoading(false);
        }
    };

    const openImageLibrary = async () => {
        try {
            setIsLoading(true);

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
                base64: true,
            });

            if (!result.canceled && result.assets[0]) {
                await processImage(result.assets[0]);
            }
        } catch (error) {
            console.error('Error opening image library:', error);
            Alert.alert('Error', 'Failed to open image library');
        } finally {
            setIsLoading(false);
        }
    };

    const processImage = async (asset: ImagePicker.ImagePickerAsset) => {
        try {
            if (!asset.base64) {
                Alert.alert('Error', 'Failed to process image');
                return;
            }

            // Check file size (limit to 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (asset.fileSize && asset.fileSize > maxSize) {
                Alert.alert(
                    'File Too Large',
                    'Please select an image smaller than 5MB'
                );
                return;
            }

            const filename = asset.fileName || `image_${Date.now()}.jpg`;
            const mimeType = asset.type || 'image/jpeg';

            onImageSelected({
                uri: asset.uri,
                base64: asset.base64,
                filename,
                mimeType,
                size: asset.fileSize || 0,
                width: asset.width,
                height: asset.height,
            });

            if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
        } catch (error) {
            console.error('Error processing image:', error);
            Alert.alert('Error', 'Failed to process image');
        }
    };

    return (
        <Pressable
            onPress={showImagePicker}
            disabled={disabled || isLoading}
            className={cn(
                'h-10 w-10 items-center justify-center rounded-full',
                disabled || isLoading
                    ? 'bg-muted opacity-50'
                    : 'bg-muted active:bg-muted/80',
                className
            )}>
            <Icon
                as={Image}
                size={18}
                className={cn(
                    disabled || isLoading
                        ? 'text-muted-foreground'
                        : 'text-foreground'
                )}
            />
        </Pressable>
    );
}

// Export with a more standard name
export { ImagePickerComponent as ImagePicker };

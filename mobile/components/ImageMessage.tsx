import React, { useState } from 'react';
import { View, Pressable, Modal, Image, ActivityIndicator, Alert } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { X, Download, AlertCircle } from 'lucide-react-native';
import { cn } from '@/lib/utils';
import type { ImageMessageEvent } from '@/types/server/ImageMessageEvent';

interface ImageMessageProps {
    imageData: ImageMessageEvent;
    isOwnMessage?: boolean;
    className?: string;
}

export function ImageMessage({ imageData, isOwnMessage = false, className }: ImageMessageProps) {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const imageUri = `data:${imageData.mime_type};base64,${imageData.image_data}`;

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const handleImageLoad = () => {
        setIsLoading(false);
        setHasError(false);
    };

    const handleImageError = () => {
        setIsLoading(false);
        setHasError(true);
    };

    const handleImagePress = () => {
        if (!hasError) {
            setIsModalVisible(true);
        }
    };

    const handleDownload = () => {
        Alert.alert('Download', 'Image download feature coming soon!');
    };

    return (
        <>
            <View className={cn('relative', className)}>
                <Pressable
                    onPress={handleImagePress}
                    disabled={hasError}
                    className={cn(
                        'relative overflow-hidden rounded-lg',
                        isOwnMessage ? 'bg-primary/10' : 'bg-muted/50'
                    )}>
                    {isLoading && (
                        <View className="absolute inset-0 z-10 items-center justify-center bg-muted/80">
                            <ActivityIndicator size="small" className="text-foreground" />
                        </View>
                    )}

                    {hasError ? (
                        <View className="h-32 w-48 items-center justify-center bg-muted">
                            <Icon
                                as={AlertCircle}
                                size={24}
                                className="mb-2 text-muted-foreground"
                            />
                            <Text className="text-xs text-muted-foreground">
                                Failed to load image
                            </Text>
                        </View>
                    ) : (
                        <Image
                            source={{ uri: imageUri }}
                            style={{
                                width: Math.min(imageData.width || 200, 250),
                                height: Math.min(imageData.height || 150, 200),
                                aspectRatio:
                                    imageData.width && imageData.height
                                        ? imageData.width / imageData.height
                                        : 16 / 9,
                            }}
                            onLoad={handleImageLoad}
                            onError={handleImageError}
                            resizeMode="cover"
                        />
                    )}
                </Pressable>

                <View className="mt-1">
                    <Text
                        className={cn(
                            'text-xs',
                            isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        )}>
                        {imageData.filename} • {formatFileSize(imageData.size)}
                    </Text>
                </View>
            </View>

            <Modal
                visible={isModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsModalVisible(false)}>
                <View className="flex-1 bg-black">
                    <View className="absolute left-0 right-0 top-0 z-10 flex-row items-center justify-between bg-black/50 p-4 pt-12">
                        <View className="flex-1">
                            <Text className="font-medium text-white">{imageData.filename}</Text>
                            <Text className="text-sm text-white/70">
                                {formatFileSize(imageData.size)} • {imageData.width}×
                                {imageData.height}
                            </Text>
                        </View>
                        <View className="flex-row gap-2">
                            <Pressable
                                onPress={handleDownload}
                                className="h-10 w-10 items-center justify-center rounded-full bg-black/50">
                                <Icon as={Download} size={20} className="text-white" />
                            </Pressable>
                            <Pressable
                                onPress={() => setIsModalVisible(false)}
                                className="h-10 w-10 items-center justify-center rounded-full bg-black/50">
                                <Icon as={X} size={20} className="text-white" />
                            </Pressable>
                        </View>
                    </View>

                    <View className="flex-1 items-center justify-center">
                        <Image
                            source={{ uri: imageUri }}
                            style={{
                                width: '100%',
                                height: '100%',
                            }}
                            resizeMode="contain"
                        />
                    </View>

                    <Pressable
                        onPress={() => setIsModalVisible(false)}
                        className="absolute inset-0 -z-10"
                    />
                </View>
            </Modal>
        </>
    );
}

import React, { useState } from 'react';
import { View, Modal } from 'react-native';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { User } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';

interface UsernameSetupProps {
    visible: boolean;
    onSetUsername: (username: string) => void;
    loading?: boolean;
}

export function UsernameSetup({ visible, onSetUsername, loading = false }: UsernameSetupProps) {
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = () => {
        const trimmedUsername = username.trim();

        if (!trimmedUsername) {
            setError('Username is required');
            return;
        }

        if (trimmedUsername.length < 2) {
            setError('Username must be at least 2 characters');
            return;
        }

        if (trimmedUsername.length > 20) {
            setError('Username must be less than 20 characters');
            return;
        }

        if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
            setError('Username can only contain letters, numbers, underscores, and hyphens');
            return;
        }

        setError('');
        onSetUsername(trimmedUsername);
    };

    const handleUsernameChange = (text: string) => {
        setUsername(text);
        if (error) {
            setError('');
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            statusBarTranslucent={true}>
            <View className="flex-1 bg-black/50 items-center justify-center px-6">
                <View className="w-full max-w-sm bg-background rounded-2xl p-6 shadow-lg">
                    <View className="items-center mb-6">
                        <View className="w-16 h-16 bg-primary/10 rounded-full items-center justify-center mb-4">
                            <Icon as={User} size={32} className="text-primary" />
                        </View>
                        <Text className="text-xl font-semibold text-center">
                            Welcome to Simple Chat
                        </Text>
                        <Text className="text-sm text-muted-foreground text-center mt-2">
                            Choose a username to get started
                        </Text>
                    </View>

                    <View className="space-y-4">
                        <View>
                            <Input
                                value={username}
                                onChangeText={handleUsernameChange}
                                placeholder="Enter your username"
                                maxLength={20}
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!loading}
                                onSubmitEditing={handleSubmit}
                                returnKeyType="done"
                                className="text-center"
                            />
                            {error ? (
                                <Text className="text-destructive text-sm mt-2 text-center">
                                    {error}
                                </Text>
                            ) : null}
                        </View>

                        <Button
                            onPress={handleSubmit}
                            disabled={!username.trim() || loading}
                            className="w-full">
                            <Text className="text-primary-foreground font-medium">
                                {loading ? 'Setting up...' : 'Continue'}
                            </Text>
                        </Button>
                    </View>

                    <Text className="text-xs text-muted-foreground text-center mt-4">
                        You can change your username later in settings
                    </Text>
                </View>
            </View>
        </Modal>
    );
}

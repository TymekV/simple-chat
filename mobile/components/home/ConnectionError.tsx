import React from 'react';
import { View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { RefreshCcwIcon } from 'lucide-react-native';

interface ConnectionErrorProps {
    onRetry: () => void;
    isConnected: boolean;
    title?: string;
    description?: string;
    retryLabel?: string;
}

export function ConnectionError({
    onRetry,
    isConnected,
    title = 'Connection Error',
    description = 'Unable to connect to the server. Please check your connection and try again.',
    retryLabel = 'Retry',
}: ConnectionErrorProps) {
    return (
        <View className="flex-1 items-center justify-center py-12">
            <Icon as={RefreshCcwIcon} className="mb-4 size-12 text-destructive" />
            <Text className="mb-2 text-lg font-medium">{title}</Text>
            <Text className="mb-6 px-4 text-center text-muted-foreground">{description}</Text>
            <Button variant="outline" onPress={onRetry} disabled={!isConnected}>
                <Icon as={RefreshCcwIcon} className="mr-2 size-4" />
                <Text>{retryLabel}</Text>
            </Button>
        </View>
    );
}

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Link, Stack } from 'expo-router';
import { MoonStarIcon, StarIcon, SunIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Image, type ImageStyle, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const LOGO = {
    light: require('@/assets/images/react-native-reusables-light.png'),
    dark: require('@/assets/images/react-native-reusables-dark.png'),
};

const SCREEN_OPTIONS = {
    title: 'Simple Chat',
    headerTransparent: true,
    headerRight: () => <ThemeToggle />,
};

const IMAGE_STYLE: ImageStyle = {
    height: 76,
    width: 76,
};

export default function Screen() {
    const { colorScheme } = useColorScheme();

    return (
        <>
            <Stack.Screen options={SCREEN_OPTIONS} />
            <SafeAreaView className="flex-1 bg-background">
                <View className="items-center justify-center gap-4 py-8">
                    <Image
                        source={LOGO[colorScheme ?? 'light']}
                        style={IMAGE_STYLE}
                        resizeMode="contain"
                    />
                    <Text className="text-2xl font-bold">Simple Chat</Text>
                    <Text className="text-center text-muted-foreground">
                        Choose a room to start chatting
                    </Text>
                </View>

                <View className="flex-1 gap-3 px-4">
                    <Text className="mb-2 text-lg font-semibold">Available Rooms</Text>

                    <Link href="/rooms/550e8400-e29b-41d4-a716-446655440001" asChild>
                        <Button variant="outline" className="h-auto justify-start p-4">
                            <View className="flex-1">
                                <Text className="text-left font-medium">General Chat</Text>
                                <Text className="text-left text-sm text-muted-foreground">
                                    Welcome to the general discussion room
                                </Text>
                            </View>
                        </Button>
                    </Link>

                    <Link href="/rooms/550e8400-e29b-41d4-a716-446655440002" asChild>
                        <Button variant="outline" className="h-auto justify-start p-4">
                            <View className="flex-1">
                                <Text className="text-left font-medium">Tech Talk</Text>
                                <Text className="text-left text-sm text-muted-foreground">
                                    Discuss technology and programming
                                </Text>
                            </View>
                        </Button>
                    </Link>

                    <Link href="/rooms/550e8400-e29b-41d4-a716-446655440003" asChild>
                        <Button variant="outline" className="h-auto justify-start p-4">
                            <View className="flex-1">
                                <Text className="text-left font-medium">Random</Text>
                                <Text className="text-left text-sm text-muted-foreground">
                                    Talk about anything and everything
                                </Text>
                            </View>
                        </Button>
                    </Link>
                </View>
            </SafeAreaView>
        </>
    );
}

const THEME_ICONS = {
    light: SunIcon,
    dark: MoonStarIcon,
};

function ThemeToggle() {
    const { colorScheme, toggleColorScheme } = useColorScheme();

    return (
        <Button
            onPressIn={toggleColorScheme}
            size="icon"
            variant="ghost"
            className="ios:size-9 rounded-full web:mx-4">
            <Icon as={THEME_ICONS[colorScheme ?? 'light']} className="size-5" />
        </Button>
    );
}

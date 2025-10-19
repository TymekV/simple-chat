import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { Link, Stack } from 'expo-router';
import {
    MoonStarIcon,
    PlusIcon,
    RefreshCcwIcon,
    SearchIcon,
    SunIcon,
    UsersIcon,
    XIcon,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
    Image,
    type ImageStyle,
    View,
    ScrollView,
    ActivityIndicator,
    Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSocket } from '@/lib/socket';
import { UsernameSetup } from '@/components/UsernameSetup';
import type { RoomListItem } from '@/types/server/RoomListItem';

const LOGO = {
    light: require('@/assets/images/react-native-reusables-light.png'),
    dark: require('@/assets/images/react-native-reusables-dark.png'),
};

const IMAGE_STYLE: ImageStyle = {
    height: 76,
    width: 76,
};

function RoomCard({ room }: { room: RoomListItem }) {
    const handlePress = () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    return (
        <Link href={`/rooms/${room.id}`} asChild>
            <Button
                variant="outline"
                className="mb-3 h-auto justify-start p-4"
                onPress={handlePress}>
                <View className="flex-1 flex-row items-center">
                    <View className="flex-1">
                        <Text className="mb-1 text-left font-medium">{room.name}</Text>
                        <View className="flex-row items-center">
                            <Icon as={UsersIcon} className="mr-1 size-3 text-muted-foreground" />
                            <Text className="text-xs text-muted-foreground">
                                {room.member_count} {room.member_count === 1 ? 'member' : 'members'}
                            </Text>
                        </View>
                    </View>
                </View>
            </Button>
        </Link>
    );
}

function EmptyState() {
    return (
        <View className="flex-1 items-center justify-center py-12">
            <Icon as={UsersIcon} className="mb-4 size-12 text-muted-foreground" />
            <Text className="mb-2 text-lg font-medium">No rooms available</Text>
            <Text className="mb-6 px-4 text-center text-muted-foreground">
                Create the first room to start chatting with others
            </Text>
            <Link href="/create-room" asChild>
                <Button
                    onPress={() => {
                        if (Platform.OS !== 'web') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        }
                    }}>
                    <Icon as={PlusIcon} className="mr-2 size-4" />
                    <Text>Create Room</Text>
                </Button>
            </Link>
        </View>
    );
}

function LoadingState() {
    return (
        <View className="flex-1 items-center justify-center py-12">
            <ActivityIndicator size="large" className="mb-4" />
            <Text className="text-muted-foreground">Loading rooms...</Text>
        </View>
    );
}

function ConnectionError() {
    const { loadRoomList, isConnected } = useSocket();

    return (
        <View className="flex-1 items-center justify-center py-12">
            <Icon as={RefreshCcwIcon} className="mb-4 size-12 text-destructive" />
            <Text className="mb-2 text-lg font-medium">Connection Error</Text>
            <Text className="mb-6 px-4 text-center text-muted-foreground">
                Unable to connect to the server. Please check your connection and try again.
            </Text>
            <Button variant="outline" onPress={loadRoomList} disabled={!isConnected}>
                <Icon as={RefreshCcwIcon} className="mr-2 size-4" />
                <Text>Retry</Text>
            </Button>
        </View>
    );
}

export default function Screen() {
    const { colorScheme } = useColorScheme();
    const { rooms, isConnected, loadRoomList, currentUsername, setUsername, currentUserId } =
        useSocket();
    const [isLoading, setIsLoading] = React.useState(true);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [showUsernameSetup, setShowUsernameSetup] = React.useState(false);
    const [isSettingUsername, setIsSettingUsername] = React.useState(false);

    React.useEffect(() => {
        if (currentUserId && currentUsername === null) {
            setShowUsernameSetup(true);
        } else {
            setShowUsernameSetup(false);
        }
    }, [currentUserId, currentUsername]);

    const handleSetUsername = React.useCallback(
        (username: string) => {
            setIsSettingUsername(true);
            setUsername(username);
            setTimeout(() => {
                setIsSettingUsername(false);
            }, 1000);
        },
        [setUsername]
    );

    React.useEffect(() => {
        if (isConnected) {
            const timer = setTimeout(() => {
                setIsLoading(false);
            }, 1000);
            return () => clearTimeout(timer);
        } else {
            setIsLoading(false);
        }
    }, [isConnected, rooms]);

    const filteredRooms = React.useMemo(() => {
        if (!searchQuery.trim()) {
            return rooms;
        }
        return rooms.filter((room) => room.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [rooms, searchQuery]);

    const clearSearch = () => {
        setSearchQuery('');
    };

    const SCREEN_OPTIONS = {
        title: 'Simple Chat',
        headerRight: () => (
            <View className="flex-row items-center gap-1">
                {currentUsername && (
                    <View className="mr-2 rounded-full bg-primary/10 px-3 py-1">
                        <Text className="text-xs font-medium text-primary">{currentUsername}</Text>
                    </View>
                )}
                <ThemeToggle />
                <Link href="/create-room" asChild>
                    <Button
                        className="ios:size-9 rounded-full"
                        size="icon"
                        variant="ghost"
                        onPress={() => {
                            if (Platform.OS !== 'web') {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }
                        }}>
                        <Icon as={PlusIcon} className="size-5" />
                    </Button>
                </Link>
            </View>
        ),
    };

    const renderContent = () => {
        if (!isConnected) {
            return <ConnectionError />;
        }

        if (isLoading) {
            return <LoadingState />;
        }

        if (rooms.length === 0) {
            return <EmptyState />;
        }

        return (
            <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
                <View className="mb-3">
                    <View className="relative flex-row items-center">
                        <Icon
                            as={SearchIcon}
                            className="absolute left-3 z-10 size-4 text-muted-foreground"
                        />
                        <Input
                            placeholder="Search rooms..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            className="pl-10 pr-10"
                        />
                        {searchQuery.length > 0 && (
                            <Button
                                onPress={clearSearch}
                                size="icon"
                                variant="ghost"
                                className="absolute right-1 size-8">
                                <Icon as={XIcon} className="size-4 text-muted-foreground" />
                            </Button>
                        )}
                    </View>
                </View>

                {filteredRooms.length === 0 && searchQuery.trim() ? (
                    <View className="flex-1 items-center justify-center py-12">
                        <Icon as={SearchIcon} className="mb-4 size-12 text-muted-foreground" />
                        <Text className="mb-2 text-lg font-medium">No rooms found</Text>
                        <Text className="mb-6 px-4 text-center text-muted-foreground">
                            No rooms match your search "{searchQuery}". Try a different search term.
                        </Text>
                        <Button variant="outline" onPress={clearSearch}>
                            <Text>Clear Search</Text>
                        </Button>
                    </View>
                ) : (
                    <>
                        {filteredRooms.map((room) => (
                            <RoomCard key={room.id} room={room} />
                        ))}

                        <View className="pb-4">
                            <Link href="/create-room" asChild>
                                <Button
                                    variant="outline"
                                    className="border-dashed"
                                    onPress={() => {
                                        if (Platform.OS !== 'web') {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        }
                                    }}>
                                    <Icon as={PlusIcon} className="mr-2 size-4" />
                                    <Text>Create New Room</Text>
                                </Button>
                            </Link>
                        </View>
                    </>
                )}
            </ScrollView>
        );
    };

    return (
        <>
            <Stack.Screen options={SCREEN_OPTIONS} />
            <View className="flex-1 bg-background">{renderContent()}</View>
            <UsernameSetup
                visible={showUsernameSetup}
                onSetUsername={handleSetUsername}
                loading={isSettingUsername}
            />
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
            className="ios:size-9 rounded-full">
            <Icon as={THEME_ICONS[colorScheme ?? 'light']} className="size-5" />
        </Button>
    );
}

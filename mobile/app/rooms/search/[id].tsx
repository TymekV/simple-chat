import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    View,
    ScrollView,
    TextInput,
    Pressable,
    Keyboard,
    Platform,
    KeyboardAvoidingView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { groupMessages } from '@/components/MessageGroup';
import {
    ArrowLeft,
    Search,
    X,
    Clock,
    TrendingUp,
    Filter,
    Calendar,
    MessageSquare,
    ExternalLink,
    History,
    Trash2,
    Lightbulb,
} from 'lucide-react-native';
import { useRoom, useSocket } from '@/lib/socket';
import type { RoomEvent } from '@/types/server/RoomEvent';

const highlightSearchText = (text: string, searchQuery: string) => {
    if (!searchQuery) return text;

    const searchTerms = searchQuery
        .toLowerCase()
        .split(/\s+/)
        .filter((term) => term.length > 0);

    if (searchTerms.length === 0) return text;

    const pattern = searchTerms
        .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('|');
    const regex = new RegExp(`(${pattern})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
        searchTerms.some((term) => part.toLowerCase().includes(term.toLowerCase())) ? (
            <Text key={index} className="bg-yellow-200 text-foreground dark:bg-yellow-800">
                {part}
            </Text>
        ) : (
            part
        )
    );
};

interface SearchMessageGroupProps {
    messages: RoomEvent[];
    isOwnMessage?: boolean;
    senderName?: string;
    searchQuery?: string;
    onJumpToMessage?: (messageId: string) => void;
}

function SearchMessageGroup({
    messages,
    isOwnMessage = false,
    senderName,
    searchQuery,
    onJumpToMessage,
}: SearchMessageGroupProps) {
    if (messages.length === 0) return null;

    const lastMessage = messages[messages.length - 1];
    const timestamp = new Date(lastMessage.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });
    const date = new Date(lastMessage.timestamp).toLocaleDateString();

    const handleJumpToMessage = () => {
        if (onJumpToMessage && messages.length > 0) {
            onJumpToMessage(messages[0].id);
        }
    };

    return (
        <View className="mb-4">
            <View className={`flex-row ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                <View className={`max-w-[80%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                    {!isOwnMessage && (
                        <Text className="mb-1 text-xs font-medium text-muted-foreground">
                            {senderName}
                        </Text>
                    )}

                    <View
                        className={`rounded-2xl px-4 py-2 ${
                            isOwnMessage
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-foreground'
                        }`}>
                        {messages.map((message, index) => {
                            const messageData =
                                'Message' in message.data ? message.data.Message : null;
                            const messageContent = messageData?.content || '';
                            const isDeleted = messageData?.deleted || false;
                            const isEdited = messageData?.edited || false;

                            return (
                                <View key={message.id} className={index > 0 ? 'mt-1' : ''}>
                                    <Text
                                        className={`text-sm ${
                                            isOwnMessage
                                                ? 'text-primary-foreground'
                                                : 'text-foreground'
                                        }`}>
                                        {isDeleted ? (
                                            <Text className="italic text-muted-foreground">
                                                This message was deleted
                                            </Text>
                                        ) : searchQuery ? (
                                            highlightSearchText(messageContent, searchQuery)
                                        ) : (
                                            messageContent
                                        )}
                                    </Text>
                                    {isEdited && !isDeleted && (
                                        <Text
                                            className={`mt-1 text-xs ${
                                                isOwnMessage
                                                    ? 'text-primary-foreground/70'
                                                    : 'text-muted-foreground'
                                            }`}>
                                            (edited)
                                        </Text>
                                    )}
                                </View>
                            );
                        })}
                    </View>

                    <View className="mt-1 flex-row items-center justify-between">
                        <Text className="text-xs text-muted-foreground">
                            {date} at {timestamp}
                        </Text>
                        <Pressable
                            onPress={handleJumpToMessage}
                            className="ml-2 flex-row items-center rounded-full bg-muted/50 px-2 py-1">
                            <Icon
                                as={ExternalLink}
                                size={12}
                                className="mr-1 text-muted-foreground"
                            />
                            <Text className="text-xs text-muted-foreground">Jump to message</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </View>
    );
}

export default function SearchScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const roomId = Array.isArray(id) ? id[0] : id;

    if (!roomId) {
        return (
            <View className="flex-1 bg-background">
                <Stack.Screen options={{ title: 'Search' }} />
                <View className="flex-1 items-center justify-center">
                    <Text className="text-muted-foreground">Invalid room ID</Text>
                </View>
            </View>
        );
    }

    const { messages } = useRoom(roomId);
    const { currentUserId, roomMembers } = useSocket();

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
    const [senderFilter, setSenderFilter] = useState<string>('all');
    const [messageTypeFilter, setMessageTypeFilter] = useState<'all' | 'text' | 'images'>('all');
    const [searchHistory, setSearchHistory] = useState<Array<{ query: string; timestamp: number }>>(
        []
    );
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<TextInput>(null);

    useEffect(() => {
        loadSearchHistory();
    }, []);

    const loadSearchHistory = async () => {
        try {
            const history = await AsyncStorage.getItem(`search_history_${roomId}`);
            if (history) {
                setSearchHistory(JSON.parse(history));
            }
        } catch (error) {
            console.error('Failed to load search history:', error);
        }
    };

    const saveSearchHistory = async (newHistory: Array<{ query: string; timestamp: number }>) => {
        try {
            await AsyncStorage.setItem(`search_history_${roomId}`, JSON.stringify(newHistory));
        } catch (error) {
            console.error('Failed to save search history:', error);
        }
    };

    const addToSearchHistory = (query: string) => {
        if (!query.trim()) return;

        const newEntry = { query: query.trim(), timestamp: Date.now() };
        const updatedHistory = [
            newEntry,
            ...searchHistory.filter((item) => item.query !== query.trim()),
        ].slice(0, 10);

        setSearchHistory(updatedHistory);
        saveSearchHistory(updatedHistory);
    };

    const clearSearchHistory = async () => {
        setSearchHistory([]);
        try {
            await AsyncStorage.removeItem(`search_history_${roomId}`);
        } catch (error) {
            console.error('Failed to clear search history:', error);
        }
    };

    const handleBack = () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        router.back();
    };

    const handleJumpToMessage = (messageId: string) => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        router.replace(`/rooms/${roomId}`);
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        setDebouncedSearchQuery('');
        setIsSearching(false);
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        inputRef.current?.focus();
    };

    const handleSearchChange = useCallback(
        (query: string) => {
            setSearchQuery(query);
            setIsSearching(query.length > 0);

            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }

            if (query.length === 0) {
                setDebouncedSearchQuery('');
                setIsSearching(false);
                return;
            }

            searchTimeoutRef.current = setTimeout(() => {
                setDebouncedSearchQuery(query);
                setIsSearching(false);

                if (query.trim()) {
                    addToSearchHistory(query.trim());
                }
            }, 300);
        },
        [searchHistory]
    );

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    const getSenderName = useCallback(
        (senderId: String | string) => {
            const senderIdStr = String(senderId);
            if (senderIdStr === currentUserId) {
                return 'You';
            }
            const member = roomMembers.find((m) => String(m.user_id) === senderIdStr);
            if (member?.username) {
                return member.username;
            }
            return `User ${senderIdStr.slice(0, 8)}`;
        },
        [currentUserId, roomMembers]
    );

    const filteredResults = useMemo(() => {
        if (!debouncedSearchQuery) return [];

        let messageEvents = messages.filter(
            (event) => 'Message' in event.data || 'Image' in event.data
        );

        if (dateFilter !== 'all') {
            const now = new Date();
            const cutoffDate = new Date();

            switch (dateFilter) {
                case 'today':
                    cutoffDate.setHours(0, 0, 0, 0);
                    break;
                case 'week':
                    cutoffDate.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    cutoffDate.setMonth(now.getMonth() - 1);
                    break;
            }

            messageEvents = messageEvents.filter(
                (event) => new Date(event.timestamp) >= cutoffDate
            );
        }

        // Apply message type filter
        if (messageTypeFilter !== 'all') {
            messageEvents = messageEvents.filter((event) => {
                if (messageTypeFilter === 'text') {
                    return 'Message' in event.data;
                } else if (messageTypeFilter === 'images') {
                    return 'Image' in event.data;
                }
                return true;
            });
        }

        const groupedMessages = groupMessages(messageEvents, currentUserId || '');

        // Apply sender filter
        let filteredGroups = groupedMessages;
        if (senderFilter !== 'all') {
            filteredGroups = groupedMessages.filter(
                (group) => String(group.senderId) === senderFilter
            );
        }

        const searchTerms = debouncedSearchQuery
            .toLowerCase()
            .split(/\s+/)
            .filter((term) => term.length > 0);

        const matchingGroups = filteredGroups.filter((group) => {
            return group.messages.some((msg) => {
                if ('Message' in msg.data) {
                    const content = msg.data.Message.content.toLowerCase();
                    return searchTerms.every((term) => content.includes(term));
                }
                return false;
            });
        });

        return matchingGroups;
    }, [
        messages,
        currentUserId,
        debouncedSearchQuery,
        dateFilter,
        senderFilter,
        messageTypeFilter,
    ]);

    const searchSuggestions = useMemo(() => {
        if (searchQuery || debouncedSearchQuery) return [];

        const wordFrequency = new Map<string, number>();
        messages.forEach((event) => {
            if ('Message' in event.data) {
                const words = event.data.Message.content
                    .toLowerCase()
                    .split(/\W+/)
                    .filter((word) => word.length > 2);
                words.forEach((word) => {
                    wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
                });
            }
        });

        return Array.from(wordFrequency.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([word]) => word);
    }, [messages, searchQuery, debouncedSearchQuery]);

    const searchResultCount = filteredResults.length;

    const uniqueSenders = useMemo(() => {
        const senders = new Set<string>();
        messages.forEach((event) => {
            if ('Message' in event.data || 'Image' in event.data) {
                senders.add(String(event.from));
            }
        });
        return Array.from(senders);
    }, [messages]);

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (dateFilter !== 'all') count++;
        if (senderFilter !== 'all') count++;
        if (messageTypeFilter !== 'all') count++;
        return count;
    }, [dateFilter, senderFilter, messageTypeFilter]);

    const clearAllFilters = () => {
        setDateFilter('all');
        setSenderFilter('all');
        setMessageTypeFilter('all');
    };

    return (
        <View className="flex-1 bg-background">
            <Stack.Screen
                options={{
                    title: '',
                    headerLeft: () => (
                        <Pressable onPress={handleBack} className="p-2">
                            <Icon as={ArrowLeft} size={24} className="text-foreground" />
                        </Pressable>
                    ),
                    headerTitle: () => (
                        <View className="flex-1 flex-row items-center px-4">
                            <View className="mr-2 flex-1">
                                <Input
                                    ref={inputRef}
                                    placeholder="Search messages..."
                                    value={searchQuery}
                                    onChangeText={handleSearchChange}
                                    className="h-10 text-base"
                                    autoFocus
                                    returnKeyType="search"
                                    onSubmitEditing={() => Keyboard.dismiss()}
                                    clearButtonMode="never"
                                />
                            </View>
                            <View className="flex-row items-center">
                                <Pressable
                                    onPress={() => setShowFilters(!showFilters)}
                                    className="relative mr-2 p-2">
                                    <Icon as={Filter} size={20} className="text-muted-foreground" />
                                    {activeFiltersCount > 0 && (
                                        <View className="absolute -right-1 -top-1 h-4 w-4 items-center justify-center rounded-full bg-primary">
                                            <Text className="text-xs font-bold text-primary-foreground">
                                                {activeFiltersCount}
                                            </Text>
                                        </View>
                                    )}
                                </Pressable>
                                {searchQuery.length > 0 && (
                                    <Pressable onPress={handleClearSearch} className="p-2">
                                        <Icon as={X} size={20} className="text-muted-foreground" />
                                    </Pressable>
                                )}
                            </View>
                        </View>
                    ),
                }}
            />

            {showFilters && (
                <View className="border-b border-border bg-muted/20 p-4">
                    <View className="mb-4 flex-row items-center justify-between">
                        <Text className="text-base font-semibold text-foreground">
                            Search Filters
                        </Text>
                        {activeFiltersCount > 0 && (
                            <Pressable onPress={clearAllFilters}>
                                <Text className="text-sm text-primary">Clear All</Text>
                            </Pressable>
                        )}
                    </View>

                    <View className="mb-4">
                        <Text className="mb-2 text-sm font-medium text-foreground">Time Range</Text>
                        <View className="flex-row flex-wrap gap-2">
                            {[
                                { key: 'all', label: 'All Time' },
                                { key: 'today', label: 'Today' },
                                { key: 'week', label: 'Last Week' },
                                { key: 'month', label: 'Last Month' },
                            ].map((option) => (
                                <Pressable
                                    key={option.key}
                                    onPress={() => setDateFilter(option.key as any)}
                                    className={`rounded-full px-3 py-1.5 ${
                                        dateFilter === option.key ? 'bg-primary' : 'bg-muted'
                                    }`}>
                                    <Text
                                        className={`text-xs ${
                                            dateFilter === option.key
                                                ? 'text-primary-foreground'
                                                : 'text-muted-foreground'
                                        }`}>
                                        {option.label}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    <View className="mb-4">
                        <Text className="mb-2 text-sm font-medium text-foreground">Sender</Text>
                        <View className="flex-row flex-wrap gap-2">
                            <Pressable
                                onPress={() => setSenderFilter('all')}
                                className={`rounded-full px-3 py-1.5 ${
                                    senderFilter === 'all' ? 'bg-primary' : 'bg-muted'
                                }`}>
                                <Text
                                    className={`text-xs ${
                                        senderFilter === 'all'
                                            ? 'text-primary-foreground'
                                            : 'text-muted-foreground'
                                    }`}>
                                    All Users
                                </Text>
                            </Pressable>
                            {uniqueSenders.slice(0, 4).map((senderId) => (
                                <Pressable
                                    key={senderId}
                                    onPress={() => setSenderFilter(senderId)}
                                    className={`rounded-full px-3 py-1.5 ${
                                        senderFilter === senderId ? 'bg-primary' : 'bg-muted'
                                    }`}>
                                    <Text
                                        className={`text-xs ${
                                            senderFilter === senderId
                                                ? 'text-primary-foreground'
                                                : 'text-muted-foreground'
                                        }`}>
                                        {getSenderName(senderId)}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    <View>
                        <Text className="mb-2 text-sm font-medium text-foreground">
                            Message Type
                        </Text>
                        <View className="flex-row flex-wrap gap-2">
                            {[
                                { key: 'all', label: 'All Types', icon: MessageSquare },
                                { key: 'text', label: 'Text Only', icon: MessageSquare },
                                { key: 'images', label: 'Images Only', icon: Calendar },
                            ].map((option) => (
                                <Pressable
                                    key={option.key}
                                    onPress={() => setMessageTypeFilter(option.key as any)}
                                    className={`flex-row items-center rounded-full px-3 py-1.5 ${
                                        messageTypeFilter === option.key ? 'bg-primary' : 'bg-muted'
                                    }`}>
                                    <Icon
                                        as={option.icon}
                                        size={12}
                                        className={`mr-1 ${
                                            messageTypeFilter === option.key
                                                ? 'text-primary-foreground'
                                                : 'text-muted-foreground'
                                        }`}
                                    />
                                    <Text
                                        className={`text-xs ${
                                            messageTypeFilter === option.key
                                                ? 'text-primary-foreground'
                                                : 'text-muted-foreground'
                                        }`}>
                                        {option.label}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                </View>
            )}

            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
                {debouncedSearchQuery && (
                    <View className="border-b border-border bg-muted/30 px-4 py-2">
                        <Text className="text-sm text-muted-foreground">
                            {isSearching
                                ? 'Searching...'
                                : `${searchResultCount} result${
                                      searchResultCount !== 1 ? 's' : ''
                                  } for "${debouncedSearchQuery}"${
                                      activeFiltersCount > 0
                                          ? ` (${activeFiltersCount} filter${
                                                activeFiltersCount !== 1 ? 's' : ''
                                            } active)`
                                          : ''
                                  }`}
                        </Text>
                    </View>
                )}

                <ScrollView
                    className="flex-1 px-4"
                    contentContainerStyle={{
                        paddingVertical: 16,
                        flexGrow: 1,
                    }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled">
                    {!searchQuery ? (
                        <View className="flex-1 py-4">
                            {searchHistory.length > 0 && (
                                <View className="mb-6">
                                    <View className="mb-3 flex-row items-center justify-between">
                                        <Text className="text-sm font-medium text-foreground">
                                            Search History
                                        </Text>
                                        <Pressable onPress={clearSearchHistory}>
                                            <Icon
                                                as={Trash2}
                                                size={16}
                                                className="text-muted-foreground"
                                            />
                                        </Pressable>
                                    </View>
                                    <View className="gap-2">
                                        {searchHistory.slice(0, 5).map((item, index) => (
                                            <Pressable
                                                key={index}
                                                onPress={() => {
                                                    setSearchQuery(item.query);
                                                    handleSearchChange(item.query);
                                                }}
                                                className="flex-row items-center rounded-lg bg-muted/30 p-3">
                                                <Icon
                                                    as={History}
                                                    size={16}
                                                    className="mr-3 text-muted-foreground"
                                                />
                                                <View className="flex-1">
                                                    <Text className="text-sm text-foreground">
                                                        {item.query}
                                                    </Text>
                                                    <Text className="text-xs text-muted-foreground">
                                                        {new Date(
                                                            item.timestamp
                                                        ).toLocaleDateString()}
                                                    </Text>
                                                </View>
                                            </Pressable>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {searchSuggestions.length > 0 && (
                                <View className="mb-6">
                                    <Text className="mb-3 text-sm font-medium text-foreground">
                                        Suggested
                                    </Text>
                                    <View className="gap-2">
                                        {searchSuggestions.map((suggestion, index) => (
                                            <Pressable
                                                key={index}
                                                onPress={() => {
                                                    setSearchQuery(suggestion);
                                                    handleSearchChange(suggestion);
                                                }}
                                                className="flex-row items-center rounded-lg bg-muted/30 p-3">
                                                <Icon
                                                    as={Lightbulb}
                                                    size={16}
                                                    className="mr-3 text-muted-foreground"
                                                />
                                                <Text className="flex-1 text-sm text-foreground">
                                                    {suggestion}
                                                </Text>
                                            </Pressable>
                                        ))}
                                    </View>
                                </View>
                            )}

                            <View className="flex-1 items-center justify-center py-8">
                                <Icon
                                    as={Search}
                                    size={64}
                                    className="mb-4 text-muted-foreground/30"
                                />
                                <Text className="text-center text-lg font-medium text-foreground">
                                    Search Messages
                                </Text>
                                <Text className="mt-2 text-center text-sm text-muted-foreground">
                                    Type to search through your conversation
                                </Text>
                                <Text className="mt-4 text-center text-xs text-muted-foreground/70">
                                    • Use multiple words for better results{'\n'}• Search is
                                    case-insensitive{'\n'}• Results update as you type
                                </Text>
                            </View>
                        </View>
                    ) : isSearching ? (
                        <View className="flex-1 items-center justify-center py-20">
                            <Icon as={Search} size={48} className="mb-4 text-muted-foreground/50" />
                            <Text className="text-center text-sm text-muted-foreground">
                                Searching for "{searchQuery}"...
                            </Text>
                        </View>
                    ) : filteredResults.length === 0 ? (
                        <View className="flex-1 items-center justify-center py-20">
                            <Icon as={Search} size={48} className="mb-4 text-muted-foreground/50" />
                            <Text className="text-center text-sm font-medium text-muted-foreground">
                                No messages found
                            </Text>
                            <Text className="text-center text-sm text-muted-foreground">
                                No messages match "{debouncedSearchQuery}"
                            </Text>
                            <Text className="mt-2 text-center text-xs text-muted-foreground/70">
                                Try different keywords or use multiple words
                            </Text>
                        </View>
                    ) : (
                        <View className="gap-4">
                            {filteredResults.map((group, index) => (
                                <SearchMessageGroup
                                    key={`group-${group.senderId}-${group.messages[0].id}-${index}`}
                                    messages={group.messages}
                                    isOwnMessage={group.isOwnMessage}
                                    senderName={getSenderName(group.senderId)}
                                    searchQuery={debouncedSearchQuery}
                                    onJumpToMessage={handleJumpToMessage}
                                />
                            ))}
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

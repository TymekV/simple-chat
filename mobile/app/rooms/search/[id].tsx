import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
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
import { MessageGroup, groupMessages } from '@/components/MessageGroup';
import { ArrowLeft, Search, X, Clock, TrendingUp } from 'lucide-react-native';
import { useRoom, useSocket } from '@/lib/socket';

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
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<TextInput>(null);

    const handleBack = () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        router.back();
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

                if (query.trim() && !recentSearches.includes(query.trim())) {
                    setRecentSearches((prev) => [query.trim(), ...prev.slice(0, 4)]);
                }
            }, 300);
        },
        [recentSearches]
    );

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

    const messageReactions = useMemo(() => {
        const reactions: {
            [messageId: string]: Array<{
                emoji: string;
                count: number;
                userReacted: boolean;
            }>;
        } = {};

        const reactionMap = new Map<string, { userId: string; messageId: string; emoji: string }>();

        messages.forEach((event) => {
            const userId = String(event.from);

            if ('Reaction' in event.data) {
                const { message_id, reaction } = event.data.Reaction;
                const messageId = String(message_id);
                const key = `${userId}-${messageId}-${reaction}`;
                reactionMap.set(key, { userId, messageId, emoji: reaction });
            } else if ('ReactionRemove' in event.data) {
                const { message_id, reaction } = event.data.ReactionRemove;
                const messageId = String(message_id);
                const key = `${userId}-${messageId}-${reaction}`;
                reactionMap.delete(key);
            }
        });

        reactionMap.forEach(({ userId, messageId, emoji }) => {
            if (!reactions[messageId]) {
                reactions[messageId] = [];
            }

            const existingReaction = reactions[messageId].find((r) => r.emoji === emoji);
            if (existingReaction) {
                existingReaction.count++;
                if (userId === currentUserId) {
                    existingReaction.userReacted = true;
                }
            } else {
                reactions[messageId].push({
                    emoji,
                    count: 1,
                    userReacted: userId === currentUserId,
                });
            }
        });

        return reactions;
    }, [messages, currentUserId]);

    const getMessageReactions = useCallback(
        (messageId: string) => {
            const reactions = messageReactions[messageId] || [];
            return reactions.filter((reaction) => reaction.count > 0);
        },
        [messageReactions]
    );

    const filteredResults = useMemo(() => {
        if (!debouncedSearchQuery) return [];

        const messageEvents = messages.filter(
            (event) => 'Message' in event.data || 'Image' in event.data
        );
        const groupedMessages = groupMessages(messageEvents, currentUserId || '');

        const searchTerms = debouncedSearchQuery
            .toLowerCase()
            .split(/\s+/)
            .filter((term) => term.length > 0);

        const matchingGroups = groupedMessages.filter((group) => {
            return group.messages.some((msg) => {
                if ('Message' in msg.data) {
                    const content = msg.data.Message.content.toLowerCase();
                    return searchTerms.every((term) => content.includes(term));
                }
                return false;
            });
        });

        return matchingGroups;
    }, [messages, currentUserId, debouncedSearchQuery]);

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
                            {searchQuery.length > 0 && (
                                <Pressable onPress={handleClearSearch} className="p-2">
                                    <Icon as={X} size={20} className="text-muted-foreground" />
                                </Pressable>
                            )}
                        </View>
                    ),
                }}
            />

            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
                {debouncedSearchQuery && (
                    <View className="border-b border-border bg-muted/30 px-4 py-2">
                        <Text className="text-sm text-muted-foreground">
                            {isSearching
                                ? 'Searching...'
                                : `${searchResultCount} result${searchResultCount !== 1 ? 's' : ''} for "${debouncedSearchQuery}"`}
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
                            {recentSearches.length > 0 && (
                                <View className="mb-6">
                                    <Text className="mb-3 text-sm font-medium text-foreground">
                                        Recent Searches
                                    </Text>
                                    <View className="gap-2">
                                        {recentSearches.map((search, index) => (
                                            <Pressable
                                                key={index}
                                                onPress={() => {
                                                    setSearchQuery(search);
                                                    handleSearchChange(search);
                                                }}
                                                className="flex-row items-center rounded-lg bg-muted/30 p-3">
                                                <Icon
                                                    as={Clock}
                                                    size={16}
                                                    className="mr-3 text-muted-foreground"
                                                />
                                                <Text className="flex-1 text-sm text-foreground">
                                                    {search}
                                                </Text>
                                            </Pressable>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {searchSuggestions.length > 0 && (
                                <View className="mb-6">
                                    <Text className="mb-3 text-sm font-medium text-foreground">
                                        Suggested Words
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
                                                    as={TrendingUp}
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
                                <MessageGroup
                                    key={`group-${group.senderId}-${group.messages[0].id}-${index}`}
                                    messages={group.messages}
                                    isOwnMessage={group.isOwnMessage}
                                    senderName={getSenderName(group.senderId)}
                                    onAddReaction={() => {}}
                                    onRemoveReaction={() => {}}
                                    getMessageReactions={getMessageReactions}
                                    onEditMessage={() => {}}
                                    onDeleteMessage={() => {}}
                                    searchQuery={debouncedSearchQuery}
                                />
                            ))}
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

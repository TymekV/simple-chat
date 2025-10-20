import { useCallback, useEffect, useState } from 'react';
import { useSocket } from '../lib/socket';
import type { StarMessageRequest } from '@/types/server/StarMessageRequest';
import type { UnstarMessageRequest } from '@/types/server/UnstarMessageRequest';
import type { StarredMessagesResponse } from '@/types/server/StarredMessagesResponse';

interface UseStarredMessagesReturn {
    starredMessageIds: Set<string>;
    isMessageStarred: (messageId: string) => boolean;
    starMessage: (roomId: string, messageId: string) => void;
    unstarMessage: (roomId: string, messageId: string) => void;
    getStarredMessages: (roomId: string) => void;
    isLoading: boolean;
}

export function useStarredMessages(roomId?: string): UseStarredMessagesReturn {
    const { socket } = useSocket();
    const [starredMessageIds, setStarredMessageIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!socket) return;

        const handleStarredMessagesList = (response: StarredMessagesResponse) => {
            setStarredMessageIds(new Set(response.starred_message_ids));
            setIsLoading(false);
        };

        socket.on('starred_messages.list', handleStarredMessagesList);

        return () => {
            socket.off('starred_messages.list', handleStarredMessagesList);
        };
    }, [socket]);

    useEffect(() => {
        if (!socket) return;

        const handleRoomEvent = (event: any) => {
            if ('MessageStar' in event.data) {
                const messageId = event.data.MessageStar.message_id;
                setStarredMessageIds((prev) => new Set([...prev, messageId]));
            } else if ('MessageUnstar' in event.data) {
                const messageId = event.data.MessageUnstar.message_id;
                setStarredMessageIds((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(messageId);
                    return newSet;
                });
            }
        };

        socket.on('room.event', handleRoomEvent);

        return () => {
            socket.off('room.event', handleRoomEvent);
        };
    }, [socket]);

    useEffect(() => {
        if (roomId && socket) {
            getStarredMessages(roomId);
        }
    }, [roomId, socket]);

    const starMessage = useCallback(
        (roomId: string, messageId: string) => {
            if (!socket) return;

            const payload: StarMessageRequest = {
                room_id: roomId,
                message_id: messageId,
            };

            socket.emit('message.star', payload);
        },
        [socket]
    );

    const unstarMessage = useCallback(
        (roomId: string, messageId: string) => {
            if (!socket) return;

            const payload: UnstarMessageRequest = {
                room_id: roomId,
                message_id: messageId,
            };

            socket.emit('message.unstar', payload);
        },
        [socket]
    );

    const getStarredMessages = useCallback(
        (roomId: string) => {
            if (!socket) return;

            setIsLoading(true);
            socket.emit('starred_messages.get', roomId);
        },
        [socket]
    );

    const isMessageStarred = useCallback(
        (messageId: string) => {
            return starredMessageIds.has(messageId);
        },
        [starredMessageIds]
    );

    return {
        starredMessageIds,
        isMessageStarred,
        starMessage,
        unstarMessage,
        getStarredMessages,
        isLoading,
    };
}

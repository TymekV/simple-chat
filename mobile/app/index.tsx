import React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { UsernameSetup } from '@/components/UsernameSetup';
import { LoadingState } from '@/components/common';
import { HomeHeader, ConnectionError, HomeEmptyState, SearchSection } from '@/components/home';
import { useHomeScreen } from '@/hooks/useHomeScreen';

export default function Screen() {
    const {
        currentUsername,
        isLoading,
        isEmpty,
        showConnectionError,
        showUsernameSetup,
        isSettingUsername,
        searchQuery,
        setSearchQuery,
        clearSearch,
        rooms,
        filteredRooms,
        isConnected,
        handleSetUsername,
        handleRetryConnection,
    } = useHomeScreen();

    const screenOptions = React.useMemo(
        () => ({
            title: 'Simple Chat',
            headerRight: () => <HomeHeader currentUsername={currentUsername} />,
        }),
        [currentUsername]
    );

    const renderContent = () => {
        if (showConnectionError) {
            return <ConnectionError onRetry={handleRetryConnection} isConnected={isConnected} />;
        }

        if (isLoading) {
            return <LoadingState message="Loading rooms..." />;
        }

        if (isEmpty) {
            return <HomeEmptyState />;
        }

        return (
            <SearchSection
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onClearSearch={clearSearch}
                allRooms={rooms}
                filteredRooms={filteredRooms}
            />
        );
    };

    return (
        <>
            <Stack.Screen options={screenOptions} />
            <View className="flex-1 bg-background">{renderContent()}</View>
            <UsernameSetup
                visible={showUsernameSetup}
                onSetUsername={handleSetUsername}
                loading={isSettingUsername}
            />
        </>
    );
}

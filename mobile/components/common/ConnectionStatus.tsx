import React from 'react';
import { StatusIndicator } from './StatusIndicator';

interface ConnectionStatusProps {
    isConnected: boolean;
    connectedText?: string;
    disconnectedText?: string;
    showText?: boolean;
    size?: 'sm' | 'default' | 'lg';
    className?: string;
    dotClassName?: string;
    labelClassName?: string;
}

export function ConnectionStatus({
    isConnected,
    connectedText = 'Connected',
    disconnectedText = 'Disconnected',
    showText = true,
    size = 'default',
    className,
    dotClassName,
    labelClassName,
}: ConnectionStatusProps) {
    const status = isConnected ? 'online' : 'offline';
    const label = showText ? (isConnected ? connectedText : disconnectedText) : undefined;

    return (
        <StatusIndicator
            status={status}
            label={label}
            size={size}
            className={className}
            dotClassName={dotClassName}
            labelClassName={labelClassName}
        />
    );
}

import React from 'react';
import { View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icon } from '@/components/ui/icon';
import { SearchIcon, XIcon } from 'lucide-react-native';
import { cn } from '@/lib/utils';

interface SearchInputProps {
    value: string;
    onChangeText: (text: string) => void;
    onClear?: () => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    autoFocus?: boolean;
}

export function SearchInput({
    value,
    onChangeText,
    onClear,
    placeholder = 'Search...',
    className,
    disabled = false,
    autoFocus = false,
}: SearchInputProps) {
    const handleClear = () => {
        onChangeText('');
        onClear?.();
    };

    return (
        <View className={cn('relative flex-row items-center', className)}>
            <Icon as={SearchIcon} className="absolute left-3 z-10 size-4 text-muted-foreground" />
            <Input
                placeholder={placeholder}
                value={value}
                onChangeText={onChangeText}
                className="pl-10 pr-10"
                editable={!disabled}
                autoFocus={autoFocus}
            />
            {value.length > 0 && (
                <Button
                    onPress={handleClear}
                    size="icon"
                    variant="ghost"
                    className="absolute right-1 size-8"
                    disabled={disabled}>
                    <Icon as={XIcon} className="size-4 text-muted-foreground" />
                </Button>
            )}
        </View>
    );
}

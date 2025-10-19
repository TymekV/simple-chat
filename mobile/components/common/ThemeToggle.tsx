import { useColorScheme } from 'nativewind';
import { MoonStarIcon, SunIcon } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
    className?: string;
    size?: 'sm' | 'default' | 'lg' | 'icon';
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

const THEME_ICONS = {
    light: SunIcon,
    dark: MoonStarIcon,
};

export function ThemeToggle({ className, size = 'icon', variant = 'ghost' }: ThemeToggleProps) {
    const { colorScheme, toggleColorScheme } = useColorScheme();

    return (
        <Button
            onPressIn={toggleColorScheme}
            size={size}
            variant={variant}
            className={cn('ios:size-9 rounded-full', className)}>
            <Icon as={THEME_ICONS[colorScheme ?? 'light']} className="size-5" />
        </Button>
    );
}

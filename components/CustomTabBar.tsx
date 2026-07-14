import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { textStart } from '@/lib/rtl';
import { Briefcase, CalendarCheck, Home, LayoutDashboard, MessageCircle, User } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_ICONS: Record<string, any> = {
    index: Home,
    search: CalendarCheck,
    messages: MessageCircle,
    'guide-dashboard': Briefcase,
    'admin-dashboard': LayoutDashboard,
    profile: User,
};

const TAB_LABEL_KEYS: Record<string, string> = {
    index: 'home',
    search: 'explore',
    messages: 'messages',
    'guide-dashboard': 'management',
    'admin-dashboard': 'admin',
    profile: 'profileTab',
};

const isRouteVisible = (name: string, role: string | undefined) => {
    if (name === 'index' && role === 'admin') return false;
    if (name === 'search' && (role === 'guide' || role === 'admin')) return false;
    if (name === 'messages' && role === 'admin') return false;
    if (name === 'guide-dashboard' && role !== 'guide') return false;
    if (name === 'admin-dashboard' && role !== 'admin') return false;
    return true;
};

export function CustomTabBar({ state, navigation, unreadCount }: {
    state: any;
    navigation: any;
    unreadCount: number;
}) {
    const { profile } = useAuth();
    const { isRTL } = useLanguage();
    const { t } = useTranslation('tabs');
    const insets = useSafeAreaInsets();
    const isDark = useColorScheme() === 'dark';
    const role = profile?.role;

    const visibleRoutes = state.routes.filter((r: any) => isRouteVisible(r.name, role));
    const renderedRoutes = isRTL ? [...visibleRoutes].reverse() : visibleRoutes;
    const activeVisibleIndex = Math.max(
        0,
        renderedRoutes.findIndex((r: any) => r.key === state.routes[state.index].key)
    );

    // Per-tab scale animation
    const scalesRef = useRef<Animated.Value[]>([]);
    if (scalesRef.current.length !== renderedRoutes.length) {
        scalesRef.current = renderedRoutes.map((_: any, i: number) =>
            new Animated.Value(i === activeVisibleIndex ? 1.08 : 0.92)
        );
    }

    // Sliding pill
    const [tabWidth, setTabWidth] = useState(0);
    const pillX = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (tabWidth === 0) return;
        Animated.spring(pillX, {
            toValue: activeVisibleIndex * tabWidth,
            useNativeDriver: true,
            tension: 220,
            friction: 22,
        }).start();
    }, [activeVisibleIndex, tabWidth]);

    useEffect(() => {
        scalesRef.current.forEach((anim, i) => {
            Animated.spring(anim, {
                toValue: i === activeVisibleIndex ? 1.08 : 0.92,
                useNativeDriver: true,
                tension: 260,
                friction: 16,
            }).start();
        });
    }, [activeVisibleIndex]);

    return (
        <View
            style={{
                paddingBottom: Math.max(insets.bottom, 8),
                backgroundColor: isDark ? '#18181b' : '#f9fafb',
                paddingHorizontal: 16,
            }}
        >
            <View
                onLayout={(e) => {
                    const w = e.nativeEvent.layout.width / renderedRoutes.length;
                    setTabWidth(w);
                }}
                style={{
                    borderRadius: 28,
                    backgroundColor: isDark ? '#1c1c1e' : '#ffffff',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: isDark ? 0.45 : 0.13,
                    shadowRadius: 28,
                    elevation: 14,
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                    overflow: 'hidden',
                }}
            >
                {/* Sliding pill indicator */}
                {tabWidth > 0 && (
                    <Animated.View
                        style={{
                            position: 'absolute',
                            top: 8,
                            left: 0,
                            width: tabWidth,
                            height: 48,
                            transform: [{ translateX: pillX }],
                            paddingHorizontal: 16,
                        }}
                    >
                        <View
                            style={{
                                flex: 1,
                                borderRadius: 18,
                                backgroundColor: isDark ? 'rgba(179,145,100,0.18)' : 'rgba(179,145,100,0.13)',
                            }}
                        />
                    </Animated.View>
                )}

                <View style={{ flexDirection: 'row', height: 64 }}>
                    {renderedRoutes.map((route: any, index: number) => {
                        const Icon = TAB_ICONS[route.name];
                        const labelKey = TAB_LABEL_KEYS[route.name];
                        if (!Icon || !labelKey) return null;

                        const isActive = index === activeVisibleIndex;
                        const scale = scalesRef.current[index] ?? new Animated.Value(1);
                        const iconColor = isActive ? '#b39164' : isDark ? '#52525b' : '#a1a1aa';

                        const onPress = () => {
                            const event = navigation.emit({
                                type: 'tabPress',
                                target: route.key,
                                canPreventDefault: true,
                            });
                            if (!isActive && !event.defaultPrevented) {
                                navigation.navigate(route.name);
                            }
                        };

                        return (
                            <TouchableOpacity
                                key={route.key}
                                onPress={onPress}
                                activeOpacity={0.75}
                                style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                            >
                                {/* Seul l'icône est animé, pas le label */}
                                <Animated.View
                                    style={{
                                        transform: [{ scale }],
                                        position: 'relative',
                                    }}
                                >
                                    <Icon
                                        size={21}
                                        color={iconColor}
                                        strokeWidth={isActive ? 2.3 : 1.8}
                                    />
                                    {route.name === 'messages' && unreadCount > 0 && (
                                        <View
                                            style={{
                                                position: 'absolute',
                                                top: -5,
                                                right: isRTL ? undefined : -7,
                                                left: isRTL ? -7 : undefined,
                                                minWidth: 16,
                                                height: 16,
                                                paddingHorizontal: 3,
                                                borderRadius: 8,
                                                backgroundColor: '#ef4444',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderWidth: 1.5,
                                                borderColor: isDark ? '#1c1c1e' : '#ffffff',
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    color: 'white',
                                                    fontSize: 9,
                                                    fontWeight: 'bold',
                                                    lineHeight: 13,
                                                }}
                                            >
                                                {unreadCount > 99 ? '99+' : unreadCount}
                                            </Text>
                                        </View>
                                    )}
                                </Animated.View>
                                <Text
                                    style={{
                                        fontSize: 10,
                                        marginTop: 3,
                                        fontWeight: isActive ? '700' : '500',
                                        color: iconColor,
                                        letterSpacing: isActive ? 0.2 : 0,
                                        ...textStart(isRTL),
                                    }}
                                >
                                    {t(labelKey)}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        </View>
    );
}

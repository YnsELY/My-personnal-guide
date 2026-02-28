import React from 'react';
import {
    Animated,
    Easing,
    Modal,
    PanResponder,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronsRight } from 'lucide-react-native';

type SlideToConfirmModalProps = {
    visible: boolean;
    title: string;
    message: string;
    sliderLabel: string;
    isProcessing?: boolean;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
};

const KNOB_SIZE = 52;
const TRACK_HORIZONTAL_PADDING = 0;
const GOLD_OVERLAP = (KNOB_SIZE / 2) + 3;

export function SlideToConfirmModal({
    visible,
    title,
    message,
    sliderLabel,
    isProcessing = false,
    onClose,
    onConfirm,
}: SlideToConfirmModalProps) {
    const { width } = useWindowDimensions();
    const trackWidth = Math.max(240, Math.min(width - 64, 320));
    const trackHeight = KNOB_SIZE + (TRACK_HORIZONTAL_PADDING * 2);
    const innerTrackWidth = trackWidth - (TRACK_HORIZONTAL_PADDING * 2);
    const maxSwipe = trackWidth - KNOB_SIZE - (TRACK_HORIZONTAL_PADDING * 2);
    const threshold = maxSwipe * 0.8;

    const translateX = React.useRef(new Animated.Value(0)).current;
    const shimmerProgress = React.useRef(new Animated.Value(0)).current;
    const pulseProgress = React.useRef(new Animated.Value(0)).current;
    const [isDragging, setIsDragging] = React.useState(false);
    const confirmTriggeredRef = React.useRef(false);

    React.useEffect(() => {
        if (visible) {
            translateX.setValue(0);
            setIsDragging(false);
            confirmTriggeredRef.current = false;
        }
    }, [visible, translateX]);

    React.useEffect(() => {
        if (!visible) return;

        shimmerProgress.setValue(0);
        pulseProgress.setValue(0);

        const shimmerLoop = Animated.loop(
            Animated.timing(shimmerProgress, {
                toValue: 1,
                duration: 1750,
                easing: Easing.linear,
                useNativeDriver: false,
            })
        );

        const pulseLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseProgress, {
                    toValue: 1,
                    duration: 950,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: false,
                }),
                Animated.timing(pulseProgress, {
                    toValue: 0,
                    duration: 1050,
                    easing: Easing.in(Easing.quad),
                    useNativeDriver: false,
                }),
            ])
        );

        shimmerLoop.start();
        pulseLoop.start();
        return () => {
            shimmerLoop.stop();
            pulseLoop.stop();
        };
    }, [visible, pulseProgress, shimmerProgress]);

    const resetSlider = React.useCallback(() => {
        setIsDragging(false);
        confirmTriggeredRef.current = false;
        Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: false,
            bounciness: 6,
        }).start();
    }, [translateX]);

    const goldLeft = TRACK_HORIZONTAL_PADDING;

    const goldWidth = React.useMemo(
        () => Animated.add(translateX, GOLD_OVERLAP),
        [translateX]
    );

    const goldOpacity = React.useMemo(
        () =>
            translateX.interpolate({
                inputRange: [0, 0.5],
                outputRange: [0, 1],
                extrapolate: 'clamp',
            }),
        [translateX]
    );

    const shimmerTranslatePrimary = React.useMemo(
        () =>
            shimmerProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [-130, innerTrackWidth + 130],
                extrapolate: 'clamp',
            }),
        [innerTrackWidth, shimmerProgress]
    );

    const shimmerTranslateSecondary = React.useMemo(
        () =>
            shimmerProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [innerTrackWidth + 170, -170],
                extrapolate: 'clamp',
            }),
        [innerTrackWidth, shimmerProgress]
    );

    const pulseOpacity = React.useMemo(
        () =>
            pulseProgress.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.12, 0.34, 0.12],
                extrapolate: 'clamp',
            }),
        [pulseProgress]
    );

    const pulseScale = React.useMemo(
        () =>
            pulseProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [0.9, 1.25],
                extrapolate: 'clamp',
            }),
        [pulseProgress]
    );

    const panResponder = React.useMemo(() => PanResponder.create({
        onStartShouldSetPanResponder: () => !isProcessing,
        onStartShouldSetPanResponderCapture: () => !isProcessing,
        onMoveShouldSetPanResponder: (_, gesture) => {
            if (isProcessing) return false;
            return Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2;
        },
        onPanResponderGrant: () => {
            if (isProcessing) return;
            setIsDragging(true);
        },
        onPanResponderMove: (_, gesture) => {
            if (isProcessing) return;
            const clamped = Math.max(0, Math.min(gesture.dx, maxSwipe));
            translateX.setValue(clamped);
        },
        onPanResponderRelease: (_, gesture) => {
            setIsDragging(false);
            if (gesture.dx >= threshold) {
                if (confirmTriggeredRef.current) return;
                confirmTriggeredRef.current = true;
                Animated.timing(translateX, {
                    toValue: maxSwipe,
                    duration: 160,
                    useNativeDriver: false,
                }).start(() => {
                    onConfirm();
                });
                return;
            }
            resetSlider();
        },
        onPanResponderTerminate: () => {
            resetSlider();
        },
    }), [isProcessing, maxSwipe, onConfirm, resetSlider, threshold, translateX]);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={() => {
                if (!isProcessing) onClose();
            }}
        >
            <View style={styles.overlay}>
                <Pressable style={StyleSheet.absoluteFill} onPress={() => !isProcessing && onClose()} />

                <View style={styles.modalCard}>
                    <LinearGradient
                        colors={['#262a33', '#1a1d24']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.modalGradient}
                    >
                        <View style={styles.headerRow}>
                            <Text style={styles.titleText}>{title}</Text>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>Confirmation</Text>
                            </View>
                        </View>

                        <Text style={styles.messageText}>{message}</Text>

                        <View
                            {...panResponder.panHandlers}
                            style={[
                                styles.track,
                                {
                                    width: trackWidth,
                                    height: trackHeight,
                                    padding: TRACK_HORIZONTAL_PADDING,
                                },
                            ]}
                        >
                            <Animated.View
                                style={[
                                    styles.goldZone,
                                    {
                                        left: goldLeft,
                                        width: goldWidth,
                                        height: KNOB_SIZE,
                                        opacity: goldOpacity,
                                    },
                                ]}
                            >
                                <LinearGradient
                                    colors={['#f8e8c8', '#efd7ad', '#e7c88f']}
                                    start={{ x: 0, y: 0.5 }}
                                    end={{ x: 1, y: 0.5 }}
                                    style={styles.absoluteFill}
                                />
                                <Animated.View
                                    pointerEvents="none"
                                    style={[
                                        styles.wave,
                                        { transform: [{ translateX: shimmerTranslatePrimary }] },
                                    ]}
                                >
                                    <LinearGradient
                                        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.75)', 'rgba(255,255,255,0)']}
                                        start={{ x: 0, y: 0.5 }}
                                        end={{ x: 1, y: 0.5 }}
                                        style={styles.absoluteFill}
                                    />
                                </Animated.View>
                                <Animated.View
                                    pointerEvents="none"
                                    style={[
                                        styles.waveSecondary,
                                        { transform: [{ translateX: shimmerTranslateSecondary }] },
                                    ]}
                                >
                                    <LinearGradient
                                        colors={['rgba(255,255,255,0)', 'rgba(255,248,222,0.55)', 'rgba(255,255,255,0)']}
                                        start={{ x: 0, y: 0.5 }}
                                        end={{ x: 1, y: 0.5 }}
                                        style={styles.absoluteFill}
                                    />
                                </Animated.View>
                                <Animated.View
                                    pointerEvents="none"
                                    style={[
                                        styles.pulseOrb,
                                        {
                                            opacity: pulseOpacity,
                                            transform: [{ scale: pulseScale }],
                                        },
                                    ]}
                                />
                            </Animated.View>

                            <View pointerEvents="none" style={styles.labelContainer}>
                                <Text style={styles.labelText}>
                                    {isProcessing ? 'Traitement en cours...' : sliderLabel}
                                </Text>
                            </View>

                            <Animated.View
                                style={[
                                    styles.knob,
                                    {
                                        width: KNOB_SIZE,
                                        height: KNOB_SIZE,
                                        borderRadius: KNOB_SIZE / 2,
                                        transform: [{ translateX }, { scale: isDragging ? 1.04 : 1 }],
                                    },
                                ]}
                            >
                                <LinearGradient
                                    colors={['#c4a072', '#b39164']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.knobGradient}
                                >
                                    <ChevronsRight size={20} color="#ffffff" style={{ marginLeft: 2 }} />
                                </LinearGradient>
                            </Animated.View>
                        </View>

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={onClose}
                            disabled={isProcessing}
                        >
                            <Text style={styles.cancelText}>Annuler</Text>
                        </TouchableOpacity>
                    </LinearGradient>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    absoluteFill: {
        ...StyleSheet.absoluteFillObject,
    },
    overlay: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    modalCard: {
        marginHorizontal: 24,
        borderRadius: 26,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(82,86,97,0.95)',
    },
    modalGradient: {
        paddingHorizontal: 22,
        paddingTop: 22,
        paddingBottom: 18,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    titleText: {
        color: '#f4f5f7',
        fontSize: 35 / 2,
        fontWeight: '800',
        flexShrink: 1,
        paddingRight: 8,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        backgroundColor: 'rgba(39,43,53,0.95)',
        borderWidth: 1,
        borderColor: 'rgba(98,104,118,1)',
    },
    badgeText: {
        color: '#d7dbe2',
        fontSize: 11,
        fontWeight: '700',
    },
    messageText: {
        color: '#c7cdd7',
        marginTop: 10,
        fontSize: 15,
        lineHeight: 23,
    },
    track: {
        marginTop: 22,
        alignSelf: 'center',
        borderRadius: 999,
        borderWidth: 0,
        overflow: 'hidden',
        backgroundColor: '#252c38',
    },
    goldZone: {
        position: 'absolute',
        top: TRACK_HORIZONTAL_PADDING,
        borderTopLeftRadius: 999,
        borderBottomLeftRadius: 999,
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
        overflow: 'hidden',
    },
    wave: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 130,
        transform: [{ rotate: '12deg' }],
    },
    waveSecondary: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 190,
        transform: [{ rotate: '-10deg' }],
    },
    pulseOrb: {
        position: 'absolute',
        right: 18,
        top: -4,
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(255,255,255,0.85)',
    },
    labelContainer: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: KNOB_SIZE + 24,
    },
    labelText: {
        color: '#f1f4f8',
        fontWeight: '700',
        fontSize: 12,
        letterSpacing: 0.9,
    },
    knob: {
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: '#d5ad73',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 8,
    },
    knobGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    knobIcon: {
        color: '#f3d8a4',
        fontSize: 26,
        fontWeight: '900',
        marginLeft: 2,
    },
    cancelButton: {
        marginTop: 16,
        paddingVertical: 12,
        borderRadius: 14,
        alignItems: 'center',
        backgroundColor: 'rgba(47,54,65,0.9)',
        borderWidth: 1,
        borderColor: 'rgba(100,108,125,1)',
    },
    cancelText: {
        color: '#e8edf5',
        fontWeight: '700',
        fontSize: 16,
    },
});

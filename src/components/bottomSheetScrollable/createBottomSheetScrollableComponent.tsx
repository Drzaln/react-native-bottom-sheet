import React, {
  forwardRef,
  useContext,
  useImperativeHandle,
  useMemo,
} from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { useAnimatedProps, useAnimatedStyle } from 'react-native-reanimated';
import {
  SCROLLABLE_DECELERATION_RATE_MAPPER,
  SCROLLABLE_STATE,
  type SCROLLABLE_TYPE,
} from '../../constants';
import { BottomSheetDraggableContext } from '../../contexts/gesture';
import {
  useBottomSheetInternal,
  useScrollHandler,
  useScrollableSetter,
  useStableCallback,
} from '../../hooks';
import { ScrollableContainer } from './ScrollableContainer';
import { useBottomSheetContentSizeSetter } from './useBottomSheetContentSizeSetter';

export function createBottomSheetScrollableComponent<T, P>(
  type: SCROLLABLE_TYPE,
  // biome-ignore lint: to be addressed!
  ScrollableComponent: any
) {
  return forwardRef<T, P>((props, ref) => {
    //#region props
    const {
      // hooks
      focusHook,
      scrollEventsHandlersHook,
      // props
      enableFooterMarginAdjustment = false,
      overScrollMode = 'never',
      keyboardDismissMode = 'interactive',
      showsVerticalScrollIndicator = true,
      style,
      refreshing,
      onRefresh,
      progressViewOffset,
      refreshControl,
      // events
      onScroll,
      onScrollBeginDrag,
      onScrollEndDrag,
      onContentSizeChange,
      ...rest
      // biome-ignore lint: to be addressed!
    }: any = props;
    //#endregion

    //#region hooks
    const draggableGesture = useContext(BottomSheetDraggableContext);
    const { scrollableRef, scrollableContentOffsetY, scrollHandler } =
      useScrollHandler(
        scrollEventsHandlersHook,
        onScroll,
        onScrollBeginDrag,
        onScrollEndDrag
      );
    const {
      animatedFooterHeight,
      animatedScrollableState,
      enableContentPanningGesture,
    } = useBottomSheetInternal();
    const { setContentSize } = useBottomSheetContentSizeSetter(
      enableFooterMarginAdjustment
    );
    //#endregion

    if (!draggableGesture && enableContentPanningGesture) {
      throw "'Scrollable' cannot be used out of the BottomSheet!";
    }

    //#region variables
    const scrollableAnimatedProps = useAnimatedProps(
      () => ({
        decelerationRate:
          SCROLLABLE_DECELERATION_RATE_MAPPER[animatedScrollableState.value],
        showsVerticalScrollIndicator: showsVerticalScrollIndicator
          ? animatedScrollableState.value === SCROLLABLE_STATE.UNLOCKED
          : showsVerticalScrollIndicator,
      }),
      [animatedScrollableState, showsVerticalScrollIndicator]
    );

    const scrollableGesture = useMemo(
      () =>
        draggableGesture
          ? Gesture.Native()
              // @ts-ignore
              .simultaneousWithExternalGesture(draggableGesture)
              .shouldCancelWhenOutside(false)
          : undefined,
      [draggableGesture]
    );
    //#endregion

    //#region callbacks
    const handleContentSizeChange = useStableCallback(
      (contentWidth: number, contentHeight: number) => {
        setContentSize(contentHeight);

        if (onContentSizeChange) {
          onContentSizeChange(contentWidth, contentHeight);
        }
      }
    );
    //#endregion

    //#region styles
    const containerAnimatedStyle = useAnimatedStyle(
      () => ({
        marginBottom: enableFooterMarginAdjustment
          ? animatedFooterHeight.value
          : 0,
      }),
      [animatedFooterHeight.value, enableFooterMarginAdjustment]
    );
    const containerStyle = useMemo(() => {
      return enableFooterMarginAdjustment
        ? [
            ...(style ? ('length' in style ? style : [style]) : []),
            containerAnimatedStyle,
          ]
        : style;
    }, [enableFooterMarginAdjustment, style, containerAnimatedStyle]);
    //#endregion

    //#region effects
    // @ts-ignore
    useImperativeHandle(ref, () => scrollableRef.current);
    useScrollableSetter(
      scrollableRef,
      type,
      scrollableContentOffsetY,
      onRefresh !== undefined,
      focusHook
    );
    //#endregion

    //#region render
    return (
      <ScrollableContainer
        ref={scrollableRef}
        nativeGesture={scrollableGesture}
        animatedProps={scrollableAnimatedProps}
        overScrollMode={overScrollMode}
        keyboardDismissMode={keyboardDismissMode}
        refreshing={refreshing}
        scrollEventThrottle={16}
        progressViewOffset={progressViewOffset}
        style={containerStyle}
        onRefresh={onRefresh}
        onScroll={scrollHandler}
        onContentSizeChange={handleContentSizeChange}
        setContentSize={setContentSize}
        ScrollableComponent={ScrollableComponent}
        refreshControl={refreshControl}
        {...rest}
      />
    );
    //#endregion
  });
}

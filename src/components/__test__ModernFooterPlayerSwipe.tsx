import React from 'react';
import { View, Text } from 'react-native';
import { ModernFooterPlayer } from './ModernFooterPlayer';
import { Animated } from 'react-native';

export default function TestModernFooterPlayerSwipe() {
  const [progress, setProgress] = React.useState(0);
  const [completed, setCompleted] = React.useState(false);
  const [isPanning, setIsPanning] = React.useState(false);
  const playerTransition = React.useRef(new Animated.Value(0)).current;

  return (
    <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#eee' }}>
      <ModernFooterPlayer
        onPress={() => {}}
        onSwipeUpProgress={p => {
          setIsPanning(true);
          setProgress(p);
          playerTransition.setValue(p);
        }}
        onSwipeUpEnd={c => {
          setCompleted(c);
          setIsPanning(false);
          if (c) {
            Animated.timing(playerTransition, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }).start();
          } else {
            Animated.timing(playerTransition, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }).start();
          }
        }}
        isPanning={isPanning}
        playerTransition={playerTransition}
      />
      <View style={{ position: 'absolute', top: 40, left: 0, right: 0, alignItems: 'center' }}>
        <Text>Swipe Progress: {progress.toFixed(2)}</Text>
        <Text>Completed: {completed ? 'Yes' : 'No'}</Text>
      </View>
    </View>
  );
}

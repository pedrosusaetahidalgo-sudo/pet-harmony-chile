import { Composition } from 'remotion';
import { VerticalReel } from './VerticalReel.jsx';
import defaultProps from './defaultProps.js';

const FPS = 30;

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="VerticalReel"
        component={VerticalReel}
        durationInFrames={FPS * defaultProps.totalSeconds}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={defaultProps}
        calculateMetadata={({ props }) => ({
          durationInFrames: Math.round(FPS * (props.totalSeconds ?? defaultProps.totalSeconds)),
        })}
      />
    </>
  );
};

import { Composition } from 'remotion';
import { VerticalReel } from './VerticalReel.jsx';
import { LaunchReel, LAUNCH_REEL_CONFIG } from './LaunchReel.jsx';
import {
  LaunchSlide,
  LAUNCH_SLIDE_CONFIG,
  SLIDE_IDS,
} from './LaunchSlide.jsx';
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
      <Composition
        id="LaunchReel"
        component={LaunchReel}
        durationInFrames={LAUNCH_REEL_CONFIG.durationInFrames}
        fps={LAUNCH_REEL_CONFIG.fps}
        width={LAUNCH_REEL_CONFIG.width}
        height={LAUNCH_REEL_CONFIG.height}
      />
      {SLIDE_IDS.map((slideId) => (
        <Composition
          key={slideId}
          id={`LaunchSlide-${slideId}`}
          component={LaunchSlide}
          durationInFrames={LAUNCH_SLIDE_CONFIG.durationInFrames}
          fps={LAUNCH_SLIDE_CONFIG.fps}
          width={LAUNCH_SLIDE_CONFIG.width}
          height={LAUNCH_SLIDE_CONFIG.height}
          defaultProps={{ slideId }}
        />
      ))}
    </>
  );
};

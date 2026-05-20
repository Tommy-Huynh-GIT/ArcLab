import type { MetricName } from "./types";

type FeedbackInput = {
  name: MetricName;
  score: number;
  value: number;
};

type Feedback = {
  feedback: string;
  drill: string;
};

const strongFeedback: Record<MetricName, Feedback> = {
  stanceWidth: {
    feedback:
      "Your stance is close to the target width, giving the shot a steady base.",
    drill:
      "Keep using floor marks occasionally so the base stays repeatable without overthinking it.",
  },
  kneeAlignment: {
    feedback: "Your knees track near each foot line through the dip.",
    drill:
      "Use a brief pause at the dip every few reps to keep that pattern honest.",
  },
  elbowAlignment: {
    feedback:
      "Your shooting elbow stays near the shoulder line without drifting far across the body.",
    drill: "Mix in close one-hand form shots to reinforce that clean path.",
  },
  armExtension: {
    feedback:
      "Your release shows a clear upward reach with the shooting wrist above the elbow.",
    drill: "Hold the release until the ball reaches the rim, then reset calmly.",
  },
  followThrough: {
    feedback:
      "Your shooting wrist remains high after release, which points to a repeatable finish.",
    drill: "Keep the two-second finish hold as a maintenance habit.",
  },
};

const correctiveFeedback: Record<MetricName, (value: number) => Feedback> = {
  stanceWidth: (value) => ({
    feedback:
      value < 1
        ? "Your stance is narrow compared with shoulder width, so the shot may start from an unstable base."
        : "Your stance is wider than the target range, which can make the dip harder to repeat.",
    drill:
      "Mark shoulder width on the floor and place both feet just outside those marks for 10 slow reps.",
  }),
  kneeAlignment: () => ({
    feedback:
      "One or both knees drift away from the matching feet or ankles during the dip.",
    drill:
      "Use a light band or a pause-at-dip drill and track each knee over its own ankle.",
  }),
  elbowAlignment: () => ({
    feedback:
      "The shooting elbow is drifting away from the shoulder line, so the ball path may be inconsistent.",
    drill:
      "Take close one-hand form shots and keep the elbow under the ball before adding range.",
  }),
  armExtension: () => ({
    feedback:
      "The release is not reaching a strong upward position before the ball leaves.",
    drill:
      "Shoot from close range and freeze with the wrist above the elbow after every release.",
  }),
  followThrough: () => ({
    feedback:
      "The wrist drops too quickly after release, which can make touch harder to repeat.",
    drill:
      "Make 20 free throws while holding the finish high for two seconds.",
  }),
};

const mixedFeedback: Record<MetricName, Feedback> = {
  stanceWidth: {
    feedback:
      "Your stance is usable, but a small width adjustment could make the base more consistent.",
    drill:
      "Check foot placement before each set and reset if the base feels crowded or stretched.",
  },
  kneeAlignment: {
    feedback:
      "Your knees mostly stay organized, with a little room to track each one closer to its foot.",
    drill:
      "Pause at the dip and watch that each knee stays over the matching ankle.",
  },
  elbowAlignment: {
    feedback:
      "Your elbow path is close, but it still has some side-to-side drift to clean up.",
    drill: "Use five close form shots before each free throw set.",
  },
  armExtension: {
    feedback:
      "Your arm extension is workable, but the release could finish a bit taller.",
    drill: "Hold your finish and check that the wrist ends above the elbow.",
  },
  followThrough: {
    feedback:
      "Your follow-through is present, but the finish could stay high a little longer.",
    drill: "Count one full beat before dropping the shooting hand.",
  },
};

export function feedbackForMetric(input: FeedbackInput): Feedback {
  if (input.score >= 80) {
    return strongFeedback[input.name];
  }

  if (input.score < 60) {
    return correctiveFeedback[input.name](input.value);
  }

  return mixedFeedback[input.name];
}

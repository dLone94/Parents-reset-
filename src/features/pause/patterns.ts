/**
 * Breathing patterns for Pause.
 *
 * All three are slow-exhale patterns, which is the part that actually settles
 * a body. Each run lands close to one minute: long enough to work, short
 * enough that a parent holding a child will finish it.
 */
export const breathPatternIds = ["settle", "steady", "sleep"] as const;
export type BreathPatternId = (typeof breathPatternIds)[number];

export type BreathPhaseKind = "in" | "hold" | "out" | "rest";

export interface BreathPhase {
  kind: BreathPhaseKind;
  seconds: number;
}

export interface BreathPattern {
  id: BreathPatternId;
  phases: BreathPhase[];
  cycles: number;
}

export const breathPatterns: Record<BreathPatternId, BreathPattern> = {
  /** In for four, out for six. The everyday one. */
  settle: {
    id: "settle",
    cycles: 6,
    phases: [
      { kind: "in", seconds: 4 },
      { kind: "out", seconds: 6 },
    ],
  },
  /** Box breathing: four all round. Steadies a racing head before a hard moment. */
  steady: {
    id: "steady",
    cycles: 4,
    phases: [
      { kind: "in", seconds: 4 },
      { kind: "hold", seconds: 4 },
      { kind: "out", seconds: 4 },
      { kind: "rest", seconds: 4 },
    ],
  },
  /** 4-7-8, for lying in the dark after a long day. */
  sleep: {
    id: "sleep",
    cycles: 3,
    phases: [
      { kind: "in", seconds: 4 },
      { kind: "hold", seconds: 7 },
      { kind: "out", seconds: 8 },
    ],
  },
};

export function cycleDuration(pattern: BreathPattern): number {
  return pattern.phases.reduce((total, phase) => total + phase.seconds, 0);
}

export function patternDuration(pattern: BreathPattern): number {
  return cycleDuration(pattern) * pattern.cycles;
}

export interface BreathPosition {
  phase: BreathPhase;
  /** Index of the phase inside one cycle. */
  phaseIndex: number;
  /** 1-based cycle the breather is in. */
  cycle: number;
  /** Whole seconds left in this phase, counted down for the on-screen number. */
  secondsLeft: number;
  /** True once every cycle is done. */
  finished: boolean;
}

/**
 * Where a run is at, given seconds elapsed. Pure so the screen can be driven
 * by wall-clock time rather than a chain of timeouts that drift when a phone
 * throttles background work.
 */
export function positionAt(pattern: BreathPattern, elapsedSeconds: number): BreathPosition {
  const total = patternDuration(pattern);
  const clamped = Math.max(0, Math.min(elapsedSeconds, total));
  const cycleLength = cycleDuration(pattern);
  const finished = clamped >= total;

  if (finished) {
    const last = pattern.phases[pattern.phases.length - 1];
    return {
      phase: last,
      phaseIndex: pattern.phases.length - 1,
      cycle: pattern.cycles,
      secondsLeft: 0,
      finished: true,
    };
  }

  const cycle = Math.floor(clamped / cycleLength) + 1;
  let withinCycle = clamped % cycleLength;
  for (let index = 0; index < pattern.phases.length; index += 1) {
    const phase = pattern.phases[index];
    if (withinCycle < phase.seconds) {
      return {
        phase,
        phaseIndex: index,
        cycle,
        secondsLeft: Math.max(1, Math.ceil(phase.seconds - withinCycle)),
        finished: false,
      };
    }
    withinCycle -= phase.seconds;
  }

  // Unreachable while the phases add up to the cycle length.
  const last = pattern.phases[pattern.phases.length - 1];
  return { phase: last, phaseIndex: pattern.phases.length - 1, cycle, secondsLeft: 0, finished: false };
}

/** Ring scale per phase: the visual a breather follows instead of the text. */
export function ringScale(kind: BreathPhaseKind): number {
  switch (kind) {
    case "in":
      return 1;
    case "hold":
      return 1;
    case "out":
      return 0.62;
    case "rest":
      return 0.62;
  }
}

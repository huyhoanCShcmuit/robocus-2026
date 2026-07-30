import { calculateRankingsA, calculateRankingsB, calculateRankingsC } from '../utils/rankingEngine';
import type { CompetitionData } from '../types';

// Web Worker message listener for Async Multi-threaded Ranking Calculation
self.onmessage = (event: MessageEvent<{ data: CompetitionData }>) => {
  const { data } = event.data;

  try {
    const rankedA = calculateRankingsA(data.teamsA, data.matchesA);
    const rankedB_EV3 = calculateRankingsB(data.teamsB_EV3);
    const rankedB_SPIKE = calculateRankingsB(data.teamsB_SPIKE);
    const rankedC = calculateRankingsC(data.teamsC, data.matchesC);

    self.postMessage({
      type: 'RANKING_COMPLETE',
      rankedA,
      rankedB_EV3,
      rankedB_SPIKE,
      rankedC,
      timestamp: Date.now(),
    });
  } catch (error) {
    self.postMessage({
      type: 'RANKING_ERROR',
      error: String(error),
    });
  }
};

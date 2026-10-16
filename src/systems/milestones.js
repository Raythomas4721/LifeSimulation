import { MILESTONES } from '../data/milestones.js';
import { addLog } from '../core/state.js';

export function checkMilestones(state) {
  for (const m of MILESTONES) {
    if (state.flags.milestones[m.id] != null || !m.when(state)) continue;
    state.flags.milestones[m.id] = state.day;
    addLog(state, { kind: 'milestone', id: m.id });
  }
}

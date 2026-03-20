import type { Phase, poll } from './interface';

export interface PollPhaseConfig {
  phase: Phase;
  label: string;
  endDateField: keyof poll | null;
  id: number;
}

export const TEXT_POLL_PHASE_CONFIG: PollPhaseConfig[] = [
  { phase: 'pre_start', label: 'Start Date', endDateField: 'start_date', id: 0 },
  { phase: 'proposal', label: 'Proposals creation', endDateField: 'proposal_end_date', id: 1 },
  { phase: 'prediction_bet', label: 'Predictions', endDateField: 'prediction_bet_end_date', id: 2 },
  { phase: 'delegate_vote', label: 'Delegate voting', endDateField: 'delegate_vote_end_date', id: 3 },
  { phase: 'vote', label: 'Voting for non-delegates', endDateField: 'end_date', id: 4 },
  { phase: 'result', label: 'Results and evaluation', endDateField: null, id: 5 },
];

export const DATE_POLL_PHASE_CONFIG: PollPhaseConfig[] = [
  { phase: 'pre_start', label: 'Start Date', endDateField: 'start_date', id: 0 },
  { phase: 'proposal', label: 'Proposals creation', endDateField: 'end_date', id: 1 },
  { phase: 'result', label: 'Results and evaluation', endDateField: null, id: 2 },
];

import { type Speaker, Team, SpeakerRole } from './types';

export const SPEAKERS_2V2: Speaker[] = [
  { id: 1, name: 'You', team: Team.A, role: SpeakerRole.PRIME_MINISTER, isUser: true, speechTime: 5 * 60 },
  { id: 2, name: 'Alex (AI)', team: Team.B, role: SpeakerRole.LEADER_OF_OPPOSITION, isUser: false, speechTime: 8 * 60, voiceIndex: 1 },
  { id: 3, name: 'Jordan (AI)', team: Team.A, role: SpeakerRole.DEPUTY_PRIME_MINISTER, isUser: false, speechTime: 8 * 60, voiceIndex: 2 },
  { id: 4, name: 'Casey (AI)', team: Team.B, role: SpeakerRole.DEPUTY_LEADER_OF_OPPOSITION, isUser: false, speechTime: 8 * 60, voiceIndex: 3 },
  { id: 5, name: 'You', team: Team.A, role: SpeakerRole.PM_REBUTTAL, isUser: true, speechTime: 3 * 60 },
];

export const SPEAKERS_1V1: Speaker[] = [
  { id: 1, name: 'You', team: Team.A, role: SpeakerRole.PROPONENT_OPENING, isUser: true, speechTime: 4 * 60 },
  { id: 2, name: 'Echo (AI)', team: Team.B, role: SpeakerRole.OPPONENT_OPENING, isUser: false, speechTime: 4 * 60, voiceIndex: 5 },
  { id: 3, name: 'You', team: Team.A, role: SpeakerRole.PROPONENT_CLOSING, isUser: true, speechTime: 3 * 60 },
  { id: 4, name: 'Echo (AI)', team: Team.B, role: SpeakerRole.OPPONENT_CLOSING, isUser: false, speechTime: 3 * 60, voiceIndex: 5 },
];


export const PREP_TIME_SECONDS = 10 * 60; // 10 minutes
export const BETWEEN_SPEECHES_GAP_SECONDS = 15;
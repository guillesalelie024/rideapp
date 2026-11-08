import {
  busOutline,
  compassOutline,
  heartOutline,
  leafOutline,
  personCircleOutline,
  starOutline,
} from 'ionicons/icons';

export const PROFILE_AVATAR_OPTIONS = [
  { id: 'person', label: 'Person', icon: personCircleOutline },
  { id: 'compass', label: 'Compass', icon: compassOutline },
  { id: 'leaf', label: 'Leaf', icon: leafOutline },
  { id: 'heart', label: 'Heart', icon: heartOutline },
  { id: 'star', label: 'Star', icon: starOutline },
  { id: 'bus', label: 'Bus', icon: busOutline },
] as const;

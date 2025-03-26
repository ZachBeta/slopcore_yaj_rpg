// Define more specific types
export type KeyCode = string;

export enum InputAction {
  THROTTLE_FORWARD = 'THROTTLE_FORWARD',
  THROTTLE_BACKWARD = 'THROTTLE_BACKWARD',
  ROTATE_LEFT = 'ROTATE_LEFT',
  ROTATE_RIGHT = 'ROTATE_RIGHT',
  LOOK_UP = 'LOOK_UP',
  LOOK_DOWN = 'LOOK_DOWN',
  ROLL_LEFT = 'ROLL_LEFT',
  ROLL_RIGHT = 'ROLL_RIGHT',
  JUMP = 'JUMP',
  VERIFY_STATE = 'VERIFY_STATE',
  ASCEND = 'ASCEND',
  DESCEND = 'DESCEND',
  DEBUG_TOGGLE = 'DEBUG_TOGGLE',
  MOVE_UP = 'MOVE_UP',
  MOVE_DOWN = 'MOVE_DOWN'
}

export interface InputMapping {
  keyCode: KeyCode;
  action: InputAction;
}

export const INPUT_MAPPINGS: InputMapping[] = [
  { keyCode: 'KeyW', action: InputAction.MOVE_UP },
  { keyCode: 'KeyS', action: InputAction.MOVE_DOWN },
  { keyCode: 'KeyA', action: InputAction.ROTATE_LEFT },
  { keyCode: 'KeyD', action: InputAction.ROTATE_RIGHT },
  { keyCode: 'KeyI', action: InputAction.LOOK_UP },
  { keyCode: 'KeyK', action: InputAction.LOOK_DOWN },
  { keyCode: 'KeyJ', action: InputAction.ROLL_LEFT },
  { keyCode: 'KeyL', action: InputAction.ROLL_RIGHT },
  { keyCode: 'Space', action: InputAction.JUMP },
  { keyCode: 'KeyV', action: InputAction.VERIFY_STATE },
  { keyCode: 'KeyR', action: InputAction.THROTTLE_FORWARD },
  { keyCode: 'KeyF', action: InputAction.THROTTLE_BACKWARD },
  { keyCode: 'KeyX', action: InputAction.DEBUG_TOGGLE }
];

export const getActionFromKeyCode = (keyCode: KeyCode): InputAction | undefined => {
  const mapping = INPUT_MAPPINGS.find(m => m.keyCode === keyCode);
  return mapping?.action;
};

export const getKeyCodeFromAction = (action: InputAction): KeyCode | undefined => {
  const mapping = INPUT_MAPPINGS.find(m => m.action === action);
  return mapping?.keyCode;
}; 
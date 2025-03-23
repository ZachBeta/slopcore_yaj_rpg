export enum InputAction {
  MOVE_FORWARD = 'MOVE_FORWARD',
  MOVE_BACKWARD = 'MOVE_BACKWARD',
  MOVE_LEFT = 'MOVE_LEFT',
  MOVE_RIGHT = 'MOVE_RIGHT',
  LOOK_UP = 'LOOK_UP',
  LOOK_DOWN = 'LOOK_DOWN',
  LOOK_LEFT = 'LOOK_LEFT',
  LOOK_RIGHT = 'LOOK_RIGHT',
  JUMP = 'JUMP',
  VERIFY_STATE = 'VERIFY_STATE'
}

export interface InputMapping {
  keyCode: string;
  action: InputAction;
}

export const INPUT_MAPPINGS: InputMapping[] = [
  { keyCode: 'KeyW', action: InputAction.MOVE_FORWARD },
  { keyCode: 'KeyS', action: InputAction.MOVE_BACKWARD },
  { keyCode: 'KeyA', action: InputAction.MOVE_LEFT },
  { keyCode: 'KeyD', action: InputAction.MOVE_RIGHT },
  { keyCode: 'KeyI', action: InputAction.LOOK_UP },
  { keyCode: 'KeyK', action: InputAction.LOOK_DOWN },
  { keyCode: 'KeyJ', action: InputAction.LOOK_LEFT },
  { keyCode: 'KeyL', action: InputAction.LOOK_RIGHT },
  { keyCode: 'Space', action: InputAction.JUMP },
  { keyCode: 'KeyV', action: InputAction.VERIFY_STATE }
];

export const getActionFromKeyCode = (keyCode: string): InputAction | undefined => {
  const mapping = INPUT_MAPPINGS.find(m => m.keyCode === keyCode);
  return mapping?.action;
};

export const getKeyCodeFromAction = (action: InputAction): string | undefined => {
  const mapping = INPUT_MAPPINGS.find(m => m.action === action);
  return mapping?.keyCode;
}; 
/**
 * Card Data - Provides sample cards for the terminal game including ASCII art representations
 */

import { GameState } from './game-types';

// ASCII Art for different card types
export const CARD_ASCII_ART = {
  program: [
    '    _____',
    '   /    /|',
    '  /____/ |',
    ' |    |  |',
    ' |____|/   '
  ],
  icebreaker: [
    '   /|  /|',
    '  /_|_/ |',
    ' |     /|',
    ' |__/|/ |',
    ' |  ||  |',
    ' |__|/   '
  ],
  hardware: [
    '  _______',
    ' /       \\',
    '|  o   o  |',
    '|    |    |',
    '|___|___|_|'
  ],
  resource: [
    '    $$$    ',
    '   $   $   ',
    '   $   $   ',
    '   $   $   ',
    '    $$$    '
  ],
  event: [
    '    /\\    ',
    '   /  \\   ',
    '  /    \\  ',
    ' +------+ ',
    ' |      | '
  ],
  virus: [
    '    ()    ',
    '   /\\/\\   ',
    '  <(  )>  ',
    '   \\\\//   ',
    '    \\/    '
  ],
  operation: [
    '   __/\\__   ',
    '  /      \\  ',
    ' |   >>   | ',
    '  \\______/  ',
    '    |  |    '
  ],
  asset: [
    '    _____    ',
    '   |     |   ',
    '   |  █  |   ',
    '   |_____|   ',
    '   /  |  \\   '
  ],
  ice: [
    ' +-----------------+',
    ' |    FIREWALL     |',
    ' +-----------------+',
    ' | [====||====]    |',
    ' | [====||====]    |',
    ' | [====||====]    |',
    ' +-----------------+'
  ],
  agenda: [
    '   ★★★★★   ',
    '  ★     ★  ',
    ' ★       ★ ',
    '  ★     ★  ',
    '   ★★★★★   '
  ],
  upgrade: [
    '   ▲▲▲▲   ',
    '  ▲    ▲  ',
    ' ▲      ▲ ',
    '▲▲▲▲▲▲▲▲▲▲'
  ]
};

// Game UI ASCII Art
export const GAME_UI_ASCII = {
  logo: [
    '  _   _                   ____                 _                           ',
    ' | \\ | | ___  ___  _ __  |  _ \\  ___  _ __ ___(_)_ __   __ _ _ __   ___ ___',
    ' |  \\| |/ _ \\/ _ \\| \'_ \\ | | | |/ _ \\| \'_ \\_  / | \'_ \\ / _` | \'_ \\ / __/ _ \\',
    ' | |\\  |  __/ (_) | | | || |_| | (_) | | | / /| | | | | (_| | | | | (_|  __/',
    ' |_| \\_|\\___|\\___|_| |_||____/ \\___/|_| |/_/ |_|_| |_|\\__,_|_| |_|\\___|\\___|\\'
  ],
  runner: [
    '  _____                            ',
    ' |  __ \\                           ',
    ' | |__) |_   _ _ __  _ __   ___ _ __',
    ' |  _  /| | | | \'_ \\| \'_ \\ / _ \\ \'__|',
    ' | | \\ \\| |_| | | | | | | |  __/ |   ',
    ' |_|  \\_\\\\__,_|_| |_|_| |_|\\___|_|   '
  ],
  corp: [
    '   _____                                    _   _             ',
    '  / ____|                                  | | (_)            ',
    ' | |     ___  _ __ _ __   ___  _ __ __ _| |_ _  ___  _ __  ',
    ' | |    / _ \\| \'__| \'_ \\ / _ \\| \'__/ _` | __| |/ _ \\| \'_ \\ ',
    ' | |___| (_) | |  | |_) | (_) | | | (_| | |_| | (_) | | | |',
    '  \\_____\\___/|_|  | .__/ \\___/|_|  \\__,_|\\__|_|\\___/|_| |_|',
    '                  | |                                       ',
    '                  |_|                                       '
  ],
  run: [
    ' _______ _______ _______ _______ _______ _______ _______ ',
    ' |\\     /|\\     /|\\     /|\\     /|\\     /|\\     /|\\     /|',
    ' | +---+ | +---+ | +---+ | +---+ | +---+ | +---+ | +---+ |',
    ' | |   | | |   | | |   | | |   | | |   | | |   | | |   | |',
    ' | |R  | | |U  | | |N  | | |N  | | |I  | | |N  | | |G  | |',
    ' | +---+ | +---+ | +---+ | +---+ | +---+ | +---+ | +---+ |',
    ' |/_____\\|/_____\\|/_____\\|/_____\\|/_____\\|/_____\\|/_____\\|'
  ]
};

// Custom ASCII art for specific cards
export const SPECIFIC_CARD_ART = {
  'Icebreaker.exe': [
    '   ░░░░░   ',
    '  ░█▀▀▀█░  ',
    ' ░█░ ░ ░█░ ',
    ' ░█░ ░ ░█░ ',
    '  ░█▄▄▄█░  ',
    '   ░░░░░   '
  ],
  'Neural Matrix': [
    '  ┌─┐┌─┐┌─┐ ',
    '  │ ││ ││ │ ',
    '  ├─┘├─┘├─┘ ',
    '  │▞▀│▞▀│▞▀ ',
    '  └─┘└─┘└─┘ '
  ],
  'Crypto Cache': [
    '   ╭───╮   ',
    '  ╭│╲$╱│╮  ',
    '  │╰─┬─╯│  ',
    '  ╰──┴──╯  '
  ],
  'Data Wall': [
    ' ┏━━━━━━━━┓ ',
    ' ┃■■■■■■■■┃ ',
    ' ┃■■■■■■■■┃ ',
    ' ┃■■■■■■■■┃ ',
    ' ┗━━━━━━━━┛ '
  ]
};

// Define card types and interfaces
export interface Card {
  id: string;
  name: string;
  type: 'program' | 'hardware' | 'resource' | 'event' | 'ice' | 'agenda' | 'upgrade';
  subtype?: string;
  cost: number;
  memoryUsage?: number;
  strength?: number;
  description: string;
  effect?: (gameState: GameState) => void;
  ascii_art?: string[];
}

/**
 * Card data for the game
 */
export const CARD_DATA: Card[] = [
  // Programs
  {
    id: 'prog_breach',
    name: 'Breach',
    type: 'program',
    subtype: 'breaker',
    cost: 2,
    memoryUsage: 1,
    strength: 2,
    description: 'Break barrier subroutines for 1 credit each.',
    ascii_art: CARD_ASCII_ART['program']
  },
  {
    id: 'prog_decrypt',
    name: 'Decrypt',
    type: 'program',
    subtype: 'breaker',
    cost: 3,
    memoryUsage: 1,
    strength: 1,
    description: 'Break code gate subroutines for 1 credit each.',
    ascii_art: CARD_ASCII_ART['program']
  },
  {
    id: 'prog_disrupt',
    name: 'Disrupt',
    type: 'program',
    subtype: 'breaker',
    cost: 3,
    memoryUsage: 1,
    strength: 2,
    description: 'Break sentry subroutines for 2 credits each.',
    ascii_art: CARD_ASCII_ART['program']
  },
  {
    id: 'prog_autoscript',
    name: 'Autoscript',
    type: 'program',
    cost: 2,
    memoryUsage: 2,
    description: 'When your turn begins, draw 1 card.',
    ascii_art: CARD_ASCII_ART['program']
  },
  {
    id: 'prog_credit_miner',
    name: 'Credit Miner',
    type: 'program',
    cost: 3,
    memoryUsage: 2,
    description: 'Gain 1 credit at the start of your turn.',
    ascii_art: CARD_ASCII_ART['program']
  },
  {
    id: 'prog_deepdive',
    name: 'DeepDive',
    type: 'program',
    subtype: 'virus',
    cost: 4,
    memoryUsage: 2,
    description: 'Place 3 virus counters on DeepDive when installed. Use a virus counter to access an additional card during a run on R&D.',
    ascii_art: CARD_ASCII_ART['virus']
  },
  {
    id: 'prog_routefinder',
    name: 'RouteFinder',
    type: 'program',
    cost: 1,
    memoryUsage: 1,
    description: 'Reduce the cost to install programs by 1 credit.',
    ascii_art: CARD_ASCII_ART['program']
  },
  {
    id: 'prog_stealth_protocol',
    name: 'Stealth Protocol',
    type: 'program',
    cost: 3,
    memoryUsage: 2,
    description: 'The first ICE encountered each turn has -2 strength.',
    ascii_art: CARD_ASCII_ART['program']
  },

  // Hardware
  {
    id: 'hw_neural_interface',
    name: 'Neural Matrix',
    type: 'hardware',
    cost: 4,
    description: 'You have +2 maximum memory units.',
    ascii_art: SPECIFIC_CARD_ART['Neural Matrix']
  },
  {
    id: 'hw_console',
    name: 'Console',
    type: 'hardware',
    subtype: 'console',
    cost: 4,
    description: '+2 memory units. Draw 1 card when installed.',
    ascii_art: CARD_ASCII_ART['hardware']
  },
  {
    id: 'hw_rig',
    name: 'Custom Rig',
    type: 'hardware',
    cost: 5,
    description: '+3 memory units. Reduce the cost of the first program you install each turn by 2 credits.',
    ascii_art: CARD_ASCII_ART['hardware']
  },
  {
    id: 'hw_mem_chip',
    name: 'Memory Chip',
    type: 'hardware',
    cost: 2,
    description: '+1 memory unit.',
    ascii_art: CARD_ASCII_ART['hardware']
  },
  {
    id: 'hw_trace_blocker',
    name: 'Trace Blocker',
    type: 'hardware',
    cost: 3,
    description: 'Reduce the strength of traces by 2.',
    ascii_art: CARD_ASCII_ART['hardware']
  },
  {
    id: 'hw_escape_hatch',
    name: 'Escape Hatch',
    type: 'hardware',
    cost: 2,
    description: 'You may jack out even if you have encountered a "cannot jack out" subroutine.',
    ascii_art: CARD_ASCII_ART['hardware']
  },

  // Resources
  {
    id: 'res_crypto_stash',
    name: 'Crypto Cache',
    type: 'resource',
    cost: 3,
    description: 'Place 3 credits on Crypto Stash when installed. Click to take 1 credit from Crypto Stash.',
    ascii_art: SPECIFIC_CARD_ART['Crypto Cache']
  },
  {
    id: 'res_darknet_contact',
    name: 'Darknet Contact',
    type: 'resource',
    subtype: 'connection',
    cost: 2,
    description: 'When your turn begins, gain 1 credit if you have fewer than 6 credits.',
    ascii_art: CARD_ASCII_ART['resource']
  },
  {
    id: 'res_data_dealer',
    name: 'Data Dealer',
    type: 'resource',
    subtype: 'connection',
    cost: 3,
    description: 'Click, forfeit an agenda: Gain 7 credits.',
    ascii_art: CARD_ASCII_ART['resource']
  },
  {
    id: 'res_security_testing',
    name: 'Security Testing',
    type: 'resource',
    cost: 3,
    description: 'When your turn begins, you may name a server. The first time you make a successful run on that server, gain 2 credits instead of accessing cards.',
    ascii_art: CARD_ASCII_ART['resource']
  },
  {
    id: 'res_proxy_server',
    name: 'Proxy Server',
    type: 'resource',
    cost: 2,
    description: 'The first time each turn a trace is initiated, the Corp must pay 1 credit or the trace strength starts at 0.',
    ascii_art: CARD_ASCII_ART['resource']
  },

  // Events
  {
    id: 'evt_gaining_ground',
    name: 'Gaining Ground',
    type: 'event',
    cost: 2,
    description: 'Draw 3 cards.',
    ascii_art: CARD_ASCII_ART['event']
  },
  {
    id: 'evt_easy_money',
    name: 'Easy Money',
    type: 'event',
    cost: 3,
    description: 'Gain 5 credits.',
    ascii_art: CARD_ASCII_ART['event']
  },
  {
    id: 'evt_sure_gamble',
    name: 'Sure Gamble',
    type: 'event',
    cost: 5,
    description: 'Gain 9 credits.',
    ascii_art: CARD_ASCII_ART['event']
  },
  {
    id: 'evt_inside_job',
    name: 'Inside Job',
    type: 'event',
    subtype: 'run',
    cost: 3,
    description: 'Make a run. Bypass the first ICE encountered during this run.',
    ascii_art: CARD_ASCII_ART['event']
  },
  {
    id: 'evt_special_order',
    name: 'Special Order',
    type: 'event',
    cost: 2,
    description: 'Search your stack for a breaker program, reveal it, and add it to your grip. Shuffle your stack.',
    ascii_art: CARD_ASCII_ART['event']
  },
  {
    id: 'evt_test_run',
    name: 'Test Run',
    type: 'event',
    cost: 3,
    description: 'Search your stack or heap for a program, install it, and place it on top of your stack at the end of the turn. Shuffle your stack.',
    ascii_art: CARD_ASCII_ART['event']
  },
  {
    id: 'evt_infiltration',
    name: 'Infiltration',
    type: 'event',
    cost: 1,
    description: 'Gain 2 credits or expose 1 card.',
    ascii_art: CARD_ASCII_ART['event']
  },
  {
    id: 'evt_dirty_laundry',
    name: 'Dirty Laundry',
    type: 'event',
    cost: 2,
    description: 'Make a run. When that run ends, if it was successful, gain 5 credits.',
    ascii_art: CARD_ASCII_ART['event']
  },

  // Programs (Icebreakers)
  {
    id: 'prog_icebreaker',
    name: 'Icebreaker.exe',
    type: 'program',
    subtype: 'icebreaker',
    cost: 2,
    memoryUsage: 1,
    strength: 1,
    description: 'All-purpose icebreaker that can break any type of ICE subroutine for 2 credits each.',
    ascii_art: SPECIFIC_CARD_ART['Icebreaker.exe']
  },
  
  // ICE
  {
    id: 'ice_data_wall',
    name: 'Data Wall',
    type: 'ice',
    subtype: 'barrier',
    cost: 1,
    strength: 3,
    description: 'End the run unless the Runner spends 2 credits.',
    ascii_art: SPECIFIC_CARD_ART['Data Wall']
  },
];

/**
 * Get a card by ID
 */
export function getCardById(id: string): Card | undefined {
  return CARD_DATA.find(card => card.id === id);
}

/**
 * Get all cards of a specific type
 */
export function getCardsByType(type: Card['type']): Card[] {
  return CARD_DATA.filter(card => card.type === type);
}

/**
 * Create a shuffled deck of cards with a certain distribution
 * @param seed Optional random seed for consistent shuffling
 */
export function createStarterDeck(seed?: number): Card[] {
  // Create a distribution of cards for the starter deck
  const deckList = [
    // Programs (10 cards)
    'prog_breach', 'prog_breach',
    'prog_decrypt', 'prog_decrypt',
    'prog_disrupt', 'prog_disrupt',
    'prog_autoscript',
    'prog_credit_miner', 
    'prog_routefinder',
    'prog_stealth_protocol',
    
    // Hardware (6 cards)
    'hw_neural_interface',
    'hw_console',
    'hw_rig',
    'hw_mem_chip',
    'hw_trace_blocker',
    'hw_escape_hatch',
    
    // Resources (6 cards)
    'res_crypto_stash',
    'res_darknet_contact', 'res_darknet_contact',
    'res_data_dealer',
    'res_security_testing',
    'res_proxy_server',
    
    // Events (8 cards)
    'evt_gaining_ground', 'evt_gaining_ground',
    'evt_easy_money', 'evt_easy_money',
    'evt_sure_gamble',
    'evt_inside_job',
    'evt_special_order',
    'evt_dirty_laundry'
  ];
  
  // Convert IDs to actual card objects
  const deck = deckList.map(id => {
    const card = getCardById(id);
    if (!card) {
      throw new Error(`Card with ID ${id} not found in CARD_DATA`);
    }
    return card;
  });
  
  // Shuffle the deck
  return shuffleDeck(deck, seed);
}

/**
 * Shuffle a deck of cards
 * @param deck The deck to shuffle
 * @param seed Optional random seed for consistent shuffling
 */
export function shuffleDeck(deck: Card[], seed?: number): Card[] {
  const shuffled = [...deck];
  
  // Use seeded random if provided, otherwise use Math.random
  let random: () => number;
  
  if (seed !== undefined) {
    // Simple seeded random function
    const a = 1664525;
    const c = 1013904223;
    const m = Math.pow(2, 32);
    let _seed = seed;
    
    random = () => {
      _seed = (a * _seed + c) % m;
      return _seed / m;
    };
  } else {
    random = Math.random;
  }
  
  // Fisher-Yates shuffle algorithm
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
} 
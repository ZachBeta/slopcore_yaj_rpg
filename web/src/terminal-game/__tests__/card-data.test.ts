import { Card, CARD_DATA, createStarterDeck, getCardById, shuffleDeck } from '../card-data';

describe('Card Data Module', () => {
  describe('CARD_DATA', () => {
    it('should have defined card data', () => {
      expect(CARD_DATA).toBeDefined();
      expect(Array.isArray(CARD_DATA)).toBe(true);
      expect(CARD_DATA.length).toBeGreaterThan(0);
    });

    it('should have cards with required properties', () => {
      const requiredProps = ['id', 'name', 'type', 'cost', 'description'];

      CARD_DATA.forEach((card) => {
        requiredProps.forEach((prop) => {
          expect(card).toHaveProperty(prop);
        });
      });
    });
  });

  describe('getCardById', () => {
    it('should return the correct card when given a valid ID', () => {
      // Get a real card ID from the data
      const sampleCardId = CARD_DATA[0].id;
      const card = getCardById(sampleCardId);

      expect(card).toBeDefined();
      expect(card?.id).toBe(sampleCardId);
    });

    it('should return undefined when given an invalid ID', () => {
      const invalidId = 'this_id_does_not_exist';
      const card = getCardById(invalidId);

      expect(card).toBeUndefined();
    });
  });

  describe('createStarterDeck', () => {
    it('should create a starter deck with cards', () => {
      const seed = 12345;
      const deck = createStarterDeck(seed);

      expect(deck).toBeDefined();
      expect(Array.isArray(deck)).toBe(true);
      expect(deck.length).toBeGreaterThan(0);
    });

    it('should create different decks with different seeds', () => {
      const deck1 = createStarterDeck(12345);
      const deck2 = createStarterDeck(67890);

      // The decks should be different when using different seeds
      // Note: There's a tiny chance they could be the same by random chance,
      // but it's extremely unlikely with large enough decks
      const allMatch = deck1.every((card, index) => card.id === deck2[index]?.id);
      expect(allMatch).toBe(false);
    });
  });

  describe('shuffleDeck', () => {
    it('should shuffle a deck of cards', () => {
      // Create a test deck
      const originalDeck: Card[] = Array.from({ length: 20 }, (_, i) => ({
        id: `test_card_${i}`,
        name: `Test Card ${i}`,
        type: 'program',
        cost: i % 5,
        description: `Test card ${i} description`,
      }));

      // Make a deep copy of the original deck
      const deckCopy: Card[] = JSON.parse(JSON.stringify(originalDeck));

      // Shuffle the copy
      const shuffledDeck = shuffleDeck(deckCopy);

      // Ensure the shuffle function returns the input deck (modified)
      // Not checking identity because we can't reliably predict the outcome
      expect(Array.isArray(shuffledDeck)).toBe(true);
      expect(shuffledDeck.length).toBe(originalDeck.length);

      // Check if deck is shuffled (order is different)
      // Note: There's a tiny chance they could be the same by random chance
      const allCardsInSamePosition = originalDeck.every((card, index) =>
        card.id === shuffledDeck[index].id
      );

      expect(allCardsInSamePosition).toBe(false);
    });

    it('should maintain the same cards after shuffle', () => {
      // Create a test deck
      const originalDeck: Card[] = Array.from({ length: 10 }, (_, i) => ({
        id: `test_card_${i}`,
        name: `Test Card ${i}`,
        type: 'program',
        cost: i % 5,
        description: `Test card ${i} description`,
      }));

      // Make a deep copy of the original deck
      const deckCopy: Card[] = JSON.parse(JSON.stringify(originalDeck));

      // Shuffle the copy
      shuffleDeck(deckCopy);

      // Both decks should have the same cards, just in different order
      originalDeck.forEach((originalCard) => {
        const cardInShuffled = deckCopy.some((shuffledCard: Card) =>
          shuffledCard.id === originalCard.id
        );
        expect(cardInShuffled).toBe(true);
      });

      // Lengths should still match
      expect(deckCopy.length).toBe(originalDeck.length);
    });
  });
});

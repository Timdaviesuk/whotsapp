class WhotsApp {
  constructor() {
    // The master list of games
    // Everything underneath this should have no methods because it is the state of the game and will be sent over the air waves each time
    this.games = [];
    this.currentPlayer = null;
  }
  
  newGame() {
    const newGame = new Game();
    this.games.push(newGame);
    console.log("Hello from a new game.");
  } 
}

class Game {
  constructor() {
    this.id = null;
    this.players = [];
    this.deck = [];
    this.discardPile = [];
    this.activePlayer = null;
    this.completionOrder = [];
    this.actions = [];
    this.shapes = [];
  }
  
  startGame() {
    console.log("Starting a new Game.");
    // Create the cards
    this.deck = this.loadCards();
    
    console.log(`${this.deck}`)
    
    // Shuffle the cards
    this.deck = this.shuffleCards(this.deck);
    
    // Deal the cards
    const cardsPerPerson = 6;
    
    // Go through each player
    for (var i = 0; i < this.players.length; i++) {
      const player = this.players[i];
      
      // Clear their current cards
      player.cards = [];
      
      // Go through the number of cards required. Splice could be used, but pop and push is more like dealing an actual deck of cards.
      for (var j = 0; j < cardsPerPerson; j++) {
        const dealtCard = this.deck.pop();
        console.log(`Player dealt ${dealtCard.id}`);
        player.cards.push(dealtCard);
      }
    }
    
    // Place the first card onto the discard discardPile
    let startingCard = this.deck.pop();
    
    // We can't start on a Whot card
    while (startingCard.isWhotCard) {
      this.discardPile.push(startingCard);
      startingCard = this.deck.pop();
    }
    this.discardPile.push(startingCard);
    
    // Set the active Player
    this.activePlayer = this.players[0];
  }
  
  shuffleCards(array) {
    console.log("Starting to shuffle");
      var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
  
      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  }
  
  
  
  applyAction(action) {
    this.actions.push(action);
    
    // Apply an action
    switch (action.actionId) {
      case 1:
        this.pickupCard(action.playerId);
        break;
        
      case 2:
        console.log("Place card action.")
        this.placeCard(action.playerId, action.cardId, action.shapeId);
        break;
      
      default:
        // code
    }
  }
  
  victoryCheck() {
    // Check if the active player has no cards left
    if (this.activePlayer.cards.length == 0) {
      // Add to the completionOrder 
      this.completionOrder.push(this.activePlayer())
    }
  }
  
  addPlayer(name) {
    const newPlayer = new Player();
    newPlayer.name = name;
    
    // If only one player, assign Id as 0.
    if (this.players.length == 0)
      newPlayer.id = 0;
    else {
      // Calculate player id
      const playerIds = this.players.map(p => p.id);
     const highestId = Math.max(...playerIds);
      newPlayer.id = highestId + 1;
    }
    
    
    this.players.push(newPlayer);
  }
  
  pickupCard(playerId) {
    // Get the dealt card
    const card = this.deck.pop();
    
    // Get the player
    const player = this.players.find( p => p.id ===playerId);
    
    // Add the card to the list of players cards
    player.cards.push(card);
  }
  
  isValidPlacement(cardId, playersCards) {
    // Get the card to place
    const cardToPlace = playersCards.find(c => c.id === cardId);
    
    // Get the top card of the discard pile
    const discardCard = this.discardPile[this.discardPile.length-1];
    
    // If placing a Whot card
    if (cardToPlace.isWhotCard) {
      // if it's the last one, we can't place it.
      if (playersCards.length == 1)
        return new Validation(false, "Can not place a Whot card if it's your last card.");
        
      // Otherwise a Whot card can be placed on anything
      return new Validation(true);
    }
    
    let discardCardNumber = discardCard.number;
    let discardCardShapeId = discardCard.shape.id;
    
    if (discardCard.isWhotCard) {
      console.log("Putting on a Whot card.")
      console.log(`${discardCard.whotShape.id}`)
      discardCardShapeId = discardCard.whotShape.id;
    }
    
    if (cardToPlace.number === discardCardNumber)
      return new Validation(true);
      
     console.log(`Card to place shape ${cardToPlace.shapeId}`)
      
    if (cardToPlace.shapeId === discardCardShapeId)
      return new Validation(true);
      
    return new Validation(false, "Neither the number or shape match.");
  }
  
  // It is assumed the card is valid
  placeCard(playerId, cardId, shapeId = undefined) {
    // Get the player
    const player = this.players.find( p => p.id === playerId);
    
    // Get the index of player's cards
    const cardIndex = player.cards.map(c => c.id).indexOf(cardId);
    
    console.log(cardIndex);
    
    // Splice out that card from the array
    const placedCard = player.cards.splice(cardIndex, 1)[0];
    
    console.log(`In game, spliced out ${placedCard.number} ${placedCard.shape.name} ${placedCard.id}`);
    
    // Check if this is a Whot card
    if (placedCard.isWhotCard === true) {
      placedCard.shapeId = shapeId;
    }
    
    // Add it to this game's discard pile
    this.discardPile.push(placedCard);
  }
  
  loadCards() {
    const cardSet = new CardSet();
    const { deck, shapes} = cardSet.loadStandardDeck();
    
    this.shapes = shapes;
    
    console.log("Loaded all cards");
    
    return deck;
  }
  
  nextTurn() {
    // Go to the next player.
    this.nextPlayer();
    
    // Keep skipping players that have no cards
    while (this.activePlayer.cards.length == 0) {
      this.nextPlayer();
    }
  }
  
  nextPlayer() {
    // Get the players current position in the turn queue. 
    console.log("Going to the next player.")
    const playerIndex = this.players.indexOf(this.activePlayer);
    
    let nextPlayerIndex = playerIndex + 1;
    
    // Check if this is higher than the amount in the array, loop to the start of the array
    if (nextPlayerIndex >= this.players.length) {
      nextPlayerIndex = 0
    }
    
    // Check if they are in the 
    
    this.activePlayer = this.players[nextPlayerIndex];
    
    console.log(this.activePlayer);
  }
  
  shuffleDiscardPileIntoDeck() {
    // Shuffle all but the top card
    const topCard = this.discardPile.pop();
    
    // Go through each card in the discard pile and put back into the deck
    while (this.discardPile.length > 0) {
      const discardCard = this.discardPile.pop();
      this.deck.push(discardCard);
    }
    
    // Shuffle the remaining discard pile
    this.shuffleCards(this.deck);
  }
 
}

class Player {
  constructor() {
    this.id = null;
    this.name = null;
    this.cards = [];
  } 
}

class Card {
  constructor() {
    this.id = null;
    this.number = null;
    this.pointValue = null;
    this.shapeId = null;
    this.isWhotCard = false;
    this.shape = null;
    this.whotShape = null;
  }
}

class Validation {
  constructor(isValid, message) {
    this.isValid = isValid;
    this.message = message;
  }
}

class Shape {
  constructor() {
    this.id = null;
    this.name = null;
    this.plural = null;
    this.isWhotShape = false;
  }
}

class Action {
  constructor() {
    // Action is either 0 = nothing, 1 = pickup card, 2 = place card
    this.actionId = null;
    
    // The Id of the player this action applies too
    this.playerId = null;
    
    // These fields are only used for placing cards
    this.cardId = null;
    
    // This is only used when placing a Whot card
    this.shapeId = null;
  }
}

class CardSet {
  loadStandardDeck() {
    console.log("Loading shapes...");
    const shapes = standardDeckData.shapes.map(s => Object.assign(new Shape, s));
    
    console.log("Loading cards...");
    const deck = standardDeckData.cards.map(c => Object.assign(new Card, c));
    
    // Assign shapes
    deck.forEach(c => c.shape = shapes.find(s => s.id == c.shapeId));
    
    console.log(`Loaded ${deck.length} cards`);
    return {deck, shapes};
  }
}

const standardDeckData = {
  shapes: [
    {
      id: 2,
      name: "Cross",
      plural: "Crosses"
    }, {
      id: 1,
      name: "Triangle",
      plural: "Triangles"
    }, {
      id: 3,
      name: "Square",
      plural: "Squares"
    }, {
      id: 4,
      name: "Star",
      plural: "Stars"
    }, {
      id: 0,
      name: "Circle",
      plural: "Circles"
    }, {
      id: 5,
      name: "Whot",
      plural: "Whot",
      isWhotShape: true
    }, 
  ], 
  cards: [
    {
      id: 0,
      number: 1,
      pointValue: 1,
      shapeId: 0,
      isWhotCard: false
    },  {
      id: 1,
      number: 2,
      pointValue: 2,
      shapeId: 0,
      isWhotCard: false
    },  {
      id: 2,
      number: 3,
      pointValue: 3,
      shapeId: 0,
      isWhotCard: false
    },  {
      id: 3,
      number: 4,
      pointValue: 4,
      shapeId: 0,
      isWhotCard: false
    },  {
      id: 4,
      number: 5,
      pointValue: 5,
      shapeId: 0,
      isWhotCard: false
    },  {
      id: 5,
      number: 7,
      pointValue: 7,
      shapeId: 0,
      isWhotCard: false
    },  {
      id: 6,
      number: 8,
      pointValue: 8,
      shapeId: 0,
      isWhotCard: false
    },  {
      id: 7,
      number: 10,
      pointValue: 10,
      shapeId: 0,
      isWhotCard: false
    },  {
      id: 8,
      number: 11,
      pointValue: 11,
      shapeId: 0,
      isWhotCard: false
    },  {
      id: 9,
      number: 12,
      pointValue: 12,
      shapeId: 0,
      isWhotCard: false
    },  {
      id: 10,
      number: 13,
      pointValue: 13,
      shapeId: 0,
      isWhotCard: false
    },  {
      id: 11,
      number: 14,
      pointValue: 14,
      shapeId: 0,
      isWhotCard: false
    },  {
      id: 12,
      number: 1,
      pointValue: 1,
      shapeId: 1,
      isWhotCard: false
    },  {
      id: 13,
      number: 2,
      pointValue: 2,
      shapeId: 1,
      isWhotCard: false
    },  {
      id: 14,
      number: 3,
      pointValue: 3,
      shapeId: 1,
      isWhotCard: false
    },  {
      id: 15,
      number: 4,
      pointValue: 4,
      shapeId: 1,
      isWhotCard: false
    },  {
      id: 16,
      number: 5,
      pointValue: 5,
      shapeId: 1,
      isWhotCard: false
    },  {
      id: 17,
      number: 7,
      pointValue: 7,
      shapeId: 1,
      isWhotCard: false
    },  {
      id: 18,
      number: 8,
      pointValue: 8,
      shapeId: 1,
      isWhotCard: false
    },  {
      id: 19,
      number: 10,
      pointValue: 10,
      shapeId: 1,
      isWhotCard: false
    },  {
      id: 20,
      number: 11,
      pointValue: 11,
      shapeId: 1,
      isWhotCard: false
    },  {
      id: 21,
      number: 12,
      pointValue: 12,
      shapeId: 1,
      isWhotCard: false
    },  {
      id: 22,
      number: 13,
      pointValue: 13,
      shapeId: 1,
      isWhotCard: false
    },  {
      id: 23,
      number: 14,
      pointValue: 14,
      shapeId: 1,
      isWhotCard: false
    },  {
      id: 24,
      number: 1,
      pointValue: 1,
      shapeId: 2,
      isWhotCard: false
    },  {
      id: 25,
      number: 2,
      pointValue: 2,
      shapeId: 2,
      isWhotCard: false
    },  {
      id: 26,
      number: 3,
      pointValue: 3,
      shapeId: 2,
      isWhotCard: false
    },  {
      id: 27,
      number: 5,
      pointValue: 5,
      shapeId: 2,
      isWhotCard: false
    },  {
      id: 28,
      number: 7,
      pointValue: 7,
      shapeId: 2,
      isWhotCard: false
    },  {
      id: 29,
      number: 10,
      pointValue: 10,
      shapeId: 2,
      isWhotCard: false
    },  {
      id: 30,
      number: 11,
      pointValue: 11,
      shapeId: 2,
      isWhotCard: false
    },  {
      id: 31,
      number: 13,
      pointValue: 13,
      shapeId: 2,
      isWhotCard: false
    },  {
      id: 32,
      number: 14,
      pointValue: 14,
      shapeId: 2,
      isWhotCard: false
    },  {
      id: 33,
      number: 1,
      pointValue: 1,
      shapeId: 3,
      isWhotCard: false
    },  {
      id: 34,
      number: 2,
      pointValue: 2,
      shapeId: 3,
      isWhotCard: false
    },  {
      id: 35,
      number: 3,
      pointValue: 3,
      shapeId: 3,
      isWhotCard: false
    },  {
      id: 36,
      number: 5,
      pointValue: 5,
      shapeId: 3,
      isWhotCard: false
    },  {
      id: 37,
      number: 7,
      pointValue: 7,
      shapeId: 3,
      isWhotCard: false
    },  {
      id: 38,
      number: 10,
      pointValue: 10,
      shapeId: 3,
      isWhotCard: false
    },  {
      id: 39,
      number: 11,
      pointValue: 11,
      shapeId: 3,
      isWhotCard: false
    },  {
      id: 40,
      number: 13,
      pointValue: 13,
      shapeId: 3,
      isWhotCard: false
    },  {
      id: 41,
      number: 14,
      pointValue: 14,
      shapeId: 3,
      isWhotCard: false
    },  {
      id: 42,
      number: 1,
      pointValue: 2,
      shapeId: 4,
      isWhotCard: false
    },  {
      id: 43,
      number: 2,
      pointValue: 4,
      shapeId: 4,
      isWhotCard: false
    },  {
      id: 44,
      number: 3,
      pointValue: 6,
      shapeId: 4,
      isWhotCard: false
    },  {
      id: 45,
      number: 4,
      pointValue: 8,
      shapeId: 4,
      isWhotCard: false
    },  {
      id: 46,
      number: 5,
      pointValue: 10,
      shapeId: 4,
      isWhotCard: false
    },  {
      id: 47,
      number: 7,
      pointValue: 14,
      shapeId: 4,
      isWhotCard: false
    },  {
      id: 48,
      number: 8,
      pointValue: 16,
      shapeId: 4,
      isWhotCard: false
    },  {
      id: 49,
      number: 20,
      pointValue: 20,
      shapeId: 5,
      isWhotCard: true
    },  {
      id: 50,
      number: 20,
      pointValue: 20,
      shapeId: 5,
      isWhotCard: true
    },  {
      id: 51,
      number: 20,
      pointValue: 20,
      shapeId: 5,
      isWhotCard: true
    },  {
      id: 52,
      number: 20,
      pointValue: 20,
      shapeId: 5,
      isWhotCard: true
    }
  ]
}


var app = new Vue({
  el: '#app',
  data: {
    stage: 0,
    app: new WhotsApp(),
    activeGame: null,
  },
  computed: {
    currentPlayer() {
      return this.activeGame.players.find(p => p.name === this.app.currentPlayer);
    },
    topCard() {
      return this.activeGame.discardPile[this.activeGame.discardPile.length - 1];
    },
    whotShapes() {
      return this.activeGame.shapes.filter(s => s.isWhotShape === false);
    }
  },
  methods: {
    newGame() {
      // Create a new game of Whot
      console.log("Vue create a new game.")
      this.app.newGame();
      this.activeGame = this.app.games[0];
      
      // Create a new player based on the current player.
      this.activeGame.addPlayer(this.app.currentPlayer);
      
      // Move to the next stage
      this.stage = 1;
    },
    addPlayer() {
      this.activeGame.addPlayer("");
    },
    startGame() {
      // Start the game
      this.activeGame.startGame();
      
      // Move to the game stage
      this.stage = 2;
    },
    placeCard(card) {
      if (card.isWhotCard && card.whotShape==null)
        return;
        
      console.log(`In vue: Placing card ${card.number} ${card.shape.name}`);
      const isValid = this.activeGame.isValidPlacement(card.id, this.currentPlayer.cards);
      
      if (isValid.isValid == false) {
        console.log("Invalid card!");
        console.log(isValid.message);
        return;
      }
        
      const newAction = new Action();
      newAction.actionId = 2;
      newAction.playerId = this.currentPlayer.id;
      newAction.cardId = card.id;
      
      console.log(`In vue: placing ${card.id}`);
      
      if (card.isWhotCard == true) {
        newAction.shapeId = card.shape.id;
      }
      
      this.activeGame.applyAction(newAction);
      
      // Check for victory
      if (this.currentPlayer.cards.length == 0) {
        this.stage = 4;
        return;
      }
      
      this.activeGame.nextTurn();
      this.app.currentPlayer = this.activeGame.activePlayer.name;
      this.stage = 3;
    },
    pickupCard() {
      const newAction = new Action();
      newAction.actionId = 1;
      newAction.playerId = this.currentPlayer.id;
      
      this.activeGame.applyAction(newAction);
      this.activeGame.nextTurn();
      this.app.currentPlayer = this.activeGame.activePlayer.name;
      
      this.stage = 3;
    }
  }
})
const express = require("express");
const app = express();

app.use(express.json());

const port = 8000; //порт
var users = []; //пользователи
var cards = []; //все карты
var board = []; //карты на поле

//генерация колоды 
function createCards(cards){
    let id = 0;
    for (let count = 1; count <= 3; count++) {
      for (let color = 1; color <= 3; color++) {
        for (let shape = 1; shape <= 3; shape++) {
          for (let fill = 1; fill <= 3; fill++) {
            cards.push({ id, count, color, shape, fill });
            id++;
          }
        }
      }
    }
    cards.sort(function () {
        return 0.5 - Math.random();
      });
    return cards;
}

cards = createCards(cards);

//выкладка карт из колоды на поле
for (let i = 0; i < 12; i++) {
  board.push(cards.shift());
}

//генерация токена
function createToken(){
  return Math.random().toString(36).substr(2);
}

//регистрация пользователя
app.post("/registration", async (request, response) => {
  try{
    const username = request.body.username;
    //проверка на заполненность имени
    if (username == ""){
      response.json({success: false, exception: { message: "Please, enter username"}});
    }
    let check = true;
    //проверка на уникальность имени
    if (users.length >= 1){
      for (let i = 0; i < users.length; i++){
        if (username == users[i].username){
          check = false;
        }
      }
    } 
    if (check == false){
      response.json({success: false, exception: { message: "Username is taken"}});
    }
    else {
      let token = createToken();
      let user = {username: username, token: token, points: 0};
      users.push(user);
      response.json({success: true, exception: null, username: username, token: token});
      //console.log(users);
    }
  }
  catch (error) {
    console.log(error);
    response.status(500).json({success: false, exception: { message: "Error"}});
  }
  });

//получение списка карт на поле
app.get("/field", function (request, response) {
  try {
    response.json({success: true, exception: null, board: board});
  } 
  catch (error) {
    console.log(error);
    response.status(500).json({success: false, exception: { message: "Error"}});
  }
});

//получение списка сетов
function getSetLists(board){
  let sets = []
  for(let i = 0; i < board.length; i++){
   for(let j = i + 1; j < board.length; j++){
      for(let k = j + 1; k < board.length; k++){
        check = true;
        properties = ['count', 'color', 'shape', 'fill']
        for(let pr = 0; pr < properties.length; pr++){
          if(!checkCards(board[i], board[j], board[k], properties[pr])){
            check = false;
            break;
          }
        }
        if(check){
          let set = [board[i].id, board[j].id, board[k].id];
          sets.push(set.sort());
        }
    }
  }
}
return sets
}

//проверка, является ли набор карт сетом
function checkCards(firstCard, secondCard, thirdCard, property) {
	let firstProperty = firstCard[property];
	let secondProperty = secondCard[property];
	let thirdProperty = thirdCard[property];
  return (firstProperty == secondProperty && secondProperty == thirdProperty) || 
    (firstProperty != secondProperty && secondProperty != thirdProperty && firstProperty != thirdProperty);
}


//обновление поля
function updateBoard() {
  const cardsToAdd = Math.min(3, board.length);
  for (let i = 0; i < cardsToAdd; i++) {
    board.push(cards.shift()); 
  }
}

//взятие сета
app.post("/field", (request, response) => {
  try {
    const set = request.body.set.sort();
    const token = request.body.token;
    let user = users.find((user) => user.token === token);
    let sets = getSetLists(board);
    //console.log(sets);
    let check = false;
    //проверка на существование пользователя
    if (user){
      //проверка на конец игры
      if (sets.length === 0 || board.length < 3){
        response.json({ success: true, exception: { message: "Game over"} });
      }
      //проверка, является ли вводимый надбор карт сетом
      for (let i = 0; i < sets.length; i++){
        //console.log(sets[i], set);
        if (set[0] === sets[i][0] && set[1] === sets[i][1] && set[2] === sets[i][2]){
          check = true;
          break;
        }
      }
      //если пользователь нашёл сет
      if (check) {
        //удаление карт с поля
        for (let i = 0; i < 3; i++) {
          const indexToRemove = board.findIndex((card) => card.id === set[i]);
          board.splice(indexToRemove, 1);
        }
        //добавление новых карт
        updateBoard();
        //console.log(board.length + cards.length);
        //начисление очков игроку, нашедшему сет
        user.points++;
        response.json({ success: true, exception: null, board: board, user: user });
      } else {
        response.json({ success: false, exception: { message: "Set not found"} });
      }
    }
    else{
      response.json({ success: false, exception: { message: "User not found"} });
    }
  } 
  catch (error) {
    console.log(error);
    response.status(500).json({success: false, exception: { message: "Error"}});
  }
});

//получение списка пользователей и их очков
app.get("/scores", function (request, response) {
  try {
    scores = [];
    for (let i = 0; i < users.length; i++){
      scores.push({username: users[i].username, points: users[i].points});
    }
    response.json({success: true, exception: null, scores: scores});
  } 
  catch (error) {
    console.log(error);
    response.status(500).json({success: false, exception: { message: "Error"}});
  }
});

app.listen(port, ()=>console.log(`Сервер доступен по адресу http://127.0.0.1:${port}/`));


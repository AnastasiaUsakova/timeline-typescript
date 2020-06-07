import { PlayerState, Card } from "../../common/messages";
/**
 * Заголовок экрана
 */
const title = document.querySelector( 'main.game>h2' ) as HTMLHeadingElement;
/**
 * Стол
 */
const deck = document.querySelector( '.deck' ) as HTMLElement;

/**
 * Карты в руке
 */
const hand = document.querySelector('.hand') as HTMLElement;

/**
 * Колода с картами
 */
const deckHand = document.querySelector('.deck-element') as HTMLElement;
/**
 * Состояние игрока
 */
const playerState: PlayerState = {
	cards: [],
	leftCard: '',
	currentCard: '',
	rightCard: ''
}

if ( !title || !deck || !hand )
{
	throw new Error( 'Can\'t find required elements on "game" screen' );
}

/**
 * Обработчик хода игрока
 * @param move состояние игрока
 */
type TurnHandler = ( move: PlayerState ) => void;

type DeckHandler = ( move: PlayerState ) => void;
/**
 * Обработчик хода игрока
 */
let turnHandler: TurnHandler;

let deckHandler: DeckHandler;

function onPlus( event: Event ): void{
	event.preventDefault();
	let currPlus = event.currentTarget as HTMLElement;
	console.log('currPlus', currPlus);
	//Контейнер карты, которой принадлежит плюс
	let currPlusCardContainer = currPlus.parentElement as HTMLElement;
	console.log('currpluscardcontainer', currPlusCardContainer);
	//Если нажали самый левый плюс
	if(currPlus.classList.contains('left')){
		//Контейнер описания правой карты
		let rightEventElement = currPlus.nextSibling?.firstChild as HTMLElement;
		//Описание правой карты
		let rightEvent: string = rightEventElement.classList[1];
		//Записываем описание правой карты и левую карту (пустая)
		playerState.rightCard = rightEvent;
		playerState.leftCard = '';
		removeAllPluses();
		//Отправляем ход на сервер
		turnHandler && turnHandler( playerState );
		return;
	}
	
	//Если нажали самый правый плюс
	if(currPlusCardContainer.nextSibling === null){
		//Контейнер описания левой карты
		let leftEventElement = currPlus.previousSibling?.firstChild as HTMLElement;
		console.log('left event element: ', leftEventElement)
		//Описание левой карты
		let leftEvent: string = leftEventElement.classList[1];
		//Записываем описание левой карты и правую карту (пустая)
		playerState.leftCard = leftEvent;
		playerState.rightCard = '';
		removeAllPluses();
		turnHandler && turnHandler( playerState );
		return;
	}

	//Если плюс посередине
	//Контейнер описания левой карты
	let leftEventElement = currPlus.previousSibling?.firstChild as HTMLElement;
	//Описание левой карты
	let leftEvent: string = leftEventElement.classList[1];

	//Контейнер описания правой карты
	let rightEventContainer = currPlusCardContainer.nextSibling as HTMLElement;
	let rightEventElement = rightEventContainer.firstChild?.firstChild as HTMLElement;
	let rightEvent: string = rightEventElement.classList[1];

	//Записываем описание правой карты и левой карты
	playerState.rightCard = rightEvent;
	playerState.leftCard = leftEvent;
	removeAllPluses();
	turnHandler && turnHandler( playerState );
	return;

}

function removeCardListener(): void{
	let handChildren = hand.children;
	for(let i = 0; i < handChildren.length; i++){
		handChildren[i].removeEventListener('click', onCard);
	}
}

function cardListener(): void{
	let handChildren = hand.children;
	for(let i = 0; i < handChildren.length; i++){
		handChildren[i].addEventListener('click', onCard);
	}
}

function removeAllSelections(): void{
	let selections = document.getElementsByClassName('selected');
	for(let item of selections){
		item.classList.remove('selected');
	}
}

function isAnyCardSelected(): boolean{
	let selections = document.getElementsByClassName('selected');
	return selections !== undefined;
}


function removeAllPluses(): void{
	let leftPluses = document.getElementsByClassName('left');
	console.log('left pluses', leftPluses);
	let rightPluses = document.getElementsByClassName('right');
	console.log('right pluses', rightPluses);
	while(leftPluses[0]){
		leftPluses[0].parentNode?.removeChild(leftPluses[0]);
	}
	while(rightPluses[0]){
		rightPluses[0].parentNode?.removeChild(rightPluses[0]);
	}
}

function onCard( event: Event ): void{
	event.preventDefault();
	let cardContainer = event.currentTarget as HTMLElement;
	let card = cardContainer.firstChild as HTMLElement;
	console.log('card ', card);
	//Если карта выбрана, удаляем плюсы
	if(card.classList.contains('selected')){
		removeAllSelections();
		//Помечаем карту как не выбранную
		card.classList.remove('selected');
		//Удаляем текущую карту из состояния игрока
		playerState.currentCard = '';

		//Удаляем плюсы
		removeAllPluses();
		return;
	}
	//Если карта не выбрана, добавляем плюсы
	else{
		console.log(isAnyCardSelected());
		if(isAnyCardSelected()){
			removeAllPluses();
		}
		removeAllSelections();
		//Помечаем карту как выбранную
		card.classList.add('selected');
		//Достаем описание выбранной карты
		let currentEventContainer = card.firstChild as HTMLElement;
		console.log('curr event container ', currentEventContainer);
		let currentEvent: string = currentEventContainer.classList[1];
		//Записываем текущую выбранную карту в состояние игрока
		playerState.currentCard = currentEvent;
	
		//Добавляем плюсы
		let deckChildren = deck.children;
		for(let i = 0; i < deckChildren.length; i++){
			//Создаем плюс
			let plus = document.createElement('div');
			plus.classList.add('plus');
			plus.textContent = '+';
	
			//Берем контейнер карты
			let card = deckChildren[i].firstChild;
	
			//Создаем правый контейнер
			let right = document.createElement('div');
			right.classList.add('right');
			//Вставляем плюс в контейнер
			right.appendChild(plus);
			//Добавляем событие
			right.addEventListener('click', onPlus);
			//Вставляем контейнер в конец контейнера
			deckChildren[i].appendChild(right);
	
			//Если это самая левая карта, то вставляем плюс слева
			if(i === 0){
				//Вставляем плюс слева
				let left = document.createElement('div');
				left.classList.add('left');
				let plusLeft = document.createElement('div');
				plusLeft.classList.add('plus');
				plusLeft.textContent = '+';
				left.appendChild(plusLeft);
				left.addEventListener('click', onPlus);
				deckChildren[i].insertBefore(left, card);
			}
		}
		
		return;
	}
	
}

function addCardImage( elem: HTMLElement, description: string ): void{
	let image = document.createElement('img');
	image.src=`../../../images/WODates/${description}.png`;
	elem.append(image);
}

function addCardDeckImage( elem: HTMLElement, description: string ): void{
	let image = document.createElement('img');
	image.src=`../../../images/${description}.png`;
	elem.append(image);
}

function updateHand( handCards: Array<Card> ): void{
	hand.innerHTML='';
	playerState.cards = [];
	console.log('Карты в руке: ', handCards);
	for(let i = 0; i < handCards.length; i++){
		let cardContainer = document.createElement('div');
		let card = document.createElement('div');
		let description = document.createElement('div');
		description.classList.add('description', `${handCards[i].event}`);
		card.classList.add('card', 'card-hand');
		cardContainer.classList.add('card-container');
		card.append(description);
		cardContainer.append(card);
		addCardImage(card, `${handCards[i].event}`)
		hand.append(cardContainer);
		let stateCard: Card = { event: handCards[i].event, year: '' };
		playerState.cards.push(stateCard);
	}
}

function onDeck( event: Event ): void{
	event.preventDefault();
	deckHand.classList.remove('deck-selected');
	deckHandler && deckHandler( playerState );
	return;
}

function takeCard(): void{
	title.textContent = 'Возьмите карту из колоды';
	removeCardListener();
	deckHand.classList.add('deck-selected');
	deckHand.addEventListener('click', onDeck);
}

function updateDeck( deckCards: Array<Card> ): void{
	deck.innerHTML='';
	console.log('Карты на столе: ', deckCards);
	console.log('deck', deck);
	for(let i = 0; i < deckCards.length; i++){
		let cardContainer = document.createElement('div');
		let card = document.createElement('div');
		let description = document.createElement('div');
		description.classList.add('description', `${deckCards[i].event}`);
		card.classList.add('card');
		cardContainer.classList.add('card-container', 'deck-card');
		card.append(description);
		addCardDeckImage(card, `${deckCards[i].event}`)
		cardContainer.append(card);
		deck.append(cardContainer);
	}
}
/**
 * Обновляет экран игры
 * 
 * @param myTurn Ход текущего игрока
 */
function update( myTurn: boolean, handCards: Array<Card>, deckCards: Array<Card> ): void
{
	if(handCards.length !== 0)
		updateHand(handCards);
	updateDeck(deckCards);
	if ( myTurn )
	{
		title.textContent = 'Ваш ход';
		cardListener();
		deckHand.removeEventListener('click', onDeck);
		return;
	}
	deckHand.removeEventListener('click', onDeck);
	title.textContent = 'Ход противника';
	removeCardListener();
}

/**
 * Устанавливает обработчик хода игрока
 * 
 * @param handler Обработчик хода игрока
 */
function setTurnHandler( handler: TurnHandler ): void
{
	turnHandler = handler;
}

function setDeckHandler( handler: DeckHandler ): void{
	deckHandler = handler;
}

export {
	update,
	setTurnHandler,
	setDeckHandler,
	takeCard
};

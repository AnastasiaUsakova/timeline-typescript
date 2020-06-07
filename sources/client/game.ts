import { openScreen } from './screens.js';
import * as GameScreen from './screens/game.js';
import * as ResultScreen from './screens/result.js';
import { Card, PlayerState } from '../common/messages';
GameScreen.setTurnHandler( turnHandler );
GameScreen.setDeckHandler( deckHandler );
ResultScreen.setRestartHandler( restartHandler );

/**
 * Отправляет сообщение на сервер
 */
let sendMessage: typeof import( './connection.js' ).sendMessage;

/**
 * Устанавливает функцию отправки сообщений на сервер
 * 
 * @param sendMessageFunction Функция отправки сообщений
 */
function setSendMessage( sendMessageFunction: typeof sendMessage ): void
{
	sendMessage = sendMessageFunction;
}

/**
 * Обрабатывает ход игрока
 * 
 * @param number Загаданное пользователем число
 */
function turnHandler( state: PlayerState ): void
{
	sendMessage( {
		type: 'playerRoll',
		state: state
	} );
}

function deckHandler( state: PlayerState ): void{
	sendMessage(
		{
			type: 'deckClient',
			state: state
		}
	);
}

/**
 * Обрабатывает перезапуск игры
 */
function restartHandler(): void
{
	sendMessage( {
		type: 'repeatGame',
	} );
}

/**
 * Начинает игру
 */
function startGame(): void
{
	openScreen( 'game' );
}

function takeCard(): void{
	GameScreen.takeCard();
}

/**
 * Меняет активного игрока
 * 
 * @param myTurn Ход текущего игрока?
 * @param cards Карты в руке игрока
 * @param deck Карты на столе
 */
function changePlayer( myTurn: boolean, cards: Array<Card>, deck: Array<Card> ): void
{
	GameScreen.update( myTurn, cards, deck );
}

/**
 * Завершает игру
 * 
 * @param result Результат игры
 */
function endGame( result: 'win' | 'loose' | 'abort' ): void
{
	ResultScreen.update( result );
	openScreen( 'result' );
}

export {
	startGame,
	changePlayer,
	endGame,
	setSendMessage,
	takeCard
};

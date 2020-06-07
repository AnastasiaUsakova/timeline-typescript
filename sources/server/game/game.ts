import WebSocket from 'ws';
import { onError } from './on-error.js';
import { cardsData } from './cards';
import type {
	AnyClientMessage,
	AnyServerMessage,
	GameStartedMessage,
	GameAbortedMessage,
	PlayerState,
	Card
} from '../../common/messages.js';

/**
 * Класс игры
 * 
 * Запускает игровую сессию.
 */
class Game
{
	/**
	 * Количество игроков в сессии
	 */
	static readonly PLAYERS_IN_SESSION = 2;
	
	/**
	 * Игровая сессия
	 */
	private _session: WebSocket[];
	/**
	 * Информация о ходах игроков
	 */
	private _playersState!: WeakMap<WebSocket, number>;
	/**
	 * Колода карт
	 */
	private _cards: Array<Card>;
	/**
	 * Карты на столе
	 */
	private _deckCards: Array<Card>;
	/**
	 * Текущий ход
	 */
	private _currentMove!: WebSocket;
	/**
	 * @param session Сессия игры, содержащая перечень соединений с игроками
	 */
	constructor( session: WebSocket[] )
	{
		this._session = session;
		this._cards = [];
		this._deckCards = [];
		this._sendStartMessage()
			.then(
				() =>
				{
					this._listenMessages();
				}
			)
			.catch( onError );
	}
	
	/**
	 * Уничтожает данные игровой сессии
	 */
	destroy(): void
	{
		// Можно вызвать только один раз
		this.destroy = () => {};
		
		for ( const player of this._session )
		{
			if (
				( player.readyState !== WebSocket.CLOSED )
				&& ( player.readyState !== WebSocket.CLOSING )
			)
			{
				const message: GameAbortedMessage = {
					type: 'gameAborted',
				};
				
				this._sendMessage( player, message )
					.catch( onError );
				player.close();
			}
		}
		
		// Обнуляем ссылки
		this._session = null as unknown as Game['_session'];
		this._playersState = null as unknown as Game['_playersState'];
	}
	
	private _shuffle(): void{
		this._cards.sort(() => Math.random() - 0.5);
	}

	private _copyCardsData(): Array<Card>{
		let result: Array<Card> = [];
		cardsData.forEach((elem)=>{
			result.push(elem);
		})
		return result;
	} 
	/**
	 * Отправляет сообщение о начале игры
	 */
	private _sendStartMessage(): Promise<void[]>
	{
		this._playersState = new WeakMap<WebSocket, number>();
		this._cards = [];
		this._deckCards = [];
		this._cards = this._copyCardsData();
		this._currentMove = this._session[0];
		//Мешаем колоду
		this._shuffle();
		//Выдаем первые пять карт перетасованной колоды
		let givenCards: Array<Card> = this._cards.splice(0, 5);
		//Выдаем начальную карту
		let initCard: Card = this._cards.splice(0, 1)[0];
		const data: GameStartedMessage = {
			type: 'gameStarted',
			myTurn: true,
			cards: givenCards,
			initCard: initCard,
		};
		//Добавляем начальную карту в массив карт на столе
		this._deckCards.push(initCard);

		const promises: Promise<void>[] = [];
		for ( const player of this._session )
		{
			promises.push( this._sendMessage( player, data ) );
			this._playersState.set(player, 5);
			//Данные для второго игрока
			data.myTurn = false;
			data.cards = this._cards.splice(0, 5);
		}
		
		return Promise.all( promises );
	}
	
	/**
	 * Отправляет сообщение игроку
	 * 
	 * @param player Игрок
	 * @param message Сообщение
	 */
	private _sendMessage( player: WebSocket, message: AnyServerMessage ): Promise<void>
	{
		return new Promise(
			( resolve, reject ) =>
			{
				player.send(
					JSON.stringify( message ),
					( error ) =>
					{
						if ( error )
						{
							reject();
							
							return;
						}
						
						resolve();
					}
				)
			},
		);
	}
	
	/**
	 * Добавляет слушателя сообщений от игроков
	 */
	private _listenMessages(): void
	{
		for ( const player of this._session )
		{
			player.on(
				'message',
				( data ) =>
				{
					const message = this._parseMessage( data );
					
					this._processMessage( player, message );
				},
			);
			
			player.on( 'close', () => this.destroy() );
		}
	}
	
	/**
	 * Разбирает полученное сообщение
	 * 
	 * @param data Полученное сообщение
	 */
	private _parseMessage( data: unknown ): AnyClientMessage
	{
		if ( typeof data !== 'string' )
		{
			return {
				type: 'incorrectRequest',
				message: 'Wrong data type',
			};
		}
		
		try
		{
			return JSON.parse( data );
		}
		catch ( error )
		{
			return {
				type: 'incorrectRequest',
				message: 'Can\'t parse JSON data: ' + error,
			};
		}
	}
	
	/**
	 * Выполняет действие, соответствующее полученному сообщению
	 * 
	 * @param player Игрок, от которого поступило сообщение
	 * @param message Сообщение
	 */
	private _processMessage( player: WebSocket, message: AnyClientMessage ): void
	{
		switch ( message.type )
		{
			case 'playerRoll':
				this._onPlayerRoll( player, message.state );
				break;
			case 'deckClient':
				this._deckCard( player, message.state );
				break;
			case 'repeatGame':
				this._sendStartMessage()
					.catch( onError );
				break;
			
			case 'incorrectRequest':
				this._sendMessage( player, message )
					.catch( onError );
				break;
			
			case 'incorrectResponse':
				console.error( 'Incorrect response: ', message.message );
				break;
			
			default:
				this._sendMessage(
					player,
					{
						type: 'incorrectRequest',
						message: `Unknown message type: "${(message as AnyClientMessage).type}"`,
					},
				)
					.catch( onError );
				break;
		}
	}
	
	private _deckCard( currentPlayer: WebSocket, playerState: PlayerState ): void{
		let newCard: Card = this._cards.splice(0, 1)[0];
		let hands: Array<Card> = playerState.cards; 
		hands.push(newCard);
		let cards: number = this._playersState.get(currentPlayer)!;
		this._playersState.set(currentPlayer, cards + 1);
		let secondPlayer: WebSocket = currentPlayer;
		for(const player of this._session)
		{
			if(player !== currentPlayer)
				secondPlayer = player;
		}
		this._currentMove = secondPlayer;
				this._sendMessage(
					secondPlayer,
					{
						type: 'changePlayer',
						myTurn: true,
						cards: [],
						deckCards: this._deckCards
					},
				)
				.catch( onError );
				this._sendMessage(
					currentPlayer,
					{
						type: 'changePlayer',
						myTurn: false, 
						cards: hands,
						deckCards: this._deckCards
					},
				)
				.catch( onError );
				return;
	}

	private static _findEventYear( event: string ): string{
		let year: string = '';
		if(event === '') return '';
		cardsData.forEach((elem)=>{
			if(elem.event === event)
				year = elem.year;
		})
		return year;
	}


	private static _compareYears( left: string, current: string, right: string ): boolean{
		if(!right){
			console.log('right is absent');
			return +left < +current;
		}
			
		else{
			if(+left === 0){
				if(+current < +right)
					return true;
				else
					return false;
			}
			else{
				if(+current > +left && +current < +right)
					return true;
				else
					return false;
			}
		}
	}

	private static _removeCardFromHand( hand: Array<Card>, card: string ): Array<Card>{
		return hand.filter((elem)=>{
			return elem.event !== card;
		})
	}

	private static _checkWin( cards: number ): boolean{
		return cards === 0;
	}

	private static _eventToCard( event: string ): Card{
		let year = Game._findEventYear(event);
		return {
			event: event,
			year: year
		}
	}
	/**
	 * Обрабатывает ход игрока
	 * 
	 * @param currentPlayer Игрок, от которого поступило сообщение
	 * @param playerState Состояние игрока
	 */
	private _onPlayerRoll( currentPlayer: WebSocket, playerState: PlayerState ): void
	{
		//Если сейчас ход другого игрока
		if ( this._currentMove !== currentPlayer )
		{
			this._sendMessage(
				currentPlayer,
				{
					type: 'incorrectRequest',
					message: 'Not your turn',
				},
			)
				.catch( onError );
			return;
		}
		let leftDate: string = Game._findEventYear(playerState.leftCard);
		let rightDate: string = Game._findEventYear(playerState.rightCard);
		let currentDate: string = Game._findEventYear(playerState.currentCard);
		let comparison: boolean = Game._compareYears(leftDate, currentDate, rightDate);
		console.log(leftDate, currentDate, rightDate);
		console.log('PlayerState:  ', playerState);
		console.log('Comparison: ', comparison);

		//Если игрок ставит карту правильно
		if(comparison){
			let cards: number = this._playersState.get(currentPlayer)!;
			console.log(cards);
			this._playersState.set(currentPlayer, cards - 1);
			console.log(this._playersState.get(currentPlayer));
			let win: boolean = false;
			let secondPlayer: WebSocket = currentPlayer;
			for(const player of this._session)
			{
				if(player !== currentPlayer)
					secondPlayer = player;
			}
			win = Game._checkWin( this._playersState.get(currentPlayer)! );
			//Если еще не дошли до победы
			if(!win){
				//Убираем из рук эту карту
				let hands: Array<Card> = Game._removeCardFromHand(playerState.cards, playerState.currentCard);
				let currentCard: Card = Game._eventToCard(playerState.currentCard);
				//Добавляем карту на стол
				this._deckCards.push(currentCard);
				this._deckCards.sort((a, b)=>{return +a.year - +b.year});
				console.log('hands to client', hands);
				console.log(this._deckCards);
				this._currentMove = secondPlayer;
				this._sendMessage(
					secondPlayer,
					{
						type: 'changePlayer',
						myTurn: true,
						cards: [],
						deckCards: this._deckCards
					},
				)
				.catch( onError );
				this._sendMessage(
					currentPlayer,
					{
						type: 'changePlayer',
						myTurn: false, 
						cards: hands,
						deckCards: this._deckCards
					},
				)
				.catch( onError );
				return;
			}
			else{
				for(const player of this._session)
				{
					this._sendMessage(
						player,
						{
							type: 'gameResult',
							win: Game._checkWin( this._playersState.get(player)! ),
						},
					)
						.catch( onError );
				}
			}
			
		}
		else{ //Если игрок ставит карту неправильно
			this._sendMessage(
				currentPlayer,
				{
					type: 'takeCard'
				}
			)
		}
	}
}

export {
	Game,
};

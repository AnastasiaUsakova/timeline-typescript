export type Card = {
	event: string;
	year: string;
}

export type PlayerState = {
	cards: Array<Card>;
	leftCard: string;
	currentCard: string;
	rightCard: string;
}

/**
 * Начало игры
 */
export type GameStartedMessage = {
	/** Тип сообщения */
	type: 'gameStarted';
	/** Мой ход? */
	myTurn: boolean;
	cards: Array<Card>;
	initCard: Card;
};

/**
 * Игра прервана
 */
export type GameAbortedMessage = {
	/** Тип сообщения */
	type: 'gameAborted';
};

/**
 * Ход игрока
 */
export type PlayerRollMessage = {
	/** Тип сообщения */
	type: 'playerRoll';
	state: PlayerState;
};

/**
 * Результат хода игроков
 */
export type GameResultMessage = {
	/** Тип сообщения */
	type: 'gameResult';
	/** Победа? */
	win: boolean;
};

/**
 * Смена игрока
 */
export type ChangePlayerMessage = {
	/** Тип сообщения */
	type: 'changePlayer';
	/** Мой ход? */
	myTurn: boolean;
	cards: Array<Card>;
	deckCards: Array<Card>;
};

/**
 * Повтор игры
 */
export type RepeatGame = {
	/** Тип сообщения */
	type: 'repeatGame';
};

export type TakeCard = {
	type: 'takeCard';
};

export type DeckClient = {
	type: 'deckClient',
	state: PlayerState
};
/**
 * Некорректный запрос клиента
 */
export type IncorrectRequestMessage = {
	/** Тип сообщения */
	type: 'incorrectRequest';
	/** Сообщение об ошибке */
	message: string;
};

/**
 * Некорректный ответ сервера
 */
export type IncorrectResponseMessage = {
	/** Тип сообщения */
	type: 'incorrectResponse';
	/** Сообщение об ошибке */
	message: string;
};

/**
 * Сообщения от сервера к клиенту
 */
export type AnyServerMessage =
	| TakeCard
	| GameStartedMessage
	| GameAbortedMessage
	| GameResultMessage
	| ChangePlayerMessage
	| IncorrectRequestMessage
	| IncorrectResponseMessage;

/** 
 * Сообщения от клиента к серверу
 */
export type AnyClientMessage =
	| DeckClient
	| PlayerRollMessage
	| RepeatGame
	| IncorrectRequestMessage
	| IncorrectResponseMessage;

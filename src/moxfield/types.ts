export interface MoxfieldCard {
	id?: string;
	name?: string;
	scryfall_id?: string;
	set?: string;
	cn?: string;
	type_line?: string;
	type?: string;
	cmc?: number;
	mana_cost?: string;
	colors?: string[];
	color_identity?: string[];
}

export interface MoxfieldBoardCard {
	quantity?: number;
	card?: MoxfieldCard;
	boardType?: string;
}

export interface MoxfieldBoard {
	count?: number;
	cards?: Record<string, MoxfieldBoardCard>;
}

export interface MoxfieldDeck {
	id?: string;
	publicId?: string;
	publicUrl?: string;
	name?: string;
	description?: string;
	format?: string;
	colors?: string[];
	colorIdentity?: string[];
	boards?: Record<string, MoxfieldBoard>;
	createdByUser?: { displayName?: string; userName?: string };
	main?: { name?: string; scryfall_id?: string };
}

export interface CachedMoxfieldDeck {
	publicId: string;
	fetchedAt: number;
	deck: MoxfieldDeck;
}

export interface RemoteSource {
	kind: "moxfield";
	id: string;
	rawUrl?: string;
}

export class MoxfieldFetchError extends Error {
	constructor(
		message: string,
		readonly kind:
			| "not-found"
			| "private"
			| "rate-limited"
			| "network"
			| "invalid-id"
			| "unknown",
		readonly status?: number,
	) {
		super(message);
		this.name = "MoxfieldFetchError";
	}
}

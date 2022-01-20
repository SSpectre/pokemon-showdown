// Note: This is the list of formats
// The rules that formats use are stored in data/rulesets.ts

export const Formats: FormatList = [
	{
		section: "Luckless US/UM Singles",
		column: 1,
	},

	{
		name: "[Gen 7] Luckless OU",

		mod: 'gen7luckless',
		ruleset: ['Luckless'],
		banlist: ['Uber', 'Arena Trap', 'Power Construct', 'Shadow Tag', 'Baton Pass'],
	},
	{
		name: "[Gen 7] Luckless UU",

		mod: 'gen7luckless',
		ruleset: ['[Gen 7] Luckless OU'],
		banlist: ['OU', 'UUBL', 'Drizzle', 'Drought', 'Kommonium Z', 'Mewnium Z'],
	},
	{
		name: "[Gen 7] Luckless RU",

		mod: 'gen7luckless',
		ruleset: ['[Gen 7] Luckless UU'],
		banlist: ['UU', 'RUBL', 'Mimikyu', 'Aurora Veil'],
		unbanlist: ['Drought'],
	},
	{
		name: "[Gen 7] Luckless NU",

		mod: 'gen7luckless',
		ruleset: ['[Gen 7] Luckless RU'],
		banlist: ['RU', 'NUBL', 'Drought'],
	},
	{
		name: "[Gen 7] Luckless PU",

		mod: 'gen7luckless',
		ruleset: ['[Gen 7] Luckless NU'],
		banlist: ['NU', 'PUBL'],
	},
	{
		name: "[Gen 7] Luckless LC",

		mod: 'gen7luckless',
		ruleset: ['Little Cup', 'Luckless', 'Swagger Clause'],
		banlist: [
			'Aipom', 'Cutiefly', 'Drifloon', 'Gligar', 'Gothita', 'Meditite', 'Misdreavus', 'Murkrow', 'Porygon',
			'Scyther', 'Sneasel', 'Swirlix', 'Tangela', 'Trapinch', 'Vulpix-Base', 'Wingull', 'Yanma',
			'Eevium Z', 'Baton Pass', 'Dragon Rage', 'Sonic Boom', 'Sticky Web',
		],
	},
	{
		name: "[Gen 7] Luckless Monotype",
		desc: `All the Pok&eacute;mon on a team must share a type.`,

		mod: 'gen7luckless',
		ruleset: ['Same Type Clause', 'Luckless', 'Swagger Clause'],
		banlist: [
			'Aegislash', 'Arceus', 'Blaziken', 'Darkrai', 'Deoxys-Base', 'Deoxys-Attack', 'Dialga', 'Genesect', 'Gengar-Mega', 'Giratina', 'Giratina-Origin',
			'Groudon', 'Ho-Oh', 'Hoopa-Unbound', 'Kangaskhan-Mega', 'Kartana', 'Kyogre', 'Kyurem-White', 'Lucario-Mega', 'Lugia', 'Lunala', 'Magearna',
			'Marshadow', 'Mawile-Mega', 'Medicham-Mega', 'Metagross-Mega', 'Mewtwo', 'Naganadel', 'Necrozma-Dawn-Wings', 'Necrozma-Dusk-Mane', 'Palkia',
			'Pheromosa', 'Rayquaza', 'Reshiram', 'Salamence-Mega', 'Shaymin-Sky', 'Solgaleo', 'Tapu Lele', 'Xerneas', 'Yveltal', 'Zekrom', 'Zygarde',
			'Battle Bond', 'Shadow Tag', 'Damp Rock', 'Smooth Rock', 'Terrain Extender', 'Baton Pass',
		],
	},
	{
		name: "[Gen 7] Luckless 1v1",
		desc: `Bring three Pok&eacute;mon to Team Preview and choose one to battle.`,

		mod: 'gen7luckless',
		ruleset: [
			'Picked Team Size = 1', 'Max Team Size = 3',
			'Luckless', 'Swagger Clause'
		],
		banlist: [
			'Arceus', 'Darkrai', 'Deoxys-Base', 'Deoxys-Attack', 'Deoxys-Defense', 'Dialga', 'Giratina', 'Giratina-Origin', 'Groudon', 'Ho-Oh', 'Kangaskhan-Mega',
			'Kyogre', 'Kyurem-Black', 'Kyurem-White', 'Lugia', 'Lunala', 'Marshadow', 'Mewtwo', 'Mimikyu', 'Necrozma-Dawn-Wings', 'Necrozma-Dusk-Mane',
			'Palkia', 'Rayquaza', 'Reshiram', 'Salamence-Mega', 'Shaymin-Sky', 'Snorlax', 'Solgaleo', 'Tapu Koko', 'Xerneas', 'Yveltal', 'Zekrom',
			'Moody', 'Focus Sash', 'Perish Song', 'Detect + Fightinium Z',
		],
	},
	{
		name: "[Gen 7] Luckless Ubers",

		mod: 'gen7luckless',
		ruleset: ['Luckless', 'Mega Rayquaza Clause'],
		banlist: ['Baton Pass'],
	},
	{
		name: "[Gen 7] Luckless Anything Goes",

		mod: 'gen7luckless',
		ruleset: ['Obtainable', 'Team Preview', 'HP Percentage Mod', 'Cancel Mod', 'Endless Battle Clause'],
	},
	{
		name: "[Gen 7] Luckless ZU",

		mod: 'gen7luckless',
		ruleset: ['[Gen 7] Luckless PU'],
		banlist: [
			'PU', 'Carracosta', 'Crabominable', 'Gorebyss', 'Jynx', 'Raticate-Alola',
			'Shiftry', 'Throh', 'Turtonator', 'Type: Null', 'Ursaring', 'Victreebel',
		],
	},
	{
		name: "[Gen 7] Luckless Battle Spot Singles",

		mod: 'gen7luckless',
		ruleset: ['Flat Rules', 'Min Source Gen = 6'],
		banlist: ['Battle Bond'],
	},
	{
		name: "[Gen 7] Luckless Balanced Hackmons",

		mod: 'gen7luckless',
		ruleset: ['-Nonexistent', '2 Ability Clause', 'CFZ Clause', 'Team Preview', 'HP Percentage Mod', 'Cancel Mod', 'Endless Battle Clause'],
		banlist: [
			'Groudon-Primal', 'Rayquaza-Mega', 'Gengarite', 'Comatose + Sleep Talk', 'Chatter',
			'Arena Trap', 'Contrary', 'Huge Power', 'Illusion', 'Innards Out', 'Magnet Pull', 'Moody', 'Parental Bond', 'Protean', 'Psychic Surge', 'Pure Power', 'Shadow Tag', 'Stakeout', 'Water Bubble', 'Wonder Guard',
		],
	},
	{
		name: "[Gen 7] Luckless STABmons",

		mod: 'gen7luckless',
		ruleset: ['[Gen 7] Luckless OU', 'STABmons Move Legality'],
		banlist: ['Aerodactyl', 'Aerodactyl-Mega', 'Araquanid', 'Blacephalon', 'Kartana', 'Komala', 'Kyurem-Black', 'Porygon-Z', 'Silvally', 'Tapu Koko', 'Tapu Lele', 'Thundurus', 'Thundurus-Therian', 'King\'s Rock', 'Razor Fang'],
		restricted: ['Acupressure', 'Belly Drum', 'Chatter', 'Extreme Speed', 'Geomancy', 'Lovely Kiss', 'Shell Smash', 'Shift Gear', 'Spore', 'Thousand Arrows'],
	},

	// Randomized Metas
	///////////////////////////////////////////////////////////////////

	{
		section: "Luckless Randomized Metas",
		column: 2,
	},
	{
		name: "[Gen 7] Luckless Random Battle",

		mod: 'gen7luckless',
		team: 'random',
		ruleset: ['Obtainable', 'HP Percentage Mod', 'Cancel Mod'],
	},
	{
		name: "[Gen 7] Luckless Battle Factory",

		mod: 'gen7luckless',
		team: 'randomFactory',
		ruleset: ['Obtainable', 'Team Preview', 'HP Percentage Mod', 'Cancel Mod', 'Mega Rayquaza Clause'],
	},
	{
		name: "[Gen 7] Luckless BSS Factory",

		mod: 'gen7luckless',
		team: 'randomBSSFactory',
		ruleset: ['Flat Rules'],
	},
	{
		name: "[Gen 7] Luckless Hackmons Cup",

		mod: 'gen7luckless',
		team: 'randomHC',
		ruleset: ['HP Percentage Mod', 'Cancel Mod'],
	},
];

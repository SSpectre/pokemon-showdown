export const Items: {[k: string]: ModdedItemData} = {
	abomasite: {
		inherit: true,
		isNonstandard: "Past",
	},
	absolite: {
		inherit: true,
		isNonstandard: "Past",
	},
	aerodactylite: {
		inherit: true,
		isNonstandard: "Past",
	},
	aggronite: {
		inherit: true,
		isNonstandard: "Past",
	},
	aguavberry: {
		inherit: true,
		onEat(pokemon) {
			this.heal(pokemon.baseMaxhp * 0.33);
			if (pokemon.getNature().minus === 'spd') {
				pokemon.addVolatile('confusion');
			}
		},
	},
	alakazite: {
		inherit: true,
		isNonstandard: "Past",
	},
	altarianite: {
		inherit: true,
		isNonstandard: "Past",
	},
	aloraichiumz: {
		inherit: true,
		isNonstandard: "Past",
	},
	ampharosite: {
		inherit: true,
		isNonstandard: "Past",
	},
	armorfossil: {
		inherit: true,
		isNonstandard: "Past",
	},
	audinite: {
		inherit: true,
		isNonstandard: "Past",
	},
	banettite: {
		inherit: true,
		isNonstandard: "Past",
	},
	beedrillite: {
		inherit: true,
		isNonstandard: "Past",
	},
	belueberry: {
		inherit: true,
		isNonstandard: "Past",
	},
	berrysweet: {
		name: "Berry Sweet",
		spritenum: 706,
		fling: {
			basePower: 10,
		},
		num: 1111,
		gen: 8,
	},
	blastoisinite: {
		inherit: true,
		isNonstandard: "Past",
	},
	blazikenite: {
		inherit: true,
		isNonstandard: "Past",
	},
	blueorb: {
		inherit: true,
		isNonstandard: "Past",
	},
	blunderpolicy: {
		name: "Blunder Policy",
		spritenum: 716,
		fling: {
			basePower: 80,
		},
		// Item activation located in scripts.js
		num: 1121,
		gen: 8,
	},
	buggem: {
		inherit: true,
		isNonstandard: "Past",
	},
	buginiumz: {
		inherit: true,
		isNonstandard: "Past",
	},
	cameruptite: {
		inherit: true,
		isNonstandard: "Past",
	},
	charizarditex: {
		inherit: true,
		isNonstandard: "Past",
	},
	charizarditey: {
		inherit: true,
		isNonstandard: "Past",
	},
	chippedpot: {
		name: "Chipped Pot",
		spritenum: 720,
		fling: {
			basePower: 80,
		},
		num: 1254,
		gen: 8,
	},
	clawfossil: {
		inherit: true,
		isNonstandard: "Past",
	},
	cloversweet: {
		name: "Clover Sweet",
		spritenum: 707,
		fling: {
			basePower: 10,
		},
		num: 1112,
		gen: 8,
	},
	cornnberry: {
		inherit: true,
		isNonstandard: "Past",
	},
	coverfossil: {
		inherit: true,
		isNonstandard: "Past",
	},
	crackedpot: {
		name: "Cracked Pot",
		spritenum: 719,
		fling: {
			basePower: 80,
		},
		num: 1253,
		gen: 8,
	},
	darkgem: {
		inherit: true,
		isNonstandard: "Past",
	},
	darkiniumz: {
		inherit: true,
		isNonstandard: "Past",
	},
	decidiumz: {
		inherit: true,
		isNonstandard: "Past",
	},
	diancite: {
		inherit: true,
		isNonstandard: "Past",
	},
	domefossil: {
		inherit: true,
		isNonstandard: "Past",
	},
	dracoplate: {
		inherit: true,
		isNonstandard: "Past",
	},
	dragongem: {
		inherit: true,
		isNonstandard: "Past",
	},
	dragoniumz: {
		inherit: true,
		isNonstandard: "Past",
	},
	dreadplate: {
		inherit: true,
		isNonstandard: "Past",
	},
	durinberry: {
		inherit: true,
		isNonstandard: "Past",
	},
	earthplate: {
		inherit: true,
		isNonstandard: "Past",
	},
	eeviumz: {
		inherit: true,
		isNonstandard: "Past",
	},
	electricgem: {
		inherit: true,
		isNonstandard: "Past",
	},
	electriumz: {
		inherit: true,
		isNonstandard: "Past",
	},
	ejectpack: {
		name: "Eject Pack",
		spritenum: 714,
		fling: {
			basePower: 50,
		},
		onAfterBoost(boost, target, source, effect) {
			if (this.activeMove?.id === 'partingshot') return;
			let eject = false;
			let i: BoostID;
			for (i in boost) {
				if (boost[i]! < 0) {
					eject = true;
				}
			}
			if (eject) {
				if (target.hp) {
					if (!this.canSwitch(target.side)) return;
					for (const pokemon of this.getAllActive()) {
						if (pokemon.switchFlag === true) return;
					}
					if (target.useItem()) target.switchFlag = true;
				}
			}
		},
		num: 1119,
		gen: 8,
	},
	fairiumz: {
		inherit: true,
		isNonstandard: "Past",
	},
	fairygem: {
		inherit: true,
		isNonstandard: "Past",
	},
	fightinggem: {
		inherit: true,
		isNonstandard: "Past",
	},
	fightiniumz: {
		inherit: true,
		isNonstandard: "Past",
	},
	figyberry: {
		inherit: true,
		onEat(pokemon) {
			this.heal(pokemon.baseMaxhp * 0.33);
			if (pokemon.getNature().minus === 'atk') {
				pokemon.addVolatile('confusion');
			}
		},
	},
	firegem: {
		inherit: true,
		isNonstandard: "Past",
	},
	firiumz: {
		inherit: true,
		isNonstandard: "Past",
	},
	fistplate: {
		inherit: true,
		isNonstandard: "Past",
	},
	flameplate: {
		inherit: true,
		isNonstandard: "Past",
	},
	flowersweet: {
		name: "Flower Sweet",
		spritenum: 708,
		fling: {
			basePower: 0,
		},
		num: 1113,
		gen: 8,
	},
	flyinggem: {
		inherit: true,
		isNonstandard: "Past",
	},
	flyiniumz: {
		inherit: true,
		isNonstandard: "Past",
	},
	fossilizedbird: {
		name: "Fossilized Bird",
		spritenum: 700,
		fling: {
			basePower: 100,
		},
		num: 1105,
		gen: 8,
	},
	fossilizeddino: {
		name: "Fossilized Dino",
		spritenum: 703,
		fling: {
			basePower: 100,
		},
		num: 1108,
		gen: 8,
	},
	fossilizeddrake: {
		name: "Fossilized Drake",
		spritenum: 702,
		fling: {
			basePower: 100,
		},
		num: 1107,
		gen: 8,
	},
	fossilizedfish: {
		name: "Fossilized Fish",
		spritenum: 701,
		fling: {
			basePower: 100,
		},
		num: 1106,
		gen: 8,
	},
	galaricacuff: {
		name: "Galarica Cuff",
		spritenum: 739,
		fling: {
			basePower: 30,
		},
		num: 1582,
		gen: 8,
	},
	galaricawreath: {
		name: "Galarica Wreath",
		spritenum: 740,
		fling: {
			basePower: 30,
		},
		num: 1592,
		gen: 8,
	},
	galladite: {
		inherit: true,
		isNonstandard: "Past",
	},
	garchompite: {
		inherit: true,
		isNonstandard: "Past",
	},
	gardevoirite: {
		inherit: true,
		isNonstandard: "Past",
	},
	gengarite: {
		inherit: true,
		isNonstandard: "Past",
	},
	ghostgem: {
		inherit: true,
		isNonstandard: "Past",
	},
	ghostiumz: {
		inherit: true,
		isNonstandard: "Past",
	},
	glalitite: {
		inherit: true,
		isNonstandard: "Past",
	},
	grassgem: {
		inherit: true,
		isNonstandard: "Past",
	},
	grassiumz: {
		inherit: true,
		isNonstandard: "Past",
	},
	groundgem: {
		inherit: true,
		isNonstandard: "Past",
	},
	groundiumz: {
		inherit: true,
		isNonstandard: "Past",
	},
	gyaradosite: {
		inherit: true,
		isNonstandard: "Past",
	},
	heavydutyboots: {
		name: "Heavy-Duty Boots",
		spritenum: 715,
		fling: {
			basePower: 80,
		},
		num: 1120,
		gen: 8,
		// Hazard Immunity implemented in moves.js
	},
	helixfossil: {
		inherit: true,
		isNonstandard: "Past",
	},
	heracronite: {
		inherit: true,
		isNonstandard: "Past",
	},
	houndoominite: {
		inherit: true,
		isNonstandard: "Past",
	},
	iapapaberry: {
		inherit: true,
		onEat(pokemon) {
			this.heal(pokemon.baseMaxhp * 0.33);
			if (pokemon.getNature().minus === 'def') {
				pokemon.addVolatile('confusion');
			}
		},
	},
	icegem: {
		inherit: true,
		isNonstandard: "Past",
	},
	icicleplate: {
		inherit: true,
		isNonstandard: "Past",
	},
	iciumz: {
		inherit: true,
		isNonstandard: "Past",
	},
	inciniumz: {
		inherit: true,
		isNonstandard: "Past",
	},
	insectplate: {
		inherit: true,
		isNonstandard: "Past",
	},
	ironplate: {
		inherit: true,
		isNonstandard: "Past",
	},
	jawfossil: {
		inherit: true,
		isNonstandard: "Past",
	},
	kangaskhanite: {
		inherit: true,
		isNonstandard: "Past",
	},
	kommoniumz: {
		inherit: true,
		isNonstandard: "Past",
	},
	latiasite: {
		inherit: true,
		isNonstandard: "Past",
	},
	latiosite: {
		inherit: true,
		isNonstandard: "Past",
	},
	leek: {
		name: "Leek",
		fling: {
			basePower: 60,
		},
		spritenum: 475,
		onModifyCritRatio(critRatio, user) {
			if (["farfetchd", "sirfetchd"].includes(this.toID(user.baseSpecies.baseSpecies))) {
				return critRatio + 2;
			}
		},
		itemUser: ["Farfetch\u2019d", "Farfetch\u2019d-Galar", "Sirfetch\u2019d"],
		num: 259,
		gen: 8,
	},
	lopunnite: {
		inherit: true,
		isNonstandard: "Past",
	},
	lovesweet: {
		name: "Love Sweet",
		spritenum: 705,
		fling: {
			basePower: 10,
		},
		num: 1110,
		gen: 8,
	},
	lucarionite: {
		inherit: true,
		isNonstandard: "Past",
	},
	luckypunch: {
		inherit: true,
		isNonstandard: "Past",
	},
	lunaliumz: {
		inherit: true,
		isNonstandard: "Past",
	},
	lycaniumz: {
		inherit: true,
		isNonstandard: "Past",
	},
	machobrace: {
		inherit: true,
		isNonstandard: null,
	},
	magoberry: {
		inherit: true,
		onEat(pokemon) {
			this.heal(pokemon.baseMaxhp * 0.33);
			if (pokemon.getNature().minus === 'spe') {
				pokemon.addVolatile('confusion');
			}
		},
	},
	magostberry: {
		inherit: true,
		isNonstandard: "Past",
	},
	mail: {
		inherit: true,
		isNonstandard: "Past",
	},
	manectite: {
		inherit: true,
		isNonstandard: "Past",
	},
	marshadiumz: {
		inherit: true,
		isNonstandard: "Past",
	},
	mawilite: {
		inherit: true,
		isNonstandard: "Past",
	},
	meadowplate: {
		inherit: true,
		isNonstandard: "Past",
	},
	medichamite: {
		inherit: true,
		isNonstandard: "Past",
	},
	metagrossite: {
		inherit: true,
		isNonstandard: "Past",
	},
	mewniumz: {
		inherit: true,
		isNonstandard: "Past",
	},
	mewtwonitex: {
		inherit: true,
		isNonstandard: "Past",
	},
	mewtwonitey: {
		inherit: true,
		isNonstandard: "Past",
	},
	mimikiumz: {
		inherit: true,
		isNonstandard: "Past",
	},
	mindplate: {
		inherit: true,
		isNonstandard: "Past",
	},
	nanabberry: {
		inherit: true,
		isNonstandard: "Past",
	},
	nomelberry: {
		inherit: true,
		isNonstandard: "Past",
	},
	normaliumz: {
		inherit: true,
		isNonstandard: "Past",
	},
	pamtreberry: {
		inherit: true,
		isNonstandard: "Past",
	},
	pidgeotite: {
		inherit: true,
		isNonstandard: "Past",
	},
	pikaniumz: {
		inherit: true,
		isNonstandard: "Past",
	},
	pikashuniumz: {
		inherit: true,
		isNonstandard: "Past",
	},
	pinsirite: {
		inherit: true,
		isNonstandard: "Past",
	},
	plumefossil: {
		inherit: true,
		isNonstandard: "Past",
	},
	poisongem: {
		inherit: true,
		isNonstandard: "Past",
	},
	poisoniumz: {
		inherit: true,
		isNonstandard: "Past",
	},
	primariumz: {
		inherit: true,
		isNonstandard: "Past",
	},
	psychicgem: {
		inherit: true,
		isNonstandard: "Past",
	},
	psychiumz: {
		inherit: true,
		isNonstandard: "Past",
	},
	rabutaberry: {
		inherit: true,
		isNonstandard: "Past",
	},
	razorfang: {
		inherit: true,
		isNonstandard: "Past",
	},
	razzberry: {
		inherit: true,
		isNonstandard: "Past",
	},
	redorb: {
		inherit: true,
		isNonstandard: "Past",
	},
	ribbonsweet: {
		name: "Ribbon Sweet",
		spritenum: 710,
		fling: {
			basePower: 10,
		},
		num: 1115,
		gen: 8,
	},
	rockgem: {
		inherit: true,
		isNonstandard: "Past",
	},
	rockiumz: {
		inherit: true,
		isNonstandard: "Past",
	},
	roomservice: {
		name: "Room Service",
		spritenum: 717,
		fling: {
			basePower: 100,
		},
		onUpdate(pokemon) {
			if (this.field.getPseudoWeather('trickroom')) {
				pokemon.useItem();
			}
		},
		boosts: {
			spe: -1,
		},
		num: 1122,
		gen: 8,
	},
	rootfossil: {
		inherit: true,
		isNonstandard: "Past",
	},
	rustedshield: {
		name: "Rusted Shield",
		spritenum: 699,
		onTakeItem(item, pokemon, source) {
			if ((source && source.baseSpecies.num === 889) || pokemon.baseSpecies.num === 889) {
				return false;
			}
			return true;
		},
		forcedForme: "Zamazenta-Crowned",
		itemUser: ["Zamazenta-Crowned"],
		num: 1104,
		gen: 8,
	},
	rustedsword: {
		name: "Rusted Sword",
		spritenum: 698,
		onTakeItem(item, pokemon, source) {
			if ((source && source.baseSpecies.num === 888) || pokemon.baseSpecies.num === 888) {
				return false;
			}
			return true;
		},
		forcedForme: "Zacian-Crowned",
		itemUser: ["Zacian-Crowned"],
		num: 1103,
		gen: 8,
	},
	sablenite: {
		inherit: true,
		isNonstandard: "Past",
	},
	sailfossil: {
		inherit: true,
		isNonstandard: "Past",
	},
	salamencite: {
		inherit: true,
		isNonstandard: "Past",
	},
	sceptilite: {
		inherit: true,
		isNonstandard: "Past",
	},
	scizorite: {
		inherit: true,
		isNonstandard: "Past",
	},
	sharpedonite: {
		inherit: true,
		isNonstandard: "Past",
	},
	skullfossil: {
		inherit: true,
		isNonstandard: "Past",
	},
	skyplate: {
		inherit: true,
		isNonstandard: "Past",
	},
	slowbronite: {
		inherit: true,
		isNonstandard: "Past",
	},
	snorliumz: {
		inherit: true,
		isNonstandard: "Past",
	},
	solganiumz: {
		inherit: true,
		isNonstandard: "Past",
	},
	spelonberry: {
		inherit: true,
		isNonstandard: "Past",
	},
	splashplate: {
		inherit: true,
		isNonstandard: "Past",
	},
	spookyplate: {
		inherit: true,
		isNonstandard: "Past",
	},
	starsweet: {
		name: "Star Sweet",
		spritenum: 709,
		fling: {
			basePower: 10,
		},
		num: 1114,
		gen: 8,
	},
	steelgem: {
		inherit: true,
		isNonstandard: "Past",
	},
	steeliumz: {
		inherit: true,
		isNonstandard: "Past",
	},
	steelixite: {
		inherit: true,
		isNonstandard: "Past",
	},
	stick: {
		inherit: true,
		isNonstandard: "Past",
	},
	stoneplate: {
		inherit: true,
		isNonstandard: "Past",
	},
	strawberrysweet: {
		name: "Strawberry Sweet",
		spritenum: 704,
		fling: {
			basePower: 10,
		},
		num: 1109,
		gen: 8,
	},
	swampertite: {
		inherit: true,
		isNonstandard: "Past",
	},
	sweetapple: {
		name: "Sweet Apple",
		spritenum: 711,
		fling: {
			basePower: 30,
		},
		num: 1116,
		gen: 8,
	},
	tapuniumz: {
		inherit: true,
		isNonstandard: "Past",
	},
	tartapple: {
		name: "Tart Apple",
		spritenum: 712,
		fling: {
			basePower: 30,
		},
		num: 1117,
		gen: 8,
	},
	throatspray: {
		name: "Throat Spray",
		spritenum: 713,
		fling: {
			basePower: 30,
		},
		onAfterMoveSecondarySelf(target, source, move) {
			if (move.flags['sound']) {
				target.useItem();
			}
		},
		boosts: {
			spa: 1,
		},
		num: 1118,
		gen: 8,
	},
	toxicplate: {
		inherit: true,
		isNonstandard: "Past",
	},
	tr00: {
		name: "TR00",
		fling: {
			basePower: 10,
		},
		spritenum: 721,
		num: 1130,
		gen: 8,
	},
	tr01: {
		name: "TR01",
		fling: {
			basePower: 85,
		},
		spritenum: 721,
		num: 1131,
		gen: 8,
	},
	tr02: {
		name: "TR02",
		fling: {
			basePower: 90,
		},
		spritenum: 730,
		num: 1132,
		gen: 8,
	},
	tr03: {
		name: "TR03",
		fling: {
			basePower: 110,
		},
		spritenum: 731,
		num: 1133,
		gen: 8,
	},
	tr04: {
		name: "TR04",
		fling: {
			basePower: 90,
		},
		spritenum: 731,
		num: 1134,
		gen: 8,
	},
	tr05: {
		name: "TR05",
		fling: {
			basePower: 90,
		},
		spritenum: 735,
		num: 1135,
		gen: 8,
	},
	tr06: {
		name: "TR06",
		fling: {
			basePower: 110,
		},
		spritenum: 735,
		num: 1136,
		gen: 8,
	},
	tr07: {
		name: "TR07",
		fling: {
			basePower: 10,
		},
		spritenum: 722,
		num: 1137,
		gen: 8,
	},
	tr08: {
		name: "TR08",
		fling: {
			basePower: 90,
		},
		spritenum: 733,
		num: 1138,
		gen: 8,
	},
	tr09: {
		name: "TR09",
		fling: {
			basePower: 110,
		},
		spritenum: 733,
		num: 1139,
		gen: 8,
	},
	tr10: {
		name: "TR10",
		fling: {
			basePower: 100,
		},
		spritenum: 725,
		num: 1140,
		gen: 8,
	},
	tr11: {
		name: "TR11",
		fling: {
			basePower: 90,
		},
		spritenum: 734,
		num: 1141,
		gen: 8,
	},
	tr12: {
		name: "TR12",
		fling: {
			basePower: 10,
		},
		spritenum: 734,
		num: 1142,
		gen: 8,
	},
	tr13: {
		name: "TR13",
		fling: {
			basePower: 10,
		},
		spritenum: 721,
		num: 1143,
		gen: 8,
	},
	tr14: {
		name: "TR14",
		fling: {
			basePower: 10,
		},
		spritenum: 721,
		num: 1144,
		gen: 8,
	},
	tr15: {
		name: "TR15",
		fling: {
			basePower: 110,
		},
		spritenum: 730,
		num: 1145,
		gen: 8,
	},
	tr16: {
		name: "TR16",
		fling: {
			basePower: 80,
		},
		spritenum: 731,
		num: 1146,
		gen: 8,
	},
	tr17: {
		name: "TR17",
		fling: {
			basePower: 10,
		},
		spritenum: 734,
		num: 1147,
		gen: 8,
	},
	tr18: {
		name: "TR18",
		fling: {
			basePower: 80,
		},
		spritenum: 727,
		num: 1148,
		gen: 8,
	},
	tr19: {
		name: "TR19",
		fling: {
			basePower: 80,
		},
		spritenum: 721,
		num: 1149,
		gen: 8,
	},
	tr20: {
		name: "TR20",
		fling: {
			basePower: 10,
		},
		spritenum: 721,
		num: 1150,
		gen: 8,
	},
	tr21: {
		name: "TR21",
		fling: {
			basePower: 10,
		},
		spritenum: 722,
		num: 1151,
		gen: 8,
	},
	tr22: {
		name: "TR22",
		fling: {
			basePower: 90,
		},
		spritenum: 724,
		num: 1152,
		gen: 8,
	},
	tr23: {
		name: "TR23",
		fling: {
			basePower: 10,
		},
		spritenum: 725,
		num: 1153,
		gen: 8,
	},
	tr24: {
		name: "TR24",
		fling: {
			basePower: 120,
		},
		spritenum: 736,
		num: 1154,
		gen: 8,
	},
	tr25: {
		name: "TR25",
		fling: {
			basePower: 80,
		},
		spritenum: 734,
		num: 1155,
		gen: 8,
	},
	tr26: {
		name: "TR26",
		fling: {
			basePower: 10,
		},
		spritenum: 721,
		num: 1156,
		gen: 8,
	},
	tr27: {
		name: "TR27",
		fling: {
			basePower: 10,
		},
		spritenum: 721,
		num: 1157,
		gen: 8,
	},
	tr28: {
		name: "TR28",
		fling: {
			basePower: 120,
		},
		spritenum: 727,
		num: 1158,
		gen: 8,
	},
	tr29: {
		name: "TR29",
		fling: {
			basePower: 10,
		},
		spritenum: 721,
		num: 1159,
		gen: 8,
	},
	tr30: {
		name: "TR30",
		fling: {
			basePower: 10,
		},
		spritenum: 721,
		num: 1160,
		gen: 8,
	},
	tr31: {
		name: "TR31",
		fling: {
			basePower: 100,
		},
		spritenum: 729,
		num: 1161,
		gen: 8,
	},
	tr32: {
		name: "TR32",
		fling: {
			basePower: 80,
		},
		spritenum: 737,
		num: 1162,
		gen: 8,
	},
	tr33: {
		name: "TR33",
		fling: {
			basePower: 80,
		},
		spritenum: 728,
		num: 1163,
		gen: 8,
	},
	tr34: {
		name: "TR34",
		fling: {
			basePower: 120,
		},
		spritenum: 734,
		num: 1164,
		gen: 8,
	},
	tr35: {
		name: "TR35",
		fling: {
			basePower: 90,
		},
		spritenum: 721,
		num: 1165,
		gen: 8,
	},
	tr36: {
		name: "TR36",
		fling: {
			basePower: 95,
		},
		spritenum: 730,
		num: 1166,
		gen: 8,
	},
	tr37: {
		name: "TR37",
		fling: {
			basePower: 10,
		},
		spritenum: 737,
		num: 1167,
		gen: 8,
	},
	tr38: {
		name: "TR38",
		fling: {
			basePower: 10,
		},
		spritenum: 734,
		num: 1168,
		gen: 8,
	},
	tr39: {
		name: "TR39",
		fling: {
			basePower: 120,
		},
		spritenum: 722,
		num: 1169,
		gen: 8,
	},
	tr40: {
		name: "TR40",
		fling: {
			basePower: 10,
		},
		spritenum: 734,
		num: 1170,
		gen: 8,
	},
	tr41: {
		name: "TR41",
		fling: {
			basePower: 85,
		},
		spritenum: 730,
		num: 1171,
		gen: 8,
	},
	tr42: {
		name: "TR42",
		fling: {
			basePower: 90,
		},
		spritenum: 721,
		num: 1172,
		gen: 8,
	},
	tr43: {
		name: "TR43",
		fling: {
			basePower: 130,
		},
		spritenum: 730,
		num: 1173,
		gen: 8,
	},
	tr44: {
		name: "TR44",
		fling: {
			basePower: 10,
		},
		spritenum: 734,
		num: 1174,
		gen: 8,
	},
	tr45: {
		name: "TR45",
		fling: {
			basePower: 90,
		},
		spritenum: 731,
		num: 1175,
		gen: 8,
	},
	tr46: {
		name: "TR46",
		fling: {
			basePower: 10,
		},
		spritenum: 729,
		num: 1176,
		gen: 8,
	},
	tr47: {
		name: "TR47",
		fling: {
			basePower: 80,
		},
		spritenum: 736,
		num: 1177,
		gen: 8,
	},
	tr48: {
		name: "TR48",
		fling: {
			basePower: 10,
		},
		spritenum: 722,
		num: 1178,
		gen: 8,
	},
	tr49: {
		name: "TR49",
		fling: {
			basePower: 10,
		},
		spritenum: 734,
		num: 1179,
		gen: 8,
	},
	tr50: {
		name: "TR50",
		fling: {
			basePower: 90,
		},
		spritenum: 732,
		num: 1180,
		gen: 8,
	},
	tr51: {
		name: "TR51",
		fling: {
			basePower: 10,
		},
		spritenum: 736,
		num: 1181,
		gen: 8,
	},
	tr52: {
		name: "TR52",
		fling: {
			basePower: 10,
		},
		spritenum: 729,
		num: 1182,
		gen: 8,
	},
	tr53: {
		name: "TR53",
		fling: {
			basePower: 120,
		},
		spritenum: 722,
		num: 1183,
		gen: 8,
	},
	tr54: {
		name: "TR54",
		fling: {
			basePower: 10,
		},
		spritenum: 724,
		num: 1184,
		gen: 8,
	},
	tr55: {
		name: "TR55",
		fling: {
			basePower: 120,
		},
		spritenum: 730,
		num: 1185,
		gen: 8,
	},
	tr56: {
		name: "TR56",
		fling: {
			basePower: 80,
		},
		spritenum: 722,
		num: 1186,
		gen: 8,
	},
	tr57: {
		name: "TR57",
		fling: {
			basePower: 80,
		},
		spritenum: 724,
		num: 1187,
		gen: 8,
	},
	tr58: {
		name: "TR58",
		fling: {
			basePower: 80,
		},
		spritenum: 737,
		num: 1188,
		gen: 8,
	},
	tr59: {
		name: "TR59",
		fling: {
			basePower: 80,
		},
		spritenum: 732,
		num: 1189,
		gen: 8,
	},
	tr60: {
		name: "TR60",
		fling: {
			basePower: 80,
		},
		spritenum: 727,
		num: 1190,
		gen: 8,
	},
	tr61: {
		name: "TR61",
		fling: {
			basePower: 90,
		},
		spritenum: 727,
		num: 1191,
		gen: 8,
	},
	tr62: {
		name: "TR62",
		fling: {
			basePower: 85,
		},
		spritenum: 736,
		num: 1192,
		gen: 8,
	},
	tr63: {
		name: "TR63",
		fling: {
			basePower: 80,
		},
		spritenum: 726,
		num: 1193,
		gen: 8,
	},
	tr64: {
		name: "TR64",
		fling: {
			basePower: 120,
		},
		spritenum: 722,
		num: 1194,
		gen: 8,
	},
	tr65: {
		name: "TR65",
		fling: {
			basePower: 90,
		},
		spritenum: 732,
		num: 1195,
		gen: 8,
	},
	tr66: {
		name: "TR66",
		fling: {
			basePower: 120,
		},
		spritenum: 723,
		num: 1196,
		gen: 8,
	},
	tr67: {
		name: "TR67",
		fling: {
			basePower: 90,
		},
		spritenum: 725,
		num: 1197,
		gen: 8,
	},
	tr68: {
		name: "TR68",
		fling: {
			basePower: 10,
		},
		spritenum: 737,
		num: 1198,
		gen: 8,
	},
	tr69: {
		name: "TR69",
		fling: {
			basePower: 80,
		},
		spritenum: 734,
		num: 1199,
		gen: 8,
	},
	tr70: {
		name: "TR70",
		fling: {
			basePower: 80,
		},
		spritenum: 729,
		num: 1200,
		gen: 8,
	},
	tr71: {
		name: "TR71",
		fling: {
			basePower: 130,
		},
		spritenum: 732,
		num: 1201,
		gen: 8,
	},
	tr72: {
		name: "TR72",
		fling: {
			basePower: 120,
		},
		spritenum: 732,
		num: 1202,
		gen: 8,
	},
	tr73: {
		name: "TR73",
		fling: {
			basePower: 120,
		},
		spritenum: 724,
		num: 1203,
		gen: 8,
	},
	tr74: {
		name: "TR74",
		fling: {
			basePower: 80,
		},
		spritenum: 729,
		num: 1204,
		gen: 8,
	},
	tr75: {
		name: "TR75",
		fling: {
			basePower: 100,
		},
		spritenum: 726,
		num: 1205,
		gen: 8,
	},
	tr76: {
		name: "TR76",
		fling: {
			basePower: 10,
		},
		spritenum: 726,
		num: 1206,
		gen: 8,
	},
	tr77: {
		name: "TR77",
		fling: {
			basePower: 10,
		},
		spritenum: 732,
		num: 1207,
		gen: 8,
	},
	tr78: {
		name: "TR78",
		fling: {
			basePower: 95,
		},
		spritenum: 724,
		num: 1208,
		gen: 8,
	},
	tr79: {
		name: "TR79",
		fling: {
			basePower: 10,
		},
		spritenum: 729,
		num: 1209,
		gen: 8,
	},
	tr80: {
		name: "TR80",
		fling: {
			basePower: 10,
		},
		spritenum: 733,
		num: 1210,
		gen: 8,
	},
	tr81: {
		name: "TR81",
		fling: {
			basePower: 95,
		},
		spritenum: 737,
		num: 1211,
		gen: 8,
	},
	tr82: {
		name: "TR82",
		fling: {
			basePower: 20,
		},
		spritenum: 734,
		num: 1212,
		gen: 8,
	},
	tr83: {
		name: "TR83",
		fling: {
			basePower: 10,
		},
		spritenum: 734,
		num: 1213,
		gen: 8,
	},
	tr84: {
		name: "TR84",
		fling: {
			basePower: 80,
		},
		spritenum: 731,
		num: 1214,
		gen: 8,
	},
	tr85: {
		name: "TR85",
		fling: {
			basePower: 10,
		},
		spritenum: 721,
		num: 1215,
		gen: 8,
	},
	tr86: {
		name: "TR86",
		fling: {
			basePower: 90,
		},
		spritenum: 733,
		num: 1216,
		gen: 8,
	},
	tr87: {
		name: "TR87",
		fling: {
			basePower: 80,
		},
		spritenum: 725,
		num: 1217,
		gen: 8,
	},
	tr88: {
		name: "TR88",
		fling: {
			basePower: 10,
		},
		spritenum: 730,
		num: 1218,
		gen: 8,
	},
	tr89: {
		name: "TR89",
		fling: {
			basePower: 110,
		},
		spritenum: 723,
		num: 1219,
		gen: 8,
	},
	tr90: {
		name: "TR90",
		fling: {
			basePower: 90,
		},
		spritenum: 738,
		num: 1220,
		gen: 8,
	},
	tr91: {
		name: "TR91",
		fling: {
			basePower: 10,
		},
		spritenum: 724,
		num: 1221,
		gen: 8,
	},
	tr92: {
		name: "TR92",
		fling: {
			basePower: 80,
		},
		spritenum: 738,
		num: 1222,
		gen: 8,
	},
	tr93: {
		name: "TR93",
		fling: {
			basePower: 85,
		},
		spritenum: 737,
		num: 1223,
		gen: 8,
	},
	tr94: {
		name: "TR94",
		fling: {
			basePower: 95,
		},
		spritenum: 725,
		num: 1224,
		gen: 8,
	},
	tr95: {
		name: "TR95",
		fling: {
			basePower: 80,
		},
		spritenum: 737,
		num: 1225,
		gen: 8,
	},
	tr96: {
		name: "TR96",
		fling: {
			basePower: 90,
		},
		spritenum: 727,
		num: 1226,
		gen: 8,
	},
	tr97: {
		name: "TR97",
		fling: {
			basePower: 85,
		},
		spritenum: 734,
		num: 1227,
		gen: 8,
	},
	tr98: {
		name: "TR98",
		fling: {
			basePower: 85,
		},
		spritenum: 731,
		num: 1228,
		gen: 8,
	},
	tr99: {
		name: "TR99",
		fling: {
			basePower: 80,
		},
		spritenum: 722,
		num: 1229,
		gen: 8,
	},
	tyranitarite: {
		inherit: true,
		isNonstandard: "Past",
	},
	ultranecroziumz: {
		inherit: true,
		isNonstandard: "Past",
	},
	utilityumbrella: {
		name: "Utility Umbrella",
		spritenum: 718,
		fling: {
			basePower: 60,
		},
		// Implemented in statuses.js, moves.js, and abilities.js
		num: 1123,
		gen: 8,
	},
	venusaurite: {
		inherit: true,
		isNonstandard: "Past",
	},
	watergem: {
		inherit: true,
		isNonstandard: "Past",
	},
	wateriumz: {
		inherit: true,
		isNonstandard: "Past",
	},
	watmelberry: {
		inherit: true,
		isNonstandard: "Past",
	},
	wepearberry: {
		inherit: true,
		isNonstandard: "Past",
	},
	wikiberry: {
		inherit: true,
		onEat(pokemon) {
			this.heal(pokemon.baseMaxhp * 0.33);
			if (pokemon.getNature().minus === 'spa') {
				pokemon.addVolatile('confusion');
			}
		},
	},
	zapplate: {
		inherit: true,
		isNonstandard: "Past",
	},
};

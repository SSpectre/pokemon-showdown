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
	clawfossil: {
		inherit: true,
		isNonstandard: "Past",
	},
	cornnberry: {
		inherit: true,
		isNonstandard: "Past",
	},
	coverfossil: {
		inherit: true,
		isNonstandard: "Past",
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
	flyinggem: {
		inherit: true,
		isNonstandard: "Past",
	},
	flyiniumz: {
		inherit: true,
		isNonstandard: "Past",
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
	lopunnite: {
		inherit: true,
		isNonstandard: "Past",
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
	rockgem: {
		inherit: true,
		isNonstandard: "Past",
	},
	rockiumz: {
		inherit: true,
		isNonstandard: "Past",
	},
	rootfossil: {
		inherit: true,
		isNonstandard: "Past",
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
	swampertite: {
		inherit: true,
		isNonstandard: "Past",
	},
	tapuniumz: {
		inherit: true,
		isNonstandard: "Past",
	},
	toxicplate: {
		inherit: true,
		isNonstandard: "Past",
	},
	tyranitarite: {
		inherit: true,
		isNonstandard: "Past",
	},
	ultranecroziumz: {
		inherit: true,
		isNonstandard: "Past",
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

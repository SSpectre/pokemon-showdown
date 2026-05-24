import {Scripts} from "./scripts";

export const Abilities: {[k: string]: ModdedAbilityData} = {
	angerpoint: {
		inherit: true,
		desc: "If this Pokemon, but not its substitute, is struck by a critical hit, its Attack is raised by 4 stages times the move's critical hit stage.",
		shortDesc: "When hit, Attack raises 4 stages times the critical hit stage of the incoming move.",
		onHit(target, source, move) {
			if (!target.hp) return;
			if (move?.effectType === 'Move' && Scripts.actions?.critStage! > 0 && target.getMoveHitData(move).crit) {
				target.setBoost({atk: target.boosts.atk + 4 * Scripts.actions?.critStage!});
				this.add('-setboost', target, 'atk', target.boosts.atk, '[from] ability: Anger Point');
			}
		},
	},
	baddreams: {
		inherit: true,
		desc: "Causes sleeping adjacent opposing Pokemon to lose up to 1/8 of their maximum HP, rounded down and scaled with sleep severity, at the end of each turn.",
		shortDesc: "Sleeping adjacent foes lose 1/8 of their max HP each turn, scaled with sleep severity.",
		onResidual(pokemon) {
			if (!pokemon.hp) return;
			for (const target of pokemon.foes()) {
				if (target.hasAbility('comatose')) {
					this.damage(target.baseMaxhp / 8);
				}
				if (target.status === 'all') {
					this.damage((target.baseMaxhp / 8) * (target.statusState.severity / 500), target, pokemon);
				}
				if (target.status === 'aff') {
					this.damage((target.baseMaxhp / 8) * (target.statusState.severity / 273), target, pokemon);
				}
				if (target.status === 'slp') {
					this.damage((target.baseMaxhp / 8) * (target.statusState.severity / 100), target, pokemon);
				}
			}
		},
	},
	chlorophyll: {
		inherit: true,
		desc: "If Sunny Day is active, this Pokemon's Speed is doubled.",
		},
	comatose: {
		inherit: true,
		desc: "This Pokemon cannot be statused, and is considered to have 100-severity sleep. Moongeist Beam, Sunsteel Strike, and the Mold Breaker, Teravolt, and Turboblaze Abilities cannot ignore this Ability.",
		shortDesc: "This Pokemon cannot be statused, and is considered to have 100-severity sleep.",
		},
	cursedbody: {
		inherit: true,
		desc: "If this Pokemon is hit by an attack, the move will be disabled with 30 severity unless one of the attacker's moves is already disabled.",
		shortDesc: "If this Pokemon is hit by an attack, the move will be disabled with 30 severity.",
		onDamagingHit(damage, target, source, move) {
			if (source.volatiles['disable']) return;
			if (!move.isMax && !move.isFutureMove && move.id !== 'struggle') {
				Scripts.severity = 100 - 100 * Math.pow(0.7, move.hit);
				source.addVolatile('disable', this.effectState.target);
			}
		},
	},
	cutecharm: {
		inherit: true,
		desc: "A Pokemon making contact with this Pokemon will become infatuated with 30 severity if it is of the opposite gender.",
		shortDesc: "Pokemon of the opposite gender become infatuated with 30 severity if they make contact.",
		onDamagingHit(damage, target, source, move) {
			if (this.checkMoveMakesContact(move, source, target)) {
				Scripts.severity = 100 - 100 * Math.pow(0.7, move.hit);
				source.addVolatile('attract', this.effectState.target);
			}
		},
	},
	damp: {
		inherit: true,
		desc: "While this Pokemon is active, Explosion, Mind Blown, Self-Destruct, and the Aftermath Ability are prevented from having an effect.",
		shortDesc: "Prevents Explosion/Mind Blown/Self-Destruct/Aftermath while this Pokemon is active.",
		},
	disguise: {
		inherit: true,
		desc: "If this Pokemon is a Mimikyu, the first hit it takes in battle deals 0 neutral damage. Its disguise is then broken and it changes to Busted Form. Confusion damage also breaks the disguise.",
		shortDesc: "(Mimikyu only) First hit deals 0 damage, breaks disguise.",
		},
	dryskin: {
		inherit: true,
		desc: "This Pokemon is immune to Water-type moves and restores 1/4 of its maximum HP, rounded down, when hit by a Water-type move. The power of Fire-type moves is multiplied by 1.25 when used on this Pokemon. At the end of each turn, this Pokemon restores 1/8 of its maximum HP, rounded down, if the weather is Rain Dance, and loses 1/8 of its maximum HP, rounded down, if the weather is Sunny Day.",
		},
	earlybird: {
		inherit: true,
		shortDesc: "The severity of sleep is halved for this Pokemon.",
	},
	effectspore: {
		inherit: true,
		desc: "Pokemon making contact with this Pokemon will be affected with 30 severity, which combines the effects of poison, paralysis, and asleep at 10 severity.",
		shortDesc: "Affected with 30 severity on others making contact with this Pokemon.",
		onDamagingHit(damage, target, source, move) {
			if (this.checkMoveMakesContact(move, source, target) && source.runStatusImmunity('powder')) {
				Scripts.severity = 100 - 100 * Math.pow(0.7, move.hit);
				source.trySetStatus('aff', target);
			}
		},
	},
	flamebody: {
		inherit: true,
		shortDesc: "Pokemon making contact with this Pokemon will be burned with 30 severity.",
		onDamagingHit(damage, target, source, move) {
			if (this.checkMoveMakesContact(move, source, target)) {
				Scripts.severity = 100 - 100 * Math.pow(0.7, move.hit);
				source.trySetStatus('brn', target);
			}
		},
	},
	flareboost: {
		inherit: true,
		desc: "While this Pokemon is burned, the power of its special attacks increases, up to 1.5x at 100 severity.",
		shortDesc: "While this Pokemon is burned, its special attack power increases up to x1.5.",
		onBasePower(basePower, attacker, defender, move) {
			if (move.category === 'Special') {
				if (attacker.status === 'brn') {
					return this.chainModify(1 + 0.5 * attacker.statusState.severity / 100);
				} else if (attacker.status === 'tri') {
					return this.chainModify(1 + 0.5 * attacker.statusState.severity / 300);
				} else if (attacker.status === 'all') {
					return this.chainModify(1 + 0.5 * attacker.statusState.severity / 500);
				}
			}
		},
	},
	flowergift: {
		inherit: true,
		desc: "If this Pokemon is a Cherrim and Sunny Day is active, it changes to Sunshine Form and the Attack and Special Defense of it and its allies are multiplied by 1.5.",
		},
	forecast: {
		inherit: true,
		desc: "If this Pokemon is a Castform, its type changes to the current weather condition's type, except Sandstorm.",
		},
	guts: {
		inherit: true,
		desc: "If this Pokemon has a non-volatile status condition, its Attack is increased, up to x1.5 at 100 severity; burn's physical damage halving is ignored.",
		shortDesc: "If this Pokemon is statused, its Attack is up to 1.5x; ignores burn damage reduction.",
		onModifyAtk(atk, pokemon) {
			if (pokemon.status) {
				return this.chainModify(1 + 0.5 * pokemon.statusState.severity / 100);
			}
		},
	},
	harvest: {
		inherit: true,
		desc: "If the last item this Pokemon used is a Berry, it will be restored at the end of next turn. If Sunny Day is active, it is restored at the end of the current turn.",
		shortDesc: "If last item used is a Berry, restore it next turn. Restores current turn in Sun.",
		onEatItem(item, pokemon) {
			pokemon.abilityState.eatenTurns = 0;
		},
		onResidual(pokemon) {
			if (this.dex.items.get(pokemon.lastItem).isBerry && !pokemon.usedItemThisTurn) {
				pokemon.abilityState.eatenTurns++;
			}
			if (this.field.isWeather(['sunnyday', 'desolateland']) || pokemon.abilityState.eatenTurns >= 2) {
				if (pokemon.hp && !pokemon.item && this.dex.items.get(pokemon.lastItem).isBerry) {
					pokemon.setItem(pokemon.lastItem);
					pokemon.lastItem = '';
					this.add('-item', pokemon, pokemon.getItem(), '[from] ability: Harvest');
				}
			}
		},
	},
	heatproof: {
		inherit: true,
		onDamage(damage, target, source, effect) {
			if (effect && (effect.id === 'brn' || effect.id === 'tri' || effect.id === 'all')) {
				return damage / 2;
			}
		},
	},
	hydration: {
		inherit: true,
		desc: "This Pokemon has its non-volatile status condition cured at the end of each turn if Rain Dance is active.",
		},
	innerfocus: {
		inherit: true,
		shortDesc: "This Pokemon cannot be made to flinch.",
		},
	intimidate: {
		inherit: true,
		desc: "On switch-in, this Pokemon lowers the Attack of adjacent opposing Pokemon by 1 stage. Pokemon behind a substitute are immune.",
		},
	leafguard: {
		inherit: true,
		desc: "If Sunny Day is active, this Pokemon cannot gain a non-volatile status condition and Rest will fail for it.",
		},
	marvelscale: {
		inherit: true,
		desc: "If this Pokemon has a non-volatile status condition, its Defense is increased, up to x1.5 at 100 severity.",
		shortDesc: "If this Pokemon is statused, its Defense is increased, up to x1.5 at 100 severity.",
		onModifyDef(def, pokemon) {
			if (pokemon.status) {
				return this.chainModify(1 + 0.5 * pokemon.statusState.severity / 100);
			}
		},
	},
	merciless: {
		inherit: true,
		shortDesc: "This Pokemon's critical hit stage increases with the target's poison severity.",
		onModifyCritRatio(critRatio, source, target) {
			if (target && ['psn', 'tox'].includes(target.status)) return Math.floor(5 * target.statusState.severity / 100);
			else if (target.status === 'aff') return Math.ceil(5 * target.statusState.severity / 333);
			else if (target.status === 'all') return Math.ceil(5 * target.statusState.severity / 500);
		},
	},
	moldbreaker: {
		inherit: true,
		desc: "This Pokemon's moves and their effects ignore certain Abilities of other Pokemon. The Abilities that can be negated are Aroma Veil, Aura Break, Battle Armor, Big Pecks, Bulletproof, Clear Body, Contrary, Damp, Dark Aura, Dazzling, Disguise, Dry Skin, Fairy Aura, Filter, Flash Fire, Flower Gift, Flower Veil, Fluffy, Friend Guard, Fur Coat, Grass Pelt, Heatproof, Heavy Metal, Hyper Cutter, Immunity, Inner Focus, Insomnia, Keen Eye, Leaf Guard, Levitate, Light Metal, Lightning Rod, Limber, Magic Bounce, Magma Armor, Marvel Scale, Motor Drive, Multiscale, Oblivious, Overcoat, Own Tempo, Queenly Majesty, Sand Veil, Sap Sipper, Shell Armor, Shield Dust, Simple, Snow Cloak, Solid Rock, Soundproof, Sticky Hold, Storm Drain, Sturdy, Suction Cups, Sweet Veil, Tangled Feet, Telepathy, Thick Fat, Unaware, Vital Spirit, Volt Absorb, Water Absorb, Water Bubble, Water Veil, White Smoke, Wonder Guard, and Wonder Skin. This affects every other Pokemon on the field, whether or not it is a target of this Pokemon's move, and whether or not their Ability is beneficial to this Pokemon.",
		},
	moody: {
		inherit: true,
		desc: "This Pokemon has all of its stats raised by 1/7 at the end of each turn.",
		shortDesc: "This Pokemon has all of its stats raised by 1/7 at the end of each turn.",
		// desc: "This Pokemon has a random stat raised by 2 stages and another stat lowered by 1 stage at the end of each turn.",
		// shortDesc: "Raises a random stat by 2 and lowers another stat by 1 at the end of each turn.",
		onResidual(pokemon) {
			const stats: BoostID[] = [];
			let statPlus: BoostID;
			for (statPlus in pokemon.boosts) {
				if (pokemon.boosts[statPlus] < 6) {
					stats.push(statPlus);
				}
			}
			if (stats.length) {
				for (const i of stats) {
					const boost: SparseBoostsTable = {};
					boost[i] = 0.14;
					this.boost(boost);
				}
			}
		},
	},
	mummy: {
		inherit: true,
		desc: "Pokemon making contact with this Pokemon have their Ability changed to Mummy. Does not affect a Pokemon which already has Mummy or the Abilities Battle Bond, Comatose, Disguise, Multitype, Power Construct, RKS System, Schooling, Shields Down, Stance Change, and Zen Mode.",
		},
	noguard: {
		inherit: true,
		shortDesc: "Every move used by or against this Pokemon has perfect accuracy.",
		},
	oblivious: {
		inherit: true,
		desc: "This Pokemon cannot be infatuated or taunted. Gaining this Ability while affected cures it.",
		shortDesc: "This Pokemon cannot be infatuated or taunted.",
		},
	owntempo: {
		inherit: true,
		desc: "This Pokemon cannot be confused. Gaining this Ability while confused cures it.",
		shortDesc: "This Pokemon cannot be confused.",
		},
	poisonheal: {
		inherit: true,
		desc: "If this Pokemon is poisoned, it restores up to 1/8 of its maximum HP, rounded down and scaled with poison severity, at the end of each turn instead of losing HP.",
		shortDesc: "This Pokemon is healed by up to 1/8 of its max HP each turn when poisoned; no HP loss.",
		onDamage(damage, target, source, effect) {
			if (effect.id === 'psn' || effect.id === 'tox') {
				this.heal(target.baseMaxhp * target.statusState.severity / 800);
				return false;
			} else if (effect.id === 'aff') {
				this.heal(target.baseMaxhp * target.statusState.severity / 2667);
			} else if (effect.id === 'all') {
				this.heal(target.baseMaxhp * target.statusState.severity / 4500);
			}
		},
	},
	poisonpoint: {
		inherit: true,
		shortDesc: "Pokemon making contact with this Pokemon will be poisoned with 30 severity.",
		onDamagingHit(damage, target, source, move) {
			if (this.checkMoveMakesContact(move, source, target)) {
				Scripts.severity = 100 - 100 * Math.pow(0.7, move.hit);
				source.trySetStatus('psn', target);
			}
		},
	},
	poisontouch: {
		inherit: true,
		shortDesc: "This Pokemon's contact moves cause poison with 30 severity.",
		// upokecenter says this is implemented as an added secondary effect
		onModifyMove(move) {
			if (!move?.flags['contact'] || move.target === 'self') return;
			if (!move.secondaries) {
				move.secondaries = [];
			}
			for (const secondary of move.secondaries) {
				if (secondary.status === 'psn') {
					if (typeof secondary.chance === 'number') secondary.chance = secondary.chance + 30 * (100 - secondary.chance);
					return;
				}
			}
			move.secondaries.push({
				chance: 30,
				status: 'psn',
				ability: this.dex.abilities.get('poisontouch'),
			});
		},
		name: "Poison Touch",
		rating: 2,
		num: 143,
	},
	powerofalchemy: {
		inherit: true,
		desc: "This Pokemon copies the Ability of an ally that faints. Abilities that cannot be copied are \"No Ability\", Battle Bond, Comatose, Disguise, Flower Gift, Forecast, Illusion, Imposter, Multitype, Power Construct, Power of Alchemy, Receiver, RKS System, Schooling, Shields Down, Stance Change, Trace, Wonder Guard, and Zen Mode.",
		},
	quickfeet: {
		inherit: true,
		desc: "If this Pokemon has a non-volatile status condition, its Speed is increased, up to x1.5 at 100 severity.",
		shortDesc: "If this Pokemon is statused, its Speed is up to x1.5; ignores paralysis Speed drop.",
		onModifySpe(spe, pokemon) {
			if (pokemon.status) {
				return this.chainModify(1 + 0.5 * pokemon.statusState.severity / 100);
			}
		},
	},
	raindish: {
		inherit: true,
		desc: "If Rain Dance is active, this Pokemon restores 1/16 of its maximum HP, rounded down, at the end of each turn.",
		},
	rattled: {
		inherit: true,
		desc: "This Pokemon's Speed is raised by 1 stage if hit by a Bug-, Dark-, or Ghost-type attack.",
		shortDesc: "This Pokemon's Speed is raised 1 stage if hit by a Bug-, Dark-, or Ghost-type attack.",
		},
	receiver: {
		inherit: true,
		desc: "This Pokemon copies the Ability of an ally that faints. Abilities that cannot be copied are \"No Ability\", Battle Bond, Comatose, Disguise, Flower Gift, Forecast, Illusion, Imposter, Multitype, Power Construct, Power of Alchemy, Receiver, RKS System, Schooling, Shields Down, Stance Change, Trace, Wonder Guard, and Zen Mode.",
		},
	scrappy: {
		inherit: true,
		desc: "This Pokemon can hit Ghost types with Normal- and Fighting-type moves.",
		shortDesc: "This Pokemon can hit Ghost types with Normal- and Fighting-type moves.",
		},
	serenegrace: {
		inherit: true,
		shortDesc: "This Pokemon's moves have their secondary effect severity doubled.",
		},
	shedskin: {
		inherit: true,
		desc: "This Pokemon has the severity of its non-volatile status condition reduced by 33 at the end of each turn.",
		shortDesc: "This Pokemon has the severity of its status reduced by 33 at the end of each turn.",
		onResidual(pokemon) {
			if (pokemon.hp && pokemon.status) {
				this.debug('shed skin');
				if (pokemon.statusState.severity > 33) {
					const status = pokemon.getStatus();
					const severity = pokemon.statusState.severity - 33;
					pokemon.clearStatus();
					Scripts.severity = severity;
					pokemon.setStatus(status);
				} else {
					this.add('-activate', pokemon, 'ability: Shed Skin');
					pokemon.cureStatus();
				}
			}
		},
	},
	skilllink: {
		inherit: true,
		shortDesc: "This Pokemon's multi-hit attacks always hit five times.",
		},
	solarpower: {
		inherit: true,
		desc: "If Sunny Day is active, this Pokemon's Special Attack is multiplied by 1.5 and it loses 1/8 of its maximum HP, rounded down, at the end of each turn.",
		},
	static: {
		inherit: true,
		shortDesc: "Pokemon making contact with this Pokemon will be paralyzed with 30 severity.",
		onDamagingHit(damage, target, source, move) {
			if (this.checkMoveMakesContact(move, source, target)) {
				Scripts.severity = 100 - 100 * Math.pow(0.7, move.hit);
				source.trySetStatus('par', target);
			}
		},
	},
	steadfast: {
		inherit: true,
		shortDesc: "This Pokemon's Speed is raised by up to 1 stage on flinch, scaled with flinch severity.",
		onTryAddVolatile(target, source, move) {
			if (target.name === 'flinch') {
				// don't need to multiply by severity of flinch because boost() multiplies by severity already
				this.boost({spe: 1});
			}
		},
		onFlinch(pokemon) {},
	},
	stench: {
		inherit: true,
		desc: "This Pokemon's attacks without a flinching effect now cause 10-severity flinch.",
		shortDesc: "This Pokemon's attacks without a flinching effect now cause 10-severity flinch.",
		},
	superluck: {
		inherit: true,
		shortDesc: "This Pokemon's attacks gain +1 critical hit stage.",
		},
	swiftswim: {
		inherit: true,
		desc: "If Rain Dance is active, this Pokemon's Speed is doubled.",
		},
	synchronize: {
		onAfterSetStatus(status, target, source, effect) {
			if (!source || source === target) return;
			if (effect && effect.id === 'toxicspikes') return;
			if (status.id === 'slp' || status.id === 'frz') return;
			this.add('-activate', target, 'ability: Synchronize');
			// Hack to make status-prevention abilities think Synchronize is a status move
			// and show messages when activating against it.
			source.trySetStatus(status, target, {status: status.id, id: 'synchronize'} as Effect);
		},
		name: "Synchronize",
		rating: 2,
		num: 28,
	},
	tangledfeet: {
		inherit: true,
		shortDesc: "If this Pokemon is confused, its evasiveness is increased, up to x2 at 100 severity.",
		onModifyAccuracy(accuracy, target) {
			if (typeof accuracy !== 'number') return;
			if (target?.volatiles['confusion']) {
				this.debug('Tangled Feet - decreasing accuracy');
				return this.chainModify(1 - 0.5 * target?.volatiles['confusion'].severity / 100);
			}
		},
	},
	teravolt: {
		inherit: true,
		desc: "This Pokemon's moves and their effects ignore certain Abilities of other Pokemon. The Abilities that can be negated are Aroma Veil, Aura Break, Battle Armor, Big Pecks, Bulletproof, Clear Body, Contrary, Damp, Dark Aura, Dazzling, Disguise, Dry Skin, Fairy Aura, Filter, Flash Fire, Flower Gift, Flower Veil, Fluffy, Friend Guard, Fur Coat, Grass Pelt, Heatproof, Heavy Metal, Hyper Cutter, Immunity, Inner Focus, Insomnia, Keen Eye, Leaf Guard, Levitate, Light Metal, Lightning Rod, Limber, Magic Bounce, Magma Armor, Marvel Scale, Motor Drive, Multiscale, Oblivious, Overcoat, Own Tempo, Queenly Majesty, Sand Veil, Sap Sipper, Shell Armor, Shield Dust, Simple, Snow Cloak, Solid Rock, Soundproof, Sticky Hold, Storm Drain, Sturdy, Suction Cups, Sweet Veil, Tangled Feet, Telepathy, Thick Fat, Unaware, Vital Spirit, Volt Absorb, Water Absorb, Water Bubble, Water Veil, White Smoke, Wonder Guard, and Wonder Skin. This affects every other Pokemon on the field, whether or not it is a target of this Pokemon's move, and whether or not their Ability is beneficial to this Pokemon.",
		},
	toxicboost: {
		inherit: true,
		desc: "While this Pokemon is poisoned, its Attack increases, up to 1.5x at 100 severity.",
		shortDesc: "While this Pokemon is poisoned, its Attack increases up to x1.5.",
		onBasePower(basePower, attacker, defender, move) {
			if (move.category === 'Physical') {
				if (attacker.status === 'psn' || attacker.status === 'tox') {
					return this.chainModify(1 + 0.5 * attacker.statusState.severity / 100);
				} else if (attacker.status === 'aff') {
					return this.chainModify(1 + 0.5 * attacker.statusState.severity / 333);
				} else if (attacker.status === 'all') {
					return this.chainModify(1 + 0.5 * attacker.statusState.severity / 500);
				}
			}
		},
	},
	trace: {
		inherit: true,
		desc: "On switch-in, or when this Pokemon acquires this ability, this Pokemon copies a random adjacent opposing Pokemon's Ability. However, if one or more adjacent Pokemon has the Ability \"No Ability\", Trace won't copy anything even if there is another valid Ability it could normally copy. Otherwise, if there is no Ability that can be copied at that time, this Ability will activate as soon as an Ability can be copied. Abilities that cannot be copied are the previously mentioned \"No Ability\", as well as Battle Bond, Comatose, Disguise, Flower Gift, Forecast, Illusion, Imposter, Multitype, Power Construct, Power of Alchemy, Receiver, RKS System, Schooling, Shields Down, Stance Change, Trace, and Zen Mode.",
		},
	turboblaze: {
		inherit: true,
		desc: "This Pokemon's moves and their effects ignore certain Abilities of other Pokemon. The Abilities that can be negated are Aroma Veil, Aura Break, Battle Armor, Big Pecks, Bulletproof, Clear Body, Contrary, Damp, Dark Aura, Dazzling, Disguise, Dry Skin, Fairy Aura, Filter, Flash Fire, Flower Gift, Flower Veil, Fluffy, Friend Guard, Fur Coat, Grass Pelt, Heatproof, Heavy Metal, Hyper Cutter, Immunity, Inner Focus, Insomnia, Keen Eye, Leaf Guard, Levitate, Light Metal, Lightning Rod, Limber, Magic Bounce, Magma Armor, Marvel Scale, Motor Drive, Multiscale, Oblivious, Overcoat, Own Tempo, Queenly Majesty, Sand Veil, Sap Sipper, Shell Armor, Shield Dust, Simple, Snow Cloak, Solid Rock, Soundproof, Sticky Hold, Storm Drain, Sturdy, Suction Cups, Sweet Veil, Tangled Feet, Telepathy, Thick Fat, Unaware, Vital Spirit, Volt Absorb, Water Absorb, Water Bubble, Water Veil, White Smoke, Wonder Guard, and Wonder Skin. This affects every other Pokemon on the field, whether or not it is a target of this Pokemon's move, and whether or not their Ability is beneficial to this Pokemon.",
		},
	waterbubble: {
		inherit: true,
		onUpdate(pokemon) {
			if (pokemon.status === 'brn' || pokemon.status === 'tri' || pokemon.status === 'all') {
				this.add('-activate', pokemon, 'ability: Water Bubble');
				pokemon.cureStatus();
			}
		},
	},
	waterveil: {
		inherit: true,
		onUpdate(pokemon) {
			if (pokemon.status === 'brn' || pokemon.status === 'tri' || pokemon.status === 'all') {
				this.add('-activate', pokemon, 'ability: Water Veil');
				pokemon.cureStatus();
			}
		},
	},
};

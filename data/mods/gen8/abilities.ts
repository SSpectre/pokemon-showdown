export const Abilities: {[k: string]: ModdedAbilityData} = {
	asoneglastrier: {
		onPreStart(pokemon) {
			this.add('-ability', pokemon, 'As One');
			this.add('-ability', pokemon, 'Unnerve');
			this.effectState.unnerved = true;
		},
		onEnd() {
			this.effectState.unnerved = false;
		},
		onFoeTryEatItem() {
			return !this.effectState.unnerved;
		},
		onSourceAfterFaint(length, target, source, effect) {
			if (effect && effect.effectType === 'Move') {
				this.boost({atk: length}, source, source, this.dex.abilities.get('chillingneigh'));
			}
		},
		isPermanent: true,
		name: "As One (Glastrier)",
		rating: 3.5,
		num: 266,
	},
	asonespectrier: {
		onPreStart(pokemon) {
			this.add('-ability', pokemon, 'As One');
			this.add('-ability', pokemon, 'Unnerve');
			this.effectState.unnerved = true;
		},
		onEnd() {
			this.effectState.unnerved = false;
		},
		onFoeTryEatItem() {
			return !this.effectState.unnerved;
		},
		onSourceAfterFaint(length, target, source, effect) {
			if (effect && effect.effectType === 'Move') {
				this.boost({spa: length}, source, source, this.dex.abilities.get('grimneigh'));
			}
		},
		isPermanent: true,
		name: "As One (Spectrier)",
		rating: 3.5,
		num: 267,
	},
	ballfetch: {
		name: "Ball Fetch",
		rating: 0,
		num: 237,
	},
	chillingneigh: {
		onSourceAfterFaint(length, target, source, effect) {
			if (effect && effect.effectType === 'Move') {
				this.boost({atk: length}, source);
			}
		},
		name: "Chilling Neigh",
		rating: 3,
		num: 264,
	},
	cottondown: {
		onDamagingHit(damage, target, source, move) {
			let activated = false;
			for (const pokemon of this.getAllActive()) {
				if (pokemon === target || pokemon.fainted) continue;
				if (!activated) {
					this.add('-ability', target, 'Cotton Down');
					activated = true;
				}
				this.boost({spe: -1}, pokemon, target, null, true);
			}
		},
		name: "Cotton Down",
		rating: 2,
		num: 238,
	},
	curiousmedicine: {
		onStart(pokemon) {
			for (const ally of pokemon.adjacentAllies()) {
				ally.clearBoosts();
				this.add('-clearboost', ally, '[from] ability: Curious Medicine', '[of] ' + pokemon);
			}
		},
		name: "Curious Medicine",
		rating: 0,
		num: 261,
	},
	dauntlessshield: {
		onStart(pokemon) {
			this.boost({def: 1}, pokemon);
		},
		name: "Dauntless Shield",
		rating: 3.5,
		num: 235,
	},
	disguise: {
		inherit: true,
		onUpdate(pokemon) {
			if (['mimikyu', 'mimikyutotem'].includes(pokemon.species.id) && this.effectState.busted) {
				const speciesid = pokemon.species.id === 'mimikyutotem' ? 'Mimikyu-Busted-Totem' : 'Mimikyu-Busted';
				pokemon.formeChange(speciesid, this.effect, true);
				this.damage(pokemon.baseMaxhp / 8, pokemon, pokemon, this.dex.species.get(speciesid));
			}
		},
	},
	dragonsmaw: {
		onModifyAtkPriority: 5,
		onModifyAtk(atk, attacker, defender, move) {
			if (move.type === 'Dragon') {
				this.debug('Dragon\'s Maw boost');
				return this.chainModify(1.5);
			}
		},
		onModifySpAPriority: 5,
		onModifySpA(atk, attacker, defender, move) {
			if (move.type === 'Dragon') {
				this.debug('Dragon\'s Maw boost');
				return this.chainModify(1.5);
			}
		},
		name: "Dragon's Maw",
		rating: 3.5,
		num: 263,
	},
	innerfocus: {
		inherit: true,
		rating: 3.5,
		onBoost(boost, target, source, effect) {
			if (effect.id === 'intimidate') {
				delete boost.atk;
				this.add('-fail', target, 'unboost', 'Attack', '[from] ability: Inner Focus', '[of] ' + target);
			}
		},
	},
	intimidate: {
		inherit: true,
		rating: 4,
	},
	gorillatactics: {
		onStart(pokemon) {
			pokemon.abilityState.choiceLock = "";
		},
		onBeforeMove(pokemon, target, move) {
			if (move.isZOrMaxPowered || move.id === 'struggle') return;
			if (pokemon.abilityState.choiceLock && pokemon.abilityState.choiceLock !== move.id) {
				// Fails unless ability is being ignored (these events will not run), no PP lost.
				this.addMove('move', pokemon, move.name);
				this.attrLastMove('[still]');
				this.debug("Disabled by Gorilla Tactics");
				this.add('-fail', pokemon);
				return false;
			}
		},
		onModifyMove(move, pokemon) {
			if (pokemon.abilityState.choiceLock || move.isZOrMaxPowered || move.id === 'struggle') return;
			pokemon.abilityState.choiceLock = move.id;
		},
		onModifyAtkPriority: 1,
		onModifyAtk(atk, pokemon) {
			if (pokemon.volatiles['dynamax']) return;
			// PLACEHOLDER
			this.debug('Gorilla Tactics Atk Boost');
			return this.chainModify(1.5);
		},
		onDisableMove(pokemon) {
			if (!pokemon.abilityState.choiceLock) return;
			if (pokemon.volatiles['dynamax']) return;
			for (const moveSlot of pokemon.moveSlots) {
				if (moveSlot.id !== pokemon.abilityState.choiceLock) {
					pokemon.disableMove(moveSlot.id, false, this.effectState.sourceEffect);
				}
			}
		},
		onEnd(pokemon) {
			pokemon.abilityState.choiceLock = "";
		},
		name: "Gorilla Tactics",
		rating: 4.5,
		num: 255,
	},
	grimneigh: {
		onSourceAfterFaint(length, target, source, effect) {
			if (effect && effect.effectType === 'Move') {
				this.boost({spa: length}, source);
			}
		},
		name: "Grim Neigh",
		rating: 3,
		num: 265,
	},
	gulpmissile: {
		onDamagingHit(damage, target, source, move) {
			if (!source.hp || !source.isActive || target.transformed || target.isSemiInvulnerable()) return;
			if (['cramorantgulping', 'cramorantgorging'].includes(target.species.id)) {
				this.damage(source.baseMaxhp / 4, source, target);
				if (target.species.id === 'cramorantgulping') {
					this.boost({def: -1}, source, target, null, true);
				} else {
					source.trySetStatus('par', target, move);
				}
				target.formeChange('cramorant', move);
			}
		},
		// The Dive part of this mechanic is implemented in Dive's `onTryMove` in moves.ts
		onSourceTryPrimaryHit(target, source, effect) {
			if (
				effect && effect.id === 'surf' && source.hasAbility('gulpmissile') &&
				source.species.name === 'Cramorant' && !source.transformed
			) {
				const forme = source.hp <= source.maxhp / 2 ? 'cramorantgorging' : 'cramorantgulping';
				source.formeChange(forme, effect);
			}
		},
		isPermanent: true,
		name: "Gulp Missile",
		rating: 2.5,
		num: 241,
	},
	hungerswitch: {
		onResidualOrder: 29,
		onResidual(pokemon) {
			if (pokemon.species.baseSpecies !== 'Morpeko' || pokemon.transformed) return;
			const targetForme = pokemon.species.name === 'Morpeko' ? 'Morpeko-Hangry' : 'Morpeko';
			pokemon.formeChange(targetForme);
		},
		name: "Hunger Switch",
		rating: 1,
		num: 258,
	},
	iceface: {
		onStart(pokemon) {
			if (this.field.isWeather('hail') && pokemon.species.id === 'eiscuenoice' && !pokemon.transformed) {
				this.add('-activate', pokemon, 'ability: Ice Face');
				this.effectState.busted = false;
				pokemon.formeChange('Eiscue', this.effect, true);
			}
		},
		onDamagePriority: 1,
		onDamage(damage, target, source, effect) {
			if (
				effect && effect.effectType === 'Move' && effect.category === 'Physical' &&
				target.species.id === 'eiscue' && !target.transformed
			) {
				this.add('-activate', target, 'ability: Ice Face');
				this.effectState.busted = true;
				return 0;
			}
		},
		onCriticalHit(target, type, move) {
			if (!target) return;
			if (move.category !== 'Physical' || target.species.id !== 'eiscue' || target.transformed) return;
			if (target.volatiles['substitute'] && !(move.flags['bypasssub'] || move.infiltrates)) return;
			if (!target.runImmunity(move.type)) return;
			return false;
		},
		onEffectiveness(typeMod, target, type, move) {
			if (!target) return;
			if (move.category !== 'Physical' || target.species.id !== 'eiscue' || target.transformed) return;

			const hitSub = target.volatiles['substitute'] && !move.flags['bypasssub'] && !(move.infiltrates && this.gen >= 6);
			if (hitSub) return;

			if (!target.runImmunity(move.type)) return;
			return 0;
		},
		onUpdate(pokemon) {
			if (pokemon.species.id === 'eiscue' && this.effectState.busted) {
				pokemon.formeChange('Eiscue-Noice', this.effect, true);
			}
		},
		onAnyWeatherStart() {
			const pokemon = this.effectState.target;
			if (!pokemon.hp) return;
			if (this.field.isWeather('hail') && pokemon.species.id === 'eiscuenoice' && !pokemon.transformed) {
				this.add('-activate', pokemon, 'ability: Ice Face');
				this.effectState.busted = false;
				pokemon.formeChange('Eiscue', this.effect, true);
			}
		},
		isBreakable: true,
		isPermanent: true,
		name: "Ice Face",
		rating: 3,
		num: 248,
	},
	icescales: {
		onSourceModifyDamage(damage, source, target, move) {
			if (move.category === 'Special') {
				return this.chainModify(0.5);
			}
		},
		isBreakable: true,
		name: "Ice Scales",
		rating: 4,
		num: 246,
	},
	intrepidsword: {
		onStart(pokemon) {
			this.boost({atk: 1}, pokemon);
		},
		name: "Intrepid Sword",
		rating: 4,
		num: 234,
	},
	libero: {
		onPrepareHit(source, target, move) {
			if (move.hasBounced || move.sourceEffect === 'snatch') return;
			const type = move.type;
			if (type && type !== '???' && source.getTypes().join() !== type) {
				if (!source.setType(type)) return;
				this.add('-start', source, 'typechange', type, '[from] ability: Libero');
			}
		},
		name: "Libero",
		rating: 4.5,
		num: 236,
	},
	mimicry: {
		onStart(pokemon) {
			if (this.field.terrain) {
				pokemon.addVolatile('mimicry');
			} else {
				const types = pokemon.baseSpecies.types;
				if (pokemon.getTypes().join() === types.join() || !pokemon.setType(types)) return;
				this.add('-start', pokemon, 'typechange', types.join('/'), '[from] ability: Mimicry');
				this.hint("Transform Mimicry changes you to your original un-transformed types.");
			}
		},
		onAnyTerrainStart() {
			const pokemon = this.effectState.target;
			delete pokemon.volatiles['mimicry'];
			pokemon.addVolatile('mimicry');
		},
		onEnd(pokemon) {
			delete pokemon.volatiles['mimicry'];
		},
		condition: {
			onStart(pokemon) {
				let newType;
				switch (this.field.terrain) {
				case 'electricterrain':
					newType = 'Electric';
					break;
				case 'grassyterrain':
					newType = 'Grass';
					break;
				case 'mistyterrain':
					newType = 'Fairy';
					break;
				case 'psychicterrain':
					newType = 'Psychic';
					break;
				}
				if (!newType || pokemon.getTypes().join() === newType || !pokemon.setType(newType)) return;
				this.add('-start', pokemon, 'typechange', newType, '[from] ability: Mimicry');
			},
			onUpdate(pokemon) {
				if (!this.field.terrain) {
					const types = pokemon.species.types;
					if (pokemon.getTypes().join() === types.join() || !pokemon.setType(types)) return;
					this.add('-activate', pokemon, 'ability: Mimicry');
					this.add('-end', pokemon, 'typechange', '[silent]');
					pokemon.removeVolatile('mimicry');
				}
			},
		},
		name: "Mimicry",
		rating: 0.5,
		num: 250,
	},
	mirrorarmor: {
		onBoost(boost, target, source, effect) {
			// Don't bounce self stat changes, or boosts that have already bounced
			if (target === source || !boost || effect.id === 'mirrorarmor') return;
			let b: BoostID;
			for (b in boost) {
				if (boost[b]! < 0) {
					if (target.boosts[b] === -6) continue;
					const negativeBoost: SparseBoostsTable = {};
					negativeBoost[b] = boost[b];
					delete boost[b];
					this.add('-ability', target, 'Mirror Armor');
					this.boost(negativeBoost, source, target, null, true);
				}
			}
		},
		isBreakable: true,
		name: "Mirror Armor",
		rating: 2,
		num: 240,
	},
	moody: {
		inherit: true,
		onResidual(pokemon) {
			let stats: BoostID[] = [];
			const boost: SparseBoostsTable = {};
			let statPlus: BoostID;
			for (statPlus in pokemon.boosts) {
				if (statPlus === 'accuracy' || statPlus === 'evasion') continue;
				if (pokemon.boosts[statPlus] < 6) {
					stats.push(statPlus);
				}
			}
			let randomStat: BoostID | undefined = stats.length ? this.sample(stats) : undefined;
			if (randomStat) boost[randomStat] = 2;

			stats = [];
			let statMinus: BoostID;
			for (statMinus in pokemon.boosts) {
				if (statMinus === 'accuracy' || statMinus === 'evasion') continue;
				if (pokemon.boosts[statMinus] > -6 && statMinus !== randomStat) {
					stats.push(statMinus);
				}
			}
			randomStat = stats.length ? this.sample(stats) : undefined;
			if (randomStat) boost[randomStat] = -1;

			this.boost(boost);
		},
	},
	neutralizinggas: {
		// Ability suppression implemented in sim/pokemon.ts:Pokemon#ignoringAbility
		onPreStart(pokemon) {
			this.add('-ability', pokemon, 'Neutralizing Gas');
			pokemon.abilityState.ending = false;
			for (const target of this.getAllActive()) {
				if (target.illusion) {
					this.singleEvent('End', this.dex.abilities.get('Illusion'), target.abilityState, target, pokemon, 'neutralizinggas');
				}
				if (target.volatiles['slowstart']) {
					delete target.volatiles['slowstart'];
					this.add('-end', target, 'Slow Start', '[silent]');
				}
			}
		},
		onEnd(source) {
			for (const pokemon of this.getAllActive()) {
				if (pokemon !== source && pokemon.hasAbility('Neutralizing Gas')) {
					return;
				}
			}
			this.add('-end', source, 'ability: Neutralizing Gas');

			// FIXME this happens before the pokemon switches out, should be the opposite order.
			// Not an easy fix since we cant use a supported event. Would need some kind of special event that
			// gathers events to run after the switch and then runs them when the ability is no longer accessible.
			// (If you're tackling this, do note extreme weathers have the same issue)

			// Mark this pokemon's ability as ending so Pokemon#ignoringAbility skips it
			if (source.abilityState.ending) return;
			source.abilityState.ending = true;
			const sortedActive = this.getAllActive();
			this.speedSort(sortedActive);
			for (const pokemon of sortedActive) {
				if (pokemon !== source) {
					if (pokemon.getAbility().isPermanent) continue; // does not interact with e.g Ice Face, Zen Mode

					// Will be suppressed by Pokemon#ignoringAbility if needed
					this.singleEvent('Start', pokemon.getAbility(), pokemon.abilityState, pokemon);
				}
			}
		},
		name: "Neutralizing Gas",
		rating: 4,
		num: 256,
	},
	oblivious: {
		inherit: true,
		onBoost(boost, target, source, effect) {
			if (effect.id === 'intimidate') {
				delete boost.atk;
				this.add('-fail', target, 'unboost', 'Attack', '[from] ability: Oblivious', '[of] ' + target);
			}
		},
	},
	owntempo: {
		inherit: true,
		onBoost(boost, target, source, effect) {
			if (effect.id === 'intimidate') {
				delete boost.atk;
				this.add('-fail', target, 'unboost', 'Attack', '[from] ability: Own Tempo', '[of] ' + target);
			}
		},
	},
	pastelveil: {
		onStart(pokemon) {
			for (const ally of pokemon.alliesAndSelf()) {
				if (['psn', 'tox'].includes(ally.status)) {
					this.add('-activate', pokemon, 'ability: Pastel Veil');
					ally.cureStatus();
				}
			}
		},
		onUpdate(pokemon) {
			if (['psn', 'tox'].includes(pokemon.status)) {
				this.add('-activate', pokemon, 'ability: Pastel Veil');
				pokemon.cureStatus();
			}
		},
		onAllySwitchIn(pokemon) {
			if (['psn', 'tox'].includes(pokemon.status)) {
				this.add('-activate', this.effectState.target, 'ability: Pastel Veil');
				pokemon.cureStatus();
			}
		},
		onSetStatus(status, target, source, effect) {
			if (!['psn', 'tox'].includes(status.id)) return;
			if ((effect as Move)?.status) {
				this.add('-immune', target, '[from] ability: Pastel Veil');
			}
			return false;
		},
		onAllySetStatus(status, target, source, effect) {
			if (!['psn', 'tox'].includes(status.id)) return;
			if ((effect as Move)?.status) {
				const effectHolder = this.effectState.target;
				this.add('-block', target, 'ability: Pastel Veil', '[of] ' + effectHolder);
			}
			return false;
		},
		isBreakable: true,
		name: "Pastel Veil",
		rating: 2,
		num: 257,
	},
	perishbody: {
		onDamagingHit(damage, target, source, move) {
			if (!this.checkMoveMakesContact(move, source, target)) return;

			let announced = false;
			for (const pokemon of [target, source]) {
				if (pokemon.volatiles['perishsong']) continue;
				if (!announced) {
					this.add('-ability', target, 'Perish Body');
					announced = true;
				}
				pokemon.addVolatile('perishsong');
			}
		},
		name: "Perish Body",
		rating: 1,
		num: 253,
	},
	powerspot: {
		onAllyBasePowerPriority: 22,
		onAllyBasePower(basePower, attacker, defender, move) {
			if (attacker !== this.effectState.target) {
				this.debug('Power Spot boost');
				return this.chainModify([5325, 4096]);
			}
		},
		name: "Power Spot",
		rating: 1,
		num: 249,
	},
	propellertail: {
		onModifyMovePriority: 1,
		onModifyMove(move) {
			// most of the implementation is in Battle#getTarget
			move.tracksTarget = move.target !== 'scripted';
		},
		name: "Propeller Tail",
		rating: 0,
		num: 239,
	},
	punkrock: {
		onBasePowerPriority: 7,
		onBasePower(basePower, attacker, defender, move) {
			if (move.flags['sound']) {
				this.debug('Punk Rock boost');
				return this.chainModify([5325, 4096]);
			}
		},
		onSourceModifyDamage(damage, source, target, move) {
			if (move.flags['sound']) {
				this.debug('Punk Rock weaken');
				return this.chainModify(0.5);
			}
		},
		isBreakable: true,
		name: "Punk Rock",
		rating: 3.5,
		num: 244,
	},
	quickdraw: {
		onFractionalPriorityPriority: -1,
		onFractionalPriority(priority, pokemon, target, move) {
			if (move.category !== "Status" && this.randomChance(3, 10)) {
				this.add('-activate', pokemon, 'ability: Quick Draw');
				return 0.1;
			}
		},
		name: "Quick Draw",
		rating: 2.5,
		num: 259,
	},
	rattled: {
		onDamagingHit(damage, target, source, move) {
			if (['Dark', 'Bug', 'Ghost'].includes(move.type)) {
				this.boost({spe: 1});
			}
		},
		onAfterBoost(boost, target, source, effect) {
			if (effect && effect.id === 'intimidate') {
				this.boost({spe: 1});
			}
		},
		name: "Rattled",
		rating: 1.5,
		num: 155,
	},
	ripen: {
		onTryHeal(damage, target, source, effect) {
			if (!effect) return;
			if (effect.id === 'berryjuice' || effect.id === 'leftovers') {
				this.add('-activate', target, 'ability: Ripen');
			}
			if ((effect as Item).isBerry) return this.chainModify(2);
		},
		onBoost(boost, target, source, effect) {
			if (effect && (effect as Item).isBerry) {
				let b: BoostID;
				for (b in boost) {
					boost[b]! *= 2;
				}
			}
		},
		onSourceModifyDamagePriority: -1,
		onSourceModifyDamage(damage, source, target, move) {
			if (target.abilityState.berryWeaken) {
				target.abilityState.berryWeaken = false;
				return this.chainModify(0.5);
			}
		},
		onTryEatItemPriority: -1,
		onTryEatItem(item, pokemon) {
			this.add('-activate', pokemon, 'ability: Ripen');
		},
		onEatItem(item, pokemon) {
			const weakenBerries = [
				'Babiri Berry', 'Charti Berry', 'Chilan Berry', 'Chople Berry', 'Coba Berry', 'Colbur Berry', 'Haban Berry', 'Kasib Berry', 'Kebia Berry', 'Occa Berry', 'Passho Berry', 'Payapa Berry', 'Rindo Berry', 'Roseli Berry', 'Shuca Berry', 'Tanga Berry', 'Wacan Berry', 'Yache Berry',
			];
			// Record if the pokemon ate a berry to resist the attack
			pokemon.abilityState.berryWeaken = weakenBerries.includes(item.name);
		},
		name: "Ripen",
		rating: 2,
		num: 247,
	},
	sandspit: {
		onDamagingHit(damage, target, source, move) {
			if (this.field.getWeather().id !== 'sandstorm') {
				this.field.setWeather('sandstorm');
			}
		},
		name: "Sand Spit",
		rating: 2,
		num: 245,
	},
	scrappy: {
		inherit: true,
		onBoost(boost, target, source, effect) {
			if (effect.id === 'intimidate') {
				delete boost.atk;
				this.add('-fail', target, 'unboost', 'Attack', '[from] ability: Scrappy', '[of] ' + target);
			}
		},
	},
	screencleaner: {
		onStart(pokemon) {
			let activated = false;
			for (const sideCondition of ['reflect', 'lightscreen', 'auroraveil']) {
				for (const side of [pokemon.side, ...pokemon.side.foeSidesWithConditions()]) {
					if (side.getSideCondition(sideCondition)) {
						if (!activated) {
							this.add('-activate', pokemon, 'ability: Screen Cleaner');
							activated = true;
						}
						side.removeSideCondition(sideCondition);
					}
				}
			}
		},
		name: "Screen Cleaner",
		rating: 2,
		num: 251,
	},
	soundproof: {
		inherit: true,
		onTryHit(target, source, move) {
			if (target !== source && move.flags['sound']) {
				this.add('-immune', target, '[from] ability: Soundproof');
				return null;
			}
		},
	},
	stalwart: {
		onModifyMovePriority: 1,
		onModifyMove(move) {
			// most of the implementation is in Battle#getTarget
			move.tracksTarget = move.target !== 'scripted';
		},
		name: "Stalwart",
		rating: 0,
		num: 242,
	},
	steamengine: {
		onDamagingHit(damage, target, source, move) {
			if (['Water', 'Fire'].includes(move.type)) {
				this.boost({spe: 6});
			}
		},
		name: "Steam Engine",
		rating: 2,
		num: 243,
	},
	steelyspirit: {
		onAllyBasePowerPriority: 22,
		onAllyBasePower(basePower, attacker, defender, move) {
			if (move.type === 'Steel') {
				this.debug('Steely Spirit boost');
				return this.chainModify(1.5);
			}
		},
		name: "Steely Spirit",
		rating: 3.5,
		num: 252,
	},
	technician: {
		inherit: true,
		onBasePowerPriority: 30,
	},
	transistor: {
		onModifyAtkPriority: 5,
		onModifyAtk(atk, attacker, defender, move) {
			if (move.type === 'Electric') {
				this.debug('Transistor boost');
				return this.chainModify(1.5);
			}
		},
		onModifySpAPriority: 5,
		onModifySpA(atk, attacker, defender, move) {
			if (move.type === 'Electric') {
				this.debug('Transistor boost');
				return this.chainModify(1.5);
			}
		},
		name: "Transistor",
		rating: 3.5,
		num: 262,
	},
	unseenfist: {
		onModifyMove(move) {
			if (move.flags['contact']) delete move.flags['protect'];
		},
		name: "Unseen Fist",
		rating: 2,
		num: 260,
	},
	wanderingspirit: {
		onDamagingHit(damage, target, source, move) {
			const additionalBannedAbilities = ['hungerswitch', 'illusion', 'neutralizinggas', 'wonderguard'];
			if (source.getAbility().isPermanent || additionalBannedAbilities.includes(source.ability) ||
				target.volatiles['dynamax']
			) {
				return;
			}

			if (this.checkMoveMakesContact(move, source, target)) {
				const sourceAbility = source.setAbility('wanderingspirit', target);
				if (!sourceAbility) return;
				if (target.isAlly(source)) {
					this.add('-activate', target, 'Skill Swap', '', '', '[of] ' + source);
				} else {
					this.add('-activate', target, 'ability: Wandering Spirit', this.dex.abilities.get(sourceAbility).name, 'Wandering Spirit', '[of] ' + source);
				}
				target.setAbility(sourceAbility);
			}
		},
		name: "Wandering Spirit",
		rating: 2.5,
		num: 254,
	},
};

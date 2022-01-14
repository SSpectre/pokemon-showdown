import { Pokemon } from "../../../sim";
import { SecondaryEffect } from "../../../sim/dex-moves";
import { Scripts } from "./scripts";

export const Abilities: {[k: string]: ModdedAbilityData} = {
	angerpoint: {
		inherit: true,
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
	cursedbody: {
		inherit: true,
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
		onDamagingHit(damage, target, source, move) {
			if (this.checkMoveMakesContact(move, source, target)) {
				Scripts.severity = 100 - 100 * Math.pow(0.7, move.hit);
				source.addVolatile('attract', this.effectState.target);
			}
		},
	},
	disguise: {
		inherit: true,
		onUpdate(pokemon) {
			if (['mimikyu', 'mimikyutotem'].includes(pokemon.species.id) && this.effectState.busted) {
				const speciesid = pokemon.species.id === 'mimikyutotem' ? 'Mimikyu-Busted-Totem' : 'Mimikyu-Busted';
				pokemon.formeChange(speciesid, this.effect, true);
			}
		},
	},
	earlybird: {
		inherit: true,
	},
	effectspore: {
		inherit: true,
		onDamagingHit(damage, target, source, move) {
			if (this.checkMoveMakesContact(move, source, target) && source.runStatusImmunity('powder')) {
				Scripts.severity = 100 - 100 * Math.pow(0.7, move.hit);
				source.trySetStatus('aff', target);
			}
		},
	},
	flamebody: {
		inherit: true,
		onDamagingHit(damage, target, source, move) {
			if (this.checkMoveMakesContact(move, source, target)) {
				Scripts.severity = 100 - 100 * Math.pow(0.7, move.hit);
				source.trySetStatus('brn', target);
			}
		},
	},
	flareboost: {
		inherit: true,
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
	guts: {
		inherit: true,
		onModifyAtk(atk, pokemon) {
			if (pokemon.status) {
				return this.chainModify(1 + 0.5 * pokemon.statusState.severity / 100);
			}
		},
	},
	harvest: {
		inherit: true,
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
	innerfocus: {
		inherit: true,
		rating: 1,
		onBoost() {},
	},
	intimidate: {
		inherit: true,
		rating: 4,
	},
	marvelscale: {
		inherit: true,
		onModifyDef(def, pokemon) {
			if (pokemon.status) {
				return this.chainModify(1 + 0.5 * pokemon.statusState.severity / 100);
			}
		},
	},
	merciless: {
		inherit: true,
		onModifyCritRatio(critRatio, source, target) {
			if (target && ['psn', 'tox'].includes(target.status)) return Math.floor(5 * target.statusState.severity / 100);
			else if (target.status === 'aff') return Math.ceil(5 * target.statusState.severity / 333);
			else if (target.status === 'all') return Math.ceil(5 * target.statusState.severity / 500);
		},
	},
	moody: {
		inherit: true,
		onResidual(pokemon) {
			let stats: BoostID[] = [];
			
			let statPlus: BoostID;
			for (statPlus in pokemon.boosts) {
				if (pokemon.boosts[statPlus] < 6) {
					stats.push(statPlus);
				}
			}
			if (stats.length) {
				for (let i of stats) {
					const boost: SparseBoostsTable = {};
					boost[i] = 0.14;
					this.boost(boost);
				}
			}
		},
	},
	oblivious: {
		inherit: true,
		onBoost() {},
	},
	owntempo: {
		inherit: true,
		onBoost() {},
	},
	poisonheal: {
		inherit: true,
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
		onDamagingHit(damage, target, source, move) {
			if (this.checkMoveMakesContact(move, source, target)) {
				Scripts.severity = 100 - 100 * Math.pow(0.7, move.hit);
				source.trySetStatus('psn', target);
			}
		},
	},
	poisontouch: {
		inherit: true,
		// upokecenter says this is implemented as an added secondary effect
		onModifyMove(move) {
			if (!move?.flags['contact'] || move.target === 'self') return;
			if (!move.secondaries) {
				move.secondaries = [];
			}
			for (const secondary of move.secondaries) {
				if (secondary.status === 'psn') {
					if (typeof secondary.chance === 'number') secondary.chance = secondary.chance + 30 * (100 - secondary.chance)
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
	quickfeet: {
		inherit: true,
		onModifySpe(spe, pokemon) {
			if (pokemon.status) {
				return this.chainModify(1 + 0.5 * pokemon.statusState.severity / 100);
			}
		},
	},
	rattled: {
		onDamagingHit(damage, target, source, move) {
			if (['Dark', 'Bug', 'Ghost'].includes(move.type)) {
				this.boost({spe: 1});
			}
		},
		name: "Rattled",
		rating: 1.5,
		num: 155,
	},
	scrappy: {
		inherit: true,
		onBoost() {},
	},
	shedskin: {
		inherit: true,
		onResidual(pokemon) {
			if (pokemon.hp && pokemon.status) {
				this.debug('shed skin');
				
				if (pokemon.statusState.severity > 33) {
					let status = pokemon.getStatus();
					let severity = pokemon.statusState.severity - 33;
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
	soundproof: {
		inherit: true,
		onTryHit(target, source, move) {
			if (move.flags['sound']) {
				this.add('-immune', target, '[from] ability: Soundproof');
				return null;
			}
		},
	},
	static: {
		inherit: true,
		onDamagingHit(damage, target, source, move) {
			if (this.checkMoveMakesContact(move, source, target)) {
				Scripts.severity = 100 - 100 * Math.pow(0.7, move.hit);
				source.trySetStatus('par', target);
			}
		},
	},
	steadfast: {
		inherit: true,
		onTryAddVolatile(target, source, move) {
			if (target.name === 'flinch') {
				//don't need to multiply by severity of flinch because boost() multiplies by severity already
				this.boost({spe: 1});
			}
		},
		onFlinch(pokemon) {},
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
		onModifyAccuracy(accuracy, target) {
			if (typeof accuracy !== 'number') return;
			if (target?.volatiles['confusion']) {
				this.debug('Tangled Feet - decreasing accuracy');
				return this.chainModify(1 - 0.5 * target?.volatiles['confusion'].severity / 100);
			}
		},
	},
	technician: {
		inherit: true,
		onBasePowerPriority: 19,
	},
	toxicboost: {
		inherit: true,
		onBasePower(basePower, attacker, defender, move) {
			if (move.category === 'Physical') {
				if (attacker.status === 'psn' || attacker.status === 'tox') {
					return this.chainModify(1 +  0.5 *attacker.statusState.severity / 100);
				} else if (attacker.status === 'aff') {
					return this.chainModify(1 +  0.5 *attacker.statusState.severity / 333);
				} else if (attacker.status === 'all') {
					return this.chainModify(1 +  0.5 *attacker.statusState.severity / 500);
				}
			}
		},
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

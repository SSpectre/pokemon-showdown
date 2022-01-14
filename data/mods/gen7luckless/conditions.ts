import { Script } from "vm";
import { Pokemon } from "../../../sim";
import { Scripts } from "./scripts";

export const Conditions: {[k: string]: ModdedConditionData} = {
	brn: {
		inherit: true,
		onStart(target, source, sourceEffect) {
			if (sourceEffect && sourceEffect.id === 'flameorb') {
				this.add('-status', target, 'brn', 100, '[from] item: Flame Orb');
			} else if (sourceEffect && sourceEffect.effectType === 'Ability') {
				if (sourceEffect.id === 'shedskin') this.add('-status', target, 'brn', Scripts.severity, '[silent]');
				else this.add('-status', target, 'brn', Scripts.severity, '[from] ability: ' + sourceEffect.name, '[of] ' + source);
			} else if (sourceEffect && sourceEffect.effectType === 'Move' && sourceEffect.flags.lesser) {
				this.add('-status', target, 'brn', Scripts.severity, '[silent]');
			} else {
				this.add('-status', target, 'brn', Scripts.severity);
			}

			this.effectState.severityModifier = 1;
		},
		// Damage reduction is handled directly in the sim/battle.js damage function
		onResidual(pokemon) {
			this.damage(pokemon.baseMaxhp / 16 * (pokemon.statusState.severity / 100));
		},
	},
	par: {
		inherit: true,
		onStart(target, source, sourceEffect) {
			if (sourceEffect && sourceEffect.effectType === 'Ability') {
				if (sourceEffect.id === 'shedskin') this.add('-status', target, 'par', Scripts.severity, '[silent]');
				else this.add('-status', target, 'par', Scripts.severity, '[from] ability: ' + sourceEffect.name, '[of] ' + source);
			} else if (sourceEffect && sourceEffect.effectType === 'Move' && sourceEffect.flags.lesser) {
				this.add('-status', target, 'par', Scripts.severity, '[silent]');
			} else {
				this.add('-status', target, 'par', Scripts.severity);
			}
			//max 1 turn
			this.effectState.time = Math.floor(this.effectState.severity / 100) + 1;
			this.effectState.severityModifier = 1 - 0.25 * this.effectState.severity / 100;
		},
		onModifySpe(spe, pokemon) {
			if (!pokemon.hasAbility('quickfeet')) {
				return this.chainModify(1 - 0.5 * pokemon.statusState.severity / 100);
			}
		},
		onBeforeMove(pokemon) {
			pokemon.statusState.time--;
			if (pokemon.statusState.time > 0) {
				this.add('cant', pokemon, 'par');
				return false;
			}
		},
	},
	slp: {
		inherit: true,
		onStart(target, source, sourceEffect) {
			if (target.hasAbility('earlybird')) {
				Scripts.severity! *= 0.5;
				this.effectState.severity *= 0.5;
			}
			if (sourceEffect && sourceEffect.effectType === 'Ability') {
				if (sourceEffect.id === 'shedskin') this.add('-status', target, 'slp', Scripts.severity, '[silent]');
				else this.add('-status', target, 'slp', Scripts.severity, '[from] ability: ' + sourceEffect.name, '[of] ' + source);
			} else if (sourceEffect && sourceEffect.effectType === 'Move') {
				if (sourceEffect.flags.lesser) this.add('-status', target, 'slp', Scripts.severity, '[silent]');
				else this.add('-status', target, 'slp', Scripts.severity, '[from] move: ' + sourceEffect.name);
			} else {
				this.add('-status', target, 'slp', Scripts.severity);
			}
			//max 2 turns
			this.effectState.time = Math.floor(2 * this.effectState.severity / 100) + 1;
			this.effectState.severityModifier = 1 - ((2 * this.effectState.severity / 100) % 1);
		},
		onBeforeMove(pokemon, target, move) {
			pokemon.statusState.time--;
			if (pokemon.statusState.time > 0) {
				this.add('cant', pokemon, 'slp');
				if (move.sleepUsable) {
					return;
				}
				return false;
			}
			else if ((pokemon.statusState.time === 0 && pokemon.statusState.severityModifier === 1) || pokemon.statusState.time < 0) {
				pokemon.cureStatus();
			}
			return;
		},
		onAfterMove(pokemon, target, move) {
			//to account for severityModifier being changed by Snore or Sleep Talk
			this.effectState.severityModifier = 1 - ((2 * this.effectState.severity / 100) % 1);
		},
	},
	frz: {
		inherit: true,
		onStart(target, source, sourceEffect) {
			if (sourceEffect && sourceEffect.effectType === 'Ability') {
				if (sourceEffect.id === 'shedskin') this.add('-status', target, 'frz', Scripts.severity, '[silent]');
				else this.add('-status', target, 'frz', Scripts.severity, '[from] ability: ' + sourceEffect.name, '[of] ' + source);
			} else if (sourceEffect && sourceEffect.effectType === 'Move' && sourceEffect.flags.lesser) {
				this.add('-status', target, 'frz', Scripts.severity, '[silent]');
			} else {
				this.add('-status', target, 'frz', Scripts.severity);
			}
			if (target.species.name === 'Shaymin-Sky' && target.baseSpecies.baseSpecies === 'Shaymin') {
				target.formeChange('Shaymin', this.effect, true);
			}
			//max 3 turns
			this.effectState.time = Math.floor(3 * this.effectState.severity / 100) + 1;
			this.effectState.severityModifier = 1 - ((3 * this.effectState.severity / 100) % 1);
		},
		onBeforeMove(pokemon, target, move) {
			if (move.flags['defrost']) return;
			pokemon.statusState.time--;
			if (pokemon.statusState.time > 0) {
				this.add('cant', pokemon, 'frz');
				return false;
			}
			else if ((pokemon.statusState.time === 0 && pokemon.statusState.severityModifier === 1) || pokemon.statusState.time < 0) {
				pokemon.cureStatus();
			}
			return;
		},
		onHit(target, source, move) {
			if (move.thawsTarget || move.type === 'Fire' && move.category !== 'Status') {
				if (Scripts.severity! >= target.statusState.severity) {
					target.cureStatus();
				} else {
					let status = target.getStatus();
					let originalSeverity = Scripts.severity!;
					let severity = target.statusState.severity - originalSeverity;
					if (target.clearStatus()) {
						Scripts.severity = severity;
						move.flags.lesser = 1;
						target.setStatus(status, target, move);
						Scripts.severity = originalSeverity;
					}
				}
			}
		},
	},
	psn: {
		inherit: true,
		onStart(target, source, sourceEffect) {
			if (sourceEffect && sourceEffect.effectType === 'Ability') {
				if (sourceEffect.id === 'shedskin') this.add('-status', target, 'psn', Scripts.severity, '[silent]');
				else this.add('-status', target, 'psn', Scripts.severity, '[from] ability: ' + sourceEffect.name, '[of] ' + source);
			} else if (sourceEffect && sourceEffect.effectType === 'Move' && sourceEffect.flags.lesser) {
				this.add('-status', target, 'psn', Scripts.severity, '[silent]');
			} else {
				this.add('-status', target, 'psn', Scripts.severity);
			}

			this.effectState.severityModifier = 1;
		},
		onResidual(pokemon) {
			this.damage((pokemon.baseMaxhp / 8) * (pokemon.statusState.severity / 100));
		},
	},
	tox: {
		inherit: true,
		onStart(target, source, sourceEffect) {
			if (sourceEffect && sourceEffect.id === 'toxicorb') {
				this.add('-status', target, 'tox', 100, '[from] item: Toxic Orb');
			} else if (sourceEffect && sourceEffect.effectType === 'Ability') {
				if (sourceEffect.id === 'shedskin') this.add('-status', target, 'tox', Scripts.severity, '[silent]');
				else this.add('-status', target, 'tox', Scripts.severity, '[from] ability: ' + sourceEffect.name, '[of] ' + source);
			} else if (sourceEffect && sourceEffect.effectType === 'Move' && sourceEffect.flags.lesser) {
				this.add('-status', target, 'tox', Scripts.severity, '[silent]');
			} else {
				this.add('-status', target, 'tox', Scripts.severity);
			}

			if (this.effectState.stage === undefined && sourceEffect.id !== 'shedskin') this.effectState.stage = 0;
			this.effectState.severityModifier = 1;
		},
		onResidual(pokemon) {
			if (pokemon.statusState.stage < 15) {
				pokemon.statusState.stage++;
			}
			this.damage(this.clampIntRange(pokemon.baseMaxhp / 16, 1) * (pokemon.statusState.severity / 100) * pokemon.statusState.stage);
		},
	},
	aff: {
		name: 'aff',
		effectType: 'Status',
		onStart(target, source, sourceEffect) {
			if (target.hasAbility('limber')) {
				Scripts.severity! *= 0.67;
				this.effectState.severity *= 0.67;
			} else if (target.hasAbility('vitalspirit') || target.hasAbility('insomnia') 
				|| target.hasAbility('sweetveil') || target.allies().some((ally) => ally.hasAbility('sweetveil')) || target.volatiles['uproar']) {
				Scripts.severity! *= 0.63;
				this.effectState.severity *= 0.63;
			} else if (target.hasAbility('earlybird')) {
				Scripts.severity! *= 0.82;
				this.effectState.severity *= 0.82;
			} else if (target.hasAbility('immunity')) {
				Scripts.severity! *= 0.7;
				this.effectState.severity *= 0.7;
			}

			if (sourceEffect && sourceEffect.effectType === 'Ability') {
				if (sourceEffect.id === 'shedskin') this.add('-status', target, 'aff', Scripts.severity, '[silent]');
				else this.add('-status', target, 'aff', Scripts.severity, '[from] ability: ' + sourceEffect.name, '[of] ' + source);
			} else if (sourceEffect && sourceEffect.effectType === 'Move' && sourceEffect.flags.lesser) {
				this.add('-status', target, 'aff', Scripts.severity, '[silent]');
			} else {
				this.add('-status', target, 'aff', Scripts.severity);
			}

			this.effectState.severityModifier = 1;
			this.effectState.severityModifier *= 1 - 0.25 * this.effectState.severity / 300; //paralysis
			this.effectState.severityModifier *= 1 - ((2 * this.effectState.severity / 546)); //sleep
		},
		onModifySpe(spe, pokemon) {
			if (!pokemon.hasAbility('quickfeet'))
				return this.chainModify(1 - 0.5 * pokemon.statusState.severity / 300);
		},
		onAfterMove(pokemon, target, move) {
			//to account for severityModifier being changed by Snore or Sleep Talk
			this.effectState.severityModifier = 1;
			this.effectState.severityModifier *= 1 - 0.25 * this.effectState.severity / 300; //paralysis
			this.effectState.severityModifier *= 1 - ((2 * this.effectState.severity / 546)); //sleep
		},
		onResidualOrder: 9,
		onResidual(pokemon) {
			this.damage((pokemon.baseMaxhp / 8) * (pokemon.statusState.severity / 333));
		}
	},
	tri: {
		name: 'tri',
		effectType: 'Status',
		onStart(target, source, sourceEffect) {
			if (target.hasAbility('limber') || target.hasAbility('waterbubble') || target.hasAbility('waterveil') || target.hasAbility('magmaarmor')) {
				Scripts.severity! *= 0.67;
				this.effectState.severity *= 0.67;
			}

			if (sourceEffect && sourceEffect.effectType === 'Ability') {
				if (sourceEffect.id === 'shedskin') this.add('-status', target, 'tri', Scripts.severity, '[silent]');
				else this.add('-status', target, 'tri', Scripts.severity, '[from] ability: ' + sourceEffect.name, '[of] ' + source);
			} else if (sourceEffect && sourceEffect.effectType === 'Move' && sourceEffect.flags.lesser) {
				this.add('-status', target, 'tri', Scripts.severity, '[silent]');
			} else {
				this.add('-status', target, 'tri', Scripts.severity);
			}

			//max 1 turn
			this.effectState.time = Math.floor(this.effectState.severity / 100) + 1;
			this.effectState.severityModifier = 1;
			this.effectState.severityModifier = 1 - 0.25 * this.effectState.severity / 300; //paralysis
			this.effectState.severityModifier = 1 - this.effectState.severity / 300; //freeze
		},
		onModifySpe(spe, pokemon) {
			if (!pokemon.hasAbility('quickfeet'))
				return this.chainModify(1 - 0.5 * pokemon.statusState.severity / 300);
		},
		onBeforeMove(pokemon, target, move) {
			if (move.flags['defrost']) return;
			pokemon.statusState.time--;
			if (pokemon.statusState.time > 0) {
				this.add('cant', pokemon, 'tri');
				return false;
			}
		},
		onResidualOrder: 10,
		onResidual(pokemon) {
			this.damage(pokemon.baseMaxhp / 16 * (pokemon.statusState.severity / 300));
		},
		onHit(target, source, move) {
			if (move.thawsTarget || move.type === 'Fire' && move.category !== 'Status') {
				if (Scripts.severity! >= target.statusState.severity) {
					target.cureStatus();
				} else {
					let status = target.getStatus();
					let originalSeverity = Scripts.severity!;
					let severity = target.statusState.severity - originalSeverity;
					if (target.clearStatus()) {
						Scripts.severity = severity;
						move.flags.lesser = 1;
						target.setStatus(status, target, move);
						Scripts.severity = originalSeverity;
					}
				}
			}
		},
	},
	all: {
		name: 'all',
		effectType: 'Status',
		onStart(target, source, sourceEffect) {
			if (target.hasAbility('limber') || target.hasAbility('waterbubble') || target.hasAbility('waterveil') || target.hasAbility('magmaarmor') || target.hasAbility('immunity')
			|| target.hasAbility('vitalspirit') || target.hasAbility('insomnia') 
			|| target.hasAbility('sweetveil') || target.allies().some((ally) => ally.hasAbility('sweetveil')) || target.volatiles['uproar']) {
				Scripts.severity! *= 0.8;
				this.effectState.severity *= 0.8;
			} else if (target.hasAbility('earlybird')) {
				Scripts.severity! *= 0.9;
				this.effectState.severity *= 0.9;
			}

			if (sourceEffect && sourceEffect.effectType === 'Ability') {
				if (sourceEffect.id === 'shedskin') this.add('-status', target, 'all', Scripts.severity, '[silent]');
				else this.add('-status', target, 'all', Scripts.severity, '[from] ability: ' + sourceEffect.name, '[of] ' + source);
			} else if (sourceEffect && sourceEffect.effectType === 'Move' && sourceEffect.flags.lesser) {
				this.add('-status', target, 'all', Scripts.severity, '[silent]');
			} else {
				this.add('-status', target, 'all', Scripts.severity);
			}

			this.effectState.severityModifier = 1;
			this.effectState.severityModifier *= 1 - 0.25 * this.effectState.severity / 500; //paralysis
			this.effectState.severityModifier *= 1 - ((2 * this.effectState.severity / 1000)); //sleep
			this.effectState.severityModifier = 1 - this.effectState.severity / 500; //freeze
		},
		onModifySpe(spe, pokemon) {
			if (!pokemon.hasAbility('quickfeet'))
				return this.chainModify(1 - 0.5 * pokemon.statusState.severity / 500);
		},
		onAfterMove(pokemon, target, move) {
			//to account for severityModifier being changed by Snore or Sleep Talk
			this.effectState.severityModifier = 1;
			this.effectState.severityModifier *= 1 - 0.25 * this.effectState.severity / 500; //paralysis
			this.effectState.severityModifier *= 1 - ((2 * this.effectState.severity / 1000)); //sleep
			this.effectState.severityModifier = 1 - this.effectState.severity / 500; //freeze
		},
		onBeforeMove(pokemon, target, move) {
			if (move.flags['defrost']) return;
		},
		onResidualOrder: 9,
		onResidual(pokemon) {
			this.damage((pokemon.baseMaxhp / 8 + pokemon.baseMaxhp / 16) * (pokemon.statusState.severity / 250));
		},
		onHit(target, source, move) {
			if (move.thawsTarget || move.type === 'Fire' && move.category !== 'Status') {
				if (Scripts.severity! >= target.statusState.severity) {
					target.cureStatus();
				} else {
					let status = target.getStatus();
					let originalSeverity = Scripts.severity!;
					let severity = target.statusState.severity - originalSeverity;
					if (target.clearStatus()) {
						Scripts.severity = severity;
						move.flags.lesser = 1;
						target.setStatus(status, target, move);
						Scripts.severity = originalSeverity;
					}
				}
			}
		},
	},
	confusion: {
		inherit: true,
		// this is a volatile status
		onStart(target, source, sourceEffect) {
			if (sourceEffect && sourceEffect.id === 'lockedmove') {
				this.add('-start', target, 'confusion', '[fatigue]', '[severity] ' + 100);
			} else {
				this.add('-start', target, 'confusion', '[severity] ' + Scripts.severity);
			}
			//max 1 turn
			this.effectState.time = Math.floor(this.effectState.severity / 100) + 1;
			this.effectState.severityModifier = 1 - ((this.effectState.severity / 100) % 1);
		},
		onBeforeMove(pokemon) {
			pokemon.volatiles['confusion'].time--;
			if (pokemon.volatiles['confusion'].time === 0 && pokemon.volatiles['confusion'].severityModifier === 1 || pokemon.volatiles['confusion'].time < 0) {
				pokemon.removeVolatile('confusion');
				return;
			}
			this.add('-activate', pokemon, 'confusion');
			if (pokemon.volatiles['confusion'].time > 0)
			{
				this.activeTarget = pokemon;
				const damage = this.actions.getConfusionDamage(pokemon, 40);
				if (typeof damage !== 'number') throw new Error("Confusion damage not dealt");
				const activeMove = {id: this.toID('confused'), effectType: 'Move', type: '???'};
				this.damage(damage, pokemon, pokemon, activeMove as ActiveMove);
				return false;
			}

			//deal partial confusion damage and use move with partial severity
			this.activeTarget = pokemon;
			const damage = this.actions.getConfusionDamage(pokemon, Math.floor(40 * ((this.effectState.severity / 100) % 1)));
			if (typeof damage !== 'number') throw new Error("Confusion damage not dealt");
			const activeMove = {id: this.toID('confused'), effectType: 'Move', type: '???'};
			this.damage(damage, pokemon, pokemon, activeMove as ActiveMove);
			return;
		},
	},
	flinch: {
		inherit: true,
		onStart(pokemon) {
			this.add('-start', pokemon, 'flinch', '[severity] ' + Scripts.severity, '[silent]');
			this.effectState.severityModifier = 1 - this.effectState.severity / 100;
		},
		onBeforeMove(pokemon) {
			if (this.effectState.severity === 100){
				this.add('cant', pokemon, 'flinch');
				this.runEvent('Flinch', pokemon);
				return false;
			}
		},
		onEnd(pokemon) {
			this.add('-end', pokemon, 'flinch', '[silent]');
		},
	},
	partiallytrapped: {
		inherit: true,
		durationCallback(target, source) {
			if (source?.hasItem('gripclaw')) return Math.floor(7 * Scripts.severity! / 100) + 1;
			return Math.floor(4.5 * Scripts.severity! / 100) + 1;
		},
		onStart(pokemon, source) {
			this.add('-start', pokemon, this.effectState.sourceEffect.id, '[from] move: ' + this.effectState.sourceEffect, '[of] ' + source, '[severity] ' + Scripts.severity);
			this.effectState.boundDivisor = source.hasItem('bindingband') ? 6 : 8;
		},
		onResidual(pokemon) {
			const source = this.effectState.source;
			// G-Max Centiferno and G-Max Sandblast continue even after the user leaves the field
			const gmaxEffect = ['gmaxcentiferno', 'gmaxsandblast'].includes(this.effectState.sourceEffect.id);
			if (source && (!source.isActive || source.hp <= 0 || !source.activeTurns) && !gmaxEffect) {
				delete pokemon.volatiles['partiallytrapped'];
				this.add('-end', pokemon, this.effectState.sourceEffect, '[partiallytrapped]', '[silent]');
				return;
			}
			this.damage((pokemon.baseMaxhp / this.effectState.boundDivisor) * (this.effectState.severity / 100));
		},
		onTrapPokemon(pokemon) {
			const gmaxEffect = ['gmaxcentiferno', 'gmaxsandblast'].includes(this.effectState.sourceEffect.id);
			if (this.effectState.source?.isActive || gmaxEffect) pokemon.tryTrap();
		},
	},
	lockedmove: {
		// Outrage, Thrash, Petal Dance...
		inherit: true,
		duration: 2,
		onStart(target, source, effect) {
			this.effectState.trueDuration = 2
			this.effectState.move = effect.id;
		},
		onRestart() {
			if (this.effectState.trueDuration >= 2) {
				this.effectState.duration = 2;
			}
		},
	},
	mustrecharge: {
		inherit: true,
		onBeforeMove(pokemon) {
			pokemon.removeVolatile('truant');
			if (this.effectState.severity === 100) {
				this.add('cant', pokemon, 'recharge');
				return false;
			}
		},
		onStart(pokemon) {
			this.add('-mustrecharge', pokemon, '[severity] ' + Scripts.severity);
			this.effectState.severityModifier = 1 - this.effectState.severity / 100;
		},
		onLockMove() {
			if (this.effectState.severity === 100) return 'recharge';
		},
		onTrapPokemon(pokemon) {
			pokemon.tryTrap();
		},
	},
	stall: {
		inherit: true,
		onStallMove(pokemon) {
			// this.effectState.counter should never be undefined here.
			// However, just in case, use 1 if it is undefined.
			const counter = this.effectState.counter || 1;
			this.effectState.severity = Math.round(100 / counter);
			return true;
		},
		onRestart() {
			this.effectState.counter *= 3;
			this.effectState.duration = 2;
		},
	},
	imprisoned: {
		name: 'imprisoned',
		duration: 1,
		onStart(pokemon) {
			this.effectState.severityModifier = 1 - this.effectState.severity / 100;
		},
	},
	movestolen: {
		name: 'movestolen',
		duration: 1,
		onStart(pokemon) {
			this.effectState.severityModifier = 1 - this.effectState.severity / 100;
		},
	},
	resistnormal: {
		name: 'resistnormal',
		onSourceModifyAtkPriority: 6,
		onSourceModifyAtk(atk, attacker, defender, move) {
			if (move.type === 'Normal') {
				return this.chainModify(0.5);
			}
		},
		onSourceModifySpAPriority: 6,
		onSourceModifySpA(atk, attacker, defender, move) {
			if (move.type === 'Normal') {
				return this.chainModify(0.5);
			}
		},
	},
	resistfire: {
		name: 'resistfire',
		onSourceModifyAtkPriority: 6,
		onSourceModifyAtk(atk, attacker, defender, move) {
			if (move.type === 'Fire') {
				return this.chainModify(0.5);
			}
		},
		onSourceModifySpAPriority: 6,
		onSourceModifySpA(atk, attacker, defender, move) {
			if (move.type === 'Fire') {
				return this.chainModify(0.5);
			}
		},
	},
	resistwater: {
		name: 'resistwater',
		onSourceModifyAtkPriority: 6,
		onSourceModifyAtk(atk, attacker, defender, move) {
			if (move.type === 'Water') {
				return this.chainModify(0.5);
			}
		},
		onSourceModifySpAPriority: 6,
		onSourceModifySpA(atk, attacker, defender, move) {
			if (move.type === 'Water') {
				return this.chainModify(0.5);
			}
		},
	},
	resistelectric: {
		name: 'resistelectric',
		onSourceModifyAtkPriority: 6,
		onSourceModifyAtk(atk, attacker, defender, move) {
			if (move.type === 'Electric') {
				return this.chainModify(0.5);
			}
		},
		onSourceModifySpAPriority: 6,
		onSourceModifySpA(atk, attacker, defender, move) {
			if (move.type === 'Electric') {
				return this.chainModify(0.5);
			}
		},
	},
	resistgrass: {
		name: 'resistgrass',
		onSourceModifyAtkPriority: 6,
		onSourceModifyAtk(atk, attacker, defender, move) {
			if (move.type === 'Grass') {
				return this.chainModify(0.5);
			}
		},
		onSourceModifySpAPriority: 6,
		onSourceModifySpA(atk, attacker, defender, move) {
			if (move.type === 'Grass') {
				return this.chainModify(0.5);
			}
		},
	},
	resistice: {
		name: 'resistice',
		onSourceModifyAtkPriority: 6,
		onSourceModifyAtk(atk, attacker, defender, move) {
			if (move.type === 'Ice') {
				return this.chainModify(0.5);
			}
		},
		onSourceModifySpAPriority: 6,
		onSourceModifySpA(atk, attacker, defender, move) {
			if (move.type === 'Ice') {
				return this.chainModify(0.5);
			}
		},
	},
	resistfighting: {
		name: 'resistfighting',
		onSourceModifyAtkPriority: 6,
		onSourceModifyAtk(atk, attacker, defender, move) {
			if (move.type === 'Fighting') {
				return this.chainModify(0.5);
			}
		},
		onSourceModifySpAPriority: 6,
		onSourceModifySpA(atk, attacker, defender, move) {
			if (move.type === 'Fighting') {
				return this.chainModify(0.5);
			}
		},
	},
	resistpoison: {
		name: 'resistpoison',
		onSourceModifyAtkPriority: 6,
		onSourceModifyAtk(atk, attacker, defender, move) {
			if (move.type === 'Poison') {
				return this.chainModify(0.5);
			}
		},
		onSourceModifySpAPriority: 6,
		onSourceModifySpA(atk, attacker, defender, move) {
			if (move.type === 'Poison') {
				return this.chainModify(0.5);
			}
		},
	},
	resistground: {
		name: 'resistground',
		onSourceModifyAtkPriority: 6,
		onSourceModifyAtk(atk, attacker, defender, move) {
			if (move.type === 'Ground') {
				return this.chainModify(0.5);
			}
		},
		onSourceModifySpAPriority: 6,
		onSourceModifySpA(atk, attacker, defender, move) {
			if (move.type === 'Ground') {
				return this.chainModify(0.5);
			}
		},
	},
	resistflying: {
		name: 'resistflying',
		onSourceModifyAtkPriority: 6,
		onSourceModifyAtk(atk, attacker, defender, move) {
			if (move.type === 'Flying') {
				return this.chainModify(0.5);
			}
		},
		onSourceModifySpAPriority: 6,
		onSourceModifySpA(atk, attacker, defender, move) {
			if (move.type === 'Flying') {
				return this.chainModify(0.5);
			}
		},
	},
	resistpsychic: {
		name: 'resistpsychic',
		onSourceModifyAtkPriority: 6,
		onSourceModifyAtk(atk, attacker, defender, move) {
			if (move.type === 'Psychic') {
				return this.chainModify(0.5);
			}
		},
		onSourceModifySpAPriority: 6,
		onSourceModifySpA(atk, attacker, defender, move) {
			if (move.type === 'Psychic') {
				return this.chainModify(0.5);
			}
		},
	},
	resistbug: {
		name: 'resistbug',
		onSourceModifyAtkPriority: 6,
		onSourceModifyAtk(atk, attacker, defender, move) {
			if (move.type === 'Bug') {
				return this.chainModify(0.5);
			}
		},
		onSourceModifySpAPriority: 6,
		onSourceModifySpA(atk, attacker, defender, move) {
			if (move.type === 'Bug') {
				return this.chainModify(0.5);
			}
		},
	},
	resistrock: {
		name: 'resistrock',
		onSourceModifyAtkPriority: 6,
		onSourceModifyAtk(atk, attacker, defender, move) {
			if (move.type === 'Rock') {
				return this.chainModify(0.5);
			}
		},
		onSourceModifySpAPriority: 6,
		onSourceModifySpA(atk, attacker, defender, move) {
			if (move.type === 'Rock') {
				return this.chainModify(0.5);
			}
		},
	},
	resistghost: {
		name: 'resistghost',
		onSourceModifyAtkPriority: 6,
		onSourceModifyAtk(atk, attacker, defender, move) {
			if (move.type === 'Ghost') {
				return this.chainModify(0.5);
			}
		},
		onSourceModifySpAPriority: 6,
		onSourceModifySpA(atk, attacker, defender, move) {
			if (move.type === 'Ghost') {
				return this.chainModify(0.5);
			}
		},
	},
	resistdragon: {
		name: 'resistdragon',
		onSourceModifyAtkPriority: 6,
		onSourceModifyAtk(atk, attacker, defender, move) {
			if (move.type === 'Dragon') {
				return this.chainModify(0.5);
			}
		},
		onSourceModifySpAPriority: 6,
		onSourceModifySpA(atk, attacker, defender, move) {
			if (move.type === 'Dragon') {
				return this.chainModify(0.5);
			}
		},
	},
	resistdark: {
		name: 'resistdark',
		onSourceModifyAtkPriority: 6,
		onSourceModifyAtk(atk, attacker, defender, move) {
			if (move.type === 'Dark') {
				return this.chainModify(0.5);
			}
		},
		onSourceModifySpAPriority: 6,
		onSourceModifySpA(atk, attacker, defender, move) {
			if (move.type === 'Dark') {
				return this.chainModify(0.5);
			}
		},
	},
	resiststeel: {
		name: 'resiststeel',
		onSourceModifyAtkPriority: 6,
		onSourceModifyAtk(atk, attacker, defender, move) {
			if (move.type === 'Steel') {
				return this.chainModify(0.5);
			}
		},
		onSourceModifySpAPriority: 6,
		onSourceModifySpA(atk, attacker, defender, move) {
			if (move.type === 'Steel') {
				return this.chainModify(0.5);
			}
		},
	},
	resistfairy: {
		name: 'resistfairy',
		onSourceModifyAtkPriority: 6,
		onSourceModifyAtk(atk, attacker, defender, move) {
			if (move.type === 'Fairy') {
				return this.chainModify(0.5);
			}
		},
		onSourceModifySpAPriority: 6,
		onSourceModifySpA(atk, attacker, defender, move) {
			if (move.type === 'Fairy') {
				return this.chainModify(0.5);
			}
		},
	},
	resisttypeless: {
		name: 'resisttypeless',
		onSourceModifyAtkPriority: 6,
		onSourceModifyAtk(atk, attacker, defender, move) {
			if (move.type === '???') {
				return this.chainModify(0.5);
			}
		},
		onSourceModifySpAPriority: 6,
		onSourceModifySpA(atk, attacker, defender, move) {
			if (move.type === '???') {
				return this.chainModify(0.5);
			}
		},
	},
};

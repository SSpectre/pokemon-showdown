import { battlemodchat } from "../../../config/config-example";
import { nameList } from "../../../server/chat-plugins/usersearch";
import { Pokemon } from "../../../sim";
import { Scripts } from "./scripts";

export const Moves: {[k: string]: ModdedMoveData} = {
	"10000000voltthunderbolt": {
		inherit: true,
		isNonstandard: null,
	},
	aciddownpour: {
		inherit: true,
		isNonstandard: null,
	},
	acupressure: {
		inherit: true,
		onHit(target) {
			const stats: BoostID[] = [];
			let stat: BoostID;
			for (stat in target.boosts) {
				if (target.boosts[stat] < 6) {
					stats.push(stat);
				}
			}
			if (stats.length) {
				for (let i of stats) {
					const boost: SparseBoostsTable = {};
					boost[i] = 0.29;
					this.boost(boost);
				}
			} else {
				return false;
			}
		},
	},
	alloutpummeling: {
		inherit: true,
		isNonstandard: null,
	},
	anchorshot: {
		inherit: true,
		secondary: {
			chance: 100,
			onHit(target, source, move) {
				if (source.isActive && Scripts.severity! >= 50) target.addVolatile('trapped', source, move, 'trapper');
			},
		},
	},
	aquaring: {
		inherit: true,
		condition: {
			onStart(pokemon) {
				this.add('-start', pokemon, 'Aqua Ring', '[severity] ' + Scripts.severity);
			},
			onResidualOrder: 6,
			onResidual(pokemon) {
				this.heal(pokemon.baseMaxhp * this.effectState.severity / 1600);
			},
		},
	},
	aromatherapy: {
		inherit: true,
		onHit(pokemon, source, move) {
			this.add('-activate', source, 'move: Aromatherapy');
			let success = false;
			for (const ally of pokemon.side.pokemon) {
				if (ally !== source && ((ally.hasAbility('sapsipper')) ||
						(ally.volatiles['substitute'] && !move.infiltrates))) {
					continue;
				}

				if (Scripts.severity! >= ally.statusState.severity) {
					if (ally.cureStatus()) success = true;
				} else {
					let status = ally.getStatus();
					let originalSeverity = Scripts.severity!;
					let severity = ally.statusState.severity - originalSeverity;
					if (ally.clearStatus()) {
						Scripts.severity = severity;
						move.flags.lesser = 1;
						ally.setStatus(status, pokemon, move);
						Scripts.severity = originalSeverity;
						success = true;
					}
				}
			}
			return success;
		},
	},
	assist: {
		inherit: true,
		isNonstandard: null,
		
		category: "Special",
		useAverageStats: true,
		flags: {protect: 1, mirror: 1},
		beforeMoveCallback(pokemon, target, move) {
			const noAssist = [
				'assist', 'banefulbunker', 'beakblast', 'belch', 'bestow', 'bounce', 'celebrate', 'chatter', 'circlethrow', 'copycat', 'counter', 'covet', 'destinybond', 'detect', 'dig', 'dive', 'dragontail', 'endure', 'feint', 'fly', 'focuspunch', 'followme', 'helpinghand', 'holdhands', 'kingsshield', 'matblock', 'mefirst', 'metronome', 'mimic', 'mirrorcoat', 'mirrormove', 'naturepower', 'phantomforce', 'protect', 'ragepowder', 'roar', 'shadowforce', 'shelltrap', 'sketch', 'skydrop', 'sleeptalk', 'snatch', 'spikyshield', 'spotlight', 'struggle', 'switcheroo', 'thief', 'transform', 'trick', 'whirlwind',
			];

			const moves = [];
			for (const p of pokemon.side.pokemon) {
				for (const moveSlot of p.moveSlots) {
					if (noAssist.includes(moveSlot.id)) continue;
					const m = this.dex.moves.get(moveSlot.id);
					if (m.isZ || m.isMax) {
						continue;
					}
					moves.push(m);
				}
			}
			if (moves.length === 0) return false;

			let totalPower = 0;
			let totalAccuracy = 0;
			let totalSecondary = 0;
			let totalSelf = 0;
			let highestSecondary = 0;
			let highestSelf = 0;
			move.secondary = {};
			move.secondaries = [];
			move.self = {};
			for (const m of moves) {
				if (typeof m.basePower === 'number') totalPower += m.basePower;
				if (typeof m.accuracy === 'number') totalAccuracy += m.accuracy;
				else totalAccuracy += 100;
				
				let highSeverity;
				if (m.status || m.volatileStatus || m.boosts && m.target !== 'self') {
					if (typeof m.accuracy === 'number') {
						totalSecondary += m.accuracy;
						highSeverity = m.accuracy;
					} else {
						totalSecondary += 100;
						highSeverity = 100;
					}
					if (highSeverity > highestSecondary) {
						highestSecondary = highSeverity;
						if (m.status) move.secondary.status = m.status;
						else if (m.volatileStatus) move.secondary.volatileStatus = m.volatileStatus;
						else if (m.boosts) move.secondary.boosts = m.boosts;
					}
				} else if (m.secondary && (m.secondary.status || m.secondary.volatileStatus || m.secondary.boosts)) {
					if (typeof m.secondary.chance === 'number') {
						totalSecondary += m.secondary.chance;
						highSeverity = m.secondary.chance;
						if (m.secondary.chance > highestSecondary) highestSecondary = m.secondary.chance;
					} else {
						totalSecondary += 100;
						highSeverity = 100;
					}
					if (highSeverity > highestSecondary) {
						highestSecondary = highSeverity;
						if (m.secondary.status) move.secondary.status = m.secondary.status;
						else if (m.secondary.volatileStatus) move.secondary.volatileStatus = m.secondary.volatileStatus;
						else if (m.secondary.boosts) move.secondary.boosts = m.secondary.boosts;
					}
				}
				
				let highSelf;
				if (m.self && (m.self.status || m.self.volatileStatus || m.self.boosts) || m.boosts && m.target === 'self') {
					if (typeof m.accuracy === 'number') {
						totalSelf += m.accuracy;
						highSelf = m.accuracy;
					} else {
						totalSelf += 100;
						highSelf = 100;
					}
					if (highSelf > highestSelf) {
						highestSelf = highSelf;
						
						if (m.self) {
							if (m.self.status) move.self.status = m.self.status;
							else if (m.self.volatileStatus) move.self.volatileStatus = m.self.volatileStatus;
							else if (m.self.boosts) move.self.boosts = m.self.boosts;
						} else move.self.boosts = m.boosts;
					}
				} else if (m.secondary && m.secondary.self && (m.secondary.self.status || m.secondary.self.volatileStatus || m.secondary.self.boosts)) {
					if (typeof m.secondary.chance === 'number') {
						totalSelf += m.secondary.chance;
						highSelf = m.secondary.chance;
						if (m.secondary.chance > highestSecondary) highestSelf = m.secondary.chance;
					} else {
						totalSelf += 100;
						highSelf = 100;
					}
					if (highSelf > highestSelf) {
						highestSelf = highSelf;
						if (m.secondary.self.status) move.self.status = m.secondary.self.status;
						else if (m.secondary.self.volatileStatus) move.self.volatileStatus = m.secondary.self.volatileStatus;
						else if (m.secondary.self.boosts) move.self.boosts = m.secondary.self.boosts;
					}
				}
			}
			move.basePower = totalPower / moves.length;
			move.accuracy = totalAccuracy / moves.length;
			move.secondary.chance = totalSecondary / moves.length;
			move.secondaries.push(move.secondary);
			move.self.chance = totalSelf / moves.length;
		},
		onModifyMove(move, pokemon, target) {
			move.type = '???';
		},
		onHit(target) {},
		target: "normal",
	},
	attract: {
		inherit: true,
		condition: {
			noCopy: true, // doesn't get copied by Baton Pass
			onStart(pokemon, source, effect) {
				if (!(pokemon.gender === 'M' && source.gender === 'F') && !(pokemon.gender === 'F' && source.gender === 'M')) {
					this.debug('incompatible gender');
					return false;
				}
				if (!this.runEvent('Attract', pokemon, source)) {
					this.debug('Attract event failed');
					return false;
				}

				if (effect.id === 'cutecharm') {
					this.add('-start', pokemon, 'Attract', '[from] ability: Cute Charm', '[of] ' + source, '[severity] ' + 30);
				} else if (effect.id === 'destinyknot') {
					this.add('-start', pokemon, 'Attract', '[from] item: Destiny Knot', '[of] ' + source, '[severity] ' + source.volatiles['attract'].severity);
				} else {
					this.add('-start', pokemon, 'Attract', '[severity] ' + Scripts.severity);
				}

				//max 2 turns
				this.effectState.time = Math.floor(2 * this.effectState.severity / 100) + 1;
				this.effectState.severityModifier = 1 - 0.5 * this.effectState.severity / 100;
			},
			onUpdate(pokemon) {
				if (this.effectState.source && !this.effectState.source.isActive && pokemon.volatiles['attract']) {
					this.debug('Removing Attract volatile on ' + pokemon);
					pokemon.removeVolatile('attract');
				}
			},
			onBeforeMovePriority: 2,
			onBeforeMove(pokemon, target, move) {
				this.add('-activate', pokemon, 'move: Attract', '[of] ' + this.effectState.source);
				this.effectState.time--;
				if (this.effectState.time > 0) {
					this.add('cant', pokemon, 'Attract');
					return false;
				}
			},
			onEnd(pokemon) {
				this.add('-end', pokemon, 'Attract', '[silent]');
			},
		},
	},
	autotomize: {
		inherit: true,
		onHit(pokemon) {
			if (pokemon.weighthg > 1) {
				pokemon.weighthg = Math.max(1, pokemon.weighthg - (1000 * Scripts.severity! / 100));
				this.add('-start', pokemon, 'Autotomize', '[severity] ' + Scripts.severity);
			}
		},
	},
	baddybad: {
		inherit: true,
		accuracy: 100,
		basePower: 90,
	},
	banefulbunker: {
		inherit: true,
		condition: {
			duration: 1,
			onStart(target) {
				if (target.volatiles['stall']) {
					this.add('-singleturn', target, 'Protect', '[severity] ' + target.volatiles['stall'].severity * Scripts.severity! / 100);
					this.effectState.severity = target.volatiles['stall'].severity;
				}
				else this.add('-singleturn', target, 'Protect', '[severity] ' + Scripts.severity);

				this.effectState.incomingSeverityModifier = 1 - this.effectState.severity / 100;
			},
			onTryHitPriority: 3,
			onTryHit(target, source, move) {
				if (!move.flags['protect']) {
					if (['gmaxoneblow', 'gmaxrapidflow'].includes(move.id)) return;
					if (move.isZ || move.isMax) target.getMoveHitData(move).zBrokeProtect = true;
					return;
				}
				if (move.smartTarget) {
					move.smartTarget = false;
				} else {
					this.add('-activate', target, 'move: Protect');
				}
				const lockedmove = source.getVolatile('lockedmove');
				if (lockedmove && this.effectState.severity === 100) {
					// Outrage counter is reset
					if (source.volatiles['lockedmove'].duration === 2) {
						delete source.volatiles['lockedmove'];
					}
				}
				if (this.checkMoveMakesContact(move, source, target)) {
					Scripts.severity = this.effectState.severity;
					source.trySetStatus('psn', target);
				}
				if (this.effectState.severity === 100) return this.NOT_FAIL;
				else return;
			},
			onHit(target, source, move) {
				if (move.isZOrMaxPowered && this.checkMoveMakesContact(move, source, target)) {
					Scripts.severity = this.effectState.severity;
					source.trySetStatus('psn', target);
				}
			},
		},
	},
	barrage: {
		inherit: true,
		isNonstandard: null,
	},
	barrier: {
		inherit: true,
		isNonstandard: null,
	},
	batonpass: {
		inherit: true,
		flags: {binary: 1},
	},
	beakblast: {
		inherit: true,
		isNonstandard: null,
	},
	beatup: {
		inherit: true,
		basePowerCallback(pokemon, target, move) {
			let ally = move.allies!.shift()!;
			let power;
			if (ally.status) power = Math.floor((5 + Math.floor(ally.species.baseStats.atk / 10)) * (1 - ally.statusState.severity / 100));
			else power = 5 + Math.floor(ally.species.baseStats.atk / 10);
			console.log(ally.name, power);
			return power;
		},
		onModifyMove(move, pokemon) {
			move.allies = pokemon.side.pokemon.filter(ally => ally === pokemon || !ally.fainted && (!ally.status || ally.statusState.severity < 100));
			move.multihit = move.allies.length;
		},
	},
	bellydrum: {
		inherit: true,
		onHit(target) {
			if (target.hp <= target.maxhp / 2 || target.boosts.atk >= 6 || target.maxhp === 1) { // Shedinja clause
				return false;
			}
			this.directDamage(target.maxhp * Scripts.severity! / 200);
			this.boost({atk: 12}, target);
		},
	},
	bestow: {
		inherit: true,
		isNonstandard: null,
		flags: {mirror: 1, authentic: 1, allyanim: 1, binary: 1},
	},
	bide: {
		inherit: true,
		isNonstandard: null,
	},
	blackholeeclipse: {
		inherit: true,
		isNonstandard: null,
	},
	block: {
		inherit: true,
		flags: {reflectable: 1, mirror: 1, binary: 1},
	},
	bloomdoom: {
		inherit: true,
		isNonstandard: null,
	},
	boneclub: {
		inherit: true,
		isNonstandard: null,
	},
	bouncybubble: {
		inherit: true,
		basePower: 90,
		pp: 15,
	},
	breakneckblitz: {
		inherit: true,
		isNonstandard: null,
	},
	bubble: {
		inherit: true,
		isNonstandard: null,
	},
	bugbite: {
		inherit: true,
		num: 450,
		accuracy: 100,
		basePower: 60,
		category: "Physical",
		name: "Bug Bite",
		pp: 20,
		priority: 0,
		flags: {contact: 1, protect: 1, mirror: 1},
		onHit(target, source) {
			const item = target.getItem();
			if (source.hp && item.isBerry && Scripts.severity! >= 50 && target.takeItem(source)) {
				this.add('-enditem', target, item.name, '[from] stealeat', '[move] Bug Bite', '[of] ' + source);
				if (this.singleEvent('Eat', item, null, source, null, null)) {
					this.runEvent('EatItem', source, null, null, item);
					if (item.id === 'leppaberry') target.staleness = 'external';
				}
				if (item.onEat) source.ateBerry = true;
			}
		},
		secondary: null,
		target: "normal",
		type: "Bug",
		contestType: "Cute",
	},
	burnup: {
		inherit: true,
		flags: {protect: 1, mirror: 1, defrost: 1, binary: 1},
	},
	buzzybuzz: {
		inherit: true,
		basePower: 90,
		pp: 15,
	},
	camouflage: {
		inherit: true,
		isNonstandard: null,
		flags: {snatch: 1, binary: 1},
	},
	captivate: {
		inherit: true,
		isNonstandard: null,
	},
	catastropika: {
		inherit: true,
		isNonstandard: null,
	},
	charge: {
		inherit: true,
		onHit(pokemon) {
			this.add('-start', pokemon, 'move: Charge', '[severity] ' + Scripts.severity);
		},
		condition: {
			duration: 2,
			onRestart(pokemon) {
				this.effectState.duration = 2;
			},
			onBasePowerPriority: 9,
			onBasePower(basePower, attacker, defender, move) {
				if (move.type === 'Electric') {
					this.debug('charge boost');
					return this.chainModify(1 + 1 * this.effectState.severity / 100);
				}
			},
			onEnd(pokemon) {
				this.add('-end', pokemon, 'move: Charge', '[silent]');
			},
		},
	},
	chatter: {
		inherit: true,
		isNonstandard: null,
	},
	chipaway: {
		inherit: true,
		isNonstandard: null,
	},
	circlethrow: {
		inherit: true,
		onHit(target, source, move) {
			if (source.isActive && Scripts.severity! >= 50) move.forceSwitch = false;
		},
	},
	clamp: {
		inherit: true,
		isNonstandard: null,
	},
	clangoroussoulblaze: {
		inherit: true,
		isNonstandard: null,
	},
	cometpunch: {
		inherit: true,
		isNonstandard: null,
	},
	constrict: {
		inherit: true,
		isNonstandard: null,
	},
	continentalcrush: {
		inherit: true,
		isNonstandard: null,
	},
	conversion: {
		inherit: true,
		flags: {snatch: 1, binary: 1},
	},
	conversion2: {
		inherit: true,
		flags: {authentic: 1, binary: 1},
		onHit(target, source) {
			if (!target.lastMoveUsed) {
				return false;
			}
			let attackType = target.lastMoveUsed.type;
			if (attackType === '???') attackType = 'typeless';
			let condition = 'resist' + attackType.toLowerCase()
			if (source.volatiles[condition]) return false;
			let resistances = ['resistnormal', 'resistfire', 'resistwater', 'resistelectric', 'resistgrass', 'resistice', 'resistfighting', 'resistpoison', 'resistground', 'resistflying', 'resistpsychic', 'resistbug', 'resistrock', 'resistghost', 'resistdragon', 'resistdark', 'resiststeel', 'resistfairy', 'resisttypeless']
			for (const resistance of resistances) {
				if (source.volatiles[resistance]) {
					source.removeVolatile(resistance);
					this.add('-end', source, resistance, '[silent]');
				}
			}
			source.addVolatile(condition);
			this.add('-start', source, condition);
		}
	},
	corkscrewcrash: {
		inherit: true,
		isNonstandard: null,
	},
	counter: {
		inherit: true,
		condition: {
			duration: 1,
			noCopy: true,
			onStart(target, source, move) {
				this.effectState.slot = null;
				this.effectState.damage = 0;
			},
			onRedirectTargetPriority: -1,
			onRedirectTarget(target, source, source2, move) {
				if (move.id !== 'counter') return;
				if (source !== this.effectState.target || !this.effectState.slot) return;
				return this.getAtSlot(this.effectState.slot);
			},
			onDamagingHit(damage, target, source, move) {
				if (!source.isAlly(target) && (this.getCategory(move) === 'Physical' || move.useAverageStats)) {
					this.effectState.slot = source.getSlot();
					this.effectState.damage = 2 * damage;
				}
			},
		},
	},
	covet: {
		inherit: true,
		onAfterHit(target, source, move) {
			if (source.item || source.volatiles['gem'] || Scripts.severity! < 50) {
				return;
			}
			const yourItem = target.takeItem(source);
			if (!yourItem) {
				return;
			}
			if (
				!this.singleEvent('TakeItem', yourItem, target.itemState, source, target, move, yourItem) ||
				!source.setItem(yourItem)
			) {
				target.item = yourItem.id; // bypass setItem so we don't break choicelock or anything
				return;
			}
			this.add('-item', source, yourItem, '[from] move: Covet', '[of] ' + target);
		},
	},
	curse: {
		inherit: true,
		onHit(target, source) {
			this.directDamage(source.maxhp * Scripts.severity! / 200, source, source);
		},
		condition: {
			onStart(pokemon, source) {
				this.add('-start', pokemon, 'Curse', '[of] ' + source, '[severity] ' + Scripts.severity);
			},
			onResidualOrder: 12,
			onResidual(pokemon) {
				this.damage(pokemon.baseMaxhp * this.effectState.severity / 400);
			},
		},
		target: "normal",
	},
	darkvoid: {
		inherit: true,
		isNonstandard: null,
	},
	defog: {
		inherit: true,
		onHit(target, source, move) {
			let success = false;
			if (!target.volatiles['substitute'] || move.infiltrates) success = !!this.boost({evasion: -1});
			const removeTarget = [
				'reflect', 'lightscreen', 'auroraveil', 'safeguard', 'mist', 'spikes', 'toxicspikes', 'stealthrock', 'stickyweb',
			];
			const removeAll = ['spikes', 'toxicspikes', 'stealthrock', 'stickyweb'];
			for (const targetCondition of removeTarget) {
				if (target.side.removeSideCondition(targetCondition)) {
					if (!removeAll.includes(targetCondition)) continue;
					this.add('-sideend', target.side, this.dex.conditions.get(targetCondition).name, '[from] move: Defog', '[of] ' + source);
					success = true;
				}
			}
			for (const sideCondition of removeAll) {
				if (source.side.removeSideCondition(sideCondition)) {
					this.add('-sideend', source.side, this.dex.conditions.get(sideCondition).name, '[from] move: Defog', '[of] ' + source);
					success = true;
				}
			}
			return success;
		},
	},
	destinybond: {
		inherit: true,
		condition: {
			onStart(pokemon) {
				this.add('-singlemove', pokemon, 'Destiny Bond', '[severity] ' + Scripts.severity);
			},
			onFaint(target, source, effect) {
				if (!source || !effect || target.isAlly(source)) return;
				if (effect.effectType === 'Move' && !effect.isFutureMove) {
					if (source.volatiles['dynamax']) {
						this.add('-hint', "Dynamaxed Pokémon are immune to Destiny Bond.");
						return;
					}
					this.add('-activate', target, 'move: Destiny Bond');
					this.damage(source.maxhp * this.effectState.severity / 100, source, target);
				}
			},
			onBeforeMovePriority: -1,
			onBeforeMove(pokemon, target, move) {
				if (move.id === 'destinybond') return;
				this.debug('removing Destiny Bond before attack');
				pokemon.removeVolatile('destinybond');
			},
			onMoveAborted(pokemon, target, move) {
				pokemon.removeVolatile('destinybond');
			},
		},
	},
	devastatingdrake: {
		inherit: true,
		isNonstandard: null,
	},
	disable: {
		inherit: true,
		condition: {
			duration: 5,
			noCopy: true, // doesn't get copied by Baton Pass
			onStart(pokemon, source, effect) {
				if (!pokemon.lastMove) {
					this.debug(`Pokemon hasn't moved yet`);
					return false;
				}
				for (const moveSlot of pokemon.moveSlots) {
					if (moveSlot.id === pokemon.lastMove.id) {
						if (!moveSlot.pp) {
							this.debug('Move out of PP');
							return false;
						}
					}
				}
				if (effect.effectType === 'Ability') {
					this.add('-start', pokemon, 'Disable', pokemon.lastMove.name, '[from] ability: Cursed Body', '[of] ' + source, '[severity] ' + Scripts.severity);
				} else {
					this.add('-start', pokemon, 'Disable', pokemon.lastMove.name, '[severity] ' + Scripts.severity);
				}
				
				//max 4 turns
				//time is used for finding last turn with decreased severityModifier
				//duration is used for ending status
				this.effectState.time = Math.floor(5 * this.effectState.severity / 100);
				this.effectState.duration = Math.floor(5 * this.effectState.severity / 100) + 1;
				if (this.effectState.severity === 100) this.effectState.duration--;
				// The target hasn't taken its turn, or Cursed Body activated and the move was not used through Dancer or Instruct
				if (
					this.queue.willMove(pokemon)
				) {
					this.effectState.time--;
					this.effectState.duration--;
				} else if (pokemon === this.activePokemon && this.activeMove && !this.activeMove.isExternal) {
					this.effectState.time++;
					this.effectState.duration++;
				}
				this.effectState.move = pokemon.lastMove.id;
			},
			onResidualOrder: 17,
			onResidual() {
				this.effectState.time--;
			},
			onEnd(pokemon) {
				this.add('-end', pokemon, 'Disable');
			},
			onBeforeMovePriority: 7,
			onBeforeMove(attacker, defender, move) {
				if (!move.isZ && move.id === this.effectState.move) {
					if (this.effectState.time > 0)
					{
						this.add('cant', attacker, 'Disable', move);
						return false;
					}
					this.effectState.severityModifier = 1 - (4 * this.effectState.severity / 100) % 1;
				}
			},
			onDisableMove(pokemon) {
				if (this.effectState.time > 0) {
					for (const moveSlot of pokemon.moveSlots) {
						if (moveSlot.id === this.effectState.move) {
							pokemon.disableMove(moveSlot.id);
						}
					}
				}
			},
		},
	},
	dizzypunch: {
		inherit: true,
		isNonstandard: null,
	},
	doubleironbash: {
		inherit: true,
		isNonstandard: "LGPE",
	},
	doubleslap: {
		inherit: true,
		isNonstandard: null,
	},
	dragonrage: {
		inherit: true,
		isNonstandard: null,
	},
	dragontail: {
		inherit: true,
		onHit(target, source, move) {
			if (source.isActive && Scripts.severity! >= 50) move.forceSwitch = false;
		},
	},
	dreameater: {
		inherit: true,
		onTryImmunity(target) {
			return target.status === 'slp' || target.status === 'aff' || target.status === 'all' || target.hasAbility('comatose');
		},
		basePowerCallback(pokemon, target, move) {
			if (target.status === 'slp' && target.statusState.time === 0) return move.basePower * (1 - (2 * target.statusState.severity / 100) % 1);
			if (target.status === 'aff') return move.basePower * (1 - target.statusState.severity / 273);
			if (target.status === 'all') return move.basePower * (1 - target.statusState.severity / 500);
			return move.basePower;
		},
	},
	eggbomb: {
		inherit: true,
		isNonstandard: null,
	},
	electricterrain: {
		inherit: true,
		condition: {
			duration: 5,
			durationCallback(source, effect) {
				if (source?.hasItem('terrainextender')) {
					return 8;
				}
				return 5;
			},
			onSetStatus(status, target, source, effect) {
				if (status.id === 'slp' && target.isGrounded() && !target.isSemiInvulnerable()) {
					if (effect.id === 'yawn' || (effect.effectType === 'Move' && !effect.secondaries)) {
						this.add('-activate', target, 'move: Electric Terrain');
					}
					return false;
				}
			},
			onTryAddVolatile(status, target) {
				if (!target.isGrounded() || target.isSemiInvulnerable()) return;
				if (status.id === 'yawn') {
					this.add('-activate', target, 'move: Electric Terrain');
					return null;
				}
			},
			onBasePower(basePower, attacker, defender, move) {
				if (move.type === 'Electric' && attacker.isGrounded() && !attacker.isSemiInvulnerable()) {
					this.debug('electric terrain boost');
					return this.chainModify(1.5);
				}
			},
			onFieldStart(field, source, effect) {
				if (effect && effect.effectType === 'Ability') {
					this.add('-fieldstart', 'move: Electric Terrain', '[from] ability: ' + effect, '[of] ' + source);
				} else {
					this.add('-fieldstart', 'move: Electric Terrain');
				}
			},
			onFieldResidualOrder: 21,
			onFieldResidualSubOrder: 2,
			onFieldEnd() {
				this.add('-fieldend', 'move: Electric Terrain');
			},
		},
	},
	embargo: {
		inherit: true,
		isNonstandard: null,
		condition: {
			duration: 5,
			onStart(pokemon) {
				this.add('-start', pokemon, 'Embargo', '[severity] ' + Scripts.severity);
				this.effectState.duration = Math.round(5 * this.effectState.severity / 100);
			},
			// Item suppression implemented in Pokemon.ignoringItem() within sim/pokemon.js
			onResidualOrder: 21,
			onEnd(pokemon) {
				this.add('-end', pokemon, 'Embargo');
			},
		}
	},
	encore: {
		inherit: true,
		condition: {
			duration: 3,
			noCopy: true, // doesn't get copied by Z-Baton Pass
			onStart(target) {
				const noEncore = [
					'assist', 'copycat', 'encore', 'mefirst', 'metronome', 'mimic', 'mirrormove', 'naturepower', 'sketch', 'sleeptalk', 'struggle', 'transform',
				];
				let move: Move | ActiveMove | null = target.lastMove;
				if (!move || target.volatiles['dynamax']) return false;

				if (move.isMax && move.baseMove) move = this.dex.moves.get(move.baseMove);
				const moveIndex = target.moves.indexOf(move.id);
				if (move.isZ || noEncore.includes(move.id) || !target.moveSlots[moveIndex] || target.moveSlots[moveIndex].pp <= 0) {
					// it failed
					return false;
				}
				this.effectState.move = move.id;
				this.add('-start', target, 'Encore', '[severity] ' + Scripts.severity);

				//max 3 turns
				//time is used for finding last turn with decreased severityModifier
				//duration is used for ending status
				this.effectState.time = Math.floor(3 * this.effectState.severity / 100);
				this.effectState.duration = Math.floor(3 * this.effectState.severity / 100) + 1;
				if (this.effectState.severity === 100) this.effectState.duration--;
				if (!this.queue.willMove(target)) {
					this.effectState.time++;
					this.effectState.duration++;
				}
			},
			onOverrideAction(pokemon, target, move) {
				if (move.id !== this.effectState.move && this.effectState.time > 0) return this.effectState.move;
			},
			onResidualOrder: 16,
			onResidual(target) {
				this.effectState.time--;
				if (target.moves.includes(this.effectState.move) &&
					target.moveSlots[target.moves.indexOf(this.effectState.move)].pp <= 0) {
					// early termination if you run out of PP
					target.removeVolatile('encore');
				}
			},
			onEnd(target) {
				this.add('-end', target, 'Encore');
			},
			onDisableMove(pokemon) {
				if (!this.effectState.move || !pokemon.hasMove(this.effectState.move)) {
					return;
				}
				for (const moveSlot of pokemon.moveSlots) {
					if (moveSlot.id !== this.effectState.move && this.effectState.time > 0) {
						pokemon.disableMove(moveSlot.id);
					}
				}
			},
			onBeforeMovePriority: 5,
			onBeforeMove(attacker, defender, move) {
				if (move.id !== this.effectState.move) this.effectState.severityModifier = 1 - (3 * this.effectState.severity / 100) % 1;
			}
		},
	},
	endure: {
		inherit: true,
		condition: {
			duration: 1,
			onStart(target) {
				if (target.volatiles['stall']) {
					this.add('-singleturn', target, 'move: Endure', '[severity] ' + target.volatiles['stall'].severity);
					this.effectState.severity = target.volatiles['stall'].severity;
				}
				else this.add('-singleturn', target, 'move: Endure', '[severity] ' + Scripts.severity);
			},
			onDamagePriority: -10,
			onDamage(damage, target, source, effect) {
				let hpResult = target.maxhp - target.maxhp * this.effectState.severity / 100 + 1;
				if (effect?.effectType === 'Move' && target.hp >= hpResult && damage >= target.hp - hpResult) {
					this.add('-activate', target, 'move: Endure');
					return target.hp - hpResult;
				}
			},
		},
	},
	entrainment: {
		inherit: true,
		flags: {protect: 1, reflectable: 1, mirror: 1, allyanim: 1, binary: 1},
	},
	extremeevoboost: {
		inherit: true,
		isNonstandard: null,
	},
	facade: {
		inherit: true,
		onBasePower(basePower, pokemon) {
			if (pokemon.status === 'all') {
				return this.chainModify(1 + pokemon.statusState.severity / 167);
			} else if (pokemon.status === 'aff') {
				return this.chainModify(1 + pokemon.statusState.severity / 158);
			} else if (pokemon.status && pokemon.status !== 'slp') {
				return this.chainModify(1 + pokemon.statusState.severity / 100);
			}
		},
	},
	fairylock: {
		inherit: true,
		flags: {mirror: 1, authentic: 1, binary: 1},
	},
	feintattack: {
		inherit: true,
		isNonstandard: null,
	},
	flameburst: {
		inherit: true,
		isNonstandard: null,
	},
	flash: {
		inherit: true,
		isNonstandard: null,
	},
	fling: {
		inherit: true,
		flags: {protect: 1, mirror: 1, allyanim: 1, binary: 1},
	},
	focusenergy: {
		inherit: true,
		flags: {snatch: 1, binary: 1},
	},
	foresight: {
		inherit: true,
		isNonstandard: null,
		condition: {
			noCopy: true,
			onStart(pokemon) {
				this.add('-start', pokemon, 'Foresight', '[severity] ' + Scripts.severity);
				this.effectState.incomingSeverityModifier = this.effectState.severity / 100;
			},
			onNegateImmunity(pokemon, type) {
				if (pokemon.hasType('Ghost') && ['Normal', 'Fighting'].includes(type)) {
					return false;
				}
			},
			onModifyBoost(boosts) {
				if (boosts.evasion && boosts.evasion > 0) {
					boosts.evasion -= boosts.evasion * this.effectState.severity / 100;
				}
			},
		},
	},
	forestscurse: {
		inherit: true,
		flags: {protect: 1, reflectable: 1, mirror: 1, allyanim: 1, binary: 1},
	},
	freezyfrost: {
		inherit: true,
		accuracy: 100,
		basePower: 90,
		pp: 15,
	},
	frustration: {
		inherit: true,
		isNonstandard: null,
	},
	futuresight: {
		inherit: true,
		isFutureMove: true,
		onTry(source, target) {
			if (!target.side.addSlotCondition(target, 'futuremove')) return false;
			Object.assign(target.side.slotConditions[target.position]['futuremove'], {
				duration: 3,
				move: 'futuresight',
				source: source,
				moveData: {
					id: 'futuresight',
					name: "Future Sight",
					accuracy: 100,
					basePower: 120,
					category: "Special",
					priority: 0,
					flags: {},
					ignoreImmunity: false,
					effectType: 'Move',
					isFutureMove: true,
					type: 'Psychic',
				},
			});
			this.add('-start', source, 'move: Future Sight');
			return this.NOT_FAIL;
		},
	},
	gastroacid: {
		inherit: true,
		flags: {protect: 1, reflectable: 1, mirror: 1, allyanim: 1, binary: 1},
	},
	genesissupernova: {
		inherit: true,
		isNonstandard: null,
	},
	gigavolthavoc: {
		inherit: true,
		isNonstandard: null,
	},
	glitzyglow: {
		inherit: true,
		accuracy: 100,
		basePower: 90,
	},
	grassknot: {
		inherit: true,
		onTryHit() {},
	},
	grasswhistle: {
		inherit: true,
		isNonstandard: null,
	},
	grassyterrain: {
		inherit: true,
		condition: {
			duration: 5,
			durationCallback(source, effect) {
				if (source?.hasItem('terrainextender')) {
					return 8;
				}
				return 5;
			},
			onBasePower(basePower, attacker, defender, move) {
				const weakenedMoves = ['earthquake', 'bulldoze', 'magnitude'];
				if (weakenedMoves.includes(move.id) && defender.isGrounded() && !defender.isSemiInvulnerable()) {
					this.debug('move weakened by grassy terrain');
					return this.chainModify(0.5);
				}
				if (move.type === 'Grass' && attacker.isGrounded()) {
					this.debug('grassy terrain boost');
					return this.chainModify(1.5);
				}
			},
			onFieldStart(field, source, effect) {
				if (effect && effect.effectType === 'Ability') {
					this.add('-fieldstart', 'move: Grassy Terrain', '[from] ability: ' + effect, '[of] ' + source);
				} else {
					this.add('-fieldstart', 'move: Grassy Terrain');
				}
			},
			onResidualOrder: 5,
			onResidual(pokemon) {
				if (pokemon.isGrounded() && !pokemon.isSemiInvulnerable()) {
					this.heal(pokemon.baseMaxhp / 16, pokemon, pokemon);
				} else {
					this.debug(`Pokemon semi-invuln or not grounded; Grassy Terrain skipped`);
				}
			},
			onFieldResidualOrder: 21,
			onFieldResidualSubOrder: 3,
			onFieldEnd() {
				this.add('-fieldend', 'move: Grassy Terrain');
			},
		},
	},
	grudge: {
		inherit: true,
		condition: {
			onStart(pokemon) {
				this.add('-singlemove', pokemon, 'Grudge', '[severity] ' + Scripts.severity);
			},
			onFaint(target, source, effect) {
				if (!source || source.fainted || !effect) return;
				if (effect.effectType === 'Move' && !effect.isFutureMove && source.lastMove) {
					let move: Move = source.lastMove;
					if (move.isMax && move.baseMove) move = this.dex.moves.get(move.baseMove);

					for (const moveSlot of source.moveSlots) {
						if (moveSlot.id === move.id) {
							moveSlot.pp -= Math.floor(moveSlot.maxpp * this.effectState.severity / 100);
							this.add('-activate', source, 'move: Grudge', move.name);
						}
					}
				}
			},
			onBeforeMovePriority: 100,
			onBeforeMove(pokemon) {
				this.debug('removing Grudge before attack');
				pokemon.removeVolatile('grudge');
			},
		},
	},
	guardianofalola: {
		inherit: true,
		isNonstandard: null,
	},
	guardsplit: {
		inherit: true,
		onHit(target, source) {
			const newdef = Math.floor((target.storedStats.def + source.storedStats.def) / 2);
			target.storedStats.def -= (target.storedStats.def - newdef) * Scripts.severity! / 100;
			source.storedStats.def -= (source.storedStats.def - newdef) * Scripts.severity! / 100;
			const newspd = Math.floor((target.storedStats.spd + source.storedStats.spd) / 2);
			target.storedStats.spd -= (target.storedStats.spd - newdef) * Scripts.severity! / 100;
			source.storedStats.spd -= (source.storedStats.spd - newdef) * Scripts.severity! / 100;
			this.add('-activate', source, 'move: Guard Split', '[of] ' + target);
		},
	},
	guardswap: {
		inherit: true,
		onHit(target, source) {
			const newTargetBoosts: SparseBoostsTable = {};
			const newSourceBoosts: SparseBoostsTable = {};

			const defSpd: BoostID[] = ['def', 'spd'];
			for (const stat of defSpd) {
				newTargetBoosts[stat] = target.boosts[stat] - (target.boosts[stat] - source.boosts[stat]) * Scripts.severity! / 100;
				newSourceBoosts[stat] = source.boosts[stat] - (source.boosts[stat] - target.boosts[stat]) * Scripts.severity! / 100;
			}

			source.setBoost(newSourceBoosts);
			target.setBoost(newTargetBoosts);

			this.add('-swapboost', source, target, 'def, spd', '[from] move: Guard Swap', '[severity] ' + Scripts.severity);
		},
	},
	haze: {
		inherit: true,
		onHitField() {
			this.add('-clearallboost', '[from] move: Haze', '[severity] ' + Scripts.severity);
			for (const pokemon of this.getAllActive()) {
				const newBoosts: SparseBoostsTable = {};
				let i: BoostID;
				for (i in pokemon.boosts)
				{
					newBoosts[i] = pokemon.boosts[i] - pokemon.boosts[i] * Scripts.severity! / 100;
				}

				pokemon.setBoost(newBoosts);
			}
		},
	},
	healbell: {
		inherit: true,
		onHit(pokemon, source, move) {
			this.add('-activate', source, 'move: Heal Bell');
			const side = pokemon.side;
			let success = false;
			for (const ally of side.pokemon) {
				if (ally.hasAbility('soundproof')) continue;
				
				if (Scripts.severity! >= ally.statusState.severity) {
					if (ally.cureStatus()) success = true;
				} else {
					let status = ally.getStatus();
					let originalSeverity = Scripts.severity!;
					let severity = ally.statusState.severity - originalSeverity;
					if (ally.clearStatus()) {
						Scripts.severity = severity;
						move.flags.lesser = 1;
						ally.setStatus(status, pokemon, move);
						Scripts.severity = originalSeverity;
						success = true;
					}
				}
			}
			return success;
		},
	},
	healblock: {
		inherit: true,
		isNonstandard: null,
		condition: {
			duration: 5,
			durationCallback(target, source, effect) {
				if (source?.hasAbility('persistent')) {
					this.add('-activate', source, 'ability: Persistent', effect);
					return 7;
				}
				return 5;
			},
			onStart(pokemon, source) {
				this.add('-start', pokemon, 'move: Heal Block', '[severity] ' + Scripts.severity);
				//max 5 turns
				this.effectState.time = Math.floor(5 * this.effectState.severity / 100) + 1;
				source.moveThisTurnResult = true;
			},
			onDisableMove(pokemon) {
				for (const moveSlot of pokemon.moveSlots) {
					if (this.dex.moves.get(moveSlot.id).flags['heal'] && this.effectState.time > 0) {
						pokemon.disableMove(moveSlot.id);
					}
				}
			},
			onBeforeMovePriority: 6,
			onBeforeMove(pokemon, target, move) {
				if (move.flags['heal'] && !move.isZ && !move.isMax && this.effectState.time > 0) {
					this.add('cant', pokemon, 'move: Heal Block', move);
					return false;
				}
			},
			onModifyMove(move, pokemon, target) {
				if (move.flags['heal'] && !move.isZ && !move.isMax && this.effectState.time > 0) {
					this.add('cant', pokemon, 'move: Heal Block', move);
					return false;
				}
			},
			onResidualOrder: 20,
			onResidual() {
				this.effectState.time--;
			},
			onEnd(pokemon) {
				this.add('-end', pokemon, 'move: Heal Block');
			},
			onTryHeal(damage, target, source, effect) {
				if ((effect?.id === 'zpower') || this.effectState.isZ || this.effectState.time <= 0) return damage;
				return false;
			},
			onRestart(target, source) {
				this.add('-fail', target, 'move: Heal Block'); // Succeeds to supress downstream messages
				if (!source.moveThisTurnResult) {
					source.moveThisTurnResult = false;
				}
			},
		},
	},
	healingwish: {
		inherit: true,
		condition: {
			duration: 2,
			onSwitchInPriority: 1,
			onSwitchIn(target) {
				if (!target.fainted) {
					target.heal(target.maxhp);
					target.setStatus('');
					this.add('-heal', target, target.getHealth.bind(target), '[from] move: Healing Wish');
					target.side.removeSlotCondition(target, 'healingwish');
				}
			},
		},
	},
	healorder: {
		inherit: true,
		isNonstandard: null,
	},
	heartstamp: {
		inherit: true,
		isNonstandard: null,
	},
	heartswap: {
		inherit: true,
		isNonstandard: null,
		onHit(target, source) {
			const newTargetBoosts: SparseBoostsTable = {};
			const newSourceBoosts: SparseBoostsTable = {};

			let i: BoostID;
			for (i in target.boosts) {
				newTargetBoosts[i] = target.boosts[i] - (target.boosts[i] - source.boosts[i]) * Scripts.severity! / 100;
				newSourceBoosts[i] = source.boosts[i] - (source.boosts[i] - target.boosts[i]) * Scripts.severity! / 100;
			}

			target.setBoost(newTargetBoosts);
			source.setBoost(newSourceBoosts);

			this.add('-swapboost', source, target, '[from] move: Heart Swap');
		},
	},
	heatcrash: {
		inherit: true,
		onTryHit() {},
	},
	heavyslam: {
		inherit: true,
		onTryHit() {},
	},
	hex: {
		inherit: true,
		basePowerCallback(pokemon, target, move) {
			if (target.status || target.hasAbility('comatose')) return move.basePower * (1 + target.statusState.severity / 100);
			return move.basePower;
		},
	},
	hiddenpower: {
		inherit: true,
		isNonstandard: null,
	},
	hiddenpowerbug: {
		inherit: true,
		isNonstandard: null,
	},
	hiddenpowerdark: {
		inherit: true,
		isNonstandard: null,
	},
	hiddenpowerdragon: {
		inherit: true,
		isNonstandard: null,
	},
	hiddenpowerelectric: {
		inherit: true,
		isNonstandard: null,
	},
	hiddenpowerfighting: {
		inherit: true,
		isNonstandard: null,
	},
	hiddenpowerfire: {
		inherit: true,
		isNonstandard: null,
	},
	hiddenpowerflying: {
		inherit: true,
		isNonstandard: null,
	},
	hiddenpowerghost: {
		inherit: true,
		isNonstandard: null,
	},
	hiddenpowergrass: {
		inherit: true,
		isNonstandard: null,
	},
	hiddenpowerground: {
		inherit: true,
		isNonstandard: null,
	},
	hiddenpowerice: {
		inherit: true,
		isNonstandard: null,
	},
	hiddenpowerpoison: {
		inherit: true,
		isNonstandard: null,
	},
	hiddenpowerpsychic: {
		inherit: true,
		isNonstandard: null,
	},
	hiddenpowerrock: {
		inherit: true,
		isNonstandard: null,
	},
	hiddenpowersteel: {
		inherit: true,
		isNonstandard: null,
	},
	hiddenpowerwater: {
		inherit: true,
		isNonstandard: null,
	},
	highjumpkick: {
		inherit: true,
		onAfterHit(target, source, move) {
			let modifiedAccuracy = Scripts.actions!.finalAccuracy;
			let modifiedDamage;
			if (typeof modifiedAccuracy === 'number') {
				modifiedAccuracy = this.clampIntRange(modifiedAccuracy, 0, 100);
				modifiedDamage = move.basePower * modifiedAccuracy / 100;
			}
			else modifiedDamage = move.basePower;
			this.damage(Math.round(source.maxhp / 2) * (1 - modifiedDamage / move.basePower), source, source, move);
		},
	},
	howl: {
		inherit: true,
		flags: {snatch: 1},
		boosts: {
			atk: 1,
		},
		target: "self",
	},
	hydrovortex: {
		inherit: true,
		isNonstandard: null,
	},
	hyperfang: {
		inherit: true,
		isNonstandard: null,
	},
	hyperspacefury: {
		inherit: true,
		isNonstandard: null,
	},
	hyperspacehole: {
		inherit: true,
		isNonstandard: null,
	},
	iceball: {
		inherit: true,
		isNonstandard: null,
		basePowerCallback(pokemon, target, move) {
			let bp = move.basePower;
			if (pokemon.volatiles['iceball'] && pokemon.volatiles['iceball'].hitCount) {
				bp *= Math.pow(2, pokemon.volatiles['iceball'].hitCount);
				if (typeof move.accuracy === 'number') {
					bp *= Math.pow(move.accuracy / 100, pokemon.volatiles['iceball'].hitCount);
				}
			}
			if (pokemon.status !== 'slp') pokemon.addVolatile('iceball');
			if (pokemon.volatiles['defensecurl']) {
				bp *= 2;
			}
			this.debug("Ice Ball bp: " + bp);
			return bp;
		},
	},
	icehammer: {
		inherit: true,
		isNonstandard: null,
	},
	imprison: {
		inherit: true,
		condition: {
			noCopy: true,
			onStart(target) {
				this.add('-start', target, 'move: Imprison', '[severity] ' + Scripts.severity);
			},
			onFoeDisableMove(pokemon) {
				if (this.effectState.severity < 100) return;
				for (const moveSlot of this.effectState.source.moveSlots) {
					if (moveSlot.id === 'struggle') continue;
					pokemon.disableMove(moveSlot.id, 'hidden');
				}
				pokemon.maybeDisabled = true;
			},
			onFoeBeforeMovePriority: 4,
			onFoeBeforeMove(attacker, defender, move) {
				if (move.id !== 'struggle' && this.effectState.source.hasMove(move.id) && !move.isZ && !move.isMax) {
					if (this.effectState.severity === 100) {
						this.add('cant', attacker, 'move: Imprison', move);
						return false;
					} else {
						Scripts.severity = this.effectState.severity;
						attacker.addVolatile('imprisoned');
					}
				}
			}
		},
	},
	incinerate: {
		inherit: true,
		onHit(pokemon, source) {
			const item = pokemon.getItem();
			if ((item.isBerry || item.isGem) && Scripts.severity! >= 50 && pokemon.takeItem(source)) {
				this.add('-enditem', pokemon, item.name, '[from] move: Incinerate');
			}
		},
	},
	infernooverdrive: {
		inherit: true,
		isNonstandard: null,
	},
	ingrain: {
		inherit: true,
		condition: {
			onStart(pokemon) {
				this.add('-start', pokemon, 'move: Ingrain', '[severity] ' + Scripts.severity!);
			},
			onResidualOrder: 7,
			onResidual(pokemon) {
				this.heal(pokemon.baseMaxhp * this.effectState.severity / 1600);
			},
			onTrapPokemon(pokemon) {
				if (this.effectState.severity >= 50) pokemon.tryTrap();
			},
			// groundedness implemented in battle.engine.js:BattlePokemon#isGrounded
			onDragOut(pokemon) {
				if (this.effectState.severity >= 50) {
					this.add('-activate', pokemon, 'move: Ingrain');
					return null;
				}
			},
		},
	},
	iondeluge: {
		inherit: true,
		isNonstandard: null,
	},
	judgment: {
		inherit: true,
		isNonstandard: null,
	},
	jumpkick: {
		inherit: true,
		isNonstandard: null,
		onAfterHit(target, source, move) {
			let modifiedAccuracy = Scripts.actions!.finalAccuracy;
			let modifiedDamage;
			if (typeof modifiedAccuracy === 'number') {
				modifiedAccuracy = this.clampIntRange(modifiedAccuracy, 0, 100);
				modifiedDamage = move.basePower * modifiedAccuracy / 100;
			} else modifiedDamage = move.basePower;
			this.damage(Math.round(source.maxhp / 2) * (1 - modifiedDamage / move.basePower), source, source, move);
		},
	},
	
	karatechop: {
		inherit: true,
		isNonstandard: null,
	},
	kingsshield: {
		inherit: true,
		condition: {
			duration: 1,
			onStart(target) {
				if (target.volatiles['stall']) {
					this.add('-singleturn', target, 'Protect', '[severity] ' + target.volatiles['stall'].severity * Scripts.severity! / 100);
					this.effectState.severity = target.volatiles['stall'].severity;
				}
				else this.add('-singleturn', target, 'Protect', '[severity] ' + Scripts.severity);

				this.effectState.incomingSeverityModifier = 1 - this.effectState.severity / 100;
			},
			onTryHitPriority: 3,
			onTryHit(target, source, move) {
				if (!move.flags['protect'] || move.category === 'Status') {
					if (['gmaxoneblow', 'gmaxrapidflow'].includes(move.id)) return;
					if (move.isZ || move.isMax) target.getMoveHitData(move).zBrokeProtect = true;
					return;
				}
				if (move.smartTarget) {
					move.smartTarget = false;
				} else {
					this.add('-activate', target, 'move: Protect');
				}
				const lockedmove = source.getVolatile('lockedmove');
				if (lockedmove && this.effectState.severity === 100) {
					// Outrage counter is reset
					if (source.volatiles['lockedmove'].duration === 2) {
						delete source.volatiles['lockedmove'];
					}
				}
				if (this.checkMoveMakesContact(move, source, target)) {
					Scripts.severity = this.effectState.severity;
					this.boost({atk: -1}, source, target, this.dex.getActiveMove("King's Shield"));
				}
				if (this.effectState.severity === 100) return this.NOT_FAIL;
				else return;
			},
			onHit(target, source, move) {
				if (move.isZOrMaxPowered && this.checkMoveMakesContact(move, source, target)) {
					Scripts.severity = this.effectState.severity;
					this.boost({atk: -1}, source, target, this.dex.getActiveMove("King's Shield"));
				}
			},
		},
	},
	knockoff: {
		inherit: true,
		onBasePower(basePower, source, target, move) {
			const item = target.getItem();
			if (Scripts.severity! < 50 && !this.singleEvent('TakeItem', item, target.itemState, target, target, move, item)) return;
			if (item.id) {
				return this.chainModify(1.5);
			}
		},
		onAfterHit(target, source) {
			if (source.hp && Scripts.severity! >= 50 ) {
				const item = target.takeItem();
				if (item) {
					this.add('-enditem', target, item.name, '[from] move: Knock Off', '[of] ' + source);
				}
			}
		},
	},
	laserfocus: {
		inherit: true,
		condition: {
			duration: 2,
			onStart(pokemon, source, effect) {
				if (effect && (['imposter', 'psychup', 'transform'].includes(effect.id))) {
					this.add('-start', pokemon, 'move: Laser Focus', '[silent]');
				} else {
					this.add('-start', pokemon, 'move: Laser Focus', '[severity] ' + Scripts.severity);
				}
			},
			onRestart(pokemon) {
				this.effectState.duration = 2;
				this.add('-start', pokemon, 'move: Laser Focus', '[severity] ' + Scripts.severity);
			},
			onModifyCritRatio(critRatio) {
				return Math.ceil(5 * this.effectState.severity / 100);
			},
			onEnd(pokemon) {
				this.add('-end', pokemon, 'move: Laser Focus', '[silent]');
			},
		},
	},
	leechseed: {
		inherit: true,
		condition: {
			onStart(target) {
				this.add('-start', target, 'move: Leech Seed', '[severity] ' + Scripts.severity);
			},
			onResidualOrder: 8,
			onResidual(pokemon) {
				const target = this.getAtSlot(pokemon.volatiles['leechseed'].sourceSlot);
				if (!target || target.fainted || target.hp <= 0) {
					this.debug('Nothing to leech into');
					return;
				}
				const damage = this.damage((pokemon.baseMaxhp / 8) * (this.effectState.severity / 100), pokemon, target);
				if (damage) {
					this.heal(damage, target, pokemon);
				}
			},
		},
	},
	letssnuggleforever: {
		inherit: true,
		isNonstandard: null,
	},
	lightofruin: {
		inherit: true,
		isNonstandard: "Unobtainable",
	},
	lightthatburnsthesky: {
		inherit: true,
		isNonstandard: null,
	},
	lockon: {
		inherit: true,
		onTryHit(target, source) {
			if (source.volatiles['lockon']) return false;
		},
		onHit(target, source) {
			source.addVolatile('lockon', target);
			this.add('-start', source, 'Lock-On', '[of] ' + target, '[severity] ' + Scripts.severity);
		},
		condition: {
			noCopy: true, // doesn't get copied by Baton Pass
			duration: 2,
			onSourceInvulnerabilityPriority: 1,
			onSourceInvulnerability(target, source, move) {
				if (move && source === this.effectState.target && target === this.effectState.source && this.effectState.severity >= 50) return 0;
			},
			onSourceAccuracy(accuracy, target, source, move) {
				if (move && source === this.effectState.target && target === this.effectState.source) {
					if (accuracy === 100) return 100;
					else if (typeof accuracy === 'number') {
						return accuracy + (100 - accuracy) * this.effectState.severity / 100;
					}
				}
			},
			onEnd(source) {
				this.add('-end', source, 'Lock-On', '[silent]');
			},
		},
	},
	lowkick: {
		inherit: true,
		onTryHit() {},
	},
	luckychant: {
		inherit: true,
		isNonstandard: null,
	},
	lunardance: {
		inherit: true,
		condition: {
			duration: 2,
			onSwitchInPriority: 1,
			onSwitchIn(target) {
				if (!target.fainted) {
					target.heal(target.maxhp);
					target.setStatus('');
					for (const moveSlot of target.moveSlots) {
						moveSlot.pp = moveSlot.maxpp;
					}
					this.add('-heal', target, target.getHealth.bind(target), '[from] move: Lunar Dance');
					target.side.removeSlotCondition(target, 'lunardance');
				}
			},
		},
	},
	magiccoat: {
		inherit: true,
		condition: {
			duration: 1,
			onStart(target, source, effect) {
				this.add('-singleturn', target, 'move: Magic Coat', '[severity] ' + Scripts.severity);
				if (effect?.effectType === 'Move') {
					this.effectState.pranksterBoosted = effect.pranksterBoosted;
				}
			},
			onTryHitPriority: 2,
			onTryHit(target, source, move) {
				if (target === source || move.hasBounced || !move.flags['reflectable']) {
					return;
				}

				const newMove = this.dex.getActiveMove(move.id);
				newMove.hasBounced = true;
				newMove.pranksterBoosted = this.effectState.pranksterBoosted;
				this.actions.useMove(newMove, target, source);

				Scripts.severity = this.effectState.severity;
				source.addVolatile('movestolen');
			},
			onAllyTryHitSide(target, source, move) {
				if (target.isAlly(source) || move.hasBounced || !move.flags['reflectable']) {
					return;
				}

				const newMove = this.dex.getActiveMove(move.id);
				newMove.hasBounced = true;
				newMove.pranksterBoosted = false;
				this.actions.useMove(newMove, this.effectState.target, source);
				
				Scripts.severity = this.effectState.severity;
				source.addVolatile('movestolen');
			},
		},
	},
	magnetbomb: {
		inherit: true,
		isNonstandard: null,
	},
	magnetrise: {
		inherit: true,
		onTry(source, target, move) {
			if (target.volatiles['smackdown'] || target.volatiles['ingrain'] && target.volatiles['ingrain'].severity >= 50) return false;

			// Additional Gravity check for Z-move variant
			if (this.field.getPseudoWeather('Gravity')) {
				this.add('cant', source, 'move: Gravity', move);
				return null;
			}
		},
		condition: {
			duration: 5,
			onStart(target) {
				this.add('-start', target, 'Magnet Rise', '[severity] ' + Scripts.severity);

				//max 5 turns
				this.effectState.duration = Math.round(5 * this.effectState.severity / 100);
			},
			onImmunity(type) {
				if (type === 'Ground') return false;
			},
			onResidualOrder: 18,
			onEnd(target) {
				this.add('-end', target, 'Magnet Rise');
			},
		},
	},
	magnitude: {
		inherit: true,
		isNonstandard: null,
		basePower: 71,
		onModifyMove(move, pokemon) {},
		onUseMoveMessage(pokemon, target, move) {},
	},
	maliciousmoonsault: {
		inherit: true,
		isNonstandard: null,
	},
	meditate: {
		inherit: true,
		isNonstandard: null,
	},
	mefirst: {
		inherit: true,
		isNonstandard: null,
	},
	menacingmoonrazemaelstrom: {
		inherit: true,
		isNonstandard: null,
	},
	metronome: {
		inherit: true,
		accuracy: 96,
		basePower: 48,
		category: "Special",
		useAverageStats: true,
		flags: {protect: 1, mirror: 1},
		onModifyMove(move, pokemon, target) {
			move.type = '???';
		},
		onHit(target, source, effect) {},
		secondaries: [
			{
				chance: 2,
				self: {
					boosts: {
						atk: 1,
						def: 1,
						spa: 1,
						spd: 1,
						spe: 1,
						accuracy: 1,
						evasion: 1,
					},
				},
			}, {
				chance: 2,
				boosts: {
					atk: -1,
					def: -1,
					spa: -1,
					spd: -1,
					spe: -1,
					accuracy: -1,
					evasion: -1,
				},
			}, {
				chance: 15,
				status: 'all',
			},
		],
		target: "normal",
	},
	mimic: {
		inherit: true,
		flags: {protect: 1, authentic: 1, allyanim: 1, binary: 1},
	},
	mindreader: {
		inherit: true,
		onTryHit(target, source) {
			if (source.volatiles['lockon']) return false;
		},
		onHit(target, source) {
			source.addVolatile('lockon', target);
			this.add('-start', source, 'Lock-On', '[of] ' + target, '[severity] ' + Scripts.severity);
		},
	},
	minimize: {
		inherit: true,
		condition: {
			noCopy: true,
			onStart(pokemon) {
				this.add('-start', pokemon, 'Minimize', '[severity]' + Scripts.severity);
			},
			onSourceModifyDamage(damage, source, target, move) {
				const boostedMoves = [
					'stomp', 'steamroller', 'bodyslam', 'flyingpress', 'dragonrush', 'heatcrash', 'heavyslam', 'maliciousmoonsault',
				];
				if (boostedMoves.includes(move.id)) {
					return this.chainModify(1 + this.effectState.severity / 100);
				}
			},
			onAccuracy(accuracy, target, source, move) {
				const boostedMoves = [
					'stomp', 'steamroller', 'bodyslam', 'flyingpress', 'dragonrush', 'heatcrash', 'heavyslam', 'maliciousmoonsault',
				];
				if (boostedMoves.includes(move.id)) {
					if (typeof move.accuracy === 'number') {
						return accuracy + (100 - accuracy) * this.effectState.severity / 100;
					}
				}
				return accuracy;
			},
		},
	},
	miracleeye: {
		inherit: true,
		isNonstandard: null,
		condition: {
			noCopy: true,
			onStart(pokemon) {
				this.add('-start', pokemon, 'Miracle Eye', '[severity]' + Scripts.severity);
				this.effectState.incomingSeverityModifier = this.effectState.severity / 100;
			},
			onNegateImmunity(pokemon, type) {
				if (pokemon.hasType('Dark') && type === 'Psychic') return false;
			},
			onModifyBoost(boosts) {
				if (boosts.evasion && boosts.evasion > 0) {
					boosts.evasion -= boosts.evasion * this.effectState.severity / 100;
				}
			},
		},
	},
	mirrorcoat: {
		inherit: true,
		condition: {
			duration: 1,
			noCopy: true,
			onStart(target, source, move) {
				this.effectState.slot = null;
				this.effectState.damage = 0;
			},
			onRedirectTargetPriority: -1,
			onRedirectTarget(target, source, source2, move) {
				if (move.id !== 'mirrorcoat') return;
				if (source !== this.effectState.target || !this.effectState.slot) return;
				return this.getAtSlot(this.effectState.slot);
			},
			onDamagingHit(damage, target, source, move) {
				if (!source.isAlly(target) && (this.getCategory(move) === 'Special' || move.useAverageStats)) {
					this.effectState.slot = source.getSlot();
					this.effectState.damage = 2 * damage;
				}
			},
		},
	},
	mirrormove: {
		inherit: true,
		isNonstandard: null,
	},
	mirrorshot: {
		inherit: true,
		isNonstandard: null,
	},
	mudbomb: {
		inherit: true,
		isNonstandard: null,
	},
	mudsport: {
		inherit: true,
		isNonstandard: null,
	},
	multiattack: {
		inherit: true,
		basePower: 90,
	},
	naturalgift: {
		inherit: true,
		isNonstandard: null,
		flags: {protect: 1, mirror: 1, binary: 1},
	},
	needlearm: {
		inherit: true,
		isNonstandard: null,
	},
	neverendingnightmare: {
		inherit: true,
		isNonstandard: null,
	},
	nightmare: {
		inherit: true,
		isNonstandard: null,
		condition: {
			noCopy: true,
			onStart(pokemon) {
				if ((pokemon.status !== 'slp' || pokemon.status !== 'aff' || pokemon.status !== 'all') && !pokemon.hasAbility('comatose')) {
					return false;
				}
				this.add('-start', pokemon, 'Nightmare', '[severity]' + Scripts.severity);
			},
			onResidualOrder: 11,
			onResidual(pokemon) {
				if (pokemon.hasAbility('comatose')) {
					this.damage(pokemon.baseMaxhp / 4);
				} else if (pokemon.status === 'all') {
					this.damage((pokemon.baseMaxhp / 4) * (pokemon.statusState.severity / 500));
				} else if (pokemon.status === 'aff') {
					this.damage((pokemon.baseMaxhp / 4) * (pokemon.statusState.severity / 273));
				} else {
					this.damage((pokemon.baseMaxhp / 4) * (pokemon.statusState.severity / 100));
				}
			},
		},
	},
	oceanicoperetta: {
		inherit: true,
		isNonstandard: null,
	},
	odorsleuth: {
		inherit: true,
		isNonstandard: null,
	},
	ominouswind: {
		inherit: true,
		isNonstandard: null,
	},
	painsplit: {
		inherit: true,
		onHit(target, pokemon) {
			const targetHP = target.getUndynamaxedHP();
			const averagehp = Math.floor((targetHP + pokemon.hp) / 2) || 1;
			target.sethp(target.hp - (target.hp - averagehp) * Scripts.severity! / 100);
			this.add('-sethp', target, target.getHealth.bind(target), '[from] move: Pain Split', '[silent]');
			pokemon.sethp(pokemon.hp - (pokemon.hp - averagehp) * Scripts.severity! / 100);
			this.add('-sethp', pokemon, pokemon.getHealth.bind(pokemon), '[from] move: Pain Split');
		},
	},
	partingshot: {
		inherit: true,
		flags: {protect: 1, reflectable: 1, mirror: 1, sound: 1, authentic: 1, binary: 1},
	},
	perishsong: {
		inherit: true,
		onHitField(target, source, move) {
			let result = false;
			let message = false;
			for (const pokemon of this.getAllActive()) {
				if (this.runEvent('Invulnerability', pokemon, source, move) === false) {
					this.add('-miss', source, pokemon);
					result = true;
				} else if (this.runEvent('TryHit', pokemon, source, move) === null) {
					result = true;
				} else if (!pokemon.volatiles['perishsong']) {
					pokemon.addVolatile('perishsong');
					this.add('-start', pokemon, 'perish3', '[silent]', '[severity] ' + Scripts.severity);
					result = true;
					message = true;
				}
			}
			if (!result) return false;
			if (message) this.add('-fieldactivate', 'move: Perish Song');
		},
		condition: {
			duration: 4,
			onEnd(target) {
				this.add('-start', target, 'perish0', '[severity] ' + this.effectState.severity);
				this.damage(target.maxhp * this.effectState.severity / 100, target);
				this.add('-end', target, 'perish0', '[silent]');
			},
			onResidualOrder: 24,
			onResidual(pokemon) {
				const duration = pokemon.volatiles['perishsong'].duration;
				this.add('-start', pokemon, 'perish' + duration, '[severity] ' + this.effectState.severity);
			},
		},
	},
	pluck: {
		inherit: true,
		onHit(target, source) {
			const item = target.getItem();
			if (source.hp && item.isBerry && Scripts.severity! >= 50 && target.takeItem(source)) {
				this.add('-enditem', target, item.name, '[from] stealeat', '[move] Pluck', '[of] ' + source);
				if (this.singleEvent('Eat', item, null, source, null, null)) {
					this.runEvent('EatItem', source, null, null, item);
					if (item.id === 'leppaberry') target.staleness = 'external';
				}
				if (item.onEat) source.ateBerry = true;
			}
		},
	},
	powder: {
		inherit: true,
		isNonstandard: null,
		condition: {
			duration: 1,
			onStart(target) {
				this.add('-singleturn', target, 'Powder', '[severity] ' + Scripts.severity);
				this.effectState.severityModifier = 1 - this.effectState.severity / 100; 
			},
			onTryMovePriority: -1,
			onTryMove(pokemon, target, move) {
				if (move.type === 'Fire') {
					this.add('-activate', pokemon, 'move: Powder');
					this.damage(this.clampIntRange(Math.round(pokemon.maxhp * this.effectState.severity / 400), 1));
					return this.effectState.severity < 100
				}
			},
		},
	},
	powersplit: {
		inherit: true,
		onHit(target, source) {
			const newatk = Math.floor((target.storedStats.atk + source.storedStats.atk) / 2);
			target.storedStats.atk -= (target.storedStats.atk - newatk) * Scripts.severity! / 100;
			source.storedStats.atk -= (source.storedStats.atk - newatk) * Scripts.severity! / 100;
			const newspa = Math.floor((target.storedStats.spa + source.storedStats.spa) / 2);
			target.storedStats.spa -= (target.storedStats.spa - newspa) * Scripts.severity! / 100;
			source.storedStats.spa -= (source.storedStats.spa - newspa) * Scripts.severity! / 100;
			this.add('-activate', source, 'move: Power Split', '[of] ' + target);
		},
	},
	powerswap: {
		inherit: true,
		onHit(target, source) {
			const newTargetBoosts: SparseBoostsTable = {};
			const newSourceBoosts: SparseBoostsTable = {};

			const atkSpa: BoostID[] = ['atk', 'spa'];
			for (const stat of atkSpa) {
				newTargetBoosts[stat] = target.boosts[stat] - (target.boosts[stat] - source.boosts[stat]) * Scripts.severity! / 100;
				newSourceBoosts[stat] = source.boosts[stat] - (source.boosts[stat] - target.boosts[stat]) * Scripts.severity! / 100;
			}

			source.setBoost(newSourceBoosts);
			target.setBoost(newTargetBoosts);

			this.add('-swapboost', source, target, 'atk, spa', '[from] move: Power Swap');
		},
	},
	precipiceblades: {
		inherit: true,
		isNonstandard: null,
	},
	present: {
		inherit: true,
		basePower: 49,
		onModifyMove(move, pokemon, target) {},
	},
	protect: {
		inherit: true,
		condition: {
			duration: 1,
			onStart(target) {
				if (target.volatiles['stall']) {
					this.add('-singleturn', target, 'Protect', '[severity] ' + target.volatiles['stall'].severity * Scripts.severity! / 100);
					this.effectState.severity = target.volatiles['stall'].severity;
				}
				else this.add('-singleturn', target, 'Protect', '[severity] ' + Scripts.severity);

				this.effectState.incomingSeverityModifier = 1 - this.effectState.severity / 100;
			},
			onTryHitPriority: 3,
			onTryHit(target, source, move) {
				if (!move.flags['protect']) {
					if (['gmaxoneblow', 'gmaxrapidflow'].includes(move.id)) return;
					if (move.isZ || move.isMax) target.getMoveHitData(move).zBrokeProtect = true;
					return;
				}
				if (move.smartTarget) {
					move.smartTarget = false;
				} else {
					this.add('-activate', target, 'move: Protect');
				}
				const lockedmove = source.getVolatile('lockedmove');
				if (lockedmove && this.effectState.severity === 100) {
					// Outrage counter is reset
					if (source.volatiles['lockedmove'].duration === 2) {
						delete source.volatiles['lockedmove'];
					}
				}
				if (this.effectState.severity === 100) return this.NOT_FAIL;
				else return;
			},
		},
	},
	psychicterrain: {
		inherit: true,
		condition: {
			duration: 5,
			durationCallback(source, effect) {
				if (source?.hasItem('terrainextender')) {
					return 8;
				}
				return 5;
			},
			onTryHitPriority: 4,
			onTryHit(target, source, effect) {
				if (!target.isGrounded() || target.isSemiInvulnerable() || target.isAlly(source)) return;
				if (effect && (effect.priority <= 0.1 || effect.target === 'self')) {
					return;
				}
				this.add('-activate', target, 'move: Psychic Terrain');
				return null;
			},
			onBasePower(basePower, attacker, defender, move) {
				if (move.type === 'Psychic' && attacker.isGrounded() && !attacker.isSemiInvulnerable()) {
					this.debug('psychic terrain boost');
					return this.chainModify(1.5);
				}
			},
			onFieldStart(field, source, effect) {
				if (effect && effect.effectType === 'Ability') {
					this.add('-fieldstart', 'move: Psychic Terrain', '[from] ability: ' + effect, '[of] ' + source);
				} else {
					this.add('-fieldstart', 'move: Psychic Terrain');
				}
			},
			onFieldResidualOrder: 21,
			onFieldResidualSubOrder: 2,
			onFieldEnd() {
				this.add('-fieldend', 'move: Psychic Terrain');
			},
		},
	},
	psychoboost: {
		inherit: true,
		isNonstandard: null,
	},
	psychoshift: {
		inherit: true,
		onTryHit(target, source, move) {
			if (!source.status) return false;
			move.status = source.status;
			if (typeof move.accuracy === 'number') move.accuracy *= source.statusState.severity / 100;
		},
		self: {
			onHit(pokemon, source, move) {
				if (Scripts.severity! >= pokemon.statusState.severity) {
					pokemon.cureStatus();
				} else {
					let status = pokemon.getStatus();
					let originalSeverity = Scripts.severity!;
					let severity = pokemon.statusState.severity - originalSeverity;
					if (pokemon.clearStatus()) {
						Scripts.severity = severity;
						move.flags.lesser = 1;
						pokemon.setStatus(status, pokemon, move);
						Scripts.severity = originalSeverity;
					}
				}
			},
		},
	},
	psychup: {
		inherit: true,
		onHit(target, source) {
			let i: BoostID;
			for (i in target.boosts) {
				source.boosts[i] = source.boosts[i] - (source.boosts[i] - target.boosts[i]) * Scripts.severity! / 100;
			}
			
			const volatilesToCopy = ['focusenergy', 'gmaxchistrike', 'laserfocus'];
			let originalSeverity = Scripts.severity!;
			for (const volatile of volatilesToCopy) {
				if (target.volatiles[volatile]) {
					Scripts.severity = target.volatiles[volatile].severity * originalSeverity / 100;
					source.addVolatile(volatile);
					if (volatile === 'gmaxchistrike') source.volatiles[volatile].layers = target.volatiles[volatile].layers;
				} else {
					source.removeVolatile(volatile);
				}
			}
			this.add('-copyboost', source, target, '[from] move: Psych Up', '[severity] ' + Scripts.severity);
		},
	},
	psywave: {
		isNonstandard: null,
		num: 149,
		accuracy: 100,
		basePower: 0,
		damage: 'level',
		category: "Special",
		name: "Psywave",
		pp: 15,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		secondary: null,
		target: "normal",
		type: "Psychic",
		contestType: "Clever",
	},
	pulverizingpancake: {
		inherit: true,
		isNonstandard: null,
	},
	punishment: {
		inherit: true,
		isNonstandard: null,
	},
	purify: {
		inherit: true,
		onHit(target, source, move) {
			let success = false;
			if (Scripts.severity! >= target.statusState.severity) {
				let statusSeverity = target.statusState.severity;
				if (target.cureStatus()) {
					this.heal(Math.ceil(source.maxhp * 0.5 * statusSeverity * Scripts.severity! / 10000), source);
					success = true;
				}
			} else {
				let status = target.getStatus();
				let originalSeverity = Scripts.severity!;
				let severity = target.statusState.severity - originalSeverity;
				if (target.clearStatus()) {
					Scripts.severity = severity;
					move.flags.lesser = 1;
					target.setStatus(status, source, move);
					this.heal(Math.ceil(source.maxhp * 0.5 * originalSeverity * Scripts.severity! / 10000), source);
					Scripts.severity = originalSeverity;
					success = true;
				}
			}
			return success;
		},
	},
	pursuit: {
		inherit: true,
		isNonstandard: null,
	},
	quash: {
		inherit: true,
		onHit(target) {
			if (this.activePerHalf === 1) return false; // fails in singles
			const action = this.queue.willMove(target);
			if (!action) return false;

			action.priority = -7.1;
			this.queue.cancelMove(target);
			for (let i = this.queue.list.length - 1; i >= 0; i--) {
				if (this.queue.list[i].choice === 'residual') {
					this.queue.list.splice(i, 0, action);
					break;
				}
			}
			this.add('-activate', target, 'move: Quash');
		},
	},
	quickguard: {
		inherit: true,
		condition: {
			duration: 1,
			onSideStart(target, source) {
				if (source.volatiles['stall']) {
					this.add('-singleturn', source, 'Quick Guard', '[severity] ' + source.volatiles['stall'].severity * Scripts.severity! / 100);
					this.effectState.severity = source.volatiles['stall'].severity;
				}
				else this.add('-singleturn', source, 'Quick Guard', '[severity] ' + Scripts.severity);

				this.effectState.incomingSeverityModifier = 1 - this.effectState.severity / 100;
			},
			onTryHitPriority: 4,
			onTryHit(target, source, move) {
				// Quick Guard blocks moves with positive priority, even those given increased priority by Prankster or Gale Wings.
				// (e.g. it blocks 0 priority moves boosted by Prankster or Gale Wings; Quick Claw/Custap Berry do not count)
				if (move.priority <= 0.1) return;
				if (!move.flags['protect']) {
					if (['gmaxoneblow', 'gmaxrapidflow'].includes(move.id)) return;
					if (move.isZ || move.isMax) target.getMoveHitData(move).zBrokeProtect = true;
					return;
				}
				this.add('-activate', target, 'move: Quick Guard');
				const lockedmove = source.getVolatile('lockedmove');
				if (lockedmove && this.effectState.severity === 100) {
					// Outrage counter is reset
					if (source.volatiles['lockedmove'].duration === 2) {
						delete source.volatiles['lockedmove'];
					}
				}
				if (this.effectState.severity === 100) return this.NOT_FAIL;
				else return;
			},
		},
	},
	rage: {
		inherit: true,
		isNonstandard: null,
	},
	rapidspin: {
		inherit: true,
		basePower: 20,
		secondary: null,
	},
	razorwind: {
		inherit: true,
		isNonstandard: null,
	},
	recycle: {
		inherit: true,
		flags: {snatch: 1, binary: 1},
	},
	reflecttype: {
		inherit: true,
		flags: {protect: 1, authentic: 1, allyanim: 1, binary: 1},
	},
	refresh: {
		inherit: true,
		isNonstandard: null,
	},
	relicsong: {
		inherit: true,
		isNonstandard: null,
	},
	rest: {
		inherit: true,
		onTry(source) {
			if (source.status === 'slp' && source.statusState.severity === 100 || source.hasAbility('comatose')) return false;

			if (source.hp === source.maxhp) {
				this.add('-fail', source, 'heal');
				return null;
			}
			if (source.hasAbility(['insomnia', 'vitalspirit'])) {
				this.add('-fail', source, '[from] ability: ' + source.getAbility().name, '[of] ' + source);
				return null;
			}
		},
		onHit(target, source, move) {
			let originalSeverity = Scripts.severity!;
			let severity = originalSeverity;
			if (Scripts.severity! < target.statusState.severity) severity = target.statusState.severity;
			target.clearStatus();
			Scripts.severity = severity;
			if (!target.setStatus('slp', source, move)) return false;
			Scripts.severity = originalSeverity;
			this.heal(target.maxhp * Scripts.severity! / 100);
		},
	},
	return: {
		inherit: true,
		isNonstandard: null,
	},
	revelationdance: {
		inherit: true,
		isNonstandard: null,
	},
	roar: {
		inherit: true,
		flags: {reflectable: 1, mirror: 1, sound: 1, authentic: 1, allyanim: 1, binary: 1},
	},
	rockclimb: {
		inherit: true,
		isNonstandard: null,
	},
	roleplay: {
		inherit: true,
		flags: {authentic: 1, allyanim: 1, binary: 1},
	},
	rollingkick: {
		inherit: true,
		isNonstandard: null,
	},
	rollout: {
		inherit: true,
		basePowerCallback(pokemon, target, move) {
			let bp = move.basePower;
			if (pokemon.volatiles['rollout'] && pokemon.volatiles['rollout'].hitCount) {
				bp *= Math.pow(2, pokemon.volatiles['rollout'].hitCount);
				if (typeof move.accuracy === 'number') {
					bp *= Math.pow(move.accuracy / 100, pokemon.volatiles['rollout'].hitCount);
				}
			}
			if (pokemon.status !== 'slp') pokemon.addVolatile('rollout');
			if (pokemon.volatiles['defensecurl']) {
				bp *= 2;
			}
			this.debug("Rollout bp: " + bp);
			return bp;
		},
	},
	roost: {
		inherit: true,
		onHit(target, source, move) {
			if (Scripts.severity! >= 50) move.self!.volatileStatus = 'roost';
			else move.self!.volatileStatus = undefined;
		}
	},
	rototiller: {
		inherit: true,
		isNonstandard: null,
	},
	sappyseed: {
		inherit: true,
		accuracy: 100,
		basePower: 90,
		pp: 15,
	},
	savagespinout: {
		inherit: true,
		isNonstandard: null,
	},
	searingsunrazesmash: {
		inherit: true,
		isNonstandard: null,
	},
	secretpower: {
		inherit: true,
		isNonstandard: null,
	},
	seedflare: {
		inherit: true,
		isNonstandard: null,
	},
	sharpen: {
		inherit: true,
		isNonstandard: null,
	},
	shatteredpsyche: {
		inherit: true,
		isNonstandard: null,
	},
	signalbeam: {
		inherit: true,
		isNonstandard: null,
	},
	silverwind: {
		inherit: true,
		isNonstandard: null,
	},
	simplebeam: {
		inherit: true,
		flags: {protect: 1, reflectable: 1, mirror: 1, allyanim: 1, binary: 1},
	},
	sinisterarrowraid: {
		inherit: true,
		isNonstandard: null,
	},
	sizzlyslide: {
		inherit: true,
		basePower: 90,
		pp: 15,
	},
	sketch: {
		inherit: true,
		isNonstandard: null,
		flags: {authentic: 1, allyanim: 1, binary: 1},
	},
	skillswap: {
		inherit: true,
		flags: {protect: 1, mirror: 1, authentic: 1, allyanim: 1, binary: 1},
	},
	skydrop: {
		inherit: true,
		isNonstandard: null,
	},
	skyuppercut: {
		inherit: true,
		isNonstandard: null,
	},
	sleeptalk: {
		inherit: true,
		category: "Special",
		useAverageStats: true,
		flags: {protect: 1, mirror: 1},
		onTry(source) {
			return source.status === 'slp' || source.status === 'aff' || source.status === 'all' || source.hasAbility('comatose');
		},
		beforeMoveCallback(pokemon, target, move) {
			const noSleepTalk = [
				'assist', 'beakblast', 'belch', 'bide', 'celebrate', 'chatter', 'copycat', 'dynamaxcannon', 'focuspunch', 'mefirst', 'metronome', 'mimic', 'mirrormove', 'naturepower', 'shelltrap', 'sketch', 'sleeptalk', 'uproar',
			];

			const moves = [];
			for (const moveSlot of pokemon.moveSlots) {
				if (noSleepTalk.includes(moveSlot.id)) continue;
				const m = this.dex.moves.get(moveSlot.id);
				if (m.isZ || m.isMax) {
					continue;
				}
				moves.push(m);
			}
			if (moves.length === 0) return false;

			let totalPower = 0;
			let totalAccuracy = 0;
			let totalSecondary = 0;
			let totalSelf = 0;
			let highestSecondary = 0;
			let highestSelf = 0;
			move.secondary = {};
			move.secondaries = [];
			move.self = {};
			for (const m of moves) {
				if (typeof m.basePower === 'number') totalPower += m.basePower;
				if (typeof m.accuracy === 'number') totalAccuracy += m.accuracy;
				else totalAccuracy += 100;
				
				let highSeverity;
				if (m.status || m.volatileStatus || m.boosts && m.target !== 'self') {
					if (typeof m.accuracy === 'number') {
						totalSecondary += m.accuracy;
						highSeverity = m.accuracy;
					} else {
						totalSecondary += 100;
						highSeverity = 100;
					}
					if (highSeverity > highestSecondary) {
						highestSecondary = highSeverity;
						if (m.status) move.secondary.status = m.status;
						else if (m.volatileStatus) move.secondary.volatileStatus = m.volatileStatus;
						else if (m.boosts) move.secondary.boosts = m.boosts;
					}
				} else if (m.secondary && (m.secondary.status || m.secondary.volatileStatus || m.secondary.boosts)) {
					if (typeof m.secondary.chance === 'number') {
						totalSecondary += m.secondary.chance;
						highSeverity = m.secondary.chance;
						if (m.secondary.chance > highestSecondary) highestSecondary = m.secondary.chance;
					} else {
						totalSecondary += 100;
						highSeverity = 100;
					}
					if (highSeverity > highestSecondary) {
						highestSecondary = highSeverity;
						if (m.secondary.status) move.secondary.status = m.secondary.status;
						else if (m.secondary.volatileStatus) move.secondary.volatileStatus = m.secondary.volatileStatus;
						else if (m.secondary.boosts) move.secondary.boosts = m.secondary.boosts;
					}
				}
				
				let highSelf;
				if (m.self && (m.self.status || m.self.volatileStatus || m.self.boosts) || m.boosts && m.target === 'self') {
					if (typeof m.accuracy === 'number') {
						totalSelf += m.accuracy;
						highSelf = m.accuracy;
					} else {
						totalSelf += 100;
						highSelf = 100;
					}
					if (highSelf > highestSelf) {
						highestSelf = highSelf;
						
						if (m.self) {
							if (m.self.status) move.self.status = m.self.status;
							else if (m.self.volatileStatus) move.self.volatileStatus = m.self.volatileStatus;
							else if (m.self.boosts) move.self.boosts = m.self.boosts;
						} else move.self.boosts = m.boosts;
					}
				} else if (m.secondary && m.secondary.self && (m.secondary.self.status || m.secondary.self.volatileStatus || m.secondary.self.boosts)) {
					if (typeof m.secondary.chance === 'number') {
						totalSelf += m.secondary.chance;
						highSelf = m.secondary.chance;
						if (m.secondary.chance > highestSecondary) highestSelf = m.secondary.chance;
					} else {
						totalSelf += 100;
						highSelf = 100;
					}
					if (highSelf > highestSelf) {
						highestSelf = highSelf;
						if (m.secondary.self.status) move.self.status = m.secondary.self.status;
						else if (m.secondary.self.volatileStatus) move.self.volatileStatus = m.secondary.self.volatileStatus;
						else if (m.secondary.self.boosts) move.self.boosts = m.secondary.self.boosts;
					}
				}
			}
			move.basePower = totalPower / moves.length;
			move.accuracy = totalAccuracy / moves.length;
			move.secondary.chance = totalSecondary / moves.length;
			move.self.chance = totalSelf / moves.length;

			if (pokemon.status === 'slp' && pokemon.statusState.time === 0) {
				pokemon.statusState.severityModifier = 1;
				move.accuracy *= (2 * pokemon.statusState.severity / 100) % 1;
			} else if (pokemon.status === 'aff') {
				//remove the sleep part of the severity modifier
				this.effectState.severityModifier = 1;
				this.effectState.severityModifier *= 1 - 0.25 * this.effectState.severity / 300;
				move.accuracy *= pokemon.statusState.severity / 273;
			} else if (pokemon.status === 'all') {
				//remove the sleep part of the severity modifier
				this.effectState.severityModifier = 1;
				this.effectState.severityModifier *= 1 - 0.25 * this.effectState.severity / 500;
				move.accuracy *= pokemon.statusState.severity / 500;
			}
			
			move.secondaries.push(move.secondary);
		},
		onModifyMove(move, pokemon, target) {
			move.type = '???';
		},
		onHit(target) {		},
		target: "normal",
	},
	smackdown: {
		inherit: true,
		condition: {
			noCopy: true,
			onStart(pokemon) {
				if (Scripts.severity! < 50) return false;
				let applies = false;
				if (pokemon.hasType('Flying') || pokemon.hasAbility('levitate')) applies = true;
				if (pokemon.hasItem('ironball') || pokemon.volatiles['ingrain'] && pokemon.volatiles['ingrain'].severity >= 50 ||
					this.field.getPseudoWeather('gravity')) applies = false;
				if (pokemon.removeVolatile('fly') || pokemon.removeVolatile('bounce')) {
					applies = true;
					this.queue.cancelMove(pokemon);
					pokemon.removeVolatile('twoturnmove');
				}
				if (pokemon.volatiles['magnetrise']) {
					applies = true;
					delete pokemon.volatiles['magnetrise'];
				}
				if (pokemon.volatiles['telekinesis']) {
					applies = true;
					delete pokemon.volatiles['telekinesis'];
				}
				if (!applies) return false;
				this.add('-start', pokemon, 'Smack Down');
			},
			onRestart(pokemon) {
				if (pokemon.removeVolatile('fly') || pokemon.removeVolatile('bounce')) {
					this.queue.cancelMove(pokemon);
					this.add('-start', pokemon, 'Smack Down');
				}
			},
			// groundedness implemented in battle.engine.js:BattlePokemon#isGrounded
		},
	},
	smellingsalts: {
		inherit: true,
		isNonstandard: null,
		basePowerCallback(pokemon, target, move) {
			let severity = Scripts.severity! >= target.statusState.severity ? target.statusState.severity : Scripts.severity!;
			if (target.status === 'par') return move.basePower * (1 + severity / 100);
			if (target.status === 'aff' || target.status === 'tri') return move.basePower * (1 + severity / 300);
			if (target.status === 'all') return move.basePower * (1 + severity / 500);
			return move.basePower;
		},
		onHit(target, source, move) {
			if (target.status === 'par' || target.status === 'aff' || target.status === 'tri' || target.status === 'all') {
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
	snatch: {
		inherit: true,
		isNonstandard: null,
		condition: {
			duration: 1,
			onStart(pokemon) {
				this.add('-singleturn', pokemon, 'Snatch', '[severity] ' + Scripts.severity);
			},
			onAnyPrepareHitPriority: -1,
			onAnyPrepareHit(source, target, move) {
				const snatchUser = this.effectState.source;
				if (snatchUser.isSkyDropped()) return;
				if (!move || move.isZ || move.isMax || !move.flags['snatch'] || move.sourceEffect === 'snatch') {
					return;
				}
				snatchUser.removeVolatile('snatch');
				this.add('-activate', snatchUser, 'move: Snatch', '[of] ' + source);

				this.actions.useMove(move.id, snatchUser);
				Scripts.severity = this.effectState.severity;
				target.addVolatile('movestolen');
			},
		},
	},
	snore: {
		inherit: true,
		onTry(source) {
			return source.status === 'slp' || source.status === 'aff' || source.status === 'all' || source.hasAbility('comatose');
		},
		basePowerCallback(pokemon, target, move) {
			if (pokemon.status === 'slp' && pokemon.statusState.time === 0) {
				pokemon.statusState.severityModifier = 1;
				return move.basePower * (2 * pokemon.statusState.severity / 100) % 1;
			} else if (pokemon.status === 'aff') {
				//remove the sleep part of the severity modifier
				this.effectState.severityModifier = 1;
				this.effectState.severityModifier *= 1 - 0.25 * this.effectState.severity / 300;
				return move.basePower * pokemon.statusState.severity / 273;
			} else if (pokemon.status === 'all') {
				//remove the sleep part of the severity modifier
				this.effectState.severityModifier = 1;
				this.effectState.severityModifier *= 1 - 0.25 * this.effectState.severity / 500;
				return move.basePower * pokemon.statusState.severity / 500;
			}
			return move.basePower;
		},
	},
	soak: {
		inherit: true,
		flags: {protect: 1, reflectable: 1, mirror: 1, allyanim: 1, binary: 1},
	},
	sonicboom: {
		inherit: true,
		isNonstandard: null,
	},
	soulstealing7starstrike: {
		inherit: true,
		isNonstandard: null,
	},
	sparklingaria: {
		inherit: true,
		secondary: {
			dustproof: true,
			chance: 100,
			onHit(target, source, move) {
				if (target.status === 'brn' || target.status === 'tri' || target.status === 'all') {
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
	},
	sparklyswirl: {
		inherit: true,
		accuracy: 100,
		basePower: 90,
		pp: 15,
	},
	speedswap: {
		inherit: true,
		onHit(target, source) {
			let newTargetSpeed = target.storedStats.spe - (target.storedStats.spe - source.storedStats.spe) * Scripts.severity! / 100;
			let newSourceSpeed = source.storedStats.spe - (source.storedStats.spe - target.storedStats.spe) * Scripts.severity! / 100;

			target.storedStats.spe = newTargetSpeed;
			source.storedStats.spe = newSourceSpeed;

			console.log(target.name, target.storedStats.spe);
			console.log(source.name, source.storedStats.spe);
			this.add('-activate', source, 'move: Speed Swap', '[of] ' + target);
		},
	},
	spiderweb: {
		inherit: true,
		isNonstandard: null,
		flags: {protect: 1, reflectable: 1, mirror: 1, binary: 1},
	},
	spikecannon: {
		inherit: true,
		isNonstandard: null,
	},
	spikes: {
		inherit: true,
		flags: {reflectable: 1, nonsky: 1, binary: 1},
	},
	spikyshield: {
		inherit: true,
		condition: {
			duration: 1,
			onStart(target) {
				if (target.volatiles['stall']) {
					this.add('-singleturn', target, 'Protect', '[severity] ' + target.volatiles['stall'].severity * Scripts.severity! / 100);
					this.effectState.severity = target.volatiles['stall'].severity;
				}
				else this.add('-singleturn', target, 'Protect', '[severity] ' + Scripts.severity);

				this.effectState.incomingSeverityModifier = 1 - this.effectState.severity / 100;
			},
			onTryHitPriority: 3,
			onTryHit(target, source, move) {
				if (!move.flags['protect']) {
					if (['gmaxoneblow', 'gmaxrapidflow'].includes(move.id)) return;
					if (move.isZ || move.isMax) target.getMoveHitData(move).zBrokeProtect = true;
					return;
				}
				if (move.smartTarget) {
					move.smartTarget = false;
				} else {
					this.add('-activate', target, 'move: Protect');
				}
				const lockedmove = source.getVolatile('lockedmove');
				if (lockedmove && this.effectState.severity === 100) {
					// Outrage counter is reset
					if (source.volatiles['lockedmove'].duration === 2) {
						delete source.volatiles['lockedmove'];
					}
				}
				if (this.checkMoveMakesContact(move, source, target)) {
					this.damage(source.baseMaxhp * this.effectState.severity / 800, source, target);
				}
				if (this.effectState.severity === 100) return this.NOT_FAIL;
				else return;
			},
			onHit(target, source, move) {
				if (move.isZOrMaxPowered && this.checkMoveMakesContact(move, source, target)) {
					this.damage(source.baseMaxhp * this.effectState.severity / 800, source, target);
				}
			},
		},
	},
	spiritshackle: {
		inherit: true,
		secondary: {
			chance: 100,
			onHit(target, source, move) {
				if (source.isActive && Scripts.severity! >= 50) target.addVolatile('trapped', source, move, 'trapper');
			},
		},
	},
	spite: {
		inherit: true,
		onHit(target) {
			let move: Move | ActiveMove | null = target.lastMove;
			if (!move || move.isZ) return false;
			if (move.isMax && move.baseMove) move = this.dex.moves.get(move.baseMove);

			const ppDeducted = target.deductPP(move.id, Math.floor(4 * Scripts.severity! / 100));
			if (!ppDeducted) return false;
			this.add("-activate", target, 'move: Spite', move.name, ppDeducted);
		},
	},
	splinteredstormshards: {
		inherit: true,
		isNonstandard: null,
	},
	spotlight: {
		inherit: true,
		isNonstandard: null,
	},
	stealthrock: {
		inherit: true,
		flags: {reflectable: 1, binary: 1},
	},
	steamroller: {
		inherit: true,
		isNonstandard: null,
	},
	stickyweb: {
		inherit: true,
		flags: {reflectable: 1, binary: 1},
	},
	stockpile: {
		inherit: true,
		flags: {snatch: 1, binary: 1},
	},
	stokedsparksurfer: {
		inherit: true,
		isNonstandard: null,
	},
	substitute: {
		inherit: true,
		flags: {snatch: 1, nonsky: 1, binary: 1},
	},
	subzeroslammer: {
		inherit: true,
		isNonstandard: null,
	},
	supersonicskystrike: {
		inherit: true,
		isNonstandard: null,
	},
	switcheroo: {
		inherit: true,
		flags: {protect: 1, mirror: 1, allyanim: 1, binary: 1},
		onHit(target, source, move) {
			const yourItem = target.takeItem(source);
			const myItem = source.takeItem();
			if (target.item || source.item || (!yourItem && !myItem)) {
				if (yourItem) target.item = yourItem.id;
				if (myItem) source.item = myItem.id;
				return false;
			}
			if (
				(myItem && !this.singleEvent('TakeItem', myItem, source.itemState, target, source, move, myItem)) ||
				(yourItem && !this.singleEvent('TakeItem', yourItem, target.itemState, source, target, move, yourItem))
			) {
				if (yourItem) target.item = yourItem.id;
				if (myItem) source.item = myItem.id;
				return false;
			}
			this.add('-activate', source, 'move: Trick', '[of] ' + target);
			if (myItem) {
				target.setItem(myItem);
				this.add('-item', target, myItem, '[from] move: Switcheroo');
			} else {
				this.add('-enditem', target, yourItem, '[silent]', '[from] move: Switcheroo');
			}
			if (yourItem) {
				source.setItem(yourItem);
				this.add('-item', source, yourItem, '[from] move: Switcheroo');
			} else {
				this.add('-enditem', source, myItem, '[silent]', '[from] move: Switcheroo');
			}
		},
	},
	synchronoise: {
		inherit: true,
		isNonstandard: null,
	},
	tailglow: {
		inherit: true,
		isNonstandard: null,
	},
	taunt: {
		inherit: true,
		condition: {
			duration: 3,
			onStart(target) {
				this.add('-start', target, 'move: Taunt', '[severity] ' + Scripts.severity);
				//max 3 turns
				//time is used for finding last turn with decreased severityModifier
				//duration is used for ending status
				this.effectState.time = Math.floor(3 * this.effectState.severity / 100);
				this.effectState.duration = Math.floor(3 * this.effectState.severity / 100) + 1;
				if (this.effectState.severity === 100) this.effectState.duration--;
				if (target.activeTurns && !this.queue.willMove(target)) {
					this.effectState.time++;
					this.effectState.duration++;
				}
			},
			onResidualOrder: 15,
			onResidual() {
				this.effectState.time--;
			},
			onEnd(target) {
				this.add('-end', target, 'move: Taunt');
			},
			onDisableMove(pokemon) {
				if (this.effectState.time > 0) {
					for (const moveSlot of pokemon.moveSlots) {
						const move = this.dex.moves.get(moveSlot.id);
						if (move.category === 'Status' && move.id !== 'mefirst') {
							pokemon.disableMove(moveSlot.id);
						}
					}
				}
			},
			onBeforeMovePriority: 5,
			onBeforeMove(attacker, defender, move) {
				if (!move.isZ && !move.isMax && move.category === 'Status' && move.id !== 'mefirst') {
					if (this.effectState.time > 0) {
						this.add('cant', attacker, 'move: Taunt', move);
						return false;
					}
					this.effectState.severityModifier = 1 - (3 * this.effectState.severity / 100) % 1;
				}
			},
		},
	},
	tectonicrage: {
		inherit: true,
		isNonstandard: null,
	},
	telekinesis: {
		inherit: true,
		isNonstandard: null,
		condition: {
			duration: 3,
			onStart(target) {
				if (['Diglett', 'Dugtrio', 'Palossand', 'Sandygast'].includes(target.baseSpecies.baseSpecies) ||
						target.baseSpecies.name === 'Gengar-Mega') {
					this.add('-immune', target);
					return null;
				}
				if (target.volatiles['smackdown'] || target.volatiles['ingrain'] && target.volatiles['ingrain'].severity >= 50) return false;
				this.add('-start', target, 'Telekinesis', '[severity] ' + Scripts.severity);

				//max 3 turns
				//time is used for finding last turn with perfect accuracy
				//duration is used for ending status
				this.effectState.time = Math.floor(3 * this.effectState.severity / 100);
				this.effectState.duration = Math.floor(3 * this.effectState.severity / 100) + 1;
				if (this.effectState.severity === 100) this.effectState.duration--;
				this.effectState.incomingSeverityModifier = 1 - (3 * this.effectState.severity / 100) % 1;
			},
			onResidual() {
				this.effectState.time--;
			},
			onAccuracyPriority: -1,
			onAccuracy(accuracy, target, source, move) {
				if (move && !move.ohko) {
					if (this.effectState.time > 0) return true;
					if (accuracy === 100) return 100;
					else if (typeof accuracy === 'number') {
						return accuracy + (100 - accuracy) * ((3 * this.effectState.severity / 100) % 1);
					}
				}
			},
			onImmunity(type) {
				if (type === 'Ground') return false;
			},
			onUpdate(pokemon) {
				if (pokemon.baseSpecies.name === 'Gengar-Mega') {
					delete pokemon.volatiles['telekinesis'];
					this.add('-end', pokemon, 'Telekinesis', '[silent]');
				}
			},
			onResidualOrder: 19,
			onEnd(target) {
				this.add('-end', target, 'Telekinesis');
			},
		},
	},
	teleport: {
		inherit: true,
		priority: 0,
		selfSwitch: false,
		onTry: false,
	},
	thief: {
		inherit: true,
		onAfterHit(target, source, move) {
			if (source.item || source.volatiles['gem'] || Scripts.severity! < 50) {
				return;
			}
			const yourItem = target.takeItem(source);
			if (!yourItem) {
				return;
			}
			if (!this.singleEvent('TakeItem', yourItem, target.itemState, source, target, move, yourItem) ||
				!source.setItem(yourItem)) {
				target.item = yourItem.id; // bypass setItem so we don't break choicelock or anything
				return;
			}
			this.add('-enditem', target, yourItem, '[silent]', '[from] move: Thief', '[of] ' + source);
			this.add('-item', source, yourItem, '[from] move: Thief', '[of] ' + target);
		},
	},
	thousandwaves: {
		inherit: true,
		onHit(target, source, move) {
			if (source.isActive && Scripts.severity! >= 50) target.addVolatile('trapped', source, move, 'trapper');
		},
	},
	throatchop: {
		inherit: true,
		condition: {
			duration: 2,
			onStart(target) {
				this.add('-start', target, 'Throat Chop', '[silent]', '[severity] ' + Scripts.severity);
			},
			onDisableMove(pokemon) {
				for (const moveSlot of pokemon.moveSlots) {
					if (this.dex.moves.get(moveSlot.id).flags['sound'] && this.effectState.severity === 100) {
						pokemon.disableMove(moveSlot.id);
					}
				}
			},
			onBeforeMovePriority: 6,
			onBeforeMove(pokemon, target, move) {
				if (!move.isZ && !move.isMax && move.flags['sound'] && this.effectState.severity === 100) {
					this.add('cant', pokemon, 'move: Throat Chop');
					return false;
				} else if (!move.isZ && !move.isMax && move.flags['sound'] && this.effectState.severity < 100) {
					this.effectState.severityModifier = 1 - this.effectState.severity / 100;
				} else this.effectState.severityModifier = 1;
			},
			onModifyMove(move, pokemon, target) {
				if (!move.isZ && !move.isMax && move.flags['sound'] && this.effectState.severity === 100) {
					this.add('cant', pokemon, 'move: Throat Chop');
					return false;
				} else if (!move.isZ && !move.isMax && move.flags['sound'] && this.effectState.severity < 100) {
					this.effectState.severityModifier = 1 - this.effectState.severity / 100;
				} else this.effectState.severityModifier = 1;
			},
			onResidualOrder: 22,
			onEnd(target) {
				this.add('-end', target, 'Throat Chop', '[silent]');
			},
		},
	},
	topsyturvy: {
		inherit: true,
		onHit(target) {
			let success = false;
			let i: BoostID;
			for (i in target.boosts) {
				if (target.boosts[i] === 0) continue;
				target.boosts[i] -= target.boosts[i] * 2 * Scripts.severity! / 100;
				success = true;
			}
			if (!success) return false;
			this.add('-invertboost', target, '[from] move: Topsy-Turvy', '[severity] ' + Scripts.severity);
		},
	},
	torment: {
		inherit: true,
		condition: {
			noCopy: true,
			onStart(pokemon) {
				if (pokemon.volatiles['dynamax']) {
					delete pokemon.volatiles['torment'];
					return false;
				}
				this.add('-start', pokemon, 'Torment', '[severity] ' + Scripts.severity);
			},
			onEnd(pokemon) {
				this.add('-end', pokemon, 'Torment');
			},
			onDisableMove(pokemon) {
				if (pokemon.lastMove && pokemon.lastMove.id !== 'struggle' && this.effectState.severity === 100) pokemon.disableMove(pokemon.lastMove.id);
			},
			onBeforeMovePriority: 5,
			onBeforeMove(attacker, defender, move) {
				if (attacker.lastMove && attacker.lastMove.id !== 'struggle') {
					if (move.id === attacker.lastMove.id) this.effectState.severityModifier = 1 - this.effectState.severity / 100;
					else this.effectState.severityModifier = 1;
				}
			}
		},
	},
	toxic: {
		inherit: true,
		onPrepareHit(target, source, move) {
			if (source.hasType('Poison')) source.addVolatile('toxic');
		},
		condition: {
			noCopy: true,
			duration: 1,
			onSourceInvulnerabilityPriority: 1,
			onSourceInvulnerability(target, source, move) {
				if (move && source === this.effectState.target) return 0;
			},
			onSourceAccuracy(accuracy, target, source, move) {
				if (move && source === this.effectState.target) return true;
			},
		},
	},
	toxicspikes: {
		inherit: true,
		flags: {reflectable: 1, nonsky: 1, binary: 1},
	},
	toxicthread: {
		inherit: true,
		isNonstandard: null,
	},
	transform: {
		inherit: true,
		flags: {allyanim: 1, binary: 1},
	},
	triattack: {
		inherit: true,
		secondary: {
			chance: 20,
			status: 'tri',
			onHit(target, source) {},
		},
	},
	trick: {
		inherit: true,
		flags: {protect: 1, mirror: 1, allyanim: 1, binary: 1},
		onHit(target, source, move) {
			const yourItem = target.takeItem(source);
			const myItem = source.takeItem();
			if (target.item || source.item || (!yourItem && !myItem)) {
				if (yourItem) target.item = yourItem.id;
				if (myItem) source.item = myItem.id;
				return false;
			}
			if (
				(myItem && !this.singleEvent('TakeItem', myItem, source.itemState, target, source, move, myItem)) ||
				(yourItem && !this.singleEvent('TakeItem', yourItem, target.itemState, source, target, move, yourItem))
			) {
				if (yourItem) target.item = yourItem.id;
				if (myItem) source.item = myItem.id;
				return false;
			}
			this.add('-activate', source, 'move: Trick', '[of] ' + target);
			if (myItem) {
				target.setItem(myItem);
				this.add('-item', target, myItem, '[from] move: Trick');
			} else {
				this.add('-enditem', target, yourItem, '[silent]', '[from] move: Trick');
			}
			if (yourItem) {
				source.setItem(yourItem);
				this.add('-item', source, yourItem, '[from] move: Trick');
			} else {
				this.add('-enditem', source, myItem, '[silent]', '[from] move: Trick');
			}
		},
	},
	trickortreat: {
		inherit: true,
		flags: {protect: 1, reflectable: 1, mirror: 1, allyanim: 1, binary: 1},
	},
	triplekick: {
		inherit: true,
		basePowerCallback(pokemon, target, move) {
			if (pokemon.hasAbility('skilllink') || move.accuracy) return 10 * move.hit;
			return 10 * move.hit * move.accuracy;
		},
	},
	trumpcard: {
		inherit: true,
		isNonstandard: null,
	},
	twineedle: {
		inherit: true,
		isNonstandard: null,
	},
	twinkletackle: {
		inherit: true,
		isNonstandard: null,
	},
	uproar: {
		inherit: true,
		onTryHit(target, source, move) {
			const activeTeam = target.side.activeTeam();
			const foeActiveTeam = target.side.foe.activeTeam();
			for (const [i, allyActive] of activeTeam.entries()) {
				if (allyActive && (allyActive.status === 'slp' || allyActive.status === 'aff' || allyActive.status === 'all')) {
					if (Scripts.severity! >= allyActive.statusState.severity) {
						allyActive.cureStatus();
					} else {
						let status = allyActive.getStatus();
						let originalSeverity = Scripts.severity!;
						let severity = allyActive.statusState.severity - originalSeverity;
						if (allyActive.clearStatus()) {
							Scripts.severity = severity;
							move.flags.lesser = 1;
							allyActive.setStatus(status, target, move);
							Scripts.severity = originalSeverity;
						}
					}
				}
				const foeActive = foeActiveTeam[i];
				if (foeActive && (foeActive.status === 'slp' || foeActive.status === 'aff' || foeActive.status === 'all')) {
					if (Scripts.severity! >= foeActive.statusState.severity) {
						foeActive.cureStatus();
					} else {
						let status = foeActive.getStatus();
						let originalSeverity = Scripts.severity!;
						let severity = foeActive.statusState.severity - originalSeverity;
						if (foeActive.clearStatus()) {
							Scripts.severity = severity;
							move.flags.lesser = 1;
							foeActive.setStatus(status, target, move);
							Scripts.severity = originalSeverity;
						}
					}
				}
			}
		},
	},
	uturn: {
		inherit: true,
		onHit(target, source, move) {
			move.selfSwitch = (Scripts.severity! >= 50);
		}
	},
	venomdrench: {
		inherit: true,
		onHit(target, source, move) {
			if (target.status === 'psn' || target.status === 'tox') {
				let severity = target.statusState.severity / 100;
				return !!this.boost({atk: -severity, spa: -severity, spe: -severity}, target, source, move);
			} else if (target.status === 'aff') {
				let severity = target.statusState.severity / 333
				return !!this.boost({atk: -severity, spa: -severity, spe: -severity}, target, source, move);
			} else if (target.status === 'all') {
				let severity = target.statusState.severity / 500
				return !!this.boost({atk: -severity, spa: -severity, spe: -severity}, target, source, move);
			}
			return false;
		},
	},
	venoshock: {
		inherit: true,
		onBasePower(basePower, pokemon, target) {
			if (target.status === 'psn' || target.status === 'tox') {
				return this.chainModify(1 + pokemon.statusState.severity / 100);
			} else if (target.status === 'aff') {
				return this.chainModify(1 + pokemon.statusState.severity / 333);
			} else if (target.status === 'all') {
				return this.chainModify(1 + pokemon.statusState.severity / 500);
			}
		},
	},
	voltswitch: {
		inherit: true,
		onHit(target, source, move) {
			move.selfSwitch = (Scripts.severity! >= 50);
		}
	},
	wakeupslap: {
		inherit: true,
		isNonstandard: null,
		basePowerCallback(pokemon, target, move) {
			if (target.hasAbility('comatose')) return move.basePower * 2;

			let severity = Scripts.severity! >= target.statusState.severity ? target.statusState.severity : Scripts.severity!;
			if (target.status === 'slp') return move.basePower * (1 + severity / 100);
			if (target.status === 'aff') return move.basePower * (1 + severity / 273);
			if (target.status === 'all') return move.basePower * (1 + severity / 500);
			return move.basePower;
		},
		onHit(target, source, move) {
			if (target.status === 'slp' || target.status === 'aff' || target.status === 'all') {
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
	watersport: {
		inherit: true,
		isNonstandard: null,
	},
	whirlwind: {
		inherit: true,
		flags: {reflectable: 1, mirror: 1, authentic: 1, allyanim: 1, binary: 1},
	},
	wideguard: {
		inherit: true,
		condition: {
			duration: 1,
			onSideStart(target, source) {
				if (source.volatiles['stall']) {
					this.add('-singleturn', source, 'Wide Guard', '[severity] ' + source.volatiles['stall'].severity * Scripts.severity! / 100);
					this.effectState.severity = source.volatiles['stall'].severity;
				}
				else this.add('-singleturn', source, 'Wide Guard', '[severity] ' + Scripts.severity);

				this.effectState.incomingSeverityModifier = 1 - this.effectState.severity / 100;
			},
			onTryHitPriority: 4,
			onTryHit(target, source, move) {
				// Wide Guard blocks all spread moves
				if (move?.target !== 'allAdjacent' && move.target !== 'allAdjacentFoes') {
					return;
				}
				if (move.isZ || move.isMax) {
					if (['gmaxoneblow', 'gmaxrapidflow'].includes(move.id)) return;
					target.getMoveHitData(move).zBrokeProtect = true;
					return;
				}
				this.add('-activate', target, 'move: Wide Guard');
				const lockedmove = source.getVolatile('lockedmove');
				if (lockedmove && this.effectState.severity === 100) {
					// Outrage counter is reset
					if (source.volatiles['lockedmove'].duration === 2) {
						delete source.volatiles['lockedmove'];
					}
				}
				if (this.effectState.severity === 100) return this.NOT_FAIL;
				else return;
			},
		},
	},
	wish: {
		inherit: true,
		condition: {
			duration: 2,
			onStart(pokemon, source) {
				this.effectState.hp = source.maxhp / 2;
			},
			onResidualOrder: 4,
			onEnd(target) {
				if (target && !target.fainted) {
					const damage = this.heal(this.effectState.hp, target, target);
					if (damage) {
						this.add('-heal', target, target.getHealth.bind(target), '[from] move: Wish', '[wisher] ' + this.effectState.source.name);
					}
				}
			},
		},
	},
	worryseed: {
		inherit: true,
		flags: {protect: 1, reflectable: 1, mirror: 1, allyanim: 1, binary: 1},
		onHit(pokemon) {
			const oldAbility = pokemon.setAbility('insomnia');
			if (oldAbility) {
				this.add('-ability', pokemon, 'Insomnia', '[from] move: Worry Seed');
				if (pokemon.status === 'slp' || pokemon.status === 'aff' || pokemon.status === 'all') {
					pokemon.cureStatus();
				}
				return;
			}
			return false;
		},
	},
	wringout: {
		inherit: true,
		isNonstandard: null,
	},
	yawn: {
		inherit: true,
		onTryHit(target) {
			if (target.status && target.statusState.severity === 100 || !target.runStatusImmunity('slp')) {
				return false;
			}
		},
		condition: {
			noCopy: true, // doesn't get copied by Baton Pass
			duration: 2,
			onStart(target, source) {
				this.add('-start', target, 'move: Yawn', '[of] ' + source, '[severity] ' + Scripts.severity);
			},
			onResidualOrder: 23,
			onEnd(target) {
				this.add('-end', target, 'move: Yawn', '[silent]');
				Scripts.severity = this.effectState.severity;
				target.trySetStatus('slp', this.effectState.source);
			},
		},
	},
	zippyzap: {
		inherit: true,
		basePower: 50,
		pp: 15,
		willCrit: true,
		secondary: null,
	},
};

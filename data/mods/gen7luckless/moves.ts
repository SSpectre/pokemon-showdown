import {Scripts} from "./scripts";

export const Moves: {[k: string]: ModdedMoveData} = {
	"10000000voltthunderbolt": {
		inherit: true,
		desc: "+2 critical hit stage.",
		shortDesc: "+2 critical hit stage.",
	},
	acid: {
		inherit: true,
		desc: "Lowers target's Sp. Def by 0.1.",
		shortDesc: "Lowers target's Sp. Def by 0.1.",
	},
	acidspray: {
		inherit: true,
		desc: "Lowers the target's Sp. Def by 2.",
		shortDesc: "Lowers the target's Sp. Def by 2.",
	},
	acupressure: {
		inherit: true,
		desc: "Raises all stats by 2/7 stages. The user can choose to use this move on itself or an adjacent ally. Fails if no stat stage can be raised or if used on an ally with a substitute.",
		shortDesc: "Raises all stats of the user or an ally by 2/7.",
		onHit(target) {
			const stats: BoostID[] = [];
			let stat: BoostID;
			for (stat in target.boosts) {
				if (target.boosts[stat] < 6) {
					stats.push(stat);
				}
			}
			if (stats.length) {
				for (const i of stats) {
					const boost: SparseBoostsTable = {};
					boost[i] = 0.29;
					this.boost(boost);
				}
			} else {
				return false;
			}
		},
	},
	aeroblast: {
		inherit: true,
		desc: "+1 critical hit stage.",
		shortDesc: "+1 critical hit stage.",
	},
	aircutter: {
		inherit: true,
		desc: "+1 critical hit stage.",
		shortDesc: "+1 critical hit stage. Hits adjacent foes.",
	},
	airslash: {
		inherit: true,
		desc: "Causes 30-severity flinch.",
		shortDesc: "Causes 30-severity flinch.",
	},
	anchorshot: {
		inherit: true,
		desc: "Prevents the target from switching out when accuracy is at least 50%. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Parting Shot, U-turn, or Volt Switch. If the target leaves the field using Baton Pass, the replacement will remain trapped. The effect ends if the user leaves the field.",
		shortDesc: "Prevents target from switching out at >50% accuracy.",
		secondary: {
			chance: 100,
			onHit(target, source, move) {
				if (source.isActive && Scripts.severity! >= 50) target.addVolatile('trapped', source, move, 'trapper');
			},
		},
	},
	aquaring: {
		inherit: true,
		desc: "The user has up to 1/16 of its maximum HP, rounded down, restored at the end of each turn while it remains active. If Big Root is held by the user, the HP recovered is 1.3x normal, rounded half down. If the user uses Baton Pass, the replacement will receive the healing effect.",
		shortDesc: "User recovers up to 1/16 max HP per turn.",
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
		desc: "Every Pokemon in the user's party has its non-volatile status condition cured or reduced in severity. Active Pokemon with the Sap Sipper Ability are not cured, unless they are the user.",
		shortDesc: "Cures/reduces severity of party's status conditions.",
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
					const status = ally.getStatus();
					const originalSeverity = Scripts.severity!;
					const severity = ally.statusState.severity - originalSeverity;
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
		desc: "Has power, accuracy, and secondary effect severity equal to the average of the user’s teammates’ moves. Deals typeless damage. The secondary effect is that of the move with the highest severity. In the case of a tie, the move in the earliest move slot of the earliest listed teammate will be considered.",
		shortDesc: "Power and effect determined by teammates' moves.",
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
						} else { move.self.boosts = m.boosts; }
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
		desc: "Causes the target to become infatuated. Fails if both the user and the target are the same gender, if either is genderless, or if the target is already infatuated. The effect ends when either the user or the target is no longer active. Pokemon with the Oblivious Ability or protected by the Aroma Veil Ability are immune.",
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

				// max 2 turns
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
		desc: "Raises the user's Speed by 2 stages. If the user's Speed was changed, the user's weight is reduced by up to 100 kg as long as it remains active. This effect is stackable but cannot reduce the user's weight to less than 0.1 kg.",
		shortDesc: "Raises user's Speed by 2; user loses up to 100 kg.",
		onHit(pokemon) {
			if (pokemon.weighthg > 1) {
				pokemon.weighthg = Math.max(1, pokemon.weighthg - (1000 * Scripts.severity! / 100));
				this.add('-start', pokemon, 'Autotomize', '[severity] ' + Scripts.severity);
			}
		},
	},
	banefulbunker: {
		inherit: true,
		desc: "The user is protected from most attacks made by other Pokemon during this turn, and Pokemon making contact with the user become poisoned. This protection has 100/X severity, where X starts at 1 and triples each time this move is successfully used. X resets to 1 if this move fails, if the user's last move used is not Baneful Bunker, Detect, Endure, King's Shield, Protect, Quick Guard, Spiky Shield, or Wide Guard, or if it was one of those moves and the user's protection was broken. Fails if the user moves last this turn.",
		// desc: "The user is protected from most attacks made by other Pokemon during this turn, and Pokemon making contact with the user become poisoned. This move has a 1/X chance of being successful, where X starts at 1 and triples each time this move is successfully used. X resets to 1 if this move fails, if the user's last move used is not Baneful Bunker, Detect, Endure, King's Shield, Protect, Quick Guard, Spiky Shield, or Wide Guard, or if it was one of those moves and the user's protection was broken. Fails if the user moves last this turn.",
		condition: {
			duration: 1,
			onStart(target) {
				if (target.volatiles['stall']) {
					this.add('-singleturn', target, 'Protect', '[severity] ' + target.volatiles['stall'].severity * Scripts.severity! / 100);
					this.effectState.severity = target.volatiles['stall'].severity;
				} else { this.add('-singleturn', target, 'Protect', '[severity] ' + Scripts.severity); }

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
	batonpass: {
		inherit: true,
		flags: {binary: 1},
	},
	beatup: {
		inherit: true,
		desc: "Hits one time for the user and one time for each unfainted Pokemon in the user's party. The power of each hit is equal to 5+(X/10), where X is each participating Pokemon's base Attack; each hit is considered to come from the user. Party Pokemon with non-volatile status conditions have their hit's power scaled with the severity of the status.",
		basePowerCallback(pokemon, target, move) {
			const ally = move.allies!.shift()!;
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
		desc: "Raises the user's Attack by up to 12 stages in exchange for the user losing up to 1/2 of its maximum HP, rounded down. Fails if the user would faint or if its Attack stat stage is 6.",
		shortDesc: "User loses up to 50% max HP. Raises Attack by 12.",
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
		flags: {mirror: 1, authentic: 1, allyanim: 1, binary: 1},
	},
	block: {
		inherit: true,
		desc: "Prevents the target from switching out. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Parting Shot, U-turn, or Volt Switch. If the target leaves the field using Baton Pass, the replacement will remain trapped. The effect ends if the user leaves the field.",
		flags: {reflectable: 1, mirror: 1, binary: 1},
	},
	bugbite: {
		inherit: true,
		desc: "If this move is successful, its accuracy is at least 50%, and the user has not fainted, it steals the target's held Berry if it is holding one and eats it immediately, gaining its effects even if the user's item is being ignored. Items lost to this move cannot be regained with Recycle or the Harvest Ability.",
		shortDesc: "Steals and eats the target's Berry at >50% accuracy.",
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
	},
	burnup: {
		inherit: true,
		flags: {protect: 1, mirror: 1, defrost: 1, binary: 1},
	},
	camouflage: {
		inherit: true,
		flags: {snatch: 1, binary: 1},
	},
	charge: {
		inherit: true,
		desc: "Raises the user's Special Defense by 1 stage. If the user uses an Electric-type attack on the next turn, its power will be increased up to x2.",
		shortDesc: "+1 SpD, user's Electric move next turn up to 2x power",
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
	circlethrow: {
		inherit: true,
		desc: "If both the user and the target have not fainted and if accuracy is greater than 50%, the target is forced to switch out and be replaced with their next unfainted ally. This effect fails if the target used Ingrain previously, has the Suction Cups Ability, or this move hit a substitute.",
		shortDesc: "Forces the target to switch if at >50% accuracy.",
		onHit(target, source, move) {
			if (source.isActive && Scripts.severity! >= 50) move.forceSwitch = false;
		},
	},
	conversion: {
		inherit: true,
		flags: {snatch: 1, binary: 1},
	},
	conversion2: {
		inherit: true,
		desc: "The user gains a resistance to the type of the last move used by the target. The determined type of the move is used rather than the original type. Fails if the target has not made a move.",
		shortDesc: "User gains a resistance to target's last move.",
		flags: {authentic: 1, binary: 1},
		onHit(target, source) {
			if (!target.lastMoveUsed) {
				return false;
			}
			let attackType = target.lastMoveUsed.type;
			if (attackType === '???') attackType = 'typeless';
			const condition = 'resist' + attackType.toLowerCase();
			if (source.volatiles[condition]) return false;
			const resistances = ['resistnormal', 'resistfire', 'resistwater', 'resistelectric', 'resistgrass', 'resistice', 'resistfighting', 'resistpoison', 'resistground', 'resistflying', 'resistpsychic', 'resistbug', 'resistrock', 'resistghost', 'resistdragon', 'resistdark', 'resiststeel', 'resistfairy', 'resisttypeless'];
			for (const resistance of resistances) {
				if (source.volatiles[resistance]) {
					source.removeVolatile(resistance);
					this.add('-end', source, resistance, '[silent]');
				}
			}
			source.addVolatile(condition);
			this.add('-start', source, condition);
		},
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
		desc: "If this attack was successful, its accuracy was at least 50%, and the user has not fainted, it steals the target's held item if the user is not holding one. The target's item is not stolen if it is a Mail or Z-Crystal, or if the target is a Kyogre holding a Blue Orb, a Groudon holding a Red Orb, a Giratina holding a Griseous Orb, an Arceus holding a Plate, a Genesect holding a Drive, a Silvally holding a Memory, or a Pokemon that can Mega Evolve holding the Mega Stone for its species. Items lost to this move cannot be regained with Recycle or the Harvest Ability.",
		shortDesc: "Steals item at >50% accuracy if user has none.",
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
		desc: "If the user is not a Ghost type, lowers the user's Speed by 1 stage and raises the user's Attack and Defense by 1 stage. If the user is a Ghost type, the user loses up to 1/2 of its maximum HP, rounded down and even if it would cause fainting, in exchange for the target losing up to 1/4 of its maximum HP, rounded down, at the end of each turn while it is active. If the target uses Baton Pass, the replacement will continue to be affected. Fails if there is no target or if the target is already affected.",
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
	},
	destinybond: {
		inherit: true,
		desc: "Until the user's next move, if an opposing Pokemon's attack knocks the user out, that Pokemon will take damage up to 100% of its maximum HP, unless the attack was Doom Desire or Future Sight. Fails if the user used this move successfully as its last move, disregarding moves used through the Dancer Ability.",
		shortDesc: "Knocking out user causes damage up to 100% max HP",
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
	disable: {
		inherit: true,
		desc: "For up to 4 turns, the target's last move used becomes disabled. The move is weakened on the last turn if the turn count is a decimal number. Fails if one of the target's moves is already disabled, if the target has not made a move, if the target no longer knows the move, or if the move was a Z-Move. Z-Powered moves can still be selected and executed during this effect.",
		shortDesc: "Up to 4 turns, disables the target's last move.",
		// desc: "For 4 turns, the target's last move used becomes disabled. Fails if one of the target's moves is already disabled, if the target has not made a move, if the target no longer knows the move, or if the move was a Z-Move. Z-Powered moves can still be selected and executed during this effect.",
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

				// max 4 turns
				// time is used for finding last turn with decreased severityModifier
				// duration is used for ending status
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
					if (this.effectState.time > 0) {
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
	dragontail: {
		inherit: true,
		desc: "If both the user and the target have not fainted and if accuracy is greater than 50%, the target is forced to switch out and be replaced with their next unfainted ally. This effect fails if the target used Ingrain previously, has the Suction Cups Ability, or this move hit a substitute.",
		shortDesc: "Forces the target to switch if at >50% accuracy.",
		onHit(target, source, move) {
			if (source.isActive && Scripts.severity! >= 50) move.forceSwitch = false;
		},
	},
	dreameater: {
		inherit: true,
		desc: "The target is unaffected by this move unless it is asleep, and this move's damage scales with the target's sleep severity. The user recovers 1/2 the HP lost by the target, rounded half up. If Big Root is held by the user, the HP recovered is 1.3x normal, rounded half down.",
		shortDesc: "User gains 1/2 HP inflicted. Scales with sleep.",
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
	embargo: {
		inherit: true,
		desc: "For up to 5 turns, the target's held item has no effect. An item's effect of causing forme changes is unaffected, but any other effects from such items are negated. During the effect, Fling and Natural Gift are prevented from being used by the target. Items thrown at the target with Fling will still activate for it. If the target uses Baton Pass, the replacement will remain unable to use items.",
		shortDesc: "For up to 5 turns, target's item has no effect.",
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
		},
	},
	encore: {
		inherit: true,
		desc: "For up to 3 turns, the target is forced to repeat its last move used. Other moves are weakened on the last turn if the turn count is a decimal number. If the affected move runs out of PP, the effect ends. Fails if the target is already under this effect, if it has not made a move, if the move has 0 PP, or if the move is Assist, Copycat, Encore, Me First, Metronome, Mimic, Mirror Move, Nature Power, Sketch, Sleep Talk, Struggle, Transform, or any Z-Move. Z-Powered moves can still be selected and executed during this effect.",
		shortDesc: "Target repeats its last move for up to 3 turns.",
		// desc: "For its next 3 turns, the target is forced to repeat its last move used. If the affected move runs out of PP, the effect ends. Fails if the target is already under this effect, if it has not made a move, if the move has 0 PP, or if the move is Assist, Copycat, Encore, Me First, Metronome, Mimic, Mirror Move, Nature Power, Sketch, Sleep Talk, Struggle, Transform, or any Z-Move. Z-Powered moves can still be selected and executed during this effect.",
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

				// max 3 turns
				// time is used for finding last turn with decreased severityModifier
				// duration is used for ending status
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
			},
		},
	},
	endure: {
		inherit: true,
		desc: "The user will survive attacks made by other Pokemon during this turn with at least M - MS + 1 HP, where M is the Pokemon's max HP, and S is the severity of the move's effect. The effect has 1/X severity, where X starts at 1 and triples each time this move is successfully used. X resets to 1 if this move fails, if the user's last move used is not Baneful Bunker, Detect, Endure, King's Shield, Protect, Quick Guard, Spiky Shield, or Wide Guard, or if it was one of those moves and the user's protection was broken. Fails if the user moves last this turn.",
		shortDesc: "User survives attacks with HP based on severity.",
		// desc: "The user will survive attacks made by other Pokemon during this turn with at least 1 HP. This move has a 1/X chance of being successful, where X starts at 1 and triples each time this move is successfully used. X resets to 1 if this move fails, if the user's last move used is not Baneful Bunker, Detect, Endure, King's Shield, Protect, Quick Guard, Spiky Shield, or Wide Guard, or if it was one of those moves and the user's protection was broken. Fails if the user moves last this turn.",
		condition: {
			duration: 1,
			onStart(target) {
				if (target.volatiles['stall']) {
					this.add('-singleturn', target, 'move: Endure', '[severity] ' + target.volatiles['stall'].severity);
					this.effectState.severity = target.volatiles['stall'].severity;
				} else { this.add('-singleturn', target, 'move: Endure', '[severity] ' + Scripts.severity); }
			},
			onDamagePriority: -10,
			onDamage(damage, target, source, effect) {
				const hpResult = target.maxhp - target.maxhp * this.effectState.severity / 100 + 1;
				if (effect?.effectType === 'Move' && target.hp >= hpResult && damage >= target.hp - hpResult) {
					this.add('-activate', target, 'move: Endure');
					return target.hp - hpResult;
				}
			},
		},
	},
	entrainment: {
		inherit: true,
		desc: "Causes the target's Ability to become the same as the user's. Fails if the target's Ability is Battle Bond, Comatose, Disguise, Multitype, Power Construct, RKS System, Schooling, Shields Down, Stance Change, Truant, or Zen Mode, or the same Ability as the user, or if the user's Ability is Battle Bond, Comatose, Disguise, Flower Gift, Forecast, Illusion, Imposter, Multitype, Power Construct, Power of Alchemy, Receiver, RKS System, Schooling, Shields Down, Stance Change, Trace, or Zen Mode.",
		flags: {protect: 1, reflectable: 1, mirror: 1, allyanim: 1, binary: 1},
	},
	facade: {
		inherit: true,
		desc: "Power increases if the user is burned, paralyzed, or poisoned, up to x2 at 100 severity. The physical damage halving effect from the user's burn is ignored.",
		shortDesc: "Power increases if user is burn/poison/paralyzed.",
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
		desc: "Prevents all active Pokemon from switching next turn. A Pokemon can still switch out if it is holding Shed Shell or uses Baton Pass, Parting Shot, U-turn, or Volt Switch. Fails if the effect is already active.",
		flags: {mirror: 1, authentic: 1, binary: 1},
	},
	fling: {
		inherit: true,
		flags: {protect: 1, mirror: 1, allyanim: 1, binary: 1},
	},
	focusenergy: {
		inherit: true,
		desc: "Raises the user's critical hit stage by 2. Fails if the user already has the effect. Baton Pass can be used to transfer this effect to an ally.",
		shortDesc: "Raises the user's critical hit stage by 2.",
		flags: {snatch: 1, binary: 1},
	},
	foresight: {
		inherit: true,
		desc: "As long as the target remains active, a portion its evasiveness stat stage is ignored during accuracy checks against it if it is greater than 0, and Normal- and Fighting-type attacks can hit the target if it is a Ghost type. Fails if the target is already affected, or affected by Miracle Eye or Odor Sleuth.",
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
	gastroacid: {
		inherit: true,
		desc: "Causes the target's Ability to be rendered ineffective as long as it remains active. If the target uses Baton Pass, the replacement will remain under this effect. If the target's Ability is Battle Bond, Comatose, Disguise, Multitype, Power Construct, RKS System, Schooling, Shields Down, Stance Change, or Zen Mode, this move fails, and receiving the effect through Baton Pass ends the effect immediately.",
		flags: {protect: 1, reflectable: 1, mirror: 1, allyanim: 1, binary: 1},
	},
	glitzyglow: {
		inherit: true,
		accuracy: 100,
		basePower: 90,
	},
	grudge: {
		inherit: true,
		desc: "Until the user's next turn, if an opposing Pokemon's attack knocks the user out, that move loses up to 100% of its remaining PP.",
		shortDesc: "Move that knocks out user loses up to 100% of its PP.",
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
		desc: "Eliminates or reduces the stat stage changes of all active Pokemon.",
		shortDesc: "Eliminates or reduces all stat changes.",
		onHitField() {
			this.add('-clearallboost', '[from] move: Haze', '[severity] ' + Scripts.severity);
			for (const pokemon of this.getAllActive()) {
				const newBoosts: SparseBoostsTable = {};
				let i: BoostID;
				for (i in pokemon.boosts) {
					newBoosts[i] = pokemon.boosts[i] - pokemon.boosts[i] * Scripts.severity! / 100;
				}

				pokemon.setBoost(newBoosts);
			}
		},
	},
	healbell: {
		inherit: true,
		desc: "Every Pokemon in the user's party is cured of its non-volatile status condition. Active Pokemon with the Soundproof Ability are not cured.",
		onHit(pokemon, source, move) {
			this.add('-activate', source, 'move: Heal Bell');
			const side = pokemon.side;
			let success = false;
			for (const ally of side.pokemon) {
				if (ally.hasAbility('soundproof')) continue;

				if (Scripts.severity! >= ally.statusState.severity) {
					if (ally.cureStatus()) success = true;
				} else {
					const status = ally.getStatus();
					const originalSeverity = Scripts.severity!;
					const severity = ally.statusState.severity - originalSeverity;
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
		desc: "For up to 5 turns, the target is prevented from restoring any HP as long as it remains active. During the effect, healing and draining moves are unusable, and Abilities and items that grant healing will not heal the user. Healing effects are weakened on the last turn if the turn count is a decimal number. If an affected Pokemon uses Baton Pass, the replacement will remain unable to restore its HP. Pain Split and the Regenerator Ability are unaffected. Relevant Z-Powered moves can still be selected and executed during this effect.",
		shortDesc: "Prevents foes from healing for up to 5 turns.",
		// desc: "For 5 turns, the target is prevented from restoring any HP as long as it remains active. During the effect, healing and draining moves are unusable, and Abilities and items that grant healing will not heal the user. If an affected Pokemon uses Baton Pass, the replacement will remain unable to restore its HP. Pain Split and the Regenerator Ability are unaffected. Relevant Z-Powered moves can still be selected and executed during this effect.",
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
				// max 5 turns
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
	heartswap: {
		inherit: true,
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
	hex: {
		inherit: true,
		desc: "Power increases if the target has a non-volatile status condition, up to x2 at 100 severity.",
		shortDesc: "Power increases if target has a status ailment.",
		basePowerCallback(pokemon, target, move) {
			if (target.status || target.hasAbility('comatose')) return move.basePower * (1 + target.statusState.severity / 100);
			return move.basePower;
		},
	},
	highjumpkick: {
		inherit: true,
		desc: "If this attack is not successful, the user loses half of its maximum HP, rounded down, as crash damage. If it is successful, the user loses ((100 - X) / 2)% of its maximum HP, where X is this attack's accuracy. Pokemon with the Magic Guard Ability are unaffected by crash damage.",
		shortDesc: "User is hurt greatly on miss, slightly on hit.",
		onAfterHit(target, source, move) {
			let modifiedAccuracy = Scripts.actions!.finalAccuracy;
			let modifiedDamage;
			if (typeof modifiedAccuracy === 'number') {
				modifiedAccuracy = this.clampIntRange(modifiedAccuracy, 0, 100);
				modifiedDamage = move.basePower * modifiedAccuracy / 100;
			} else { modifiedDamage = move.basePower; }
			this.damage(Math.round(source.maxhp / 2) * (1 - modifiedDamage / move.basePower), source, source, move);
		},
	},
	imprison: {
		inherit: true,
		desc: "As long as the user remains active, any moves that the user knows are disabled or have reduced severity for opposing Pokemon.Z-Powered moves can still be selected and executed during this effect.",
		shortDesc: "Disables or weakens foe's moves known by user.",
		// desc: "The user prevents all opposing Pokemon from using any moves that the user also knows as long as the user remains active. Z-Powered moves can still be selected and executed during this effect.",
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
			},
		},
	},
	incinerate: {
		inherit: true,
		desc: "The target loses its held item if it is a Berry or a Gem and this move has at least 50% accuracy. This move cannot cause Pokemon with the Sticky Hold Ability to lose their held item. Items lost to this move cannot be regained with Recycle or the Harvest Ability.",
		shortDesc: "Destroys the foe(s) Berry/Gem at >50% accuracy.",
		onHit(pokemon, source) {
			const item = pokemon.getItem();
			if ((item.isBerry || item.isGem) && Scripts.severity! >= 50 && pokemon.takeItem(source)) {
				this.add('-enditem', pokemon, item.name, '[from] move: Incinerate');
			}
		},
	},
	ingrain: {
		inherit: true,
		desc: "The user has up to 1/16 of its maximum HP restored at the end of each turn. If severity is at least 50, the user is prevented from switching out and other Pokemon cannot force the user to switch out. The user can still switch out if it uses Baton Pass, Parting Shot, U-turn, or Volt Switch. If the user leaves the field using Baton Pass, the replacement will remain trapped and still receive the healing effect. During the effect, the user can be hit normally by Ground-type attacks and be affected by Spikes, Toxic Spikes, and Sticky Web, even if the user is a Flying type or has the Levitate Ability.",
		shortDesc: "Traps/grounds at >50%; heals up to 1/16 max HP/turn.",
		// desc: "The user has 1/16 of its maximum HP restored at the end of each turn, but it is prevented from switching out and other Pokemon cannot force the user to switch out. The user can still switch out if it uses Baton Pass, Parting Shot, U-turn, or Volt Switch. If the user leaves the field using Baton Pass, the replacement will remain trapped and still receive the healing effect. During the effect, the user can be hit normally by Ground-type attacks and be affected by Spikes, Toxic Spikes, and Sticky Web, even if the user is a Flying type or has the Levitate Ability.",
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
	jumpkick: {
		inherit: true,
		desc: "If this attack is not successful, the user loses half of its maximum HP, rounded down, as crash damage. If it is successful, the user loses ((100 - X) / 2)% of its maximum HP, where X is this attack's accuracy. Pokemon with the Magic Guard Ability are unaffected by crash damage.",
		shortDesc: "User is hurt greatly on miss, slightly on hit.",
		onAfterHit(target, source, move) {
			let modifiedAccuracy = Scripts.actions!.finalAccuracy;
			let modifiedDamage;
			if (typeof modifiedAccuracy === 'number') {
				modifiedAccuracy = this.clampIntRange(modifiedAccuracy, 0, 100);
				modifiedDamage = move.basePower * modifiedAccuracy / 100;
			} else { modifiedDamage = move.basePower; }
			this.damage(Math.round(source.maxhp / 2) * (1 - modifiedDamage / move.basePower), source, source, move);
		},
	},
	kingsshield: {
		inherit: true,
		desc: "The user is protected from most attacks made by other Pokemon during this turn, and Pokemon trying to make contact with the user have their Attack lowered 2 stages. Non-damaging moves go through this protection. This protection has 100/X severity, where X starts at 1 and triples each time this move is successfully used. X resets to 1 if this move fails, if the user's last move used is not Baneful Bunker, Detect, Endure, King's Shield, Protect, Quick Guard, Spiky Shield, or Wide Guard, or if it was one of those moves and the user's protection was broken. Fails if the user moves last this turn.",
		shortDesc: "Protects from damaging attacks. Contact: -2 Atk.",
		// desc: "The user is protected from most attacks made by other Pokemon during this turn, and Pokemon trying to make contact with the user have their Attack lowered by 2 stages. Non-damaging moves go through this protection. This move has a 1/X chance of being successful, where X starts at 1 and triples each time this move is successfully used. X resets to 1 if this move fails, if the user's last move used is not Baneful Bunker, Detect, Endure, King's Shield, Protect, Quick Guard, Spiky Shield, or Wide Guard, or if it was one of those moves and the user's protection was broken. Fails if the user moves last this turn.",
		condition: {
			duration: 1,
			onStart(target) {
				if (target.volatiles['stall']) {
					this.add('-singleturn', target, 'Protect', '[severity] ' + target.volatiles['stall'].severity * Scripts.severity! / 100);
					this.effectState.severity = target.volatiles['stall'].severity;
				} else { this.add('-singleturn', target, 'Protect', '[severity] ' + Scripts.severity); }

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
		desc: "If the target is holding an item that can be removed from it, ignoring the Sticky Hold Ability, and this move has at least 50% accuracy, this move's power is multiplied by 1.5. If the user has not fainted, the target loses its held item. This move cannot remove Z-Crystals, cause Pokemon with the Sticky Hold Ability to lose their held item, cause Pokemon that can Mega Evolve to lose the Mega Stone for their species, or cause a Kyogre, a Groudon, a Giratina, an Arceus, a Genesect, or a Silvally to lose their Blue Orb, Red Orb, Griseous Orb, Plate, Drive, or Memory respectively. Items lost to this move cannot be regained with Recycle or the Harvest Ability.",
		shortDesc: "1.5x damage and removes held item at >50% accuracy.",
		// desc: "If the target is holding an item that can be removed from it, ignoring the Sticky Hold Ability, this move's power is multiplied by 1.5. If the user has not fainted, the target loses its held item. This move cannot remove Z-Crystals, cause Pokemon with the Sticky Hold Ability to lose their held item, cause Pokemon that can Mega Evolve to lose the Mega Stone for their species, or cause a Kyogre, a Groudon, a Giratina, an Arceus, a Genesect, or a Silvally to lose their Blue Orb, Red Orb, Griseous Orb, Plate, Drive, or Memory respectively. Items lost to this move cannot be regained with Recycle or the Harvest Ability.",
		onBasePower(basePower, source, target, move) {
			const item = target.getItem();
			if (Scripts.severity! < 50 && !this.singleEvent('TakeItem', item, target.itemState, target, target, move, item)) return;
			if (item.id) {
				return this.chainModify(1.5);
			}
		},
		onAfterHit(target, source) {
			if (source.hp && Scripts.severity! >= 50) {
				const item = target.takeItem();
				if (item) {
					this.add('-enditem', target, item.name, '[from] move: Knock Off', '[of] ' + source);
				}
			}
		},
	},
	laserfocus: {
		inherit: true,
		desc: "Until the end of the next turn, the critical hit stage of the user's moves will be increased up to 3.",
		shortDesc: "Critical hit stage of next move increased up to 3.",
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
		desc: "The Pokemon at the user's position steals up to 1/8 of the target's maximum HP, rounded down, at the end of each turn. If Big Root is held by the recipient, the HP recovered is 1.3x normal, rounded half down. If the target uses Baton Pass, the replacement will continue being leeched. If the target switches out or uses Rapid Spin successfully, the effect ends. Grass-type Pokemon are immune to this move on use, but not its effect.",
		shortDesc: "User heals up to 1/8 of target's HP every turn.",
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
	lockon: {
		inherit: true,
		desc: "Until the end of the next turn, the user's moves will have increased accuracy. At 50 severity or greater, the target can be hit in the middle of a two-turn move. The effect ends if either the user or the target leaves the field. Fails if this effect is active for the user.",
		shortDesc: "User's next move will have increased accuracy.",
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
					if (accuracy === 100) { return 100; } else if (typeof accuracy === 'number') {
						return accuracy + (100 - accuracy) * this.effectState.severity / 100;
					}
				}
			},
			onEnd(source) {
				this.add('-end', source, 'Lock-On', '[silent]');
			},
		},
	},
	magiccoat: {
		inherit: true,
		desc: "Until the end of the turn, certain non-damaging moves will have reduced severity against the user, and the user will use such moves with the remaining severity against the original user. Moves reflected in this way are unable to be reflected again by this or the Magic Bounce Ability's effect. Spikes, Stealth Rock, Sticky Web, and Toxic Spikes can only be reflected once per side, by the leftmost Pokemon under this or the Magic Bounce Ability's effect. The Lightning Rod and Storm Drain Abilities redirect their respective moves before this move takes effect.",
		shortDesc: "Reflects a percentage of certain non-damaging moves.",
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
	magnetrise: {
		inherit: true,
		desc: "For up to 5 turns, the user is immune to Ground-type attacks and the effects of Spikes, Toxic Spikes, Sticky Web, and the Arena Trap Ability as long as it remains active. If the user uses Baton Pass, the replacement will gain the effect. Ingrain, Smack Down, Thousand Arrows, and Iron Ball override this move if the user is under any of their effects. Fails if the user is already under this effect or the effects of Ingrain, Smack Down, or Thousand Arrows.",
		shortDesc: "For up to 5 turns, the user has immunity to Ground.",
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

				// max 5 turns
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
		desc: "Damage doubles if the target is using Dig.",
		shortDesc: "Hits adjacent Pokemon. 2x on Dig.",
		basePower: 71,
		onModifyMove(move, pokemon) {},
		onUseMoveMessage(pokemon, target, move) {},
	},
	metronome: {
		inherit: true,
		desc: "Deals typeless damage. When calculating damage, the average of the user’s Attack and Special Attack are used, as are the average of the target’s Defense and Special Defense. Raises all of the user’s stats and lowers all of the target’s stats by 0.01. Causes 15-severity all-status, which combines the effects of burn, freeze, paralysis, poison, and sleep at 3 severity.",
		shortDesc: "15-severity status. Raises/lowers all stats 0.01.",
		// desc: "A random move is selected for use, other than After You, Assist, Baneful Bunker, Beak Blast, Belch, Bestow, Celebrate, Chatter, Copycat, Counter, Covet, Crafty Shield, Destiny Bond, Detect, Diamond Storm, Dragon Ascent, Endure, Feint, Fleur Cannon, Focus Punch, Follow Me, Freeze Shock, Helping Hand, Hold Hands, Hyperspace Fury, Hyperspace Hole, Ice Burn, Instruct, King's Shield, Light of Ruin, Mat Block, Me First, Metronome, Mimic, Mind Blown, Mirror Coat, Mirror Move, Nature Power, Origin Pulse, Photon Geyser, Plasma Fists, Precipice Blades, Protect, Quash, Quick Guard, Rage Powder, Relic Song, Secret Sword, Shell Trap, Sketch, Sleep Talk, Snarl, Snatch, Snore, Spectral Thief, Spiky Shield, Spotlight, Steam Eruption, Struggle, Switcheroo, Techno Blast, Thief, Thousand Arrows, Thousand Waves, Transform, Trick, V-create, or Wide Guard.",
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
		desc: "Until the end of the next turn, the user's moves will have increased accuracy. At 50 severity or greater, the target can be hit in the middle of a two-turn move. The effect ends if either the user or the target leaves the field. Fails if this effect is active for the user.",
		shortDesc: "User's next move will have increased accuracy.",
		onHit(target, source) {
			source.addVolatile('lockon', target);
			this.add('-start', source, 'Lock-On', '[of] ' + target, '[severity] ' + Scripts.severity);
		},
	},
	minimize: {
		inherit: true,
		desc: "Raises the user's evasiveness by 2 stages. Whether or not the user's evasiveness was changed, Body Slam, Dragon Rush, Flying Press, Heat Crash, Heavy Slam, Malicious Moonsault, Steamroller, and Stomp will have increased accuracy and have their damage increased up to x2 if used against the user while it is active.",
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
		desc: "As long as the target remains active, a portion of its evasiveness stat stage is ignored during accuracy checks against it if it is greater than 0, and Psychic-type attacks can hit the target if it is a Dark type. Fails if the target is already affected, or affected by Foresight or Odor Sleuth.",
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
	naturalgift: {
		inherit: true,
		flags: {protect: 1, mirror: 1, binary: 1},
	},
	nightmare: {
		inherit: true,
		desc: "Causes the target to lose 1/4 of its maximum HP, rounded down and scaled with sleep severity, at the end of each turn as long as it is asleep. This move does not affect the target unless it is asleep. The effect ends when the target wakes up, even if it falls asleep again in the same turn.",
		shortDesc: "Sleeping target hurt by up to 1/4 max HP per turn.",
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
		desc: "Each active Pokemon receives a perish count of 4 if it doesn't already have a perish count. At the end of each turn including the turn used, the perish count of all active Pokemon lowers by 1 and Pokemon take damage of up to 100% of its maximum HP if the number reaches 0. The perish count is removed from Pokemon that switch out. If a Pokemon uses Baton Pass while it has a perish count, the replacement will gain the perish count and continue to count down.",
		shortDesc: "All active Pokemon take up to 100% damage in 3 turns.",
		//start: "  All Pok\u00E9mon that heard the song will take damage in three turns!",
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
		desc: "If this move is successful, its accuracy is at least 50%, and the user has not fainted, it steals the target's held Berry if it is holding one and eats it immediately, gaining its effects even if the user's item is being ignored. Items lost to this move cannot be regained with Recycle or the Harvest Ability.",
		shortDesc: "Steals and eats the target's Berry at >50% accuracy.",
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
		desc: "If the target uses a Fire-type move this turn, the move is weakened and the target loses up to 1/4 of its maximum HP, rounded half up. This effect does not happen if the Fire-type move is prevented by Primordial Sea.",
		shortDesc: "Target loses up to 1/4 max HP on Fire move use.",
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
					return this.effectState.severity < 100;
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
	present: {
		inherit: true,
		desc: "No additional effect.",
		shortDesc: "No additional effect.",
		basePower: 49,
		onModifyMove(move, pokemon, target) {},
	},
	protect: {
		inherit: true,
		desc: "The user is protected from most attacks made by other Pokemon during this turn. This protection has 100/X severity, where X starts at 1 and triples each time this move is successfully used. X resets to 1 if this move fails, if the user's last move used is not Baneful Bunker, Detect, Endure, King's Shield, Protect, Quick Guard, Spiky Shield, or Wide Guard, or if it was one of those moves and the user's protection was broken. Fails if the user moves last this turn.",
		// desc: "The user is protected from most attacks made by other Pokemon during this turn, and Pokemon making contact with the user become poisoned. This move has a 1/X chance of being successful, where X starts at 1 and triples each time this move is successfully used. X resets to 1 if this move fails, if the user's last move used is not Baneful Bunker, Detect, Endure, King's Shield, Protect, Quick Guard, Spiky Shield, or Wide Guard, or if it was one of those moves and the user's protection was broken. Fails if the user moves last this turn.",
		condition: {
			duration: 1,
			onStart(target) {
				if (target.volatiles['stall']) {
					this.add('-singleturn', target, 'Protect', '[severity] ' + target.volatiles['stall'].severity * Scripts.severity! / 100);
					this.effectState.severity = target.volatiles['stall'].severity;
				} else { this.add('-singleturn', target, 'Protect', '[severity] ' + Scripts.severity); }

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
	psychoshift: {
		inherit: true,
		desc: "All or part of the user's non-volatile status condition is transferred to the target, and the user is then cured or has its severity reduced. Fails if the user has no non-volatile status condition or if the target already has one.",
		shortDesc: "Transfers all or part of user's status to the target.",
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
					const status = pokemon.getStatus();
					const originalSeverity = Scripts.severity!;
					const severity = pokemon.statusState.severity - originalSeverity;
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
		desc: "The user copies all or part of the target's current stat stage changes.",
		onHit(target, source) {
			let i: BoostID;
			for (i in target.boosts) {
				source.boosts[i] = source.boosts[i] - (source.boosts[i] - target.boosts[i]) * Scripts.severity! / 100;
			}

			const volatilesToCopy = ['focusenergy', 'gmaxchistrike', 'laserfocus'];
			const originalSeverity = Scripts.severity!;
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
		inherit: true,
		desc: "Deals damage to the target equal to the user's level.",
		shortDesc: "Does damage equal to the user's level.",
		damage: 'level',
	},
	purify: {
		inherit: true,
		desc: "If the target has a non-volatile status condition, it is cured or has its severity reduced. If the target was cured, the user restores up to 1/2 of its maximum HP, rounded down.",
		shortDesc: "Cures/reduces target's status; heals user if so.",
		onHit(target, source, move) {
			let success = false;
			if (Scripts.severity! >= target.statusState.severity) {
				const statusSeverity = target.statusState.severity;
				if (target.cureStatus()) {
					this.heal(Math.ceil(source.maxhp * 0.5 * statusSeverity * Scripts.severity! / 10000), source);
					success = true;
				}
			} else {
				const status = target.getStatus();
				const originalSeverity = Scripts.severity!;
				const severity = target.statusState.severity - originalSeverity;
				if (target.clearStatus()) {
					Scripts.severity = severity;
					move.flags.lesser = 1;
					target.setStatus(status, source, move);
					this.heal(Math.ceil(source.maxhp * 0.5 * originalSeverity * Scripts.severity / 10000), source);
					Scripts.severity = originalSeverity;
					success = true;
				}
			}
			return success;
		},
	},
	quickguard: {
		inherit: true,
		desc: "The user and its party members are protected from attacks with original or altered priority greater than 0 made by other Pokemon, including allies, during this turn. This move modifies the same 1/X severity used by other protection moves, where X starts at 1 and triples each time this move is successfully used, but does not decrease its own severity. X resets to 1 if this move fails, if the user's last move used is not Baneful Bunker, Detect, Endure, King's Shield, Protect, Quick Guard, Spiky Shield, or Wide Guard, or if it was one of those moves and the user's protection was broken. Fails if the user moves last this turn or if this move is already in effect for the user's side.",
		// desc: "The user and its party members are protected from attacks with original or altered priority greater than 0 made by other Pokemon, including allies, during this turn. This move modifies the same 1/X chance of being successful used by other protection moves, where X starts at 1 and triples each time this move is successfully used, but does not use the chance to check for failure. X resets to 1 if this move fails, if the user's last move used is not Baneful Bunker, Detect, Endure, King's Shield, Protect, Quick Guard, Spiky Shield, or Wide Guard, or if it was one of those moves and the user's protection was broken. Fails if the user moves last this turn or if this move is already in effect for the user's side.",
		condition: {
			duration: 1,
			onSideStart(target, source) {
				if (source.volatiles['stall']) {
					this.add('-singleturn', source, 'Quick Guard', '[severity] ' + source.volatiles['stall'].severity * Scripts.severity! / 100);
					this.effectState.severity = source.volatiles['stall'].severity;
				} else { this.add('-singleturn', source, 'Quick Guard', '[severity] ' + Scripts.severity); }

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
	recycle: {
		inherit: true,
		desc: "The user regains the item it last used. Fails if the user is holding an item, if the user has not held an item, if the item was a popped Air Balloon, if the item was picked up by a Pokemon with the Pickup Ability, or if the item was lost to Bug Bite, Covet, Incinerate, Knock Off, Pluck, or Thief. Items thrown with Fling can be regained.",
		flags: {snatch: 1, binary: 1},
	},
	reflecttype: {
		inherit: true,
		flags: {protect: 1, authentic: 1, allyanim: 1, binary: 1},
	},
	rest: {
		inherit: true,
		desc: "The user falls asleep for the next two turns and restores all of its HP, curing itself of any non-volatile status condition in the process. Fails if the user has full HP, is already asleep at 100 severity, or if another effect is preventing sleep.",
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
			const originalSeverity = Scripts.severity!;
			let severity = originalSeverity;
			if (Scripts.severity! < target.statusState.severity) severity = target.statusState.severity;
			target.clearStatus();
			Scripts.severity = severity;
			if (!target.setStatus('slp', source, move)) return false;
			Scripts.severity = originalSeverity;
			this.heal(target.maxhp * Scripts.severity / 100);
		},
	},
	roar: {
		inherit: true,
		desc: "The target is forced to switch out and be replaced with their next unfainted ally. Fails if the target is the last unfainted Pokemon in its party, or if the target used Ingrain previously or has the Suction Cups Ability.",
		shortDesc: "Forces the target to switch to their next ally.",
		flags: {reflectable: 1, mirror: 1, sound: 1, authentic: 1, allyanim: 1, binary: 1},
	},
	roleplay: {
		inherit: true,
		desc: "The user's Ability changes to match the target's Ability. Fails if the user's Ability is Battle Bond, Comatose, Disguise, Multitype, Power Construct, RKS System, Schooling, Shields Down, Stance Change, Zen Mode, or already matches the target, or if the target's Ability is Battle Bond, Comatose, Disguise, Flower Gift, Forecast, Illusion, Imposter, Multitype, Power Construct, Power of Alchemy, Receiver, RKS System, Schooling, Shields Down, Stance Change, Trace, Wonder Guard, or Zen Mode.",
		flags: {authentic: 1, allyanim: 1, binary: 1},
	},
	roost: {
		inherit: true,
		desc: "The user restores 1/2 of its maximum HP, rounded half up. At >50% severity, Flying-type users lose their Flying type and pure Flying-type users become Normal type until the end of the turn. Does nothing if the user's HP is full.",
		shortDesc: "Heals 50% HP. At >50% accuracy, Flying-type removed.",
		onHit(target, source, move) {
			if (Scripts.severity! >= 50) move.self!.volatileStatus = 'roost';
			else move.self!.volatileStatus = undefined;
		},
	},
	simplebeam: {
		inherit: true,
		desc: "Causes the target's Ability to become Simple. Fails if the target's Ability is Battle Bond, Comatose, Disguise, Multitype, Power Construct, RKS System, Schooling, Shields Down, Simple, Stance Change, Truant, or Zen Mode.",
		flags: {protect: 1, reflectable: 1, mirror: 1, allyanim: 1, binary: 1},
	},
	sketch: {
		inherit: true,
		flags: {authentic: 1, allyanim: 1, binary: 1},
	},
	skillswap: {
		inherit: true,
		desc: "The user swaps its Ability with the target's Ability. Fails if either the user or the target's Ability is Battle Bond, Comatose, Disguise, Illusion, Multitype, Power Construct, RKS System, Schooling, Shields Down, Stance Change, Wonder Guard, or Zen Mode.",
		flags: {protect: 1, mirror: 1, authentic: 1, allyanim: 1, binary: 1},
	},
	sleeptalk: {
		inherit: true,
		desc: "Has power, accuracy, and secondary effect severity equal to the average of the user’s other moves. Scales with the severity of user's sleep. Deals typeless damage. The secondary effect is that of the move with the highest severity. In the case of a tie, the move in the earliest move slot will be considered.",
		shortDesc: "Effect based on user's moves. Scales with sleep.",
		// desc: "One of the user's known moves, besides this move, is selected for use at random. Fails if the user is not asleep. The selected move does not have PP deducted from it, and can currently have 0 PP. This move cannot select Assist, Beak Blast, Belch, Bide, Celebrate, Chatter, Copycat, Focus Punch, Hold Hands, Me First, Metronome, Mimic, Mirror Move, Nature Power, Shell Trap, Sketch, Sleep Talk, Struggle, Uproar, any two-turn move, or any Z-Move.",
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
						} else { move.self.boosts = m.boosts; }
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
				// remove the sleep part of the severity modifier
				this.effectState.severityModifier = 1;
				this.effectState.severityModifier *= 1 - 0.25 * this.effectState.severity / 300;
				move.accuracy *= pokemon.statusState.severity / 273;
			} else if (pokemon.status === 'all') {
				// remove the sleep part of the severity modifier
				this.effectState.severityModifier = 1;
				this.effectState.severityModifier *= 1 - 0.25 * this.effectState.severity / 500;
				move.accuracy *= pokemon.statusState.severity / 500;
			}

			move.secondaries.push(move.secondary);
		},
		onModifyMove(move, pokemon, target) {
			move.type = '???';
		},
		onHit(target) {},
		target: "normal",
	},
	smackdown: {
		inherit: true,
		desc: "This move can hit a target using Bounce, Fly, or Sky Drop, or is under the effect of Sky Drop. If this move has greater than 50% accuracy and hits a target under the effect of Bounce, Fly, Magnet Rise, or Telekinesis, the effect ends. If the target is a Flying type that has not used Roost this turn or a Pokemon with the Levitate Ability, it loses its immunity to Ground-type attacks and the Arena Trap Ability as long as it remains active. During the effect, Magnet Rise fails for the target and Telekinesis fails against the target.",
		shortDesc: "Removes the target's Ground immunity at >50% accuracy",
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
		desc: "Power increases if the target is paralyzed, up to x2 at 100 severity. If the user has not fainted, the target's paralysis is cured or has its severity reduced'.",
		shortDesc: "Power up if target is paralyzed, and cures/reduces it",
		basePowerCallback(pokemon, target, move) {
			const severity = Scripts.severity! >= target.statusState.severity ? target.statusState.severity : Scripts.severity!;
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
					const status = target.getStatus();
					const originalSeverity = Scripts.severity!;
					const severity = target.statusState.severity - originalSeverity;
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
		desc: "If another Pokemon uses certain non-damaging moves this turn, the user steals part of the severity of that move to use itself, and the original move is executed with the remaining severity. If multiple Pokemon use one of those moves this turn, the applicable moves are all stolen by the first Pokemon in turn order that used this move this turn. This effect is ignored while the user is under the effect of Sky Drop.",
		shortDesc: "User steals a percentage of certain support moves.",
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
		desc: "Causes 30-severity flinch. Scales with the severity of the user's sleep.",
		shortDesc: "Causes 30-severity flinch. Scales with sleep.",
		onTry(source) {
			return source.status === 'slp' || source.status === 'aff' || source.status === 'all' || source.hasAbility('comatose');
		},
		basePowerCallback(pokemon, target, move) {
			if (pokemon.status === 'slp' && pokemon.statusState.time === 0) {
				pokemon.statusState.severityModifier = 1;
				return move.basePower * (2 * pokemon.statusState.severity / 100) % 1;
			} else if (pokemon.status === 'aff') {
				// remove the sleep part of the severity modifier
				this.effectState.severityModifier = 1;
				this.effectState.severityModifier *= 1 - 0.25 * this.effectState.severity / 300;
				return move.basePower * pokemon.statusState.severity / 273;
			} else if (pokemon.status === 'all') {
				// remove the sleep part of the severity modifier
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
	sparklingaria: {
		inherit: true,
		desc: "If the user has not fainted, the target is cured of its burn or has its severity reduced.",
		shortDesc: "The target has its burn cured or reduced.",
		secondary: {
			dustproof: true,
			chance: 100,
			onHit(target, source, move) {
				if (target.status === 'brn' || target.status === 'tri' || target.status === 'all') {
					if (Scripts.severity! >= target.statusState.severity) {
						target.cureStatus();
					} else {
						const status = target.getStatus();
						const originalSeverity = Scripts.severity!;
						const severity = target.statusState.severity - originalSeverity;
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
			const newTargetSpeed = target.storedStats.spe - (target.storedStats.spe - source.storedStats.spe) * Scripts.severity! / 100;
			const newSourceSpeed = source.storedStats.spe - (source.storedStats.spe - target.storedStats.spe) * Scripts.severity! / 100;

			target.storedStats.spe = newTargetSpeed;
			source.storedStats.spe = newSourceSpeed;

			console.log(target.name, target.storedStats.spe);
			console.log(source.name, source.storedStats.spe);
			this.add('-activate', source, 'move: Speed Swap', '[of] ' + target);
		},
	},
	spiderweb: {
		inherit: true,
		desc: "Prevents the target from switching out. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Parting Shot, U-turn, or Volt Switch. If the target leaves the field using Baton Pass, the replacement will remain trapped. The effect ends if the user leaves the field.",
		flags: {protect: 1, reflectable: 1, mirror: 1, binary: 1},
	},
	spikes: {
		inherit: true,
		flags: {reflectable: 1, nonsky: 1, binary: 1},
	},
	spikyshield: {
		inherit: true,
		desc: "The user is protected from most attacks made by other Pokemon during this turn, and Pokemon making contact with the user lose 1/8 of their maximum HP, rounded down. This protection has 100/X severity, where X starts at 1 and triples each time this move is successfully used. X resets to 1 if this move fails, if the user's last move used is not Baneful Bunker, Detect, Endure, King's Shield, Protect, Quick Guard, Spiky Shield, or Wide Guard, or if it was one of those moves and the user's protection was broken. Fails if the user moves last this turn.",
		// desc: "The user is protected from most attacks made by other Pokemon during this turn, and Pokemon making contact with the user lose 1/8 of their maximum HP, rounded down. This move has a 1/X chance of being successful, where X starts at 1 and triples each time this move is successfully used. X resets to 1 if this move fails, if the user's last move used is not Baneful Bunker, Detect, Endure, King's Shield, Protect, Quick Guard, Spiky Shield, or Wide Guard, or if it was one of those moves and the user's protection was broken. Fails if the user moves last this turn.",
		condition: {
			duration: 1,
			onStart(target) {
				if (target.volatiles['stall']) {
					this.add('-singleturn', target, 'Protect', '[severity] ' + target.volatiles['stall'].severity * Scripts.severity! / 100);
					this.effectState.severity = target.volatiles['stall'].severity;
				} else { this.add('-singleturn', target, 'Protect', '[severity] ' + Scripts.severity); }

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
		desc: "Prevents the target from switching out when accuracy is at least 50%. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Parting Shot, U-turn, or Volt Switch. If the target leaves the field using Baton Pass, the replacement will remain trapped. The effect ends if the user leaves the field.",
		shortDesc: "Prevents the target from switching at >50% accuracy.",
		secondary: {
			chance: 100,
			onHit(target, source, move) {
				if (source.isActive && Scripts.severity! >= 50) target.addVolatile('trapped', source, move, 'trapper');
			},
		},
	},
	spite: {
		inherit: true,
		desc: "Causes the target's last move used to lose up to 4 PP. Fails if the target has not made a move, if the move has 0 PP, or if it no longer knows the move.",
		shortDesc: "Lowers PP of the target's last move by up to 4.",
		onHit(target) {
			let move: Move | ActiveMove | null = target.lastMove;
			if (!move || move.isZ) return false;
			if (move.isMax && move.baseMove) move = this.dex.moves.get(move.baseMove);

			const ppDeducted = target.deductPP(move.id, Math.floor(4 * Scripts.severity! / 100));
			if (!ppDeducted) return false;
			this.add("-activate", target, 'move: Spite', move.name, ppDeducted);
		},
	},
	stealthrock: {
		inherit: true,
		flags: {reflectable: 1, binary: 1},
	},
	stickyweb: {
		inherit: true,
		flags: {reflectable: 1, binary: 1},
	},
	stockpile: {
		inherit: true,
		flags: {snatch: 1, binary: 1},
	},
	substitute: {
		inherit: true,
		flags: {snatch: 1, nonsky: 1, binary: 1},
	},
	switcheroo: {
		inherit: true,
		flags: {protect: 1, mirror: 1, allyanim: 1, binary: 1},
	},
	taunt: {
		inherit: true,
		desc: "Prevents the target from using non-damaging moves for up to three turns. Status moves are weakened on the last turn if the turn count is a decimal number. Pokemon with the Oblivious Ability or protected by the Aroma Veil Ability are immune.",
		shortDesc: "Target can't use status moves for up to 3 turns.",
		// desc: "Prevents the target from using non-damaging moves for its next three turns. Pokemon with the Oblivious Ability or protected by the Aroma Veil Ability are immune. Z-Powered moves can still be selected and executed during this effect.",
		condition: {
			duration: 3,
			onStart(target) {
				this.add('-start', target, 'move: Taunt', '[severity] ' + Scripts.severity);
				// max 3 turns
				// time is used for finding last turn with decreased severityModifier
				// duration is used for ending status
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
	telekinesis: {
		inherit: true,
		desc: "For up to 3 turns, moves used against the target have increased accuracy, other than OHKO moves. During the effect, the target is immune to Ground-type attacks and the effects of Spikes, Toxic Spikes, Sticky Web, and the Arena Trap Ability as long as it remains active. If the target uses Baton Pass, the replacement will gain the effect. Ingrain, Smack Down, Thousand Arrows, and Iron Ball override this move if the target is under any of their effects. Fails if the target is already under this effect or the effects of Ingrain, Smack Down, or Thousand Arrows. The target is immune to this move on use if its species is Diglett, Dugtrio, Alolan Diglett, Alolan Dugtrio, Sandygast, Palossand, or Gengar while Mega-Evolved. Mega Gengar cannot be under this effect by any means.",
		shortDesc: "For up to 3 turns, target floats, increased accuracy.",
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

				// max 3 turns
				// time is used for finding last turn with perfect accuracy
				// duration is used for ending status
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
					if (accuracy === 100) { return 100; } else if (typeof accuracy === 'number') {
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
	thief: {
		inherit: true,
		desc: "If this attack was successful, its accuracy was at least 50%, and the user has not fainted, it steals the target's held item if the user is not holding one. The target's item is not stolen if it is a Mail or Z-Crystal, or if the target is a Kyogre holding a Blue Orb, a Groudon holding a Red Orb, a Giratina holding a Griseous Orb, an Arceus holding a Plate, a Genesect holding a Drive, a Silvally holding a Memory, or a Pokemon that can Mega Evolve holding the Mega Stone for its species. Items lost to this move cannot be regained with Recycle or the Harvest Ability.",
		shortDesc: "Steals item at >50% accuracy if user has none.",
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
		desc: "Prevents the target from switching out when accuracy is at least 50%. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Parting Shot, U-turn, or Volt Switch. If the target leaves the field using Baton Pass, the replacement will remain trapped. The effect ends if the user leaves the field.",
		shortDesc: "Prevents target from switching out at >50% accuracy.",
		onHit(target, source, move) {
			if (source.isActive && Scripts.severity! >= 50) target.addVolatile('trapped', source, move, 'trapper');
		},
	},
	throatchop: {
		inherit: true,
		desc: "For up to 2 turns, the target cannot use sound-based moves. Sound-based moves are weakened on the last turn if the turn count is a decimal number. Z-Powered sound moves can still be selected and executed during this effect.",
		shortDesc: "For up to 2 turns, target can't use sound moves.",
		// desc: "For 2 turns, the target cannot use sound-based moves. Z-Powered sound moves can still be selected and executed during this effect.",
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
				} else { this.effectState.severityModifier = 1; }
			},
			onModifyMove(move, pokemon, target) {
				if (!move.isZ && !move.isMax && move.flags['sound'] && this.effectState.severity === 100) {
					this.add('cant', pokemon, 'move: Throat Chop');
					return false;
				} else if (!move.isZ && !move.isMax && move.flags['sound'] && this.effectState.severity < 100) {
					this.effectState.severityModifier = 1 - this.effectState.severity / 100;
				} else { this.effectState.severityModifier = 1; }
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
		desc: "At 100 severity, prevents the target from selecting the same move for use two turns in a row. Otherwise, consecutive moves are weakened. This effect ends when the target is no longer active.",
		shortDesc: "Target's consecutive moves weakened or disabled.",
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
			},
		},
	},
	toxicspikes: {
		inherit: true,
		flags: {reflectable: 1, nonsky: 1, binary: 1},
	},
	transform: {
		inherit: true,
		flags: {allyanim: 1, binary: 1},
	},
	triattack: {
		inherit: true,
		desc: "Causes 20-severity tri-status, which combines the effects of burn, freeze, and paralysis, at 20/3 severity.",
		shortDesc: "Causes 20-severity tri-status.",
		secondary: {
			chance: 20,
			status: 'tri',
			onHit(target, source) {},
		},
	},
	trick: {
		inherit: true,
		flags: {protect: 1, mirror: 1, allyanim: 1, binary: 1},
	},
	trickortreat: {
		inherit: true,
		flags: {protect: 1, reflectable: 1, mirror: 1, allyanim: 1, binary: 1},
	},
	triplekick: {
		inherit: true,
		desc: "Hits three times. Power increases to 20 for the second hit and 30 for the third. This move checks accuracy for each hit, and the attack ends if the target avoids a hit. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move does not check accuracy.",
		shortDesc: "Hits 3 times. Power rises with each hit.",
		basePowerCallback(pokemon, target, move) {
			if (pokemon.hasAbility('skilllink') || move.accuracy) return 10 * move.hit;
			return 10 * move.hit * move.accuracy;
		},
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
						const status = allyActive.getStatus();
						const originalSeverity = Scripts.severity!;
						const severity = allyActive.statusState.severity - originalSeverity;
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
						const status = foeActive.getStatus();
						const originalSeverity = Scripts.severity!;
						const severity = foeActive.statusState.severity - originalSeverity;
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
		desc: "If this move is successful, it has greater than 50% accuracy, and the user has not fainted, the user switches out even if it is trapped and is replaced immediately by a selected party member. The user does not switch out if there are no unfainted party members, or if the target switched out using an Eject Button or through the effect of the Emergency Exit or Wimp Out Abilities.",
		shortDesc: "User switches after damaging the target if >50% acc.",
		onHit(target, source, move) {
			move.selfSwitch = (Scripts.severity! >= 50);
		},
	},
	venomdrench: {
		inherit: true,
		desc: "Lowers the target's Attack, Special Attack, and Speed by 1 stage if the target is poisoned. Scales with the severity of poison.",
		onHit(target, source, move) {
			if (target.status === 'psn' || target.status === 'tox') {
				const severity = target.statusState.severity / 100;
				return !!this.boost({atk: -severity, spa: -severity, spe: -severity}, target, source, move);
			} else if (target.status === 'aff') {
				const severity = target.statusState.severity / 333;
				return !!this.boost({atk: -severity, spa: -severity, spe: -severity}, target, source, move);
			} else if (target.status === 'all') {
				const severity = target.statusState.severity / 500;
				return !!this.boost({atk: -severity, spa: -severity, spe: -severity}, target, source, move);
			}
			return false;
		},
	},
	venoshock: {
		inherit: true,
		desc: "Power increases if the user is poisoned, up to x2 at 100 severity.",
		shortDesc: "Power increases if the user is poisoned.",
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
		desc: "If this move is successful, it has greater than 50% accuracy, and the user has not fainted, the user switches out even if it is trapped and is replaced immediately by a selected party member. The user does not switch out if there are no unfainted party members, or if the target switched out using an Eject Button or through the effect of the Emergency Exit or Wimp Out Abilities.",
		shortDesc: "User switches after damaging the target if >50% acc.",
		onHit(target, source, move) {
			move.selfSwitch = (Scripts.severity! >= 50);
		},
	},
	wakeupslap: {
		inherit: true,
		desc: "Power increases if the target is asleep, up to x2 at 100 severity. If the user has not fainted, the target's sleep is cured or has its severity reduced'.",
		shortDesc: "Power up if target is asleep, and wakes/reduces it",
		isNonstandard: null,
		basePowerCallback(pokemon, target, move) {
			if (target.hasAbility('comatose')) return move.basePower * 2;

			const severity = Scripts.severity! >= target.statusState.severity ? target.statusState.severity : Scripts.severity!;
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
					const status = target.getStatus();
					const originalSeverity = Scripts.severity!;
					const severity = target.statusState.severity - originalSeverity;
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
	whirlwind: {
		inherit: true,
		desc: "The target is forced to switch out and be replaced with their next unfainted ally. Fails if the target is the last unfainted Pokemon in its party, or if the target used Ingrain previously or has the Suction Cups Ability.",
		shortDesc: "Forces the target to switch to their next ally.",
		flags: {reflectable: 1, mirror: 1, authentic: 1, allyanim: 1, binary: 1},
	},
	wideguard: {
		inherit: true,
		desc: "The user and its party members are protected from moves made by other Pokemon, including allies, during this turn that target all adjacent foes or all adjacent Pokemon. This move modifies the same 1/X severity used by other protection moves, where X starts at 1 and triples each time this move is successfully used, but does not decrease its own severity. X resets to 1 if this move fails, if the user's last move used is not Baneful Bunker, Detect, Endure, King's Shield, Protect, Quick Guard, Spiky Shield, or Wide Guard, or if it was one of those moves and the user's protection was broken. Fails if the user moves last this turn or if this move is already in effect for the user's side.",
		// desc: "The user and its party members are protected from moves made by other Pokemon, including allies, during this turn that target all adjacent foes or all adjacent Pokemon. This move modifies the same 1/X chance of being successful used by other protection moves, where X starts at 1 and triples each time this move is successfully used, but does not use the chance to check for failure. X resets to 1 if this move fails, if the user's last move used is not Baneful Bunker, Detect, Endure, King's Shield, Protect, Quick Guard, Spiky Shield, or Wide Guard, or if it was one of those moves and the user's protection was broken. Fails if the user moves last this turn or if this move is already in effect for the user's side.",
		condition: {
			duration: 1,
			onSideStart(target, source) {
				if (source.volatiles['stall']) {
					this.add('-singleturn', source, 'Wide Guard', '[severity] ' + source.volatiles['stall'].severity * Scripts.severity! / 100);
					this.effectState.severity = source.volatiles['stall'].severity;
				} else { this.add('-singleturn', source, 'Wide Guard', '[severity] ' + Scripts.severity); }

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
		desc: "Causes the target's Ability to become Insomnia. Fails if the target's Ability is Battle Bond, Comatose, Disguise, Insomnia, Multitype, Power Construct, RKS System, Schooling, Shields Down, Stance Change, Truant, or Zen Mode.",
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
	yawn: {
		inherit: true,
		desc: "Causes the target to fall asleep at the end of the next turn. Fails when used if the target cannot fall asleep or if it already has a 100-severity non-volatile status condition. At the end of the next turn, if the target is still active, does not have a 100-severity non-volatile status condition, and can fall asleep, it falls asleep. If the target becomes affected, this effect cannot be prevented by Safeguard or a substitute, or by falling asleep and waking up during the effect.",
		shortDesc: "Puts the target to sleep after 1 turn.",
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
	ancientpower: {
		inherit: true,
		desc: "Raises the user's Attack, Defense, Special Attack, Special Defense, and Speed by 0.1",
		shortDesc: "Raises all stats by 0.1 (not acc/eva).",
	},
	armthrust: {
		inherit: true,
		desc: "Hits three times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will hit five times.",
		shortDesc: "Hits 3 times in one turn.",
	},
	astonish: {
		inherit: true,
		desc: "Causes 30-severity flinch.",
		shortDesc: "Causes 30-severity flinch",
	},
	attackorder: {
		inherit: true,
		desc: "+1 critical hit stage.",
		shortDesc: "+1 critical hit stage.",
	},
	aurorabeam: {
		inherit: true,
		desc: "Lowers the target's Attack by 0.1.",
		shortDesc: "Lowers the target's Attack by 0.1.",
	},
	barrage: {
		inherit: true,
		desc: "Hits three times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will hit five times.",
		shortDesc: "Hits 3 times in one turn.",
	},
	bind: {
		inherit: true,
		desc: "Prevents the target from switching for four or five turns (seven turns if the user is holding Grip Claw). Causes damage to the target equal to 1/8 of its maximum HP (1/6 if the user is holding Binding Band), rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Parting Shot, U-turn, or Volt Switch. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
	},
	blastburn: {
		inherit: true,
		desc: "If this move is successful, the user must recharge on the following turn and will be weakened or unable to move next turn.",
		shortDesc: "User will be weakened or unable to move next turn.",
	},
	blazekick: {
		inherit: true,
		desc: "+1 critical hit stage. Causes 10-severity burn.",
		shortDesc: "+1 critical hit stage. Causes 10-severity burn.",
	},
	blizzard: {
		inherit: true,
		desc: "Causes 10-severity freeze. If the weather is Hail, this move does not check accuracy.",
		shortDesc: "Causes 10-severity freeze. Can't miss in hail.",
	},
	blueflare: {
		inherit: true,
		desc: "Causes 20-severity burn.",
		shortDesc: "Causes 20-severity burn.",
	},
	bodyslam: {
		inherit: true,
		desc: "Causes 30-severity paralysis. Damage doubles and no accuracy check is done if the target has used Minimize while active.",
		shortDesc: "Causes 30-severity paralysis.",
	},
	boltstrike: {
		inherit: true,
		desc: "Causes 20-severity paralysis.",
		shortDesc: "Causes 20-severity paralysis.",
	},
	boneclub: {
		inherit: true,
		desc: "Causes 10-severity flinch.",
		shortDesc: "Causes 10-severity flinch.",
	},
	bonerush: {
		inherit: true,
		desc: "Hits three times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will hit five times.",
		shortDesc: "Hits 3 times in one turn.",
	},
	bounce: {
		inherit: true,
		desc: "Causes 30-severity paralysis. This attack charges on the first turn and executes on the second. On the first turn, the user avoids all attacks other than Gust, Hurricane, Sky Uppercut, Smack Down, Thousand Arrows, Thunder, and Twister, and Gust and Twister have doubled power when used against it. If the user is holding a Power Herb, the move completes in one turn.",
		shortDesc: "Bounces, then hits turn 2. 30-severity paralysis.",
	},
	breakingswipe: {
		inherit: true,
		desc: "Lowers the target's Attack by 1.",
		shortDesc: "Lowers the target's Attack by 1.",
	},
	brickbreak: {
		inherit: true,
		desc: "If this attack is successful, the effects of Reflect, Light Screen, and Aurora Veil end for the target's side of the field before damage is calculated.",
	},
	bubble: {
		inherit: true,
		desc: "Lowers the target's Speed by 0.1.",
		shortDesc: "Lowers the target's Speed by 0.1.",
	},
	bubblebeam: {
		inherit: true,
		desc: "Lowers the target's Speed by 0.1.",
		shortDesc: "Lowers the target's Speed by 0.1.",
	},
	bugbuzz: {
		inherit: true,
		desc: "Lowers the target's Special Defense by 0.1.",
		shortDesc: "Lowers the target's Sp.Def by 0.1.",
	},
	bulldoze: {
		inherit: true,
		desc: "Lowers the target's Speed by 1.",
		shortDesc: "Lowers adjacent Pokemon's Speed by 1.",
	},
	bulletseed: {
		inherit: true,
		desc: "Hits three times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will hit five times.",
		shortDesc: "Hits 3 times in one turn.",
	},
	chargebeam: {
		inherit: true,
		desc: "Raises the user's Special Attack by 0.7.",
		shortDesc: "Raises the user's Sp. Atk by 0.7.",
	},
	chatter: {
		inherit: true,
		desc: "Causes 100-severity confusion.",
		shortDesc: "Causes 100-severity confusion.",
	},
	clamp: {
		inherit: true,
		desc: "Prevents the target from switching for up to 4 turns (up to seven turns if the user is holding Grip Claw). Causes damage to the target up to 1/8 of its maximum HP (1/6 if the user is holding Binding Band), rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Parting Shot, U-turn, or Volt Switch. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
		shortDesc: "Traps and damages target for up to 4 turns.",
		// desc: "Prevents the target from switching for four or five turns (seven turns if the user is holding Grip Claw). Causes damage to the target equal to 1/8 of its maximum HP (1/6 if the user is holding Binding Band), rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Parting Shot, U-turn, or Volt Switch. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
	},
	cometpunch: {
		inherit: true,
		desc: "Hits three times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will hit five times.",
		shortDesc: "Hits 3 times in one turn.",
	},
	confusion: {
		inherit: true,
		desc: "Causes 10-severity burn.",
		shortDesc: "Causes 10-severity burn.",
	},
	constrict: {
		inherit: true,
		desc: "Lowers the target's Speed by 0.1.",
		shortDesc: "Lowers the target's Speed by 0.1.",
	},
	copycat: {
		inherit: true,
		desc: "The user uses the last move used by any Pokemon, including itself. Fails if no move has been used, or if the last move used was Assist, Baneful Bunker, Beak Blast, Belch, Bestow, Celebrate, Chatter, Circle Throw, Copycat, Counter, Covet, Crafty Shield, Destiny Bond, Detect, Dragon Tail, Endure, Feint, Focus Punch, Follow Me, Helping Hand, Hold Hands, King's Shield, Mat Block, Me First, Metronome, Mimic, Mirror Coat, Mirror Move, Nature Power, Protect, Rage Powder, Roar, Shell Trap, Sketch, Sleep Talk, Snatch, Spiky Shield, Spotlight, Struggle, Switcheroo, Thief, Transform, Trick, Whirlwind, or any Z-Move.",
	},
	coreenforcer: {
		inherit: true,
		desc: "If the user moves after the target, the target's Ability is rendered ineffective as long as it remains active. If the target uses Baton Pass, the replacement will remain under this effect. If the target's Ability is Battle Bond, Comatose, Disguise, Multitype, Power Construct, RKS System, Schooling, Shields Down, Stance Change, or Zen Mode, this effect does not happen, and receiving the effect through Baton Pass ends the effect immediately.",
	},
	crabhammer: {
		inherit: true,
		desc: "+1 critical hit stage.",
		shortDesc: "+1 critical hit stage.",
	},
	crosschop: {
		inherit: true,
		desc: "+1 critical hit stage.",
		shortDesc: "+1 critical hit stage.",
	},
	crosspoison: {
		inherit: true,
		desc: "+1 critical hit stage. Causes 10-severity poison.",
		shortDesc: "+1 critical hit stage. Causes 10-severity poison.",
	},
	crunch: {
		inherit: true,
		desc: "Lowers the target's Defense by 0.2.",
		shortDesc: "Lowers the target's Defense by 0.2.",
	},
	crushclaw: {
		inherit: true,
		desc: "Lowers the target's Defense by 0.5.",
		shortDesc: "Lowers the target's Defense by 0.5.",
	},
	darkpulse: {
		inherit: true,
		desc: "Causes 20-severity flinch.",
		shortDesc: "Causes 20-severity flinch.",
	},
	defog: {
		inherit: true,
		desc: "Lowers the target's evasiveness by 1 stage. If this move is successful and whether or not the target's evasiveness was affected, the effects of Reflect, Light Screen, Aurora Veil, Safeguard, Mist, Spikes, Toxic Spikes, Stealth Rock, and Sticky Web end for the target's side, and the effects of Spikes, Toxic Spikes, Stealth Rock, and Sticky Web end for the user's side. Ignores a target's substitute, although a substitute will still block the lowering of evasiveness.",
		shortDesc: "-1 evasion; clears user and target side's hazards.",
	},
	detect: {
		inherit: true,
		desc: "The user is protected from most attacks made by other Pokemon during this turn. This protection has 100/X severity, where X starts at 1 and triples each time this move is successfully used. X resets to 1 if this move fails, if the user's last move used is not Baneful Bunker, Detect, Endure, King's Shield, Protect, Quick Guard, Spiky Shield, or Wide Guard, or if it was one of those moves and the user's protection was broken. Fails if the user moves last this turn.",
		// desc: "The user is protected from most attacks made by other Pokemon during this turn. This move has a 1/X chance of being successful, where X starts at 1 and triples each time this move is successfully used. X resets to 1 if this move fails, if the user's last move used is not Baneful Bunker, Detect, Endure, King's Shield, Protect, Quick Guard, Spiky Shield, or Wide Guard, or if it was one of those moves and the user's protection was broken. Fails if the user moves last this turn.",
	},
	diamondstorm: {
		inherit: true,
		desc: "Raises the user's Defense by 1.",
		shortDesc: "Raises the user's Defense by 1.",
	},
	discharge: {
		inherit: true,
		desc: "Causes 30-severity paralysis.",
		shortDesc: "Causes 30-severity paralysis.",
	},
	dizzypunch: {
		inherit: true,
		desc: "Causes 20-severity confusion.",
		shortDesc: "Causes 20-severity confusion.",
	},
	doubleslap: {
		inherit: true,
		desc: "Hits three times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will hit five times.",
		shortDesc: "Hits 3 times in one turn.",
	},
	dragonbreath: {
		inherit: true,
		desc: "Causes 30-severity paralysis.",
		shortDesc: "Causes 30-severity paralysis.",
	},
	dragonrush: {
		inherit: true,
		desc: "Causes 20-severity flinch. Damage doubles and no accuracy check is done if the target has used Minimize while active.",
		shortDesc: "Causes 20-severity flinch.",
	},
	drillrun: {
		inherit: true,
		desc: "+1 critical hit stage.",
		shortDesc: "+1 critical hit stage.",
	},
	dynamicpunch: {
		inherit: true,
		desc: "Causes 100-severity confusion.",
		shortDesc: "Causes 100-severity confusion.",
	},
	earthpower: {
		inherit: true,
		desc: "Lowers the target's Special Defense by 0.1.",
		shortDesc: "Lowers the target's Sp. Def by 0.1.",
	},
	electricterrain: {
		inherit: true,
		desc: "For 5 turns, the terrain becomes Electric Terrain. During the effect, the power of Electric-type attacks made by grounded Pokemon is multiplied by 1.5 and grounded Pokemon cannot fall asleep; Pokemon already asleep do not wake up. Grounded Pokemon cannot become affected by Yawn or fall asleep from its effect. Camouflage transforms the user into an Electric type, Nature Power becomes Thunderbolt, and Secret Power causes 30-severity paralysis. Fails if the current terrain is Electric Terrain.",
		// desc: "For 5 turns, the terrain becomes Electric Terrain. During the effect, the power of Electric-type attacks made by grounded Pokemon is multiplied by 1.5 and grounded Pokemon cannot fall asleep; Pokemon already asleep do not wake up. Grounded Pokemon cannot become affected by Yawn or fall asleep from its effect. Camouflage transforms the user into an Electric type, Nature Power becomes Thunderbolt, and Secret Power has a 30% chance to cause paralysis. Fails if the current terrain is Electric Terrain.",
	},
	electroweb: {
		inherit: true,
		desc: "Lowers the target's Speed by 1.",
		shortDesc: "Lowers the target's Speed by 1.",
	},
	ember: {
		inherit: true,
		desc: "Causes 10-severity burn.",
		shortDesc: "Causes 10-severity burn.",
	},
	energyball: {
		inherit: true,
		desc: "Lowers the target's Special Defense by 0.1.",
		shortDesc: "Lowers the target's Sp. Def by 0.1.",
	},
	extrasensory: {
		inherit: true,
		desc: "Causes 10-severity flinch.",
		shortDesc: "Causes 10-severity flinch.",
	},
	fakeout: {
		inherit: true,
		desc: "Causes 100-severity flinch. Fails unless it is the user's first turn on the field.",
		shortDesc: "Hits first. First turn only. 100-severity flinch.",
	},
	fierydance: {
		inherit: true,
		desc: "Raises the user's Special Attack by 0.5.",
		shortDesc: "Raises the user's Sp. Atk by 0.5.",
	},
	fireblast: {
		inherit: true,
		desc: "Causes 10-severity burn.",
		shortDesc: "Causes 10-severity burn.",
	},
	firefang: {
		inherit: true,
		desc: "Causes 10-severity burn and 10-severity flinch.",
		shortDesc: "Causes 10-severity burn and 10-severity flinch.",
	},
	firelash: {
		inherit: true,
		desc: "Lowers the target's Defense by 1.",
		shortDesc: "Lowers the target's Defense by 1.",
	},
	firepunch: {
		inherit: true,
		desc: "Causes 10-severity burn.",
		shortDesc: "Causes 10-severity burn.",
	},
	firespin: {
		inherit: true,
		desc: "Prevents the target from switching for up to 4 turns (up to seven turns if the user is holding Grip Claw). Causes damage to the target up to 1/8 of its maximum HP (1/6 if the user is holding Binding Band), rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Parting Shot, U-turn, or Volt Switch. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
		shortDesc: "Traps and damages target for up to 4 turns.",
		// desc: "Prevents the target from switching for four or five turns (seven turns if the user is holding Grip Claw). Causes damage to the target equal to 1/8 of its maximum HP (1/6 if the user is holding Binding Band), rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Parting Shot, U-turn, or Volt Switch. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
	},
	fissure: {
		inherit: true,
		desc: "Deals damage to the target equal to X% of the target's maximum HP, where X is the attack's accuracy. Ignores accuracy and evasiveness modifiers. This attack's accuracy is equal to (user's level - target's level + 30)%, and fails if the target is at a higher level. Pokemon with the Sturdy Ability are immune.",
		shortDesc: "Deals % damage from accuracy. Higher level only.",
	},
	flamecharge: {
		inherit: true,
		desc: "Raises the user's Speed by 1.",
		shortDesc: "Raises the user's Speed by 1.",
	},
	flamewheel: {
		inherit: true,
		desc: "Causes 10-severity burn.",
		shortDesc: "Causes 10-severity burn. Thaws user.",
	},
	flamethrower: {
		inherit: true,
		desc: "Causes 10-severity burn.",
		shortDesc: "Causes 10-severity burn.",
	},
	flareblitz: {
		inherit: true,
		desc: "Causes 10-severity burn. If the target lost HP, the user takes recoil damage equal to 33% the HP lost by the target, rounded half up, but not less than 1 HP.",
		shortDesc: "33% recoil. Causes 10-severity burn. Thaws user.",
	},
	flashcannon: {
		inherit: true,
		desc: "Lowers the target's Special Defense by 0.1.",
		shortDesc: "Lowers the target's Sp. Def by 0.1.",
	},
	focusblast: {
		inherit: true,
		desc: "Lowers the target's Special Defense by 0.1.",
		shortDesc: "Lowers the target's Sp. Def by 0.1.",
	},
	forcepalm: {
		inherit: true,
		desc: "Causes 30-severity paralysis.",
		shortDesc: "Causes 30-severity paralysis.",
	},
	freezedry: {
		inherit: true,
		desc: "Causes 10-severity freeze. This move's type effectiveness against Water is changed to be super effective no matter what this move's type is.",
		shortDesc: "10-severity freeze. Super effective on Water.",
	},
	freezeshock: {
		inherit: true,
		desc: "Causes 30-severity paralysis. This attack charges on the first turn and executes on the second. If the user is holding a Power Herb, the move completes in one turn.",
		shortDesc: "Charges turn 1. Hits turn 2. 30-severity paralysis.",
	},
	frenzyplant: {
		inherit: true,
		desc: "If this move is successful, the user must recharge and will be weakened or unable to move next turn.",
		shortDesc: "User will be weakened or unable to move next turn.",
	},
	frostbreath: {
		inherit: true,
		desc: "This move is always a stage 3 critical hit unless the target is under the effect of Lucky Chant or has the Battle Armor or Shell Armor Abilities.",
		shortDesc: "Always results in a stage 3 critical hit.",
	},
	furyattack: {
		inherit: true,
		desc: "Hits three times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will hit five times.",
		shortDesc: "Hits 3 times in one turn.",
	},
	furyswipes: {
		inherit: true,
		desc: "Hits three times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will hit five times.",
		shortDesc: "Hits 3 times in one turn.",
	},
	gigaimpact: {
		inherit: true,
		desc: "If this move is successful, the user must recharge and will be weakened or unable to move next turn.",
		shortDesc: "User will be weakened or unable to move next turn.",
	},
	glaciate: {
		inherit: true,
		desc: "Lowers the target's Speed by 1.",
		shortDesc: "Lowers the target's Speed by 1.",
	},
	grassyterrain: {
		inherit: true,
		desc: "For 5 turns, the terrain becomes Grassy Terrain. During the effect, the power of Grass-type attacks used by grounded Pokemon is multiplied by 1.5, the power of Bulldoze, Earthquake, and Magnitude used against grounded Pokemon is multiplied by 0.5, and grounded Pokemon have 1/16 of their maximum HP, rounded down, restored at the end of each turn, including the last turn. Camouflage transforms the user into a Grass type, Nature Power becomes Energy Ball, and Secret Power causes 30-severity sleep. Fails if the current terrain is Grassy Terrain.",
		// desc: "For 5 turns, the terrain becomes Grassy Terrain. During the effect, the power of Grass-type attacks used by grounded Pokemon is multiplied by 1.5, the power of Bulldoze, Earthquake, and Magnitude used against grounded Pokemon is multiplied by 0.5, and grounded Pokemon have 1/16 of their maximum HP, rounded down, restored at the end of each turn, including the last turn. Camouflage transforms the user into a Grass type, Nature Power becomes Energy Ball, and Secret Power has a 30% chance to cause sleep. Fails if the current terrain is Grassy Terrain.",
	},
	gravity: {
		inherit: true,
		desc: "For 5 turns, the evasiveness of all active Pokemon is multiplied by 0.6. At the time of use, Bounce, Fly, Magnet Rise, Sky Drop, and Telekinesis end immediately for all active Pokemon. During the effect, Bounce, Fly, Flying Press, High Jump Kick, Jump Kick, Magnet Rise, Sky Drop, Splash, and Telekinesis are prevented from being used by all active Pokemon. Ground-type attacks, Spikes, Toxic Spikes, Sticky Web, and the Arena Trap Ability can affect Flying types or Pokemon with the Levitate Ability. Fails if this move is already in effect. Relevant Z-Powered moves can still be selected, but will be prevented at execution during this effect.",
	},
	growth: {
		inherit: true,
		desc: "Raises the user's Attack and Special Attack by 1 stage. If the weather is Sunny Day or Desolate Land, this move raises the user's Attack and Special Attack by 2 stages.",
	},
	guillotine: {
		inherit: true,
		desc: "Deals damage to the target equal to X% of the target's maximum HP, where X is the attack's accuracy. Ignores accuracy and evasiveness modifiers. This attack's accuracy is equal to (user's level - target's level + 30)%, and fails if the target is at a higher level. Pokemon with the Sturdy Ability are immune.",
		shortDesc: "Deals % damage from accuracy. Higher level only.",
	},
	gunkshot: {
		inherit: true,
		desc: "Causes 30-severity poison.",
		shortDesc: "Causes 30-severity poison.",
	},
	headbutt: {
		inherit: true,
		desc: "Causes 30-severity flinch.",
		shortDesc: "Causes 30-severity flinch.",
	},
	healingwish: {
		inherit: true,
		desc: "The user faints and the Pokemon brought out to replace it has its HP fully restored along with having any non-volatile status condition cured. The new Pokemon is sent out at the end of the turn, and the healing happens before hazards take effect. Fails if the user is the last unfainted Pokemon in its party.",
		shortDesc: "User faints. Replacement is fully healed.",
	},
	heartstamp: {
		inherit: true,
		desc: "Causes 30-severity flinch.",
		shortDesc: "Causes 30-severity flinch.",
	},
	heatwave: {
		inherit: true,
		desc: "Causes 10-severity burn.",
		shortDesc: "Causes 10-severity burn.",
	},
	horndrill: {
		inherit: true,
		desc: "Deals damage to the target equal to X% of the target's maximum HP, where X is the attack's accuracy. Ignores accuracy and evasiveness modifiers. This attack's accuracy is equal to (user's level - target's level + 30)%, and fails if the target is at a higher level. Pokemon with the Sturdy Ability are immune.",
		shortDesc: "Deals % damage from accuracy. Higher level only.",
	},
	howl: {
		inherit: true,
		desc: "Raises the user's Attack by 1 stage.",
		shortDesc: "Raises the user's Attack by 1.",
	},
	hurricane: {
		inherit: true,
		desc: "Causes 30-severity confusion. This move can hit a target using Bounce, Fly, or Sky Drop, or is under the effect of Sky Drop. If the weather is Primordial Sea or Rain Dance, this move does not check accuracy. If the weather is Desolate Land or Sunny Day, this move's accuracy is 50%.",
		shortDesc: "30-severity confusion. Perfect accuracy in rain.",
		// desc: "Has a 30% chance to confuse the target. This move can hit a target using Bounce, Fly, or Sky Drop, or is under the effect of Sky Drop. If the weather is Primordial Sea or Rain Dance, this move does not check accuracy. If the weather is Desolate Land or Sunny Day, this move's accuracy is 50%.",
	},
	hydrocannon: {
		inherit: true,
		desc: "If this move is successful, the user must recharge and will be weakened or unable to move next turn.",
		shortDesc: "User will be weakened or unable to move next turn.",
	},
	hyperbeam: {
		inherit: true,
		desc: "If this move is successful, the user must recharge and will be weakened or unable to move next turn.",
		shortDesc: "User will be weakened or unable to move next turn.",
	},
	hyperfang: {
		inherit: true,
		desc: "Causes 10-severity flinch.",
		shortDesc: "Causes 10-severity flinch.",
	},
	icebeam: {
		inherit: true,
		desc: "Causes 10-severity freeze.",
		shortDesc: "Causes 10-severity freeze.",
	},
	iceburn: {
		inherit: true,
		desc: "Causes 30-severity burn. This attack charges on the first turn and executes on the second. If the user is holding a Power Herb, the move completes in one turn.",
		shortDesc: "Charges turn 1. Hits turn 2. 30-severity burn.",
	},
	icefang: {
		inherit: true,
		desc: "Causes 10-severity freeze and 10-severity flinch.",
		shortDesc: "Causes 10-severity freeze and 10-severity flinch.",
	},
	icepunch: {
		inherit: true,
		desc: "Causes 10-severity freeze.",
		shortDesc: "Causes 10-severity freeze.",
	},
	iciclecrash: {
		inherit: true,
		desc: "Causes 30-severity flinch.",
		shortDesc: "Causes 30-severity flinch.",
	},
	iciclespear: {
		inherit: true,
		desc: "Hits three times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will hit five times.",
		shortDesc: "Hits 3 times in one turn.",
	},
	icywind: {
		inherit: true,
		desc: "Lowers the target's Speed by 1.",
		shortDesc: "Lowers the target's Speed by 1.",
	},
	inferno: {
		inherit: true,
		desc: "Causes 100-severity burn.",
		shortDesc: "Causes 100-severity burn.",
	},
	infestation: {
		inherit: true,
		desc: "Prevents the target from switching for up to 4 turns (up to seven turns if the user is holding Grip Claw). Causes damage to the target up to 1/8 of its maximum HP (1/6 if the user is holding Binding Band), rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Parting Shot, U-turn, or Volt Switch. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
		shortDesc: "Traps and damages target for up to 4 turns.",
		// desc: "Prevents the target from switching for four or five turns (seven turns if the user is holding Grip Claw). Causes damage to the target equal to 1/8 of its maximum HP (1/6 if the user is holding Binding Band), rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Parting Shot, U-turn, or Volt Switch. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
	},
	instruct: {
		inherit: true,
		desc: "The target immediately uses its last used move. Fails if the target has not made a move, if the move has 0 PP, if the target is preparing to use Beak Blast, Focus Punch, or Shell Trap, or if the move is Assist, Beak Blast, Belch, Bide, Celebrate, Copycat, Focus Punch, Ice Ball, Instruct, King's Shield, Me First, Metronome, Mimic, Mirror Move, Nature Power, Outrage, Petal Dance, Rollout, Shell Trap, Sketch, Sleep Talk, Struggle, Thrash, Transform, Uproar, any two-turn move, any recharge move, or any Z-Move.",
	},
	ironhead: {
		inherit: true,
		desc: "Causes 30-severity flinch.",
		shortDesc: "Causes 30-severity flinch.",
	},
	irontail: {
		inherit: true,
		desc: "Lowers the target's Defense by 0.3.",
		shortDesc: "Lowers the target's Defense by 0.3.",
	},
	karatechop: {
		inherit: true,
		desc: "+1 critical hit stage.",
		shortDesc: "+1 critical hit stage.",
	},
	lavaplume: {
		inherit: true,
		desc: "Causes 30-severity burn.",
		shortDesc: "Causes 30-severity burn.",
	},
	leafblade: {
		inherit: true,
		desc: "+1 critical hit stage.",
		shortDesc: "+1 critical hit stage.",
	},
	leaftornado: {
		inherit: true,
		desc: "Lowers the target's accuracy by 0.5.",
		shortDesc: "Lowers the target's accuracy by 0.5.",
	},
	lick: {
		inherit: true,
		desc: "Causes 30-severity paralysis.",
		shortDesc: "Causes 30-severity paralysis.",
	},
	lightscreen: {
		inherit: true,
		desc: "For 5 turns, the user and its party members take 0.5x damage from special attacks, or 0.66x damage if in a Double Battle. Damage is not reduced further with Aurora Veil. Critical hits ignore a percentage of this effect depending on their stage. It is removed from the user's side if the user or an ally is successfully hit by Brick Break, Psychic Fangs, or Defog. Lasts for 8 turns if the user is holding Light Clay. Fails if the effect is already active on the user's side.",
	},
	liquidation: {
		inherit: true,
		desc: "Lowers the target's Defense by 0.2.",
		shortDesc: "Lowers the target's Defense by 0.2.",
	},
	lowsweep: {
		inherit: true,
		desc: "Lowers the target's Speed by 1.",
		shortDesc: "Lowers the target's Speed by 1.",
	},
	lunardance: {
		inherit: true,
		desc: "The user faints and the Pokemon brought out to replace it has its HP and PP fully restored along with having any non-volatile status condition cured. The new Pokemon is sent out at the end of the turn, and the healing happens before hazards take effect. Fails if the user is the last unfainted Pokemon in its party.",
		shortDesc: "User faints. Replacement is fully healed, with PP.",
	},
	lunge: {
		inherit: true,
		desc: "Lowers the target's Attack by 1.",
		shortDesc: "Lowers the target's Attack by 1.",
	},
	lusterpurge: {
		inherit: true,
		desc: "Lowers the target's Special Defense by 0.5.",
		shortDesc: "Lowers the target's Sp. Def by 0.5.",
	},
	magmastorm: {
		inherit: true,
		desc: "Prevents the target from switching for up to 4 turns (up to seven turns if the user is holding Grip Claw). Causes damage to the target up to 1/8 of its maximum HP (1/6 if the user is holding Binding Band), rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Parting Shot, U-turn, or Volt Switch. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
		shortDesc: "Traps and damages target for up to 4 turns.",
		// desc: "Prevents the target from switching for four or five turns (seven turns if the user is holding Grip Claw). Causes damage to the target equal to 1/8 of its maximum HP (1/6 if the user is holding Binding Band), rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Parting Shot, U-turn, or Volt Switch. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
	},
	meanlook: {
		inherit: true,
		desc: "Prevents the target from switching out. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Parting Shot, U-turn, or Volt Switch. If the target leaves the field using Baton Pass, the replacement will remain trapped. The effect ends if the user leaves the field.",
	},
	metalclaw: {
		inherit: true,
		desc: "Raises the user's Attack by 0.1.",
		shortDesc: "Raises the user's Attack by 0.1.",
	},
	meteormash: {
		inherit: true,
		desc: "Raises the user's Attack by 0.2.",
		shortDesc: "Raises the user's Attack by 0.2.",
	},
	mirrorshot: {
		inherit: true,
		desc: "Lowers the target's accuracy by 0.3.",
		shortDesc: "Lowers the target's accuracy by 0.3.",
	},
	mistball: {
		inherit: true,
		desc: "Lowers the target's Special Attack by 0.5.",
		shortDesc: "Lowers the target's Sp. Atk by 0.5.",
	},
	mistyterrain: {
		inherit: true,
		desc: "For 5 turns, the terrain becomes Misty Terrain. During the effect, the power of Dragon-type attacks used against grounded Pokemon is multiplied by 0.5 and grounded Pokemon cannot be inflicted with a non-volatile status condition nor confusion. Grounded Pokemon can become affected by Yawn but cannot fall asleep from its effect. Camouflage transforms the user into a Fairy type, Nature Power becomes Moonblast, and Secret Power lowers Special Attack by 0.3. Fails if the current terrain is Misty Terrain.",
	},
	moonblast: {
		inherit: true,
		desc: "Lowers the target's Special Attack by 0.3.",
		shortDesc: "Lowers the target's Sp. Atk by 0.3.",
	},
	moonlight: {
		inherit: true,
		desc: "The user restores 1/2 of its maximum HP if Delta Stream or no weather conditions are in effect, 2/3 of its maximum HP if the weather is Desolate Land or Sunny Day, and 1/4 of its maximum HP if the weather is Hail, Primordial Sea, Rain Dance, or Sandstorm, all rounded half down.",
	},
	morningsun: {
		inherit: true,
		desc: "The user restores 1/2 of its maximum HP if Delta Stream or no weather conditions are in effect, 2/3 of its maximum HP if the weather is Desolate Land or Sunny Day, and 1/4 of its maximum HP if the weather is Hail, Primordial Sea, Rain Dance, or Sandstorm, all rounded half down.",
	},
	mudbomb: {
		inherit: true,
		desc: "Lowers the target's accuracy by 0.3.",
		shortDesc: "Lowers the target's accuracy by 0.3.",
	},
	mudshot: {
		inherit: true,
		desc: "Lowers the target's Speed by 1.",
		shortDesc: "Lowers the target's Speed by 1.",
	},
	mudslap: {
		inherit: true,
		desc: "Lowers the target's accuracy by 1.",
		shortDesc: "Lowers the target's accuracy by 1.",
	},
	muddywater: {
		inherit: true,
		desc: "Lowers the target's accuracy by 0.3.",
		shortDesc: "Lowers the target's accuracy by 0.3.",
	},
	mysticalfire: {
		inherit: true,
		desc: "Lowers the target's Special Attack by 1.",
		shortDesc: "Lowers the target's Sp. Atk by 1.",
	},
	needlearm: {
		inherit: true,
		desc: "Causes 30-severity flinch.",
		shortDesc: "Causes 30-severity flinch.",
	},
	nightdaze: {
		inherit: true,
		desc: "Lowers the target's accuracy by 0.4.",
		shortDesc: "Lowers the target's accuracy by 0.4.",
	},
	nightslash: {
		inherit: true,
		desc: "+1 critical hit stage.",
		shortDesc: "+1 critical hit stage.",
	},
	nuzzle: {
		inherit: true,
		desc: "Causes 100-severity paralysis.",
		shortDesc: "Causes 100-severity paralysis.",
	},
	octazooka: {
		inherit: true,
		desc: "Lowers the target's accuracy by 0.5.",
		shortDesc: "Lowers the target's accuracy by 0.5.",
	},
	ominouswind: {
		inherit: true,
		desc: "Raises the user's Attack, Defense, Special Attack, Special Defense, and Speed by 0.1",
		shortDesc: "Raises all stats by 0.1 (not acc/eva).",
	},
	outrage: {
		inherit: true,
		desc: "The user spends two turns locked into this move and becomes confused immediately after its move on the last turn of the effect if it is not already. This move targets an opposing Pokemon at random on each turn. If the user is prevented from moving, is asleep at the beginning of a turn, or the attack is not successful against the target on the first turn of the effect, the effect ends without causing confusion. If this move is called by Sleep Talk and the user is asleep, the move is used for one turn and does not confuse the user.",
		shortDesc: "Lasts 2 turns. Confuses the user afterwards.",
	},
	petaldance: {
		inherit: true,
		desc: "The user spends two turns locked into this move and becomes confused immediately after its move on the last turn of the effect if it is not already. This move targets an opposing Pokemon at random on each turn. If the user is prevented from moving, is asleep at the beginning of a turn, or the attack is not successful against the target on the first turn of the effect, the effect ends without causing confusion. If this move is called by Sleep Talk and the user is asleep, the move is used for one turn and does not confuse the user.",
		shortDesc: "Lasts 2 turns. Confuses the user afterwards.",
	},
	pinmissile: {
		inherit: true,
		desc: "Hits three times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will hit five times.",
		shortDesc: "Hits 3 times in one turn.",
	},
	playrough: {
		inherit: true,
		desc: "Lowers the target's Attack by 0.1.",
		shortDesc: "Lowers the target's Attack by 0.1.",
	},
	poisonfang: {
		inherit: true,
		desc: "Causes 50-severity bad poison.",
		shortDesc: "Causes 50-severity bad poison.",
	},
	poisonjab: {
		inherit: true,
		desc: "Causes 30-severity poison.",
		shortDesc: "Causes 30-severity poison.",
	},
	poisonsting: {
		inherit: true,
		desc: "Causes 30-severity poison.",
		shortDesc: "Causes 30-severity poison.",
	},
	poisontail: {
		inherit: true,
		desc: "+1 critical hit stage. Causes 10-severity poison.",
		shortDesc: "+1 critical hit stage. Causes 10-severity poison.",
	},
	powdersnow: {
		inherit: true,
		desc: "Causes 10-severity freeze.",
		shortDesc: "Causes 10-severity freeze.",
	},
	poweruppunch: {
		inherit: true,
		desc: "Raises the user's Attack by 1.",
		shortDesc: "Raises the user's Attack by 1.",
	},
	prismaticlaser: {
		inherit: true,
		desc: "If this move is successful, the user must recharge and will be weakened or unable to move next turn.",
		shortDesc: "User will be weakened or unable to move next turn.",
	},
	psybeam: {
		inherit: true,
		desc: "Causes 10-severity confusion.",
		shortDesc: "Causes 10-severity confusion.",
	},
	psychic: {
		inherit: true,
		desc: "Lowers the target's Special Defense by 0.1.",
		shortDesc: "Lowers the target's Sp. Def by 0.1.",
	},
	psychicterrain: {
		inherit: true,
		desc: "For 5 turns, the terrain becomes Psychic Terrain. During the effect, the power of Psychic-type attacks made by grounded Pokemon is multiplied by 1.5 and grounded Pokemon cannot be hit by moves with priority greater than 0, unless the target is an ally. Camouflage transforms the user into a Psychic type, Nature Power becomes Psychic, and Secret Power lowers the target's Speed by 0.3. Fails if the current terrain is Psychic Terrain.",
		// desc: "For 5 turns, the terrain becomes Psychic Terrain. During the effect, the power of Psychic-type attacks made by grounded Pokemon is multiplied by 1.5 and grounded Pokemon cannot be hit by moves with priority greater than 0, unless the target is an ally. Camouflage transforms the user into a Psychic type, Nature Power becomes Psychic, and Secret Power has a 30% chance to lower the target's Speed by 1 stage. Fails if the current terrain is Psychic Terrain.",
	},
	psychocut: {
		inherit: true,
		desc: "+1 critical hit stage.",
		shortDesc: "+1 critical hit stage.",
	},
	pursuit: {
		inherit: true,
		desc: "If an adjacent opposing Pokemon switches out this turn, this move hits that Pokemon before it leaves the field, even if it was not the original target. If the user moves after an opponent using Parting Shot, U-turn, or Volt Switch, but not Baton Pass, it will hit that opponent before it leaves the field. Power doubles and no accuracy check is done if the user hits an opponent switching out, and the user's turn is over; if an opponent faints from this, the replacement Pokemon does not become active until the end of the turn.",
	},
	rapidspin: {
		inherit: true,
		desc: "If this move is successful and the user has not fainted, the effects of Leech Seed and binding moves end for the user, and all hazards are removed from the user's side of the field.",
		shortDesc: "Frees user from hazards, binding, Leech Seed.",
	},
	razorleaf: {
		inherit: true,
		desc: "+1 critical hit stage.",
		shortDesc: "+1 critical hit stage.",
	},
	razorshell: {
		inherit: true,
		desc: "Lowers the target's Defense by 0.5.",
		shortDesc: "Lowers the target's Defense by 0.5.",
	},
	razorwind: {
		inherit: true,
		desc: "+1 critical hit stage. This attack charges on the first turn and executes on the second. If the user is holding a Power Herb, the move completes in one turn.",
		shortDesc: "Charges, then hits foe(s) turn 2. +1 crit stage.",
	},
	reflect: {
		inherit: true,
		desc: "For 5 turns, the user and its party members take 0.5x damage from physical attacks, or 0.66x damage if in a Double Battle. Damage is not reduced further with Aurora Veil. Critical hits ignore a percentage of this effect depending on their stage. It is removed from the user's side if the user or an ally is successfully hit by Brick Break, Psychic Fangs, or Defog. Lasts for 8 turns if the user is holding Light Clay. Fails if the effect is already active on the user's side.",
	},
	relicsong: {
		inherit: true,
		desc: "Causes 10-severity sleep. If this move is successful on at least one target and the user is a Meloetta, it changes to Pirouette Forme if it is currently in Aria Forme, or changes to Aria Forme if it is currently in Pirouette Forme. This forme change does not happen if the Meloetta has the Sheer Force Ability. The Pirouette Forme reverts to Aria Forme when Meloetta is not active.",
		shortDesc: "Causes 10-severity sleep. Meloetta transforms.",
	},
	roaroftime: {
		inherit: true,
		desc: "If this move is successful, the user must recharge and will be weakened or unable to move next turn.",
		shortDesc: "User will be weakened or unable to move next turn.",
	},
	rockblast: {
		inherit: true,
		desc: "Hits three times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will hit five times.",
		shortDesc: "Hits 3 times in one turn.",
	},
	rockclimb: {
		inherit: true,
		desc: "Causes 20-severity confusion.",
		shortDesc: "Causes 20-severity confusion.",
	},
	rockslide: {
		inherit: true,
		desc: "Causes 30-severity flinch.",
		shortDesc: "Causes 30-severity flinch.",
	},
	rocksmash: {
		inherit: true,
		desc: "Lowers the target's Defense by 0.5.",
		shortDesc: "Lowers the target's Defense by 0.5.",
	},
	rocktomb: {
		inherit: true,
		desc: "Lowers the target's Speed by 1.",
		shortDesc: "Lowers the target's Speed by 1.",
	},
	rockwrecker: {
		inherit: true,
		desc: "If this move is successful, the user must recharge and will be weakened or unable to move next turn.",
		shortDesc: "User will be weakened or unable to move next turn.",
	},
	rollingkick: {
		inherit: true,
		desc: "Causes 30-severity flinch.",
		shortDesc: "Causes 30-severity flinch.",
	},
	sacredfire: {
		inherit: true,
		desc: "Causes 50-severity burn.",
		shortDesc: "Causes 50-severity burn. Thaws user.",
	},
	sandtomb: {
		inherit: true,
		desc: "Prevents the target from switching for four or five turns (seven turns if the user is holding Grip Claw). Causes damage to the target equal to 1/8 of its maximum HP (1/6 if the user is holding Binding Band), rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Parting Shot, U-turn, or Volt Switch. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
		shortDesc: "Traps and damages target for up to 4 turns.",
	},
	scald: {
		inherit: true,
		desc: "Causes 30-severity burn. The target thaws out if it is frozen.",
		shortDesc: "Causes 30-severity burn. Thaws target.",
	},
	searingshot: {
		inherit: true,
		desc: "Causes 30-severity burn.",
		shortDesc: "Causes 30-severity burn.",
	},
	secretpower: {
		inherit: true,
		desc: "Has a different secondary effect on the target based on the battle terrain. Causes 30-severity paralysis on the regular Wi-Fi terrain and Electric Terrain, lowers Special Attack by 0.3 stage during Misty Terrain, causes 30-severity sleep during Grassy Terrain and lowers Speed by 0.3 stage during Psychic Terrain.",
		shortDesc: "Effect varies with terrain. (30-severity paralysis)",
	},
	seedflare: {
		inherit: true,
		desc: "Lowers the target's Special Defense by 0.8.",
		shortDesc: "Lowers the target's Sp. Def by 0.8.",
	},
	shadowball: {
		inherit: true,
		desc: "Lowers the target's Special Defense by 0.2.",
		shortDesc: "Lowers the target's Sp. Def by 0.2.",
	},
	shadowbone: {
		inherit: true,
		desc: "Lowers the target's Defense by 0.2.",
		shortDesc: "Lowers the target's Defense by 0.2.",
	},
	shadowclaw: {
		inherit: true,
		desc: "+1 critical hit stage.",
		shortDesc: "+1 critical hit stage.",
	},
	shadowstrike: {
		inherit: true,
		desc: "Lowers the target's Defense by 0.5.",
		shortDesc: "Lowers the target's Defense by 0.5.",
	},
	sheercold: {
		inherit: true,
		desc: "Deals damage to the target equal to X% of the target's maximum HP, where X is the attack's accuracy. Ignores accuracy and evasiveness modifiers. This attack's accuracy is equal to (user's level - target's level + X)%, where X is 30 if the user is an Ice type and 20 otherwise, and fails if the target is at a higher level. Ice-type Pokemon and Pokemon with the Sturdy Ability are immune.",
		shortDesc: "Deals % damage from accuracy. Higher level only.",
	},
	signalbeam: {
		inherit: true,
		desc: "Causes 10-severity confusion.",
		shortDesc: "Causes 10-severity confusion.",
	},
	silverwind: {
		inherit: true,
		desc: "Raises the user's Attack, Defense, Special Attack, Special Defense, and Speed by 0.1",
		shortDesc: "Raises all stats by 0.1 (not acc/eva).",
	},
	skyattack: {
		inherit: true,
		desc: "+1 critical hit stage. Causes 30-severity flinch. This attack charges on the first turn and executes on the second. If the user is holding a Power Herb, the move completes in one turn.",
		shortDesc: "Charges, hits turn 2. 30-severity flinch. +1 crit.",
	},
	slash: {
		inherit: true,
		desc: "+1 critical hit stage.",
		shortDesc: "+1 critical hit stage.",
	},
	sludge: {
		inherit: true,
		desc: "Causes 30-severity poison.",
		shortDesc: "Causes 30-severity poison.",
	},
	sludgebomb: {
		inherit: true,
		desc: "Causes 30-severity poison.",
		shortDesc: "Causes 30-severity poison.",
	},
	sludgewave: {
		inherit: true,
		desc: "Causes 10-severity poison.",
		shortDesc: "Causes 10-severity poison.",
	},
	smog: {
		inherit: true,
		desc: "Causes 40-severity poison.",
		shortDesc: "Causes 40-severity poison.",
	},
	snarl: {
		inherit: true,
		desc: "Lowers the target's Special Attack by 1.",
		shortDesc: "Lowers the target's Sp. Atk by 1.",
	},
	solarbeam: {
		inherit: true,
		desc: "This attack charges on the first turn and executes on the second. Power is halved if the weather is Hail, Primordial Sea, Rain Dance, or Sandstorm and the user is not holding Utility Umbrella. If the user is holding a Power Herb or the weather is Desolate Land or Sunny Day, the move completes in one turn.",
	},
	solarblade: {
		inherit: true,
		desc: "This attack charges on the first turn and executes on the second. Power is halved if the weather is Hail, Primordial Sea, Rain Dance, or Sandstorm and the user is not holding Utility Umbrella. If the user is holding a Power Herb or the weather is Desolate Land or Sunny Day, the move completes in one turn.",
	},
	spacialrend: {
		inherit: true,
		desc: "+1 critical hit stage.",
		shortDesc: "+1 critical hit stage.",
	},
	spark: {
		inherit: true,
		desc: "Causes 30-severity paralysis.",
		shortDesc: "Causes 30-severity paralysis.",
	},
	spikecannon: {
		inherit: true,
		desc: "Hits three times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will hit five times.",
		shortDesc: "Hits 3 times in one turn.",
	},
	steameruption: {
		inherit: true,
		desc: "Causes 30-severity burn. The target thaws out if it is frozen.",
		shortDesc: "Causes 30-severity burn. Thaws target.",
	},
	steamroller: {
		inherit: true,
		desc: "Causes 30-severity flinch. Damage doubles and no accuracy check is done if the target has used Minimize while active.",
		shortDesc: "Causes 30-severity flinch.",
	},
	steelwing: {
		inherit: true,
		desc: "Raises the user's Defense by 0.1.",
		shortDesc: "Raises the user's Defense by 0.1.",
	},
	stokedsparksurfer: {
		inherit: true,
		desc: "Causes 100-severity paralysis.",
		shortDesc: "Causes 100-severity paralysis.",
	},
	stomp: {
		inherit: true,
		desc: "Causes 30-severity flinch. Damage doubles and no accuracy check is done if the target has used Minimize while active.",
		shortDesc: "Causes 30-severity flinch.",
	},
	stoneedge: {
		inherit: true,
		desc: "+1 critical hit stage.",
		shortDesc: "+1 critical hit stage.",
	},
	stormthrow: {
		inherit: true,
		desc: "This move is always a stage 3 critical hit unless the target is under the effect of Lucky Chant or has the Battle Armor or Shell Armor Abilities.",
		shortDesc: "Always results in a stage 3 critical hit.",
	},
	strugglebug: {
		inherit: true,
		desc: "Lowers the target's Special Attack by 1.",
		shortDesc: "Lowers the target's Sp. Atk by 1.",
	},
	synthesis: {
		inherit: true,
		desc: "The user restores 1/2 of its maximum HP if Delta Stream or no weather conditions are in effect, 2/3 of its maximum HP if the weather is Desolate Land or Sunny Day, and 1/4 of its maximum HP if the weather is Hail, Primordial Sea, Rain Dance, or Sandstorm, all rounded half down.",
	},
	tailslap: {
		inherit: true,
		desc: "Hits three times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will hit five times.",
		shortDesc: "Hits 3 times in one turn.",
	},
	teleport: {
		inherit: true,
		desc: "Fails when used.",
		shortDesc: "Fails when used.",
	},
	thrash: {
		inherit: true,
		desc: "The user spends two turns locked into this move and becomes confused immediately after its move on the last turn of the effect if it is not already. This move targets an opposing Pokemon at random on each turn. If the user is prevented from moving, is asleep at the beginning of a turn, or the attack is not successful against the target on the first turn of the effect, the effect ends without causing confusion. If this move is called by Sleep Talk and the user is asleep, the move is used for one turn and does not confuse the user.",
		shortDesc: "Lasts 2 turns. Confuses the user afterwards.",
	},
	thunder: {
		inherit: true,
		desc: "Causes 30-severity paralysis. This move can hit a target using Bounce, Fly, or Sky Drop, or is under the effect of Sky Drop. If the weather is Primordial Sea or Rain Dance, this move does not check accuracy. If the weather is Desolate Land or Sunny Day, this move's accuracy is 50%.",
		shortDesc: "30-severity paralysis. Perfect accuracy in rain.",
		// desc: "Has a 30% chance to paralyze the target. This move can hit a target using Bounce, Fly, or Sky Drop, or is under the effect of Sky Drop. If the weather is Primordial Sea or Rain Dance, this move does not check accuracy. If the weather is Desolate Land or Sunny Day, this move's accuracy is 50%.",
	},
	thunderbolt: {
		inherit: true,
		desc: "Causes 10-severity paralysis.",
		shortDesc: "Causes 10-severity paralysis.",
	},
	thunderfang: {
		inherit: true,
		desc: "Causes 10-severity paralysis and 10-severity flinch.",
		shortDesc: "Causes 10-severity paralysis, 10-severity flinch.",
	},
	thunderpunch: {
		inherit: true,
		desc: "Causes 10-severity paralysis.",
		shortDesc: "Causes 10-severity paralysis.",
	},
	thundershock: {
		inherit: true,
		desc: "Causes 10-severity paralysis.",
		shortDesc: "Causes 10-severity paralysis.",
	},
	toxic: {
		inherit: true,
		desc: "Badly poisons the target. If a Poison-type Pokemon uses this move, the move does not check accuracy, even if the target is in the middle of a two-turn move.",
		shortDesc: "Badly poisons. Perfect accuracy for Poison types.",
	},
	tropkick: {
		inherit: true,
		desc: "Lowers the target's Attack by 1.",
		shortDesc: "Lowers the target's Attack by 1.",
	},
	twineedle: {
		inherit: true,
		desc: "Hits twice, with each hit causing 20-severity poison.",
		shortDesc: "Hits 2 times. Each hit causes 20-severity poison.",
	},
	twister: {
		inherit: true,
		desc: "Causes 20-severity flinch. Power doubles if the target is using Bounce, Fly, or Sky Drop, or is under the effect of Sky Drop.",
		shortDesc: "Causes 20-severity flinch.",
	},
	volttackle: {
		inherit: true,
		desc: "Causes 10-severity paralysis. If the target lost HP, the user takes recoil damage equal to 33% the HP lost by the target, rounded half up, but not less than 1 HP.",
		shortDesc: "33% recoil. Causes 10-severity paralysis.",
	},
	waterfall: {
		inherit: true,
		desc: "Causes 20-severity flinch.",
		shortDesc: "Causes 20-severity flinch.",
	},
	waterpulse: {
		inherit: true,
		desc: "Causes 20-severity confusion.",
		shortDesc: "Causes 20-severity confusion.",
	},
	watershuriken: {
		inherit: true,
		desc: "Hits three times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will hit five times. If the user is an Ash-Greninja with the Battle Bond Ability, this move has a power of 20 and always hits three times.",
		shortDesc: "Usually goes first. Hits 3 times in one turn.",
	},
	whirlpool: {
		inherit: true,
		desc: "Prevents the target from switching for up to 4 turns (up to seven turns if the user is holding Grip Claw). Causes damage to the target up to 1/8 of its maximum HP (1/6 if the user is holding Binding Band), rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Parting Shot, U-turn, or Volt Switch. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
		shortDesc: "Traps and damages target for up to 4 turns.",
		// desc: "Prevents the target from switching for four or five turns (seven turns if the user is holding Grip Claw). Causes damage to the target equal to 1/8 of its maximum HP (1/6 if the user is holding Binding Band), rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Parting Shot, U-turn, or Volt Switch. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
	},
	wrap: {
		inherit: true,
		desc: "Prevents the target from switching for up to 4 turns (up to seven turns if the user is holding Grip Claw). Causes damage to the target up to 1/8 of its maximum HP (1/6 if the user is holding Binding Band), rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Parting Shot, U-turn, or Volt Switch. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
		shortDesc: "Traps and damages target for up to 4 turns.",
		// desc: "Prevents the target from switching for four or five turns (seven turns if the user is holding Grip Claw). Causes damage to the target equal to 1/8 of its maximum HP (1/6 if the user is holding Binding Band), rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Parting Shot, U-turn, or Volt Switch. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
	},
	zapcannon: {
		inherit: true,
		desc: "Causes 100-severity paralysis.",
		shortDesc: "Causes 100-severity paralysis.",
	},
	zenheadbutt: {
		inherit: true,
		desc: "Causes 20-severity flinch.",
		shortDesc: "Causes 20-severity flinch.",
	},
	zingzap: {
		inherit: true,
		desc: "Causes 30-severity flinch.",
		shortDesc: "Causes 30-severity flinch.",
	},
	zippyzap: {
		inherit: true,
		desc: "Will always result in a critical hit.",
		shortDesc: "Nearly always goes first. Always crits.",
	},
};

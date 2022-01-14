import { Pokemon } from "../../../sim";
import {Dex, toID} from '../../../sim/dex';
import { SecondaryEffect } from "../../../sim/dex-moves";

export const Scripts: ModdedBattleScriptsData = {
	inherit: 'gen7',
	speedTieWinner: Math.floor(Math.random() * 2),
	actions: {
		critStage: 0,
		//modded to use accuracy as a damage modifier, remove chance-based crits, set power of ohko moves
		//moves with set damage are affected by accuracy
		getDamage(
			pokemon: Pokemon, target: Pokemon, move: string | number | ActiveMove,
			suppressMessages = false
		): number | undefined | null | false {
			if (typeof move === 'string') move = this.dex.getActiveMove(move);
	
			if (typeof move === 'number') {
				const basePower = move;
				move = new Dex.Move({
					basePower,
					type: '???',
					category: 'Physical',
					willCrit: false,
				}) as ActiveMove;
				move.hit = 0;
			}
	
			if (!move.ignoreImmunity || (move.ignoreImmunity !== true && !move.ignoreImmunity[move.type])) {
				if (!target.runImmunity(move.type, !suppressMessages)) { 
					return false;
				}
			}
	
			if (move.ohko) { // bypasses accuracy modifiers
				let damage = 0;
				if (typeof Scripts.actions?.finalAccuracy === 'number') {
					let baseAccuracy = 30;
					if (move.ohko === 'Ice' && this.battle.gen >= 7 && !pokemon.hasType('Ice')) {
						baseAccuracy = 20;
					}
					if (!target.volatiles['dynamax'] && pokemon.level >= target.level && (move.ohko === true || !target.hasType(move.ohko))) {
						let accuracy = baseAccuracy + pokemon.level - target.level
						damage = target.maxhp * accuracy / 100;
						if (pokemon.volatiles['lockon']) {
							damage += (target.maxhp - target.maxhp * accuracy / 100) * pokemon.volatiles['lockon'].severity / 100;
						}
					}
				} else damage = target.maxhp;
				return this.modifyDamage(damage, pokemon, target, move, suppressMessages);
			}

			Scripts.actions!.setDamage = false;
			if (move.damageCallback) Scripts.actions!.setDamage = move.damageCallback.call(this.battle, pokemon, target);
			else if (move.damage === 'level') Scripts.actions!.setDamage = pokemon.level;
			else if (move.damage) Scripts.actions!.setDamage = move.damage;
	
			let basePower: number | false | null = move.basePower;
			if (move.basePowerCallback) {
				basePower = move.basePowerCallback.call(this.battle, pokemon, target, move);
			}
			if (!basePower && !Scripts.actions!.setDamage) return basePower === 0 ? undefined : basePower;
			basePower = this.battle.clampIntRange(basePower, 1);

			//damage modifier from accuracy cannot exceed 100%
			let accuracy: number | true | undefined = Scripts.actions!.finalAccuracy;
			if (typeof accuracy === 'number') {
				accuracy = this.battle.clampIntRange(accuracy, 0, 100)
				if (Scripts.actions!.setDamage) {
					let baseDamage = Scripts.actions!.setDamage * accuracy / 100;
					return this.modifyDamage(baseDamage, pokemon, target, move, suppressMessages);
				}
				basePower *= accuracy / 100;
			} else if (Scripts.actions!.setDamage) return this.modifyDamage(Scripts.actions!.setDamage, pokemon, target, move, suppressMessages);
	
			let critRatio = this.battle.runEvent('ModifyCritRatio', pokemon, target, move, move.critRatio || 0);
			// if (this.battle.gen <= 5) {
			// 	critRatio = this.battle.clampIntRange(critRatio, 0, 5);
			// 	critMult = [0, 16, 8, 4, 3, 2];
			// } else {
			// 	critRatio = this.battle.clampIntRange(critRatio, 0, 4);
			// 	if (this.battle.gen === 6) {
			// 		critMult = [0, 16, 8, 2, 1];
			// 	} else {
			// 		critMult = [0, 24, 8, 2, 1];
			// 	}
			// }
			critRatio = this.battle.clampIntRange(critRatio, 0, 4);
			const moveHit = target.getMoveHitData(move);
			moveHit.crit = move.willCrit || false;
			
			//for moves that always crit
			if (move.willCrit) critRatio = 4;
	
			//override crit if target is immune
			if (critRatio > 0) {
				moveHit.crit = this.battle.runEvent('CriticalHit', target, null, move);
			}
			if (!moveHit.crit) critRatio = 0;

			//max 3, -1 if target is immune
			Scripts.actions!.critStage = critRatio - 1;
	
			// happens after crit calculation
			basePower = this.battle.runEvent('BasePower', pokemon, target, move, basePower, true);
	
			if (!basePower) return 0;
			basePower = this.battle.clampIntRange(basePower, 1);
	
			const level = pokemon.level;
	
			const attacker = pokemon;
			const defender = target;
			let category = this.battle.getCategory(move);
			let defensiveCategory = move.defensiveCategory || category;
			let attack: number[] = [];
			let defense: number[] = [];
			for (let i = 0; i < 2; i++) {
				let attackStat: StatIDExceptHP = category === 'Physical' ? 'atk' : 'spa';
				const defenseStat: StatIDExceptHP = defensiveCategory === 'Physical' ? 'def' : 'spd';
				if (move.useSourceDefensiveAsOffensive) {
					attackStat = defenseStat;
					// Body press really wants to use the def stat,
					// so it switches stats to compensate for Wonder Room.
					// Of course, the game thus miscalculates the boosts...
					if ('wonderroom' in this.battle.field.pseudoWeather) {
						if (attackStat === 'def') {
							attackStat = 'spd';
						} else if (attackStat === 'spd') {
							attackStat = 'def';
						}
						if (attacker.boosts['def'] || attacker.boosts['spd']) {
							this.battle.hint("Body Press uses Sp. Def boosts when Wonder Room is active.");
						}
					}
				}
		
				const statTable = {atk: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', spe: 'Spe'};
		
				let atkBoosts = move.useTargetOffensive ? defender.boosts[attackStat] : attacker.boosts[attackStat];
				let defBoosts = defender.boosts[defenseStat];
		
				let ignoreNegativeOffensive = !!move.ignoreNegativeOffensive;
				let ignorePositiveDefensive = !!move.ignorePositiveDefensive;
		
				let ignoreDivisor = [24, 8, 2, 1];

				if (ignoreNegativeOffensive) {
					this.battle.debug('Negating (sp)atk boost/penalty.');
					atkBoosts = 0;
				} else if (atkBoosts < 0 && Scripts.actions!.critStage >= 0 && Scripts.actions!.critStage < ignoreDivisor.length) {
					atkBoosts = atkBoosts - atkBoosts * (1 / ignoreDivisor[Scripts.actions!.critStage]);
				}
				if (ignorePositiveDefensive) {
					this.battle.debug('Negating (sp)def boost/penalty.');
					defBoosts = 0;
				} else if (defBoosts > 0 && Scripts.actions!.critStage >= 0 && Scripts.actions!.critStage < ignoreDivisor.length) {
					defBoosts = defBoosts - defBoosts * (1 / ignoreDivisor[Scripts.actions!.critStage]);
				}
		
				if (move.useTargetOffensive) {
					attack.push(defender.calculateStat(attackStat, atkBoosts));
				} else {
					attack.push(attacker.calculateStat(attackStat, atkBoosts));
				}
		
				attackStat = (category === 'Physical' ? 'atk' : 'spa');
				defense.push(defender.calculateStat(defenseStat, defBoosts));
		
				// Apply Stat Modifiers
				attack[attack.length-1] = this.battle.runEvent('Modify' + statTable[attackStat], attacker, defender, move, attack[attack.length-1]);
				defense[defense.length-1] = this.battle.runEvent('Modify' + statTable[defenseStat], defender, attacker, move, defense[defense.length-1]);
		
				if (this.battle.gen <= 4 && ['explosion', 'selfdestruct'].includes(move.id) && defenseStat === 'def') {
					defense[defense.length-1] = this.battle.clampIntRange(Math.floor(defense[defensiveCategory.length-1] / 2), 1);
				}

				if (move.useAverageStats) {
					if (category === 'Physical') category = 'Special';
					else if (category === 'Special') category = 'Physical';
					if (defensiveCategory === 'Physical') defensiveCategory = 'Special';
					else if (defensiveCategory === 'Special') defensiveCategory = 'Physical';
				} else break;
			}

			let finalAttack = 0;
			for (const stat of attack) {
				finalAttack += stat;
			}
			finalAttack /= attack.length;
			let finalDefense = 0;
			for (const stat of defense) {
				finalDefense += stat;
			}
			finalDefense /= defense.length;
	
			const tr = this.battle.trunc;
	
			// int(int(int(2 * L / 5 + 2) * A * P / D) / 50);
			const baseDamage = tr(tr(tr(tr(2 * level / 5 + 2) * basePower * finalAttack) / finalDefense) / 50);
	
			// Calculate damage modifiers separately (order differs between generations)
			return this.modifyDamage(baseDamage, pokemon, target, move, suppressMessages);
		},
		
		//modded to remove random factor and modify damage based on crit stage
		//moves with set damage are affected by severity modifiers
		modifyDamage(baseDamage: number, pokemon: Pokemon, target: Pokemon, move: ActiveMove, suppressMessages = false) {
			const tr = this.battle.trunc;
			if (!Scripts.actions!.setDamage && !move.ohko) {
				if (!move.type) move.type = '???';
				const type = move.type;
		
				baseDamage += 2;
		
				if (move.spreadHit) {
					// multi-target modifier (doubles only)
					const spreadModifier = move.spreadModifier || (this.battle.gameType === 'freeforall' ? 0.5 : 0.75);
					this.battle.debug('Spread modifier: ' + spreadModifier);
					baseDamage = this.battle.modify(baseDamage, spreadModifier);
				} else if (move.multihitType === 'parentalbond' && move.hit > 1) {
					// Parental Bond modifier
					const bondModifier = this.battle.gen > 6 ? 0.25 : 0.5;
					this.battle.debug(`Parental Bond modifier: ${bondModifier}`);
					baseDamage = this.battle.modify(baseDamage, bondModifier);
				}
		
				// weather modifier
				baseDamage = this.battle.runEvent('WeatherModifyDamage', pokemon, target, move, baseDamage);
		
				// crit - not a modifier
				const isCrit = target.getMoveHitData(move).crit;
				if (isCrit) {
					let bonusDivisor = [24, 8, 2, 1];
					//critStage should be -1 if target is immune
					let bonus = 0;
					if (Scripts.actions!.critStage! >= 0 && Scripts.actions!.critStage! < bonusDivisor.length) {
						bonus = 1 / (bonusDivisor[Scripts.actions!.critStage!] * 2);
					}
					baseDamage = tr(baseDamage * (move.critModifier || 1 + bonus));
				}
		
				// replaces random factor
				baseDamage *= 0.925;
		
				// STAB
				if (move.forceSTAB || (type !== '???' && pokemon.hasType(type))) {
					// The "???" type never gets STAB
					// Not even if you Roost in Gen 4 and somehow manage to use
					// Struggle in the same turn.
					// (On second thought, it might be easier to get a MissingNo.)
					baseDamage = this.battle.modify(baseDamage, move.stab || 1.5);
				}
				// types
				let typeMod = target.runEffectiveness(move);
				typeMod = this.battle.clampIntRange(typeMod, -6, 6);
				target.getMoveHitData(move).typeMod = typeMod;
				if (typeMod > 0) {
					if (!suppressMessages) this.battle.add('-supereffective', target);
		
					for (let i = 0; i < typeMod; i++) {
						baseDamage *= 2;
					}
				}
				if (typeMod < 0) {
					if (!suppressMessages) this.battle.add('-resisted', target);
		
					for (let i = 0; i > typeMod; i--) {
						baseDamage = tr(baseDamage / 2);
					}
				}
		
				if (Scripts.actions!.critStage! > 0 && !suppressMessages) this.battle.add('message', 'A stage ' + Scripts.actions!.critStage + ' critical hit!');
		
				if (move.category === 'Physical' && !pokemon.hasAbility('guts') && (this.battle.gen < 6 || move.id !== 'facade')) {
					if (pokemon.status === 'brn') {
						baseDamage = this.battle.modify(baseDamage, 1 - 0.5 * pokemon.statusState.severity / 100);
					} else if (pokemon.status === 'tri') {
						baseDamage = this.battle.modify(baseDamage, 1 - 0.5 * pokemon.statusState.severity / 300);
					}
				}
			}

			if (pokemon.statusState.severityModifier) {
				baseDamage = this.battle.modify(baseDamage, pokemon.statusState.severityModifier);
			}

			for (const i in pokemon.volatiles) {
				if (pokemon.volatiles[i].severityModifier) {
					baseDamage = this.battle.modify(baseDamage, pokemon.volatiles[i].severityModifier);
				}
			}
			
			if (target.volatiles['foresight'] && target.hasType('Ghost') && ['Normal', 'Fighting'].includes(move.type)) {
				baseDamage = this.battle.modify(baseDamage, target.volatiles['foresight'].incomingSeverityModifier);
			}
			if (target.volatiles['miracleeye'] && target.hasType('Dark') && move.type === 'Psychic') {
				baseDamage = this.battle.modify(baseDamage, target.volatiles['miracleeye'].incomingSeverityModifier);
			}

			// Generation 5, but nothing later, sets damage to 1 before the final damage modifiers
			if (this.battle.gen === 5 && !baseDamage) baseDamage = 1;
	
			// Final modifier. Modifiers that modify damage after min damage check, such as Life Orb.
			if (!Scripts.actions!.setDamage) baseDamage = this.battle.runEvent('ModifyDamage', pokemon, target, move, baseDamage);
	
			let protectionSeverity = 0;
			if (target.volatiles['protect']) protectionSeverity =  target.volatiles['protect'].severity;
			if (target.volatiles['kingsshield']) protectionSeverity =  target.volatiles['kingsshield'].severity;
			if (target.volatiles['spikyshield']) protectionSeverity =  target.volatiles['spikyshield'].severity;
			if (target.volatiles['banefulbunker']) protectionSeverity =  target.volatiles['banefulbunker'].severity;
			if (target.volatiles['quickguard'] && move.priority > 0.1) protectionSeverity =  target.volatiles['quickguard'].severity;
			if (target.volatiles['wideguard'] && (move.target === 'allAdjacent' || move.target === 'allAdjacentFoes')) protectionSeverity =  target.volatiles['wideguard'].severity;

			if (move.isZOrMaxPowered && target.getMoveHitData(move).zBrokeProtect) {
				baseDamage = this.battle.modify(baseDamage, 1 - 0.75 * protectionSeverity / 100);
				this.battle.add('-zbroken', target);
			} else {
				baseDamage = this.battle.modify(baseDamage, 1 - protectionSeverity / 100);
			}
	
			// Generation 6-7 moves the check for minimum 1 damage after the final modifier...
			if (this.battle.gen !== 5 && !baseDamage) return 1;
	
			// ...but 16-bit truncation happens even later, and can truncate to 0
			return tr(baseDamage, 16);
		},
		//modded to determine effect severity
		runMoveEffects(
			damage: SpreadMoveDamage, targets: SpreadMoveTargets, source: Pokemon,
			move: ActiveMove, moveData: ActiveMove, isSecondary?: boolean, isSelf?: boolean
		) {
			let didAnything: number | boolean | null | undefined = damage.reduce(this.combineResults);
			for (const [i, target] of targets.entries()) {
				if (target === false) continue;
				let hitResult;
				let didSomething: number | boolean | null | undefined = undefined;

				//this function is run once for the move's primary effect and for each of its secondary effects
				//when isSecondary is true, moveData is an object containing the properties of the secondary effect
				if (isSecondary && isSelf) {
					Scripts.severity = Scripts.actions?.selfSeverity;
				}
				else if (isSecondary) {
					if (moveData) Scripts.severity = (moveData as SecondaryEffect).chance;
					else Scripts.severity = 100;
					if (typeof Scripts.actions!.finalAccuracy === 'number') Scripts.severity! *= Scripts.actions!.finalAccuracy / 100;
					
					if (source.statusState.severityModifier) {
						Scripts.severity = this.battle.modify(Scripts.severity!, source.statusState.severityModifier)
					}
					for (const j in source.volatiles) {
						if (source.volatiles[j].severityModifier) {
							Scripts.severity = this.battle.modify(Scripts.severity!, source.volatiles[j].severityModifier);
						}
					}

					if (target) {
						if (target.volatiles['foresight'] && target.hasType('Ghost') && ['Normal', 'Fighting'].includes(move.type) && move.category !== 'Status') {
							Scripts.severity = this.battle.modify(Scripts.severity!, target.volatiles['foresight'].incomingSeverityModifier);
						}
						if (target.volatiles['miracleeye'] && target.hasType('Dark') && move.type === 'Psychic' && move.category !== 'Status') {
							Scripts.severity = this.battle.modify(Scripts.severity!, target.volatiles['miracleeye'].incomingSeverityModifier);
						}

						if (target.volatiles['protect']) Scripts.severity = this.battle.modify(Scripts.severity!, target.volatiles['protect'].incomingSeverityModifier);
						if (target.volatiles['kingsshield']) Scripts.severity = this.battle.modify(Scripts.severity!, target.volatiles['kingsshield'].incomingSeverityModifier);
						if (target.volatiles['spikyshield']) Scripts.severity = this.battle.modify(Scripts.severity!, target.volatiles['spikyshield'].incomingSeverityModifier);
						if (target.volatiles['banefulbunker']) Scripts.severity = this.battle.modify(Scripts.severity!, target.volatiles['banefulbunker'].incomingSeverityModifier);
						if (target.volatiles['quickguard'] && move.priority > 0.1) Scripts.severity = this.battle.modify(Scripts.severity!, target.volatiles['quickguard'].incomingSeverityModifier);
						if (target.volatiles['wideguard'] && (move.target === 'allAdjacent' || move.target === 'allAdjacentFoes'))
							Scripts.severity = this.battle.modify(Scripts.severity!, target.volatiles['wideguard'].incomingSeverityModifier);
					}

					//severity of secondary effect cannot exceed its original chance
					Scripts.severity = this.battle.clampIntRange(Scripts.severity, 0, (moveData as SecondaryEffect).chance);

					Scripts.actions!.selfSeverity = Scripts.severity;
				}
				else {
					Scripts.severity = 100;
					if ((moveData as SecondaryEffect).chance) Scripts.severity = (moveData as SecondaryEffect).chance;
					if (typeof Scripts.actions!.finalAccuracy === 'number')	Scripts.severity! *= Scripts.actions!.finalAccuracy / 100;

					if (source.statusState.severityModifier) {
						Scripts.severity = this.battle.modify(Scripts.severity!, source.statusState.severityModifier)
					}
					for (const j in source.volatiles) {
						if (source.volatiles[j].severityModifier) {
							Scripts.severity = this.battle.modify(Scripts.severity!, source.volatiles[j].severityModifier);
						}
					}

					if (target) {
						if (target.volatiles['foresight'] && target.hasType('Ghost') && ['Normal', 'Fighting'].includes(move.type) && move.category !== 'Status') {
							Scripts.severity = this.battle.modify(Scripts.severity!, target.volatiles['foresight'].incomingSeverityModifier);
						}
						if (target.volatiles['miracleeye'] && target.hasType('Dark') && move.type === 'Psychic' && move.category !== 'Status') {
							Scripts.severity = this.battle.modify(Scripts.severity!, target.volatiles['miracleeye'].incomingSeverityModifier);
						}

						if (target.volatiles['protect']) Scripts.severity = this.battle.modify(Scripts.severity!, target.volatiles['protect'].incomingSeverityModifier);
						if (target.volatiles['kingsshield']) Scripts.severity = this.battle.modify(Scripts.severity!, target.volatiles['kingsshield'].incomingSeverityModifier);
						if (target.volatiles['spikyshield']) Scripts.severity = this.battle.modify(Scripts.severity!, target.volatiles['spikyshield'].incomingSeverityModifier);
						if (target.volatiles['banefulbunker']) Scripts.severity = this.battle.modify(Scripts.severity!, target.volatiles['banefulbunker'].incomingSeverityModifier);
						if (target.volatiles['quickguard'] && move.priority > 0.1) Scripts.severity = this.battle.modify(Scripts.severity!, target.volatiles['quickguard'].incomingSeverityModifier);
						if (target.volatiles['wideguard'] && (move.target === 'allAdjacent' || move.target === 'allAdjacentFoes'))
							Scripts.severity = this.battle.modify(Scripts.severity!, target.volatiles['wideguard'].incomingSeverityModifier);
					}

					//severity cannot exceed 100
					Scripts.severity = this.battle.clampIntRange(Scripts.severity, 0, 100)
				}

				if (moveData.flags['binary'] && Scripts.severity! < 50) {
					this.battle.add('-fail', source);
					this.battle.attrLastMove('[still]');
					continue;
				}
	
				if (target) {
					if (moveData.boosts && !target.fainted) {
						hitResult = this.battle.boost(moveData.boosts, target, source, move, isSecondary, isSelf);
						didSomething = this.combineResults(didSomething, hitResult);
					}
					if (moveData.heal && !target.fainted) {
						if (target.hp >= target.maxhp) {
							this.battle.add('-fail', target, 'heal');
							this.battle.attrLastMove('[still]');
							damage[i] = this.combineResults(damage[i], false);
							didAnything = this.combineResults(didAnything, null);
							continue;
						}
						let amount = target.baseMaxhp * moveData.heal[0] / moveData.heal[1];
						amount *= Scripts.severity! / 100;
						const d = target.heal((this.battle.gen < 5 ? Math.floor : Math.round)(amount));
						if (!d && d !== 0) {
							this.battle.add('-fail', source);
							this.battle.attrLastMove('[still]');
							this.battle.debug('heal interrupted');
							damage[i] = this.combineResults(damage[i], false);
							didAnything = this.combineResults(didAnything, null);
							continue;
						}
						this.battle.add('-heal', target, target.getHealth.bind(target));
						didSomething = true;
					}
					if (moveData.status) {
						Scripts.severity = 100 - 100 * Math.pow(1 - Scripts.severity! / 100, move.hit);
						hitResult = target.trySetStatus(moveData.status, source, moveData.ability ? moveData.ability : move);
						if (!hitResult && move.status) {
							damage[i] = this.combineResults(damage[i], false);
							didAnything = this.combineResults(didAnything, null);
							continue;
						}
						didSomething = this.combineResults(didSomething, hitResult);
					}
					if (moveData.forceStatus) {
						hitResult = target.setStatus(moveData.forceStatus, source, move);
						didSomething = this.combineResults(didSomething, hitResult);
					}
					if (moveData.volatileStatus) {
						hitResult = target.addVolatile(moveData.volatileStatus, source, move);
						didSomething = this.combineResults(didSomething, hitResult);
					}
					if (moveData.sideCondition) {
						hitResult = target.side.addSideCondition(moveData.sideCondition, source, move);
						didSomething = this.combineResults(didSomething, hitResult);
					}
					if (moveData.slotCondition) {
						hitResult = target.side.addSlotCondition(target, moveData.slotCondition, source, move);
						didSomething = this.combineResults(didSomething, hitResult);
					}
					if (moveData.weather) {
						hitResult = this.battle.field.setWeather(moveData.weather, source, move);
						didSomething = this.combineResults(didSomething, hitResult);
					}
					if (moveData.terrain) {
						hitResult = this.battle.field.setTerrain(moveData.terrain, source, move);
						didSomething = this.combineResults(didSomething, hitResult);
					}
					if (moveData.pseudoWeather) {
						hitResult = this.battle.field.addPseudoWeather(moveData.pseudoWeather, source, move);
						didSomething = this.combineResults(didSomething, hitResult);
					}
					if (moveData.forceSwitch) {
						hitResult = !!this.battle.canSwitch(target.side);
						didSomething = this.combineResults(didSomething, hitResult);
					}
					// Hit events
					//   These are like the TryHit events, except we don't need a FieldHit event.
					//   Scroll up for the TryHit event documentation, and just ignore the "Try" part. ;)
					if (move.target === 'all' && !isSelf) {
						if (moveData.onHitField) {
							hitResult = this.battle.singleEvent('HitField', moveData, {}, target, source, move);
							didSomething = this.combineResults(didSomething, hitResult);
						}
					} else if ((move.target === 'foeSide' || move.target === 'allySide') && !isSelf) {
						if (moveData.onHitSide) {
							hitResult = this.battle.singleEvent('HitSide', moveData, {}, target.side, source, move);
							didSomething = this.combineResults(didSomething, hitResult);
						}
					} else {
						if (moveData.onHit) {
							hitResult = this.battle.singleEvent('Hit', moveData, {}, target, source, move);
							didSomething = this.combineResults(didSomething, hitResult);
						}
						if (!isSelf && !isSecondary) {
							this.battle.runEvent('Hit', target, source, move);
						}
					}
				}
				if (moveData.selfSwitch) {
					if (this.battle.canSwitch(source.side)) {
						didSomething = true;
					} else {
						didSomething = this.combineResults(didSomething, false);
					}
				}
				// Move didn't fail because it didn't try to do anything
				if (didSomething === undefined) didSomething = true;
				damage[i] = this.combineResults(damage[i], didSomething === null ? false : didSomething);
				didAnything = this.combineResults(didAnything, didSomething);
			}
	
	
			if (!didAnything && didAnything !== 0 && !moveData.self && !moveData.selfdestruct) {
				if (!isSelf && !isSecondary) {
					if (didAnything === false) {
						this.battle.add('-fail', source);
						this.battle.attrLastMove('[still]');
					}
				}
				this.battle.debug('move failed because it did nothing');
			} else if (move.selfSwitch && source.hp) {
				source.switchFlag = move.id;
			}
	
			//revert severity and finalAccuracy to default 100 value
			Scripts.severity = 100;
			Scripts.actions!.finalAccuracy = 100;
			return damage;
		},
		//modded to remove random factor
		getConfusionDamage(pokemon: Pokemon, basePower: number) {
			const tr = this.battle.trunc;
	
			const attack = pokemon.calculateStat('atk', pokemon.boosts['atk']);
			const defense = pokemon.calculateStat('def', pokemon.boosts['def']);
			const level = pokemon.level;
			const baseDamage = tr(tr(tr(tr(2 * level / 5 + 2) * basePower * attack) / defense) / 50) + 2;
	
			// Damage is 16-bit context in self-hit confusion damage
			let damage = tr(baseDamage, 16);
			damage *= 0.925;
			return Math.max(1, damage);
		},
		//modded to remove accuracy-based misses
		hitStepAccuracy(targets: Pokemon[], pokemon: Pokemon, move: ActiveMove) {
			const hitResults = [];
			for (const [i, target] of targets.entries()) {
				this.battle.activeTarget = target;
				// calculate true accuracy
				let accuracy = move.accuracy;
				if (move.ohko) { // bypasses accuracy modifiers
					if (!target.isSemiInvulnerable()) {
						if (target.volatiles['dynamax'] || pokemon.level < target.level || (move.ohko !== true && target.hasType(move.ohko))) {
							this.battle.add('-immune', target, '[ohko]');
							hitResults[i] = false;
							continue;
						}
					}
				} else {
					accuracy = this.battle.runEvent('ModifyAccuracy', target, pokemon, move, accuracy);
					if (accuracy !== true) {
						let boost = 0;
						if (!move.ignoreAccuracy) {
							const boosts = this.battle.runEvent('ModifyBoost', pokemon, null, null, {...pokemon.boosts});
							boost = this.battle.clampIntRange(boosts['accuracy'], -6, 6);
						}
						if (!move.ignoreEvasion) {
							const boosts = this.battle.runEvent('ModifyBoost', target, null, null, {...target.boosts});
							boost = this.battle.clampIntRange(boost - boosts['evasion'], -6, 6);
						}
						if (boost > 0) {
							accuracy = this.battle.trunc(accuracy * (3 + boost) / 3);
						} else if (boost < 0) {
							accuracy = this.battle.trunc(accuracy * 3 / (3 - boost));
						}
					}
				}
				if (move.alwaysHit || (move.id === 'toxic' && this.battle.gen >= 8 && pokemon.hasType('Poison')) ||
						(move.target === 'self' && move.category === 'Status' && !target.isSemiInvulnerable())) {
					accuracy = true; // bypasses ohko accuracy modifiers
				} else {
					accuracy = this.battle.runEvent('Accuracy', target, pokemon, move, accuracy);
				}
				/* if (accuracy !== true && !this.battle.randomChance(accuracy, 100)) {
					if (move.smartTarget) {
						move.smartTarget = false;
					} else {
						if (!move.spreadHit) this.battle.attrLastMove('[miss]');
						this.battle.add('-miss', pokemon, target);
					}
					if (!move.ohko && pokemon.hasItem('blunderpolicy') && pokemon.useItem()) {
						this.battle.boost({spe: 2}, pokemon);
					}
					hitResults[i] = false;
					continue;
				} */

				//to be applied to move's base power
				Scripts.actions!.finalAccuracy = accuracy;
				hitResults[i] = true;
			}
			return hitResults;
		},
		hitStepMoveHitLoop(targets: Pokemon[], pokemon: Pokemon, move: ActiveMove) { // Temporary name
			const damage: (number | boolean | undefined)[] = [];
			for (const i of targets.keys()) {
				damage[i] = 0;
			}
			move.totalDamage = 0;
			pokemon.lastDamage = 0;
			let targetHits = move.multihit || 1;
			if (Array.isArray(targetHits)) {
				if (targetHits[0] === 2 && targetHits[1] === 5) {
					targetHits = 3;
				} else {
					targetHits = (targetHits[0] + targetHits[1]) / 2;
				}
			}
			targetHits = Math.floor(targetHits);
			let nullDamage = true;
			let moveDamage: (number | boolean | undefined)[] = [];
			// There is no need to recursively check the ´sleepUsable´ flag as Sleep Talk can only be used while asleep.
			const isSleepUsable = move.sleepUsable || this.dex.moves.get(move.sourceEffect).sleepUsable;
	
			let targetsCopy: (Pokemon | false | null)[] = targets.slice(0);
			let hit: number;
			for (hit = 1; hit <= targetHits; hit++) {
				if (damage.includes(false)) break;
				if (hit > 1 && pokemon.status === 'slp' && (!isSleepUsable || this.battle.gen === 4)) break;
				if (targets.every(target => !target?.hp)) break;
				move.hit = hit;
				if (move.smartTarget && targets.length > 1) {
					targetsCopy = [targets[hit - 1]];
				} else {
					targetsCopy = targets.slice(0);
				}
				const target = targetsCopy[0]; // some relevant-to-single-target-moves-only things are hardcoded
				if (target && typeof move.smartTarget === 'boolean') {
					if (hit > 1) {
						this.battle.addMove('-anim', pokemon, move.name, target);
					} else {
						this.battle.retargetLastMove(target);
					}
				}
	
				// like this (Triple Kick)
				if (target && move.multiaccuracy && hit > 1) {
					let accuracy = move.accuracy;
					const boostTable = [1, 4 / 3, 5 / 3, 2, 7 / 3, 8 / 3, 3];
					if (accuracy !== true) {
						if (!move.ignoreAccuracy) {
							const boosts = this.battle.runEvent('ModifyBoost', pokemon, null, null, {...pokemon.boosts});
							const boost = this.battle.clampIntRange(boosts['accuracy'], -6, 6);
							if (boost > 0) {
								accuracy *= boostTable[boost];
							} else {
								accuracy /= boostTable[-boost];
							}
						}
						if (!move.ignoreEvasion) {
							const boosts = this.battle.runEvent('ModifyBoost', target, null, null, {...target.boosts});
							const boost = this.battle.clampIntRange(boosts['evasion'], -6, 6);
							if (boost > 0) {
								accuracy /= boostTable[boost];
							} else if (boost < 0) {
								accuracy *= boostTable[-boost];
							}
						}
					}
					accuracy = this.battle.runEvent('ModifyAccuracy', target, pokemon, move, accuracy);
					if (!move.alwaysHit) {
						accuracy = this.battle.runEvent('Accuracy', target, pokemon, move, accuracy);
					}
				}
	
				const moveData = move;
				if (!moveData.flags) moveData.flags = {};
	
				// Modifies targetsCopy (which is why it's a copy)
				[moveDamage, targetsCopy] = this.spreadMoveHit(targetsCopy, pokemon, move, moveData);
	
				if (!moveDamage.some(val => val !== false)) break;
				nullDamage = false;
	
				for (const [i, md] of moveDamage.entries()) {
					// Damage from each hit is individually counted for the
					// purposes of Counter, Metal Burst, and Mirror Coat.
					damage[i] = md === true || !md ? 0 : md;
					// Total damage dealt is accumulated for the purposes of recoil (Parental Bond).
					move.totalDamage += damage[i] as number;
				}
				if (move.mindBlownRecoil) {
					this.battle.damage(Math.round(pokemon.maxhp / 2), pokemon, pokemon, this.dex.conditions.get('Mind Blown'), true);
					move.mindBlownRecoil = false;
				}
				this.battle.eachEvent('Update');
				if (!pokemon.hp && targets.length === 1) {
					hit++; // report the correct number of hits for multihit moves
					break;
				}
			}
			// hit is 1 higher than the actual hit count
			if (hit === 1) return damage.fill(false);
			if (nullDamage) damage.fill(false);
			this.battle.faintMessages(false, false, !pokemon.hp);
			if (move.multihit && typeof move.smartTarget !== 'boolean') {
				this.battle.add('-hitcount', targets[0], hit - 1);
			}
	
			if (move.recoil && move.totalDamage) {
				this.battle.damage(this.calcRecoilDamage(move.totalDamage, move), pokemon, pokemon, 'recoil');
			}
	
			if (move.struggleRecoil) {
				let recoilDamage;
				if (this.dex.gen >= 5) {
					recoilDamage = this.battle.clampIntRange(Math.round(pokemon.baseMaxhp / 4), 1);
				} else {
					recoilDamage = this.battle.clampIntRange(this.battle.trunc(pokemon.maxhp / 4), 1);
				}
				this.battle.directDamage(recoilDamage, pokemon, pokemon, {id: 'strugglerecoil'} as Condition);
			}
	
			// smartTarget messes up targetsCopy, but smartTarget should in theory ensure that targets will never fail, anyway
			if (move.smartTarget) targetsCopy = targets.slice(0);
	
			for (const [i, target] of targetsCopy.entries()) {
				if (target && pokemon !== target) {
					target.gotAttacked(move, moveDamage[i] as number | false | undefined, pokemon);
				}
			}
	
			if (move.ohko && !targets[0].hp) this.battle.add('-ohko');
	
			if (!damage.some(val => !!val || val === 0)) return damage;
	
			this.battle.eachEvent('Update');
	
			this.afterMoveSecondaryEvent(targetsCopy.filter(val => !!val) as Pokemon[], pokemon, move);
	
			if (!move.negateSecondary && !(move.hasSheerForce && pokemon.hasAbility('sheerforce'))) {
				for (const [i, d] of damage.entries()) {
					// There are no multihit spread moves, so it's safe to use move.totalDamage for multihit moves
					// The previous check was for `move.multihit`, but that fails for Dragon Darts
					const curDamage = targets.length === 1 ? move.totalDamage : d;
					if (typeof curDamage === 'number' && targets[i].hp) {
						const targetHPBeforeDamage = (targets[i].hurtThisTurn || 0) + curDamage;
						if (targets[i].hp <= targets[i].maxhp / 2 && targetHPBeforeDamage > targets[i].maxhp / 2) {
							this.battle.runEvent('EmergencyExit', targets[i], pokemon);
						}
					}
				}
			}
	
			return damage;
		},
		//modded to remove chance-based secondary effects
		secondaries(targets: SpreadMoveTargets, source: Pokemon, move: ActiveMove, moveData: ActiveMove, isSelf?: boolean) {
			if (!moveData.secondaries) return;
			for (const target of targets) {
				if (target === false) continue;
				const secondaries: Dex.SecondaryEffect[] =
					this.battle.runEvent('ModifySecondaries', target, source, moveData, moveData.secondaries.slice());
				for (const secondary of secondaries) {
					this.moveHit(target, source, move, secondary, true, isSelf);
				}
			}
		},
		//modded to remove chance-based self drops
		selfDrops(
			targets: SpreadMoveTargets, source: Pokemon,
			move: ActiveMove, moveData: ActiveMove, isSecondary?: boolean
		) {
			for (const target of targets) {
				if (target === false) continue;
				if (moveData.self && !move.selfDropped) {
					if (!isSecondary && moveData.self.boosts) {
						this.moveHit(source, source, move, moveData.self, isSecondary, true);
						if (!move.multihit) move.selfDropped = true;
					} else {
						this.moveHit(source, source, move, moveData.self, isSecondary, true);
					}
				}
			}
		},
	},
	pokemon: {
		addVolatile(
			status: string | Condition, source: Pokemon | null = null, sourceEffect: Effect | null = null,
			linkedStatus: string | Condition | null = null
		): boolean | any {
			let result;
			status = this.battle.dex.conditions.get(status);
			if (!this.hp && !status.affectsFainted) return false;
			if (linkedStatus && source && !source.hp) return false;
			if (this.battle.event) {
				if (!source) source = this.battle.event.source;
				if (!sourceEffect) sourceEffect = this.battle.effect;
			}
			if (!source) source = this;
	
			if (this.volatiles[status.id]) {
				if (Scripts.severity! <= this.volatiles[status.id].severity) {
					return false;
				}
				if (status.onRestart) return this.battle.singleEvent('Restart', status, this.volatiles[status.id], this, source, sourceEffect);
			}
			if (!this.runStatusImmunity(status.id)) {
				this.battle.debug('immune to volatile status');
				if ((sourceEffect as Move)?.status) {
					this.battle.add('-immune', this);
				}
				return false;
			}
			result = this.battle.runEvent('TryAddVolatile', this, source, sourceEffect, status);
			if (!result) {
				this.battle.debug('add volatile [' + status.id + '] interrupted');
				return result;
			}

			this.volatiles[status.id] = {id: status.id};
			this.volatiles[status.id].target = this;
			if (source) {
				this.volatiles[status.id].source = source;
				this.volatiles[status.id].sourceSlot = source.getSlot();
			}
			if (sourceEffect) this.volatiles[status.id].sourceEffect = sourceEffect;
			if (status.duration) this.volatiles[status.id].duration = status.duration;
			if (status.durationCallback) {
				this.volatiles[status.id].duration = status.durationCallback.call(this.battle, this, source, sourceEffect);
			}
			this.volatiles[status.id].severity = Scripts.severity;
			result = this.battle.singleEvent('Start', status, this.volatiles[status.id], this, source, sourceEffect);

			if (!result) {
				// cancel
				delete this.volatiles[status.id];
				return result;
			}
			if (linkedStatus && source) {
				if (!source.volatiles[linkedStatus.toString()]) {
					source.addVolatile(linkedStatus, this, sourceEffect);
					source.volatiles[linkedStatus.toString()].linkedPokemon = [this];
					source.volatiles[linkedStatus.toString()].linkedStatus = status;
				} else {
					source.volatiles[linkedStatus.toString()].linkedPokemon.push(this);
				}
				this.volatiles[status.toString()].linkedPokemon = [source];
				this.volatiles[status.toString()].linkedStatus = linkedStatus;
			}
			return true;
		},
		//modded to calculate boost based on severity, rather than table
		calculateStat(statName: StatIDExceptHP, boost: number, modifier?: number) {
			statName = toID(statName) as StatIDExceptHP;
			// @ts-ignore - type checking prevents 'hp' from being passed, but we're paranoid
			if (statName === 'hp') throw new Error("Please read `maxhp` directly");
	
			// base stat
			let stat = this.storedStats[statName];
	
			// Wonder Room swaps defenses before calculating anything else
			if ('wonderroom' in this.battle.field.pseudoWeather) {
				if (statName === 'def') {
					stat = this.storedStats['spd'];
				} else if (statName === 'spd') {
					stat = this.storedStats['def'];
				}
			}
	
			// stat boosts
			let boosts: SparseBoostsTable = {};
			const boostName = statName as BoostID;
			boosts[boostName] = boost;
			boosts = this.battle.runEvent('ModifyBoost', this, null, null, boosts);
			boost = boosts[boostName]!;
			if (boost > 6) boost = 6;
			if (boost < -6) boost = -6;
			if (boost >= 0) {
				//positive boosts increase numerator of multiplier
				boost = (boost + 2) / 2;
			} else {
				//negative boosts increase denominator of multiplier
				boost = 2 / (Math.abs(boost) + 2);
			}
			stat = Math.floor(stat * boost);

			// stat modifier
			return this.battle.modify(stat, (modifier || 1));
		},
		//modded to get boost based on severity, rather than table
		getStat(statName: StatIDExceptHP, unboosted?: boolean, unmodified?: boolean) {
			statName = toID(statName) as StatIDExceptHP;
			// @ts-ignore - type checking prevents 'hp' from being passed, but we're paranoid
			if (statName === 'hp') throw new Error("Please read `maxhp` directly");
	
			// base stat
			let stat = this.storedStats[statName];
	
			// Download ignores Wonder Room's effect, but this results in
			// stat stages being calculated on the opposite defensive stat
			if (unmodified && 'wonderroom' in this.battle.field.pseudoWeather) {
				if (statName === 'def') {
					statName = 'spd';
				} else if (statName === 'spd') {
					statName = 'def';
				}
			}
	
			// stat boosts
			if (!unboosted) {
				const boosts = this.battle.runEvent('ModifyBoost', this, null, null, {...this.boosts});
				let boost = boosts[statName];
				if (boost > 6) boost = 6;
				if (boost < -6) boost = -6;
				if (boost >= 0) {
					//positive boosts increase numerator of multiplier
					boost = (boost + 2) / 2;
				} else {
					//negative boosts increase denominator of multiplier
					boost = 2 / (Math.abs(boost) + 2);
				}
				stat = Math.floor(stat * boost);
			}
	
			// stat modifier effects
			if (!unmodified) {
				const statTable: {[s in StatIDExceptHP]: string} = {atk: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', spe: 'Spe'};
				stat = this.battle.runEvent('Modify' + statTable[statName], this, null, null, stat);
			}
	
			if (statName === 'spe' && stat > 10000) stat = 10000;
			return stat;
		},
		//modded to always pass new status
		trySetStatus(status: string | Condition, source: Pokemon | null = null, sourceEffect: Effect | null = null) {
			return this.setStatus(status, source, sourceEffect);
		},
		//modded to set status severity and overwrite lower-severity status
		setStatus(
			status: string | Condition,
			source: Pokemon | null = null,
			sourceEffect: Effect | null = null,
			ignoreImmunities = false
		) {
			if (!this.hp) return false;
			status = this.battle.dex.conditions.get(status);
			if (this.battle.event) {
				if (!source) source = this.battle.event.source;
				if (!sourceEffect) sourceEffect = this.battle.effect;
			}
			if (!source) source = this;

			if (status.id !== '' && Scripts.severity! <= this.statusState.severity) {
				this.battle.add('-fail', this, this.status);
				return false;
			}
	
			// if (this.status === status.id) {
			// 	if ((sourceEffect as Move)?.status === this.status) {
			// 		this.battle.add('-fail', this, this.status);
			// 	} else if ((sourceEffect as Move)?.status) {
			// 		this.battle.add('-fail', source);
			// 		this.battle.attrLastMove('[still]');
			// 	}
			// 	return false;
			// }
	
			if (!ignoreImmunities && status.id &&
					!(source?.hasAbility('corrosion') && ['tox', 'psn'].includes(status.id))) {
				// the game currently never ignores immunities
				if (!this.runStatusImmunity(status.id === 'tox' ? 'psn' : status.id)) {
					this.battle.debug('immune to status');
					if ((sourceEffect as Move)?.status) {
						this.battle.add('-immune', this);
					}
					return false;
				}
			}
			const prevStatus = this.status;
			const prevStatusState = this.statusState;
			if (status.id) {
				const result: boolean = this.battle.runEvent('SetStatus', this, source, sourceEffect, status);
				if (!result) {
					this.battle.debug('set status [' + status.id + '] interrupted');
					return result;
				}
			}
	
			this.status = status.id;
			this.statusState = {id: status.id, target: this, stage: prevStatusState.stage};
			if (source) this.statusState.source = source;
			if (status.duration) this.statusState.duration = status.duration;
			if (status.durationCallback) {
				this.statusState.duration = status.durationCallback.call(this.battle, this, source, sourceEffect);
			}

			//status is being cured
			if (this.status === '') {
				this.statusState.severity = 0;
				this.statusState.severityModifier = 1;
				if (sourceEffect?.effectType === 'Move' ? !sourceEffect.flags.lesser : sourceEffect?.id !== 'shedskin') this.statusState.stage = 0;
			}
			else this.statusState.severity = Scripts.severity;
	
			if (status.id && !this.battle.singleEvent('Start', status, this.statusState, this, source, sourceEffect)) {
				this.battle.debug('status start [' + status.id + '] interrupted');
				// cancel the setstatus
				this.status = prevStatus;
				this.statusState = prevStatusState;
				return false;
			}
			if (status.id && !this.battle.runEvent('AfterSetStatus', this, source, sourceEffect, status)) {
				return false;
			}
			return true;
		},
		//modded to account for heal block with severity % 1 > 0
		heal(d: number, source: Pokemon | null = null, effect: Effect | null = null) {
			if (!this.hp) return false;
			d = this.battle.trunc(d);
			if (isNaN(d)) return false;
			if (d <= 0) return false;
			if (this.hp >= this.maxhp) return false;
			if (this.volatiles['healblock']) d *= 1 - (5 * this.volatiles['healblock'].severity / 100) % 1;
			this.hp += d;
			if (this.hp > this.maxhp) {
				d -= this.hp - this.maxhp;
				this.hp = this.maxhp;
			}
			return d;
		},
		getHealth() {
			if (!this.hp) return {side: this.side.id, secret: '0 fnt', shared: '0 fnt'};
			let secret = `${this.hp}/${this.maxhp}`;
			let shared;
			const ratio = this.hp / this.maxhp;
			if (this.battle.reportExactHP) {
				shared = secret;
			} else if (this.battle.reportPercentages || this.battle.gen >= 8) {
				// HP Percentage Mod mechanics
				let percentage = Math.ceil(ratio * 100);
				if ((percentage === 100) && (ratio < 1.0)) {
					percentage = 99;
				}
				shared = `${percentage}/100`;
			} else {
				// In-game accurate pixel health mechanics
				const pixels = Math.floor(ratio * 48) || 1;
				shared = `${pixels}/48`;
				if ((pixels === 9) && (ratio > 0.2)) {
					shared += 'y'; // force yellow HP bar
				} else if ((pixels === 24) && (ratio > 0.5)) {
					shared += 'g'; // force green HP bar
				}
			}
			if (this.status) {
				secret += ` ${this.status} ${this.statusState.severity}`;
				shared += ` ${this.status} ${this.statusState.severity}`;
			}
			return {side: this.side.id, secret, shared};
		},
		isGrounded(negateImmunity = false) {
			if ('gravity' in this.battle.field.pseudoWeather) return true;
			if ('ingrain' in this.volatiles && this.volatiles['ingrain'].severity >= 50 && this.battle.gen >= 4) return true;
			if ('smackdown' in this.volatiles) return true;
			const item = (this.ignoringItem() ? '' : this.item);
			if (item === 'ironball') return true;
			// If a Fire/Flying type uses Burn Up and Roost, it becomes ???/Flying-type, but it's still grounded.
			if (!negateImmunity && this.hasType('Flying') && !('roost' in this.volatiles)) return false;
			if (this.hasAbility('levitate') && !this.battle.suppressingAbility()) return null;
			if ('magnetrise' in this.volatiles) return false;
			if ('telekinesis' in this.volatiles && this.volatiles['telekinesis'].time > 0) return false;
			return item !== 'airballoon';
		}
	},
	//modded to have stat boosts based on severity
	boost(
		boost: SparseBoostsTable, target: Pokemon | null = null, source: Pokemon | null = null,
		effect: Effect | null = null, isSecondary = false, isSelf = false
	) {
		if (this.event) {
			if (!target) target = this.event.target;
			if (!source) source = this.event.source;
			if (!effect) effect = this.effect;
		}
		if (!target?.hp) {
			return 0;
		}
		if (!target.isActive) {
			return false;
		}
		if (this.gen > 5 && !target.side.foePokemonLeft()) {
			return false;
		}
		boost = this.runEvent('Boost', target, source, effect, {...boost});
		let success = null;
		let boosted = isSecondary;
		let boostName: BoostID;
		for (boostName in boost) {
			const currentBoost: SparseBoostsTable = {
				[boostName]: boost[boostName],
			};
			if (currentBoost[boostName] && typeof Scripts.severity === 'number') currentBoost[boostName]! *= Scripts.severity / 100;
			
			let boostBy = target.boostBy(currentBoost);
			let msg = '-boost';
			if (boost[boostName]! < 0) {
				msg = '-unboost';
				boostBy = -boostBy;
			}
			if (boostBy) {
				success = true;
				switch (effect?.id) {
				case 'bellydrum':
					this.add('-setboost', target, 'atk', target.boosts['atk'], '[from] move: Belly Drum');
					break;
				case 'bellydrum2':
					this.add(msg, target, boostName, boostBy, '[silent]');
					this.hint("In Gen 2, Belly Drum boosts by 2 when it fails.");
					break;
				case 'zpower':
					this.add(msg, target, boostName, boostBy, '[zeffect]');
					break;
				default:
					if (!effect) break;
					if (effect.effectType === 'Move') {
						this.add(msg, target, boostName, boostBy);
					} else if (effect.effectType === 'Item') {
						this.add(msg, target, boostName, boostBy, '[from] item: ' + effect.name);
					} else {
						if (effect.effectType === 'Ability' && !boosted) {
							this.add('-ability', target, effect.name, 'boost');
							boosted = true;
						}
						this.add(msg, target, boostName, boostBy);
					}
					break;
				}
				this.runEvent('AfterEachBoost', target, source, effect, currentBoost);
			} else if (effect && effect.effectType === 'Ability') {
				if (isSecondary) this.add(msg, target, boostName, boostBy);
			} else if (!isSecondary && !isSelf) {
				this.add(msg, target, boostName, boostBy);
			}
		}
		this.runEvent('AfterBoost', target, source, effect, boost);
		if (success) {
			if (Object.values(boost).some(x => x! > 0)) target.statsRaisedThisTurn = true;
			if (Object.values(boost).some(x => x! < 0)) target.statsLoweredThisTurn = true;
		}

		return success;
	},
	spreadDamage(
		damage: SpreadMoveDamage, targetArray: (false | Pokemon | null)[] | null = null,
		source: Pokemon | null = null, effect: 'drain' | 'recoil' | Effect | null = null, instafaint = false
	) {
		if (!targetArray) return [0];
		const retVals: (number | false | undefined)[] = [];
		if (typeof effect === 'string' || !effect) effect = this.dex.conditions.getByID((effect || '') as ID);
		for (const [i, curDamage] of damage.entries()) {
			const target = targetArray[i];
			let targetDamage = curDamage;
			if (!(targetDamage || targetDamage === 0)) {
				retVals[i] = targetDamage;
				continue;
			}
			if (!target || !target.hp) {
				retVals[i] = 0;
				continue;
			}
			if (!target.isActive) {
				retVals[i] = false;
				continue;
			}
			if (targetDamage !== 0) targetDamage = this.clampIntRange(targetDamage, 1);

			if (effect.id !== 'struggle-recoil') { // Struggle recoil is not affected by effects
				if (effect.effectType === 'Weather' && !target.runStatusImmunity(effect.id)) {
					this.debug('weather immunity');
					retVals[i] = 0;
					continue;
				}
				targetDamage = this.runEvent('Damage', target, source, effect, targetDamage, true);
				if (!(targetDamage || targetDamage === 0)) {
					this.debug('damage event failed');
					retVals[i] = curDamage === true ? undefined : targetDamage;
					continue;
				}
			}
			if (targetDamage !== 0) targetDamage = this.clampIntRange(targetDamage, 1);

			if (this.gen <= 1) {
				if (this.dex.currentMod === 'gen1stadium' ||
					!['recoil', 'drain'].includes(effect.id) && effect.effectType !== 'Status') {
					this.lastDamage = targetDamage;
				}
			}

			retVals[i] = targetDamage = target.damage(targetDamage, source, effect);
			if (targetDamage !== 0) target.hurtThisTurn = target.hp;
			if (source && effect.effectType === 'Move') source.lastDamage = targetDamage;

			const name = effect.fullname === 'tox' ? 'psn' : effect.fullname;
			switch (effect.id) {
			case 'partiallytrapped':
				this.add('-damage', target, target.getHealth.bind(target), '[from] ' + this.effectState.sourceEffect.fullname, '[partiallytrapped]');
				break;
			case 'powder':
				this.add('-damage', target, target.getHealth.bind(target), '[silent]');
				break;
			case 'confused':
				this.add('-damage', target, target.getHealth.bind(target), '[from] confusion');
				break;
			default:
				if (effect.effectType === 'Move' || !name) {
					this.add('-damage', target, target.getHealth.bind(target));
				} else if (source && (source !== target || effect.effectType === 'Ability')) {
					this.add('-damage', target, target.getHealth.bind(target), '[from] ' + name, '[of] ' + source);
				} else {
					this.add('-damage', target, target.getHealth.bind(target), '[from] ' + name);
				}
				break;
			}

			if (targetDamage && effect.effectType === 'Move') {
				if (this.gen <= 1 && effect.recoil && source) {
					if (this.dex.currentMod !== 'gen1stadium' || target.hp > 0) {
						const amount = this.clampIntRange(Math.floor(targetDamage * effect.recoil[0] / effect.recoil[1]), 1);
						this.damage(amount, source, target, 'recoil');
					}
				}
				if (this.gen <= 4 && effect.drain && source) {
					const amount = this.clampIntRange(Math.floor(targetDamage * effect.drain[0] / effect.drain[1]), 1);
					this.heal(amount, source, target, 'drain');
				}
				if (this.gen > 4 && effect.drain && source) {
					const amount = Math.round(targetDamage * effect.drain[0] / effect.drain[1]);
					this.heal(amount, source, target, 'drain');
				}
			}
		}

		if (instafaint) {
			for (const [i, target] of targetArray.entries()) {
				if (!retVals[i] || !target) continue;

				if (target.hp <= 0) {
					this.debug('instafaint: ' + this.faintQueue.map(entry => entry.target.name));
					this.faintMessages(true);
					if (this.gen <= 2) {
						target.faint();
						if (this.gen <= 1) this.queue.clear();
					}
				}
			}
		}

		return retVals;
	},
	directDamage(damage: number, target?: Pokemon, source: Pokemon | null = null, effect: Effect | null = null) {
		if (this.event) {
			if (!target) target = this.event.target;
			if (!source) source = this.event.source;
			if (!effect) effect = this.effect;
		}
		if (!target?.hp) return 0;
		if (!damage) return 0;
		damage = this.clampIntRange(damage, 1);

		if (typeof effect === 'string' || !effect) effect = this.dex.conditions.getByID((effect || '') as ID);

		// In Gen 1 BUT NOT STADIUM, Substitute also takes confusion and HJK recoil damage
		if (this.gen <= 1 && this.dex.currentMod !== 'gen1stadium' &&
			['confusion', 'jumpkick', 'highjumpkick'].includes(effect.id) && target.volatiles['substitute']) {
			const hint = "In Gen 1, if a Pokemon with a Substitute hurts itself due to confusion or Jump Kick/Hi Jump Kick recoil and the target";
			if (source?.volatiles['substitute']) {
				source.volatiles['substitute'].hp -= damage;
				if (source.volatiles['substitute'].hp <= 0) {
					source.removeVolatile('substitute');
					source.subFainted = true;
				} else {
					this.add('-activate', source, 'Substitute', '[damage]');
				}
				this.hint(hint + " has a Substitute, the target's Substitute takes the damage.");
				return damage;
			} else {
				this.hint(hint + " does not have a Substitute there is no damage dealt.");
				return 0;
			}
		}

		damage = target.damage(damage, source, effect);
		switch (effect.id) {
		case 'strugglerecoil':
			this.add('-damage', target, target.getHealth.bind(target), '[from] recoil');
			break;
		case 'confusion':
			this.add('-damage', target, target.getHealth.bind(target), '[from] confusion');
			break;
		default:
			this.add('-damage', target, target.getHealth.bind(target));
			break;
		}
		if (target.fainted) this.faint(target);
		return damage;
	},
	heal(damage: number, target?: Pokemon, source: Pokemon | null = null, effect: 'drain' | Effect | null = null) {
		if (this.event) {
			if (!target) target = this.event.target;
			if (!source) source = this.event.source;
			if (!effect) effect = this.effect;
		}
		if (effect === 'drain') effect = this.dex.conditions.getByID(effect as ID);
		if (damage && damage <= 1) damage = 1;
		damage = this.trunc(damage);
		// for things like Liquid Ooze, the Heal event still happens when nothing is healed.
		damage = this.runEvent('TryHeal', target, source, effect, damage);
		if (!damage) return damage;
		if (!target?.hp) return false;
		if (!target.isActive) return false;
		if (target.hp >= target.maxhp) return false;
		const finalDamage = target.heal(damage, source, effect);
		switch (effect?.id) {
		case 'leechseed':
		case 'rest':
			this.add('-heal', target, target.getHealth.bind(target), '[silent]');
			break;
		case 'drain':
			this.add('-heal', target, target.getHealth.bind(target), '[from] drain', '[of] ' + source);
			break;
		case 'wish':
			break;
		case 'zpower':
			this.add('-heal', target, target.getHealth.bind(target), '[zeffect]');
			break;
		default:
			if (!effect) break;
			if (effect.effectType === 'Move') {
				this.add('-heal', target, target.getHealth.bind(target));
			} else if (source && source !== target) {
				this.add('-heal', target, target.getHealth.bind(target), '[from] ' + effect.fullname, '[of] ' + source);
			} else {
				this.add('-heal', target, target.getHealth.bind(target), '[from] ' + effect.fullname);
			}
			break;
		}
		this.runEvent('Heal', target, source, effect, finalDamage);
		return finalDamage;
	},
	//modded to resolve speed ties based on alternating variable
	speedSort<T>(this: Battle, list: T[], comparator: (a: T, b: T) => number = this.comparePriority) {
		if (list.length < 2) return;
		let sorted = 0;
		// This is a Selection Sort - not the fastest sort in general, but
		// actually faster than QuickSort for small arrays like the ones
		// `speedSort` is used for.
		// More importantly, it makes it easiest to resolve speed ties
		// properly.
		while (sorted + 1 < list.length) {
			let nextIndexes = [sorted];
			// grab list of next indexes
			for (let i = sorted + 1; i < list.length; i++) {
				const delta = comparator(list[nextIndexes[0]], list[i]);
				if (delta < 0) continue;
				if (delta > 0) nextIndexes = [i];
				//speed tie
				if (delta === 0) {
					let p;
					if (list[nextIndexes[0]] instanceof Pokemon) p = (list[nextIndexes[0]] as any) as Pokemon;
					else p = ((list[nextIndexes[0]] as any) as Action).pokemon;

					if (p?.side === this.sides[Scripts.speedTieWinner!]) continue;
					else nextIndexes = [i];
				}
			}
			// put list of next indexes where they belong
			for (let i = 0; i < nextIndexes.length; i++) {
				const index = nextIndexes[i];
				if (index !== sorted + i) {
					// nextIndexes is guaranteed to be in order, so it will never have
					// been disturbed by an earlier swap
					
					[list[sorted + i], list[index]] = [list[index], list[sorted + i]];
				}
			}
			sorted += nextIndexes.length;
		}
	},
	//modded to account for speed ties when releasing leads
	start() {
		// Deserialized games should use restart()
		if (this.deserialized) return;
		// need all players to start
		if (!this.sides.every(side => !!side)) throw new Error(`Missing sides: ${this.sides}`);

		if (this.started) throw new Error(`Battle already started`);

		const format = this.format;
		this.started = true;
		if (this.gameType === 'multi') {
			this.sides[1].foe = this.sides[2]!;
			this.sides[0].foe = this.sides[3]!;
			this.sides[2]!.foe = this.sides[1];
			this.sides[3]!.foe = this.sides[0];
			this.sides[1].allySide = this.sides[3]!;
			this.sides[0].allySide = this.sides[2]!;
			this.sides[2]!.allySide = this.sides[0];
			this.sides[3]!.allySide = this.sides[1];
			// sync side conditions
			this.sides[2]!.sideConditions = this.sides[0].sideConditions;
			this.sides[3]!.sideConditions = this.sides[1].sideConditions;
		} else {
			this.sides[1].foe = this.sides[0];
			this.sides[0].foe = this.sides[1];
			if (this.sides.length > 2) { // ffa
				this.sides[2]!.foe = this.sides[3]!;
				this.sides[3]!.foe = this.sides[2]!;
			}
		}

		for (const side of this.sides) {
			this.add('teamsize', side.id, side.pokemon.length);
		}

		this.add('gen', this.gen);

		this.add('tier', format.name);
		if (this.rated) {
			if (this.rated === 'Rated battle') this.rated = true;
			this.add('rated', typeof this.rated === 'string' ? this.rated : '');
		}

		if (format.onBegin) format.onBegin.call(this);
		for (const rule of this.ruleTable.keys()) {
			if (rule.startsWith('+') || rule.startsWith('-') || rule.startsWith('!')) continue;
			const subFormat = this.dex.formats.get(rule);
			if (subFormat.exists) {
				if (subFormat.onBegin) subFormat.onBegin.call(this);
			}
		}

		if (this.sides.some(side => !side.pokemon[0])) {
			throw new Error('Battle not started: A player has an empty team.');
		}

		if (this.debugMode) {
			this.checkEVBalance();
		}

		if (format.onTeamPreview) format.onTeamPreview.call(this);
		for (const rule of this.ruleTable.keys()) {
			if ('+*-!'.includes(rule.charAt(0))) continue;
			const subFormat = this.dex.formats.get(rule);
			if (subFormat.onTeamPreview) subFormat.onTeamPreview.call(this);
		}

		//order Pokemon are released in is based on speed and subject to speed ties
		this.add('message', this.sides[Scripts.speedTieWinner!].name + ' will win speed ties when releasing lead Pokémon.');

		this.queue.addChoice({choice: 'start'});
		this.midTurn = true;
		if (!this.requestState) this.go();
	},
	//modded to alternate and announce speed tie winner each turn
	nextTurn() {
		this.turn++;
		this.lastSuccessfulMoveThisTurn = null;

		const trappedBySide: boolean[] = [];
		const stalenessBySide: ('internal' | 'external' | undefined)[] = [];
		for (const side of this.sides) {
			let sideTrapped = true;
			let sideStaleness: 'internal' | 'external' | undefined;
			for (const pokemon of side.active) {
				if (!pokemon) continue;
				pokemon.moveThisTurn = '';
				pokemon.newlySwitched = false;
				pokemon.moveLastTurnResult = pokemon.moveThisTurnResult;
				pokemon.moveThisTurnResult = undefined;
				if (this.turn !== 1) {
					pokemon.usedItemThisTurn = false;
					pokemon.statsRaisedThisTurn = false;
					pokemon.statsLoweredThisTurn = false;
					// It shouldn't be possible in a normal battle for a Pokemon to be damaged before turn 1's move selection
					// However, this could be potentially relevant in certain OMs
					pokemon.hurtThisTurn = null;
				}

				pokemon.maybeDisabled = false;
				for (const moveSlot of pokemon.moveSlots) {
					moveSlot.disabled = false;
					moveSlot.disabledSource = '';
				}
				this.runEvent('DisableMove', pokemon);
				if (!pokemon.ateBerry) pokemon.disableMove('belch');
				if (!pokemon.getItem().isBerry) pokemon.disableMove('stuffcheeks');

				// If it was an illusion, it's not any more
				if (pokemon.getLastAttackedBy() && this.gen >= 7) pokemon.knownType = true;

				for (let i = pokemon.attackedBy.length - 1; i >= 0; i--) {
					const attack = pokemon.attackedBy[i];
					if (attack.source.isActive) {
						attack.thisTurn = false;
					} else {
						pokemon.attackedBy.splice(pokemon.attackedBy.indexOf(attack), 1);
					}
				}

				if (this.gen >= 7) {
					// In Gen 7, the real type of every Pokemon is visible to all players via the bottom screen while making choices
					const seenPokemon = pokemon.illusion || pokemon;
					const realTypeString = seenPokemon.getTypes(true).join('/');
					if (realTypeString !== seenPokemon.apparentType) {
						this.add('-start', pokemon, 'typechange', realTypeString, '[silent]');
						seenPokemon.apparentType = realTypeString;
						if (pokemon.addedType) {
							// The typechange message removes the added type, so put it back
							this.add('-start', pokemon, 'typeadd', pokemon.addedType, '[silent]');
						}
					}
				}

				pokemon.trapped = pokemon.maybeTrapped = false;
				this.runEvent('TrapPokemon', pokemon);
				if (!pokemon.knownType || this.dex.getImmunity('trapped', pokemon)) {
					this.runEvent('MaybeTrapPokemon', pokemon);
				}
				// canceling switches would leak information
				// if a foe might have a trapping ability
				if (this.gen > 2) {
					for (const source of pokemon.foes()) {
						const species = (source.illusion || source).species;
						if (!species.abilities) continue;
						for (const abilitySlot in species.abilities) {
							const abilityName = species.abilities[abilitySlot as keyof Species['abilities']];
							if (abilityName === source.ability) {
								// pokemon event was already run above so we don't need
								// to run it again.
								continue;
							}
							const ruleTable = this.ruleTable;
							if ((ruleTable.has('+hackmons') || !ruleTable.has('obtainableabilities')) && !this.format.team) {
								// hackmons format
								continue;
							} else if (abilitySlot === 'H' && species.unreleasedHidden) {
								// unreleased hidden ability
								continue;
							}
							const ability = this.dex.abilities.get(abilityName);
							if (ruleTable.has('-ability:' + ability.id)) continue;
							if (pokemon.knownType && !this.dex.getImmunity('trapped', pokemon)) continue;
							this.singleEvent('FoeMaybeTrapPokemon', ability, {}, pokemon, source);
						}
					}
				}

				if (pokemon.fainted) continue;

				sideTrapped = sideTrapped && pokemon.trapped;
				const staleness = pokemon.volatileStaleness || pokemon.staleness;
				if (staleness) sideStaleness = sideStaleness === 'external' ? sideStaleness : staleness;
				pokemon.activeTurns++;
			}
			trappedBySide.push(sideTrapped);
			stalenessBySide.push(sideStaleness);
			side.faintedLastTurn = side.faintedThisTurn;
			side.faintedThisTurn = null;
		}

		if (this.maybeTriggerEndlessBattleClause(trappedBySide, stalenessBySide)) return;

		if (this.gameType === 'triples' && this.sides.every(side => side.pokemonLeft === 1)) {
			// If both sides have one Pokemon left in triples and they are not adjacent, they are both moved to the center.
			const actives = this.getAllActive();
			if (actives.length > 1 && !actives[0].isAdjacent(actives[1])) {
				this.swapPosition(actives[0], 1, '[silent]');
				this.swapPosition(actives[1], 1, '[silent]');
				this.add('-center');
			}
		}

		this.add('turn', this.turn);

		Scripts.speedTieWinner!++;
		if (Scripts.speedTieWinner! >= this.sides.length) Scripts.speedTieWinner = 0;
		this.add('message', this.sides[Scripts.speedTieWinner!].name + ' will win speed ties this turn.');

		if (this.gameType === 'multi') {
			for (const side of this.sides) {
				if (side.canDynamaxNow()) {
					if (this.turn === 1) {
						this.addSplit(side.id, ['-candynamax', side.id]);
					} else {
						this.add('-candynamax', side.id);
					}
				}
			}
		}

		this.makeRequest('move');
	},
	//modded to select next Pokemon on team
	getRandomSwitchable(side: Side) {
		if (!side.pokemonLeft) return null;
		let toSwitch: Pokemon | null = null;
		let i = 0;
		while (!toSwitch) {
			let possibleSwitch = side.pokemon[side.active.length + i];
			if (!possibleSwitch.fainted) toSwitch = possibleSwitch;
			i++;
		}
		return toSwitch;
	},
};

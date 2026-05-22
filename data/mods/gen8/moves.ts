export const Moves: {[k: string]: ModdedMoveData} = {
	"10000000voltthunderbolt": {
		inherit: true,
		isNonstandard: "Past",
	},
	aciddownpour: {
		inherit: true,
		isNonstandard: "Past",
	},
	alloutpummeling: {
		inherit: true,
		isNonstandard: "Past",
	},
	assist: {
		inherit: true,
		isNonstandard: "Past",
	},
	baddybad: {
		inherit: true,
		accuracy: 95,
		basePower: 80,
	},
	barrage: {
		inherit: true,
		isNonstandard: "Past",
	},
	barrier: {
		inherit: true,
		isNonstandard: "Past",
	},
	beakblast: {
		inherit: true,
		isNonstandard: "Past",
	},
	bestow: {
		inherit: true,
		isNonstandard: "Past",
	},
	bide: {
		inherit: true,
		isNonstandard: "Past",
	},
	blackholeeclipse: {
		inherit: true,
		isNonstandard: "Past",
	},
	bloomdoom: {
		inherit: true,
		isNonstandard: "Past",
	},
	boneclub: {
		inherit: true,
		isNonstandard: "Past",
	},
	bouncybubble: {
		inherit: true,
		basePower: 90,
		pp: 15,
	},
	breakneckblitz: {
		inherit: true,
		isNonstandard: "Past",
	},
	bubble: {
		inherit: true,
		isNonstandard: "Past",
	},
	buzzybuzz: {
		inherit: true,
		basePower: 60,
		pp: 20,
	},
	camouflage: {
		inherit: true,
		isNonstandard: "Past",
	},
	captivate: {
		inherit: true,
		isNonstandard: "Past",
	},
	catastropika: {
		inherit: true,
		isNonstandard: "Past",
	},
	chatter: {
		inherit: true,
		isNonstandard: "Past",
	},
	chipaway: {
		inherit: true,
		isNonstandard: "Past",
	},
	clamp: {
		inherit: true,
		isNonstandard: "Past",
	},
	clangoroussoulblaze: {
		inherit: true,
		isNonstandard: "Past",
	},
	cometpunch: {
		inherit: true,
		isNonstandard: "Past",
	},
	constrict: {
		inherit: true,
		isNonstandard: "Past",
	},
	continentalcrush: {
		inherit: true,
		isNonstandard: "Past",
	},
	corkscrewcrash: {
		inherit: true,
		isNonstandard: "Past",
	},
	curse: {
		inherit: true,
		target: "randomNormal",
	},
	darkvoid: {
		inherit: true,
		isNonstandard: "Past",
	},
	defog: {
		inherit: true,
		onHit(target, source, move) {
			let success = false;
			if (!target.volatiles['substitute'] || move.infiltrates) success = !!this.boost({evasion: -1});
			const removeTarget = [
				'reflect', 'lightscreen', 'auroraveil', 'safeguard', 'mist', 'spikes', 'toxicspikes', 'stealthrock', 'stickyweb', 'gmaxsteelsurge',
			];
			const removeAll = [
				'spikes', 'toxicspikes', 'stealthrock', 'stickyweb', 'gmaxsteelsurge',
			];
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
			this.field.clearTerrain();
			return success;
		},
	},
	devastatingdrake: {
		inherit: true,
		isNonstandard: "Past",
	},
	dizzypunch: {
		inherit: true,
		isNonstandard: "Past",
	},
	doubleironbash: {
		inherit: true,
		isNonstandard: null,
	},
	doubleslap: {
		inherit: true,
		isNonstandard: "Past",
	},
	dragonrage: {
		inherit: true,
		isNonstandard: "Past",
	},
	eggbomb: {
		inherit: true,
		isNonstandard: "Past",
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
			onBasePowerPriority: 6,
			onBasePower(basePower, attacker, defender, move) {
				if (move.type === 'Electric' && attacker.isGrounded() && !attacker.isSemiInvulnerable()) {
					this.debug('electric terrain boost');
					return this.chainModify([5325, 4096]);
				}
			},
			onFieldStart(field, source, effect) {
				if (effect?.effectType === 'Ability') {
					this.add('-fieldstart', 'move: Electric Terrain', '[from] ability: ' + effect, '[of] ' + source);
				} else {
					this.add('-fieldstart', 'move: Electric Terrain');
				}
			},
			onFieldResidualOrder: 27,
			onFieldResidualSubOrder: 7,
			onFieldEnd() {
				this.add('-fieldend', 'move: Electric Terrain');
			},
		},
	},
	embargo: {
		inherit: true,
		isNonstandard: "Past",
	},
	extremeevoboost: {
		inherit: true,
		isNonstandard: "Past",
	},
	feintattack: {
		inherit: true,
		isNonstandard: "Past",
	},
	flameburst: {
		inherit: true,
		isNonstandard: "Past",
	},
	flash: {
		inherit: true,
		isNonstandard: "Past",
	},
	foresight: {
		inherit: true,
		isNonstandard: "Past",
	},
	freezyfrost: {
		inherit: true,
		accuracy: 90,
		basePower: 100,
		pp: 10,
	},
	frustration: {
		inherit: true,
		isNonstandard: "Past",
	},
	genesissupernova: {
		inherit: true,
		isNonstandard: "Past",
	},
	gigavolthavoc: {
		inherit: true,
		isNonstandard: "Past",
	},
	glitzyglow: {
		inherit: true,
		accuracy: 95,
		basePower: 80,
	},
	grassknot: {
		inherit: true,
		onTryHit(target, source, move) {
			if (target.volatiles['dynamax']) {
				this.add('-fail', source, 'move: Grass Knot', '[from] Dynamax');
				this.attrLastMove('[still]');
				return null;
			}
		},
	},
	grasswhistle: {
		inherit: true,
		isNonstandard: "Past",
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
			onBasePowerPriority: 6,
			onBasePower(basePower, attacker, defender, move) {
				const weakenedMoves = ['earthquake', 'bulldoze', 'magnitude'];
				if (weakenedMoves.includes(move.id) && defender.isGrounded() && !defender.isSemiInvulnerable()) {
					this.debug('move weakened by grassy terrain');
					return this.chainModify(0.5);
				}
				if (move.type === 'Grass' && attacker.isGrounded()) {
					this.debug('grassy terrain boost');
					return this.chainModify([5325, 4096]);
				}
			},
			onFieldStart(field, source, effect) {
				if (effect?.effectType === 'Ability') {
					this.add('-fieldstart', 'move: Grassy Terrain', '[from] ability: ' + effect, '[of] ' + source);
				} else {
					this.add('-fieldstart', 'move: Grassy Terrain');
				}
			},
			onResidualOrder: 5,
			onResidualSubOrder: 2,
			onResidual(pokemon) {
				if (pokemon.isGrounded() && !pokemon.isSemiInvulnerable()) {
					this.heal(pokemon.baseMaxhp / 16, pokemon, pokemon);
				} else {
					this.debug(`Pokemon semi-invuln or not grounded; Grassy Terrain skipped`);
				}
			},
			onFieldResidualOrder: 27,
			onFieldResidualSubOrder: 7,
			onFieldEnd() {
				this.add('-fieldend', 'move: Grassy Terrain');
			},
		},
	},
	guardianofalola: {
		inherit: true,
		isNonstandard: "Past",
	},
	healbell: {
		inherit: true,
		onHit(pokemon, source) {
			this.add('-activate', source, 'move: Heal Bell');
			const side = pokemon.side;
			let success = false;
			for (const ally of side.pokemon) {
				if (ally !== source && ally.hasAbility('soundproof')) continue;
				if (ally.cureStatus()) success = true;
			}
			return success;
		},
	},
	healblock: {
		inherit: true,
		isNonstandard: "Past",
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
					this.add('-heal', target, target.getHealth, '[from] move: Healing Wish');
					target.side.removeSlotCondition(target, 'healingwish');
				}
			},
		},
	},
	healorder: {
		inherit: true,
		isNonstandard: "Past",
	},
	heartstamp: {
		inherit: true,
		isNonstandard: "Past",
	},
	heartswap: {
		inherit: true,
		isNonstandard: "Past",
	},
	heatcrash: {
		inherit: true,
		onTryHit(target, pokemon, move) {
			if (target.volatiles['dynamax']) {
				this.add('-fail', pokemon, 'Dynamax');
				this.attrLastMove('[still]');
				return null;
			}
		},
	},
	heavyslam: {
		inherit: true,
		onTryHit(target, pokemon, move) {
			if (target.volatiles['dynamax']) {
				this.add('-fail', pokemon, 'Dynamax');
				this.attrLastMove('[still]');
				return null;
			}
		},
	},
	hiddenpower: {
		inherit: true,
		isNonstandard: "Past",
	},
	hiddenpowerbug: {
		inherit: true,
		isNonstandard: "Past",
	},
	hiddenpowerdark: {
		inherit: true,
		isNonstandard: "Past",
	},
	hiddenpowerdragon: {
		inherit: true,
		isNonstandard: "Past",
	},
	hiddenpowerelectric: {
		inherit: true,
		isNonstandard: "Past",
	},
	hiddenpowerfighting: {
		inherit: true,
		isNonstandard: "Past",
	},
	hiddenpowerfire: {
		inherit: true,
		isNonstandard: "Past",
	},
	hiddenpowerflying: {
		inherit: true,
		isNonstandard: "Past",
	},
	hiddenpowerghost: {
		inherit: true,
		isNonstandard: "Past",
	},
	hiddenpowergrass: {
		inherit: true,
		isNonstandard: "Past",
	},
	hiddenpowerground: {
		inherit: true,
		isNonstandard: "Past",
	},
	hiddenpowerice: {
		inherit: true,
		isNonstandard: "Past",
	},
	hiddenpowerpoison: {
		inherit: true,
		isNonstandard: "Past",
	},
	hiddenpowerpsychic: {
		inherit: true,
		isNonstandard: "Past",
	},
	hiddenpowerrock: {
		inherit: true,
		isNonstandard: "Past",
	},
	hiddenpowersteel: {
		inherit: true,
		isNonstandard: "Past",
	},
	hiddenpowerwater: {
		inherit: true,
		isNonstandard: "Past",
	},
	howl: {
		inherit: true,
		flags: {snatch: 1, sound: 1},
		boosts: {
			atk: 1,
		},
		target: "allies",
	},
	hydrovortex: {
		inherit: true,
		isNonstandard: "Past",
	},
	hyperfang: {
		inherit: true,
		isNonstandard: "Past",
	},
	hyperspacefury: {
		inherit: true,
		isNonstandard: "Past",
	},
	hyperspacehole: {
		inherit: true,
		isNonstandard: "Past",
	},
	iceball: {
		inherit: true,
		isNonstandard: "Past",
	},
	icehammer: {
		inherit: true,
		isNonstandard: "Past",
	},
	infernooverdrive: {
		inherit: true,
		isNonstandard: "Past",
	},
	iondeluge: {
		inherit: true,
		isNonstandard: "Past",
	},
	judgment: {
		inherit: true,
		isNonstandard: "Past",
	},
	jumpkick: {
		inherit: true,
		isNonstandard: "Past",
	},
	karatechop: {
		inherit: true,
		isNonstandard: "Past",
	},
	kingsshield: {
		inherit: true,
		condition: {
			duration: 1,
			onStart(target) {
				this.add('-singleturn', target, 'Protect');
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
				if (lockedmove) {
					// Outrage counter is reset
					if (source.volatiles['lockedmove'].duration === 2) {
						delete source.volatiles['lockedmove'];
					}
				}
				if (this.checkMoveMakesContact(move, source, target)) {
					this.boost({atk: -1}, source, target, this.dex.getActiveMove("King's Shield"));
				}
				return this.NOT_FAIL;
			},
			onHit(target, source, move) {
				if (move.isZOrMaxPowered && this.checkMoveMakesContact(move, source, target)) {
					this.boost({atk: -1}, source, target, this.dex.getActiveMove("King's Shield"));
				}
			},
		},
	},
	letssnuggleforever: {
		inherit: true,
		isNonstandard: "Past",
	},
	lightofruin: {
		inherit: true,
		isNonstandard: "Past",
	},
	lightthatburnsthesky: {
		inherit: true,
		isNonstandard: "Past",
	},
	lowkick: {
		inherit: true,
		onTryHit(target, pokemon, move) {
			if (target.volatiles['dynamax']) {
				this.add('-fail', pokemon, 'Dynamax');
				this.attrLastMove('[still]');
				return null;
			}
		},
	},
	luckychant: {
		inherit: true,
		isNonstandard: "Past",
	},
	lunardance: {
		inherit: true,
		condition: {
			onSwap(target) {
				if (
					!target.fainted && (
						target.hp < target.maxhp ||
						target.status ||
						target.moveSlots.some(moveSlot => moveSlot.pp < moveSlot.maxpp)
					)
				) {
					target.heal(target.maxhp);
					target.setStatus('');
					for (const moveSlot of target.moveSlots) {
						moveSlot.pp = moveSlot.maxpp;
					}
					this.add('-heal', target, target.getHealth, '[from] move: Lunar Dance');
					target.side.removeSlotCondition(target, 'lunardance');
				}
			},
		},
	},
	magnetbomb: {
		inherit: true,
		isNonstandard: "Past",
	},
	magnitude: {
		inherit: true,
		isNonstandard: "Past",
	},
	maliciousmoonsault: {
		inherit: true,
		isNonstandard: "Past",
	},
	meditate: {
		inherit: true,
		isNonstandard: "Past",
	},
	mefirst: {
		inherit: true,
		isNonstandard: "Past",
	},
	menacingmoonrazemaelstrom: {
		inherit: true,
		isNonstandard: "Past",
	},
	metronome: {
		inherit: true,
		noMetronome: [
			"After You", "Apple Acid", "Assist", "Astral Barrage", "Aura Wheel", "Baneful Bunker", "Beak Blast", "Behemoth Bash", "Behemoth Blade", "Belch", "Bestow", "Body Press", "Branch Poke", "Breaking Swipe", "Celebrate", "Chatter", "Clangorous Soul", "Copycat", "Counter", "Covet", "Crafty Shield", "Decorate", "Destiny Bond", "Detect", "Diamond Storm", "Double Iron Bash", "Dragon Ascent", "Dragon Energy", "Drum Beating", "Dynamax Cannon", "Endure", "Eternabeam", "False Surrender", "Feint", "Fiery Wrath", "Fleur Cannon", "Focus Punch", "Follow Me", "Freeze Shock", "Freezing Glare", "Glacial Lance", "Grav Apple", "Helping Hand", "Hold Hands", "Hyperspace Fury", "Hyperspace Hole", "Ice Burn", "Instruct", "Jungle Healing", "King's Shield", "Life Dew", "Light of Ruin", "Mat Block", "Me First", "Meteor Assault", "Metronome", "Mimic", "Mind Blown", "Mirror Coat", "Mirror Move", "Moongeist Beam", "Nature Power", "Nature's Madness", "Obstruct", "Origin Pulse", "Overdrive", "Photon Geyser", "Plasma Fists", "Precipice Blades", "Protect", "Pyro Ball", "Quash", "Quick Guard", "Rage Powder", "Relic Song", "Secret Sword", "Shell Trap", "Sketch", "Sleep Talk", "Snap Trap", "Snarl", "Snatch", "Snore", "Spectral Thief", "Spiky Shield", "Spirit Break", "Spotlight", "Steam Eruption", "Steel Beam", "Strange Steam", "Struggle", "Sunsteel Strike", "Surging Strikes", "Switcheroo", "Techno Blast", "Thief", "Thousand Arrows", "Thousand Waves", "Thunder Cage", "Thunderous Kick", "Transform", "Trick", "V-create", "Wicked Blow", "Wide Guard",
		],
	},
	miracleeye: {
		inherit: true,
		isNonstandard: "Past",
	},
	mirrormove: {
		inherit: true,
		isNonstandard: "Past",
	},
	mirrorshot: {
		inherit: true,
		isNonstandard: "Past",
	},
	mudbomb: {
		inherit: true,
		isNonstandard: "Past",
	},
	mudsport: {
		inherit: true,
		isNonstandard: "Past",
	},
	multiattack: {
		inherit: true,
		basePower: 120,
	},
	naturalgift: {
		inherit: true,
		isNonstandard: "Past",
	},
	needlearm: {
		inherit: true,
		isNonstandard: "Past",
	},
	neverendingnightmare: {
		inherit: true,
		isNonstandard: "Past",
	},
	nightmare: {
		inherit: true,
		isNonstandard: "Past",
	},
	oceanicoperetta: {
		inherit: true,
		isNonstandard: "Past",
	},
	odorsleuth: {
		inherit: true,
		isNonstandard: "Past",
	},
	ominouswind: {
		inherit: true,
		isNonstandard: "Past",
	},
	powder: {
		inherit: true,
		isNonstandard: "Past",
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
				if (effect && (effect.priority <= 0.1 || effect.target === 'self')) {
					return;
				}
				if (target.isSemiInvulnerable() || target.isAlly(source)) return;
				if (!target.isGrounded()) {
					const baseMove = this.dex.moves.get(effect.id);
					if (baseMove.priority > 0) {
						this.hint("Psychic Terrain doesn't affect Pokémon immune to Ground.");
					}
					return;
				}
				this.add('-activate', target, 'move: Psychic Terrain');
				return null;
			},
			onBasePowerPriority: 6,
			onBasePower(basePower, attacker, defender, move) {
				if (move.type === 'Psychic' && attacker.isGrounded() && !attacker.isSemiInvulnerable()) {
					this.debug('psychic terrain boost');
					return this.chainModify([5325, 4096]);
				}
			},
			onFieldStart(field, source, effect) {
				if (effect?.effectType === 'Ability') {
					this.add('-fieldstart', 'move: Psychic Terrain', '[from] ability: ' + effect, '[of] ' + source);
				} else {
					this.add('-fieldstart', 'move: Psychic Terrain');
				}
			},
			onFieldResidualOrder: 27,
			onFieldResidualSubOrder: 7,
			onFieldEnd() {
				this.add('-fieldend', 'move: Psychic Terrain');
			},
		},
	},
	psychoboost: {
		inherit: true,
		isNonstandard: "Past",
	},
	psywave: {
		inherit: true,
		isNonstandard: "Past",
	},
	pulverizingpancake: {
		inherit: true,
		isNonstandard: "Past",
	},
	punishment: {
		inherit: true,
		isNonstandard: "Past",
	},
	pursuit: {
		inherit: true,
		isNonstandard: "Past",
	},
	quash: {
		inherit: true,
		onHit(target) {
			if (this.activePerHalf === 1) return false; // fails in singles
			const action = this.queue.willMove(target);
			if (!action) return false;

			action.order = 201;
			this.add('-activate', target, 'move: Quash');
		},
	},
	rage: {
		inherit: true,
		isNonstandard: "Past",
	},
	rapidspin: {
		inherit: true,
		basePower: 50,
		secondary: {
			chance: 100,
			self: {
				boosts: {
					spe: 1,
				},
			},
		},
	},
	razorwind: {
		inherit: true,
		isNonstandard: "Past",
	},
	refresh: {
		inherit: true,
		isNonstandard: "Past",
	},
	relicsong: {
		inherit: true,
		isNonstandard: "Past",
	},
	return: {
		inherit: true,
		isNonstandard: "Past",
	},
	revelationdance: {
		inherit: true,
		isNonstandard: "Past",
	},
	rockclimb: {
		inherit: true,
		isNonstandard: "Past",
	},
	rollingkick: {
		inherit: true,
		isNonstandard: "Past",
	},
	rototiller: {
		inherit: true,
		isNonstandard: "Past",
	},
	sappyseed: {
		inherit: true,
		accuracy: 90,
		basePower: 100,
		pp: 10,
	},
	savagespinout: {
		inherit: true,
		isNonstandard: "Past",
	},
	searingsunrazesmash: {
		inherit: true,
		isNonstandard: "Past",
	},
	secretpower: {
		inherit: true,
		isNonstandard: "Past",
	},
	seedflare: {
		inherit: true,
		isNonstandard: "Past",
	},
	sharpen: {
		inherit: true,
		isNonstandard: "Past",
	},
	shatteredpsyche: {
		inherit: true,
		isNonstandard: "Past",
	},
	signalbeam: {
		inherit: true,
		isNonstandard: "Past",
	},
	silverwind: {
		inherit: true,
		isNonstandard: "Past",
	},
	sinisterarrowraid: {
		inherit: true,
		isNonstandard: "Past",
	},
	sizzlyslide: {
		inherit: true,
		basePower: 60,
		pp: 20,
	},
	sketch: {
		inherit: true,
		isNonstandard: "Past",
	},
	skydrop: {
		inherit: true,
		isNonstandard: "Past",
	},
	skyuppercut: {
		inherit: true,
		isNonstandard: "Past",
	},
	smellingsalts: {
		inherit: true,
		isNonstandard: "Past",
	},
	snatch: {
		inherit: true,
		isNonstandard: "Past",
	},
	sonicboom: {
		inherit: true,
		isNonstandard: "Past",
	},
	soulstealing7starstrike: {
		inherit: true,
		isNonstandard: "Past",
	},
	sparklyswirl: {
		inherit: true,
		accuracy: 120,
		basePower: 85,
		pp: 5,
	},
	spiderweb: {
		inherit: true,
		isNonstandard: "Past",
	},
	spikecannon: {
		inherit: true,
		isNonstandard: "Past",
	},
	splinteredstormshards: {
		inherit: true,
		isNonstandard: "Past",
	},
	spotlight: {
		inherit: true,
		isNonstandard: "Past",
	},
	steamroller: {
		inherit: true,
		isNonstandard: "Past",
	},
	stokedsparksurfer: {
		inherit: true,
		isNonstandard: "Past",
	},
	subzeroslammer: {
		inherit: true,
		isNonstandard: "Past",
	},
	supersonicskystrike: {
		inherit: true,
		isNonstandard: "Past",
	},
	synchronoise: {
		inherit: true,
		isNonstandard: "Past",
	},
	tailglow: {
		inherit: true,
		isNonstandard: "Past",
	},
	tectonicrage: {
		inherit: true,
		isNonstandard: "Past",
	},
	telekinesis: {
		inherit: true,
		isNonstandard: "Past",
	},
	teleport: {
		inherit: true,
		priority: -6,
		selfSwitch: true,
		onTryHit: true,
	},
	toxic: {
		inherit: true,
		onPrepareHit() {},
	},
	toxicthread: {
		inherit: true,
		isNonstandard: "Past",
	},
	trumpcard: {
		inherit: true,
		isNonstandard: "Past",
	},
	twineedle: {
		inherit: true,
		isNonstandard: "Past",
	},
	twinkletackle: {
		inherit: true,
		isNonstandard: "Past",
	},
	wakeupslap: {
		inherit: true,
		isNonstandard: "Past",
	},
	watersport: {
		inherit: true,
		isNonstandard: "Past",
	},
	wringout: {
		inherit: true,
		isNonstandard: "Past",
	},
	zippyzap: {
		inherit: true,
		basePower: 80,
		pp: 10,
		willCrit: false,
		critRatio: 1,
		secondary: {
			chance: 100,
			self: {
				boosts: {
					evasion: 1,
				},
			},
		},
	},
};

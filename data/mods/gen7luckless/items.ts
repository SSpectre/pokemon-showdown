export const Items: {[k: string]: ModdedItemData} = {
	aspearberry: {
		inherit: true,
		onUpdate(pokemon) {
			if ((pokemon.status === 'frz' || pokemon.status === 'tri' || pokemon.status === 'all') && pokemon.statusState.severity >= 50) {
				pokemon.eatItem();
			}
		},
		onEat(pokemon) {
			if (pokemon.status === 'frz' || pokemon.status === 'tri' || pokemon.status === 'all') {
				pokemon.cureStatus();
			}
		},
	},
	cheriberry: {
		inherit: true,
		onUpdate(pokemon) {
			if ((pokemon.status === 'par' || pokemon.status === 'aff' || pokemon.status === 'tri' || pokemon.status === 'all') && pokemon.statusState.severity >= 50) {
				pokemon.eatItem();
			}
		},
		onEat(pokemon) {
			if (pokemon.status === 'par' || pokemon.status === 'aff' || pokemon.status === 'tri' || pokemon.status === 'all') {
				pokemon.cureStatus();
			}
		},
	},
	chestoberry: {
		inherit: true,
		onUpdate(pokemon) {
			if ((pokemon.status === 'slp' || pokemon.status === 'aff' || pokemon.status === 'all') && pokemon.statusState.severity >= 50) {
				pokemon.eatItem();
			}
		},
		onEat(pokemon) {
			if (pokemon.status === 'slp' || pokemon.status === 'aff' || pokemon.status === 'all') {
				pokemon.cureStatus();
			}
		},
	},
	focusband: {
		inherit: true,
		onSourceModifyDamage(damage, source, target, move) {
			return this.chainModify(0.9);
		},
		onDamage(damage, target, source, effect) {},
	},
	ironball: {
		inherit: true,
		onEffectiveness(typeMod, target, type, move) {
			if (!target) return;
			if (target.volatiles['ingrain'] && target.volatiles['ingrain'].severity >= 50 || target.volatiles['smackdown'] || this.field.getPseudoWeather('gravity')) return;
			if (move.type === 'Ground' && target.hasType('Flying')) return 0;
		},
	},
	pechaberry: {
		inherit: true,
		onUpdate(pokemon) {
			if ((pokemon.status === 'psn' || pokemon.status === 'tox' || pokemon.status === 'aff' || pokemon.status === 'all') && pokemon.statusState.severity >= 50) {
				pokemon.eatItem();
			}
		},
		onEat(pokemon) {
			if (pokemon.status === 'psn' || pokemon.status === 'tox' || pokemon.status === 'aff' || pokemon.status === 'all') {
				pokemon.cureStatus();
			}
		},
	},
	quickclaw: {
		inherit: true,
		onFractionalPriority(priority, pokemon) {
			if (priority <= 0 && !pokemon.itemState.used) {
				this.add('-activate', pokemon, 'item: Quick Claw');
				pokemon.itemState.used = true;
				return 0.1;
			}
		},
	},
	rawstberry: {
		inherit: true,
		onUpdate(pokemon) {
			if ((pokemon.status === 'brn' || pokemon.status === 'tri' || pokemon.status === 'all') && pokemon.statusState.severity >= 50) {
				pokemon.eatItem();
			}
		},
		onEat(pokemon) {
			if (pokemon.status === 'brn' || pokemon.status === 'tri' || pokemon.status === 'all') {
				pokemon.cureStatus();
			}
		},
	},
	starfberry: {
		inherit: true,
		onEat(pokemon) {
			const stats: BoostID[] = [];
			let stat: BoostID;
			for (stat in pokemon.boosts) {
				if (stat !== 'accuracy' && stat !== 'evasion' && pokemon.boosts[stat] < 6) {
					stats.push(stat);
				}
			}
			if (stats.length) {
				for (const i of stats) {
					const boost: SparseBoostsTable = {};
					boost[i] = 0.4;
					this.boost(boost);
				}
			}
		},
	},
};

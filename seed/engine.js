/*!
 * ClaimValuator calculator engine.
 *
 * One file for every calculator on the site. Each tool type has a pure compute function
 * (values, context) -> result, and one renderer draws every result the same way.
 * Numbers never leave the browser.
 */
(function (root, factory) {
	'use strict';
	var api = factory();
	if (typeof module === 'object' && module.exports) {
		module.exports = api;
	} else {
		root.CVEngine = api;
		if (typeof document !== 'undefined') {
			if (document.readyState === 'loading') {
				document.addEventListener('DOMContentLoaded', api.boot);
			} else {
				api.boot();
			}
		}
	}
})(typeof self !== 'undefined' ? self : this, function () {
	'use strict';

	/* ------------------------------------------------------------------
	 * Helpers
	 * ---------------------------------------------------------------- */

	var SEV = {
		minor: [1.5, 2],
		moderate: [2, 3],
		severe: [3, 4],
		catastrophic: [4, 5]
	};
	var FAULT_LABEL = {
		pure: 'pure comparative fault rule',
		bar51: '51% bar',
		bar50: '50% bar',
		contributory: 'contributory negligence rule',
		slight_gross: 'slight/gross negligence rule'
	};
	var MOTOR = ['car', 'truck', 'motorcycle', 'rideshare', 'pedestrian', 'bicycle'];
	var NO_FAULT_VARIANTS = ['car', 'truck', 'rideshare', 'pedestrian', 'bicycle'];

	function num(v) {
		if (typeof v === 'number') {
			return isFinite(v) ? v : 0;
		}
		var neg = /^\s*-/.test(String(v || ''));
		var n = parseFloat(String(v || '').replace(/[^0-9.]/g, ''));
		if (!isFinite(n)) {
			return 0;
		}
		return neg ? -n : n;
	}
	function clamp(n, lo, hi) {
		return Math.min(hi, Math.max(lo, n));
	}
	function round(n, step) {
		step = step || 1;
		return Math.round(n / step) * step;
	}
	function money(n) {
		var neg = n < 0;
		var s = '$' + Math.round(Math.abs(n)).toLocaleString('en-US');
		return neg ? '−' + s : s;
	}
	function minus(n) {
		return '−' + money(Math.abs(n));
	}
	function moneyRange(a, b) {
		if (Math.round(a) === Math.round(b)) {
			return money(a);
		}
		return money(a) + ' – ' + money(b);
	}
	function pctText(n) {
		var r = Math.round(n * 10) / 10;
		return (r % 1 === 0 ? r.toFixed(0) : r.toFixed(1)) + '%';
	}
	function kLabel(n) {
		if (n >= 1000000) {
			return '$' + (Math.round(n / 100000) / 10) + 'M';
		}
		return '$' + Math.round(n / 1000) + 'k';
	}
	function parseDate(s) {
		var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
		if (!m) {
			return null;
		}
		return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
	}
	function iso(d) {
		return d.toISOString().slice(0, 10);
	}
	function addYears(d, n) {
		var y = d.getUTCFullYear() + n;
		var m = d.getUTCMonth();
		var day = d.getUTCDate();
		var last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
		return new Date(Date.UTC(y, m, Math.min(day, last)));
	}
	var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	function fmtDate(d) {
		return MONTHS[d.getUTCMonth()] + ' ' + d.getUTCDate() + ', ' + d.getUTCFullYear();
	}
	function today() {
		var n = new Date();
		return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()));
	}
	function daysBetween(a, b) {
		return Math.round((b - a) / 86400000);
	}
	function stateName(st) {
		return st ? (st.short || st.name) : '';
	}
	function poss(st) {
		return stateName(st) + '’s';
	}
	function row(label, value, strong) {
		return { label: label, value: value, strong: !!strong };
	}
	function chip(text, tone) {
		return { text: text, tone: tone || 'info' };
	}

	/* ------------------------------------------------------------------
	 * State rules
	 * ---------------------------------------------------------------- */

	/** The fault rule that applies, given the state, event date and accident type. */
	function faultRule(st, date, variant) {
		if (!st) {
			return { rule: 'pure', scope: 'all', generic: true, note: '' };
		}
		var rule = st.fault;
		var note = '';
		if (st.faultPrior && date && iso(date) < st.faultPrior.until) {
			rule = st.faultPrior.rule;
			note = 'Applies the rule in force before ' + fmtDate(parseDate(st.faultPrior.until)) + '.';
		}
		if (st.slug === 'district-of-columbia' && (variant === 'pedestrian' || variant === 'bicycle')) {
			rule = 'bar51';
			note = 'DC lets pedestrians and cyclists recover unless they were more at fault than the driver.';
		}
		return { rule: rule, scope: st.barScope || 'all', generic: false, note: note };
	}

	/** Is recovery barred at this fault level? */
	function isBarred(rule, f) {
		switch (rule) {
			case 'bar51':
				return f > 50;
			case 'bar50':
				return f >= 50;
			case 'contributory':
				return f > 0;
			case 'slight_gross':
				return f >= 50;
			default:
				return f >= 100;
		}
	}

	/**
	 * Apply a fault rule to economic and non-economic damages.
	 * Returns what is recovered and whether the claim is barred.
	 */
	function applyFault(fr, f, econ, non) {
		var share = clamp(f, 0, 100) / 100;
		if (fr.scope === 'noneconomic' && f > 50) {
			// Michigan: lose non-economic damages above 50%, keep reduced economic damages.
			return { econ: econ * (1 - share), non: 0, barred: false, partial: true };
		}
		if (isBarred(fr.rule, f)) {
			return { econ: 0, non: 0, barred: true, partial: false };
		}
		return { econ: econ * (1 - share), non: non * (1 - share), barred: false, partial: false };
	}

	/** Where the bar sits on the fault slider, for the marker under it. */
	function barMark(rule) {
		switch (rule) {
			case 'bar51':
				return { at: 51, label: '51% bar' };
			case 'bar50':
				return { at: 50, label: '50% bar' };
			case 'contributory':
				return { at: 1, label: 'Any fault' };
			case 'slight_gross':
				return { at: 50, label: 'Slight only' };
			default:
				return null;
		}
	}

	/** Cap non-economic damages where the state applies one. */
	function capNon(st, non, econ, sev) {
		if (!st || !st.cap || !st.cap.amount) {
			return { value: non, applied: false, limit: 0 };
		}
		var c = st.cap;
		var limit;
		if (c.formula === 'oh') {
			if (sev === 'catastrophic') {
				return { value: non, applied: false, limit: 0 };
			}
			limit = Math.min(Math.max(250000, 3 * econ), c.amount);
		} else if (c.formula === 'ak') {
			limit = sev === 'catastrophic' && c.cat ? c.cat : c.amount;
		} else {
			limit = sev === 'catastrophic' && c.cat ? c.cat : c.amount;
		}
		return { value: Math.min(non, limit), applied: non > limit, limit: limit };
	}

	/** Filing deadline in years for a claim type, honoring rule changes by date. */
	function deadlineYears(st, date, ctype) {
		if (!st) {
			return 0;
		}
		if (ctype === 'death') {
			return st.solWd || st.sol;
		}
		var years = ctype === 'mv' && st.solMv ? st.solMv : st.sol;
		if (st.solPrior && date && iso(date) < st.solPrior.until) {
			years = st.solPrior.years;
		}
		return years;
	}

	function deadlineChip(st, date, ctype) {
		if (!st || !date) {
			return null;
		}
		var years = deadlineYears(st, date, ctype);
		var d = addYears(date, years);
		var left = daysBetween(today(), d);
		if (left < 0) {
			return chip('Usual filing deadline passed on ' + fmtDate(d), 'bad');
		}
		return chip('File suit by ' + fmtDate(d), 'warn');
	}

	/** Insurance limit from a select value. null = unknown. */
	function limitValue(v, st) {
		if (v === 'unknown' || v === '' || v === undefined) {
			return null;
		}
		if (v === 'min') {
			return st ? st.ins[0] : null;
		}
		return num(v);
	}

	function faultChip(st, fr, f, res) {
		if (fr.generic) {
			return chip('Pick your state to apply its fault rule', 'info');
		}
		if (res.barred) {
			if (fr.rule === 'contributory') {
				return chip(stateName(st) + ' uses contributory negligence: any fault can bar recovery', 'bad');
			}
			return chip('At ' + f + '% fault, ' + stateName(st) + ' bars recovery', 'bad');
		}
		if (res.partial) {
			return chip('Above 50% fault: no pain and suffering in ' + stateName(st), 'warn');
		}
		if (f === 0) {
			return chip('No fault on your side', 'good');
		}
		if (fr.rule === 'slight_gross') {
			return chip('A jury may bar the claim unless your fault is “slight”', 'warn');
		}
		return chip('Under ' + poss(st) + ' ' + FAULT_LABEL[fr.rule] + ': cut by ' + f + '%', 'good');
	}

	function feeShare(v) {
		return v === '0' ? 0 : (v === '40' ? 0.4 : 1 / 3);
	}
	function feeLabel(v) {
		return v === '0' ? 'No attorney fee' : (v === '40' ? 'Attorney fee (40%)' : 'Attorney fee (33⅓%)');
	}
	function caseCosts(base, fee) {
		return fee > 0 ? Math.max(1000, round(base * 0.02, 100)) : 0;
	}

	/* ------------------------------------------------------------------
	 * Calculators
	 * ---------------------------------------------------------------- */

	var T = {};

	/** Accident and injury claims: car, truck, motorcycle, pedestrian, bicycle, rideshare, premises, dog, general. */
	T.injury = function (v, ctx) {
		var st = ctx.state;
		var variant = ctx.variant;
		var date = parseDate(v.date);
		var fr = faultRule(st, date, variant);
		var f = clamp(Math.round(num(v.fault)), 0, 100);
		var sev = SEV[v.sev] ? v.sev : 'moderate';
		var m = SEV[sev];
		var pm = num(v.pastMed), fm = num(v.futMed), w = num(v.wages), fw = num(v.futWages), veh = num(v.vehicle);
		var econ = pm + fm + w + fw;
		var nf = !!(st && st.nf && NO_FAULT_VARIANTS.indexOf(variant) !== -1);
		var thresholdMet = !nf || v.threshold !== 'no';
		var pip = nf ? Math.min(pm + w, st.nf.pip) : 0;

		var nonLo = thresholdMet ? econ * m[0] : 0;
		var nonHi = thresholdMet ? econ * m[1] : 0;
		var capLo = capNon(st, nonLo, econ, sev);
		var capHi = capNon(st, nonHi, econ, sev);
		nonLo = capLo.value;
		nonHi = capHi.value;
		var econClaim = Math.max(0, econ - pip);
		var lo = applyFault(fr, f, econClaim, nonLo);
		var hi = applyFault(fr, f, econClaim, nonHi);
		var valLo = lo.econ + lo.non;
		var valHi = hi.econ + hi.non;
		var mid = (valLo + valHi) / 2;
		var barred = lo.barred;

		var cov = limitValue(v.bi, st);
		var uim = num(v.uim);
		if (cov !== null && uim && MOTOR.indexOf(variant) !== -1) {
			cov += uim;
		}

		var chips = [faultChip(st, fr, f, lo)];
		if (nf) {
			chips.push(chip(stateName(st) + ' is a no-fault state: your PIP pays first', 'info'));
			if (v.threshold === 'unsure') {
				chips.push(chip('Pain and suffering needs ' + (st.nf.th === 'monetary' ? money(st.nf.amount) + ' in medical bills or a serious injury' : 'a serious injury'), 'warn'));
			}
		}
		if (st && st.nf && variant === 'motorcycle') {
			chips.push(chip('Motorcycles are often outside no-fault rules: check your policy', 'info'));
		}
		if (capHi.applied) {
			chips.push(chip(stateName(st) + ' caps non-economic damages at ' + money(capHi.limit), 'warn'));
		}
		if (cov === null) {
			chips.push(chip('Policy limit unknown: it often caps the payout', 'info'));
		} else if (!barred && valHi > cov) {
			chips.push(chip('High end exceeds the ' + money(cov) + ' of insurance', 'warn'));
		} else if (!barred) {
			chips.push(chip('Within available insurance (' + money(cov) + ')', 'good'));
		}
		if (variant === 'dog' && st) {
			chips.push(chip(st.dog === 'strict' ? stateName(st) + ': strict liability for dog bites' : (st.dog === 'limited' ? stateName(st) + ': strict liability only in some cases' : stateName(st) + ': you must show the owner knew or was careless'), st.dog === 'strict' ? 'good' : 'info'));
		}
		if (variant === 'premises') {
			chips.push(chip('You must show the owner knew or should have known about the hazard', 'info'));
		}
		var dl = deadlineChip(st, date, MOTOR.indexOf(variant) !== -1 ? 'mv' : 'injury');
		if (dl) {
			chips.push(dl);
		}

		var rows = [
			row('Medical bills, past and future', money(pm + fm)),
			row('Lost income, past and future', money(w + fw)),
			row('Economic damages', money(econ), true),
			row(thresholdMet ? 'Pain and suffering (' + m[0] + '× – ' + m[1] + '×)' : 'Pain and suffering (threshold not met)', moneyRange(nonLo, nonHi))
		];
		if (capHi.applied) {
			rows.push(row(poss(st) + ' cap on non-economic damages', 'Limited to ' + money(capHi.limit)));
		}
		if (pip) {
			rows.push(row('Paid by your own PIP (no-fault)', minus(pip)));
		}
		rows.push(row('Before fault', moneyRange(econClaim + nonLo, econClaim + nonHi)));
		if (barred) {
			rows.push(row('Barred at ' + f + '% fault', '−100%'));
		} else if (f > 0) {
			rows.push(row('Your fault (' + f + '%)', minus(econClaim + nonLo - valLo) + (valHi !== valLo ? ' – ' + minus(econClaim + nonHi - valHi) : '')));
		}
		rows.push(row(variant === 'dog' ? 'Bite claim value' : 'Injury claim value', moneyRange(valLo, valHi), true));

		var notes = [];
		if (veh && !barred) {
			var vehNet = veh * (1 - f / 100);
			var pd = st ? st.ins[2] : 0;
			notes.push('Your vehicle claim is separate: <strong>' + money(vehNet) + '</strong> after fault, paid from the other driver’s property damage coverage' + (st ? ' (' + money(pd) + ' minimum in ' + stateName(st) + ')' : '') + '.');
		} else if (veh && barred) {
			notes.push('The same fault rule bars the vehicle claim too.');
		}
		if (variant === 'truck') {
			notes.push('Interstate trucks hauling general freight must carry at least $750,000 of liability coverage under federal rules, and many carry $1 million or more.');
		}
		if (variant === 'rideshare') {
			notes.push('Uber and Lyft carry $1 million of liability coverage from the moment a driver accepts a trip until the rider gets out. With the app on but no trip accepted, lower contingent limits apply.');
		}
		if (fr.note) {
			notes.push(fr.note);
		}

		var fee = feeShare(v.fee);
		var base = cov === null ? mid : Math.min(mid, cov);
		var feeAmt = base * fee;
		var costs = caseCosts(base, fee);
		var owed = Math.max(0, pm - pip);
		var take = Math.max(0, base - feeAmt - costs - owed);

		return {
			label: variant === 'dog' ? 'Estimated dog bite claim value' : 'Estimated injury claim value',
			headline: barred ? '$0' : moneyRange(valLo, valHi),
			tone: barred ? 'bad' : '',
			sub: barred
				? stateName(st) + ' bars recovery at this fault level. Lower your fault share to see a range.'
				: 'Midpoint ' + money(mid) + (f > 0 ? ' after a ' + f + '% fault reduction' : ''),
			bar: !barred && econ > 0 ? { low: valLo, high: valHi, mid: mid, cov: cov, covLabel: 'Insurance available' } : null,
			chips: chips,
			rows: rows,
			notes: notes,
			net: barred ? null : {
				title: 'Estimated take-home at the midpoint',
				value: money(take),
				rows: [
					row(cov !== null && mid > cov ? 'Midpoint, capped at available insurance' : 'Midpoint value', money(base)),
					row(feeLabel(v.fee), minus(feeAmt)),
					row('Case costs (estimate)', minus(costs)),
					row('Medical bills still owed, before any reduction', minus(owed))
				]
			}
		};
	};

	/** Wrongful death. */
	T.death = function (v, ctx) {
		var st = ctx.state;
		var date = parseDate(v.date);
		var fr = faultRule(st, date, 'death');
		var f = clamp(Math.round(num(v.fault)), 0, 100);
		var age = clamp(num(v.age), 0, 110);
		var retire = clamp(num(v.retire), 0, 110);
		var income = num(v.income);
		var personal = clamp(num(v.personal), 0, 100) / 100;
		var r = 0.03;
		var workYears = Math.max(0, Math.round(retire - age));
		var serviceYears = Math.max(0, Math.round(75 - age));
		var pv = function (n) {
			return n > 0 ? (1 - Math.pow(1 + r, -n)) / r : 0;
		};
		var support = income * (1 - personal) * pv(workYears);
		var services = num(v.services) * pv(serviceYears);
		var medical = num(v.medical), funeral = num(v.funeral);
		var econ = support + services + medical + funeral;
		var REL = {
			distant: { m: [0.25, 0.5], floor: [50000, 150000] },
			spouse: { m: [0.5, 1], floor: [150000, 400000] },
			children: { m: [1, 1.5], floor: [250000, 750000] }
		};
		var rel = REL[v.relation] || REL.children;
		var nonLo = Math.max(rel.floor[0], econ * rel.m[0]);
		var nonHi = Math.max(rel.floor[1], econ * rel.m[1]);
		var lo = applyFault(fr, f, econ, nonLo);
		var hi = applyFault(fr, f, econ, nonHi);
		var valLo = lo.econ + lo.non, valHi = hi.econ + hi.non, mid = (valLo + valHi) / 2;
		var cov = limitValue(v.bi, st);
		var chips = [faultChip(st, fr, f, lo)];
		if (cov === null) {
			chips.push(chip('Policy limit unknown: it often caps the payout', 'info'));
		} else if (!lo.barred && valHi > cov) {
			chips.push(chip('High end exceeds the ' + money(cov) + ' of insurance', 'warn'));
		}
		var dl = deadlineChip(st, date, 'death');
		if (dl) {
			chips.push(dl);
		}
		var fee = feeShare(v.fee);
		var base = cov === null ? mid : Math.min(mid, cov);
		var feeAmt = base * fee, costs = caseCosts(base, fee);
		return {
			label: 'Estimated wrongful death claim value',
			headline: lo.barred ? '$0' : moneyRange(valLo, valHi),
			tone: lo.barred ? 'bad' : '',
			sub: lo.barred ? stateName(st) + ' bars recovery at this fault level.' : 'Midpoint ' + money(mid),
			bar: lo.barred ? null : { low: valLo, high: valHi, mid: mid, cov: cov, covLabel: 'Insurance available' },
			chips: chips,
			rows: [
				row('Lost financial support (' + workYears + ' working years, valued today)', money(support)),
				row('Household services (to age 75, valued today)', money(services)),
				row('Final medical, funeral and burial', money(medical + funeral)),
				row('Economic damages', money(econ), true),
				row('Loss of companionship and guidance', moneyRange(nonLo, nonHi)),
				f > 0 ? row(lo.barred ? 'Barred at ' + f + '% fault' : 'Fault reduction (' + f + '%)', lo.barred ? '−100%' : minus(econ + nonLo - valLo)) : null,
				row('Claim value', moneyRange(valLo, valHi), true)
			].filter(Boolean),
			notes: [
				'Future income and services are discounted at 3% a year to today’s value, the way economists present them in court.',
				'Who may sue and which damages are allowed differ by state. Some states cap non-economic damages in death cases.'
			],
			net: lo.barred ? null : {
				title: 'Estimated net to the family at the midpoint',
				value: money(Math.max(0, base - feeAmt - costs)),
				rows: [
					row(cov !== null && mid > cov ? 'Midpoint, capped at available insurance' : 'Midpoint value', money(base)),
					row(feeLabel(v.fee), minus(feeAmt)),
					row('Case costs (estimate)', minus(costs))
				]
			}
		};
	};

	/** Pain and suffering: multiplier and per diem side by side. */
	T.pain = function (v, ctx) {
		var st = ctx.state;
		var fr = faultRule(st, null, 'pi');
		var f = clamp(Math.round(num(v.fault)), 0, 100);
		var sev = SEV[v.sev] ? v.sev : 'moderate';
		var m = SEV[sev];
		var econ = num(v.meds) + num(v.wages);
		var multLo = econ * m[0], multHi = econ * m[1];
		var perDiem = num(v.rate) * num(v.days);
		var lowAll = Math.min(multLo, perDiem), highAll = Math.max(multHi, perDiem);
		var capLo = capNon(st, lowAll, econ, sev), capHi = capNon(st, highAll, econ, sev);
		var lo = applyFault(fr, f, 0, capLo.value), hi = applyFault(fr, f, 0, capHi.value);
		var chips = [faultChip(st, fr, f, lo)];
		if (capHi.applied) {
			chips.push(chip(stateName(st) + ' caps non-economic damages at ' + money(capHi.limit), 'warn'));
		}
		chips.push(chip(perDiem >= multLo && perDiem <= multHi ? 'Both methods agree' : (perDiem > multHi ? 'Per diem runs higher here' : 'Multiplier runs higher here'), 'info'));
		var rows = [
			row('Medical bills and lost income', money(econ)),
			row('Multiplier method (' + m[0] + '× – ' + m[1] + '×)', moneyRange(multLo, multHi), true),
			row('Per-diem method (' + money(num(v.rate)) + ' × ' + Math.round(num(v.days)) + ' days)', money(perDiem), true)
		];
		if (capHi.applied) {
			rows.push(row(poss(st) + ' cap', 'Limited to ' + money(capHi.limit)));
		}
		if (f > 0) {
			rows.push(row(lo.barred ? 'Barred at ' + f + '% fault' : 'Your fault (' + f + '%)', lo.barred ? '−100%' : minus(capLo.value - lo.non)));
		}
		rows.push(row('Pain and suffering estimate', moneyRange(lo.non, hi.non), true));
		return {
			label: 'Estimated pain and suffering',
			headline: lo.barred ? '$0' : moneyRange(lo.non, hi.non),
			tone: lo.barred ? 'bad' : '',
			sub: 'Multiplier ' + moneyRange(multLo, multHi) + ' · Per diem ' + money(perDiem),
			bar: lo.barred || !highAll ? null : { low: lo.non, high: hi.non, mid: (lo.non + hi.non) / 2, cov: null },
			chips: chips,
			rows: rows,
			notes: ['Adjusters use the multiplier more often. The per-diem method works best when recovery has a clear end date.']
		};
	};

	/** Attorney fee and net payout. */
	T.fee = function (v) {
		var amount = num(v.amount), costs = num(v.costs), liens = num(v.liens);
		var share = v.feePct === '25' ? 0.25 : (v.feePct === '40' ? 0.4 : 1 / 3);
		var basis = v.basis === 'net' ? Math.max(0, amount - costs) : amount;
		var fee = basis * share;
		var lienPay = liens * (1 - clamp(num(v.reduction), 0, 100) / 100);
		var other = num(v.other);
		var take = amount - fee - costs - lienPay - other;
		var keep = amount ? take / amount * 100 : 0;
		return {
			label: 'Your estimated take-home',
			headline: money(Math.max(0, take)),
			tone: take < 0 ? 'bad' : '',
			sub: amount ? 'You keep about ' + pctText(Math.max(0, keep)) + ' of the settlement' : 'Enter the settlement amount',
			chips: [
				chip('Fee: ' + money(fee), 'info'),
				take < amount * 0.34 && amount > 0 ? chip('Ask the lawyer and lien holders to reduce their share', 'warn') : chip('Typical split for an injury case', 'good')
			],
			rows: [
				row('Settlement', money(amount), true),
				row('Attorney fee (' + (share === 1 / 3 ? '33⅓' : share * 100) + '% of ' + (v.basis === 'net' ? 'net' : 'gross') + ')', minus(fee)),
				row('Case costs', minus(costs)),
				row('Medical bills and liens' + (num(v.reduction) ? ' (after ' + pctText(num(v.reduction)) + ' reduction)' : ''), minus(lienPay)),
				other ? row('Other deductions', minus(other)) : null,
				row('You take home', money(take), true)
			].filter(Boolean),
			notes: ['Fees figured on the net (after costs) leave you more. Ask which one your agreement uses.']
		};
	};

	/** Medical lien payoff. */
	T.lien = function (v) {
		var amount = num(v.amount), feePct = clamp(num(v.feePct), 0, 100) / 100, costs = num(v.costs), lien = num(v.lien);
		var fee = amount * feePct;
		var ratio = amount ? clamp((fee + costs) / amount, 0, 1) : 0;
		var nego = clamp(num(v.nego), 0, 100) / 100;
		var t = v.ltype;
		var reduced, how;
		if (t === 'medicare') {
			reduced = lien * (1 - ratio);
			how = 'Medicare reduces its claim by its share of your fee and costs (procurement costs) under 42 C.F.R. § 411.37.';
		} else if (t === 'erisa') {
			reduced = lien * (1 - nego);
			how = 'Self-funded employer plans follow the plan’s terms, so a pro-rata fee reduction is not guaranteed. The reduction shown is what you negotiate.';
		} else {
			reduced = lien * (1 - ratio) * (1 - nego);
			how = t === 'medicaid'
				? 'Medicaid can recover only from the part of a settlement that pays medical costs, and most states reduce for procurement costs.'
				: 'Many states apply the common fund rule, so the lien holder shares in your fee and costs. Hospital lien laws can also cap the amount.';
		}
		reduced = Math.min(lien, Math.max(0, reduced));
		var net = amount - fee - costs - reduced;
		return {
			label: 'Estimated lien payoff',
			headline: money(reduced),
			sub: lien ? 'Down from ' + money(lien) + ', a ' + pctText((1 - reduced / lien) * 100) + ' reduction' : 'Enter the lien amount',
			chips: [chip('Procurement share: ' + pctText(ratio * 100), 'info'), chip('Your net: ' + money(net), net > 0 ? 'good' : 'bad')],
			rows: [
				row('Settlement', money(amount)),
				row('Attorney fee', minus(fee)),
				row('Case costs', minus(costs)),
				row('Lien claimed', money(lien)),
				row('Lien after reductions', minus(reduced), true),
				row('Your net after fee, costs and lien', money(net), true)
			],
			notes: [how]
		};
	};

	/** Settlement tax. */
	T.tax = function (v) {
		var physical = num(v.physical), emotional = num(v.emotional), emoMed = Math.min(num(v.emoMed), emotional);
		var wages = num(v.wages), punitive = num(v.punitive), interest = num(v.interest);
		var nontax = physical + emoMed;
		var taxable = (emotional - emoMed) + wages + punitive + interest;
		var fed = taxable * clamp(num(v.rate), 0, 60) / 100;
		var stx = taxable * clamp(num(v.stateRate), 0, 20) / 100;
		return {
			label: 'Taxable part of the settlement',
			headline: money(taxable),
			sub: 'Estimated tax: ' + money(fed) + ' federal + ' + money(stx) + ' state',
			chips: [chip(money(nontax) + ' tax-free', 'good'), taxable ? chip(money(taxable) + ' taxable', 'warn') : chip('Nothing taxable', 'good')],
			rows: [
				row('Physical injury or illness (tax-free)', money(physical)),
				emotional ? row('Emotional distress medical costs (tax-free)', money(emoMed)) : null,
				emotional ? row('Other emotional distress (taxable)', money(emotional - emoMed)) : null,
				wages ? row('Back pay or lost wages in a job claim (taxable)', money(wages)) : null,
				punitive ? row('Punitive damages (taxable)', money(punitive)) : null,
				interest ? row('Interest (taxable)', money(interest)) : null,
				row('Taxable total', money(taxable), true),
				row('Estimated federal tax', money(fed)),
				row('Estimated state tax', money(stx)),
				row('After-tax settlement', money(nontax + taxable - fed - stx), true)
			].filter(Boolean),
			notes: ['Damages for a physical injury or physical sickness are excluded from income under 26 U.S.C. § 104(a)(2), including the pain and suffering that comes with it. Ask a tax professional before you sign: how the settlement is worded matters.']
		};
	};

	/** Structured settlement present value. */
	T.structured = function (v) {
		var pay = num(v.payment), years = clamp(Math.round(num(v.years)), 0, 60);
		var perYear = v.freq === 'annual' ? 1 : 12;
		var g = num(v.growth) / 100, d = num(v.disc) / 100;
		var i = Math.pow(1 + d, 1 / perYear) - 1;
		var pv = 0, total = 0;
		for (var k = 0; k < years * perYear; k++) {
			var p = pay * Math.pow(1 + g, Math.floor(k / perYear));
			total += p;
			pv += i ? p / Math.pow(1 + i, k + 1) : p;
		}
		var lump = num(v.lump);
		var chips = [chip('Total paid: ' + money(total), 'info')];
		if (lump) {
			chips.push(chip(lump >= pv ? 'The lump sum is worth more today' : 'The payments are worth more today', lump >= pv ? 'good' : 'warn'));
		}
		return {
			label: 'Present value of the payments',
			headline: money(pv),
			sub: years + ' years of ' + (perYear === 12 ? 'monthly' : 'yearly') + ' payments at a ' + pctText(d * 100) + ' discount rate',
			chips: chips,
			rows: [
				row('Payment', money(pay) + (perYear === 12 ? ' a month' : ' a year')),
				row('Number of payments', String(years * perYear)),
				g ? row('Yearly increase', pctText(g * 100)) : null,
				row('Total paid over time', money(total)),
				row('Value today', money(pv), true),
				lump ? row('Lump sum offered', money(lump), true) : null
			].filter(Boolean),
			notes: ['The discount rate is what you could earn on a lump sum. Buyers of structured payments use higher rates, which is why their cash offers run low.']
		};
	};

	/** Lost wages. */
	T.wages = function (v) {
		var weekly;
		if (v.wtype === 'salary') {
			weekly = num(v.salary) / 52;
		} else if (v.wtype === 'self') {
			weekly = num(v.profit) / 52;
		} else {
			weekly = num(v.rate) * num(v.hours);
		}
		var missed = num(v.missed);
		var unit = v.unit || 'weeks';
		var lost = unit === 'days' ? weekly / 5 * missed : (unit === 'months' ? weekly * 52 / 12 * missed : weekly * missed);
		var other = num(v.other);
		var future = num(v.futLoss) * num(v.futYears);
		var total = lost + other + future;
		return {
			label: 'Lost wages to claim',
			headline: money(total),
			sub: money(weekly) + ' a week · ' + missed + ' ' + (unit === 'days' ? 'work days' : unit) + ' missed',
			chips: [chip('Keep pay stubs and a letter from your employer', 'info')],
			rows: [
				row('Weekly earnings', money(weekly)),
				row('Pay for time missed', money(lost)),
				other ? row('Lost overtime, bonuses or tips', money(other)) : null,
				future ? row('Future lost earnings (' + num(v.futYears) + ' years)', money(future)) : null,
				row('Total lost wages', money(total), true)
			].filter(Boolean),
			notes: ['Paid leave you used still counts: you lost time you would otherwise keep. Self-employed claims rest on tax returns and invoices that show the drop.']
		};
	};

	/** Is my settlement offer fair? */
	T.offer = function (v, ctx) {
		var st = ctx.state;
		var fr = faultRule(st, null, 'pi');
		var f = clamp(Math.round(num(v.fault)), 0, 100);
		var sev = SEV[v.sev] ? v.sev : 'moderate';
		var m = SEV[sev];
		var econ = num(v.meds) + num(v.futMed) + num(v.wages);
		var cLo = capNon(st, econ * m[0], econ, sev), cHi = capNon(st, econ * m[1], econ, sev);
		var lo = applyFault(fr, f, econ, cLo.value), hi = applyFault(fr, f, econ, cHi.value);
		var low = lo.econ + lo.non, high = hi.econ + hi.non;
		var limit = limitValue(v.limit, st);
		if (limit !== null) {
			low = Math.min(low, limit);
			high = Math.min(high, limit);
		}
		var mid = (low + high) / 2;
		var offer = num(v.offer);
		var verdict, tone;
		if (lo.barred) {
			verdict = 'Your fault share may bar the claim, so any offer has value';
			tone = 'warn';
		} else if (offer < low) {
			verdict = 'Below your estimated range';
			tone = 'bad';
		} else if (offer < mid) {
			verdict = 'In the low half of your range';
			tone = 'warn';
		} else if (offer <= high) {
			verdict = 'In the upper half of your range';
			tone = 'good';
		} else {
			verdict = 'Above your estimated range';
			tone = 'good';
		}
		var counter = round(Math.max(high, offer * 1.15), 500);
		if (limit !== null) {
			counter = Math.min(counter, limit);
		}
		var chips = [chip(verdict, tone), faultChip(st, fr, f, lo)];
		if (limit !== null && econ * m[1] > limit) {
			chips.push(chip('The policy limit caps your range', 'warn'));
		}
		return {
			label: 'Your estimated range',
			headline: lo.barred ? '$0' : moneyRange(low, high),
			tone: lo.barred ? 'bad' : '',
			sub: mid ? 'The ' + money(offer) + ' offer is ' + pctText(offer / mid * 100) + ' of the midpoint (' + money(mid) + ')' : 'Enter your bills to build a range',
			bar: lo.barred ? null : { low: low, high: high, mid: mid, cov: offer, covLabel: 'The offer' },
			chips: chips,
			rows: [
				row('Economic damages', money(econ)),
				row('Pain and suffering (' + m[0] + '× – ' + m[1] + '×)', moneyRange(cLo.value, cHi.value)),
				f > 0 ? row('Your fault (' + f + '%)', lo.barred ? '−100%' : '−' + pctText(f)) : null,
				row('Estimated range', moneyRange(low, high), true),
				row('Insurer’s offer', money(offer), true),
				row('Suggested counteroffer', money(counter), true),
				row('Walk-away floor (low end)', money(low))
			].filter(Boolean),
			notes: ['First offers usually land in the low part of the range. Once you sign a release you cannot ask for more, so counter in writing and explain the bills and treatment behind your number.']
		};
	};

	/** Counteroffer. */
	T.counter = function (v) {
		var offer = num(v.offer), demand = num(v.demand), floor = num(v.floor);
		var c = { firm: 0.15, standard: 0.25, flexible: 0.35 }[v.style] || 0.25;
		var gap = Math.max(0, demand - offer);
		var next = round(Math.max(floor, demand - gap * c), 500);
		var rounds = [];
		var you = demand, them = offer;
		for (var r = 1; r <= 3; r++) {
			var g = Math.max(0, you - them);
			you = Math.max(floor, round(you - g * c, 500));
			them = Math.min(you, round(them + g * c * 0.8, 500));
			rounds.push(row('Round ' + r + ': you ask / they offer (projected)', money(you) + ' / ' + money(them)));
		}
		var chips = [];
		if (offer >= floor) {
			chips.push(chip('The offer already meets your floor', 'good'));
		} else {
			chips.push(chip(money(floor - offer) + ' below your floor', 'warn'));
		}
		chips.push(chip('Gap: ' + money(gap), 'info'));
		return {
			label: 'Your next counteroffer',
			headline: money(next),
			sub: 'A ' + pctText(c * 100) + ' step down from ' + money(demand) + ', never below ' + money(floor),
			chips: chips,
			rows: [
				row('Your last demand', money(demand)),
				row('Insurer’s latest offer', money(offer)),
				row('Gap between you', money(gap)),
				row('Next counteroffer', money(next), true),
				row('Walk-away floor', money(floor), true)
			].concat(rounds),
			notes: ['Smaller steps signal you are near your number. Explain each move with a fact from the file, such as a bill, a record or the fault evidence.']
		};
	};

	/** Demand letter. */
	T.demand = function (v, ctx) {
		var st = ctx.state;
		var sev = SEV[v.sev] ? v.sev : 'moderate';
		var m = SEV[sev];
		var meds = num(v.meds), futMed = num(v.futMed), wages = num(v.wages), prop = num(v.property);
		var econ = meds + futMed + wages;
		var high = econ * (1 + m[1]);
		var amount = num(v.amount) || round(high + prop, 500);
		var date = parseDate(v.date);
		var days = num(v.days) || 30;
		var t = today();
		var due = new Date(t.getTime() + days * 86400000);
		var line = function (s) {
			return s ? s + '\n' : '';
		};
		var letter = '';
		letter += fmtDate(t) + '\n\n';
		letter += line(v.adjuster ? v.adjuster : '[Adjuster name]');
		letter += line(v.insurer ? v.insurer : '[Insurance company]');
		letter += '\nRe: Settlement demand\n';
		letter += 'Claim number: ' + (v.claimNo || '[claim number]') + '\n';
		letter += 'Your insured: ' + (v.insured || '[insured’s name]') + '\n';
		letter += 'Date of accident: ' + (date ? fmtDate(date) : '[date]') + '\n\n';
		letter += 'Dear ' + (v.adjuster || 'Claims Adjuster') + ',\n\n';
		letter += 'I am writing to settle my claim for the injuries and losses I suffered on ' + (date ? fmtDate(date) : '[date]') + (v.location ? ' at ' + v.location : '') + (st ? ' in ' + st.name : '') + '.\n\n';
		letter += 'What happened\n' + (v.what || '[Describe the accident in two or three factual sentences.]') + ' Your insured was at fault.\n\n';
		letter += 'My injuries\n' + (v.injuries || '[List your diagnosed injuries.]') + '\n\n';
		letter += 'Treatment\n' + (v.treatment || '[List your treatment and providers.]') + '\n\n';
		letter += 'My damages\n';
		letter += '- Medical bills to date: ' + money(meds) + '\n';
		if (futMed) {
			letter += '- Future medical care: ' + money(futMed) + '\n';
		}
		letter += '- Lost income: ' + money(wages) + '\n';
		if (prop) {
			letter += '- Unpaid property damage: ' + money(prop) + '\n';
		}
		letter += '- Pain, suffering and loss of normal life: I have lived with ' + ({ minor: 'pain and disruption for months', moderate: 'pain and limits on daily life for months, with some lasting effects', severe: 'serious, lasting pain and limits that will stay with me', catastrophic: 'permanent, life-changing injuries' })[sev] + '.\n\n';
		letter += 'Copies of my medical records, bills and proof of lost income are enclosed.\n\n';
		letter += 'Demand\nI demand ' + money(amount) + ' to settle this claim. Please respond in writing by ' + fmtDate(due) + '.\n\n';
		letter += 'Sincerely,\n' + (v.yourName || '[Your name]') + '\n';
		return {
			label: 'Your demand amount',
			headline: money(amount),
			sub: num(v.amount) ? 'The amount you entered' : 'High end of your range (' + m[1] + '× pain and suffering), rounded',
			chips: [chip('Respond-by date: ' + fmtDate(due), 'info'), chip('Send by email and certified mail', 'info')],
			rows: [
				row('Economic damages', money(econ)),
				prop ? row('Property damage', money(prop)) : null,
				row('Demand', money(amount), true)
			].filter(Boolean),
			letter: letter,
			notes: ['Do not send medical records you have not read, and do not admit fault. Keep a copy of everything you send.']
		};
	};

	/** Statute of limitations. */
	T.sol = function (v, ctx) {
		var st = ctx.state;
		var date = parseDate(v.date);
		if (!st) {
			return {
				label: 'Last day to file a lawsuit',
				headline: 'Choose a state',
				sub: 'Injury deadlines run from one to six years, depending on the state.',
				chips: [],
				rows: [],
				notes: []
			};
		}
		if (!date) {
			return { label: 'Last day to file a lawsuit', headline: 'Enter a date', sub: '', chips: [], rows: [], notes: [] };
		}
		var ctype = v.ctype === 'death' ? 'death' : (v.ctype === 'mv' ? 'mv' : 'injury');
		var years = deadlineYears(st, date, ctype);
		var deadline = addYears(date, years);
		var left = daysBetween(today(), deadline);
		var tone = left < 0 ? 'bad' : (left < 90 ? 'warn' : 'good');
		var chips = [];
		if (left < 0) {
			chips.push(chip('This deadline has passed. Exceptions are rare: talk to a lawyer now', 'bad'));
		} else if (left < 90) {
			chips.push(chip('Under 90 days left: talk to a lawyer now', 'warn'));
		} else {
			chips.push(chip(left + ' days left', 'good'));
		}
		if (v.minor === '1') {
			chips.push(chip('For a minor, the clock usually pauses until age 18', 'info'));
		}
		if (v.gov === '1') {
			chips.push(chip('Government claims often need written notice within months', 'bad'));
		}
		var notes = [];
		if (ctype !== 'death' && st.solNote) {
			notes.push(st.solNote);
		}
		if (st.solPrior && iso(date) < st.solPrior.until && ctype !== 'death') {
			notes.push('Uses the ' + st.solPrior.years + '-year deadline that applied before ' + fmtDate(parseDate(st.solPrior.until)) + '.');
		}
		if (ctype === 'death') {
			notes.push('Wrongful death deadlines usually run from the date of death, not the date of the injury.');
		}
		notes.push('Some events pause or shorten the clock, such as discovering an injury later or a claim against a government agency. The date shown is the general rule.');
		return {
			label: 'Last day to file a lawsuit',
			headline: fmtDate(deadline),
			tone: tone === 'bad' ? 'bad' : '',
			sub: years + (years === 1 ? ' year' : ' years') + ' from ' + fmtDate(date) + (left >= 0 ? ' · ' + left + ' days left' : ' · passed ' + Math.abs(left) + ' days ago'),
			chips: chips,
			rows: [
				row(stateName(st) + ' deadline for ' + ({ injury: 'personal injury', mv: 'vehicle crash injuries', death: 'wrongful death' })[ctype], years + (years === 1 ? ' year' : ' years')),
				row('Clock starts', fmtDate(date)),
				row('Last day to file', fmtDate(deadline), true)
			],
			notes: notes
		};
	};

	/** Comparative fault. */
	T.fault = function (v, ctx) {
		var st = ctx.state;
		var D = num(v.damages);
		var f = clamp(Math.round(num(v.fault)), 0, 100);
		var rules = ['pure', 'bar51', 'bar50', 'contributory', 'slight_gross'];
		var names = { pure: 'Pure comparative', bar51: '51% bar', bar50: '50% bar', contributory: 'Contributory negligence', slight_gross: 'Slight/gross (South Dakota)' };
		var out = {};
		rules.forEach(function (r) {
			var res = applyFault({ rule: r, scope: 'all' }, f, D, 0);
			out[r] = res.econ;
		});
		var mine = st ? applyFault(faultRule(st, null, 'pi'), f, D, 0) : null;
		var rows = rules.map(function (r) {
			var isMine = st && st.fault === r;
			return row(names[r] + (isMine ? ' (' + stateName(st) + ')' : ''), money(out[r]), isMine);
		});
		var chips = [];
		if (st) {
			chips.push(faultChip(st, faultRule(st, null, 'pi'), f, mine));
		} else {
			chips.push(chip('Pick your state to see your rule', 'info'));
		}
		if (f > 0 && f < 50) {
			chips.push(chip('Insurers often argue your share up. Every point costs ' + money(D / 100), 'warn'));
		}
		return {
			label: st ? 'What you recover in ' + stateName(st) : 'What you recover',
			headline: st ? money(mine.econ + mine.non) : moneyRange(out.contributory, out.pure),
			tone: st && mine.barred ? 'bad' : '',
			sub: f + '% fault on ' + money(D) + ' in damages',
			chips: chips,
			rows: rows,
			notes: st && st.slug === 'michigan' ? ['Michigan is a hybrid: above 50% fault you lose non-economic damages but keep reduced economic damages.'] : []
		};
	};

	/** Policy limits and UM/UIM gap. */
	T.uim = function (v, ctx) {
		var st = ctx.state;
		var D = num(v.damages);
		var n = clamp(num(v.people), 1, 4);
		var pp, pa;
		if (v.bi === 'min') {
			pp = st ? st.ins[0] : 25000;
			pa = st ? st.ins[1] : 50000;
		} else {
			pp = num(v.bi);
			pa = pp * 2;
		}
		var avail = n > 1 ? Math.min(pp, pa / n) : pp;
		var fromAtFault = Math.min(D, avail);
		var uim = num(v.uim);
		var fromUim;
		if (pp === 0) {
			fromUim = Math.min(uim, D);
		} else if (v.utype === 'reducing') {
			fromUim = Math.min(Math.max(0, uim - fromAtFault), D - fromAtFault);
		} else {
			fromUim = Math.min(uim, D - fromAtFault);
		}
		var gap = Math.max(0, D - fromAtFault - fromUim);
		var chips = [];
		chips.push(gap > 0 ? chip(money(gap) + ' not covered by insurance', 'warn') : chip('Fully covered by insurance', 'good'));
		if (n > 1) {
			chips.push(chip('The per-crash limit is shared by ' + n + ' people', 'info'));
		}
		if (v.utype === 'reducing' && uim && uim <= pp) {
			chips.push(chip('Reducing UIM pays nothing when your limit is not above theirs', 'bad'));
		}
		return {
			label: 'Insurance available for your claim',
			headline: money(fromAtFault + fromUim),
			sub: gap > 0 ? 'Uncovered gap: ' + money(gap) : 'Your damages fit within the coverage',
			bar: D ? { low: fromAtFault, high: fromAtFault + fromUim, mid: fromAtFault + fromUim, cov: D, covLabel: 'Your damages', max: Math.max(D, fromAtFault + fromUim) } : null,
			chips: chips,
			rows: [
				row('Your damages', money(D)),
				row(pp === 0 ? 'At-fault driver (uninsured)' : 'At-fault driver’s policy' + (n > 1 ? ' (your share)' : ''), money(fromAtFault)),
				row(pp === 0 ? 'Your uninsured motorist (UM) coverage' : 'Your UIM coverage (' + (v.utype === 'reducing' ? 'reducing' : 'excess') + ')', money(fromUim)),
				row('Total insurance', money(fromAtFault + fromUim), true),
				row('Uncovered gap', money(gap), true)
			],
			notes: ['Most drivers who carry minimum limits have few personal assets, so the gap is rarely collected. Your policy’s declarations page shows your UM/UIM limit and type.']
		};
	};

	/** No-fault PIP. */
	T.pip = function (v, ctx) {
		var st = ctx.state;
		if (!st || !st.nf) {
			return {
				label: 'PIP benefits you can expect',
				headline: st ? stateName(st) + ' is not no-fault' : 'Choose a no-fault state',
				sub: st ? 'Your claim goes against the at-fault driver’s liability insurance.' : 'Twelve states use no-fault insurance.',
				chips: [], rows: [], notes: []
			};
		}
		var meds = num(v.meds), wages = num(v.wages);
		var limit = num(v.pip) || st.nf.pip;
		var defMed = st.slug === 'florida' ? 80 : 100;
		var defInc = st.slug === 'florida' ? 60 : (st.slug === 'michigan' ? 85 : 80);
		var medShare = (String(v.medShare).trim() === '' ? defMed : clamp(num(v.medShare), 0, 100)) / 100;
		var incShare = (String(v.incShare).trim() === '' ? defInc : clamp(num(v.incShare), 0, 100)) / 100;
		var medPaid = Math.min(limit, meds * medShare);
		var incPaid = Math.min(limit - medPaid, wages * incShare);
		var total = medPaid + incPaid;
		var out = meds + wages - total;
		var chips = [];
		var passes = st.nf.th === 'monetary' && meds >= st.nf.amount;
		if (v.threshold === 'yes' || passes) {
			chips.push(chip('You can also claim pain and suffering from the at-fault driver', 'good'));
		} else if (v.threshold === 'no') {
			chips.push(chip('Below the threshold: PIP is your main recovery', 'warn'));
		} else {
			chips.push(chip(st.nf.th === 'monetary' ? 'Threshold: ' + money(st.nf.amount) + ' in medical bills or a serious injury' : 'Threshold: a serious injury', 'info'));
		}
		if (out > 0) {
			chips.push(chip(money(out) + ' not paid by PIP', 'warn'));
		}
		return {
			label: 'PIP benefits you can expect',
			headline: money(total),
			sub: 'From your own insurer, whoever caused the crash · ' + money(limit) + ' limit',
			chips: chips,
			rows: [
				row('Medical bills', money(meds)),
				row('PIP pays for medical (' + pctText(medShare * 100) + ')', money(medPaid)),
				row('Lost income', money(wages)),
				row('PIP pays for income (' + pctText(incShare * 100) + ')', money(incPaid)),
				row('Total PIP benefits', money(total), true),
				row('Left for you or a liability claim', money(out), true)
			],
			notes: ['To sue the at-fault driver in ' + st.name + ' you need ' + st.nf.text + '.']
		};
	};

	/** MedPay. */
	T.medpay = function (v) {
		var limit = num(v.limit), meds = num(v.meds), health = num(v.health);
		var pays = Math.min(limit, meds);
		var left = meds - pays;
		var gapCover = Math.min(Math.max(0, limit - pays), health);
		var chips = [chip('Pays regardless of fault', 'good')];
		if (v.settle === '1') {
			chips.push(chip('Your insurer may ask to be repaid from a settlement', 'warn'));
		}
		return {
			label: 'MedPay pays',
			headline: money(pays),
			sub: left > 0 ? money(left) + ' of bills above your MedPay limit' : 'Your bills fit within the limit',
			chips: chips,
			rows: [
				row('Medical bills', money(meds)),
				row('MedPay limit', money(limit)),
				row('MedPay pays', money(pays), true),
				health ? row('Room left for deductibles and copays', money(gapCover)) : null,
				row('Bills left over', money(left), true)
			].filter(Boolean),
			notes: ['MedPay can usually pay your health plan’s deductible and copays too. Whether your insurer must be repaid from a settlement depends on your state and the policy wording.']
		};
	};

	/** Total loss. */
	T.totalloss = function (v) {
		var base = num(v.acv) + num(v.adj);
		var tax = base * clamp(num(v.tax), 0, 15) / 100;
		var fees = num(v.fees);
		var ded = num(v.deductible);
		var settle = Math.max(0, base + tax + fees - ded);
		var loan = num(v.loan);
		var gap = Math.max(0, loan - settle);
		var chips = [];
		if (gap > 0) {
			chips.push(v.gap === '1' ? chip('Gap insurance should cover the ' + money(gap) + ' loan shortfall', 'good') : chip('You still owe ' + money(gap) + ' on the loan', 'bad'));
		} else if (loan) {
			chips.push(chip(money(settle - loan) + ' left after paying off the loan', 'good'));
		}
		chips.push(chip('Ask for the valuation report and comparables', 'info'));
		return {
			label: 'Total loss settlement',
			headline: money(settle),
			sub: 'Actual cash value plus tax and fees',
			chips: chips,
			rows: [
				row('Market value before the crash', money(num(v.acv))),
				num(v.adj) ? row('Adjustments', money(num(v.adj))) : null,
				row('Sales tax', money(tax)),
				row('Title and registration', money(fees)),
				ded ? row('Your deductible', minus(ded)) : null,
				row('Settlement', money(settle), true),
				loan ? row('Loan or lease balance', money(loan)) : null,
				loan ? row(gap > 0 ? 'Loan shortfall' : 'Left after the loan', money(gap > 0 ? gap : settle - loan), true) : null
			].filter(Boolean),
			notes: ['Many states require the insurer to include sales tax and title fees in a total loss payment. Compare its valuation with local listings for the same model, trim and mileage.']
		};
	};

	/** Diminished value (17c formula). */
	T.dv = function (v) {
		var value = num(v.value), miles = num(v.miles);
		var dm = { severe: 1, major: 0.75, moderate: 0.5, minor: 0.25, none: 0 }[v.damage];
		if (dm === undefined) {
			dm = 0.5;
		}
		var mm = miles < 20000 ? 1 : miles < 40000 ? 0.8 : miles < 60000 ? 0.6 : miles < 80000 ? 0.4 : miles < 100000 ? 0.2 : 0;
		var base = value * 0.1;
		var dv = base * dm * mm;
		return {
			label: 'Diminished value (17c formula)',
			headline: money(dv),
			sub: 'The formula many insurers start from',
			chips: [chip('Independent appraisals often come in higher', 'info'), mm === 0 ? chip('Over 100,000 miles: the formula gives $0', 'warn') : chip('Mileage factor ' + mm.toFixed(1), 'info')],
			rows: [
				row('Value before the accident', money(value)),
				row('Base loss (10% cap)', money(base)),
				row('Damage multiplier', dm.toFixed(2)),
				row('Mileage multiplier', mm.toFixed(1)),
				row('Diminished value', money(dv), true)
			],
			notes: ['The 17c formula comes from a Georgia class action and tends to undervalue newer and higher-value cars. A claim against the at-fault driver’s insurer is allowed in most states; a claim against your own insurer often is not.']
		};
	};

	/** Rental car and loss of use. */
	T.rental = function (v) {
		var days = num(v.days);
		var daily = v.mode === 'nouse' ? num(v.lou) : num(v.rate) * (1 + num(v.taxes) / 100);
		var max = num(v.policyMax);
		var capped = max ? Math.min(daily, max) : daily;
		var total = capped * days;
		return {
			label: v.mode === 'nouse' ? 'Loss-of-use claim' : 'Rental reimbursement',
			headline: money(total),
			sub: money(capped) + ' a day for ' + days + ' days',
			chips: [max && daily > max ? chip('Your policy caps it at ' + money(max) + ' a day', 'warn') : chip('Claim it from the at-fault driver’s insurer', 'info')],
			rows: [
				row('Daily amount', money(daily)),
				max ? row('Policy daily limit', money(max)) : null,
				row('Days', String(days)),
				row('Total', money(total), true)
			].filter(Boolean),
			notes: ['The at-fault insurer owes a comparable car for a reasonable repair time. If the repair shop is slow, ask the adjuster in writing to extend the rental.']
		};
	};

	/** Workers' comp weekly benefit. */
	T.wcweekly = function (v) {
		var aww = num(v.aww), rate = num(v.rate) / 100, max = num(v.max), min = num(v.min);
		var raw = aww * rate;
		var weekly = max ? Math.min(raw, max) : raw;
		if (min && weekly < min) {
			weekly = Math.min(min, aww);
		}
		var weeks = num(v.weeks), wait = num(v.wait), retro = num(v.retro);
		var daysOff = weeks * 7;
		var unpaid = daysOff > retro ? 0 : Math.min(wait, daysOff);
		var paidWeeks = Math.max(0, (daysOff - unpaid) / 7);
		var total = weekly * paidWeeks;
		var chips = [];
		if (max && raw > max) {
			chips.push(chip('Capped at your state’s maximum', 'warn'));
		}
		chips.push(chip('Workers’ comp benefits are not taxed', 'good'));
		return {
			label: 'Weekly benefit',
			headline: money(weekly),
			sub: 'About ' + money(total) + ' for ' + weeks + ' weeks off work',
			chips: chips,
			rows: [
				row('Average weekly wage', money(aww)),
				row('Benefit rate', pctText(rate * 100)),
				row('Weekly benefit', money(weekly), true),
				row('Unpaid waiting days', String(unpaid)),
				row('Total for the time off', money(total), true)
			],
			notes: ['Each state sets its own rate, waiting period and yearly maximum. Check your state’s workers’ comp agency for the current figures.']
		};
	};

	/** Workers' comp settlement. */
	T.wcsettle = function (v) {
		var aww = num(v.aww), rate = num(v.rate) / 100, max = num(v.max);
		var weekly = max ? Math.min(aww * rate, max) : aww * rate;
		var ppd = num(v.rating) / 100 * num(v.weeks) * weekly;
		var ttd = num(v.ttdLeft) * weekly;
		var fm = num(v.futMed);
		var total = ppd + ttd + fm;
		var low = total * 0.7;
		return {
			label: 'Estimated settlement range',
			headline: moneyRange(low, total),
			sub: 'Full value ' + money(total) + '. Lump sums often settle below it.',
			bar: total ? { low: low, high: total, mid: (low + total) / 2, cov: null } : null,
			chips: [chip('Weekly rate ' + money(weekly), 'info'), chip('Medicare may need to approve future medical money', 'warn')],
			rows: [
				row('Weekly benefit rate', money(weekly)),
				row('Permanent disability (' + num(v.rating) + '% × ' + num(v.weeks) + ' weeks)', money(ppd)),
				ttd ? row('Temporary disability still owed', money(ttd)) : null,
				row('Future medical care', money(fm)),
				row('Full value', money(total), true),
				row('Typical range (70% to 100%)', moneyRange(low, total), true)
			].filter(Boolean),
			notes: ['States use their own body-part schedules and formulas. Settlements also weigh disputes, how long benefits would run and the risk of a hearing.']
		};
	};

	/** SSDI back pay. */
	function monthIndex(d) {
		return d.getUTCFullYear() * 12 + d.getUTCMonth();
	}
	T.ssdi = function (v) {
		var monthly = num(v.monthly);
		var onset = parseDate(v.onset), applied = parseDate(v.applied), approved = parseDate(v.approved);
		if (!onset || !applied || !approved) {
			return { label: 'Estimated back pay', headline: 'Enter the dates', sub: '', chips: [], rows: [], notes: [] };
		}
		var start = monthIndex(onset) + (onset.getUTCDate() === 1 ? 5 : 6);
		var retro = monthIndex(applied) - 12;
		var first = Math.max(start, retro);
		var months = Math.max(0, monthIndex(approved) - first);
		var back = months * monthly;
		var fee = v.rep === '1' ? Math.min(back * 0.25, 9200) : 0;
		var firstDate = new Date(Date.UTC(Math.floor(first / 12), first % 12, 1));
		return {
			label: 'Estimated back pay after fees',
			headline: money(back - fee),
			sub: months + ' months of benefits from ' + fmtDate(firstDate),
			chips: [chip('5-month waiting period applied', 'info'), retro > start ? chip('Limited to 12 months before you applied', 'warn') : chip('Back to your entitlement date', 'good')],
			rows: [
				row('Monthly benefit', money(monthly)),
				row('Benefits start', fmtDate(firstDate)),
				row('Months of back pay', String(months)),
				row('Back pay', money(back), true),
				fee ? row('Representative’s fee (25%, capped at $9,200)', minus(fee)) : null,
				row('You receive', money(back - fee), true)
			].filter(Boolean),
			notes: ['SSDI pays from the sixth full month of disability and no more than 12 months before your application. SSI back pay follows different rules.']
		};
	};

	/** VA combined rating. */
	function vaCombine(list) {
		var remaining = 100;
		list.slice().sort(function (a, b) {
			return b - a;
		}).forEach(function (r) {
			remaining = remaining - remaining * r / 100;
		});
		return 100 - remaining;
	}
	T.va = function (v) {
		var all = [], bil = [];
		for (var i = 1; i <= 8; i++) {
			var raw = v['r' + i];
			if (raw === undefined || raw === '') {
				continue;
			}
			var r = clamp(num(raw), 0, 100);
			if (v['b' + i] === '1') {
				bil.push(r);
			} else {
				all.push(r);
			}
		}
		var rows = [];
		if (bil.length > 1) {
			var b = vaCombine(bil);
			var withFactor = b + b * 0.1;
			rows.push(row('Bilateral ratings combined', pctText(b)));
			rows.push(row('Plus 10% bilateral factor', pctText(withFactor)));
			all.push(withFactor);
		} else {
			all = all.concat(bil);
		}
		var exact = vaCombine(all);
		var final = Math.min(100, Math.floor((exact + 5) / 10) * 10);
		rows.unshift(row('Ratings entered', all.length ? all.map(function (x) {
			return pctText(x);
		}).join(', ') : 'None'));
		rows.push(row('Exact combined value', pctText(exact)));
		rows.push(row('Combined rating (rounded to the nearest 10)', final + '%', true));
		return {
			label: 'Combined VA disability rating',
			headline: final + '%',
			sub: 'Exact combined value ' + pctText(exact),
			chips: [chip('VA math combines ratings, it does not add them', 'info')],
			rows: rows,
			notes: ['The VA applies each rating to the “remaining efficiency” left by the higher ones, then rounds the result to the nearest 10. See va.gov for the monthly pay at each rating.']
		};
	};

	/** Long-term disability. */
	T.ltd = function (v) {
		var salary = num(v.salary), pct = num(v.pct) / 100, cap = num(v.cap), off = num(v.offsets), floor = num(v.floor);
		var gross = salary * pct;
		var capped = cap ? Math.min(gross, cap) : gross;
		var benefit = Math.max(floor, capped - off);
		return {
			label: 'Monthly LTD benefit',
			headline: money(benefit) + '/mo',
			sub: v.premium === 'you' ? 'Usually tax-free, because you paid the premiums after tax' : 'Usually taxable, because your employer paid the premiums',
			chips: [chip(money(benefit * 12) + ' a year', 'info'), cap && gross > cap ? chip('Limited by the policy maximum', 'warn') : chip('Below the policy maximum', 'good')],
			rows: [
				row('Monthly pay', money(salary)),
				row('Benefit before offsets (' + pctText(pct * 100) + ')', money(gross)),
				cap && gross > cap ? row('Policy maximum', money(cap)) : null,
				row('Offsets (SSDI and others)', minus(off)),
				row('Monthly benefit', money(benefit), true)
			].filter(Boolean),
			notes: ['Most group policies subtract Social Security disability and some other income. Read the “other income benefits” section of your policy.']
		};
	};

	/** Employment discrimination. */
	T.discrim = function (v) {
		var salary = num(v.salary) * (1 + num(v.benefits) / 100);
		var since = parseDate(v.since);
		var years = since ? Math.max(0, daysBetween(since, today()) / 365.25) : 0;
		var back = Math.max(0, salary * years - num(v.earned));
		var front = salary * num(v.frontYears);
		var CAP = { '15': 50000, '101': 100000, '201': 200000, '501': 300000 };
		var cap = CAP[v.size] || 100000;
		var claimed = num(v.claimed);
		var capped = Math.min(claimed, cap);
		var total = back + front + capped;
		return {
			label: 'Estimated federal claim value',
			headline: money(total),
			sub: 'Back pay, front pay and capped damages',
			chips: [chip('Federal cap for this employer size: ' + money(cap), 'info'), claimed > cap ? chip('State law claims may not be capped', 'warn') : chip('Claimed damages fit under the cap', 'good')],
			rows: [
				row('Back pay since ' + (since ? fmtDate(since) : 'the job loss') + ', less new earnings', money(back)),
				row('Front pay (' + num(v.frontYears) + ' years)', money(front)),
				row('Emotional distress and punitive damages claimed', money(claimed)),
				row('Limited by the federal cap', money(capped)),
				row('Estimated claim value', money(total), true)
			],
			notes: ['Title VII and the ADA cap compensatory and punitive damages combined by employer size (42 U.S.C. § 1981a). Back pay and front pay are not capped. Deadlines to file with the EEOC are short: usually 180 or 300 days.']
		};
	};

	/** Wrongful termination back pay. */
	T.backpay = function (v) {
		var since = parseDate(v.since), until = parseDate(v.until) || today();
		var years = since ? Math.max(0, daysBetween(since, until) / 365.25) : 0;
		var pay = num(v.salary) * years;
		var ben = pay * num(v.benefits) / 100;
		var earned = num(v.earned), ui = num(v.unemployment);
		var back = Math.max(0, pay + ben - earned);
		return {
			label: 'Estimated back pay',
			headline: money(back),
			sub: (Math.round(years * 12 * 10) / 10) + ' months without the job',
			chips: [ui ? chip('Some states also deduct unemployment: ' + money(Math.max(0, back - ui)), 'info') : chip('Keep records of your job search', 'info')],
			rows: [
				row('Lost pay', money(pay)),
				row('Lost benefits', money(ben)),
				row('Earnings from new work', minus(earned)),
				row('Back pay', money(back), true)
			],
			notes: ['You must look for comparable work. Back pay stops growing once you would have found it, and earnings from new work are subtracted.']
		};
	};

	/** Unpaid overtime. */
	T.overtime = function (v) {
		var rate = num(v.rate), hours = num(v.otHours);
		var maxWeeks = v.willful === '1' ? 156 : 104;
		var weeks = Math.min(num(v.weeks), maxWeeks);
		var factor = v.paid === 'straight' ? 0.5 : 1.5;
		var owed = rate * factor * hours * weeks;
		var liq = v.liquidated === '1' ? owed : 0;
		return {
			label: 'Overtime owed',
			headline: money(owed + liq),
			sub: money(owed) + ' in unpaid overtime' + (liq ? ' + ' + money(liq) + ' liquidated damages' : ''),
			chips: [chip((v.willful === '1' ? '3-year' : '2-year') + ' lookback under the FLSA', 'info'), num(v.weeks) > maxWeeks ? chip('Weeks limited to ' + maxWeeks, 'warn') : chip('Your state may allow more', 'info')],
			rows: [
				row('Overtime rate owed per hour', money(rate * factor) + (factor === 0.5 ? ' (the missing half-time)' : ' (time and a half)')),
				row('Hours per week × weeks', hours + ' × ' + weeks),
				row('Unpaid overtime', money(owed), true),
				liq ? row('Liquidated damages (equal amount)', money(liq)) : null,
				row('Total', money(owed + liq), true)
			].filter(Boolean),
			notes: ['The Fair Labor Standards Act requires 1.5 times the regular rate for hours over 40 in a workweek, for non-exempt workers (29 U.S.C. §§ 207, 216, 255).']
		};
	};

	function compute(type, values, ctx) {
		var fn = T[type];
		if (!fn) {
			return null;
		}
		return fn(values, ctx || {});
	}

	/* ------------------------------------------------------------------
	 * Browser UI
	 * ---------------------------------------------------------------- */

	var STATES = null;
	function states() {
		if (STATES) {
			return STATES;
		}
		var el = document.getElementById('cv-states-data');
		try {
			STATES = el ? JSON.parse(el.textContent) : {};
		} catch (e) {
			STATES = {};
		}
		return STATES;
	}

	function esc(s) {
		return String(s).replace(/[&<>"']/g, function (c) {
			return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
		});
	}

	function readValues(form) {
		var out = {};
		Array.prototype.forEach.call(form.elements, function (el) {
			if (!el.name) {
				return;
			}
			if (el.type === 'checkbox') {
				out[el.name] = el.checked ? '1' : '';
			} else {
				out[el.name] = el.value;
			}
		});
		return out;
	}

	function scale(max) {
		var top = max * 1.1;
		var step = top > 2000000 ? 500000 : top > 500000 ? 100000 : top > 100000 ? 25000 : top > 25000 ? 5000 : 1000;
		return Math.max(step, Math.ceil(top / step) * step);
	}

	function renderBar(bar) {
		var max = scale(Math.max(bar.high, bar.cov || 0, bar.max || 0));
		var p = function (n) {
			return clamp(Math.round(n / max * 10000) / 100, 0, 100);
		};
		var width = Math.max(0.6, p(bar.high) - p(bar.low));
		var html = '<div class="cv-bar" aria-hidden="true"><div class="cv-bar__track"></div>' +
			'<div class="cv-bar__fill" style="left:' + p(bar.low) + '%;width:' + width + '%"></div>' +
			'<div class="cv-bar__mid" style="left:' + p(bar.mid) + '%"></div>';
		if (bar.cov !== null && bar.cov !== undefined) {
			html += '<div class="cv-bar__cov" style="left:' + p(bar.cov) + '%"></div>';
		}
		html += '</div><div class="cv-bar__scale cv-mono" aria-hidden="true"><span>$0</span><span>' + kLabel(max / 2) + '</span><span>' + kLabel(max) + '</span></div>';
		if (bar.cov !== null && bar.cov !== undefined) {
			html += '<p class="cv-bar__legend"><span class="cv-bar__dash"></span>' + esc(bar.covLabel || 'Insurance available') + ': ' + money(bar.cov) + '</p>';
		}
		return html;
	}

	function render(root, res, ctx) {
		var q = function (k) {
			return root.querySelector('[data-r="' + k + '"]');
		};
		q('context').textContent = (ctx.state ? ctx.state.name : (ctx.statesAware ? 'All states' : 'Estimate')) + ' · ' + ctx.short;
		q('label').textContent = res.label;
		var h = q('headline');
		h.textContent = res.headline;
		h.classList.toggle('is-bad', res.tone === 'bad');
		q('sub').textContent = res.sub || '';
		var bar = q('bar');
		if (res.bar && res.bar.high > 0) {
			bar.innerHTML = renderBar(res.bar);
			bar.hidden = false;
		} else {
			bar.hidden = true;
			bar.innerHTML = '';
		}
		q('chips').innerHTML = (res.chips || []).map(function (c) {
			return '<span class="cv-chip cv-chip--' + c.tone + '">' + esc(c.text) + '</span>';
		}).join('');
		q('rows').innerHTML = (res.rows || []).map(function (r) {
			return '<div class="cv-row' + (r.strong ? ' is-strong' : '') + '"><span>' + esc(r.label) + '</span><span class="cv-mono">' + esc(r.value) + '</span></div>';
		}).join('');
		q('math').hidden = !(res.rows && res.rows.length);
		q('notes').innerHTML = (res.notes || []).map(function (n) {
			return '<p>' + n + '</p>';
		}).join('');
		var net = q('net');
		if (res.net) {
			net.innerHTML = '<div class="cv-net__head"><span>' + esc(res.net.title) + '</span><span class="cv-mono cv-net__value">' + esc(res.net.value) + '</span></div>' +
				res.net.rows.map(function (r) {
					return '<div class="cv-net__row"><span>' + esc(r.label) + '</span><span class="cv-mono">' + esc(r.value) + '</span></div>';
				}).join('');
			net.hidden = false;
		} else {
			net.hidden = true;
		}
		var letter = q('letter');
		if (letter) {
			if (res.letter) {
				letter.hidden = false;
				letter.querySelector('textarea').value = res.letter;
			} else {
				letter.hidden = true;
			}
		}
	}

	function formatMoneyInput(el) {
		var raw = el.value.trim();
		if (raw === '') {
			return;
		}
		var n = num(raw);
		if (n < 0 && !el.dataset.neg) {
			n = Math.abs(n);
		}
		el.value = (n < 0 ? '-' : '') + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 2 });
	}

	function setup(root) {
		var form = root.querySelector('form');
		var type = root.getAttribute('data-type');
		var fixed = root.getAttribute('data-state') || '';
		var ctxBase = {
			variant: root.getAttribute('data-variant') || '',
			short: root.getAttribute('data-short') || '',
			statesAware: root.getAttribute('data-states') === '1'
		};
		var params = new URLSearchParams(window.location.search);
		var stateSel = form.querySelector('select[name="state"]');
		if (stateSel && params.get('state') && states()[params.get('state')]) {
			stateSel.value = params.get('state');
		}
		['pastMed', 'meds'].forEach(function (k) {
			var el = form.querySelector('[name="' + k + '"]');
			if (el && params.get('bills')) {
				el.value = params.get('bills');
				formatMoneyInput(el);
			}
		});

		function currentState() {
			var slug = fixed || (stateSel ? stateSel.value : '');
			return slug ? states()[slug] || null : null;
		}

		function syncVisibility(st, values) {
			Array.prototype.forEach.call(root.querySelectorAll('[data-show]'), function (el) {
				var cond = el.getAttribute('data-show');
				var show = true;
				if (cond === 'nf') {
					show = !!(st && st.nf);
				} else if (cond.indexOf('!=') > 0) {
					var a = cond.split('!=');
					show = values[a[0]] !== a[1];
				} else if (cond.indexOf('=') > 0) {
					var b = cond.split('=');
					show = values[b[0]] === b[1];
				}
				el.hidden = !show;
			});
			var mark = root.querySelector('.cv-range-mark');
			if (mark) {
				var fr = faultRule(st, parseDate(values.date), ctxBase.variant);
				var bm = st ? barMark(fr.rule) : null;
				if (bm) {
					mark.hidden = false;
					mark.style.left = bm.at + '%';
					mark.textContent = bm.label;
				} else {
					mark.hidden = true;
				}
			}
			var out = root.querySelector('.cv-range-val');
			var range = root.querySelector('input[type="range"]');
			if (out && range) {
				out.textContent = range.value + '%';
			}
			Array.prototype.forEach.call(root.querySelectorAll('[data-notes]'), function (p) {
				var input = p.parentNode.querySelector('input[type="hidden"]');
				try {
					p.textContent = JSON.parse(p.getAttribute('data-notes'))[input.value] || '';
				} catch (e) {
					p.textContent = '';
				}
			});
			// Name the state in "state minimum" options when a state is picked.
			Array.prototype.forEach.call(root.querySelectorAll('option[value="min"]'), function (opt) {
				if (!opt.dataset.orig) {
					opt.dataset.orig = opt.textContent;
				}
				if (!fixed) {
					opt.textContent = st ? (st.ins[0] ? money(st.ins[0]) + ' (' + stateName(st) + ' minimum)' : 'No injury coverage (' + stateName(st) + ')') : opt.dataset.orig;
				}
			});
		}

		var queued = false;
		function update() {
			queued = false;
			var values = readValues(form);
			var st = currentState();
			syncVisibility(st, values);
			var ctx = { state: st, variant: ctxBase.variant, short: ctxBase.short, statesAware: ctxBase.statesAware };
			var res = compute(type, values, ctx);
			if (res) {
				render(root, res, ctx);
			}
		}
		function queue() {
			if (!queued) {
				queued = true;
				window.requestAnimationFrame(update);
			}
		}

		form.addEventListener('input', queue);
		form.addEventListener('change', queue);
		form.addEventListener('submit', function (e) {
			e.preventDefault();
			update();
		});
		form.addEventListener('focusout', function (e) {
			if (e.target.closest && e.target.closest('.cv-input--money')) {
				formatMoneyInput(e.target);
			}
		});
		root.addEventListener('click', function (e) {
			var btn = e.target.closest ? e.target.closest('.cv-choice') : null;
			if (btn && root.contains(btn)) {
				var set = btn.parentNode;
				var input = set.parentNode.querySelector('input[type="hidden"]');
				Array.prototype.forEach.call(set.querySelectorAll('.cv-choice'), function (b) {
					b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
				});
				input.value = btn.getAttribute('data-value');
				queue();
				return;
			}
			var copy = e.target.closest ? e.target.closest('[data-copy]') : null;
			if (copy) {
				var ta = root.querySelector('[data-r="letter"] textarea');
				if (ta) {
					ta.select();
					if (navigator.clipboard) {
						navigator.clipboard.writeText(ta.value);
					} else {
						document.execCommand('copy');
					}
					copy.textContent = 'Copied';
					setTimeout(function () {
						copy.textContent = 'Copy letter';
					}, 2000);
				}
			}
			var dl = e.target.closest ? e.target.closest('[data-download]') : null;
			if (dl) {
				var text = root.querySelector('[data-r="letter"] textarea').value;
				var a = document.createElement('a');
				a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
				a.download = 'demand-letter.txt';
				document.body.appendChild(a);
				a.click();
				a.remove();
			}
		});
		update();
		root.classList.add('is-ready');
	}

	/** Small helpers outside calculators: state pickers that jump to a page, tool search, state grid filters. */
	function setupPickers() {
		Array.prototype.forEach.call(document.querySelectorAll('[data-cv-picker]'), function (form) {
			form.addEventListener('submit', function (e) {
				e.preventDefault();
				var state = form.querySelector('[name="state"]').value;
				var toolSel = form.querySelector('[name="tool"]');
				var tool = toolSel ? toolSel.value : form.getAttribute('data-tool');
				var opt = toolSel ? toolSel.options[toolSel.selectedIndex] : null;
				var pages = opt ? opt.getAttribute('data-pages') === '1' : form.getAttribute('data-pages') === '1';
				var base = form.getAttribute('data-home') || '/';
				if (!state) {
					window.location.href = base + tool + '/';
					return;
				}
				window.location.href = pages ? base + tool + '/' + state + '/' : base + tool + '/?state=' + state + '#calculator';
			});
		});
		Array.prototype.forEach.call(document.querySelectorAll('[data-cv-filter]'), function (wrap) {
			var grid = wrap.parentNode.querySelector('[data-cv-tiles]');
			wrap.addEventListener('click', function (e) {
				var btn = e.target.closest('button');
				if (!btn) {
					return;
				}
				var key = btn.getAttribute('data-filter');
				Array.prototype.forEach.call(wrap.querySelectorAll('button'), function (b) {
					b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
				});
				Array.prototype.forEach.call(grid.children, function (tile) {
					var show = key === 'all' || (key === 'nf' ? tile.getAttribute('data-nf') === '1' : tile.getAttribute('data-rule') === key);
					tile.hidden = !show;
				});
			});
		});
		Array.prototype.forEach.call(document.querySelectorAll('[data-cv-toolsearch]'), function (input) {
			var target = document.querySelector(input.getAttribute('data-cv-toolsearch'));
			if (!target) {
				return;
			}
			var empty = target.querySelector('[data-empty]');
			input.addEventListener('input', function () {
				var q = input.value.trim().toLowerCase();
				var any = false;
				Array.prototype.forEach.call(target.querySelectorAll('[data-search]'), function (card) {
					var hit = !q || card.getAttribute('data-search').indexOf(q) !== -1;
					card.hidden = !hit;
					any = any || hit;
				});
				Array.prototype.forEach.call(target.querySelectorAll('section[data-cat]'), function (sec) {
					sec.hidden = !sec.querySelector('[data-search]:not([hidden])');
				});
				if (empty) {
					empty.hidden = any;
				}
			});
		});
	}

	function boot() {
		Array.prototype.forEach.call(document.querySelectorAll('[data-cv-calc]'), function (root) {
			try {
				setup(root);
			} catch (e) {
				if (window.console) {
					window.console.error(e);
				}
			}
		});
		setupPickers();
	}

	return {
		boot: boot,
		compute: compute,
		applyFault: applyFault,
		faultRule: faultRule,
		capNon: capNon,
		deadlineYears: deadlineYears,
		addYears: addYears,
		vaCombine: vaCombine,
		money: money,
		_today: today
	};
});

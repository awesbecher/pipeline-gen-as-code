/* Parameter schema v1: strict parsing, validation, and normalization.
 *
 * Fail closed. Every input either matches the documented schema or the
 * runner exits nonzero with a field-specific error. No silent defaults
 * on decision inputs, no coercion surprises, no unknown keys.
 *
 * The accepted file format is a strict, documented YAML subset (or
 * JSON). Supported: `key: value`, one nesting level of maps, inline
 * lists [a, b], block lists (`- item`), comments, quoted scalars.
 * Anything else is rejected with a line number. This is deliberate:
 * the format is small enough to validate completely.
 *
 * Field groups (the product contract):
 *   portfolio drivers  -> deterministic engine verdicts (mix.cjs)
 *   capacity drivers   -> sales capacity model (engine.cjs)
 *   narrative context  -> carried into outputs, drives no verdict
 */
'use strict';

var SCHEMA_VERSION = 1;

var CONSTRAINTS = [
  'no_email', 'no_phone', 'no_paid_budget',
  'no_events_budget', 'no_community_capacity', 'founder_wont_post'
];
var ENGINE_KEYS = [
  'automated_outbound', 'plg', 'manual_outbound', 'abm',
  'community_partner', 'paid_media', 'seo_aeo', 'social_content', 'events'
];
var STAGES = ['pre-seed', 'seed', 'series-a', 'series-b-plus'];
var SELF_SERVE = ['yes', 'partial', 'no'];

/* ---------- strict YAML-subset parser ---------- */

/* A "#" only opens a comment at the start of a line or after whitespace.
 * Treating every "#" as a comment silently truncated real values:
 * `company: C# Security` became `C`. */
function stripComment(line) {
  var out = '', inQ = null;
  for (var i = 0; i < line.length; i++) {
    var ch = line[i];
    if (inQ) { out += ch; if (ch === inQ) inQ = null; continue; }
    if (ch === '"' || ch === "'") { inQ = ch; out += ch; continue; }
    if (ch === '#' && (i === 0 || /\s/.test(line[i - 1]))) break;
    out += ch;
  }
  return out;
}

/* Own-property test that cannot be shadowed by a key in the document.
 * `hasOwnProperty: x` used to make the parser throw a TypeError. */
var hasOwn = Object.prototype.hasOwnProperty;
function owns(o, k) { return hasOwn.call(o, k); }
/* Maps built from user input carry no prototype, so `__proto__` and
 * `constructor` are ordinary keys that unknown-key validation can see
 * and reject instead of silently mutating an object. */
function emptyMap() { return Object.create(null); }
var RESERVED_KEYS = ['__proto__', 'constructor', 'prototype'];

function parseScalar(raw, where, errors) {
  var v = raw.trim();
  if (v === '') return { kind: 'empty' };
  if ((v[0] === '"' || v[0] === "'") && !(v.length > 1 && v[v.length - 1] === v[0])) {
    errors.push(where + ': unterminated ' + v[0] + ' quote; close the quote or remove it');
    return { kind: 'error' };
  }
  var q = v.match(/^"([\s\S]*)"$/) || v.match(/^'([\s\S]*)'$/);
  if (q) {
    if (/^-?\d+(\.\d+)?$/.test(q[1])) {
      errors.push(where + ': quoted number "' + q[1] + '"; remove the quotes so it parses as a number');
      return { kind: 'error' };
    }
    return { kind: 'string', value: q[1] };
  }
  var low = v.toLowerCase();
  if (low === 'true' || low === 'yes') return { kind: 'bool', value: true };
  if (low === 'false' || low === 'no') return { kind: 'bool', value: false };
  if (low === 'null' || v === '~') return { kind: 'null' };
  if (/^[+-]?\d+$/.test(v)) return { kind: 'number', value: parseInt(v, 10) };
  if (/^[+-]?\d*\.\d+$/.test(v)) return { kind: 'number', value: parseFloat(v) };
  if (/^[&*{}]|^\||^>/.test(v)) {
    errors.push(where + ': unsupported YAML construct "' + v.slice(0, 12) + '"; this tool accepts the documented subset only');
    return { kind: 'error' };
  }
  return { kind: 'string', value: v };
}

/* Split an inline list on commas that sit outside quotes, so a value
 * like "VP Sales, Americas" survives as one member. An unterminated
 * quote is an error, not a silent split. */
function splitInline(inner, where, errors) {
  var parts = [], cur = '', inQ = null;
  for (var i = 0; i < inner.length; i++) {
    var ch = inner[i];
    if (inQ) { cur += ch; if (ch === inQ) inQ = null; continue; }
    if (ch === '"' || ch === "'") { inQ = ch; cur += ch; continue; }
    if (ch === ',') { parts.push(cur); cur = ''; continue; }
    cur += ch;
  }
  if (inQ) {
    errors.push(where + ': unterminated ' + inQ + ' quote in the inline list; quote both ends of every value that contains a comma');
    return null;
  }
  parts.push(cur);
  return parts;
}

function parseInline(list, where, errors) {
  var inner = list.slice(1, -1).trim();
  if (inner === '') return [];
  var parts = splitInline(inner, where, errors);
  if (parts === null) return [];
  var out = [];
  parts.forEach(function (s, i) {
    var r = parseScalar(s, where, errors);
    if (r.kind === 'error') return;
    if (r.kind === 'empty') {
      errors.push(where + ': empty item at position ' + (i + 1) + ' in the inline list; remove the stray comma');
      return;
    }
    out.push(wrap(r));
  });
  return out;
}

function wrap(r) {
  if (r.kind === 'null') return null;
  return { __kind: r.kind, value: r.value };
}

function parseSubset(text) {
  var errors = [];
  var doc = emptyMap();
  var lines = text.split(/\r?\n/);
  var section = null;       /* current top-level map or list key */
  var sectionIsList = false;
  for (var n = 0; n < lines.length; n++) {
    var lineNo = 'line ' + (n + 1);
    var raw = stripComment(lines[n]).replace(/\s+$/, '');
    if (!raw.trim()) continue;
    if (/\t/.test(raw)) { errors.push(lineNo + ': tab characters are not allowed; indent with two spaces'); continue; }
    var indent = raw.match(/^ */)[0].length;
    var t = raw.trim();

    if (t.startsWith('- ') || t === '-') {
      var item = t === '-' ? '' : t.slice(2).trim();
      if (indent !== 2) {
        errors.push(lineNo + ': list items are indented exactly two spaces under their key');
        continue;
      }
      /* A bare "key:" opens an ambiguous section; the first list item
       * resolves it into a block list. */
      if (section && !sectionIsList && doc[section] && doc[section].__open &&
          Object.keys(doc[section]).length === 1) {
        doc[section] = [];
        sectionIsList = true;
      }
      if (!section || !sectionIsList) {
        errors.push(lineNo + ': list item outside a list; open one with "key:" on the previous line');
        continue;
      }
      var rs = parseScalar(item, lineNo, errors);
      if (rs.kind === 'empty') {
        errors.push(lineNo + ': empty list item; give it a value or delete the line');
        continue;
      }
      if (rs.kind !== 'error') doc[section].push(wrap(rs));
      continue;
    }

    var m = t.match(/^([A-Za-z0-9_]+):(.*)$/);
    if (!m) { errors.push(lineNo + ': unrecognized syntax "' + t.slice(0, 30) + '"'); continue; }
    var key = m[1];
    var val = m[2].trim();
    if (RESERVED_KEYS.indexOf(key) >= 0) {
      errors.push(lineNo + ': "' + key + '" is a reserved key and is not allowed');
      continue;
    }

    if (indent === 0) {
      if (owns(doc, key)) { errors.push(lineNo + ': duplicate key "' + key + '"'); continue; }
      if (val === '') { section = key; sectionIsList = false; doc[key] = emptyMap(); doc[key].__open = true; }
      else if (val === '[]') { section = key; sectionIsList = true; doc[key] = []; }
      else if (val.startsWith('[') && val.endsWith(']')) { section = null; doc[key] = parseInline(val, lineNo, errors); }
      else {
        section = null;
        var r0 = parseScalar(val, lineNo, errors);
        if (r0.kind !== 'error') doc[key] = wrap(r0);
      }
      continue;
    }

    if (indent === 2 && section && !sectionIsList && doc[section] && doc[section].__open) {
      if (owns(doc[section], key)) { errors.push(lineNo + ': duplicate key "' + section + '.' + key + '"'); continue; }
      if (val === '[]') { doc[section][key] = []; }
      else if (val.startsWith('[') && val.endsWith(']')) { doc[section][key] = parseInline(val, lineNo, errors); }
      else if (val === '') { errors.push(lineNo + ': "' + section + '.' + key + '" opens a nested map; only one nesting level is supported'); }
      else {
        var r1 = parseScalar(val, lineNo, errors);
        if (r1.kind !== 'error') doc[section][key] = wrap(r1);
      }
      continue;
    }
    /* A list section followed by an indented mapping, or stray indent. */
    errors.push(lineNo + ': unexpected indentation under "' + (section || 'document root') + '"');
  }
  Object.keys(doc).forEach(function (k) { if (doc[k] && doc[k].__open) delete doc[k].__open; });
  return { doc: doc, errors: errors };
}

/* JSON input arrives as plain values; normalize to the wrapped form. */
function wrapJson(v, reserved) {
  if (v === null) return null;
  if (Array.isArray(v)) return v.map(function (x) { return wrapJson(x, reserved); });
  if (typeof v === 'object') {
    var o = emptyMap();
    Object.keys(v).forEach(function (k) {
      if (RESERVED_KEYS.indexOf(k) >= 0) { reserved.push(k); return; }
      o[k] = wrapJson(v[k], reserved);
    });
    return o;
  }
  if (typeof v === 'boolean') return { __kind: 'bool', value: v };
  if (typeof v === 'number') return { __kind: 'number', value: v };
  return { __kind: 'string', value: String(v) };
}

/* ---------- validation ---------- */

function isWrapped(v) { return v && typeof v === 'object' && v.__kind; }

function Validator() {
  this.errors = [];
  this.warnings = [];
  this.assumptions = [];
}
Validator.prototype.err = function (f, msg) { this.errors.push(f + ': ' + msg); };

function checkControl(v, field, val) {
  if (/[\x00-\x1F\x7F]/.test(val)) v.err(field, 'control characters are not allowed');
}

function takeString(v, obj, field, opts) {
  var w = obj[field.split('.').pop()];
  if (w === undefined) { if (opts.required) v.err(field, 'required'); return opts.def; }
  if (!isWrapped(w) || (w.__kind !== 'string' && !(opts.numbersOk && w.__kind === 'number'))) {
    v.err(field, 'expected text'); return undefined;
  }
  var s = w.__kind === 'number' ? String(w.value) : w.value;
  checkControl(v, field, s);
  if (s.trim() === '') { v.err(field, 'must not be blank'); return undefined; }
  if (opts.max && s.length > opts.max) v.err(field, 'longer than ' + opts.max + ' characters');
  if (opts.enum && opts.enum.indexOf(s) < 0) {
    v.err(field, '"' + s + '" is not one of: ' + opts.enum.join(', '));
    return undefined;
  }
  return s;
}

function takeNumber(v, obj, field, opts) {
  var w = obj[field.split('.').pop()];
  if (w === undefined) {
    if (opts.required) v.err(field, 'required');
    return opts.def;
  }
  if (!isWrapped(w) || w.__kind !== 'number') {
    v.err(field, 'expected a number' + (isWrapped(w) && w.__kind === 'string' ? ' (got text "' + String(w.value).slice(0, 20) + '")' : ''));
    return undefined;
  }
  var x = w.value;
  if (!isFinite(x)) { v.err(field, 'must be a finite number'); return undefined; }
  if (opts.int && x !== Math.trunc(x)) { v.err(field, 'must be a whole number'); return undefined; }
  if (opts.min !== undefined && x < opts.min) { v.err(field, 'must be at least ' + opts.min); return undefined; }
  if (opts.gt !== undefined && x <= opts.gt) { v.err(field, 'must be greater than ' + opts.gt); return undefined; }
  if (opts.max !== undefined && x > opts.max) { v.err(field, 'must be at most ' + opts.max); return undefined; }
  return x;
}

function takeBool(v, obj, field, opts) {
  var w = obj[field.split('.').pop()];
  if (w === undefined) {
    if (opts.required) v.err(field, 'required');
    if (opts.def !== undefined && opts.note) v.assumptions.push(field + ' defaulted to ' + opts.def);
    return opts.def;
  }
  if (!isWrapped(w) || w.__kind !== 'bool') { v.err(field, 'expected true or false'); return undefined; }
  return w.value;
}

function takeList(v, obj, field, opts) {
  var w = obj[field.split('.').pop()];
  if (w === undefined) { if (opts.required) v.err(field, 'required'); return opts.def || []; }
  if (!Array.isArray(w)) { v.err(field, 'expected a list'); return []; }
  var out = [];
  w.forEach(function (item, i) {
    /* Every member is checked. A member that is null, a nested list, or
     * a map is an error, never a silently dropped entry: a constraint
     * that disappears would fund a channel the caller tried to forbid. */
    if (item === null) { v.err(field + '[' + i + ']', 'null is not a valid list item'); return; }
    if (Array.isArray(item)) { v.err(field + '[' + i + ']', 'nested lists are not supported'); return; }
    if (!isWrapped(item)) { v.err(field + '[' + i + ']', 'expected a plain value, not a map'); return; }
    if (opts.kind === 'string' && item.__kind !== 'string') { v.err(field + '[' + i + ']', 'expected text'); return; }
    if (opts.kind === 'string' && String(item.value).trim() === '') { v.err(field + '[' + i + ']', 'empty text is not a valid list item'); return; }
    if (opts.kind === 'int') {
      if (item.__kind !== 'number' || item.value !== Math.trunc(item.value)) { v.err(field + '[' + i + ']', 'expected a whole number'); return; }
      if (opts.min !== undefined && item.value < opts.min) { v.err(field + '[' + i + ']', 'must be at least ' + opts.min); return; }
      if (opts.max !== undefined && item.value > opts.max) { v.err(field + '[' + i + ']', 'must be at most ' + opts.max); return; }
      out.push(item.value); return;
    }
    var s = item.value;
    checkControl(v, field + '[' + i + ']', String(s));
    if (opts.enum && opts.enum.indexOf(s) < 0) { v.err(field + '[' + i + ']', '"' + s + '" is not one of: ' + opts.enum.join(', ')); return; }
    out.push(s);
  });
  if (opts.unique) {
    var seen = {};
    out = out.filter(function (x) { if (seen[x]) { v.warnings.push(field + ': duplicate "' + x + '" ignored'); return false; } seen[x] = 1; return true; });
  }
  return out;
}

function rejectUnknown(v, obj, path, known) {
  Object.keys(obj).forEach(function (k) {
    if (known.indexOf(k) < 0) v.err((path ? path + '.' : '') + k, 'unknown field (check spelling; see company/params.example.yaml)');
  });
}

var TOP_KEYS = ['schema_version', 'company', 'stage', 'funding_usd', 'arr_now_usd',
  'arr_target_12mo_usd', 'team', 'product', 'icp', 'personas', 'acv', 'cycle_days',
  'cash_monthly_pipeline', 'engines_running', 'constraints', 'capacity'];
var TEAM_KEYS = ['aes_ramped', 'aes_ramping', 'bdrs', 'gtm_engineer', 'ses', 'sales_leaders',
  'bdr_managers', 'se_leads', 'aes_ramping_tenure_months'];
var PRODUCT_KEYS = ['category', 'self_serve', 'developer_facing'];
var CAPACITY_KEYS = ['base_arr_usd', 'churn_pct', 'expansion_usd'];

function validate(doc) {
  var v = new Validator();
  rejectUnknown(v, doc, '', TOP_KEYS);

  var sv = takeNumber(v, doc, 'schema_version', { int: true, def: SCHEMA_VERSION });
  if (sv !== undefined && sv !== SCHEMA_VERSION) v.err('schema_version', 'this tool supports schema_version ' + SCHEMA_VERSION);

  var p = { schema_version: SCHEMA_VERSION };
  p.company = takeString(v, doc, 'company', { required: true, max: 120 });
  p.stage = takeString(v, doc, 'stage', { enum: STAGES });
  p.funding_usd = takeNumber(v, doc, 'funding_usd', { min: 0, max: 1e10 });
  p.arr_now_usd = takeNumber(v, doc, 'arr_now_usd', { min: 0, max: 1e10 });
  p.arr_target_12mo_usd = takeNumber(v, doc, 'arr_target_12mo_usd', { min: 0, max: 1e10 });
  p.acv = takeNumber(v, doc, 'acv', { required: true, gt: 0, max: 5e6 });
  p.cycle_days = takeNumber(v, doc, 'cycle_days', { required: true, int: true, gt: 0, max: 1095 });
  p.cash_monthly_pipeline = takeNumber(v, doc, 'cash_monthly_pipeline', { required: true, min: 0, max: 1e7 });
  p.icp = takeString(v, doc, 'icp', { max: 200 });
  p.personas = takeList(v, doc, 'personas', { kind: 'string' });
  p.engines_running = takeList(v, doc, 'engines_running', { kind: 'string', enum: ENGINE_KEYS, unique: true });
  p.constraints = takeList(v, doc, 'constraints', { kind: 'string', enum: CONSTRAINTS, unique: true });

  if (doc.team === undefined || Array.isArray(doc.team) || isWrapped(doc.team)) {
    v.err('team', 'required map with aes_ramped, aes_ramping, bdrs, gtm_engineer');
  } else {
    rejectUnknown(v, doc.team, 'team', TEAM_KEYS);
    p.team = {
      aes_ramped: takeNumber(v, doc.team, 'team.aes_ramped', { required: true, int: true, min: 0, max: 500 }),
      aes_ramping: takeNumber(v, doc.team, 'team.aes_ramping', { required: true, int: true, min: 0, max: 500 }),
      bdrs: takeNumber(v, doc.team, 'team.bdrs', { required: true, int: true, min: 0, max: 500 }),
      gtm_engineer: takeBool(v, doc.team, 'team.gtm_engineer', { required: true }),
      ses: takeNumber(v, doc.team, 'team.ses', { int: true, min: 0, max: 500 }),
      sales_leaders: takeNumber(v, doc.team, 'team.sales_leaders', { int: true, min: 0, max: 100 }),
      bdr_managers: takeNumber(v, doc.team, 'team.bdr_managers', { int: true, min: 0, max: 100 }),
      se_leads: takeNumber(v, doc.team, 'team.se_leads', { int: true, min: 0, max: 100 }),
      aes_ramping_tenure_months: takeList(v, doc.team, 'team.aes_ramping_tenure_months', { kind: 'int', min: 1, max: 12 })
    };
    if (p.team.aes_ramping_tenure_months.length &&
        p.team.aes_ramping !== undefined &&
        p.team.aes_ramping_tenure_months.length !== p.team.aes_ramping) {
      v.err('team.aes_ramping_tenure_months', 'must list one tenure per ramping AE (' + p.team.aes_ramping + ')');
    }
    /* A tenure at or past the ramp length for this cycle means the rep is
     * already ramped; counting it as ramping understates capacity. */
    if (p.team.aes_ramping_tenure_months.length && p.cycle_days !== undefined) {
      var rampMonths = p.cycle_days < 120 ? 6 : (p.cycle_days <= 220 ? 9 : 12);
      p.team.aes_ramping_tenure_months.forEach(function (t, i) {
        if (t > rampMonths) v.warnings.push('team.aes_ramping_tenure_months[' + i + ']: ' + t +
          ' months is past the ' + rampMonths + '-month ramp for a ' + p.cycle_days +
          '-day cycle; that rep is fully ramped and belongs in team.aes_ramped');
      });
    }
  }

  if (doc.product === undefined || Array.isArray(doc.product) || isWrapped(doc.product)) {
    v.err('product', 'required map with self_serve');
  } else {
    rejectUnknown(v, doc.product, 'product', PRODUCT_KEYS);
    var ssw = doc.product.self_serve;
    var ss;
    if (ssw === undefined) v.err('product.self_serve', 'required ("yes", "partial", or "no")');
    else if (isWrapped(ssw) && ssw.__kind === 'bool') {
      ss = ssw.value ? 'yes' : 'no';
      v.warnings.push('product.self_serve: bare ' + (ssw.value ? 'yes/true' : 'no/false') + ' normalized to "' + ss + '"');
    } else if (isWrapped(ssw) && ssw.__kind === 'string') {
      var c = ssw.value.toLowerCase();
      if (SELF_SERVE.indexOf(c) < 0) v.err('product.self_serve', '"' + ssw.value + '" is not one of: yes, partial, no');
      else ss = c;
    } else v.err('product.self_serve', 'expected "yes", "partial", or "no"');
    p.product = {
      category: takeString(v, doc.product, 'product.category', { max: 120 }),
      self_serve: ss,
      developer_facing: takeBool(v, doc.product, 'product.developer_facing', { def: false, note: true })
    };
  }

  if (doc.capacity !== undefined) {
    if (Array.isArray(doc.capacity) || isWrapped(doc.capacity)) v.err('capacity', 'expected a map');
    else {
      rejectUnknown(v, doc.capacity, 'capacity', CAPACITY_KEYS);
      p.capacity = {
        base_arr_usd: takeNumber(v, doc.capacity, 'capacity.base_arr_usd', { min: 0, max: 1e10 }),
        churn_pct: takeNumber(v, doc.capacity, 'capacity.churn_pct', { min: 0, max: 0.6 }),
        expansion_usd: takeNumber(v, doc.capacity, 'capacity.expansion_usd', { min: 0, max: 1e10 })
      };
      if (p.capacity.base_arr_usd === undefined) {
        if (p.arr_now_usd !== undefined) { p.capacity.base_arr_usd = p.arr_now_usd; v.assumptions.push('capacity.base_arr_usd taken from arr_now_usd'); }
        else v.err('capacity.base_arr_usd', 'required (or set arr_now_usd)');
      }
      if (p.capacity.churn_pct === undefined) { p.capacity.churn_pct = 0.06; v.assumptions.push('capacity.churn_pct defaulted to 0.06'); }
      if (p.capacity.expansion_usd === undefined) { p.capacity.expansion_usd = 0; v.assumptions.push('capacity.expansion_usd defaulted to 0'); }
      if (p.arr_target_12mo_usd === undefined) v.err('arr_target_12mo_usd', 'required when the capacity block is present');
    }
  }

  return { params: p, errors: v.errors, warnings: v.warnings, assumptions: v.assumptions };
}

/* ---------- entry ---------- */

function load(text, isJson) {
  if (isJson) {
    var obj;
    try { obj = JSON.parse(text); }
    catch (e) { return { errors: ['file: invalid JSON (' + e.message + ')'], warnings: [], assumptions: [] }; }
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      return { errors: ['file: expected a JSON object'], warnings: [], assumptions: [] };
    }
    var reserved = [];
    var wrapped = wrapJson(obj, reserved);
    if (reserved.length) {
      return { errors: reserved.map(function (k) { return k + ': reserved key is not allowed'; }), warnings: [], assumptions: [] };
    }
    return validate(wrapped);
  }
  var parsed = parseSubset(text);
  if (parsed.errors.length) return { errors: parsed.errors, warnings: [], assumptions: [] };
  return validate(parsed.doc);
}

/* Field groups, published as part of the contract. */
var GROUPS = {
  portfolio_drivers: ['acv', 'cash_monthly_pipeline', 'team.aes_ramped', 'team.aes_ramping',
    'team.gtm_engineer', 'product.self_serve', 'product.developer_facing', 'constraints'],
  capacity_drivers: ['acv', 'cycle_days', 'arr_target_12mo_usd', 'team.aes_ramped', 'team.aes_ramping',
    'team.bdrs', 'team.ses', 'team.sales_leaders', 'team.bdr_managers', 'team.se_leads',
    'team.aes_ramping_tenure_months',
    'capacity.base_arr_usd', 'capacity.churn_pct', 'capacity.expansion_usd'],
  narrative_context: ['company', 'stage', 'funding_usd', 'arr_now_usd', 'icp', 'personas',
    'product.category', 'engines_running']
};

var api = {
  SCHEMA_VERSION: SCHEMA_VERSION, CONSTRAINTS: CONSTRAINTS, ENGINE_KEYS: ENGINE_KEYS,
  STAGES: STAGES, GROUPS: GROUPS, load: load
};
if (typeof module !== 'undefined' && module.exports) module.exports = api;

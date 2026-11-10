"use strict";

// Riftbound Gaming Network locator API (public, no auth).
const API_BASE = "https://api.cloudflare.riftbound.uvsgames.com/hydraproxy/api/v2/events/";

// One entry per search origin: the whole island (Mako 2026-11-10: every island event should be
// listed; before that, Victoria, Courtenay and Campbell River only). Each search is a circle, so
// each is kept small enough that the mainland and the American islands stay outside it. An
// event found by two searches is kept once. An event's area comes from its town (TOWNS below);
// the search's region is only for a town not listed there.
const ANCHORS = [
  { name: "Victoria",       region: "victoria", lat: 48.4335190525,  lng: -123.4028759261, miles: 10 },
  { name: "Sidney",         region: "victoria", lat: 48.6506,        lng: -123.3986,       miles: 6 },
  { name: "Sooke",          region: "victoria", lat: 48.3740,        lng: -123.7276,       miles: 8 },
  { name: "Duncan",         region: "island",   lat: 48.7787,        lng: -123.7079,       miles: 15 },
  { name: "Nanaimo",        region: "island",   lat: 49.1659,        lng: -123.9401,       miles: 20 },
  { name: "Parksville",     region: "island",   lat: 49.3193,        lng: -124.3136,       miles: 12 },
  { name: "Port Alberni",   region: "island",   lat: 49.2339,        lng: -124.8055,       miles: 10 },
  { name: "Courtenay",      region: "island",   lat: 49.6877,        lng: -124.9936,       miles: 10 },
  { name: "Campbell River", region: "island",   lat: 50.0244,        lng: -125.2475,       miles: 10 },
  { name: "Tofino",         region: "island",   lat: 49.1530,        lng: -125.9066,       miles: 25 },
  { name: "Port Hardy",     region: "island",   lat: 50.7213,        lng: -127.4969,       miles: 25 }
];

// Every town on the island, by lower-case name -> its area: Greater Victoria is the Capital
// Region's towns, the rest is the island. A town not listed keeps its search's area and is
// named in the run's summary and an issue (report-anomalies.js), to be added here.
const TOWNS = {
  "victoria": "victoria", "saanich": "victoria", "oak bay": "victoria", "esquimalt": "victoria",
  "view royal": "victoria", "colwood": "victoria", "langford": "victoria", "sidney": "victoria",
  "north saanich": "victoria", "central saanich": "victoria", "saanichton": "victoria",
  "brentwood bay": "victoria", "sooke": "victoria", "metchosin": "victoria", "highlands": "victoria",
  "courtenay": "island", "comox": "island", "cumberland": "island", "campbell river": "island",
  "nanaimo": "island", "lantzville": "island", "ladysmith": "island", "chemainus": "island",
  "duncan": "island", "north cowichan": "island", "lake cowichan": "island", "mill bay": "island",
  "cobble hill": "island", "shawnigan lake": "island", "parksville": "island",
  "qualicum beach": "island", "port alberni": "island", "tofino": "island", "ucluelet": "island",
  "port hardy": "island", "port mcneill": "island", "salt spring island": "island",
  "gabriola": "island", "gabriola island": "island"
};

// event_configuration_template UUID -> our category key.
// Two Summoner Skirmish templates deliberately collapse to one key.
const TYPE_MAP = {
  "3da10c44-6e38-422f-ad46-7dc47f7f839e": "nexus",
  "d657c6b0-f27b-4fd5-8ddf-48bdc334fe9a": "skirmish",
  "c31fb045-2a1d-438f-b2f4-db59f739c7c3": "skirmish",
  "627e8266-d01a-4b47-814e-e468b7f3e697": "learn",
  "906ca3a3-3359-42f6-9d75-f612eb26f298": "open"
};

const TZ = "America/Vancouver";

// Refuse to publish fewer than this many events. Guards against a
// silently-degraded API response overwriting a good file.
const MIN_EVENTS = 10;

// Degradation delta. If unique event count falls by more than this
// fraction against the previous published file, raise a notice. The
// feed still publishes: a real seasonal lull must not blank the
// calendar, and MIN_EVENTS already holds the hard floor. Deliberately
// loose - a false positive trains us to ignore the notices.
const DROP_FRACTION = 0.4;

// PlayRiftbound, Riot's organized-play site, home of island events since
// 2026-09-14. Its event search is a stored GraphQL query read with a plain
// GET. RAVI names itself honestly (client name "ravi"); it never claims to
// be Riot's own site. If Riot changes the stored query, the run fails and
// the last good file stays published.
const RB = {
  base: "https://playriftbound.com/api/gql",
  op: "CompeteTournamentSearch",
  hash: "acbcbba681a9c9a8063f792f7d665ba1eda81b19528b6af19e523f0c2061bec2",
  client: "ravi",
  version: "1.0",
  ua: "VanIsleRiftbound/1.0 (+https://github.com/beifongshopmail-cpu/van-isle-riftbound)",
  // tournamentType -> our category key. Anything else is "other" and is
  // reported as an unknown template, the same path as the old feed.
  types: {
    OPEN_PLAY: "open",
    LEARN_TO_PLAY: "learn",
    NEXUS_NIGHT: "nexus",
    SUMMONER_SKIRMISH: "skirmish",
    PRE_RIFT: "prerift"
  }
};

// Below this count, percentage swings are noise. No delta notice fires
// when either side of the comparison is under this.
const DROP_FLOOR = 20;

// STORE-POSTED EVENTS (plan 2 M8.7, Mako 2026-11-10): a store's own posts, read from Banh
// Mi's daily digest (public repo beifongshopmail-cpu/ravi-news, store_events). A post counts
// from any island town (TOWNS); an event in any other town is left out. A night must be
// confirmed by a digest run within DAYS days.
const STORE_POSTS = {
  base: "https://raw.githubusercontent.com/beifongshopmail-cpu/ravi-news/main/",
  days: 7,
  cities: TOWNS
};

module.exports = { API_BASE, ANCHORS, TYPE_MAP, TZ, MIN_EVENTS, DROP_FRACTION, DROP_FLOOR, RB, STORE_POSTS, TOWNS };

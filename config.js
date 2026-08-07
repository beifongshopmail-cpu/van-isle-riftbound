"use strict";

// Riftbound Gaming Network locator API (public, no auth).
const API_BASE = "https://api.cloudflare.riftbound.uvsgames.com/hydraproxy/api/v2/events/";

// One entry per search origin. Order is load-bearing: an event within
// range of two anchors is attributed to whichever appears first here.
const ANCHORS = [
  { name: "Victoria",       region: "victoria", lat: 48.4335190525,  lng: -123.4028759261, miles: 10 },
  { name: "Courtenay",      region: "island",   lat: 49.6877,        lng: -124.9936,       miles: 10 },
  { name: "Campbell River", region: "island",   lat: 50.0244,        lng: -125.2475,       miles: 10 }
];

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

module.exports = { API_BASE, ANCHORS, TYPE_MAP, TZ, MIN_EVENTS };

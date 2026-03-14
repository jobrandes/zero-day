import { useState, useEffect, useRef } from "react";

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{background:#f0f2f5;font-family:'Barlow',sans-serif;}
::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:#f0f2f5;}::-webkit-scrollbar-thumb{background:#c8d0da;border-radius:2px;}
input[type="date"]::-webkit-calendar-picker-indicator{filter:invert(0.4);}
@keyframes bounce{0%,80%,100%{transform:scale(0);}40%{transform:scale(1);}}
@keyframes spin{to{transform:rotate(360deg);}}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
@keyframes slideUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.5;}}
@keyframes popIn{0%{transform:scale(0.5) translateX(-50%);opacity:0;}70%{transform:scale(1.05) translateX(-50%);}100%{transform:scale(1) translateX(-50%);opacity:1;}}
@keyframes confettiFall{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:0}}
@keyframes celebrationPop{0%{transform:scale(0.3);opacity:0}100%{transform:scale(1);opacity:1}}
`;

const T = {
  bg:"#f0f2f5",white:"#ffffff",surfaceAlt:"#e8ecf0",
  border:"#dde2e8",borderDark:"#c8d0da",
  ink:"#1e2a3a",inkDim:"#4a5568",inkMuted:"#8896a8",
  accent:"#1a56db",accentSoft:"#eff4ff",
  green:"#1db954",greenSoft:"#edfaf1",
  amber:"#f59e0b",amberSoft:"#fffbeb",
  red:"#e53e3e",redSoft:"#fff5f5",
  purple:"#7c3aed",purpleSoft:"#f3f0ff",
};
const TYPE_META = {
  cardio:  {color:T.amber, bg:T.amberSoft, label:"Cardio"},
  strength:{color:T.accent,bg:T.accentSoft,label:"Strength"},
  recovery:{color:T.green, bg:T.greenSoft, label:"Recovery"},
  rest:    {color:T.inkMuted,bg:T.surfaceAlt,label:"Rest"},
};
const OWNER_CODE = "zeroday2025";

// ── T-MINUS COUNTDOWN ─────────────────────────────────────────────
function calcDaysLeft(challengeDate) {
  if (!challengeDate) return null;
  const now = new Date(); now.setHours(0,0,0,0);
  const target = new Date(challengeDate); target.setHours(0,0,0,0);
  return Math.round((target - now) / 86400000);
}
function tminusColor(days, T) {
  if (days === null) return T.accent;
  if (days <= 0) return T.green;
  if (days < 30) return T.red;
  if (days < 60) return T.amber;
  return T.accent;
}
function tminusLabel(days) {
  if (days === null) return { main: "T-?", sub: "set your date" };
  if (days <= 0) return { main: "T-0", sub: "Zero Day is HERE" };
  if (days === 1) return { main: "T-1", sub: "tomorrow" };
  return { main: `T-${days}`, sub: `day${days !== 1 ? "s" : ""} to go` };
}

// ── XP LEVELS ────────────────────────────────────────────────────
const XP_LEVELS = [
  { min:0,    max:149,  name:"Recruit",        icon:"🌱", color:"#8896a8" },
  { min:150,  max:399,  name:"Hiker",          icon:"🥾", color:"#1db954" },
  { min:400,  max:749,  name:"Trekker",        icon:"⛰️", color:"#1a56db" },
  { min:750,  max:1199, name:"Expedition",     icon:"🏔️", color:"#7c3aed" },
  { min:1200, max:9999, name:"Zero Day Ready", icon:"🏆", color:"#f59e0b" },
];
function getLevel(xp) {
  return XP_LEVELS.find(l => xp >= l.min && xp <= l.max) || XP_LEVELS[XP_LEVELS.length-1];
}
function getNextLevel(xp) {
  const idx = XP_LEVELS.findIndex(l => xp >= l.min && xp <= l.max);
  return idx >= 0 && idx < XP_LEVELS.length-1 ? XP_LEVELS[idx+1] : null;
}
function getLevelPct(xp) {
  const lvl = getLevel(xp);
  const next = getNextLevel(xp);
  if (!next) return 100;
  const range = next.min - lvl.min;
  return Math.round(((xp - lvl.min) / range) * 100);
}

// ── UNIVERSAL ACHIEVEMENTS ────────────────────────────────────────
const ACHIEVEMENTS_UNIVERSAL = [
  {id:"first_workout",   icon:"🌅", label:"First Out the Door", desc:"Logged your very first workout",            xp:50,  hint:"Complete any 1 workout"},
  {id:"five_sessions",   icon:"✋", label:"High Five",          desc:"5 sessions in the bank",                    xp:75,  hint:"Complete 5 workouts"},
  {id:"ten_sessions",    icon:"💪", label:"Ten Strong",         desc:"10 sessions completed",                     xp:150, hint:"Complete 10 workouts"},
  {id:"twenty_sessions", icon:"🔥", label:"On Fire",            desc:"20 sessions — you're building momentum",    xp:200, hint:"Complete 20 workouts"},
  {id:"week_one",        icon:"📅", label:"Week 1 Done",        desc:"First full week in the books",              xp:100, hint:"Complete all sessions in a week"},
  {id:"streak_3",        icon:"🔥", label:"3-Week Streak",      desc:"3 consecutive weeks completed",             xp:200, hint:"Complete 3 weeks in a row"},
  {id:"streak_5",        icon:"⚡", label:"5-Week Streak",      desc:"5 weeks straight — elite consistency",      xp:350, hint:"Complete 5 weeks in a row"},
  {id:"no_excuses",      icon:"💯", label:"No Excuses",         desc:"Finished a phase without skipping a week",  xp:150, hint:"Zero skips in a full phase"},
  {id:"bounce_back",     icon:"↩️", label:"Bounce Back",        desc:"Skipped a week then nailed the next one",   xp:125, hint:"Skip a week, then complete the next"},
  {id:"gear_ready",      icon:"🎒", label:"Gear Ready",         desc:"Checked off all gear in a phase",           xp:75,  hint:"Complete a phase gear checklist"},
  {id:"phase_1_done",    icon:"🎯", label:"Phase 1 Complete",   desc:"Foundation phase finished",                 xp:200, hint:"Complete every week in Phase 1"},
  {id:"phase_2_done",    icon:"⚡", label:"Phase 2 Complete",   desc:"Build phase finished — you're stronger",    xp:250, hint:"Complete every week in Phase 2"},
  {id:"phase_3_done",    icon:"🌟", label:"Phase 3 Complete",   desc:"Peak phase done — you're ready",            xp:300, hint:"Complete every week in Phase 3"},
  {id:"halfway",         icon:"🚀", label:"Halfway There",      desc:"50% of your entire plan complete",          xp:300, hint:"Complete half your workouts"},
  {id:"all_done",        icon:"🏆", label:"Zero Day Ready",     desc:"100% of your plan done. Let's go.",         xp:500, hint:"Complete every single workout"},
  {id:"plan_updated",    icon:"🔄", label:"Adapted",            desc:"Coach rebuilt your plan after a setback",   xp:100, hint:"Use the AI coach to update your plan"},
];

// ── CHALLENGE-SPECIFIC ACHIEVEMENTS ──────────────────────────────
const ACHIEVEMENTS_BY_TYPE = {
  "hiking": [
    {id:"ch_pack_hike",    icon:"🌿", label:"Jungle Legs",    desc:"Completed a hike with a loaded pack",      xp:150, hint:"Log a strength or cardio session"},
    {id:"ch_hill_week",    icon:"🏔️", label:"Altitude Ready", desc:"Hit the hills — legs built for climbing",  xp:200, hint:"Complete a hill or incline session"},
    {id:"ch_long_hike",    icon:"🌄", label:"Long Hauler",    desc:"Completed your first long hike session",   xp:150, hint:"Complete a long cardio session (Sat)"},
    {id:"ch_sim_day",      icon:"🧗", label:"Summit Mind",    desc:"Completed your peak simulation day",       xp:250, hint:"Complete Phase 3's Saturday session"},
  ],
  "trekking": [
    {id:"ch_pack_hike",    icon:"🌿", label:"Jungle Legs",    desc:"Completed a hike with a loaded pack",      xp:150, hint:"Log a strength or cardio session"},
    {id:"ch_hill_week",    icon:"🏔️", label:"Altitude Ready", desc:"Hit the hills — legs built for climbing",  xp:200, hint:"Complete a hill or incline session"},
    {id:"ch_long_hike",    icon:"🌄", label:"Long Hauler",    desc:"Completed your first long hike session",   xp:150, hint:"Complete a long cardio session (Sat)"},
    {id:"ch_sim_day",      icon:"🧗", label:"Summit Mind",    desc:"Completed your peak simulation day",       xp:250, hint:"Complete Phase 3's Saturday session"},
  ],
  "road running": [
    {id:"ch_first_long",   icon:"📏", label:"Long Run Club",  desc:"First long run in the books",              xp:150, hint:"Complete a long run session"},
    {id:"ch_intervals",    icon:"⚡", label:"Tempo Master",   desc:"Crushed your first interval session",      xp:150, hint:"Complete an interval/tempo session"},
    {id:"ch_20_sessions",  icon:"🏃", label:"Miles & Miles",  desc:"20 running sessions logged",               xp:200, hint:"Log 20 running workouts"},
    {id:"ch_race_ready",   icon:"🏁", label:"Race Ready",     desc:"Phase 3 complete — you're race-fit",       xp:250, hint:"Complete Phase 3"},
  ],
  "trail running": [
    {id:"ch_first_trail",  icon:"🌲", label:"Trail Blazer",   desc:"First trail run session complete",         xp:150, hint:"Complete a trail run session"},
    {id:"ch_vert",         icon:"⛰️", label:"Vert Junkie",    desc:"Hit an elevation session",                 xp:200, hint:"Complete a hill/vertical session"},
    {id:"ch_long_run",     icon:"📏", label:"Long Hauler",    desc:"First long run in the books",              xp:150, hint:"Complete a long cardio session"},
    {id:"ch_race_ready",   icon:"🏁", label:"Race Ready",     desc:"Phase 3 done — trail-ready",               xp:250, hint:"Complete Phase 3"},
  ],
  "road cycling": [
    {id:"ch_saddle",       icon:"🚴", label:"Saddle Hours",   desc:"First long ride session complete",         xp:150, hint:"Complete a long cycling session"},
    {id:"ch_climbs",       icon:"⛰️", label:"Climb King",     desc:"Smashed a hill interval session",          xp:200, hint:"Complete a hill repeat session"},
    {id:"ch_loaded",       icon:"🎒", label:"Loaded Rider",   desc:"Completed a ride with full gear kit",      xp:150, hint:"Complete a loaded/gear session"},
    {id:"ch_podium",       icon:"🏆", label:"Podium Ready",   desc:"Phase 3 done — race-fit on the bike",      xp:250, hint:"Complete Phase 3"},
  ],
  "mountain biking": [
    {id:"ch_saddle",       icon:"🚵", label:"Trail Shredder", desc:"First trail ride session in the books",    xp:150, hint:"Complete a cycling session"},
    {id:"ch_climbs",       icon:"⛰️", label:"Climb King",     desc:"Hit the hills on the bike",                xp:200, hint:"Complete a hill session"},
    {id:"ch_loaded",       icon:"🎒", label:"Loaded Rider",   desc:"Completed a session with full gear",       xp:150, hint:"Complete a gear/load session"},
    {id:"ch_podium",       icon:"🏆", label:"Trail Boss",     desc:"Phase 3 done — you own the mountain",      xp:250, hint:"Complete Phase 3"},
  ],
  "water sports": [
    {id:"ch_open_water",   icon:"🌊", label:"Open Water",     desc:"First open water session logged",          xp:150, hint:"Complete a swimming session"},
    {id:"ch_brick",        icon:"⚡", label:"Brick Done",     desc:"Completed a multi-discipline session",     xp:200, hint:"Complete a combined session"},
    {id:"ch_gear",         icon:"🦺", label:"Wetsuit On",     desc:"Trained in your full race kit",            xp:100, hint:"Complete a session with gear"},
    {id:"ch_race_fit",     icon:"🏊", label:"Race Fit",       desc:"Phase 3 done — ready to race",             xp:250, hint:"Complete Phase 3"},
  ],
  "snow sports": [
    {id:"ch_first_snow",   icon:"❄️", label:"First Tracks",   desc:"First snow-specific session logged",       xp:150, hint:"Complete a cardio session"},
    {id:"ch_strength",     icon:"🏋️", label:"Leg Burner",     desc:"Completed a leg strength session",         xp:150, hint:"Complete a strength session"},
    {id:"ch_backcountry",  icon:"🗺️", label:"Backcountry",    desc:"A full backcountry simulation session",    xp:200, hint:"Complete a long session"},
    {id:"ch_peak_ready",   icon:"🎿", label:"Peak Ready",     desc:"Phase 3 done — mountain ready",            xp:250, hint:"Complete Phase 3"},
  ],
  "climbing": [
    {id:"ch_core",         icon:"🧗", label:"Core of Steel",  desc:"Core & stability session completed",       xp:150, hint:"Complete a strength session"},
    {id:"ch_footwork",     icon:"🦶", label:"Footwork",       desc:"Balance & footwork session done",          xp:150, hint:"Complete a balance/recovery session"},
    {id:"ch_sim_climb",    icon:"🏔️", label:"Simulation",    desc:"Full simulation climb completed",          xp:200, hint:"Complete Phase 3 Sat session"},
    {id:"ch_summit",       icon:"⛰️", label:"Summit Ready",   desc:"Phase 3 done — summit-ready",              xp:250, hint:"Complete Phase 3"},
  ],
  "mountaineering": [
    {id:"ch_core",         icon:"🧗", label:"Core of Steel",  desc:"Core & stability session completed",       xp:150, hint:"Complete a strength session"},
    {id:"ch_pack_hike",    icon:"🌿", label:"Pack Ready",     desc:"Completed a loaded pack session",          xp:150, hint:"Complete a loaded cardio session"},
    {id:"ch_altitude",     icon:"🏔️", label:"Altitude Ready", desc:"Hit a high-elevation simulation session",  xp:200, hint:"Complete Phase 3 long session"},
    {id:"ch_summit",       icon:"🏆", label:"Summit Ready",   desc:"Phase 3 done — mountain ready",            xp:250, hint:"Complete Phase 3"},
  ],
};
// Fallback for unrecognized challenge types
const ACHIEVEMENTS_FALLBACK_CHALLENGE = [
  {id:"ch_first_session", icon:"⭐", label:"First Session",  desc:"Logged your first challenge-specific session", xp:150, hint:"Complete any session"},
  {id:"ch_strength_done", icon:"💪", label:"Strength Day",   desc:"Completed a strength session",                xp:150, hint:"Complete a strength session"},
  {id:"ch_long_session",  icon:"📏", label:"Long Session",   desc:"Completed a long training session",           xp:200, hint:"Complete a long cardio session"},
  {id:"ch_phase3",        icon:"🌟", label:"Phase 3 Done",   desc:"Phase 3 complete",                            xp:250, hint:"Complete Phase 3"},
];

function getChallengeAchievements(challengeType) {
  const t = (challengeType || "").toLowerCase().trim();
  return ACHIEVEMENTS_BY_TYPE[t] || ACHIEVEMENTS_FALLBACK_CHALLENGE;
}
function getAllAchievements(challengeType) {
  return [...ACHIEVEMENTS_UNIVERSAL, ...getChallengeAchievements(challengeType)];
}

const CATEGORIES = [
  {id:"hiking", label:"Hiking & Trekking",icon:"🥾",bg:"linear-gradient(135deg,#2d6a4f,#52b788)",challenges:[
    {id:"gorilla-trek",label:"Gorilla Trek",      sub:"Uganda / Rwanda",icon:"🦍",location:"Bwindi Impenetrable Forest, Uganda",lat:-1.0333,lon:29.7167},
    {id:"camino",      label:"Camino de Santiago",sub:"Spain",         icon:"⛪",location:"Santiago de Compostela, Spain",     lat:42.8782,lon:-8.5448},
    {id:"inca-trail",  label:"Inca Trail",        sub:"Peru",          icon:"🏛",location:"Machu Picchu, Peru",               lat:-13.163,lon:-72.545},
    {id:"kilimanjaro", label:"Kilimanjaro",        sub:"Tanzania",      icon:"🏔",location:"Kilimanjaro, Tanzania",            lat:-3.0674,lon:37.3556},
    {id:"appalachian", label:"Appalachian Trail",  sub:"USA",           icon:"🌲",location:"Appalachian Trail, USA",           lat:36.5,   lon:-83.5},
    {id:"other-hike",  label:"Other Trek / Hike",  sub:"Tell us more →",icon:"🗺",custom:true},
  ]},
  {id:"cycling",label:"Cycling",          icon:"🚴",bg:"linear-gradient(135deg,#1d4e89,#4a9eff)",challenges:[
    {id:"coast-to-coast",label:"Coast to Coast",    sub:"Self-supported",icon:"🌊",location:"Northern England",    lat:54.0,lon:-2.0},
    {id:"gran-fondo",    label:"Gran Fondo Race",   sub:"Road cycling",  icon:"🏆",location:"European Alps",       lat:45.4,lon:12.3},
    {id:"gravel-race",   label:"Gravel Race 100mi+",sub:"Off-road",      icon:"🪨",location:"Rocky Mountains, USA",lat:39.0,lon:-105.0},
    {id:"other-cycle",   label:"Other Cycling Goal",sub:"Tell us more →",icon:"🚵",custom:true},
  ]},
  {id:"water",  label:"Water & Swimming", icon:"🌊",bg:"linear-gradient(135deg,#0077b6,#00b4d8)",challenges:[
    {id:"ironman",      label:"Ironman Triathlon",sub:"140.6 miles",icon:"⚡",location:"Kailua-Kona, Hawaii",lat:19.6,lon:-155.9},
    {id:"open-water-5k",label:"Open Water 5K",   sub:"Lake / ocean",icon:"🏊",location:"Open water",         lat:51.5,lon:-0.1},
    {id:"sprint-tri",   label:"Sprint Triathlon", sub:"First tri",   icon:"🥇",location:"Varies",            lat:40.7,lon:-74.0},
    {id:"other-water",  label:"Other Water Goal", sub:"Tell us more →",icon:"🌊",custom:true},
  ]},
  {id:"snow",   label:"Snow & Ice",       icon:"⛷",bg:"linear-gradient(135deg,#415a77,#778da9)",challenges:[
    {id:"ski-off-piste",label:"Off-Piste Skiing",sub:"Backcountry",     icon:"🏔",location:"Alps, France/Switzerland",lat:45.9,lon:6.9},
    {id:"arctic-trek",  label:"Arctic Trek",    sub:"Norway / Iceland",icon:"🌨",location:"Tromsø, Norway",        lat:69.6,lon:18.9},
    {id:"glacier-walk", label:"Glacier Walk",   sub:"Iceland",          icon:"🧊",location:"Vatnajökull, Iceland",  lat:64.4,lon:-16.9},
    {id:"other-snow",   label:"Other Snow Goal",sub:"Tell us more →",   icon:"❄️",custom:true},
  ]},
  {id:"climbing",label:"Climbing",        icon:"🧗",bg:"linear-gradient(135deg,#7b2d00,#e07a5f)",challenges:[
    {id:"everest-bc", label:"Everest Base Camp",  sub:"Nepal",       icon:"🏔",location:"Khumbu Valley, Nepal",  lat:28.0,lon:86.9},
    {id:"matterhorn", label:"Matterhorn Summit",  sub:"Switzerland", icon:"🇨🇭",location:"Zermatt, Switzerland", lat:45.9,lon:7.6},
    {id:"via-ferrata",label:"Via Ferrata",         sub:"Dolomites",   icon:"⛰",location:"Dolomites, Italy",      lat:46.5,lon:11.9},
    {id:"other-climb",label:"Other Climbing Goal",sub:"Tell us more →",icon:"🧗",custom:true},
  ]},
  {id:"running",label:"Running & Racing", icon:"🏃",bg:"linear-gradient(135deg,#c1121f,#ff6b6b)",challenges:[
    {id:"marathon",     label:"Full Marathon",    sub:"26.2 miles",   icon:"🏆",location:"Varies",lat:51.5,lon:-0.1},
    {id:"half-marathon",label:"Half Marathon",    sub:"13.1 miles",   icon:"🏅",location:"Varies",lat:51.5,lon:-0.1},
    {id:"ultra",        label:"Ultramarathon 50K+",sub:"Trail / road",icon:"⚡",location:"Varies",lat:37.0,lon:-119.0},
    {id:"spartan",      label:"Spartan Race",     sub:"OCR",          icon:"🛡",location:"Varies",lat:40.7,lon:-74.0},
    {id:"other-run",    label:"Other Running Goal",sub:"Tell us more →",icon:"👟",custom:true},
  ]},
];

const FITNESS_LEVELS = [
  {id:"beginner",label:"Starting Fresh",  desc:"Little to no regular exercise",    icon:"🌱"},
  {id:"some",    label:"Some Activity",   desc:"A few walks or workouts per week", icon:"🚶"},
  {id:"active",  label:"Regularly Active",desc:"Consistent exercise 3–4x/week",   icon:"🏃"},
  {id:"athlete", label:"Athletic",        desc:"Training hard and consistently",   icon:"⚡"},
];

const INJURY_OPTIONS = [
  { id: "knee",     label: "Knee issue",        icon: "🦵", detail: "Post-surgery, pain, or instability" },
  { id: "back",     label: "Back/disc",          icon: "🔩", detail: "Bulging disc, lower back pain" },
  { id: "shoulder", label: "Shoulder",           icon: "💪", detail: "Rotator cuff, impingement" },
  { id: "hip",      label: "Hip",                icon: "🦴", detail: "Hip flexor, bursitis, labrum" },
  { id: "ankle",    label: "Ankle/foot",         icon: "🦶", detail: "Sprain, plantar fasciitis" },
  { id: "cardio",   label: "Low cardio base",    icon: "❤️", detail: "Gets breathless quickly" },
  { id: "none",     label: "No limitations",     icon: "✅", detail: "Ready to train fully" },
];

const PILL_CHALLENGES = [
  {label:"🦍 Gorilla Trek",   challenge:"Gorilla Trek",               location:"Bwindi Impenetrable Forest, Uganda",lat:-1.0333,lon:29.7167},
  {label:"🏔 Kilimanjaro",    challenge:"Kilimanjaro Summit",         location:"Kilimanjaro, Tanzania",            lat:-3.0674,lon:37.3556},
  {label:"🚴 Coast to Coast", challenge:"Coast to Coast Cycling",     location:"Northern England",                 lat:54.0,   lon:-2.0},
  {label:"🏊 Ironman",        challenge:"Ironman Triathlon",          location:"Kailua-Kona, Hawaii",              lat:19.6,   lon:-155.9},
  {label:"⛷ Backcountry Ski",challenge:"Off-Piste Backcountry Skiing",location:"Alps, Switzerland",               lat:46.0,   lon:7.5},
  {label:"🥾 Camino Santiago",challenge:"Camino de Santiago",         location:"Spain",                            lat:42.8782,lon:-8.5448},
  {label:"🏃 First Marathon", challenge:"First Marathon",             location:"",                                 lat:null,   lon:null},
  {label:"🧗 Matterhorn",     challenge:"Matterhorn Summit",          location:"Zermatt, Switzerland",             lat:45.9,   lon:7.6},
];

// ── HELPERS ───────────────────────────────────────────────────
const weeksUntil = d => Math.max(4,Math.min(Math.ceil((new Date(d)-new Date())/(7*864e5)),78));
const formatDate = d => new Date(d).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});
const todayStr   = () => new Date().toISOString().split("T")[0];
const chalMonth  = d => new Date(d).toLocaleString("en-US",{month:"long"});
const daysBetween= (a,b) => Math.floor((new Date(b)-new Date(a))/864e5);

function calcStats(checked, planPhases, startDate, challengeDate) {
  // Total non-rest sessions in the weekly template (across all phases)
  const totalWorkouts = planPhases.reduce((s,p)=>(p.schedule||[]).filter(d=>d.type!=="rest").length+s, 0);

  // How many sessions has the user checked off (all-time, any phase)
  const doneWorkouts = Object.entries(checked).filter(([k,v])=>v&&/^\d+-w\d+-\d+$/.test(k)).length;

  // Progress ring = completion of current week's template
  // (checked items across all phases / total non-rest items across all phases)
  // This answers "how much of this week's schedule have I done?"
  const ringPct = totalWorkouts > 0 ? Math.min(100, Math.round((doneWorkouts / totalWorkouts) * 100)) : 0;
  const pct = ringPct;

  // Days left until challenge
  const daysLeft = challengeDate ? Math.max(0, daysBetween(todayStr(), challengeDate)) : null;

  // Current week = calendar-based, derived from startDate → today
  // startDate is when the user starts their plan (today or a past date)
  let currentWeek = 1;
  if (startDate) {
    const daysDone = Math.max(0, daysBetween(startDate, todayStr()));
    currentWeek = Math.floor(daysDone / 7) + 1;
  }

  // Cap currentWeek at total plan weeks
  const totalPlanWeeks = planPhases.reduce((s, p) => {
    const m = (p.range || "").replace(/\s/g, "").match(/(\d+)[–\-](\d+)/);
    return s + (m ? parseInt(m[2]) - parseInt(m[1]) + 1 : 0);
  }, 0) || Math.ceil((daysLeft || 0) / 7) || 4;

  currentWeek = Math.max(1, Math.min(currentWeek, totalPlanWeeks));

  return { totalWorkouts, doneWorkouts, pct, currentWeek, totalPlanWeeks, daysLeft, ringPct };
}

// ── STREAK CALCULATION ───────────────────────────────────────────
function calcStreak(checked, planPhases) {
  // Walk through all weeks across all phases, find longest current consecutive-complete streak
  const allWeeks = []; // [{pi, wk, nonRestCount, doneCount, isSkipped}]
  planPhases.forEach((p, pi) => {
    const rm = (p.range||"").replace(/\s/g,"").match(/(\d+)[\u2013\-](\d+)/);
    const wStart = rm ? parseInt(rm[1]) : 1;
    const wEnd   = rm ? parseInt(rm[2]) : 4;
    const nonRest = (p.schedule||[]).filter(s => s.type !== "rest");
    for (let wk = wStart; wk <= wEnd; wk++) {
      const done = nonRest.filter((_, si) => !!checked[`${pi}-w${wk}-${si}`]).length;
      const skipped = !!checked[`${pi}-w${wk}-skip`];
      allWeeks.push({ pi, wk, total: nonRest.length, done, skipped });
    }
  });
  // Count consecutive complete (or skipped) weeks from the start
  let streak = 0;
  for (const w of allWeeks) {
    if (w.total > 0 && w.done === w.total) streak++;
    else if (w.skipped) streak++; // skips count as done for streak
    else break;
  }
  return streak;
}

// ── ACHIEVEMENT CHECKER ───────────────────────────────────────────
function checkNewAchievements(checked, planPhases, earnedBefore, challengeType) {
  // FIX: correct key regex — format is "0-w1-0", not "0-w-0"
  const done = Object.entries(checked).filter(([k,v]) => v === true && /^\d+-w\d+-\d+$/.test(k)).length;
  const total = planPhases.reduce((s,p) => (p.schedule||[]).filter(d=>d.type!=="rest").length + s, 0);
  const news  = [];
  const may   = (id, cond) => { if (cond && !earnedBefore.includes(id)) news.push(id); };
  const streak = calcStreak(checked, planPhases);

  // ── Universal: session counts ──
  may("first_workout",   done >= 1);
  may("five_sessions",   done >= 5);
  may("ten_sessions",    done >= 10);
  may("twenty_sessions", done >= 20);
  may("halfway",         total > 0 && done >= Math.floor(total / 2));
  may("all_done",        total > 0 && done >= total);

  // ── Universal: streaks ──
  may("streak_3", streak >= 3);
  may("streak_5", streak >= 5);

  // ── Universal: week_one — first full week complete ──
  planPhases.forEach((p, pi) => {
    const rm = (p.range||"").replace(/\s/g,"").match(/(\d+)[\u2013\-](\d+)/);
    const wStart = rm ? parseInt(rm[1]) : 1;
    const wEnd   = rm ? parseInt(rm[2]) : 4;
    const nonRest = (p.schedule||[]).filter(s => s.type !== "rest");
    let phaseHasSkip = false;
    let phaseAllComplete = true;
    let phaseWeeksComplete = 0;
    for (let wk = wStart; wk <= wEnd; wk++) {
      const wkDone = nonRest.length > 0 && nonRest.every((_, si) => !!checked[`${pi}-w${wk}-${si}`]);
      const wkSkipped = !!checked[`${pi}-w${wk}-skip`];
      if (wkSkipped) phaseHasSkip = true;
      if (!wkDone && !wkSkipped) phaseAllComplete = false;
      if (wkDone) phaseWeeksComplete++;
    }
    // Week 1 done badge (first phase, first week complete)
    if (pi === 0 && nonRest.length > 0) {
      const firstWkDone = nonRest.every((_, si) => !!checked[`0-w${wStart}-${si}`]);
      may("week_one", firstWkDone);
    }
    // Phase badges
    const phaseId = ["phase_1_done","phase_2_done","phase_3_done"][pi];
    if (phaseId && phaseAllComplete && phaseWeeksComplete > 0) may(phaseId, true);
    // No-excuses badge: entire phase, no skips
    if (phaseAllComplete && !phaseHasSkip && phaseWeeksComplete > 0) may("no_excuses", true);
    // Gear ready: gear checklist all checked
    const gearItems = (p.gear||[]);
    const gearDone = gearItems.length > 0 && gearItems.every((_, gi) => !!checked[`gear-${pi}-${gi}`]);
    may("gear_ready", gearDone);
  });

  // ── Bounce back: any phase has a skipped week followed by a complete week ──
  let bounced = false;
  planPhases.forEach((p, pi) => {
    const rm = (p.range||"").replace(/\s/g,"").match(/(\d+)[\u2013\-](\d+)/);
    const wStart = rm ? parseInt(rm[1]) : 1;
    const wEnd   = rm ? parseInt(rm[2]) : 4;
    const nonRest = (p.schedule||[]).filter(s => s.type !== "rest");
    for (let wk = wStart; wk < wEnd; wk++) {
      const thisSkipped = !!checked[`${pi}-w${wk}-skip`];
      const nextDone = nonRest.length > 0 && nonRest.every((_, si) => !!checked[`${pi}-w${wk+1}-${si}`]);
      if (thisSkipped && nextDone) bounced = true;
    }
  });
  may("bounce_back", bounced);

  // ── Challenge-specific badges ──
  const challBadges = getChallengeAchievements(challengeType);
  challBadges.forEach((b, bi) => {
    if (b.id === "ch_pack_hike" || b.id === "ch_long_hike" || b.id === "ch_first_long" ||
        b.id === "ch_saddle"    || b.id === "ch_first_snow" || b.id === "ch_open_water" ||
        b.id === "ch_first_trail" || b.id === "ch_core"     || b.id === "ch_first_session") {
      // Award when first cardio session logged
      may(b.id, done >= 1);
    } else if (b.id === "ch_hill_week" || b.id === "ch_intervals" || b.id === "ch_climbs" ||
               b.id === "ch_vert"       || b.id === "ch_brick"     || b.id === "ch_footwork" ||
               b.id === "ch_strength"   || b.id === "ch_strength_done") {
      // Award when 5+ sessions logged
      may(b.id, done >= 5);
    } else if (b.id === "ch_loaded"     || b.id === "ch_gear"      || b.id === "ch_backcountry" ||
               b.id === "ch_altitude"   || b.id === "ch_long_run"  || b.id === "ch_long_session" ||
               b.id === "ch_20_sessions") {
      // Award when 10+ sessions logged
      may(b.id, done >= 10);
    } else if (b.id === "ch_sim_day"    || b.id === "ch_race_ready"|| b.id === "ch_podium"      ||
               b.id === "ch_race_fit"   || b.id === "ch_peak_ready"|| b.id === "ch_summit"      ||
               b.id === "ch_sim_climb"  || b.id === "ch_phase3") {
      // Award when phase 3 done (earnedBefore has "phase_3_done")
      may(b.id, earnedBefore.includes("phase_3_done") || news.includes("phase_3_done"));
    }
  });

  return news;
}

function calcXP(earned, challengeType) {
  const all = getAllAchievements(challengeType || "hiking");
  return earned.reduce((s,id) => s + (all.find(a=>a.id===id)?.xp || 0), 0);
}

// Geocode a city name to lat/lon using Nominatim
async function geocodeCity(city) {
  if(!city||!city.trim()) return null;
  try {
    const res=await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`);
    if(!res.ok) return null;
    const data=await res.json();
    if(!data?.length) return null;
    return {lat:parseFloat(data[0].lat),lon:parseFloat(data[0].lon)};
  } catch(e) { return null; }
}

// Multi-strategy weather fetch — tries 4 approaches before giving up
function fetchWithTimeout(url, ms=7000) {
  const ctrl = new AbortController();
  const tid = setTimeout(()=>ctrl.abort(), ms);
  return fetch(url, {signal:ctrl.signal}).finally(()=>clearTimeout(tid));
}

async function fetchWeather(lat,lon,dateStr) {
  if(!lat||!lon||!dateStr) return null;
  const month = new Date(dateStr).getMonth()+1;
  const pad = n=>String(n).padStart(2,'0');

  const parseArchive = (data, labelMonth, year) => {
    const mx=(data.daily?.temperature_2m_max||[]).filter(v=>v!=null);
    const mn=(data.daily?.temperature_2m_min||[]).filter(v=>v!=null);
    const pr=(data.daily?.precipitation_sum||[]).filter(v=>v!=null);
    if(!mx.length) return null;
    return {
      avgMax:(mx.reduce((s,v)=>s+v,0)/mx.length).toFixed(1),
      avgMin:(mn.length?(mn.reduce((s,v)=>s+v,0)/mn.length).toFixed(1):"—"),
      rain:pr.length?pr.reduce((s,v)=>s+v,0).toFixed(0):"—",
      month:labelMonth, year, isForecast:false,
    };
  };

  // 1. Archive API — try 2023, 2022, 2024 in order
  for(const yr of [2023,2022,2024]) {
    try {
      const s=`${yr}-${pad(month)}-01`, e=`${yr}-${pad(month)}-${pad(new Date(yr,month,0).getDate())}`;
      const res=await fetchWithTimeout(`https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${s}&end_date=${e}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=UTC`);
      if(!res.ok) continue;
      const data=await res.json();
      const r=parseArchive(data, chalMonth(dateStr), yr);
      if(r) return r;
    } catch(e) { continue; }
  }

  // 2. Forecast API — 16-day average as fallback (different endpoint, often works when archive doesn't)
  try {
    const res=await fetchWithTimeout(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&forecast_days=16&timezone=UTC`);
    if(res.ok){
      const data=await res.json();
      const r=parseArchive(data,"Current 16-day avg","now");
      if(r) return {...r, isForecast:true};
    }
  } catch(e) {}

  return null;
}

function ProgressRing({pct,size=44,stroke=4,color=T.accent,label}) {
  const r=(size-stroke*2)/2, circ=2*Math.PI*r, offset=circ-(pct/100)*circ;
  return (
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.border} strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{transition:"stroke-dashoffset 0.6s ease"}}/>
      </svg>
      {label&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color,lineHeight:1}}>{label}</div>}
    </div>
  );
}

// ── "I DID IT" COMPLETION FLOW ───────────────────────────────────
const COMPLETION_QUOTES = [
  "I showed up when it was hard.",
  "The mountain didn't know my name. Now it does.",
  "Trained for this. Ready for anything.",
  "I made a promise to myself. I kept it.",
  "They said it was ambitious. They weren't wrong.",
  "Every session built to this moment.",
];

function IDidItFlow({plan, challengeData, earnedBadges, xpTotal, challengeType, onClose}) {
  const [step, setStep] = useState(0); // 0=celebrate, 1=reflect, 2=card
  const [feeling, setFeeling] = useState(null);
  const [worth, setWorth] = useState(null);
  const [cardReady, setCardReady] = useState(false);
  const canvasRef = useRef(null);

  const challengeName = plan?.challengeName || "Your Challenge";
  const locationName = plan?.locationName || challengeData?.locationName || challengeData?.city || "";
  const totalWeeks = plan?.phases
    ? plan.phases.reduce((s,p) => {
        const rm = (p.range||"").replace(/\s/g,"").match(/(\d+)[\u2013\-](\d+)/);
        return s + (rm ? parseInt(rm[2]) - parseInt(rm[1]) + 1 : 4);
      }, 0)
    : 0;
  const lvl = getLevel(xpTotal);
  const quote = COMPLETION_QUOTES[Math.floor(Math.random() * COMPLETION_QUOTES.length)];
  const todayStr = new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});

  // Draw the shareable card on canvas
  useEffect(() => {
    if (step !== 2) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = 1080, H = 1080;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");

    // Background — dark dramatic
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#0a1628");
    grad.addColorStop(0.5, "#0d1f3c");
    grad.addColorStop(1, "#0a1628");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Subtle grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    // Top accent bar
    const bar = ctx.createLinearGradient(0, 0, W, 0);
    bar.addColorStop(0, "#1a56db"); bar.addColorStop(0.5, "#7c3aed"); bar.addColorStop(1, "#1a56db");
    ctx.fillStyle = bar; ctx.fillRect(0, 0, W, 8);

    // ZERO DAY logo text
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.font = "bold 32px 'Arial'";
    ctx.letterSpacing = "8px";
    ctx.fillText("ZERO DAY", 80, 80);

    // Checkmark circle
    ctx.strokeStyle = "#1db954"; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(W - 100, 80, 30, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "#1db954"; ctx.font = "bold 36px Arial";
    ctx.textAlign = "center"; ctx.fillText("✓", W - 100, 92); ctx.textAlign = "left";

    // Challenge name — huge
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 italic 88px 'Arial Narrow'";
    const nameLines = challengeName.length > 18
      ? [challengeName.slice(0, challengeName.lastIndexOf(" ", 18)) || challengeName.slice(0,18),
         challengeName.slice((challengeName.lastIndexOf(" ", 18) || 18) + 1)]
      : [challengeName];
    nameLines.forEach((line, i) => ctx.fillText(line.toUpperCase(), 80, 240 + i * 95));

    // Location
    if (locationName) {
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "300 36px Arial";
      ctx.fillText("📍 " + locationName, 80, 240 + nameLines.length * 95 + 10);
    }

    // Divider
    const divY = 500;
    ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(80, divY); ctx.lineTo(W - 80, divY); ctx.stroke();

    // Stats row
    const stats = [
      { val: totalWeeks + " wks", lbl: "trained" },
      { val: xpTotal + " xp",    lbl: "earned" },
      { val: lvl.icon + " " + lvl.name, lbl: "level" },
    ];
    stats.forEach((s, i) => {
      const x = 80 + i * 310;
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 54px 'Arial Narrow'";
      ctx.fillText(s.val.toUpperCase(), x, divY + 70);
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "300 26px Arial";
      ctx.fillText(s.lbl.toUpperCase(), x, divY + 106);
    });

    // Quote
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "italic 34px Georgia";
    const qX = 80, qY = divY + 190;
    ctx.fillText('"' + quote + '"', qX, qY);

    // Date
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "300 28px Arial";
    ctx.fillText(todayStr, 80, H - 80);

    // Bottom accent
    ctx.fillStyle = bar; ctx.fillRect(0, H - 8, W, 8);

    setCardReady(true);
  }, [step]);

  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      const file = new File([blob], "zero-day-complete.png", { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try { await navigator.share({ files: [file], title: challengeName + " — Zero Day ✓" }); return; } catch {}
      }
      // Fallback: download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "zero-day-complete.png"; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  };

  const FEELINGS = ["😭","😤","😊","🤩"];
  const WORTHS = ["Absolutely","Mostly","It was hard"];

  return (
    <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(8,14,26,0.97)",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      padding:24,overflowY:"auto"}}>

      {/* STEP 0 — BIG CELEBRATION */}
      {step === 0 && (
        <div style={{textAlign:"center",animation:"celebrationPop 0.6s cubic-bezier(0.34,1.56,0.64,1)"}}>
          <div style={{fontSize:100,lineHeight:1,marginBottom:16,
            animation:"celebrationPop 0.8s cubic-bezier(0.34,1.56,0.64,1) 0.1s both"}}>🏆</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:64,
            color:"#fff",letterSpacing:"0.04em",lineHeight:0.95,textTransform:"uppercase",
            marginBottom:8,textShadow:"0 0 40px rgba(245,158,11,0.5)"}}>
            YOU DID IT.
          </div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:28,
            color:"rgba(255,255,255,0.6)",letterSpacing:"0.1em",textTransform:"uppercase",
            marginBottom:32}}>{challengeName}</div>
          <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",marginBottom:32}}>
            {[lvl.icon + " " + lvl.name, xpTotal + " XP", totalWeeks + " weeks"].map((s,i)=>(
              <span key={i} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",
                borderRadius:30,padding:"8px 18px",fontSize:15,fontWeight:700,color:"#fff"}}>{s}</span>
            ))}
          </div>
          <button onClick={() => setStep(1)} style={{background:"#1a56db",border:"none",borderRadius:14,
            padding:"16px 40px",fontSize:18,fontWeight:800,color:"#fff",cursor:"pointer",
            fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.05em",textTransform:"uppercase"}}>
            Continue →
          </button>
        </div>
      )}

      {/* STEP 1 — REFLECT */}
      {step === 1 && (
        <div style={{textAlign:"center",maxWidth:360,width:"100%"}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:32,
            color:"#fff",marginBottom:8}}>How do you feel?</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.5)",marginBottom:24}}>
            Just for you — no right answer.
          </div>
          <div style={{display:"flex",gap:12,justifyContent:"center",marginBottom:32}}>
            {FEELINGS.map(f => (
              <button key={f} onClick={()=>setFeeling(f)} style={{fontSize:44,background:"none",border:"none",
                cursor:"pointer",padding:8,borderRadius:12,
                background: feeling===f ? "rgba(255,255,255,0.15)" : "transparent",
                transition:"all 0.15s",transform: feeling===f ? "scale(1.2)" : "scale(1)"}}>{f}</button>
            ))}
          </div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:28,
            color:"#fff",marginBottom:16}}>Was it worth it?</div>
          <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",marginBottom:36}}>
            {WORTHS.map(w => (
              <button key={w} onClick={()=>setWorth(w)} style={{background: worth===w ? "rgba(26,86,219,0.5)" : "rgba(255,255,255,0.08)",
                border: "1px solid " + (worth===w ? "#1a56db" : "rgba(255,255,255,0.15)"),
                borderRadius:30,padding:"10px 20px",fontSize:15,fontWeight:600,color:"#fff",
                cursor:"pointer",transition:"all 0.15s"}}>{w}</button>
            ))}
          </div>
          <button onClick={() => setStep(2)}
            disabled={!feeling || !worth}
            style={{background: feeling && worth ? "#1a56db" : "rgba(255,255,255,0.1)",
              border:"none",borderRadius:14,padding:"16px 40px",fontSize:18,fontWeight:800,
              color: feeling && worth ? "#fff" : "rgba(255,255,255,0.3)",cursor: feeling && worth ? "pointer" : "default",
              fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.05em",textTransform:"uppercase",
              transition:"all 0.2s"}}>
            Get My Card →
          </button>
        </div>
      )}

      {/* STEP 2 — SHAREABLE CARD */}
      {step === 2 && (
        <div style={{width:"100%",maxWidth:400,textAlign:"center"}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:26,
            color:"#fff",marginBottom:4,textTransform:"uppercase"}}>Your Zero Day Card</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.5)",marginBottom:16}}>
            Share it. You earned it.
          </div>
          {/* Canvas card preview */}
          <canvas ref={canvasRef} style={{width:"100%",borderRadius:12,
            boxShadow:"0 20px 60px rgba(0,0,0,0.6)",marginBottom:20,
            display: cardReady ? "block" : "none"}} />
          {!cardReady && <div style={{height:200,display:"flex",alignItems:"center",
            justifyContent:"center",color:"rgba(255,255,255,0.4)",fontSize:14}}>
            Generating your card...
          </div>}
          {cardReady && <>
            <button onClick={handleShare} style={{width:"100%",background:"#1a56db",border:"none",
              borderRadius:14,padding:"16px 0",fontSize:18,fontWeight:800,color:"#fff",
              cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",
              letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:10}}>
              📤 Share Your Achievement
            </button>
            <button onClick={onClose} style={{width:"100%",background:"rgba(255,255,255,0.08)",
              border:"1px solid rgba(255,255,255,0.15)",borderRadius:14,padding:"14px 0",
              fontSize:15,fontWeight:600,color:"rgba(255,255,255,0.7)",cursor:"pointer"}}>
              Close
            </button>
          </>}
        </div>
      )}
    </div>
  );
}

// ── COUNTDOWN MODAL ──────────────────────────────────────────────
function CountdownModal({plan, challengeData, challengeDate, onClose}) {
  const days = calcDaysLeft(challengeDate);
  const col = tminusColor(days, T);
  const { main, sub } = tminusLabel(days);
  const locationName = plan?.locationName || challengeData?.locationName || challengeData?.city || "";
  const challengeName = plan?.challengeName || "your challenge";
  const totalWeeks = plan?.phases
    ? plan.phases.reduce((s,p) => {
        const rm = (p.range||"").replace(/\s/g,"").match(/(\d+)[\u2013\-](\d+)/);
        return s + (rm ? parseInt(rm[2]) - parseInt(rm[1]) + 1 : 4);
      }, 0)
    : 0;
  const dateStr = challengeDate
    ? new Date(challengeDate).toLocaleDateString("en-US", {weekday:"long",month:"long",day:"numeric",year:"numeric"})
    : "Date not set";

  // Phases countdown breakdown
  const segments = days && days > 0 && totalWeeks > 0
    ? [
        { label:"Training", pct: Math.min(100, Math.round((days / (totalWeeks * 7)) * 80)), color: T.accent },
        { label:"Taper",    pct: 10, color: T.amber },
        { label:"Zero Day", pct: 10, color: col },
      ]
    : [];

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200,
      display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:T.bg,borderRadius:"20px 20px 0 0",
        width:"100%",maxWidth:500,padding:"24px 20px 44px",overflowY:"auto",maxHeight:"90vh"}}>
        
        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:20,
            color:T.ink,letterSpacing:"0.03em",textTransform:"uppercase"}}>Mission Clock</div>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,
            color:T.inkMuted,cursor:"pointer",padding:4}}>✕</button>
        </div>

        {/* Big countdown */}
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,
            fontSize: days !== null && days >= 100 ? 96 : 112,
            color: col, letterSpacing:"-0.02em", lineHeight:0.9,
            textShadow: "0 0 40px " + col + "40"}}>
            {main}
          </div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:18,
            color:col,letterSpacing:"0.15em",textTransform:"uppercase",marginTop:8,opacity:0.8}}>
            {sub}
          </div>
          <div style={{fontSize:13,color:T.inkMuted,marginTop:6}}>{dateStr}</div>
        </div>

        {/* Challenge card */}
        <div style={{background:T.white,borderRadius:16,padding:"16px 18px",
          border:"1px solid "+T.border,marginBottom:16}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,
            fontSize:24,color:T.ink,letterSpacing:"0.02em",marginBottom:2}}>{challengeName}</div>
          {locationName && <div style={{fontSize:13,color:T.inkMuted,marginBottom:12}}>
            📍 {locationName}
          </div>}
          {/* Timeline bar */}
          {days && days > 0 && (
            <div>
              <div style={{display:"flex",height:8,borderRadius:4,overflow:"hidden",gap:2,marginBottom:6}}>
                <div style={{flex:8,background:T.accent,borderRadius:"4px 0 0 4px"}}/>
                <div style={{flex:1,background:T.amber}}/>
                <div style={{width:8,background:col,borderRadius:"0 4px 4px 0"}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,
                color:T.inkMuted,letterSpacing:"0.05em",textTransform:"uppercase"}}>
                <span>Training</span><span>Taper</span><span style={{color:col,fontWeight:700}}>ZERO DAY</span>
              </div>
            </div>
          )}
          {days !== null && days <= 0 && (
            <div style={{textAlign:"center",padding:"8px 0",fontFamily:"'Barlow Condensed',sans-serif",
              fontWeight:900,fontSize:20,color:T.green}}>
              ✓ YOU MADE IT
            </div>
          )}
        </div>

        {/* Motivational line */}
        {days !== null && days > 0 && (
          <div style={{textAlign:"center",fontSize:14,fontStyle:"italic",
            color:T.inkDim,padding:"0 16px"}}>
            {days > 60
              ? `${Math.round(days/7)} weeks to build something extraordinary.`
              : days > 30
              ? "The final stretch. Everything now counts double."
              : "This is it. Every session from here is gold."}
          </div>
        )}
      </div>
    </div>
  );
}

// ── MILESTONE CELEBRATION (full-screen) ─────────────────────────
function MilestoneCelebration({badge,xp,newLevel,onDone}) {
  useEffect(()=>{const t=setTimeout(onDone,5000);return()=>clearTimeout(t);},[]);
  const particles = Array.from({length:18},(_,i)=>({
    x: 10 + (i % 9) * 10,
    delay: (i * 0.12).toFixed(2),
    color: ["#f59e0b","#1a56db","#1db954","#7c3aed","#e53e3e"][i%5],
    size: 8 + (i % 4) * 3,
  }));
  return (
    <div onClick={onDone} style={{position:"fixed",inset:0,zIndex:1000,
      background:"rgba(10,18,30,0.92)",display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",padding:32}}>
      {/* Confetti particles */}
      <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none"}}>
        {particles.map((p,i)=>(
          <div key={i} style={{position:"absolute",left:p.x+"%",top:-20,
            width:p.size,height:p.size,borderRadius:p.size/2,background:p.color,
            animation:`confettiFall 2s ease-in ${p.delay}s forwards`}}/>
        ))}
      </div>
      <div style={{textAlign:"center",animation:"celebrationPop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards"}}>
        <div style={{fontSize:80,lineHeight:1,marginBottom:16,filter:"drop-shadow(0 0 30px rgba(245,158,11,0.6))"}}>{badge.icon}</div>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.2em",textTransform:"uppercase",
          color:T.amber,marginBottom:8}}>Achievement Unlocked!</div>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:36,
          color:"#fff",marginBottom:6,letterSpacing:"0.02em"}}>{badge.label}</div>
        <div style={{fontSize:15,color:"rgba(255,255,255,0.7)",marginBottom:20,maxWidth:280}}>{badge.desc}</div>
        <div style={{display:"inline-flex",alignItems:"center",gap:10,
          background:"rgba(255,255,255,0.1)",borderRadius:30,padding:"10px 22px",
          border:"1px solid rgba(255,255,255,0.2)"}}>
          <span style={{fontSize:22,fontWeight:800,color:T.amber}}>+{xp} XP</span>
          {newLevel && <>
            <span style={{color:"rgba(255,255,255,0.4)"}}>·</span>
            <span style={{fontSize:14,fontWeight:700,color:"#fff"}}>
              {newLevel.icon} {newLevel.name} reached!
            </span>
          </>}
        </div>
        <div style={{marginTop:24,fontSize:12,color:"rgba(255,255,255,0.4)"}}>Tap anywhere to continue</div>
      </div>
    </div>
  );
}

// ── BADGE TOAST ──────────────────────────────────────────────
function BadgeToast({badge,onDone}) {
  useEffect(()=>{const t=setTimeout(onDone,3500);return()=>clearTimeout(t);},[]);
  return (
    <div style={{position:"fixed",bottom:110,left:"50%",transform:"translateX(-50%)",zIndex:999,animation:"popIn 0.4s ease forwards",background:T.white,borderRadius:16,padding:"13px 20px",boxShadow:"0 8px 32px rgba(0,0,0,0.18)",border:`2px solid ${T.amber}`,display:"flex",alignItems:"center",gap:11,minWidth:220,maxWidth:"calc(100vw - 48px)"}}>
      <span style={{fontSize:30}}>{badge.icon}</span>
      <div style={{flex:1}}>
        <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",color:T.amber,marginBottom:1}}>Achievement Unlocked!</div>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:15,color:T.ink}}>{badge.label}</div>
        <div style={{fontSize:11,color:T.inkDim}}>{badge.desc}</div>
      </div>
      <div style={{background:T.amberSoft,borderRadius:20,padding:"2px 8px",fontSize:11,fontWeight:700,color:T.amber,flexShrink:0}}>+{badge.xp}xp</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// LANDING
// ═══════════════════════════════════════════════════════════
function Landing({onStart,onStartWithChallenge}) {
  return (
    <div style={{fontFamily:"'Barlow',sans-serif",background:T.bg,minHeight:"100vh"}}>
      <style>{FONTS}</style>
      <nav style={{padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",background:T.white,borderBottom:`1px solid ${T.border}`}}>
        <button onClick={()=>window.scrollTo(0,0)} style={{background:"none",border:"none",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:22,letterSpacing:"0.05em",color:T.ink}}>ZERO<span style={{color:T.accent}}>DAY</span></button>
        <button onClick={onStart} style={{background:T.accent,color:T.white,border:"none",borderRadius:6,padding:"9px 22px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Barlow',sans-serif"}}>Get Started</button>
      </nav>
      <div style={{padding:"56px 16px 48px",maxWidth:660,margin:"0 auto",textAlign:"center"}}>
        <div style={{display:"inline-block",background:T.accentSoft,color:T.accent,fontSize:11,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",padding:"6px 16px",borderRadius:20,marginBottom:28}}>Your challenge. Your countdown.</div>
        <h1 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:"clamp(52px,10vw,88px)",fontWeight:900,lineHeight:0.92,letterSpacing:"-0.02em",color:T.ink,marginBottom:24,textTransform:"uppercase"}}>TRAIN FOR<br/><span style={{color:T.accent}}>ANYTHING.</span></h1>
        <p style={{fontSize:17,color:T.inkDim,lineHeight:1.7,fontWeight:300,maxWidth:480,margin:"0 auto 40px"}}>Tell us your bucket-list challenge and when it's happening. Zero Day builds a personalized week-by-week plan — workouts, AI coaching, gear, maps, and weather.</p>
        <button onClick={onStart} style={{background:T.accent,color:T.white,border:"none",borderRadius:8,padding:"17px 44px",fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.08em",textTransform:"uppercase",boxShadow:`0 8px 32px rgba(26,86,219,0.3)`}}>Build My Plan →</button>
        <div style={{marginTop:48}}>
          <p style={{fontSize:11,color:T.inkMuted,fontWeight:600,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:14}}>Quick start — tap a challenge</p>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center"}}>
            {PILL_CHALLENGES.map(p=>(
              <button key={p.label} onClick={()=>onStartWithChallenge(p)} style={{fontSize:13,color:T.inkDim,background:T.white,border:`1px solid ${T.border}`,borderRadius:20,padding:"8px 16px",fontWeight:600,cursor:"pointer",fontFamily:"'Barlow',sans-serif",transition:"all 0.15s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accent;e.currentTarget.style.color=T.accent;e.currentTarget.style.background=T.accentSoft;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.inkDim;e.currentTarget.style.background=T.white;}}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={{background:"#1e2a3a",padding:"32px 28px",display:"flex",justifyContent:"center",gap:56,flexWrap:"wrap"}}>
        {[["50+","Challenge Types"],["1–78","Weeks Planned"],["100%","Personalized"],["Free","To Start"]].map(([v,l])=>(
          <div key={l} style={{textAlign:"center"}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:34,fontWeight:800,color:T.accent}}>{v}</div>
            <div style={{fontSize:11,color:"#778899",fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",marginTop:2}}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ONBOARDING
// ═══════════════════════════════════════════════════════════
const CITY_DATA = [
  ["New York, NY",40.7128,-74.006],
  ["Los Angeles, CA",34.0522,-118.2437],
  ["Chicago, IL",41.8781,-87.6298],
  ["Houston, TX",29.7604,-95.3698],
  ["Phoenix, AZ",33.4484,-112.074],
  ["Philadelphia, PA",39.9526,-75.1652],
  ["San Antonio, TX",29.4241,-98.4936],
  ["San Diego, CA",32.7157,-117.1611],
  ["Dallas, TX",32.7767,-96.797],
  ["San Jose, CA",37.3382,-121.8863],
  ["Austin, TX",30.2672,-97.7431],
  ["Jacksonville, FL",30.3322,-81.6557],
  ["San Francisco, CA",37.7749,-122.4194],
  ["Columbus, OH",39.9612,-82.9988],
  ["Charlotte, NC",35.2271,-80.8431],
  ["Indianapolis, IN",39.7684,-86.1581],
  ["Seattle, WA",47.6062,-122.3321],
  ["Denver, CO",39.7392,-104.9903],
  ["Washington DC",38.9072,-77.0369],
  ["Nashville, TN",36.1627,-86.7816],
  ["Oklahoma City, OK",35.4676,-97.5164],
  ["El Paso, TX",31.7619,-106.485],
  ["Boston, MA",42.3601,-71.0589],
  ["Portland, OR",45.5051,-122.675],
  ["Las Vegas, NV",36.1699,-115.1398],
  ["Memphis, TN",35.1495,-90.049],
  ["Louisville, KY",38.2527,-85.7585],
  ["Baltimore, MD",39.2904,-76.6122],
  ["Milwaukee, WI",43.0389,-87.9065],
  ["Albuquerque, NM",35.0844,-106.6504],
  ["Tucson, AZ",32.2226,-110.9747],
  ["Fresno, CA",36.7378,-119.7871],
  ["Sacramento, CA",38.5816,-121.4944],
  ["Kansas City, MO",39.0997,-94.5786],
  ["Mesa, AZ",33.4152,-111.8315],
  ["Atlanta, GA",33.749,-84.388],
  ["Omaha, NE",41.2565,-95.9345],
  ["Colorado Springs, CO",38.8339,-104.8214],
  ["Raleigh, NC",35.7796,-78.6382],
  ["Miami, FL",25.7617,-80.1918],
  ["Minneapolis, MN",44.9778,-93.265],
  ["Tampa, FL",27.9506,-82.4572],
  ["Tulsa, OK",36.154,-95.9928],
  ["Arlington, TX",32.7357,-97.1081],
  ["New Orleans, LA",29.9511,-90.0715],
  ["Wichita, KS",37.6872,-97.3301],
  ["Cleveland, OH",41.4993,-81.6944],
  ["Bakersfield, CA",35.3733,-119.0187],
  ["Aurora, CO",39.7294,-104.8319],
  ["Anaheim, CA",33.8366,-117.9143],
  ["Santa Ana, CA",33.7455,-117.8677],
  ["Corpus Christi, TX",27.8006,-97.3964],
  ["Riverside, CA",33.9533,-117.3962],
  ["Lexington, KY",38.0406,-84.5037],
  ["Pittsburgh, PA",40.4406,-79.9959],
  ["Stockton, CA",37.9577,-121.2908],
  ["Anchorage, AK",61.2181,-149.9003],
  ["Cincinnati, OH",39.1031,-84.512],
  ["St. Paul, MN",44.9537,-93.09],
  ["Greensboro, NC",36.0726,-79.792],
  ["Toledo, OH",41.6528,-83.5379],
  ["Newark, NJ",40.7357,-74.1724],
  ["Orlando, FL",28.5383,-81.3792],
  ["St. Louis, MO",38.627,-90.1994],
  ["Fort Worth, TX",32.7555,-97.3308],
  ["Madison, WI",43.0731,-89.4012],
  ["Lubbock, TX",33.5779,-101.8552],
  ["Boise, ID",43.615,-116.2023],
  ["Salt Lake City, UT",40.7608,-111.891],
  ["Honolulu, HI",21.3069,-157.8583],
  ["Spokane, WA",47.6588,-117.426],
  ["Richmond, VA",37.5407,-77.436],
  ["Des Moines, IA",41.5868,-93.625],
  ["Birmingham, AL",33.5186,-86.8104],
  ["Montgomery, AL",32.3617,-86.2792],
  ["Huntsville, AL",34.7304,-86.5861],
  ["Rochester, NY",43.1566,-77.6088],
  ["Yonkers, NY",40.9312,-73.8988],
  ["Glendale, AZ",33.5387,-112.186],
  ["Scottsdale, AZ",33.4942,-111.9261],
  ["Chandler, AZ",33.3062,-111.8413],
  ["Henderson, NV",36.0397,-114.9817],
  ["North Las Vegas, NV",36.1989,-115.1175],
  ["Reno, NV",39.5296,-119.8138],
  ["Sparks, NV",39.5349,-119.7527],
  ["Carson City, NV",39.1638,-119.7674],
  ["South Lake Tahoe, CA",38.9399,-119.9772],
  ["Lake Tahoe, CA",39.0968,-120.0324],
  ["Tahoe City, CA",39.1677,-120.1453],
  ["Truckee, CA",39.328,-120.1833],
  ["Aspen, CO",39.1911,-106.8175],
  ["Vail, CO",39.6433,-106.3781],
  ["Telluride, CO",37.9375,-107.8123],
  ["Breckenridge, CO",39.4817,-106.0384],
  ["Steamboat Springs, CO",40.485,-106.8317],
  ["Estes Park, CO",40.3772,-105.5217],
  ["Moab, UT",38.5733,-109.5498],
  ["Zion, UT",37.2982,-113.0263],
  ["Bryce Canyon, UT",37.6283,-112.1677],
  ["Park City, UT",40.6461,-111.498],
  ["Jackson Hole, WY",43.4799,-110.7624],
  ["Yellowstone, WY",44.428,-110.5885],
  ["Grand Teton, WY",43.7904,-110.6818],
  ["Bozeman, MT",45.677,-111.0429],
  ["Missoula, MT",46.8721,-113.994],
  ["Glacier National Park, MT",48.696,-113.718],
  ["Billings, MT",45.7833,-108.5007],
  ["Sun Valley, ID",43.6963,-114.3513],
  ["Coeur d'Alene, ID",47.6777,-116.7805],
  ["Flagstaff, AZ",35.1983,-111.6513],
  ["Sedona, AZ",34.8697,-111.7609],
  ["Grand Canyon, AZ",36.0544,-112.1401],
  ["Bend, OR",44.0582,-121.3153],
  ["Crater Lake, OR",42.8684,-122.1685],
  ["Eugene, OR",44.0521,-123.0868],
  ["Ashland, OR",42.1946,-122.7094],
  ["Bellingham, WA",48.7519,-122.4787],
  ["Olympia, WA",47.0379,-122.9007],
  ["Mount Rainier, WA",46.8799,-121.7269],
  ["Whidbey Island, WA",48.174,-122.636],
  ["Mammoth Lakes, CA",37.6485,-118.9721],
  ["Bishop, CA",37.3635,-118.3951],
  ["Yosemite, CA",37.8651,-119.5383],
  ["Big Sur, CA",36.2704,-121.8081],
  ["Santa Barbara, CA",34.4208,-119.6982],
  ["Santa Cruz, CA",36.9741,-122.0308],
  ["Palm Springs, CA",33.8303,-116.5453],
  ["Joshua Tree, CA",33.8734,-115.901],
  ["Death Valley, CA",36.5323,-116.9325],
  ["Napa, CA",38.2975,-122.2869],
  ["Sonoma, CA",38.2919,-122.458],
  ["Taos, NM",36.4072,-105.5731],
  ["Santa Fe, NM",35.687,-105.9378],
  ["Carlsbad Caverns, NM",32.1479,-104.5568],
  ["Durango, CO",37.2753,-107.8801],
  ["Crested Butte, CO",38.8697,-106.9878],
  ["Leadville, CO",39.2508,-106.2925],
  ["Glenwood Springs, CO",39.5505,-107.3248],
  ["Appalachian Trail, GA",34.627,-84.1941],
  ["Appalachian Trail, ME",45.9041,-69.8823],
  ["Shenandoah, VA",38.529,-78.468],
  ["Blue Ridge Parkway, NC",35.7596,-82.2652],
  ["Great Smoky Mountains, NC",35.6532,-83.507],
  ["Acadia, ME",44.3386,-68.2733],
  ["Bar Harbor, ME",44.3876,-68.2039],
  ["Burlington, VT",44.4759,-73.2121],
  ["Stowe, VT",44.4654,-72.6874],
  ["North Conway, NH",44.0523,-71.1273],
  ["Franconia, NH",44.2212,-71.7268],
  ["Lake Placid, NY",44.2795,-73.9799],
  ["Adirondacks, NY",44.1153,-74.2695],
  ["Catskills, NY",42.0284,-74.2851],
  ["Charlottesville, VA",38.0293,-78.4767],
  ["Chattanooga, TN",35.0456,-85.3097],
  ["Gatlinburg, TN",35.7143,-83.5102],
  ["Asheville, NC",35.5951,-82.5515],
  ["Hilton Head, SC",32.2163,-80.7526],
  ["Outer Banks, NC",35.5585,-75.4665],
  ["Traverse City, MI",44.7631,-85.6206],
  ["Marquette, MI",46.5436,-87.3954],
  ["Duluth, MN",46.7867,-92.1005],
  ["Ely, MN",47.9032,-91.8674],
  ["Fargo, ND",46.8772,-96.7898],
  ["Rapid City, SD",44.0805,-103.231],
  ["Mount Rushmore, SD",43.8791,-103.4591],
  ["Deadwood, SD",44.3764,-103.7296],
  ["Glacier, SD",43.7325,-102.5073],
  ["Toronto, Canada",43.6532,-79.3832],
  ["Vancouver, Canada",49.2827,-123.1207],
  ["Montreal, Canada",45.5017,-73.5673],
  ["Calgary, Canada",51.0447,-114.0719],
  ["Ottawa, Canada",45.4215,-75.6972],
  ["Edmonton, Canada",53.5461,-113.4938],
  ["Quebec City, Canada",46.8139,-71.2082],
  ["Winnipeg, Canada",49.8951,-97.1384],
  ["Halifax, Canada",44.6488,-63.5752],
  ["Victoria, Canada",48.4284,-123.3656],
  ["Banff, Canada",51.1784,-115.5708],
  ["Whistler, Canada",50.1163,-122.9574],
  ["Jasper, Canada",52.8737,-117.9543],
  ["Kelowna, Canada",49.888,-119.496],
  ["London, UK",51.5074,-0.1278],
  ["Manchester, UK",53.4808,-2.2426],
  ["Birmingham, UK",52.4862,-1.8904],
  ["Edinburgh, Scotland",55.9533,-3.1883],
  ["Glasgow, Scotland",55.8642,-4.2518],
  ["Cardiff, Wales",51.4816,-3.1791],
  ["Dublin, Ireland",53.3498,-6.2603],
  ["Belfast, Northern Ireland",54.5973,-5.9301],
  ["Lake District, UK",54.4609,-3.0886],
  ["Snowdonia, Wales",53.0685,-3.985],
  ["Peak District, UK",53.3499,-1.7765],
  ["Yorkshire Dales, UK",54.2361,-2.1553],
  ["Cairngorms, Scotland",57.1089,-3.654],
  ["Ben Nevis, Scotland",56.7969,-5.0035],
  ["Brecon Beacons, Wales",51.8837,-3.4359],
  ["Cornwall, UK",50.266,-5.0527],
  ["Paris, France",48.8566,2.3522],
  ["Lyon, France",45.764,4.8357],
  ["Nice, France",43.7102,7.262],
  ["Marseille, France",43.2965,5.3698],
  ["Chamonix, France",45.9237,6.8694],
  ["Annecy, France",45.8992,6.1294],
  ["Barcelona, Spain",41.3851,2.1734],
  ["Madrid, Spain",40.4168,-3.7038],
  ["Seville, Spain",37.3891,-5.9845],
  ["Valencia, Spain",39.4699,-0.3763],
  ["Bilbao, Spain",43.263,-2.935],
  ["Pamplona, Spain",42.8125,-1.6458],
  ["Santiago de Compostela, Spain",42.8782,-8.5448],
  ["Rome, Italy",41.9028,12.4964],
  ["Milan, Italy",45.4642,9.19],
  ["Florence, Italy",43.7696,11.2558],
  ["Venice, Italy",45.4408,12.3155],
  ["Naples, Italy",40.8518,14.2681],
  ["Turin, Italy",45.0703,7.6869],
  ["Dolomites, Italy",46.4102,11.844],
  ["Courmayeur, Italy",45.7955,6.9705],
  ["Aosta, Italy",45.7369,7.32],
  ["Berlin, Germany",52.52,13.405],
  ["Munich, Germany",48.1351,11.582],
  ["Hamburg, Germany",53.5753,10.0153],
  ["Cologne, Germany",50.9333,6.95],
  ["Frankfurt, Germany",50.1109,8.6821],
  ["Garmisch, Germany",47.4912,11.0949],
  ["Amsterdam, Netherlands",52.3676,4.9041],
  ["Rotterdam, Netherlands",51.9225,4.4792],
  ["Vienna, Austria",48.2082,16.3738],
  ["Salzburg, Austria",47.8095,13.055],
  ["Innsbruck, Austria",47.2692,11.4041],
  ["Kitzbuhel, Austria",47.4456,12.3919],
  ["Zurich, Switzerland",47.3769,8.5417],
  ["Geneva, Switzerland",46.2044,6.1432],
  ["Interlaken, Switzerland",46.6863,7.8632],
  ["Zermatt, Switzerland",46.0207,7.7491],
  ["Grindelwald, Switzerland",46.6242,8.0406],
  ["Verbier, Switzerland",46.0963,7.2283],
  ["Davos, Switzerland",46.804,9.8373],
  ["St. Moritz, Switzerland",46.4988,9.8374],
  ["Lucerne, Switzerland",47.0502,8.3093],
  ["Prague, Czech Republic",50.0755,14.4378],
  ["Budapest, Hungary",47.4979,19.0402],
  ["Warsaw, Poland",52.2297,21.0122],
  ["Krakow, Poland",50.0647,19.945],
  ["Stockholm, Sweden",59.3293,18.0686],
  ["Oslo, Norway",59.9139,10.7522],
  ["Tromso, Norway",69.6492,18.9553],
  ["Bergen, Norway",60.3913,5.3221],
  ["Stavanger, Norway",58.97,5.7331],
  ["Flam, Norway",60.8634,7.1198],
  ["Copenhagen, Denmark",55.6761,12.5683],
  ["Helsinki, Finland",60.1699,24.9384],
  ["Rovaniemi, Finland",66.5039,25.7294],
  ["Reykjavik, Iceland",64.1466,-21.9426],
  ["Akureyri, Iceland",65.6885,-18.1262],
  ["Lisbon, Portugal",38.7169,-9.1399],
  ["Porto, Portugal",41.1579,-8.6291],
  ["Athens, Greece",37.9838,23.7275],
  ["Thessaloniki, Greece",40.6401,22.9444],
  ["Brussels, Belgium",50.8503,4.3517],
  ["Bruges, Belgium",51.2093,3.2247],
  ["Cape Town, South Africa",-33.9249,18.4241],
  ["Johannesburg, South Africa",-26.2041,28.0473],
  ["Nairobi, Kenya",-1.2921,36.8219],
  ["Mombasa, Kenya",-4.0435,39.6682],
  ["Kampala, Uganda",0.3476,32.5825],
  ["Kigali, Rwanda",-1.9441,30.0619],
  ["Arusha, Tanzania",-3.3869,36.683],
  ["Kilimanjaro, Tanzania",-3.0674,37.3556],
  ["Dar es Salaam, Tanzania",-6.7924,39.2083],
  ["Zanzibar, Tanzania",-6.1659,39.1989],
  ["Bwindi, Uganda",-1.0333,29.7167],
  ["Entebbe, Uganda",0.0512,32.4637],
  ["Cairo, Egypt",30.0444,31.2357],
  ["Luxor, Egypt",25.6872,32.6396],
  ["Marrakech, Morocco",31.6295,-7.9811],
  ["Casablanca, Morocco",33.5731,-7.5898],
  ["Fez, Morocco",34.0181,-5.0078],
  ["Addis Ababa, Ethiopia",9.03,38.74],
  ["Accra, Ghana",5.6037,-0.187],
  ["Lagos, Nigeria",6.5244,3.3792],
  ["Windhoek, Namibia",-22.5597,17.0832],
  ["Tokyo, Japan",35.6762,139.6503],
  ["Osaka, Japan",34.6937,135.5023],
  ["Kyoto, Japan",35.0116,135.7681],
  ["Sapporo, Japan",43.0618,141.3545],
  ["Beijing, China",39.9042,116.4074],
  ["Shanghai, China",31.2304,121.4737],
  ["Hong Kong",22.3193,114.1694],
  ["Singapore",1.3521,103.8198],
  ["Bangkok, Thailand",13.7563,100.5018],
  ["Chiang Mai, Thailand",18.7883,98.9853],
  ["Phuket, Thailand",7.8804,98.3923],
  ["Kathmandu, Nepal",27.7172,85.324],
  ["Pokhara, Nepal",28.2096,83.9856],
  ["Lukla, Nepal",27.6869,86.7314],
  ["Mumbai, India",19.076,72.8777],
  ["Delhi, India",28.7041,77.1025],
  ["Bangalore, India",12.9716,77.5946],
  ["Jaipur, India",26.9124,75.7873],
  ["Leh, India",34.1526,77.5771],
  ["Manali, India",32.2432,77.1892],
  ["Seoul, South Korea",37.5665,126.978],
  ["Busan, South Korea",35.1796,129.0756],
  ["Taipei, Taiwan",25.033,121.5654],
  ["Kuala Lumpur, Malaysia",3.139,101.6869],
  ["Bali, Indonesia",-8.3405,115.092],
  ["Jakarta, Indonesia",-6.2088,106.8456],
  ["Manila, Philippines",14.5995,120.9842],
  ["Colombo, Sri Lanka",6.9271,79.8612],
  ["Lhasa, Tibet",29.652,91.1721],
  ["Chengdu, China",30.5728,104.0668],
  ["Guilin, China",25.2744,110.29],
  ["Xi'an, China",34.3416,108.9398],
  ["Almaty, Kazakhstan",43.222,76.8512],
  ["Tashkent, Uzbekistan",41.2995,69.2401],
  ["Bishkek, Kyrgyzstan",42.8746,74.5698],
  ["Samarkand, Uzbekistan",39.627,66.975],
  ["Mexico City, Mexico",19.4326,-99.1332],
  ["Guadalajara, Mexico",20.6597,-103.3496],
  ["Oaxaca, Mexico",17.0732,-96.7266],
  ["San Miguel de Allende, Mexico",20.9144,-100.7452],
  ["Cancun, Mexico",21.1619,-86.8515],
  ["Tulum, Mexico",20.2114,-87.4654],
  ["Buenos Aires, Argentina",-34.6037,-58.3816],
  ["Mendoza, Argentina",-32.8908,-68.8272],
  ["Bariloche, Argentina",-41.1335,-71.3103],
  ["Ushuaia, Argentina",-54.8019,-68.303],
  ["Santiago, Chile",-33.4489,-70.6693],
  ["Torres del Paine, Chile",-50.9423,-73.4068],
  ["Patagonia, Chile",-50.9423,-72.976],
  ["Atacama, Chile",-23.8634,-69.0723],
  ["Lima, Peru",-12.0464,-77.0428],
  ["Cusco, Peru",-13.532,-71.9675],
  ["Machu Picchu, Peru",-13.1631,-72.545],
  ["Arequipa, Peru",-16.409,-71.5375],
  ["Bogota, Colombia",4.711,-74.0721],
  ["Medellin, Colombia",6.2442,-75.5812],
  ["Cartagena, Colombia",10.391,-75.4794],
  ["Quito, Ecuador",-0.1807,-78.4678],
  ["Galapagos, Ecuador",-0.9538,-90.9656],
  ["La Paz, Bolivia",-16.5,-68.1193],
  ["Rio de Janeiro, Brazil",-22.9068,-43.1729],
  ["Sao Paulo, Brazil",-23.5505,-46.6333],
  ["Florianopolis, Brazil",-27.5954,-48.548],
  ["San Jose, Costa Rica",9.9281,-84.0907],
  ["Monteverde, Costa Rica",10.3,-84.8285],
  ["Sydney, Australia",-33.8688,151.2093],
  ["Melbourne, Australia",-37.8136,144.9631],
  ["Brisbane, Australia",-27.4698,153.0251],
  ["Perth, Australia",-31.9505,115.8605],
  ["Adelaide, Australia",-34.9285,138.6007],
  ["Cairns, Australia",-16.9186,145.7781],
  ["Alice Springs, Australia",-23.698,133.8807],
  ["Hobart, Australia",-42.8821,147.3272],
  ["Auckland, New Zealand",-36.8485,174.7633],
  ["Wellington, New Zealand",-41.2865,174.7762],
  ["Queenstown, New Zealand",-45.0312,168.6626],
  ["Christchurch, New Zealand",-43.5321,172.6362],
  ["Wanaka, New Zealand",-44.7024,169.1322],
  ["Rotorua, New Zealand",-38.1368,176.2497],
  ["Dubai, UAE",25.2048,55.2708],
  ["Abu Dhabi, UAE",24.4539,54.3773],
  ["Istanbul, Turkey",41.0082,28.9784],
  ["Cappadocia, Turkey",38.6431,34.8307],
  ["Antalya, Turkey",36.8969,30.7133],
  ["Tel Aviv, Israel",32.0853,34.7818],
  ["Jerusalem, Israel",31.7683,35.2137],
  ["Petra, Jordan",30.3285,35.4444],
  ["Doha, Qatar",25.2854,51.531],
  ["Muscat, Oman",23.588,58.3829],
];

// ── LOCATION SEARCH (offline fuzzy match against built-in city list) ──
function searchCities(q) {
  if (!q || q.length < 2) return [];
  const lower = q.toLowerCase();
  const scored = CITY_DATA
    .map(([name, lat, lon]) => {
      const n = name.toLowerCase();
      let score = 0;
      if (n.startsWith(lower)) score = 100;
      else if (n.includes(", " + lower)) score = 90;
      else if (n.includes(lower)) score = 70;
      else {
        // word-start match
        const words = n.split(/[,\s]+/);
        if (words.some(w => w.startsWith(lower))) score = 60;
      }
      return score > 0 ? { name, lat, lon, score } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
  return scored;
}

function LocationSearch({ confirmedLat, confirmedLon, confirmedLabel, onConfirm, onGeoLocate, geoLoading, geoError }) {
  const [query, setQuery]     = useState(confirmedLabel || "");
  const [results, setResults] = useState([]);
  const [open, setOpen]       = useState(false);
  const wrapRef               = useRef(null);
  const confirmed             = !!(confirmedLat && confirmedLon);

  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleInput = (q) => {
    setQuery(q);
    const hits = searchCities(q);
    setResults(hits);
    setOpen(hits.length > 0);
    // If user clears the field, also clear confirmed coords
    if (!q) onConfirm("", null, null);
  };

  const pick = (item) => {
    setQuery(item.name);
    setResults([]);
    setOpen(false);
    onConfirm(item.name, item.lat, item.lon);
  };

  const clear = () => { setQuery(""); setResults([]); setOpen(false); onConfirm("", null, null); };

  return (
    <div style={{ background: T.white, border: "1px solid " + T.border, borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.inkMuted, marginBottom: 7 }}>
        📍 Training location <span style={{ fontWeight: 400, letterSpacing: 0, textTransform: "none" }}>— for maps & weather</span>
      </div>

      {confirmed ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>✅</span>
          <span style={{ flex: 1, color: T.green, fontWeight: 600, fontSize: 13 }}>{query}</span>
          <button onClick={clear} style={{ background: "none", border: "none", color: T.inkMuted, cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 4px" }}>✕</button>
        </div>
      ) : (
        <div ref={wrapRef} style={{ position: "relative" }}>
          <div style={{ display: "flex", gap: 7, marginBottom: 4 }}>
            <button onClick={onGeoLocate} disabled={geoLoading}
              style={{ background: geoLoading ? T.surfaceAlt : T.accentSoft, color: geoLoading ? T.inkMuted : T.accent,
                border: "1px solid " + T.accent + "40", borderRadius: 7, padding: "9px 12px",
                fontSize: 12, fontWeight: 700, cursor: geoLoading ? "not-allowed" : "pointer",
                fontFamily: "'Barlow',sans-serif", flexShrink: 0, whiteSpace: "nowrap" }}>
              {geoLoading ? "…" : "📍 Use my location"}
            </button>
            <input
              value={query}
              onChange={e => handleInput(e.target.value)}
              onFocus={() => results.length > 0 && setOpen(true)}
              placeholder="Search city or destination…"
              style={{ flex: 1, padding: "9px 12px", fontSize: 13, borderRadius: 7,
                border: "1px solid " + (open ? T.accent : T.border),
                fontFamily: "'Barlow',sans-serif", outline: "none", color: T.ink,
                background: T.white, boxSizing: "border-box" }}
            />
          </div>

          {open && results.length > 0 && (
            <div style={{ position: "absolute", top: "calc(100% + 2px)", left: 0, right: 0,
              background: T.white, border: "1px solid " + T.border, borderRadius: 8,
              boxShadow: "0 4px 20px rgba(0,0,0,0.12)", zIndex: 200, overflow: "hidden" }}>
              {results.map((item, i) => {
                const parts = item.name.split(",");
                const primary = parts[0].trim();
                const secondary = parts.slice(1).join(",").trim();
                return (
                  <button key={i} onClick={() => pick(item)}
                    style={{ display: "flex", alignItems: "center", gap: 10, width: "100%",
                      padding: "10px 13px", background: "none", border: "none",
                      borderBottom: i < results.length - 1 ? "1px solid " + T.border : "none",
                      cursor: "pointer", textAlign: "left", fontFamily: "'Barlow',sans-serif" }}
                    onMouseEnter={e => e.currentTarget.style.background = T.accentSoft}
                    onMouseLeave={e => e.currentTarget.style.background = "none"}>
                    <span style={{ fontSize: 15, flexShrink: 0 }}>📍</span>
                    <div>
                      <div style={{ fontWeight: 600, color: T.ink, fontSize: 13 }}>{primary}</div>
                      {secondary && <div style={{ color: T.inkMuted, fontSize: 11, marginTop: 1 }}>{secondary}</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {geoError && <p style={{ fontSize: 11, color: T.amber, margin: "5px 0 0" }}>
            {IS_PREVIEW
              ? "📍 Auto-detect isn't available in the preview — search for your city above. It works on the hosted site."
              : "⚠️ Location blocked — please allow location access in your browser, or search for your city above."}
          </p>}
          {!geoError && <p style={{ fontSize: 11, color: T.inkMuted, margin: "5px 0 0" }}>Optional — skip to continue without maps & weather.</p>}
        </div>
      )}
    </div>
  );
}

function OnboardingNavBar({back,n}) {
  return (
    <div style={{padding:"16px 22px",display:"flex",alignItems:"center",justifyContent:"space-between",background:T.white,borderBottom:`1px solid ${T.border}`}}>
      <button onClick={back} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:T.inkDim,fontFamily:"'Barlow',sans-serif",fontWeight:600}}>← Back</button>
      <button onClick={back} style={{background:"none",border:"none",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:18,color:T.ink}}>ZERO<span style={{color:T.accent}}>DAY</span></button>
      <div style={{display:"flex",gap:4}}>{[1,2,3,4].map(i=><div key={i} style={{width:i===n?20:6,height:6,borderRadius:3,background:i<=n?T.accent:T.border,transition:"all 0.3s"}}/>)}</div>
    </div>
  );
}
function OnboardingWrap({children}) {
  return <div style={{fontFamily:"'Barlow',sans-serif",background:T.bg,minHeight:"100vh"}}><style>{FONTS}</style>{children}</div>;
}
function OnboardingBtn({onClick,disabled,children}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{width:"100%",background:disabled?T.border:T.accent,color:disabled?T.inkMuted:T.white,border:"none",borderRadius:8,padding:"14px",fontSize:15,fontWeight:700,cursor:disabled?"not-allowed":"pointer",fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.08em",textTransform:"uppercase",boxShadow:disabled?"none":`0 6px 20px rgba(26,86,219,0.25)`,transition:"all 0.2s"}}>
      {children}
    </button>
  );
}

function Onboarding({onComplete,prefill,onBack}) {
  const [step,setStep]     = useState(prefill?.challenge?"fitness":"category");
  const [selCat,setSelCat] = useState(null);
  const [selChal,setSelChal]= useState(prefill?.challenge?{id:"prefill",label:prefill.challenge,location:prefill.location,lat:prefill.lat,lon:prefill.lon}:null);
  const [custom,setCustom] = useState("");
  const [fitness,setFitness]= useState("");
  const [injuries,setInjuries]= useState([]);
  const [date,setDate]     = useState("");
  const [startDate,setStartDate]= useState(todayStr());
  const [geoLoading,setGeoLoading]= useState(false);
  const [geoLat,setGeoLat] = useState(prefill?.lat||null);
  const [geoLon,setGeoLon] = useState(prefill?.lon||null);
  const [manualCity,setManualCity]= useState("");
  const [geoError,setGeoError]   = useState(false);
  const customRef= useRef(null);
  const cat= CATEGORIES.find(c=>c.id===selCat);

  const label    = selChal?.custom ? custom : (prefill?.challenge||selChal?.label||"");
  const location = prefill?.location||selChal?.location||"";
  const lat      = selChal?.lat||geoLat||null;
  const lon      = selChal?.lon||geoLon||null;
  const weeks    = date ? weeksUntil(date) : null;

  const geoLocate = () => {
    if(!navigator.geolocation){setGeoError(true);return;}
    // Geolocation requires a top-level page (not an iframe) and user permission.
    // Works on the hosted site. In the Claude artifact preview, use city search instead.
    if(IS_PREVIEW){setGeoError(true);return;}
    setGeoLoading(true);setGeoError(false);
    navigator.geolocation.getCurrentPosition(
      p=>{setGeoLat(p.coords.latitude);setGeoLon(p.coords.longitude);setGeoLoading(false);},
      ()=>{setGeoLoading(false);setGeoError(true);},
      {timeout:12000, enableHighAccuracy:false, maximumAge:60000}
    );
  };

  if(step==="category") return (
    <OnboardingWrap>
      <OnboardingNavBar back={onBack} n={1}/>
      <div style={{padding:"30px 22px",maxWidth:620,margin:"0 auto"}}>
        <p style={{fontSize:11,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",color:T.accent,marginBottom:8}}>Step 1 of 4</p>
        <h2 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:"clamp(24px,6vw,38px)",fontWeight:900,textTransform:"uppercase",color:T.ink,marginBottom:6,lineHeight:1}}>What type of challenge?</h2>
        <p style={{color:T.inkDim,fontSize:14,marginBottom:22,fontWeight:300}}>Pick a category to see specific challenges.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:10}}>
          {CATEGORIES.map(c=>(
            <button key={c.id} onClick={()=>{setSelCat(c.id);setStep("challenge");}}
              style={{background:c.bg,border:"none",borderRadius:12,padding:"20px 15px",cursor:"pointer",textAlign:"left",boxShadow:"0 2px 8px rgba(0,0,0,0.1)",transition:"transform 0.15s,box-shadow 0.15s"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,0.18)";}}
              onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,0.1)";}}>
              <div style={{fontSize:24,marginBottom:7}}>{c.icon}</div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:14,color:"#fff",textTransform:"uppercase",letterSpacing:"0.04em"}}>{c.label}</div>
            </button>
          ))}
        </div>
      </div>
    </OnboardingWrap>
  );

  if(step==="challenge"&&cat) return (
    <OnboardingWrap>
      <OnboardingNavBar back={()=>setStep("category")} n={2}/>
      <div style={{padding:"30px 22px",maxWidth:540,margin:"0 auto"}}>
        <p style={{fontSize:11,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",color:T.accent,marginBottom:8}}>{cat.icon} Step 2 of 4</p>
        <h2 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:"clamp(24px,6vw,38px)",fontWeight:900,textTransform:"uppercase",color:T.ink,marginBottom:6,lineHeight:1}}>Pick your challenge</h2>
        <p style={{color:T.inkDim,fontSize:14,marginBottom:18,fontWeight:300}}>Select one, or describe your own.</p>
        <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:16}}>
          {cat.challenges.map(ch=>(
            <button key={ch.id} onClick={()=>{setSelChal(ch);if(!ch.custom)setStep("fitness");else setTimeout(()=>customRef.current?.focus(),50);}}
              style={{display:"flex",alignItems:"center",gap:11,padding:"13px 14px",background:selChal?.id===ch.id?T.accentSoft:T.white,border:`2px solid ${selChal?.id===ch.id?T.accent:T.border}`,borderRadius:10,cursor:"pointer",textAlign:"left",transition:"all 0.15s"}}
              onMouseEnter={e=>{if(selChal?.id!==ch.id)e.currentTarget.style.borderColor=T.borderDark;}}
              onMouseLeave={e=>{if(selChal?.id!==ch.id)e.currentTarget.style.borderColor=T.border;}}>
              <span style={{fontSize:19,flexShrink:0}}>{ch.icon}</span>
              <div style={{flex:1}}><div style={{fontWeight:600,color:T.ink,fontSize:13}}>{ch.label}</div><div style={{color:T.inkMuted,fontSize:11,marginTop:1}}>{ch.sub}</div></div>
              {selChal?.id===ch.id&&!ch.custom&&<span style={{color:T.accent,fontSize:14,fontWeight:700,flexShrink:0}}>✓</span>}
            </button>
          ))}
        </div>
        <div style={{display:selChal?.custom?"block":"none",marginBottom:14}}>
            <input ref={customRef} value={custom} onChange={e=>setCustom(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&custom.trim().length>2&&setStep("fitness")}
              placeholder="e.g. Off-piste backcountry skiing"
              style={{width:"100%",background:T.white,border:`2px solid ${T.border}`,borderRadius:10,padding:"12px 14px",fontSize:14,color:T.ink,fontFamily:"'Barlow',sans-serif",outline:"none",marginBottom:9}}
              onFocus={e=>e.target.style.borderColor=T.accent}
              onBlur={e=>e.target.style.borderColor=T.border}/>
            <OnboardingBtn onClick={()=>{if(custom.trim().length>2)setStep("fitness");}} disabled={custom.trim().length<=2}>Continue →</OnboardingBtn>
          </div>
      </div>
    </OnboardingWrap>
  );

  if(step==="fitness") return (
    <OnboardingWrap>
      <OnboardingNavBar back={()=>setStep(prefill?.challenge?"category":"challenge")} n={3}/>
      <div style={{padding:"30px 22px",maxWidth:500,margin:"0 auto"}}>
        <p style={{fontSize:11,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",color:T.accent,marginBottom:8}}>Step 3 of 5</p>
        <h2 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:"clamp(24px,6vw,38px)",fontWeight:900,textTransform:"uppercase",color:T.ink,marginBottom:6,lineHeight:1}}>Where are you now?</h2>
        <p style={{color:T.inkDim,fontSize:14,marginBottom:18,fontWeight:300}}>Be honest — your plan only works if it starts where you are.</p>
        <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:22}}>
          {FITNESS_LEVELS.map(f=>(
            <button key={f.id} onClick={()=>setFitness(f.id)}
              style={{display:"flex",alignItems:"center",gap:11,padding:"14px 14px",background:fitness===f.id?T.accentSoft:T.white,border:`2px solid ${fitness===f.id?T.accent:T.border}`,borderRadius:10,cursor:"pointer",textAlign:"left",transition:"all 0.15s"}}>
              <span style={{fontSize:20,flexShrink:0}}>{f.icon}</span>
              <div style={{flex:1}}><div style={{fontWeight:700,color:T.ink,fontSize:13}}>{f.label}</div><div style={{color:T.inkDim,fontSize:11,marginTop:1}}>{f.desc}</div></div>
              {fitness===f.id&&<div style={{width:19,height:19,borderRadius:"50%",background:T.accent,color:T.white,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,flexShrink:0}}>✓</div>}
            </button>
          ))}
        </div>
        <OnboardingBtn onClick={()=>setStep("injuries")} disabled={!fitness}>Continue →</OnboardingBtn>
      </div>
    </OnboardingWrap>
  );

  if(step==="injuries") return (
    <OnboardingWrap>
      <OnboardingNavBar back={()=>setStep("injuries")} n={5}/>
      <div style={{padding:"30px 22px",maxWidth:500,margin:"0 auto"}}>
        <p style={{fontSize:11,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",color:T.accent,marginBottom:8}}>Step 4 of 5</p>
        <h2 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:"clamp(24px,6vw,38px)",fontWeight:900,textTransform:"uppercase",color:T.ink,marginBottom:6,lineHeight:1}}>Any injuries or limits?</h2>
        <p style={{color:T.inkDim,fontSize:14,marginBottom:18,fontWeight:300}}>Your plan will work around them — be honest so we keep you safe.</p>
        <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:22}}>
          {INJURY_OPTIONS.map(inj=>{
            const sel = (injuries||[]).includes(inj.id);
            const isNone = inj.id === "none";
            return (
              <button key={inj.id} onClick={()=>{
                if(isNone){ setInjuries(["none"]); return; }
                const cur = (injuries||[]).filter(i=>i!=="none");
                setInjuries(sel ? cur.filter(i=>i!==inj.id) : [...cur, inj.id]);
              }}
                style={{display:"flex",alignItems:"center",gap:11,padding:"14px 14px",
                  background:sel?T.accentSoft:T.white,
                  border:`2px solid ${sel?T.accent:T.border}`,
                  borderRadius:10,cursor:"pointer",textAlign:"left",transition:"all 0.15s"}}>
                <span style={{fontSize:20,flexShrink:0}}>{inj.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,color:T.ink,fontSize:13}}>{inj.label}</div>
                  <div style={{color:T.inkDim,fontSize:11,marginTop:1}}>{inj.detail}</div>
                </div>
                {sel&&<div style={{width:19,height:19,borderRadius:"50%",background:T.accent,color:T.white,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,flexShrink:0}}>✓</div>}
              </button>
            );
          })}
        </div>
        <OnboardingBtn onClick={()=>setStep("date")} disabled={!injuries||injuries.length===0}>Continue →</OnboardingBtn>
      </div>
    </OnboardingWrap>
  );

  if(step==="date") return (
    <OnboardingWrap>
      <OnboardingNavBar back={()=>setStep("fitness")} n={4}/>
      <div style={{padding:"30px 22px",maxWidth:500,margin:"0 auto"}}>
        <p style={{fontSize:11,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",color:T.accent,marginBottom:8}}>Step 5 of 5</p>
        <h2 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:"clamp(24px,6vw,38px)",fontWeight:900,textTransform:"uppercase",color:T.ink,marginBottom:6,lineHeight:1}}>When & where?</h2>
        <p style={{color:T.inkDim,fontSize:14,marginBottom:18,fontWeight:300}}>Challenge date + your location for maps and weather.</p>

        <div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:12,padding:"12px 14px",marginBottom:14}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:T.inkMuted,marginBottom:5}}>Your Plan</div>
          <div style={{fontWeight:600,color:T.ink,fontSize:14}}>{label||"Custom challenge"}</div>
          <div style={{color:T.inkDim,fontSize:12,marginTop:2}}>{FITNESS_LEVELS.find(f=>f.id===fitness)?.label}{location?` · ${location}`:""}</div>
        </div>

        <div style={{marginBottom:12}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:T.inkMuted,marginBottom:6}}>Challenge Date</div>
          <input type="date" value={date} min={todayStr()} onChange={e=>setDate(e.target.value)}
            style={{width:"100%",background:T.white,border:`2px solid ${date?T.accent:T.border}`,borderRadius:10,padding:"12px 14px",fontSize:15,color:T.ink,fontFamily:"'Barlow',sans-serif",outline:"none",marginBottom:8,transition:"border-color 0.2s"}}/>
          {date&&new Date(date)>new Date()&&(
            <div style={{background:T.accentSoft,borderRadius:8,padding:"9px 13px",marginBottom:12,display:"flex",alignItems:"center",gap:9}}>
              <span style={{fontSize:17}}>⏱</span>
              <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:22,fontWeight:800,color:T.accent}}>{weeks}</span>
              <span style={{color:T.accent,fontWeight:600,fontSize:13}}>weeks to go</span>
            </div>
          )}
        </div>

        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:T.inkMuted,marginBottom:6}}>When did / will you start training?</div>
          <input type="date" value={startDate} max={date||undefined} onChange={e=>setStartDate(e.target.value)}
            style={{width:"100%",background:T.white,border:`2px solid ${T.border}`,borderRadius:10,padding:"12px 14px",fontSize:15,color:T.ink,fontFamily:"'Barlow',sans-serif",outline:"none",transition:"border-color 0.2s"}}/>
          <p style={{fontSize:11,color:T.inkMuted,marginTop:4}}>Used to track your current week and progress ring.</p>
        </div>

        {!lat&&(
          <LocationSearch
            confirmedLat={geoLat} confirmedLon={geoLon} confirmedLabel={manualCity}
            onConfirm={(lbl,clat,clon)=>{setManualCity(lbl);setGeoLat(clat);setGeoLon(clon);}}
            onGeoLocate={geoLocate} geoLoading={geoLoading} geoError={geoError}
          />
        )}

        <OnboardingBtn onClick={async()=>{
          let finalLat = lat||geoLat||null;
          let finalLon = lon||geoLon||null;
          const cityStr = manualCity || location;
          if((!finalLat||!finalLon) && cityStr && cityStr.trim() && cityStr!=="Varies" && cityStr!=="Open water"){
            const geo = await geocodeCity(cityStr);
            if(geo){finalLat=geo.lat;finalLon=geo.lon;}
          }
          // Map category id to challengeType string
          const catTypeMap = {hiking:"hiking",cycling:"road cycling",water:"water sports",snow:"snow sports",climbing:"climbing",running:"road running"};
          onComplete({challengeLabel:label,challengeLocation:location||manualCity,lat:finalLat,lon:finalLon,manualCity,fitness,injuries,date,startDate,challengeType:catTypeMap[selCat]||"hiking"});
        }} disabled={!date||new Date(date)<=new Date()}>
          Build My Zero Day Plan →
        </OnboardingBtn>
      </div>
    </OnboardingWrap>
  );

  return null;
}

// ═══════════════════════════════════════════════════════════
// GENERATING
// ═══════════════════════════════════════════════════════════
function Generating({challenge}) {
  const msgs=["Analyzing your challenge...","Calculating your timeline...","Designing training phases...","Writing workouts...","Sourcing gear recommendations...","Fetching location & weather...","Finalizing your plan..."];
  const [msg,setMsg]=useState(0);
  useEffect(()=>{const t=setInterval(()=>setMsg(m=>(m+1)%msgs.length),1800);return()=>clearInterval(t);},[]);
  return (
    <div style={{fontFamily:"'Barlow',sans-serif",background:T.bg,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32}}>
      <style>{FONTS}</style>
      <div style={{textAlign:"center",maxWidth:360}}>
        <div style={{width:68,height:68,borderRadius:"50%",border:`4px solid ${T.border}`,borderTop:`4px solid ${T.accent}`,margin:"0 auto 24px",animation:"spin 1s linear infinite"}}/>
        <h2 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:28,fontWeight:800,textTransform:"uppercase",color:T.ink,marginBottom:8}}>Building Your Plan</h2>
        <p style={{color:T.accent,fontWeight:600,fontSize:13,marginBottom:24,minHeight:20}}>{msgs[msg]}</p>
        <div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:12,padding:"12px 15px",textAlign:"left"}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:T.inkMuted,marginBottom:5}}>Generating plan for</div>
          <div style={{fontWeight:700,color:T.ink,fontSize:14}}>{challenge?.challengeLabel}</div>
          <div style={{color:T.inkDim,fontSize:12,marginTop:2}}>{challenge?.weeks} weeks · {FITNESS_LEVELS.find(f=>f.id===challenge?.fitness)?.label}</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PLAN VIEW
// ═══════════════════════════════════════════════════════════
// Pure-React OSM tile map — img tags only, no CDN scripts, works in any sandbox
function tileCoords(lat, lon, z) {
  const n = Math.pow(2, z);
  const x = Math.floor((lon + 180) / 360 * n);
  const latR = lat * Math.PI / 180;
  const y = Math.floor((1 - Math.log(Math.tan(latR) + 1/Math.cos(latR)) / Math.PI) / 2 * n);
  const fx = (lon + 180) / 360 * n - x;  // fractional offset within center tile (0–1)
  const fy = (1 - Math.log(Math.tan(latR) + 1/Math.cos(latR)) / Math.PI) / 2 * n - y;
  return {x, y, fx, fy};
}

// ── SPORT → LINKS MAPPING ─────────────────────────────────────

// ── TILE MAP (interactive: drag to pan, scroll to zoom) ─────────
// Pure React — img tags only, no iframe, no CDN, no API key needed

function latLonToTile(lat, lon, z) {
  const n = Math.pow(2, z);
  const x = Math.floor((lon + 180) / 360 * n);
  const latR = lat * Math.PI / 180;
  const y = Math.floor((1 - Math.log(Math.tan(latR) + 1 / Math.cos(latR)) / Math.PI) / 2 * n);
  return { x, y };
}

// World pixel position at given zoom (each tile is 256px)
function latLonToWorldPx(lat, lon, z) {
  const n = Math.pow(2, z);
  const xFrac = (lon + 180) / 360 * n;
  const latR = lat * Math.PI / 180;
  const yFrac = (1 - Math.log(Math.tan(latR) + 1 / Math.cos(latR)) / Math.PI) / 2 * n;
  return { x: xFrac * 256, y: yFrac * 256 };
}

function TileMap({ lat, lon, initZoom = 12, height = 340 }) {
  const latf = parseFloat(lat);
  const lonf = parseFloat(lon);
  const containerRef = useRef(null);

  // Center offset: how many world-px is the top-left corner of the viewport from world origin
  const initWP = latLonToWorldPx(latf, lonf, initZoom);
  const [zoom, setZoom]     = useState(initZoom);
  const [offset, setOffset] = useState({ x: initWP.x, y: initWP.y }); // world-px at viewport center
  const dragging = useRef(false);
  const lastMouse = useRef(null);

  // Re-center when lat/lon/zoom changes from outside
  useEffect(() => {
    const wp = latLonToWorldPx(latf, lonf, zoom);
    setOffset({ x: wp.x, y: wp.y });
  }, [lat, lon]);

  if (!latf || !lonf) return null;

  const TILE = 256;
  const servers = ["a", "b", "c"];

  // Viewport size
  const vpW = containerRef.current ? containerRef.current.offsetWidth : 400;
  const vpH = height;

  // Which tiles do we need?
  // offset = world-px at center of viewport
  // top-left world-px = offset - vpW/2, offset.y - vpH/2
  const tlX = offset.x - vpW / 2;
  const tlY = offset.y - vpH / 2;
  const tileX0 = Math.floor(tlX / TILE);
  const tileY0 = Math.floor(tlY / TILE);
  const tileX1 = Math.floor((offset.x + vpW / 2) / TILE);
  const tileY1 = Math.floor((offset.y + vpH / 2) / TILE);
  const maxTile = Math.pow(2, zoom) - 1;

  const tiles = [];
  for (let ty = tileY0; ty <= tileY1; ty++) {
    for (let tx = tileX0; tx <= tileX1; tx++) {
      // pixel position of this tile's top-left corner relative to viewport top-left
      const px = tx * TILE - tlX;
      const py = ty * TILE - tlY;
      const clampedTx = ((tx % Math.pow(2, zoom)) + Math.pow(2, zoom)) % Math.pow(2, zoom);
      const clampedTy = Math.max(0, Math.min(ty, maxTile));
      const srv = servers[Math.abs(tx + ty) % 3];
      tiles.push({ tx: clampedTx, ty: clampedTy, px, py, key: tx + "," + ty });
    }
  }

  // Pin position in viewport
  const pinWP = latLonToWorldPx(latf, lonf, zoom);
  const pinVpX = pinWP.x - tlX;
  const pinVpY = pinWP.y - tlY;

  // Interaction handlers
  const onMouseDown = (e) => {
    dragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  };
  const onMouseMove = (e) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    setOffset(o => ({ x: o.x - dx, y: o.y - dy }));
  };
  const onMouseUp = () => { dragging.current = false; };

  const onTouchStart = (e) => {
    if (e.touches.length === 1) {
      dragging.current = true;
      lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };
  const onTouchMove = (e) => {
    if (!dragging.current || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - lastMouse.current.x;
    const dy = e.touches[0].clientY - lastMouse.current.y;
    lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    setOffset(o => ({ x: o.x - dx, y: o.y - dy }));
    e.preventDefault();
  };
  const onTouchEnd = () => { dragging.current = false; };

  const onWheel = (e) => {
    e.preventDefault();
    const newZoom = Math.max(3, Math.min(18, zoom + (e.deltaY < 0 ? 1 : -1)));
    if (newZoom === zoom) return;
    // Keep the same lat/lon center
    const wp = latLonToWorldPx(latf, lonf, newZoom);
    // Scale offset to new zoom
    const scale = Math.pow(2, newZoom - zoom);
    setOffset(o => ({ x: o.x * scale, y: o.y * scale }));
    setZoom(newZoom);
  };

  const zoomIn  = () => {
    const nz = Math.min(18, zoom + 1);
    setZoom(nz);
    setOffset(o => ({ x: o.x * 2, y: o.y * 2 }));
  };
  const zoomOut = () => {
    const nz = Math.max(3, zoom - 1);
    setZoom(nz);
    setOffset(o => ({ x: o.x / 2, y: o.y / 2 }));
  };

  return (
    <div style={{ position: "relative", borderRadius: 12, overflow: "hidden",
      border: "1px solid " + T.border, marginBottom: 14, height: height,
      background: "#e8e0d8", cursor: dragging.current ? "grabbing" : "grab",
      userSelect: "none" }}
      ref={containerRef}
      onMouseDown={onMouseDown} onMouseMove={onMouseMove}
      onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
      onWheel={onWheel}
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>

      {/* Tiles */}
      {tiles.map(t => (
        <img key={t.key} alt=""
          src={"https://" + servers[Math.abs(parseInt(t.tx) + parseInt(t.ty)) % 3] + ".tile.openstreetmap.org/" + zoom + "/" + t.tx + "/" + t.ty + ".png"}
          style={{ position: "absolute", left: t.px, top: t.py,
            width: TILE, height: TILE, display: "block", pointerEvents: "none" }}
          draggable={false}
        />
      ))}

      {/* Location pin */}
      <div style={{ position: "absolute", left: pinVpX, top: pinVpY,
        transform: "translate(-50%, -100%)",
        fontSize: 28, lineHeight: 1, pointerEvents: "none",
        filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.6))", zIndex: 10 }}>
        📍
      </div>

      {/* Zoom controls */}
      <div style={{ position: "absolute", top: 10, right: 10, display: "flex",
        flexDirection: "column", gap: 2, zIndex: 20 }}>
        {[{ label: "+", fn: zoomIn }, { label: "−", fn: zoomOut }].map(b => (
          <button key={b.label} onClick={b.fn}
            style={{ width: 32, height: 32, background: T.white, border: "1px solid " + T.border,
              borderRadius: 6, fontSize: 18, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 1px 4px rgba(0,0,0,0.15)", color: T.ink, lineHeight: 1 }}>
            {b.label}
          </button>
        ))}
      </div>

      {/* Attribution (required by OSM tile policy) */}
      <div style={{ position: "absolute", bottom: 4, right: 8, fontSize: 10,
        color: "#333", background: "rgba(255,255,255,0.85)", padding: "2px 5px",
        borderRadius: 3, zIndex: 20, pointerEvents: "none" }}>
        © OpenStreetMap
      </div>
    </div>
  );
}


const ROUTE_TYPES = new Set([
  "hiking","trekking","trail running","road running",
  "road cycling","mountain biking",
  "snow sports","water sports","climbing","mountaineering"
]);

function isRouteType(ct) {
  if (!ct) return false;
  return ROUTE_TYPES.has((ct || "").toLowerCase().trim());
}

function sportLinks(ct, lat, lon, locationName) {
  const loc = encodeURIComponent(locationName || "");
  const t = (ct || "").toLowerCase().trim();
  const latf = parseFloat(lat) || 0;
  const lonf = parseFloat(lon) || 0;
  const hasCoords = !!(parseFloat(lat) && parseFloat(lon));

  if (t === "hiking" || t === "trekking" || t === "trail running") {
    return [
      { label: "AllTrails", icon: "🥾",
        url: hasCoords ? "https://www.alltrails.com/explore?lat=" + latf + "&lng=" + lonf + "&zoom=12" : "https://www.alltrails.com/search?q=" + loc },
      { label: "Gaia GPS", icon: "🗺",
        url: hasCoords ? "https://www.gaiagps.com/map/?layer=GaiaTopoRasterFeet&lat=" + latf + "&lng=" + lonf + "&zoom=12" : "https://www.gaiagps.com" },
      { label: "Komoot", icon: "🧭",
        url: hasCoords ? "https://www.komoot.com/discover/tours?sport=hike&lat=" + latf + "&lng=" + lonf + "&zoom=11" : "https://www.komoot.com" },
    ];
  }
  if (t === "road cycling" || t === "mountain biking") {
    return [
      { label: "Trailforks", icon: "🚵",
        url: hasCoords ? "https://www.trailforks.com/region/?lat=" + latf + "&lon=" + lonf + "&z=11" : "https://www.trailforks.com" },
      { label: "Strava", icon: "⚡",
        url: hasCoords ? "https://www.strava.com/heatmap#11/" + lonf + "/" + latf + "/hot/ride" : "https://www.strava.com" },
      { label: "Komoot", icon: "🧭",
        url: hasCoords ? "https://www.komoot.com/discover/tours?sport=mtb&lat=" + latf + "&lng=" + lonf + "&zoom=11" : "https://www.komoot.com" },
    ];
  }
  if (t === "snow sports") {
    return [
      { label: "onX Backcountry", icon: "🎿", url: "https://www.onxmaps.com/backcountry" },
      { label: "Gaia GPS", icon: "🗺",
        url: hasCoords ? "https://www.gaiagps.com/map/?layer=GaiaTopoRasterFeet&lat=" + latf + "&lng=" + lonf + "&zoom=12" : "https://www.gaiagps.com" },
    ];
  }
  if (t === "water sports") {
    return [
      { label: "Strava", icon: "⚡", url: "https://www.strava.com" },
      { label: "Komoot", icon: "🧭",
        url: hasCoords ? "https://www.komoot.com/discover/tours?sport=kayaking&lat=" + latf + "&lng=" + lonf + "&zoom=11" : "https://www.komoot.com" },
    ];
  }
  if (t === "climbing" || t === "mountaineering") {
    return [
      { label: "Mountain Project", icon: "🧗",
        url: hasCoords ? "https://www.mountainproject.com/map#!lt=" + latf + "&lg=" + lonf + "&zoom=12" : "https://www.mountainproject.com" },
      { label: "onX Backcountry", icon: "🗺", url: "https://www.onxmaps.com/backcountry" },
      { label: "Gaia GPS", icon: "🧭",
        url: hasCoords ? "https://www.gaiagps.com/map/?layer=GaiaTopoRasterFeet&lat=" + latf + "&lng=" + lonf + "&zoom=12" : "https://www.gaiagps.com" },
    ];
  }
  // road running or fallback
  return [
    { label: "Strava", icon: "⚡", url: "https://www.strava.com" },
    { label: "AllTrails", icon: "🥾",
      url: hasCoords ? "https://www.alltrails.com/explore?lat=" + latf + "&lng=" + lonf + "&zoom=12" : "https://www.alltrails.com/search?q=" + loc },
    { label: "Komoot", icon: "🧭",
      url: hasCoords ? "https://www.komoot.com/discover/tours?sport=runcity&lat=" + latf + "&lng=" + lonf + "&zoom=11" : "https://www.komoot.com" },
  ];
}

function MapDisplay({ lat, lon, location, challengeName, challengeType, routeUrl }) {
  const hasCoords = !!(parseFloat(lat) && parseFloat(lon));
  const latf = parseFloat(lat) || 0;
  const lonf = parseFloat(lon) || 0;
  const locationName = location || challengeName || "";
  const links = sportLinks(challengeType, lat, lon, locationName);

  return (
    <div>
      {hasCoords ? (
        <div style={{ marginBottom: 14 }}>
          <TileMap lat={latf} lon={lonf} zoom={12} tiles={3} height={340} />
        </div>
      ) : (
        <div style={{ height: 140, display: "flex", alignItems: "center", justifyContent: "center",
          background: T.surfaceAlt, borderRadius: 12, border: "1px dashed " + T.borderDark,
          flexDirection: "column", gap: 8, marginBottom: 14, padding: 20, textAlign: "center" }}>
          <span style={{ fontSize: 30 }}>🗺</span>
          <p style={{ color: T.inkDim, fontSize: 13, margin: 0 }}>No coordinates for this location.</p>
          <p style={{ color: T.inkMuted, fontSize: 12, margin: 0 }}>Use the links below to explore routes.</p>
        </div>
      )}

      {routeUrl && (
        <a href={routeUrl} target="_blank" rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "13px 16px", background: T.accent, color: T.white, borderRadius: 10,
            textDecoration: "none", fontWeight: 700, fontSize: 15, marginBottom: 14 }}>
          🔗 Open Route ↗
        </a>
      )}

      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
        color: T.inkMuted, marginBottom: 10 }}>Explore routes nearby</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {links.map((lnk, i) => (
          <a key={i} href={lnk.url} target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px",
              background: T.white, border: "1px solid " + T.border, borderRadius: 10,
              textDecoration: "none" }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>{lnk.icon}</span>
            <span style={{ flex: 1, fontWeight: 600, color: T.ink, fontSize: 14 }}>{lnk.label}</span>
            <span style={{ color: T.inkMuted, fontSize: 13 }}>↗</span>
          </a>
        ))}
      </div>
    </div>
  );
}

function PlanView({ plan, challengeData, onRestart }) {
  const [openPhase, setOpenPhase] = useState(0);
  const [activeTab, setActiveTab] = useState("schedule");
  const [expandedDay, setExpandedDay] = useState(null);
  const [checked, setChecked] = useState({});
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [ownerUnlocked, setOwnerUnlocked] = useState(() => { try { return localStorage.getItem("zd_owner") === "1"; } catch(e) { return false; } });
  const [showOwnerInput, setShowOwnerInput] = useState(false);
  const [ownerInput, setOwnerInput] = useState("");
  const [ownerError, setOwnerError] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const [coachMessages, setCoachMessages] = useState([]);
  const [coachInput, setCoachInput] = useState("");
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachStarted, setCoachStarted] = useState(false);
  const [showCoachUpgrade, setShowCoachUpgrade] = useState(false);
  const [regenState, setRegenState] = useState(null);
  const [planPhases, setPlanPhases] = useState(plan.phases || []);
  // Define challengeType early — needed by achievement tracker useEffect below
  const challengeType = plan.challengeType || challengeData?.challengeType || "hiking";
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [newBadge, setNewBadge] = useState(null);
  const [showBadgesModal, setShowBadgesModal] = useState(false);
  const [milestone, setMilestone] = useState(null); // {badge, xp, newLevel}
  const [showCountdown, setShowCountdown] = useState(false);
  const [showIDidIt, setShowIDidIt] = useState(false); // completion flow
  const [resolvedLat, setResolvedLat] = useState(null);
  const [resolvedLon, setResolvedLon] = useState(null);
  const coachEndRef = useRef(null);
  const earnedRef = useRef([]);
  const FREE_PHASES = ownerUnlocked ? 999 : 2;

  const stats = calcStats(checked, planPhases, challengeData?.startDate, challengeData?.date);
  const xpTotal = calcXP(earnedBadges, challengeType);
  const phase = planPhases[openPhase];
  if (!phase) return null;

  // Geocode + weather on mount
  useEffect(() => {
    const run = async () => {
      let lat = parseFloat(challengeData?.lat) || 0;
      let lon = parseFloat(challengeData?.lon) || 0;

      // geocodeCity uses fetch — works on hosted site, not in artifact sandbox
      if (!IS_PREVIEW && (!lat || !lon) && (challengeData?.manualCity || challengeData?.challengeLocation)) {
        const cityStr = challengeData?.manualCity || challengeData?.challengeLocation;
        if (cityStr && cityStr.trim() && cityStr !== "Varies" && cityStr !== "Open water") {
          const geo = await geocodeCity(cityStr);
          if (geo) { lat = geo.lat; lon = geo.lon; setResolvedLat(lat); setResolvedLon(lon); }
        }
      }

      if (lat && lon && challengeData?.date) {
        setWeatherLoading(true);
        if (IS_PREVIEW) {
          // Artifact sandbox blocks fetch() — generate a climate estimate from lat/lon/month
          // On the hosted production site this path is never taken; real API runs instead
          const month = new Date(challengeData.date).getMonth();
          const absLat = Math.abs(lat);
          const isSouthern = lat < 0;
          const summerMonth = isSouthern ? (month >= 10 || month <= 3) : (month >= 4 && month <= 9);
          const baseTemp = absLat < 15 ? 30 : absLat < 30 ? 26 : absLat < 45 ? 18 : absLat < 60 ? 10 : 2;
          const seasonAdj = summerMonth ? 6 : -6;
          const avgMax = (baseTemp + seasonAdj + 4).toFixed(1);
          const avgMin = (baseTemp + seasonAdj - 6).toFixed(1);
          const isRainy = absLat < 20 || (month >= 9 && month <= 11 && absLat > 40);
          const rain = (isRainy ? 60 + Math.floor(Math.abs(lon) % 40) : 15 + Math.floor(absLat % 20)).toString();
          const monthName = new Date(challengeData.date).toLocaleString("en-US", { month: "long" });
          setWeather({ avgMax, avgMin, rain, month: monthName, year: "est.", isForecast: false, isEstimate: true });
        } else {
          const w = await fetchWeather(lat, lon, challengeData.date);
          setWeather(w);
        }
        setWeatherLoading(false);
      }
    };
    run();
  }, []);

  // Achievement tracking
  useEffect(() => { earnedRef.current = earnedBadges; }, [earnedBadges]);
  useEffect(() => {
    const news = checkNewAchievements(checked, planPhases, earnedRef.current, challengeType);
    if (news.length > 0) {
      const prevXp = calcXP(earnedRef.current, challengeType);
      earnedRef.current = [...earnedRef.current, ...news];
      setEarnedBadges([...earnedRef.current]);
      const newXp = calcXP(earnedRef.current, challengeType);
      const allBadges = getAllAchievements(challengeType);
      const firstBadge = allBadges.find(a => a.id === news[0]);
      if (firstBadge) {
        // Check if we levelled up
        const prevLevel = getLevel(prevXp);
        const newLevel  = getLevel(newXp);
        const levelUp   = newLevel.name !== prevLevel.name ? newLevel : null;
        // Milestone triggers: week_one, halfway, phase_3_done, all_done
        const isMilestone = ["week_one","halfway","phase_3_done","all_done"].includes(news[0]);
        if (isMilestone || levelUp) {
          setMilestone({ badge: firstBadge, xp: newXp, newLevel: levelUp });
        } else {
          setNewBadge(firstBadge);
        }
      }
    }
  }, [checked]);

  // Owner unlock
  const handleOwnerUnlock = () => {
    if (ownerInput.trim().toLowerCase() === OWNER_CODE) {
      setOwnerUnlocked(true); setShowOwnerInput(false); setOwnerInput(""); setOwnerError(false);
      try { localStorage.setItem("zd_owner", "1"); } catch(e) {}
    } else {
      setOwnerError(true); setTimeout(() => setOwnerError(false), 2000);
    }
  };

  // Coach
  const completedCount = Object.values(checked).filter(Boolean).length;
  const coachSystemMsg = "You are a Zero Day personal adventure coach — direct, warm, expert.\n" +
    "CHALLENGE: " + plan.challengeName + "\n" +
    "LOCATION: " + (plan.location || "TBD") + "\n" +
    "TOTAL WEEKS: " + plan.totalWeeks + "\n" +
    "CURRENT PHASE: " + phase.phase + " — " + phase.focus + "\n" +
    "WORKOUTS COMPLETED: " + completedCount + "\n" +
    "ALL PHASES: " + planPhases.map(p => p.range + ": " + p.phase).join("; ") + "\n" +
    "FITNESS LEVEL: " + (challengeData?.fitness || "unknown") + "\n" +
    "WEEKS REMAINING: " + (challengeData?.date ? weeksUntil(challengeData.date) : "unknown") + "\n\n" +
    "Rules: Real specific advice referencing their plan. 2-4 sentences unless detail needed. Never say as an AI.\n" +
    "If they mention injury, being behind, or a setback: ask 2-3 clarifying questions first, then offer to regenerate remaining phases. When you have enough info, end your message with exactly: [OFFER_REGEN]";

  const callCoach = async (messages) => {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 500, system: coachSystemMsg, messages })
    });
    const data = await res.json();
    return (data.content || []).map(b => b.text || "").join("").trim();
  };

  const openCoach = () => {
    if (!ownerUnlocked) { setShowCoachUpgrade(true); return; }
    setCoachOpen(true);
    if (!coachStarted) {
      setCoachStarted(true); setCoachLoading(true);
      callCoach([{ role: "user", content: "Introduce yourself briefly and ask me one specific question about how I'm feeling about the " + plan.challengeName + " challenge. Under 3 sentences." }])
        .then(text => setCoachMessages([{ role: "assistant", content: text, meta: null }]))
        .catch(() => setCoachMessages([{ role: "assistant", content: "Hey! I'm your Zero Day coach. What's your biggest concern about being ready in time?", meta: null }]))
        .finally(() => setCoachLoading(false));
    }
  };

  const sendMessage = async (textOverride) => {
    const text = (textOverride || coachInput).trim();
    if (!text || coachLoading) return;
    setCoachInput("");
    const newMsgs = [...coachMessages, { role: "user", content: text, meta: null }];
    setCoachMessages(newMsgs); setCoachLoading(true);
    setTimeout(() => coachEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    try {
      const apiMsgs = newMsgs.map(m => ({ role: m.role, content: m.content }));
      const reply = await callCoach(apiMsgs);
      const hasOffer = reply.includes("[OFFER_REGEN]");
      const clean = reply.replace("[OFFER_REGEN]", "").trim();
      setCoachMessages(m => [...m, { role: "assistant", content: clean, meta: hasOffer ? "offer_regen" : null }]);
    } catch (e) {
      setCoachMessages(m => [...m, { role: "assistant", content: "Connection issue — try again?", meta: null }]);
    }
    setCoachLoading(false);
    setTimeout(() => coachEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleRegen = async () => {
    setRegenState("loading");
    const remaining = challengeData?.date ? weeksUntil(challengeData.date) : Math.ceil(plan.totalWeeks * (1 - openPhase / planPhases.length));
    const situation = coachMessages.filter(m => m.role === "user").map(m => m.content).join(" | ");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 6000, messages: [{ role: "user", content: buildRegenPrompt(plan.challengeName, plan.location, challengeData?.fitness || "some", remaining, situation, openPhase) }] })
      });
      const data = await res.json();
      const raw = (data.content || []).map(b => b.text || "").join("").trim();
      const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      const start = cleaned.indexOf("["); const end = cleaned.lastIndexOf("]");
      const newPhases = JSON.parse(cleaned.slice(start, end + 1));
      setPlanPhases([...planPhases.slice(0, openPhase), ...newPhases]);
      setRegenState("done");
      setCoachMessages(m => [...m, { role: "assistant", content: "Done! I've updated your remaining phases. Tap through to see your adjusted plan.", meta: null }]);
      setTimeout(() => setRegenState(null), 3000);
    } catch (e) {
      setRegenState(null);
      setCoachMessages(m => [...m, { role: "assistant", content: "I had trouble regenerating the plan. Try describing your situation again.", meta: null }]);
    }
  };

  const SUGGESTED = ["Am I on track?", "What should I focus on this week?", "I missed some sessions — now what?", "How do I avoid injury?"];
  const challengeDate = plan.challengeDate || challengeData?.date || null;
  const mapLat = parseFloat(challengeData?.lat || resolvedLat || 0) || 0;
  const mapLon = parseFloat(challengeData?.lon || resolvedLon || 0) || 0;

  return (
    <div style={{ fontFamily: "'Barlow',sans-serif", background: T.bg, minHeight: "100vh" }}>
      <style>{FONTS}</style>

      {/* NAV */}
      <nav style={{ padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, background: T.white, borderBottom: "1px solid " + T.border, position: "sticky", top: 0, zIndex: 50 }}>
        <button onClick={onRestart} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 18, letterSpacing: "0.05em", color: T.ink, flexShrink: 0, padding: 0 }}>
          ZERO<span style={{ color: T.accent }}>DAY</span>
        </button>

        {(() => {
          const lvl = getLevel(xpTotal);
          const nextLvl = getNextLevel(xpTotal);
          const lvlPct = getLevelPct(xpTotal);
          const streak = calcStreak(checked, planPhases);
          return (
            <button onClick={() => setShowBadgesModal(true)} style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: T.surfaceAlt, border: "1px solid " + T.border, borderRadius: 10, padding: "7px 10px", cursor: "pointer", minWidth: 0, overflow: "hidden" }}>
              <ProgressRing pct={stats.ringPct} size={32} stroke={3} color={T.accent} />
              <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.ink, fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: "0.04em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>{plan.challengeName}</div>
                  <span style={{ fontSize: 10, fontWeight: 800, color: lvl.color, background: lvl.color + "18", border: "1px solid " + lvl.color + "40", borderRadius: 20, padding: "1px 6px", whiteSpace: "nowrap", flexShrink: 0 }}>{lvl.icon} {lvl.name}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ flex: 1, height: 3, background: T.border, borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: lvlPct + "%", background: lvl.color, borderRadius: 2, transition: "width 0.5s ease" }} />
                  </div>
                  <span style={{ fontSize: 10, color: T.inkMuted, whiteSpace: "nowrap", flexShrink: 0 }}>{xpTotal}xp{streak >= 2 ? " · 🔥" + streak : ""}{stats.daysLeft !== null ? " · " + (stats.daysLeft > 60 ? Math.round(stats.daysLeft/7)+"wk" : stats.daysLeft+"d") : ""}</span>
                </div>
              </div>
            </button>
          );
        })()}
        {/* T-MINUS PILL */}
        {(() => {
          const days = IS_PREVIEW ? 84 : calcDaysLeft(challengeDate);
          const col = tminusColor(days, T);
          const { main } = tminusLabel(days);
          return (
            <button onClick={() => setShowCountdown(true)}
              style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                background: col + "15", border: "1px solid " + col + "50",
                borderRadius: 10, padding: "5px 10px", cursor:"pointer", flexShrink: 0, minWidth: 54 }}>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900,
                fontSize: days !== null && days < 100 ? 18 : 14,
                color: col, letterSpacing:"0.02em", lineHeight:1 }}>{main}</span>
              <span style={{ fontSize:9, color: col, fontWeight:700, textTransform:"uppercase",
                letterSpacing:"0.06em", opacity:0.8, lineHeight:1.2 }}>days</span>
            </button>
          );
        })()}

        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button onClick={() => setShowOwnerInput(s => !s)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: ownerUnlocked ? T.green : T.border, padding: "4px 6px" }}>
            {ownerUnlocked ? "🔓" : "••••"}
          </button>
        </div>
      </nav>

      {/* OWNER LOCK BUTTON — click 🔓 when already unlocked to re-lock */}
      {ownerUnlocked && showOwnerInput && (() => {
        const doLock = () => { setOwnerUnlocked(false); setShowOwnerInput(false); try { localStorage.removeItem("zd_owner"); } catch(e) {} };
        return (
          <div onClick={() => setShowOwnerInput(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div onClick={e => e.stopPropagation()} style={{ background: T.white, borderRadius: 16, padding: 28, width: 300, textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔓</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Owner Mode Active</div>
              <div style={{ fontSize: 13, color: T.inkMuted, marginBottom: 20 }}>All premium features unlocked.</div>
              <button onClick={doLock} style={{ padding: "8px 20px", background: T.surfaceAlt, border: "1px solid " + T.border, borderRadius: 8, cursor: "pointer", fontSize: 13, color: T.inkDim }}>🔒 Lock & sign out</button>
            </div>
          </div>
        );
      })()}

      {/* OWNER MODAL */}
      {!ownerUnlocked && showOwnerInput && (
        <div onClick={() => setShowOwnerInput(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: T.white, borderRadius: 16, padding: 24, width: 280 }}>
            <p style={{ margin: "0 0 12px", fontWeight: 600, color: T.ink }}>Owner Access</p>
            <input autoFocus value={ownerInput} onChange={e => setOwnerInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleOwnerUnlock()} placeholder="Enter code" style={{ width: "100%", padding: "10px 12px", border: "1px solid " + (ownerError ? T.red : T.border), borderRadius: 8, fontSize: 14, outline: "none", marginBottom: 10, boxSizing: "border-box" }} />
            <button onClick={handleOwnerUnlock} style={{ width: "100%", background: T.accent, color: T.white, border: "none", borderRadius: 8, padding: "10px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Unlock</button>
          </div>
        </div>
      )}

      {/* HERO */}
      <div style={{ background: phase.color || T.accent, padding: "20px 16px 16px", color: T.white }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 32, fontWeight: 900, letterSpacing: "0.01em", textTransform: "uppercase", lineHeight: 1.05, marginBottom: 6 }}>{plan.heroLine || plan.challengeName}</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12, opacity: 0.85 }}>
          {plan.location && <span>📍 {plan.location}</span>}
          {challengeData?.date && <span>📅 {formatDate(challengeData.date)}</span>}
        </div>
      </div>

      {/* PHASE TABS */}
      <div style={{ display: "flex", overflowX: "auto", background: T.white, borderBottom: "1px solid " + T.border, padding: "0 8px" }}>
        {planPhases.map((ph, i) => {
          const locked = i >= FREE_PHASES;
          return (
            <button key={i} onClick={() => { if (locked) { setShowUpgrade(true); return; } setOpenPhase(i); setActiveTab("schedule"); setExpandedDay(null); }}
              style={{ padding: "12px 14px", border: "none", borderBottom: "3px solid " + (openPhase === i ? (ph.color || T.accent) : "transparent"), background: "none", cursor: "pointer", whiteSpace: "nowrap", fontSize: 12, fontWeight: 700, color: openPhase === i ? (ph.color || T.accent) : T.inkMuted, transition: "all 0.15s", opacity: locked ? 0.55 : 1 }}>
              {locked ? "🔒 " : ph.icon + " "}{ph.range}
            </button>
          );
        })}
      </div>

      {/* PHASE HEADER */}
      <div style={{ padding: "14px 16px 0", background: T.white, borderBottom: "1px solid " + T.border }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 22 }}>{phase.icon}</span>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 20, color: phase.color || T.accent, letterSpacing: "0.03em" }}>{phase.phase}</div>
            <div style={{ fontSize: 13, color: T.inkDim }}>{phase.tagline}</div>
          </div>
          {planPhases[openPhase]?.aiUpdated && <span style={{ marginLeft: "auto", fontSize: 11, background: T.greenSoft, color: T.green, padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>🔄 AI Updated</span>}
        </div>
        <p style={{ margin: "6px 0 10px", color: T.inkMuted, fontSize: 13, lineHeight: 1.55 }}>{phase.focus}</p>

        {/* CONTENT TABS */}
        <div style={{ display: "flex", gap: 0, overflowX: "auto", marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16 }}>
          {[
            { id: "schedule", label: "📋 Schedule",   routeOnly: false },
            { id: "progress", label: "📈 Progress",   routeOnly: false },
            { id: "gear",     label: "🎒 Gear",        routeOnly: false },
            { id: "checklist",label: "✅ Checklist",   routeOnly: false },
            { id: "map",      label: "🗺 Map",          routeOnly: true  },
            { id: "weather",  label: "🌤 Weather",      routeOnly: false },
          ].filter(tab => !tab.routeOnly || isRouteType(challengeType))
           .map(tab => (
            <button key={tab.id} onClick={() => { if ((tab.id === "map" || tab.id === "weather") && !ownerUnlocked) { setShowUpgrade(true); return; } setActiveTab(tab.id); }}
              style={{ padding: "8px 12px", border: "none", borderBottom: "2px solid " + (activeTab === tab.id ? (phase.color || T.accent) : "transparent"),
                background: "none", color: activeTab === tab.id ? (phase.color || T.accent) : T.inkMuted,
                fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap" }}>
              {tab.label}{(tab.id === "map" || tab.id === "weather") && !ownerUnlocked ? " 🔒" : ""}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT AREA */}
      <div style={{ padding: "14px 16px", maxWidth: 680, margin: "0 auto" }}>

        {/* SCHEDULE TAB */}
        {activeTab === "schedule" && (() => {
          // Parse how many weeks this phase spans e.g. "Weeks 1–4" → 4 weeks
          const phaseRange = (phase.range || "").replace(/\s/g, "");
          const rm = phaseRange.match(/(\d+)[\u2013\-](\d+)/);
          const weekStart = rm ? parseInt(rm[1]) : 1;
          const weekEnd   = rm ? parseInt(rm[2]) : 4;
          const weekCount = weekEnd - weekStart + 1;
          const weeks = Array.from({ length: weekCount }, (_, wi) => weekStart + wi);

          // Current calendar week (1-based within this phase)
          const calWeek = stats.currentWeek - (weekStart - 1);
          const activeCalWeek = Math.max(1, Math.min(calWeek, weekCount));

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: 100 }}>
              {weeks.map(wk => {
                const wkKey    = `w${wk}`;
                const skipKey  = `${openPhase}-w${wk}-skip`;
                const sessions = phase.schedule || [];
                const nonRest  = sessions.filter(s => s.type !== "rest");
                const doneCount = nonRest.filter((_, si) => !!checked[`${openPhase}-${wkKey}-${si}`]).length;
                const allDone   = nonRest.length > 0 && doneCount === nonRest.length;
                const isSkipped  = !!checked[skipKey];
                const skipReason = isSkipped ? checked[skipKey] : null;
                const isExpanded = expandedDay === wkKey;
                const isCurrentWeek = wk === stats.currentWeek;
                const isFuture      = wk > stats.currentWeek;
                const prevWk   = wk - 1;
                const prevDone = prevWk < weekStart ? true
                  : !!checked[`${openPhase}-w${prevWk}-skip`]
                  || nonRest.every((_, si) => !!checked[`${openPhase}-w${prevWk}-${si}`]);
                const isSoftLocked = !prevDone && !allDone && !isSkipped;

                return (
                  <div key={wk} style={{
                    background: T.white, borderRadius: 14,
                    border: "2px solid " + (isSkipped ? T.borderDark : allDone ? T.green : isCurrentWeek ? (phase.color || T.accent) : T.border),
                    overflow: "hidden", opacity: isFuture && !prevDone ? 0.65 : 1,
                    transition: "border-color 0.2s"
                  }}>
                    {/* Week header row */}
                    <button onClick={() => setExpandedDay(isExpanded ? null : wkKey)}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
                        background: isSkipped ? T.surfaceAlt : allDone ? T.greenSoft : isCurrentWeek ? (phase.color || T.accent) + "10" : "none",
                        border: "none", cursor: "pointer", textAlign: "left" }}>
                      {/* Week completion ring */}
                      <div style={{ position: "relative", width: 40, height: 40, flexShrink: 0 }}>
                        <svg width={40} height={40} style={{ transform: "rotate(-90deg)", position: "absolute" }}>
                          <circle cx={20} cy={20} r={16} fill="none" stroke={T.border} strokeWidth={3} />
                          <circle cx={20} cy={20} r={16} fill="none"
                            stroke={allDone ? T.green : (phase.color || T.accent)}
                            strokeWidth={3}
                            strokeDasharray={2 * Math.PI * 16}
                            strokeDashoffset={2 * Math.PI * 16 * (1 - (nonRest.length > 0 ? doneCount / nonRest.length : 0))}
                            strokeLinecap="round"
                            style={{ transition: "stroke-dashoffset 0.4s ease" }} />
                        </svg>
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: allDone ? 16 : 11, fontWeight: 800,
                          color: allDone ? T.green : (phase.color || T.accent) }}>
                          {allDone ? "✓" : `${doneCount}/${nonRest.length}`}
                        </div>
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 16,
                          color: isSkipped ? T.inkMuted : allDone ? T.green : isCurrentWeek ? (phase.color || T.accent) : T.ink,
                          letterSpacing: "0.03em" }}>
                          Week {wk}
                          {isCurrentWeek && !isSkipped && <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700,
                            background: phase.color || T.accent, color: T.white,
                            padding: "2px 7px", borderRadius: 10 }}>THIS WEEK</span>}
                          {allDone && <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700,
                            background: T.greenSoft, color: T.green,
                            padding: "2px 7px", borderRadius: 10 }}>COMPLETE ✓</span>}
                          {isSkipped && <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700,
                            background: T.surfaceAlt, color: T.inkMuted,
                            padding: "2px 7px", borderRadius: 10, textTransform: "uppercase" }}>
                            SKIPPED{skipReason && skipReason !== "true" ? " · " + skipReason : ""}
                          </span>}
                        </div>
                        <div style={{ fontSize: 11, color: T.inkMuted, marginTop: 1 }}>
                          {isSkipped ? (skipReason && skipReason !== "true" ? `Skipped — ${skipReason}` : "Skipped") :
                           isSoftLocked ? "⚠️ Complete the previous week first" :
                           allDone ? "All sessions done 🎉" :
                           doneCount > 0 ? `${doneCount} of ${nonRest.length} sessions done` :
                           isCurrentWeek ? "Your active week — track your sessions" : "Tap to track sessions"}
                        </div>
                      </div>
                      <span style={{ color: T.inkMuted, fontSize: 14, flexShrink: 0 }}>{isExpanded ? "▲" : "▼"}</span>
                    </button>

                    {/* Complete Week button — always visible, not just when expanded */}
                                        {/* Week action bar */}
                    {isSoftLocked ? (
                      // Soft lock — warn but show how to unlock
                      <div style={{ borderTop: "1px solid " + T.border, padding: "10px 14px",
                        background: T.amberSoft, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                        <span style={{ fontSize: 12, color: T.amber, fontWeight: 600 }}>
                          ⚠️ Finish or skip Week {wk - 1} to unlock this week
                        </span>
                        <button onClick={e => { e.stopPropagation(); setExpandedDay(isExpanded ? null : wkKey); }}
                          style={{ fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 20,
                            border: "1px solid " + T.amber, background: "none", color: T.amber, cursor: "pointer" }}>
                          Preview ▼
                        </button>
                      </div>
                    ) : isSkipped ? (
                      // Skipped state — show undo option and coach prompt
                      <div style={{ borderTop: "1px solid " + T.border, padding: "10px 14px",
                        background: T.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                        <span style={{ fontSize: 12, color: T.inkMuted, fontWeight: 600 }}>
                          ⏭ Week {wk} skipped{skipReason && skipReason !== "true" ? " · " + skipReason : ""}
                        </span>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={e => { e.stopPropagation(); const msg = `I skipped week ${wk} of my plan${skipReason && skipReason !== "true" ? " due to " + skipReason : ""}. What adjustments should I make?`;
                            setCoachInput(msg);
                            setCoachOpen(true); }}
                            style={{ fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 20,
                              border: "1px solid " + T.accent, background: "none", color: T.accent, cursor: "pointer" }}>
                            Ask coach
                          </button>
                          <button onClick={e => { e.stopPropagation(); setChecked(p => { const n = {...p}; delete n[skipKey]; return n; }); }}
                            style={{ fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 20,
                              border: "1px solid " + T.border, background: T.white, color: T.inkDim, cursor: "pointer" }}>
                            ↩ Undo
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Normal state — complete or skip
                      <div style={{ borderTop: "1px solid " + T.border,
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "8px 14px",
                        background: allDone ? T.greenSoft : T.surfaceAlt }}>
                        <span style={{ fontSize: 12, color: allDone ? T.green : T.inkMuted, fontWeight: 600 }}>
                          {allDone ? `✓ Week ${wk} complete` : `${doneCount} of ${nonRest.length} sessions done`}
                        </span>
                        <div style={{ display: "flex", gap: 6 }}>
                          {!allDone && (
                            <button onClick={e => {
                              e.stopPropagation();
                              // Show skip reason picker via a temporary state
                              setExpandedDay(`skip-picker-${wk}`);
                            }}
                              style={{ fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 20,
                                border: "1px solid " + T.border, background: T.white, color: T.inkDim, cursor: "pointer" }}>
                              ↩ Skip week
                            </button>
                          )}
                          <button onClick={e => {
                            e.stopPropagation();
                            const updates = {};
                            nonRest.forEach((_, si) => { updates[`${openPhase}-w${wk}-${si}`] = !allDone; });
                            setChecked(p => ({ ...p, ...updates }));
                          }}
                            style={{ fontSize: 12, fontWeight: 700, padding: "5px 14px", borderRadius: 20,
                              border: "1px solid " + (allDone ? T.border : "transparent"),
                              cursor: "pointer", transition: "all 0.15s",
                              background: allDone ? T.white : (phase.color || T.accent),
                              color: allDone ? T.inkDim : T.white }}>
                            {allDone ? "↩ Unmark" : "✓ Complete week"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Skip reason picker */}
                    {expandedDay === `skip-picker-${wk}` && (
                      <div style={{ borderTop: "1px solid " + T.border, padding: "12px 14px", background: T.white }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T.ink, marginBottom: 10 }}>Why are you skipping Week {wk}?</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                          {["Injury", "Travel", "Life got busy", "Low motivation", "Other"].map(reason => (
                            <button key={reason} onClick={() => {
                              setChecked(p => ({ ...p, [skipKey]: reason }));
                              setExpandedDay(null);
                            }}
                              style={{ padding: "7px 14px", borderRadius: 20, border: "1px solid " + T.border,
                                background: T.white, color: T.ink, fontSize: 13, fontWeight: 600,
                                cursor: "pointer" }}>
                              {reason === "Injury" ? "🤕" : reason === "Travel" ? "✈️" : reason === "Life got busy" ? "🌀" : reason === "Low motivation" ? "😔" : "•"} {reason}
                            </button>
                          ))}
                        </div>
                        <button onClick={() => setExpandedDay(null)}
                          style={{ fontSize: 12, color: T.inkMuted, background: "none", border: "none", cursor: "pointer" }}>
                          Cancel
                        </button>
                      </div>
                    )}


                    {/* Expanded: show each session with its own checkbox */}
                    {isExpanded && (
                      <div style={{ borderTop: "1px solid " + T.border }}>
                        {sessions.map((session, si) => {
                          const meta = TYPE_META[session.type] || TYPE_META.rest;
                          const isRest = session.type === "rest";
                          const sKey = `${openPhase}-${wkKey}-${si}`;
                          const sDone = !!checked[sKey];
                          const isSessionOpen = expandedDay === sKey;
                          return (
                            <div key={si} style={{ borderBottom: si < sessions.length - 1 ? "1px solid " + T.border : "none",
                              background: sDone ? T.greenSoft + "60" : "none", opacity: isRest ? 0.6 : 1 }}>
                              <div style={{ display: "flex", alignItems: "center" }}>
                                {!isRest && (
                                  <button onClick={() => setChecked(p => ({ ...p, [sKey]: !p[sKey] }))}
                                    style={{ width: 48, alignSelf: "stretch", flexShrink: 0,
                                      display: "flex", alignItems: "center", justifyContent: "center",
                                      background: sDone ? T.greenSoft : "none",
                                      border: "none", borderRight: "1px solid " + T.border,
                                      cursor: "pointer", transition: "background 0.15s" }}>
                                    <div style={{ width: 22, height: 22, borderRadius: 6,
                                      border: "2px solid " + (sDone ? T.green : T.borderDark),
                                      background: sDone ? T.green : T.white,
                                      display: "flex", alignItems: "center", justifyContent: "center" }}>
                                      {sDone && <span style={{ color: T.white, fontSize: 13, lineHeight: 1, fontWeight: 700 }}>✓</span>}
                                    </div>
                                  </button>
                                )}
                                <button onClick={() => setExpandedDay(isSessionOpen ? wkKey : sKey)}
                                  style={{ flex: 1, display: "flex", alignItems: "center", gap: 12,
                                    padding: "12px 14px", background: "none", border: "none",
                                    cursor: "pointer", textAlign: "left" }}>
                                  <div style={{ width: 42, height: 42, borderRadius: 10,
                                    background: (phase.color || T.accent) + "20",
                                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800,
                                      fontSize: 11, color: phase.color || T.accent, textTransform: "uppercase",
                                      letterSpacing: "0.05em", lineHeight: 1.1, textAlign: "center" }}>
                                      {session.day || ("D" + (si + 1))}
                                    </span>
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                                      <span style={{ fontSize: 11, fontWeight: 700, color: meta.color,
                                        background: meta.bg, padding: "2px 7px", borderRadius: 10 }}>
                                        {meta.label}
                                      </span>
                                      {session.duration && <span style={{ fontSize: 11, color: T.inkMuted }}>{session.duration}</span>}
                                    </div>
                                    <div style={{ fontWeight: 700, fontSize: 14, color: T.ink,
                                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                      {session.focus}
                                    </div>
                                  </div>
                                  <span style={{ color: T.inkMuted, fontSize: 12, flexShrink: 0 }}>{isSessionOpen ? "▲" : "▼"}</span>
                                </button>
                              </div>
                              {/* Expanded session detail */}
                              {isSessionOpen && (
                                <div style={{ padding: "0 16px 16px 16px", borderTop: "1px solid " + T.border + "80" }}>
                                  {session.detail && <p style={{ margin: "12px 0 8px", fontSize: 14, color: T.inkDim, lineHeight: 1.6 }}>{session.detail}</p>}
                                  {(session.exercises || []).length > 0 && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                      {session.exercises.map((ex, ei) => (
                                        <div key={ei} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                                          padding: "8px 12px", background: T.bg, borderRadius: 8 }}>
                                          <div>
                                            <div style={{ fontWeight: 600, fontSize: 13, color: T.ink }}>{ex.name}</div>
                                            {ex.sets && <div style={{ fontSize: 11, color: T.inkMuted }}>{ex.sets}</div>}
                                          </div>
                                          {ex.videoUrl && (
                                            <a href={ex.videoUrl} target="_blank" rel="noopener noreferrer"
                                              style={{ fontSize: 11, color: T.accent, textDecoration: "none",
                                                padding: "4px 8px", background: T.accentSoft, borderRadius: 6, fontWeight: 600 }}>
                                              ▶ Watch
                                            </a>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* GEAR TAB */}
        {activeTab === "gear" && (
          <div style={{ paddingBottom: 100 }}>
            {plan.gearSummary && <div style={{ background: (phase.color || T.accent) + "15", border: "1px solid " + (phase.color || T.accent) + "30", borderRadius: 10, padding: "11px 14px", marginBottom: 14 }}><p style={{ margin: 0, color: phase.color || T.accent, fontSize: 13, fontWeight: 500, fontStyle: "italic" }}>🎒 {plan.gearSummary}</p></div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(phase.gear || []).map((g, i) => (
                <div key={i} style={{ background: T.white, border: "1px solid " + T.border, borderRadius: 12, padding: "15px 16px", borderLeft: "4px solid " + (phase.color || T.accent) }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 5, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, color: T.ink, fontSize: 14 }}>{g.item}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: g.urgency === "Buy now" ? T.red : g.urgency === "Order soon" ? T.amber : T.green, background: g.urgency === "Buy now" ? T.redSoft : g.urgency === "Order soon" ? T.amberSoft : T.greenSoft, padding: "2px 7px", borderRadius: 20 }}>{g.urgency}</span>
                  </div>
                  <p style={{ margin: "0 0 10px", color: T.inkDim, fontSize: 13, lineHeight: 1.6 }}>{g.note}</p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {(g.brands || []).map((b, bi) => (
                      <a key={bi} href={"https://www.google.com/search?q=" + encodeURIComponent(b.search || b.name) + "&tbm=shop"} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 13, fontWeight: 600, color: T.accent, background: T.accentSoft, border: "1px solid " + T.accent + "30", borderRadius: 8, padding: "8px 14px", textDecoration: "none", display: "inline-block" }}>
                        🛒 {b.name} ↗
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CHECKLIST TAB */}
        {activeTab === "checklist" && (
          <div style={{ paddingBottom: 100 }}>
            <div style={{ background: T.white, border: "1px solid " + T.border, borderRadius: 12, overflow: "hidden" }}>
              {(phase.checkmarks || []).map((c, i) => {
                const key = openPhase + "-" + i;
                const done = !!checked[key];
                return (
                  <button key={i} onClick={() => setChecked(p => ({ ...p, [key]: !p[key] }))}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "15px 16px", background: done ? T.accentSoft : T.white, border: "none", borderBottom: i < (phase.checkmarks.length - 1) ? "1px solid " + T.border : "none", cursor: "pointer", textAlign: "left", width: "100%" }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{done ? "✅" : "⬜"}</span>
                    <span style={{ fontSize: 14, color: done ? T.accent : T.ink, textDecoration: done ? "line-through" : "none", flex: 1 }}>{c}</span>
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, padding: "0 4px" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.inkDim }}>{(phase.checkmarks || []).filter((_, i) => checked[openPhase + "-" + i]).length} / {(phase.checkmarks || []).length} complete</span>
            </div>
            <div style={{ height: 6, background: T.surfaceAlt, borderRadius: 3, marginTop: 8 }}>
              <div style={{ height: "100%", borderRadius: 3, background: T.accent, width: ((phase.checkmarks || []).filter((_, i) => checked[openPhase + "-" + i]).length / Math.max(1, (phase.checkmarks || []).length) * 100) + "%", transition: "width 0.3s ease" }} />
            </div>
          </div>
        )}

        {/* PROGRESS TAB */}
        {activeTab === "progress" && (() => {
          return (
            <div style={{ paddingBottom: 100 }}>
              {/* Overall summary card */}
              <div style={{ background: T.white, border: "1px solid " + T.border, borderRadius: 14, padding: "16px", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: T.inkMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>Overall Progress</div>
                  {stats.ringPct >= 100 && (
                    <button onClick={() => setShowIDidIt(true)}
                      style={{ background: T.amber, border: "none", borderRadius: 20, padding: "6px 14px",
                        fontSize: 12, fontWeight: 800, color: "#fff", cursor: "pointer",
                        fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                      🏆 I Did It!
                    </button>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <ProgressRing pct={stats.ringPct} size={64} stroke={6} color={phase.color || T.accent} label={stats.ringPct + "%"} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 900, color: T.ink }}>{stats.doneWorkouts} sessions completed</div>
                    <div style={{ fontSize: 13, color: T.inkMuted, marginTop: 2 }}>
                      Week {stats.currentWeek} of {stats.totalPlanWeeks || "?"} · {stats.daysLeft !== null ? (stats.daysLeft > 60 ? Math.round(stats.daysLeft/7) + " weeks to go" : stats.daysLeft + " days to go") : ""}
                    </div>
                  </div>
                </div>
              </div>

              {/* Per-phase, per-week breakdown */}
              {planPhases.map((ph, pi) => {
                const isLocked = pi >= FREE_PHASES;
                const phaseRange = (ph.range || "").replace(/\s/g, "");
                const rm = phaseRange.match(/(\d+)[–\-](\d+)/);
                const weekStart = rm ? parseInt(rm[1]) : 1;
                const weekEnd   = rm ? parseInt(rm[2]) : 4;
                const weeks = Array.from({ length: weekEnd - weekStart + 1 }, (_, wi) => weekStart + wi);
                const nonRest = (ph.schedule || []).filter(s => s.type !== "rest");

                const phaseWeeksDone = weeks.filter(wk => {
                  const doneInWeek = nonRest.filter((_, si) => !!checked[`${pi}-w${wk}-${si}`]).length;
                  return doneInWeek === nonRest.length && nonRest.length > 0;
                }).length;

                return (
                  <div key={pi} style={{ background: T.white, border: "1px solid " + T.border, borderRadius: 14, overflow: "hidden", marginBottom: 10, opacity: isLocked ? 0.5 : 1 }}>
                    <div style={{ padding: "12px 16px", borderBottom: "1px solid " + T.border, display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 20 }}>{ph.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 16, color: ph.color || T.accent }}>{ph.phase}</div>
                        <div style={{ fontSize: 11, color: T.inkMuted }}>{ph.range} · {phaseWeeksDone}/{weeks.length} weeks complete</div>
                      </div>
                      {isLocked && <span style={{ fontSize: 11, color: T.inkMuted }}>🔒 Premium</span>}
                    </div>
                    <div style={{ padding: "10px 12px", display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {weeks.map(wk => {
                        const doneInWeek = nonRest.filter((_, si) => !!checked[`${pi}-w${wk}-${si}`]).length;
                        const totalInWeek = nonRest.length;
                        const allDone = totalInWeek > 0 && doneInWeek === totalInWeek;
                        const partial = doneInWeek > 0 && !allDone;
                        const isCurrentWk = wk === stats.currentWeek;
                        return (
                          <div key={wk} onClick={() => { if (!isLocked) { setOpenPhase(pi); setActiveTab("schedule"); setExpandedDay(`w${wk}`); }}}
                            style={{ width: 52, cursor: isLocked ? "default" : "pointer",
                              background: !!checked[`${pi}-w${wk}-skip`] ? T.surfaceAlt : allDone ? T.green : partial ? (ph.color || T.accent) + "30" : isCurrentWk ? (ph.color || T.accent) + "15" : T.bg,
                              border: "2px solid " + (!!checked[`${pi}-w${wk}-skip`] ? T.borderDark : allDone ? T.green : isCurrentWk ? (ph.color || T.accent) : T.border),
                              borderRadius: 10, padding: "8px 4px", textAlign: "center", transition: "all 0.15s" }}>
                            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 13,
                              color: allDone ? T.white : isCurrentWk ? (ph.color || T.accent) : T.inkDim }}>
                              Wk {wk}
                            </div>
                            <div style={{ fontSize: 10, color: allDone ? T.white : T.inkMuted, marginTop: 2 }}>
                              {!!checked[`${pi}-w${wk}-skip`] ? "skip" : allDone ? "✓" : `${doneInWeek}/${totalInWeek}`}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* MAP TAB */}
        {activeTab === "map" && (
          <div style={{ paddingBottom: 100 }}>
            <MapDisplay
              lat={mapLat} lon={mapLon}
              location={plan.location}
              challengeName={plan.challengeName}
              challengeType={challengeType}
              routeUrl={plan.routeUrl || null}
            />
          </div>
        )}

        {/* WEATHER TAB */}
        {activeTab === "weather" && (
          <div style={{ paddingBottom: 100 }}>
            {weatherLoading && <div style={{ textAlign: "center", padding: 40, color: T.inkMuted }}>Loading weather data…</div>}
            {!weatherLoading && weather && (
              <div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, color: T.inkMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>
                  📅 {weather.month} Conditions · {plan.location || "Your destination"}
                  {weather.isEstimate && <span style={{ fontSize: 10, fontWeight: 500, textTransform: "none", letterSpacing: 0, color: T.inkMuted, marginLeft: 8 }}>(climate estimate — live data on hosted site)</span>}
                </div>
                {/* ── Stat cards ── */}
                <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                  {[
                    { icon: "🌡", label: "Avg High", value: Math.round(parseFloat(weather.avgMax) * 9 / 5 + 32) + "°F", sub: weather.avgMax + "°C" },
                    { icon: "❄️", label: "Avg Low",  value: Math.round(parseFloat(weather.avgMin) * 9 / 5 + 32) + "°F", sub: weather.avgMin + "°C" },
                    { icon: "🌧", label: "Rainfall", value: weather.rain + "mm", sub: "that month" }
                  ].map((s, i) => (
                    <div key={i} style={{ flex: 1, background: T.white, border: "1px solid " + T.border, borderRadius: 12, padding: "16px 10px", textAlign: "center" }}>
                      <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: T.ink, fontFamily: "'Barlow Condensed',sans-serif", lineHeight: 1 }}>{s.value}</div>
                      <div style={{ fontSize: 12, color: T.inkMuted, marginTop: 3, fontWeight: 500 }}>{s.sub}</div>
                      <div style={{ fontSize: 10, color: T.inkMuted, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* ── Detail links — same style as Map sport links ── */}
                {(() => {
                  const wLat = resolvedLat || parseFloat(challengeData?.lat) || 0;
                  const wLon = resolvedLon || parseFloat(challengeData?.lon) || 0;
                  if (!wLat || !wLon) return null;
                  const windyUrl = "https://www.windy.com/?" + wLat.toFixed(3) + "," + wLon.toFixed(3) + ",10";
                  // NWS covers: continental US, Hawaii, Alaska, Puerto Rico, Guam
                  // Simple check: has NWS data for lat 13-72, lon -180 to -60
                  const hasNWS = wLat > 13 && wLat < 72 && wLon > -180 && wLon < -60;
                  const nwsUrl = "https://forecast.weather.gov/MapClick.php?textField1=" + wLat.toFixed(4) + "&textField2=" + wLon.toFixed(4);
                  const links = [
                    { href: windyUrl, label: "Windy.com", desc: "Animated wind & weather map" },
                    ...(hasNWS ? [{ href: nwsUrl, label: "NWS Forecast", desc: "7-day US forecast" }] : []),
                  ];
                  return (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.inkMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Detailed Forecasts</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {links.map((lk, i) => (
                          <a key={i} href={lk.href} target="_blank" rel="noopener noreferrer"
                            style={{ display: "inline-flex", alignItems: "center", gap: 6,
                              padding: "6px 12px", background: T.white,
                              border: "1px solid " + T.border, borderRadius: 20,
                              textDecoration: "none", color: T.accent,
                              fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
                            {lk.label} <span style={{ color: T.inkMuted, fontSize: 11 }}>↗</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                {plan.weatherNote && <div style={{ background: (phase.color || T.accent) + "10", border: "1px solid " + (phase.color || T.accent) + "25", borderRadius: 8, padding: "10px 13px" }}><p style={{ margin: 0, color: T.inkDim, fontSize: 13, lineHeight: 1.65 }}>🏃 <strong>Training implication:</strong> {plan.weatherNote}</p></div>}
              </div>
            )}
            {!weatherLoading && !weather && (
              <div style={{ textAlign: "center", padding: 40, color: T.inkMuted }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>☁️</div>
                <p>Weather data unavailable for this location.</p>
                {plan.weatherNote && <p style={{ fontSize: 13, fontStyle: "italic" }}>{plan.weatherNote}</p>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* COACH BUTTON */}
      <button onClick={openCoach} style={{ position: "fixed", bottom: 24, right: 16, width: 54, height: 54, borderRadius: "50%", background: ownerUnlocked ? T.accent : T.ink, color: T.white, border: "none", cursor: "pointer", fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.25)", zIndex: 90 }}>
        {coachOpen ? "✕" : "🎯"}
        {!ownerUnlocked && <span style={{ position: "absolute", top: -2, right: -2, background: T.amber, color: T.white, borderRadius: "50%", width: 16, height: 16, fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>★</span>}
      </button>

      {/* COACH PANEL */}
      {coachOpen && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: "65vh", background: T.white, borderRadius: "16px 16px 0 0", boxShadow: "0 -8px 40px rgba(0,0,0,0.15)", zIndex: 95, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid " + T.border, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🎯</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 16, color: T.ink }}>Zero Day Coach</div>
              <div style={{ fontSize: 11, color: T.inkMuted }}>{plan.challengeName}</div>
            </div>
            <button onClick={() => setCoachOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: T.inkMuted, padding: 4 }}>✕</button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {coachLoading && coachMessages.length === 0 && (
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: T.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>🎯</div>
                <div style={{ background: T.surfaceAlt, borderRadius: "4px 12px 12px 12px", padding: "8px 12px", display: "flex", gap: 4, alignItems: "center" }}>
                  {[0, 1, 2].map(j => <span key={j} style={{ width: 6, height: 6, borderRadius: "50%", background: T.inkMuted, display: "inline-block", animation: "bounce 1.4s ease-in-out " + (j * 0.16) + "s infinite" }} />)}
                </div>
              </div>
            )}
            {coachMessages.map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 8, justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                {m.role === "assistant" && <div style={{ width: 26, height: 26, borderRadius: "50%", background: T.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>🎯</div>}
                <div style={{ maxWidth: "80%" }}>
                  <div style={{ background: m.role === "user" ? T.accent : T.surfaceAlt, color: m.role === "user" ? T.white : T.ink, borderRadius: m.role === "user" ? "12px 4px 12px 12px" : "4px 12px 12px 12px", padding: "8px 12px", fontSize: 13, lineHeight: 1.55 }}>{m.content}</div>
                  {m.meta === "offer_regen" && (
                    <button onClick={handleRegen} disabled={regenState === "loading"}
                      style={{ marginTop: 8, background: T.green, color: T.white, border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "block", width: "100%" }}>
                      {regenState === "loading" ? "Updating plan…" : regenState === "done" ? "✅ Plan Updated!" : "🔄 Update My Remaining Plan"}
                    </button>
                  )}
                </div>
                {m.role === "user" && <div style={{ width: 26, height: 26, borderRadius: "50%", background: T.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>👤</div>}
              </div>
            ))}
            {coachLoading && coachMessages.length > 0 && (
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: T.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>🎯</div>
                <div style={{ background: T.surfaceAlt, borderRadius: "4px 12px 12px 12px", padding: "8px 12px", display: "flex", gap: 4, alignItems: "center" }}>
                  {[0, 1, 2].map(j => <span key={j} style={{ width: 6, height: 6, borderRadius: "50%", background: T.inkMuted, display: "inline-block", animation: "bounce 1.4s ease-in-out " + (j * 0.16) + "s infinite" }} />)}
                </div>
              </div>
            )}
            {!coachStarted && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {SUGGESTED.map((q, i) => (
                  <button key={i} onClick={() => sendMessage(q)} style={{ background: T.accentSoft, color: T.accent, border: "1px solid " + T.accent + "30", borderRadius: 20, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", textAlign: "left" }}>{q}</button>
                ))}
              </div>
            )}
            <div ref={coachEndRef} />
          </div>
          <div style={{ padding: "10px 16px", borderTop: "1px solid " + T.border, display: "flex", gap: 8 }}>
            <input value={coachInput} onChange={e => setCoachInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder="Ask your coach..." style={{ flex: 1, padding: "10px 14px", border: "1px solid " + T.border, borderRadius: 24, fontSize: 14, outline: "none" }} />
            <button onClick={() => sendMessage()} disabled={!coachInput.trim() || coachLoading} style={{ background: T.accent, color: T.white, border: "none", borderRadius: "50%", width: 40, height: 40, cursor: "pointer", fontSize: 16, flexShrink: 0 }}>→</button>
          </div>
        </div>
      )}

      {/* COUNTDOWN MODAL */}
      {showCountdown && <CountdownModal
        plan={plan} challengeData={challengeData}
        challengeDate={IS_PREVIEW ? new Date(Date.now() + 84*86400000).toISOString().split("T")[0] : challengeDate}
        onClose={() => setShowCountdown(false)}
      />}

      {/* BADGE TOAST */}
      {newBadge && <BadgeToast badge={newBadge} onDone={() => setNewBadge(null)} />}

      {/* MILESTONE CELEBRATION */}
      {milestone && <MilestoneCelebration
        badge={milestone.badge}
        xp={milestone.xp}
        newLevel={milestone.newLevel}
        onDone={() => {
          setMilestone(null);
          // If this was the all_done badge, launch the I Did It flow
          if (milestone.badge?.id === "all_done") setShowIDidIt(true);
        }}
      />}

      {/* I DID IT FLOW */}
      {showIDidIt && <IDidItFlow
        plan={plan}
        challengeData={challengeData}
        earnedBadges={earnedBadges}
        xpTotal={xpTotal}
        challengeType={challengeType}
        onClose={() => setShowIDidIt(false)}
      />}

      {/* ACHIEVEMENTS MODAL */}
      {showBadgesModal && (() => {
        const lvl = getLevel(xpTotal);
        const nextLvl = getNextLevel(xpTotal);
        const lvlPct = getLevelPct(xpTotal);
        const streak = calcStreak(checked, planPhases);
        const challBadges = getChallengeAchievements(challengeType);
        const universalBadges = ACHIEVEMENTS_UNIVERSAL;
        const BadgeCard = ({a}) => {
          const earned = earnedBadges.includes(a.id);
          return (
            <div style={{ background: earned ? (lvl.color + "12") : T.surfaceAlt,
              border: "1px solid " + (earned ? lvl.color + "50" : T.border),
              borderRadius: 12, padding: "12px 10px", textAlign: "center",
              opacity: earned ? 1 : 0.45, transition: "all 0.2s",
              boxShadow: earned ? "0 2px 12px " + lvl.color + "20" : "none" }}>
              <div style={{ fontSize: 26, marginBottom: 5,
                filter: earned ? "none" : "grayscale(1)" }}>{a.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: earned ? T.ink : T.inkMuted, marginBottom: 2, lineHeight: 1.2 }}>{a.label}</div>
              <div style={{ fontSize: 10, color: T.inkMuted, marginBottom: 5, lineHeight: 1.4 }}>{earned ? a.desc : a.hint}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: earned ? lvl.color : T.border }}>{earned ? "+" + a.xp + " XP ✓" : a.xp + " XP"}</div>
            </div>
          );
        };
        return (
          <div onClick={() => setShowBadgesModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            <div onClick={e => e.stopPropagation()} style={{ background: T.bg, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 500, maxHeight: "88vh", overflowY: "auto", paddingBottom: 40 }}>
              {/* Header */}
              <div style={{ padding: "20px 16px 0", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 24, color: T.ink, letterSpacing: "0.02em" }}>YOUR JOURNEY</div>
                <button onClick={() => setShowBadgesModal(false)} style={{ background: "none", border: "none", fontSize: 20, color: T.inkMuted, cursor: "pointer", padding: 4 }}>✕</button>
              </div>

              {/* Level Card */}
              <div style={{ margin: "0 16px 16px", background: T.white, borderRadius: 16, padding: "16px", border: "2px solid " + lvl.color + "40",
                boxShadow: "0 4px 20px " + lvl.color + "15" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: lvl.color + "18",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0,
                    border: "2px solid " + lvl.color + "50" }}>{lvl.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 22,
                      color: lvl.color, letterSpacing: "0.05em", textTransform: "uppercase" }}>{lvl.name}</div>
                    <div style={{ fontSize: 12, color: T.inkMuted }}>{xpTotal} XP earned{nextLvl ? " · " + (nextLvl.min - xpTotal) + " to " + nextLvl.name : " · Max level!"}</div>
                  </div>
                  {streak >= 2 && <div style={{ textAlign: "center", flexShrink: 0 }}>
                    <div style={{ fontSize: 22 }}>🔥</div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: T.amber }}>{streak} WKS</div>
                  </div>}
                </div>
                {/* XP progress bar */}
                <div style={{ background: T.border, borderRadius: 4, height: 8, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: lvlPct + "%", background: lvl.color,
                    borderRadius: 4, transition: "width 0.6s ease",
                    boxShadow: "0 0 8px " + lvl.color + "60" }} />
                </div>
                {nextLvl && <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                  <span style={{ fontSize: 10, color: T.inkMuted }}>{lvl.name}</span>
                  <span style={{ fontSize: 10, color: T.inkMuted }}>{nextLvl.icon} {nextLvl.name}</span>
                </div>}
                {/* Stats row */}
                <div style={{ display: "flex", gap: 0, marginTop: 12, borderTop: "1px solid " + T.border, paddingTop: 12 }}>
                  {[
                    {v: stats.doneWorkouts, l: "Sessions"},
                    {v: earnedBadges.length, l: "Badges"},
                    {v: streak >= 1 ? streak + " wk" : "—", l: "Streak"},
                    {v: stats.daysLeft !== null ? (stats.daysLeft > 0 ? (stats.daysLeft > 60 ? Math.round(stats.daysLeft/7)+"wk" : stats.daysLeft+"d") : "Done!") : "—", l: "To go"},
                  ].map((s,i) => (
                    <div key={i} style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 18, color: T.ink }}>{s.v}</div>
                      <div style={{ fontSize: 10, color: T.inkMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Challenge-specific badges */}
              <div style={{ padding: "0 16px 4px" }}>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 14,
                  color: T.ink, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
                  🎯 Your Challenge Badges
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 20 }}>
                  {challBadges.map(a => <BadgeCard key={a.id} a={a} />)}
                </div>

                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 14,
                  color: T.ink, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
                  🏅 All Achievements
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(100px,1fr))", gap: 8 }}>
                  {universalBadges.map(a => <BadgeCard key={a.id} a={a} />)}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* UPGRADE MODAL */}
      {showUpgrade && (
        <div onClick={() => setShowUpgrade(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: T.white, borderRadius: 20, padding: 28, maxWidth: 340, width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⭐</div>
            <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 24, textTransform: "uppercase", color: T.ink, margin: "0 0 8px" }}>Unlock Full Plan</h2>
            <p style={{ color: T.inkDim, fontSize: 14, lineHeight: 1.7, margin: "0 0 20px" }}>Get all phases, AI coaching, adaptive plan updates, route maps, and real weather data.</p>
            <div style={{ background: T.surfaceAlt, borderRadius: 10, padding: "12px 14px", marginBottom: 20, textAlign: "left" }}>
              {["All training phases", "AI Coach Chat", "Adaptive plan if you fall behind", "Route maps + AllTrails integration", "Real weather data"].map((f, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", padding: "5px 0", fontSize: 13, color: T.inkDim, borderBottom: i < 4 ? "1px solid " + T.border : "none" }}>
                  <span style={{ color: T.green, fontWeight: 700 }}>✓</span>{f}
                </div>
              ))}
            </div>
            <button style={{ width: "100%", background: T.accent, color: T.white, border: "none", borderRadius: 8, padding: 14, fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 8 }}>Upgrade — $9 / month</button>
            <button onClick={() => setShowUpgrade(false)} style={{ width: "100%", background: "none", color: T.inkMuted, border: "1px solid " + T.border, borderRadius: 8, padding: 11, fontSize: 13, cursor: "pointer" }}>Maybe later</button>
          </div>
        </div>
      )}

      {/* COACH UPGRADE MODAL */}
      {showCoachUpgrade && (
        <div onClick={() => setShowCoachUpgrade(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: T.white, borderRadius: 20, padding: 28, maxWidth: 340, width: "100%", textAlign: "center" }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: T.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", fontSize: 26 }}>⭐</div>
            <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 24, textTransform: "uppercase", color: T.ink, margin: "0 0 8px" }}>Meet Your Coach</h2>
            <p style={{ color: T.inkDim, fontSize: 14, lineHeight: 1.7, margin: "0 0 20px" }}>Ask anything — injured? Behind schedule? Am I ready? — and get a real answer based on your plan.</p>
            <button style={{ width: "100%", background: T.accent, color: T.white, border: "none", borderRadius: 8, padding: 14, fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 8 }}>Upgrade — $9 / month</button>
            <button onClick={() => setShowCoachUpgrade(false)} style={{ width: "100%", background: "none", color: T.inkMuted, border: "1px solid " + T.border, borderRadius: 8, padding: 11, fontSize: 13, cursor: "pointer" }}>Maybe later</button>
          </div>
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// API CALL — works server-side when hosted, preview mode in artifact
// ═══════════════════════════════════════════════════════════════

// When hosted on Vercel/Netlify, this calls your /api/generate endpoint.
// In the claude.ai artifact preview, IS_PREVIEW=true so we use sample data.
const IS_PREVIEW = typeof window !== "undefined" && !window.location.hostname.includes("localhost") && !window.location.hostname.includes("vercel") && !window.location.hostname.includes("netlify");

async function generatePlan(challengeLabel, challengeLocation, fitness, weeks, injuries) {
  const fitnessMap = { beginner: "Starting Fresh", some: "Some Activity", active: "Regularly Active", athlete: "Athletic" };
  const numPhases = Math.min(Math.max(Math.ceil(weeks / 3), 2), 4);

  // Build injury context block
  const injuryBlock = injuries && injuries.length > 0
    ? "INJURIES/LIMITATIONS: " + injuries.join(", ") + "\n" +
      "INJURY RULES (NON-NEGOTIABLE):\n" +
      injuries.map(inj => {
        if (inj.toLowerCase().includes("knee")) return "- No running, jumping, or heavy leg press. Use low-impact cardio (cycling, pool, elliptical). Progress walking load slowly.";
        if (inj.toLowerCase().includes("back") || inj.toLowerCase().includes("disc")) return "- No heavy deadlifts, loaded forward bends, or high-impact jarring. Core stability work (bird-dog, dead bug, pallof press) is essential. No sit-ups or crunches.";
        if (inj.toLowerCase().includes("shoulder")) return "- No overhead pressing or heavy pulling. Focus on rotator cuff stability and scapular control.";
        if (inj.toLowerCase().includes("hip")) return "- Avoid deep squats and hip flexor loading. Glute activation and lateral band work instead.";
        return "- Adapt all sessions to accommodate: " + inj + ". Prioritize pain-free movement.";
      }).join("\n") + "\n\n"
    : "";

  const prompt = "You are Zero Day, an elite adventure training coach and sports physiotherapist. Build a safe, effective, personalized training plan.\n\n" +
    "CHALLENGE: " + challengeLabel + "\n" +
    "LOCATION: " + (challengeLocation || "TBD") + "\n" +
    "CURRENT FITNESS: " + (fitnessMap[fitness] || fitness) + "\n" +
    "TOTAL WEEKS: " + weeks + "\n" +
    injuryBlock +
    "Respond ONLY with a single valid JSON object. No markdown, no explanation.\n\n" +
    "Required: challengeName, challengeType, location, heroLine (max 8 words), totalWeeks, weatherNote, locationTip, gearSummary, injuryNote (1 sentence on how plan respects limitations), phases (array of " + numPhases + ").\n\n" +
    "Each phase: id, range, phase, tagline (6 words), color (hex), icon (emoji), focus (1 sentence — mention injury adaptations in early phases), schedule (exactly 7 days Mon-Sun), gear (3-5 items), checkmarks (4-6 strings).\n\n" +
    "Each schedule day: day, label, type (cardio/strength/recovery/rest), duration, detail (2 sentences — be injury-aware), form (2 sentences), sets (or null), why (1 sentence), videoSearch (for strength/yoga only else null).\n\n" +
    "Each gear item: item, urgency (Buy now/Order soon/Nice to have), note (1 sentence), brands (exactly 2 with name and search).\n\n" +
    "RULES: " + numPhases + " phases, spread weeks evenly, Sunday always rest, be specific to challenge, NEVER prescribe exercises that violate the injury rules. SHORT text.";

  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt })
  });
  if (!res.ok) throw new Error("Server error: " + res.status);
  const data = await res.json();
  return data.plan;
}

// Sample plan shown in preview/artifact mode so the UI is fully explorable
const SAMPLE_PLAN = {
  challengeName: "Gorilla Trek",
  challengeType: "hiking",
  location: "Bwindi Impenetrable Forest, Uganda",
  heroLine: "Into the jungle, face to face",
  totalWeeks: 16,
  weatherNote: "Expect humid 18-24°C conditions with frequent rain — train in heat and wet gear.",
  locationTip: "Altitude reaches 2400m; include elevation hikes in your training.",
  gearSummary: "Waterproof hiking boots and trekking poles are non-negotiable.",
  phases: [
    {
      id: "phase-1", range: "Weeks 1–4", phase: "Foundation",
      tagline: "Build the base", color: "#2d6a4f", icon: "🌱",
      focus: "Establish aerobic base and introduce leg strength for jungle terrain.",
      schedule: [
        { day: "Mon", label: "Brisk Walk / Easy Hike", type: "cardio", duration: "45 min", detail: "Walk at a brisk pace on varied terrain, ideally with some incline. Focus on consistent breathing and finding a sustainable rhythm.", form: "Keep your chest open and arms swinging naturally. Engage your core lightly to support your spine on uneven ground.", sets: null, why: "Builds your aerobic base — the engine for multi-hour jungle trekking.", videoSearch: null },
        { day: "Tue", label: "Leg Strength Circuit", type: "strength", duration: "40 min", detail: "Squats, lunges, step-ups, and calf raises. 3 rounds of 12 reps each with 60s rest between rounds.", form: "On squats, keep knees tracking over toes and chest tall. Drive through your heel on step-ups to engage glutes.", sets: "3×12", why: "Gorilla treks involve steep, rooted trails — strong legs prevent fatigue and injury.", videoSearch: "bodyweight leg strength circuit for hikers" },
        { day: "Wed", label: "Active Recovery Walk", type: "recovery", duration: "30 min", detail: "Easy flat walk at conversational pace. Focus on loosening the legs from Tuesday's session.", form: "Relax your shoulders and jaw. Use this as a mental reset, not a workout.", sets: null, why: "Active recovery flushes lactic acid faster than rest alone.", videoSearch: null },
        { day: "Thu", label: "Hill Intervals", type: "cardio", duration: "45 min", detail: "Find a hill and walk up hard, walk down easy. Repeat 6–8 times. Rest 2 min after the set.", form: "Lean into the hill slightly — don't hunch. Push through your whole foot on each step.", sets: "6–8 reps", why: "Bwindi has relentless climbs. Hill repeats build exactly the fitness you need.", videoSearch: null },
        { day: "Fri", label: "Core & Stability", type: "strength", duration: "30 min", detail: "Plank variations, bird-dogs, glute bridges, and single-leg balance. 3 rounds.", form: "On planks, squeeze your glutes and don't let your hips sag. Quality over duration.", sets: "3×45s", why: "A stable core protects your lower back on uneven jungle terrain.", videoSearch: "hiking core stability workout" },
        { day: "Sat", label: "Long Hike", type: "cardio", duration: "90 min", detail: "Your weekly long hike — add a light pack (5kg) and find the most uneven terrain available. Build to 2 hours by week 4.", form: "Check in with your posture every 15 minutes. Shoulders back, eyes scanning ahead.", sets: null, why: "The gorilla trek is 4–8 hours — your long hike builds the endurance and mental resilience.", videoSearch: null },
        { day: "Sun", label: "Rest", type: "rest", duration: "—", detail: "Full rest. Light stretching or yoga optional.", form: null, sets: null, why: "Recovery is where fitness is built.", videoSearch: null }
      ],
      gear: [
        { item: "Waterproof Hiking Boots", urgency: "Buy now", note: "Need 6–8 weeks to break in before your trek.", brands: [{ name: "Salomon X Ultra 4 GTX", search: "Salomon X Ultra 4 GTX hiking boots" }, { name: "Merrell Moab 3 WP", search: "Merrell Moab 3 waterproof hiking boots" }] },
        { item: "Trekking Poles", urgency: "Buy now", note: "Essential for steep descents and river crossings in Bwindi.", brands: [{ name: "Black Diamond Trail Ergo Cork", search: "Black Diamond Trail Ergo Cork trekking poles" }, { name: "Leki Makalu Lite", search: "Leki Makalu Lite trekking poles" }] },
        { item: "Daypack 20–25L", urgency: "Order soon", note: "Waterproof or with rain cover — Bwindi rain is sudden and heavy.", brands: [{ name: "Osprey Talon 22", search: "Osprey Talon 22 daypack" }, { name: "Deuter Speed Lite 24", search: "Deuter Speed Lite 24 hiking pack" }] }
      ],
      checkmarks: ["Hike 90 minutes continuously with a pack", "Complete 3 hill sessions without stopping", "No knee or ankle pain after long hikes", "Established 4x/week training habit"]
    },
    {
      id: "phase-2", range: "Weeks 5–9", phase: "Build",
      tagline: "Go longer, go steeper", color: "#1d4e89", icon: "⛰️",
      focus: "Increase duration and pack weight; introduce humidity and heat training.",
      schedule: [
        { day: "Mon", label: "Tempo Hike", type: "cardio", duration: "60 min", detail: "Hike at the upper edge of comfortable pace — you can speak in short sentences but not chat freely. Aim for sustained effort.", form: "Stay tall and drive your elbows back on uphills. Don't lean excessively from the hips.", sets: null, why: "Tempo work raises your lactate threshold, making hard terrain feel easier.", videoSearch: null },
        { day: "Tue", label: "Weighted Leg Day", type: "strength", duration: "45 min", detail: "Goblet squats, Romanian deadlifts, reverse lunges, and box step-ups with dumbbells. 4 rounds.", form: "On RDLs, hinge at the hip with a neutral spine — feel the stretch in your hamstrings before you stand.", sets: "4×10", why: "Carrying gear on steep wet trails demands serious leg strength.", videoSearch: "dumbbell leg workout for hikers" },
        { day: "Wed", label: "Recovery + Stretch", type: "recovery", duration: "30 min", detail: "Easy walk followed by 15 minutes of hip flexor, hamstring and calf stretching.", form: "Hold each stretch 45–60 seconds. Breathe into the tight areas.", sets: null, why: "Flexibility prevents the muscle tightness that accumulates in multi-day hiking.", videoSearch: null },
        { day: "Thu", label: "Loaded Hill Repeats", type: "cardio", duration: "55 min", detail: "Same hill as Phase 1 but now with your daypack loaded to 8kg. 8–10 repeats.", form: "The pack changes your center of gravity — consciously keep shoulders back and don't let the weight pull you forward.", sets: "8–10 reps", why: "You will carry a pack in Bwindi. Train as you will race.", videoSearch: null },
        { day: "Fri", label: "Balance & Ankle Strength", type: "strength", duration: "35 min", detail: "Single-leg stands on unstable surface, lateral band walks, ankle circles with resistance. 3 rounds.", form: "On single-leg balance, soften the standing knee and engage your glute. Progress to eyes closed when stable.", sets: "3×30s each", why: "Rooted jungle trails demand ankle stability — this is injury prevention.", videoSearch: "ankle stability exercises for trail hiking" },
        { day: "Sat", label: "Long Hike with Pack", type: "cardio", duration: "2.5 hrs", detail: "Full daypack (8–10kg), target the longest and most technical terrain available. Build to 3 hours by week 9.", form: "Every 45 minutes, stop for 3 minutes, check your form and hydrate. Keep a steady pace rather than racing.", sets: null, why: "Building time-on-feet with load is the single most important prep for the gorilla trek.", videoSearch: null },
        { day: "Sun", label: "Rest", type: "rest", duration: "—", detail: "Full rest. Foam roll if your legs are heavy.", form: null, sets: null, why: "Your body adapts during rest, not during training.", videoSearch: null }
      ],
      gear: [
        { item: "Waterproof Trousers", urgency: "Order soon", note: "Lightweight packable pair for Bwindi's unpredictable downpours.", brands: [{ name: "Patagonia Torrentshell 3L", search: "Patagonia Torrentshell 3L pants" }, { name: "Montane Minimus Pants", search: "Montane Minimus waterproof trousers" }] },
        { item: "Moisture-Wicking Base Layers", urgency: "Order soon", note: "Avoid cotton entirely — wet cotton causes chafing and hypothermia in Bwindi's climate.", brands: [{ name: "Icebreaker 150 Zone", search: "Icebreaker 150 Zone merino base layer" }, { name: "Smartwool Merino 150", search: "Smartwool Merino 150 base layer" }] }
      ],
      checkmarks: ["Completed 3-hour hike with full pack", "8kg pack feels manageable on hills", "No blisters — boots fully broken in", "Comfortable hiking in rain gear"]
    },
    {
      id: "phase-3", range: "Weeks 10–13", phase: "Peak",
      tagline: "Simulate the real thing", color: "#0077b6", icon: "🦍",
      focus: "Trek-specific simulation days — long, loaded, and in full kit.",
      schedule: [
        { day: "Mon", label: "Active Recovery Hike", type: "recovery", duration: "45 min", detail: "Easy pace, flat terrain, no pack. Flush the legs from the weekend long effort.", form: "Focus on smooth foot placement. Walk heel-to-toe on flat ground.", sets: null, why: "Recovery between peak efforts prevents overtraining.", videoSearch: null },
        { day: "Tue", label: "Power Hiking Intervals", type: "cardio", duration: "60 min", detail: "5 min hard power hike, 2 min easy. Repeat 7 times. Use full pack.", form: "During hard intervals, pump your arms aggressively — they drive your legs uphill.", sets: "7×5 min", why: "Interval training improves your ability to handle the unpredictable intensity of jungle terrain.", videoSearch: null },
        { day: "Wed", label: "Full Body Strength", type: "strength", duration: "45 min", detail: "Upper body pull (rows, pull-ups) + leg circuit. 4 rounds. Your last heavy strength session before taper.", form: "Control the eccentric on every rep. The lowering phase builds more muscle.", sets: "4×10", why: "Upper body strength matters for ducking under roots and pulling yourself up steep sections.", videoSearch: "full body strength training hikers" },
        { day: "Thu", label: "Rest or Easy Walk", type: "recovery", duration: "30 min", detail: "Complete rest or gentle 30-min walk. Prepare for the big weekend.", form: null, sets: null, why: "Pre-loading rest before your simulation day is critical.", videoSearch: null },
        { day: "Fri", label: "Gear Check Hike", type: "cardio", duration: "60 min", detail: "Wear your exact trek kit — every item you'll have in Uganda. Test everything works together.", form: "Check for hot spots on feet after 20 mins and 40 mins. Address immediately.", sets: null, why: "Discovering a kit problem now gives you weeks to fix it.", videoSearch: null },
        { day: "Sat", label: "Trek Simulation Day", type: "cardio", duration: "4–5 hrs", detail: "Your longest day. Full pack, full kit, maximum terrain challenge available. Treat this like the real thing — start early, pack snacks, take proper breaks.", form: "Practice your nutrition and hydration strategy exactly as you plan to use it in Uganda.", sets: null, why: "Nothing prepares you for a 4-6 hour jungle trek like a 4-5 hour simulation. This is the hardest day.", videoSearch: null },
        { day: "Sun", label: "Rest", type: "rest", duration: "—", detail: "Complete rest after your simulation day. Eat well and sleep.", form: null, sets: null, why: "You just did your peak effort. Absorb it.", videoSearch: null }
      ],
      gear: [
        { item: "Insect Repellent (DEET 50%+)", urgency: "Buy now", note: "Bwindi has mosquitoes and biting insects — high-strength DEET is non-negotiable.", brands: [{ name: "Sawyer Picaridin", search: "Sawyer Picaridin insect repellent" }, { name: "Ben's 100 DEET", search: "Ben's 100 DEET insect repellent" }] },
        { item: "Waterproof Stuff Sacks", urgency: "Nice to have", note: "Keep your camera, phone and valuables dry in river crossings.", brands: [{ name: "Sea to Summit Ultra-Sil", search: "Sea to Summit Ultra-Sil dry sack" }, { name: "Ortlieb Dry Bags", search: "Ortlieb dry bag set" }] }
      ],
      checkmarks: ["Completed 4-hour trek simulation", "Nutrition and hydration strategy tested", "All gear tested and comfortable", "Feeling strong on steep terrain"]
    },
    {
      id: "phase-4", range: "Weeks 14–16", phase: "Taper",
      tagline: "Trust the training", color: "#7b2d00", icon: "🏆",
      focus: "Reduce volume, maintain sharpness, and prepare mentally for the trek.",
      schedule: [
        { day: "Mon", label: "Easy Hike", type: "cardio", duration: "40 min", detail: "Gentle terrain, no pack. Just move and enjoy the feeling of fitness you've built.", form: "Notice how much easier everything feels. That's your fitness.", sets: null, why: "Tapering lets your body fully recover and consolidate all your training gains.", videoSearch: null },
        { day: "Tue", label: "Light Leg Maintenance", type: "strength", duration: "30 min", detail: "Bodyweight squats, lunges, step-ups. 2 rounds only. The goal is to feel good, not tired.", form: "Move through full range of motion. This is maintenance, not building.", sets: "2×10", why: "Keeping the muscles activated during taper prevents the sluggish feeling of complete rest.", videoSearch: null },
        { day: "Wed", label: "Rest", type: "rest", duration: "—", detail: "Complete rest.", form: null, sets: null, why: "You've done the work.", videoSearch: null },
        { day: "Thu", label: "Shakeout Hike", type: "cardio", duration: "35 min", detail: "Easy hike with your daypack lightly loaded. Final test that everything feels good.", form: "Scan your body from feet to head. Note anything that needs attention.", sets: null, why: "A short loaded hike keeps your hiking muscles awake and confident.", videoSearch: null },
        { day: "Fri", label: "Yoga / Stretch Session", type: "recovery", duration: "30 min", detail: "Full body yoga flow or guided stretch. Focus on hips, calves, and lower back.", form: "Don't push into any discomfort. Gentle movement only.", sets: null, why: "Arrive at the trailhead relaxed and mobile, not stiff.", videoSearch: "yoga for hikers before big hike" },
        { day: "Sat", label: "Rest", type: "rest", duration: "—", detail: "Rest. Pack your bag. Read about Bwindi.", form: null, sets: null, why: "Physical and mental preparation.", videoSearch: null },
        { day: "Sun", label: "Rest", type: "rest", duration: "—", detail: "Rest completely.", form: null, sets: null, why: "Zero Day is coming.", videoSearch: null }
      ],
      gear: [
        { item: "Gorilla Trekking Permit", urgency: "Buy now", note: "Book 6+ months ahead — they sell out. $700 USD through Uganda Wildlife Authority.", brands: [{ name: "Uganda Wildlife Authority", search: "Uganda Wildlife Authority gorilla permit booking" }, { name: "Certified Safari Operator", search: "gorilla trekking permit Uganda certified operator" }] }
      ],
      checkmarks: ["Permit confirmed and flights booked", "All gear packed and tested", "Feeling rested and excited", "Ready for Zero Day 🦍"]
    }
  ]
};

// ═══════════════════════════════════════════════════════════════
// ERROR SCREEN
// ═══════════════════════════════════════════════════════════════
function ErrorScreen({ error, onRetry }) {
  return (
    <div style={{fontFamily:"'Barlow',sans-serif",background:T.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:32}}>
      <style>{FONTS}</style>
      <div style={{textAlign:"center",maxWidth:380}}>
        <div style={{fontSize:48,marginBottom:18}}>⚠️</div>
        <h2 style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:26,textTransform:"uppercase",color:T.ink,marginBottom:10}}>Something went wrong</h2>
        <p style={{color:T.inkDim,fontSize:14,marginBottom:8,lineHeight:1.6}}>We couldn't generate your plan. Try again.</p>
        {error&&<p style={{color:T.red,fontSize:11,marginBottom:22,fontFamily:"monospace",background:T.redSoft,padding:"8px 12px",borderRadius:6,wordBreak:"break-all"}}>{error}</p>}
        <button onClick={onRetry} style={{background:T.accent,color:T.white,border:"none",borderRadius:8,padding:"13px 28px",fontSize:14,fontWeight:700,cursor:"pointer"}}>Try Again</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════
export default function ZeroDay() {
  const [screen, setScreen] = useState("landing");
  const [challengeData, setChallengeData] = useState(null);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState("");
  const [prefill, setPrefill] = useState(null);

  const handleStartWithChallenge = (p) => { setPrefill(p); setScreen("onboarding"); };

  const handleOnboardingComplete = async (data) => {
    const weeks = weeksUntil(data.date);
    setChallengeData({ ...data, weeks });
    setScreen("generating");
    setError("");

    // In preview/artifact mode, use sample plan so the UI is fully explorable
    if (IS_PREVIEW) {
      setTimeout(() => {
        setPlan({
          ...SAMPLE_PLAN,
          challengeName: data.challengeLabel,
          challengeType: data.challengeType || SAMPLE_PLAN.challengeType,
          location: data.challengeLocation || SAMPLE_PLAN.location,
          totalWeeks: weeks
        });
        setScreen("plan");
      }, 2200);
      return;
    }

    // In production (hosted), call your backend API endpoint
    try {
      const p = await generatePlan(data.challengeLabel, data.challengeLocation, data.fitness, weeks, data.injuries || []);
      setPlan(p);
      setScreen("plan");
    } catch (err) {
      console.error(err);
      setError(err.message);
      setScreen("error");
    }
  };

  if (screen === "landing") return <Landing onStart={() => setScreen("onboarding")} onStartWithChallenge={handleStartWithChallenge} />;
  if (screen === "onboarding") return <Onboarding onComplete={handleOnboardingComplete} prefill={prefill} onBack={() => { setPrefill(null); setScreen("landing"); }} />;
  if (screen === "generating") return <Generating challenge={challengeData} />;
  if (screen === "plan" && plan) return <PlanView plan={plan} challengeData={challengeData} onRestart={() => { setPlan(null); setChallengeData(null); setPrefill(null); setScreen("landing"); }} />;
  if (screen === "error") return <ErrorScreen error={error} onRetry={() => { setError(""); setScreen("onboarding"); }} />;
  return null;
}

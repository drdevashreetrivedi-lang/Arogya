/* ═══════════════════════════════════════════════════════════════
   ĀROGYA · dina-schedule.js
   Dinacharya Custom Schedule Module — Production v1

   ARCHITECTURE
   ────────────
   STATE.schedule   — array of user-created activity objects
   STATE.smartPrefs — user-edited smart defaults (wake/sleep/detox)
   ACTIVITY_TYPES   — master catalogue of activity definitions
   ACTIVITY_CONTENT — tradition × activity spiritual content library
   Reminder Engine  — setInterval polling, Notification API, toast fallback
   Render Engine    — day-visual bar, sorted card list, smart defaults strip

   HOW TO UPDATE CONTENT
   ─────────────────────
   · Add a new activity type → add entry to ACTIVITY_TYPES
   · Add tradition content   → add entry in ACTIVITY_CONTENT[tradition][activityKey]
   · Change smart defaults   → edit SMART_DEFAULTS_BY_DOSHA
   ═══════════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────────────────────
   MODULE 1 · ACTIVITY TYPE CATALOGUE
   Each entry defines an activity's display, colour, and dosha
   relevance so the system can surface it as a suggestion.
   ───────────────────────────────────────────────────────────── */
var ACTIVITY_TYPES = {
  wake: {
    label:'Wake up',       icon:'🌅', colour:'#C9920A', bg:'#FBF5DC',
    doshaRelevant:['vata','pitta','kapha'],
    defaultDuration:15,    category:'routine'
  },
  meditation: {
    label:'Meditation',    icon:'🧘', colour:'#E8651A', bg:'#FDF0E8',
    doshaRelevant:['vata','pitta','kapha'],
    defaultDuration:20,    category:'spiritual'
  },
  pranayama: {
    label:'Pranayama',     icon:'🌬', colour:'#5B8DB8', bg:'#E8F3FA',
    doshaRelevant:['vata','pitta','kapha'],
    defaultDuration:15,    category:'spiritual'
  },
  yoga: {
    label:'Yoga / Exercise',icon:'🤸',colour:'#3D7054', bg:'#EAF3EC',
    doshaRelevant:['vata','pitta','kapha'],
    defaultDuration:45,    category:'body'
  },
  walk: {
    label:'Walking',       icon:'🚶', colour:'#2E8B6A', bg:'#E2F4EE',
    doshaRelevant:['kapha','vata'],
    defaultDuration:30,    category:'body'
  },
  breakfast: {
    label:'Breakfast',     icon:'🍽', colour:'#C9920A', bg:'#FBF5DC',
    doshaRelevant:['vata','pitta','kapha'],
    defaultDuration:30,    category:'food'
  },
  lunch: {
    label:'Lunch',         icon:'🌞', colour:'#E8651A', bg:'#FDF0E8',
    doshaRelevant:['vata','pitta','kapha'],
    defaultDuration:45,    category:'food'
  },
  dinner: {
    label:'Dinner',        icon:'🌙', colour:'#9B5E2A', bg:'#FAF6EF',
    doshaRelevant:['vata','pitta','kapha'],
    defaultDuration:45,    category:'food'
  },
  work: {
    label:'Work / Study',  icon:'💻', colour:'#5B8DB8', bg:'#E8F3FA',
    doshaRelevant:['pitta'],
    defaultDuration:120,   category:'work'
  },
  reading: {
    label:'Reading',       icon:'📖', colour:'#6B3A1F', bg:'#FDF6EF',
    doshaRelevant:['vata','pitta'],
    defaultDuration:30,    category:'learning'
  },
  journaling: {
    label:'Journaling',    icon:'📿', colour:'#9B4F6E', bg:'#F8EDF3',
    doshaRelevant:['vata','pitta'],
    defaultDuration:20,    category:'spiritual'
  },
  abhyanga: {
    label:'Abhyanga / Self-care',icon:'🛁',colour:'#C8956A',bg:'#FDF0E8',
    doshaRelevant:['vata'],
    defaultDuration:20,    category:'body'
  },
  sleep: {
    label:'Sleep',         icon:'🌙', colour:'#1A0A04', bg:'#EAF3EC',
    doshaRelevant:['vata','pitta','kapha'],
    defaultDuration:480,   category:'routine'
  },
  detox: {
    label:'Digital detox', icon:'📵', colour:'#3D7054', bg:'#EAF3EC',
    doshaRelevant:['pitta','kapha'],
    defaultDuration:60,    category:'routine'
  },
  custom: {
    label:'Custom',        icon:'✦',  colour:'#C9920A', bg:'#FBF5DC',
    doshaRelevant:['vata','pitta','kapha'],
    defaultDuration:30,    category:'custom'
  }
};

/* ─────────────────────────────────────────────────────────────
   MODULE 2 · SMART DEFAULTS BY DOSHA
   System-suggested wake / sleep / detox times.
   Users see these as editable chips in the Suggested panel.
   Add new dosha combos by extending this object.
   ───────────────────────────────────────────────────────────── */
var SMART_DEFAULTS_BY_DOSHA = {
  /* Single doshas */
  'vata': {
    wake:  '05:30', sleep: '21:30', detox: '20:30',
    wakeNote:  'Vata benefits from rising at Brahma Muhurta (before 6 AM) — consistency is your medicine',
    sleepNote: 'Vata must sleep early. 9:30 PM protects Vata from night-time overstimulation',
    detoxNote: 'Screens after 8 PM aggravate Vata anxiety — protect the evening quiet'
  },
  'pitta': {
    wake:  '05:30', sleep: '22:00', detox: '21:00',
    wakeNote:  'Pitta benefits from the cooling stillness of early morning before the fire rises',
    sleepNote: 'Pitta is prone to overwork — 10 PM is the boundary that protects your rest',
    detoxNote: 'Blue light and stimulating content after 9 PM aggravate Pitta fire — step away'
  },
  'kapha': {
    wake:  '05:00', sleep: '22:00', detox: '21:00',
    wakeNote:  'Kapha must rise before 6 AM — sleeping past 6 AM increases heaviness and lethargy all day',
    sleepNote: 'Kapha is prone to excess sleep — 10 PM is enough; never sleep past 6 AM',
    detoxNote: 'Kapha's inertia is worsened by passive screen time — an active detox after 9 PM is essential'
  },
  /* Dual doshas */
  'vata-pitta': {
    wake:  '05:30', sleep: '21:45', detox: '20:45',
    wakeNote:  'Vata-Pitta: consistency (for Vata) + the cool of early morning (for Pitta)',
    sleepNote: 'Early enough for Vata stability, firm enough for Pitta overwork patterns',
    detoxNote: 'Both doshas worsen with evening screens — protect this boundary firmly'
  },
  'kapha-pitta': {
    wake:  '05:00', sleep: '22:00', detox: '21:00',
    wakeNote:  'Kapha needs vigorous early morning; Pitta benefits from the cool start',
    sleepNote: 'Pitta-Kapha: strict 10 PM — neither dosha benefits from late nights',
    detoxNote: 'Pitta fire amplified by screens; Kapha inertia worsened by passive content'
  },
  'vata-kapha': {
    wake:  '05:30', sleep: '22:00', detox: '21:00',
    wakeNote:  'Vata needs consistency; Kapha needs early rising — 5:30 AM serves both',
    sleepNote: 'Vata benefits from slightly earlier sleep; 10 PM is the outer boundary',
    detoxNote: 'Vata anxiety and Kapha heaviness both worsen with evening screen time'
  },
  'kapha-pitta-vata': {
    wake:  '05:30', sleep: '22:00', detox: '21:00',
    wakeNote:  'Tridoshic: 5:30 AM serves all three doshas — observe seasonally',
    sleepNote: 'Tridoshic constitution: follow the season for fine-tuning',
    detoxNote: 'All doshas benefit from evening digital stillness — honour this practice'
  },
  /* Fallback */
  'default': {
    wake:  '06:00', sleep: '22:00', detox: '21:00',
    wakeNote:  'A consistent wake time is the foundation of all Ayurvedic practice',
    sleepNote: 'Sleeping before 10 PM protects Ojas — your vital essence',
    detoxNote: 'Reducing screen time after 9 PM measurably improves sleep quality'
  }
};

/* ─────────────────────────────────────────────────────────────
   MODULE 3 · TRADITION × ACTIVITY SPIRITUAL CONTENT LIBRARY
   Indexed: ACTIVITY_CONTENT[tradition][activityKey]
   Each entry has: verse, source, and a short note.
   Strict filtering — tradition keys never cross-pollinate.
   ───────────────────────────────────────────────────────────── */
var ACTIVITY_CONTENT = {

  hindu: {
    wake: {
      verse: 'कराग्रे वसते लक्ष्मीः करमध्ये सरस्वती। करमूले तु गोविन्दः प्रभाते करदर्शनम्॥',
      trans: 'Behold your hands at dawn. At the fingertips — Lakshmi. At the centre — Saraswati. At the root — Govinda.',
      source: 'Traditional · morning consecration'
    },
    meditation: {
      verse: 'ध्यायेन्नित्यं महेशं रजतगिरिनिभं चारुचन्द्रावतंसम्।',
      trans: 'Meditate always on the great Lord — pure as the silver mountain, luminous as the crescent moon.',
      source: 'Shiva Dhyana Shloka'
    },
    pranayama: {
      verse: 'यमाद्रक्षति तिक्ष्णानां द्रव्याणां हि प्रयोगतः।',
      trans: 'The breath is the bridge between the body and the mind. Regulate the breath and the mind follows.',
      source: 'Hatha Yoga Pradipika · on pranayama'
    },
    yoga: {
      verse: 'योगश्चित्तवृत्तिनिरोधः',
      trans: 'Yoga is the cessation of the movements of the mind. Still the fluctuations — and you are free.',
      source: 'Patanjali Yoga Sutras 1.2'
    },
    walk: {
      verse: 'उद्धरेदात्मनात्मानं नात्मानमवसादयेत्।',
      trans: 'Lift yourself by yourself. Do not let yourself fall. The self is the only true friend of the self.',
      source: 'Bhagavad Gita 6.5'
    },
    breakfast: {
      verse: 'ब्रह्मार्पणं ब्रह्म हविर्ब्रह्माग्नौ ब्रह्मणा हुतम्।',
      trans: 'This food is Brahman. The act of offering is Brahman. The fire of digestion is Brahman. All is Brahman.',
      source: 'Bhagavad Gita 4.24'
    },
    lunch: {
      verse: 'अहं वैश्वानरो भूत्वा प्राणिनां देहमाश्रितः।',
      trans: 'I am the digestive fire in all living beings. I accept this food as an offering into the sacred fire within.',
      source: 'Bhagavad Gita 15.14'
    },
    dinner: {
      verse: 'हितभुक् मितभुक् ऋतभुक्।',
      trans: 'Eat what is beneficial. Eat in moderation. Eat what is right for the season. These three are Ayurveda\'s complete dietary teaching.',
      source: 'Charaka Samhita · dietary principles'
    },
    work: {
      verse: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।',
      trans: 'You have the right to action — never to its fruits. Act fully. Release the result completely.',
      source: 'Bhagavad Gita 2.47'
    },
    reading: {
      verse: 'स्वाध्यायान्मा प्रमदः।',
      trans: 'Do not neglect self-study. Svadhyaya — reading, reflection, inquiry — is the fourth Niyama of Patanjali.',
      source: 'Taittiriya Upanishad · do not be negligent in self-study'
    },
    journaling: {
      verse: 'स्वाध्यायात् परमं तपः।',
      trans: 'Self-study is the highest austerity. Write to see yourself clearly — without judgment, without pretense.',
      source: 'Manusmriti · on Svadhyaya'
    },
    abhyanga: {
      verse: 'अभ्यङ्गमाचरेन्नित्यं स जराश्रमवातहा।',
      trans: 'Practice Abhyanga daily. It removes fatigue, counteracts ageing, and pacifies Vata. This is Ayurveda\'s greatest gift to the body.',
      source: 'Ashtanga Hridayam · on Abhyanga'
    },
    sleep: {
      verse: 'असतो मा सद्गमय। तमसो मा ज्योतिर्गमय। मृत्योर्माऽमृतं गमय। ॐ शान्तिः।',
      trans: 'Lead me from untruth to truth. From darkness to light. From the fear of death to the knowledge of immortality. Peace.',
      source: 'Brihadaranyaka Upanishad 1.3.28 · the sleep prayer'
    },
    detox: {
      verse: 'प्रत्याहारोऽस्य परमा ज्ञेया योगस्य साधना।',
      trans: 'Pratyahara — the withdrawal of the senses — is the highest method of yoga practice. Turn inward. The evening is for this.',
      source: 'Yoga teachings · on Pratyahara'
    },
    custom: {
      verse: 'योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनञ्जय।',
      trans: 'Be steadfast in yoga. Perform your action, abandoning attachment to results, in success and failure alike.',
      source: 'Bhagavad Gita 2.48'
    }
  },

  thay: {
    wake: {
      verse: 'Waking up this morning, I smile. Twenty-four brand new hours are before me. I vow to live fully in each moment, and to look at all beings with eyes of compassion.',
      source: 'Thich Nhat Hanh · Morning gatha · Plum Village'
    },
    meditation: {
      verse: 'Breathing in, I calm my body. Breathing out, I smile. Dwelling in the present moment, I know this is a wonderful moment.',
      source: 'Thich Nhat Hanh · The miracle of mindfulness'
    },
    pranayama: {
      verse: 'Our true home is in the present moment. When you breathe in and are aware of your in-breath, you touch the miracle of being alive.',
      source: 'Thich Nhat Hanh · Breathe, You Are Alive'
    },
    yoga: {
      verse: 'Breathing in, I am aware of my body. Breathing out, I release all tension in my body. I bring my body and mind together as one.',
      source: 'Thich Nhat Hanh · body awareness gatha'
    },
    walk: {
      verse: 'I have arrived. I am home. In the here and in the now. I am solid. I am free. In the ultimate I dwell.',
      source: 'Thich Nhat Hanh · walking meditation gatha'
    },
    breakfast: {
      verse: 'This food is a gift of the Earth, the sky, numerous living beings, and much hard work. May we eat in mindfulness and gratitude, so as to be worthy to receive it.',
      source: 'Plum Village · Five Contemplations before eating'
    },
    lunch: {
      verse: 'In this food I see clearly the presence of the entire universe supporting my existence. May I eat with awareness, gratitude, and compassion.',
      source: 'Plum Village · adapted Five Contemplations'
    },
    dinner: {
      verse: 'This meal is a circle of giving. The Earth, the rain, the farmer, the cook — all are present in this bowl. I receive them with gratitude.',
      source: 'Plum Village · evening meal gatha'
    },
    work: {
      verse: 'Turning on the computer, my mind gets in touch with the store. I vow to transform habit energies to help love and understanding grow.',
      source: 'Thich Nhat Hanh · Gathas for Daily Use, No. 47'
    },
    reading: {
      verse: 'Opening this book, I am aware that words are a raft to carry me, not the shore itself. May I read with a beginner\'s mind.',
      source: 'Plum Village · gatha for reading'
    },
    journaling: {
      verse: 'Taking up the pen, I vow to speak only truth — first to myself. May these words be a flower I offer to my own understanding.',
      source: 'Plum Village · gatha for writing'
    },
    abhyanga: {
      verse: 'Washing my hands, I am aware that I am touching the water of the Earth. This moment is a gift. I receive it with full attention.',
      source: 'Thich Nhat Hanh · gatha for washing'
    },
    sleep: {
      verse: 'Falling into the arms of the Earth, I let go of the day. The Earth holds me. The breath holds me. Nothing is lost. Everything is transformed.',
      source: 'Thich Nhat Hanh · sleep gatha · Plum Village'
    },
    detox: {
      verse: 'Turning off the phone, I step back from the river of information. In this stillness, I return to myself. This is my true home.',
      source: 'Plum Village · gatha for turning off devices'
    },
    custom: {
      verse: 'In this moment, I am engaged in what is before me. I bring the quality of my full presence. This is my practice.',
      source: 'Thich Nhat Hanh · on engaged mindfulness'
    }
  },

  buddhist: {
    wake: {
      verse: 'May I be happy. May I be well. May I be peaceful. May I be free from suffering.',
      source: 'Metta Sutta · loving-kindness for oneself at dawn'
    },
    meditation: {
      verse: 'Do not dwell in the past. Do not dream of the future. Concentrate the mind on the present moment. This is the complete teaching.',
      source: 'Dhammapada verse 1 · attributed to the Buddha'
    },
    pranayama: {
      verse: 'Anapanasati — mindfulness of breathing — when developed and cultivated, is of great fruit, of great benefit. It fulfills the four foundations of mindfulness.',
      source: 'Anapanasati Sutta · Majjhima Nikaya 118'
    },
    yoga: {
      verse: 'In walking, know that you are walking. In standing, know that you are standing. This awareness in all postures is the fourth foundation of mindfulness.',
      source: 'Satipatthana Sutta · on mindfulness of the body'
    },
    walk: {
      verse: 'When walking, the practitioner is aware "I am walking." When standing still, they are aware "I am standing." This is the practice of clear comprehension.',
      source: 'Satipatthana Sutta · Majjhima Nikaya 10'
    },
    breakfast: {
      verse: 'I eat this food not for pleasure, not for intoxication, not for the sake of physical beauty — but solely to sustain this body for practice.',
      source: 'Theravada teaching · right consumption'
    },
    lunch: {
      verse: 'Reflect wisely on this food: not for amusement, not for intoxication, not for the sake of physical beauty — but simply to endure.',
      source: 'Pali Canon · reflection on food'
    },
    dinner: {
      verse: 'Knowing the right measure in eating, one eats with attention. Thus all feelings become peaceful and the body is sustained in lightness.',
      source: 'Theravada teaching · mindful eating'
    },
    work: {
      verse: 'Right effort: prevent unwholesome states from arising. Abandon those that have arisen. Cultivate wholesome states. Sustain what is already good.',
      source: 'Noble Eightfold Path · Sammā vāyāma'
    },
    reading: {
      verse: 'There are four nutriments that sustain beings. The fourth is consciousness. Feed your consciousness only with what nourishes liberation.',
      source: 'Pali Canon · on the four nutriments'
    },
    journaling: {
      verse: 'Know what you think. Know what you feel. Know what you do. This triple knowing — of thought, emotion, action — is the beginning of wisdom.',
      source: 'Theravada teaching · on sati'
    },
    abhyanga: {
      verse: 'Care for the body as the vessel of practice. Without this body, there is no path. Tend it with the same mindfulness you bring to meditation.',
      source: 'Buddhist teaching · on care for the body'
    },
    sleep: {
      verse: 'May all beings be happy, may all beings be safe, may all beings be well, may all beings be free from suffering.',
      source: 'Metta Sutta · dedication of merit before sleep'
    },
    detox: {
      verse: 'The wise one restrains the senses, not running after sounds, sights, tastes. This restraint is the beginning of genuine peace.',
      source: 'Pali Canon · Indriya-samvara (sense restraint)'
    },
    custom: {
      verse: 'Whatever is done with mindfulness — however small — is karmically significant. Whatever is done without mindfulness — however grand — is merely movement.',
      source: 'Theravada teaching · on Sati in action'
    }
  },

  universal: {
    wake: {
      verse: 'Before this day begins — breathe once, fully. Notice that you are here. That you are alive. That the world exists. That is enough to begin.',
      source: 'Universal mindfulness practice'
    },
    meditation: {
      verse: 'Sitting quietly, doing nothing — spring comes and the grass grows by itself.',
      source: 'Zen proverb · on the power of stillness'
    },
    pranayama: {
      verse: 'The breath is always here. Before the worry was here, the breath was here. After the worry is gone, the breath will still be here.',
      source: 'Universal mindfulness teaching'
    },
    yoga: {
      verse: 'The body is the only thing you will inhabit your entire life. Every moment you spend inside it with awareness is a moment well spent.',
      source: 'Universal embodiment practice'
    },
    walk: {
      verse: 'Solvitur ambulando — it is solved by walking. Whatever you cannot solve sitting still, take it for a walk.',
      source: 'Latin proverb · attributed to Saint Augustine'
    },
    breakfast: {
      verse: 'Before eating — pause. Name one living thing that made this meal possible. Then eat with that awareness. This is complete gratitude practice.',
      source: 'Universal mindful eating practice'
    },
    lunch: {
      verse: 'Eat slowly. Put the fork down between bites. Chew completely. This is not advice — it is the difference between eating and nourishment.',
      source: 'Universal mindful eating · evidence-based practice'
    },
    dinner: {
      verse: 'End the day as you began it — with simplicity. A light dinner, eaten slowly, with someone you love or with your own quiet company.',
      source: 'Universal wellness practice'
    },
    work: {
      verse: 'The quality of your attention is the quality of your work. To be fully present — not multitasking, not half-elsewhere — is the rarest skill of the age.',
      source: 'Universal focus practice'
    },
    reading: {
      verse: 'Read not to contradict or confute, nor to believe and take for granted, but to weigh and consider.',
      source: 'Francis Bacon · Essays'
    },
    journaling: {
      verse: 'The unexamined life is not worth living. But the examined life that is written is worth re-examining — that is why you keep a journal.',
      source: 'After Socrates · on self-inquiry'
    },
    abhyanga: {
      verse: 'Taking care of your body is not vanity — it is the recognition that this body is the instrument through which you live your entire life.',
      source: 'Universal wellness practice'
    },
    sleep: {
      verse: 'Today is complete. What was done is done. What was left undone rests now. You may rest too. Tomorrow the page turns.',
      source: 'Universal evening reflection'
    },
    detox: {
      verse: 'Every hour without a screen is an hour you gave back to yourself. Time is the one currency you cannot earn more of. Spend it on what is real.',
      source: 'Universal digital wellness practice'
    },
    custom: {
      verse: 'Whatever you do — do it with your full attention. The quantity of life matters less than the quality of presence you bring to it.',
      source: 'Universal mindfulness principle'
    }
  }

};

/* ─────────────────────────────────────────────────────────────
   MODULE 4 · SCHEDULE STATE HELPERS
   STATE.schedule  = array of activity objects:
   {
     id:         string (uuid),
     type:       string (key in ACTIVITY_TYPES),
     customName: string (only when type === 'custom'),
     startTime:  string '07:00',
     endTime:    string '07:30',
     reminder:   boolean,
     notes:      string,
     done:       boolean   (today's completion flag)
   }

   STATE.smartPrefs = {
     wake:  '05:30',
     sleep: '22:00',
     detox: '21:00'
   }
   ───────────────────────────────────────────────────────────── */

/* Initialise schedule arrays if they don't exist */
function ensureScheduleState() {
  if (!STATE.schedule)    STATE.schedule    = [];
  if (!STATE.smartPrefs)  STATE.smartPrefs  = null; // null = use dosha defaults
}

/* Get the dosha-appropriate smart defaults */
function getSmartDefaults() {
  ensureScheduleState();
  if (STATE.smartPrefs) return STATE.smartPrefs;

  var combo = (STATE.doshaCombo || []).slice().sort().join('-');
  return SMART_DEFAULTS_BY_DOSHA[combo]
      || SMART_DEFAULTS_BY_DOSHA['default'];
}

/* UUID generator (simple, collision-safe for this use-case) */
function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* Parse '07:30' → minutes from midnight */
function timeToMins(t) {
  var parts = (t || '00:00').split(':');
  return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

/* Minutes from midnight → '07:30' */
function minsToTime(m) {
  var h = Math.floor(m / 60) % 24;
  var mm = m % 60;
  return String(h).padStart(2,'0') + ':' + String(mm).padStart(2,'0');
}

/* Duration in minutes → human string */
function durationLabel(startTime, endTime) {
  var diff = timeToMins(endTime) - timeToMins(startTime);
  if (diff <= 0) diff += 1440; // overnight
  if (diff < 60)  return diff + ' min';
  var h = Math.floor(diff / 60), m = diff % 60;
  return h + 'h' + (m ? ' ' + m + 'min' : '');
}

/* Format '07:30' → '7:30 AM' */
function formatTime(t) {
  var parts = (t || '00:00').split(':');
  var h = parseInt(parts[0]), m = parts[1];
  var ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return h + ':' + m + ' ' + ampm;
}

/* Sort schedule by start time */
function sortedSchedule() {
  return (STATE.schedule || []).slice().sort(function(a, b) {
    return timeToMins(a.startTime) - timeToMins(b.startTime);
  });
}

/* Get spiritual content for an activity, tradition-filtered */
function getActivityContent(actType, tradition) {
  var trad = tradition || STATE.tradition || 'universal';
  var tradContent = ACTIVITY_CONTENT[trad] || ACTIVITY_CONTENT.universal;
  return tradContent[actType] || tradContent.custom;
}

/* Get display info for an activity type */
function getTypeInfo(type) {
  return ACTIVITY_TYPES[type] || ACTIVITY_TYPES.custom;
}

/* Is an activity "active" right now (current time within its window)? */
function isActivityNow(slot) {
  var now  = new Date();
  var cur  = now.getHours() * 60 + now.getMinutes();
  var s    = timeToMins(slot.startTime);
  var e    = timeToMins(slot.endTime);
  if (e <= s) e += 1440;          // overnight
  return cur >= s && cur < e;
}

/* Is an activity in the past today? */
function isActivityPast(slot) {
  var now = new Date();
  var cur = now.getHours() * 60 + now.getMinutes();
  return timeToMins(slot.endTime) <= cur;
}

/* ─────────────────────────────────────────────────────────────
   MODULE 5 · TAB SWITCHER
   ───────────────────────────────────────────────────────────── */
function switchDinaTab(tab) {
  var suggested = document.getElementById('dina-panel-suggested');
  var schedule  = document.getElementById('dina-panel-schedule');
  var tabSug    = document.getElementById('tab-suggested');
  var tabSch    = document.getElementById('tab-schedule');

  if (tab === 'suggested') {
    if (suggested) suggested.style.display = '';
    if (schedule)  schedule.style.display  = 'none';
    if (tabSug)    { tabSug.classList.add('active'); }
    if (tabSch)    { tabSch.classList.remove('active'); }
    renderDinacharya();
  } else {
    if (suggested) suggested.style.display = 'none';
    if (schedule)  schedule.style.display  = '';
    if (tabSug)    { tabSug.classList.remove('active'); }
    if (tabSch)    { tabSch.classList.add('active'); }
    renderSmartDefaults();
    renderSchedule();
  }
}

/* ─────────────────────────────────────────────────────────────
   MODULE 6 · SMART DEFAULTS STRIP
   Shows editable wake / sleep / detox chips in Suggested panel
   ───────────────────────────────────────────────────────────── */
function renderSmartDefaults() {
  var container = document.getElementById('smartDefaults');
  if (!container) return;

  var d = getSmartDefaults();

  container.innerHTML = [
    '<div class="sd-row">',
      '<div class="sd-label">Smart defaults <span class="sd-sublabel">— tap to adjust</span></div>',
    '</div>',
    '<div class="sd-chips">',
      buildSDChip('🌅', 'Wake up', d.wake, 'wake', d.wakeNote),
      buildSDChip('🌙', 'Sleep',   d.sleep,'sleep',d.sleepNote),
      buildSDChip('📵', 'Detox',   d.detox,'detox',d.detoxNote),
    '</div>'
  ].join('');
}

function buildSDChip(icon, label, time, key, note) {
  return [
    '<div class="sd-chip" onclick="editSmartDefault(\'' + key + '\',\'' + time + '\',\'' + escSDQuotes(note) + '\')">',
      '<span class="sd-chip-icon">' + icon + '</span>',
      '<div class="sd-chip-body">',
        '<div class="sd-chip-label">' + label + '</div>',
        '<div class="sd-chip-time">' + formatTime(time) + '</div>',
      '</div>',
      '<span class="sd-chip-edit">✎</span>',
    '</div>'
  ].join('');
}

function escSDQuotes(s) {
  return (s || '').replace(/'/g, '\\\'');
}

/* Inline editor for a smart default — repurposes the modal sheet */
function editSmartDefault(key, currentTime, note) {
  var labels = { wake:'Wake-up time', sleep:'Sleep time', detox:'Digital detox start' };

  document.getElementById('modalTitle').textContent     = labels[key] || key;
  document.getElementById('actTypeGrid').innerHTML      = '';
  document.getElementById('customNameWrap').style.display = 'none';
  document.getElementById('actNotes').value             = '';
  document.getElementById('actNotes').placeholder       = note;
  document.getElementById('actStartTime').value         = currentTime;
  document.getElementById('actEndTime').value           = currentTime;
  document.getElementById('modalPreview').innerHTML     =
    '<div style="font-style:italic;color:var(--mu)">' + note + '</div>';
  document.getElementById('modalDeleteBtn').style.display = 'none';

  // Override save to update smart default
  document.querySelector('.modal-save-btn').onclick = function() {
    var t = document.getElementById('actStartTime').value;
    var prefs = getSmartDefaults();
    var newPrefs = Object.assign({}, prefs);
    newPrefs[key] = t;
    STATE.smartPrefs = newPrefs;
    saveState();
    closeModal();
    renderSmartDefaults();
    renderDinacharya(); // regenerate timeline with new default
  };

  // Show time row only
  document.querySelector('.time-row').style.display = 'flex';
  document.getElementById('reminderToggle').closest('.modal-reminder-row').style.display = 'none';
  document.getElementById('actTypeGrid').closest('div.modal-section-label') &&
    (document.getElementById('actTypeGrid').closest('div.modal-section-label').style.display = 'none');

  openModal(null, true); // second arg = smartDefault mode
}

/* ─────────────────────────────────────────────────────────────
   MODULE 7 · SCHEDULE RENDERER
   Renders: summary stats + 24h visual bar + sorted card list
   ───────────────────────────────────────────────────────────── */
function renderSchedule() {
  ensureScheduleState();
  renderScheduleSummary();
  renderDayVisual();
  renderScheduleList();
  updateScheduleCount();
}

/* Summary stat chips */
function renderScheduleSummary() {
  var el = document.getElementById('schedSummary');
  if (!el) return;

  var slots  = STATE.schedule || [];
  var total  = slots.length;
  var done   = slots.filter(function(s){ return s.done; }).length;
  var reminders = slots.filter(function(s){ return s.reminder; }).length;
  var hours  = slots.reduce(function(acc, s) {
    var diff = timeToMins(s.endTime) - timeToMins(s.startTime);
    if (diff < 0) diff += 1440;
    return acc + diff;
  }, 0);
  var hoursStr = Math.floor(hours / 60) + 'h ' + (hours % 60 ? hours % 60 + 'm' : '');

  el.innerHTML = [
    '<div class="sched-stat"><div class="sched-stat-num">' + total + '</div><div class="sched-stat-label">Activities</div></div>',
    '<div class="sched-stat"><div class="sched-stat-num">' + done  + '</div><div class="sched-stat-label">Done today</div></div>',
    '<div class="sched-stat"><div class="sched-stat-num">' + reminders + '</div><div class="sched-stat-label">Reminders</div></div>',
    '<div class="sched-stat" style="background:var(--sfp);border-color:rgba(232,101,26,.2)"><div class="sched-stat-num" style="color:var(--sf)">' + (total ? hoursStr : '—') + '</div><div class="sched-stat-label">Scheduled</div></div>'
  ].join('');
}

/* 24-hour visual bar — each activity is a proportional block */
function renderDayVisual() {
  var el = document.getElementById('dayVisual');
  if (!el) return;

  var slots = sortedSchedule();
  if (slots.length === 0) {
    el.innerHTML = '<div style="width:100%;height:100%;background:rgba(180,100,40,.06);display:flex;align-items:center;justify-content:center;font-size:10px;color:var(--mu);letter-spacing:.08em">No activities scheduled</div>';
    return;
  }

  var blocks = slots.map(function(slot) {
    var info   = getTypeInfo(slot.type);
    var sMin   = timeToMins(slot.startTime);
    var eMin   = timeToMins(slot.endTime);
    if (eMin <= sMin) eMin += 1440;
    var left   = (sMin / 1440 * 100).toFixed(2) + '%';
    var width  = Math.max(((eMin - sMin) / 1440 * 100), 0.8).toFixed(2) + '%';
    var isNow  = isActivityNow(slot);
    var label  = slot.type === 'custom' ? (slot.customName || 'Custom') : info.label;
    return '<div class="day-block" title="' + label + ' ' + formatTime(slot.startTime) + '"'
      + ' style="left:' + left + ';width:' + width + ';background:' + info.colour + ';opacity:' + (slot.done ? '.4' : isNow ? '1' : '.8') + '"'
      + (isNow ? ' data-now="true"' : '') + '></div>';
  }).join('');

  // Current time indicator
  var now  = new Date();
  var cur  = (now.getHours() * 60 + now.getMinutes()) / 1440 * 100;
  var line = '<div class="day-now-line" style="left:' + cur.toFixed(2) + '%"></div>';

  el.innerHTML = blocks + line;
}

/* Schedule card list */
function renderScheduleList() {
  var el = document.getElementById('schedList');
  if (!el) return;

  var slots = sortedSchedule();

  if (slots.length === 0) {
    el.innerHTML = [
      '<div class="sched-empty">',
        '<span class="sched-empty-icon">🌿</span>',
        'Your day is an empty canvas.<br>',
        'Add your first activity to begin<br>personalising your dinacharya.',
      '</div>'
    ].join('');
    return;
  }

  el.innerHTML = slots.map(function(slot) {
    return buildScheduleCard(slot);
  }).join('');
}

function buildScheduleCard(slot) {
  var info     = getTypeInfo(slot.type);
  var isNow    = isActivityNow(slot);
  var isPast   = isActivityPast(slot);
  var label    = slot.type === 'custom' ? (slot.customName || 'Custom') : info.label;
  var dur      = durationLabel(slot.startTime, slot.endTime);
  var content  = getActivityContent(slot.type, STATE.tradition);
  var cardCls  = isNow ? 'card-active' : isPast ? 'card-done-c' : '';
  var remBadge = slot.reminder
    ? '<span class="sched-reminder-badge">🔔 Reminder on</span>'
    : '';
  var doneMark = isPast || slot.done
    ? '<button class="sched-done-btn' + (slot.done ? ' done' : '') + '" onclick="toggleDone(\'' + slot.id + '\',event)">' + (slot.done ? '✓' : '○') + '</button>'
    : '<button class="sched-done-btn" onclick="toggleDone(\'' + slot.id + '\',event)">○</button>';

  return [
    '<div class="sched-card ' + cardCls + '" onclick="openModal(\'' + slot.id + '\')">',
      '<div class="sched-card-stripe" style="background:' + info.colour + '"></div>',
      '<div class="sched-card-body">',
        '<div class="sched-icon-wrap" style="background:' + info.bg + '">',
          '<span>' + info.icon + '</span>',
        '</div>',
        '<div class="sched-info">',
          '<div class="sched-name">' + label + (isNow ? ' <span style="font-size:9px;color:var(--sf);font-weight:600;margin-left:4px">● NOW</span>' : '') + '</div>',
          '<div class="sched-time-row">',
            '<span class="sched-time">' + formatTime(slot.startTime) + '</span>',
            '<span class="sched-duration">→ ' + formatTime(slot.endTime) + ' (' + dur + ')</span>',
            remBadge,
          '</div>',
          slot.notes ? '<div class="sched-notes">' + slot.notes + '</div>' : '',
          '<div class="sched-shloka">',
            '<span class="sched-shloka-text">"' + (content.verse || '') + '"</span>',
          '</div>',
        '</div>',
        doneMark,
      '</div>',
    '</div>'
  ].join('');
}

/* Toggle completion mark */
function toggleDone(id, evt) {
  evt && evt.stopPropagation();
  var slot = STATE.schedule.find(function(s){ return s.id === id; });
  if (!slot) return;
  slot.done = !slot.done;
  if (slot.done) recordActivity();
  saveState();
  renderSchedule();
}

/* Update the count badge on the My Schedule tab */
function updateScheduleCount() {
  var el = document.getElementById('scheduleCount');
  if (el) el.textContent = (STATE.schedule || []).length;
}

/* ─────────────────────────────────────────────────────────────
   MODULE 8 · ACTIVITY MODAL (Add / Edit / Delete)
   ───────────────────────────────────────────────────────────── */
var _editingId  = null;   // null = adding new; string = editing existing
var _selType    = null;   // currently selected activity type

function renderActivityTypeGrid() {
  var grid = document.getElementById('actTypeGrid');
  if (!grid) return;

  var combo   = (STATE.doshaCombo || []).slice().sort().join('-');
  var isMulti = combo.indexOf('-') !== -1;

  grid.innerHTML = Object.keys(ACTIVITY_TYPES).map(function(key) {
    var t       = ACTIVITY_TYPES[key];
    var isSel   = key === _selType;
    // Highlight dosha-relevant types with a subtle indicator
    var relevant = t.doshaRelevant.some(function(d){ return (STATE.doshaCombo||[]).indexOf(d) !== -1; });
    return [
      '<div class="act-type-card' + (isSel ? ' selected' : '') + '"',
      ' onclick="selectActivityType(\'' + key + '\')" title="' + t.label + '">',
        relevant ? '<span class="act-relevance-dot"></span>' : '',
        '<span class="act-type-icon">' + t.icon + '</span>',
        '<div class="act-type-name">' + t.label + '</div>',
      '</div>'
    ].join('');
  }).join('');
}

function selectActivityType(key) {
  _selType = key;

  // Highlight selected card
  document.querySelectorAll('.act-type-card').forEach(function(c){ c.classList.remove('selected'); });
  var target = document.querySelector('[onclick="selectActivityType(\'' + key + '\')"]');
  if (target) target.classList.add('selected');

  // Show / hide custom name field
  var customWrap = document.getElementById('customNameWrap');
  if (customWrap) customWrap.style.display = (key === 'custom') ? 'block' : 'none';

  // Set default duration
  var info = getTypeInfo(key);
  var startVal = document.getElementById('actStartTime').value || '07:00';
  var startMins = timeToMins(startVal);
  var endMins   = startMins + info.defaultDuration;
  document.getElementById('actEndTime').value = minsToTime(endMins);

  // Update spiritual preview
  updateModalPreview(key);
}

function updateModalPreview(key) {
  var preview = document.getElementById('modalPreview');
  if (!preview) return;
  var content = getActivityContent(key, STATE.tradition);
  var trad    = TRADITION_CONTENT[STATE.tradition] || TRADITION_CONTENT.universal;
  var info    = getTypeInfo(key);

  preview.innerHTML = [
    '<div style="display:flex;align-items:center;gap:7px;margin-bottom:8px">',
      '<span style="font-size:16px">' + info.icon + '</span>',
      '<span style="font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--jade)">' + (trad.tradLabel || '') + '</span>',
    '</div>',
    '<div style="font-family:var(--fr);font-size:13px;font-style:italic;color:var(--td);line-height:1.65;margin-bottom:6px">',
      '"' + (content.verse || '') + '"',
    '</div>',
    content.trans ? '<div style="font-size:11px;color:var(--tm);line-height:1.55;margin-bottom:4px">' + content.trans + '</div>' : '',
    '<div style="font-size:9px;color:var(--mu);letter-spacing:.06em">' + (content.source || '') + '</div>'
  ].join('');
}

/* Open modal: id=null → add; id=string → edit */
function openModal(id, smartDefaultMode) {
  _editingId = id;
  _selType   = null;

  // Reset modal to default state
  var modal = document.getElementById('activityModal');
  var sheet = document.getElementById('modalSheet');
  var delBtn = document.getElementById('modalDeleteBtn');

  // Restore default behaviour for save button
  document.querySelector('.modal-save-btn').onclick = saveActivity;

  // Restore hidden elements
  var reminderRow = document.querySelector('.modal-reminder-row');
  if (reminderRow) reminderRow.style.display = 'flex';

  // Restore modal section labels
  document.querySelectorAll('.modal-section-label').forEach(function(el){
    el.style.display = '';
  });
  document.querySelector('.time-row').style.display = 'flex';

  if (smartDefaultMode) {
    // Already configured by editSmartDefault()
    if (modal) modal.classList.add('open');
    return;
  }

  if (id) {
    // EDIT MODE
    var slot = STATE.schedule.find(function(s){ return s.id === id; });
    if (!slot) return;
    _selType = slot.type;
    document.getElementById('modalTitle').textContent   = 'Edit activity';
    document.getElementById('actStartTime').value       = slot.startTime;
    document.getElementById('actEndTime').value         = slot.endTime;
    document.getElementById('actNotes').value           = slot.notes || '';
    document.getElementById('actNotes').placeholder     = 'What do you intend to bring to this time?';
    document.getElementById('reminderToggle').className = 'toggle' + (slot.reminder ? ' on' : '');
    if (delBtn) delBtn.style.display = 'block';

    var customWrap = document.getElementById('customNameWrap');
    if (customWrap) {
      customWrap.style.display = (slot.type === 'custom') ? 'block' : 'none';
      document.getElementById('customNameInput').value = slot.customName || '';
    }
  } else {
    // ADD MODE
    document.getElementById('modalTitle').textContent   = 'Add activity';
    document.getElementById('actStartTime').value       = nextSuggestedTime();
    document.getElementById('actEndTime').value         = minsToTime(timeToMins(nextSuggestedTime()) + 30);
    document.getElementById('actNotes').value           = '';
    document.getElementById('actNotes').placeholder     = 'What do you intend to bring to this time?';
    document.getElementById('reminderToggle').className = 'toggle on';
    if (delBtn) delBtn.style.display = 'none';
    var customWrap = document.getElementById('customNameWrap');
    if (customWrap) customWrap.style.display = 'none';

    document.getElementById('modalPreview').innerHTML =
      '<div style="color:var(--mu);font-size:12px;font-style:italic">Choose an activity type above to see the teaching</div>';
  }

  renderActivityTypeGrid();
  if (id) updateModalPreview(_selType);

  if (modal) modal.classList.add('open');
}

/* Suggest the next logical start time */
function nextSuggestedTime() {
  var slots = sortedSchedule();
  if (slots.length === 0) return '07:00';
  var last  = slots[slots.length - 1];
  var end   = timeToMins(last.endTime);
  return minsToTime(end + 15);
}

function closeModal() {
  var modal = document.getElementById('activityModal');
  if (modal) modal.classList.remove('open');
}

function closeModalBackdrop(evt) {
  if (evt.target === document.getElementById('activityModal')) closeModal();
}

/* Save (add or update) */
function saveActivity() {
  ensureScheduleState();
  if (!_selType && !_editingId) { alert('Please choose an activity type.'); return; }

  var type      = _selType;
  var startTime = document.getElementById('actStartTime').value;
  var endTime   = document.getElementById('actEndTime').value;
  var reminder  = document.getElementById('reminderToggle').classList.contains('on');
  var notes     = (document.getElementById('actNotes').value || '').trim();
  var custom    = (document.getElementById('customNameInput').value || '').trim();

  // Validation
  if (!startTime || !endTime) { alert('Please set a start and end time.'); return; }

  if (_editingId) {
    // Update existing
    var slot = STATE.schedule.find(function(s){ return s.id === _editingId; });
    if (slot) {
      if (type) slot.type = type;
      slot.startTime  = startTime;
      slot.endTime    = endTime;
      slot.reminder   = reminder;
      slot.notes      = notes;
      slot.customName = custom;
    }
  } else {
    // Create new
    STATE.schedule.push({
      id:         makeId(),
      type:       type || 'custom',
      customName: custom,
      startTime:  startTime,
      endTime:    endTime,
      reminder:   reminder,
      notes:      notes,
      done:       false
    });
  }

  saveState();
  scheduleAllReminders();
  closeModal();
  renderSchedule();
  recordActivity();
}

/* Delete */
function deleteActivity() {
  if (!_editingId) return;
  STATE.schedule = STATE.schedule.filter(function(s){ return s.id !== _editingId; });
  saveState();
  cancelAllReminders();
  scheduleAllReminders();
  closeModal();
  renderSchedule();
}

/* ─────────────────────────────────────────────────────────────
   MODULE 9 · REMINDER ENGINE
   Browser Notification API (requires permission) +
   in-app toast fallback (always works) +
   setInterval polling every 30 seconds
   ───────────────────────────────────────────────────────────── */
var _reminderIntervalId = null;

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function scheduleAllReminders() {
  cancelAllReminders();
  _reminderIntervalId = setInterval(checkReminders, 30000); // poll every 30s
}

function cancelAllReminders() {
  if (_reminderIntervalId) clearInterval(_reminderIntervalId);
  _reminderIntervalId = null;
}

/* Check every 30 seconds whether any activity starts in the next minute */
function checkReminders() {
  var now    = new Date();
  var curMin = now.getHours() * 60 + now.getMinutes();
  var curSec = now.getSeconds();

  (STATE.schedule || []).forEach(function(slot) {
    if (!slot.reminder) return;
    var slotMin = timeToMins(slot.startTime);
    // Fire reminder when we are within 0–1 minutes of start
    if (slotMin === curMin) {
      fireReminder(slot);
    }
  });
}

function fireReminder(slot) {
  var info    = getTypeInfo(slot.type);
  var label   = slot.type === 'custom' ? (slot.customName || 'Custom') : info.label;
  var content = getActivityContent(slot.type, STATE.tradition);
  var verse   = content.verse || '';
  var source  = content.source || '';

  // Play bell sound
  if (STATE.soundUnlocked) {
    synthesiseBell();
    setTimeout(function(){ synthesiseOm(2.5); }, 2200);
  }

  // In-app toast (always)
  showReminderToast(info.icon, label, formatTime(slot.startTime), '"' + verse + '" — ' + source);

  // Browser notification (if permitted)
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification('Ārogya · ' + label, {
        body: '"' + verse.substring(0, 100) + (verse.length > 100 ? '…' : '') + '"',
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="%231A0A04"/><text y="48" x="32" font-size="42" text-anchor="middle" font-family="serif">ॐ</text></svg>',
        tag:  'arogya-' + slot.id,
        silent: false
      });
    } catch(e) {}
  }
}

function showReminderToast(icon, activity, time, teaching) {
  document.getElementById('toastIcon').textContent     = icon;
  document.getElementById('toastActivity').textContent = activity;
  document.getElementById('toastTime').textContent     = time;
  document.getElementById('toastTeaching').textContent = teaching;

  var toast = document.getElementById('reminderToast');
  if (toast) {
    toast.classList.add('show');
    // Auto-dismiss after 12 seconds
    setTimeout(function(){ toast.classList.remove('show'); }, 12000);
  }
}

function dismissToast() {
  var toast = document.getElementById('reminderToast');
  if (toast) toast.classList.remove('show');
}

/* ─────────────────────────────────────────────────────────────
   MODULE 10 · DOSHA-PERSONALIZED SUGGESTIONS
   When the My Schedule panel is first opened with an empty
   schedule, propose sensible activities based on dosha combo.
   ───────────────────────────────────────────────────────────── */
var DOSHA_SUGGESTIONS = {
  vata:  ['wake','pranayama','abhyanga','breakfast','meditation','work','lunch','walk','dinner','journaling','sleep'],
  pitta: ['wake','meditation','yoga','breakfast','work','lunch','work','dinner','journaling','detox','sleep'],
  kapha: ['wake','yoga','walk','pranayama','breakfast','work','lunch','walk','dinner','meditation','sleep']
};

function getSuggestedSchedule() {
  var combo   = (STATE.doshaCombo || ['pitta'])[0];
  var keys    = DOSHA_SUGGESTIONS[combo] || DOSHA_SUGGESTIONS.pitta;
  var d       = getSmartDefaults();
  var cursor  = timeToMins(d.wake);

  return keys.map(function(key) {
    var info = getTypeInfo(key);
    var dur  = info.defaultDuration;
    var slot = {
      id:         makeId(),
      type:       key,
      customName: '',
      startTime:  minsToTime(cursor),
      endTime:    minsToTime(cursor + dur),
      reminder:   true,
      notes:      '',
      done:       false
    };
    cursor += dur + 15;  // 15-min gap between activities
    return slot;
  });
}

/* Populate schedule from dosha suggestions */
function applySuggestedSchedule() {
  if ((STATE.schedule || []).length > 0) {
    if (!confirm('This will replace your current schedule with a dosha-personalised template. Continue?')) return;
  }
  STATE.schedule = getSuggestedSchedule();
  saveState();
  scheduleAllReminders();
  renderSchedule();
  recordActivity();
}

/* ─────────────────────────────────────────────────────────────
   MODULE 11 · INIT HOOK
   Called from the main init() after STATE is loaded.
   ───────────────────────────────────────────────────────────── */
function initScheduleModule() {
  ensureScheduleState();
  scheduleAllReminders();
  requestNotificationPermission();
  // Render smart defaults in suggested panel if user is onboarded
  if (STATE.onboardDone) renderSmartDefaults();
}

/* Export for use from main go() */
if (typeof window !== 'undefined') {
  window.switchDinaTab      = switchDinaTab;
  window.openModal          = openModal;
  window.closeModal         = closeModal;
  window.closeModalBackdrop = closeModalBackdrop;
  window.saveActivity       = saveActivity;
  window.deleteActivity     = deleteActivity;
  window.selectActivityType = selectActivityType;
  window.toggleDone         = toggleDone;
  window.dismissToast       = dismissToast;
  window.applySuggestedSchedule = applySuggestedSchedule;
  window.editSmartDefault   = editSmartDefault;
  window.initScheduleModule = initScheduleModule;
}

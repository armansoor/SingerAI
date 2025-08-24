/*****************************************************************
 dataset.js
 - combinatorial template + fragment approach
 - English and Korean fragments + templates
 - placeholders: ${member}, ${color}, ${place}, ${emotion}, ${time}, ${adlib}
*****************************************************************/

/* Member lists */
const MEMBERS_BP = ["Jisoo","Jennie","Rosé","Lisa"];
const MEMBERS_BM = ["Ruka","Pharita","Asa","Ahyeon","Rami","Rora","Chiquita"];
const ALL_MEMBERS = [...MEMBERS_BP, ...MEMBERS_BM];

/* Fragment pools (lots of options -> combinatorial explosion) */
const COLORS = [
  "pink","neon pink","black","golden","silver","glittering","rose","midnight blue","lavender","pearl",
  "ruby","diamond","crimson","amber","electric blue","mint","peach","bubblegum","coral","soft violet",
  "ice blue","satin","bronze","magenta","champagne"
];

const PLACES = [
  "Seoul night","neon street","rooftop","dance floor","skyline","city lights","stadium","backstage","studio",
  "moonlit alley","sunlit rooftop","rainy avenue","star plaza","midnight lane","sunrise pier","concert stage",
  "festival square","roaring club","quiet cafe","city corner","luminous bridge","neon arcade","private stage",
  "train station","highway exit","silver skyline","lotus garden","glass plaza","crimson avenue","mirage stage"
];

const EMOTIONS = [
  "love","fearless","free","bold","lonely","hopeful","wild","calm","reckless","gentle","hungry","astonished",
  "yearning","fiery","soft","tender","starlit","burning","restless","brave","sweet","nervous","proud",
  "rebellious","carefree","dreamy","golden","melancholy","cheerful","mischievous","warm","untamed","timeless",
  "electric","blessed","sincere","wilder","crystal","flaming","silken","velvet"
];

const TIMES = [
  "tonight","this midnight","at dawn","in the moonlight","before sunrise","in the pouring rain",
  "during the sunrise","til the end","for eternity","this morning","by the neon lights","on the weekend",
  "in our youth","after the show","in the quiet hour","under the stars","on repeat","until we fade",
  "on this stage","in every heartbeat"
];

const ADLIB_EN = ["Oh oh","Yeah","Na-na","Woo","Turn it up","Hey","Let's go","Woah","Ayy","La la"];
const ADLIB_KR = ["어어","예","나나","우와","더 크게","와우","하","이제","오","라라"];

/* Small vocabulary to create meaningful phrases */
const SUBJECTS_EN = [
  "my heart","the night","our flame","this dream","your eyes","the skyline","this heartbeat",
  "the city","my voice","the crowd","a whisper","the mirror","these lights","the rhythm","our fire",
  "the silence","the echo","our story","the melody","our name"
];
const VERBS_EN = [
  "is burning","keeps dancing","won't stop","calls me","pulls me in","takes flight",
  "shines brighter","breaks the cold","won't fade","screams louder","beats faster",
  "runs wild","whispers secrets","steals my breath","catches the light"
];
const OBJECTS_EN = [
  "tonight","tonight's sky","the stage","the world","the dream","the rhythm","the neon",
  "the truth","our fate","the moment","a new dawn","forever","this chance","the spotlight"
];

/* Korean fragments */
const SUBJECTS_KR = [
  "내 심장","밤하늘","우리 불꽃","이 꿈","너의 눈빛","도시의 불빛","이 박자","무대","목소리","관중",
  "속삭임","거울","조명","리듬","우리 이야기","순간","우리의 이름"
];
const VERBS_KR = [
  "타올라","춤춰","멈추지 않아","날 부르네","끌어당겨","날아올라","더 빛나","깨뜨려","사라지지 않아","더 크게 울려",
  "빠르게 뛰어","거칠어져","속삭이네","숨막혀","빛을 잡아"
];
const OBJECTS_KR = [
  "이 밤","하늘","무대","세상","꿈","리듬","네온","진실","운명","순간","새벽","영원","기회","스포트라이트"
];

/* Section templates (English & Korean arrays). Templates use placeholders; filled later */
const TEMPLATES = {
  intro_en: [
    "Under the ${color} lights, ${member} steps in (we ignite)",
    "Tonight ${member} whispers: ${subject} ${verb}",
    "Catch a breath — ${place} is ours ${adlib}",
    "The ${place} glows and ${member} is shining bright",
    "We open with a spark: ${subject} ${verb}, oh"
    // ... (dozens more; combination will be huge)
  ],
  intro_kr: [
    "${member}의 등장, ${place} 속에 빛나",
    "네온 불빛 아래, ${member}의 목소리 들려",
    "시작되는 노래, ${subject}이(가) ${verb}",
    "${member}이 말해: 지금이야, 함께 해",
    "밤은 깊고 우린 깨어나 (어어)"
  ],

  verse_en: [
    "${member}: ${subject} ${verb} in the ${place}",
    "${member} sings softly: ${subject} and ${object}",
    "Walking through the ${place}, ${member} says ${adlib}",
    "Silhouette on the ${place}, ${member} moves like a dream",
    "${member} confesses: ${subject} ${verb}, don't let go"
  ],
  verse_kr: [
    "${member}: ${subject}이(가) ${verb}해",
    "${member}의 가사: ${subject}과(와) ${object}",
    "${place}을 걸으며 ${member}은(는) 속삭여",
    "네 곁에 서서, ${member}은(는) 노래해",
    "${member}의 목소리, ${subject}이(가) 떨려"
  ],

  pre_en: [
    "${member}: heartbeats match the ${place}, ${adlib}",
    "We feel the rush — ${member} says 'stay with me'",
    "Close your eyes, ${subject} ${verb}",
    "Tension builds: ${member} holds the night",
    "Take this moment, ${member}: ${subject} and ${object}"
  ],
  pre_kr: [
    "${member}: 두근대는 가슴, ${adlib}",
    "눈을 감아, ${subject}이(가) ${verb}",
    "숨결이 닿아, 지금 이 순간",
    "${member}의 전개: 더 높게 올라가",
    "손을 잡아, 놓치지 마"
  ],

  chorus_en: [
    "All: Light it up, a ${color} fire, we go higher ${adlib}",
    "All: We are forever, dancing on the ${place}",
    "All: Shouting loud — ${subject} ${verb} tonight",
    "All: Raise your hands, the ${object} is ours",
    "All: Together we shine, brighter than the ${color} sky"
  ],
  chorus_kr: [
    "All: 불을 밝혀 ${color}빛으로, 더 높이 올라",
    "All: 우리 영원히, ${place}에서 춤춰",
    "All: 소리쳐 — ${subject}이(가) ${verb} tonight",
    "All: 손을 높이, 이 순간은 우리 것",
    "All: 함께 빛나, ${color} 하늘 아래"
  ],

  rap_en: [
    "${member}: Quick step, crown on, I own the sound ${adlib}",
    "${member}: Break the rules, no fear, we set the tone",
    "${member}: Fast lane, bright flame, no brakes tonight",
    "${member}: Runway rhythm, city lights on my side",
    "${member}: I'm the storm and I'm coming through"
  ],
  rap_kr: [
    "${member}: 랩 타임, 불꽃처럼 난 달려 (Woah)",
    "${member}: 규칙을 깨, 두려움 없이",
    "${member}: 빠른 비트, 하이플라잉, 멈추지 않아",
    "${member}: 런웨이 위, 조명은 내 편",
    "${member}: 폭풍처럼, 난 다가와"
  ],

  bridge_en: [
    "${member}: Close your eyes — feel the ${emotion} in the air",
    "${member}: The moment stops, we breathe as one",
    "${member}: Floating in the ${place}, this is ours",
    "${member}: A quiet call, but our hearts reply",
    "${member}: We hold this, never let go"
  ],
  bridge_kr: [
    "${member}: 눈 감아, ${emotion}을(를) 느껴",
    "${member}: 순간이 멈춰, 우린 하나 돼",
    "${member}: ${place} 속에 떠 있어, 우리의 노래",
    "${member}: 조용한 외침에 가슴이 응답해",
    "${member}: 이걸 잡아, 절대 놓지 마"
  ],

  outro_en: [
    "All: We fade into the ${color} light, but keep the flame",
    "All: Until next time, keep the song in your heart",
    "All: One more chorus in our minds, forever young",
    "All: Curtain falls, our glow remains",
    "All: Stardust on our skin, we'll meet again"
  ],
  outro_kr: [
    "All: ${color} 빛 속으로 사라지지만 불은 남아",
    "All: 다음을 기약해, 노래는 가슴에",
    "All: 한 번만 더, 영원히 젊은 우리",
    "All: 막이 내려도 우리의 빛은 남아",
    "All: 별빛 가득, 다시 만나자"
  ]
};

/* A few utility templates that mix English + Korean if needed */
const MIXED_TEMPLATES = {
  chorus_mix: [
    "All: ${member} says 'we fly' — 함께 날아가 (we won't fall)",
    "All: Shout it out, 네온 dream, don't let go",
    "All: Forever young, 오늘 이 밤 (tonight is ours)",
    "All: Light it up, 우리 소리 들려, louder",
    "All: Hands up high, 마음은 free, let's go"
  ]
};

/* NOTE: The above template arrays are intentionally concise here.
   The combinatorial pools (COLORS, PLACES, EMOTIONS, SUBJECTS, VERBS, ADLIB) are large.
   Each template uses placeholders replaced at runtime. This yields >10M unique possibilities. */

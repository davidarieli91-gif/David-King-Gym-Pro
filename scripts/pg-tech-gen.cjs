// PG technique generator: parse names -> correct EN/RU/HE techniques + pose spec
const fs = require('fs');
const DB = 'G:/Antigravity/DavidKingGym/exercise-db.json';
const db = JSON.parse(fs.readFileSync(DB, 'utf8'));
const pg = db.filter(e => e.src === 'pg');

// ---------- 1. backup ----------
fs.writeFileSync('G:/Antigravity/DavidKingGym/data/pg-backup-pre-techfix.json',
  JSON.stringify(pg.map(e => ({ id: e.id, nE: e.nE, t: e.t, tRu: e.tRu, tHe: e.tHe })), null, 1));

// ---------- 2. parser ----------
function parseSpec(ex) {
  let nl = ((ex.nE || '') + ' ' + (ex.nR || '')).toLowerCase();
  // двойные варианты «standing / seated» считаем стоячими
  nl = nl.replace(/standing\s*\/\s*seated/g, 'standing').replace(/стоя\s*\/\s*сидя/g, 'стоя');
  const eq = String(ex.e || '').toLowerCase();
  let pos = null;
  const has = (...ws) => ws.some(w => nl.includes(w));
  if (has('pull-up','pull up','chin-up','подтягиван','muscle-up','planche','gravitron')) pos='hanging';
  else if (has('hanging leg raise','в висе')) pos='hanging';
  else if (/incline|наклонн/.test(nl) && !has('seated','сидя') && has('bench','скам','lying','леж','fly','развод','press','жим','curl','row','pullover','тяга')) pos='incline';
  else if (/decline|отрицательный наклон|обратный наклон/.test(nl)) pos='decline';
  else if (has('seated','sit ','сидя','sitting')) pos='seated';
  else if (has('prone','on stomach','на животе','face down','on abs')) pos='prone';
  else if (has('kneeling','на коленях','kneel')) pos='kneeling';
  else if (has('plank','планк')) pos='plank_pos';
  else if (has('push-up','push up','pushup','отжимани','mountain climber','burpee','берпи')) pos='plank_pos';
  else if (has('floor press','жим с пола','on the floor','на полу')) pos='floor';
  else if (has('bench','скам','лёжа','лежа','lying','lie on','supine')) pos='bench_flat';
  else if (has('standing','stand','стоя','в стойке')) pos='standing';
  let cable = null;
  if (/cable|pulley|блок|кроссовер|crossover/.test(nl)) {
    cable = has('low pulley','low cable','нижний блок','низк') ? 'low'
      : has('mid cable','mid pulley','middle','средний блок','средн') ? 'mid'
      : has('high pulley','high cable','верхний блок','высок') ? 'high' : 'mid';
  }
  let impl = eq;
  if (/trx/.test(nl)) impl='trx';
  else if (/\bband\b|резин|эластичн|resistance band|петли/i.test(nl)) impl='band';
  else if (/kettlebell|гир/.test(nl)) impl='kettlebell';
  else if (/medicine ball|медбол/.test(nl)) impl='medball';
  else if (/ez.?bar/.test(nl)) impl='ez_bar';
  else if (/rope|канат/.test(nl) && eq==='cable') impl='cable_rope';
  else if (eq==='other'){
    if (/dumbbell|гантел/.test(nl)) impl='dumbbell';
    else if (/barbell|штанг/.test(nl)) impl='barbell';
    else impl='bodyweight';
  }
  return { pos, cable, impl };
}

// ---------- 3. pattern ----------
function detectPattern(ex){
  const nl=((ex.nE||'')+' '+(ex.nR||'')).toLowerCase(); const g=ex.g;
  const has=(...ws)=>ws.some(w=>nl.includes(w));
  if(g==='warmup') return 'warmup';
  if(g==='stretching'||has('stretch','растяжк')) return 'stretch';
  if(has('mountain climber','burpee','берпи')) return 'cardio';
  if(has('muscle-up','muscle up','планш')) return 'pullup';
  if(has('leg raise','подъем ног','подъём ног')&&(/hanging|в висе/.test(nl)||g==='calisthenics')) return 'hangingLegRaise';
  if(has('leg raise','подъем ног','подъём ног','lifting legs')) return 'legRaise';
  if(has('pull-up','pull up','chin-up','подтягиван','gravitron')) return 'pullup';
  if(has('leg press','жим ногами')) return 'legPress';
  if(has('leg extension','разгибание ног')) return 'legExtension';
  if(has('leg curl','сгибание ног')) return 'legCurl';
  if(has('calf','икроножн','икр','на носки','носки')) return 'calfRaise';
  if(has('hip thrust','ягодичный мост','glute bridge','мостик')) return 'hipThrust';
  if(g==='legs'&&has('abduction','adduction','отведение','приведение')) return 'hipAbdAdd';
  if(has('kickback','donkey','отведение назад')&&g==='legs') return 'gluteKickback';
  if(has('deadlift','станов','румынск')) return 'deadlift';
  if(has('squat','присед')) return 'squat';
  if(has('step-up','step up','зашагиван')) return 'stepUp';
  if(has('lunge','выпад')) return 'lunge';
  if(has('russian twist','twist','повороты туловищ','повороты корпус')) return 'twist';
  if(has('back extension','гиперэкстензия','superman')) return 'backExt';
  if(has('pullover','пуловер')) return 'pullover';
  if(has('face pull','тяга к лицу')) return 'facePull';
  if(has('lat pulldown','pulldown','pull-down','тяга верхнего блока к груди','вертикальная тяга')) return 'latPulldown';
  if(has('upright row','к подбородку')) return 'uprightRow';
  if(has('shrug','шраг')) return 'shrug';
  if(has('lateral raise','в стороны','side raise','махи в сторон')) return 'latRaise';
  if(has('front raise','перед собой','forward raise')) return 'frontRaise';
  if(has('wrist','запяст')) return 'wristCurl';
  if(g==='triceps'||has('triceps extension','pushdown','push down','французский','трицепс')) return 'tricepsExt';
  if(g==='elbow_flexors'||has('curl','сгибание рук','бицепс')) return 'bicepCurl';
  if(has('fly','butterfly','бабочк','разводк','разведение рук')) return 'chestFly';
  if(g==='shoulders'&&has('press','жим')) return 'shoulderPress';
  if(g==='chest'&&has('press','жим')) return 'chestPress';
  if(g==='back'&&has('row','тяга')) return 'row';
  if(has('press','жим')) return 'chestPress';
  if(has('row','тяга')) return 'row';
  return {legs:'squat',chest:'chestPress',back:'row',shoulders:'shoulderPress',
    elbow_flexors:'bicepCurl',triceps:'tricepsExt',forearms:'wristCurl',
    abdominals:'crunch',fullbody:'cardio',calisthenics:'pullup'}[g]||'generic';
}

// ---------- 4. phrases ----------
const IMPL_EN={barbell:'the barbell',dumbbell:'the dumbbells',ez_bar:'the EZ-bar',machine:'the machine handles',smith:'the Smith bar',bodyweight:'',kettlebell:'the kettlebell',band:'the band',trx:'the TRX handles',medball:'the medicine ball',cable:'the handles',cable_rope:'the rope attachment'};
const IMPL_RU={barbell:'штангу',dumbbell:'гантели',ez_bar:'EZ-гриф',machine:'рукоятки тренажёра',smith:'гриф тренажёра Смита',bodyweight:'',kettlebell:'гирю',band:'ленту сопротивления',trx:'рукояти TRX',medball:'медбол',cable:'рукоятки',cable_rope:'канатную рукоять'};
const IMPL_HE={barbell:'את המוט',dumbbell:'את המשקולות',ez_bar:'את המוט EZ',machine:'את ידיות המכונה',smith:'את מוט סמית',bodyweight:'',kettlebell:'את הקטלבל',band:'את הגומייה',trx:'את ידיות ה-TRX',medball:'את כדור המשקולת',cable:'את הידיות',cable_rope:'את חבל החיבור'};
const CABLE_HE={low:'התחתון',mid:'האמצעי',high:'העליון'};
const CABLE_EN={low:'low',mid:'mid',high:'high'}, CABLE_RU={low:'нижнем',mid:'среднем',high:'верхнем'};
function imp(s,l){
  let base;
  if(/^cable/.test(s.impl)&&s.cable){
    base = l==='ru'?`рукоятки на ${CABLE_RU[s.cable]} блоке`
         : l==='he'?`את הידיות בגלגלת ה${CABLE_HE[s.cable]}`
         : `${CABLE_EN[s.cable]} pulley handle(s)`;
  } else {
    base = l==='ru'?IMPL_RU[s.impl] : l==='he'?IMPL_HE[s.impl] : IMPL_EN[s.impl];
  }
  return base||'';
}
const OPEN={
 en:{standing:'Stand tall with feet hip-width apart and core braced.',
   seated:'Sit upright with your back firmly against the pad, feet flat on the floor.',
   bench_flat:'Lie on a flat bench, feet planted firmly on the floor.',
   incline:'Set the bench to a 30-45° incline and lie back with your head above your hips.',
   decline:'Lie on a decline bench with legs secured under the pads.',
   floor:'Lie on your back on the floor with knees bent.',
   prone:'Lie face down with your body in a straight line.',
   kneeling:'Kneel on one knee with your torso upright and core braced.',
   hanging:'Hang from the bar with an overhand grip, shoulders active.',
   plank_pos:'Set up a strong plank: hands under shoulders, body straight.'},
 ru:{standing:'Встаньте прямо, стопы на ширине таза, пресс в тонусе.',
   seated:'Сядьте ровно, спина прижата к спинке, стопы полностью на полу.',
   bench_flat:'Лягте на горизонтальную скамью, стопы жёстко уприте в пол.',
   incline:'Выставьте наклон скамьи 30-45° и лягте головой выше бёдер.',
   decline:'Лягте на скамью с отрицательным наклоном, ноги зафиксируйте валиками.',
   floor:'Лягте на пол на спину, колени согнуты.',
   prone:'Лягте на живот, тело вытянуто в линию.',
   kneeling:'Встаньте на одно колено, корпус вертикально, пресс в тонусе.',
   hanging:'Повисните на турнике хватом сверху, плечи активны.',
   plank_pos:'Примите жёсткую планку: ладони под плечами, тело в линию.'},
 he:{standing:'עמדו זקופים, רגליים ברוחב האגן, הבטן מכווצת.',
   seated:'שבו זקוף, הגב צמוד למשענת, כפות הרגליים על הרצפה.',
   bench_flat:'שכבו על ספסל מישורי, הרגליים יציבות על הרצפה.',
   incline:'כווננו את הספסל ל-30-45° ושכבו כשהראש מעל הירכיים.',
   decline:'שכבו על ספסל בשיפוע שלילי וקבעו את הרגליים.',
   floor:'שכבו על הגב על הרצפה, הברכיים כפופות.',
   prone:'שכבו על הבטן, הגוף בקו ישר.',
   kneeling:'עמדו על ברך אחת, הגוף זקוף, הבטן מכווצת.',
   hanging:'התלו על המוט באחיזה מלמעלה, הכתפיים פעילות.',
   plank_pos:'היכנסו לפלאנק יציב: כפות ידיים מתחת לכתפיים.'}
};

// movement steps: pattern -> fn(spec)->[[en,ru,he],...]
const M={
 chestPress:s=>[
  [`Position ${imp(s,'en')} at mid-chest, elbows slightly below shoulder line.`,
   `Расположите ${imp(s,'ru')} у середины груди, локти чуть ниже линии плеч.`,
   `מקמו את ${imp(s,'he')} בגובה החזה, המרפקים מעט מתחת לכתפיים.`],
  [`Press up until arms are extended without locking the elbows.`,
   `Выжмите вверх до выпрямления рук, не «защёлкивая» локти.`,
   `לחצו כלפי מעלה עד יישור הידיים, ללא נעילת מרפקים.`],
  [`Lower under control until you feel a light chest stretch.`,
   `Опускайте подконтрольно до лёгкого растяжения грудных.`,
   `הורידו בשליטה עד למתיחה קלה בחזה.`]],
 chestFly:s=>[
  [`Hold ${imp(s,'en')} out wide with a slight fixed bend in the elbows.`,
   `Возьмите широко в стороны ${imp(s,'ru')}, локти слегка согнуты и зафиксированы.`,
   `החזיקו את ${imp(s,'he')} בצדדים, מרפקים כפופים מעט.`],
  [`Bring your hands together in a hugging arc, squeezing the chest.`,
   `Сводите руки по дуге «объятия», сжимая грудные.`,
   `קרבו ידיים בקשת "חיבוק" וכווצו את שרידי החזה.`],
  [`Open back to the wide start keeping the elbow angle constant.`,
   `Разводите обратно, сохраняя угол в локтях.`,
   `פתחו חזרה לרוחב, שומרים על זווית המרפקים.`]],
 shoulderPress:s=>[
  [`Raise ${imp(s,'en')} to shoulder level, elbows slightly forward.`,
   `Поднимите ${imp(s,'ru')} к уровню плеч, локти чуть впереди корпуса.`,
   `הרימו את ${imp(s,'he')} לגובה הכתפיים, מרפקים מעט קדימה.`],
  [`Press straight overhead until arms are extended.`,
   `Выжмите строго вверх над головой.`,
   `לחצו ישר כלפי מעלה עד יישור מלא.`],
  [`Lower under control back to shoulder level.`,
   `Опустите подконтрольно обратно к плечам.`,
   `הורידו בשליטה חזרה לכתפיים.`]],
 latRaise:s=>[
  [`Let ${imp(s,'en')} hang at your sides, elbows softly bent.`,
   `Опустите ${imp(s,'ru')} вдоль тела, локти слегка согнуты.`,
   `הניחו את ${imp(s,'he')} לצידי הגוף, מרפקים רכים.`],
  [`Raise arms out to shoulder height, leading with the elbows.`,
   `Поднимайте руки через стороны до уровня плеч, ведя локтями.`,
   `הרימו ידיים הצידה עד גובה הכתפיים, מובילים במרפקים.`],
  [`Lower slowly, resisting gravity.`,
   `Медленно опускайте, сопротивляясь гравитации.`,
   `הורידו לאט, בהתנגדות.`]],
 frontRaise:s=>[
  [`Hold ${imp(s,'en')} in front of your thighs.`,
   `Держите ${imp(s,'ru')} перед бёдрами.`,
   `החזיקו את ${imp(s,'he')} לפני הירכיים.`],
  [`Raise straight arms forward to eye level without swinging.`,
   `Поднимайте прямые руки перед собой до уровня глаз без раскачки.`,
   `הרימו ידיים ישרות קדימה לגובה העיניים, ללא נדנוד.`],
  [`Lower with control back to the start.`,
   `Опустите подконтрольно в исходную позицию.`,
   `הורידו בשליטה חזרה.`]],
 uprightRow:s=>[
  [`Hold ${imp(s,'en')} in front of you with a narrow grip.`,
   `Держите ${imp(s,'ru')} перед собой узким хватом.`,
   `החזיקו את ${imp(s,'he')} לפניכם באחיזה צרה.`],
  [`Pull along the body to collarbone level, elbows leading high.`,
   `Тяните вдоль корпуса до ключиц, локти ведут вверх.`,
   `משכו לאורך הגוף עד הבריחיים, המרפקים מובילים.`],
  [`Lower smoothly to the start.`,
   `Плавно опустите в исходную позицию.`,
   `הורידו בחלקות חזרה.`]],
 shrug:s=>[
  [`Let ${imp(s,'en')} hang straight at your sides.`,
   `Опустите ${imp(s,'ru')} на прямых руках вдоль тела.`,
   `הניחו את ${imp(s,'he')} ישרות לצידי הגוף.`],
  [`Shrug shoulders straight up toward the ears, no elbow bend.`,
   `Поднимите плечи строго вверх к ушам, не сгибая локти.`,
   `הרימו כתפיים ישר כלפי האוזניים, ללא כיפוף מרפקים.`],
  [`Pause at the top, then lower fully.`,
   `Задержитесь вверху и опустите полностью.`,
   `עצרו למעלה והורידו לגמרי.`]],
 row:s=>[
  [/seated|сидя/.test((s.posName||''))?null:null],
 ].filter(Boolean),
};
// row needs ex context; define separately below
M.row=(s,ex)=>{
  const nl=((ex.nE||'')+' '+(ex.nR||'')).toLowerCase();
  const seated=/seated|сидя|machine|тренаж/.test(nl)&&!/bent|наклон/.test(nl);
  if(seated)return[
    [`Brace your torso upright and take hold of ${imp(s,'en')}.`,
     `Удерживайте корпус вертикально и возьмите ${imp(s,'ru')}.`,
     `יישרו את הגוף ואחזו ב${imp(s,'he')}.`],
    [`Pull the handle to your lower ribs, squeezing the shoulder blades together.`,
     `Тяните рукоять к низу живота, сводя лопатки.`,
     `משכו את הידית אל תחתית הצלעות ולחצו את השכמות יחד.`],
    [`Extend your arms forward under control, letting the shoulders stretch.`,
     `Выпрямляйте руки вперёд подконтрольно, растягивая плечевой пояс.`,
     `יישרו ידיים קדימה בשליטה, עם מתיחת הכתפיים.`]];
  return[
    [`Hinge forward from the hips with a flat back, ${imp(s,'en')} hanging under your shoulders.`,
     `Наклонитесь от таза со спиной прямой, ${imp(s,'ru')} свисают под плечами.`,
     `הטו את האגן עם גב ישר, ${imp(s,'he')} תלויות מתחת לכתפיים.`],
    [`Pull toward your lower ribs, driving elbows back and squeezing the blades.`,
     `Тяните к нижней части живота, отводя локти назад и сводя лопатки.`,
     `משכו אל תחתית הצלעות, מרפקים אחורה וכיווץ השכמות.`],
    [`Extend arms back with control, spine neutral throughout.`,
     `Выпрямите руки подконтрольно, позвоночник нейтрален.`,
     `יישרו ידיים בשליטה, עמוד השדרה ניטרלי.`]];
};
M.latPulldown=()=>[
  [`Sit down and grip the bar wide, thighs locked under the pads.`,
   `Сядьте и возьмите широкий хват за гриф, бёдра под валиками.`,
   `שבו ואחזו במוט רחב, הירכיים מתחת למוטות.`],
  [`Pull the bar to your upper chest while lifting your chest to meet it.`,
   `Тяните гриф к верху груди, подавая грудь навстречу.`,
   `משכו את המוט אל החזה העליון.`],
  [`Let the bar rise slowly until arms are fully stretched.`,
   `Отпускайте медленно до полного вытяжения рук.`,
   `תנו למוט לעלות לאט עד מתיחה מלאה.`]];
M.pullup=()=>[
  [`Take an overhand grip on the bar, hands wider than shoulders.`,
   `Возьмите хват сверху, кисти шире плеч.`,
   `אחזו במוט מלמעלה, רחב מהכתפיים.`],
  [`Pull up until your chin clears the bar, elbows driving down.`,
   `Подтянитесь, пока подбородок не пройдёт перекладину.`,
   `משכו עד שהסנטר עובר את המוט.`],
  [`Lower with control to a full dead-hang between reps.`,
   `Опускайтесь подконтрольно до полного виса.`,
   `הורידו בשליטה לתלייה מלאה.`]];
M.dip=()=>[
  [`Support yourself on parallel bars, arms locked, torso slightly forward.`,
   `Удерживайтесь на брусьях, руки прямые, корпус чуть вперёд.`,
   `החזיקו על המקבילים, ידיים ישרות, הגוף מעט קדימה.`],
  [`Bend elbows and lower until shoulders are just below elbow level.`,
   `Сгибая локти, опуститесь чуть ниже уровня локтей.`,
   `כופפו מרפקים והורידו מעט מתחת לגובה המרפקים.`],
  [`Press back up to full lockout.`,
   `Выжмите себя обратно до полного выпрямления.`,
   `הרימו חזרה עד יישור מלא.`]];
M.pushup=()=>[
  [`Place hands slightly wider than shoulders; body forms one line.`,
   `Поставьте ладони чуть шире плеч; тело — одна прямая линия.`,
   `מקמו כפות מעט רחב מהכתפיים; הגוף בקו ישר.`],
  [`Lower your chest toward the surface, elbows about 45° to the body.`,
   `Опускайте грудь к поверхности, локти около 45° к телу.`,
   `הורידו את החזה, מרפקים בזווית 45° לגוף.`],
  [`Push away and lock out without letting hips sag.`,
   `Отожмитесь, не проваливая поясницу.`,
   `דחפו ויישרו, האגן לא שוקע.`]];
M.plank=()=>[
  [`Brace abs and glutes so the body forms one rigid line.`,
   `Напрягите пресс и ягодицы — тело единая жёсткая линия.`,
   `הדקו בטן וישבן — הגוף קו ישר.`],
  [`Hold without letting the hips drop or rise.`,
   `Удерживайте, не проваливая и не задирая таз.`,
   `החזיקו מבלי שהאגן יורד או עולה.`],
  [`Breathe steadily throughout the hold.`,
   `Дышите ровно всё время удержания.`,
   `נשמו באופן סדיר.`]];
M.bicepCurl=s=>[
  [`Pin your elbows to your sides holding ${imp(s,'en')}.`,
   `Прижмите локти к корпусу, удерживая ${imp(s,'ru')}.`,
   `צמדו מרפקים לגוף, אחזו ב${imp(s,'he')}.`],
  [`Curl toward the shoulders moving only at the elbows.`,
   `Сгибайте к плечам, работая только в локтях.`,
   `כופפו לכיוון הכתפיים, תנועה במרפקים בלבד.`],
  [`Lower slowly to full extension.`,
   `Медленно разогните руки вниз.`,
   `הורידו לאט ליישור מלא.`]];
M.tricepsExt=(s)=>[
  [`Set your working arm/arms against the cable or weight, upper arm fixed.`,
   `Зафиксируйте рабочую руку у блока или веса, плечо неподвижно.`,
   `קבעו את היד מול הכבל או המשקל, הזרוע יציבה.`],
  [`Extend the forearm fully, isolating the triceps.`,
   `Полностью разогните предплечье, изолируя трицепс.`,
   `יישרו את האמה במלואה, תוך בידוד הטריצפס.`],
  [`Return slowly to the bent-elbow start.`,
   `Медленно вернитесь в положение с согнутым локтем.`,
   `חזרו לאט לכיפוף המרפק.`]];
M.wristCurl=s=>[
  [`Rest your forearms on support with wrists free, holding ${imp(s,'en')}.`,
   `Положите предплечья на опору, кисти свободны, удерживая ${imp(s,'ru')}.`,
   `הניחו אמות על משטח, כפות חופשיות, אחזו ב${imp(s,'he')}.`],
  [`Curl the wrists up as high as possible.`,
   `Максимально согните кисти вверх.`,
   `כופפו את כפות הידיים כלפי מעלה.`],
  [`Lower the weight slowly into a full wrist stretch.`,
   `Медленно опустите вес до полного растяжения запястий.`,
   `הורידו לאט עד מתיחה מלאה.`]];
M.squat=s=>[
  [`Set ${imp(s,'en')||'your body'} in position and brace your core.`,
   `Займите положение с ${imp(s,'ru')||'собственным весом'}, напрягите пресс.`,
   `התמקמו עם ${imp(s,'he')||'משקל הגוף'} והדקו את הבטן.`],
  [`Push hips back and bend knees until thighs are parallel to the floor.`,
   `Отводите таз назад и сгибайте колени до параллели бёдер с полом.`,
   `דחפו את האגן אחורה וכופפו ברכיים עד מקביל לרצפה.`],
  [`Drive through whole foot and stand back up fully.`,
   `Встаньте, отталкиваясь всей стопой.`,
   `עמדו חזרה בדחיפה דרך כל כף הרגל.`]];
M.deadlift=s=>[
  [`Stand over ${imp(s,'en')}, shins close to the bar.`,
   `Встаньте над ${imp(s,'ru')}, голени близко к грифу.`,
   `עמדו מעל ${imp(s,'he')}, השוקיים קרובות למוט.`],
  [`Hinge and grip, then extend hips and knees lifting along the legs.`,
   `Наклонитесь, возьмите хват и тяните, разгибая бёдра и колени вдоль ног.`,
   `הטו, אחזו והרימו תוך פשיטת אגן וברכיים לאורך הרגליים.`],
  [`Lower by hinging first, then bending the knees.`,
   `Опускайте, сначала наклоняя таз, затем сгибая колени.`,
   `הורידו על ידי הטיית האגן ואז כיפוף הברכיים.`]];
M.lunge=s=>[
  [`Step forward into a long stance, torso upright.`,
   `Сделайте широкий шаг вперёд, корпус вертикально.`,
   `צעדו קדימה לעמדה רחבה, הגוף זקוף.`],
  [`Lower straight down until both knees are about 90°.`,
   `Опускайтесь строго вниз до угла ~90° в обоих коленях.`,
   `רדו ישר עד זווית 90° בשתי הברכיים.`],
  [`Push through the front heel to stand back up.`,
   `Встаньте, отталкиваясь пяткой передней ноги.`,
   `עמדו על עקב הרגל הקדמית.`]];
M.stepUp=M.lunge;
M.legPress=()=>[
  [`Place feet shoulder-width on the platform and release the safeties.`,
   `Поставьте стопы на платформу на ширине плеч и снимите упоры.`,
   `מקמו כפות רגליים על המשטח ברוחב הכתפיים ושחררו את הבלמים.`],
  [`Lower the platform until knees reach about 90° without rounding the lower back.`,
   `Опускайте платформу до ~90° в коленях, не округляя поясницу.`,
   `הורידו את המשטח עד 90° בברכיים, ללא עיגול הגב התחתון.`],
  [`Press through the heels back to near-lockout.`,
   `Выжимайте пятками почти до полного выпрямления.`,
   `לחצו דרך העקבים כמעט עד יישור מלא.`]];
M.legExtension=s=>[
  [`Sit with the shin pad just above your ankles.`,
   `Сядьте так, чтобы валик был чуть выше лодыжек.`,
   `שבו כך שהמשקולת מעט מעל הקרסוליים.`],
  [`Extend the knees to lift the pad until legs are straight.`,
   `Разгибайте колени, поднимая валик до прямых ног.`,
   `יישרו ברכיים עד לרגליים ישרות.`],
  [`Lower slowly without letting the weight slam.`,
   `Медленно опускайте, без броска веса.`,
   `הורידו לאט, ללא נפילת המשקל.`]];
M.legCurl=s=>[
  [`Position the roller pad above your heels.`,
   `Установите валик над пятками.`,
   `מקמו את המשענת מעל העקבים.`],
  [`Curl the heels toward the glutes, knees staying on the pad.`,
   `Сгибайте ноги, подводя пятки к ягодицам, колени на опоре.`,
   `כופפו את העקבים אל הישבן, הברכיים על המשענת.`],
  [`Lower under control to full extension.`,
   `Разгибайте подконтрольно до конца.`,
   `הורידו בשליטה עד יישור מלא.`]];
M.calfRaise=s=>[
  [`Place the balls of your feet on the edge with heels hanging.`,
   `Встаньте носками на край, пятки свисают.`,
   `עמדו על קצה המדרגה, העקבים באוויר.`],
  [`Rise as high as possible onto your toes, pausing at the top.`,
   `Поднимитесь максимально высоко на носки, задержитесь вверху.`,
   `הרימו גבוה על קצות האצבעות ועצרו למעלה.`],
  [`Lower heels slowly into a deep calf stretch.`,
   `Медленно опустите пятки в глубокое растяжение голени.`,
   `הורידו עקבים לאט למתיחה עמוקה.`]];
M.hipThrust=s=>[
  [`Rest your upper back on a bench, roll the bar over your hips.`,
   `Обопритесь верхом спины на скамью, положите штангу на бёдра.`,
   `השעינו את הגב העליון על ספסל, הניחו מוט על הירכיים.`],
  [`Drive through the heels and thrust hips to full lockout.`,
   `Выталкивайте бёдра вверх пятками до полного распрямления.`,
   `דחפו דרך העקבים והרימו את האגן עד יישור מלא.`],
  [`Squeeze glutes at top, lower halfway with control.`,
   `Сожмите ягодицы вверху, опускайте наполовину под контролем.`,
   `כווצו ישבן למעלה והורידו חצי בשליטה.`]];
M.hipAbdAdd=s=>[
  [`Keep the torso stable and the working leg straight.`,
   `Держите корпус стабильным, рабочая нога прямая.`,
   `שמרו על גו יציב, הרגל העובדת ישרה.`],
  [`Move the leg against resistance only from the hip joint.`,
   `Отводите/приводите ногу только в тазобедренном суставе.`,
   `הניעו את הרגל מול ההתנגדות רק ממפרק הירך.`],
  [`Return slowly without swinging.`,
   `Возвращайте медленно, без рывков.`,
   `חזרו לאט, ללא נדנוד.`]];
M.gluteKickback=s=>[
  [`Get on all fours with hands under shoulders, knee under hip.`,
   `Встаньте на четвереньки: ладони под плечами, колено под тазом.`,
   `עמדו על ארבע, כפות מתחת לכתפיים, ברך מתחת לאגן.`],
  [`Kick the working leg back and up, squeezing the glute.`,
   `Отводите рабочую ногу назад-вверх, сжимая ягодицу.`,
   `בעטו את הרגל אחורה ומעלה תוך כיווץ הישבן.`],
  [`Return the knee under the hip without arching the low back.`,
   `Верните колено под таз, не прогибая поясницу.`,
   `חזרו, מבלי לקשת את הגב התחתון.`]];
M.crunch=s=>[
  [`Place hands lightly behind your head, elbows open.`,
   `Придерживайте голову ладонями, локти раскрыты.`,
   `הניחו ידיים מאחורי הראש, מרפקים פתוחים.`],
  [`Curl the ribcage toward the pelvis, rounding the upper back.`,
   `Скручивайте грудную клетку к тазу, округляя верх спины.`,
   `קרבו את הצלעות לאגן, עיגול הגב העליון.`],
  [`Lower slowly without releasing tension in the abs.`,
   `Опускайте медленно, сохраняя напряжение пресса.`,
   `הורידו לאט, שומרים על מתח בבטן.`]];
M.legRaise=s=>[
  [`Keep knees slightly bent and press your lower back into the floor.`,
   `Слегка согните колени и прижмите поясницу к полу.`,
   `כופפו מעט ברכיים והצמידו את הגב התחתון לרצפה.`],
  [`Raise the legs to vertical using the abs, not momentum.`,
   `Поднимайте ноги до вертикали усилием пресса, без инерции.`,
   `הרימו רגליים לאנך בכוח הבטן, ללא תנופה.`],
  [`Lower slowly, stopping before the heels touch the floor.`,
   `Опускайте медленно, не касаясь пола пятками.`,
   `הורידו לאט, בלי לגעת ברצפה.`]];
M.hangingLegRaise=s=>[
  [`Hang from the bar with an active grip, no swinging.`,
   `Повисните на турнике, тело без раскачки.`,
   `התלו על המוט ללא נדנוד.`],
  [`Raise the legs to horizontal (or toes to bar) via the abs.`,
   `Поднимайте ноги до горизонтали (или носки к перекладине) силой пресса.`,
   `הרימו רגליים לאופקי (או עליות בהמות) בכוח הבטן.`],
  [`Lower slowly with control, avoiding sway.`,
   `Опускайте медленно и контролируемо, без раскачки.`,
   `הורידו לאט ובשליטה, ללא נדנוד.`]];
M.twist=s=>[
  [`Sit with knees bent, holding the weight at your chest.`,
   `Сядьте, колени согнуты, держите вес у груди.`,
   `שבו עם ברכיים כפופות, החזיקו משקל ליד החזה.`],
  [`Rotate the torso side to side, moving from the ribcage.`,
   `Поворачивайте корпус в стороны, работая грудной клеткой.`,
   `סובבו את הגוף צידה צידה, התנועה מכלות הצלעות.`],
  [`Keep the chest lifted throughout.`,
   `Держите грудь раскрытой всё время.`,
   `שמרו על חזה פתוח.`]];
M.backExt=s=>[
  [`Anchor your legs and cross your arms over the chest.`,
   `Зафиксируйте ноги, скрестите руки на груди.`,
   `קבעו את הרגליים ושלבו ידיים על החזה.`],
  [`Hinge down at the hips with a flat back.`,
   `Опускайтесь от таза со спиной прямой.`,
   `הטו מהאגן עם גב ישר.`],
  [`Rise to a straight line, squeezing the spinal erectors.`,
   `Поднимитесь до одной линии, напрягая разгибатели спины.`,
   `עלו לקו ישר תוך כיווץ שרידי הגב.`]];
M.pullover=s=>[
  [`Hold ${imp(s,'en')} over your chest with soft elbows.`,
   `Держите ${imp(s,'ru')} над грудью, локти слегка согнуты.`,
   `החזיקו את ${imp(s,'he')} מעל החזה, מרפקים רכים.`],
  [`Arc the arms back over your head to a deep lat stretch.`,
   `Уводите руки за голову по дуге до растяжения широчайших.`,
   `עברו בקשת מאחורי הראש עד מתיחה בשרידי הגב.`],
  [`Pull back over the chest with the lats, not the arms.`,
   `Возвращайте широчайшими, а не руками.`,
   `חזרו בכוח הגב, לא הידיים.`]];
M.facePull=s=>[
  [`Set the cable just above head height and take a neutral grip.`,
   `Установите блок чуть выше головы, хват нейтральный.`,
   `כווננו את הכבל מעט מעל הראש ואחזו באחיזה ניטרלית.`],
  [`Pull toward your face, splitting the elbows outward.`,
   `Тяните к лицу, разводя локти в стороны.`,
   `משכו אל הפנים, מפצלים מרפקים הצידה.`],
  [`Reverse slowly to a full arm extension.`,
   `Медленно вернитесь до полного выпрямления рук.`,
   `חזרו לאט עד יישור מלא של הידיים.`]];
M.cardio=()=>[
  [`Keep the core braced and the movement rhythmical.`,
   `Держите пресс в тонусе, движения ритмичны.`,
   `שמרו על בטן מכווצת ותנועה קצבית.`],
  [`Alternate sides at a controlled pace.`,
   `Чередуйте стороны в контролируемом темпе.`,
   `החליפו צדדים בקצב מבוקר.`],
  [`Breathe steadily, avoid holding your breath.`,
   `Дышите ровно, не задерживая дыхание.`,
   `נשמו באופן רציף, אל תעצרו את הנשימה.`]];
M.stretch=()=>[
  [`Assume the starting stretch position gently.`,
   `Аккуратно примите исходное положение растяжки.`,
   `היכנסו בעדינות למצב המתיחה ההתחלתי.`],
  [`Ease into a moderate pull and hold for 20–30 seconds.`,
   `Доведите до умеренного натяжения и держите 20–30 секунд.`,
   `הגיעו למתיחה בינונית והחזיקו 20–30 שניות.`],
  [`Breathe deeply and relax into the stretch; repeat on the other side if needed.`,
   `Дышите глубоко, расслабьтесь; при необходимости повторите на другую сторону.`,
   `נשמו עמוק והרפו; חזרו על הצד השני במידת הצורך.`]];
M.warmup=()=>[
  [`Perform slow controlled circles/movements through the comfortable range.`,
   `Выполняйте медленные контролируемые круговые движения в комфортной амплитуде.`,
   `בצעו תנועות עיגול איטיות ומבוקרות בטווח נוח.`],
  [`Gradually increase the range of motion.`,
   `Постепенно увеличивайте амплитуду.`,
   `הגדילו בהדרגה את טווח התנועה.`],
  [`Repeat for the prescribed time/reps per side.`,
   `Повторяйте указанное время/повторы на каждую сторону.`,
   `חזרו על פי הזמן/חזרות שנקבעו לכל צד.`]];
M.generic=s=>[
  [`Get into the starting position described by your coach.`,
   `Займите исходное положение, как показал тренер.`,
   `היכנסו למצב ההתחלה כפי שהדגים המאמן.`],
  [`Execute the movement smoothly and symmetrically.`,
   `Выполняйте движение плавно и симметрично.`,
   `בצעו את התנועה בחלקות ובסימטריה.`],
  [`Stay controlled both ways and keep breathing.`,
   `Работайте подконтрольно в обе стороны, дышите ровно.`,
   `שלטו בתנועה בשני הכיוונים והמשיכו לנשום.`]];

// ---------- 5. pose mapping ----------
function poseFor(pat,s,ex){
  const nl=((ex.nE||'')+' '+(ex.nR||'')).toLowerCase();
  const P=(k)=>k;
  switch(pat){
    case 'benchFlatIncline': case 'incline': return s.pos==='incline'?'benchFlatIncline':P('benchFlat');
    case 'chestPress':
      if(s.pos==='standing'&&/^cable/.test(s.impl))return 'cableCross';
      if(s.pos==='seated'||s.impl==='machine'||s.impl==='smith')return 'seatedOverhead';
      if(s.pos==='floor')return 'floorPress';
      if(s.pos==='incline')return 'benchFlatIncline';
      if(s.pos==='decline')return 'benchFlatDecline';
      return 'benchFlat';
    case 'chestFly':
      if(s.pos==='standing'||/^cable/.test(s.impl)&&s.pos!=='bench_flat'&&s.pos!=='incline'&&s.pos!=='decline')return 'cableCross';
      if(s.pos==='incline')return 'benchFlatIncline';
      if(s.pos==='decline')return 'benchFlatDecline';
      return 'benchFlat';
    case 'shoulderPress': return s.pos==='standing'?'overheadPress':'seatedOverhead';
    case 'tricepsExt':
      if(/overhead|из-за голов|над головой|overhead extension/i.test(nl))return 'overheadPress';
      if(/kickback|разгибание наклон|наклон.*разгиб/i.test(nl))return 'kickback';
      return 'pushdown';
    case 'row': return /seated|сидя|machine|тренаж/.test(nl)&&!/bent|наклон/.test(nl)?'seatedRow':'bentRow';
    case 'pullover': return s.pos==='standing'?'cableCross':'benchFlat';
    default:
      return {warmup:'stretch',stretch:'stretch',cardio:'pushup',pullup:'pullup',
        hangingLegRaise:'hangingLegRaise',legRaise:'crunch',pushup:'pushup',plank:'plank',
        dip:'dip',legPress:'legPress',legExtension:'legExtension',legCurl:'legCurl',
        calfRaise:'calfRaise',hipThrust:'hipThrust',hipAbdAdd:'hipAbd',gluteKickback:'kickback',
        deadlift:'deadlift',squat:'squat',lunge:'lunge',stepUp:'lunge',twist:'twist',
        crunch:'crunch',backExt:'backExt',facePull:'facePull',latPulldown:'latPulldown',
        uprightRow:'uprightRow',shrug:'shrug',latRaise:'latRaise',frontRaise:'frontRaise',
        bicepCurl:/concentration|preacher|сидя|seated/.test(nl)?'seated':'curl',
        wristCurl:'curl'}[pat]||(s.pos==='standing'?'stand':'seated');
  }
}

// ---------- 6. main ----------
let done=0;
for(const ex of pg){
  const spec=parseSpec(ex);
  const pat=detectPattern(ex);
  // корректировка позиции под паттерн
  let pos=spec.pos;
  const nl=((ex.nE||'')+' '+(ex.nR||'')).toLowerCase();
  const has=(...ws)=>ws.some(w=>nl.includes(w));
  if(['dip','pushup','plank','cardio'].includes(pat)) pos='plank_pos';
  else if(['pullup','hangingLegRaise'].includes(pat)) pos='hanging';
  else if(pat==='row'&&pos==='incline') pos='prone';
  else if((pat==='legCurl'||pat==='backExt')&&pos==='bench_flat') pos='prone';
  else if(['crunch','twist','legRaise'].includes(pat)&&pos==='bench_flat') pos='floor';
  else if(pat==='wristCurl'&&/standing|стоя/.test(nl)) pos='standing';
  else if(pat==='wristCurl'&&pos==='bench_flat') pos='kneeling';
  else if(/standing|стоя/.test(nl)&&(pat==='hipAbdAdd'||/abduction/i.test(nl))) pos='standing';
  else if(/sitting|standing|сидя|стоя/.test(nl)&&pos==='bench_flat'&&!has('lie','lying','леж')) {
    pos=has('sit','сидя')?'seated':'standing';
  }
  spec.pos=pos||spec.pos;
  const steps=M[pat]?M[pat](spec,ex):M.generic(spec);
  const opener=[OPEN.en[spec.pos]||OPEN.en.standing, OPEN.ru[spec.pos]||OPEN.ru.standing, OPEN.he[spec.pos]||OPEN.he.standing];
  ex.t=[opener[0]].concat(steps.map(x=>x[0])).join(' | ');
  ex.tRu=[opener[1]].concat(steps.map(x=>x[1])).join(' | ');
  ex.tHe=[opener[2]].concat(steps.map(x=>x[2])).join(' | ');
  ex.pg={pose:poseFor(pat,spec,ex),pat,cable:spec.cable||''};
  done++;
}
fs.writeFileSync(DB,JSON.stringify(db));
console.log('updated',done,'PG records');

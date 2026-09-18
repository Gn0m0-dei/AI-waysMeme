// The catalogue is the product: the renderer only paints pixels, this table is
// what lets a model answer a technical question with the right meme. Every
// aspect ratio below was measured against api.memegen.link, never guessed —
// memegen answers a 404 with a 600x600 placeholder, so a made-up id silently
// produces a square image that renders distorted.

export enum MemeTemplate {
  AncientAliens = 'aag',
  ItsATrap = 'ackbar',
  HonestWork = 'bihw',
  WhyNotBoth = 'both',
  XEverywhere = 'buzz',
  Cheems = 'cheems',
  ChangeMyMind = 'cmm',
  DisasterGirl = 'disastergirl',
  Doge = 'doge',
  Drake = 'drake',
  DailyStruggle = 'ds',
  Facepalm = 'facepalm',
  ThisIsFine = 'fine',
  NotSureIf = 'fry',
  GrusPlan = 'gru',
  InigoMontoya = 'inigo',
  KhabyLame = 'khaby-lame',
  Midwit = 'midwit',
  OneDoesNotSimply = 'mordor',
  Morpheus = 'morpheus',
  NoIdea = 'noidea',
  PanikKalmPanik = 'panik-kalm-panik',
  Patrick = 'patrick',
  Philosoraptor = 'philosoraptor',
  IsThisAPigeon = 'pigeon',
  RollSafe = 'rollsafe',
  SamePicture = 'same',
  SpidermanPointing = 'spiderman',
  MockingSpongebob = 'spongebob',
  Stonks = 'stonks',
  SuccessKid = 'success',
  WeDontDoThatHere = 'wddth',
  YoDawg = 'yodawg',
}

export interface MemeTemplateSpec {
  readonly id: MemeTemplate;
  readonly name: string;
  // Width divided by height of the source image, measured from its PNG header.
  readonly aspect: number;
  // One entry per caption slot, in order, describing what belongs in it.
  readonly captions: readonly string[];
  readonly meaning: string;
}

export const MEME_TEMPLATES: Readonly<Record<MemeTemplate, MemeTemplateSpec>> =
  Object.freeze({
    [MemeTemplate.AncientAliens]: {
      id: MemeTemplate.AncientAliens,
      name: 'Ancient Aliens Guy',
      aspect: 1.1917,
      captions: ['the hedge', 'the conclusion stated anyway'],
      meaning: 'Blaming an absurd but suspiciously fitting cause.',
    },
    [MemeTemplate.ItsATrap]: {
      id: MemeTemplate.ItsATrap,
      name: "It's A Trap!",
      aspect: 0.7722,
      captions: ['the tempting shortcut', "it's a trap"],
      meaning: 'An approach that looks fine and bites back later.',
    },
    [MemeTemplate.HonestWork]: {
      id: MemeTemplate.HonestWork,
      name: "But It's Honest Work",
      aspect: 1.5,
      captions: ['the crude solution', "but it's honest work"],
      meaning: 'Ugly, unglamorous code that does the job.',
    },
    [MemeTemplate.WhyNotBoth]: {
      id: MemeTemplate.WhyNotBoth,
      name: 'Why Not Both?',
      aspect: 1,
      captions: ['the false dilemma', 'why not both'],
      meaning: 'Two options presented as exclusive that are not.',
    },
    [MemeTemplate.XEverywhere]: {
      id: MemeTemplate.XEverywhere,
      name: 'X, X Everywhere',
      aspect: 1.315,
      captions: ['the thing', 'the thing everywhere'],
      meaning: 'Something that turns up in every corner of the codebase.',
    },
    [MemeTemplate.Cheems]: {
      id: MemeTemplate.Cheems,
      name: 'Cheems',
      aspect: 1.05,
      captions: ['the whine', 'the task being avoided'],
      meaning: 'Complaining about work that is genuinely small.',
    },
    [MemeTemplate.ChangeMyMind]: {
      id: MemeTemplate.ChangeMyMind,
      name: 'Change My Mind',
      aspect: 1.2567,
      captions: ['the hot take'],
      meaning: 'A blunt opinion stated without hedging.',
    },
    [MemeTemplate.DisasterGirl]: {
      id: MemeTemplate.DisasterGirl,
      name: 'Disaster Girl',
      aspect: 1.3333,
      captions: ['what burned down', 'the calm reaction'],
      meaning: 'Causing the incident and staying perfectly composed.',
    },
    [MemeTemplate.Doge]: {
      id: MemeTemplate.Doge,
      name: 'Doge',
      aspect: 1,
      captions: ['such thing', 'very quality'],
      meaning: 'Mock awe at something mundane.',
    },
    [MemeTemplate.Drake]: {
      id: MemeTemplate.Drake,
      name: 'Drakeposting',
      aspect: 0.639,
      captions: ['the rejected option', 'the preferred option'],
      meaning: 'Rejecting A in favour of B. The default comparison meme.',
    },
    [MemeTemplate.DailyStruggle]: {
      id: MemeTemplate.DailyStruggle,
      name: 'Daily Struggle',
      aspect: 0.6696,
      captions: ['first button', 'second button', 'who has to choose'],
      meaning: 'Agonising over two equally tempting bad choices.',
    },
    [MemeTemplate.Facepalm]: {
      id: MemeTemplate.Facepalm,
      name: 'Facepalm',
      aspect: 1.1317,
      captions: ['the situation', 'the obvious thing that was missed'],
      meaning: 'A mistake that was in plain sight the whole time.',
    },
    [MemeTemplate.ThisIsFine]: {
      id: MemeTemplate.ThisIsFine,
      name: 'This is Fine',
      aspect: 1.0283,
      captions: ['what is on fire', 'this is fine'],
      meaning: 'Everything is broken and shipping continues anyway.',
    },
    [MemeTemplate.NotSureIf]: {
      id: MemeTemplate.NotSureIf,
      name: 'Futurama Fry',
      aspect: 1.3333,
      captions: ['not sure if X', 'or Y'],
      meaning: 'Genuine ambiguity between two readings.',
    },
    [MemeTemplate.GrusPlan]: {
      id: MemeTemplate.GrusPlan,
      name: "Gru's Plan",
      aspect: 1.56,
      captions: [
        'step one',
        'step two',
        'the consequence',
        'the consequence again',
      ],
      meaning: 'A plan whose final step invalidates the whole plan.',
    },
    [MemeTemplate.InigoMontoya]: {
      id: MemeTemplate.InigoMontoya,
      name: 'Inigo Montoya',
      aspect: 1.8367,
      captions: ['you keep using that word', 'what it actually means'],
      meaning: 'A term being used wrongly.',
    },
    [MemeTemplate.KhabyLame]: {
      id: MemeTemplate.KhabyLame,
      name: 'Khaby Lame Shrug',
      aspect: 1.0017,
      captions: ['the elaborate approach', 'the one-liner'],
      meaning: 'Something overcomplicated that had a trivial answer.',
    },
    [MemeTemplate.Midwit]: {
      id: MemeTemplate.Midwit,
      name: 'Midwit',
      aspect: 1.285,
      captions: [
        'the naive answer',
        'the overengineered answer',
        'the same naive answer',
      ],
      meaning: 'The beginner and the expert agree; the middle overbuilds.',
    },
    [MemeTemplate.OneDoesNotSimply]: {
      id: MemeTemplate.OneDoesNotSimply,
      name: 'One Does Not Simply',
      aspect: 1.695,
      captions: ['one does not simply', 'the underestimated task'],
      meaning: 'A task that sounds trivial and is not.',
    },
    [MemeTemplate.Morpheus]: {
      id: MemeTemplate.Morpheus,
      name: 'Matrix Morpheus',
      aspect: 1.65,
      captions: ['what if I told you', 'the uncomfortable truth'],
      meaning: 'Revealing something the listener already half suspected.',
    },
    [MemeTemplate.NoIdea]: {
      id: MemeTemplate.NoIdea,
      name: "I Have No Idea What I'm Doing",
      aspect: 1.5683,
      captions: ['the confident action', 'no idea what I am doing'],
      meaning: 'Operating well outside one own competence.',
    },
    [MemeTemplate.PanikKalmPanik]: {
      id: MemeTemplate.PanikKalmPanik,
      name: 'Panik Kalm Panik',
      aspect: 0.7151,
      captions: ['the scare', 'the relief', 'the worse scare'],
      meaning: 'Debugging: it looked bad, it looked fine, it was worse.',
    },
    [MemeTemplate.Patrick]: {
      id: MemeTemplate.Patrick,
      name: 'Push it somewhere else Patrick',
      aspect: 0.5682,
      captions: ['the problem', 'the terrible fix'],
      meaning: 'Moving a problem instead of solving it.',
    },
    [MemeTemplate.Philosoraptor]: {
      id: MemeTemplate.Philosoraptor,
      name: 'Philosoraptor',
      aspect: 1,
      captions: ['the premise', 'the unsettling question'],
      meaning: 'A question that undermines the premise it came from.',
    },
    [MemeTemplate.IsThisAPigeon]: {
      id: MemeTemplate.IsThisAPigeon,
      name: 'Is This a Pigeon?',
      aspect: 1.665,
      captions: ['who is asking', 'what they point at', 'is this a pigeon'],
      meaning: 'Confidently mislabelling something.',
    },
    [MemeTemplate.RollSafe]: {
      id: MemeTemplate.RollSafe,
      name: 'Roll Safe',
      aspect: 1.7867,
      captions: ['you cannot have the problem', 'if you do this instead'],
      meaning: 'Fake-clever reasoning that technically holds.',
    },
    [MemeTemplate.SamePicture]: {
      id: MemeTemplate.SamePicture,
      name: "They're The Same Picture",
      aspect: 0.8929,
      captions: ['first thing', 'second thing', 'they are the same picture'],
      meaning: 'Two things presented as different that are identical.',
    },
    [MemeTemplate.SpidermanPointing]: {
      id: MemeTemplate.SpidermanPointing,
      name: 'Spider-Man Pointing at Spider-Man',
      aspect: 1.3967,
      captions: ['one copy', 'the other copy'],
      meaning: 'Duplicated code or mutual blame between equals.',
    },
    [MemeTemplate.MockingSpongebob]: {
      id: MemeTemplate.MockingSpongebob,
      name: 'Mocking Spongebob',
      aspect: 1.4217,
      captions: ['the claim', 'the claim mocked back'],
      meaning: 'Repeating a bad take to expose it.',
    },
    [MemeTemplate.Stonks]: {
      id: MemeTemplate.Stonks,
      name: 'Stonks',
      aspect: 1.4233,
      captions: ['the dubious move', 'stonks'],
      meaning: 'A gain obtained by clearly unsound means.',
    },
    [MemeTemplate.SuccessKid]: {
      id: MemeTemplate.SuccessKid,
      name: 'Success Kid',
      aspect: 1.0367,
      captions: ['what was attempted', 'it worked first try'],
      meaning: 'A small unlikely victory.',
    },
    [MemeTemplate.WeDontDoThatHere]: {
      id: MemeTemplate.WeDontDoThatHere,
      name: "We Don't Do That Here",
      aspect: 1.1783,
      captions: ['the practice', 'we do not do that here'],
      meaning: 'Rejecting a practice on convention alone.',
    },
    [MemeTemplate.YoDawg]: {
      id: MemeTemplate.YoDawg,
      name: 'Xzibit Yo Dawg',
      aspect: 1.5,
      captions: ['yo dawg I heard you like X', 'so we put X in your X'],
      meaning: 'Something nested inside itself.',
    },
  });

const TEMPLATE_IDS: readonly string[] = Object.keys(MEME_TEMPLATES);

export const isMemeTemplate = (value: string): value is MemeTemplate =>
  TEMPLATE_IDS.includes(value);

export const listTemplates = (): readonly MemeTemplateSpec[] =>
  Object.values(MEME_TEMPLATES);

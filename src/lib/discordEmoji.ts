export const discordEmoji = [
  { name: "zed", id: "1208625071766114364", isGif: false },
  { name: "wow", id: "952755842095132752", isGif: false },
  { name: "wiwwy", id: "953882510167773184", isGif: false },
  { name: "whar", id: "1143938761919570000", isGif: false },
  { name: "upvote", id: "1010035340851023892", isGif: false },
  { name: "trol", id: "1010322254065848361", isGif: false },
  { name: "this", id: "1068710522561773719", isGif: false },
  { name: "thehorror", id: "1158484835090833508", isGif: false },
  { name: "tehduck", id: "1055226916409458808", isGif: false },
  { name: "sus", id: "1199167654972375090", isGif: false },
  { name: "stretchcat", id: "1210253516417798194", isGif: false },
  { name: "soon", id: "932400780072349726", isGif: false },
  { name: "shakespeare", id: "982709311702716457", isGif: false },
  { name: "sadmeow", id: "954781179704393769", isGif: false },
  { name: "robotop", id: "1148967341409976411", isGif: false },
  { name: "rehehehehehehe", id: "1123971249442406521", isGif: false },
  { name: "ratestar", id: "957320841538982018", isGif: false },
  { name: "quacker", id: "959421966148857906", isGif: false },
  { name: "planktonpog", id: "995896283833323520", isGif: false },
  { name: "pixelmeowy", id: "1125502216090951840", isGif: false },
  { name: "mikeisgettingsickofyou", id: "1143348848085962855", isGif: false },
  { name: "meowytroll", id: "1111415513462079628", isGif: false },
  { name: "meowybutton", id: "950192902708019200", isGif: false },
  { name: "meowyspin", id: "1008194132067483678", isGif: true },
  { name: "meowyplanets", id: "1008194354197831800", isGif: true },
  { name: "meowyplanet", id: "1008194232282009640", isGif: true },
  { name: "meowspin", id: "1017901487810170940", isGif: false },
  { name: "mainispain", id: "939326396977795113", isGif: false },
  { name: "madmeow", id: "954780476067946638", isGif: false },
  { name: "happymeow", id: "954779471330816040", isGif: false },
  { name: "halfstar", id: "957320841241169991", isGif: false },
  { name: "gun", id: "1015228426778578966", isGif: false },
  { name: "fortune", id: "1210379302328078356", isGif: false },
  { name: "flipper", id: "1011498926819520572", isGif: false },
  { name: "finalboss", id: "954783074586095636", isGif: false },
  { name: "duckyspeen", id: "995024774348668968", isGif: true },
  { name: "ducky", id: "1001974772051234950", isGif: false },
  { name: "duckspinningcube", id: "1152410546893770783", isGif: true },
  { name: "drunkmeow", id: "1026159952038985829", isGif: false },
  { name: "drinkmilk", id: "1151681105615929435", isGif: false },
  { name: "downvote", id: "1010035793819091068", isGif: false },
  { name: "darkstar", id: "957320841044045905", isGif: false },
  { name: "chainbrokerestartingnow", id: "1149502765542953021", isGif: false },
  { name: "caughtin4k", id: "1102387987838402574", isGif: true },
  { name: "catlick", id: "1180505322851414206", isGif: false },
  { name: "bred", id: "959422100458844160", isGif: false },
  { name: "blank", id: "1018231234553446411", isGif: false },
  { name: "aaaaaaaaaaa", id: "1149352246572761120", isGif: false },
  { name: "acatonmeower", id: "1021912187163394138", isGif: false },
  { name: "atticusaijkndemw", id: "1212216821625917450", isGif: false },
  { name: "meowy2", id: "1214405335666925568", isGif: false },
  { name: "wooftheheck", id: "1217544930847625427", isGif: false },
  { name: "POWER", id: "1215322815105077279", isGif: false },
  { name: "fubgingcloudlink", id: "1224195287178936392", isGif: false },
  { name: "consume", id: "1224195139082125322", isGif: false },
  { name: "meowyhadsomepepsi", id: "1224195086951383113", isGif: false },
  { name: "yuhhuh", id: "1227268820213698611", isGif: false },
  { name: "nuhhuh", id: "1233290735999258664", isGif: false },
  { name: "freya", id: "1244778372953935922", isGif: false },
].sort((a, b) => (a.name > b.name ? 1 : a.name < b.name ? -1 : 0));

export const urlFromDiscordEmoji = (emoji: DiscordEmoji) => {
  return `https://cdn.discordapp.com/emojis/${encodeURIComponent(emoji.id)}.${emoji.isGif ? "gif" : "webp"}?size=24&quality=lossless`;
};
export const syntaxForDiscordEmoji = (emoji: DiscordEmoji) => {
  return `<${emoji.isGif ? "a" : ""}:${emoji.name}:${emoji.id}>`;
};

export type DiscordEmoji = (typeof discordEmoji)[number];

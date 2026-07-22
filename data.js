const WRESTLERS = [
  {
    "id": "jack-mercer",
    "name": "\"Iceman\" Jack Mercer",
    "title": "The Southern Rebel",
    "faction": "Renegades",
    "signature": "Ice Breaker",
    "overall": 98,
    "rarity": "Legendary",
    "tag": 91,
    "power": 94,
    "speed": 84,
    "technique": 91,
    "charisma": 99,
    "versatility": 91,
    "loyalty": 96,
    "resilience": 99,
    "image": "assets/jack-mercer.webp",
    "finisher": "Ice Breaker"
  },
  {
    "id": "victor-royale",
    "name": "Victor Royale",
    "title": "The Kingmaker",
    "faction": "Royal Dynasty",
    "signature": "Royal Decree",
    "overall": 98,
    "rarity": "Legendary",
    "tag": 95,
    "power": 92,
    "speed": 78,
    "technique": 95,
    "charisma": 97,
    "versatility": 94,
    "loyalty": 78,
    "resilience": 95,
    "image": "assets/victor-royale.webp",
    "finisher": "Royal Decree"
  },
  {
    "id": "jett-valentine",
    "name": "Jett Valentine",
    "title": "Heartbreaker",
    "faction": "Superstars",
    "signature": "Heart Stopper",
    "overall": 97,
    "rarity": "Legendary",
    "tag": 96,
    "power": 79,
    "speed": 96,
    "technique": 95,
    "charisma": 100,
    "versatility": 98,
    "loyalty": 84,
    "resilience": 94,
    "image": "assets/jett-valentine.webp",
    "finisher": "Heart Stopper"
  },
  {
    "id": "revenant",
    "name": "The Revenant",
    "title": "The Eternal",
    "faction": "Dark Dominion",
    "signature": "Blackout Piledriver",
    "overall": 99,
    "rarity": "Mythic",
    "tag": 94,
    "power": 99,
    "speed": 76,
    "technique": 91,
    "charisma": 99,
    "versatility": 82,
    "loyalty": 98,
    "resilience": 100,
    "image": "assets/revenant.webp",
    "finisher": "Blackout Piledriver"
  },
  {
    "id": "nightwatch",
    "name": "Nightwatch",
    "title": "The Dark Sentinel",
    "faction": "Dark Dominion",
    "signature": "Midnight Mass",
    "overall": 98,
    "rarity": "Legendary",
    "tag": 96,
    "power": 90,
    "speed": 87,
    "technique": 93,
    "charisma": 97,
    "versatility": 95,
    "loyalty": 99,
    "resilience": 97,
    "image": "assets/nightwatch.webp",
    "finisher": "Midnight Mass"
  },
  {
    "id": "titan",
    "name": "\"Hollywood\" Titan",
    "title": "The Blockbuster",
    "faction": "Titans",
    "signature": "Ground Zero",
    "overall": 98,
    "rarity": "Legendary",
    "tag": 91,
    "power": 96,
    "speed": 84,
    "technique": 88,
    "charisma": 100,
    "versatility": 92,
    "loyalty": 90,
    "resilience": 97,
    "image": "assets/titan.webp",
    "finisher": "Ground Zero"
  },
  {
    "id": "mason-marks",
    "name": "Mason Marks",
    "title": "The Canadian Icon",
    "faction": "Excellence",
    "signature": "Precision Lock",
    "overall": 98,
    "rarity": "Legendary",
    "tag": 97,
    "power": 81,
    "speed": 88,
    "technique": 100,
    "charisma": 91,
    "versatility": 100,
    "loyalty": 97,
    "resilience": 96,
    "image": "assets/mason-marks.webp",
    "finisher": "Precision Lock"
  },
  {
    "id": "hollowman",
    "name": "Hollowman",
    "title": "The Urban Legend",
    "faction": "Dark Dominion",
    "signature": "Last Breath",
    "overall": 98,
    "rarity": "Mythic",
    "tag": 88,
    "power": 100,
    "speed": 68,
    "technique": 77,
    "charisma": 94,
    "versatility": 69,
    "loyalty": 95,
    "resilience": 100,
    "image": "assets/hollowman.webp",
    "finisher": "Last Breath"
  },
  {
    "id": "damian-black",
    "name": "Damian Black",
    "title": "The Silent Assassin",
    "faction": "Royal Dynasty",
    "signature": "Kill Shot",
    "overall": 98,
    "rarity": "Legendary",
    "tag": 91,
    "power": 89,
    "speed": 89,
    "technique": 96,
    "charisma": 94,
    "versatility": 96,
    "loyalty": 84,
    "resilience": 96,
    "image": "assets/damian-black.webp",
    "finisher": "Kill Shot"
  },
  {
    "id": "elias-crowe",
    "name": "Elias Crowe",
    "title": "The Lunatic",
    "faction": "Renegades",
    "signature": "Asylum Drop",
    "overall": 97,
    "rarity": "Legendary",
    "tag": 92,
    "power": 88,
    "speed": 72,
    "technique": 84,
    "charisma": 95,
    "versatility": 91,
    "loyalty": 94,
    "resilience": 100,
    "image": "assets/elias-crowe.webp",
    "finisher": "Asylum Drop"
  },
  {
    "id": "el-rey-del-cielo",
    "name": "El Rey del Cielo",
    "title": "The Sky King",
    "faction": "Skyborne",
    "signature": "Zero Gravity",
    "overall": 97,
    "rarity": "Legendary",
    "tag": 96,
    "power": 70,
    "speed": 100,
    "technique": 97,
    "charisma": 96,
    "versatility": 99,
    "loyalty": 96,
    "resilience": 92,
    "image": "assets/el-rey-del-cielo.webp",
    "finisher": "Zero Gravity"
  },
  {
    "id": "max-justice",
    "name": "Max Justice",
    "title": "The Hero",
    "faction": "Guardians",
    "signature": "Hero's End",
    "overall": 98,
    "rarity": "Legendary",
    "tag": 94,
    "power": 97,
    "speed": 82,
    "technique": 88,
    "charisma": 99,
    "versatility": 93,
    "loyalty": 100,
    "resilience": 99,
    "image": "assets/max-justice.webp",
    "finisher": "Hero's End"
  },
  {
    "id": "primal",
    "name": "Primal",
    "title": "The Apex Predator",
    "faction": "Titans",
    "signature": "Primal Rage",
    "overall": 98,
    "rarity": "Legendary",
    "tag": 86,
    "power": 100,
    "speed": 78,
    "technique": 84,
    "charisma": 93,
    "versatility": 79,
    "loyalty": 94,
    "resilience": 98,
    "image": "assets/primal.webp",
    "finisher": "Primal Rage"
  },
  {
    "id": "lucas-bennett",
    "name": "Lucas Bennett",
    "title": "The Olympian",
    "faction": "Excellence",
    "signature": "Gold Standard",
    "overall": 98,
    "rarity": "Legendary",
    "tag": 97,
    "power": 91,
    "speed": 90,
    "technique": 100,
    "charisma": 89,
    "versatility": 99,
    "loyalty": 95,
    "resilience": 98,
    "image": "assets/lucas-bennett.webp",
    "finisher": "Gold Standard"
  },
  {
    "id": "marcus-king",
    "name": "Marcus King",
    "title": "The Street King",
    "faction": "Renegades",
    "signature": "Street Justice",
    "overall": 97,
    "rarity": "Legendary",
    "tag": 94,
    "power": 88,
    "speed": 92,
    "technique": 91,
    "charisma": 96,
    "versatility": 97,
    "loyalty": 97,
    "resilience": 95,
    "image": "assets/marcus-king.webp",
    "finisher": "Street Justice"
  },
  {
    "id": "mateo-vega",
    "name": "Mateo Vega",
    "title": "The Con Artist",
    "faction": "Skyborne",
    "signature": "Sky Heist",
    "overall": 97,
    "rarity": "Legendary",
    "tag": 95,
    "power": 78,
    "speed": 96,
    "technique": 96,
    "charisma": 98,
    "versatility": 100,
    "loyalty": 83,
    "resilience": 94,
    "image": "assets/mateo-vega.webp",
    "finisher": "Sky Heist"
  },
  {
    "id": "ryder-phoenix",
    "name": "Ryder Phoenix",
    "title": "The Rockstar",
    "faction": "Royal Dynasty",
    "signature": "Mic Drop",
    "overall": 97,
    "rarity": "Legendary",
    "tag": 93,
    "power": 84,
    "speed": 91,
    "technique": 96,
    "charisma": 100,
    "versatility": 99,
    "loyalty": 76,
    "resilience": 95,
    "image": "assets/ryder-phoenix.webp",
    "finisher": "Mic Drop"
  },
  {
    "id": "sterling-sinclair",
    "name": "Sterling Sinclair",
    "title": "The Playboy",
    "faction": "Royal Dynasty",
    "signature": "Golden Touch",
    "overall": 97,
    "rarity": "Legendary",
    "tag": 95,
    "power": 82,
    "speed": 86,
    "technique": 98,
    "charisma": 100,
    "versatility": 97,
    "loyalty": 80,
    "resilience": 96,
    "image": "assets/sterling-sinclair.webp",
    "finisher": "Golden Touch"
  },
  {
    "id":"ace-riot","name":"Ace Riot","title":"The Voice of Rebellion","faction":"Independent","signature":"Riot Trigger","overall":96,"rarity":"Legendary","tag":88,"power":82,"speed":90,"technique":98,"charisma":99,"versatility":97,"loyalty":78,"resilience":95,"image":"assets/wrestlers/ace-riot/full.webp","finisher":"Riot Trigger"
  },
  {
    "id":"everest","name":"Everest","title":"The Immovable Mountain","faction":"Independent","signature":"Summit Slam","overall":98,"rarity":"Mythic","tag":83,"power":100,"speed":58,"technique":80,"charisma":94,"versatility":72,"loyalty":96,"resilience":100,"image":"assets/wrestlers/everest/full.webp","finisher":"Summit Slam"
  },
  {
    "id":"axel-voss","name":"Axel Voss","title":"The Human Wrecking Ball","faction":"Independent","signature":"Impact Zero","overall":98,"rarity":"Legendary","tag":82,"power":100,"speed":91,"technique":94,"charisma":88,"versatility":92,"loyalty":70,"resilience":99,"image":"assets/wrestlers/axel-voss/full.webp","finisher":"Impact Zero"
  },
  {
    "id":"slater-nova","name":"Slater Nova","title":"The Freefall Artist","faction":"Independent","signature":"Nova Fall","overall":96,"rarity":"Legendary","tag":92,"power":68,"speed":99,"technique":88,"charisma":97,"versatility":99,"loyalty":91,"resilience":91,"image":"assets/wrestlers/slater-nova/full.webp","finisher":"Nova Fall"
  },
  {
    "id":"savannah-sinclair","name":"Savannah Sinclair","title":"The Heiress","faction":"Independent","signature":"Crown Jewel","overall":97,"rarity":"Legendary","tag":91,"power":91,"speed":86,"technique":98,"charisma":100,"versatility":96,"loyalty":82,"resilience":96,"image":"assets/wrestlers/savannah-sinclair/full.webp","finisher":"Crown Jewel"
  },
  {
    "id":"bianca-balboa","name":"Bianca Balboa","title":"The People's Champion","faction":"Independent","signature":"Balboa Breaker","overall":96,"rarity":"Legendary","tag":94,"power":88,"speed":91,"technique":95,"charisma":99,"versatility":97,"loyalty":98,"resilience":99,"image":"assets/wrestlers/bianca-balboa/full.webp","finisher":"Balboa Breaker"
  },
  {
    "id":"zara-monroe","name":"Zara Monroe","title":"The Icon","faction":"Independent","signature":"Iconic Statement","overall":96,"rarity":"Legendary","tag":93,"power":78,"speed":96,"technique":99,"charisma":100,"versatility":99,"loyalty":84,"resilience":94,"image":"assets/wrestlers/zara-monroe/full.webp","finisher":"Iconic Statement"
  },
  {
    "id":"chloe-carter","name":"Chloe Carter","title":"The Heart","faction":"Independent","signature":"Heart and Soul","overall":95,"rarity":"Legendary","tag":98,"power":82,"speed":90,"technique":94,"charisma":99,"versatility":96,"loyalty":100,"resilience":98,"image":"assets/wrestlers/chloe-carter/full.webp","finisher":"Heart and Soul"
  },
  {
    "id":"rex-hunter","name":"Rex Hunter","title":"The Renegade","faction":"Independent","signature":"Hunter's Mark","overall":97,"rarity":"Legendary","tag":91,"power":91,"speed":88,"technique":94,"charisma":100,"versatility":97,"loyalty":80,"resilience":98,"image":"assets/wrestlers/rex-hunter/full.webp","finisher":"Hunter's Mark"
  },
  {
    "id":"magnus-fury","name":"Magnus Fury","title":"The Berserker","faction":"Independent","signature":"Berserker Bomb","overall":98,"rarity":"Legendary","tag":86,"power":99,"speed":91,"technique":84,"charisma":99,"versatility":91,"loyalty":89,"resilience":100,"image":"assets/wrestlers/magnus-fury/full.webp","finisher":"Berserker Bomb"
  },
  {
    "id":"travis-stone","name":"Travis Stone","title":"Big Rig","faction":"Independent","signature":"Dead Freight","overall":97,"rarity":"Legendary","tag":90,"power":100,"speed":72,"technique":90,"charisma":94,"versatility":88,"loyalty":85,"resilience":99,"image":"assets/wrestlers/travis-stone/full.webp","finisher":"Dead Freight"
  },
  {
    "id":"marco-montana","name":"Marco Montana","title":"The Don","faction":"Independent","signature":"Final Offer","overall":97,"rarity":"Legendary","tag":94,"power":89,"speed":91,"technique":96,"charisma":100,"versatility":97,"loyalty":76,"resilience":95,"image":"assets/wrestlers/marco-montana/full.webp","finisher":"Final Offer"
  }
  ,{
    "id": "dave-maddox",
    "name": "Dave Maddox",
    "title": "The Workhorse",
    "faction": "Guardians",
    "signature": "Maddox Cutter",
    "overall": 91,
    "rarity": "Legendary",
    "tag": 91,
    "power": 88,
    "speed": 82,
    "technique": 90,
    "charisma": 86,
    "versatility": 92,
    "loyalty": 95,
    "resilience": 97,
    "image": "assets/wrestlers/dave-maddox/full.webp",
    "finisher": "Maddox Cutter"
  },
  {
    "id": "logan-steele",
    "name": "Logan Steele",
    "title": "The Living Legend",
    "faction": "Guardians",
    "signature": "Icon Slam",
    "overall": 96,
    "rarity": "Legendary",
    "tag": 93,
    "power": 97,
    "speed": 78,
    "technique": 88,
    "charisma": 99,
    "versatility": 87,
    "loyalty": 98,
    "resilience": 98,
    "image": "assets/wrestlers/logan-steele/full.webp",
    "finisher": "Icon Slam"
  }
  ,{
    "id":"valkyrie-hale","name":"Valkyrie Hale","title":"The Nightmare","faction":"Independent","signature":"Midnight Driver","overall":97,"rarity":"Legendary","tag":88,"power":98,"speed":84,"technique":91,"charisma":96,"versatility":92,"loyalty":86,"resilience":99,"image":"assets/wrestlers/valkyrie-hale/full.webp","finisher":"Nightfall Bomb"
  },
  {
    "id":"sienna","name":"Sienna","title":"The Anti-Heroine","faction":"Independent","signature":"Black Veil","overall":96,"rarity":"Legendary","tag":91,"power":82,"speed":91,"technique":98,"charisma":97,"versatility":98,"loyalty":79,"resilience":95,"image":"assets/wrestlers/sienna/full.webp","finisher":"Graves End"
  },
  {
    "id":"kaori-mizuno","name":"Kaori Mizuno","title":"The Sky Dancer","faction":"Independent","signature":"Sky Cutter","overall":96,"rarity":"Legendary","tag":93,"power":70,"speed":100,"technique":97,"charisma":94,"versatility":100,"loyalty":92,"resilience":92,"image":"assets/wrestlers/kaori-mizuno/full.webp","finisher":"Celestial Eclipse"
  },
  {
    "id":"jasmine-monroe","name":"Jasmine Monroe","title":"The Standard","faction":"Independent","signature":"Victory Press","overall":97,"rarity":"Legendary","tag":95,"power":96,"speed":94,"technique":94,"charisma":99,"versatility":98,"loyalty":97,"resilience":98,"image":"assets/wrestlers/jasmine-monroe/full.webp","finisher":"Crown Breaker"
  }

];

const RELATIONSHIPS = [
  {
    "a": "revenant",
    "b": "nightwatch",
    "teamName": "Midnight Dominion",
    "chemistry": 100,
    "type": "legendary"
  },
  {
    "a": "revenant",
    "b": "hollowman",
    "teamName": "The Unholy Alliance",
    "chemistry": 98,
    "type": "legendary"
  },
  {
    "a": "nightwatch",
    "b": "hollowman",
    "teamName": "Night Terrors",
    "chemistry": 96,
    "type": "legendary"
  },
  {
    "a": "mason-marks",
    "b": "lucas-bennett",
    "teamName": "Standard of Excellence",
    "chemistry": 100,
    "type": "legendary"
  },
  {
    "a": "el-rey-del-cielo",
    "b": "mateo-vega",
    "teamName": "Kings of the Sky",
    "chemistry": 98,
    "type": "legendary"
  },
  {
    "a": "max-justice",
    "b": "logan-steele",
    "teamName": "Icons of Justice",
    "chemistry": 99,
    "type": "legendary"
  },
  {
    "a": "max-justice",
    "b": "dave-maddox",
    "teamName": "True Grit",
    "chemistry": 97,
    "type": "legendary"
  },
  {
    "a": "titan",
    "b": "primal",
    "teamName": "Blockbuster Beasts",
    "chemistry": 97,
    "type": "legendary"
  },
  {
    "a": "jack-mercer",
    "b": "marcus-king",
    "teamName": "Street Rebels",
    "chemistry": 96,
    "type": "legendary"
  },
  {
    "a": "jack-mercer",
    "b": "elias-crowe",
    "teamName": "Cold Chaos",
    "chemistry": 94,
    "type": "alliance"
  },
  {
    "a": "victor-royale",
    "b": "damian-black",
    "teamName": "Crown & Dagger",
    "chemistry": 98,
    "type": "legendary"
  },
  {
    "a": "victor-royale",
    "b": "sterling-sinclair",
    "teamName": "High Society",
    "chemistry": 96,
    "type": "legendary"
  },
  {
    "a": "ryder-phoenix",
    "b": "sterling-sinclair",
    "teamName": "Fame & Fortune",
    "chemistry": 95,
    "type": "legendary"
  },
  {
    "a": "jett-valentine",
    "b": "ryder-phoenix",
    "teamName": "Sold Out",
    "chemistry": 94,
    "type": "legendary"
  },
  {
    "a": "jack-mercer",
    "b": "victor-royale",
    "teamName": "Rebellion vs Royalty",
    "chemistry": 52,
    "type": "rivalry"
  },
  {
    "a": "max-justice",
    "b": "revenant",
    "teamName": "Light vs Darkness",
    "chemistry": 45,
    "type": "rivalry"
  },
  {
    "a": "mason-marks",
    "b": "sterling-sinclair",
    "teamName": "Craft vs Vanity",
    "chemistry": 58,
    "type": "rivalry"
  },
  {
    "a": "el-rey-del-cielo",
    "b": "hollowman",
    "teamName": "Sky vs Slaughter",
    "chemistry": 48,
    "type": "rivalry"
  },
  {
    "a": "titan",
    "b": "jett-valentine",
    "teamName": "Battle for the Spotlight",
    "chemistry": 61,
    "type": "rivalry"
  },
  {
    "a": "damian-black",
    "b": "marcus-king",
    "teamName": "Cold Blooded Rivals",
    "chemistry": 56,
    "type": "rivalry"
  }
];

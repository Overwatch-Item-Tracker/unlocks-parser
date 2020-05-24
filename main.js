const app = angular.module('david', ['ui.bootstrap'])

app.config(['$compileProvider', function($compileProvider) {
  $compileProvider.debugInfoEnabled(false);
}])

app.controller('MainCtrl', ['$http', '$timeout', function($http, $timeout) {
  const vm = this

  // Can't generate IDs off these names can we :)
  const stupidNames = {
    "^_^": "joy",
    ____: "frustration", // don't ask
    ">_<": "frustration",
    ">_\\<": "frustration",
    ")": "winky-face",
    ";)": "winky-face",
    "^o^": "excited"
  }

  const getCleanID = (what, hero) => {
    what = stupidNames[what] || what
    return (hero ? `${hero}-` : '') +
            what.toLowerCase()
              .replace('ị', 'i')
              .replace('é', 'e')
              .replace(/[åäàá]/g, 'a')
              .replace(/[öôọó]/g, 'o')
              .replace('ú', 'u')
              .replace('çã', 'ca')
              .replace(/[^a-zA-Z 0-9]/g, '')
              .trim()
              .replace(/\s+/g, " ")
              .replace(/ /g, '-')
  }

  const typeMapping = {
    Icon: 'icons',
    Portrait: 'icons',
    Emote: 'emotes',
    VictoryPose: 'poses',
    HighlightIntro: 'intros',
    VoiceLine: 'voicelines',
    Skin: 'skins',
    Spray: 'sprays',
    WeaponSkin: 'weapons'
  }

  const ignoredItems = {
    'weapons/default': true,
    'skins/classic': true,
    'poses/random': true,
    'poses/heroic': true,
    'intros/random': true,
    'intros/heroic': true
  }

  const idOverrides = {
    "sprays/hanzo-brickstrike": "hanzo-brick-dragon",
    "sprays/year-of-the-dog": "year-of-the-dog-2018",
    "sprays/year-of-the-rooster": "year-of-the-rooster-2017",
    "sprays/year-of-the-rat": "year-of-the-rat-2020",
    "sprays/junkrat-hayseed": "junkrat-scarecrow",
    "skins/junkrat-bilgerat": "junkrat-buccaneer",
    "sprays/anniversary": "anniversary-2017",
    "voicelines/moira-slainte": "moira-slinte",
    "voicelines/brigitte-its-broken": "brigitte-this-is-pie",
    "sprays/saurfang": "varok",
    "sprays/watchparty-gibraltar": "watchpoint-gibraltar",
    "icons/2018-pacific-allstars": "pacific-allstars-2018",
    "icons/2018-atlantic-allstars": "atlantic-allstars-2018",
    "icons/path-to-pro-2019": "path-to-pro",

    "voicelines/roadhog-im-beached-as-bro": "roadhog-youre-a-talker",
    "voicelines/brigitte-get-out-of-here": "brigitte-take-a-hike",

    "icons/competitive-ctf-competitor-2018": "competitive-ctf-competitor",
    "icons/competitive-ctf-hero-2018": "competitive-ctf-hero",
    "sprays/competitive-ctf-competitor-2018": "competitive-ctf-competitor",
    "sprays/competitive-ctf-hero-2018": "competitive-ctf-hero",

    "icons/competitive-6v6-elimination-competitor-2018": "competitive-6v6-elimination-competitor",
    "icons/competitive-6v6-elimination-hero-2018": "competitive-6v6-elimination-hero",
    "sprays/competitive-6v6-elimination-competitor-2018": "competitive-6v6-elimination-competitor",
    "sprays/competitive-6v6-elimination-hero-2018": "competitive-6v6-elimination-hero",

    "sprays/competitive-deathmatch-competitor-2018": "competitive-deathmatch-competitor",
    "sprays/competitive-deathmatch-hero-2018": "competitive-deathmatch-hero",
    "icons/competitive-deathmatch-competitor-2018": "competitive-deathmatch-competitor",
    "icons/competitive-deathmatch-hero-2018": "competitive-deathmatch-hero",

    "sprays/competitive-3v3-elimination-competitor-2018": "competitive-3v3-elimination-competitor",
    "sprays/competitive-3v3-elimination-hero-2018": "competitive-3v3-elimination-hero",
    "icons/competitive-3v3-elimination-competitor-2018": "competitive-3v3-elimination-competitor",
    "icons/competitive-3v3-elimination-hero-2018": "competitive-3v3-elimination-hero",

    "sprays/competitive-team-deathmatch-competitor-2018": "competitive-team-deathmatch-competitor",
    "sprays/competitive-team-deathmatch-hero-2018": "competitive-team-deathmatch-hero",
    "icons/competitive-team-deathmatch-competitor-2018": "competitive-team-deathmatch-competitor",
    "icons/competitive-team-deathmatch-hero-2018": "competitive-team-deathmatch-hero"
  }

  this.rawUnlocks = null
  this.parsingError = false
  this.onJsonChange = () => {
    this.parsingError = false
    if (!this.rawUnlocks) {
      this.parsingError = false
      return
    }

    try {
      var jsonStr = this.rawUnlocks
      if (jsonStr.startsWith('"')) {
        jsonStr = jsonStr.slice(1)
      }

      if (jsonStr.endsWith('"')) {
        jsonStr = jsonStr.slice(0, -1)
      }

      let json = JSON.parse(jsonStr)

      if (typeof json !== 'object') {
        throw new Error("JSON isn't an object???")
      }

      if (!Array.isArray(json)) {
        throw new Error("JSON isn't an array?")
      }

      this.parsingError = false
      this.generateBackupJson(json)
    } catch (e) {
      console.error("Error parsing JSON")
      this.parsingError = e.message
    }
  }

  this.generateBackupJson = userUnlocks => {
    const itemIdMapping = {}

    for (const heroName in this.unlockData.Heroes) {
      const heroNameClean = getCleanID(heroName)

      for (let itemType in this.unlockData.Heroes[heroName]) {
        const itemTypeClean = typeMapping[itemType]
        if (!itemTypeClean) continue

        for (let itemId in this.unlockData.Heroes[heroName][itemType]) {
          const itemName = this.unlockData.Heroes[heroName][itemType][itemId]
          if (!itemName) continue

          let itemSlug = getCleanID(itemName, heroNameClean)

          const uniqueId = `${itemTypeClean}/${itemSlug}`
          itemSlug = idOverrides[uniqueId] || itemSlug;

          itemIdMapping[itemId] = {
            type: itemTypeClean,
            hero: heroNameClean,
            id: getCleanID(itemName),
            itemSlug: itemSlug
          }
        }
      }
    }

    /**
     * Go through all unlocks again but ignore anything that was already done above
     * This is because we're only interested in all class unlocks here
     */
    for (const itemType in this.unlockData.AllUnlocks) {
      const itemTypeClean = typeMapping[itemType]
      if (!itemTypeClean) continue

      for (const itemId in this.unlockData.AllUnlocks[itemType]) {
        // Ignore if it's already in the mapping
        if (itemId in itemIdMapping) {
          continue
        }

        const itemName = this.unlockData.AllUnlocks[itemType][itemId]
        if (!itemName) continue

        let itemSlug = getCleanID(itemName)

        const uniqueId = `${itemTypeClean}/${itemSlug}`
        itemSlug = idOverrides[uniqueId] || itemSlug;

        itemIdMapping[itemId] = {
          type: itemTypeClean,
          hero: 'all',
          id: getCleanID(itemName),
          itemSlug: itemSlug
        }
      }
    }

    const backup = {}

    for (const itemId of userUnlocks) {
      const item = itemIdMapping[itemId]
      if (!item) continue

      const itemTypeId = `${item.type}/${item.id}`
      if (itemTypeId in ignoredItems) continue

      if (!(item.hero in backup)) {
        backup[item.hero] = {}
      }

      if (!(item.type in backup[item.hero])) {
        backup[item.hero][item.type] = {}
      }

      backup[item.hero][item.type][item.itemSlug] = true
    }

    this.backupData = JSON.stringify(backup, null, 2)
  }

  this.copied = false
  this.copyBackupJson = () => {
    if (this.copied) {
      return
    }

    this.copied = true
    copyToClipboard(this.backupData)
    $timeout(() => {
      this.copied = false
    }, 2000)
  }

  const copyToClipboard = str => {
    const el = document.createElement('textarea');
    el.value = str;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  };

  $http.get('unlock-mapping.json').then(data => {
    if (data.status === 200) {
      vm.unlockData = data.data
    } else {
      vm.loadError = true
    }
  }, err => {
    vm.loadError = true
  })
}])



// (function() {
//   function copyClipboard(wot) {
//     var doc = document
//     const el = doc.createElement('textarea');
//     el.value = wot;
//     doc.body.appendChild(el);
//     el.select();
//     doc.execCommand('copy');
//     doc.body.removeChild(el);
//   };

//   $.get({
//     url: '/user/unlocks',
//     headers: {
//       'cache-control': 'max-age=0'
//     }
//   }, function(data){
//     data = JSON.stringify(data)
//     copyClipboard(data)
//     var doc = document
//     doc.getElementById("overview").replaceWith(Object.assign(doc.createElement('textarea'), {
//       innerText: data,
//       style: "width:90%;margin:20px",
//       rows: 6,
//       onclick: function() {
//         copyClipboard(this.value)
//       }
//     }))
//     alert('Successully loaded unlocks data and copied to clipboard, maybe. If not, you can click on the textbox added to the page to copy the json, if that still doesn\'t work, you can just copy it manually')
//    })
// })()

// !function(){function e(e){var t=document;const o=t.createElement("textarea");o.value=e,t.body.appendChild(o),o.select(),t.execCommand("copy"),t.body.removeChild(o)}$.get({url:"/user/unlocks",headers:{"cache-control":"max-age=0"}},function(t){e(t=JSON.stringify(t));var o=document;o.getElementById("overview").replaceWith(Object.assign(o.createElement("textarea"),{innerText:t,style:"width:90%;margin:20px",rows:6,onclick:function(){e(this.value)}})),alert("Successully loaded unlocks data and copied to clipboard, maybe. If not, you can click on the textbox added to the page to copy the json, if that still doesn't work, you can just copy it manually")})}();

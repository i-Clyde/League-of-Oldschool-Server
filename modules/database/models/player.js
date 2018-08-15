// login: {},
// nickname: {},
// email: {},
// password: {},
// iconid: {},
// crdate: {},
// token: {}

var mongoose = require("mongoose");

var PlayerSchema = new mongoose.Schema({
  player: {
    id: {
      type: Number,
      require: true
    },
    login: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true
    },
    nickname: {
      nick: {
        type: String,
        trim: true,
        default: null
      },
      nick_trimed: {
        type: String,
        lowercase: true,
        trim: true,
        default: null
      }
    }
  },
  playerPrivateData: {
    email: {
      type: String,
      required: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    }
  },
  playerStats: {
    influencePoints: {
      type: Number,
      default: 0
    },
    exp: {
      type: Number,
      default: 0
    },
    level: {
      type: Number,
      default: 1
    },
    gameStats: {
      wins: {
        type: Number,
        default: 0
      },
      kills: {
        type: Number,
        default: 0
      },
      deaths: {
        type: Number,
        default: 0
      },
      assists: {
        type: Number,
        default: 0
      }
    },
    profileicon: {
      icon: {
        type: Number,
        default: null
      },
      iconsOwned: {
        type: Array,
        default: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 503, 714, 720]
      }
    }
  },
  playerInfo: {
    accountCreatedAt: {
      type: Date,
      default: Date.now
    },
    accountFirstIP: {
      type: String,
      required: true
    },
    lastLogin: {
      type: Date,
      default: null
    },
    lastIP: {
      type: String,
      default: null
    },
    loginAttemps: {
      type: Number,
      default: 0
    },
    ingame: {
      ingameIsInGame: {
        ingame: Boolean,
        default: false
      },
      ingameToken: {
        type: String,
        default: null
      },
      ingameChampion: {
        type: String,
        default: null
      },
      ingameSince: {
        type: Date,
        default: null
      },
      modeIngame: {
        type: String,
        default: null
      }
    },
    beforeGame: {
      team: {
        type: String
      },
      summonerspell1: {
        type: String
      },
      summonerspell2: {
        type: String
      },
      selectedRunePage: {
        type: Number
      },
      selectedMasteryPage: {
        type: Number
      },
      skin: {
        type: Number
      }
    },
    rank: {
      type: String
    },
    ribbon: {
      type: Number
    }
  },
  social: {
    status: {
      type: Number,
      default: 0
    },
    description: {
      type: String,
      default: null
    },
    relations: {
      friends: [Number],
      pending: {
        sent: [Number],
        requests: [Number]
      }
    },
    ignore: [Number]
  },
  runes: {
    numberOfRunePages: {
      type: Number,
      default: 2
    },
    runesPageNames: [],
    runesSettings: []
  },
  masteries: {
    numberOfMasteriesPages: {
      type: Number,
      default: 2
    },
    masteriesPageNames: [],
    masteriesSettings: []
  },
  messageHistory: [],
  unreadMessages: [],
  restriction: {
    status: {
      ingame: {
        type: Boolean,
        default: false
      },
      client: {
        type: Boolean,
        default: false
      }
    },
    since: {
      type: Date,
      default: null
    },
    to: {
      type: Date,
      default: null
    },
    for: {
      type: String,
      default: null
    },
    by: {
      type: String,
      default: null
    }
  },
  usertype: {
    type: String,
    default: "player"
  },
  socketToken: {
    type: String,
    required: true
  }
});

var Player = mongoose.model('players', PlayerSchema);

module.exports = {
  Player: Player
};
